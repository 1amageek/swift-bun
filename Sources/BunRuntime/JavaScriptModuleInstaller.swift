@preconcurrency import JavaScriptCore

protocol JavaScriptModuleInstalling: Sendable {
    func install(into context: JSContext) throws
}

/// Installs a bundled JavaScript resource into a JSContext.
struct JavaScriptModuleInstaller: JavaScriptModuleInstalling, Sendable {
    let script: JavaScriptResource.Script

    func install(into context: JSContext) throws {
        try JavaScriptResource.evaluate(script, in: context)
    }

    static func installAll(
        _ scripts: JavaScriptResource.Script...,
        into context: JSContext
    ) throws {
        try installAll(scripts, into: context)
    }

    static func installAll(
        _ scripts: [JavaScriptResource.Script],
        into context: JSContext
    ) throws {
        for script in scripts {
            try JavaScriptModuleInstaller(script: script).install(into: context)
        }
    }
}
