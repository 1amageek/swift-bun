@preconcurrency import JavaScriptCore
import Foundation
import Security
import Synchronization
#if canImport(CommonCrypto)
import CommonCrypto
#endif
#if canImport(CryptoKit)
import CryptoKit
#endif

/// Bridges a minimal Web Crypto `SubtleCrypto` surface into JavaScript.
struct WebCryptoBridge: Sendable {
    private enum StoredKey: Sendable {
        case hmac(Data, hash: String)
        case aes(Data, algorithm: String, length: Int)
        case kdf(Data, algorithm: String)
        case ecdsaPrivateP256(Data, format: String)
        case ecdsaPublicP256(Data, format: String)
        case security(Data, algorithm: String, type: String, format: String)
    }

    private final class KeyRegistry: Sendable {
        private let state = Mutex<State>(State())

        private struct State: Sendable {
            var nextID: Int32 = 1
            var keys: [Int32: StoredKey] = [:]
        }

        func insert(_ key: StoredKey) -> Int32 {
            state.withLock { state in
                let identifier = state.nextID
                state.nextID += 1
                state.keys[identifier] = key
                return identifier
            }
        }

        func key(for identifier: Int32) -> StoredKey? {
            state.withLock { $0.keys[identifier] }
        }
    }

    private static let registry = KeyRegistry()

