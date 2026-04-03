@preconcurrency import JavaScriptCore
import Foundation
import NIOCore
import Synchronization
#if canImport(Darwin)
import Darwin
#endif

/// A JavaScript execution context backed by a single JS-dedicated executor.
///
/// `BunProcess` remains the public facade, while internal scheduling, lifecycle,
/// and native async work are delegated to dedicated runtime components.
public final class BunProcess: Sendable {
    private enum ShutdownState: Sendable {
        case active
        case shuttingDown
        case shutDown
    }

    // MARK: - Configuration

    private let bundle: URL?
    private let arguments: [String]
    private let cwd: String?
    private let environment: [String: String]
    private let removedEnvironmentKeys: Set<String>

    // MARK: - Runtime Components

    private let executor: JavaScriptExecutor
    private let lifecycle: LifecycleController
    private let handleRegistry: RuntimeHandleRegistry
    private let scheduler: HostScheduler
    private let nativeRuntime: NativeRuntime
    private let fileSystemAsyncBridge: FileSystemAsyncBridge
    private let builtinCommandBridge: BuiltinCommandBridge
    private let zlibAsyncBridge: ZlibAsyncBridge
    private let socketRuntime: SocketRuntime
    private let httpServerRuntime: HTTPServerRuntime
    private let webSocketRuntime: WebSocketRuntime

    // MARK: - Process State

    private nonisolated(unsafe) var exitPromise: AsyncResultBox<Int32>?
    private nonisolated(unsafe) var runStartupBarrier: LifecycleController.BootBarrierToken?
    private nonisolated(unsafe) var startupPromiseVisibleHandle: LifecycleController.VisibleHandleToken?
    private nonisolated(unsafe) var pendingStdinVisibleHandle: LifecycleController.VisibleHandleToken?
    private nonisolated(unsafe) var streamsFinished = false
    private let shutdownState = Mutex<ShutdownState>(.active)
    private struct PendingStdinState: Sendable {
        var queue: [Data?] = []
        var drainScheduled = false
    }
    private let pendingStdinState = Mutex(PendingStdinState())

    // MARK: - Streams

    /// Data written to `process.stdout.write()` from JS.
    public let stdout: AsyncStream<String>
    private let stdoutContinuation: AsyncStream<String>.Continuation

    /// Diagnostic output from JS (`console.log`, `console.error`, etc.).
    public let output: AsyncStream<String>
    private let outputContinuation: AsyncStream<String>.Continuation

    // MARK: - Init

    public init(
        bundle: URL? = nil,
        arguments: [String] = [],
        cwd: String? = nil,
        environment: [String: String] = [:],
        removedEnvironmentKeys: Set<String> = [],
        nextTickBudgetPerTurn: Int = 64,
        hostCallbackBudgetPerTurn: Int = 256
    ) {
        self.bundle = bundle
        self.arguments = arguments
        self.cwd = cwd
        self.environment = environment
        self.removedEnvironmentKeys = removedEnvironmentKeys

        let (stdoutStream, stdoutCont) = AsyncStream<String>.makeStream()
        self.stdout = stdoutStream
        self.stdoutContinuation = stdoutCont

        let (outputStream, outputCont) = AsyncStream<String>.makeStream()
        self.output = outputStream
        self.outputContinuation = outputCont

        let logger: @Sendable (String) -> Void = { [outputCont] line in
            outputCont.yield(line)
        }

        let executor = JavaScriptExecutor(log: logger)
        let lifecycle = LifecycleController(log: logger)
        let handleRegistry = RuntimeHandleRegistry()
        let scheduler = HostScheduler(
            executor: executor,
            nextTickBudgetPerTurn: nextTickBudgetPerTurn,
            hostCallbackBudgetPerTurn: hostCallbackBudgetPerTurn,
            onHostCallbackEnqueued: { source in
                lifecycle.hostCallbackEnqueued(source: source)
            },
            onHostCallbackCompleted: { source in
                lifecycle.hostCallbackCompleted(source: source)
            },
            log: logger
        )
        let nativeRuntime = NativeRuntime(
            assertOnJSThread: { [executor] in
                executor.preconditionInExecutor()
            },
            scheduler: scheduler,
            log: logger
        )
        let fileSystemAsyncBridge = FileSystemAsyncBridge(
            completeOnJSThread: { token, source, detail, payload in
                let schedulerSource = "\(source):\(token)"
                let dispatchUptimeMs = Int(ProcessInfo.processInfo.systemUptime * 1000)
                if let detail {
                    logger("[bun:fs] dispatch \(source) token=\(token) t=\(dispatchUptimeMs) path=\(detail)")
                } else {
                    logger("[bun:fs] dispatch \(source) token=\(token) t=\(dispatchUptimeMs)")
                }
                scheduler.enqueueHostCallback(source: schedulerSource) {
                    let resolveUptimeMs = Int(ProcessInfo.processInfo.systemUptime * 1000)
                    if let detail {
                        logger("[bun:fs] resolve \(source) token=\(token) t=\(resolveUptimeMs) wait=\(resolveUptimeMs - dispatchUptimeMs) path=\(detail)")
                    } else {
                        logger("[bun:fs] resolve \(source) token=\(token) t=\(resolveUptimeMs) wait=\(resolveUptimeMs - dispatchUptimeMs)")
                    }
                    guard let ctx = executor.context else { return }
                    guard let resolver = ctx.objectForKeyedSubscript("__resolveFSAsyncToken"), !resolver.isUndefined else {
                        return
                    }
                    _ = resolver.call(withArguments: [token, payload.jsValue])
                    if let exception = ctx.exception {
                        let message = exception.toString() ?? "Unknown JS exception"
                        ctx.exception = nil
                        logger("[bun:exception] fs.async.complete: \(message)")
                    }
                    executor.preconditionInExecutor()
                    if let visibleHandle = handleRegistry.removeFSOperation(token: token) {
                        lifecycle.releaseVisibleHandle(visibleHandle)
                    }
                }
            },
            onOperationStarted: { token, source, _ in
                executor.preconditionInExecutor()
                let visibleHandle = lifecycle.acquireVisibleHandle(kind: source)
                handleRegistry.insertFSOperation(token: token, visibleHandleToken: visibleHandle)
            },
            log: logger
        )
        let builtinCommandBridge = BuiltinCommandBridge(
            completeOnJSThread: { requestID, payloadJSON in
                let schedulerSource = "childProcess:\(requestID)"
                scheduler.enqueueHostCallback(source: schedulerSource) {
                    executor.preconditionInExecutor()
                    if let visibleHandle = handleRegistry.removeBuiltinCommand(requestID: requestID) {
                        lifecycle.releaseVisibleHandle(visibleHandle)
                    }
                    guard let ctx = executor.context else { return }
                    guard let handler = ctx.objectForKeyedSubscript("__swiftBunChildProcessComplete"), !handler.isUndefined else {
                        return
                    }
                    _ = handler.call(withArguments: [requestID, payloadJSON])
                    if let exception = ctx.exception {
                        let message = exception.toString() ?? "Unknown JS exception"
                        ctx.exception = nil
                        logger("[bun:exception] childProcess.complete: \(message)")
                    }
                }
            },
            onOperationStarted: { requestID, kind in
                executor.preconditionInExecutor()
                let visibleHandle = lifecycle.acquireVisibleHandle(kind: kind)
                handleRegistry.insertBuiltinCommand(requestID: requestID, visibleHandleToken: visibleHandle)
            }
        )
        let zlibAsyncBridge = ZlibAsyncBridge(
            completeOnJSThread: { token, source, detail, payload in
                let schedulerSource = "\(source):\(token)"
                let dispatchUptimeMs = Int(ProcessInfo.processInfo.systemUptime * 1000)
                logger("[bun:zlib] dispatch \(detail) token=\(token) t=\(dispatchUptimeMs)")
                scheduler.enqueueHostCallback(source: schedulerSource) {
                    let resolveUptimeMs = Int(ProcessInfo.processInfo.systemUptime * 1000)
                    logger("[bun:zlib] resolve \(detail) token=\(token) t=\(resolveUptimeMs) wait=\(resolveUptimeMs - dispatchUptimeMs)")
                    executor.preconditionInExecutor()
                    if let visibleHandle = handleRegistry.removeZlibOperation(token: token) {
                        lifecycle.releaseVisibleHandle(visibleHandle)
                    }
                    guard let ctx = executor.context else { return }
                    guard let resolver = ctx.objectForKeyedSubscript("__resolveZlibAsyncToken"), !resolver.isUndefined else {
                        return
                    }
                    _ = resolver.call(withArguments: [token, payload.jsValue])
                    if let exception = ctx.exception {
                        let message = exception.toString() ?? "Unknown JS exception"
                        ctx.exception = nil
                        logger("[bun:exception] zlib.async.complete: \(message)")
                    }
                }
            },
            onOperationStarted: { token, source, detail in
                executor.preconditionInExecutor()
                let visibleHandle = lifecycle.acquireVisibleHandle(kind: "\(source).\(detail)")
                handleRegistry.insertZlibOperation(token: token, visibleHandleToken: visibleHandle)
            },
            log: logger
        )
        let socketRuntime = SocketRuntime(
            onServerOpened: {
                handleRegistry.incrementTCPServerCount()
                return lifecycle.acquireVisibleHandle(kind: "tcpServer")
            },
            onServerClosed: { token in
                handleRegistry.decrementTCPServerCount()
                lifecycle.releaseVisibleHandle(token)
            },
            onSocketOpened: {
                handleRegistry.incrementTCPSocketCount()
                return lifecycle.acquireVisibleHandle(kind: "tcpSocket")
            },
            onSocketClosed: { token in
                handleRegistry.decrementTCPSocketCount()
                lifecycle.releaseVisibleHandle(token)
            }
        )
        let httpServerRuntime = HTTPServerRuntime(
            onServerOpened: {
                handleRegistry.incrementHTTPServerCount()
                return lifecycle.acquireVisibleHandle(kind: "httpServer")
            },
            onServerClosed: { token in
                handleRegistry.decrementHTTPServerCount()
                lifecycle.releaseVisibleHandle(token)
            }
        )
        let webSocketRuntime = WebSocketRuntime(
            onSocketOpened: {
                handleRegistry.incrementWebSocketCount()
                return lifecycle.acquireVisibleHandle(kind: "webSocket")
            },
            onSocketClosed: { token in
                handleRegistry.decrementWebSocketCount()
                lifecycle.releaseVisibleHandle(token)
            }
        )

        self.executor = executor
        self.lifecycle = lifecycle
        self.handleRegistry = handleRegistry
        self.scheduler = scheduler
        self.nativeRuntime = nativeRuntime
        self.fileSystemAsyncBridge = fileSystemAsyncBridge
        self.builtinCommandBridge = builtinCommandBridge
        self.zlibAsyncBridge = zlibAsyncBridge
        self.socketRuntime = socketRuntime
        self.httpServerRuntime = httpServerRuntime
        self.webSocketRuntime = webSocketRuntime

        executor.execute {
            self.scheduler.setTurnCompletedHandler {
                self.evaluateExitCondition()
                self.schedulePostTurnCheckpoint()
            }
        }
    }

