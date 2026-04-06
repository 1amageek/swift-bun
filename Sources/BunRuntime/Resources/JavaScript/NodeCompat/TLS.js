(function() {
    if (!globalThis.__nodeModules) globalThis.__nodeModules = {};
    var EventEmitter = __nodeModules.events && (__nodeModules.events.EventEmitter || __nodeModules.events);
    if (!EventEmitter) throw new Error('node:events must be installed before node:tls');

    var nextSocketID = 1;
    var sockets = Object.create(null);

    function toBuffer(chunk, encoding) {
        if (chunk == null) return Buffer.alloc(0);
        if (Buffer.isBuffer(chunk)) return chunk;
        if (chunk instanceof Uint8Array) return Buffer.from(chunk);
        if (ArrayBuffer.isView(chunk)) return Buffer.from(chunk.buffer, chunk.byteOffset, chunk.byteLength);
        if (chunk instanceof ArrayBuffer) return Buffer.from(new Uint8Array(chunk));
        return Buffer.from(String(chunk), encoding || 'utf8');
    }

    function normalizeConnectOptions(args) {
        var options = {};
        var callback = null;
        if (typeof args[0] === 'number') {
            options.port = args[0];
            if (typeof args[1] === 'string') {
                options.host = args[1];
                if (typeof args[2] === 'object' && args[2]) {
                    Object.assign(options, args[2]);
                    callback = typeof args[3] === 'function' ? args[3] : null;
                } else {
                    callback = typeof args[2] === 'function' ? args[2] : null;
                }
            } else if (typeof args[1] === 'object' && args[1]) {
                Object.assign(options, args[1]);
                callback = typeof args[2] === 'function' ? args[2] : null;
            } else {
                callback = typeof args[1] === 'function' ? args[1] : null;
            }
        } else if (typeof args[0] === 'object' && args[0]) {
            Object.assign(options, args[0]);
            callback = typeof args[1] === 'function' ? args[1] : null;
        } else if (typeof args[0] === 'string') {
            options.host = args[0];
            callback = typeof args[1] === 'function' ? args[1] : null;
        }

        if (typeof options.path === 'string' || typeof options.socketPath === 'string') {
            throw new Error('node:tls does not support UNIX domain sockets in swift-bun');
        }

        return {
            host: options.host || options.hostname || '127.0.0.1',
            port: Number(options.port || 443) || 443,
            servername: options.servername || options.host || options.hostname || '',
            rejectUnauthorized: options.rejectUnauthorized !== false,
            ALPNProtocols: options.ALPNProtocols,
            callback: callback,
        };
    }

    function TLSSocket(options) {
        EventEmitter.call(this);
        options = options || {};
        this._id = nextSocketID++;
        this._encoding = null;
        this._paused = false;
        this._queue = [];
        this._timeoutMs = 0;
        this._timeoutHandle = null;
        this._refed = true;
        this.encrypted = true;
        this.authorized = false;
        this.authorizationError = null;
        this.alpnProtocol = null;
        this.servername = options.servername || '';
        this.remoteAddress = '';
        this.remotePort = 0;
        this.localAddress = '';
        this.localPort = 0;
        this.bytesRead = 0;
        this.bytesWritten = 0;
        this.connecting = false;
        this.pending = false;
        this.destroyed = false;
        sockets[this._id] = this;
    }
    TLSSocket.prototype = Object.create(EventEmitter.prototype);
    TLSSocket.prototype.constructor = TLSSocket;

    TLSSocket.prototype._clearTimeoutHandle = function() {
        if (this._timeoutHandle != null) {
            clearTimeout(this._timeoutHandle);
            this._timeoutHandle = null;
        }
    };
    TLSSocket.prototype._refreshTimeout = function() {
        var self = this;
        if (!this._timeoutMs) return;
        this._clearTimeoutHandle();
        this._timeoutHandle = setTimeout(function() {
            self.emit('timeout');
        }, this._timeoutMs);
    };
    TLSSocket.prototype.setEncoding = function(encoding) {
        this._encoding = encoding || 'utf8';
        return this;
    };
    TLSSocket.prototype.setTimeout = function(timeout, callback) {
        this._timeoutMs = Math.max(0, Number(timeout) || 0);
        if (typeof callback === 'function') this.once('timeout', callback);
        this._clearTimeoutHandle();
        if (this._timeoutMs > 0) this._refreshTimeout();
        return this;
    };
    TLSSocket.prototype.setNoDelay = function() { return this; };
    TLSSocket.prototype.setKeepAlive = function() { return this; };
    TLSSocket.prototype.getProtocol = function() { return this.alpnProtocol || null; };
    TLSSocket.prototype.getCipher = function() {
        return { name: 'TLS', standardName: 'TLS', version: 'TLSv1.3' };
    };
    TLSSocket.prototype.address = function() {
        return {
            address: this.localAddress || '',
            family: (this.localAddress || '').indexOf(':') !== -1 ? 'IPv6' : 'IPv4',
            port: this.localPort || 0,
        };
    };
    TLSSocket.prototype.pause = function() {
        this._paused = true;
        return this;
    };
    TLSSocket.prototype.resume = function() {
        this._paused = false;
        while (!this._paused && this._queue.length > 0) {
            this.emit('data', this._queue.shift());
        }
        return this;
    };
    TLSSocket.prototype.unshift = function(chunk) {
        var buffer = toBuffer(chunk);
        var value = this._encoding ? buffer.toString(this._encoding) : buffer;
        this._queue.unshift(value);
        if (!this._paused) this.resume();
        return this;
    };
    TLSSocket.prototype.ref = function() {
        if (!this._refed) {
            this._refed = true;
            __tlsSetSocketRef(this._id, true);
        }
        return this;
    };
    TLSSocket.prototype.unref = function() {
        if (this._refed) {
            this._refed = false;
            __tlsSetSocketRef(this._id, false);
        }
        return this;
    };
    TLSSocket.prototype.connect = function() {
        var normalized = normalizeConnectOptions(arguments);
        if (typeof normalized.callback === 'function') this.once('secureConnect', normalized.callback);
        this.servername = normalized.servername || normalized.host;
        this.remoteAddress = normalized.host;
        this.remotePort = normalized.port;
        this.connecting = true;
        this.pending = true;
        __tlsConnect(this._id, normalized.host, normalized.port, this.servername, !!normalized.rejectUnauthorized);
        return this;
    };
    TLSSocket.prototype.write = function(chunk, encoding, callback) {
        if (typeof encoding === 'function') {
            callback = encoding;
            encoding = undefined;
        }
        var buffer = toBuffer(chunk, encoding);
        this.bytesWritten += buffer.length;
        this._refreshTimeout();
        __tlsWrite(this._id, Array.from(buffer));
        if (typeof callback === 'function') callback();
        return true;
    };
    TLSSocket.prototype.end = function(chunk, encoding, callback) {
        if (typeof chunk === 'function') {
            callback = chunk;
            chunk = undefined;
            encoding = undefined;
        } else if (typeof encoding === 'function') {
            callback = encoding;
            encoding = undefined;
        }
        var payload = chunk == null ? null : Array.from(toBuffer(chunk, encoding));
        if (payload) this.bytesWritten += payload.length;
        this._refreshTimeout();
        __tlsEnd(this._id, payload);
        if (typeof callback === 'function') callback();
        return this;
    };
    TLSSocket.prototype.destroy = function(error) {
        this.destroyed = true;
        this.connecting = false;
        this.pending = false;
        this._clearTimeoutHandle();
        __tlsDestroy(this._id);
        if (error) this.emit('error', error);
        return this;
    };

    function connect() {
        var socket = new TLSSocket();
        socket.connect.apply(socket, arguments);
        return socket;
    }

    globalThis.__swiftBunTLSDispatch = function(event) {
        if (!event || !event.type) return;
        var socket = sockets[event.socketID];
        if (!socket) return;
        if (event.type === 'secureConnect') {
            socket.connecting = false;
            socket.pending = false;
            socket.authorized = event.authorized !== false;
            socket.authorizationError = event.authorizationError || null;
            socket.alpnProtocol = event.alpnProtocol || null;
            socket.remoteAddress = event.remoteAddress || socket.remoteAddress;
            socket.remotePort = event.remotePort || socket.remotePort;
            socket.servername = event.serverName || socket.servername;
            socket._refreshTimeout();
            socket.emit('connect');
            socket.emit('secureConnect');
            return;
        }
        if (event.type === 'data') {
            var chunk = Buffer.from(event.bytes || []);
            socket.bytesRead += chunk.length;
            socket._refreshTimeout();
            var value = socket._encoding ? chunk.toString(socket._encoding) : chunk;
            if (socket._paused) socket._queue.push(value);
            else socket.emit('data', value);
            return;
        }
        if (event.type === 'end') {
            socket._clearTimeoutHandle();
            socket.emit('end');
            return;
        }
        if (event.type === 'close') {
            socket.destroyed = true;
            socket.connecting = false;
            socket.pending = false;
            socket._clearTimeoutHandle();
            delete sockets[event.socketID];
            socket.emit('close', !!event.hadError);
            return;
        }
        if (event.type === 'error') {
            socket._clearTimeoutHandle();
            socket.emit('error', new Error(event.message || 'tls socket error'));
        }
    };

    var tls = {
        connect: connect,
        createServer: function() {
            throw new Error('node:tls createServer is not supported in swift-bun');
        },
        TLSSocket: TLSSocket,
    };
    tls.default = tls;
    __nodeModules.tls = tls;
})();
