@preconcurrency import JavaScriptCore

/// Pure JavaScript implementation of `node:buffer`.
enum NodeBuffer: JavaScriptResourceBackedInstaller {
    static let script: JavaScriptResource.Script = .nodeCompat(.buffer)
}
