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

        ctx.evaluateScript(atobPolyfill)

        guard let transformerURL = Bundle.module.url(
            forResource: "esm-transformer.bundle",
            withExtension: "js"
        ) else {
            throw BunRuntimeError.transformerNotFound
        }

        let transformerSource = try String(contentsOf: transformerURL, encoding: .utf8)
        ctx.evaluateScript(transformerSource)
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

    /// Minimal atob polyfill required by es-module-lexer for WASM base64 decoding.
    static let atobPolyfill = """
    (function() {
        if (typeof globalThis.atob !== 'undefined') return;
        var chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
        globalThis.atob = function(input) {
            var str = String(input).replace(/[=]+$/, '');
            var output = '';
            for (var i = 0; i < str.length;) {
                var a = chars.indexOf(str.charAt(i++));
                var b = i < str.length ? chars.indexOf(str.charAt(i++)) : -1;
                var c = i < str.length ? chars.indexOf(str.charAt(i++)) : -1;
                var d = i < str.length ? chars.indexOf(str.charAt(i++)) : -1;
                if (b === -1) break;
                var bitmap = (a << 18) | (b << 12) | (c !== -1 ? c << 6 : 0) | (d !== -1 ? d : 0);
                output += String.fromCharCode((bitmap >> 16) & 0xFF);
                if (c !== -1) output += String.fromCharCode((bitmap >> 8) & 0xFF);
                if (d !== -1) output += String.fromCharCode(bitmap & 0xFF);
            }
            return output;
        };
    })();
    """
}
