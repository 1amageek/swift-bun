(function() {
    if (typeof globalThis.TextEncoder !== 'undefined' &&
        typeof globalThis.TextDecoder !== 'undefined' &&
        typeof globalThis.TextDecoderStream !== 'undefined' &&
        typeof globalThis.TextEncoderStream !== 'undefined') {
        return;
    }

    var WINDOWS_1252_TABLE = {
        0x80: 0x20AC, 0x82: 0x201A, 0x83: 0x0192, 0x84: 0x201E,
        0x85: 0x2026, 0x86: 0x2020, 0x87: 0x2021, 0x88: 0x02C6,
        0x89: 0x2030, 0x8A: 0x0160, 0x8B: 0x2039, 0x8C: 0x0152,
        0x8E: 0x017D, 0x91: 0x2018, 0x92: 0x2019, 0x93: 0x201C,
        0x94: 0x201D, 0x95: 0x2022, 0x96: 0x2013, 0x97: 0x2014,
        0x98: 0x02DC, 0x99: 0x2122, 0x9A: 0x0161, 0x9B: 0x203A,
        0x9C: 0x0153, 0x9E: 0x017E, 0x9F: 0x0178
    };

    function normalizeEncoding(label) {
        label = (label || 'utf-8').toLowerCase();
        if (label === 'utf8') return 'utf-8';
        if (label === 'utf16le' || label === 'utf-16' || label === 'utf16') return 'utf-16le';
        if (label === 'utf16be') return 'utf-16be';
        if (label === 'cp1252' || label === 'latin1' || label === 'iso-8859-1') return 'windows-1252';
        return label;
    }

    function normalizeInput(input) {
        if (!input) return new Uint8Array(0);
        if (input instanceof Uint8Array) return input;
        if (ArrayBuffer.isView(input)) return new Uint8Array(input.buffer, input.byteOffset, input.byteLength);
        if (input instanceof ArrayBuffer) return new Uint8Array(input);
        return new Uint8Array(input.buffer || input);
    }

    function utf8Encode(str) {
        str = str || '';
        var bytes = [];
        for (var i = 0; i < str.length; i++) {
            var c = str.charCodeAt(i);
            if (c < 0x80) {
                bytes.push(c);
            } else if (c < 0x800) {
                bytes.push(0xC0 | (c >> 6), 0x80 | (c & 0x3F));
            } else if (c >= 0xD800 && c <= 0xDBFF) {
                var hi = c;
                var lo = str.charCodeAt(++i);
                var cp = ((hi - 0xD800) << 10) + (lo - 0xDC00) + 0x10000;
                bytes.push(
                    0xF0 | (cp >> 18),
                    0x80 | ((cp >> 12) & 0x3F),
                    0x80 | ((cp >> 6) & 0x3F),
                    0x80 | (cp & 0x3F)
                );
            } else {
                bytes.push(0xE0 | (c >> 12), 0x80 | ((c >> 6) & 0x3F), 0x80 | (c & 0x3F));
            }
        }
        return new Uint8Array(bytes);
    }

    function utf8Decode(bytes, streamState, streamMode) {
        var source = bytes;
        if (streamState && streamState.pending && streamState.pending.length) {
            var merged = new Uint8Array(streamState.pending.length + bytes.length);
            merged.set(streamState.pending, 0);
            merged.set(bytes, streamState.pending.length);
            source = merged;
        }

        var result = '';
        var i = 0;
        while (i < source.length) {
            var b = source[i];
            var needed = 1;
            var cp;

            if (b < 0x80) {
                cp = b;
            } else if ((b & 0xE0) === 0xC0) {
                needed = 2;
            } else if ((b & 0xF0) === 0xE0) {
                needed = 3;
            } else {
                needed = 4;
            }

            if (i + needed > source.length) {
                if (streamMode) {
                    break;
                }
                return result;
            }

            if (needed === 2) {
                cp = ((b & 0x1F) << 6) | (source[i + 1] & 0x3F);
            } else if (needed === 3) {
                cp = ((b & 0x0F) << 12) | ((source[i + 1] & 0x3F) << 6) | (source[i + 2] & 0x3F);
            } else if (needed === 4) {
                cp = ((b & 0x07) << 18) | ((source[i + 1] & 0x3F) << 12) | ((source[i + 2] & 0x3F) << 6) | (source[i + 3] & 0x3F);
            }

            i += needed;
            if (cp <= 0xFFFF) {
                result += String.fromCharCode(cp);
                continue;
            }
            cp -= 0x10000;
            result += String.fromCharCode((cp >> 10) + 0xD800, (cp & 0x3FF) + 0xDC00);
        }

        if (streamState) {
            streamState.pending = streamMode ? source.slice(i) : new Uint8Array(0);
        }
        return result;
    }

    function utf16Decode(bytes, littleEndian, streamState, streamMode) {
        var source = bytes;
        if (streamState && streamState.pending && streamState.pending.length) {
            var merged = new Uint8Array(streamState.pending.length + bytes.length);
            merged.set(streamState.pending, 0);
            merged.set(bytes, streamState.pending.length);
            source = merged;
        }
        var limit = source.length - (source.length % 2);
        if (streamMode && source.length % 2 !== 0) {
            limit = source.length - 1;
        }
        var result = '';
        for (var i = 0; i < limit; i += 2) {
            var codeUnit = littleEndian
                ? (source[i] | (source[i + 1] << 8))
                : ((source[i] << 8) | source[i + 1]);
            result += String.fromCharCode(codeUnit);
        }
        if (streamState) {
            streamState.pending = streamMode && limit < source.length ? source.slice(limit) : new Uint8Array(0);
        }
        return result;
    }

    function windows1252Decode(bytes) {
        var result = '';
        for (var i = 0; i < bytes.length; i++) {
            var value = bytes[i];
            var codePoint = WINDOWS_1252_TABLE[value];
            result += String.fromCharCode(codePoint || value);
        }
        return result;
    }

    if (typeof globalThis.TextEncoder === 'undefined') {
        globalThis.TextEncoder = function TextEncoder() {};
    }
    TextEncoder.prototype.encoding = 'utf-8';
    TextEncoder.prototype.encode = function(str) {
        return utf8Encode(str);
    };
    TextEncoder.prototype.encodeInto = function(source, destination) {
        var encoded = utf8Encode(source);
        var written = Math.min(encoded.length, destination.length);
        destination.set(encoded.subarray(0, written), 0);
        var read = 0;
        var consumedBytes = 0;
        while (read < source.length && consumedBytes < written) {
            var charCode = source.charCodeAt(read);
            var byteCount = 1;
            if (charCode < 0x80) byteCount = 1;
            else if (charCode < 0x800) byteCount = 2;
            else if (charCode >= 0xD800 && charCode <= 0xDBFF) {
                byteCount = 4;
                read += 1;
            } else byteCount = 3;
            if (consumedBytes + byteCount > written) break;
            consumedBytes += byteCount;
            read += 1;
        }
        return { read: read, written: written };
    };

    if (typeof globalThis.TextDecoder === 'undefined') {
        globalThis.TextDecoder = function TextDecoder(encoding, options) {
            options = options || {};
            this.encoding = normalizeEncoding(encoding);
            this.fatal = !!options.fatal;
            this.ignoreBOM = !!options.ignoreBOM;
            this._pending = new Uint8Array(0);
        };
    }
    TextDecoder.prototype.decode = function(input, options) {
        options = options || {};
        var bytes = normalizeInput(input);
        var streamMode = !!options.stream;
        switch (this.encoding) {
        case 'utf-8':
            return utf8Decode(bytes, this, streamMode);
        case 'utf-16le':
            return utf16Decode(bytes, true, this, streamMode);
        case 'utf-16be':
            return utf16Decode(bytes, false, this, streamMode);
        case 'windows-1252':
            this._pending = new Uint8Array(0);
            return windows1252Decode(bytes);
        default:
            throw new RangeError('Unsupported encoding: ' + this.encoding);
        }
    };

    if (typeof globalThis.TextDecoderStream === 'undefined') {
        globalThis.TextDecoderStream = function TextDecoderStream(encoding, options) {
            var decoder = new TextDecoder(encoding, options);
            var transform = new TransformStream({
                transform: function(chunk, controller) {
                    var text = decoder.decode(chunk, { stream: true });
                    if (text.length > 0) {
                        controller.enqueue(text);
                    }
                },
                flush: function(controller) {
                    var text = decoder.decode(new Uint8Array(0), { stream: false });
                    if (text.length > 0) {
                        controller.enqueue(text);
                    }
                }
            });
            this.encoding = decoder.encoding;
            this.fatal = decoder.fatal;
            this.ignoreBOM = decoder.ignoreBOM;
            this.readable = transform.readable;
            this.writable = transform.writable;
        };
    }

    if (typeof globalThis.TextEncoderStream === 'undefined') {
        globalThis.TextEncoderStream = function TextEncoderStream() {
            var encoder = new TextEncoder();
            var transform = new TransformStream({
                transform: function(chunk, controller) {
                    controller.enqueue(encoder.encode(String(chunk)));
                }
            });
            this.encoding = encoder.encoding;
            this.readable = transform.readable;
            this.writable = transform.writable;
        };
    }
})();
