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
        var closed = false;
        transform = new stream.Transform({
            write: function(chunk, encoding, cb) {
                try {
                    var buffer = toBuffer(chunk);
                    transform.bytesWritten += buffer.length;
                    chunks.push(buffer);
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
        transform.bytesWritten = 0;
        transform.flush = function(kind, callback) {
            if (typeof kind === 'function') {
                callback = kind;
            }
            if (typeof callback === 'function') {
                queueMicrotask(function() {
                    callback(null);
                });
            }
            return transform;
        };
        transform.params = function(level, strategy, callback) {
            void level;
            void strategy;
            if (typeof callback !== 'function') {
                throw new TypeError('Callback must be a function');
            }
            queueMicrotask(function() {
                callback(null);
            });
            return transform;
        };
        transform.reset = function() {
            chunks.length = 0;
            transform.bytesWritten = 0;
            return transform;
        };
        transform.close = function(callback) {
            if (typeof callback === 'function') {
                if (closed) {
                    queueMicrotask(function() {
                        callback(null);
                    });
                } else {
                    transform.once('finish', function() {
                        callback(null);
                    });
                }
            }
            if (!closed) {
                closed = true;
                if (!transform.writableEnded) {
                    transform.end();
                } else if (typeof transform.destroy === 'function') {
                    transform.destroy();
                }
            }
            return transform;
        };
        transform.once('finish', function() {
            if (closed || typeof transform.destroy !== 'function') return;
            closed = true;
            transform.destroy();
        });
        return transform;
    }

    function createPromiseMethod(syncOperation, asyncOperation) {
        return function(input, options) {
            void options;
            if (typeof asyncOperation === 'function') {
                var pending = asyncOperation(input);
                if (pending && typeof pending.then === 'function') {
                    return pending;
                }
            }
            return new Promise(function(resolve, reject) {
                queueMicrotask(function() {
                    try {
                        resolve(syncOperation(input));
                    } catch (error) {
                        reject(error);
                    }
                });
            });
        };
    }

    function createTransformConstructor(factory) {
        function ZlibTransform(options) {
            return factory(options);
        }
        return ZlibTransform;
    }

    var zlib = {
        createGzip: function(options) {
            void options;
            return createBufferingTransform(zlib.gzipSync, function(input) {
                return runAsync('compress', 'gzip', input);
            });
        },
        createGunzip: function(options) {
            void options;
            return createBufferingTransform(zlib.gunzipSync, function(input) {
                return runAsync('uncompress', 'gzip', input);
            });
        },
        createDeflate: function(options) {
            void options;
            return createBufferingTransform(zlib.deflateSync, function(input) {
                return runAsync('compress', 'zlib', input);
            });
        },
        createInflate: function(options) {
            void options;
            return createBufferingTransform(zlib.inflateSync, function(input) {
                return runAsync('uncompress', 'zlib', input);
            });
        },
        createDeflateRaw: function(options) {
            void options;
            return createBufferingTransform(zlib.deflateRawSync, function(input) {
                return runAsync('compress', 'raw', input);
            });
        },
        createInflateRaw: function(options) {
            void options;
            return createBufferingTransform(zlib.inflateRawSync, function(input) {
                return runAsync('uncompress', 'raw', input);
            });
        },
        createUnzip: function(options) {
            void options;
            return createBufferingTransform(zlib.unzipSync, function(input) {
                return runAsync('uncompress', 'auto', input);
            });
        },
        createBrotliCompress: function(options) {
            void options;
            return createBufferingTransform(zlib.brotliCompressSync, function(input) {
                return runAsync('compress', 'brotli', input);
            });
        },
        createBrotliDecompress: function(options) {
            void options;
            return createBufferingTransform(zlib.brotliDecompressSync, function(input) {
                return runAsync('uncompress', 'brotli', input);
            });
        },
        gzipSync: function(input, options) {
            void options;
            return runCompress('gzip', input);
        },
        gunzipSync: function(input, options) {
            void options;
            return runUncompress('gzip', input);
        },
        inflateSync: function(input, options) {
            void options;
            return runUncompress('zlib', input);
        },
        deflateSync: function(input, options) {
            void options;
            return runCompress('zlib', input);
        },
        inflateRawSync: function(input, options) {
            void options;
            return runUncompress('raw', input);
        },
        deflateRawSync: function(input, options) {
            void options;
            return runCompress('raw', input);
        },
        unzipSync: function(input, options) {
            void options;
            return runUncompress('auto', input);
        },
        brotliCompressSync: function(input, options) {
            void options;
            return runCompress('brotli', input);
        },
        brotliDecompressSync: function(input, options) {
            void options;
            return runUncompress('brotli', input);
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
        brotliCompress: function(input, options, callback) {
            var args = parseAsyncArgs(input, options, callback);
            queueCallback(zlib.brotliCompressSync, args.input, args.callback, function(value) {
                return runAsync('compress', 'brotli', value);
            });
        },
        brotliDecompress: function(input, options, callback) {
            var args = parseAsyncArgs(input, options, callback);
            queueCallback(zlib.brotliDecompressSync, args.input, args.callback, function(value) {
                return runAsync('uncompress', 'brotli', value);
            });
        },
        constants: {
            Z_NO_COMPRESSION: 0,
            Z_BEST_SPEED: 1,
            Z_BEST_COMPRESSION: 9,
            Z_NO_FLUSH: 0,
            Z_PARTIAL_FLUSH: 1,
            Z_SYNC_FLUSH: 2,
            Z_FULL_FLUSH: 3,
            Z_FINISH: 4,
            Z_BLOCK: 5,
            Z_TREES: 6,
            Z_DEFAULT_COMPRESSION: -1,
            Z_DEFAULT_STRATEGY: 0,
            Z_FILTERED: 1,
            Z_HUFFMAN_ONLY: 2,
            Z_RLE: 3,
            Z_FIXED: 4,
            Z_DEFLATED: 8,
            Z_DEFAULT_WINDOWBITS: 15,
            Z_MIN_WINDOWBITS: 8,
            Z_MAX_WINDOWBITS: 15,
            BROTLI_OPERATION_PROCESS: 0,
            BROTLI_OPERATION_FLUSH: 1,
            BROTLI_OPERATION_FINISH: 2,
            BROTLI_OPERATION_EMIT_METADATA: 3,
            BROTLI_MODE_GENERIC: 0,
            BROTLI_MODE_TEXT: 1,
            BROTLI_MODE_FONT: 2,
            BROTLI_DEFAULT_QUALITY: 11,
            BROTLI_DEFAULT_WINDOW: 22,
            BROTLI_MIN_INPUT_BLOCK_BITS: 16,
            BROTLI_MAX_INPUT_BLOCK_BITS: 24,
            BROTLI_PARAM_MODE: 0,
            BROTLI_PARAM_QUALITY: 1,
            BROTLI_PARAM_LGWIN: 2,
            BROTLI_PARAM_LGBLOCK: 3,
            BROTLI_PARAM_DISABLE_LITERAL_CONTEXT_MODELING: 4,
            BROTLI_PARAM_SIZE_HINT: 5,
            BROTLI_PARAM_LARGE_WINDOW: 6,
        },
    };
    zlib.promises = {
        gzip: createPromiseMethod(zlib.gzipSync, function(input) { return runAsync('compress', 'gzip', input); }),
        gunzip: createPromiseMethod(zlib.gunzipSync, function(input) { return runAsync('uncompress', 'gzip', input); }),
        deflate: createPromiseMethod(zlib.deflateSync, function(input) { return runAsync('compress', 'zlib', input); }),
        inflate: createPromiseMethod(zlib.inflateSync, function(input) { return runAsync('uncompress', 'zlib', input); }),
        deflateRaw: createPromiseMethod(zlib.deflateRawSync, function(input) { return runAsync('compress', 'raw', input); }),
        inflateRaw: createPromiseMethod(zlib.inflateRawSync, function(input) { return runAsync('uncompress', 'raw', input); }),
        unzip: createPromiseMethod(zlib.unzipSync, function(input) { return runAsync('uncompress', 'auto', input); }),
        brotliCompress: createPromiseMethod(zlib.brotliCompressSync, function(input) { return runAsync('compress', 'brotli', input); }),
        brotliDecompress: createPromiseMethod(zlib.brotliDecompressSync, function(input) { return runAsync('uncompress', 'brotli', input); }),
    };
    zlib.Gzip = createTransformConstructor(zlib.createGzip);
    zlib.Gunzip = createTransformConstructor(zlib.createGunzip);
    zlib.Deflate = createTransformConstructor(zlib.createDeflate);
    zlib.Inflate = createTransformConstructor(zlib.createInflate);
    zlib.DeflateRaw = createTransformConstructor(zlib.createDeflateRaw);
    zlib.InflateRaw = createTransformConstructor(zlib.createInflateRaw);
    zlib.Unzip = createTransformConstructor(zlib.createUnzip);
    zlib.BrotliCompress = createTransformConstructor(zlib.createBrotliCompress);
    zlib.BrotliDecompress = createTransformConstructor(zlib.createBrotliDecompress);
    zlib.default = zlib;
    __nodeModules.zlib = zlib;
})();