    deinit {
        let state = lifecycle.currentState
        let shouldWarn = shutdownState.withLock { shutdownState in
            switch shutdownState {
            case .shutDown:
                return false
            case .active, .shuttingDown:
                return state != .idle
            }
        }
        if !streamsFinished {
            if shouldWarn {
                outputContinuation.yield("[bun:deinit] BunProcess deinitialized without shutdown()")
            }
            finishStreams()
        }
    }

    // MARK: - Public API

    /// Starts the runtime in library mode.
    ///
    /// Library mode never exits naturally. Callers must pair every successful
    /// `load()` with `shutdown()` after finishing `evaluate`/`call` work.
    public func load() async throws {
        guard isAcceptingPublicWork else {
            throw BunRuntimeError.shutdownRequired
        }
        do {
            try await executor.submit {
                guard self.isAcceptingPublicWork else {
                    throw BunRuntimeError.shutdownRequired
                }
                precondition(self.lifecycle.currentState == .idle, "BunProcess already started. Use a new instance.")
                self.lifecycle.enterBooting(mode: .library)
                let setupBarrier = self.lifecycle.acquireBootBarrier(name: "context-setup")
                try self.setupContext()
                self.lifecycle.releaseBootBarrier(setupBarrier)
                self.lifecycle.enterRunningIfBootComplete()
            }
        } catch {
            do {
                try await shutdown()
            } catch {
            }
            throw error
        }
    }

    @discardableResult
    public func evaluate(js source: String) async throws -> JSResult {
        guard isAcceptingPublicWork else {
            throw BunRuntimeError.shutdownRequired
        }
        return try await executor.submit {
            guard self.isAcceptingPublicWork else {
                throw BunRuntimeError.shutdownRequired
            }
            self.executor.preconditionInExecutor()
            guard self.lifecycle.isJavaScriptReady else {
                throw BunRuntimeError.contextNotReady
            }
            guard let ctx = self.executor.context else {
                throw BunRuntimeError.contextNotReady
            }

            let result = ctx.evaluateScript(source)
            self.scheduler.ensureDrainScheduled(reason: "evaluate")
            try self.checkException()
            if self.isThenable(result) {
                throw BunRuntimeError.asyncResultRequiresAsyncAPI
            }
            return JSResult(from: result)
        }
    }

    @discardableResult
    public func evaluateAsync(js source: String) async throws -> JSResult {
        guard isAcceptingPublicWork else {
            throw BunRuntimeError.shutdownRequired
        }
        return try await withCheckedThrowingContinuation { continuation in
            let promise = AsyncResultBox<JSResult>(
                onSuccess: { continuation.resume(returning: $0) },
                onFailure: { continuation.resume(throwing: $0) }
            )

            let accepted = executor.execute {
                guard self.isAcceptingPublicWork else {
                    promise.fail(BunRuntimeError.shutdownRequired)
                    return
                }
                self.executor.preconditionInExecutor()
                guard self.lifecycle.isJavaScriptReady, let ctx = self.executor.context else {
                    promise.fail(BunRuntimeError.contextNotReady)
                    return
                }

                let token = self.handleRegistry.createAsyncWait(promise)
                let result = ctx.evaluateScript(source)
                self.scheduler.ensureDrainScheduled(reason: "evaluateAsync")

                do {
                    try self.checkException()
                    self.awaitAsyncResult(result, token: token)
                } catch {
                    self.handleRegistry.failAsyncWait(token: token, error: error)
                }
            }
            if !accepted {
                continuation.resume(throwing: BunRuntimeError.shutdownRequired)
            }
        }
    }

    @discardableResult
    public func call(_ function: String, arguments: [Any] = []) async throws -> JSResult {
        guard isAcceptingPublicWork else {
            throw BunRuntimeError.shutdownRequired
        }
        return try await executor.submit {
            guard self.isAcceptingPublicWork else {
                throw BunRuntimeError.shutdownRequired
            }
            self.executor.preconditionInExecutor()
            guard self.lifecycle.isJavaScriptReady else {
                throw BunRuntimeError.contextNotReady
            }
            guard let ctx = self.executor.context else {
                throw BunRuntimeError.contextNotReady
            }
            guard let fn = ctx.objectForKeyedSubscript(function), !fn.isUndefined else {
                throw BunRuntimeError.functionNotFound(function)
            }

            let result = fn.call(withArguments: arguments)
            self.scheduler.ensureDrainScheduled(reason: "call")
            try self.checkException()
            if self.isThenable(result) {
                throw BunRuntimeError.asyncResultRequiresAsyncAPI
            }
            return JSResult(from: result)
        }
    }

    @discardableResult
    public func callAsync(_ function: String, arguments: [Any] = []) async throws -> JSResult {
        guard isAcceptingPublicWork else {
            throw BunRuntimeError.shutdownRequired
        }
        return try await withCheckedThrowingContinuation { continuation in
            let promise = AsyncResultBox<JSResult>(
                onSuccess: { continuation.resume(returning: $0) },
                onFailure: { continuation.resume(throwing: $0) }
            )

            let accepted = executor.execute {
                guard self.isAcceptingPublicWork else {
                    promise.fail(BunRuntimeError.shutdownRequired)
                    return
                }
                self.executor.preconditionInExecutor()
                guard self.lifecycle.isJavaScriptReady, let ctx = self.executor.context else {
                    promise.fail(BunRuntimeError.contextNotReady)
                    return
                }
                guard let fn = ctx.objectForKeyedSubscript(function), !fn.isUndefined else {
                    promise.fail(BunRuntimeError.functionNotFound(function))
                    return
                }

                let token = self.handleRegistry.createAsyncWait(promise)
                let result = fn.call(withArguments: arguments)
                self.scheduler.ensureDrainScheduled(reason: "callAsync")

                do {
                    try self.checkException()
                    self.awaitAsyncResult(result, token: token)
                } catch {
                    self.handleRegistry.failAsyncWait(token: token, error: error)
                }
            }
            if !accepted {
                continuation.resume(throwing: BunRuntimeError.shutdownRequired)
            }
        }
    }

