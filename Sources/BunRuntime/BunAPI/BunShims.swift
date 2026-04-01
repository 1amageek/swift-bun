@preconcurrency import JavaScriptCore

/// Bun global API shims: `Bun.version`, `Bun.nanoseconds()`, `Bun.sleepSync()`, etc.
enum BunShims {
    static func install(in context: JSContext) throws {
        try JavaScriptResource.evaluate(.bunAPI(.shims), in: context)
    }
}
