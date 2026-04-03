(function() {
    if (!globalThis.__nodeModules) globalThis.__nodeModules = {};

    function EventEmitter() {
        this._events = {};
        this._maxListeners = EventEmitter.defaultMaxListeners;
    }

    EventEmitter.prototype.on = function(event, fn) {
        if (event !== 'newListener' && this._events.newListener && this._events.newListener.length) {
            this.emit('newListener', event, fn);
        }
        if (!this._events[event]) this._events[event] = [];
        this._events[event].push(fn);
        if (this._maxListeners > 0 && this._events[event].length > this._maxListeners && typeof console !== 'undefined' && typeof console.warn === 'function') {
            console.warn('MaxListenersExceededWarning: Possible EventEmitter memory leak detected for event "' + event + '"');
        }
        return this;
    };
    EventEmitter.prototype.addListener = EventEmitter.prototype.on;
    EventEmitter.prototype.once = function(event, fn) {
        var self = this;
        function onceWrapper() {
            self.removeListener(event, wrapper);
            fn.apply(this, arguments);
        }
        var wrapper = onceWrapper.bind(this);
        wrapper._original = fn;
        return this.on(event, wrapper);
    };
    EventEmitter.prototype.off = function(event, fn) {
        return this.removeListener(event, fn);
    };
    EventEmitter.prototype.removeListener = function(event, fn) {
        if (!this._events[event]) return this;
        var removed = false;
        this._events[event] = this._events[event].filter(function(listener) {
            var keep = listener !== fn && listener._original !== fn;
            if (!keep) removed = true;
            return keep;
        });
        if (removed && event !== 'removeListener' && this._events.removeListener && this._events.removeListener.length) {
            this.emit('removeListener', event, fn);
        }
        return this;
    };
    EventEmitter.prototype.removeAllListeners = function(event) {
        if (event) delete this._events[event];
        else this._events = {};
        return this;
    };
    EventEmitter.prototype.emit = function(event) {
        if ((!this._events[event] || this._events[event].length === 0) && event === 'error') {
            var unhandled = arguments.length > 1 ? arguments[1] : undefined;
            if (unhandled instanceof Error) throw unhandled;
            throw new Error(unhandled == null ? 'Unhandled error.' : 'Unhandled error. (' + String(unhandled) + ')');
        }
        if (!this._events[event] || this._events[event].length === 0) {
            return false;
        }
        var args = Array.prototype.slice.call(arguments, 1);
        var listeners = this._events[event].slice();
        for (var index = 0; index < listeners.length; index++) {
            listeners[index].apply(this, args);
        }
        return true;
    };
    EventEmitter.prototype.listeners = function(event) {
        return (this._events[event] || []).map(function(listener) {
            return listener && listener._original ? listener._original : listener;
        });
    };
    EventEmitter.prototype.listenerCount = function(event) {
        return (this._events[event] || []).length;
    };
    EventEmitter.prototype.setMaxListeners = function(n) {
        this._maxListeners = n;
        return this;
    };
    EventEmitter.prototype.getMaxListeners = function() {
        return this._maxListeners;
    };
    EventEmitter.prototype.rawListeners = function(event) {
        return (this._events[event] || []).slice();
    };
    EventEmitter.prototype.prependListener = function(event, fn) {
        if (event !== 'newListener' && this._events.newListener && this._events.newListener.length) {
            this.emit('newListener', event, fn);
        }
        if (!this._events[event]) this._events[event] = [];
        this._events[event].unshift(fn);
        if (this._maxListeners > 0 && this._events[event].length > this._maxListeners && typeof console !== 'undefined' && typeof console.warn === 'function') {
            console.warn('MaxListenersExceededWarning: Possible EventEmitter memory leak detected for event "' + event + '"');
        }
        return this;
    };
    EventEmitter.prototype.prependOnceListener = function(event, fn) {
        var self = this;
        function onceWrapper() {
            self.removeListener(event, wrapper);
            fn.apply(this, arguments);
        }
        var wrapper = onceWrapper.bind(this);
        wrapper._original = fn;
        return this.prependListener(event, wrapper);
    };
    EventEmitter.prototype.eventNames = function() {
        return Object.keys(this._events);
    };

    EventEmitter.defaultMaxListeners = 10;
    EventEmitter.listenerCount = function(emitter, event) {
        return emitter.listenerCount(event);
    };
    EventEmitter.setMaxListeners = function(n) {
        if (arguments.length <= 1) {
            EventEmitter.defaultMaxListeners = n;
            return;
        }
        for (var i = 1; i < arguments.length; i++) {
            var target = arguments[i];
            if (target && typeof target.setMaxListeners === 'function') {
                target.setMaxListeners(n);
            } else if (target && typeof target.addEventListener === 'function') {
                target._maxListeners = n;
            }
        }
    };

    function getMaxListeners(emitterOrTarget) {
        if (emitterOrTarget && typeof emitterOrTarget.getMaxListeners === 'function') {
            return emitterOrTarget.getMaxListeners();
        }
        if (emitterOrTarget && typeof emitterOrTarget.addEventListener === 'function' && typeof emitterOrTarget._maxListeners === 'number') {
            return emitterOrTarget._maxListeners;
        }
        return EventEmitter.defaultMaxListeners;
    }

    function getEventListeners(emitterOrTarget, eventName) {
        if (emitterOrTarget && typeof emitterOrTarget.listeners === 'function') {
            return emitterOrTarget.listeners(eventName);
        }
        if (emitterOrTarget && emitterOrTarget._listeners && emitterOrTarget._listeners[eventName]) {
            return emitterOrTarget._listeners[eventName].map(function(entry) { return entry.fn; });
        }
        return [];
    }

    EventEmitter.EventEmitter = EventEmitter;
    EventEmitter.default = EventEmitter;
    EventEmitter.getMaxListeners = getMaxListeners;
    EventEmitter.getEventListeners = getEventListeners;

    __nodeModules.events = EventEmitter;
})();
