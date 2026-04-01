(function() {
    if (!globalThis.__nodeModules) globalThis.__nodeModules = {};
    var v8 = {
        getHeapStatistics: function() { return {}; },
        getHeapSpaceStatistics: function() {
            return [{
                space_name: 'js_heap',
                space_size: 0,
                space_used_size: 0,
                space_available_size: 0,
                physical_space_size: 0,
            }];
        },
        getHeapSnapshot: function() { return ''; },
        serialize: function(v) { return JSON.stringify(v); },
        deserialize: function(v) { return JSON.parse(v); },
    };
    v8.default = v8;
    __nodeModules.v8 = v8;
})();