    public func run() async throws -> Int32 {
        guard isAcceptingPublicWork else {
            throw BunRuntimeError.shutdownRequired
        }
        let runResult: Result<Int32, any Error>
        do {
            let exitCode = try await withCheckedThrowingContinuation { continuation in
                let promise = AsyncResultBox<Int32>(
                    onSuccess: { continuation.resume(returning: $0) },
                    onFailure: { continuation.resume(throwing: $0) }
                )

                let accepted = executor.execute {
                    do {
                        guard self.isAcceptingPublicWork else {
                            throw BunRuntimeError.shutdownRequired
                        }
                        precondition(self.lifecycle.currentState == .idle, "BunProcess already started. Use a new instance.")
                        guard self.bundle != nil else {
                            throw BunRuntimeError.bundleNotFound(URL(fileURLWithPath: "<none>"))
                        }

                        self.exitPromise = promise
                        self.lifecycle.enterBooting(mode: .process)
                        self.ensurePendingStdinVisibleHandleIfNeeded()
                        let setupBarrier = self.lifecycle.acquireBootBarrier(name: "context-setup")
                        self.runStartupBarrier = self.lifecycle.acquireBootBarrier(name: "startup-sequence")
                        try self.setupContext()
                        self.lifecycle.releaseBootBarrier(setupBarrier)
                        self.completeRunStartup()
                    } catch {
                        self.lifecycle.markExited()
                        self.exitPromise = nil
                        self.runStartupBarrier = nil
                        promise.fail(error)
                    }
                }
                if !accepted {
                    continuation.resume(throwing: BunRuntimeError.shutdownRequired)
                }
            }
            runResult = .success(exitCode)
        } catch {
            runResult = .failure(error)
        }

        do {
            try await shutdown()
        } catch {
            switch runResult {
            case .success:
                throw error
            case .failure(let runError):
                throw runError
            }
        }

        switch runResult {
        case .success(let exitCode):
            return exitCode
        case .failure(let error):
            throw error
        }
    }

    public func sendInput(_ data: Data?) {
        guard isAcceptingPublicWork else {
            return
        }
        pendingStdinState.withLock { state in
            state.queue.append(data)
        }
        ensurePendingStdinVisibleHandleIfNeeded()
        requestPendingStdinDrainIfReady()
    }

    public func terminate(exitCode: Int32 = 0) {
        guard isAcceptingPublicWork else {
            return
        }
        scheduler.enqueueHostCallback(source: "terminate") {
            self.requestExit(code: exitCode)
        }
    }

    /// Performs explicit runtime teardown.
    ///
    /// `shutdown()` is the required cleanup path for library mode. Process mode
    /// callers normally rely on `run()` to invoke this before returning.
    public func shutdown() async throws {
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

        try await withCheckedThrowingContinuation { continuation in
            let accepted = executor.execute {
                self.performShutdown(reason: "shutdown()")
                continuation.resume()
            }
            if !accepted {
                continuation.resume()
            }
        }
        try await nativeRuntime.shutdown()
        try await socketRuntime.shutdown()
        try await httpServerRuntime.shutdown()
        try await webSocketRuntime.shutdown()
        try await executor.shutdown()
        shutdownState.withLock { $0 = .shutDown }
    }

    // MARK: - Context Setup

    private func setupContext() throws {
        executor.preconditionInExecutor()

        guard let ctx = JSContext() else {
            throw BunRuntimeError.contextCreationFailed
        }
        executor.installContext(ctx)

        let runtimeEnvironment = mergedRuntimeEnvironment()

        installCryptoRandomBridge(in: ctx)
        try installWebAPIPolyfills(in: ctx)
        try throwPendingJavaScriptException(source: "setup:webAPIPolyfills")

        let resolver = ModuleBootstrap(
            fileSystemAsyncBridge: fileSystemAsyncBridge,
            builtinCommandBridge: builtinCommandBridge,
            zlibAsyncBridge: zlibAsyncBridge,
            environment: runtimeEnvironment,
            cwd: cwd
        )
        try resolver.installModules(into: ctx)
        try throwPendingJavaScriptException(source: "setup:installModules")
        installConsoleBridge(in: ctx)
        try throwPendingJavaScriptException(source: "setup:consoleBridge")
        installStdioBridges(in: ctx)
        try throwPendingJavaScriptException(source: "setup:stdioBridges")
        installProcessDiagnosticsBridge(in: ctx)
        try throwPendingJavaScriptException(source: "setup:processDiagnosticsBridge")
        try installAsyncBridge(in: ctx)
        try throwPendingJavaScriptException(source: "setup:asyncBridge")
        try installTimerBridge(in: ctx)
        try throwPendingJavaScriptException(source: "setup:timerBridge")
        installFetchBridge(in: ctx)
        try throwPendingJavaScriptException(source: "setup:fetchBridge")
        installDNSBridge(in: ctx)
        try throwPendingJavaScriptException(source: "setup:dnsBridge")
        installSocketBridge(in: ctx)
        try throwPendingJavaScriptException(source: "setup:socketBridge")
        installHTTPServerBridge(in: ctx)
        try throwPendingJavaScriptException(source: "setup:httpServerBridge")
        try installWebSocketBridge(in: ctx)
        try throwPendingJavaScriptException(source: "setup:webSocketBridge")
        try installProcessExitBridge(in: ctx)
        try throwPendingJavaScriptException(source: "setup:processExitBridge")
        installStdinBridge(in: ctx)
        try throwPendingJavaScriptException(source: "setup:stdinBridge")
        try patchTimerModuleReferences(in: ctx)
        try throwPendingJavaScriptException(source: "setup:patchTimerRefs")
        try resolver.installRequire(into: ctx)
        try throwPendingJavaScriptException(source: "setup:installRequire")

        if let bundle {
            let argv = ["node", bundle.path] + arguments
            guard let process = ctx.objectForKeyedSubscript("process"), !process.isUndefined else {
                throw BunRuntimeError.javaScriptException("process is not installed")
            }
            process.setObject(argv, forKeyedSubscript: "argv" as NSString)
            try throwPendingJavaScriptException(source: "setup:processArgv")
        }

        let rejectionBlock: @convention(block) (String) -> Void = { [outputContinuation] message in
            outputContinuation.yield("[bun:rejection] \(message)")
        }
        ctx.setObject(rejectionBlock, forKeyedSubscript: "__reportRejection" as NSString)

        if let bundle {
            try evaluateBundle(bundle, in: ctx)
        }
    }

    private func mergedRuntimeEnvironment() -> [String: String] {
        RuntimeEnvironment(overrides: environment, removing: removedEnvironmentKeys).values
    }

    private var isAcceptingPublicWork: Bool {
        shutdownState.withLock {
            if case .active = $0 {
                return true
            }
            return false
        }
    }

    private func evaluateBundle(_ bundle: URL, in ctx: JSContext) throws {
        guard FileManager.default.fileExists(atPath: bundle.path) else {
            throw BunRuntimeError.bundleNotFound(bundle)
        }

        let rawSource = try String(contentsOf: bundle, encoding: .utf8)
        let source = try ESMTransformer.transform(rawSource, bundleURL: bundle)
        let result: JSValue?
        if lifecycle.currentMode == .process {
            guard
                let loader = ctx.objectForKeyedSubscript("__swiftBunModuleLoader"),
                !loader.isUndefined,
                let executeMain = loader.objectForKeyedSubscript("executeMainSource"),
                !executeMain.isUndefined
            else {
                throw BunRuntimeError.javaScriptException("CommonJS loader is not installed")
            }

            result = executeMain.call(withArguments: [bundle.path, source])
        } else {
            result = ctx.evaluateScript(source, withSourceURL: bundle)
        }
        scheduler.ensureDrainScheduled(reason: "bundle")
        if let exception = ctx.exception {
            let message = exception.toString() ?? ""
            ctx.exception = nil
            let isSentinel = isProcessExitSentinel(exception)
            if !isSentinel {
                throw BunRuntimeError.javaScriptException(message)
            }
        }

        try observeStartupPromiseIfPresent(in: ctx, candidate: result)
    }

