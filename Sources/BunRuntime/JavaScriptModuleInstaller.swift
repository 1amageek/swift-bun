@preconcurrency import JavaScriptCore

protocol JavaScriptModuleInstalling {
    func install(into context: JSContext) throws
}

/// Installs a bundled JavaScript resource into a JSContext.
struct JavaScriptModuleInstaller: JavaScriptModuleInstalling, Sendable {
    let script: JavaScriptResource.Script

    func install(into context: JSContext) throws {
        try JavaScriptResource.evaluate(script, in: context)
    }
}
