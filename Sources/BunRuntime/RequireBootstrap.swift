@preconcurrency import JavaScriptCore

/// Installs the CommonJS `require()` entrypoint after globals and built-in modules exist.
struct RequireBootstrap: JavaScriptModuleInstalling, Sendable {
    func install(into context: JSContext) throws {
        try JavaScriptResource.evaluate(.bootstrap(.require), in: context)
    }
}
