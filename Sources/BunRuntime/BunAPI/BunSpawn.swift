@preconcurrency import JavaScriptCore

/// `Bun.spawn()` and `Bun.spawnSync()` stubs.
///
/// Process spawning is not available on iOS. This provides a delegate mechanism
/// for specific commands that the host application can handle via Swift bridges.
enum BunSpawn {
    static func install(in context: JSContext) throws {
        try JavaScriptResource.evaluate(.bunAPI(.spawn), in: context)
    }
}
