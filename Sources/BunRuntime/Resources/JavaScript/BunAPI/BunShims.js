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
        var str = typeof data === 'string' ? data : new TextDecoder().decode(data);
        var hash = 5381;
        for (var i = 0; i < str.length; i++) {
            hash = ((hash << 5) + hash + str.charCodeAt(i)) >>> 0;
        }
        return hash;
    };

    Bun.inspect = function(value) {
        try { return JSON.stringify(value, null, 2); }
        catch (e) { return String(value); }
    };

    Bun.peek = function(promise) {
        return promise;
    };

    Bun.deepEquals = function(a, b) {
        var stack = typeof WeakMap !== 'undefined' ? new WeakMap() : null;
        function eq(x, y) {
            if (x === y) return x !== 0 || 1 / x === 1 / y;
            if (x !== x && y !== y) return true;
            if (x == null || y == null) return x === y;
            var tx = typeof x;
            var ty = typeof y;
            if (tx !== ty) return false;
            if (tx !== 'object') return false;
            if (x instanceof Date && y instanceof Date) return x.getTime() === y.getTime();
            if (x instanceof RegExp && y instanceof RegExp) return x.source === y.source && x.flags === y.flags;
            if (ArrayBuffer.isView(x) && ArrayBuffer.isView(y)) {
                if (x.byteLength !== y.byteLength) return false;
                var xa = new Uint8Array(x.buffer, x.byteOffset, x.byteLength);
                var ya = new Uint8Array(y.buffer, y.byteOffset, y.byteLength);
                for (var i = 0; i < xa.length; i++) {
                    if (xa[i] !== ya[i]) return false;
                }
                return true;
            }
            if (stack) {
                if (stack.has(x) && stack.get(x) === y) return true;
                stack.set(x, y);
            }
            var result;
            try {
                result = eqStructural(x, y);
            } finally {
                if (stack) stack.delete(x);
            }
            return result;
        }
        function eqStructural(x, y) {
            if (typeof Map !== 'undefined' && x instanceof Map && y instanceof Map) {
                if (x.size !== y.size) return false;
                var mapOk = true;
                x.forEach(function(v, k) {
                    if (mapOk && (!y.has(k) || !eq(v, y.get(k)))) mapOk = false;
                });
                return mapOk;
            }
            if (typeof Set !== 'undefined' && x instanceof Set && y instanceof Set) {
                if (x.size !== y.size) return false;
                var setOk = true;
                x.forEach(function(v) {
                    if (setOk && !y.has(v)) setOk = false;
                });
                return setOk;
            }
            var xa2 = Array.isArray(x);
            var ya2 = Array.isArray(y);
            if (xa2 !== ya2) return false;
            if (xa2) {
                if (x.length !== y.length) return false;
                for (var j = 0; j < x.length; j++) {
                    if (!eq(x[j], y[j])) return false;
                }
                return true;
            }
            var xk = Object.keys(x);
            var yk = Object.keys(y);
            if (xk.length !== yk.length) return false;
            for (var k = 0; k < xk.length; k++) {
                var key = xk[k];
                if (!Object.prototype.hasOwnProperty.call(y, key)) return false;
                if (!eq(x[key], y[key])) return false;
            }
            return true;
        }
        return eq(a, b);
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

    var swiftBunPackages = globalThis.__swiftBunPackages || {};
    var swiftBunSemver = swiftBunPackages.semver;
    var swiftBunYAML = swiftBunPackages.YAML;
    var swiftBunPicomatch = swiftBunPackages.picomatch;

    Bun.semver = {
        order: function(a, b) {
            return swiftBunSemver.compare(a, b);
        },
        satisfies: function(version, range) {
            return swiftBunSemver.satisfies(version, range || '*');
        }
    };

    Bun.YAML = {
        parse: function(input) {
            return swiftBunYAML.parse(String(input || ''));
        }
    };

    Bun.Glob = function Glob(pattern) {
        this.pattern = pattern;
        this._matcher = swiftBunPicomatch(pattern, { dot: true });
    };
    Bun.Glob.prototype.match = function(str) {
        return this._matcher(String(str));
    };

    Bun.serve = function() {
        throw new Error('Bun.serve() is not supported in swift-bun. Use native HTTP server alternatives.');
    };

    Bun.build = function() {
        throw new Error('Bun.build() is not supported in swift-bun runtime.');
    };

    Bun.plugin = function(options) {
        console.warn('Bun.plugin() has no effect in swift-bun runtime. Plugin: ' + ((options && options.name) || 'unknown'));
        return { name: (options && options.name) || 'noop' };
    };

    Bun.which = function(cmd) {
        return null;
    };

    Bun.color = function(input, format) {
        return null;
    };

    Bun.$ = function() {
        throw new Error('Bun.$ shell is not supported in swift-bun');
    };
})();
