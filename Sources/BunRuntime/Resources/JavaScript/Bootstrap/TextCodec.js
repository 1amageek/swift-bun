(function() {
    if (typeof globalThis.TextEncoder !== 'undefined') return;

    globalThis.TextEncoder = function TextEncoder() {};
    TextEncoder.prototype.encoding = 'utf-8';
    TextEncoder.prototype.encode = function(str) {
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
    };

    globalThis.TextDecoder = function TextDecoder(encoding) {
        this.encoding = (encoding || 'utf-8').toLowerCase();
    };
    TextDecoder.prototype.decode = function(input) {
        if (!input || input.length === 0) return '';
        var bytes = new Uint8Array(input.buffer || input);
        var len = bytes.length;
        var result = '';
        for (var i = 0; i < len;) {
            var b = bytes[i];
            var cp;
            if (b < 0x80) {
                cp = b;
                i++;
            } else if ((b & 0xE0) === 0xC0) {
                if (i + 1 >= len) break;
                cp = ((b & 0x1F) << 6) | (bytes[i + 1] & 0x3F);
                i += 2;
            } else if ((b & 0xF0) === 0xE0) {
                if (i + 2 >= len) break;
                cp = ((b & 0x0F) << 12) | ((bytes[i + 1] & 0x3F) << 6) | (bytes[i + 2] & 0x3F);
                i += 3;
            } else {
                if (i + 3 >= len) break;
                cp = ((b & 0x07) << 18) | ((bytes[i + 1] & 0x3F) << 12) | ((bytes[i + 2] & 0x3F) << 6) | (bytes[i + 3] & 0x3F);
                i += 4;
                if (cp > 0xFFFF) {
                    cp -= 0x10000;
                    result += String.fromCharCode((cp >> 10) + 0xD800, (cp & 0x3FF) + 0xDC00);
                    continue;
                }
            }
            result += String.fromCharCode(cp);
        }
        return result;
    };
})();
