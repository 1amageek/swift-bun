(function() {
    function toBytes(data) {
        if (Buffer.isBuffer(data)) return Uint8Array.from(data);
        if (data instanceof Uint8Array) return data;
        if (data instanceof ArrayBuffer) return new Uint8Array(data);
        if (ArrayBuffer.isView(data)) return new Uint8Array(data.buffer, data.byteOffset, data.byteLength);
        if (typeof data === 'string') return new TextEncoder().encode(data);
        throw new TypeError('data must be a string or TypedArray');
    }

    function toBuffer(data, encoding) {
        if (data == null) return Buffer.alloc(0);
        if (Buffer.isBuffer(data)) return data;
        if (data instanceof Uint8Array) return Buffer.from(data);
        if (data instanceof ArrayBuffer) return Buffer.from(new Uint8Array(data));
        if (ArrayBuffer.isView(data)) return Buffer.from(data.buffer, data.byteOffset, data.byteLength);
        return Buffer.from(String(data), encoding || 'utf8');
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
        return Buffer.from(hexToBytes(hex)).toString('base64');
    }

    function bytesToPEM(bytes, label) {
        var base64 = Buffer.from(bytes).toString('base64');
        var lines = [];
        for (var index = 0; index < base64.length; index += 64) {
            lines.push(base64.slice(index, index + 64));
        }
        return '-----BEGIN ' + label + '-----\n' + lines.join('\n') + '\n-----END ' + label + '-----\n';
    }

    function normalizeAlgorithmName(algorithm) {
        return String(algorithm || '').toLowerCase().replace(/_/g, '-');
    }

    function normalizeHashName(algorithm) {
        var normalized = normalizeAlgorithmName(algorithm);
        if (normalized === 'rsa-sha1' || normalized === 'sha1') return 'SHA-1';
        if (normalized === 'rsa-sha256' || normalized === 'sha256') return 'SHA-256';
        if (normalized === 'rsa-sha384' || normalized === 'sha384') return 'SHA-384';
        if (normalized === 'rsa-sha512' || normalized === 'sha512') return 'SHA-512';
        if (normalized === 'ecdsa-with-sha256') return 'SHA-256';
        if (normalized === 'ecdsa-with-sha384') return 'SHA-384';
        if (normalized === 'ecdsa-with-sha512') return 'SHA-512';
        throw new Error('Unsupported hash algorithm: ' + algorithm);
    }

    function normalizeKeyInput(input, defaultType) {
        if (input instanceof KeyObject) {
            return {
                keyObject: input,
                format: input._sourceFormat || (input.type === 'public' ? 'pem' : 'pem'),
                typeHint: input._typeHint || '',
                sourceBytes: input._sourceBytes || null,
            };
        }

        var options = (typeof input === 'object' && input && !(input instanceof Uint8Array) && !(input instanceof ArrayBuffer) && !ArrayBuffer.isView(input) && !Buffer.isBuffer(input))
            ? input
            : { key: input, format: typeof input === 'string' ? 'pem' : 'der' };
        var keyValue = options.key;
        var format = String(options.format || (typeof keyValue === 'string' ? 'pem' : 'der')).toLowerCase();
        var typeHint = String(options.type || options.publicKeyType || options.privateKeyType || '').toLowerCase();
        return {
            keyObject: null,
            format: format,
            typeHint: typeHint,
            sourceBytes: typeof keyValue === 'string' ? new TextEncoder().encode(keyValue) : toBytes(keyValue),
        };
    }

    function pemLabelForKey(keyObject, containerType) {
        var normalized = String(containerType || '').toLowerCase();
        if (keyObject.type === 'public') return 'PUBLIC KEY';
        if (normalized === 'pkcs1' && keyObject.asymmetricKeyType === 'rsa') return 'RSA PRIVATE KEY';
        if (normalized === 'sec1' || keyObject.asymmetricKeyType === 'ec') return 'EC PRIVATE KEY';
        return 'PRIVATE KEY';
    }

    function exportAsymmetricKey(keyObject, options) {
        var exportOptions = options && typeof options === 'object' ? options : {};
        var format = String(exportOptions.format || 'pem').toLowerCase();
        var typeHint = String(exportOptions.type || keyObject._typeHint || '').toLowerCase();
        var result = __cryptoExportKeyObject(keyObject._token, format === 'der' ? (keyObject.type === 'public' ? 'spki' : (typeHint || 'pkcs8')) : null);
        if (result && result.error) throw new Error(result.error);
        var bytes = Buffer.from(result.bytes || []);
        if (format === 'der') return bytes;
        if (format === 'pem') {
            return bytesToPEM(bytes, pemLabelForKey(keyObject, typeHint || result.format));
        }
        throw new Error('Unsupported export format: ' + format);
    }

    function subtleSignAlgorithm(algorithm, keyObject) {
        var hash = normalizeHashName(algorithm);
        if (keyObject.asymmetricKeyType === 'ec') {
            return { name: 'ECDSA', hash: { name: hash } };
        }
        return { name: 'RSASSA-PKCS1-V1_5', hash: { name: hash } };
    }

    function subtleVerifyAlgorithm(algorithm, keyObject, options) {
        var hash = normalizeHashName(algorithm);
        if (keyObject.asymmetricKeyType === 'ec') {
            return { name: 'ECDSA', hash: { name: hash } };
        }
        if (options && options.padding === crypto.constants.RSA_PKCS1_PSS_PADDING) {
            return {
                name: 'RSA-PSS',
                hash: { name: hash },
                saltLength: typeof options.saltLength === 'number' ? options.saltLength : Buffer.from('' + hash).length,
            };
        }
        return { name: 'RSASSA-PKCS1-V1_5', hash: { name: hash } };
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
        case 'sha1': hex = __cryptoSHA1(bytes); break;
        case 'sha256': hex = __cryptoSHA256(bytes); break;
        case 'sha384': hex = __cryptoSHA384(bytes); break;
        case 'sha512': hex = __cryptoSHA512(bytes); break;
        default: throw new Error('Unsupported hash algorithm: ' + this._algorithm);
        }
        if (encoding === 'hex') return hex;
        if (encoding === 'base64') return hexToBase64(hex);
        return Buffer.from(hexToBytes(hex));
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
        return Buffer.from(hexToBytes(hex));
    };

    function KeyObject(record) {
        this.type = record.type;
        this.asymmetricKeyType = record.asymmetricKeyType || null;
        this._token = record.token || 0;
        this._format = record.format || null;
        this._sourceFormat = record.sourceFormat || null;
        this._sourceBytes = record.sourceBytes || null;
        this._typeHint = record.typeHint || '';
        this._secret = record.secret || null;
    }
    KeyObject.prototype.export = function(options) {
        if (this.type === 'secret') {
            return Buffer.from(this._secret || []);
        }
        return exportAsymmetricKey(this, options);
    };

    function createPrivateKey(input) {
        var normalized = normalizeKeyInput(input, 'private');
        if (normalized.keyObject) {
            if (normalized.keyObject.type !== 'private') throw new Error('Expected a private key');
            return normalized.keyObject;
        }
        var result = __cryptoCreatePrivateKey(normalized.format, Array.from(normalized.sourceBytes), normalized.typeHint);
        if (result && result.error) throw new Error(result.error);
        return new KeyObject({
            token: result.token,
            type: 'private',
            asymmetricKeyType: result.asymmetricKeyType || null,
            format: result.format || normalized.format,
            sourceFormat: normalized.format,
            sourceBytes: Buffer.from(normalized.sourceBytes),
            typeHint: normalized.typeHint,
        });
    }

    function createPublicKey(input) {
        var normalized = normalizeKeyInput(input, 'public');
        if (normalized.keyObject) {
            if (normalized.keyObject.type === 'public') return normalized.keyObject;
            if (normalized.keyObject.type !== 'private') throw new Error('Expected a public or private key');
            normalized.format = normalized.keyObject._sourceFormat || 'pem';
            normalized.typeHint = normalized.keyObject._typeHint || '';
            normalized.sourceBytes = normalized.keyObject._sourceBytes || normalized.sourceBytes;
        }
        var result = __cryptoCreatePublicKey(normalized.format, Array.from(normalized.sourceBytes), normalized.typeHint);
        if (result && result.error) throw new Error(result.error);
        return new KeyObject({
            token: result.token,
            type: 'public',
            asymmetricKeyType: result.asymmetricKeyType || null,
            format: result.format || 'spki',
            sourceFormat: normalized.format,
            sourceBytes: Buffer.from(normalized.sourceBytes),
            typeHint: normalized.typeHint || 'spki',
        });
    }

    function createSecretKey(input) {
        var bytes = toBytes(input);
        return new KeyObject({
            type: 'secret',
            sourceFormat: 'raw',
            sourceBytes: Buffer.from(bytes),
            secret: Buffer.from(bytes),
        });
    }

    function oneShotSign(algorithm, data, key) {
        var keyObject = key instanceof KeyObject ? key : createPrivateKey(key);
        var result = __subtleSign(JSON.stringify(subtleSignAlgorithm(algorithm, keyObject)), keyObject._token, Array.from(toBytes(data)));
        if (result && result.error) throw new Error(result.error);
        return Buffer.from(result.bytes || []);
    }

    function oneShotVerify(algorithm, data, key, signature) {
        var options = key && typeof key === 'object' && !(key instanceof KeyObject) && key.key ? key : null;
        var keyInput = options ? options.key : key;
        var keyObject = keyInput instanceof KeyObject ? keyInput : createPublicKey(keyInput);
        var result = __subtleVerify(
            JSON.stringify(subtleVerifyAlgorithm(algorithm, keyObject, options || {})),
            keyObject._token,
            Array.from(toBytes(signature)),
            Array.from(toBytes(data))
        );
        if (result && result.error) throw new Error(result.error);
        return !!result.verified;
    }

    function Sign(algorithm) {
        this._algorithm = algorithm;
        this._bytes = Buffer.alloc(0);
    }
    Sign.prototype.update = function(data, encoding) {
        this._bytes = Buffer.concat([this._bytes, toBuffer(data, encoding)]);
        return this;
    };
    Sign.prototype.sign = function(key, outputEncoding) {
        var signature = oneShotSign(this._algorithm, this._bytes, key);
        return outputEncoding ? signature.toString(outputEncoding) : signature;
    };

    function Verify(algorithm) {
        this._algorithm = algorithm;
        this._bytes = Buffer.alloc(0);
    }
    Verify.prototype.update = function(data, encoding) {
        this._bytes = Buffer.concat([this._bytes, toBuffer(data, encoding)]);
        return this;
    };
    Verify.prototype.verify = function(key, signature, signatureFormat) {
        var signatureBytes = signatureFormat ? Buffer.from(signature, signatureFormat) : toBuffer(signature);
        return oneShotVerify(this._algorithm, this._bytes, key, signatureBytes);
    };

    var crypto = {
        createHash: function(algorithm) { return new Hash(algorithm); },
        createHmac: function(algorithm, key) { return new Hmac(algorithm, key); },
        createPrivateKey: createPrivateKey,
        createPublicKey: createPublicKey,
        createSecretKey: createSecretKey,
        createSign: function(algorithm) { return new Sign(algorithm); },
        createVerify: function(algorithm) { return new Verify(algorithm); },
        sign: function(algorithm, data, key) { return oneShotSign(algorithm, data, key); },
        verify: function(algorithm, data, key, signature) { return oneShotVerify(algorithm, data, key, signature); },
        KeyObject: KeyObject,
        randomBytes: function(size) {
            var bytes = __cryptoRandomBytes(size);
            return Buffer.from(bytes);
        },
        randomFillSync: function(buffer, offset, size) {
            var target = buffer;
            var start = offset == null ? 0 : Number(offset) || 0;
            var length = size == null ? (target.length - start) : Number(size) || 0;
            var bytes = __cryptoRandomBytes(length);
            Buffer.from(bytes).copy(target, start, 0, length);
            return target;
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
        getHashes: function() { return ['sha1', 'sha256', 'sha384', 'sha512', 'RSA-SHA256', 'RSA-SHA384', 'RSA-SHA512']; },
        constants: {
            RSA_PKCS1_PADDING: 1,
            RSA_PKCS1_PSS_PADDING: 6,
        },
        webcrypto: typeof globalThis.crypto !== 'undefined' ? globalThis.crypto : {},
    };

    if (!globalThis.__nodeModules) globalThis.__nodeModules = {};
    __nodeModules.crypto = crypto;
})();
