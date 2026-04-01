(function() {
    if (!globalThis.__nodeModules) globalThis.__nodeModules = {};
    var zlib = {
        createGzip: function() {
            throw new Error('node:zlib is not yet supported in swift-bun');
        },
        createGunzip: function() {
            throw new Error('node:zlib is not yet supported in swift-bun');
        },
        createDeflate: function() {
            throw new Error('node:zlib is not yet supported in swift-bun');
        },
        createInflate: function() {
            throw new Error('node:zlib is not yet supported in swift-bun');
        },
        gzipSync: function() {
            throw new Error('node:zlib is not yet supported in swift-bun');
        },
        gunzipSync: function() {
            throw new Error('node:zlib is not yet supported in swift-bun');
        },
        constants: {},
    };
    zlib.default = zlib;
    __nodeModules.zlib = zlib;
})();
