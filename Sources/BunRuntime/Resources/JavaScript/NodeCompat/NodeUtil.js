(function() {
    var util = {
        promisify: function(fn) {
            return function() {
                var args = Array.prototype.slice.call(arguments);
                return new Promise(function(resolve, reject) {
                    args.push(function(err, result) {
                        if (err) reject(err);
                        else resolve(result);
                    });
                    fn.apply(null, args);
                });
            };
        },
        callbackify: function(fn) {
            return function() {
                var args = Array.prototype.slice.call(arguments);
                var cb = args.pop();
                fn.apply(null, args).then(
                    function(result) { cb(null, result); },
                    function(err) { cb(err); }
                );
            };
        },
        inherits: function(ctor, superCtor) {
            ctor.prototype = Object.create(superCtor.prototype);
            ctor.prototype.constructor = ctor;
            ctor.super_ = superCtor;
        },
        deprecate: function(fn, msg) {
            var warned = false;
            return function() {
                if (!warned) {
                    console.warn('DeprecationWarning:', msg);
                    warned = true;
                }
                return fn.apply(this, arguments);
            };
        },
        inspect: function(obj, opts) {
            try { return JSON.stringify(obj, null, 2); }
            catch (e) { return String(obj); }
        },
        format: function() {
            var args = Array.prototype.slice.call(arguments);
            if (typeof args[0] !== 'string') {
                return args.map(function(a) { return util.inspect(a); }).join(' ');
            }
            var fmt = args.shift();
            var i = 0;
            var result = fmt.replace(/%[sdifjoO%]/g, function(match) {
                if (match === '%%') return '%';
                if (i >= args.length) return match;
                var arg = args[i++];
                switch (match) {
                case '%s': return String(arg);
                case '%d':
                case '%f': return Number(arg).toString();
                case '%i': return parseInt(arg).toString();
                case '%j':
                case '%o':
                case '%O':
                    try { return JSON.stringify(arg); }
                    catch (e) { return '[Circular]'; }
                default: return match;
                }
            });
            while (i < args.length) {
                result += ' ' + util.inspect(args[i++]);
            }
            return result;
        },
	        debuglog: function(section) {
            var enabled = (process.env.NODE_DEBUG || '').split(',')
                .some(function(s) { return s.trim().toLowerCase() === section.toLowerCase(); });
            var fn = function() {
                if (enabled) {
                    var msg = util.format.apply(null, arguments);
                    console.error(section.toUpperCase() + ' ' + process.pid + ': ' + msg);
                }
            };
	            fn.enabled = enabled;
	            return fn;
	        },
	        isDeepStrictEqual: function(a, b) {
	            return deepStrictEqual(a, b, []);
	        },
	        types: {
            isDate: function(v) { return v instanceof Date; },
            isRegExp: function(v) { return v instanceof RegExp; },
            isNativeError: function(v) { return v instanceof Error; },
            isPromise: function(v) { return v instanceof Promise; },
            isArrayBuffer: function(v) { return v instanceof ArrayBuffer; },
            isTypedArray: function(v) { return ArrayBuffer.isView(v) && !(v instanceof DataView); },
            isUint8Array: function(v) { return v instanceof Uint8Array; },
        },
        TextEncoder: globalThis.TextEncoder,
        TextDecoder: globalThis.TextDecoder,
    };

	    if (!globalThis.__nodeModules) globalThis.__nodeModules = {};
	    __nodeModules.util = util;

	    function deepStrictEqual(a, b, seen) {
	        if (a === b) return true;
	        if (typeof a !== typeof b) return false;
	        if (a == null || b == null) return a === b;
	        if (a instanceof Date && b instanceof Date) return a.getTime() === b.getTime();
	        if (a instanceof RegExp && b instanceof RegExp) return String(a) === String(b);
	        if (a instanceof Error && b instanceof Error) {
	            return a.name === b.name && a.message === b.message;
	        }
	        if (typeof Buffer !== 'undefined' && Buffer.isBuffer && Buffer.isBuffer(a) && Buffer.isBuffer(b)) {
	            return a.equals(b);
	        }
	        if (ArrayBuffer.isView(a) && ArrayBuffer.isView(b)) {
	            if (a.constructor !== b.constructor || a.length !== b.length) return false;
	            for (var i = 0; i < a.length; i++) {
	                if (a[i] !== b[i]) return false;
	            }
	            return true;
	        }
	        if (Array.isArray(a) && Array.isArray(b)) {
	            if (a.length !== b.length) return false;
	            for (var j = 0; j < seen.length; j++) {
	                if (seen[j][0] === a && seen[j][1] === b) return true;
	            }
	            seen.push([a, b]);
	            for (var index = 0; index < a.length; index++) {
	                if (!deepStrictEqual(a[index], b[index], seen)) return false;
	            }
	            return true;
	        }
	        if (typeof a === 'object' && typeof b === 'object') {
	            for (var k = 0; k < seen.length; k++) {
	                if (seen[k][0] === a && seen[k][1] === b) return true;
	            }
	            seen.push([a, b]);
	            var keysA = Object.keys(a);
	            var keysB = Object.keys(b);
	            if (keysA.length !== keysB.length) return false;
	            keysA.sort();
	            keysB.sort();
	            for (var keyIndex = 0; keyIndex < keysA.length; keyIndex++) {
	                if (keysA[keyIndex] !== keysB[keyIndex]) return false;
	                if (!deepStrictEqual(a[keysA[keyIndex]], b[keysB[keyIndex]], seen)) return false;
	            }
	            return Object.getPrototypeOf(a) === Object.getPrototypeOf(b);
	        }
	        return false;
	    }
	})();