    private func observeStartupPromiseIfPresent(in ctx: JSContext, candidate: JSValue? = nil) throws {
        executor.preconditionInExecutor()
        guard lifecycle.currentMode == .process else {
            return
        }
        guard startupPromiseVisibleHandle == nil else {
            return
        }
        let startupPromise = candidate ?? ctx.objectForKeyedSubscript("__swiftBunStartupPromise")
        guard let startupPromise else {
            return
        }
        guard isThenable(startupPromise) else {
            return
        }

        startupPromiseVisibleHandle = lifecycle.acquireVisibleHandle(kind: "startupPromise")
        try JavaScriptResource.evaluate(.runtime(.startupPromiseObserver), in: ctx)
        reportPendingJavaScriptException(source: "observeStartupPromiseIfPresent")
    }

    // MARK: - Lifecycle

    private func evaluateExitCondition() {
        executor.preconditionInExecutor()

        let executorSnapshot = executor.runtimeSnapshot()
        lifecycle.updateRuntimeSnapshot(
            hostQueueCount: scheduler.queuedHostCallbackCount,
            nextTickQueueCount: scheduler.queuedNextTickCount,
            jsTurnActive: scheduler.isTurnActive,
            executorQueueCount: executorSnapshot.queuedJobCount,
            executorJobActive: executorSnapshot.isJobActive
        )
        maybeCompleteRunStartup()

        switch lifecycle.exitDisposition() {
        case .notReady:
            return
        case .ready(let code):
            resolveExit(code: code)
        }
    }

    private func schedulePostTurnCheckpoint() {
        executor.preconditionInExecutor()
        guard let ctx = executor.context,
              let checkpoint = ctx.objectForKeyedSubscript("__swiftBunSchedulePostTurnCheckpoint"),
              !checkpoint.isUndefined else {
            evaluateExitCondition()
            return
        }

        _ = checkpoint.call(withArguments: [])
        reportPendingJavaScriptException(source: "schedulePostTurnCheckpoint")
    }

    private func completeRunStartup() {
        executor.preconditionInExecutor()
        evaluateExitCondition()
        scheduler.forceDrain()
    }

    private func maybeCompleteRunStartup() {
        executor.preconditionInExecutor()
        guard let startupBarrier = runStartupBarrier else {
            return
        }

        guard lifecycle.canAdvanceProcessStartup() else {
            return
        }

        lifecycle.releaseBootBarrier(startupBarrier)
        runStartupBarrier = nil
        lifecycle.enterRunningIfBootComplete()
        requestPendingStdinDrainIfReady()
    }

    private func requestExit(code: Int32) {
        executor.preconditionInExecutor()
        lifecycle.requestExit(code: code)
        cleanupActiveHandles(reason: "exit")
        resolveExit(code: code)
    }

    private func resolveExit(code: Int32) {
        executor.preconditionInExecutor()
        scheduler.deactivate()
        nativeRuntime.deactivate()
        guard let promise = exitPromise else {
            lifecycle.markExited()
            finishStreams()
            return
        }

        lifecycle.markExited()
        exitPromise = nil
        finishStreams()
        promise.succeed(code)
    }

    private func performShutdown(reason: String) {
        executor.preconditionInExecutor()
        if lifecycle.currentState != .exited {
            lifecycle.beginShutdown()
        }
        runStartupBarrier = nil
        scheduler.deactivate()
        nativeRuntime.deactivate()

        cleanupActiveHandles(reason: reason)
        handleRegistry.failAllAsyncWaits(BunRuntimeError.shutdownRequired)

        if executor.context != nil {
            deliverStdin(nil)
        }
        pendingStdinState.withLock { state in
            state.queue.removeAll(keepingCapacity: false)
            state.drainScheduled = false
        }
        executor.clearContext()
        if let promise = exitPromise {
            exitPromise = nil
            promise.fail(BunRuntimeError.shutdownRequired)
        }
        finishStreams()
        lifecycle.markExited()
    }

    private func cleanupActiveHandles(reason: String) {
        executor.preconditionInExecutor()

        let timers = handleRegistry.drainTimers()
        for timer in timers {
            timer.scheduled.cancel()
            if let token = timer.visibleHandleToken {
                lifecycle.releaseVisibleHandle(token)
            }
        }

        nativeRuntime.cancelAllFetches()
        let fetches = handleRegistry.drainFetches()
        for fetch in fetches {
            if let token = fetch.visibleHandleToken {
                lifecycle.releaseVisibleHandle(token)
            }
        }

        let fsOperations = handleRegistry.drainFSOperations()
        for token in fsOperations {
            lifecycle.releaseVisibleHandle(token)
        }

        let builtinCommands = handleRegistry.drainBuiltinCommands()
        for token in builtinCommands {
            lifecycle.releaseVisibleHandle(token)
        }

        let zlibOperations = handleRegistry.drainZlibOperations()
        for token in zlibOperations {
            lifecycle.releaseVisibleHandle(token)
        }

        if let stdinToken = handleRegistry.currentStdinVisibleHandleToken {
            lifecycle.releaseVisibleHandle(stdinToken)
            handleRegistry.setStdinVisibleHandleToken(nil)
        }
        if let startupToken = startupPromiseVisibleHandle {
            lifecycle.releaseVisibleHandle(startupToken)
            startupPromiseVisibleHandle = nil
        }
        if let pendingToken = pendingStdinVisibleHandle {
            lifecycle.releaseVisibleHandle(pendingToken)
            pendingStdinVisibleHandle = nil
        }
        _ = handleRegistry.setStdinRefed(false)
    }

    private func finishStreams() {
        guard !streamsFinished else { return }
        streamsFinished = true
        stdoutContinuation.finish()
        outputContinuation.finish()
    }

    // MARK: - Helpers

    private func isProcessExitSentinel(_ value: JSValue) -> Bool {
        guard let flag = value.objectForKeyedSubscript("__processExit") else { return false }
        return flag.toBool()
    }

    private func isThenable(_ value: JSValue?) -> Bool {
        guard let value, !value.isUndefined, !value.isNull else { return false }
        guard value.isObject || value.isArray else { return false }
        guard let then = value.objectForKeyedSubscript("then") else { return false }
        return !then.isUndefined && !then.isNull && then.isObject
    }

    private func awaitAsyncResult(_ value: JSValue?, token: Int32) {
        executor.preconditionInExecutor()

        guard let ctx = executor.context else {
            handleRegistry.failAsyncWait(token: token, error: BunRuntimeError.contextNotReady)
            return
        }

        if value == nil || value?.isUndefined == true {
            handleRegistry.resolveAsyncWait(token: token, result: .undefined)
            return
        }

        if !isThenable(value) {
            handleRegistry.resolveAsyncWait(token: token, result: JSResult(from: value))
            return
        }

        guard let awaiter = ctx.objectForKeyedSubscript("__swiftBunAwaitResult"), !awaiter.isUndefined else {
            handleRegistry.failAsyncWait(token: token, error: BunRuntimeError.contextNotReady)
            return
        }

        _ = awaiter.call(withArguments: [value as Any, token])
        reportPendingJavaScriptException(source: "awaitAsyncResult")
    }

    private func checkException() throws {
        executor.preconditionInExecutor()
        guard let ctx = executor.context, let exception = ctx.exception else { return }
        ctx.exception = nil
        let message = exception.toString() ?? "Unknown JS exception"
        if !isProcessExitSentinel(exception) {
            throw BunRuntimeError.javaScriptException(message)
        }
    }

    private func reportPendingJavaScriptException(source: String) {
        executor.preconditionInExecutor()
        guard let ctx = executor.context, let exception = ctx.exception else { return }
        ctx.exception = nil
        guard !isProcessExitSentinel(exception) else { return }
        let message = exception.toString() ?? "Unknown JS exception"
        outputContinuation.yield("[bun:exception] \(source): \(message)")
    }

