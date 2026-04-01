@preconcurrency import JavaScriptCore
import Compression
import Darwin
import Foundation

/// Stub modules for Node.js modules that are not applicable on iOS.
///
/// These provide minimal interfaces to prevent import errors
/// while clearly indicating that the functionality is not available.
struct NodeStubs: JavaScriptModuleInstalling, Sendable {
    func install(into context: JSContext) throws {
        let childProcessRunSyncBlock: @convention(block) (String, String, String) -> [String: Any] = { file, argsJSON, optionsJSON in
            // Intercept `security` commands and handle via native Keychain APIs.
            // This works on both macOS and iOS without subprocess spawning.
            do {
                let args = try Self.parseStringArray(json: argsJSON)
                if file == "security" || file.hasSuffix("/security") {
                    if let result = NativeKeychainBridge.handleCommand(args: args) {
                        return result
                    }
                }
                if (file == "/bin/sh" || file == "/bin/bash" || file.hasSuffix("/sh") || file.hasSuffix("/bash")),
                   args.count >= 2, args[0] == "-c" || args[0] == "-lc" {
                    if let result = NativeKeychainBridge.handleShellCommand(args[1]) {
                        return result
                    }
                }
            } catch {
                #if !os(macOS)
                return ["error": "Invalid child_process arguments: \(error)"]
                #endif
                // Fall through to process-based execution
            }

            #if os(macOS)
            do {
                let args = try Self.parseStringArray(json: argsJSON)
                let options = try Self.parseJSONObject(json: optionsJSON)

                let process = Process()
                process.executableURL = try Self.resolveExecutableURL(for: file)
                process.arguments = args

                if let cwd = options["cwd"] as? String, !cwd.isEmpty {
                    process.currentDirectoryURL = URL(fileURLWithPath: cwd)
                }

                var env = RuntimeEnvironment().values
                if let extraEnv = options["env"] as? [String: Any] {
                    for (key, value) in extraEnv {
                        env[key] = "\(value)"
                    }
                }
                process.environment = env

                let stdoutPipe = Pipe()
                let stderrPipe = Pipe()
                process.standardOutput = stdoutPipe
                process.standardError = stderrPipe

                if let input = options["input"] as? String {
                    let stdinPipe = Pipe()
                    process.standardInput = stdinPipe
                    try process.run()
                    if let data = input.data(using: .utf8) {
                        stdinPipe.fileHandleForWriting.write(data)
                    }
                    try stdinPipe.fileHandleForWriting.close()
                } else {
                    try process.run()
                }

                process.waitUntilExit()

                let stdoutData = stdoutPipe.fileHandleForReading.readDataToEndOfFile()
                let stderrData = stderrPipe.fileHandleForReading.readDataToEndOfFile()

                return [
                    "status": process.terminationStatus,
                    "signal": NSNull(),
                    "stdout": String(data: stdoutData, encoding: .utf8) ?? "",
                    "stderr": String(data: stderrData, encoding: .utf8) ?? "",
                ]
            } catch {
                return ["error": "\(error)"]
            }
            #else
            return ["error": "node:child_process is not supported in swift-bun on this platform"]
            #endif
        }
        context.setObject(childProcessRunSyncBlock, forKeyedSubscript: "__cpRunSync" as NSString)

        let zlibDeflateSyncBlock: @convention(block) ([UInt8]) -> [String: Any] = { bytes in
            do {
                return ["bytes": try Self.deflateZlib(Data(bytes)).map(Int.init)]
            } catch {
                return ["error": "\(error)"]
            }
        }
        context.setObject(zlibDeflateSyncBlock, forKeyedSubscript: "__zlibDeflateSync" as NSString)

        let zlibInflateSyncBlock: @convention(block) ([UInt8]) -> [String: Any] = { bytes in
            do {
                return ["bytes": try Self.inflateZlib(Data(bytes)).map(Int.init)]
            } catch {
                return ["error": "\(error)"]
            }
        }
        context.setObject(zlibInflateSyncBlock, forKeyedSubscript: "__zlibInflateSync" as NSString)

        let dnsLookupBlock: @convention(block) (String, Int32) -> [String: Any] = { host, family in
            do {
                let normalizedFamily = family == 0 ? nil : Int(family)
                let result = try Self.lookupAddress(for: host, family: normalizedFamily)
                return [
                    "address": result.address,
                    "family": result.family,
                ]
            } catch {
                return ["error": "\(error)"]
            }
        }
        context.setObject(dnsLookupBlock, forKeyedSubscript: "__dnsLookup" as NSString)

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

    private static func parseStringArray(json: String) throws -> [String] {
        guard let data = json.data(using: .utf8), !json.isEmpty else { return [] }
        let object = try JSONSerialization.jsonObject(with: data)
        guard let array = object as? [Any] else { return [] }
        return array.map { "\($0)" }
    }

    private static func parseJSONObject(json: String) throws -> [String: Any] {
        guard let data = json.data(using: .utf8), !json.isEmpty else { return [:] }
        let object = try JSONSerialization.jsonObject(with: data)
        return object as? [String: Any] ?? [:]
    }

    private static func resolveExecutableURL(for executable: String) throws -> URL {
        if executable.contains("/") {
            let url = URL(fileURLWithPath: executable)
            try ensureExecutableIfNeeded(at: url)
            return url
        }

        let environment = RuntimeEnvironment().values
        let pathValue = environment["PATH"] ?? "/usr/bin:/bin:/usr/sbin:/sbin:/opt/homebrew/bin"
        for directory in pathValue.split(separator: ":") {
            let candidate = String(directory) + "/" + executable
            if FileManager.default.isExecutableFile(atPath: candidate) {
                return URL(fileURLWithPath: candidate)
            }
        }

        throw NSError(domain: NSCocoaErrorDomain, code: NSFileNoSuchFileError, userInfo: [
            NSFilePathErrorKey: executable,
        ])
    }

    private static func ensureExecutableIfNeeded(at url: URL) throws {
        let path = url.path
        guard FileManager.default.fileExists(atPath: path) else { return }
        guard !FileManager.default.isExecutableFile(atPath: path) else { return }

        let attributes = try FileManager.default.attributesOfItem(atPath: path)
        let permissions = (attributes[.posixPermissions] as? NSNumber)?.uint16Value ?? 0o644
        let executablePermissions = permissions | 0o111
        try FileManager.default.setAttributes([.posixPermissions: NSNumber(value: executablePermissions)], ofItemAtPath: path)
    }

    private static func deflateZlib(_ data: Data) throws -> [UInt8] {
        if data.isEmpty {
            return [0x78, 0x9c, 0x03, 0x00, 0x00, 0x00, 0x00, 0x01]
        }

        var destinationCapacity = max(64, data.count + 64)
        while destinationCapacity <= max(1_048_576, data.count * 16 + 64) {
            let destination = UnsafeMutablePointer<UInt8>.allocate(capacity: destinationCapacity)
            defer { destination.deallocate() }

            let compressedSize = data.withUnsafeBytes { sourceBytes in
                guard let baseAddress = sourceBytes.bindMemory(to: UInt8.self).baseAddress else {
                    return 0
                }
                return compression_encode_buffer(
                    destination,
                    destinationCapacity,
                    baseAddress,
                    data.count,
                    nil,
                    COMPRESSION_ZLIB
                )
            }

            if compressedSize > 0 {
                let deflated = Array(UnsafeBufferPointer(start: destination, count: compressedSize))
                let checksum = adler32(data)
                return [0x78, 0x9c]
                    + deflated
                    + [
                        UInt8((checksum >> 24) & 0xff),
                        UInt8((checksum >> 16) & 0xff),
                        UInt8((checksum >> 8) & 0xff),
                        UInt8(checksum & 0xff),
                    ]
            }

            destinationCapacity *= 2
        }

        throw NSError(domain: NSCocoaErrorDomain, code: NSCompressionFailedError)
    }

    private static func inflateZlib(_ data: Data) throws -> [UInt8] {
        if data.isEmpty {
            return []
        }

        let payload: Data
        if data.count >= 6, data[0] == 0x78 {
            payload = data.dropFirst(2).dropLast(4)
        } else {
            payload = data
        }

        var destinationCapacity = max(64, payload.count * 4)
        while destinationCapacity <= max(1_048_576, payload.count * 64 + 64) {
            let destination = UnsafeMutablePointer<UInt8>.allocate(capacity: destinationCapacity)
            defer { destination.deallocate() }

            let decodedSize = payload.withUnsafeBytes { sourceBytes in
                guard let baseAddress = sourceBytes.bindMemory(to: UInt8.self).baseAddress else {
                    return 0
                }
                return compression_decode_buffer(
                    destination,
                    destinationCapacity,
                    baseAddress,
                    payload.count,
                    nil,
                    COMPRESSION_ZLIB
                )
            }

            if decodedSize > 0 {
                return Array(UnsafeBufferPointer(start: destination, count: decodedSize))
            }

            destinationCapacity *= 2
        }

        throw NSError(domain: NSCocoaErrorDomain, code: NSCompressionFailedError)
    }

    static func lookupAddress(for host: String, family: Int? = nil) throws -> (address: String, family: Int) {
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
                    return (
                        address: String(decoding: address, as: UTF8.self),
                        family: family == AF_INET ? 4 : 6
                    )
                }
            }
            current = info.pointee.ai_next
        }

        throw NSError(domain: NSPOSIXErrorDomain, code: Int(EAI_NONAME), userInfo: [
            NSLocalizedDescriptionKey: "No usable address found for \(host)",
        ])
    }

    private static func adler32(_ data: Data) -> UInt32 {
        var s1: UInt32 = 1
        var s2: UInt32 = 0
        for byte in data {
            s1 = (s1 + UInt32(byte)) % 65521
            s2 = (s2 + s1) % 65521
        }
        return (s2 << 16) | s1
    }
}
