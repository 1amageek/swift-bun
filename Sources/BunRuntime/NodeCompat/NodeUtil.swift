@preconcurrency import JavaScriptCore

/// Pure JavaScript implementation of `node:util`.
enum NodeUtil {
    static func install(in context: JSContext) throws {
        try JavaScriptResource.evaluate(.nodeCompat(.util), in: context)
    }
}