    func install(into context: JSContext) {
        let digestBlock: @convention(block) (String, [UInt8]) -> [UInt8] = { algorithm, bytes in
            let data = Data(bytes)
            switch algorithm.uppercased() {
            case "SHA-1":
                return Array(Insecure.SHA1.hash(data: data))
            case "SHA-256":
                return Array(SHA256.hash(data: data))
            case "SHA-384":
                return Array(SHA384.hash(data: data))
            case "SHA-512":
                return Array(SHA512.hash(data: data))
            default:
                return []
            }
        }
        context.setObject(digestBlock, forKeyedSubscript: "__subtleDigest" as NSString)

        let importKeyBlock: @convention(block) (String, [UInt8], String, Bool, String) -> [String: Any] = { format, keyBytes, algorithmJSON, extractable, usagesJSON in
            do {
                let algorithm = try parseJSONObject(algorithmJSON)
                let usages = try parseStringArray(usagesJSON)
                let name = (algorithm["name"] as? String) ?? ""

                switch name.uppercased() {
                case "HMAC":
                    let keyData: Data
                    let hash = hashName(from: algorithm)
                    switch format.lowercased() {
                    case "raw":
                        keyData = Data(keyBytes)
                    case "jwk":
                        let jwkObject = try parseJSONObject(String(decoding: keyBytes, as: UTF8.self))
                        guard let encoded = jwkObject["k"] as? String else {
                            return ["error": "Missing JWK secret"]
                        }
                        keyData = try decodeBase64URL(encoded)
                    default:
                        return ["error": "Unsupported key format for HMAC: \(format)"]
                    }
                    let token = Self.registry.insert(.hmac(keyData, hash: hash))
                    return [
                        "token": Int(token),
                        "type": "secret",
                        "extractable": extractable,
                        "usages": usages,
                        "algorithm": algorithm,
                    ]

                case "AES-GCM":
                    let keyData: Data
                    switch format.lowercased() {
                    case "raw":
                        keyData = Data(keyBytes)
                    case "jwk":
                        let jwkObject = try parseJSONObject(String(decoding: keyBytes, as: UTF8.self))
                        guard (jwkObject["kty"] as? String)?.uppercased() == "OCT" else {
                            return ["error": "AES-GCM JWK must use kty=oct"]
                        }
                        guard let encoded = jwkObject["k"] as? String else {
                            return ["error": "Missing JWK secret"]
                        }
                        keyData = try decodeBase64URL(encoded)
                    default:
                        return ["error": "Unsupported key format for AES-GCM: \(format)"]
                    }

                    let keyLength = keyData.count * 8
                    guard [128, 192, 256].contains(keyLength) else {
                        return ["error": "AES-GCM keys must be 128, 192, or 256 bits"]
                    }
                    let token = Self.registry.insert(.aes(keyData, algorithm: "AES-GCM", length: keyLength))
                    return [
                        "token": Int(token),
                        "type": "secret",
                        "extractable": extractable,
                        "usages": usages,
                        "algorithm": [
                            "name": "AES-GCM",
                            "length": keyLength,
                        ],
                    ]

                case "PBKDF2", "HKDF":
                    guard format.lowercased() == "raw" else {
                        return ["error": "Unsupported key format for \(name): \(format)"]
                    }
                    let token = Self.registry.insert(.kdf(Data(keyBytes), algorithm: name.uppercased()))
                    return [
                        "token": Int(token),
                        "type": "secret",
                        "extractable": extractable,
                        "usages": usages,
                        "algorithm": ["name": name.uppercased()],
                    ]

                case "RSASSA-PKCS1-V1_5", "RSA-PSS", "ECDSA":
                    if name.uppercased() == "ECDSA" {
                        let namedCurve = ((algorithm["namedCurve"] as? String) ?? "").uppercased()
                        guard namedCurve == "P-256" else {
                            return ["error": "Unsupported ECDSA namedCurve: \(namedCurve)"]
                        }
                        let normalizedFormat = format.lowercased()
                        switch normalizedFormat {
                        case "pkcs8":
                            do {
                                _ = try P256.Signing.PrivateKey(derRepresentation: Data(keyBytes))
                            } catch {
                                return ["error": error.localizedDescription]
                            }
                            let token = Self.registry.insert(.ecdsaPrivateP256(Data(keyBytes), format: format))
                            return [
                                "token": Int(token),
                                "type": "private",
                                "extractable": extractable,
                                "usages": usages,
                                "algorithm": algorithm,
                            ]
                        case "spki":
                            do {
                                _ = try P256.Signing.PublicKey(derRepresentation: Data(keyBytes))
                            } catch {
                                return ["error": error.localizedDescription]
                            }
                            let token = Self.registry.insert(.ecdsaPublicP256(Data(keyBytes), format: format))
                            return [
                                "token": Int(token),
                                "type": "public",
                                "extractable": extractable,
                                "usages": usages,
                                "algorithm": algorithm,
                            ]
                        default:
                            return ["error": "Unsupported key format for \(name): \(format)"]
                        }
                    }

                    let keyClass: CFString
                    switch format.lowercased() {
                    case "pkcs8":
                        keyClass = kSecAttrKeyClassPrivate
                    case "spki":
                        keyClass = kSecAttrKeyClassPublic
                    default:
                        return ["error": "Unsupported key format for \(name): \(format)"]
                    }
                    let type = keyClass == kSecAttrKeyClassPrivate ? "private" : "public"
                    let keyData = Data(keyBytes)
                    do {
                        _ = try secKey(from: keyData, algorithm: name, type: type, format: format)
                    } catch {
                        return ["error": error.localizedDescription]
                    }
                    let token = Self.registry.insert(.security(keyData, algorithm: name, type: type, format: format))
                    return [
                        "token": Int(token),
                        "type": type,
                        "extractable": extractable,
                        "usages": usages,
                        "algorithm": algorithm,
                    ]

                default:
                    return ["error": "Unsupported algorithm: \(name)"]
                }
            } catch {
                return ["error": error.localizedDescription]
            }
        }
        context.setObject(importKeyBlock, forKeyedSubscript: "__subtleImportKey" as NSString)

        let exportKeyBlock: @convention(block) (String, Int32) -> [String: Any] = { format, token in
            guard let key = Self.registry.key(for: token) else {
                return ["error": "Unknown key"]
            }
            let normalizedFormat = format.lowercased()
            switch key {
            case .hmac(let secret, let hash):
                switch normalizedFormat {
                case "raw":
                    return ["bytes": [UInt8](secret)]
                case "jwk":
                    return [
                        "jwk": [
                            "kty": "oct",
                            "k": encodeBase64URL(secret),
                            "alg": hmacJWKAlgorithmName(for: hash),
                            "key_ops": ["sign", "verify"],
                            "ext": true,
                        ],
                    ]
                default:
                    return ["error": "Unsupported export format for HMAC: \(format)"]
                }
            case .aes(let secret, let algorithm, let length):
                switch normalizedFormat {
                case "raw":
                    return ["bytes": [UInt8](secret)]
                case "jwk":
                    return [
                        "jwk": [
                            "kty": "oct",
                            "k": encodeBase64URL(secret),
                            "alg": aesJWKAlgorithmName(for: algorithm, length: length),
                            "key_ops": ["encrypt", "decrypt"],
                            "ext": true,
                        ],
                    ]
                default:
                    return ["error": "Unsupported export format for \(algorithm): \(format)"]
                }
            case .security(let keyData, _, _, let sourceFormat):
                guard normalizedFormat == sourceFormat.lowercased() else {
                    return ["error": "Key was imported as \(sourceFormat) and cannot be exported as \(format)"]
                }
                return ["bytes": [UInt8](keyData)]
            case .kdf:
                return ["error": "KDF base keys cannot be exported"]
            case .ecdsaPrivateP256(let keyData, let sourceFormat), .ecdsaPublicP256(let keyData, let sourceFormat):
                guard normalizedFormat == sourceFormat.lowercased() else {
                    return ["error": "Key was imported as \(sourceFormat) and cannot be exported as \(format)"]
                }
                return ["bytes": [UInt8](keyData)]
            }
        }
        context.setObject(exportKeyBlock, forKeyedSubscript: "__subtleExportKey" as NSString)

        let generateKeyBlock: @convention(block) (String, Bool, String) -> [String: Any] = { algorithmJSON, extractable, usagesJSON in
            do {
                let algorithm = try parseJSONObject(algorithmJSON)
                let usages = try parseStringArray(usagesJSON)
                let name = ((algorithm["name"] as? String) ?? "").uppercased()

                switch name {
                case "HMAC":
                    let hash = hashName(from: algorithm)
                    let keyLength = try hmacKeyLength(from: algorithm, hash: hash)
                    let keyData = try randomBytes(count: keyLength / 8)
                    let token = Self.registry.insert(.hmac(keyData, hash: hash))
                    return [
                        "token": Int(token),
                        "type": "secret",
                        "extractable": extractable,
                        "usages": usages,
                        "algorithm": [
                            "name": "HMAC",
                            "hash": ["name": hash],
                            "length": keyLength,
                        ],
                    ]
                case "AES-GCM":
                    let keyLength = try aesKeyLength(from: algorithm)
                    let keyData = try randomBytes(count: keyLength / 8)
                    let token = Self.registry.insert(.aes(keyData, algorithm: "AES-GCM", length: keyLength))
                    return [
                        "token": Int(token),
                        "type": "secret",
                        "extractable": extractable,
                        "usages": usages,
                        "algorithm": [
                            "name": "AES-GCM",
                            "length": keyLength,
                        ],
                    ]
                default:
                    return ["error": "Unsupported algorithm: \(name)"]
                }
            } catch {
                return ["error": error.localizedDescription]
            }
        }
        context.setObject(generateKeyBlock, forKeyedSubscript: "__subtleGenerateKey" as NSString)

        let deriveBitsBlock: @convention(block) (String, Int32, Int32) -> [String: Any] = { algorithmJSON, token, length in
            do {
                let algorithm = try parseJSONObject(algorithmJSON)
                guard let key = Self.registry.key(for: token) else {
                    return ["error": "Unknown key"]
                }
                guard case .kdf(let baseKey, let keyAlgorithm) = key else {
                    return ["error": "Provided key does not support deriveBits()"]
                }
                let derived: Data
                switch keyAlgorithm {
                case "PBKDF2":
                    derived = try derivePBKDF2Bits(baseKey: baseKey, parameters: algorithm, bitLength: Int(length))
                case "HKDF":
                    derived = try deriveHKDFBits(baseKey: baseKey, parameters: algorithm, bitLength: Int(length))
                default:
                    return ["error": "Unsupported deriveBits algorithm: \(keyAlgorithm)"]
                }
                return ["bytes": [UInt8](derived)]
            } catch {
                return ["error": error.localizedDescription]
            }
        }
        context.setObject(deriveBitsBlock, forKeyedSubscript: "__subtleDeriveBits" as NSString)

        let signBlock: @convention(block) (String, Int32, [UInt8]) -> [String: Any] = { algorithmJSON, token, bytes in
            do {
                let algorithm = try parseJSONObject(algorithmJSON)
                guard let key = Self.registry.key(for: token) else {
                    return ["error": "Unknown key"]
                }
                let data = Data(bytes)
                switch key {
                case .hmac(let secret, let keyHash):
                    let effectiveHash = resolveHMACHash(parameters: algorithm, fallback: keyHash)
                    let signature = try hmacSignature(secret: secret, algorithm: effectiveHash, data: data)
                    return ["bytes": [UInt8](signature)]
                case .aes:
                    return ["error": "AES keys do not support sign()"]
                case .kdf:
                    return ["error": "KDF base keys do not support sign()"]
                case .ecdsaPrivateP256(let keyData, _):
                    let privateKey = try P256.Signing.PrivateKey(derRepresentation: keyData)
                    let signature = try privateKey.signature(for: data)
                    return ["bytes": [UInt8](signature.derRepresentation)]
                case .ecdsaPublicP256:
                    return ["error": "Public ECDSA keys do not support sign()"]
                case .security(let keyData, let keyAlgorithm, let type, let format):
                    let secKey = try secKey(from: keyData, algorithm: keyAlgorithm, type: type, format: format)
                    let secAlgorithm = try signatureAlgorithm(for: keyAlgorithm, parameters: algorithm, isSigning: true)
                    var error: Unmanaged<CFError>?
                    guard let signature = SecKeyCreateSignature(secKey, secAlgorithm, data as CFData, &error) else {
                        let message = error?.takeRetainedValue().localizedDescription ?? "Unable to sign"
                        return ["error": message]
                    }
                    return ["bytes": [UInt8](signature as Data)]
                }
            } catch {
                return ["error": error.localizedDescription]
            }
        }
        context.setObject(signBlock, forKeyedSubscript: "__subtleSign" as NSString)

        let verifyBlock: @convention(block) (String, Int32, [UInt8], [UInt8]) -> [String: Any] = { algorithmJSON, token, signatureBytes, dataBytes in
            do {
                let algorithm = try parseJSONObject(algorithmJSON)
                guard let key = Self.registry.key(for: token) else {
                    return ["error": "Unknown key"]
                }
                let data = Data(dataBytes)
                let signature = Data(signatureBytes)
                switch key {
                case .hmac(let secret, let keyHash):
                    let effectiveHash = resolveHMACHash(parameters: algorithm, fallback: keyHash)
                    let expected = try hmacSignature(secret: secret, algorithm: effectiveHash, data: data)
                    return ["verified": expected == signature]
                case .aes:
                    return ["error": "AES keys do not support verify()"]
                case .kdf:
                    return ["error": "KDF base keys do not support verify()"]
                case .ecdsaPrivateP256:
                    return ["error": "Private ECDSA keys do not support verify()"]
                case .ecdsaPublicP256(let keyData, _):
                    let publicKey = try P256.Signing.PublicKey(derRepresentation: keyData)
                    let parsedSignature = try P256.Signing.ECDSASignature(derRepresentation: signature)
                    return ["verified": publicKey.isValidSignature(parsedSignature, for: data)]
                case .security(let keyData, let keyAlgorithm, let type, let format):
                    let secKey = try secKey(from: keyData, algorithm: keyAlgorithm, type: type, format: format)
                    let secAlgorithm = try signatureAlgorithm(for: keyAlgorithm, parameters: algorithm, isSigning: false)
                    var error: Unmanaged<CFError>?
                    let verified = SecKeyVerifySignature(secKey, secAlgorithm, data as CFData, signature as CFData, &error)
                    return ["verified": verified]
                }
            } catch {
                return ["error": error.localizedDescription]
            }
        }
        context.setObject(verifyBlock, forKeyedSubscript: "__subtleVerify" as NSString)

        let encryptBlock: @convention(block) (String, Int32, [UInt8]) -> [String: Any] = { algorithmJSON, token, bytes in
            do {
                let algorithm = try parseJSONObject(algorithmJSON)
                guard let key = Self.registry.key(for: token) else {
                    return ["error": "Unknown key"]
                }
                guard case .aes(let keyData, let keyAlgorithm, _) = key else {
                    return ["error": "Provided key does not support encryption"]
                }
                guard keyAlgorithm.uppercased() == "AES-GCM" else {
                    return ["error": "Unsupported encryption algorithm: \(keyAlgorithm)"]
                }
                let parameters = try parseAESGCMParameters(from: algorithm)
                let nonce = try AES.GCM.Nonce(data: parameters.iv)
                let symmetricKey = SymmetricKey(data: keyData)
                let sealedBox = try AES.GCM.seal(
                    Data(bytes),
                    using: symmetricKey,
                    nonce: nonce,
                    authenticating: parameters.additionalData
                )
                var output = Data()
                output.append(sealedBox.ciphertext)
                output.append(sealedBox.tag)
                return ["bytes": [UInt8](output)]
            } catch {
                return ["error": error.localizedDescription]
            }
        }
        context.setObject(encryptBlock, forKeyedSubscript: "__subtleEncrypt" as NSString)

        let decryptBlock: @convention(block) (String, Int32, [UInt8]) -> [String: Any] = { algorithmJSON, token, bytes in
            do {
                let algorithm = try parseJSONObject(algorithmJSON)
                guard let key = Self.registry.key(for: token) else {
                    return ["error": "Unknown key"]
                }
                guard case .aes(let keyData, let keyAlgorithm, _) = key else {
                    return ["error": "Provided key does not support decryption"]
                }
                guard keyAlgorithm.uppercased() == "AES-GCM" else {
                    return ["error": "Unsupported decryption algorithm: \(keyAlgorithm)"]
                }
                let parameters = try parseAESGCMParameters(from: algorithm)
                let input = Data(bytes)
                guard input.count >= parameters.tagLengthBytes else {
                    return ["error": "AES-GCM ciphertext is shorter than tag length"]
                }
                let nonce = try AES.GCM.Nonce(data: parameters.iv)
                let ciphertext = input.prefix(input.count - parameters.tagLengthBytes)
                let tag = input.suffix(parameters.tagLengthBytes)
                let sealedBox = try AES.GCM.SealedBox(
                    nonce: nonce,
                    ciphertext: ciphertext,
                    tag: tag
                )
                let plaintext = try AES.GCM.open(
                    sealedBox,
                    using: SymmetricKey(data: keyData),
                    authenticating: parameters.additionalData
                )
                return ["bytes": [UInt8](plaintext)]
            } catch {
                return ["error": error.localizedDescription]
            }
        }
        context.setObject(decryptBlock, forKeyedSubscript: "__subtleDecrypt" as NSString)

        let createPrivateKeyBlock: @convention(block) (String, [UInt8], String) -> [String: Any] = { format, keyBytes, typeHint in
            do {
                let created = try createPrivateKey(format: format, keyBytes: Data(keyBytes), typeHint: typeHint)
                let token = Self.registry.insert(.security(created.derData, algorithm: created.algorithm, type: "private", format: format))
                return [
                    "token": Int(token),
                    "type": "private",
                    "asymmetricKeyType": created.algorithm.uppercased().hasPrefix("EC") ? "ec" : "rsa",
                    "format": format,
                ]
            } catch {
                return ["error": error.localizedDescription]
            }
        }
        context.setObject(createPrivateKeyBlock, forKeyedSubscript: "__cryptoCreatePrivateKey" as NSString)
    }
}

