@preconcurrency import JavaScriptCore
import Foundation
import NIOCore
import Synchronization

/// Central registry for host-visible handles and async wait tokens.
final class RuntimeHandleRegistry: Sendable {
    private struct NetworkHandles: Sendable {
        var tcpServers = 0
        var tcpSockets = 0
        var httpServers = 0
        var webSockets = 0
        var tlsSockets = 0
    }

    struct TimerHandle {
        var scheduled: Scheduled<Void>
        let callback: JSValue
        let args: [Any]
        let repeating: Bool
        let intervalMs: Int64
        var isRefed: Bool
        var visibleHandleToken: LifecycleController.VisibleHandleToken?
    }

    struct FetchHandle {
        let headersCallback: JSValue
        let chunkCallback: JSValue
        let completeCallback: JSValue
        let errorCallback: JSValue
        var isRefed: Bool
        var visibleHandleToken: LifecycleController.VisibleHandleToken?
    }

    private nonisolated(unsafe) var nextIdentifier: Int32 = 1
    private nonisolated(unsafe) var timers: [Int32: TimerHandle] = [:]
    private nonisolated(unsafe) var fetches: [Int32: FetchHandle] = [:]
    private nonisolated(unsafe) var fsOperations: [Int32: LifecycleController.VisibleHandleToken] = [:]
    private nonisolated(unsafe) var builtinCommands: [Int32: LifecycleController.VisibleHandleToken] = [:]
    private nonisolated(unsafe) var zlibOperations: [Int32: LifecycleController.VisibleHandleToken] = [:]
    private nonisolated(unsafe) var asyncWaits: [Int32: AsyncResultBox<JSResult>] = [:]
    private nonisolated(unsafe) var stdinRefed = false
    private nonisolated(unsafe) var stdinVisibleHandleToken: LifecycleController.VisibleHandleToken?
    private let networkHandles = Mutex(NetworkHandles())

    func makeIdentifier() -> Int32 {
        let id = nextIdentifier
        nextIdentifier += 1
        return id
    }

    func insertTimer(_ handle: TimerHandle, id: Int32? = nil) -> Int32 {
        let identifier = id ?? makeIdentifier()
        timers[identifier] = handle
        return identifier
    }

    func updateTimerScheduled(id: Int32, scheduled: Scheduled<Void>) {
        guard var timer = timers[id] else { return }
        timer.scheduled = scheduled
        timers[id] = timer
    }

    func updateTimerRef(id: Int32, isRefed: Bool) {
        guard var timer = timers[id] else { return }
        timer.isRefed = isRefed
        timers[id] = timer
    }

    func updateTimerVisibleHandleToken(id: Int32, token: LifecycleController.VisibleHandleToken?) {
        guard var timer = timers[id] else { return }
        timer.visibleHandleToken = token
        timers[id] = timer
    }

    func timer(id: Int32) -> TimerHandle? {
        timers[id]
    }

    func removeTimer(id: Int32) -> TimerHandle? {
        timers.removeValue(forKey: id)
    }

    func drainTimers() -> [TimerHandle] {
        let values = Array(timers.values)
        timers.removeAll()
        return values
    }

    func insertFetch(
        headersCallback: JSValue,
        chunkCallback: JSValue,
        completeCallback: JSValue,
        errorCallback: JSValue,
        isRefed: Bool = true,
        visibleHandleToken: LifecycleController.VisibleHandleToken? = nil,
        id: Int32? = nil
    ) -> Int32 {
        let identifier = id ?? makeIdentifier()
        fetches[identifier] = FetchHandle(
            headersCallback: headersCallback,
            chunkCallback: chunkCallback,
            completeCallback: completeCallback,
            errorCallback: errorCallback,
            isRefed: isRefed,
            visibleHandleToken: visibleHandleToken
        )
        return identifier
    }

    func removeFetch(id: Int32) -> FetchHandle? {
        fetches.removeValue(forKey: id)
    }

    func fetch(id: Int32) -> FetchHandle? {
        fetches[id]
    }

    func updateFetchVisibleHandleToken(id: Int32, token: LifecycleController.VisibleHandleToken?) {
        guard var fetch = fetches[id] else { return }
        fetch.visibleHandleToken = token
        fetches[id] = fetch
    }

    func drainFetches() -> [FetchHandle] {
        let values = Array(fetches.values)
        fetches.removeAll()
        return values
    }

    func insertFSOperation(token: Int32, visibleHandleToken: LifecycleController.VisibleHandleToken) {
        fsOperations[token] = visibleHandleToken
    }

    func removeFSOperation(token: Int32) -> LifecycleController.VisibleHandleToken? {
        fsOperations.removeValue(forKey: token)
    }

