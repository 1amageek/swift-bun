(function() {
    if (!globalThis.__nodeModules) globalThis.__nodeModules = {};
    var EventEmitter = __nodeModules.events && (__nodeModules.events.EventEmitter || __nodeModules.events);
    if (!EventEmitter) throw new Error('node:events must be installed before node:net');

    var nextServerID = 1;
    // Outbound sockets are created in JS before Swift connects them.
    // Accepted sockets are created in Swift. Keep the ID spaces disjoint.
    var nextSocketID = -1;
    var servers = Object.create(null);
    var sockets = Object.create(null);

    function toBuffer(chunk, encoding) {
        if (chunk == null) return Buffer.alloc(0);
        if (Buffer.isBuffer(chunk)) return chunk;
        if (chunk instanceof Uint8Array) return Buffer.from(chunk);
        if (ArrayBuffer.isView(chunk)) return Buffer.from(chunk.buffer, chunk.byteOffset, chunk.byteLength);
        if (chunk instanceof ArrayBuffer) return Buffer.from(new Uint8Array(chunk));
        return Buffer.from(String(chunk), encoding || 'utf8');
    }

    function Socket(id, metadata) {
        EventEmitter.call(this);
        this._id = id;
        this._encoding = null;
        this.destroyed = false;
        this.localAddress = metadata && metadata.localAddress || '';
        this.localPort = metadata && metadata.localPort || 0;
        this.remoteAddress = metadata && metadata.remoteAddress || '';
        this.remotePort = metadata && metadata.remotePort || 0;
        this.remoteFamily = this.remoteAddress && this.remoteAddress.indexOf(':') !== -1 ? 'IPv6' : 'IPv4';
    }
    Socket.prototype = Object.create(EventEmitter.prototype);
    Socket.prototype.constructor = Socket;
    Socket.prototype.setEncoding = function(encoding) {
        this._encoding = encoding || 'utf8';
        return this;
    };
    Socket.prototype.write = function(chunk, encoding, callback) {
        if (typeof encoding === 'function') {
            callback = encoding;
            encoding = undefined;
        }
        var buffer = toBuffer(chunk, encoding);
        __netWrite(this._id, Array.from(buffer));
        if (callback) callback();
        return true;
    };
    Socket.prototype.end = function(chunk, encoding, callback) {
        if (typeof chunk === 'function') {
            callback = chunk;
            chunk = undefined;
            encoding = undefined;
        } else if (typeof encoding === 'function') {
            callback = encoding;
            encoding = undefined;
        }
        var payload = chunk == null ? null : Array.from(toBuffer(chunk, encoding));
        __netEnd(this._id, payload);
        if (callback) callback();
        return this;
    };
    Socket.prototype.destroy = function(error) {
        this.destroyed = true;
        __netDestroy(this._id);
        if (error) this.emit('error', error);
        return this;
    };

    function Server(options, connectionListener) {
        if (typeof options === 'function') {
            connectionListener = options;
            options = {};
        }
        EventEmitter.call(this);
        this._id = nextServerID++;
        this._host = '127.0.0.1';
        this._port = 0;
        this.listening = false;
        if (typeof connectionListener === 'function') {
            this.on('connection', connectionListener);
        }
        servers[this._id] = this;
    }
    Server.prototype = Object.create(EventEmitter.prototype);
    Server.prototype.constructor = Server;
    Server.prototype.listen = function(port, host, callback) {
        if (typeof host === 'function') {
            callback = host;
            host = undefined;
        }
        if (callback) this.once('listening', callback);
        this._host = host || '127.0.0.1';
        __netListen(this._id, this._host, port | 0, 256);
        return this;
    };
    Server.prototype.address = function() {
        return { address: this._host, family: this._host.indexOf(':') !== -1 ? 'IPv6' : 'IPv4', port: this._port };
    };
    Server.prototype.close = function(callback) {
        if (callback) this.once('close', callback);
        __netCloseServer(this._id);
        return this;
    };

    function createSocket(metadata) {
        var socket = new Socket(nextSocketID--, metadata || {});
        sockets[socket._id] = socket;
        return socket;
    }

    function connect(options, connectionListener) {
        var host = '127.0.0.1';
        var port = 0;
        if (typeof options === 'number') {
            port = options;
        } else if (typeof options === 'object' && options) {
            host = options.host || options.hostname || host;
            port = options.port || port;
        }
        var socket = createSocket({});
        if (typeof connectionListener === 'function') socket.once('connect', connectionListener);
        __netConnect(socket._id, host, port | 0);
        return socket;
    }

    globalThis.__swiftBunNetDispatch = function(event) {
        if (!event || !event.type) return;
        if (event.type === 'listening') {
            var listeningServer = servers[event.serverID];
            if (!listeningServer) return;
            listeningServer._port = event.port;
            listeningServer._host = event.host || listeningServer._host;
            listeningServer.listening = true;
            listeningServer.emit('listening');
            return;
        }
        if (event.type === 'connection') {
            var server = servers[event.serverID];
            if (!server) return;
            var socket = new Socket(event.socketID, event);
            sockets[event.socketID] = socket;
            server.emit('connection', socket);
            return;
        }
        if (event.type === 'close' && event.serverID) {
            var closingServer = servers[event.serverID];
            if (!closingServer) return;
            closingServer.listening = false;
            delete servers[event.serverID];
            closingServer.emit('close');
            return;
        }
        var socket = sockets[event.socketID];
        if (!socket) return;
        if (event.type === 'connect') {
            socket.localAddress = event.localAddress || socket.localAddress;
            socket.localPort = event.localPort || socket.localPort;
            socket.remoteAddress = event.remoteAddress || socket.remoteAddress;
            socket.remotePort = event.remotePort || socket.remotePort;
            socket.remoteFamily = socket.remoteAddress.indexOf(':') !== -1 ? 'IPv6' : 'IPv4';
            socket.emit('connect');
            return;
        }
        if (event.type === 'data') {
            var chunk = Buffer.from(event.bytes || []);
            socket.emit('data', socket._encoding ? chunk.toString(socket._encoding) : chunk);
            return;
        }
        if (event.type === 'end') {
            socket.emit('end');
            return;
        }
        if (event.type === 'close') {
            socket.destroyed = true;
            delete sockets[event.socketID];
            socket.emit('close');
            return;
        }
        if (event.type === 'error') {
            if (event.serverID) {
                var erroredServer = servers[event.serverID];
                if (erroredServer) erroredServer.emit('error', new Error(event.message || 'socket error'));
                return;
            }
            socket.emit('error', new Error(event.message || 'socket error'));
        }
    };

    var net = {
        Socket: Socket,
        Server: Server,
        createServer: function(options, connectionListener) {
            return new Server(options, connectionListener);
        },
        createConnection: function(options, connectionListener) {
            return connect(options, connectionListener);
        },
        connect: function(options, connectionListener) {
            return connect(options, connectionListener);
        },
        isIP: function(input) {
            if (/^\d{1,3}(\.\d{1,3}){3}$/.test(input)) return 4;
            if (input.indexOf(':') !== -1) return 6;
            return 0;
        },
        isIPv4: function(input) { return this.isIP(input) === 4; },
        isIPv6: function(input) { return this.isIP(input) === 6; },
    };
    net.default = net;
    __nodeModules.net = net;
})();
