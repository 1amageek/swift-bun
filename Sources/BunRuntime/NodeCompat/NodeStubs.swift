@preconcurrency import JavaScriptCore
import Foundation

/// Stub modules for Node.js modules that are not applicable on iOS.
///
/// These provide minimal interfaces to prevent import errors
/// while clearly indicating that the functionality is not available.
enum NodeStubs {
    static func install(in context: JSContext) {
        let childProcessRunSyncBlock: @convention(block) (String, String, String) -> [String: Any] = { file, argsJSON, optionsJSON in
            #if os(macOS)
            do {
                let args = try parseStringArray(json: argsJSON)
                let options = try parseJSONObject(json: optionsJSON)

                let process = Process()
                process.executableURL = try resolveExecutableURL(for: file)
                process.arguments = args

                if let cwd = options["cwd"] as? String, !cwd.isEmpty {
                    process.currentDirectoryURL = URL(fileURLWithPath: cwd)
                }

                var env = ProcessInfo.processInfo.environment
                if let extraEnv = options["env"] as? [String: Any] {
                    for (key, value) in extraEnv {
                        env[key] = "\(value)"
                    }
                }
                process.environment = env

                let stdoutPipe = Pipe()
                let stderrPipe = Pipe()
                process.standardOutput = stdoutPipe
                process.standardError = stderrPipe

                if let input = options["input"] as? String {
                    let stdinPipe = Pipe()
                    process.standardInput = stdinPipe
                    try process.run()
                    if let data = input.data(using: .utf8) {
                        stdinPipe.fileHandleForWriting.write(data)
                    }
                    try stdinPipe.fileHandleForWriting.close()
                } else {
                    try process.run()
                }

                process.waitUntilExit()

                let stdoutData = stdoutPipe.fileHandleForReading.readDataToEndOfFile()
                let stderrData = stderrPipe.fileHandleForReading.readDataToEndOfFile()

                return [
                    "status": process.terminationStatus,
                    "signal": NSNull(),
                    "stdout": String(data: stdoutData, encoding: .utf8) ?? "",
                    "stderr": String(data: stderrData, encoding: .utf8) ?? "",
                ]
            } catch {
                return ["error": "\(error)"]
            }
            #else
            return ["error": "node:child_process is not supported in swift-bun on this platform"]
            #endif
        }
        context.setObject(childProcessRunSyncBlock, forKeyedSubscript: "__cpRunSync" as NSString)

        context.evaluateScript("""
        (function() {
            if (!globalThis.__nodeModules) globalThis.__nodeModules = {};

            // net
            __nodeModules.net = {
                Socket: function() {
                    throw new Error('node:net Socket is not supported in swift-bun');
                },
                createServer: function() {
                    throw new Error('node:net createServer is not supported in swift-bun');
                },
                createConnection: function() {
                    throw new Error('node:net createConnection is not supported in swift-bun');
                },
                connect: function() {
                    throw new Error('node:net connect is not supported in swift-bun');
                },
                isIP: function(input) {
                    if (/^\\d{1,3}(\\.\\d{1,3}){3}$/.test(input)) return 4;
                    if (input.indexOf(':') !== -1) return 6;
                    return 0;
                },
                isIPv4: function(input) { return this.isIP(input) === 4; },
                isIPv6: function(input) { return this.isIP(input) === 6; },
            };

            // tls
            __nodeModules.tls = {
                connect: function() {
                    throw new Error('node:tls is not supported in swift-bun');
                },
                createServer: function() {
                    throw new Error('node:tls createServer is not supported in swift-bun');
                },
                TLSSocket: function() {
                    throw new Error('node:tls TLSSocket is not supported in swift-bun');
                },
            };

            // zlib
            __nodeModules.zlib = {
                createGzip: function() {
                    throw new Error('node:zlib is not yet supported in swift-bun');
                },
                createGunzip: function() {
                    throw new Error('node:zlib is not yet supported in swift-bun');
                },
                createDeflate: function() {
                    throw new Error('node:zlib is not yet supported in swift-bun');
                },
                createInflate: function() {
                    throw new Error('node:zlib is not yet supported in swift-bun');
                },
                gzipSync: function() {
                    throw new Error('node:zlib is not yet supported in swift-bun');
                },
                gunzipSync: function() {
                    throw new Error('node:zlib is not yet supported in swift-bun');
                },
                constants: {},
            };

            // child_process
            __nodeModules.child_process = {
                spawn: function(file, args, opts) {
                    if (!Array.isArray(args) && args && typeof args === 'object') {
                        opts = args;
                        args = [];
                    }
                    args = Array.isArray(args) ? args : [];
                    opts = opts || {};

                    var EE = require('events');
                    var Stream = require('stream');
                    var child = new EE();
                    var stdinChunks = [];
                    var started = false;

                    child.stdout = new Stream.PassThrough();
                    child.stderr = new Stream.PassThrough();
                    child.killed = false;
                    child.exitCode = null;
                    child.signalCode = null;
                    child.stdin = new Stream.Writable({
                        write: function(chunk, encoding, callback) {
                            if (typeof chunk === 'string') stdinChunks.push(chunk);
                            else if (typeof Buffer !== 'undefined' && Buffer.isBuffer(chunk)) stdinChunks.push(chunk.toString(encoding && encoding !== 'buffer' ? encoding : 'utf8'));
                            else if (chunk instanceof Uint8Array) stdinChunks.push(Buffer.from(chunk).toString('utf8'));
                            else stdinChunks.push(String(chunk));
                            callback();
                        },
                        final: function(callback) {
                            start();
                            callback();
                        }
                    });

                    function finishChild(result) {
                        queueMicrotask(function() {
                            if (result.error) {
                                var err = new Error(result.error);
                                child.stdout.destroy(err);
                                child.stderr.destroy(err);
                                child.emit('error', err);
                                return;
                            }

                            child.exitCode = result.status || 0;
                            child.signalCode = result.signal || null;

                            if (result.stdout) child.stdout.write(Buffer.from(result.stdout, 'utf8'));
                            child.stdout.end();

                            if (result.stderr) child.stderr.write(Buffer.from(result.stderr, 'utf8'));
                            child.stderr.end();

                            child.emit('close', child.exitCode, child.signalCode);
                            child.emit('exit', child.exitCode, child.signalCode);
                        });
                    }

                    function start() {
                        if (started) return;
                        started = true;

                        var runOptions = Object.assign({}, opts);
                        if (stdinChunks.length > 0) {
                            runOptions.input = stdinChunks.join('');
                        }

                        finishChild(__cpRunSync(file, JSON.stringify(args), JSON.stringify(runOptions)));
                    }

                    child.kill = function(signal) {
                        child.killed = true;
                        return true;
                    };
                    child.destroy = function(error) {
                        child.killed = true;
                        child.stdin.destroy(error);
                        child.stdout.destroy(error);
                        child.stderr.destroy(error);
                    };

                    queueMicrotask(start);

                    return child;
                },
                exec: function(cmd, opts, cb) {
                    if (typeof opts === 'function') cb = opts;
                    return __nodeModules.child_process.execFile('/bin/sh', ['-lc', cmd], opts, cb);
                },
                execSync: function(cmd, opts) {
                    var result = __cpRunSync('/bin/sh', JSON.stringify(['-lc', cmd]), JSON.stringify(opts || {}));
                    if (result.error) throw new Error(result.error);
                    if ((result.status || 0) !== 0) throw new Error(result.stderr || ('Command exited with code ' + result.status));
                    return result.stdout || '';
                },
                execFile: function(file, args, opts, cb) {
                    if (typeof opts === 'function') cb = opts;
                    if (typeof args === 'function') cb = args;
                    if (!Array.isArray(args)) args = [];
                    opts = opts && typeof opts === 'object' ? opts : {};

                    var child = __nodeModules.child_process.spawn(file, args, opts);
                    var stdout = '';
                    var stderr = '';

                    child.stdout.on('data', function(chunk) { stdout += chunk.toString(); });
                    child.stderr.on('data', function(chunk) { stderr += chunk.toString(); });

                    child.on('close', function(code, signal) {
                        if (!cb) return;
                        if (code === 0 || code === 1) cb(null, stdout, stderr);
                        else {
                            var err = new Error(stderr || ('Command exited with code ' + code));
                            err.code = code;
                            err.signal = signal;
                            cb(err, stdout, stderr);
                        }
                    });

                    child.on('error', function(err) {
                        if (cb) cb(err, stdout, stderr);
                    });

                    return child;
                },
                fork: function() {
                    throw new Error('node:child_process fork is not supported in swift-bun');
                },
                spawnSync: function(file, args, opts) {
                    if (!Array.isArray(args) && args && typeof args === 'object') {
                        opts = args;
                        args = [];
                    }
                    var result = __cpRunSync(file, JSON.stringify(Array.isArray(args) ? args : []), JSON.stringify(opts || {}));
                    if (result.error) {
                        return { error: new Error(result.error), status: null, stdout: '', stderr: '' };
                    }
                    return {
                        pid: 0,
                        status: result.status || 0,
                        signal: result.signal || null,
                        stdout: Buffer.from(result.stdout || '', 'utf8'),
                        stderr: Buffer.from(result.stderr || '', 'utf8'),
                    };
                },
            };

            // tty
            __nodeModules.tty = {
                isatty: function() { return false; },
                ReadStream: function() {},
                WriteStream: function() {},
            };

            // readline
            __nodeModules.readline = {
                createInterface: function() {
                    return {
                        on: function() { return this; },
                        close: function() {},
                        question: function(q, cb) { cb(''); },
                        prompt: function() {},
                    };
                },
            };

            // async_hooks
            __nodeModules.async_hooks = {
                createHook: function() { return { enable: function() {}, disable: function() {} }; },
                AsyncLocalStorage: function AsyncLocalStorage() {
                    this._store = undefined;
                },
                AsyncResource: function AsyncResource(type) { this.type = type; },
                executionAsyncId: function() { return 0; },
                triggerAsyncId: function() { return 0; },
            };
            __nodeModules.async_hooks.AsyncLocalStorage.prototype.getStore = function() { return this._store; };
            __nodeModules.async_hooks.AsyncLocalStorage.prototype.run = function(store, fn) {
                var prev = this._store;
                this._store = store;
                try { return fn(); }
                finally { this._store = prev; }
            };
            __nodeModules.async_hooks.AsyncLocalStorage.prototype.enterWith = function(store) { this._store = store; };

            // module
            __nodeModules.module = {
                createRequire: function() { return globalThis.require; },
                builtinModules: [
                    'assert', 'buffer', 'crypto', 'events', 'fs', 'http', 'https',
                    'os', 'path', 'stream', 'timers', 'url', 'util',
                ],
                _resolveFilename: function(id) { return id; },
            };

            // assert
            __nodeModules.assert = function assert(value, message) {
                if (!value) throw new Error(message || 'Assertion failed');
            };
            __nodeModules.assert.ok = __nodeModules.assert;
            __nodeModules.assert.strictEqual = function(a, b, msg) {
                if (a !== b) throw new Error(msg || ('Expected ' + a + ' === ' + b));
            };
            __nodeModules.assert.deepStrictEqual = function(a, b, msg) {
                if (JSON.stringify(a) !== JSON.stringify(b)) {
                    throw new Error(msg || 'Deep strict equal assertion failed');
                }
            };
            __nodeModules.assert.notStrictEqual = function(a, b, msg) {
                if (a === b) throw new Error(msg || ('Expected ' + a + ' !== ' + b));
            };
            __nodeModules.assert.throws = function(fn, expected, msg) {
                var threw = false;
                try { fn(); } catch(e) { threw = true; }
                if (!threw) throw new Error(msg || 'Expected function to throw');
            };
            __nodeModules.assert.rejects = function(fn, expected, msg) {
                return Promise.resolve().then(fn).then(
                    function() { throw new Error(msg || 'Expected promise to reject'); },
                    function() {}
                );
            };

            // worker_threads
            __nodeModules.worker_threads = {
                isMainThread: true,
                parentPort: null,
                workerData: null,
                Worker: function() {
                    throw new Error('node:worker_threads is not supported in swift-bun');
                },
                threadId: 0,
            };

            // perf_hooks
            __nodeModules.perf_hooks = {
                performance: globalThis.performance || {
                    now: function() { return Date.now(); },
                    timeOrigin: Date.now(),
                },
                PerformanceObserver: function() {
                    return { observe: function() {}, disconnect: function() {} };
                },
            };

            // http2
            __nodeModules.http2 = {
                constants: {},
                connect: function() {
                    throw new Error('node:http2 is not supported in swift-bun');
                },
                createServer: function() {
                    throw new Error('node:http2 is not supported in swift-bun');
                },
                createSecureServer: function() {
                    throw new Error('node:http2 is not supported in swift-bun');
                },
            };

            // inspector
            __nodeModules.inspector = {
                open: function() {},
                close: function() {},
                url: function() { return undefined; },
                Session: function() {
                    this.connect = function() {};
                    this.post = function(method, params, cb) { if (cb) cb(new Error('not supported')); };
                    this.disconnect = function() {};
                    this.on = function() { return this; };
                },
            };

            // v8
            __nodeModules.v8 = {
                getHeapStatistics: function() { return {}; },
                getHeapSnapshot: function() { return ''; },
                serialize: function(v) { return JSON.stringify(v); },
                deserialize: function(v) { return JSON.parse(v); },
            };

            // dns
            __nodeModules.dns = {
                lookup: function(host, opts, cb) {
                    if (typeof opts === 'function') cb = opts;
                    if (cb) cb(null, '127.0.0.1', 4);
                },
                resolve: function(host, rrtype, cb) {
                    if (typeof rrtype === 'function') cb = rrtype;
                    if (cb) cb(new Error('dns.resolve not supported'));
                },
                promises: {
                    lookup: function() { return Promise.resolve({ address: '127.0.0.1', family: 4 }); },
                    resolve: function() { return Promise.reject(new Error('dns.resolve not supported')); },
                },
            };

            // constants
            __nodeModules.constants = __nodeModules.fs.constants || {};

            // diagnostics_channel
            __nodeModules.diagnostics_channel = {
                channel: function(name) {
                    return {
                        name: name,
                        hasSubscribers: false,
                        subscribe: function() {},
                        unsubscribe: function() {},
                        publish: function() {},
                    };
                },
                Channel: function(name) { return __nodeModules.diagnostics_channel.channel(name); },
            };
        })();
        """)
    }

