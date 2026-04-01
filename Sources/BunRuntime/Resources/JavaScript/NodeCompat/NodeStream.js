        (function() {
            function EventEmitter() {
                this._events = {};
                this._maxListeners = 10;
            }
            EventEmitter.prototype.on = function(event, fn) {
                if (!this._events[event]) this._events[event] = [];
                this._events[event].push(fn);
                return this;
            };
            EventEmitter.prototype.addListener = EventEmitter.prototype.on;
            EventEmitter.prototype.once = function(event, fn) {
                var self = this;
                function wrapper() {
                    self.removeListener(event, wrapper);
                    fn.apply(this, arguments);
                }
                wrapper._original = fn;
                return this.on(event, wrapper);
            };
            EventEmitter.prototype.off = function(event, fn) {
                return this.removeListener(event, fn);
            };
            EventEmitter.prototype.removeListener = function(event, fn) {
                if (!this._events[event]) return this;
                this._events[event] = this._events[event].filter(function(listener) {
                    return listener !== fn && listener._original !== fn;
                });
                return this;
            };
            EventEmitter.prototype.removeAllListeners = function(event) {
                if (event) delete this._events[event];
                else this._events = {};
                return this;
            };
            EventEmitter.prototype.emit = function(event) {
                if (!this._events[event]) return false;
                var args = Array.prototype.slice.call(arguments, 1);
                var listeners = this._events[event].slice();
                for (var index = 0; index < listeners.length; index++) {
                    listeners[index].apply(this, args);
                }
                return true;
            };
            EventEmitter.prototype.listeners = function(event) {
                return (this._events[event] || []).slice();
            };
            EventEmitter.prototype.listenerCount = function(event) {
                return (this._events[event] || []).length;
            };
            EventEmitter.prototype.setMaxListeners = function(n) {
                this._maxListeners = n;
                return this;
            };
            EventEmitter.prototype.getMaxListeners = function() {
                return this._maxListeners;
            };
            EventEmitter.prototype.rawListeners = EventEmitter.prototype.listeners;
            EventEmitter.prototype.prependListener = EventEmitter.prototype.on;
            EventEmitter.prototype.prependOnceListener = EventEmitter.prototype.once;
            EventEmitter.prototype.eventNames = function() {
                return Object.keys(this._events);
            };
            EventEmitter.defaultMaxListeners = 10;
            EventEmitter.listenerCount = function(emitter, event) {
                return emitter.listenerCount(event);
            };

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

            // --- Standalone utility functions (Node.js events module) ---

            // setMaxListeners(n, ...eventTargets) — Node.js 15.4+
            // With no targets: sets EventEmitter.defaultMaxListeners.
            // With targets: calls setMaxListeners(n) on each EventEmitter/EventTarget.
            EventEmitter.setMaxListeners = function(n) {
                if (arguments.length <= 1) {
                    EventEmitter.defaultMaxListeners = n;
                    return;
                }
                for (var i = 1; i < arguments.length; i++) {
                    var target = arguments[i];
                    if (target && typeof target.setMaxListeners === 'function') {
                        target.setMaxListeners(n);
                    } else if (target && typeof target.addEventListener === 'function') {
                        target._maxListeners = n;
                    }
                }
            };

            // getMaxListeners(emitterOrTarget) — Node.js 19.9+
            // Returns the current max listeners for an EventEmitter or EventTarget.
            function getMaxListeners(emitterOrTarget) {
                if (emitterOrTarget && typeof emitterOrTarget.getMaxListeners === 'function') {
                    return emitterOrTarget.getMaxListeners();
                }
                if (emitterOrTarget && typeof emitterOrTarget.addEventListener === 'function' && typeof emitterOrTarget._maxListeners === 'number') {
                    return emitterOrTarget._maxListeners;
                }
                return EventEmitter.defaultMaxListeners;
            }

            // getEventListeners(emitterOrTarget, eventName) — Node.js 15.2+
            // Returns a copy of the listeners array for the given event.
            function getEventListeners(emitterOrTarget, eventName) {
                if (emitterOrTarget && typeof emitterOrTarget.listeners === 'function') {
                    return emitterOrTarget.listeners(eventName);
                }
                if (emitterOrTarget && emitterOrTarget._listeners && emitterOrTarget._listeners[eventName]) {
                    return emitterOrTarget._listeners[eventName].map(function(entry) { return entry.fn; });
                }
                return [];
            }

            EventEmitter.EventEmitter = EventEmitter;
            EventEmitter.default = EventEmitter;
            EventEmitter.getMaxListeners = getMaxListeners;
            EventEmitter.getEventListeners = getEventListeners;
            __nodeModules.events = EventEmitter;

            __nodeModules.string_decoder = {
                StringDecoder: function StringDecoder(encoding) {
                    this.encoding = encoding || 'utf-8';
                },
            };
            __nodeModules.string_decoder.StringDecoder.prototype.write = function(buffer) {
                return new TextDecoder(this.encoding).decode(buffer);
            };
            __nodeModules.string_decoder.StringDecoder.prototype.end = function(buffer) {
                return buffer ? this.write(buffer) : '';
            };

            __nodeModules.querystring = {
                parse: function(str) {
                    var result = {};
                    if (!str) return result;
                    str.split('&').forEach(function(pair) {
                        var parts = pair.split('=');
                        result[decodeURIComponent(parts[0])] = decodeURIComponent(parts[1] || '');
                    });
                    return result;
                },
                stringify: function(obj) {
                    return Object.keys(obj).map(function(key) {
                        return encodeURIComponent(key) + '=' + encodeURIComponent(obj[key]);
                    }).join('&');
                },
                escape: encodeURIComponent,
                unescape: decodeURIComponent,
            };
        })();
