@preconcurrency import JavaScriptCore

/// Pure JavaScript implementation of `node:buffer`.
enum NodeBuffer {
    static func install(in context: JSContext) {
        context.evaluateScript("""
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
                        var bytes = new Uint8Array(arg.length / 2);
                        for (var i = 0; i < arg.length; i += 2) {
                            bytes[i / 2] = parseInt(arg.substr(i, 2), 16);
                        }
                        return bytes;
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
                    return _extendBuffer(buf);
                },
                alloc: function(size, fill) {
                    var buf = new Uint8Array(size);
                    if (fill !== undefined) buf.fill(typeof fill === 'number' ? fill : 0);
                    return _extendBuffer(buf);
                },
                allocUnsafe: function(size) {
                    return _extendBuffer(new Uint8Array(size));
                },
                concat: function(list, totalLength) {
                    if (!totalLength) {
                        totalLength = 0;
                        for (var i = 0; i < list.length; i++) totalLength += list[i].length;
                    }
                    var result = new Uint8Array(totalLength);
                    var offset = 0;
                    for (var i = 0; i < list.length; i++) {
                        result.set(list[i], offset);
                        offset += list[i].length;
                    }
                    return _extendBuffer(result);
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

            function _extendBuffer(buf) {
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
                        for (var i = 0; i < slice.length; i++) {
                            hex += ('0' + slice[i].toString(16)).slice(-2);
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
                return buf;
            }

            globalThis.Buffer = Buffer;

            if (!globalThis.__nodeModules) globalThis.__nodeModules = {};
            __nodeModules.buffer = { Buffer: Buffer, default: Buffer };
        })();
        """)
    }
}
