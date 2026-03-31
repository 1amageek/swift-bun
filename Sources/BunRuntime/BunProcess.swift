@preconcurrency import JavaScriptCore
import Foundation
import NIOCore
import NIOPosix

/// A JavaScript execution context backed by a NIO EventLoop.
///
/// All JSContext access happens on a dedicated EventLoop thread,
/// guaranteeing thread safety. The EventLoop drives timers, fetch callbacks,
/// and stdin delivery — enabling both library-style function calls and
/// long-running process execution.
///
/// Configuration is provided at initialization. `load()` and `run()` are
/// mutually exclusive on a single instance.
///
/// ## Process mode
///
/// ```swift
/// let process = BunProcess(
///     bundle: cliJS,
///     arguments: ["-p", "--input-format", "stream-json"],
///     cwd: "/path/to/project",
///     environment: ["HOME": NSHomeDirectory()]
/// )
/// Task { for await data in process.stdout { parse(data) } }
/// let exitCode = try await process.run()
/// ```
///
/// ## Library mode
///
/// ```swift
/// let runtime = BunProcess(bundle: myLib)
/// try await runtime.load()
/// let result = try await runtime.evaluate(js: "myFunction()")
/// ```
public final class BunProcess: Sendable {

    // MARK: - Configuration (immutable, set at init)

    private let bundle: URL?
    private let arguments: [String]
    private let cwd: String?
    private let environment: [String: String]

    // MARK: - EventLoop

    private let eventLoopGroup: MultiThreadedEventLoopGroup
    private let eventLoop: EventLoop

    // MARK: - EventLoop-thread state

    private nonisolated(unsafe) var jsContext: JSContext?
    private nonisolated(unsafe) var refCount: Int = 0
    private nonisolated(unsafe) var exitPromise: EventLoopPromise<Int32>?
    private nonisolated(unsafe) var nextTimerID: Int32 = 1
    private nonisolated(unsafe) var activeTimers: [Int32: TimerState] = [:]
    private nonisolated(unsafe) var stdinValue: JSValue?
    private nonisolated(unsafe) var state: State = .idle

    private struct TimerState {
        var scheduled: Scheduled<Void>
        var isRefed: Bool
    }

    private enum State {
        case idle
        case loaded
        case running
        case exited
    }

    // MARK: - Streams

    /// Data written to `process.stdout.write()` from JS.
    /// Application data channel (e.g. NDJSON protocol messages).
    public let stdout: AsyncStream<String>
    private let stdoutContinuation: AsyncStream<String>.Continuation

    /// Diagnostic output from JS (`console.log`, `console.error`, etc.).
    public let output: AsyncStream<String>
    private let outputContinuation: AsyncStream<String>.Continuation

    // MARK: - Init

    /// Create a JavaScript process with the given configuration.
    ///
    /// - Parameters:
    ///   - bundle: URL to the `.js` bundle file. Required for `run()`, optional for `load()`.
    ///   - arguments: Command-line arguments (excluding node/script path).
    ///     `process.argv` is set to `["node", bundlePath, ...arguments]`.
    ///   - cwd: Working directory for `process.cwd()`. Defaults to `"/"`.
    ///   - environment: Environment variables for `process.env`.
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

