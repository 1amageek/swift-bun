(function() {
    if (!globalThis.__nodeModules) globalThis.__nodeModules = {};
    var v8 = {
        getHeapStatistics: function() { return {}; },
        getHeapSnapshot: function() { return ''; },
        serialize: function(v) { return JSON.stringify(v); },
        deserialize: function(v) { return JSON.parse(v); },
    };
    v8.default = v8;
    __nodeModules.v8 = v8;
})();
