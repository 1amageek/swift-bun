@preconcurrency import JavaScriptCore

/// `node:stream` polyfill with EventEmitter and basic Readable/Writable/Transform stubs.
enum NodeStream {
    static func install(in context: JSContext) {
        context.evaluateScript("""
        (function() {
            // EventEmitter
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
                this._events[event] = this._events[event].filter(function(f) {
                    return f !== fn && f._original !== fn;
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
                for (var i = 0; i < listeners.length; i++) {
                    listeners[i].apply(this, args);
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

            // Readable
            function Readable(options) {
                EventEmitter.call(this);
                this.readable = true;
                this.destroyed = false;
                this._readableState = { flowing: null, ended: false };
            }
            Readable.prototype = Object.create(EventEmitter.prototype);
            Readable.prototype.constructor = Readable;
            Readable.prototype.read = function() { return null; };
            Readable.prototype.pipe = function(dest) {
                this.on('data', function(chunk) { dest.write(chunk); });
                this.on('end', function() { dest.end(); });
                return dest;
            };
            Readable.prototype.unpipe = function() { return this; };
            Readable.prototype.resume = function() { this._readableState.flowing = true; return this; };
            Readable.prototype.pause = function() { this._readableState.flowing = false; return this; };
            Readable.prototype.setEncoding = function() { return this; };
            Readable.prototype.destroy = function() { this.destroyed = true; return this; };
            Readable.prototype.push = function(chunk) {
                if (chunk === null) {
                    this._readableState.ended = true;
                    this.emit('end');
                    return false;
                }
                this.emit('data', chunk);
                return true;
            };
            Readable.prototype[Symbol.asyncIterator] = function() {
                var self = this;
                var done = false;
                var buffer = [];
                var waiting = null;
                var pendingError = null;

                self.on('data', function(chunk) {
                    if (waiting) {
                        var w = waiting; waiting = null;
                        w.resolve({ value: chunk, done: false });
                    } else {
                        buffer.push(chunk);
                    }
                });
                self.on('end', function() {
                    done = true;
                    if (waiting) {
                        var w = waiting; waiting = null;
                        w.resolve({ value: undefined, done: true });
                    }
                });
                self.on('error', function(err) {
                    done = true;
                    if (waiting) {
                        var w = waiting; waiting = null;
                        w.reject(err);
                    } else {
                        pendingError = err;
                    }
                });

                return {
                    next: function() {
                        if (pendingError) {
                            var err = pendingError; pendingError = null;
                            return Promise.reject(err);
                        }
                        if (buffer.length > 0) return Promise.resolve({ value: buffer.shift(), done: false });
                        if (done) return Promise.resolve({ value: undefined, done: true });
                        return new Promise(function(resolve, reject) {
                            waiting = { resolve: resolve, reject: reject };
                        });
                    },
                    return: function() {
                        done = true;
                        self.destroy();
                        return Promise.resolve({ value: undefined, done: true });
                    },
                };
            };

            // Writable
            function Writable(options) {
                EventEmitter.call(this);
                this.writable = true;
                this.destroyed = false;
                this._writableState = { ended: false, finished: false };
            }
            Writable.prototype = Object.create(EventEmitter.prototype);
            Writable.prototype.constructor = Writable;
            Writable.prototype.write = function(chunk, encoding, cb) {
                if (typeof encoding === 'function') { cb = encoding; }
                if (cb) cb();
                return true;
            };
            Writable.prototype.end = function(chunk, encoding, cb) {
                if (chunk) this.write(chunk, encoding);
                if (typeof chunk === 'function') cb = chunk;
                if (typeof encoding === 'function') cb = encoding;
                this._writableState.ended = true;
                this._writableState.finished = true;
                this.emit('finish');
                if (cb) cb();
                return this;
            };
            Writable.prototype.destroy = function() { this.destroyed = true; return this; };
            Writable.prototype.cork = function() {};
            Writable.prototype.uncork = function() {};
            Writable.prototype.setDefaultEncoding = function() { return this; };

            // Duplex
            function Duplex(options) {
                Readable.call(this, options);
                Writable.call(this, options);
            }
            Duplex.prototype = Object.create(Readable.prototype);
            Object.assign(Duplex.prototype, Writable.prototype);
            Duplex.prototype.constructor = Duplex;

            // Transform
            function Transform(options) {
                Duplex.call(this, options);
            }
            Transform.prototype = Object.create(Duplex.prototype);
            Transform.prototype.constructor = Transform;
            Transform.prototype._transform = function(chunk, encoding, cb) { cb(null, chunk); };

            // PassThrough
            function PassThrough(options) {
                Transform.call(this, options);
            }
            PassThrough.prototype = Object.create(Transform.prototype);
            PassThrough.prototype.constructor = PassThrough;

            // pipeline
            function pipeline() {
                var streams = Array.prototype.slice.call(arguments);
                var cb = typeof streams[streams.length - 1] === 'function' ? streams.pop() : null;
                for (var i = 0; i < streams.length - 1; i++) {
                    streams[i].pipe(streams[i + 1]);
                }
                var last = streams[streams.length - 1];
                if (cb) {
                    last.on('finish', function() { cb(null); });
                    last.on('error', function(err) { cb(err); });
                }
                return last;
            }

            // finished
            function finished(stream, cb) {
                stream.on('end', function() { cb(null); });
                stream.on('finish', function() { cb(null); });
                stream.on('error', function(err) { cb(err); });
            }

            var stream = {
                Readable: Readable,
                Writable: Writable,
                Duplex: Duplex,
                Transform: Transform,
                PassThrough: PassThrough,
                EventEmitter: EventEmitter,
                pipeline: pipeline,
                finished: finished,
                Stream: Readable,
            };
            stream.default = stream;

            if (!globalThis.__nodeModules) globalThis.__nodeModules = {};
            __nodeModules.stream = stream;
            __nodeModules.events = { EventEmitter: EventEmitter, default: EventEmitter };

            // string_decoder
            __nodeModules.string_decoder = {
                StringDecoder: function StringDecoder(encoding) {
                    this.encoding = encoding || 'utf-8';
                },
            };
            __nodeModules.string_decoder.StringDecoder.prototype.write = function(buf) {
                return new TextDecoder(this.encoding).decode(buf);
            };
            __nodeModules.string_decoder.StringDecoder.prototype.end = function(buf) {
                return buf ? this.write(buf) : '';
            };

            // querystring
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
                    return Object.keys(obj).map(function(k) {
                        return encodeURIComponent(k) + '=' + encodeURIComponent(obj[k]);
                    }).join('&');
                },
                escape: encodeURIComponent,
                unescape: decodeURIComponent,
            };
        })();
        """)
    }
}
