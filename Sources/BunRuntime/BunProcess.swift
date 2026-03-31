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
/// ## Library mode
///
/// ```swift
/// let process = BunProcess()
/// try await process.load(bundle: myLib)
/// let result = try await process.evaluate(js: "myFunction()")
/// ```
///
/// ## Process mode
///
/// ```swift
/// let process = BunProcess()
/// let exitCode = try await process.run(
///     bundle: cliJS,
///     arguments: ["-p", "--input-format", "stream-json"],
///     cwd: "/path/to/project"
/// )
/// ```
///
/// `load()` and `run()` are mutually exclusive on a single instance.
public final class BunProcess: Sendable {

    private let eventLoopGroup: MultiThreadedEventLoopGroup
    private let eventLoop: EventLoop

    // All fields below are accessed exclusively on the EventLoop thread.
    // preconditionInEventLoop() guards every access point.
    private nonisolated(unsafe) var jsContext: JSContext?
    private nonisolated(unsafe) var refCount: Int = 0
    private nonisolated(unsafe) var exitPromise: EventLoopPromise<Int32>?
    private nonisolated(unsafe) var nextTimerID: Int32 = 1
    private nonisolated(unsafe) var activeTimers: [Int32: Scheduled<Void>] = [:]
    private nonisolated(unsafe) var stdinValue: JSValue?
    private nonisolated(unsafe) var state: State = .idle

    private enum State {
        case idle
        case loaded   // library mode
        case running  // process mode
    }

    /// Stream of data written to `process.stdout.write()` from JS.
    ///
    /// This is the application data channel (e.g. NDJSON protocol messages).
    /// Separate from `output` which carries diagnostic console messages.
    public let stdout: AsyncStream<String>
    private let stdoutContinuation: AsyncStream<String>.Continuation

    /// Stream of diagnostic output from JS (console.log, console.error, etc.).
    ///
    /// Carries log-level-prefixed lines like `"[log] hello"`, `"[error] bad"`.
    /// Separate from `stdout` which carries application protocol data.
    public let output: AsyncStream<String>
    private let outputContinuation: AsyncStream<String>.Continuation

