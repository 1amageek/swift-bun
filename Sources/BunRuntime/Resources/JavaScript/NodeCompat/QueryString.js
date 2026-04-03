(function() {
    if (!globalThis.__nodeModules) globalThis.__nodeModules = {};

    function decode(text) {
        return decodeURIComponent(String(text).replace(/\+/g, ' '));
    }

    function encode(text) {
        return encodeURIComponent(String(text));
    }

    function parse(str, sep, eq, options) {
        var result = {};
        if (!str) return result;

        sep = sep || '&';
        eq = eq || '=';
        var pairs = String(str).split(sep);
        var maxKeys = options && typeof options.maxKeys === 'number' ? options.maxKeys : 1000;

        for (var i = 0; i < pairs.length; i++) {
            if (maxKeys > 0 && i >= maxKeys) break;
            var pair = pairs[i];
            if (pair.length === 0) continue;

            var index = pair.indexOf(eq);
            var key;
            var value;
            if (index === -1) {
                key = decode(pair);
                value = '';
            } else {
                key = decode(pair.slice(0, index));
                value = decode(pair.slice(index + eq.length));
            }

            if (Object.prototype.hasOwnProperty.call(result, key)) {
                if (!Array.isArray(result[key])) {
                    result[key] = [result[key]];
                }
                result[key].push(value);
            } else {
                result[key] = value;
            }
        }

        return result;
    }

    function normalizeValue(value) {
        if (value == null) return '';
        if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean' || typeof value === 'bigint') {
            return String(value);
        }
        return '';
    }

    function stringify(obj, sep, eq) {
        if (obj == null) return '';
        sep = sep || '&';
        eq = eq || '=';

        var segments = [];
        Object.keys(obj).forEach(function(key) {
            var value = obj[key];
            var encodedKey = encode(key);
            if (Array.isArray(value)) {
                value.forEach(function(entry) {
                    segments.push(encodedKey + eq + encode(normalizeValue(entry)));
                });
                return;
            }
            segments.push(encodedKey + eq + encode(normalizeValue(value)));
        });
        return segments.join(sep);
    }

    __nodeModules.querystring = {
        parse: parse,
        stringify: stringify,
        escape: encode,
        unescape: decode,
    };
    __nodeModules.querystring.default = __nodeModules.querystring;
})();
