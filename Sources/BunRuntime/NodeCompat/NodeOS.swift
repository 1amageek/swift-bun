@preconcurrency import JavaScriptCore
import Foundation
#if canImport(Darwin)
import Darwin
#endif

/// `node:os` implementation bridging to `ProcessInfo`.
struct NodeOS: JavaScriptModuleInstalling, Sendable {
    let environment: [String: String]

    init(environment: [String: String] = [:]) {
        self.environment = environment
    }

    func install(into context: JSContext) throws {
        let info = ProcessInfo.processInfo
        let runtimeEnvironment = RuntimeEnvironment(overrides: environment)
        let homeDirectory = runtimeEnvironment.homeDirectory
        let temporaryDirectory = runtimeEnvironment.temporaryDirectory
        let username = runtimeEnvironment["USER"] ?? runtimeEnvironment["LOGNAME"] ?? "mobile"
        let shell = runtimeEnvironment["SHELL"] ?? "/bin/zsh"
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

        try JavaScriptConfigurationInstaller().install([
            "release": releaseString,
            "version": releaseString,
            "username": username,
            "uid": Int(uid),
            "gid": Int(gid),
            "shell": shell,
        ], as: "os", into: context)
        try JavaScriptModuleInstaller(script: .nodeCompat(.os)).install(into: context)
    }
}