    public init() {
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

    /// Load a JavaScript bundle for library-style usage.
    ///
    /// After loading, call `evaluate(js:)` to execute code.
    /// Cannot be combined with `run()` on the same instance.
    public func load(bundle url: URL, environment: [String: String] = [:]) async throws {
        try await eventLoop.submit {
            precondition(self.state == .idle, "BunProcess already started. Use a new instance.")
            try self.setupContext(
                bundle: url,
                arguments: [],
                cwd: nil,
                environment: environment
            )
            self.state = .loaded
        }.get()
    }

    /// Create a bare context without loading a bundle.
    ///
    /// Installs Node.js/Bun polyfills. Call `evaluate(js:)` to run code.
    public func createContext() async throws {
        try await eventLoop.submit {
            precondition(self.state == .idle, "BunProcess already started. Use a new instance.")
            try self.setupBareContext()
            self.state = .loaded
        }.get()
    }

    /// Evaluate JavaScript and return the result.
    ///
    /// Runs on the EventLoop thread. Must be called after `load(bundle:)` or `createContext()`.
    @discardableResult
    public func evaluate(js source: String) async throws -> JSResult {
        try await eventLoop.submit {
            self.eventLoop.preconditionInEventLoop()
            guard let ctx = self.jsContext else {
                throw BunRuntimeError.contextCreationFailed
            }
            let result = ctx.evaluateScript(source)
            try self.checkException()
            return JSResult(from: result)
        }.get()
    }

    /// Call a global JavaScript function by name and return the result.
    @discardableResult
    public func call(_ function: String, arguments: [Any] = []) async throws -> JSResult {
        try await eventLoop.submit {
            self.eventLoop.preconditionInEventLoop()
            guard let ctx = self.jsContext else {
                throw BunRuntimeError.contextCreationFailed
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

    /// Run a JavaScript bundle as a long-lived process.
    ///
    /// Returns when `process.exit(code)` is called or all pending work completes.
    /// Cannot be combined with `load()` on the same instance.
    ///
    /// - Parameters:
    ///   - url: Path to the bundled JavaScript file.
    ///   - arguments: Command-line arguments (excluding node/script path).
    ///     `process.argv` is set to `["node", bundlePath, ...arguments]`.
    ///   - cwd: Working directory for `process.cwd()`. Defaults to the current directory.
    ///   - environment: Environment variables for `process.env`.
    /// - Returns: The exit code.
    public func run(
        bundle url: URL,
        arguments: [String] = [],
        cwd: String? = nil,
        environment: [String: String] = [:]
    ) async throws -> Int32 {
        let promise = eventLoop.makePromise(of: Int32.self)

        eventLoop.execute {
            do {
                precondition(self.state == .idle, "BunProcess already started. Use a new instance.")
                self.exitPromise = promise
                self.state = .running
                try self.setupContext(
                    bundle: url,
                    arguments: arguments,
                    cwd: cwd,
                    environment: environment
                )
                self.checkExitCondition()
            } catch {
                self.state = .idle
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

    private func setupBareContext() throws {
        eventLoop.preconditionInEventLoop()

        guard let ctx = JSContext() else {
            throw BunRuntimeError.contextCreationFailed
        }
        self.jsContext = ctx

        ESMResolver.installModules(in: ctx)
        installConsoleBridge(in: ctx)
        installStdoutBridge(in: ctx)
        installTimerBridge(in: ctx)
        installFetchBridge(in: ctx)
        installProcessExitBridge(in: ctx)
        installStdinBridge(in: ctx)
        patchTimerModuleReferences(in: ctx)
        ESMResolver.installRequire(in: ctx)
    }

    private func setupContext(
        bundle url: URL,
        arguments: [String],
        cwd: String?,
        environment: [String: String]
    ) throws {
        eventLoop.preconditionInEventLoop()

        guard FileManager.default.fileExists(atPath: url.path) else {
            throw BunRuntimeError.bundleNotFound(url)
        }

        let rawSource = try String(contentsOf: url, encoding: .utf8)
        let source = try ESMTransformer.transform(rawSource, bundleURL: url)

        try setupBareContext()

        guard let ctx = jsContext else { return }

        // Set process.argv: ["node", bundlePath, ...arguments]
        let argvElements = (["node", url.path] + arguments)
            .map { "'\(escapeJS($0))'" }
            .joined(separator: ",")
        ctx.evaluateScript("process.argv = [\(argvElements)];")

        // Set process.cwd
        if let cwd {
            ctx.evaluateScript("process.cwd = function() { return '\(escapeJS(cwd))'; };")
        }

        // Set environment variables
        for (key, value) in environment {
            ctx.evaluateScript("process.env['\(escapeJS(key))'] = '\(escapeJS(value))';")
        }

        // Evaluate the bundle
        ctx.evaluateScript(source, withSourceURL: url)
        if let exception = ctx.exception {
            let message = exception.toString() ?? ""
            ctx.exception = nil
            if !isProcessExitSentinel(exception) {
                throw BunRuntimeError.javaScriptException(message)
            }
        }
    }

    // MARK: - Lifecycle

    private func ref() {
        eventLoop.preconditionInEventLoop()
        refCount += 1
    }

    private func unref() {
        eventLoop.preconditionInEventLoop()
        refCount -= 1
        checkExitCondition()
    }

    private func checkExitCondition() {
        eventLoop.preconditionInEventLoop()
        guard state == .running, refCount <= 0 else { return }
        resolveExit(code: 0)
    }

    private func doExit(code: Int32) {
        eventLoop.preconditionInEventLoop()
        for (_, scheduled) in activeTimers {
            scheduled.cancel()
        }
        activeTimers.removeAll()
        refCount = 0
        resolveExit(code: code)
    }

    private func resolveExit(code: Int32) {
        eventLoop.preconditionInEventLoop()
        guard let promise = exitPromise else { return }
        state = .idle
        exitPromise = nil
        stdoutContinuation.finish()
        outputContinuation.finish()
        promise.succeed(code)
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

    // MARK: - Console Bridge (diagnostics → output stream)

    private func installConsoleBridge(in ctx: JSContext) {
        let logBlock: @convention(block) (String, String) -> Void = { [outputContinuation] level, message in
            outputContinuation.yield("[\(level)] \(message)")
        }
        ctx.setObject(logBlock, forKeyedSubscript: "__nativeLog" as NSString)
    }

    // MARK: - stdout Bridge (application data → stdout stream)

    private func installStdoutBridge(in ctx: JSContext) {
        let writeBlock: @convention(block) (String) -> Bool = { [stdoutContinuation] data in
            stdoutContinuation.yield(data)
            return true
        }
        ctx.setObject(writeBlock, forKeyedSubscript: "__nativeStdoutWrite" as NSString)

        ctx.evaluateScript("""
        process.stdout = {
            write: function(s) { return __nativeStdoutWrite(String(s)); },
            isTTY: false,
            columns: 80,
            rows: 24,
            on: function() { return this; },
            once: function() { return this; },
            emit: function() { return false; },
            end: function() {},
        };
        """)
    }

    // MARK: - Timer Bridge

    private func installTimerBridge(in ctx: JSContext) {
        eventLoop.preconditionInEventLoop()

        let setTimeoutBlock: @convention(block) (JSValue, JSValue, JSValue) -> Int32 = { [self] callback, delay, argsArray in
            let delayMs = delay.isUndefined ? 0 : max(0, Int64(delay.toInt32()))
            let timerID = self.nextTimerID
            self.nextTimerID += 1
            self.ref()

            let scheduled = self.eventLoop.scheduleTask(in: .milliseconds(delayMs)) {
                self.eventLoop.preconditionInEventLoop()
                self.activeTimers.removeValue(forKey: timerID)
                callback.call(withArguments: self.extractArgs(argsArray))
                self.unref()
            }
            self.activeTimers[timerID] = scheduled
            return timerID
        }
        ctx.setObject(setTimeoutBlock, forKeyedSubscript: "__nativeSetTimeout" as NSString)

        let clearTimeoutBlock: @convention(block) (Int32) -> Void = { [self] timerID in
            if let scheduled = self.activeTimers.removeValue(forKey: timerID) {
                scheduled.cancel()
                self.unref()
            }
        }
        ctx.setObject(clearTimeoutBlock, forKeyedSubscript: "__nativeClearTimeout" as NSString)

        let setIntervalBlock: @convention(block) (JSValue, JSValue, JSValue) -> Int32 = { [self] callback, delay, argsArray in
            let delayMs = max(1, Int64(delay.toInt32()))
            let timerID = self.nextTimerID
            self.nextTimerID += 1
            self.ref()
            self.scheduleRepeating(timerID: timerID, callback: callback, intervalMs: delayMs, argsArray: argsArray)
            return timerID
        }
        ctx.setObject(setIntervalBlock, forKeyedSubscript: "__nativeSetInterval" as NSString)

        ctx.evaluateScript("""
        (function() {
            globalThis.setTimeout = function(fn, delay) {
                var args = [];
                for (var i = 2; i < arguments.length; i++) args.push(arguments[i]);
                return __nativeSetTimeout(fn, delay || 0, args);
            };
            globalThis.clearTimeout = function(id) { __nativeClearTimeout(id); };
            globalThis.setInterval = function(fn, delay) {
                var args = [];
                for (var i = 2; i < arguments.length; i++) args.push(arguments[i]);
                return __nativeSetInterval(fn, delay || 0, args);
            };
            globalThis.clearInterval = function(id) { __nativeClearTimeout(id); };
            globalThis.setImmediate = function(fn) {
                var args = [];
                for (var i = 1; i < arguments.length; i++) args.push(arguments[i]);
                return __nativeSetTimeout(fn, 0, args);
            };
            globalThis.clearImmediate = function(id) { __nativeClearTimeout(id); };
        })();
        """)
    }

    private func scheduleRepeating(timerID: Int32, callback: JSValue, intervalMs: Int64, argsArray: JSValue) {
        let scheduled = eventLoop.scheduleTask(in: .milliseconds(intervalMs)) { [self] in
            self.eventLoop.preconditionInEventLoop()
            callback.call(withArguments: self.extractArgs(argsArray))
            if self.activeTimers[timerID] != nil {
                self.scheduleRepeating(timerID: timerID, callback: callback, intervalMs: intervalMs, argsArray: argsArray)
            }
        }
        activeTimers[timerID] = scheduled
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
            self.ref()

            guard let url = URL(string: urlString) else {
                rejectCallback.call(withArguments: ["Invalid URL: \(urlString)"])
                self.unref()
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
                    defer { self.unref() }
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
        ctx.evaluateScript("""
        (function() {
            var stdin = process.stdin;
            stdin._events = {};
            stdin.readable = true;
            stdin.setEncoding = function() { return stdin; };
            stdin.resume = function() { return stdin; };
            stdin.pause = function() { return stdin; };
            stdin.on = function(event, fn) {
                if (!stdin._events[event]) stdin._events[event] = [];
                stdin._events[event].push(fn);
                return stdin;
            };
            stdin.addListener = stdin.on;
            stdin.once = function(event, fn) {
                function wrapper() {
                    stdin.removeListener(event, wrapper);
                    fn.apply(this, arguments);
                }
                wrapper._original = fn;
                return stdin.on(event, wrapper);
            };
            stdin.removeListener = function(event, fn) {
                if (!stdin._events[event]) return stdin;
                stdin._events[event] = stdin._events[event].filter(function(f) {
                    return f !== fn && f._original !== fn;
                });
                return stdin;
            };
            stdin.off = stdin.removeListener;
            stdin.emit = function(event) {
                if (!stdin._events[event]) return false;
                var args = Array.prototype.slice.call(arguments, 1);
                var listeners = stdin._events[event].slice();
                for (var i = 0; i < listeners.length; i++) {
                    listeners[i].apply(stdin, args);
                }
                return true;
            };
        })();
        """)

        self.stdinValue = ctx.objectForKeyedSubscript("process")?
            .objectForKeyedSubscript("stdin")
    }

    private func deliverStdin(_ data: Data?) {
        eventLoop.preconditionInEventLoop()
        guard let stdin = stdinValue else { return }
        if let data {
            let str = String(data: data, encoding: .utf8) ?? ""
            stdin.invokeMethod("emit", withArguments: ["data", str])
        } else {
            stdin.invokeMethod("emit", withArguments: ["end"])
        }
    }

    // MARK: - Helpers

    private func escapeJS(_ string: String) -> String {
        string
            .replacingOccurrences(of: "\\", with: "\\\\")
            .replacingOccurrences(of: "'", with: "\\'")
            .replacingOccurrences(of: "\n", with: "\\n")
            .replacingOccurrences(of: "\r", with: "\\r")
    }
}
