(function() {
    if (!globalThis.__nodeModules) globalThis.__nodeModules = {};
    function normalizeOptions(options) {
        if (typeof options === 'number') return { family: options };
        if (options && typeof options === 'object') return options;
        return {};
    }

    function lookupResult(host, options) {
        var result = __dnsLookup(host);
        if (result && result.error) {
            throw new Error(result.error);
        }
        var normalized = normalizeOptions(options);
        if (normalized.all) {
            return [{ address: result.address, family: result.family }];
        }
        if (normalized.verbatim || normalized.order) {
            return { address: result.address, family: result.family };
        }
        return { address: result.address, family: result.family };
    }

    var dns = {
        lookup: function(host, opts, cb) {
            if (typeof opts === 'function') {
                cb = opts;
                opts = undefined;
            }
            try {
                var result = lookupResult(host, opts);
                if (cb) {
                    if (Array.isArray(result)) cb(null, result);
                    else cb(null, result.address, result.family);
                    return;
                }
                return result;
            } catch (error) {
                if (cb) cb(error);
                else throw error;
            }
        },
        resolve: function(host, rrtype, cb) {
            if (typeof rrtype === 'function') cb = rrtype;
            if (cb) cb(new Error('dns.resolve not supported'));
        },
        promises: {
            lookup: function(host, opts) {
                try {
                    return Promise.resolve(lookupResult(host, opts));
                } catch (error) {
                    return Promise.reject(error);
                }
            },
            resolve: function() { return Promise.reject(new Error('dns.resolve not supported')); },
        },
    };
    dns.default = dns;
    __nodeModules.dns = dns;
})();
