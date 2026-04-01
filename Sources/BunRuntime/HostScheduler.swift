import Foundation
import Synchronization

/// Serializes host callbacks and `process.nextTick` work onto the JS thread.
final class HostScheduler: Sendable {
    private final class WorkItem: Sendable {
        let source: String
        nonisolated(unsafe) let callback: () -> Void

        init(source: String, callback: @escaping () -> Void) {
            self.source = source
            self.callback = callback
        }
    }

    private struct HostState: Sendable {
        var isActive = true
        var drainScheduled = false
        var hostCallbackQueue: [WorkItem] = []
    }

    private let executor: JavaScriptExecutor
    private let log: @Sendable (String) -> Void
    private let nextTickBudgetPerTurn: Int
    private let hostCallbackBudgetPerTurn: Int
    private let onHostCallbackEnqueued: @Sendable (String) -> Void
    private let onHostCallbackCompleted: @Sendable (String) -> Void
    private let hostState = Mutex(HostState())

    private nonisolated(unsafe) var nextTickQueue: [WorkItem] = []
    private nonisolated(unsafe) var isDraining = false
    private nonisolated(unsafe) var isInlineNextTickDrainActive = false
    private nonisolated(unsafe) var onTurnCompleted: (() -> Void)?

    init(
        executor: JavaScriptExecutor,
        nextTickBudgetPerTurn: Int = 64,
        hostCallbackBudgetPerTurn: Int = 32,
        onHostCallbackEnqueued: @escaping @Sendable (String) -> Void = { _ in },
        onHostCallbackCompleted: @escaping @Sendable (String) -> Void = { _ in },
        log: @escaping @Sendable (String) -> Void
    ) {
        self.executor = executor
        self.nextTickBudgetPerTurn = nextTickBudgetPerTurn
        self.hostCallbackBudgetPerTurn = hostCallbackBudgetPerTurn
        self.onHostCallbackEnqueued = onHostCallbackEnqueued
        self.onHostCallbackCompleted = onHostCallbackCompleted
        self.log = log
    }

    var queuedNextTickCount: Int {
        nextTickQueue.count
    }

    var queuedHostCallbackCount: Int {
        hostState.withLock { $0.hostCallbackQueue.count }
    }

    var isTurnActive: Bool {
        isDraining || isInlineNextTickDrainActive
    }

    func setTurnCompletedHandler(_ handler: @escaping () -> Void) {
        executor.preconditionInExecutor()
        onTurnCompleted = handler
    }

    func deactivate() {
        executor.preconditionInExecutor()
        hostState.withLock {
            $0.isActive = false
            $0.drainScheduled = false
            $0.hostCallbackQueue.removeAll()
        }
        nextTickQueue.removeAll()
    }

    func enqueueNextTick(source: String = "nextTick", _ callback: @escaping () -> Void) {
        executor.preconditionInExecutor()
        guard acceptsNewWork() else { log("[bun:scheduler] enqueueNextTick REJECTED (inactive)"); return }
        nextTickQueue.append(WorkItem(source: source, callback: callback))
        log("[bun:scheduler] enqueueNextTick → queueSize=\(nextTickQueue.count)")
        if isInlineNextTickDrainActive {
            return
        }
        scheduleDrain(reason: source)
    }

    func enqueueHostCallback(source: String, _ callback: @escaping () -> Void) {
        guard appendHostCallback(source: source, callback: callback) else { return }
        log("[bun:scheduler] enqueueHostCallback(\(source)) queued=\(queuedHostCallbackCount)")
        scheduleDrain(reason: source)
    }

    func enqueueHostCallbackDirect(source: String, _ callback: @escaping () -> Void) {
        guard appendHostCallback(source: source, callback: callback) else { return }
        log("[bun:scheduler] enqueueHostCallbackDirect(\(source)) queued=\(queuedHostCallbackCount)")
        scheduleDrain(reason: source)
    }

    /// Force a drain cycle after the current execute{} closure returns.
    /// Used by BunProcess.run() to ensure the first drain runs even if
    /// the initial scheduleDrain's scheduleTask arrived before host callbacks.
    func forceDrain() {
        hostState.withLock { $0.drainScheduled = false }
        scheduleDrain(reason: "force-after-startup")
    }

    func ensureDrainScheduled(reason: String) {
        scheduleDrain(reason: reason)
    }