private enum WebCryptoBridgeError: LocalizedError {
    case invalidJSON
    case invalidBase64URL
    case invalidDER(String)
    case invalidKeyLength(Int)
    case invalidAlgorithmParameter(String)
    case unsupportedHash(String)
    case unsupportedAlgorithm(String)
    case invalidPEM

    var errorDescription: String? {
        switch self {
        case .invalidJSON:
            return "Invalid JSON payload"
        case .invalidBase64URL:
            return "Invalid base64url data"
        case .invalidDER(let message):
            return "Invalid DER: \(message)"
        case .invalidKeyLength(let length):
            return "Invalid key length: \(length)"
        case .invalidAlgorithmParameter(let message):
            return message
        case .unsupportedHash(let name):
            return "Unsupported hash: \(name)"
        case .unsupportedAlgorithm(let name):
            return "Unsupported algorithm: \(name)"
        case .invalidPEM:
            return "Invalid PEM payload"
        }
    }
}

private func parseJSONObject(_ json: String) throws -> [String: Any] {
    guard let data = json.data(using: .utf8),
          let object = try JSONSerialization.jsonObject(with: data) as? [String: Any] else {
        throw WebCryptoBridgeError.invalidJSON
    }
    return object
}

private func parseStringArray(_ json: String) throws -> [String] {
    guard let data = json.data(using: .utf8),
          let object = try JSONSerialization.jsonObject(with: data) as? [String] else {
        throw WebCryptoBridgeError.invalidJSON
    }
    return object
}

