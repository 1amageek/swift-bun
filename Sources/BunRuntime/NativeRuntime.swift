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

    private final class UnsafeFetchEventCallback: Sendable {
        nonisolated(unsafe) let callback: (FetchEvent) -> Void

        init(_ callback: @escaping (FetchEvent) -> Void) {
            self.callback = callback
        }
    }

    struct FetchHeaders {
        let operationID: Int32
        let statusCode: Int
        let responseURL: String
        let headerJSON: String
    }

    enum FetchEvent {
        case headers(FetchHeaders)
        case chunk(operationID: Int32, bytes: [UInt8])
        case complete(operationID: Int32)
        case failure(operationID: Int32, message: String)
    }

    private struct FetchTaskState {
        let operationID: Int32
        let urlString: String
        let callback: UnsafeFetchEventCallback
        var didReceiveResponse = false
    }

    private let assertOnJSThread: @Sendable () -> Void
    private let hostEventLoopGroup: MultiThreadedEventLoopGroup
    private let hostEventLoop: EventLoop
    private let scheduler: HostScheduler
    private let log: @Sendable (String) -> Void
    private let isActive = Mutex<Bool>(true)
    private let shutdownState = Mutex<ShutdownState>(.active)
    private let fetchTaskStates = Mutex<[Int32: FetchTaskState]>([:])
    private let fetchTasks = Mutex<[Int32: Task<Void, Never>]>([:])

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
        callback: @escaping (FetchEvent) -> Void
    ) -> Int32 {
        assertOnJSThread()
        guard acceptsNewWork() else { return operationID }
        let callbackBox = UnsafeFetchEventCallback(callback)
        fetchTaskStates.withLock {
            $0[operationID] = FetchTaskState(
                operationID: operationID,
                urlString: urlString,
                callback: callbackBox
            )
        }
        let task = Task { [weak self] in
            guard let self else { return }
            do {
                let (bytes, response) = try await URLSession.shared.bytes(for: request)
                guard self.acceptsNewWork() else { return }
                guard let httpResponse = response as? HTTPURLResponse else {
                    self.emitFetchFailure(for: operationID, message: "Invalid response")
                    return
                }

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

                let headers = FetchHeaders(
                    operationID: operationID,
                    statusCode: httpResponse.statusCode,
                    responseURL: httpResponse.url?.absoluteString ?? urlString,
                    headerJSON: headerJSON
                )

                self.fetchTaskStates.withLock { states in
                    guard var state = states[operationID] else { return }
                    state.didReceiveResponse = true
                    states[operationID] = state
                }
                self.scheduler.enqueueHostCallback(source: "fetch:\(operationID):headers") {
                    callbackBox.callback(.headers(headers))
                }

                for try await byte in bytes {
                    guard self.acceptsNewWork() else { return }
                    if Task.isCancelled {
                        return
                    }
                    let payload = [byte]
                    self.scheduler.enqueueHostCallback(source: "fetch:\(operationID):chunk") {
                        callbackBox.callback(.chunk(operationID: operationID, bytes: payload))
                    }
                }

                _ = self.fetchTaskStates.withLock { $0.removeValue(forKey: operationID) }
                _ = self.fetchTasks.withLock { $0.removeValue(forKey: operationID) }
                self.scheduler.enqueueHostCallback(source: "fetch:\(operationID):complete") {
                    callbackBox.callback(.complete(operationID: operationID))
                }
            } catch {
                guard self.acceptsNewWork() else { return }
                self.emitFetchFailure(for: operationID, message: error.localizedDescription)
            }
        }
        fetchTasks.withLock { $0[operationID] = task }
        log("[bun:fetch] task.resume \(urlString.prefix(120))")
        return operationID
    }

    func cancelFetch(operationID: Int32) {
        assertOnJSThread()
        _ = fetchTaskStates.withLock { $0.removeValue(forKey: operationID) }
        fetchTasks.withLock { $0.removeValue(forKey: operationID) }?.cancel()
    }

    func cancelAllFetches() {
        fetchTaskStates.withLock { $0.removeAll() }
        let tasks = fetchTasks.withLock { state -> [Task<Void, Never>] in
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

    private func emitFetchFailure(for operationID: Int32, message: String) {
        let state = fetchTaskStates.withLock { $0.removeValue(forKey: operationID) }
        _ = fetchTasks.withLock { $0.removeValue(forKey: operationID) }
        guard let state else { return }
        scheduler.enqueueHostCallback(source: "fetch:\(state.operationID):error") {
            state.callback.callback(.failure(operationID: state.operationID, message: message))
        }
    }
}
