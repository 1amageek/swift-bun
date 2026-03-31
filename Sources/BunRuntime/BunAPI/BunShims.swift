@preconcurrency import JavaScriptCore

/// Bun global API shims: `Bun.version`, `Bun.nanoseconds()`, `Bun.sleepSync()`, etc.
enum BunShims {
    static func install(in context: JSContext) {
        context.evaluateScript("""
        (function() {
            globalThis.Bun = globalThis.Bun || {};

            Bun.version = 'swift-bun-shim';
            Bun.revision = '0000000';
            Bun.main = '';
            Bun.enableANSIColors = false;
            Bun.isMainThread = true;

            Bun.nanoseconds = function() {
                return Math.floor(performance.now() * 1e6);
            };

            Bun.sleepSync = function(ms) {
                var end = performance.now() + ms;
                while (performance.now() < end) {}
            };

            Bun.sleep = function(ms) {
                return new Promise(function(resolve) {
                    setTimeout(resolve, ms);
                });
            };

            Bun.concatArrayBuffers = function(buffers) {
                var totalLength = 0;
                for (var i = 0; i < buffers.length; i++) {
                    totalLength += buffers[i].byteLength;
                }
                var result = new Uint8Array(totalLength);
                var offset = 0;
                for (var i = 0; i < buffers.length; i++) {
                    result.set(new Uint8Array(buffers[i]), offset);
                    offset += buffers[i].byteLength;
                }
                return result.buffer;
            };

            Bun.ArrayBufferSink = function ArrayBufferSink() {
                this._chunks = [];
            };
            Bun.ArrayBufferSink.prototype.write = function(chunk) {
                this._chunks.push(chunk);
            };
            Bun.ArrayBufferSink.prototype.end = function() {
                return Bun.concatArrayBuffers(this._chunks);
            };

            Bun.fileURLToPath = function(url) {
                if (typeof url === 'string') {
                    if (url.startsWith('file://')) return decodeURIComponent(url.slice(7));
                    return url;
                }
                return decodeURIComponent(url.pathname);
            };

            Bun.pathToFileURL = function(path) {
                return new URL('file://' + encodeURI(path));
            };

            Bun.resolveSync = function(specifier, parent) {
                return specifier;
            };

            Bun.hash = function(data) {
                // Simple non-cryptographic hash (djb2)
                var str = typeof data === 'string' ? data : new TextDecoder().decode(data);
                var hash = 5381;
                for (var i = 0; i < str.length; i++) {
                    hash = ((hash << 5) + hash + str.charCodeAt(i)) >>> 0;
                }
                return hash;
            };

            Bun.inspect = function(value) {
                try { return JSON.stringify(value, null, 2); }
                catch(e) { return String(value); }
            };

            Bun.peek = function(promise) {
                return promise;
            };

            Bun.deepEquals = function(a, b) {
                return JSON.stringify(a) === JSON.stringify(b);
            };

            Bun.deepMatch = function(subset, obj) {
                if (typeof subset !== 'object' || subset === null) return subset === obj;
                for (var key in subset) {
                    if (!Bun.deepMatch(subset[key], obj[key])) return false;
                }
                return true;
            };

            Bun.escapeHTML = function(str) {
                return String(str)
                    .replace(/&/g, '&amp;')
                    .replace(/</g, '&lt;')
                    .replace(/>/g, '&gt;')
                    .replace(/"/g, '&quot;')
                    .replace(/'/g, '&#39;');
            };

            Bun.stringWidth = function(str) {
                return str.length;
            };

            Bun.Glob = function Glob(pattern) {
                this.pattern = pattern;
            };
            Bun.Glob.prototype.match = function(str) {
                // Simple glob matching (supports * and ?)
                var regex = '^' + this.pattern
                    .replace(/[.+^${}()|[\\]\\\\]/g, '\\\\$&')
                    .replace(/\\*/g, '.*')
                    .replace(/\\?/g, '.') + '$';
                return new RegExp(regex).test(str);
            };

            Bun.serve = function() {
                throw new Error('Bun.serve() is not supported in swift-bun. Use native HTTP server alternatives.');
            };

            Bun.build = function() {
                throw new Error('Bun.build() is not supported in swift-bun runtime.');
            };

            Bun.plugin = function(options) {
                console.warn('Bun.plugin() has no effect in swift-bun runtime. Plugin: ' + (options && options.name || 'unknown'));
                return { name: options && options.name || 'noop' };
            };

            Bun.which = function(cmd) {
                // Bun.which returns null when the command is not found — this is the standard API contract.
                // On iOS, no shell commands are available.
                return null;
            };

            Bun.color = function(input, format) {
                // Bun.color returns null for unrecognized inputs — this is the standard API contract.
                return null;
            };

            // Bun.$`command` (shell template literal) - not supported
            Bun.$ = function() {
                throw new Error('Bun.$ shell is not supported in swift-bun');
            };
        })();
        """)
    }
}
