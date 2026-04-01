@preconcurrency import JavaScriptCore

/// Bun global API shims: `Bun.version`, `Bun.nanoseconds()`, `Bun.sleepSync()`, etc.
enum BunShims: JavaScriptResourceBackedInstaller {
    static let script: JavaScriptResource.Script = .bunAPI(.shims)
}
