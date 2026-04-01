@preconcurrency import JavaScriptCore

/// `node:stream` module wiring backed by Layer 0's `readable-stream`.
enum NodeStream: JavaScriptResourceBackedInstaller {
    static let script: JavaScriptResource.Script = .nodeCompat(.stream)
}
