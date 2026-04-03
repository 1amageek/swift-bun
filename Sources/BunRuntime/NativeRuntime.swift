import Foundation
import NIOCore
import NIOPosix
import Synchronization

/// Hosts native async work off the JS thread and re-enters JS through the host scheduler.
final class NativeRuntime: Sendable {
    private static let fetchChunkSizeBytes = 8 * 1024
    private static let fetchChunkFlushDelayMs: Int64 = 2

    private enum ShutdownState {
        case active
        case shuttingDown
        case shutDown
    }

    private final class FetchChunkEmitter: Sendable {
        private struct State: Sendable {
            var bufferedBytes: [UInt8] = []
            var flushPending = false
            var generation: UInt64 = 0
        }

        private let operationID: Int32
        private let chunkSizeBytes: Int
        private let flushDelayMs: Int64
        private let state = Mutex(State())
        private let acceptsNewWork: @Sendable () -> Bool
        private let scheduleAfter: @Sendable (Int64, @escaping @Sendable () -> Void) -> Void
        private let emit: @Sendable ([UInt8]) -> Void

        init(
            operationID: Int32,
            chunkSizeBytes: Int,
            flushDelayMs: Int64,
            acceptsNewWork: @escaping @Sendable () -> Bool,
            scheduleAfter: @escaping @Sendable (Int64, @escaping @Sendable () -> Void) -> Void,
            emit: @escaping @Sendable ([UInt8]) -> Void
        ) {
            self.operationID = operationID
            self.chunkSizeBytes = chunkSizeBytes
            self.flushDelayMs = flushDelayMs
            self.acceptsNewWork = acceptsNewWork
            self.scheduleAfter = scheduleAfter
            self.emit = emit
        }

        func append(_ byte: UInt8) {
            var payload: [UInt8]?
            var generationToFlush: UInt64?

            state.withLock { state in
                state.bufferedBytes.append(byte)
                if state.bufferedBytes.count >= chunkSizeBytes {
                    payload = state.bufferedBytes
                    state.bufferedBytes.removeAll(keepingCapacity: true)
                    state.flushPending = false
                    state.generation &+= 1
                    return
                }

                guard !state.flushPending else { return }
                state.flushPending = true
                state.generation &+= 1
                generationToFlush = state.generation
            }

            if let payload {
                emit(payload)
            }

            if let generationToFlush {
                scheduleAfter(flushDelayMs) { [self] in
                    flushIfPending(generation: generationToFlush)
                }
            }
        }

        func finish() {
            var payload: [UInt8]?
            state.withLock { state in
                guard !state.bufferedBytes.isEmpty else {
                    state.flushPending = false
                    state.generation &+= 1
                    return
                }
                payload = state.bufferedBytes
                state.bufferedBytes.removeAll(keepingCapacity: true)
                state.flushPending = false
                state.generation &+= 1
            }

            if let payload {
                emit(payload)
            }
        }

        private func flushIfPending(generation: UInt64) {
            guard acceptsNewWork() else { return }

            var payload: [UInt8]?
            state.withLock { state in
                guard state.flushPending, state.generation == generation, !state.bufferedBytes.isEmpty else {
                    return
                }
                payload = state.bufferedBytes
                state.bufferedBytes.removeAll(keepingCapacity: true)
                state.flushPending = false
            }

            if let payload {
                emit(payload)
            }
        }
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

                let chunkEmitter = FetchChunkEmitter(
                    operationID: operationID,
                    chunkSizeBytes: Self.fetchChunkSizeBytes,
                    flushDelayMs: Self.fetchChunkFlushDelayMs,
                    acceptsNewWork: { [weak self] in
                        guard let self else { return false }
                        return self.acceptsNewWork()
                    },
                    scheduleAfter: { [hostEventLoop] delayMs, callback in
                        _ = hostEventLoop.scheduleTask(in: .milliseconds(delayMs), callback)
                    },
                    emit: { [scheduler] payload in
                        scheduler.enqueueHostCallback(source: "fetch:\(operationID):chunk") {
                            callbackBox.callback(.chunk(operationID: operationID, bytes: payload))
                        }
                    }
                )

                for try await byte in bytes {
                    guard self.acceptsNewWork() else { return }
                    if Task.isCancelled {
                        return
                    }
                    chunkEmitter.append(byte)
                }

                chunkEmitter.finish()

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