private func decodeBase64URL(_ input: String) throws -> Data {
    var base64 = input.replacingOccurrences(of: "-", with: "+").replacingOccurrences(of: "_", with: "/")
    let remainder = base64.count % 4
    if remainder != 0 {
        base64 += String(repeating: "=", count: 4 - remainder)
    }
    guard let data = Data(base64Encoded: base64) else {
        throw WebCryptoBridgeError.invalidBase64URL
    }
    return data
}

private func encodeBase64URL(_ data: Data) -> String {
    data.base64EncodedString()
        .replacingOccurrences(of: "+", with: "-")
        .replacingOccurrences(of: "/", with: "_")
        .replacingOccurrences(of: "=", with: "")
}

private func hashName(from algorithm: [String: Any]) -> String {
    if let hash = algorithm["hash"] as? [String: Any], let name = hash["name"] as? String {
        return name.uppercased()
    }
    if let hash = algorithm["hash"] as? String {
        return hash.uppercased()
    }
    return ((algorithm["name"] as? String) ?? "").uppercased()
}

private func resolveHMACHash(parameters: [String: Any], fallback: String) -> String {
    let value = hashName(from: parameters)
    return value == "HMAC" || value.isEmpty ? fallback : value
}

private func hmacKeyLength(from algorithm: [String: Any], hash: String) throws -> Int {
    if let explicitLength = integerValue(algorithm["length"]) {
        guard explicitLength > 0 else {
            throw WebCryptoBridgeError.invalidKeyLength(explicitLength)
        }
        return explicitLength
    }

    switch hash {
    case "SHA-1", "SHA-256":
        return 512
    case "SHA-384", "SHA-512":
        return 1024
    default:
        throw WebCryptoBridgeError.unsupportedHash(hash)
    }
}

