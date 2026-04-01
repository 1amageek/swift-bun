@preconcurrency import JavaScriptCore

/// `Bun.spawn()` and `Bun.spawnSync()` stubs.
///
/// Process spawning is not available on iOS. This provides a delegate mechanism
/// for specific commands that the host application can handle via Swift bridges.
enum BunSpawn: JavaScriptResourceBackedInstaller {
    static let script: JavaScriptResource.Script = .bunAPI(.spawn)
}
