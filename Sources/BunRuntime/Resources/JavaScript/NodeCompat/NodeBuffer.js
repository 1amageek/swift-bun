(function() {
    function BufferShim(arg, encodingOrOffset, length) {
        if (typeof arg === 'number') {
            return new Uint8Array(arg);
        }
        if (typeof arg === 'string') {
            var encoding = encodingOrOffset || 'utf-8';
            if (encoding === 'utf8' || encoding === 'utf-8') {
                return new TextEncoder().encode(arg);
            }
            if (encoding === 'base64') {
                var binary = atob(arg);
                var bytes = new Uint8Array(binary.length);
                for (var i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
                return bytes;
            }
            if (encoding === 'hex') {
                var hexBytes = new Uint8Array(arg.length / 2);
                for (var j = 0; j < arg.length; j += 2) {
                    hexBytes[j / 2] = parseInt(arg.substr(j, 2), 16);
                }
                return hexBytes;
            }
            return new TextEncoder().encode(arg);
        }
        if (arg instanceof ArrayBuffer) {
            return new Uint8Array(arg, encodingOrOffset || 0, length);
        }
        if (ArrayBuffer.isView(arg)) {
            return new Uint8Array(arg.buffer, arg.byteOffset, arg.byteLength);
        }
        if (Array.isArray(arg)) {
            return new Uint8Array(arg);
        }
        return new Uint8Array(0);
    }

    var Buffer = {
        from: function(data, encoding) {
            var buf = BufferShim(data, encoding);
            return extendBuffer(buf);
        },
        alloc: function(size, fill) {
            var buf = new Uint8Array(size);
            if (fill !== undefined) buf.fill(typeof fill === 'number' ? fill : 0);
            return extendBuffer(buf);
        },
        allocUnsafe: function(size) {
            return extendBuffer(new Uint8Array(size));
        },
        allocUnsafeSlow: function(size) {
            return extendBuffer(new Uint8Array(size));
        },
        concat: function(list, totalLength) {
            if (!totalLength) {
                totalLength = 0;
                for (var i = 0; i < list.length; i++) totalLength += list[i].length;
            }
            var result = new Uint8Array(totalLength);
            var offset = 0;
            for (var j = 0; j < list.length; j++) {
                result.set(list[j], offset);
                offset += list[j].length;
            }
            return extendBuffer(result);
        },
        isBuffer: function(obj) {
            return obj instanceof Uint8Array && obj._isBuffer === true;
        },
        isEncoding: function(enc) {
            return ['utf8', 'utf-8', 'ascii', 'latin1', 'binary', 'base64', 'hex'].indexOf(enc) !== -1;
        },
        byteLength: function(str, encoding) {
            if (typeof str !== 'string') return str.length || str.byteLength || 0;
            return new TextEncoder().encode(str).length;
        },
    };

    function extendBuffer(buf) {
        buf._isBuffer = true;
        buf.toString = function(encoding, start, end) {
            var slice = (start !== undefined || end !== undefined)
                ? this.slice(start || 0, end || this.length)
                : this;
            encoding = encoding || 'utf-8';
            if (encoding === 'utf8' || encoding === 'utf-8') {
                return new TextDecoder().decode(slice);
            }
            if (encoding === 'base64') {
                var binary = '';
                for (var i = 0; i < slice.length; i++) binary += String.fromCharCode(slice[i]);
                return btoa(binary);
            }
            if (encoding === 'hex') {
                var hex = '';
                for (var j = 0; j < slice.length; j++) {
                    hex += ('0' + slice[j].toString(16)).slice(-2);
                }
                return hex;
            }
            return new TextDecoder().decode(slice);
        };
        buf.write = function(str, offset, length, encoding) {
            offset = offset || 0;
            var encoded = new TextEncoder().encode(str);
            var len = Math.min(encoded.length, length || (this.length - offset));
            this.set(encoded.subarray(0, len), offset);
            return len;
        };
        buf.copy = function(target, targetStart, sourceStart, sourceEnd) {
            targetStart = targetStart || 0;
            sourceStart = sourceStart || 0;
            sourceEnd = sourceEnd || this.length;
            target.set(this.subarray(sourceStart, sourceEnd), targetStart);
            return sourceEnd - sourceStart;
        };
        buf.slice = function(start, end) {
            var s = start || 0;
            var e = end !== undefined ? end : this.length;
            if (s < 0) s = Math.max(this.length + s, 0);
            if (e < 0) e = Math.max(this.length + e, 0);
            var sliced = Uint8Array.prototype.slice.call(this, s, e);
            return extendBuffer(sliced);
        };
        buf.subarray = buf.slice;
        buf.equals = function(other) {
            if (this.length !== other.length) return false;
            for (var i = 0; i < this.length; i++) {
                if (this[i] !== other[i]) return false;
            }
            return true;
        };
        buf.compare = function(other) {
            var len = Math.min(this.length, other.length);
            for (var i = 0; i < len; i++) {
                if (this[i] < other[i]) return -1;
                if (this[i] > other[i]) return 1;
            }
            if (this.length < other.length) return -1;
            if (this.length > other.length) return 1;
            return 0;
        };
        buf.toJSON = function() {
            return { type: 'Buffer', data: Array.from(this) };
        };
        buf.readUInt8 = function(offset) { return this[offset >>> 0]; };
        buf.readUInt16LE = function(offset) { return new DataView(this.buffer, this.byteOffset, this.byteLength).getUint16(offset >>> 0, true); };
        buf.readUInt16BE = function(offset) { return new DataView(this.buffer, this.byteOffset, this.byteLength).getUint16(offset >>> 0, false); };
        buf.readUInt32LE = function(offset) { return new DataView(this.buffer, this.byteOffset, this.byteLength).getUint32(offset >>> 0, true); };
        buf.readUInt32BE = function(offset) { return new DataView(this.buffer, this.byteOffset, this.byteLength).getUint32(offset >>> 0, false); };
        buf.readInt8 = function(offset) { return new DataView(this.buffer, this.byteOffset, this.byteLength).getInt8(offset >>> 0); };
        buf.readInt16LE = function(offset) { return new DataView(this.buffer, this.byteOffset, this.byteLength).getInt16(offset >>> 0, true); };
        buf.readInt16BE = function(offset) { return new DataView(this.buffer, this.byteOffset, this.byteLength).getInt16(offset >>> 0, false); };
        buf.readInt32LE = function(offset) { return new DataView(this.buffer, this.byteOffset, this.byteLength).getInt32(offset >>> 0, true); };
        buf.readInt32BE = function(offset) { return new DataView(this.buffer, this.byteOffset, this.byteLength).getInt32(offset >>> 0, false); };
        buf.readFloatLE = function(offset) { return new DataView(this.buffer, this.byteOffset, this.byteLength).getFloat32(offset >>> 0, true); };
        buf.readFloatBE = function(offset) { return new DataView(this.buffer, this.byteOffset, this.byteLength).getFloat32(offset >>> 0, false); };
        buf.readDoubleLE = function(offset) { return new DataView(this.buffer, this.byteOffset, this.byteLength).getFloat64(offset >>> 0, true); };
        buf.readDoubleBE = function(offset) { return new DataView(this.buffer, this.byteOffset, this.byteLength).getFloat64(offset >>> 0, false); };
        buf.writeUInt8 = function(value, offset) { new DataView(this.buffer, this.byteOffset, this.byteLength).setUint8(offset >>> 0, value); return (offset >>> 0) + 1; };
        buf.writeUInt16LE = function(value, offset) { new DataView(this.buffer, this.byteOffset, this.byteLength).setUint16(offset >>> 0, value, true); return (offset >>> 0) + 2; };
        buf.writeUInt16BE = function(value, offset) { new DataView(this.buffer, this.byteOffset, this.byteLength).setUint16(offset >>> 0, value, false); return (offset >>> 0) + 2; };
        buf.writeUInt32LE = function(value, offset) { new DataView(this.buffer, this.byteOffset, this.byteLength).setUint32(offset >>> 0, value, true); return (offset >>> 0) + 4; };
        buf.writeUInt32BE = function(value, offset) { new DataView(this.buffer, this.byteOffset, this.byteLength).setUint32(offset >>> 0, value, false); return (offset >>> 0) + 4; };
        buf.writeInt8 = function(value, offset) { new DataView(this.buffer, this.byteOffset, this.byteLength).setInt8(offset >>> 0, value); return (offset >>> 0) + 1; };
        buf.writeInt16LE = function(value, offset) { new DataView(this.buffer, this.byteOffset, this.byteLength).setInt16(offset >>> 0, value, true); return (offset >>> 0) + 2; };
        buf.writeInt16BE = function(value, offset) { new DataView(this.buffer, this.byteOffset, this.byteLength).setInt16(offset >>> 0, value, false); return (offset >>> 0) + 2; };
        buf.writeInt32LE = function(value, offset) { new DataView(this.buffer, this.byteOffset, this.byteLength).setInt32(offset >>> 0, value, true); return (offset >>> 0) + 4; };
        buf.writeInt32BE = function(value, offset) { new DataView(this.buffer, this.byteOffset, this.byteLength).setInt32(offset >>> 0, value, false); return (offset >>> 0) + 4; };
        buf.writeFloatLE = function(value, offset) { new DataView(this.buffer, this.byteOffset, this.byteLength).setFloat32(offset >>> 0, value, true); return (offset >>> 0) + 4; };
        buf.writeFloatBE = function(value, offset) { new DataView(this.buffer, this.byteOffset, this.byteLength).setFloat32(offset >>> 0, value, false); return (offset >>> 0) + 4; };
        buf.writeDoubleLE = function(value, offset) { new DataView(this.buffer, this.byteOffset, this.byteLength).setFloat64(offset >>> 0, value, true); return (offset >>> 0) + 8; };
        buf.writeDoubleBE = function(value, offset) { new DataView(this.buffer, this.byteOffset, this.byteLength).setFloat64(offset >>> 0, value, false); return (offset >>> 0) + 8; };
        return buf;
    }

    globalThis.Buffer = Buffer;

    if (!globalThis.__nodeModules) globalThis.__nodeModules = {};
    __nodeModules.buffer = { Buffer: Buffer, default: Buffer };
})();
