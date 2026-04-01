@preconcurrency import JavaScriptCore
import Foundation

/// Resolves `require("node:*")` calls by returning polyfill module objects.
struct ESMResolver {
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
        try installResourceModules(
            in: context,
            .nodeCompat(.path),
            .nodeCompat(.buffer),
            .nodeCompat(.url),
            .nodeCompat(.util)
        )
        try NodeOS(environment: environment).install(into: context)
        try NodeFS(asyncBridge: fileSystemAsyncBridge).install(into: context)
        try NodeCrypto().install(into: context)
        try installResourceModules(
            in: context,
            .nodeCompat(.http),
            .nodeCompat(.stream),
            .nodeCompat(.timers)
        )
        try NodeStubs().install(into: context)
        try installResourceModules(in: context, .bunAPI(.shims))
        BunEnvironmentInstaller(environment: environment).install(into: context)
        try installResourceModules(in: context, .bunAPI(.file), .bunAPI(.spawn))
    }

    // MARK: - Private

    private func installGlobals(
        in context: JSContext,
        environment: [String: String],
        cwd: String?
    ) throws {
        try JavaScriptResource.evaluate(.bootstrap(.globalAliases), in: context)
        try JavaScriptResource.evaluate(.bootstrap(.performance), in: context)
        try JavaScriptResource.evaluate(.bootstrap(.url), in: context)

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
        let processConfig = try Self.makeConfigJSON([
            "platform": platformName,
            "arch": archName,
            "pid": Int(processID),
            "ppid": Int(parentPID),
            "cwd": cwd ?? "/",
            "uid": Int(uid),
            "gid": Int(gid),
            "euid": Int(euid),
            "egid": Int(egid),
        ])
        context.evaluateScript("""
        globalThis.__swiftBunConfig = globalThis.__swiftBunConfig || {};
        globalThis.__swiftBunConfig.process = \(processConfig);
        """)
        try JavaScriptResource.evaluate(.bootstrap(.process), in: context)
        try JavaScriptResource.evaluate(.bootstrap(.textCodec), in: context)
        try JavaScriptResource.evaluate(.bootstrap(.base64), in: context)
        try JavaScriptResource.evaluate(.bootstrap(.domException), in: context)
        try JavaScriptResource.evaluate(.bootstrap(.abortController), in: context)
    }

    /// Install the `require()` function. Must be called after all modules are registered.
    func installRequire(into context: JSContext) throws {
        try JavaScriptResource.evaluate(.bootstrap(.require), in: context)
    }

    private func installResourceModules(
        in context: JSContext,
        _ scripts: JavaScriptResource.Script...
    ) throws {
        for script in scripts {
            try JavaScriptModuleInstaller(script: script).install(into: context)
        }
    }

    private static func makeConfigJSON(_ value: [String: Any]) throws -> String {
        let data = try JSONSerialization.data(withJSONObject: value, options: [.sortedKeys])
        guard let json = String(data: data, encoding: .utf8) else {
            throw BunRuntimeError.javaScriptException("Failed to encode ESMResolver config as UTF-8")
        }
        return json
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
