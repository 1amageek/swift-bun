@preconcurrency import JavaScriptCore
import Foundation

/// Stub modules for Node.js modules that are not applicable on iOS.
///
/// These provide minimal interfaces to prevent import errors
/// while clearly indicating that the functionality is not available.
struct NodeStubs: JavaScriptModuleInstalling, Sendable {
    func install(into context: JSContext) throws {
        let childProcessRunSyncBlock: @convention(block) (String, String, String) -> [String: Any] = { file, argsJSON, optionsJSON in
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
}
