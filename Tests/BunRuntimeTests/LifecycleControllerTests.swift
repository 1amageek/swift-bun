import Testing
@testable import BunRuntime

@Suite("LifecycleController", .serialized)
struct LifecycleControllerTests {
    private func makeController() -> LifecycleController {
        LifecycleController(log: { _ in })
    }

    @Test("boot barriers block natural exit until released")
    func bootBarriersBlockNaturalExit() {
        let lifecycle = makeController()
        lifecycle.enterBooting(mode: .process)
        let barrier = lifecycle.acquireBootBarrier(name: "startup")
        lifecycle.updateRuntimeSnapshot(
            hostQueueCount: 0,
            nextTickQueueCount: 0,
            jsTurnActive: false,
            executorQueueCount: 0,
            executorJobActive: false
        )

        #expect({
            if case .notReady = lifecycle.exitDisposition() { return true }
            return false
        }())

        lifecycle.releaseBootBarrier(barrier)
        lifecycle.enterRunningIfBootComplete()

        #expect({
            if case .ready(0) = lifecycle.exitDisposition() { return true }
            return false
        }())
    }

    @Test("visible handles and pending callbacks block natural exit")
    func visibleHandlesAndCallbacksBlockExit() {
        let lifecycle = makeController()
        lifecycle.enterBooting(mode: .process)
        let startup = lifecycle.acquireBootBarrier(name: "startup")
        lifecycle.releaseBootBarrier(startup)
        lifecycle.enterRunningIfBootComplete()

        let timerHandle = lifecycle.acquireVisibleHandle(kind: "setTimeout")
        lifecycle.updateRuntimeSnapshot(
            hostQueueCount: 0,
            nextTickQueueCount: 0,
            jsTurnActive: false,
            executorQueueCount: 0,
            executorJobActive: false
        )
        #expect({
            if case .notReady = lifecycle.exitDisposition() { return true }
            return false
        }())

        lifecycle.releaseVisibleHandle(timerHandle)
        lifecycle.hostCallbackEnqueued(source: "fetch:1")
        #expect({
            if case .notReady = lifecycle.exitDisposition() { return true }
            return false
        }())

        lifecycle.hostCallbackCompleted(source: "fetch:1")
        lifecycle.updateRuntimeSnapshot(
            hostQueueCount: 0,
            nextTickQueueCount: 0,
            jsTurnActive: false,
            executorQueueCount: 0,
            executorJobActive: false
        )
        #expect({
            if case .ready(0) = lifecycle.exitDisposition() { return true }
            return false
        }())
    }

    @Test("library mode never naturally exits")
    func libraryModeDoesNotNaturallyExit() {
        let lifecycle = makeController()
        lifecycle.enterBooting(mode: .library)
        let setup = lifecycle.acquireBootBarrier(name: "context-setup")
        lifecycle.releaseBootBarrier(setup)
        lifecycle.enterRunningIfBootComplete()
        lifecycle.updateRuntimeSnapshot(
            hostQueueCount: 0,
            nextTickQueueCount: 0,
            jsTurnActive: false,
            executorQueueCount: 0,
            executorJobActive: false
        )

        #expect({
            if case .notReady = lifecycle.exitDisposition() { return true }
            return false
        }())
    }

    @Test("requested exit wins over boot barriers")
    func requestedExitWinsOverBootBarriers() {
        let lifecycle = makeController()
        lifecycle.enterBooting(mode: .process)
        _ = lifecycle.acquireBootBarrier(name: "startup")
        lifecycle.requestExit(code: 7)

        #expect({
            if case .ready(7) = lifecycle.exitDisposition() { return true }
            return false
        }())
    }

    @Test("process startup waits for scheduler quiescence before entering running")
    func processStartupWaitsForSchedulerQuiescence() {
        let lifecycle = makeController()
        lifecycle.enterBooting(mode: .process)
        _ = lifecycle.acquireBootBarrier(name: "startup-sequence")

        lifecycle.hostCallbackEnqueued(source: "fs.readFile")
        lifecycle.updateRuntimeSnapshot(
            hostQueueCount: 1,
            nextTickQueueCount: 0,
            jsTurnActive: false,
            executorQueueCount: 0,
            executorJobActive: false
        )
        #expect(!lifecycle.canAdvanceProcessStartup())

        lifecycle.hostCallbackCompleted(source: "fs.readFile")
        lifecycle.updateRuntimeSnapshot(
            hostQueueCount: 0,
            nextTickQueueCount: 1,
            jsTurnActive: false,
            executorQueueCount: 0,
            executorJobActive: false
        )
        #expect(!lifecycle.canAdvanceProcessStartup())

        lifecycle.updateRuntimeSnapshot(
            hostQueueCount: 0,
            nextTickQueueCount: 0,
            jsTurnActive: true,
            executorQueueCount: 0,
            executorJobActive: false
        )
        #expect(!lifecycle.canAdvanceProcessStartup())

        lifecycle.updateRuntimeSnapshot(
            hostQueueCount: 0,
            nextTickQueueCount: 0,
            jsTurnActive: false,
            executorQueueCount: 0,
            executorJobActive: false
        )
        #expect(lifecycle.canAdvanceProcessStartup())
    }

    @Test("executor jobs block startup and natural exit")
    func executorJobsBlockLifecycleProgress() {
        let lifecycle = makeController()
        lifecycle.enterBooting(mode: .process)
        let startupBarrier = lifecycle.acquireBootBarrier(name: "startup-sequence")

        lifecycle.updateRuntimeSnapshot(
            hostQueueCount: 0,
            nextTickQueueCount: 0,
            jsTurnActive: false,
            executorQueueCount: 1,
            executorJobActive: false
        )
        #expect(!lifecycle.canAdvanceProcessStartup())

        lifecycle.updateRuntimeSnapshot(
            hostQueueCount: 0,
            nextTickQueueCount: 0,
            jsTurnActive: false,
            executorQueueCount: 0,
            executorJobActive: false
        )
        #expect(lifecycle.canAdvanceProcessStartup())

        lifecycle.releaseBootBarrier(startupBarrier)
        lifecycle.enterRunningIfBootComplete()
        #expect({
            if case .ready(0) = lifecycle.exitDisposition() { return true }
            return false
        }())

        lifecycle.updateRuntimeSnapshot(
            hostQueueCount: 0,
            nextTickQueueCount: 0,
            jsTurnActive: false,
            executorQueueCount: 1,
            executorJobActive: false
        )
        #expect({
            if case .notReady = lifecycle.exitDisposition() { return true }
            return false
        }())
    }
}
