(function() {
    if (!globalThis.__nodeModules) globalThis.__nodeModules = {};

    function toUint8Array(buffer) {
        if (buffer == null) return new Uint8Array(0);
        if (typeof Buffer !== 'undefined' && Buffer.isBuffer && Buffer.isBuffer(buffer)) {
            return new Uint8Array(buffer.buffer, buffer.byteOffset, buffer.byteLength);
        }
        if (buffer instanceof Uint8Array) return buffer;
        if (ArrayBuffer.isView(buffer)) {
            return new Uint8Array(buffer.buffer, buffer.byteOffset, buffer.byteLength);
        }
        if (buffer instanceof ArrayBuffer) return new Uint8Array(buffer);
        return new Uint8Array(Buffer.from(buffer));
    }

    function normalizeEncoding(encoding) {
        if (!encoding) return 'utf-8';
        var lower = String(encoding).toLowerCase();
        if (lower === 'utf8') return 'utf-8';
        if (lower === 'ucs2' || lower === 'ucs-2' || lower === 'utf16le' || lower === 'utf-16le') {
            return 'utf-16le';
        }
        return lower;
    }

    function StringDecoder(encoding) {
        this.encoding = normalizeEncoding(encoding);
        this._decoder = new TextDecoder(this.encoding, { fatal: false });
    }

    StringDecoder.prototype.write = function(buffer) {
        var view = toUint8Array(buffer);
        if (view.byteLength === 0) return '';
        return this._decoder.decode(view, { stream: true });
    };

    StringDecoder.prototype.end = function(buffer) {
        var text = '';
        if (buffer != null) {
            text += this.write(buffer);
        }
        text += this._decoder.decode();
        return text;
    };

    StringDecoder.prototype.text = function(buffer, offset) {
        var view = toUint8Array(buffer);
        var start = offset >>> 0;
        return this.write(view.subarray(start));
    };

    __nodeModules.string_decoder = {
        StringDecoder: StringDecoder,
        default: { StringDecoder: StringDecoder },
    };
})();
