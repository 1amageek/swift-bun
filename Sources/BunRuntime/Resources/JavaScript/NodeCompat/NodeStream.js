        (function() {
            var EventEmitter = __nodeModules.events && (__nodeModules.events.EventEmitter || __nodeModules.events);
            if (!EventEmitter) {
                throw new Error('node:events must be installed before node:stream');
            }

            if (!globalThis.__readableStream && !(globalThis.__nodeModules && __nodeModules.stream)) {
                throw new Error('Layer 0 stream polyfill is required before node:stream');
            }

            var stream = globalThis.__readableStream || __nodeModules.stream;
            stream.EventEmitter = stream.EventEmitter || EventEmitter;
            stream.Stream = stream.Stream || stream.Readable;
            stream.default = stream;

            function callbackPipeline() {
                var streams = Array.prototype.slice.call(arguments);
                var callback = typeof streams[streams.length - 1] === 'function' ? streams.pop() : null;
                if (typeof stream.pipeline === 'function') {
                    if (callback) {
                        streams.push(callback);
                        return stream.pipeline.apply(stream, streams);
                    }
                    return stream.pipeline.apply(stream, streams);
                }

                for (var index = 0; index < streams.length - 1; index++) {
                    streams[index].pipe(streams[index + 1]);
                }
                var last = streams[streams.length - 1];
                if (callback) {
                    last.on('finish', function() { callback(null); });
                    last.on('error', function(error) { callback(error); });
                }
                return last;
            }

            function callbackFinished(target, callback) {
                if (typeof stream.finished === 'function') {
                    return stream.finished(target, callback);
                }
                target.on('end', function() { callback(null); });
                target.on('finish', function() { callback(null); });
                target.on('error', function(error) { callback(error); });
            }

            function consumeBuffer(target) {
                return new Promise(function(resolve, reject) {
                    var chunks = [];

                    function appendChunk(chunk) {
                        if (chunk == null) return;
                        if (typeof Buffer !== 'undefined' && Buffer.isBuffer && Buffer.isBuffer(chunk)) {
                            chunks.push(chunk);
                        } else if (chunk instanceof Uint8Array) {
                            chunks.push(Buffer.from(chunk));
                        } else if (typeof chunk === 'string') {
                            chunks.push(Buffer.from(chunk));
                        } else {
                            chunks.push(Buffer.from(String(chunk)));
                        }
                    }

                    if (target && typeof target[Symbol.asyncIterator] === 'function') {
                        (async function() {
                            try {
                                for await (var chunk of target) appendChunk(chunk);
                                resolve(Buffer.concat(chunks));
                            } catch (error) {
                                reject(error);
                            }
                        })();
                        return;
                    }

                    target.on('data', appendChunk);
                    target.on('end', function() { resolve(Buffer.concat(chunks)); });
                    target.on('finish', function() { resolve(Buffer.concat(chunks)); });
                    target.on('error', reject);
                    if (typeof target.resume === 'function') target.resume();
                });
            }

            var streamPromises = {
                pipeline: function() {
                    var args = Array.prototype.slice.call(arguments);
                    return new Promise(function(resolve, reject) {
                        args.push(function(error, value) {
                            if (error) reject(error);
                            else resolve(value);
                        });
                        callbackPipeline.apply(null, args);
                    });
                },
                finished: function(target) {
                    return new Promise(function(resolve, reject) {
                        callbackFinished(target, function(error) {
                            if (error) reject(error);
                            else resolve();
                        });
                    });
                },
            };

            var streamConsumers = {
                buffer: function(target) {
                    return consumeBuffer(target);
                },
                text: function(target) {
                    return consumeBuffer(target).then(function(buffer) {
                        return buffer.toString('utf8');
                    });
                },
                json: function(target) {
                    return streamConsumers.text(target).then(function(text) {
                        return JSON.parse(text);
                    });
                },
                arrayBuffer: function(target) {
                    return consumeBuffer(target).then(function(buffer) {
                        return buffer.buffer.slice(
                            buffer.byteOffset,
                            buffer.byteOffset + buffer.byteLength
                        );
                    });
                },
            };

            if (!globalThis.__nodeModules) globalThis.__nodeModules = {};
            __nodeModules.stream = stream;
            __nodeModules.stream_promises = streamPromises;
            __nodeModules.stream_consumers = streamConsumers;
        })();
