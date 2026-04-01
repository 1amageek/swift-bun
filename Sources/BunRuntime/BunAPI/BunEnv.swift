@preconcurrency import JavaScriptCore
import Foundation

/// `Bun.env` implementation backed by `ProcessInfo.environment`.
struct BunEnvironmentInstaller: Sendable {
    let environment: [String: String]

    init(environment: [String: String] = [:]) {
        self.environment = environment
    }

    func install(into context: JSContext) throws {
        let runtimeEnvironment = RuntimeEnvironment(overrides: environment)
        guard let process = context.objectForKeyedSubscript("process"), !process.isUndefined else {
            throw BunRuntimeError.javaScriptException("process is not installed")
        }

        process.setObject(runtimeEnvironment.values, forKeyedSubscript: "env" as NSString)
        if let exception = context.exception {
            context.exception = nil
            throw BunRuntimeError.javaScriptException(exception.toString())
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
        if let exception = context.exception {
            context.exception = nil
            throw BunRuntimeError.javaScriptException(exception.toString())
        }
    }
}
