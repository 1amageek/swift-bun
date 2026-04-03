@preconcurrency import JavaScriptCore

/// Bootstraps built-in Node/Bun modules and installs the CommonJS `require()` entrypoint.
struct ModuleBootstrap: Sendable {
    private let globalBootstrap: ModuleGlobalBootstrap
    private let builtinModuleBootstrap: BuiltinModuleBootstrap
    private let requireBootstrap: RequireBootstrap

    init(
        fileSystemAsyncBridge: FileSystemAsyncBridge? = nil,
        builtinCommandBridge: BuiltinCommandBridge? = nil,
        zlibAsyncBridge: ZlibAsyncBridge? = nil,
        environment: [String: String] = [:],
        cwd: String? = nil
    ) {
        self.globalBootstrap = ModuleGlobalBootstrap(environment: environment, cwd: cwd)
        self.builtinModuleBootstrap = BuiltinModuleBootstrap(
            fileSystemAsyncBridge: fileSystemAsyncBridge,
            builtinCommandBridge: builtinCommandBridge,
            zlibAsyncBridge: zlibAsyncBridge,
            environment: environment
        )
        self.requireBootstrap = RequireBootstrap()
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
        try globalBootstrap.install(into: context)
        try builtinModuleBootstrap.install(into: context)
    }

    /// Install the `require()` function. Must be called after all modules are registered.
    func installRequire(into context: JSContext) throws {
        try requireBootstrap.install(into: context)
    }
}
