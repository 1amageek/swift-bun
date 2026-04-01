(function() {
    function normalizeTimerId(handle) {
        if (handle && typeof handle === 'object' && typeof handle._id === 'number') {
            return handle._id;
        }
        return handle;
    }

    function makeTimerHandle(id, clearFn) {
        var handle = {
            _id: id,
            ref: function() { __nativeTimerRef(id); return handle; },
            unref: function() { __nativeTimerUnref(id); return handle; },
            hasRef: function() { return __nativeTimerHasRef(id); },
            refresh: function() { return handle; },
            close: function() { clearFn(id); return handle; }
        };
        if (typeof Symbol !== 'undefined' && Symbol.toPrimitive) {
            handle[Symbol.toPrimitive] = function() { return id; };
        }
        return handle;
    }

    process.nextTick = function(fn) {
        var args = [];
        for (var i = 1; i < arguments.length; i++) args.push(arguments[i]);
        __nativeNextTick(fn, args);
        if (!process.__nextTickDrainScheduled && !process.__nextTickDrainActive) {
            process.__nextTickDrainScheduled = true;
            Promise.resolve().then(function() {
                process.__nextTickDrainScheduled = false;
                process.__nextTickDrainActive = true;
                try {
                    __drainNextTickQueue();
                } finally {
                    process.__nextTickDrainActive = false;
                }
            });
        }
    };

    globalThis.setTimeout = function(fn, delay) {
        var args = [];
        for (var i = 2; i < arguments.length; i++) args.push(arguments[i]);
        return makeTimerHandle(__nativeSetTimeout(fn, delay || 0, args), __nativeClearTimeout);
    };
    globalThis.clearTimeout = function(id) { __nativeClearTimeout(normalizeTimerId(id)); };

    globalThis.setInterval = function(fn, delay) {
        var args = [];
        for (var i = 2; i < arguments.length; i++) args.push(arguments[i]);
        return makeTimerHandle(__nativeSetInterval(fn, delay || 0, args), __nativeClearTimeout);
    };
    globalThis.clearInterval = function(id) { __nativeClearTimeout(normalizeTimerId(id)); };

    globalThis.setImmediate = function(fn) {
        var args = [];
        for (var i = 1; i < arguments.length; i++) args.push(arguments[i]);
        return makeTimerHandle(__nativeSetTimeout(fn, 0, args), __nativeClearTimeout);
    };
    globalThis.clearImmediate = function(id) { __nativeClearTimeout(normalizeTimerId(id)); };
})();
