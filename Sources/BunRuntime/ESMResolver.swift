@preconcurrency import JavaScriptCore
import Foundation

/// Resolves `require("node:*")` calls by returning polyfill module objects.
enum ESMResolver {
    /// Install the `require()` function and all built-in modules into the given context.
    static func install(
        in context: JSContext,
        fileSystemAsyncBridge: FileSystemAsyncBridge? = nil,
        environment: [String: String] = [:],
        cwd: String? = nil
    ) throws {
        try installModules(
            in: context,
            fileSystemAsyncBridge: fileSystemAsyncBridge,
            environment: environment,
            cwd: cwd
        )
        try installRequire(in: context)
    }

    /// Install all module polyfills without `require()`.
    ///
    /// `BunProcess` calls this, then installs its NIO-backed timer/fetch bridges
    /// (which override the default ones), then calls `installRequire()` separately.
    static func installModules(
        in context: JSContext,
        fileSystemAsyncBridge: FileSystemAsyncBridge? = nil,
        environment: [String: String] = [:],
        cwd: String? = nil
    ) throws {
        try installGlobals(in: context, environment: environment, cwd: cwd)
        try installPureJavaScriptModules(
            in: context,
            NodePath.self,
            NodeBuffer.self,
            NodeURL.self,
            NodeUtil.self
        )
        try NodeOS.install(in: context, environment: environment)
        try NodeFS.install(in: context, asyncBridge: fileSystemAsyncBridge)
        try NodeCrypto.install(in: context)
        try installPureJavaScriptModules(
            in: context,
            NodeHTTP.self,
            NodeStream.self,
            NodeTimers.self
        )
        try NodeStubs.install(in: context)
        try installPureJavaScriptModules(in: context, BunShims.self)
        BunEnv.install(in: context, environment: environment)
        try installPureJavaScriptModules(in: context, BunFile.self, BunSpawn.self)
    }

    // MARK: - Private

    private static func installGlobals(
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

        let platformName = runtimePlatform()
        let archName = runtimeArch()
        let processID = ProcessInfo.processInfo.processIdentifier
        let parentPID: Int32 = getppid()
        let uid = getuid()
        let gid = getgid()
        let euid = geteuid()
        let egid = getegid()
        let processConfig = try makeConfigJSON([
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
    static func installRequire(in context: JSContext) throws {
        try JavaScriptResource.evaluate(.bootstrap(.require), in: context)
    }

    private static func installPureJavaScriptModules(
        in context: JSContext,
        _ installers: any JavaScriptResourceBackedInstaller.Type...
    ) throws {
        for installer in installers {
            try installer.install(in: context)
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
