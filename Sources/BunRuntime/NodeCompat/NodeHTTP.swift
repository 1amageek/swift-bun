@preconcurrency import JavaScriptCore
import Foundation

/// `node:http` and `node:https` JS shims composed from Layer 0 fetch + streams.
enum NodeHTTP {
    static func install(in context: JSContext) throws {
        try JavaScriptResource.evaluate(.nodeCompat(.http), in: context)
    }
}
