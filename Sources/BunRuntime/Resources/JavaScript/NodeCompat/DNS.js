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
        var addresses = Array.isArray(result && result.addresses) ? result.addresses : [{ address: result.address, family: result.family }];
        if (normalized.all) {
            return addresses;
        }
        return { address: result.address, family: result.family };
    }

    function makeDNSError(message, code) {
        var error = new Error(message);
        error.code = code || 'ENOTFOUND';
        return error;
    }

    function resolveSync(host, rrtype) {
        var type = String(rrtype || 'A').toUpperCase();
        var result = __dnsResolve(host, type);
        if (result && result.error) {
            throw makeDNSError(result.error, type === 'A' || type === 'AAAA' ? 'ENODATA' : 'ENOTIMP');
        }
        return Array.isArray(result && result.values) ? result.values : [];
    }

    function reverseSync(address) {
        var result = __dnsReverse(address);
        if (result && result.error) {
            throw makeDNSError(result.error, 'ENOTFOUND');
        }
        return Array.isArray(result && result.hostnames) ? result.hostnames : [];
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

    function queueResolve(host, rrtype, callback) {
        queueMicrotask(function() {
            try {
                callback(null, resolveSync(host, rrtype));
            } catch (error) {
                callback(error);
            }
        });
    }

    function queueReverse(address, callback) {
        queueMicrotask(function() {
            try {
                callback(null, reverseSync(address));
            } catch (error) {
                callback(error);
            }
        });
    }

    function unsupportedResolve(name) {
        return function(host, callback) {
            var error = makeDNSError('dns.' + name + '() is not supported in swift-bun', 'ENOTIMP');
            if (typeof callback === 'function') {
                queueMicrotask(function() {
                    callback(error);
                });
                return;
            }
            throw error;
        };
    }

    function promiseWrap(method) {
        return function() {
            var args = arguments;
            return new Promise(function(resolve, reject) {
                method.apply(null, Array.prototype.slice.call(args).concat(function(error, value) {
                    if (error) reject(error);
                    else resolve(value);
                }));
            });
        };
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
        var addresses = Array.isArray(event.addresses) ? event.addresses : [{ address: event.address, family: event.family }];
        var result = pending.all
            ? addresses
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
            if (typeof rrtype === 'function') {
                cb = rrtype;
                rrtype = 'A';
            }
            if (cb) {
                queueResolve(host, rrtype || 'A', cb);
                return;
            }
            return resolveSync(host, rrtype || 'A');
        },
        resolve4: function(host, cb) {
            if (cb) {
                queueResolve(host, 'A', cb);
                return;
            }
            return resolveSync(host, 'A');
        },
        resolve6: function(host, cb) {
            if (cb) {
                queueResolve(host, 'AAAA', cb);
                return;
            }
            return resolveSync(host, 'AAAA');
        },
        resolveAny: function(host, cb) {
            function run() {
                var values = [];
                try {
                    resolveSync(host, 'A').forEach(function(address) {
                        values.push({ address: address, type: 'A' });
                    });
                } catch (error) {
                    if (!(error && (error.code === 'ENODATA' || error.code === 'ENOTFOUND'))) throw error;
                }
                try {
                    resolveSync(host, 'AAAA').forEach(function(address) {
                        values.push({ address: address, type: 'AAAA' });
                    });
                } catch (error) {
                    if (!(error && (error.code === 'ENODATA' || error.code === 'ENOTFOUND'))) throw error;
                }
                if (values.length === 0) throw makeDNSError('No records found for ' + host, 'ENODATA');
                return values;
            }
            if (typeof cb === 'function') {
                queueMicrotask(function() {
                    try {
                        cb(null, run());
                    } catch (error) {
                        cb(error);
                    }
                });
                return;
            }
            return run();
        },
        resolveCname: unsupportedResolve('resolveCname'),
        resolveMx: unsupportedResolve('resolveMx'),
        resolveNaptr: unsupportedResolve('resolveNaptr'),
        resolveNs: unsupportedResolve('resolveNs'),
        resolvePtr: function(address, cb) {
            return dns.reverse(address, cb);
        },
        resolveSoa: unsupportedResolve('resolveSoa'),
        resolveSrv: unsupportedResolve('resolveSrv'),
        resolveTxt: unsupportedResolve('resolveTxt'),
        reverse: function(address, cb) {
            if (typeof cb !== 'function') {
                return reverseSync(address);
            }
            queueReverse(address, cb);
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
            resolve: function(host, rrtype) {
                return new Promise(function(resolve, reject) {
                    queueResolve(host, rrtype || 'A', function(error, values) {
                        if (error) reject(error);
                        else resolve(values);
                    });
                });
            },
            resolve4: function(host) {
                return dns.promises.resolve(host, 'A');
            },
            resolve6: function(host) {
                return dns.promises.resolve(host, 'AAAA');
            },
            resolveAny: function(host) {
                return promiseWrap(dns.resolveAny)(host);
            },
            resolveCname: function(host) {
                return promiseWrap(dns.resolveCname)(host);
            },
            resolveMx: function(host) {
                return promiseWrap(dns.resolveMx)(host);
            },
            resolveNaptr: function(host) {
                return promiseWrap(dns.resolveNaptr)(host);
            },
            resolveNs: function(host) {
                return promiseWrap(dns.resolveNs)(host);
            },
            resolvePtr: function(host) {
                return promiseWrap(dns.resolvePtr)(host);
            },
            resolveSoa: function(host) {
                return promiseWrap(dns.resolveSoa)(host);
            },
            resolveSrv: function(host) {
                return promiseWrap(dns.resolveSrv)(host);
            },
            resolveTxt: function(host) {
                return promiseWrap(dns.resolveTxt)(host);
            },
            reverse: function(address) {
                return new Promise(function(resolve, reject) {
                    queueReverse(address, function(error, values) {
                        if (error) reject(error);
                        else resolve(values);
                    });
                });
            },
        },
    };
    dns.default = dns;
    __nodeModules.dns = dns;
})();
