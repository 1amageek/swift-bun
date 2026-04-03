(function() {
    function AbortSignal() {
        this.aborted = false;
        this.reason = undefined;
        this._listeners = [];
        this.onabort = null;
    }
    AbortSignal.prototype.addEventListener = function(type, fn, options) {
        if (type !== 'abort' || typeof fn !== 'function') return;
        this._listeners.push({
            fn: fn,
            once: !!(options && options.once),
        });
    };
    AbortSignal.prototype.removeEventListener = function(type, fn) {
        if (type === 'abort') {
            this._listeners = this._listeners.filter(function(listener) { return listener.fn !== fn; });
        }
    };
    AbortSignal.prototype.throwIfAborted = function() {
        if (this.aborted) throw this.reason;
    };
    AbortSignal.abort = function(reason) {
        var signal = new AbortSignal();
        signal.aborted = true;
        signal.reason = reason || new DOMException('signal is aborted', 'AbortError');
        return signal;
    };
    AbortSignal.timeout = function(ms) {
        var signal = new AbortSignal();
        setTimeout(function() {
            signal.aborted = true;
            signal.reason = new DOMException('signal timed out', 'TimeoutError');
            dispatchAbort(signal);
        }, ms);
        return signal;
    };
    AbortSignal.any = function(signals) {
        if (!signals || typeof signals[Symbol.iterator] !== 'function') {
            throw new TypeError('AbortSignal.any requires an iterable of AbortSignal objects');
        }
        var controller = new AbortController();
        var listeners = [];
        var array = Array.from(signals);

        function cleanup() {
            for (var i = 0; i < listeners.length; i++) {
                listeners[i].signal.removeEventListener('abort', listeners[i].listener);
            }
            listeners = [];
        }

        for (var index = 0; index < array.length; index++) {
            var signal = array[index];
            if (!signal || typeof signal.addEventListener !== 'function') {
                cleanup();
                throw new TypeError('AbortSignal.any requires AbortSignal instances');
            }
            if (signal.aborted) {
                controller.abort(signal.reason);
                cleanup();
                return controller.signal;
            }

            (function(currentSignal) {
                var listener = function() {
                    cleanup();
                    controller.abort(currentSignal.reason);
                };
                listeners.push({ signal: currentSignal, listener: listener });
                currentSignal.addEventListener('abort', listener, { once: true });
            })(signal);
        }

        return controller.signal;
    };

    function AbortController() {
        this.signal = new AbortSignal();
    }
    AbortController.prototype.abort = function(reason) {
        if (this.signal.aborted) return;
        this.signal.aborted = true;
        this.signal.reason = reason || new DOMException('signal is aborted', 'AbortError');
        dispatchAbort(this.signal);
    };

    function dispatchAbort(signal) {
        var listeners = signal._listeners.slice();
        signal._listeners = signal._listeners.filter(function(listener) { return listener.once !== true; });
        for (var i = 0; i < listeners.length; i++) {
            listeners[i].fn.call(signal, { type: 'abort', target: signal });
        }
        if (typeof signal.onabort === 'function') {
            signal.onabort.call(signal, { type: 'abort', target: signal });
        }
    }

    globalThis.AbortSignal = AbortSignal;
    globalThis.AbortController = AbortController;
})();
