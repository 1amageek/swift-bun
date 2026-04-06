(function() {
    if (!globalThis.__nodeModules) globalThis.__nodeModules = {};
    var EventEmitter = __nodeModules.events && (__nodeModules.events.EventEmitter || __nodeModules.events);
    var Stream = __nodeModules.stream;
    if (!EventEmitter) throw new Error('node:events must be installed before node:http2');
    if (!Stream) throw new Error('node:stream must be installed before node:http2');

    function bufferFrom(chunk, encoding) {
        if (chunk == null) return Buffer.alloc(0);
        if (Buffer.isBuffer(chunk)) return chunk;
        if (chunk instanceof Uint8Array) return Buffer.from(chunk);
        if (ArrayBuffer.isView(chunk)) return Buffer.from(chunk.buffer, chunk.byteOffset, chunk.byteLength);
        if (chunk instanceof ArrayBuffer) return Buffer.from(new Uint8Array(chunk));
        return Buffer.from(String(chunk), encoding || 'utf8');
    }

    function normalizeHeaders(headers) {
        var result = {};
        if (!headers) return result;
        for (var key in headers) {
            result[String(key).toLowerCase()] = headers[key];
        }
        return result;
    }

    function toFetchHeaders(headers) {
        var result = {};
        for (var key in headers) {
            if (key.charAt(0) === ':') continue;
            result[key] = String(headers[key]);
        }
        return result;
    }

    function responseHeadersFromFetch(response) {
        var headers = {
            ':status': response.status,
        };
        if (response.headers && typeof response.headers.forEach === 'function') {
            response.headers.forEach(function(value, key) {
                headers[key.toLowerCase()] = String(value);
            });
        }
        return headers;
    }

    function ClientHttp2Stream(session, headers, options) {
        Stream.Duplex.call(this, {
            read: function() {},
            write: function(chunk, encoding, callback) {
                this._body.push(bufferFrom(chunk, encoding));
                callback();
            }.bind(this),
            final: function(callback) {
                this._startRequest();
                callback();
            }.bind(this),
        });
        this.session = session;
        this.sentHeaders = normalizeHeaders(headers);
        this.options = options || {};
        this._body = [];
        this._encoding = null;
        this._started = false;
        this.closed = false;
        this.destroyed = false;
    }
    ClientHttp2Stream.prototype = Object.create(Stream.Duplex.prototype);
    ClientHttp2Stream.prototype.constructor = ClientHttp2Stream;
    ClientHttp2Stream.prototype.setEncoding = function(encoding) {
        this._encoding = encoding || 'utf8';
        return this;
    };
    ClientHttp2Stream.prototype.close = function(code, callback) {
        if (typeof code === 'function') {
            callback = code;
        }
        this.closed = true;
        if (typeof callback === 'function') this.once('close', callback);
        this.push(null);
        this.emit('close');
        return this;
    };
    ClientHttp2Stream.prototype.destroy = function(error) {
        this.destroyed = true;
        Stream.Duplex.prototype.destroy.call(this, error);
        if (error) this.emit('error', error);
        return this;
    };
    ClientHttp2Stream.prototype._startRequest = function() {
        var self = this;
        if (self._started || self.session.destroyed) return;
        self._started = true;

        var method = String(self.sentHeaders[':method'] || 'GET').toUpperCase();
        var path = self.sentHeaders[':path'] || '/';
        var authority = self.sentHeaders[':authority'] || self.session.authority.host;
        var scheme = self.sentHeaders[':scheme'] || self.session.authority.protocol.replace(':', '');
        var url = scheme + '://' + authority + path;
        var body = Buffer.concat(self._body);
        var init = {
            method: method,
            headers: toFetchHeaders(self.sentHeaders),
        };
        if (body.length > 0 && method !== 'GET' && method !== 'HEAD') {
            init.body = body;
        }

        fetch(url, init).then(function(response) {
            self.emit('response', responseHeadersFromFetch(response), 0);
            if (method === 'HEAD' || !response.body) {
                self.push(null);
                self.emit('end');
                self.emit('close');
                return;
            }

            var pump = async function() {
                try {
                    if (typeof response.body.getReader === 'function') {
                        var reader = response.body.getReader();
                        while (true) {
                            var step = await reader.read();
                            if (step.done) break;
                            var chunk = bufferFrom(step.value);
                            self.push(self._encoding ? chunk.toString(self._encoding) : chunk);
                        }
                    } else if (typeof response.body[Symbol.asyncIterator] === 'function') {
                        for await (var asyncChunk of response.body) {
                            var chunk = bufferFrom(asyncChunk);
                            self.push(self._encoding ? chunk.toString(self._encoding) : chunk);
                        }
                    }
                    self.push(null);
                    self.emit('end');
                    self.emit('close');
                } catch (error) {
                    self.emit('error', error);
                    self.emit('close');
                }
            };
            queueMicrotask(function() {
                pump();
            });
        }, function(error) {
            self.emit('error', error instanceof Error ? error : new Error(String(error)));
            self.emit('close');
        });
    };

    function ClientHttp2Session(authority, options) {
        EventEmitter.call(this);
        this.authority = new URL(authority);
        this.options = options || {};
        this.closed = false;
        this.destroyed = false;
        var self = this;
        queueMicrotask(function() {
            self.emit('connect', self, null);
        });
    }
    ClientHttp2Session.prototype = Object.create(EventEmitter.prototype);
    ClientHttp2Session.prototype.constructor = ClientHttp2Session;
    ClientHttp2Session.prototype.request = function(headers, options) {
        if (this.destroyed) throw new Error('HTTP/2 session has been destroyed');
        var stream = new ClientHttp2Stream(this, headers, options);
        return stream;
    };
    ClientHttp2Session.prototype.close = function(callback) {
        this.closed = true;
        if (typeof callback === 'function') this.once('close', callback);
        this.emit('close');
        return this;
    };
    ClientHttp2Session.prototype.destroy = function(error) {
        this.destroyed = true;
        if (error) this.emit('error', error);
        this.emit('close');
        return this;
    };
    ClientHttp2Session.prototype.ref = function() { return this; };
    ClientHttp2Session.prototype.unref = function() { return this; };

    var constants = {
        HTTP2_HEADER_STATUS: ':status',
        HTTP2_HEADER_METHOD: ':method',
        HTTP2_HEADER_PATH: ':path',
        HTTP2_HEADER_AUTHORITY: ':authority',
        HTTP2_HEADER_SCHEME: ':scheme',
        NGHTTP2_CANCEL: 8,
    };

    var http2 = {
        constants: constants,
        connect: function(authority, options, listener) {
            if (typeof options === 'function') {
                listener = options;
                options = {};
            }
            var session = new ClientHttp2Session(authority, options || {});
            if (typeof listener === 'function') session.once('connect', listener);
            return session;
        },
        createServer: function() {
            throw new Error('node:http2 createServer is not supported in swift-bun');
        },
        createSecureServer: function() {
            throw new Error('node:http2 createSecureServer is not supported in swift-bun');
        },
        ClientHttp2Session: ClientHttp2Session,
        ClientHttp2Stream: ClientHttp2Stream,
    };
    http2.default = http2;
    __nodeModules.http2 = http2;
})();
