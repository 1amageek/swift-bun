(function() {
    if (!globalThis.__nodeModules) globalThis.__nodeModules = {};
    __nodeModules.async_hooks = {
        createHook: function() { return { enable: function() {}, disable: function() {} }; },
        AsyncLocalStorage: function AsyncLocalStorage() {
            this._store = undefined;
        },
        AsyncResource: function AsyncResource(type) { this.type = type; },
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
    __nodeModules.async_hooks.default = __nodeModules.async_hooks;
})();
