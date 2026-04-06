@preconcurrency import JavaScriptCore
import Darwin
import Foundation

/// Stub modules for Node.js modules that are not applicable on iOS.
///
/// These provide minimal interfaces to prevent import errors
/// while clearly indicating that the functionality is not available.
struct NodeStubs: JavaScriptModuleInstalling, Sendable {
    private let builtinCommandBridge: BuiltinCommandBridge?
    private let zlibAsyncBridge: ZlibAsyncBridge?

    init(
        builtinCommandBridge: BuiltinCommandBridge? = nil,
        zlibAsyncBridge: ZlibAsyncBridge? = nil
    ) {
        self.builtinCommandBridge = builtinCommandBridge
        self.zlibAsyncBridge = zlibAsyncBridge
    }

    func install(into context: JSContext) throws {
        let childProcessRunSyncBlock: @convention(block) (String, String, String) -> [String: Any] = { file, argsJSON, optionsJSON in
            if let result = BuiltinCommandBridge.runSync(file: file, argsJSON: argsJSON, optionsJSON: optionsJSON) {
                return result
            }
            return ["error": "node:child_process is not supported in swift-bun. Use a native bridge instead."]
        }
        context.setObject(childProcessRunSyncBlock, forKeyedSubscript: "__cpRunSync" as NSString)

        if let builtinCommandBridge {
            let childProcessStartBuiltinBlock: @convention(block) (String, String, String, Int32) -> Bool = { file, argsJSON, optionsJSON, requestID in
                builtinCommandBridge.start(
                    file: file,
                    argsJSON: argsJSON,
                    optionsJSON: optionsJSON,
                    requestID: requestID
                )
            }
            context.setObject(childProcessStartBuiltinBlock, forKeyedSubscript: "__cpBuiltinStart" as NSString)
        }

        let zlibCompressSyncBlock: @convention(block) (String, String) -> [String: Any] = { formatName, base64 in
            do {
                guard let format = ZlibCodec.Format(name: formatName) else {
                    return ["error": "Unsupported zlib format: \(formatName)"]
                }
                let input = try ZlibCodec.decodeBase64(base64)
                return ["base64": try ZlibCodec.compress(input, format: format).base64EncodedString()]
            } catch {
                return ["error": "\(error)"]
            }
        }
        context.setObject(zlibCompressSyncBlock, forKeyedSubscript: "__zlibCompressSync" as NSString)

        let zlibUncompressSyncBlock: @convention(block) (String, String) -> [String: Any] = { formatName, base64 in
            do {
                guard let format = ZlibCodec.Format(name: formatName) else {
                    return ["error": "Unsupported zlib format: \(formatName)"]
                }
                let input = try ZlibCodec.decodeBase64(base64)
                return ["base64": try ZlibCodec.decompress(input, format: format).base64EncodedString()]
            } catch {
                return ["error": "\(error)"]
            }
        }
        context.setObject(zlibUncompressSyncBlock, forKeyedSubscript: "__zlibUncompressSync" as NSString)

        if let zlibAsyncBridge {
            let zlibAsyncStartBlock: @convention(block) (String, String, String, Int32) -> Bool = { operationName, formatName, base64, token in
                zlibAsyncBridge.start(operationName: operationName, formatName: formatName, base64: base64, token: token)
            }
            context.setObject(zlibAsyncStartBlock, forKeyedSubscript: "__zlibAsyncStart" as NSString)
        }

        let dnsLookupBlock: @convention(block) (String, Int32) -> [String: Any] = { host, family in
            do {
                let normalizedFamily = family == 0 ? nil : Int(family)
                let results = try Self.lookupAddresses(for: host, family: normalizedFamily)
                guard let result = results.first else {
                    return ["error": "No usable address found for \(host)"]
                }
                return [
                    "address": result.address,
                    "family": result.family,
                    "addresses": results.map { ["address": $0.address, "family": $0.family] },
                ]
            } catch {
                return ["error": "\(error)"]
            }
        }
        context.setObject(dnsLookupBlock, forKeyedSubscript: "__dnsLookup" as NSString)

        let dnsResolveBlock: @convention(block) (String, String) -> [String: Any] = { host, recordType in
            do {
                let values = try Self.resolveRecords(for: host, type: recordType)
                return ["values": values]
            } catch {
                return ["error": "\(error)"]
            }
        }
        context.setObject(dnsResolveBlock, forKeyedSubscript: "__dnsResolve" as NSString)

        let dnsReverseBlock: @convention(block) (String) -> [String: Any] = { address in
            do {
                return ["hostnames": try Self.reverseLookup(address: address)]
            } catch {
                return ["error": "\(error)"]
            }
        }
        context.setObject(dnsReverseBlock, forKeyedSubscript: "__dnsReverse" as NSString)

        try JavaScriptModuleInstaller.installAll(
            .nodeCompat(.net),
            .nodeCompat(.tls),
            .nodeCompat(.zlib),
            .nodeCompat(.childProcess),
            .nodeCompat(.tty),
            .nodeCompat(.readline),
            .nodeCompat(.asyncHooks),
            .nodeCompat(.module),
            .nodeCompat(.assert),
            .nodeCompat(.workerThreads),
            .nodeCompat(.perfHooks),
            .nodeCompat(.http2),
            .nodeCompat(.inspector),
            .nodeCompat(.v8),
            .nodeCompat(.dns),
            .nodeCompat(.constants),
            .nodeCompat(.diagnosticsChannel),
            into: context
        )
    }