private func aesKeyLength(from algorithm: [String: Any]) throws -> Int {
    guard let length = integerValue(algorithm["length"]), [128, 192, 256].contains(length) else {
        throw WebCryptoBridgeError.invalidAlgorithmParameter("AES-GCM length must be 128, 192, or 256 bits")
    }
    return length
}

private func hmacJWKAlgorithmName(for hash: String) -> String {
    switch hash {
    case "SHA-1": return "HS1"
    case "SHA-256": return "HS256"
    case "SHA-384": return "HS384"
    case "SHA-512": return "HS512"
    default: return hash
    }
}

private func aesJWKAlgorithmName(for algorithm: String, length: Int) -> String {
    switch algorithm.uppercased() {
    case "AES-GCM":
        return "A\(length)GCM"
    default:
        return algorithm
    }
}

private struct AESGCMParameters: Sendable {
    let iv: Data
    let additionalData: Data
    let tagLengthBytes: Int
}

private func parseAESGCMParameters(from algorithm: [String: Any]) throws -> AESGCMParameters {
    let name = ((algorithm["name"] as? String) ?? "").uppercased()
    guard name == "AES-GCM" else {
        throw WebCryptoBridgeError.unsupportedAlgorithm(name)
    }
    let iv = try dataFromJSONArray(algorithm["iv"], label: "iv")
    guard !iv.isEmpty else {
        throw WebCryptoBridgeError.invalidAlgorithmParameter("AES-GCM iv must not be empty")
    }
    let additionalData = try dataFromOptionalJSONArray(algorithm["additionalData"])
    let tagLength = integerValue(algorithm["tagLength"]) ?? 128
    guard tagLength == 128 else {
        throw WebCryptoBridgeError.invalidAlgorithmParameter("AES-GCM currently supports tagLength=128 only")
    }
    return AESGCMParameters(iv: iv, additionalData: additionalData, tagLengthBytes: tagLength / 8)
}

