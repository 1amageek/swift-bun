@preconcurrency import JavaScriptCore
import Foundation
import NIOCore
import Synchronization

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

    // MARK: - Runtime Components

    private let executor: JavaScriptExecutor
    private let lifecycle: LifecycleController
    private let handleRegistry: RuntimeHandleRegistry
    private let scheduler: HostScheduler
    private let nativeRuntime: NativeRuntime
    private let fileSystemAsyncBridge: FileSystemAsyncBridge

    // MARK: - Process State

    private nonisolated(unsafe) var exitPromise: AsyncResultBox<Int32>?
    private nonisolated(unsafe) var runStartupBarrier: LifecycleController.BootBarrierToken?
    private nonisolated(unsafe) var startupPromiseVisibleHandle: LifecycleController.VisibleHandleToken?
    private nonisolated(unsafe) var streamsFinished = false
    private let shutdownState = Mutex<ShutdownState>(.active)

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
        environment: [String: String] = [:]
    ) {
        self.bundle = bundle
        self.arguments = arguments
        self.cwd = cwd
        self.environment = environment

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
                }
            },
            log: logger
        )

        self.executor = executor
        self.lifecycle = lifecycle
        self.handleRegistry = handleRegistry
        self.scheduler = scheduler
        self.nativeRuntime = nativeRuntime
        self.fileSystemAsyncBridge = fileSystemAsyncBridge

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
        scheduler.enqueueHostCallback(source: "stdin") {
            self.deliverStdin(data)
        }
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

        let resolver = ESMResolver(
            fileSystemAsyncBridge: fileSystemAsyncBridge,
            environment: runtimeEnvironment,
            cwd: cwd
        )
        try resolver.installModules(into: ctx)
        try throwPendingJavaScriptException(source: "setup:installModules")
        installConsoleBridge(in: ctx)
        try throwPendingJavaScriptException(source: "setup:consoleBridge")
        installStdioBridges(in: ctx)
        try throwPendingJavaScriptException(source: "setup:stdioBridges")
        try installAsyncBridge(in: ctx)
        try throwPendingJavaScriptException(source: "setup:asyncBridge")
        try installTimerBridge(in: ctx)
        try throwPendingJavaScriptException(source: "setup:timerBridge")
        installFetchBridge(in: ctx)
        try throwPendingJavaScriptException(source: "setup:fetchBridge")
        try installProcessExitBridge(in: ctx)
        try throwPendingJavaScriptException(source: "setup:processExitBridge")
        installStdinBridge(in: ctx)
        try throwPendingJavaScriptException(source: "setup:stdinBridge")
        try patchTimerModuleReferences(in: ctx)
        try throwPendingJavaScriptException(source: "setup:patchTimerRefs")
        try resolver.installRequire(into: ctx)
        try throwPendingJavaScriptException(source: "setup:installRequire")

        if let bundle {
            let argvElements = (["node", bundle.path] + arguments)
                .map { "'\(escapeJS($0))'" }
                .joined(separator: ",")
            ctx.evaluateScript("process.argv = [\(argvElements)];")
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
        var merged = ProcessInfo.processInfo.environment
        for (key, value) in environment {
            merged[key] = value
        }
        return merged
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
        let result = ctx.evaluateScript(source, withSourceURL: bundle)
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

        if let stdinToken = handleRegistry.currentStdinVisibleHandleToken {
            lifecycle.releaseVisibleHandle(stdinToken)
            handleRegistry.setStdinVisibleHandleToken(nil)
        }
        if let startupToken = startupPromiseVisibleHandle {
            lifecycle.releaseVisibleHandle(startupToken)
            startupPromiseVisibleHandle = nil
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

    private func escapeJS(_ string: String) -> String {
        string
            .replacingOccurrences(of: "\\", with: "\\\\")
            .replacingOccurrences(of: "'", with: "\\'")
            .replacingOccurrences(of: "\n", with: "\\n")
            .replacingOccurrences(of: "\r", with: "\\r")
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

        let fetchBlock: @convention(block) (String, String, JSValue, JSValue) -> Void = { [self] urlString, optionsJSON, resolveCallback, rejectCallback in
            guard let url = URL(string: urlString) else {
                rejectCallback.call(withArguments: ["Invalid URL: \(urlString)"])
                return
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
                resolve: resolveCallback,
                reject: rejectCallback,
                isRefed: true,
                visibleHandleToken: self.lifecycle.acquireVisibleHandle(kind: "fetch"),
                id: operationID
            )

            self.nativeRuntime.startFetch(
                operationID: operationID,
                request: request,
                urlString: urlString
            ) { completion in
                self.applyFetchCompletion(completion)
            }
        }
        ctx.setObject(fetchBlock, forKeyedSubscript: "__nativeFetch" as NSString)
    }

    private func applyFetchCompletion(_ completion: NativeRuntime.FetchCompletion) {
        executor.preconditionInExecutor()

        switch completion {
        case .failure(let operationID, let message):
            guard let fetch = handleRegistry.removeFetch(id: operationID) else { return }
            fetch.reject.call(withArguments: [message])
            if let visibleHandle = fetch.visibleHandleToken {
                lifecycle.releaseVisibleHandle(visibleHandle)
            }

        case .success(let success):
            guard let fetch = handleRegistry.removeFetch(id: success.operationID) else { return }
            fetch.resolve.call(withArguments: [
                success.statusCode,
                success.responseURL,
                success.headerJSON,
                success.body,
            ])
            if let visibleHandle = fetch.visibleHandleToken {
                lifecycle.releaseVisibleHandle(visibleHandle)
            }
        }

        reportPendingJavaScriptException(source: "fetchCompletion")
        evaluateExitCondition()
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
