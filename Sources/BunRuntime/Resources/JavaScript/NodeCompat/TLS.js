(function() {
    if (!globalThis.__nodeModules) globalThis.__nodeModules = {};
    var tls = {
        connect: function() {
            throw new Error('node:tls is not supported in swift-bun');
        },
        createServer: function() {
            throw new Error('node:tls createServer is not supported in swift-bun');
        },
        TLSSocket: function() {
            throw new Error('node:tls TLSSocket is not supported in swift-bun');
        },
    };
    tls.default = tls;
    __nodeModules.tls = tls;
})();