    private func throwPendingJavaScriptException(source: String) throws {
        executor.preconditionInExecutor()
        guard let ctx = executor.context, let exception = ctx.exception else { return }
        ctx.exception = nil
        guard !isProcessExitSentinel(exception) else { return }
        let message = exception.toString() ?? "Unknown JS exception"
        outputContinuation.yield("[bun:exception] \(source): \(message)")
        throw BunRuntimeError.javaScriptException(message)
    }

    private func extractArgs(_ argsArray: JSValue) -> [Any] {
        guard !argsArray.isUndefined, argsArray.isArray else { return [] }
        let length = argsArray.objectForKeyedSubscript("length")?.toInt32() ?? 0
        var args: [Any] = []
        for index in 0..<length {
            if let arg = argsArray.objectAtIndexedSubscript(Int(index)) {
                args.append(arg)
            }
        }
        return args
    }

    // MARK: - Crypto Random Bridge (must be installed before polyfills)

    private func installCryptoRandomBridge(in ctx: JSContext) {
        let randomBytesBlock: @convention(block) (Int) -> [UInt8] = { size in
            var bytes = [UInt8](repeating: 0, count: size)
            _ = SecRandomCopyBytes(kSecRandomDefault, size, &bytes)
            return bytes
        }
        ctx.setObject(randomBytesBlock, forKeyedSubscript: "__cryptoRandomBytes" as NSString)
    }

    // MARK: - Web API Polyfills

    private func installWebAPIPolyfills(in ctx: JSContext) throws {
        try JavaScriptResource.evaluate(.bundle(.polyfills), in: ctx)
    }

    // MARK: - Console Bridge

    private func installConsoleBridge(in ctx: JSContext) {
        let logBlock: @convention(block) (String, String) -> Void = { [outputContinuation] level, message in
            outputContinuation.yield("[\(level)] \(message)")
        }
        ctx.setObject(logBlock, forKeyedSubscript: "__nativeLog" as NSString)
    }

    // MARK: - stdout/stderr Bridge

    private func installStdioBridges(in ctx: JSContext) {
        let stdoutWrite: @convention(block) (String) -> Bool = { [stdoutContinuation] data in
            stdoutContinuation.yield(data)
            return true
        }
        ctx.setObject(stdoutWrite, forKeyedSubscript: "__nativeStdoutWrite" as NSString)

        let stderrWrite: @convention(block) (String) -> Bool = { [outputContinuation] data in
            outputContinuation.yield("[stderr] \(data)")
            return true
        }
        ctx.setObject(stderrWrite, forKeyedSubscript: "__nativeStderrWrite" as NSString)

        let isATTYBlock: @convention(block) (Int32) -> Bool = { fd in
            Self.isATTY(fileDescriptor: fd)
        }
        ctx.setObject(isATTYBlock, forKeyedSubscript: "__ttyIsATTY" as NSString)

        let windowSizeBlock: @convention(block) (Int32) -> [Int] = { fd in
            guard let size = Self.windowSize(fileDescriptor: fd) else {
                return []
            }
            return [size.columns, size.rows]
        }
        ctx.setObject(windowSizeBlock, forKeyedSubscript: "__ttyGetWindowSize" as NSString)

        let setRawModeBlock: @convention(block) (Int32, Bool) -> Bool = { fd, enabled in
            Self.setRawMode(fileDescriptor: fd, enabled: enabled)
        }
        ctx.setObject(setRawModeBlock, forKeyedSubscript: "__ttySetRawMode" as NSString)

        ctx.evaluateScript(
            """
            (function() {
                function hasTTYBridge() {
                    return typeof __ttyIsATTY === 'function';
                }

                function isTTY(fd) {
                    return hasTTYBridge() ? !!__ttyIsATTY(fd) : false;
                }

                function getWindowSize(fd) {
                    if (typeof __ttyGetWindowSize !== 'function') return null;
                    var size = __ttyGetWindowSize(fd);
                    return Array.isArray(size) && size.length === 2 ? size : null;
                }

                function applyReadStreamShape(stream, fd) {
                    if (!stream) return;
                    stream.fd = fd;
                    stream.isTTY = isTTY(fd);
                    if (typeof stream.isRaw !== 'boolean') {
                        stream.isRaw = false;
                    }
                    stream.setRawMode = function(flag) {
                        var enabled = !!flag;
                        if (typeof __ttySetRawMode === 'function') {
                            enabled = !!__ttySetRawMode(fd, enabled);
                        }
                        stream.isRaw = enabled;
                        return stream;
                    };
                }

                function applyWriteStreamShape(stream, fd) {
                    if (!stream) return;
                    stream.fd = fd;
                    stream.isTTY = isTTY(fd);

                    var refreshSize = function() {
                        var size = getWindowSize(fd);
                        if (size) {
                            stream.columns = size[0];
                            stream.rows = size[1];
                        } else {
                            stream.columns = 80;
                            stream.rows = 24;
                        }
                        return [stream.columns, stream.rows];
                    };

                    refreshSize();
                    stream._refreshSize = refreshSize;
                    stream.getWindowSize = function() { return refreshSize(); };
                    stream.getColorDepth = function() { return stream.isTTY ? 4 : 1; };
                    stream.hasColors = function(count) {
                        if (!stream.isTTY) return false;
                        var minimum = typeof count === 'number' ? count : 2;
                        return stream.getColorDepth() >= minimum;
                    };
                    stream.clearLine = function(dir, cb) { if (typeof cb === 'function') cb(null); return true; };
                    stream.clearScreenDown = function(cb) { if (typeof cb === 'function') cb(null); return true; };
                    stream.cursorTo = function(x, y, cb) { if (typeof cb === 'function') cb(null); return true; };
                    stream.moveCursor = function(dx, dy, cb) { if (typeof cb === 'function') cb(null); return true; };
                }

                applyReadStreamShape(process.stdin, 0);
                applyWriteStreamShape(process.stdout, 1);
                applyWriteStreamShape(process.stderr, 2);
            })();
            """
        )
    }

    private static func isATTY(fileDescriptor: Int32) -> Bool {
        #if canImport(Darwin)
        Darwin.isatty(fileDescriptor) == 1
        #else
        false
        #endif
    }

    private static func windowSize(fileDescriptor: Int32) -> (columns: Int, rows: Int)? {
        #if canImport(Darwin)
        guard isATTY(fileDescriptor: fileDescriptor) else {
            return nil
        }

        var size = winsize()
        let result = ioctl(fileDescriptor, TIOCGWINSZ, &size)
        guard result == 0, size.ws_col > 0, size.ws_row > 0 else {
            return nil
        }
        return (Int(size.ws_col), Int(size.ws_row))
        #else
        nil
        #endif
    }

    private static let ttyState = Mutex<[Int32: termios]>([:])

    private static func setRawMode(fileDescriptor: Int32, enabled: Bool) -> Bool {
        #if canImport(Darwin)
        guard isATTY(fileDescriptor: fileDescriptor) else {
            return false
        }

        var attributes = termios()
        guard tcgetattr(fileDescriptor, &attributes) == 0 else {
            return false
        }

        if enabled {
            ttyState.withLock { state in
                if state[fileDescriptor] == nil {
                    state[fileDescriptor] = attributes
                }
            }
            cfmakeraw(&attributes)
            return tcsetattr(fileDescriptor, TCSAFLUSH, &attributes) == 0 ? true : false
        }

        let original = ttyState.withLock { state in
            state.removeValue(forKey: fileDescriptor)
        }
        guard var original else {
            return false
        }
        return tcsetattr(fileDescriptor, TCSAFLUSH, &original) == 0 ? false : true
        #else
        false
        #endif
    }

    private func installProcessDiagnosticsBridge(in ctx: JSContext) {
        let activeHandlesBlock: @convention(block) () -> [String] = { [handleRegistry] in
            handleRegistry.activeHandleLabels()
        }
        ctx.setObject(activeHandlesBlock, forKeyedSubscript: "__swiftBunActiveHandles" as NSString)
    }

    // MARK: - Async Bridge

