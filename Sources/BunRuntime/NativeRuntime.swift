import Foundation
import NIOCore
import NIOPosix
import Synchronization

/// Hosts native async work off the JS thread and re-enters JS through the host scheduler.
final class NativeRuntime: Sendable {
    private enum ShutdownState {
        case active
        case shuttingDown
        case shutDown
    }

    private final class UnsafeVoidCallback: Sendable {
        nonisolated(unsafe) let callback: () -> Void

        init(_ callback: @escaping () -> Void) {
            self.callback = callback
        }
    }

    private final class UnsafeFetchCompletionCallback: Sendable {
        nonisolated(unsafe) let callback: (FetchCompletion) -> Void

        init(_ callback: @escaping (FetchCompletion) -> Void) {
            self.callback = callback
        }
    }

    struct FetchSuccess {
        let operationID: Int32
        let statusCode: Int
        let responseURL: String
        let headerJSON: String
        let body: String
    }

    enum FetchCompletion {
        case success(FetchSuccess)
        case failure(operationID: Int32, message: String)
    }

    private let assertOnJSThread: @Sendable () -> Void
    private let hostEventLoopGroup: MultiThreadedEventLoopGroup
    private let hostEventLoop: EventLoop
    private let scheduler: HostScheduler
    private let log: @Sendable (String) -> Void
    private let isActive = Mutex<Bool>(true)
    private let shutdownState = Mutex<ShutdownState>(.active)
    private let fetchTasks = Mutex<[Int32: URLSessionDataTask]>([:])

    init(
        assertOnJSThread: @escaping @Sendable () -> Void,
        scheduler: HostScheduler,
        log: @escaping @Sendable (String) -> Void
    ) {
        self.assertOnJSThread = assertOnJSThread
        self.hostEventLoopGroup = MultiThreadedEventLoopGroup(numberOfThreads: 1)
        self.hostEventLoop = hostEventLoopGroup.next()
        self.scheduler = scheduler
        self.log = log
    }

    func scheduleTimer(after delayMs: Int64, source: String, _ callback: @escaping () -> Void) -> Scheduled<Void> {
        assertOnJSThread()
        let box = UnsafeVoidCallback(callback)
        return hostEventLoop.scheduleTask(in: .milliseconds(delayMs)) {
            guard self.acceptsNewWork() else { return }
            self.scheduler.enqueueHostCallback(source: source, box.callback)
        }
    }

    func deactivate() {
        isActive.withLock { $0 = false }
    }

    func shutdown() async throws {
        let shouldShutdown = shutdownState.withLock { state in
            switch state {
            case .shutDown, .shuttingDown:
                return false
            case .active:
                state = .shuttingDown
                return true
            }
        }
        guard shouldShutdown else { return }

        deactivate()
        cancelAllFetches()

        try await withCheckedThrowingContinuation { (continuation: CheckedContinuation<Void, Error>) in
            hostEventLoopGroup.shutdownGracefully { error in
                if let error {
                    continuation.resume(throwing: error)
                    return
                }
                continuation.resume()
            }
        }

        shutdownState.withLock { $0 = .shutDown }
    }

    func startFetch(
        operationID: Int32,
        request: URLRequest,
        urlString: String,
        completion: @escaping (FetchCompletion) -> Void
    ) {
        assertOnJSThread()
        guard acceptsNewWork() else { return }
        let completionBox = UnsafeFetchCompletionCallback(completion)

        let task = URLSession.shared.dataTask(with: request) { data, response, error in
            guard self.acceptsNewWork() else { return }
            _ = self.fetchTasks.withLock { $0.removeValue(forKey: operationID) }

            if let error {
                self.scheduler.enqueueHostCallback(source: "fetch:\(operationID)") {
                    completionBox.callback(.failure(operationID: operationID, message: error.localizedDescription))
                }
                return
            }

            guard let httpResponse = response as? HTTPURLResponse else {
                self.scheduler.enqueueHostCallback(source: "fetch:\(operationID)") {
                    completionBox.callback(.failure(operationID: operationID, message: "Invalid response"))
                }
                return
            }

            let body = data.flatMap { String(data: $0, encoding: .utf8) } ?? ""
            var headerDict: [String: String] = [:]
            for (key, value) in httpResponse.allHeaderFields {
                headerDict["\(key)".lowercased()] = "\(value)"
            }

            let headerJSON: String
            do {
                let headerData = try JSONSerialization.data(withJSONObject: headerDict)
                headerJSON = String(data: headerData, encoding: .utf8) ?? "{}"
            } catch {
                headerJSON = "{}"
            }

            let success = FetchSuccess(
                operationID: operationID,
                statusCode: httpResponse.statusCode,
                responseURL: httpResponse.url?.absoluteString ?? urlString,
                headerJSON: headerJSON,
                body: body
            )

            self.scheduler.enqueueHostCallback(source: "fetch:\(operationID)") {
                completionBox.callback(.success(success))
            }
        }

        fetchTasks.withLock { $0[operationID] = task }
        log("[bun:fetch] task.resume \(urlString.prefix(120))")
        task.resume()
    }

    func cancelFetch(operationID: Int32) {
        assertOnJSThread()
        fetchTasks.withLock { $0.removeValue(forKey: operationID) }?.cancel()
    }

    func cancelAllFetches() {
        let tasks = fetchTasks.withLock { state -> [URLSessionDataTask] in
            let values = Array(state.values)
            state.removeAll()
            return values
        }
        for task in tasks {
            task.cancel()
        }
    }

    private func acceptsNewWork() -> Bool {
        isActive.withLock { $0 }
    }
}
