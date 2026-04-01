@preconcurrency import JavaScriptCore

/// `Bun.file()` and `Bun.write()` implementation.
enum BunFile {
    static func install(in context: JSContext) throws {
        try JavaScriptResource.evaluate(.bunAPI(.file), in: context)
    }
}