    private func installAsyncBridge(in ctx: JSContext) throws {
        let resolveBlock: @convention(block) (Int32, JSValue) -> Void = { [self] token, value in
            self.handleRegistry.resolveAsyncWait(token: token, result: JSResult(from: value))
        }
        ctx.setObject(resolveBlock, forKeyedSubscript: "__swiftResolveAsyncResult" as NSString)

        let rejectBlock: @convention(block) (Int32, JSValue) -> Void = { [self] token, value in
            let message = value.objectForKeyedSubscript("message")?.toString() ?? value.toString() ?? "Unknown JS error"
            self.handleRegistry.failAsyncWait(
                token: token,
                error: BunRuntimeError.javaScriptException(message)
            )
        }
        ctx.setObject(rejectBlock, forKeyedSubscript: "__swiftRejectAsyncResult" as NSString)

        let startupSettledBlock: @convention(block) () -> Void = { [self] in
            self.executor.preconditionInExecutor()
            if let token = self.startupPromiseVisibleHandle {
                self.lifecycle.releaseVisibleHandle(token)
                self.startupPromiseVisibleHandle = nil
            }
            self.evaluateExitCondition()
        }
        ctx.setObject(startupSettledBlock, forKeyedSubscript: "__swiftStartupPromiseSettled" as NSString)

        let postTurnCheckpointBlock: @convention(block) () -> Void = { [self] in
            self.executor.preconditionInExecutor()
            self.evaluateExitCondition()
        }
        ctx.setObject(postTurnCheckpointBlock, forKeyedSubscript: "__swiftPostTurnCheckpoint" as NSString)

        try JavaScriptResource.evaluate(.runtime(.asyncBridge), in: ctx)
    }

    // MARK: - Timer Bridge

    private func installTimerBridge(in ctx: JSContext) throws {
        executor.preconditionInExecutor()

        let nextTickBlock: @convention(block) (JSValue, JSValue) -> Void = { [self] callback, argsArray in
            let args = self.extractArgs(argsArray)
            self.scheduler.enqueueNextTick {
                callback.call(withArguments: args)
                self.reportPendingJavaScriptException(source: "nextTick")
            }
        }
        ctx.setObject(nextTickBlock, forKeyedSubscript: "__nativeNextTick" as NSString)

        let drainNextTickBlock: @convention(block) () -> Void = { [self] in
            self.scheduler.drainNextTicksNow(reason: "microtask", maxItems: 64)
        }
        ctx.setObject(drainNextTickBlock, forKeyedSubscript: "__drainNextTickQueue" as NSString)

        let setTimeoutBlock: @convention(block) (JSValue, JSValue, JSValue) -> Int32 = { [self] callback, delay, argsArray in
            let delayMs = delay.isUndefined ? 0 : max(0, Int64(delay.toInt32()))
            let args = self.extractArgs(argsArray)
            let timerID = self.handleRegistry.makeIdentifier()
            let visibleHandle = self.lifecycle.acquireVisibleHandle(kind: "setTimeout")

            let scheduled = self.nativeRuntime.scheduleTimer(after: delayMs, source: "setTimeout") {
                self.handleTimerFired(id: timerID)
            }
            let handle = RuntimeHandleRegistry.TimerHandle(
                scheduled: scheduled,
                callback: callback,
                args: args,
                repeating: false,
                intervalMs: delayMs,
                isRefed: true,
                visibleHandleToken: visibleHandle
            )
            _ = self.handleRegistry.insertTimer(handle, id: timerID)
            return timerID
        }
        ctx.setObject(setTimeoutBlock, forKeyedSubscript: "__nativeSetTimeout" as NSString)

        let clearTimeoutBlock: @convention(block) (Int32) -> Void = { [self] timerID in
            if let timer = self.handleRegistry.removeTimer(id: timerID) {
                timer.scheduled.cancel()
                if let visibleHandle = timer.visibleHandleToken {
                    self.lifecycle.releaseVisibleHandle(visibleHandle)
                }
                self.evaluateExitCondition()
            }
        }
        ctx.setObject(clearTimeoutBlock, forKeyedSubscript: "__nativeClearTimeout" as NSString)

        let setIntervalBlock: @convention(block) (JSValue, JSValue, JSValue) -> Int32 = { [self] callback, delay, argsArray in
            let delayMs = max(1, Int64(delay.toInt32()))
            let args = self.extractArgs(argsArray)
            let timerID = self.handleRegistry.makeIdentifier()
            let visibleHandle = self.lifecycle.acquireVisibleHandle(kind: "setInterval")

            let scheduled = self.nativeRuntime.scheduleTimer(after: delayMs, source: "setInterval") {
                self.handleTimerFired(id: timerID)
            }
            let handle = RuntimeHandleRegistry.TimerHandle(
                scheduled: scheduled,
                callback: callback,
                args: args,
                repeating: true,
                intervalMs: delayMs,
                isRefed: true,
                visibleHandleToken: visibleHandle
            )
            _ = self.handleRegistry.insertTimer(handle, id: timerID)
            return timerID
        }
        ctx.setObject(setIntervalBlock, forKeyedSubscript: "__nativeSetInterval" as NSString)

        let timerRefBlock: @convention(block) (Int32) -> Void = { [self] timerID in
            guard let timer = self.handleRegistry.timer(id: timerID), !timer.isRefed else { return }
            self.handleRegistry.updateTimerRef(id: timerID, isRefed: true)
            let visibleHandle = self.lifecycle.acquireVisibleHandle(kind: timer.repeating ? "setInterval" : "setTimeout")
            self.handleRegistry.updateTimerVisibleHandleToken(id: timerID, token: visibleHandle)
        }
        ctx.setObject(timerRefBlock, forKeyedSubscript: "__nativeTimerRef" as NSString)

        let timerUnrefBlock: @convention(block) (Int32) -> Void = { [self] timerID in
            guard let timer = self.handleRegistry.timer(id: timerID), timer.isRefed else { return }
            self.handleRegistry.updateTimerRef(id: timerID, isRefed: false)
            if let visibleHandle = timer.visibleHandleToken {
                self.lifecycle.releaseVisibleHandle(visibleHandle)
                self.handleRegistry.updateTimerVisibleHandleToken(id: timerID, token: nil)
            }
            self.evaluateExitCondition()
        }
        ctx.setObject(timerUnrefBlock, forKeyedSubscript: "__nativeTimerUnref" as NSString)

        let timerHasRefBlock: @convention(block) (Int32) -> Bool = { [self] timerID in
            self.handleRegistry.timer(id: timerID)?.isRefed ?? false
        }
        ctx.setObject(timerHasRefBlock, forKeyedSubscript: "__nativeTimerHasRef" as NSString)

        try JavaScriptResource.evaluate(.runtime(.timerBridge), in: ctx)
    }

    private func handleTimerFired(id: Int32) {
        executor.preconditionInExecutor()
        guard let timer = handleRegistry.timer(id: id) else { return }

        if !timer.repeating {
            _ = handleRegistry.removeTimer(id: id)
        }

        timer.callback.call(withArguments: timer.args)
        reportPendingJavaScriptException(source: timer.repeating ? "setInterval" : "setTimeout")

        if timer.repeating {
            guard handleRegistry.timer(id: id) != nil else { return }
            let scheduled = nativeRuntime.scheduleTimer(after: timer.intervalMs, source: "setInterval") {
                self.handleTimerFired(id: id)
            }
            handleRegistry.updateTimerScheduled(id: id, scheduled: scheduled)
            return
        }

        if let visibleHandle = timer.visibleHandleToken {
            lifecycle.releaseVisibleHandle(visibleHandle)
        }
        evaluateExitCondition()
    }

    private func patchTimerModuleReferences(in ctx: JSContext) throws {
        try JavaScriptResource.evaluate(.runtime(.patchTimerModuleReferences), in: ctx)
    }

    // MARK: - Fetch Bridge

