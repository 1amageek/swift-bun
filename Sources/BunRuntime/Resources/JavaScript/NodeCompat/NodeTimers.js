(function() {
    function createAbortError() {
        var error;
        if (typeof DOMException === 'function') {
            error = new DOMException('The operation was aborted', 'AbortError');
        } else {
            error = new Error('The operation was aborted');
            error.name = 'AbortError';
        }
        error.code = 'ABORT_ERR';
        return error;
    }

    function normalizeOptions(options) {
        if (options == null) return {};
        if (typeof options !== 'object') return {};
        return options;
    }

    function supportsRef(handle) {
        return handle && typeof handle.ref === 'function' && typeof handle.unref === 'function';
    }

    function applyRefOption(handle, options) {
        if (supportsRef(handle) && options && options.ref === false) {
            handle.unref();
        }
        return handle;
    }

    function addAbortListener(signal, listener) {
        if (!signal || typeof signal.addEventListener !== 'function') return function() {};
        signal.addEventListener('abort', listener, { once: true });
        return function() {
            if (typeof signal.removeEventListener === 'function') {
                signal.removeEventListener('abort', listener);
            }
        };
    }

    function rejectIfAborted(signal, reject) {
        if (signal && signal.aborted) {
            setTimeout(function() {
                reject(createAbortError());
            }, 0);
            return true;
        }
        return false;
    }

    function promiseWithTimer(schedule, clear, delay, value, options) {
        options = normalizeOptions(options);
        var signal = options.signal;
        return new Promise(function(resolve, reject) {
            if (rejectIfAborted(signal, reject)) return;

            var settled = false;
            var timer = null;
            var cleanupAbort = addAbortListener(signal, function() {
                if (settled) return;
                settled = true;
                if (timer != null) clear(timer);
                setTimeout(function() {
                    reject(createAbortError());
                }, 0);
            });

            timer = applyRefOption(schedule(function() {
                if (settled) return;
                settled = true;
                cleanupAbort();
                if (signal && signal.aborted) {
                    reject(createAbortError());
                    return;
                }
                resolve(value);
            }, delay), options);
        });
    }

    function createIntervalIterator(delay, value, options) {
        options = normalizeOptions(options);
        var signal = options.signal;
        var finished = false;
        var aborted = false;
        var cleanupAbort = addAbortListener(signal, function() {
            aborted = true;
            finished = true;
        });

        function nextTick() {
            if (finished) {
                cleanupAbort();
                return Promise.resolve({ value: undefined, done: true });
            }
            if (aborted || (signal && signal.aborted)) {
                cleanupAbort();
                return Promise.reject(createAbortError());
            }

            return new Promise(function(resolve, reject) {
                var timer = applyRefOption(setTimeout(function() {
                    timer = null;
                    removeAbort();
                    if (finished) {
                        cleanupAbort();
                        resolve({ value: undefined, done: true });
                        return;
                    }
                    if (aborted || (signal && signal.aborted)) {
                        finished = true;
                        cleanupAbort();
                        reject(createAbortError());
                        return;
                    }
                    resolve({ value: value, done: false });
                }, delay), options);

                var removeAbort = addAbortListener(signal, function() {
                    if (timer != null) {
                        clearTimeout(timer);
                        timer = null;
                    }
                    finished = true;
                    aborted = true;
                    removeAbort();
                    cleanupAbort();
                    setTimeout(function() {
                        reject(createAbortError());
                    }, 0);
                });
            });
        }

        return {
            [Symbol.asyncIterator]: function() {
                return this;
            },
            next: nextTick,
            return: function() {
                finished = true;
                cleanupAbort();
                return Promise.resolve({ value: undefined, done: true });
            },
        };
    }

    var timers = {
        setTimeout: globalThis.setTimeout,
        clearTimeout: globalThis.clearTimeout,
        setInterval: globalThis.setInterval,
        clearInterval: globalThis.clearInterval,
        setImmediate: function(fn) {
            var args = Array.prototype.slice.call(arguments, 1);
            return setTimeout(function() {
                fn.apply(undefined, args);
            }, 0);
        },
        clearImmediate: function(id) { clearTimeout(id); },
        promises: {
            setTimeout: function(ms, value, options) {
                return promiseWithTimer(setTimeout, clearTimeout, ms, value, options);
            },
            setImmediate: function(value, options) {
                return promiseWithTimer(timers.setImmediate, timers.clearImmediate, 0, value, options);
            },
            setInterval: function(ms, value, options) {
                return createIntervalIterator(ms, value, options);
            },
        },
    };
    timers.promises.scheduler = {
        wait: function(ms, options) {
            return timers.promises.setTimeout(ms, undefined, options);
        },
        yield: function() {
            return timers.promises.setImmediate(undefined);
        },
    };
    timers.promises.default = timers.promises;

    if (!globalThis.setImmediate) {
        globalThis.setImmediate = timers.setImmediate;
        globalThis.clearImmediate = timers.clearImmediate;
    }

    if (!globalThis.__nodeModules) globalThis.__nodeModules = {};
    __nodeModules.timers = timers;
})();
