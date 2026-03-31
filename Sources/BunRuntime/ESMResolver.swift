@preconcurrency import JavaScriptCore

/// Resolves `require("node:*")` calls by returning polyfill module objects.
enum ESMResolver {

    /// Install the `require()` function and all built-in modules into the given context.
    static func install(in context: JSContext) {
        installModules(in: context)
        installRequire(in: context)
    }

    /// Install all module polyfills without `require()`.
    ///
    /// `BunProcess` calls this, then installs its NIO-backed timer/fetch bridges
    /// (which override the default ones), then calls `installRequire()` separately.
    static func installModules(in context: JSContext) {
        installGlobals(in: context)
        NodePath.install(in: context)
        NodeBuffer.install(in: context)
        NodeURL.install(in: context)
        NodeUtil.install(in: context)
        NodeOS.install(in: context)
        NodeFS.install(in: context)
        NodeCrypto.install(in: context)
        NodeHTTP.install(in: context)
        NodeStream.install(in: context)
        NodeTimers.install(in: context)
        NodeStubs.install(in: context)
        BunShims.install(in: context)
        BunEnv.install(in: context)
        BunFile.install(in: context)
        BunSpawn.install(in: context)
    }

    // MARK: - Private

    private static func installGlobals(in context: JSContext) {
        // Node.js and Web API global aliases
        context.evaluateScript("""
        if (typeof globalThis.global === 'undefined') globalThis.global = globalThis;
        if (typeof globalThis.self === 'undefined') globalThis.self = globalThis;

        // Event / EventTarget polyfill (required by many npm packages)
        if (typeof globalThis.Event === 'undefined') {
            globalThis.Event = function Event(type, options) {
                this.type = type;
                this.bubbles = (options && options.bubbles) || false;
                this.cancelable = (options && options.cancelable) || false;
                this.defaultPrevented = false;
                this.target = null;
            };
            Event.prototype.preventDefault = function() { this.defaultPrevented = true; };
            Event.prototype.stopPropagation = function() {};
            Event.prototype.stopImmediatePropagation = function() {};
        }
        if (typeof globalThis.EventTarget === 'undefined') {
            globalThis.EventTarget = function EventTarget() { this._listeners = {}; };
            EventTarget.prototype.addEventListener = function(type, fn) {
                if (!this._listeners[type]) this._listeners[type] = [];
                this._listeners[type].push(fn);
            };
            EventTarget.prototype.removeEventListener = function(type, fn) {
                if (!this._listeners[type]) return;
                this._listeners[type] = this._listeners[type].filter(function(f) { return f !== fn; });
            };
            EventTarget.prototype.dispatchEvent = function(event) {
                event.target = this;
                var listeners = this._listeners[event.type] || [];
                for (var i = 0; i < listeners.length; i++) listeners[i].call(this, event);
                return !event.defaultPrevented;
            };
        }
        if (typeof globalThis.CustomEvent === 'undefined') {
            globalThis.CustomEvent = function CustomEvent(type, options) {
                Event.call(this, type, options);
                this.detail = (options && options.detail) || null;
            };
            CustomEvent.prototype = Object.create(Event.prototype);
            CustomEvent.prototype.constructor = CustomEvent;
        }

        // structuredClone polyfill
        if (typeof globalThis.structuredClone === 'undefined') {
            globalThis.structuredClone = function(obj) {
                return JSON.parse(JSON.stringify(obj));
            };
        }

        // navigator stub
        if (typeof globalThis.navigator === 'undefined') {
            globalThis.navigator = { userAgent: 'swift-bun', platform: 'darwin' };
        }
        """)

        // performance polyfill (not available in standalone JSContext)
        context.evaluateScript("""
        (function() {
            if (typeof globalThis.performance === 'undefined') {
                var _timeOrigin = Date.now();
                globalThis.performance = {
                    timeOrigin: _timeOrigin,
                    now: function() { return Date.now() - _timeOrigin; },
                    mark: function() {},
                    measure: function() {},
                    getEntries: function() { return []; },
                    getEntriesByName: function() { return []; },
                    getEntriesByType: function() { return []; },
                    clearMarks: function() {},
                    clearMeasures: function() {},
                };
            }
        })();
        """)

        // URL constructor polyfill (not available in standalone JSContext)
        context.evaluateScript("""
        (function() {
            if (typeof globalThis.URL !== 'undefined') return;

            function URL(url, base) {
                if (base) {
                    // Resolve relative URL against base
                    if (!url.match(/^[a-z]+:/i)) {
                        if (url.startsWith('/')) {
                            var baseMatch = base.match(/^([a-z]+:\\/\\/[^/]+)/i);
                            url = (baseMatch ? baseMatch[1] : '') + url;
                        } else {
                            url = base.replace(/[^/]*$/, '') + url;
                        }
                    }
                }
                var match = url.match(/^([a-z]+:)\\/\\/(?:([^:@]+)(?::([^@]*))?@)?([^:/?#]*)(?::(\\d+))?([^?#]*)(?:\\?([^#]*))?(?:#(.*))?$/i);
                if (!match) {
                    this.href = url;
                    this.protocol = '';
                    this.username = '';
                    this.password = '';
                    this.hostname = '';
                    this.host = '';
                    this.port = '';
                    this.pathname = '/';
                    this.search = '';
                    this.hash = '';
                    this.origin = '';
                    this.searchParams = new URLSearchParams('');
                    return;
                }
                this.protocol = match[1] || '';
                this.username = match[2] || '';
                this.password = match[3] || '';
                this.hostname = match[4] || '';
                this.port = match[5] || '';
                this.host = this.hostname + (this.port ? ':' + this.port : '');
                this.pathname = match[6] || '/';
                this.search = match[7] ? '?' + match[7] : '';
                this.hash = match[8] ? '#' + match[8] : '';
                this.origin = this.protocol + '//' + this.host;
                this.href = this.protocol + '//' +
                    (this.username ? this.username + (this.password ? ':' + this.password : '') + '@' : '') +
                    this.host + this.pathname + this.search + this.hash;
                this.searchParams = new URLSearchParams(match[7] || '');
            }
            URL.prototype.toString = function() { return this.href; };
            URL.prototype.toJSON = function() { return this.href; };

            function URLSearchParams(init) {
                this._params = [];
                if (typeof init === 'string') {
                    var pairs = init.replace(/^\\?/, '').split('&');
                    for (var i = 0; i < pairs.length; i++) {
                        if (!pairs[i]) continue;
                        var kv = pairs[i].split('=');
                        this._params.push([decodeURIComponent(kv[0]), decodeURIComponent(kv.slice(1).join('='))]);
                    }
                }
            }
            URLSearchParams.prototype.get = function(name) {
                for (var i = 0; i < this._params.length; i++) {
                    if (this._params[i][0] === name) return this._params[i][1];
                }
                return null;
            };
            URLSearchParams.prototype.has = function(name) { return this.get(name) !== null; };
            URLSearchParams.prototype.set = function(name, value) {
                for (var i = 0; i < this._params.length; i++) {
                    if (this._params[i][0] === name) { this._params[i][1] = value; return; }
                }
                this._params.push([name, value]);
            };
            URLSearchParams.prototype.append = function(name, value) { this._params.push([name, value]); };
            URLSearchParams.prototype.delete = function(name) {
                this._params = this._params.filter(function(p) { return p[0] !== name; });
            };
            URLSearchParams.prototype.toString = function() {
                return this._params.map(function(p) {
                    return encodeURIComponent(p[0]) + '=' + encodeURIComponent(p[1]);
                }).join('&');
            };
            URLSearchParams.prototype.forEach = function(cb) {
                for (var i = 0; i < this._params.length; i++) {
                    cb(this._params[i][1], this._params[i][0]);
                }
            };
            URLSearchParams.prototype.entries = function() { return this._params[Symbol.iterator](); };
            URLSearchParams.prototype[Symbol.iterator] = URLSearchParams.prototype.entries;

            globalThis.URL = URL;
            globalThis.URLSearchParams = URLSearchParams;
        })();
        """)

        // console
        let logBlock: @convention(block) (String, String) -> Void = { level, message in
            print("[\(level)] \(message)")
        }
        context.setObject(logBlock, forKeyedSubscript: "__nativeLog" as NSString)

        context.evaluateScript("""
        (function() {
            function formatArgs(args) {
                return Array.prototype.slice.call(args).map(function(a) {
                    if (typeof a === 'object') {
                        try { return JSON.stringify(a); } catch(e) { return String(a); }
                    }
                    return String(a);
                }).join(' ');
            }
            globalThis.console = {
                log: function() { __nativeLog('log', formatArgs(arguments)); },
                warn: function() { __nativeLog('warn', formatArgs(arguments)); },
                error: function() { __nativeLog('error', formatArgs(arguments)); },
                info: function() { __nativeLog('info', formatArgs(arguments)); },
                debug: function() { __nativeLog('debug', formatArgs(arguments)); },
                trace: function() { __nativeLog('trace', formatArgs(arguments)); },
                dir: function(obj) { __nativeLog('log', JSON.stringify(obj, null, 2)); },
                assert: function(cond) {
                    if (!cond) {
                        var msg = formatArgs(Array.prototype.slice.call(arguments, 1));
                        __nativeLog('error', 'Assertion failed: ' + msg);
                    }
                },
                time: function() {},
                timeEnd: function() {},
                timeLog: function() {},
            };
        })();
        """)

        // process
        context.evaluateScript("""
        globalThis.process = globalThis.process || {};
        process.env = process.env || {};
        process.platform = 'darwin';
        process.arch = 'arm64';
        process.version = 'v22.0.0';
        process.versions = { node: '22.0.0', bun: '1.0.0' };
        process.pid = 1;
        process.cwd = function() { return '/'; };
        process.exit = function(code) { throw new Error('process.exit(' + code + ') called'); };
        process.stdout = process.stdout || { write: function() { return true; }, isTTY: false };
        process.stderr = process.stderr || { write: function() { return true; }, isTTY: false };
        process.stdin = process.stdin || { isTTY: false };
        process.nextTick = function(fn) { Promise.resolve().then(fn); };
        process.hrtime = function(prev) {
            var now = performance.now();
            var sec = Math.floor(now / 1000);
            var nano = Math.floor((now % 1000) * 1e6);
            if (prev) {
                sec -= prev[0];
                nano -= prev[1];
                if (nano < 0) { sec--; nano += 1e9; }
            }
            return [sec, nano];
        };
        process.hrtime.bigint = function() { return BigInt(Math.floor(performance.now() * 1e6)); };
        process.emitWarning = function(msg) { console.warn('Warning:', msg); };
        """)

        // queueMicrotask
        context.evaluateScript("""
        if (typeof globalThis.queueMicrotask === 'undefined') {
            globalThis.queueMicrotask = function(fn) { Promise.resolve().then(fn); };
        }
        """)

        // TextEncoder / TextDecoder
        context.evaluateScript("""
        (function() {
            if (typeof globalThis.TextEncoder !== 'undefined') return;

            globalThis.TextEncoder = function TextEncoder() {};
            TextEncoder.prototype.encoding = 'utf-8';
            TextEncoder.prototype.encode = function(str) {
                str = str || '';
                var bytes = [];
                for (var i = 0; i < str.length; i++) {
                    var c = str.charCodeAt(i);
                    if (c < 0x80) {
                        bytes.push(c);
                    } else if (c < 0x800) {
                        bytes.push(0xC0 | (c >> 6), 0x80 | (c & 0x3F));
                    } else if (c >= 0xD800 && c <= 0xDBFF) {
                        var hi = c;
                        var lo = str.charCodeAt(++i);
                        var cp = ((hi - 0xD800) << 10) + (lo - 0xDC00) + 0x10000;
                        bytes.push(
                            0xF0 | (cp >> 18),
                            0x80 | ((cp >> 12) & 0x3F),
                            0x80 | ((cp >> 6) & 0x3F),
                            0x80 | (cp & 0x3F)
                        );
                    } else {
                        bytes.push(0xE0 | (c >> 12), 0x80 | ((c >> 6) & 0x3F), 0x80 | (c & 0x3F));
                    }
                }
                return new Uint8Array(bytes);
            };

            globalThis.TextDecoder = function TextDecoder(encoding) {
                this.encoding = (encoding || 'utf-8').toLowerCase();
            };
            TextDecoder.prototype.decode = function(input) {
                if (!input || input.length === 0) return '';
                var bytes = new Uint8Array(input.buffer || input);
                var len = bytes.length;
                var result = '';
                for (var i = 0; i < len;) {
                    var b = bytes[i];
                    var cp;
                    if (b < 0x80) {
                        cp = b; i++;
                    } else if ((b & 0xE0) === 0xC0) {
                        if (i + 1 >= len) break;
                        cp = ((b & 0x1F) << 6) | (bytes[i+1] & 0x3F); i += 2;
                    } else if ((b & 0xF0) === 0xE0) {
                        if (i + 2 >= len) break;
                        cp = ((b & 0x0F) << 12) | ((bytes[i+1] & 0x3F) << 6) | (bytes[i+2] & 0x3F); i += 3;
                    } else {
                        if (i + 3 >= len) break;
                        cp = ((b & 0x07) << 18) | ((bytes[i+1] & 0x3F) << 12) | ((bytes[i+2] & 0x3F) << 6) | (bytes[i+3] & 0x3F); i += 4;
                        if (cp > 0xFFFF) {
                            cp -= 0x10000;
                            result += String.fromCharCode((cp >> 10) + 0xD800, (cp & 0x3FF) + 0xDC00);
                            continue;
                        }
                    }
                    result += String.fromCharCode(cp);
                }
                return result;
            };
        })();
        """)

        // atob / btoa polyfill (not available in standalone JSContext)
        context.evaluateScript("""
        (function() {
            if (typeof globalThis.atob !== 'undefined') return;
            var chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';

            globalThis.btoa = function(input) {
                var str = String(input);
                var output = '';
                for (var i = 0; i < str.length;) {
                    var a = str.charCodeAt(i++) & 0xFF;
                    var b = i < str.length ? str.charCodeAt(i++) & 0xFF : 256;
                    var c = i < str.length ? str.charCodeAt(i++) & 0xFF : 256;
                    var bitmap = (a << 16) | (b < 256 ? b << 8 : 0) | (c < 256 ? c : 0);
                    output += chars.charAt(bitmap >> 18 & 63)
                            + chars.charAt(bitmap >> 12 & 63)
                            + (b < 256 ? chars.charAt(bitmap >> 6 & 63) : '=')
                            + (c < 256 ? chars.charAt(bitmap & 63) : '=');
                }
                return output;
            };

            globalThis.atob = function(input) {
                var str = String(input).replace(/[=]+$/, '');
                var output = '';
                for (var i = 0; i < str.length;) {
                    var a = chars.indexOf(str.charAt(i++));
                    var b = i < str.length ? chars.indexOf(str.charAt(i++)) : -1;
                    var c = i < str.length ? chars.indexOf(str.charAt(i++)) : -1;
                    var d = i < str.length ? chars.indexOf(str.charAt(i++)) : -1;
                    if (b === -1) break;
                    var bitmap = (a << 18) | (b << 12) | (c !== -1 ? c << 6 : 0) | (d !== -1 ? d : 0);
                    output += String.fromCharCode((bitmap >> 16) & 0xFF);
                    if (c !== -1) output += String.fromCharCode((bitmap >> 8) & 0xFF);
                    if (d !== -1) output += String.fromCharCode(bitmap & 0xFF);
                }
                return output;
            };
        })();
        """)

        // AbortController / AbortSignal
        context.evaluateScript("""
        (function() {
            if (typeof globalThis.AbortController !== 'undefined') return;

            function AbortSignal() {
                this.aborted = false;
                this.reason = undefined;
                this._listeners = [];
            }
            AbortSignal.prototype.addEventListener = function(type, fn) {
                if (type === 'abort') this._listeners.push(fn);
            };
            AbortSignal.prototype.removeEventListener = function(type, fn) {
                if (type === 'abort') this._listeners = this._listeners.filter(function(l) { return l !== fn; });
            };
            AbortSignal.prototype.throwIfAborted = function() {
                if (this.aborted) throw this.reason;
            };
            AbortSignal.abort = function(reason) {
                var s = new AbortSignal();
                s.aborted = true;
                s.reason = reason || new DOMException('signal is aborted', 'AbortError');
                return s;
            };
            AbortSignal.timeout = function(ms) {
                var s = new AbortSignal();
                setTimeout(function() {
                    s.aborted = true;
                    s.reason = new DOMException('signal timed out', 'TimeoutError');
                    s._listeners.forEach(function(fn) { fn(); });
                }, ms);
                return s;
            };

            function AbortController() {
                this.signal = new AbortSignal();
            }
            AbortController.prototype.abort = function(reason) {
                if (this.signal.aborted) return;
                this.signal.aborted = true;
                this.signal.reason = reason || new DOMException('signal is aborted', 'AbortError');
                this.signal._listeners.forEach(function(fn) { fn(); });
            };

            globalThis.AbortSignal = AbortSignal;
            globalThis.AbortController = AbortController;
        })();
        """)

        // DOMException polyfill
        context.evaluateScript("""
        if (typeof globalThis.DOMException === 'undefined') {
            globalThis.DOMException = function DOMException(message, name) {
                this.message = message || '';
                this.name = name || 'Error';
            };
            DOMException.prototype = Object.create(Error.prototype);
            DOMException.prototype.constructor = DOMException;
        }
        """)
    }

