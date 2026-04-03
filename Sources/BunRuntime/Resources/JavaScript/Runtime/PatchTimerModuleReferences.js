(function() {
    if (!globalThis.__nodeModules || !__nodeModules.timers) return;
    var timers = __nodeModules.timers;
    timers.setTimeout = globalThis.setTimeout;
    timers.clearTimeout = globalThis.clearTimeout;
    timers.setInterval = globalThis.setInterval;
    timers.clearInterval = globalThis.clearInterval;
    timers.setImmediate = globalThis.setImmediate;
    timers.clearImmediate = globalThis.clearImmediate;
})();
