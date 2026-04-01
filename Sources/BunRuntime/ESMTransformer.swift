@preconcurrency import JavaScriptCore
import Foundation

/// Transforms ESM syntax to CJS using es-module-lexer (WASM) in a temporary JSContext.
///
/// JS parses JS — no false positives on strings, comments, regex, or template literals.
/// Used by both `BunRuntime` (library mode) and `BunProcess` (process mode).
enum ESMTransformer {

    /// Transform ESM source to CJS equivalents.
    ///
    /// Creates a temporary JSContext, loads es-module-lexer with WASM `initSync()`,
    /// and runs the `__transformESM` function to convert all static imports, import.meta,
    /// dynamic import assertions, and export declarations.
    ///
    /// - Parameters:
    ///   - source: Raw JavaScript source potentially containing ESM syntax.
    ///   - bundleURL: URL of the bundle file (used for `import.meta.url` replacement).
    /// - Returns: Transformed source with ESM syntax replaced by CJS equivalents.
    static func transform(_ source: String, bundleURL: URL) throws -> String {
        guard source.contains("import") || source.contains("export") else {
            return source
        }

        guard let ctx = JSContext() else {
            throw BunRuntimeError.contextCreationFailed
        }

        try JavaScriptResource.evaluate(.bootstrap(.base64), in: ctx)
        let (transformerURL, transformerSource) = try JavaScriptResource.source(for: .bundle(.esmTransformer))
        ctx.evaluateScript(transformerSource, withSourceURL: transformerURL)
        if let exception = ctx.exception {
            ctx.exception = nil
            throw BunRuntimeError.javaScriptException(exception.toString())
        }

        ctx.setObject(source as NSString, forKeyedSubscript: "__src" as NSString)
        ctx.setObject(bundleURL.absoluteString as NSString, forKeyedSubscript: "__url" as NSString)

        guard let result = ctx.evaluateScript("__transformESM(__src, __url)") else {
            throw BunRuntimeError.transformFailed
        }
        if let exception = ctx.exception {
            ctx.exception = nil
            throw BunRuntimeError.javaScriptException(exception.toString())
        }

        return result.toString()
    }
}
