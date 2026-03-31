@preconcurrency import JavaScriptCore
import Foundation
#if canImport(CryptoKit)
import CryptoKit
#endif

/// `node:crypto` implementation bridging to `CryptoKit`.
enum NodeCrypto {
    static func install(in context: JSContext) {
        // randomBytes
        let randomBytesBlock: @convention(block) (Int) -> [UInt8] = { size in
            var bytes = [UInt8](repeating: 0, count: size)
            _ = SecRandomCopyBytes(kSecRandomDefault, size, &bytes)
            return bytes
        }
        context.setObject(randomBytesBlock, forKeyedSubscript: "__cryptoRandomBytes" as NSString)

        // randomUUID
        let randomUUIDBlock: @convention(block) () -> String = {
            UUID().uuidString.lowercased()
        }
        context.setObject(randomUUIDBlock, forKeyedSubscript: "__cryptoRandomUUID" as NSString)

        // SHA-256 hash
        let sha256Block: @convention(block) (String) -> String = { input in
            let data = Data(input.utf8)
            let hash = SHA256.hash(data: data)
            return hash.map { String(format: "%02x", $0) }.joined()
        }
        context.setObject(sha256Block, forKeyedSubscript: "__cryptoSHA256" as NSString)

        // SHA-512 hash
        let sha512Block: @convention(block) (String) -> String = { input in
            let data = Data(input.utf8)
            let hash = SHA512.hash(data: data)
            return hash.map { String(format: "%02x", $0) }.joined()
        }
        context.setObject(sha512Block, forKeyedSubscript: "__cryptoSHA512" as NSString)

        // HMAC
        let hmacBlock: @convention(block) (String, String, String) -> String = { algorithm, key, data in
            let keyData = SymmetricKey(data: Data(key.utf8))
            let messageData = Data(data.utf8)

            switch algorithm.lowercased() {
            case "sha256":
                let mac = HMAC<SHA256>.authenticationCode(for: messageData, using: keyData)
                return Data(mac).map { String(format: "%02x", $0) }.joined()
            case "sha512":
                let mac = HMAC<SHA512>.authenticationCode(for: messageData, using: keyData)
                return Data(mac).map { String(format: "%02x", $0) }.joined()
            default:
                return ""
            }
        }
        context.setObject(hmacBlock, forKeyedSubscript: "__cryptoHMAC" as NSString)

        context.evaluateScript("""
        (function() {
            function Hash(algorithm) {
                this._algorithm = algorithm.toLowerCase().replace('-', '');
                this._data = '';
            }
            Hash.prototype.update = function(data) {
                this._data += (typeof data === 'string') ? data : new TextDecoder().decode(data);
                return this;
            };
            Hash.prototype.digest = function(encoding) {
                var hex;
                switch(this._algorithm) {
                    case 'sha256': hex = __cryptoSHA256(this._data); break;
                    case 'sha512': hex = __cryptoSHA512(this._data); break;
                    default: throw new Error('Unsupported hash algorithm: ' + this._algorithm);
                }
                if (encoding === 'hex') return hex;
                if (encoding === 'base64') {
                    var bytes = [];
                    for (var i = 0; i < hex.length; i += 2) {
                        bytes.push(parseInt(hex.substr(i, 2), 16));
                    }
                    var binary = String.fromCharCode.apply(null, bytes);
                    return btoa(binary);
                }
                // Return buffer-like
                var bytes = new Uint8Array(hex.length / 2);
                for (var i = 0; i < hex.length; i += 2) {
                    bytes[i / 2] = parseInt(hex.substr(i, 2), 16);
                }
                return bytes;
            };

            function Hmac(algorithm, key) {
                this._algorithm = algorithm.toLowerCase().replace('-', '');
                this._key = typeof key === 'string' ? key : new TextDecoder().decode(key);
                this._data = '';
            }
            Hmac.prototype.update = function(data) {
                this._data += (typeof data === 'string') ? data : new TextDecoder().decode(data);
                return this;
            };
            Hmac.prototype.digest = function(encoding) {
                var hex = __cryptoHMAC(this._algorithm, this._key, this._data);
                if (!hex) throw new Error('Unsupported HMAC algorithm: ' + this._algorithm);
                if (encoding === 'hex') return hex;
                if (encoding === 'base64') {
                    var bytes = [];
                    for (var i = 0; i < hex.length; i += 2) {
                        bytes.push(parseInt(hex.substr(i, 2), 16));
                    }
                    return btoa(String.fromCharCode.apply(null, bytes));
                }
                var bytes = new Uint8Array(hex.length / 2);
                for (var i = 0; i < hex.length; i += 2) {
                    bytes[i / 2] = parseInt(hex.substr(i, 2), 16);
                }
                return bytes;
            };

            var crypto = {
                createHash: function(algorithm) { return new Hash(algorithm); },
                createHmac: function(algorithm, key) { return new Hmac(algorithm, key); },
                randomBytes: function(size) {
                    var bytes = __cryptoRandomBytes(size);
                    return Buffer.from(bytes);
                },
                randomUUID: function() { return __cryptoRandomUUID(); },
                randomInt: function(min, max) {
                    if (max === undefined) { max = min; min = 0; }
                    return Math.floor(Math.random() * (max - min)) + min;
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
        """)
    }
}
