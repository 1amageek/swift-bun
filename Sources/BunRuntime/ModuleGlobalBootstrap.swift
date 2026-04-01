@preconcurrency import JavaScriptCore
import Foundation

/// Installs runtime globals needed before built-in modules are registered.
struct ModuleGlobalBootstrap: JavaScriptModuleInstalling, Sendable {
    private let environment: [String: String]
    private let cwd: String?

    init(
        environment: [String: String] = [:],
        cwd: String? = nil
    ) {
        self.environment = environment
        self.cwd = cwd
    }

    func install(into context: JSContext) throws {
        try JavaScriptModuleInstaller.installAll(
            .bootstrap(.globalAliases),
            .bootstrap(.performance),
            .bootstrap(.url),
            into: context
        )

        let logBlock: @convention(block) (String, String) -> Void = { level, message in
            print("[\(level)] \(message)")
        }
        context.setObject(logBlock, forKeyedSubscript: "__nativeLog" as NSString)
        try JavaScriptResource.evaluate(.bootstrap(.console), in: context)

        try JavaScriptConfigurationInstaller().install(processConfiguration(), as: "process", into: context)
        try JavaScriptModuleInstaller.installAll(
            .bootstrap(.process),
            .bootstrap(.textCodec),
            .bootstrap(.base64),
            .bootstrap(.domException),
            .bootstrap(.abortController),
            into: context
        )
    }

    private func processConfiguration() -> [String: Any] {
        let processID = ProcessInfo.processInfo.processIdentifier
        let parentPID: Int32 = getppid()
        let uid = getuid()
        let gid = getgid()
        let euid = geteuid()
        let egid = getegid()
        return [
            "platform": Self.runtimePlatform(),
            "arch": Self.runtimeArch(),
            "pid": Int(processID),
            "ppid": Int(parentPID),
            "cwd": cwd ?? "/",
            "uid": Int(uid),
            "gid": Int(gid),
            "euid": Int(euid),
            "egid": Int(egid),
        ]
    }

    private static func runtimePlatform() -> String {
        #if os(macOS) || os(iOS) || os(tvOS) || os(watchOS) || os(visionOS)
        return "darwin"
        #elseif os(Linux)
        return "linux"
        #elseif os(Windows)
        return "win32"
        #else
        return "unknown"
        #endif
    }

    private static func runtimeArch() -> String {
        #if arch(arm64)
        return "arm64"
        #elseif arch(x86_64)
        return "x64"
        #elseif arch(i386)
        return "ia32"
        #elseif arch(arm)
        return "arm"
        #else
        return "unknown"
        #endif
    }
}
