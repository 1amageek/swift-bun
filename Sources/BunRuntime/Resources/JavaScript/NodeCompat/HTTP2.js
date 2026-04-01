(function() {
    if (!globalThis.__nodeModules) globalThis.__nodeModules = {};
    var http2 = {
        constants: {},
        connect: function() {
            throw new Error('node:http2 is not supported in swift-bun');
        },
        createServer: function() {
            throw new Error('node:http2 is not supported in swift-bun');
        },
        createSecureServer: function() {
            throw new Error('node:http2 is not supported in swift-bun');
        },
    };
    http2.default = http2;
    __nodeModules.http2 = http2;
})();
