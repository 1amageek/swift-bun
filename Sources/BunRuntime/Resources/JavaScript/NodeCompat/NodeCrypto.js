(function() {
    function toBytes(data) {
        if (data instanceof Uint8Array) return data;
        if (data instanceof ArrayBuffer) return new Uint8Array(data);
        if (ArrayBuffer.isView(data)) return new Uint8Array(data.buffer, data.byteOffset, data.byteLength);
        if (typeof data === 'string') return new TextEncoder().encode(data);
        throw new TypeError('data must be a string or TypedArray');
    }

    function concatBytes(a, b) {
        var result = new Uint8Array(a.length + b.length);
        result.set(a, 0);
        result.set(b, a.length);
        return result;
    }

    function hexToBytes(hex) {
        var bytes = new Uint8Array(hex.length / 2);
        for (var i = 0; i < hex.length; i += 2) {
            bytes[i / 2] = parseInt(hex.substr(i, 2), 16);
        }
        return bytes;
    }

    function hexToBase64(hex) {
        var bytes = hexToBytes(hex);
        var binary = '';
        for (var i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
        return btoa(binary);
    }

    function Hash(algorithm) {
        this._algorithm = algorithm.toLowerCase().replace('-', '');
        this._bytes = new Uint8Array(0);
    }
    Hash.prototype.update = function(data) {
        this._bytes = concatBytes(this._bytes, toBytes(data));
        return this;
    };
    Hash.prototype.digest = function(encoding) {
        var bytes = Array.from(this._bytes);
        var hex;
        switch (this._algorithm) {
        case 'sha256': hex = __cryptoSHA256(bytes); break;
        case 'sha512': hex = __cryptoSHA512(bytes); break;
        default: throw new Error('Unsupported hash algorithm: ' + this._algorithm);
        }
        if (encoding === 'hex') return hex;
        if (encoding === 'base64') return hexToBase64(hex);
        return hexToBytes(hex);
    };

    function Hmac(algorithm, key) {
        this._algorithm = algorithm.toLowerCase().replace('-', '');
        this._key = toBytes(key);
        this._bytes = new Uint8Array(0);
    }
    Hmac.prototype.update = function(data) {
        this._bytes = concatBytes(this._bytes, toBytes(data));
        return this;
    };
    Hmac.prototype.digest = function(encoding) {
        var keyArray = Array.from(this._key);
        var dataArray = Array.from(this._bytes);
        var hex = __cryptoHMAC(this._algorithm, keyArray, dataArray);
        if (hex.indexOf('ERR:') === 0) throw new Error(hex.substring(4));
        if (encoding === 'hex') return hex;
        if (encoding === 'base64') return hexToBase64(hex);
        return hexToBytes(hex);
    };

    function KeyObject(record) {
        this.type = record.type;
        this.asymmetricKeyType = record.asymmetricKeyType || null;
        this._token = record.token;
        this._format = record.format || null;
    }
    KeyObject.prototype.export = function() {
        throw new Error('KeyObject.export() is not supported in swift-bun');
    };

    var crypto = {
        createHash: function(algorithm) { return new Hash(algorithm); },
        createHmac: function(algorithm, key) { return new Hmac(algorithm, key); },
        createPrivateKey: function(input) {
            var options = (typeof input === 'object' && !(input instanceof Uint8Array) && !(input instanceof ArrayBuffer) && !(ArrayBuffer.isView(input)) && !Buffer.isBuffer(input))
                ? input
                : { key: input, format: typeof input === 'string' ? 'pem' : 'der' };
            var keyValue = options.key;
            var format = (options.format || (typeof keyValue === 'string' ? 'pem' : 'der')).toLowerCase();
            var type = options.type || '';
            var bytes;
            if (typeof keyValue === 'string') bytes = Array.from(new TextEncoder().encode(keyValue));
            else bytes = Array.from(toBytes(keyValue));
            var result = __cryptoCreatePrivateKey(format, bytes, type);
            if (result && result.error) throw new Error(result.error);
            return new KeyObject(result);
        },
        KeyObject: KeyObject,
        randomBytes: function(size) {
            var bytes = __cryptoRandomBytes(size);
            return Buffer.from(bytes);
        },
        randomUUID: function() { return __cryptoRandomUUID(); },
        randomInt: function(min, max) {
            if (max === undefined) {
                max = min;
                min = 0;
            }
            var range = max - min;
            if (range <= 0) throw new RangeError('max must be greater than min');
            var bytes = __cryptoRandomBytes(4);
            var value = ((bytes[0] << 24) | (bytes[1] << 16) | (bytes[2] << 8) | bytes[3]) >>> 0;
            return min + (value % range);
        },
        timingSafeEqual: function(a, b) {
            if (a.length !== b.length) throw new RangeError('Input buffers must have the same byte length');
            var result = 0;
            for (var i = 0; i < a.length; i++) result |= a[i] ^ b[i];
            return result === 0;
        },
        getHashes: function() { return ['sha256', 'sha512']; },
        constants: {},
        webcrypto: typeof globalThis.crypto !== 'undefined' ? globalThis.crypto : {},
    };

    if (!globalThis.__nodeModules) globalThis.__nodeModules = {};
    __nodeModules.crypto = crypto;
})();
