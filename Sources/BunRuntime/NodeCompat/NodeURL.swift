@preconcurrency import JavaScriptCore

/// Pure JavaScript implementation of `node:url`.
enum NodeURL {
    static func install(in context: JSContext) throws {
        try JavaScriptResource.evaluate(.nodeCompat(.url), in: context)
    }
}
