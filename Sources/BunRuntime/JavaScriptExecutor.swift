@preconcurrency import JavaScriptCore
import Darwin
import Foundation
import Synchronization

/// Owns the single-threaded execution environment for JavaScriptCore.
final class JavaScriptExecutor: Sendable {
    private final class UnsafeJob: Sendable {
        nonisolated(unsafe) let callback: () -> Void

        init(_ callback: @escaping () -> Void) {
            self.callback = callback
        }
    }

    private final class UnsafeShutdownWaiter: Sendable {
        let callback: @Sendable ((any Error)?) -> Void

        init(_ callback: @escaping @Sendable ((any Error)?) -> Void) {
            self.callback = callback
        }
    }

    private enum ShutdownState {
        case active
        case shuttingDown
        case shutDown
    }

    private struct QueueState: Sendable {
        var jobs: [UnsafeJob] = []
        var isStopping = false
        var hasStarted = false
        var hasStopped = false
        var isRunningJob = false
        var executorThreadID: UInt = 0
        var shutdownWaiters: [UnsafeShutdownWaiter] = []
        var nextJobID: Int = 1
    }

    private final class JobEnvelope: Sendable {
        let id: Int
        let job: UnsafeJob

        init(id: Int, job: UnsafeJob) {
            self.id = id
            self.job = job
        }
    }

    private let log: @Sendable (String) -> Void
    private let shutdownState = Mutex<ShutdownState>(.active)
    private let queueCondition = NSCondition()
    private nonisolated(unsafe) var queueState = QueueState()

    private nonisolated(unsafe) var jsContext: JSContext?

    init(log: @escaping @Sendable (String) -> Void) {
        self.log = log

        let thread = Thread { [self] in
            runLoop()
        }
        thread.name = "swift-bun.js-executor"
        thread.start()

        queueCondition.lock()
        while !queueState.hasStarted {
            queueCondition.wait()
        }
        queueCondition.unlock()
    }

    var context: JSContext? {
        jsContext
    }

    func installContext(_ context: JSContext) {
        preconditionInExecutor()
        jsContext = context
    }

    func clearContext() {
        preconditionInExecutor()
        jsContext = nil
    }

    func runtimeSnapshot() -> (queuedJobCount: Int, isJobActive: Bool) {
        queueCondition.lock()
        let currentThreadID = UInt(bitPattern: pthread_self())
        let isCurrentExecutorThread = queueState.executorThreadID != 0 && queueState.executorThreadID == currentThreadID
        let snapshot = (
            queueState.jobs.count,
            isCurrentExecutorThread ? false : queueState.isRunningJob
        )
        queueCondition.unlock()
        return snapshot
    }

    func preconditionInExecutor() {
        queueCondition.lock()
        let expectedThreadID = queueState.executorThreadID
        queueCondition.unlock()
        let currentThreadID = UInt(bitPattern: pthread_self())
        precondition(expectedThreadID != 0 && currentThreadID == expectedThreadID, "JavaScriptExecutor accessed off JS thread")
    }

    func submit<T: Sendable>(_ body: @escaping () throws -> T) async throws -> T {
        try await withCheckedThrowingContinuation { continuation in
            let accepted = execute {
                do {
                    continuation.resume(returning: try body())
                } catch {
                    continuation.resume(throwing: error)
                }
            }
            if !accepted {
                continuation.resume(throwing: BunRuntimeError.shutdownRequired)
            }
        }
    }

    @discardableResult
    func execute(_ body: @escaping () -> Void) -> Bool {
        guard isAcceptingWork else { return false }
        queueCondition.lock()
        let appended: Bool
        if queueState.isStopping {
            appended = false
        } else {
            queueState.jobs.append(UnsafeJob(body))
            let count = queueState.jobs.count
            if count <= 8 || count % 32 == 0 {
                log("[bun:executor] enqueue job queueSize=\(count)")
            }
            queueCondition.signal()
            appended = true
        }
        queueCondition.unlock()
        return appended
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

        try await withCheckedThrowingContinuation { (continuation: CheckedContinuation<Void, Error>) in
            let waiter = UnsafeShutdownWaiter { error in
                if let error {
                    continuation.resume(throwing: error)
                } else {
                    continuation.resume()
                }
            }

            queueCondition.lock()
            let stopped: Bool
            if queueState.hasStopped {
                stopped = true
            } else {
                queueState.isStopping = true
                queueState.shutdownWaiters.append(waiter)
                queueCondition.broadcast()
                stopped = false
            }
            queueCondition.unlock()
            if stopped {
                continuation.resume()
            }
        }

        shutdownState.withLock { $0 = .shutDown }
    }

    deinit {
        let needsShutdown = shutdownState.withLock { state in
            guard state == .active else { return false }
            state = .shuttingDown
            return true
        }
        guard needsShutdown else { return }

        log("[bun:deinit] JavaScriptExecutor deinitialized without shutdown()")
        queueCondition.lock()
        queueState.isStopping = true
        queueCondition.broadcast()
        queueCondition.unlock()
    }

    private func runLoop() {
        queueCondition.lock()
        queueState.hasStarted = true
        queueState.executorThreadID = UInt(bitPattern: pthread_self())
        queueCondition.broadcast()
        queueCondition.unlock()

        while true {
            queueCondition.lock()
            while queueState.jobs.isEmpty && !queueState.isStopping {
                queueCondition.wait()
            }

            if !queueState.jobs.isEmpty {
                let job = queueState.jobs.removeFirst()
                let id = queueState.nextJobID
                queueState.nextJobID += 1
                let count = queueState.jobs.count
                queueState.isRunningJob = true
                queueCondition.unlock()
                if count <= 8 || count % 32 == 0 {
                    log("[bun:executor] dequeue job id=\(id) remaining=\(count)")
                }
                let envelope = JobEnvelope(id: id, job: job)
                log("[bun:executor] run job id=\(envelope.id) begin")
                envelope.job.callback()
                log("[bun:executor] run job id=\(envelope.id) end")
                queueCondition.lock()
                queueState.isRunningJob = false
                queueCondition.unlock()
                continue
            }

            if queueState.isStopping {
                queueState.hasStopped = true
                let waiters = queueState.shutdownWaiters
                queueState.shutdownWaiters.removeAll()
                queueCondition.unlock()
                for waiter in waiters {
                    waiter.callback(nil)
                }
                return
            }
            queueCondition.unlock()
        }
    }

    private var isAcceptingWork: Bool {
        shutdownState.withLock {
            if case .active = $0 {
                return true
            }
            return false
        }
    }
}
