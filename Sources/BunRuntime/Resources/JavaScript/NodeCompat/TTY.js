(function() {
    if (!globalThis.__nodeModules) globalThis.__nodeModules = {};
    var stream = __nodeModules.stream || globalThis.__readableStream;

    function ReadStream(fd) {
        stream.Readable.call(this);
        this.fd = fd == null ? 0 : fd;
        this.isTTY = false;
    }
    ReadStream.prototype = Object.create(stream.Readable.prototype);
    ReadStream.prototype.constructor = ReadStream;
    ReadStream.prototype.setRawMode = function() { return this; };

    function WriteStream(fd) {
        stream.Writable.call(this);
        this.fd = fd == null ? 1 : fd;
        this.isTTY = false;
        this.columns = 80;
        this.rows = 24;
    }
    WriteStream.prototype = Object.create(stream.Writable.prototype);
    WriteStream.prototype.constructor = WriteStream;
    WriteStream.prototype.getColorDepth = function() { return 1; };
    WriteStream.prototype.hasColors = function() { return false; };
    WriteStream.prototype.clearLine = function(dir, cb) { if (typeof cb === 'function') cb(null); return true; };
    WriteStream.prototype.clearScreenDown = function(cb) { if (typeof cb === 'function') cb(null); return true; };
    WriteStream.prototype.cursorTo = function(x, y, cb) { if (typeof cb === 'function') cb(null); return true; };
    WriteStream.prototype.moveCursor = function(dx, dy, cb) { if (typeof cb === 'function') cb(null); return true; };

    var tty = {
        isatty: function() { return false; },
        ReadStream: ReadStream,
        WriteStream: WriteStream,
    };
    tty.default = tty;
    __nodeModules.tty = tty;
})();