private func parseKDFHash(from algorithm: [String: Any]) throws -> String {
    let hash = hashName(from: algorithm)
    switch hash {
    case "SHA-1", "SHA-256", "SHA-384", "SHA-512":
        return hash
    default:
        throw WebCryptoBridgeError.unsupportedHash(hash)
    }
}

private func derivePBKDF2Bits(baseKey: Data, parameters: [String: Any], bitLength: Int) throws -> Data {
    guard bitLength > 0, bitLength % 8 == 0 else {
        throw WebCryptoBridgeError.invalidAlgorithmParameter("deriveBits length must be a positive multiple of 8")
    }
    let salt = try dataFromJSONArray(parameters["salt"], label: "salt")
    let iterations = integerValue(parameters["iterations"]) ?? 0
    guard iterations > 0 else {
        throw WebCryptoBridgeError.invalidAlgorithmParameter("PBKDF2 iterations must be greater than zero")
    }
    let hash = try parseKDFHash(from: parameters)
    let derivedLength = bitLength / 8
    var output = [UInt8](repeating: 0, count: derivedLength)
    let status = baseKey.withUnsafeBytes { keyBuffer in
        salt.withUnsafeBytes { saltBuffer in
            let keyPointer = keyBuffer.bindMemory(to: Int8.self).baseAddress
            let saltPointer = saltBuffer.bindMemory(to: UInt8.self).baseAddress
            return CCKeyDerivationPBKDF(
                CCPBKDFAlgorithm(kCCPBKDF2),
                keyPointer,
                baseKey.count,
                saltPointer,
                salt.count,
                pseudoRandomAlgorithm(for: hash),
                UInt32(iterations),
                &output,
                derivedLength
            )
        }
    }
    guard status == kCCSuccess else {
        throw WebCryptoBridgeError.invalidAlgorithmParameter("PBKDF2 derivation failed with status \(status)")
    }
    return Data(output)
}

private func deriveHKDFBits(baseKey: Data, parameters: [String: Any], bitLength: Int) throws -> Data {
    guard bitLength > 0, bitLength % 8 == 0 else {
        throw WebCryptoBridgeError.invalidAlgorithmParameter("deriveBits length must be a positive multiple of 8")
    }
    let salt = try dataFromJSONArray(parameters["salt"], label: "salt")
    let info = try dataFromOptionalJSONArray(parameters["info"])
    let byteCount = bitLength / 8
    let hash = try parseKDFHash(from: parameters)
    switch hash {
    case "SHA-1":
        let derived = HKDF<Insecure.SHA1>.deriveKey(
            inputKeyMaterial: SymmetricKey(data: baseKey),
            salt: salt,
            info: info,
            outputByteCount: byteCount
        )
        return derived.withUnsafeBytes { Data($0) }
    case "SHA-256":
        let derived = HKDF<SHA256>.deriveKey(
            inputKeyMaterial: SymmetricKey(data: baseKey),
            salt: salt,
            info: info,
            outputByteCount: byteCount
        )
        return derived.withUnsafeBytes { Data($0) }
    case "SHA-384":
        let derived = HKDF<SHA384>.deriveKey(
            inputKeyMaterial: SymmetricKey(data: baseKey),
            salt: salt,
            info: info,
            outputByteCount: byteCount
        )
        return derived.withUnsafeBytes { Data($0) }
    case "SHA-512":
        let derived = HKDF<SHA512>.deriveKey(
            inputKeyMaterial: SymmetricKey(data: baseKey),
            salt: salt,
            info: info,
            outputByteCount: byteCount
        )
        return derived.withUnsafeBytes { Data($0) }
    default:
        throw WebCryptoBridgeError.unsupportedHash(hash)
    }
}

private func pseudoRandomAlgorithm(for hash: String) -> CCPseudoRandomAlgorithm {
    switch hash {
    case "SHA-1":
        return CCPseudoRandomAlgorithm(kCCPRFHmacAlgSHA1)
    case "SHA-256":
        return CCPseudoRandomAlgorithm(kCCPRFHmacAlgSHA256)
    case "SHA-384":
        return CCPseudoRandomAlgorithm(kCCPRFHmacAlgSHA384)
    case "SHA-512":
        return CCPseudoRandomAlgorithm(kCCPRFHmacAlgSHA512)
    default:
        return CCPseudoRandomAlgorithm(kCCPRFHmacAlgSHA256)
    }
}

private func dataFromOptionalJSONArray(_ value: Any?) throws -> Data {
    guard let value else {
        return Data()
    }
    return try dataFromJSONArray(value, label: "additionalData")
}

private func dataFromJSONArray(_ value: Any?, label: String) throws -> Data {
    guard let array = value as? [Any] else {
        throw WebCryptoBridgeError.invalidAlgorithmParameter("Missing or invalid \(label)")
    }
    var bytes: [UInt8] = []
    bytes.reserveCapacity(array.count)
    for entry in array {
        guard let integer = integerValue(entry), (0...255).contains(integer) else {
            throw WebCryptoBridgeError.invalidAlgorithmParameter("\(label) must contain byte values")
        }
        bytes.append(UInt8(integer))
    }
    return Data(bytes)
}

