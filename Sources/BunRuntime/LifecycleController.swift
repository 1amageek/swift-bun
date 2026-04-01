import Foundation
import Synchronization

/// Tracks runtime state, boot responsibilities, and host-visible liveness.
final class LifecycleController: Sendable {
    enum RuntimeMode: Sendable {
        case library
        case process
    }

    enum State: Sendable {
        case idle
        case booting
        case running
        case exitRequested
        case shuttingDown
        case exited
    }

    struct BootBarrierToken: Sendable, Hashable {
        let rawValue: Int
    }

    struct VisibleHandleToken: Sendable, Hashable {
        let rawValue: Int
    }

    enum ExitDisposition: Sendable {
        case notReady
        case ready(Int32)
    }

    private struct RuntimeSnapshot: Sendable {
        var hostQueueCount = 0
        var nextTickQueueCount = 0
        var jsTurnActive = false
        var executorQueueCount = 0
        var executorJobActive = false
    }

    private struct Snapshot: Sendable {
        var state: State = .idle
        var mode: RuntimeMode?
        var pendingHostCallbacks = 0
        var requestedExitCode: Int32?
        var runtime = RuntimeSnapshot()
        var bootBarriers: [Int: String] = [:]
        var visibleHandles: [Int: String] = [:]
        var nextTokenID = 1
    }

    private let log: @Sendable (String) -> Void
    private let snapshot = Mutex(Snapshot())

    init(log: @escaping @Sendable (String) -> Void) {
        self.log = log
    }

    var currentState: State {
        snapshot.withLock { $0.state }
    }

    var currentMode: RuntimeMode? {
        snapshot.withLock { $0.mode }
    }

    var pendingHostCallbackCount: Int {
        snapshot.withLock { $0.pendingHostCallbacks }
    }

    var isJavaScriptReady: Bool {
        snapshot.withLock {
            $0.state == .running && $0.mode == .library
        }
    }

    func enterBooting(mode: RuntimeMode) {
        snapshot.withLock { state in
            state = Snapshot()
            state.state = .booting
            state.mode = mode
        }
        log("[bun:lifecycle] enterBooting(mode=\(mode))")
    }

    func acquireBootBarrier(name: String) -> BootBarrierToken {
        let result = snapshot.withLock { state -> (BootBarrierToken, Int) in
            let token = BootBarrierToken(rawValue: state.nextTokenID)
            state.nextTokenID += 1
            state.bootBarriers[token.rawValue] = name
            return (token, state.bootBarriers.count)
        }
        log("[bun:lifecycle] acquireBootBarrier(\(name)) → bootBarriers=\(result.1)")
        return result.0
    }

    func releaseBootBarrier(_ token: BootBarrierToken) {
        let result = snapshot.withLock { state -> (String?, Int) in
            let removed = state.bootBarriers.removeValue(forKey: token.rawValue)
            return (removed, state.bootBarriers.count)
        }
        guard let name = result.0 else { return }
        log("[bun:lifecycle] releaseBootBarrier(\(name)) → bootBarriers=\(result.1)")
    }

    func enterRunningIfBootComplete() {
        let transitioned = snapshot.withLock { state -> Bool in
            guard state.state == .booting, state.bootBarriers.isEmpty else { return false }
            state.state = .running
            return true
        }
        if transitioned {
            log("[bun:lifecycle] enterRunning")
        }
    }

    func acquireVisibleHandle(kind: String) -> VisibleHandleToken {
        let result = snapshot.withLock { state -> (VisibleHandleToken, Int) in
            let token = VisibleHandleToken(rawValue: state.nextTokenID)
            state.nextTokenID += 1
            state.visibleHandles[token.rawValue] = kind
            return (token, state.visibleHandles.count)
        }
        log("[bun:lifecycle] acquireVisibleHandle(\(kind)) → visibleHandles=\(result.1)")
        return result.0
    }

