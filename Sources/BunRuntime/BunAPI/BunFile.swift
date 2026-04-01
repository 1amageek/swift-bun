@preconcurrency import JavaScriptCore

/// `Bun.file()` and `Bun.write()` implementation.
enum BunFile: JavaScriptResourceBackedInstaller {
    static let script: JavaScriptResource.Script = .bunAPI(.file)
}
