(function() {
    if (!globalThis.__nodeModules) globalThis.__nodeModules = {};
    var net = {
        Socket: function() {
            throw new Error('node:net Socket is not supported in swift-bun');
        },
        createServer: function() {
            throw new Error('node:net createServer is not supported in swift-bun');
        },
        createConnection: function() {
            throw new Error('node:net createConnection is not supported in swift-bun');
        },
        connect: function() {
            throw new Error('node:net connect is not supported in swift-bun');
        },
        isIP: function(input) {
            if (/^\d{1,3}(\.\d{1,3}){3}$/.test(input)) return 4;
            if (input.indexOf(':') !== -1) return 6;
            return 0;
        },
        isIPv4: function(input) { return this.isIP(input) === 4; },
        isIPv6: function(input) { return this.isIP(input) === 6; },
    };
    net.default = net;
    __nodeModules.net = net;
})();
