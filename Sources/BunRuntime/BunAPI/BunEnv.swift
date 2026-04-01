@preconcurrency import JavaScriptCore
import Foundation

/// `Bun.env` implementation backed by `ProcessInfo.environment`.
struct BunEnvironmentInstaller {
    let environment: [String: String]

    init(environment: [String: String] = [:]) {
        self.environment = environment
    }

    func install(into context: JSContext) {
        // Pre-populate process.env with merged runtime environment.
        var env = ProcessInfo.processInfo.environment
        for (key, value) in environment {
            env[key] = value
        }
        for (key, value) in env {
            let escapedKey = Self.escapeForJSString(key)
            let escapedValue = Self.escapeForJSString(value)
            context.evaluateScript("process.env['\(escapedKey)'] = '\(escapedValue)';")
        }

        // Bun.env is an alias for process.env
        context.evaluateScript("""
        Bun.env = process.env;

        Bun.env.toJSON = function() {
            var result = {};
            for (var key in process.env) {
                if (key !== 'toJSON') result[key] = process.env[key];
            }
            return result;
        };
        """)
    }

    private static func escapeForJSString(_ string: String) -> String {
        string
            .replacingOccurrences(of: "\\", with: "\\\\")
            .replacingOccurrences(of: "'", with: "\\'")
            .replacingOccurrences(of: "\n", with: "\\n")
            .replacingOccurrences(of: "\r", with: "\\r")
            .replacingOccurrences(of: "\t", with: "\\t")
            .replacingOccurrences(of: "\u{2028}", with: "\\u2028")
            .replacingOccurrences(of: "\u{2029}", with: "\\u2029")
    }
}
