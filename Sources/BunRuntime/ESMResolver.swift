@preconcurrency import JavaScriptCore
import Foundation

/// Resolves `require("node:*")` calls by returning polyfill module objects.
struct ESMResolver: Sendable {
    let fileSystemAsyncBridge: FileSystemAsyncBridge?
    let environment: [String: String]
    let cwd: String?

    init(
        fileSystemAsyncBridge: FileSystemAsyncBridge? = nil,
        environment: [String: String] = [:],
        cwd: String? = nil
    ) {
        self.fileSystemAsyncBridge = fileSystemAsyncBridge
        self.environment = environment
        self.cwd = cwd
    }

    /// Install the `require()` function and all built-in modules into the given context.
    func install(into context: JSContext) throws {
        try installModules(into: context)
        try installRequire(into: context)
    }

    /// Install all module polyfills without `require()`.
    ///
    /// `BunProcess` calls this, then installs its NIO-backed timer/fetch bridges
    /// (which override the default ones), then calls `installRequire()` separately.
    func installModules(into context: JSContext) throws {
        try installGlobals(in: context, environment: environment, cwd: cwd)
        try JavaScriptModuleInstaller.installAll(
            .nodeCompat(.path),
            .nodeCompat(.buffer),
            .nodeCompat(.url),
            .nodeCompat(.util),
            into: context
        )
        try NodeOS(environment: environment).install(into: context)
        try NodeFS(asyncBridge: fileSystemAsyncBridge).install(into: context)
        try NodeCrypto().install(into: context)
        try JavaScriptModuleInstaller.installAll(
            .nodeCompat(.http),
            .nodeCompat(.stream),
            .nodeCompat(.timers),
            into: context
        )
        try NodeStubs().install(into: context)
        try JavaScriptModuleInstaller.installAll(.bunAPI(.shims), into: context)
        try BunEnvironmentInstaller(environment: environment).install(into: context)
        try JavaScriptModuleInstaller.installAll(.bunAPI(.file), .bunAPI(.spawn), into: context)
    }

    // MARK: - Private

    private func installGlobals(
        in context: JSContext,
        environment: [String: String],
        cwd: String?
    ) throws {
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

        let platformName = Self.runtimePlatform()
        let archName = Self.runtimeArch()
        let processID = ProcessInfo.processInfo.processIdentifier
        let parentPID: Int32 = getppid()
        let uid = getuid()
        let gid = getgid()
        let euid = geteuid()
        let egid = getegid()
        let processConfig: [String: Any] = [
            "platform": platformName,
            "arch": archName,
            "pid": Int(processID),
            "ppid": Int(parentPID),
            "cwd": cwd ?? "/",
            "uid": Int(uid),
            "gid": Int(gid),
            "euid": Int(euid),
            "egid": Int(egid),
        ]
        try JavaScriptConfigurationInstaller().install(processConfig, as: "process", into: context)
        try JavaScriptModuleInstaller.installAll(
            .bootstrap(.process),
            .bootstrap(.textCodec),
            .bootstrap(.base64),
            .bootstrap(.domException),
            .bootstrap(.abortController),
            into: context
        )
    }

    /// Install the `require()` function. Must be called after all modules are registered.
    func installRequire(into context: JSContext) throws {
        try JavaScriptResource.evaluate(.bootstrap(.require), in: context)
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
