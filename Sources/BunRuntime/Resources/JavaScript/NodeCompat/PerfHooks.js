(function() {
    if (!globalThis.__nodeModules) globalThis.__nodeModules = {};
    var perfHooks = {
        performance: globalThis.performance || {
            now: function() { return Date.now(); },
            timeOrigin: Date.now(),
        },
        PerformanceObserver: function PerformanceObserver(callback) {
            this.callback = callback;
            this.options = null;
        },
    };
    perfHooks.PerformanceObserver.prototype.observe = function(options) {
        this.options = options || {};
    };
    perfHooks.PerformanceObserver.prototype.disconnect = function() {
        this.options = null;
    };
    perfHooks.PerformanceObserver.prototype.takeRecords = function() {
        return [];
    };
    perfHooks.PerformanceObserver.supportedEntryTypes = [];
    perfHooks.default = perfHooks;
    __nodeModules.perf_hooks = perfHooks;
})();