private func integerValue(_ value: Any?) -> Int? {
    if let intValue = value as? Int {
        return intValue
    }
    if let doubleValue = value as? Double {
        return Int(doubleValue)
    }
    if let numberValue = value as? NSNumber {
        return numberValue.intValue
    }
    return nil
}

private func randomBytes(count: Int) throws -> Data {
    var bytes = [UInt8](repeating: 0, count: count)
    let status = SecRandomCopyBytes(kSecRandomDefault, count, &bytes)
    guard status == errSecSuccess else {
        throw NSError(
            domain: NSOSStatusErrorDomain,
            code: Int(status),
            userInfo: [NSLocalizedDescriptionKey: "Unable to generate secure random bytes"]
        )
    }
    return Data(bytes)
}

private func hmacSignature(secret: Data, algorithm: String, data: Data) throws -> Data {
    let key = SymmetricKey(data: secret)
    switch algorithm {
    case "SHA-1":
        return Data(HMAC<Insecure.SHA1>.authenticationCode(for: data, using: key))
    case "SHA-256":
        return Data(HMAC<SHA256>.authenticationCode(for: data, using: key))
    case "SHA-384":
        return Data(HMAC<SHA384>.authenticationCode(for: data, using: key))
    case "SHA-512":
        return Data(HMAC<SHA512>.authenticationCode(for: data, using: key))
    default:
        throw WebCryptoBridgeError.unsupportedHash(algorithm)
    }
}

private func signatureAlgorithm(for keyAlgorithm: String, parameters: [String: Any], isSigning: Bool) throws -> SecKeyAlgorithm {
    let hash = hashName(from: parameters)
    switch keyAlgorithm.uppercased() {
    case "RSASSA-PKCS1-V1_5":
        switch hash {
        case "SHA-256": return .rsaSignatureMessagePKCS1v15SHA256
        case "SHA-384": return .rsaSignatureMessagePKCS1v15SHA384
        case "SHA-512": return .rsaSignatureMessagePKCS1v15SHA512
        default: throw WebCryptoBridgeError.unsupportedHash(hash)
        }
    case "RSA-PSS":
        switch hash {
        case "SHA-256": return .rsaSignatureMessagePSSSHA256
        case "SHA-384": return .rsaSignatureMessagePSSSHA384
        case "SHA-512": return .rsaSignatureMessagePSSSHA512
        default: throw WebCryptoBridgeError.unsupportedHash(hash)
        }
    case "ECDSA":
        switch hash {
        case "SHA-256": return .ecdsaSignatureMessageX962SHA256
        case "SHA-384": return .ecdsaSignatureMessageX962SHA384
        case "SHA-512": return .ecdsaSignatureMessageX962SHA512
        default: throw WebCryptoBridgeError.unsupportedHash(hash)
        }
    default:
        throw WebCryptoBridgeError.unsupportedAlgorithm(keyAlgorithm)
    }
}

private func normalizeSecKeyData(_ data: Data, algorithm: String, type: String, format: String?) throws -> Data {
    guard let format else {
        return data
    }
    switch (format.lowercased(), type) {
    case ("pkcs8", "private"):
        return try extractPKCS8PrivateKey(from: data)
    case ("spki", "public"):
        return try extractSPKIPublicKey(from: data)
    default:
        return data
    }
}

private func extractPKCS8PrivateKey(from data: Data) throws -> Data {
    var reader = DERReader(data: data)
    let sequence = try reader.readValue(forTag: 0x30)
    try reader.expectEnd()

    var sequenceReader = DERReader(data: sequence)
    _ = try sequenceReader.readValue(forTag: 0x02)
    _ = try sequenceReader.readValue(forTag: 0x30)
    let keyBytes = try sequenceReader.readValue(forTag: 0x04)
    return keyBytes
}

private func extractSPKIPublicKey(from data: Data) throws -> Data {
    var reader = DERReader(data: data)
    let sequence = try reader.readValue(forTag: 0x30)
    try reader.expectEnd()

    var sequenceReader = DERReader(data: sequence)
    _ = try sequenceReader.readValue(forTag: 0x30)
    let bitString = try sequenceReader.readValue(forTag: 0x03)
    guard let unusedBits = bitString.first, unusedBits == 0 else {
        throw WebCryptoBridgeError.invalidDER("Unsupported BIT STRING padding")
    }
    return Data(bitString.dropFirst())
}

private struct DERReader {
    private let data: Data
    private var index: Data.Index

    init(data: Data) {
        self.data = data
        self.index = data.startIndex
    }

    mutating func readValue(forTag expectedTag: UInt8) throws -> Data {
        let tag = try readByte()
        guard tag == expectedTag else {
            throw WebCryptoBridgeError.invalidDER("Expected tag \(expectedTag), found \(tag)")
        }
        let length = try readLength()
        let endIndex = data.index(index, offsetBy: length, limitedBy: data.endIndex)
        guard let endIndex else {
            throw WebCryptoBridgeError.invalidDER("Length exceeds remaining data")
        }
        let value = data[index..<endIndex]
        index = endIndex
        return Data(value)
    }