    func releaseVisibleHandle(_ token: VisibleHandleToken) {
        let result = snapshot.withLock { state -> (String?, Int) in
            let removed = state.visibleHandles.removeValue(forKey: token.rawValue)
            return (removed, state.visibleHandles.count)
        }
        guard let kind = result.0 else { return }
        log("[bun:lifecycle] releaseVisibleHandle(\(kind)) → visibleHandles=\(result.1)")
    }

    func hostCallbackEnqueued(source: String) {
        let count = snapshot.withLock {
            $0.pendingHostCallbacks += 1
            return $0.pendingHostCallbacks
        }
        log("[bun:lifecycle] hostCallbackEnqueued(\(source)) → pendingHostCallbacks=\(count)")
    }

    func hostCallbackCompleted(source: String) {
        let count = snapshot.withLock {
            $0.pendingHostCallbacks = max(0, $0.pendingHostCallbacks - 1)
            return $0.pendingHostCallbacks
        }
        log("[bun:lifecycle] hostCallbackCompleted(\(source)) → pendingHostCallbacks=\(count)")
    }

    func updateRuntimeSnapshot(
        hostQueueCount: Int,
        nextTickQueueCount: Int,
        jsTurnActive: Bool,
        executorQueueCount: Int,
        executorJobActive: Bool
    ) {
        snapshot.withLock {
            $0.runtime.hostQueueCount = hostQueueCount
            $0.runtime.nextTickQueueCount = nextTickQueueCount
            $0.runtime.jsTurnActive = jsTurnActive
            $0.runtime.executorQueueCount = executorQueueCount
            $0.runtime.executorJobActive = executorJobActive
        }
    }

    func requestExit(code: Int32) {
        snapshot.withLock { state in
            state.requestedExitCode = code
            if state.state != .shuttingDown && state.state != .exited {
                state.state = .exitRequested
            }
        }
        log("[bun:lifecycle] requestExit(code=\(code))")
    }

    func requestedExitCode() -> Int32? {
        snapshot.withLock { $0.requestedExitCode }
    }

    func beginShutdown() {
        let updated = snapshot.withLock { state -> Bool in
            guard state.state != .exited else { return false }
            state.state = .shuttingDown
            return true
        }
        if updated {
            log("[bun:lifecycle] beginShutdown")
        }
    }

    func markExited() {
        snapshot.withLock { state in
            state.state = .exited
            state.requestedExitCode = nil
            state.bootBarriers.removeAll()
            state.visibleHandles.removeAll()
            state.pendingHostCallbacks = 0
            state.runtime = RuntimeSnapshot()
        }
        log("[bun:lifecycle] markExited")
    }

    func exitDisposition() -> ExitDisposition {
        snapshot.withLock { state in
            if let code = state.requestedExitCode {
                return .ready(code)
            }

            guard state.mode == .process, state.state == .running else {
                return .notReady
            }

            guard state.bootBarriers.isEmpty else { return .notReady }
            guard state.visibleHandles.isEmpty else { return .notReady }
            guard state.pendingHostCallbacks == 0 else { return .notReady }
            guard state.runtime.hostQueueCount == 0 else { return .notReady }
            guard state.runtime.nextTickQueueCount == 0 else { return .notReady }
            guard !state.runtime.jsTurnActive else { return .notReady }
            guard state.runtime.executorQueueCount == 0 else { return .notReady }
            guard !state.runtime.executorJobActive else { return .notReady }

            return .ready(0)
        }
    }

    func canAdvanceProcessStartup() -> Bool {
        snapshot.withLock { state in
            guard state.mode == .process, state.state == .booting else {
                return false
            }

            guard state.bootBarriers.count == 1 else {
                return false
            }

            guard state.pendingHostCallbacks == 0 else {
                return false
            }

            guard state.runtime.hostQueueCount == 0 else {
                return false
            }

            guard state.runtime.nextTickQueueCount == 0 else {
                return false
            }

            guard !state.runtime.jsTurnActive else {
                return false
            }

            guard state.runtime.executorQueueCount == 0 else {
                return false
            }

            guard !state.runtime.executorJobActive else {
                return false
            }

            return true
        }
    }
}
