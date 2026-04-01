@preconcurrency import JavaScriptCore
import Foundation
import Security
import Synchronization
#if canImport(CryptoKit)
import CryptoKit
#endif

/// Bridges a minimal Web Crypto `SubtleCrypto` surface into JavaScript.
struct WebCryptoBridge: Sendable {
    private enum StoredKey: Sendable {
        case hmac(Data, hash: String)
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

                case "RSASSA-PKCS1-V1_5", "RSA-PSS", "ECDSA":
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
                        _ = try secKey(from: keyData, algorithm: name, type: type)
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
                case .security(let keyData, let keyAlgorithm, let type, _):
                    let secKey = try secKey(from: keyData, algorithm: keyAlgorithm, type: type)
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
                case .security(let keyData, let keyAlgorithm, let type, _):
                    let secKey = try secKey(from: keyData, algorithm: keyAlgorithm, type: type)
                    let secAlgorithm = try signatureAlgorithm(for: keyAlgorithm, parameters: algorithm, isSigning: false)
                    var error: Unmanaged<CFError>?
                    let verified = SecKeyVerifySignature(secKey, secAlgorithm, data as CFData, signature as CFData, &error)
                    if let error {
                        return ["error": error.takeRetainedValue().localizedDescription]
                    }
                    return ["verified": verified]
                }
            } catch {
                return ["error": error.localizedDescription]
            }
        }
        context.setObject(verifyBlock, forKeyedSubscript: "__subtleVerify" as NSString)

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

private enum WebCryptoBridgeError: Error {
    case invalidJSON
    case invalidBase64URL
    case unsupportedHash(String)
    case unsupportedAlgorithm(String)
    case invalidPEM
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

private func hashName(from algorithm: [String: Any]) -> String {
    if let hash = algorithm["hash"] as? [String: Any], let name = hash["name"] as? String {
        return name.uppercased()
    }
    return ((algorithm["name"] as? String) ?? "").uppercased()
}

private func resolveHMACHash(parameters: [String: Any], fallback: String) -> String {
    let value = hashName(from: parameters)
    return value == "HMAC" || value.isEmpty ? fallback : value
}

private func hmacSignature(secret: Data, algorithm: String, data: Data) throws -> Data {
    let key = SymmetricKey(data: secret)
    switch algorithm {
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

private func secKey(from data: Data, algorithm: String, type: String) throws -> SecKey {
    let keyType: CFString = algorithm.uppercased().hasPrefix("EC") ? kSecAttrKeyTypeECSECPrimeRandom : kSecAttrKeyTypeRSA
    let keyClass: CFString = type == "private" ? kSecAttrKeyClassPrivate : kSecAttrKeyClassPublic
    var error: Unmanaged<CFError>?
    let attributes: [String: Any] = [
        kSecAttrKeyType as String: keyType,
        kSecAttrKeyClass as String: keyClass,
        kSecAttrIsPermanent as String: false,
    ]
    guard let secKey = SecKeyCreateWithData(data as CFData, attributes as CFDictionary, &error) else {
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
