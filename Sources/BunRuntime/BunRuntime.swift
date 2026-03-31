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

        // Transform ESM syntax for JSC compatibility (static imports, import.meta, assertions)
        let source = SourceTransformer.transformForJSC(rawSource, bundleURL: url)

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
}
