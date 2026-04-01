(function() {
    if (!globalThis.__nodeModules || !__nodeModules.timers) return;
    var timers = __nodeModules.timers;
    timers.setTimeout = globalThis.setTimeout;
    timers.clearTimeout = globalThis.clearTimeout;
    timers.setInterval = globalThis.setInterval;
    timers.clearInterval = globalThis.clearInterval;
    timers.setImmediate = globalThis.setImmediate;
    timers.clearImmediate = globalThis.clearImmediate;
    timers.promises.setTimeout = function(ms, value) {
        return new Promise(function(resolve) {
            globalThis.setTimeout(function() { resolve(value); }, ms);
        });
    };
    timers.promises.setImmediate = function(value) {
        return new Promise(function(resolve) {
            globalThis.setTimeout(function() { resolve(value); }, 0);
        });
    };
})();