    /// Install the `require()` function. Must be called after all modules are registered.
    static func installRequire(in context: JSContext) {
        context.evaluateScript("""
        (function() {
            var moduleCache = {};

            var modules = {
                'path': __nodeModules.path,
                'node:path': __nodeModules.path,
                'buffer': __nodeModules.buffer,
                'node:buffer': __nodeModules.buffer,
                'url': __nodeModules.url,
                'node:url': __nodeModules.url,
                'util': __nodeModules.util,
                'node:util': __nodeModules.util,
                'os': __nodeModules.os,
                'node:os': __nodeModules.os,
                'fs': __nodeModules.fs,
                'node:fs': __nodeModules.fs,
                'fs/promises': __nodeModules.fs.promises,
                'node:fs/promises': __nodeModules.fs.promises,
                'crypto': __nodeModules.crypto,
                'node:crypto': __nodeModules.crypto,
                'http': __nodeModules.http,
                'node:http': __nodeModules.http,
                'https': __nodeModules.https,
                'node:https': __nodeModules.https,
                'stream': __nodeModules.stream,
                'node:stream': __nodeModules.stream,
                'stream/web': __nodeModules.stream,
                'node:stream/web': __nodeModules.stream,
                'timers': __nodeModules.timers,
                'node:timers': __nodeModules.timers,
                'timers/promises': __nodeModules.timers.promises,
                'node:timers/promises': __nodeModules.timers.promises,
                'events': __nodeModules.events,
                'node:events': __nodeModules.events,
                'string_decoder': __nodeModules.string_decoder,
                'node:string_decoder': __nodeModules.string_decoder,
                'querystring': __nodeModules.querystring,
                'node:querystring': __nodeModules.querystring,
                'net': __nodeModules.net,
                'node:net': __nodeModules.net,
                'tls': __nodeModules.tls,
                'node:tls': __nodeModules.tls,
                'zlib': __nodeModules.zlib,
                'node:zlib': __nodeModules.zlib,
                'child_process': __nodeModules.child_process,
                'node:child_process': __nodeModules.child_process,
                'tty': __nodeModules.tty,
                'node:tty': __nodeModules.tty,
                'readline': __nodeModules.readline,
                'node:readline': __nodeModules.readline,
                'async_hooks': __nodeModules.async_hooks,
                'node:async_hooks': __nodeModules.async_hooks,
                'module': __nodeModules.module,
                'node:module': __nodeModules.module,
                'assert': __nodeModules.assert,
                'node:assert': __nodeModules.assert,
                'worker_threads': __nodeModules.worker_threads,
                'node:worker_threads': __nodeModules.worker_threads,
                'perf_hooks': __nodeModules.perf_hooks,
                'node:perf_hooks': __nodeModules.perf_hooks,
                'diagnostics_channel': __nodeModules.diagnostics_channel,
                'node:diagnostics_channel': __nodeModules.diagnostics_channel,
                'process': globalThis.process,
                'node:process': globalThis.process,
                'http2': __nodeModules.http2,
                'node:http2': __nodeModules.http2,
                'inspector': __nodeModules.inspector,
                'node:inspector': __nodeModules.inspector,
                'node:inspector/promises': __nodeModules.inspector,
                'path/posix': __nodeModules.path,
                'path/win32': __nodeModules.path,
                'node:path/posix': __nodeModules.path,
                'node:path/win32': __nodeModules.path,
                'stream/consumers': __nodeModules.stream,
                'node:stream/consumers': __nodeModules.stream,
                'stream/promises': __nodeModules.stream,
                'node:stream/promises': __nodeModules.stream,
                'v8': __nodeModules.v8,
                'node:v8': __nodeModules.v8,
                'dns': __nodeModules.dns,
                'node:dns': __nodeModules.dns,
                'constants': __nodeModules.constants,
                'node:constants': __nodeModules.constants,
            };

            globalThis.require = function require(id) {
                if (moduleCache[id]) return moduleCache[id];
                var m = modules[id];
                if (m) {
                    moduleCache[id] = m;
                    return m;
                }
                throw new Error("Cannot find module '" + id + "'. This module is not available in swift-bun runtime.");
            };

            globalThis.require.resolve = function(id) { return id; };
            globalThis.require.cache = moduleCache;
        })();
        """)
    }
}