    func drainNextTicksNow(reason: String, maxItems: Int) {
        executor.preconditionInExecutor()
        guard acceptsNewWork() else { return }
        guard !nextTickQueue.isEmpty else { return }

        // A microtask-driven drain is consuming work that may have originally
        // set the `drainScheduled` latch. Release it here so later host
        // callbacks can schedule a follow-up drain once the JS turn yields.
        hostState.withLock { $0.drainScheduled = false }
        isInlineNextTickDrainActive = true
        let processed = drainNextTicks(phase: reason, limit: maxItems)
        isInlineNextTickDrainActive = false
        hostState.withLock { $0.drainScheduled = false }
        if processed > 0, hasQueuedWork() {
            scheduleDrain(reason: "\(reason)-remaining")
        }
    }

    private func appendHostCallback(source: String, callback: @escaping () -> Void) -> Bool {
        let item = WorkItem(source: source, callback: callback)
        let appended = hostState.withLock {
            guard $0.isActive else { return false }
            $0.hostCallbackQueue.append(item)
            return true
        }
        if appended {
            onHostCallbackEnqueued(source)
        }
        return appended
    }

    private func scheduleDrain(reason: String) {
        let shouldSchedule = hostState.withLock { state in
            guard state.isActive else { return false }
            guard !state.drainScheduled else { return false }
            state.drainScheduled = true
            return true
        }
        guard shouldSchedule else { return }
        log("[bun:scheduler] scheduleDrain(\(reason))")

        _ = executor.execute {
            self.log("[bun:scheduler] drainTask(\(reason)) polled")
            guard self.acceptsNewWork() else {
                self.log("[bun:scheduler] drainTask(\(reason)) skipped (inactive)")
                return
            }
            self.log("[bun:scheduler] drainTask(\(reason)) begin")
            self.hostState.withLock { $0.drainScheduled = false }
            self.drain(reason: reason)
        }
    }

    private func drain(reason: String) {
        executor.preconditionInExecutor()
        guard !isDraining else { return }
        isDraining = true
        defer {
            isDraining = false
            onTurnCompleted?()
            if hasQueuedWork() {
                scheduleDrain(reason: "remaining-work")
            }
        }

        let preHostProcessed = drainNextTicks(phase: "preHost", limit: nextTickBudgetPerTurn)
        var hostProcessed = 0
        while hostProcessed < hostCallbackBudgetPerTurn, let hostItem = popHostCallback() {
            let startUptimeMs = Int(ProcessInfo.processInfo.systemUptime * 1000)
            log("[bun:scheduler] hostCallback(\(hostItem.source)) begin nextTick=\(nextTickQueue.count) host=\(queuedHostCallbackCount)")
            hostItem.callback()
            onHostCallbackCompleted(hostItem.source)
            _ = drainNextTicks(phase: "postHost", limit: nextTickBudgetPerTurn)
            let endUptimeMs = Int(ProcessInfo.processInfo.systemUptime * 1000)
            log("[bun:scheduler] hostCallback(\(hostItem.source)) end nextTick=\(nextTickQueue.count) host=\(queuedHostCallbackCount) dt=\(endUptimeMs - startUptimeMs)")
            hostProcessed += 1
        }

        if hostProcessed == hostCallbackBudgetPerTurn, queuedHostCallbackCount > 0 {
            log("[bun:scheduler] host callback budget exhausted at \(hostCallbackBudgetPerTurn)")
        }

        if hostProcessed == 0 && preHostProcessed == 0 {
            log("[bun:scheduler] drain(\(reason)) no-op")
        }
    }

    private func popHostCallback() -> WorkItem? {
        hostState.withLock {
            guard !$0.hostCallbackQueue.isEmpty else { return nil }
            return $0.hostCallbackQueue.removeFirst()
        }
    }

    @discardableResult
    private func drainNextTicks(phase: String, limit: Int) -> Int {
        executor.preconditionInExecutor()
        guard !nextTickQueue.isEmpty else { return 0 }
        log("[bun:scheduler] drainNextTicks[\(phase)] enter queueSize=\(nextTickQueue.count)")
        var processed = 0
        while processed < limit, !nextTickQueue.isEmpty {
            let item = nextTickQueue.removeFirst()
            item.callback()
            processed += 1
        }
        log("[bun:scheduler] drainNextTicks[\(phase)] exit processed=\(processed) remaining=\(nextTickQueue.count)")

        if !nextTickQueue.isEmpty {
            log("[bun:scheduler] nextTick budget exhausted at \(limit)")
        }
        return processed
    }

    private func acceptsNewWork() -> Bool {
        hostState.withLock { $0.isActive }
    }

    private func hasQueuedWork() -> Bool {
        !nextTickQueue.isEmpty || queuedHostCallbackCount > 0
    }
}
