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

    function stripIPv6Brackets(input) {
        if (typeof input !== 'string') return '';
        if (input.charAt(0) === '[' && input.charAt(input.length - 1) === ']') {
            return input.slice(1, -1);
        }
        return input;
    }

    function parseIPv4(input) {
        if (typeof input !== 'string') return null;
        var parts = input.split('.');
        if (parts.length !== 4) return null;
        var bytes = [];
        for (var index = 0; index < parts.length; index += 1) {
            if (!/^\d+$/.test(parts[index])) return null;
            var value = Number(parts[index]);
            if (!Number.isInteger(value) || value < 0 || value > 255) return null;
            bytes.push(value);
        }
        return bytes;
    }

    function parseIPv6(input) {
        if (typeof input !== 'string') return null;
        var value = stripIPv6Brackets(input).toLowerCase();
        var zoneIndex = value.indexOf('%');
        if (zoneIndex !== -1) value = value.slice(0, zoneIndex);
        if (!value) return null;

        var halves = value.split('::');
        if (halves.length > 2) return null;

        function parseSection(section) {
            if (!section) return [];
            var rawParts = section.split(':');
            var result = [];
            for (var idx = 0; idx < rawParts.length; idx += 1) {
                var part = rawParts[idx];
                if (!part) return null;
                if (part.indexOf('.') !== -1) {
                    if (idx !== rawParts.length - 1) return null;
                    var ipv4 = parseIPv4(part);
                    if (!ipv4) return null;
                    result.push((ipv4[0] << 8) | ipv4[1]);
                    result.push((ipv4[2] << 8) | ipv4[3]);
                    continue;
                }
                if (!/^[0-9a-f]{1,4}$/.test(part)) return null;
                result.push(parseInt(part, 16));
            }
            return result;
        }

        var head = parseSection(halves[0]);
        if (!head) return null;
        var tail = halves.length === 2 ? parseSection(halves[1]) : [];
        if (!tail) return null;

        var missing = 8 - (head.length + tail.length);
        if (halves.length === 1) {
            if (missing !== 0) return null;
        } else if (missing < 1) {
            return null;
        }

        var words = head.slice();
        for (var fill = 0; fill < missing; fill += 1) words.push(0);
        for (var tailIndex = 0; tailIndex < tail.length; tailIndex += 1) words.push(tail[tailIndex]);
        if (words.length !== 8) return null;

        var bytes = [];
        for (var wordIndex = 0; wordIndex < words.length; wordIndex += 1) {
            bytes.push((words[wordIndex] >> 8) & 0xff);
            bytes.push(words[wordIndex] & 0xff);
        }
        return bytes;
    }

    function normalizeIPFamily(type) {
        if (type === 4 || type === 'ipv4' || type === 'IPv4') return 'ipv4';
        if (type === 6 || type === 'ipv6' || type === 'IPv6') return 'ipv6';
        return null;
    }

    function parseIPAddress(input, explicitFamily) {
        var family = normalizeIPFamily(explicitFamily);
        var value = stripIPv6Brackets(String(input || ''));
        if (!family || family === 'ipv4') {
            var ipv4 = parseIPv4(value);
            if (ipv4) return { family: 'ipv4', bytes: ipv4 };
            if (family === 'ipv4') return null;
        }
        if (!family || family === 'ipv6') {
            var ipv6 = parseIPv6(value);
            if (ipv6) return { family: 'ipv6', bytes: ipv6 };
        }
        return null;
    }

    function bitsMatch(candidate, rule, prefixLength) {
        var fullBytes = Math.floor(prefixLength / 8);
        for (var index = 0; index < fullBytes; index += 1) {
            if (candidate[index] !== rule[index]) return false;
        }
        var partialBits = prefixLength % 8;
        if (partialBits === 0) return true;
        var mask = (0xff << (8 - partialBits)) & 0xff;
        return (candidate[fullBytes] & mask) === (rule[fullBytes] & mask);
    }

    function BlockList() {
        if (!(this instanceof BlockList)) return new BlockList();
        this.rules = [];
    }
    BlockList.prototype.addAddress = function(address, type) {
        var parsed = parseIPAddress(address, type);
        if (!parsed) throw new Error('Invalid IP address');
        this.rules.push({
            kind: 'address',
            family: parsed.family,
            bytes: parsed.bytes.slice(),
            prefix: parsed.family === 'ipv6' ? 128 : 32
        });
        return this;
    };
    BlockList.prototype.addSubnet = function(address, prefix, type) {
        var parsed = parseIPAddress(address, type);
        if (!parsed) throw new Error('Invalid subnet address');
        var maxBits = parsed.family === 'ipv6' ? 128 : 32;
        if (!Number.isInteger(prefix) || prefix < 0 || prefix > maxBits) {
            throw new Error('Invalid subnet prefix');
        }
        this.rules.push({
            kind: 'subnet',
            family: parsed.family,
            bytes: parsed.bytes.slice(),
            prefix: prefix
        });
        return this;
    };
    BlockList.prototype.check = function(address, type) {
        var parsed = parseIPAddress(address, type);
        if (!parsed) return false;
        for (var index = 0; index < this.rules.length; index += 1) {
            var rule = this.rules[index];
            if (rule.family !== parsed.family) continue;
            if (bitsMatch(parsed.bytes, rule.bytes, rule.prefix)) return true;
        }
        return false;
    };

    function toBuffer(chunk, encoding) {
        if (chunk == null) return Buffer.alloc(0);
        if (Buffer.isBuffer(chunk)) return chunk;
        if (chunk instanceof Uint8Array) return Buffer.from(chunk);
        if (ArrayBuffer.isView(chunk)) return Buffer.from(chunk.buffer, chunk.byteOffset, chunk.byteLength);
        if (chunk instanceof ArrayBuffer) return Buffer.from(new Uint8Array(chunk));
        return Buffer.from(String(chunk), encoding || 'utf8');
    }

    function normalizeConnectArgs(args) {
        var options = args[0];
        var host = '127.0.0.1';
        var port = 0;
        var connectionListener = null;

        if (typeof options === 'number') {
            port = options;
            if (typeof args[1] === 'string') {
                host = args[1];
                if (typeof args[2] === 'function') connectionListener = args[2];
            } else if (typeof args[1] === 'function') {
                connectionListener = args[1];
            }
        } else if (typeof options === 'object' && options) {
            if (typeof options.path === 'string') {
                throw new Error('node:net UNIX domain sockets are not supported in swift-bun');
            }
            host = options.host || options.hostname || host;
            port = options.port || port;
            if (typeof args[1] === 'function') connectionListener = args[1];
        } else if (typeof options === 'string') {
            throw new Error('node:net UNIX domain sockets are not supported in swift-bun');
        }

        return {
            host: host,
            port: port | 0,
            connectionListener: connectionListener
        };
    }

    function registerSocket(socket) {
        sockets[socket._id] = socket;
        return socket;
    }

    function finalizeServerClose(serverID) {
        var server = servers[serverID];
        if (!server || server.listening || server.connections > 0 || !server._pendingClose) return;
        server._pendingClose = false;
        delete servers[serverID];
        server.emit('close');
    }

    function Socket(idOrOptions, metadata) {
        EventEmitter.call(this);
        var internal = typeof idOrOptions === 'number';
        this._id = internal ? idOrOptions : nextSocketID--;
        this._encoding = null;
        this._paused = false;
        this._readQueue = [];
        this._timeoutHandle = null;
        this._timeoutDuration = 0;
        this._hadError = false;
        this._refed = true;
        this._serverID = null;
        this.connecting = false;
        this.pending = false;
        this.destroyed = false;
        this.bytesRead = 0;
        this.bytesWritten = 0;
        this.localAddress = metadata && metadata.localAddress || '';
        this.localPort = metadata && metadata.localPort || 0;
        this.remoteAddress = metadata && metadata.remoteAddress || '';
        this.remotePort = metadata && metadata.remotePort || 0;
        this.remoteFamily = this.remoteAddress && this.remoteAddress.indexOf(':') !== -1 ? 'IPv6' : 'IPv4';
        registerSocket(this);
    }
    Socket.prototype = Object.create(EventEmitter.prototype);
    Socket.prototype.constructor = Socket;
    Socket.prototype.address = function() {
        return {
            address: this.localAddress || '',
            family: (this.localAddress || '').indexOf(':') !== -1 ? 'IPv6' : 'IPv4',
            port: this.localPort || 0
        };
    };
    Socket.prototype._clearTimeoutHandle = function() {
        if (this._timeoutHandle != null) {
            clearTimeout(this._timeoutHandle);
            this._timeoutHandle = null;
        }
    };
    Socket.prototype._refreshTimeout = function() {
        var self = this;
        if (!this._timeoutDuration) return;
        this._clearTimeoutHandle();
        this._timeoutHandle = setTimeout(function() {
            self.emit('timeout');
        }, this._timeoutDuration);
    };
    Socket.prototype.setEncoding = function(encoding) {
        this._encoding = encoding || 'utf8';
        return this;
    };
    Socket.prototype.setTimeout = function(timeout, callback) {
        this._timeoutDuration = Math.max(0, Number(timeout) || 0);
        if (typeof callback === 'function') this.once('timeout', callback);
        this._clearTimeoutHandle();
        if (this._timeoutDuration > 0) this._refreshTimeout();
        return this;
    };
    Socket.prototype.pause = function() {
        this._paused = true;
        return this;
    };
    Socket.prototype.resume = function() {
        this._paused = false;
        while (!this._paused && this._readQueue.length > 0) {
            this.emit('data', this._readQueue.shift());
        }
        return this;
    };
    Socket.prototype.unshift = function(chunk) {
        var buffer = toBuffer(chunk);
        var value = this._encoding ? buffer.toString(this._encoding) : buffer;
        this._readQueue.unshift(value);
        if (!this._paused) this.resume();
        return this;
    };
    Socket.prototype.ref = function() {
        if (!this._refed) {
            this._refed = true;
            __netSetSocketRef(this._id, true);
        }
        return this;
    };
    Socket.prototype.unref = function() {
        if (this._refed) {
            this._refed = false;
            __netSetSocketRef(this._id, false);
        }
        return this;
    };
    Socket.prototype.setNoDelay = function() { return this; };
    Socket.prototype.setKeepAlive = function() { return this; };
    Socket.prototype.connect = function() {
        var normalized = normalizeConnectArgs(arguments);
        if (typeof normalized.connectionListener === 'function') {
            this.once('connect', normalized.connectionListener);
        }
        this.connecting = true;
        this.pending = true;
        __netConnect(this._id, normalized.host, normalized.port);
        return this;
    };
    Socket.prototype.write = function(chunk, encoding, callback) {
        if (typeof encoding === 'function') {
            callback = encoding;
            encoding = undefined;
        }
        var buffer = toBuffer(chunk, encoding);
        this.bytesWritten += buffer.length;
        this._refreshTimeout();
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
        if (payload) this.bytesWritten += payload.length;
        this._refreshTimeout();
        __netEnd(this._id, payload);
        if (callback) callback();
        return this;
    };
    Socket.prototype.destroy = function(error) {
        this.destroyed = true;
        this.connecting = false;
        this.pending = false;
        this._clearTimeoutHandle();
        __netDestroy(this._id);
        if (error) {
            this._hadError = true;
            this.emit('error', error);
        }
        return this;
    };
    Socket.prototype.destroySoon = function() {
        this.end();
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
        this._backlog = 256;
        this._refed = true;
        this._pendingClose = false;
        this.listening = false;
        this.connections = 0;
        this.maxConnections = 0;
        this.allowHalfOpen = !!(options && options.allowHalfOpen);
        if (typeof connectionListener === 'function') {
            this.on('connection', connectionListener);
        }
        servers[this._id] = this;
    }
    Server.prototype = Object.create(EventEmitter.prototype);
    Server.prototype.constructor = Server;
    Server.prototype.listen = function() {
        var port = 0;
        var host = this._host;
        var backlog = this._backlog;
        var callback = null;
        var options = arguments[0];

        if (typeof options === 'function') {
            callback = options;
        } else if (typeof options === 'object' && options) {
            if (typeof options.path === 'string') {
                throw new Error('node:net UNIX domain sockets are not supported in swift-bun');
            }
            port = options.port || 0;
            host = options.host || options.hostname || host;
            if (typeof options.backlog === 'number') backlog = options.backlog;
            if (typeof arguments[1] === 'function') callback = arguments[1];
        } else {
            port = options || 0;
            if (typeof arguments[1] === 'string') {
                host = arguments[1];
                if (typeof arguments[2] === 'function') callback = arguments[2];
            } else if (typeof arguments[1] === 'number') {
                backlog = arguments[1];
                if (typeof arguments[2] === 'function') callback = arguments[2];
            } else if (typeof arguments[1] === 'function') {
                callback = arguments[1];
            }
        }
        if (callback) this.once('listening', callback);
        this._host = host || '127.0.0.1';
        this._backlog = backlog;
        __netListen(this._id, this._host, port | 0, backlog | 0);
        return this;
    };
    Server.prototype.address = function() {
        if (!this.listening) return null;
        return { address: this._host, family: this._host.indexOf(':') !== -1 ? 'IPv6' : 'IPv4', port: this._port };
    };
    Server.prototype.close = function(callback) {
        if (callback) this.once('close', callback);
        this._pendingClose = true;
        __netCloseServer(this._id);
        finalizeServerClose(this._id);
        return this;
    };
    Server.prototype.getConnections = function(callback) {
        var self = this;
        if (typeof callback !== 'function') {
            throw new TypeError('Callback must be a function');
        }
        queueMicrotask(function() {
            callback(null, __netServerConnectionCount(self._id));
        });
    };
    Server.prototype.ref = function() {
        if (!this._refed) {
            this._refed = true;
            __netSetServerRef(this._id, true);
        }
        return this;
    };
    Server.prototype.unref = function() {
        if (this._refed) {
            this._refed = false;
            __netSetServerRef(this._id, false);
        }
        return this;
    };

    function createSocket(metadata) {
        return new Socket(nextSocketID--, metadata || {});
    }

    function connect() {
        var normalized = normalizeConnectArgs(arguments);
        var socket = createSocket({});
        if (typeof normalized.connectionListener === 'function') socket.once('connect', normalized.connectionListener);
        socket.connecting = true;
        socket.pending = true;
        __netConnect(socket._id, normalized.host, normalized.port);
        return socket;
    }

    globalThis.__swiftBunNetDispatch = function(event) {
        if (!event || !event.type) return;
        if (event.type === 'listening') {
            var listeningServer = servers[event.serverID];
            if (!listeningServer) return;
            listeningServer._port = event.port;
            listeningServer._host = event.host || listeningServer._host;
            listeningServer._pendingClose = false;
            listeningServer.listening = true;
            listeningServer.emit('listening');
            return;
        }
        if (event.type === 'connection') {
            var server = servers[event.serverID];
            if (!server) return;
            var socket = new Socket(event.socketID, event);
            socket._serverID = event.serverID;
            sockets[event.socketID] = socket;
            server.connections += 1;
            server.emit('connection', socket);
            return;
        }
        if (event.type === 'close' && event.serverID) {
            var closingServer = servers[event.serverID];
            if (!closingServer) return;
            closingServer.listening = false;
            closingServer._pendingClose = true;
            finalizeServerClose(event.serverID);
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
            socket.connecting = false;
            socket.pending = false;
            socket._refreshTimeout();
            socket.emit('connect');
            return;
        }
        if (event.type === 'data') {
            var chunk = Buffer.from(event.bytes || []);
            socket.bytesRead += chunk.length;
            socket._refreshTimeout();
            var value = socket._encoding ? chunk.toString(socket._encoding) : chunk;
            if (socket._paused) {
                socket._readQueue.push(value);
            } else {
                socket.emit('data', value);
            }
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
            if (socket._serverID && servers[socket._serverID]) {
                servers[socket._serverID].connections = Math.max(0, servers[socket._serverID].connections - 1);
                finalizeServerClose(socket._serverID);
            }
            socket.emit('close', !!socket._hadError);
            return;
        }
        if (event.type === 'error') {
            if (event.serverID) {
                var erroredServer = servers[event.serverID];
                if (erroredServer) erroredServer.emit('error', new Error(event.message || 'socket error'));
                return;
            }
            socket._hadError = true;
            socket._clearTimeoutHandle();
            socket.emit('error', new Error(event.message || 'socket error'));
        }
    };

    var net = {
        BlockList: BlockList,
        Socket: Socket,
        Server: Server,
        createServer: function(options, connectionListener) {
            return new Server(options, connectionListener);
        },
        createConnection: function() {
            return connect.apply(null, arguments);
        },
        connect: function() {
            return connect.apply(null, arguments);
        },
        isIP: function(input) {
            if (parseIPv4(String(input || ''))) return 4;
            if (parseIPv6(String(input || ''))) return 6;
            return 0;
        },
        isIPv4: function(input) { return this.isIP(input) === 4; },
        isIPv6: function(input) { return this.isIP(input) === 6; },
    };
    net.default = net;
    __nodeModules.net = net;
})();