    func drainFSOperations() -> [LifecycleController.VisibleHandleToken] {
        let values = Array(fsOperations.values)
        fsOperations.removeAll()
        return values
    }

    func insertBuiltinCommand(requestID: Int32, visibleHandleToken: LifecycleController.VisibleHandleToken) {
        builtinCommands[requestID] = visibleHandleToken
    }

    func removeBuiltinCommand(requestID: Int32) -> LifecycleController.VisibleHandleToken? {
        builtinCommands.removeValue(forKey: requestID)
    }

    func drainBuiltinCommands() -> [LifecycleController.VisibleHandleToken] {
        let values = Array(builtinCommands.values)
        builtinCommands.removeAll()
        return values
    }

    func insertZlibOperation(token: Int32, visibleHandleToken: LifecycleController.VisibleHandleToken) {
        zlibOperations[token] = visibleHandleToken
    }

    func removeZlibOperation(token: Int32) -> LifecycleController.VisibleHandleToken? {
        zlibOperations.removeValue(forKey: token)
    }

    func drainZlibOperations() -> [LifecycleController.VisibleHandleToken] {
        let values = Array(zlibOperations.values)
        zlibOperations.removeAll()
        return values
    }

    func createAsyncWait(_ box: AsyncResultBox<JSResult>) -> Int32 {
        let identifier = makeIdentifier()
        asyncWaits[identifier] = box
        return identifier
    }

    func resolveAsyncWait(token: Int32, result: JSResult) {
        asyncWaits.removeValue(forKey: token)?.succeed(result)
    }

    func failAsyncWait(token: Int32, error: any Error) {
        asyncWaits.removeValue(forKey: token)?.fail(error)
    }

    func failAllAsyncWaits(_ error: any Error) {
        let waits = Array(asyncWaits.values)
        asyncWaits.removeAll()
        for wait in waits {
            wait.fail(error)
        }
    }

    func setStdinRefed(_ isRefed: Bool) -> Bool {
        guard stdinRefed != isRefed else { return false }
        stdinRefed = isRefed
        return true
    }

    func setStdinVisibleHandleToken(_ token: LifecycleController.VisibleHandleToken?) {
        stdinVisibleHandleToken = token
    }

    var isStdinRefed: Bool {
        stdinRefed
    }

    var currentStdinVisibleHandleToken: LifecycleController.VisibleHandleToken? {
        stdinVisibleHandleToken
    }

    func activeHandleLabels() -> [String] {
        var labels: [String] = Array(repeating: "Timeout", count: timers.count)
        labels.append(contentsOf: Array(repeating: "Fetch", count: fetches.count))
        labels.append(contentsOf: Array(repeating: "FSRequest", count: fsOperations.count))
        labels.append(contentsOf: Array(repeating: "ChildProcess", count: builtinCommands.count))
        labels.append(contentsOf: Array(repeating: "ZlibRequest", count: zlibOperations.count))
        if stdinRefed {
            labels.append("ReadStream")
        }
        let network = networkHandles.withLock { $0 }
        labels.append(contentsOf: Array(repeating: "TCPServer", count: network.tcpServers))
        labels.append(contentsOf: Array(repeating: "TCPSocket", count: network.tcpSockets))
        labels.append(contentsOf: Array(repeating: "HTTPServer", count: network.httpServers))
        labels.append(contentsOf: Array(repeating: "WebSocket", count: network.webSockets))
        labels.append(contentsOf: Array(repeating: "TLSSocket", count: network.tlsSockets))
        return labels
    }

    func incrementTCPServerCount() {
        networkHandles.withLock { $0.tcpServers += 1 }
    }

    func decrementTCPServerCount() {
        networkHandles.withLock { $0.tcpServers = max(0, $0.tcpServers - 1) }
    }

    func incrementTCPSocketCount() {
        networkHandles.withLock { $0.tcpSockets += 1 }
    }

    func decrementTCPSocketCount() {
        networkHandles.withLock { $0.tcpSockets = max(0, $0.tcpSockets - 1) }
    }

    func incrementHTTPServerCount() {
        networkHandles.withLock { $0.httpServers += 1 }
    }

    func decrementHTTPServerCount() {
        networkHandles.withLock { $0.httpServers = max(0, $0.httpServers - 1) }
    }

    func incrementWebSocketCount() {
        networkHandles.withLock { $0.webSockets += 1 }
    }

    func decrementWebSocketCount() {
        networkHandles.withLock { $0.webSockets = max(0, $0.webSockets - 1) }
    }

    func incrementTLSSocketCount() {
        networkHandles.withLock { $0.tlsSockets += 1 }
    }

    func decrementTLSSocketCount() {
        networkHandles.withLock { $0.tlsSockets = max(0, $0.tlsSockets - 1) }
    }
}