    private static func parseStringArray(json: String) throws -> [String] {
        guard let data = json.data(using: .utf8), !json.isEmpty else { return [] }
        let object = try JSONSerialization.jsonObject(with: data)
        guard let array = object as? [Any] else { return [] }
        return array.map { "\($0)" }
    }

    private static func parseJSONObject(json: String) throws -> [String: Any] {
        guard let data = json.data(using: .utf8), !json.isEmpty else { return [:] }
        let object = try JSONSerialization.jsonObject(with: data)
        return object as? [String: Any] ?? [:]
    }

    private static func resolveExecutableURL(for executable: String) throws -> URL {
        if executable.contains("/") {
            let url = URL(fileURLWithPath: executable)
            try ensureExecutableIfNeeded(at: url)
            return url
        }

        let environment = ProcessInfo.processInfo.environment
        let pathValue = environment["PATH"] ?? "/usr/bin:/bin:/usr/sbin:/sbin:/opt/homebrew/bin"
        for directory in pathValue.split(separator: ":") {
            let candidate = String(directory) + "/" + executable
            if FileManager.default.isExecutableFile(atPath: candidate) {
                return URL(fileURLWithPath: candidate)
            }
        }

        throw NSError(domain: NSCocoaErrorDomain, code: NSFileNoSuchFileError, userInfo: [
            NSFilePathErrorKey: executable,
        ])
    }

    private static func ensureExecutableIfNeeded(at url: URL) throws {
        let path = url.path
        guard FileManager.default.fileExists(atPath: path) else { return }
        guard !FileManager.default.isExecutableFile(atPath: path) else { return }

        let attributes = try FileManager.default.attributesOfItem(atPath: path)
        let permissions = (attributes[.posixPermissions] as? NSNumber)?.uint16Value ?? 0o644
        let executablePermissions = permissions | 0o111
        try FileManager.default.setAttributes([.posixPermissions: NSNumber(value: executablePermissions)], ofItemAtPath: path)
    }
}
