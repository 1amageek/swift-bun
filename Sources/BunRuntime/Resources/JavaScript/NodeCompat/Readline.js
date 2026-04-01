(function() {
    if (!globalThis.__nodeModules) globalThis.__nodeModules = {};
    var EventEmitter = __nodeModules.events;

    function Interface(options) {
        EventEmitter.call(this);
        options = options || {};
        this.input = options.input || process.stdin;
        this.output = options.output || process.stdout;
        this.terminal = !!options.terminal;
        this.line = '';
        this.closed = false;
        this._prompt = options.prompt || '';
        this._lineQueue = [];
        this._waiting = [];
        this._buffer = '';

        var self = this;
        this._onData = function(chunk) {
            self._pushChunk(chunk);
        };
        this._onEnd = function() {
            if (self._buffer.length > 0) {
                self._enqueueLine(self._buffer);
                self._buffer = '';
            }
            self.close();
        };

        if (this.input && typeof this.input.on === 'function') {
            this.input.on('data', this._onData);
            this.input.on('end', this._onEnd);
        }
    }

    Interface.prototype = Object.create(EventEmitter.prototype);
    Interface.prototype.constructor = Interface;
    Interface.prototype.setPrompt = function(prompt) {
        this._prompt = String(prompt);
    };
    Interface.prototype.prompt = function() {
        if (this.output && typeof this.output.write === 'function' && this._prompt) {
            this.output.write(this._prompt);
        }
    };
    Interface.prototype.question = function(query, callback) {
        if (this.output && typeof this.output.write === 'function' && query) {
            this.output.write(String(query));
        }
        if (typeof callback === 'function') {
            this.once('line', callback);
        }
    };
    Interface.prototype.close = function() {
        if (this.closed) return;
        this.closed = true;
        if (this.input && typeof this.input.removeListener === 'function') {
            this.input.removeListener('data', this._onData);
            this.input.removeListener('end', this._onEnd);
        }
        while (this._lineQueue.length > 0 && this._waiting.length > 0) {
            var resolveLine = this._waiting.shift();
            resolveLine({ value: this._lineQueue.shift(), done: false });
        }
        while (this._waiting.length > 0) {
            this._waiting.shift()({ value: undefined, done: true });
        }
        this.emit('close');
    };
    Interface.prototype._enqueueLine = function(line) {
        this.line = line;
        this._lineQueue.push(line);
        this.emit('line', line);
        while (this._lineQueue.length > 0 && this._waiting.length > 0) {
            var resolve = this._waiting.shift();
            resolve({ value: this._lineQueue.shift(), done: false });
        }
    };
    Interface.prototype._pushChunk = function(chunk) {
        if (chunk === undefined || chunk === null) return;
        var text;
        if (typeof chunk === 'string') text = chunk;
        else if (chunk instanceof Uint8Array) text = new TextDecoder().decode(chunk);
        else if (ArrayBuffer.isView(chunk)) text = new TextDecoder().decode(new Uint8Array(chunk.buffer, chunk.byteOffset, chunk.byteLength));
        else if (chunk instanceof ArrayBuffer) text = new TextDecoder().decode(new Uint8Array(chunk));
        else text = String(chunk);

        this._buffer += text;
        var pieces = this._buffer.split(/\r?\n/);
        this._buffer = pieces.pop();
        for (var i = 0; i < pieces.length; i++) {
            this._enqueueLine(pieces[i]);
        }
    };
    Interface.prototype[Symbol.asyncIterator] = function() {
        var self = this;
        return {
            next: function() {
                if (self._lineQueue.length > 0) {
                    return Promise.resolve({ value: self._lineQueue.shift(), done: false });
                }
                if (self.closed) {
                    return Promise.resolve({ value: undefined, done: true });
                }
                return new Promise(function(resolve) {
                    self._waiting.push(resolve);
                });
            },
            return: function() {
                self.close();
                return Promise.resolve({ value: undefined, done: true });
            },
            [Symbol.asyncIterator]: function() {
                return this;
            },
        };
    };

    var readline = {
        Interface: Interface,
        createInterface: function(options) {
            return new Interface(options);
        },
        emitKeypressEvents: function() {},
        clearLine: function(stream, dir, cb) {
            if (stream && typeof stream.clearLine === 'function') {
                return stream.clearLine(dir, cb);
            }
            if (typeof cb === 'function') cb(null);
            return true;
        },
        clearScreenDown: function(stream, cb) {
            if (stream && typeof stream.clearScreenDown === 'function') {
                return stream.clearScreenDown(cb);
            }
            if (typeof cb === 'function') cb(null);
            return true;
        },
        cursorTo: function(stream, x, y, cb) {
            if (stream && typeof stream.cursorTo === 'function') {
                return stream.cursorTo(x, y, cb);
            }
            if (typeof cb === 'function') cb(null);
            return true;
        },
        moveCursor: function(stream, dx, dy, cb) {
            if (stream && typeof stream.moveCursor === 'function') {
                return stream.moveCursor(dx, dy, cb);
            }
            if (typeof cb === 'function') cb(null);
            return true;
        },
    };
    readline.default = readline;
    __nodeModules.readline = readline;
})();
