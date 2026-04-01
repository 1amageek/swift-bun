@preconcurrency import JavaScriptCore

/// Pure JavaScript implementation of `node:buffer`.
enum NodeBuffer {
    static func install(in context: JSContext) throws {
        try JavaScriptResource.evaluate(.nodeCompat(.buffer), in: context)
    }
}
