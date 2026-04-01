@preconcurrency import JavaScriptCore

/// Pure JavaScript implementation of `node:util`.
enum NodeUtil: JavaScriptResourceBackedInstaller {
    static let script: JavaScriptResource.Script = .nodeCompat(.util)
}
