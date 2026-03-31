@preconcurrency import JavaScriptCore
import Foundation

/// Public actor that loads and runs Bun-built JavaScript bundles on Apple platforms.
public actor BunRuntime {

    private var contexts: [URL: BunContext] = [:]

    public init() {}

    /// Load a JavaScript bundle file and return a configured execution context.
    ///
    /// The context has Node.js and Bun compatibility layers pre-installed,
    /// allowing bundles built with Bun to execute natively.
    ///
    /// - Parameter url: URL to the `.js` bundle file.
    /// - Returns: A configured `BunContext` ready for evaluation.
    public func load(bundle url: URL) throws -> BunContext {
        guard FileManager.default.fileExists(atPath: url.path) else {
            throw BunRuntimeError.bundleNotFound(url)
        }

        let rawSource: String
        do {
            rawSource = try String(contentsOf: url, encoding: .utf8)
        } catch {
            throw BunRuntimeError.bundleReadFailed(url, underlying: error)
        }

        // Transform ESM syntax to CJS using es-module-lexer (WASM) in a temporary JSContext.
        // JS parses JS — no false positives on strings, comments, regex, or template literals.
        let source = try transformESM(rawSource, bundleURL: url)

        let jsContext = try createJSContext()

        // Install compatibility layers
        ESMResolver.install(in: jsContext)

        let context = BunContext(jsContext: jsContext)

        // Evaluate the bundle
        jsContext.evaluateScript(source, withSourceURL: url)
        try checkException(in: jsContext)

        contexts[url] = context
        return context
    }

    /// Create a bare context without loading a bundle.
    /// Useful for evaluating ad-hoc JavaScript with Node.js/Bun compatibility.
    public func createContext() throws -> BunContext {
        let jsContext = try createJSContext()
        ESMResolver.install(in: jsContext)
        return BunContext(jsContext: jsContext)
    }

    /// Set environment variables accessible to JavaScript via `process.env` and `Bun.env`.
    public func setEnvironment(_ env: [String: String], in context: BunContext) async throws {
        for (key, value) in env {
            try await context.evaluate(js: "process.env[\(escapeJSString(key))] = \(escapeJSString(value));")
        }
    }

    // MARK: - Private

    /// Transform ESM source to CJS using es-module-lexer running in a temporary JSContext.
    private func transformESM(_ source: String, bundleURL: URL) throws -> String {
        guard source.contains("import") || source.contains("export") else {
            return source
        }

        let ctx = try createJSContext()

        // Install atob — required by es-module-lexer for WASM base64 decoding
        ctx.evaluateScript(Self.atobPolyfill)

        // Load the ESM transformer bundle (es-module-lexer + transform logic)
        guard let transformerURL = Bundle.module.url(
            forResource: "esm-transformer.bundle",
            withExtension: "js"
        ) else {
            throw BunRuntimeError.transformerNotFound
        }

        let transformerSource = try String(contentsOf: transformerURL, encoding: .utf8)
        ctx.evaluateScript(transformerSource)
        try checkException(in: ctx)

        // Pass source and URL to the transformer
        ctx.setObject(source as NSString, forKeyedSubscript: "__src" as NSString)
        ctx.setObject(bundleURL.absoluteString as NSString, forKeyedSubscript: "__url" as NSString)

        guard let result = ctx.evaluateScript("__transformESM(__src, __url)") else {
            throw BunRuntimeError.transformFailed
        }
        try checkException(in: ctx)

        return result.toString()
    }

    private func createJSContext() throws -> JSContext {
        guard let context = JSContext() else {
            throw BunRuntimeError.contextCreationFailed
        }
        return context
    }

    private func checkException(in jsContext: JSContext) throws {
        if let exception = jsContext.exception {
            jsContext.exception = nil
            throw BunRuntimeError.javaScriptException(exception.toString())
        }
    }

    private func escapeJSString(_ string: String) -> String {
        let escaped = string
            .replacingOccurrences(of: "\\", with: "\\\\")
            .replacingOccurrences(of: "'", with: "\\'")
            .replacingOccurrences(of: "\n", with: "\\n")
            .replacingOccurrences(of: "\r", with: "\\r")
        return "'\(escaped)'"
    }

    /// Minimal atob polyfill for es-module-lexer WASM initialization.
    private static let atobPolyfill = """
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
