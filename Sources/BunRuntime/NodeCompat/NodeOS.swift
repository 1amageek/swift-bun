@preconcurrency import JavaScriptCore
import Foundation
#if canImport(Darwin)
import Darwin
#endif

/// `node:os` implementation bridging to `ProcessInfo`.
struct NodeOS: JavaScriptModuleInstalling {
    let environment: [String: String]

    init(environment: [String: String] = [:]) {
        self.environment = environment
    }

    func install(into context: JSContext) throws {
        let info = ProcessInfo.processInfo
        let mergedEnvironment = Self.mergedHostEnvironment(overrides: environment)
        let homeDirectory = Self.configuredHomeDirectory(from: mergedEnvironment)
        let temporaryDirectory = Self.configuredTemporaryDirectory(from: mergedEnvironment)
        let username = mergedEnvironment["USER"] ?? mergedEnvironment["LOGNAME"] ?? "mobile"
        let shell = mergedEnvironment["SHELL"] ?? "/bin/zsh"
        let osVersion = info.operatingSystemVersion
        let releaseString = "\(osVersion.majorVersion).\(osVersion.minorVersion).\(osVersion.patchVersion)"
        let uid = getuid()
        let gid = getgid()

        let hostnameBlock: @convention(block) () -> String = {
            info.hostName
        }
        context.setObject(hostnameBlock, forKeyedSubscript: "__osHostname" as NSString)

        let homeDirBlock: @convention(block) () -> String = {
            homeDirectory
        }
        context.setObject(homeDirBlock, forKeyedSubscript: "__osHomedir" as NSString)

        let tmpDirBlock: @convention(block) () -> String = {
            temporaryDirectory
        }
        context.setObject(tmpDirBlock, forKeyedSubscript: "__osTmpdir" as NSString)

        let totalMemBlock: @convention(block) () -> Double = {
            Double(info.physicalMemory)
        }
        context.setObject(totalMemBlock, forKeyedSubscript: "__osTotalmem" as NSString)

        let cpuCountBlock: @convention(block) () -> Int = {
            info.processorCount
        }
        context.setObject(cpuCountBlock, forKeyedSubscript: "__osCpuCount" as NSString)

        let configJSON = try Self.makeConfigJSON([
            "release": releaseString,
            "username": username,
            "uid": Int(uid),
            "gid": Int(gid),
            "shell": shell,
        ])
        context.evaluateScript("""
        globalThis.__swiftBunConfig = globalThis.__swiftBunConfig || {};
        globalThis.__swiftBunConfig.os = \(configJSON);
        """)
        try JavaScriptModuleInstaller(script: .nodeCompat(.os)).install(into: context)
    }

    private static func mergedHostEnvironment(overrides: [String: String]) -> [String: String] {
        var merged = ProcessInfo.processInfo.environment
        for (key, value) in overrides {
            merged[key] = value
        }
        return merged
    }

    private static func configuredHomeDirectory(from environment: [String: String]) -> String {
        if let configuredHome = environment["HOME"], !configuredHome.isEmpty {
            return configuredHome
        }
        return NSHomeDirectory()
    }

    private static func configuredTemporaryDirectory(from environment: [String: String]) -> String {
        if let configuredTmp = environment["TMPDIR"], !configuredTmp.isEmpty {
            return configuredTmp
        }
        return NSTemporaryDirectory()
    }

    private static func makeConfigJSON(_ value: [String: Any]) throws -> String {
        let data = try JSONSerialization.data(withJSONObject: value, options: [.sortedKeys])
        guard let json = String(data: data, encoding: .utf8) else {
            throw BunRuntimeError.javaScriptException("Failed to encode NodeOS config as UTF-8")
        }
        return json
    }
}
