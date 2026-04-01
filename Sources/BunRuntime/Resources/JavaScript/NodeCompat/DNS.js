(function() {
    if (!globalThis.__nodeModules) globalThis.__nodeModules = {};
    var dns = {
        lookup: function(host, opts, cb) {
            if (typeof opts === 'function') cb = opts;
            if (cb) cb(null, '127.0.0.1', 4);
        },
        resolve: function(host, rrtype, cb) {
            if (typeof rrtype === 'function') cb = rrtype;
            if (cb) cb(new Error('dns.resolve not supported'));
        },
        promises: {
            lookup: function() { return Promise.resolve({ address: '127.0.0.1', family: 4 }); },
            resolve: function() { return Promise.reject(new Error('dns.resolve not supported')); },
        },
    };
    dns.default = dns;
    __nodeModules.dns = dns;
})();
