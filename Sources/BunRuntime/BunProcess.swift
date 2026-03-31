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
    private nonisolated(unsafe) var activeTimers: [Int32: Scheduled<Void>] = [:]
    private nonisolated(unsafe) var stdinValue: JSValue?
    private nonisolated(unsafe) var state: State = .idle

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
                self.checkExitCondition()
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

        // Install polyfills
        ESMResolver.installModules(in: ctx)
        installConsoleBridge(in: ctx)
        installStdioBridges(in: ctx)
        installTimerBridge(in: ctx)
        installFetchBridge(in: ctx)
        installProcessExitBridge(in: ctx)
        installStdinBridge(in: ctx)
        patchTimerModuleReferences(in: ctx)
        ESMResolver.installRequire(in: ctx)

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

        // Evaluate bundle if present
        if let bundle {
            guard FileManager.default.fileExists(atPath: bundle.path) else {
                throw BunRuntimeError.bundleNotFound(bundle)
            }
            let rawSource = try String(contentsOf: bundle, encoding: .utf8)
            let source = try ESMTransformer.transform(rawSource, bundleURL: bundle)
            ctx.evaluateScript(source, withSourceURL: bundle)
            if let exception = ctx.exception {
                let message = exception.toString() ?? ""
                ctx.exception = nil
                if !isProcessExitSentinel(exception) {
                    throw BunRuntimeError.javaScriptException(message)
                }
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
        state = .exited
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

    // MARK: - Console Bridge

    private func installConsoleBridge(in ctx: JSContext) {
        let logBlock: @convention(block) (String, String) -> Void = { [outputContinuation] level, message in
            outputContinuation.yield("[\(level)] \(message)")
        }
        ctx.setObject(logBlock, forKeyedSubscript: "__nativeLog" as NSString)
    }

    // MARK: - stdout/stderr Bridge

    private func installStdioBridges(in ctx: JSContext) {
        // stdout → stdout stream (application protocol data)
        let stdoutWrite: @convention(block) (String) -> Bool = { [stdoutContinuation] data in
            stdoutContinuation.yield(data)
            return true
        }
        ctx.setObject(stdoutWrite, forKeyedSubscript: "__nativeStdoutWrite" as NSString)

        // stderr → output stream (diagnostic data, tagged as stderr)
        let stderrWrite: @convention(block) (String) -> Bool = { [outputContinuation] data in
            outputContinuation.yield("[stderr] \(data)")
            return true
        }
        ctx.setObject(stderrWrite, forKeyedSubscript: "__nativeStderrWrite" as NSString)

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
        process.stderr = {
            write: function(s) { return __nativeStderrWrite(String(s)); },
            isTTY: false,
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
        // Native ref/unref for stdin active handle tracking.
        // When a 'data' or 'readable' listener is registered, stdin becomes an
        // active handle (ref). When 'end' fires or all listeners are removed, unref.
        // This matches Node.js semantics where stdin keeps the event loop alive.
        let stdinRefBlock: @convention(block) () -> Void = { [self] in self.ref() }
        let stdinUnrefBlock: @convention(block) () -> Void = { [self] in self.unref() }
        ctx.setObject(stdinRefBlock, forKeyedSubscript: "__stdinRef" as NSString)
        ctx.setObject(stdinUnrefBlock, forKeyedSubscript: "__stdinUnref" as NSString)

        ctx.evaluateScript("""
        (function() {
            var stdin = process.stdin;
            stdin._events = {};
            stdin._refed = false;
            stdin.readable = true;
            stdin.setEncoding = function() { return stdin; };
            stdin.resume = function() { return stdin; };
            stdin.pause = function() { return stdin; };

            function checkRef() {
                var hasListeners = (stdin._events['data'] && stdin._events['data'].length > 0) ||
                                   (stdin._events['readable'] && stdin._events['readable'].length > 0);
                if (hasListeners && !stdin._refed) {
                    stdin._refed = true;
                    __stdinRef();
                } else if (!hasListeners && stdin._refed) {
                    stdin._refed = false;
                    __stdinUnref();
                }
            }

            stdin.on = function(event, fn) {
                if (!stdin._events[event]) stdin._events[event] = [];
                stdin._events[event].push(fn);
                checkRef();
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
                checkRef();
                return stdin;
            };
            stdin.off = stdin.removeListener;
            stdin.emit = function(event) {
                var hasListeners = stdin._events[event] && stdin._events[event].length > 0;
                if (hasListeners) {
                    var args = Array.prototype.slice.call(arguments, 1);
                    var listeners = stdin._events[event].slice();
                    for (var i = 0; i < listeners.length; i++) {
                        listeners[i].apply(stdin, args);
                    }
                }
                // Unref on 'end' regardless of whether there were end listeners.
                // stdin is no longer an active handle after EOF.
                if (event === 'end' && stdin._refed) {
                    stdin._refed = false;
                    __stdinUnref();
                }
                return hasListeners;
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
