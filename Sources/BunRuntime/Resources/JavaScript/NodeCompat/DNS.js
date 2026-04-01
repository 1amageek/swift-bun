(function() {
    if (!globalThis.__nodeModules) globalThis.__nodeModules = {};
    function normalizeOptions(options) {
        if (typeof options === 'number') return { family: options };
        if (options && typeof options === 'object') return options;
        return {};
    }

    function lookupResult(host, options) {
        var normalized = normalizeOptions(options);
        var family = normalized.family === 4 || normalized.family === 6 ? normalized.family : 0;
        var result = __dnsLookup(host, family);
        if (result && result.error) {
            throw new Error(result.error);
        }
        if (normalized.all) {
            return [{ address: result.address, family: result.family }];
        }
        return { address: result.address, family: result.family };
    }

    var nextLookupRequestID = 1;
    var pendingLookups = Object.create(null);

    function dispatchLookupResult(requestID, error, result, callback) {
        queueMicrotask(function() {
            if (!callback) return;
            if (error) {
                callback(error);
                return;
            }
            if (Array.isArray(result)) callback(null, result);
            else callback(null, result.address, result.family);
        });
    }

    function lookupAsync(host, options, callback) {
        var normalized = normalizeOptions(options);
        var family = normalized.family === 4 || normalized.family === 6 ? normalized.family : 0;
        var requestID = nextLookupRequestID++;
        pendingLookups[requestID] = {
            callback: callback,
            all: !!normalized.all,
        };
        __dnsLookupAsync(host, family, requestID);
    }

    globalThis.__swiftBunDNSDispatch = function(event) {
        if (!event) return;
        var pending = pendingLookups[event.requestID];
        if (!pending) return;
        delete pendingLookups[event.requestID];
        if (event.error) {
            dispatchLookupResult(event.requestID, new Error(event.error), null, pending.callback);
            return;
        }
        var result = pending.all
            ? [{ address: event.address, family: event.family }]
            : { address: event.address, family: event.family };
        dispatchLookupResult(event.requestID, null, result, pending.callback);
    };

    var dns = {
        lookup: function(host, opts, cb) {
            if (typeof opts === 'function') {
                cb = opts;
                opts = undefined;
            }
            if (cb) {
                lookupAsync(host, opts, cb);
                return;
            }
            return lookupResult(host, opts);
        },
        resolve: function(host, rrtype, cb) {
            if (typeof rrtype === 'function') cb = rrtype;
            if (cb) cb(new Error('dns.resolve not supported'));
        },
        promises: {
            lookup: function(host, opts) {
                return new Promise(function(resolve, reject) {
                    lookupAsync(host, opts, function(error, address, family) {
                        if (error) {
                            reject(error);
                            return;
                        }
                        if (Array.isArray(address)) resolve(address);
                        else resolve({ address: address, family: family });
                    });
                });
            },
            resolve: function() { return Promise.reject(new Error('dns.resolve not supported')); },
        },
    };
    dns.default = dns;
    __nodeModules.dns = dns;
})();
