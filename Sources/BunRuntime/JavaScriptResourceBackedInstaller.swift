@preconcurrency import JavaScriptCore

/// Marker for installers that only evaluate a bundled JavaScript resource.
protocol JavaScriptResourceBackedInstaller {
    static var script: JavaScriptResource.Script { get }
}

extension JavaScriptResourceBackedInstaller {
    static func install(in context: JSContext) throws {
        try JavaScriptResource.evaluate(script, in: context)
    }
}
