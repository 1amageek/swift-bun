@preconcurrency import JavaScriptCore
import Foundation

/// `node:http` and `node:https` JS shims composed from Layer 0 fetch + streams.
enum NodeHTTP: JavaScriptResourceBackedInstaller {
    static let script: JavaScriptResource.Script = .nodeCompat(.http)
}
