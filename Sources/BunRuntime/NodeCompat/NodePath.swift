@preconcurrency import JavaScriptCore

/// Pure JavaScript implementation of `node:path`.
enum NodePath {
    static func install(in context: JSContext) throws {
        try JavaScriptResource.evaluate(.nodeCompat(.path), in: context)
    }
}
