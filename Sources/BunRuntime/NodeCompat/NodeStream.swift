@preconcurrency import JavaScriptCore

/// `node:stream` module wiring backed by Layer 0's `readable-stream`.
enum NodeStream {
    static func install(in context: JSContext) throws {
        try JavaScriptResource.evaluate(.nodeCompat(.stream), in: context)
    }
}
