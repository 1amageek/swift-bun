@preconcurrency import JavaScriptCore

/// Pure JavaScript implementation of `node:path`.
enum NodePath: JavaScriptResourceBackedInstaller {
    static let script: JavaScriptResource.Script = .nodeCompat(.path)
}
