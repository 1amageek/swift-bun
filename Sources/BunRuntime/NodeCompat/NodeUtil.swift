@preconcurrency import JavaScriptCore

/// Pure JavaScript implementation of `node:util`.
enum NodeUtil {
    static func install(in context: JSContext) {
        context.evaluateScript("""
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
                        if (!warned) { console.warn('DeprecationWarning:', msg); warned = true; }
                        return fn.apply(this, arguments);
                    };
                },
                inspect: function(obj, opts) {
                    try { return JSON.stringify(obj, null, 2); }
                    catch(e) { return String(obj); }
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
                        switch(match) {
                            case '%s': return String(arg);
                            case '%d': case '%f': return Number(arg).toString();
                            case '%i': return parseInt(arg).toString();
                            case '%j': case '%o': case '%O':
                                try { return JSON.stringify(arg); }
                                catch(e) { return '[Circular]'; }
                            default: return match;
                        }
                    });
                    while (i < args.length) {
                        result += ' ' + util.inspect(args[i++]);
                    }
                    return result;
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
        })();
        """)
    }
}