    private func installFetchBridge(in ctx: JSContext) {
        executor.preconditionInExecutor()

        let fetchBlock: @convention(block) (String, String, JSValue, JSValue, JSValue, JSValue) -> Int32 = { [self] urlString, optionsJSON, headersCallback, chunkCallback, completeCallback, errorCallback in
            guard let url = URL(string: urlString) else {
                errorCallback.call(withArguments: ["Invalid URL: \(urlString)"])
                return 0
            }

            var request = URLRequest(url: url)
            if let data = optionsJSON.data(using: .utf8) {
                do {
                    let jsonObject = try JSONSerialization.jsonObject(with: data)
                    if let options = jsonObject as? [String: Any] {
                        request.httpMethod = (options["method"] as? String)?.uppercased() ?? "GET"
                        if let headers = options["headers"] as? [String: Any] {
                            for (key, value) in headers {
                                request.setValue("\(value)", forHTTPHeaderField: key)
                            }
                        }
                        if let body = options["body"] as? String {
                            request.httpBody = body.data(using: .utf8)
                        }
                        if let signal = options["signal"] as? [String: Any],
                           let timeout = signal["timeout"] as? Double {
                            request.timeoutInterval = timeout / 1000.0
                        }
                    }
                } catch {}
            }

            let operationID = self.handleRegistry.makeIdentifier()
            _ = self.handleRegistry.insertFetch(
                headersCallback: headersCallback,
                chunkCallback: chunkCallback,
                completeCallback: completeCallback,
                errorCallback: errorCallback,
                isRefed: true,
                visibleHandleToken: self.lifecycle.acquireVisibleHandle(kind: "fetch"),
                id: operationID
            )

            _ = self.nativeRuntime.startFetch(
                operationID: operationID,
                request: request,
                urlString: urlString
            ) { event in
                self.applyFetchEvent(event)
            }
            return operationID
        }
        ctx.setObject(fetchBlock, forKeyedSubscript: "__nativeFetchStream" as NSString)

        let cancelFetchBlock: @convention(block) (Int32) -> Void = { [self] operationID in
            self.nativeRuntime.cancelFetch(operationID: operationID)
        }
        ctx.setObject(cancelFetchBlock, forKeyedSubscript: "__cancelFetch" as NSString)
    }

    private func installSocketBridge(in ctx: JSContext) {
        let dispatchEvent: @Sendable ([String: Any]) -> Void = { [self] payload in
            self.scheduler.enqueueHostCallback(source: "net:event") {
                guard let ctx = self.executor.context,
                      let dispatcher = ctx.objectForKeyedSubscript("__swiftBunNetDispatch"),
                      !dispatcher.isUndefined else {
                    return
                }
                _ = dispatcher.call(withArguments: [payload])
                self.reportPendingJavaScriptException(source: "netDispatch")
            }
        }

        let listenBlock: @convention(block) (Int32, String, Int32, Int32) -> Void = { [socketRuntime] serverID, host, port, backlog in
            socketRuntime.listen(
                serverID: serverID,
                host: host,
                port: Int(port),
                backlog: Int(backlog),
                callback: dispatchEvent
            )
        }
        ctx.setObject(listenBlock, forKeyedSubscript: "__netListen" as NSString)

        let closeServerBlock: @convention(block) (Int32) -> Void = { [socketRuntime] serverID in
            socketRuntime.closeServer(id: serverID)
        }
        ctx.setObject(closeServerBlock, forKeyedSubscript: "__netCloseServer" as NSString)

        let connectBlock: @convention(block) (Int32, String, Int32) -> Void = { [socketRuntime] socketID, host, port in
            socketRuntime.connect(socketID: socketID, host: host, port: Int(port), callback: dispatchEvent)
        }
        ctx.setObject(connectBlock, forKeyedSubscript: "__netConnect" as NSString)

        let writeBlock: @convention(block) (Int32, [UInt8]) -> Void = { [socketRuntime] socketID, bytes in
            socketRuntime.write(socketID: socketID, bytes: bytes)
        }
        ctx.setObject(writeBlock, forKeyedSubscript: "__netWrite" as NSString)

        let endBlock: @convention(block) (Int32, JSValue?) -> Void = { [socketRuntime] socketID, maybeBytes in
            let bytes = maybeBytes?.toArray()?.compactMap { value -> UInt8? in
                if let number = value as? NSNumber {
                    return UInt8(truncating: number)
                }
                if let intValue = value as? Int {
                    return UInt8(truncatingIfNeeded: intValue)
                }
                return nil
            }
            socketRuntime.end(socketID: socketID, bytes: bytes)
        }
        ctx.setObject(endBlock, forKeyedSubscript: "__netEnd" as NSString)

        let destroyBlock: @convention(block) (Int32) -> Void = { [socketRuntime] socketID in
            socketRuntime.destroy(socketID: socketID)
        }
        ctx.setObject(destroyBlock, forKeyedSubscript: "__netDestroy" as NSString)
    }

    private func installDNSBridge(in ctx: JSContext) {
        let dispatchEvent: @Sendable ([String: Any]) -> Void = { [self] payload in
            self.scheduler.enqueueHostCallback(source: "dns.lookup") {
                guard let ctx = self.executor.context,
                      let dispatcher = ctx.objectForKeyedSubscript("__swiftBunDNSDispatch"),
                      !dispatcher.isUndefined else {
                    return
                }
                _ = dispatcher.call(withArguments: [payload])
                self.reportPendingJavaScriptException(source: "dnsDispatch")
            }
        }

        let lookupAsyncBlock: @convention(block) (String, Int32, Int32) -> Void = { host, family, requestID in
            Task {
                do {
                    let results = try NodeStubs.lookupAddresses(for: host, family: family == 0 ? nil : Int(family))
                    guard let result = results.first else {
                        throw NSError(
                            domain: NSPOSIXErrorDomain,
                            code: Int(EAI_NONAME),
                            userInfo: [NSLocalizedDescriptionKey: "No usable address found for \(host)"]
                        )
                    }
                    dispatchEvent([
                        "requestID": Int(requestID),
                        "address": result.address,
                        "family": result.family,
                        "addresses": results.map { ["address": $0.address, "family": $0.family] },
                    ])
                } catch {
                    dispatchEvent([
                        "requestID": Int(requestID),
                        "error": "\(error)",
                    ])
                }
            }
        }
        ctx.setObject(lookupAsyncBlock, forKeyedSubscript: "__dnsLookupAsync" as NSString)
    }

    private func installHTTPServerBridge(in ctx: JSContext) {
        let dispatchEvent: @Sendable ([String: Any]) -> Void = { [self] payload in
            self.scheduler.enqueueHostCallback(source: "http:event") {
                guard let ctx = self.executor.context,
                      let dispatcher = ctx.objectForKeyedSubscript("__swiftBunHTTPDispatch"),
                      !dispatcher.isUndefined else {
                    return
                }
                _ = dispatcher.call(withArguments: [payload])
                self.reportPendingJavaScriptException(source: "httpDispatch")
            }
        }

        let listenBlock: @convention(block) (Int32, String, Int32, Int32) -> Void = { [httpServerRuntime] serverID, host, port, backlog in
            httpServerRuntime.listen(
                serverID: serverID,
                host: host,
                port: Int(port),
                backlog: Int(backlog),
                callback: dispatchEvent
            )
        }
        ctx.setObject(listenBlock, forKeyedSubscript: "__httpListen" as NSString)

        let closeServerBlock: @convention(block) (Int32) -> Void = { [httpServerRuntime] serverID in
            httpServerRuntime.closeServer(id: serverID)
        }
        ctx.setObject(closeServerBlock, forKeyedSubscript: "__httpCloseServer" as NSString)

        let respondBlock: @convention(block) (Int32, Int32, String, [UInt8]) -> Void = { [httpServerRuntime] requestID, statusCode, headerJSON, body in
            let headers: [String: String]
            if let data = headerJSON.data(using: .utf8) {
                do {
                    headers = try JSONSerialization.jsonObject(with: data) as? [String: String] ?? [:]
                } catch {
                    headers = [:]
                }
            } else {
                headers = [:]
            }
            httpServerRuntime.respond(requestID: requestID, statusCode: Int(statusCode), headers: headers, body: body)
        }
        ctx.setObject(respondBlock, forKeyedSubscript: "__httpRespond" as NSString)
    }

