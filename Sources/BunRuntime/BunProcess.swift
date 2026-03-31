@preconcurrency import JavaScriptCore
import Foundation
import NIOCore
import NIOPosix

/// A long-lived JavaScript process with a NIO EventLoop-driven event loop.
///
/// Unlike `BunContext` which evaluates scripts synchronously and bridges
/// Promises via `withCheckedThrowingContinuation`, `BunProcess` runs a
/// NIO EventLoop that drives timers, fetch callbacks, and stdin delivery,
/// keeping the process alive until all work completes or `process.exit()` is called.
///
/// All JSContext access happens exclusively on the EventLoop thread,
/// guaranteeing thread safety without actor overhead.
public final class BunProcess: Sendable {

    private let eventLoopGroup: MultiThreadedEventLoopGroup
    private let eventLoop: EventLoop

    // Accessed only on the EventLoop thread. The EventLoop's single-thread
    // guarantee provides safety; preconditionInEventLoop() asserts this.
    private nonisolated(unsafe) var jsContext: JSContext?
    private nonisolated(unsafe) var refCount: Int = 0
    private nonisolated(unsafe) var exitPromise: EventLoopPromise<Int32>?
    private nonisolated(unsafe) var nextTimerID: Int32 = 1
    private nonisolated(unsafe) var activeTimers: [Int32: Scheduled<Void>] = [:]
    private nonisolated(unsafe) var stdinValue: JSValue?

    public init() {
        self.eventLoopGroup = MultiThreadedEventLoopGroup(numberOfThreads: 1)
        self.eventLoop = eventLoopGroup.next()
    }

    deinit {
        try? eventLoopGroup.syncShutdownGracefully()
    }

    // MARK: - Public API

    /// Run a JavaScript bundle as a long-lived process.
    ///
    /// Blocks the calling async context until the process exits via `process.exit(code)`
    /// or when all pending work (timers, I/O) completes.
    ///
    /// - Parameters:
    ///   - url: URL to the bundled JavaScript file.
    ///   - environment: Environment variables to inject into `process.env`.
    /// - Returns: The exit code (0 for success).
    public func run(
        bundle url: URL,
        environment: [String: String] = [:]
    ) async throws -> Int32 {
        let promise = eventLoop.makePromise(of: Int32.self)

        eventLoop.execute {
            do {
                try self.bootstrap(bundle: url, environment: environment, promise: promise)
            } catch {
                promise.fail(error)
            }
        }

        return try await promise.futureResult.get()
    }

    /// Send input data to the process's stdin stream.
    ///
    /// Delivers data as a `'data'` event on `process.stdin`.
    /// Pass `nil` to signal EOF (emits `'end'`).
    public func sendInput(_ data: Data?) {
        eventLoop.execute {
            self.deliverStdin(data)
        }
    }

    /// Request graceful shutdown of the process.
    public func terminate(exitCode: Int32 = 0) {
        eventLoop.execute {
            self.doExit(code: exitCode)
        }
    }

    // MARK: - Bootstrap

    private func bootstrap(
        bundle url: URL,
        environment: [String: String],
        promise: EventLoopPromise<Int32>
    ) throws {
        eventLoop.preconditionInEventLoop()

        self.exitPromise = promise

        guard FileManager.default.fileExists(atPath: url.path) else {
            throw BunRuntimeError.bundleNotFound(url)
        }

        let rawSource = try String(contentsOf: url, encoding: .utf8)
        let source = try ESMTransformer.transform(rawSource, bundleURL: url)

        guard let ctx = JSContext() else {
            throw BunRuntimeError.contextCreationFailed
        }
        self.jsContext = ctx

        // 1. Install standard polyfills (modules, globals, default timer/fetch)
        ESMResolver.installModules(in: ctx)

        // 2. Override with NIO-backed bridges
        installTimerBridge(in: ctx)
        installFetchBridge(in: ctx)
        installProcessExitBridge(in: ctx)
        installStdinBridge(in: ctx)

        // 3. Patch __nodeModules.timers references (captured at install time by NodeTimers)
        ctx.evaluateScript("""
        (function() {
            if (!globalThis.__nodeModules || !__nodeModules.timers) return;
            __nodeModules.timers.setTimeout = globalThis.setTimeout;
            __nodeModules.timers.clearTimeout = globalThis.clearTimeout;
            __nodeModules.timers.setInterval = globalThis.setInterval;
            __nodeModules.timers.clearInterval = globalThis.clearInterval;
            __nodeModules.timers.setImmediate = globalThis.setImmediate;
            __nodeModules.timers.clearImmediate = globalThis.clearImmediate;
            __nodeModules.timers.promises.setTimeout = function(ms, value) {
                return new Promise(function(resolve) {
                    globalThis.setTimeout(function() { resolve(value); }, ms);
                });
            };
            __nodeModules.timers.promises.setImmediate = function(value) {
                return new Promise(function(resolve) {
                    globalThis.setTimeout(function() { resolve(value); }, 0);
                });
            };
        })();
        """)

        // 4. Set environment variables
        for (key, value) in environment {
            let escapedKey = escapeJS(key)
            let escapedValue = escapeJS(value)
            ctx.evaluateScript("process.env['\(escapedKey)'] = '\(escapedValue)';")
        }

        // 5. Install require() last
        ESMResolver.installRequire(in: ctx)

        // 6. Evaluate the bundle
        ctx.evaluateScript(source, withSourceURL: url)
        if let exception = ctx.exception {
            let message = exception.toString() ?? ""
            ctx.exception = nil
            if !message.contains("__PROCESS_EXIT__") {
                throw BunRuntimeError.javaScriptException(message)
            }
        }

        // 7. Check if process can exit immediately
        checkExitCondition()
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
        if refCount <= 0, let promise = exitPromise {
            self.exitPromise = nil
            promise.succeed(0)
        }
    }

    private func doExit(code: Int32) {
        eventLoop.preconditionInEventLoop()
        for (_, scheduled) in activeTimers {
            scheduled.cancel()
        }
        activeTimers.removeAll()
        refCount = 0

        if let promise = exitPromise {
            self.exitPromise = nil
            promise.succeed(code)
        }
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

                let args = self.extractArgs(argsArray)
                callback.call(withArguments: args)

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

        // JS wrappers to collect rest args
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

            let args = self.extractArgs(argsArray)
            callback.call(withArguments: args)

            if self.activeTimers[timerID] != nil {
                self.scheduleRepeating(timerID: timerID, callback: callback, intervalMs: intervalMs, argsArray: argsArray)
            }
        }
        activeTimers[timerID] = scheduled
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
                // Marshal back to EventLoop thread before touching JSValues
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

        // Override __nativeFetch registered by NodeHTTP.install
        ctx.setObject(fetchBlock, forKeyedSubscript: "__nativeFetch" as NSString)
    }

    // MARK: - process.exit Bridge

    private func installProcessExitBridge(in ctx: JSContext) {
        eventLoop.preconditionInEventLoop()

        let exitBlock: @convention(block) (Int32) -> Void = { [self] code in
            self.doExit(code: code)
        }
        ctx.setObject(exitBlock, forKeyedSubscript: "__processExit" as NSString)

        ctx.evaluateScript("""
        process.exit = function(code) {
            __processExit(code || 0);
            throw new Error('__PROCESS_EXIT__');
        };
        """)
    }

    // MARK: - stdin Bridge

    private func installStdinBridge(in ctx: JSContext) {
        eventLoop.preconditionInEventLoop()

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
