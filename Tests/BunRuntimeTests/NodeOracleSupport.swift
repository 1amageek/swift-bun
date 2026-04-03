import Foundation
@testable import BunRuntime

enum NodeOracleSupport {
    struct Outcome: Codable, Equatable, Sendable {
        let ok: Bool
        let payload: String?
        let error: SerializedError?
    }

    struct SerializedError: Codable, Equatable, Sendable {
        let name: String?
        let message: String?
        let codeText: String?
        let codeNumber: Int?
        let errnoText: String?
        let errnoNumber: Int?
        let syscall: String?
        let path: String?
        let signal: String?
        let status: Int?
        let killed: Bool?
        let cmd: String?
        let stdout: String?
        let stderr: String?
    }

    struct Comparison: Sendable {
        let node: Outcome
        let bun: Outcome
        let snippet: String

        var matches: Bool { node == bun }
    }

    enum OracleError: Error, LocalizedError {
        case nodeProcessFailed(status: Int32, stdout: String, stderr: String)
        case invalidNodeOutput(String)
        case invalidBunOutput(String)
        case mismatch(Comparison)

        var errorDescription: String? {
            switch self {
            case let .nodeProcessFailed(status, stdout, stderr):
                return """
                node oracle process failed
                status: \(status)
                stdout: \(stdout)
                stderr: \(stderr)
                """
            case let .invalidNodeOutput(output):
                return "invalid node oracle output: \(output)"
            case let .invalidBunOutput(output):
                return "invalid BunRuntime oracle output: \(output)"
            case let .mismatch(comparison):
                return """
                node oracle mismatch
                snippet:
                \(comparison.snippet)

                node:
                \(Self.prettyJSON(for: comparison.node))

                swift-bun:
                \(Self.prettyJSON(for: comparison.bun))
                """
            }
        }

        private static func prettyJSON<T: Encodable>(for value: T) -> String {
            let encoder = JSONEncoder()
            encoder.outputFormatting = [.prettyPrinted, .sortedKeys]
            do {
                let data = try encoder.encode(value)
                guard let string = String(data: data, encoding: .utf8) else {
                    return String(describing: value)
                }
                return string
            } catch {
                return String(describing: value)
            }
        }
    }

    static func compare(
        _ snippet: String,
        cwd: String? = nil,
        environment: [String: String] = [:]
    ) async throws -> Comparison {
        async let node = runNode(snippet, cwd: cwd, environment: environment)
        async let bun = runBun(snippet, cwd: cwd, environment: environment)
        return try await Comparison(node: node, bun: bun, snippet: snippet)
    }

    static func assertMatchesNode(
        _ snippet: String,
        cwd: String? = nil,
        environment: [String: String] = [:]
    ) async throws {
        let comparison = try await compare(snippet, cwd: cwd, environment: environment)
        guard comparison.matches else {
            throw OracleError.mismatch(comparison)
        }
    }

    private static func runNode(
        _ snippet: String,
        cwd: String?,
        environment: [String: String]
    ) async throws -> Outcome {
        let wrapped = makeNodeWrapper(for: snippet)
        return try await Task.detached(priority: .medium) {
            let process = Process()
            process.executableURL = URL(fileURLWithPath: "/usr/bin/env")
            process.arguments = ["node", "--input-type=commonjs", "-e", wrapped]
            if let cwd {
                process.currentDirectoryURL = URL(fileURLWithPath: cwd)
            }

            var mergedEnvironment = ProcessInfo.processInfo.environment
            for (key, value) in environment {
                mergedEnvironment[key] = value
            }
            process.environment = mergedEnvironment

            let stdoutPipe = Pipe()
            let stderrPipe = Pipe()
            process.standardOutput = stdoutPipe
            process.standardError = stderrPipe

            try process.run()
            let timeoutTask = Task {
                try await Task.sleep(for: .seconds(15))
                if process.isRunning {
                    process.terminate()
                }
            }
            process.waitUntilExit()
            timeoutTask.cancel()

            let stdoutData = stdoutPipe.fileHandleForReading.readDataToEndOfFile()
            let stderrData = stderrPipe.fileHandleForReading.readDataToEndOfFile()
            let stdout = String(data: stdoutData, encoding: .utf8) ?? ""
            let stderr = String(data: stderrData, encoding: .utf8) ?? ""

            guard process.terminationStatus == 0 else {
                throw OracleError.nodeProcessFailed(status: process.terminationStatus, stdout: stdout, stderr: stderr)
            }

            return try decodeOutcome(stdout.trimmingCharacters(in: .whitespacesAndNewlines), invalidOutput: OracleError.invalidNodeOutput)
        }.value
    }

