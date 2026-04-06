@preconcurrency import JavaScriptCore
import Foundation
#if canImport(CryptoKit)
import CryptoKit
#endif

/// `node:crypto` implementation bridging to `CryptoKit`.
struct NodeCrypto: JavaScriptModuleInstalling, Sendable {
    func install(into context: JSContext) throws {
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

        // SHA-256 hash (accepts Uint8Array as [UInt8])
        let sha1Block: @convention(block) ([UInt8]) -> String = { bytes in
            let hash = Insecure.SHA1.hash(data: Data(bytes))
            return hash.map { String(format: "%02x", $0) }.joined()
        }
        context.setObject(sha1Block, forKeyedSubscript: "__cryptoSHA1" as NSString)

        // SHA-256 hash (accepts Uint8Array as [UInt8])
        let sha256Block: @convention(block) ([UInt8]) -> String = { bytes in
            let hash = SHA256.hash(data: Data(bytes))
            return hash.map { String(format: "%02x", $0) }.joined()
        }
        context.setObject(sha256Block, forKeyedSubscript: "__cryptoSHA256" as NSString)

        let sha384Block: @convention(block) ([UInt8]) -> String = { bytes in
            let hash = SHA384.hash(data: Data(bytes))
            return hash.map { String(format: "%02x", $0) }.joined()
        }
        context.setObject(sha384Block, forKeyedSubscript: "__cryptoSHA384" as NSString)

        // SHA-512 hash (accepts Uint8Array as [UInt8])
        let sha512Block: @convention(block) ([UInt8]) -> String = { bytes in
            let hash = SHA512.hash(data: Data(bytes))
            return hash.map { String(format: "%02x", $0) }.joined()
        }
        context.setObject(sha512Block, forKeyedSubscript: "__cryptoSHA512" as NSString)

        // HMAC (accepts binary key and data as [UInt8])
        let hmacBlock: @convention(block) (String, [UInt8], [UInt8]) -> String = { algorithm, keyBytes, dataBytes in
            let keyData = SymmetricKey(data: Data(keyBytes))
            let messageData = Data(dataBytes)

            switch algorithm.lowercased() {
            case "sha1":
                let mac = HMAC<Insecure.SHA1>.authenticationCode(for: messageData, using: keyData)
                return Data(mac).map { String(format: "%02x", $0) }.joined()
            case "sha256":
                let mac = HMAC<SHA256>.authenticationCode(for: messageData, using: keyData)
                return Data(mac).map { String(format: "%02x", $0) }.joined()
            case "sha384":
                let mac = HMAC<SHA384>.authenticationCode(for: messageData, using: keyData)
                return Data(mac).map { String(format: "%02x", $0) }.joined()
            case "sha512":
                let mac = HMAC<SHA512>.authenticationCode(for: messageData, using: keyData)
                return Data(mac).map { String(format: "%02x", $0) }.joined()
            default:
                return "ERR:Unsupported algorithm: \(algorithm)"
            }
        }
        context.setObject(hmacBlock, forKeyedSubscript: "__cryptoHMAC" as NSString)

        WebCryptoBridge().install(into: context)

        try JavaScriptModuleInstaller(script: .nodeCompat(.crypto)).install(into: context)
    }
}
