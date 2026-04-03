(function() {
    if (!globalThis.__nodeModules) globalThis.__nodeModules = {};
    var stream = __nodeModules.stream || globalThis.__readableStream;

    function ReadStream(fd) {
        stream.Readable.call(this);
        this.fd = fd == null ? 0 : fd;
        this.isTTY = typeof __ttyIsATTY === 'function' ? !!__ttyIsATTY(this.fd) : false;
        this.isRaw = false;
    }
    ReadStream.prototype = Object.create(stream.Readable.prototype);
    ReadStream.prototype.constructor = ReadStream;
    ReadStream.prototype.setRawMode = function(flag) {
        var enabled = !!flag;
        if (typeof __ttySetRawMode === 'function') {
            enabled = !!__ttySetRawMode(this.fd, enabled);
        }
        this.isRaw = enabled;
        return this;
    };

    function WriteStream(fd) {
        stream.Writable.call(this);
        this.fd = fd == null ? 1 : fd;
        this.isTTY = typeof __ttyIsATTY === 'function' ? !!__ttyIsATTY(this.fd) : false;
        this._refreshSize();
    }
    WriteStream.prototype = Object.create(stream.Writable.prototype);
    WriteStream.prototype.constructor = WriteStream;
    WriteStream.prototype._refreshSize = function() {
        var size = typeof __ttyGetWindowSize === 'function' ? __ttyGetWindowSize(this.fd) : null;
        if (Array.isArray(size) && size.length === 2) {
            this.columns = size[0];
            this.rows = size[1];
        } else {
            this.columns = 80;
            this.rows = 24;
        }
        return [this.columns, this.rows];
    };
    WriteStream.prototype.getWindowSize = function() {
        return this._refreshSize();
    };
    WriteStream.prototype.getColorDepth = function() { return this.isTTY ? 4 : 1; };
    WriteStream.prototype.hasColors = function(count) {
        if (!this.isTTY) return false;
        var minimum = typeof count === 'number' ? count : 2;
        return this.getColorDepth() >= minimum;
    };
    WriteStream.prototype.clearLine = function(dir, cb) { if (typeof cb === 'function') cb(null); return true; };
    WriteStream.prototype.clearScreenDown = function(cb) { if (typeof cb === 'function') cb(null); return true; };
    WriteStream.prototype.cursorTo = function(x, y, cb) { if (typeof cb === 'function') cb(null); return true; };
    WriteStream.prototype.moveCursor = function(dx, dy, cb) { if (typeof cb === 'function') cb(null); return true; };

    var tty = {
        isatty: function(fd) {
            return typeof __ttyIsATTY === 'function' ? !!__ttyIsATTY(fd == null ? 1 : fd) : false;
        },
        ReadStream: ReadStream,
        WriteStream: WriteStream,
    };
    tty.default = tty;
    __nodeModules.tty = tty;
})();
