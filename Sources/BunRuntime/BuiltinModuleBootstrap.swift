@preconcurrency import JavaScriptCore

/// Installs the built-in Node and Bun module surface before `require()` is exposed.
struct BuiltinModuleBootstrap: JavaScriptModuleInstalling, Sendable {
    private let fileSystemAsyncBridge: FileSystemAsyncBridge?
    private let builtinCommandBridge: BuiltinCommandBridge?
    private let zlibAsyncBridge: ZlibAsyncBridge?
    private let environment: [String: String]

    init(
        fileSystemAsyncBridge: FileSystemAsyncBridge? = nil,
        builtinCommandBridge: BuiltinCommandBridge? = nil,
        zlibAsyncBridge: ZlibAsyncBridge? = nil,
        environment: [String: String] = [:]
    ) {
        self.fileSystemAsyncBridge = fileSystemAsyncBridge
        self.builtinCommandBridge = builtinCommandBridge
        self.zlibAsyncBridge = zlibAsyncBridge
        self.environment = environment
    }

    func install(into context: JSContext) throws {
        try ModuleResolutionBridge().install(into: context)
        try JavaScriptModuleInstaller.installAll(
            .nodeCompat(.events),
            .nodeCompat(.stringDecoder),
            .nodeCompat(.querystring),
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
        try NodeStubs(
            builtinCommandBridge: builtinCommandBridge,
            zlibAsyncBridge: zlibAsyncBridge
        ).install(into: context)
        try JavaScriptModuleInstaller.installAll(.bunAPI(.shims), into: context)
        try BunEnvironmentInstaller(environment: environment).install(into: context)
        try JavaScriptModuleInstaller.installAll(.bunAPI(.file), .bunAPI(.spawn), into: context)
    }
}