    static func lookupAddress(for host: String, family: Int? = nil) throws -> (address: String, family: Int) {
        let results = try lookupAddresses(for: host, family: family)
        guard let result = results.first else {
            throw NSError(domain: NSPOSIXErrorDomain, code: Int(EAI_NONAME), userInfo: [
                NSLocalizedDescriptionKey: "No usable address found for \(host)",
            ])
        }
        return result
    }

    static func lookupAddresses(for host: String, family: Int? = nil) throws -> [(address: String, family: Int)] {
        var hints = addrinfo(
            ai_flags: AI_ADDRCONFIG,
            ai_family: family == 4 ? AF_INET : (family == 6 ? AF_INET6 : AF_UNSPEC),
            ai_socktype: SOCK_STREAM,
            ai_protocol: IPPROTO_TCP,
            ai_addrlen: 0,
            ai_canonname: nil,
            ai_addr: nil,
            ai_next: nil
        )
        var resultPointer: UnsafeMutablePointer<addrinfo>?
        let errorCode = getaddrinfo(host, nil, &hints, &resultPointer)
        guard errorCode == 0, let resultPointer else {
            let message = String(cString: gai_strerror(errorCode))
            throw NSError(domain: NSPOSIXErrorDomain, code: Int(errorCode), userInfo: [
                NSLocalizedDescriptionKey: message,
            ])
        }
        defer { freeaddrinfo(resultPointer) }

        var results: [(address: String, family: Int)] = []
        var current: UnsafeMutablePointer<addrinfo>? = resultPointer
        while let info = current {
            let family = info.pointee.ai_family
            if family == AF_INET || family == AF_INET6 {
                var hostBuffer = [CChar](repeating: 0, count: Int(NI_MAXHOST))
                let nameInfoError = getnameinfo(
                    info.pointee.ai_addr,
                    socklen_t(info.pointee.ai_addrlen),
                    &hostBuffer,
                    socklen_t(hostBuffer.count),
                    nil,
                    0,
                    NI_NUMERICHOST
                )
                if nameInfoError == 0 {
                    let address = hostBuffer.prefix { $0 != 0 }.map { UInt8(bitPattern: $0) }
                    results.append((
                        address: String(decoding: address, as: UTF8.self),
                        family: family == AF_INET ? 4 : 6
                    ))
                }
            }
            current = info.pointee.ai_next
        }

        if !results.isEmpty {
            return results
        }

        throw NSError(domain: NSPOSIXErrorDomain, code: Int(EAI_NONAME), userInfo: [
            NSLocalizedDescriptionKey: "No usable address found for \(host)",
        ])
    }

    static func resolveRecords(for host: String, type: String) throws -> [String] {
        switch type.uppercased() {
        case "A":
            return try lookupAddresses(for: host, family: 4).map(\.address)
        case "AAAA":
            return try lookupAddresses(for: host, family: 6).map(\.address)
        default:
            throw NSError(domain: NSPOSIXErrorDomain, code: Int(EAI_NONAME), userInfo: [
                NSLocalizedDescriptionKey: "dns.resolve(\(type)) is not supported in swift-bun",
            ])
        }
    }

    static func reverseLookup(address: String) throws -> [String] {
        var storageIPv4 = sockaddr_in()
        var storageIPv6 = sockaddr_in6()
        let hostname: String

        if inet_pton(AF_INET, address, &storageIPv4.sin_addr) == 1 {
            storageIPv4.sin_len = UInt8(MemoryLayout<sockaddr_in>.size)
            storageIPv4.sin_family = sa_family_t(AF_INET)
            hostname = try withUnsafePointer(to: &storageIPv4) { pointer in
                try reverseLookupHost(
                    sockaddr: UnsafeRawPointer(pointer).assumingMemoryBound(to: sockaddr.self),
                    sockaddrLength: socklen_t(MemoryLayout<sockaddr_in>.size)
                )
            }
        } else if inet_pton(AF_INET6, address, &storageIPv6.sin6_addr) == 1 {
            storageIPv6.sin6_len = UInt8(MemoryLayout<sockaddr_in6>.size)
            storageIPv6.sin6_family = sa_family_t(AF_INET6)
            hostname = try withUnsafePointer(to: &storageIPv6) { pointer in
                try reverseLookupHost(
                    sockaddr: UnsafeRawPointer(pointer).assumingMemoryBound(to: sockaddr.self),
                    sockaddrLength: socklen_t(MemoryLayout<sockaddr_in6>.size)
                )
            }
        } else {
            throw NSError(domain: NSPOSIXErrorDomain, code: Int(EAI_NONAME), userInfo: [
                NSLocalizedDescriptionKey: "Invalid IP address: \(address)",
            ])
        }

        return [hostname]
    }

    private static func reverseLookupHost(
        sockaddr: UnsafePointer<sockaddr>,
        sockaddrLength: socklen_t
    ) throws -> String {
        var hostBuffer = [CChar](repeating: 0, count: Int(NI_MAXHOST))
        let status = getnameinfo(
            sockaddr,
            sockaddrLength,
            &hostBuffer,
            socklen_t(hostBuffer.count),
            nil,
            0,
            NI_NAMEREQD
        )
        guard status == 0 else {
            let message = String(cString: gai_strerror(status))
            throw NSError(domain: NSPOSIXErrorDomain, code: Int(status), userInfo: [
                NSLocalizedDescriptionKey: message,
            ])
        }

        let hostnameBytes = hostBuffer.prefix { $0 != 0 }.map { UInt8(bitPattern: $0) }
        return String(decoding: hostnameBytes, as: UTF8.self)
    }
}