    private static func runBun(
        _ snippet: String,
        cwd: String?,
        environment: [String: String]
    ) async throws -> Outcome {
        let wrapped = makeBunWrapper(for: snippet)
        let process = BunProcess(cwd: cwd, environment: environment)
        let result = try await TestProcessSupport.evaluateAsync(wrapped, process: process)
        return try decodeOutcome(
            result.stringValue.trimmingCharacters(in: .whitespacesAndNewlines),
            invalidOutput: OracleError.invalidBunOutput
        )
    }

    private static func decodeOutcome(
        _ text: String,
        invalidOutput: (String) -> OracleError
    ) throws -> Outcome {
        guard let data = text.data(using: .utf8) else {
            throw invalidOutput(text)
        }
        do {
            return try JSONDecoder().decode(Outcome.self, from: data)
        } catch {
            throw invalidOutput(text)
        }
    }

    private static func makeNodeWrapper(for snippet: String) -> String {
        """
        \(commonJavaScriptSupport)
        (async function() {
          const __result = await __swiftBunOracleRun(async function() {
        \(indent(snippet, spaces: 12))
          });
          process.stdout.write(JSON.stringify(__result));
        })().catch(function(error) {
          process.stderr.write(String(error && error.stack ? error.stack : error));
          process.exit(1);
        });
        """
    }

    private static func makeBunWrapper(for snippet: String) -> String {
        """
        \(commonJavaScriptSupport)
        (async function() {
          return JSON.stringify(await __swiftBunOracleRun(async function() {
        \(indent(snippet, spaces: 12))
          }));
        })()
        """
    }

    private static func indent(_ text: String, spaces: Int) -> String {
        let prefix = String(repeating: " ", count: spaces)
        return text
            .split(separator: "\n", omittingEmptySubsequences: false)
            .map { prefix + $0 }
            .joined(separator: "\n")
    }

    private static let commonJavaScriptSupport = #"""
        function __swiftBunOracleCanonicalize(value) {
          if (typeof value === 'undefined') {
            return { __type: 'undefined' };
          }
          if (typeof value === 'bigint') {
            return { __type: 'bigint', value: String(value) };
          }
          if (typeof value === 'number' && !Number.isFinite(value)) {
            return { __type: 'number', value: String(value) };
          }
          if (typeof Buffer !== 'undefined' && Buffer.isBuffer && Buffer.isBuffer(value)) {
            return { __type: 'buffer', data: Array.from(value.values()) };
          }
          if (value instanceof Uint8Array) {
            return { __type: 'uint8array', data: Array.from(value) };
          }
          if (value instanceof Date) {
            return { __type: 'date', value: value.toISOString() };
          }
          if (Array.isArray(value)) {
            return value.map(__swiftBunOracleCanonicalize);
          }
          if (value && typeof value === 'object') {
            const out = {};
            for (const key of Object.keys(value).sort()) {
              out[key] = __swiftBunOracleCanonicalize(value[key]);
            }
            return out;
          }
          return value;
        }

        function __swiftBunOracleSerializePayload(value) {
          return JSON.stringify(__swiftBunOracleCanonicalize(value));
        }

        function __swiftBunOracleBufferToText(value) {
          if (typeof value === 'string') return value;
          if (typeof Buffer !== 'undefined' && Buffer.isBuffer && Buffer.isBuffer(value)) {
            return value.toString('utf8');
          }
          if (value instanceof Uint8Array) {
            return Buffer.from(value).toString('utf8');
          }
          return null;
        }

        function __swiftBunOracleSerializeError(error) {
          return {
            name: error && error.name != null ? String(error.name) : null,
            message: error && error.message != null ? String(error.message) : String(error),
            codeText: error && typeof error.code === 'string' ? error.code : null,
            codeNumber: error && typeof error.code === 'number' ? error.code : null,
            errnoText: error && typeof error.errno === 'string' ? error.errno : null,
            errnoNumber: error && typeof error.errno === 'number' ? error.errno : null,
            syscall: error && typeof error.syscall === 'string' ? error.syscall : null,
            path: error && typeof error.path === 'string' ? error.path : null,
            signal: error && typeof error.signal === 'string' ? error.signal : null,
            status: error && typeof error.status === 'number' ? error.status : null,
            killed: error && typeof error.killed === 'boolean' ? error.killed : null,
            cmd: error && typeof error.cmd === 'string' ? error.cmd : null,
            stdout: error ? __swiftBunOracleBufferToText(error.stdout) : null,
            stderr: error ? __swiftBunOracleBufferToText(error.stderr) : null
          };
        }

        async function __swiftBunOracleRun(fn) {
          try {
            const value = await fn();
            return {
              ok: true,
              payload: __swiftBunOracleSerializePayload(value),
              error: null
            };
          } catch (error) {
            return {
              ok: false,
              payload: null,
              error: __swiftBunOracleSerializeError(error)
            };
          }
        }
        """#
}
