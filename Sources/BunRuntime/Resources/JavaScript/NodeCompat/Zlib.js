(function() {
    if (!globalThis.__nodeModules) globalThis.__nodeModules = {};
    function toBuffer(value) {
        if (typeof Buffer !== 'undefined' && Buffer.isBuffer && Buffer.isBuffer(value)) return value;
        if (value instanceof Uint8Array) return Buffer.from(value);
        if (ArrayBuffer.isView(value)) return Buffer.from(value.buffer, value.byteOffset, value.byteLength);
        if (value instanceof ArrayBuffer) return Buffer.from(new Uint8Array(value));
        if (typeof value === 'string') return Buffer.from(value, 'utf8');
        throw new TypeError('Unsupported zlib input');
    }

    function runCompress(format, input) {
        var buffer = toBuffer(input);
        var result = __zlibCompressSync(format, buffer.toString('base64'));
        if (result && result.error) {
            throw new Error(result.error);
        }
        return Buffer.from(result.base64 || '', 'base64');
    }

    function runUncompress(format, input) {
        var buffer = toBuffer(input);
        var result = __zlibUncompressSync(format, buffer.toString('base64'));
        if (result && result.error) {
            throw new Error(result.error);
        }
        return Buffer.from(result.base64 || '', 'base64');
    }

    var __zlibAsyncNextToken = 1;
    var __zlibAsyncPending = Object.create(null);

    globalThis.__resolveZlibAsyncToken = function(token, payload) {
        var pending = __zlibAsyncPending[token];
        if (!pending) return;
        delete __zlibAsyncPending[token];
        if (payload && payload.error) {
            pending.reject(new Error(payload.error));
            return;
        }
        pending.resolve(Buffer.from((payload && payload.base64) || '', 'base64'));
    };

    function runAsync(operation, format, input) {
        if (typeof __zlibAsyncStart !== 'function') return null;
        var buffer = toBuffer(input);
        return new Promise(function(resolve, reject) {
            var token = __zlibAsyncNextToken++;
            __zlibAsyncPending[token] = { resolve: resolve, reject: reject };
            try {
                var started = __zlibAsyncStart(operation, format, buffer.toString('base64'), token);
                if (!started) {
                    delete __zlibAsyncPending[token];
                    reject(new Error('node:zlib async bridge is not available'));
                }
            } catch (error) {
                delete __zlibAsyncPending[token];
                reject(error);
            }
        });
    }

    function queueCallback(operation, input, callback) {
        var asyncOperation = arguments.length > 3 ? arguments[3] : null;
        if (typeof asyncOperation === 'function') {
            var promise = asyncOperation(input);
            if (promise && typeof promise.then === 'function') {
                promise.then(function(result) {
                    callback(null, result);
                }, function(error) {
                    callback(error);
                });
                return;
            }
        }
        queueMicrotask(function() {
            try {
                callback(null, operation(input));
            } catch (error) {
                callback(error);
            }
        });
    }

    function parseAsyncArgs(input, options, callback) {
        if (typeof options === 'function') {
            callback = options;
            options = undefined;
        }
        if (typeof callback !== 'function') {
            throw new TypeError('Callback must be a function');
        }
        return { input: input, options: options, callback: callback };
    }

    function createBufferingTransform(operation, asyncOperation) {
        var stream = __nodeModules.stream;
        if (!stream || typeof stream.Transform !== 'function') {
            throw new Error('node:stream Transform is required before node:zlib');
        }

        var chunks = [];
        var transform;
        transform = new stream.Transform({
            write: function(chunk, encoding, cb) {
                try {
                    chunks.push(toBuffer(chunk));
                    cb();
                } catch (error) {
                    cb(error);
                }
            },
            final: function(cb) {
                var input = Buffer.concat(chunks);
                if (typeof asyncOperation === 'function') {
                    var promise = asyncOperation(input);
                    if (promise && typeof promise.then === 'function') {
                        promise.then(function(output) {
                            transform.push(output);
                            transform.push(null);
                            cb();
                        }, function(error) {
                            transform.emit('error', error);
                            cb(error);
                        });
                        return;
                    }
                }
                try {
                    var output = operation(input);
                    transform.push(output);
                    transform.push(null);
                    cb();
                } catch (error) {
                    transform.emit('error', error);
                    cb(error);
                }
            },
        });
        return transform;
    }

    var zlib = {
        createGzip: function() {
            return createBufferingTransform(zlib.gzipSync, function(input) {
                return runAsync('compress', 'gzip', input);
            });
        },
        createGunzip: function() {
            return createBufferingTransform(zlib.gunzipSync, function(input) {
                return runAsync('uncompress', 'gzip', input);
            });
        },
        createDeflate: function() {
            return createBufferingTransform(zlib.deflateSync, function(input) {
                return runAsync('compress', 'zlib', input);
            });
        },
        createInflate: function() {
            return createBufferingTransform(zlib.inflateSync, function(input) {
                return runAsync('uncompress', 'zlib', input);
            });
        },
        createDeflateRaw: function() {
            return createBufferingTransform(zlib.deflateRawSync, function(input) {
                return runAsync('compress', 'raw', input);
            });
        },
        createInflateRaw: function() {
            return createBufferingTransform(zlib.inflateRawSync, function(input) {
                return runAsync('uncompress', 'raw', input);
            });
        },
        gzipSync: function(input) {
            return runCompress('gzip', input);
        },
        gunzipSync: function(input) {
            return runUncompress('gzip', input);
        },
        inflateSync: function(input) {
            return runUncompress('zlib', input);
        },
        deflateSync: function(input) {
            return runCompress('zlib', input);
        },
        inflateRawSync: function(input) {
            return runUncompress('raw', input);
        },
        deflateRawSync: function(input) {
            return runCompress('raw', input);
        },
        unzipSync: function(input) {
            return runUncompress('auto', input);
        },
        gzip: function(input, options, callback) {
            var args = parseAsyncArgs(input, options, callback);
            queueCallback(zlib.gzipSync, args.input, args.callback, function(value) {
                return runAsync('compress', 'gzip', value);
            });
        },
        gunzip: function(input, options, callback) {
            var args = parseAsyncArgs(input, options, callback);
            queueCallback(zlib.gunzipSync, args.input, args.callback, function(value) {
                return runAsync('uncompress', 'gzip', value);
            });
        },
        deflate: function(input, options, callback) {
            var args = parseAsyncArgs(input, options, callback);
            queueCallback(zlib.deflateSync, args.input, args.callback, function(value) {
                return runAsync('compress', 'zlib', value);
            });
        },
        inflate: function(input, options, callback) {
            var args = parseAsyncArgs(input, options, callback);
            queueCallback(zlib.inflateSync, args.input, args.callback, function(value) {
                return runAsync('uncompress', 'zlib', value);
            });
        },
        deflateRaw: function(input, options, callback) {
            var args = parseAsyncArgs(input, options, callback);
            queueCallback(zlib.deflateRawSync, args.input, args.callback, function(value) {
                return runAsync('compress', 'raw', value);
            });
        },
        inflateRaw: function(input, options, callback) {
            var args = parseAsyncArgs(input, options, callback);
            queueCallback(zlib.inflateRawSync, args.input, args.callback, function(value) {
                return runAsync('uncompress', 'raw', value);
            });
        },
        unzip: function(input, options, callback) {
            var args = parseAsyncArgs(input, options, callback);
            queueCallback(zlib.unzipSync, args.input, args.callback, function(value) {
                return runAsync('uncompress', 'auto', value);
            });
        },
        constants: {
            Z_NO_FLUSH: 0,
            Z_PARTIAL_FLUSH: 1,
            Z_SYNC_FLUSH: 2,
            Z_FULL_FLUSH: 3,
            Z_FINISH: 4,
            Z_BLOCK: 5,
            Z_DEFAULT_COMPRESSION: -1,
            Z_DEFAULT_STRATEGY: 0,
            Z_DEFLATED: 8,
            Z_DEFAULT_WINDOWBITS: 15,
            Z_MIN_WINDOWBITS: 8,
            Z_MAX_WINDOWBITS: 15,
        },
    };
    zlib.default = zlib;
    __nodeModules.zlib = zlib;
})();
