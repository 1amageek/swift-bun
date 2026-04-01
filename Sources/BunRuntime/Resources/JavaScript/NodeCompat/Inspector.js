(function() {
    if (!globalThis.__nodeModules) globalThis.__nodeModules = {};
    var inspector = {
        open: function() {},
        close: function() {},
        url: function() { return undefined; },
        Session: function() {
            this.connect = function() {};
            this.post = function(method, params, cb) { if (cb) cb(new Error('not supported')); };
            this.disconnect = function() {};
            this.on = function() { return this; };
        },
    };
    inspector.default = inspector;
    __nodeModules.inspector = inspector;
})();