    private func installWebSocketBridge(in ctx: JSContext) throws {
        let dispatchEvent: @Sendable ([String: Any]) -> Void = { [self] payload in
            self.scheduler.enqueueHostCallback(source: "websocket:event") {
                guard let ctx = self.executor.context,
                      let dispatcher = ctx.objectForKeyedSubscript("__swiftBunWebSocketDispatch"),
                      !dispatcher.isUndefined else {
                    return
                }
                _ = dispatcher.call(withArguments: [payload])
                self.reportPendingJavaScriptException(source: "webSocketDispatch")
            }
        }

        let connectBlock: @convention(block) (Int32, String, String, String) -> Void = { [webSocketRuntime] socketID, urlString, protocolsJSON, headersJSON in
            let protocols = Self.decodeStringArrayJSON(protocolsJSON)
            let headers = Self.decodeStringDictionaryJSON(headersJSON)
            Task {
                await webSocketRuntime.connect(
                    socketID: socketID,
                    urlString: urlString,
                    protocols: protocols,
                    headers: headers,
                    callback: dispatchEvent
                )
            }
        }
        ctx.setObject(connectBlock, forKeyedSubscript: "__nativeWebSocketConnect" as NSString)

        let sendTextBlock: @convention(block) (Int32, String) -> Void = { [webSocketRuntime] socketID, text in
            Task {
                await webSocketRuntime.sendText(socketID: socketID, text: text)
            }
        }
        ctx.setObject(sendTextBlock, forKeyedSubscript: "__nativeWebSocketSendText" as NSString)

        let sendBinaryBlock: @convention(block) (Int32, [UInt8]) -> Void = { [webSocketRuntime] socketID, bytes in
            Task {
                await webSocketRuntime.sendBinary(socketID: socketID, bytes: bytes)
            }
        }
        ctx.setObject(sendBinaryBlock, forKeyedSubscript: "__nativeWebSocketSendBinary" as NSString)

        let closeBlock: @convention(block) (Int32, Int32, String) -> Void = { [webSocketRuntime] socketID, code, reason in
            Task {
                await webSocketRuntime.close(socketID: socketID, code: code, reason: reason)
            }
        }
        ctx.setObject(closeBlock, forKeyedSubscript: "__nativeWebSocketClose" as NSString)

        let pingBlock: @convention(block) (Int32) -> Void = { [webSocketRuntime] socketID in
            Task {
                await webSocketRuntime.ping(socketID: socketID)
            }
        }
        ctx.setObject(pingBlock, forKeyedSubscript: "__nativeWebSocketPing" as NSString)

        try JavaScriptResource.evaluate(.runtime(.webSocketBridge), in: ctx)
    }

    private func applyFetchEvent(_ event: NativeRuntime.FetchEvent) {
        executor.preconditionInExecutor()

        switch event {
        case .failure(let operationID, let message):
            guard let fetch = handleRegistry.removeFetch(id: operationID) else { return }
            fetch.errorCallback.call(withArguments: [message])
            if let visibleHandle = fetch.visibleHandleToken {
                lifecycle.releaseVisibleHandle(visibleHandle)
            }

        case .headers(let headers):
            guard let fetch = handleRegistry.fetch(id: headers.operationID) else { return }
            fetch.headersCallback.call(withArguments: [
                headers.statusCode,
                headers.responseURL,
                headers.headerJSON,
            ])

        case .chunk(let operationID, let bytes):
            guard let fetch = handleRegistry.fetch(id: operationID) else { return }
            fetch.chunkCallback.call(withArguments: [bytes])

        case .complete(let operationID):
            guard let fetch = handleRegistry.removeFetch(id: operationID) else { return }
            fetch.completeCallback.call(withArguments: [])
            if let visibleHandle = fetch.visibleHandleToken {
                lifecycle.releaseVisibleHandle(visibleHandle)
            }
        }

        reportPendingJavaScriptException(source: "fetchEvent")
        switch event {
        case .failure, .complete:
            evaluateExitCondition()
        case .headers, .chunk:
            break
        }
    }

    private static func decodeStringArrayJSON(_ json: String) -> [String] {
        guard let data = json.data(using: .utf8) else {
            return []
        }
        do {
            let decoded = try JSONSerialization.jsonObject(with: data) as? [Any] ?? []
            return decoded.map { String(describing: $0) }
        } catch {
            return []
        }
    }

    private static func decodeStringDictionaryJSON(_ json: String) -> [String: String] {
        guard let data = json.data(using: .utf8) else {
            return [:]
        }
        do {
            let decoded = try JSONSerialization.jsonObject(with: data) as? [String: Any] ?? [:]
            var headers: [String: String] = [:]
            for (key, value) in decoded {
                headers[key] = String(describing: value)
            }
            return headers
        } catch {
            return [:]
        }
    }

    // MARK: - process.exit Bridge

    private func installProcessExitBridge(in ctx: JSContext) throws {
        let exitBlock: @convention(block) (JSValue) -> Void = { [self] codeValue in
            let code: Int32 = codeValue.isUndefined ? 0 : codeValue.toInt32()
            self.requestExit(code: code)
        }
        ctx.setObject(exitBlock, forKeyedSubscript: "__processExit" as NSString)

        try JavaScriptResource.evaluate(.runtime(.processExit), in: ctx)
    }

    // MARK: - stdin Bridge

    private func installStdinBridge(in ctx: JSContext) {
        let stdinRefBlock: @convention(block) () -> Void = { [self] in
            if self.handleRegistry.setStdinRefed(true) {
                let visibleHandle = self.lifecycle.acquireVisibleHandle(kind: "stdin")
                self.handleRegistry.setStdinVisibleHandleToken(visibleHandle)
            }
            self.requestPendingStdinDrainIfReady()
        }
        let stdinUnrefBlock: @convention(block) () -> Void = { [self] in
            if self.handleRegistry.setStdinRefed(false) {
                if let visibleHandle = self.handleRegistry.currentStdinVisibleHandleToken {
                    self.lifecycle.releaseVisibleHandle(visibleHandle)
                    self.handleRegistry.setStdinVisibleHandleToken(nil)
                }
                self.evaluateExitCondition()
            }
        }
        ctx.setObject(stdinRefBlock, forKeyedSubscript: "__stdinRef" as NSString)
        ctx.setObject(stdinUnrefBlock, forKeyedSubscript: "__stdinUnref" as NSString)
    }

    private func requestPendingStdinDrainIfReady() {
        guard lifecycle.currentState == .running else {
            return
        }

        let shouldSchedule = pendingStdinState.withLock { state in
            guard state.queue.isEmpty == false, state.drainScheduled == false else {
                return false
            }
            state.drainScheduled = true
            return true
        }
        guard shouldSchedule else {
            return
        }
        guard handleRegistry.isStdinRefed else {
            pendingStdinState.withLock { $0.drainScheduled = false }
            return
        }

        scheduler.enqueueHostCallback(source: "stdin") {
            self.drainPendingStdin()
        }
    }

    private func drainPendingStdin() {
        executor.preconditionInExecutor()

        while true {
            let next = pendingStdinState.withLock { state -> Data?? in
                if state.queue.isEmpty {
                    state.drainScheduled = false
                    return nil
                }
                return state.queue.removeFirst()
            }

            guard let next else {
                releasePendingStdinVisibleHandleIfNeeded()
                requestPendingStdinDrainIfReady()
                return
            }

            deliverStdin(next)
        }
    }

    private func ensurePendingStdinVisibleHandleIfNeeded() {
        let hasPendingStdin = pendingStdinState.withLock { state in
            state.queue.isEmpty == false
        }
        guard hasPendingStdin else {
            return
        }
        guard pendingStdinVisibleHandle == nil else {
            return
        }

        switch lifecycle.currentState {
        case .booting, .running, .exitRequested:
            pendingStdinVisibleHandle = lifecycle.acquireVisibleHandle(kind: "pendingStdin")
        case .idle, .shuttingDown, .exited:
            return
        }
    }

    private func releasePendingStdinVisibleHandleIfNeeded() {
        let hasPendingStdin = pendingStdinState.withLock { state in
            state.queue.isEmpty == false
        }
        guard hasPendingStdin == false else {
            return
        }
        guard let token = pendingStdinVisibleHandle else {
            return
        }
        lifecycle.releaseVisibleHandle(token)
        pendingStdinVisibleHandle = nil
    }

    private func deliverStdin(_ data: Data?) {
        executor.preconditionInExecutor()
        guard let ctx = executor.context else { return }
        guard let deliver = ctx.objectForKeyedSubscript("__deliverStdinData"), !deliver.isUndefined else { return }

        if let data {
            let string = String(data: data, encoding: .utf8) ?? ""
            _ = deliver.call(withArguments: [string])
        } else {
            _ = deliver.call(withArguments: [NSNull()])
        }
        reportPendingJavaScriptException(source: "deliverStdin")
    }
}
