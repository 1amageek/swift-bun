(function() {
    if (!globalThis.__nodeModules) globalThis.__nodeModules = {};
    __nodeModules.async_hooks = {
        createHook: function() { return { enable: function() {}, disable: function() {} }; },
        AsyncLocalStorage: function AsyncLocalStorage() {
            this._store = undefined;
        },
        AsyncResource: function AsyncResource(type) { this.type = type; this.destroyed = false; },
        executionAsyncId: function() { return 0; },
        triggerAsyncId: function() { return 0; },
    };
    __nodeModules.async_hooks.AsyncLocalStorage.prototype.getStore = function() { return this._store; };
    __nodeModules.async_hooks.AsyncLocalStorage.prototype.run = function(store, fn) {
        var prev = this._store;
        this._store = store;
        try { return fn(); }
        finally { this._store = prev; }
    };
    __nodeModules.async_hooks.AsyncLocalStorage.prototype.enterWith = function(store) { this._store = store; };
    __nodeModules.async_hooks.AsyncResource.prototype.runInAsyncScope = function(fn, thisArg) {
        var args = Array.prototype.slice.call(arguments, 2);
        return fn.apply(thisArg, args);
    };
    __nodeModules.async_hooks.AsyncResource.prototype.bind = function(fn, thisArg) {
        var resource = this;
        return function() {
            return resource.runInAsyncScope.apply(resource, [fn, thisArg || this].concat(Array.prototype.slice.call(arguments)));
        };
    };
    __nodeModules.async_hooks.AsyncResource.bind = function(fn, type, thisArg) {
        return new __nodeModules.async_hooks.AsyncResource(type || 'bound-anonymous-fn').bind(fn, thisArg);
    };
    __nodeModules.async_hooks.AsyncResource.prototype.emitDestroy = function() {
        this.destroyed = true;
    };
    __nodeModules.async_hooks.default = __nodeModules.async_hooks;
})();
