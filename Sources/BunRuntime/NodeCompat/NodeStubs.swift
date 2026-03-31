@preconcurrency import JavaScriptCore

/// Stub modules for Node.js modules that are not applicable on iOS.
///
/// These provide minimal interfaces to prevent import errors
/// while clearly indicating that the functionality is not available.
enum NodeStubs {
    static func install(in context: JSContext) {
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
                spawn: function() {
                    throw new Error('node:child_process spawn is not supported in swift-bun');
                },
                exec: function(cmd, opts, cb) {
                    if (typeof opts === 'function') cb = opts;
                    if (cb) cb(new Error('node:child_process exec is not supported in swift-bun'));
                },
                execSync: function() {
                    throw new Error('node:child_process execSync is not supported in swift-bun');
                },
                execFile: function(file, args, opts, cb) {
                    if (typeof opts === 'function') cb = opts;
                    if (typeof args === 'function') cb = args;
                    if (cb) cb(new Error('node:child_process execFile is not supported in swift-bun'));
                },
                fork: function() {
                    throw new Error('node:child_process fork is not supported in swift-bun');
                },
                spawnSync: function() {
                    throw new Error('node:child_process spawnSync is not supported in swift-bun');
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
}
