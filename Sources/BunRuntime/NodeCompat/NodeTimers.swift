@preconcurrency import JavaScriptCore

/// `node:timers` and `node:timers/promises` polyfill.
///
/// JavaScriptCore has built-in `setTimeout`/`setInterval` support,
/// so this module wraps them in the Node.js module shape.
enum NodeTimers {
    static func install(in context: JSContext) {
        context.evaluateScript("""
        (function() {
            var timers = {
                setTimeout: globalThis.setTimeout,
                clearTimeout: globalThis.clearTimeout,
                setInterval: globalThis.setInterval,
                clearInterval: globalThis.clearInterval,
                setImmediate: function(fn) { return setTimeout(fn, 0); },
                clearImmediate: function(id) { clearTimeout(id); },
                promises: {
                    setTimeout: function(ms, value) {
                        return new Promise(function(resolve) {
                            setTimeout(function() { resolve(value); }, ms);
                        });
                    },
                    setImmediate: function(value) {
                        return new Promise(function(resolve) {
                            setTimeout(function() { resolve(value); }, 0);
                        });
                    },
                    setInterval: function(ms, value) {
                        // Return an async iterator
                        var done = false;
                        var id;
                        return {
                            [Symbol.asyncIterator]: function() {
                                return {
                                    next: function() {
                                        if (done) return Promise.resolve({ value: undefined, done: true });
                                        return new Promise(function(resolve) {
                                            id = setTimeout(function() {
                                                resolve({ value: value, done: false });
                                            }, ms);
                                        });
                                    },
                                    return: function() {
                                        done = true;
                                        clearTimeout(id);
                                        return Promise.resolve({ value: undefined, done: true });
                                    },
                                };
                            },
                        };
                    },
                },
            };

            // Expose setImmediate globally
            if (!globalThis.setImmediate) {
                globalThis.setImmediate = timers.setImmediate;
                globalThis.clearImmediate = timers.clearImmediate;
            }

            if (!globalThis.__nodeModules) globalThis.__nodeModules = {};
            __nodeModules.timers = timers;
        })();
        """)
    }
}
