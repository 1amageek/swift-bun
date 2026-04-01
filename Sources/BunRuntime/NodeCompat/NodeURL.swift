@preconcurrency import JavaScriptCore

/// Pure JavaScript implementation of `node:url`.
enum NodeURL: JavaScriptResourceBackedInstaller {
    static let script: JavaScriptResource.Script = .nodeCompat(.url)
}