    mutating func expectEnd() throws {
        guard index == data.endIndex else {
            throw WebCryptoBridgeError.invalidDER("Unexpected trailing data")
        }
    }

    private mutating func readByte() throws -> UInt8 {
        guard index < data.endIndex else {
            throw WebCryptoBridgeError.invalidDER("Unexpected end of data")
        }
        let byte = data[index]
        index = data.index(after: index)
        return byte
    }

    private mutating func readLength() throws -> Int {
        let first = try readByte()
        if first & 0x80 == 0 {
            return Int(first)
        }

        let byteCount = Int(first & 0x7F)
        guard byteCount > 0 else {
            throw WebCryptoBridgeError.invalidDER("Indefinite lengths are unsupported")
        }

        var result = 0
        for _ in 0..<byteCount {
            result = (result << 8) | Int(try readByte())
        }
        return result
    }
}

private func secKey(from data: Data, algorithm: String, type: String, format: String? = nil) throws -> SecKey {
    let normalizedData = try normalizeSecKeyData(data, algorithm: algorithm, type: type, format: format)
    let keyType: CFString = algorithm.uppercased().hasPrefix("EC") ? kSecAttrKeyTypeECSECPrimeRandom : kSecAttrKeyTypeRSA
    let keyClass: CFString = type == "private" ? kSecAttrKeyClassPrivate : kSecAttrKeyClassPublic
    var error: Unmanaged<CFError>?
    let attributes: [String: Any] = [
        kSecAttrKeyType as String: keyType,
        kSecAttrKeyClass as String: keyClass,
        kSecAttrIsPermanent as String: false,
    ]
    guard let secKey = SecKeyCreateWithData(normalizedData as CFData, attributes as CFDictionary, &error) else {
        throw error?.takeRetainedValue() ?? WebCryptoBridgeError.unsupportedAlgorithm(algorithm)
    }
    return secKey
}

private func createPrivateKey(format: String, keyBytes: Data, typeHint: String) throws -> (derData: Data, algorithm: String) {
    let normalizedFormat = format.lowercased()
    switch normalizedFormat {
    case "pem":
        let pemString = String(decoding: keyBytes, as: UTF8.self)
        let der = try pemToDER(pemString)
        return try validatePrivateKeyDER(der, typeHint: typeHint)
    case "der":
        return try validatePrivateKeyDER(keyBytes, typeHint: typeHint)
    default:
        throw WebCryptoBridgeError.unsupportedAlgorithm("Unsupported private key format: \(format)")
    }
}

private func validatePrivateKeyDER(_ data: Data, typeHint: String) throws -> (derData: Data, algorithm: String) {
    let hint = typeHint.lowercased()
    if hint == "sec1" || hint == "ec" {
        return (data, "ECDSA")
    }
    if hint == "pkcs1" || hint == "rsa" {
        return (data, "RSASSA-PKCS1-V1_5")
    }

    do {
        _ = try secKey(from: data, algorithm: "RSASSA-PKCS1-V1_5", type: "private")
        return (data, "RSASSA-PKCS1-V1_5")
    } catch {
        do {
            _ = try secKey(from: data, algorithm: "ECDSA", type: "private")
            return (data, "ECDSA")
        } catch {
            if let detected = detectPrivateKeyAlgorithm(in: data) {
                return (data, detected)
            }
            throw error
        }
    }
}

private func pemToDER(_ pem: String) throws -> Data {
    let lines = pem
        .components(separatedBy: .newlines)
        .filter { !$0.hasPrefix("-----BEGIN") && !$0.hasPrefix("-----END") && !$0.isEmpty }
    let base64 = lines.joined()
    guard let data = Data(base64Encoded: base64) else {
        throw WebCryptoBridgeError.invalidPEM
    }
    return data
}

private func detectPrivateKeyAlgorithm(in data: Data) -> String? {
    let rsaOID: [UInt8] = [0x06, 0x09, 0x2A, 0x86, 0x48, 0x86, 0xF7, 0x0D, 0x01, 0x01, 0x01]
    let ecOID: [UInt8] = [0x06, 0x07, 0x2A, 0x86, 0x48, 0xCE, 0x3D, 0x02, 0x01]
    let bytes = [UInt8](data)
    if containsSubsequence(bytes, needle: rsaOID) {
        return "RSASSA-PKCS1-V1_5"
    }
    if containsSubsequence(bytes, needle: ecOID) {
        return "ECDSA"
    }
    return nil
}

private func containsSubsequence(_ haystack: [UInt8], needle: [UInt8]) -> Bool {
    guard !needle.isEmpty, haystack.count >= needle.count else { return false }
    for index in 0...(haystack.count - needle.count) {
        if Array(haystack[index..<(index + needle.count)]) == needle {
            return true
        }
    }
    return false
}
