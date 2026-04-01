@preconcurrency import JavaScriptCore
import Foundation

/// Installs Swift-provided configuration objects under `globalThis.__swiftBunConfig`.
struct JavaScriptConfigurationInstaller: Sendable {
    func install(
        _ value: [String: Any],
        as key: String,
        into context: JSContext
    ) throws {
        let configurationObject = try configurationObject(in: context)
        configurationObject.setObject(value, forKeyedSubscript: key as NSString)
        if let exception = context.exception {
            context.exception = nil
            throw BunRuntimeError.javaScriptException(exception.toString())
        }
    }

    private func configurationObject(in context: JSContext) throws -> JSValue {
        if let existing = context.objectForKeyedSubscript("__swiftBunConfig"), !existing.isUndefined {
            return existing
        }

        context.setObject([String: Any](), forKeyedSubscript: "__swiftBunConfig" as NSString)
        if let exception = context.exception {
            context.exception = nil
            throw BunRuntimeError.javaScriptException(exception.toString())
        }

        guard let installed = context.objectForKeyedSubscript("__swiftBunConfig"), !installed.isUndefined else {
            throw BunRuntimeError.javaScriptException("Failed to initialize __swiftBunConfig")
        }
        return installed
    }
}