        self.eventLoopGroup = MultiThreadedEventLoopGroup(numberOfThreads: 1)
        self.eventLoop = eventLoopGroup.next()
    }

    deinit {
        stdoutContinuation.finish()
        outputContinuation.finish()
        try? eventLoopGroup.syncShutdownGracefully()
    }

    // MARK: - Public API

    /// Load the bundle for library-style usage.
    ///
    /// If no bundle was specified at init, creates a bare context with polyfills.
    /// After loading, call `evaluate(js:)` or `call()` to execute code.
    public func load() async throws {
        try await eventLoop.submit {
            precondition(self.state == .idle, "BunProcess already started. Use a new instance.")
            try self.setupContext()
            self.state = .loaded
        }.get()
    }

    /// Evaluate JavaScript and return the result.
    ///
    /// Must be called after `load()`. Cannot be called after `run()` exits.
    @discardableResult
    public func evaluate(js source: String) async throws -> JSResult {
        try await eventLoop.submit {
            self.eventLoop.preconditionInEventLoop()
            guard self.state == .loaded, let ctx = self.jsContext else {
                throw BunRuntimeError.contextNotReady
            }
            let result = ctx.evaluateScript(source)
            try self.checkException()
            return JSResult(from: result)
        }.get()
    }

    /// Call a global JavaScript function by name.
    ///
    /// Must be called after `load()`. Cannot be called after `run()` exits.
    @discardableResult
    public func call(_ function: String, arguments: [Any] = []) async throws -> JSResult {
        try await eventLoop.submit {
            self.eventLoop.preconditionInEventLoop()
            guard self.state == .loaded, let ctx = self.jsContext else {
                throw BunRuntimeError.contextNotReady
            }
            guard let fn = ctx.objectForKeyedSubscript(function),
                  !fn.isUndefined else {
                throw BunRuntimeError.functionNotFound(function)
            }
            let result = fn.call(withArguments: arguments)
            try self.checkException()
            return JSResult(from: result)
        }.get()
    }

    /// Run the bundle as a long-lived process.
    ///
    /// Returns when `process.exit(code)` is called or all pending work completes.
    /// Requires a bundle to be specified at init.
    public func run() async throws -> Int32 {
        let promise = eventLoop.makePromise(of: Int32.self)

        eventLoop.execute {
            do {
                precondition(self.state == .idle, "BunProcess already started. Use a new instance.")
                guard self.bundle != nil else {
                    throw BunRuntimeError.bundleNotFound(URL(fileURLWithPath: "<none>"))
                }
                self.exitPromise = promise
                self.state = .running
                try self.setupContext()
                self.scheduleExitCheck(source: "initial")
            } catch {
                self.state = .exited
                self.exitPromise = nil
                promise.fail(error)
            }
        }

        return try await promise.futureResult.get()
    }

    /// Send data to the process's stdin. Pass `nil` to signal EOF.
    public func sendInput(_ data: Data?) {
        eventLoop.execute {
            self.deliverStdin(data)
        }
    }

    /// Terminate the process.
    public func terminate(exitCode: Int32 = 0) {
        eventLoop.execute {
            self.doExit(code: exitCode)
        }
    }

    // MARK: - Context Setup

    private func setupContext() throws {
        eventLoop.preconditionInEventLoop()

        guard let ctx = JSContext() else {
            throw BunRuntimeError.contextCreationFailed
        }
        self.jsContext = ctx

        // Install Web API polyfills (ReadableStream, Event, etc.)
        // Must come before ESMResolver since Node.js polyfills may depend on Web APIs.
        outputContinuation.yield("[bun:setup] step 0: webAPIPolyfills")
        installWebAPIPolyfills(in: ctx)

        // Install Node.js polyfills
        outputContinuation.yield("[bun:setup] step 1: installModules")
        ESMResolver.installModules(in: ctx)
        outputContinuation.yield("[bun:setup] step 2: consoleBridge")
        installConsoleBridge(in: ctx)
        outputContinuation.yield("[bun:setup] step 3: stdioBridges")
        installStdioBridges(in: ctx)
        outputContinuation.yield("[bun:setup] step 4: timerBridge")
        installTimerBridge(in: ctx)
        outputContinuation.yield("[bun:setup] step 5: fetchBridge")
        installFetchBridge(in: ctx)
        outputContinuation.yield("[bun:setup] step 6: processExitBridge")
        installProcessExitBridge(in: ctx)
        outputContinuation.yield("[bun:setup] step 7: stdinBridge")
        installStdinBridge(in: ctx)
        outputContinuation.yield("[bun:setup] step 8: patchTimerRefs")
        patchTimerModuleReferences(in: ctx)
        outputContinuation.yield("[bun:setup] step 9: installRequire")
        ESMResolver.installRequire(in: ctx)
        outputContinuation.yield("[bun:setup] step 10: configuring argv/cwd/env")

        // Configure process.argv
        if let bundle {
            let argvElements = (["node", bundle.path] + arguments)
                .map { "'\(escapeJS($0))'" }
                .joined(separator: ",")
            ctx.evaluateScript("process.argv = [\(argvElements)];")
        }

        // Configure process.cwd
        if let cwd {
            ctx.evaluateScript("process.cwd = function() { return '\(escapeJS(cwd))'; };")
        }

        // Set environment variables
        for (key, value) in environment {
            ctx.evaluateScript("process.env['\(escapeJS(key))'] = '\(escapeJS(value))';")
        }

        // Install unhandled Promise rejection reporter
        let rejectionBlock: @convention(block) (String) -> Void = { [outputContinuation] message in
            outputContinuation.yield("[bun:rejection] \(message)")
        }
        ctx.setObject(rejectionBlock, forKeyedSubscript: "__reportRejection" as NSString)
        // Unhandled rejection tracking is available via __reportRejection
        // but Promise.prototype.then is not modified to avoid side effects.

        // Evaluate bundle if present
        if let bundle {
            guard FileManager.default.fileExists(atPath: bundle.path) else {
                throw BunRuntimeError.bundleNotFound(bundle)
            }
            let rawSource = try String(contentsOf: bundle, encoding: .utf8)
            var source = try ESMTransformer.transform(rawSource, bundleURL: bundle)

            // Wrap the top-level async entry point to catch unhandled rejections.
            // cli.js ends with `vsY();` — replace with `vsY().catch(...)` to surface errors.
            if source.hasSuffix("vsY();") || source.contains("vsY();") {
                source = source.replacingOccurrences(
                    of: "vsY();",
                    with: "vsY().catch(function(e){ __reportRejection((e instanceof Error ? e.message : String(e)) + ' | stack: ' + (e && e.stack ? e.stack : 'none')); });",
                    options: .backwards,
                    range: source.index(source.endIndex, offsetBy: -20)..<source.endIndex
                )
            }

            ctx.evaluateScript(source, withSourceURL: bundle)
            if let exception = ctx.exception {
                let message = exception.toString() ?? ""
                ctx.exception = nil
                let isSentinel = isProcessExitSentinel(exception)
                outputContinuation.yield("[bun:diag] exception after evaluateScript: \(String(message.prefix(300)))")
                outputContinuation.yield("[bun:diag] isProcessExitSentinel: \(isSentinel)")
                if !isSentinel {
                    throw BunRuntimeError.javaScriptException(message)
                }
            } else {
                outputContinuation.yield("[bun:diag] evaluateScript completed without exception")
            }
            outputContinuation.yield("[bun:diag] refCount after evaluateScript: \(refCount)")
        }
    }

    // MARK: - Lifecycle

    private func ref(_ source: String = "") {
        eventLoop.preconditionInEventLoop()
        refCount += 1
        outputContinuation.yield("[bun:lifecycle] ref(\(source)) → refCount=\(refCount)")
    }

    private func unref(_ source: String = "") {
        eventLoop.preconditionInEventLoop()
        refCount -= 1
        outputContinuation.yield("[bun:lifecycle] unref(\(source)) → refCount=\(refCount)")
        checkExitCondition()
    }

    private func checkExitCondition() {
        eventLoop.preconditionInEventLoop()
        guard state == .running, refCount <= 0 else { return }
        outputContinuation.yield("[bun:lifecycle] checkExitCondition → exiting (refCount=\(refCount))")
        resolveExit(code: 0)
    }

    private func scheduleExitCheck(source: String) {
        eventLoop.preconditionInEventLoop()
        eventLoop.execute {
            self.eventLoop.preconditionInEventLoop()
            self.outputContinuation.yield("[bun:lifecycle] deferred checkExitCondition (\(source))")
            self.checkExitCondition()
        }
    }

    private func doExit(code: Int32) {
        eventLoop.preconditionInEventLoop()
        outputContinuation.yield("[bun:lifecycle] doExit(code=\(code)), activeTimers=\(activeTimers.count)")
        for (_, timerState) in activeTimers {
            timerState.scheduled.cancel()
        }
        activeTimers.removeAll()
        refCount = 0
        resolveExit(code: code)
    }

    private func resolveExit(code: Int32) {
        eventLoop.preconditionInEventLoop()
        guard let promise = exitPromise else { return }
        outputContinuation.yield("[bun:lifecycle] resolveExit(code=\(code))")
        state = .exited
        exitPromise = nil
        stdoutContinuation.finish()
        outputContinuation.finish()
        promise.succeed(code)
    }

    // MARK: - Web API Polyfills

    private func installWebAPIPolyfills(in ctx: JSContext) {
        guard let url = Bundle.module.url(
            forResource: "polyfills.bundle",
            withExtension: "js"
        ) else {
            outputContinuation.yield("[bun:setup] polyfills.bundle.js not found")
            return
        }
        do {
            let source = try String(contentsOf: url, encoding: .utf8)
            ctx.evaluateScript(source)
            if let ex = ctx.exception {
                outputContinuation.yield("[bun:setup] polyfills exception: \(ex)")
                ctx.exception = nil
            }
        } catch {
            outputContinuation.yield("[bun:setup] polyfills load error: \(error)")
        }
    }

    private func isProcessExitSentinel(_ value: JSValue) -> Bool {
        guard let flag = value.objectForKeyedSubscript("__processExit") else { return false }
        return flag.toBool()
    }

    private func checkException() throws {
        eventLoop.preconditionInEventLoop()
        guard let ctx = jsContext, let exception = ctx.exception else { return }
        ctx.exception = nil
        let message = exception.toString() ?? "Unknown JS exception"
        if !isProcessExitSentinel(exception) {
            throw BunRuntimeError.javaScriptException(message)
        }
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
        // Register native write bridges.
        // polyfills.bundle.js has already created process.stdout/stderr as
        // readable-stream Writable instances that call these bridges.
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

    // MARK: - Timer Bridge

    private func installTimerBridge(in ctx: JSContext) {
        eventLoop.preconditionInEventLoop()

        let nextTickBlock: @convention(block) (JSValue, JSValue) -> Void = { [self] callback, argsArray in
            self.ref("nextTick")
            self.eventLoop.execute {
                self.eventLoop.preconditionInEventLoop()
                callback.call(withArguments: self.extractArgs(argsArray))
                self.reportPendingJavaScriptException(source: "nextTick")
                self.unref("nextTick")
            }
        }
        ctx.setObject(nextTickBlock, forKeyedSubscript: "__nativeNextTick" as NSString)

        let setTimeoutBlock: @convention(block) (JSValue, JSValue, JSValue) -> Int32 = { [self] callback, delay, argsArray in
            let delayMs = delay.isUndefined ? 0 : max(0, Int64(delay.toInt32()))
            let timerID = self.nextTimerID
            self.nextTimerID += 1
            self.ref("setTimeout")

            let scheduled = self.eventLoop.scheduleTask(in: .milliseconds(delayMs)) {
                self.eventLoop.preconditionInEventLoop()
                let timerState = self.activeTimers.removeValue(forKey: timerID)
                callback.call(withArguments: self.extractArgs(argsArray))
                self.reportPendingJavaScriptException(source: "setTimeout")
                if timerState?.isRefed == true {
                    self.unref("setTimeout:fired")
                } else {
                    self.checkExitCondition()
                }
            }
            self.activeTimers[timerID] = TimerState(scheduled: scheduled, isRefed: true)
            return timerID
        }
        ctx.setObject(setTimeoutBlock, forKeyedSubscript: "__nativeSetTimeout" as NSString)

        let clearTimeoutBlock: @convention(block) (Int32) -> Void = { [self] timerID in
            if let timerState = self.activeTimers.removeValue(forKey: timerID) {
                timerState.scheduled.cancel()
                if timerState.isRefed {
                    self.unref("clearTimeout")
                } else {
                    self.checkExitCondition()
                }
            }
        }
        ctx.setObject(clearTimeoutBlock, forKeyedSubscript: "__nativeClearTimeout" as NSString)

        let setIntervalBlock: @convention(block) (JSValue, JSValue, JSValue) -> Int32 = { [self] callback, delay, argsArray in
            let delayMs = max(1, Int64(delay.toInt32()))
            let timerID = self.nextTimerID
            self.nextTimerID += 1
            self.ref("setInterval")
            self.scheduleRepeating(timerID: timerID, callback: callback, intervalMs: delayMs, argsArray: argsArray)
            return timerID
        }
        ctx.setObject(setIntervalBlock, forKeyedSubscript: "__nativeSetInterval" as NSString)

        let timerRefBlock: @convention(block) (Int32) -> Void = { [self] timerID in
            guard var timerState = self.activeTimers[timerID], !timerState.isRefed else { return }
            timerState.isRefed = true
            self.activeTimers[timerID] = timerState
            self.ref("timer.ref")
        }
        ctx.setObject(timerRefBlock, forKeyedSubscript: "__nativeTimerRef" as NSString)

        let timerUnrefBlock: @convention(block) (Int32) -> Void = { [self] timerID in
            guard var timerState = self.activeTimers[timerID], timerState.isRefed else { return }
            timerState.isRefed = false
            self.activeTimers[timerID] = timerState
            self.unref("timer.unref")
        }
        ctx.setObject(timerUnrefBlock, forKeyedSubscript: "__nativeTimerUnref" as NSString)

        let timerHasRefBlock: @convention(block) (Int32) -> Bool = { [self] timerID in
            self.activeTimers[timerID]?.isRefed ?? false
        }
        ctx.setObject(timerHasRefBlock, forKeyedSubscript: "__nativeTimerHasRef" as NSString)

        ctx.evaluateScript("""
        (function() {
            function normalizeTimerId(handle) {
                if (handle && typeof handle === 'object' && typeof handle._id === 'number') {
                    return handle._id;
                }
                return handle;
            }

            function makeTimerHandle(id, clearFn) {
                var handle = {
                    _id: id,
                    ref: function() { __nativeTimerRef(id); return handle; },
                    unref: function() { __nativeTimerUnref(id); return handle; },
                    hasRef: function() { return __nativeTimerHasRef(id); },
                    refresh: function() { return handle; },
                    close: function() { clearFn(id); return handle; }
                };
                if (typeof Symbol !== 'undefined' && Symbol.toPrimitive) {
                    handle[Symbol.toPrimitive] = function() { return id; };
                }
                return handle;
            }

            process.nextTick = function(fn) {
                var args = [];
                for (var i = 1; i < arguments.length; i++) args.push(arguments[i]);
                __nativeNextTick(fn, args);
            };
            globalThis.queueMicrotask = function(fn) {
                __nativeNextTick(fn, []);
            };
            globalThis.setTimeout = function(fn, delay) {
                var args = [];
                for (var i = 2; i < arguments.length; i++) args.push(arguments[i]);
                return makeTimerHandle(__nativeSetTimeout(fn, delay || 0, args), __nativeClearTimeout);
            };
            globalThis.clearTimeout = function(id) { __nativeClearTimeout(normalizeTimerId(id)); };
            globalThis.setInterval = function(fn, delay) {
                var args = [];
                for (var i = 2; i < arguments.length; i++) args.push(arguments[i]);
                return makeTimerHandle(__nativeSetInterval(fn, delay || 0, args), __nativeClearTimeout);
            };
            globalThis.clearInterval = function(id) { __nativeClearTimeout(normalizeTimerId(id)); };
            globalThis.setImmediate = function(fn) {
                var args = [];
                for (var i = 1; i < arguments.length; i++) args.push(arguments[i]);
                return makeTimerHandle(__nativeSetTimeout(fn, 0, args), __nativeClearTimeout);
            };
            globalThis.clearImmediate = function(id) { __nativeClearTimeout(normalizeTimerId(id)); };
        })();
        """)
    }

    private func scheduleRepeating(timerID: Int32, callback: JSValue, intervalMs: Int64, argsArray: JSValue) {
        let scheduled = eventLoop.scheduleTask(in: .milliseconds(intervalMs)) { [self] in
            self.eventLoop.preconditionInEventLoop()
            callback.call(withArguments: self.extractArgs(argsArray))
            self.reportPendingJavaScriptException(source: "setInterval")
            if self.activeTimers[timerID] != nil {
                self.scheduleRepeating(timerID: timerID, callback: callback, intervalMs: intervalMs, argsArray: argsArray)
            } else {
                self.checkExitCondition()
            }
        }
        let isRefed = activeTimers[timerID]?.isRefed ?? true
        activeTimers[timerID] = TimerState(scheduled: scheduled, isRefed: isRefed)
    }

    private func patchTimerModuleReferences(in ctx: JSContext) {
        ctx.evaluateScript("""
        (function() {
            if (!globalThis.__nodeModules || !__nodeModules.timers) return;
            var t = __nodeModules.timers;
            t.setTimeout = globalThis.setTimeout;
            t.clearTimeout = globalThis.clearTimeout;
            t.setInterval = globalThis.setInterval;
            t.clearInterval = globalThis.clearInterval;
            t.setImmediate = globalThis.setImmediate;
            t.clearImmediate = globalThis.clearImmediate;
            t.promises.setTimeout = function(ms, value) {
                return new Promise(function(resolve) {
                    globalThis.setTimeout(function() { resolve(value); }, ms);
                });
            };
            t.promises.setImmediate = function(value) {
                return new Promise(function(resolve) {
                    globalThis.setTimeout(function() { resolve(value); }, 0);
                });
            };
        })();
        """)
    }

    private func extractArgs(_ argsArray: JSValue) -> [Any] {
        guard !argsArray.isUndefined, argsArray.isArray else { return [] }
        let length = argsArray.objectForKeyedSubscript("length")!.toInt32()
        var args: [Any] = []
        for i in 0..<length {
            if let arg = argsArray.objectAtIndexedSubscript(Int(i)) {
                args.append(arg)
            }
        }
        return args
    }

    // MARK: - Fetch Bridge

    private func installFetchBridge(in ctx: JSContext) {
        eventLoop.preconditionInEventLoop()

        let fetchBlock: @convention(block) (String, String, JSValue, JSValue) -> Void = { [self] urlString, optionsJSON, resolveCallback, rejectCallback in
            self.ref("fetch")
            guard let url = URL(string: urlString) else {
                rejectCallback.call(withArguments: ["Invalid URL: \(urlString)"])
                self.unref("fetch:invalid-url")
                return
            }
            var request = URLRequest(url: url)
            if let data = optionsJSON.data(using: .utf8),
               let options = try? JSONSerialization.jsonObject(with: data) as? [String: Any] {
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
            let task = URLSession.shared.dataTask(with: request) { [self] data, response, error in
                self.eventLoop.execute {
                    defer { self.unref("fetch:complete") }
                    if let error {
                        rejectCallback.call(withArguments: [error.localizedDescription])
                        return
                    }
                    guard let httpResponse = response as? HTTPURLResponse else {
                        rejectCallback.call(withArguments: ["Invalid response"])
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
                    resolveCallback.call(withArguments: [
                        httpResponse.statusCode,
                        httpResponse.url?.absoluteString ?? urlString,
                        headerJSON,
                        body,
                    ])
                }
            }
            task.resume()
        }
        ctx.setObject(fetchBlock, forKeyedSubscript: "__nativeFetch" as NSString)
    }

    // MARK: - process.exit Bridge

    private func installProcessExitBridge(in ctx: JSContext) {
        let exitBlock: @convention(block) (JSValue) -> Void = { [self] codeValue in
            let code: Int32 = codeValue.isUndefined ? 0 : codeValue.toInt32()
            self.doExit(code: code)
        }
        ctx.setObject(exitBlock, forKeyedSubscript: "__processExit" as NSString)

        ctx.evaluateScript("""
        globalThis.__PROCESS_EXIT_SENTINEL__ = Object.freeze({ __processExit: true });
        process.exit = function(code) {
            __processExit(code === undefined ? 0 : (code | 0));
            throw globalThis.__PROCESS_EXIT_SENTINEL__;
        };
        """)
    }

    // MARK: - stdin Bridge

    private func installStdinBridge(in ctx: JSContext) {
        // polyfills.bundle.js created process.stdin as a readable-stream Readable
        // with __deliverStdinData for pushing data. We add ref/unref tracking and
        // setRawMode here.
        let stdinRefBlock: @convention(block) () -> Void = { [self] in self.ref("stdin") }
        let stdinUnrefBlock: @convention(block) () -> Void = { [self] in self.unref("stdin") }
        ctx.setObject(stdinRefBlock, forKeyedSubscript: "__stdinRef" as NSString)
        ctx.setObject(stdinUnrefBlock, forKeyedSubscript: "__stdinUnref" as NSString)

        ctx.evaluateScript("""
        (function() {
            var stdin = process.stdin;
            var _nativeRefed = false;
            var _manualRefed = false;
            var _listenerRefed = false;
            var _iteratorRefs = 0;

            function syncRefState() {
                var shouldRef = _manualRefed || _listenerRefed || _iteratorRefs > 0;
                if (shouldRef && !_nativeRefed) {
                    _nativeRefed = true;
                    __stdinRef();
                } else if (!shouldRef && _nativeRefed) {
                    _nativeRefed = false;
                    __stdinUnref();
                }
            }

            function refreshListenerRef() {
                _listenerRefed = stdin.listenerCount('data') > 0 || stdin.listenerCount('readable') > 0;
                syncRefState();
            }

            function releaseIteratorRef() {
                if (_iteratorRefs > 0) {
                    _iteratorRefs -= 1;
                    syncRefState();
                }
            }

            stdin.ref = function() {
                _manualRefed = true;
                syncRefState();
                return stdin;
            };
            stdin.unref = function() {
                _manualRefed = false;
                syncRefState();
                return stdin;
            };
            stdin.setRawMode = function() { return stdin; };
            if (typeof stdin.write !== 'function') {
                stdin.write = function() { return false; };
            }

            var _origOn = stdin.on.bind(stdin);
            stdin.on = function(event, fn) {
                var result = _origOn(event, fn);
                if (event === 'data' || event === 'readable') {
                    refreshListenerRef();
                }
                return result;
            };
            stdin.addListener = stdin.on;

            if (typeof stdin.once === 'function') {
                var _origOnce = stdin.once.bind(stdin);
                stdin.once = function(event, fn) {
                    var result = _origOnce(event, fn);
                    if (event === 'data' || event === 'readable') {
                        refreshListenerRef();
                    }
                    return result;
                };
            }

            if (typeof stdin.prependListener === 'function') {
                var _origPrependListener = stdin.prependListener.bind(stdin);
                stdin.prependListener = function(event, fn) {
                    var result = _origPrependListener(event, fn);
                    if (event === 'data' || event === 'readable') {
                        refreshListenerRef();
                    }
                    return result;
                };
            }

            if (typeof stdin.prependOnceListener === 'function') {
                var _origPrependOnceListener = stdin.prependOnceListener.bind(stdin);
                stdin.prependOnceListener = function(event, fn) {
                    var result = _origPrependOnceListener(event, fn);
                    if (event === 'data' || event === 'readable') {
                        refreshListenerRef();
                    }
                    return result;
                };
            }

            var _origRemoveListener = stdin.removeListener.bind(stdin);
            stdin.removeListener = function(event, fn) {
                var result = _origRemoveListener(event, fn);
                if (event === 'data' || event === 'readable') {
                    refreshListenerRef();
                }
                return result;
            };

            if (typeof stdin.off === 'function') {
                stdin.off = function(event, fn) {
                    return stdin.removeListener(event, fn);
                };
            }

            if (typeof stdin.removeAllListeners === 'function') {
                var _origRemoveAllListeners = stdin.removeAllListeners.bind(stdin);
                stdin.removeAllListeners = function(event) {
                    var result = _origRemoveAllListeners(event);
                    if (event === undefined || event === 'data' || event === 'readable') {
                        refreshListenerRef();
                    }
                    return result;
                };
            }

            stdin.on('end', function() {
                _listenerRefed = false;
                _iteratorRefs = 0;
                syncRefState();
            });

            var _origIterator = stdin[Symbol.asyncIterator];
            if (_origIterator) {
                stdin[Symbol.asyncIterator] = function() {
                    _iteratorRefs += 1;
                    syncRefState();

                    var iterator = _origIterator.call(stdin);
                    var released = false;

                    function releaseOnce() {
                        if (released) return;
                        released = true;
                        releaseIteratorRef();
                    }

                    return {
                        next: function() {
                            return Promise.resolve(iterator.next.apply(iterator, arguments)).then(function(result) {
                                if (result && result.done) releaseOnce();
                                return result;
                            }, function(error) {
                                releaseOnce();
                                throw error;
                            });
                        },
                        return: function() {
                            releaseOnce();
                            if (typeof iterator.return === 'function') {
                                return iterator.return.apply(iterator, arguments);
                            }
                            return Promise.resolve({ value: undefined, done: true });
                        },
                        throw: function() {
                            releaseOnce();
                            if (typeof iterator.throw === 'function') {
                                return iterator.throw.apply(iterator, arguments);
                            }
                            return Promise.reject(arguments[0]);
                        },
                        [Symbol.asyncIterator]: function() {
                            return this;
                        }
                    };
                };
            }
        })();
        """)

        self.stdinValue = ctx.objectForKeyedSubscript("process")?
            .objectForKeyedSubscript("stdin")
    }

    private func deliverStdin(_ data: Data?) {
        eventLoop.preconditionInEventLoop()
        guard let ctx = jsContext else { return }
        guard let deliver = ctx.objectForKeyedSubscript("__deliverStdinData"),
              !deliver.isUndefined else { return }
        let argument: Any = if let data {
            String(data: data, encoding: .utf8) ?? ""
        } else {
            NSNull()
        }
        _ = deliver.call(withArguments: [argument])
        reportPendingJavaScriptException(source: "deliverStdin")
    }

    // MARK: - Helpers

    private func escapeJS(_ string: String) -> String {
        string
            .replacingOccurrences(of: "\\", with: "\\\\")
            .replacingOccurrences(of: "'", with: "\\'")
            .replacingOccurrences(of: "\n", with: "\\n")
            .replacingOccurrences(of: "\r", with: "\\r")
    }

    private func reportPendingJavaScriptException(source: String) {
        eventLoop.preconditionInEventLoop()
        guard let ctx = jsContext, let exception = ctx.exception else { return }
        ctx.exception = nil
        guard !isProcessExitSentinel(exception) else { return }
        let message = exception.toString() ?? "Unknown JS exception"
        outputContinuation.yield("[bun:exception] \(source): \(message)")
    }
}
