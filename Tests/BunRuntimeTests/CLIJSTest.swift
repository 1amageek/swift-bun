import Testing
import Foundation
import Synchronization
@preconcurrency import JavaScriptCore
@testable import BunRuntime

@Suite("CLI JS Transform")
struct CLIJSTest {

    private func loadAndTransform() throws -> (source: String, result: String)? {
        let path = NSHomeDirectory() + "/Library/Caches/claude-code/package/cli.js"
        guard FileManager.default.fileExists(atPath: path) else { return nil }
        let source = try String(contentsOfFile: path, encoding: .utf8)
        let url = URL(fileURLWithPath: path)

        guard let ctx = JSContext() else { throw BunRuntimeError.contextCreationFailed }

        ctx.evaluateScript("""
        (function() {
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
        """)

        guard let bundleURL = Bundle.module.url(
            forResource: "esm-transformer.bundle",
            withExtension: "js",

        ) else {
            throw BunRuntimeError.transformerNotFound
        }
        let bundle = try String(contentsOf: bundleURL, encoding: .utf8)
        ctx.evaluateScript(bundle)
        if let ex = ctx.exception {
            throw BunRuntimeError.javaScriptException(ex.toString())
        }

        ctx.setObject(source as NSString, forKeyedSubscript: "__src" as NSString)
        ctx.setObject(url.absoluteString as NSString, forKeyedSubscript: "__url" as NSString)
        guard let result = ctx.evaluateScript("__transformESM(__src, __url)") else {
            throw BunRuntimeError.transformFailed
        }
        if let ex = ctx.exception {
            throw BunRuntimeError.javaScriptException(ex.toString())
        }

        return (source, result.toString())
    }

    @Test func firstImportTransformed() throws {
        guard let (_, result) = try loadAndTransform() else { return }
        let head = String(result.prefix(600))
        #expect(head.contains("var{createRequire"))
        #expect(!head.contains("import{createRequire"))
    }

    @Test func cliJSLifecycle() async throws {
        let path = NSHomeDirectory() + "/Library/Caches/claude-code/package/cli.js"
        guard FileManager.default.fileExists(atPath: path) else { return }

        let p = BunProcess(
            bundle: URL(fileURLWithPath: path),
            arguments: ["-p", "--output-format", "stream-json", "--input-format", "stream-json", "--verbose", "--debug"],
            cwd: NSHomeDirectory(),
            environment: ["HOME": NSHomeDirectory()]
        )

        // Collect output in background
        final class LogCollector: Sendable {
            private let storage = Mutex<[String]>([])
            func append(_ s: String) { storage.withLock { $0.append(s) } }
            var values: [String] { storage.withLock { $0 } }
        }
        let logs = LogCollector()
        let stdoutLogs = LogCollector()

        let outputTask = Task { [logs] in
            for await line in p.output { logs.append(line) }
        }
        let stdoutTask = Task { [stdoutLogs] in
            for await line in p.stdout { stdoutLogs.append(line) }
        }

        // Run in background
        let runTask = Task { try await p.run() }

        // Wait for cli.js to initialize
        try await Task.sleep(for: .seconds(3))

        print("=== After 3s init ===")
        print("stdout: \(stdoutLogs.values.count) lines, output: \(logs.values.count) lines")

        // Send a message via stdin
        let msg = #"{"type":"user","session_id":"","message":{"role":"user","content":"What is 2+2? Answer in one word."},"parent_tool_use_id":null}"# + "\n"
        p.sendInput(msg.data(using: .utf8)!)
        print("=== Sent stdin ===")

        // Wait for response
        try await Task.sleep(for: .seconds(5))

        print("=== After 5s response wait ===")

        // Terminate and collect
        p.terminate(exitCode: 0)
        let code = try await runTask.value
        outputTask.cancel()
        stdoutTask.cancel()

        let allLogs = logs.values
        let allStdout = stdoutLogs.values

        print("Exit code: \(code)")
        print("Output lines: \(allLogs.count)")
        print("Stdout lines: \(allStdout.count)")

        // Show stdout content
        if !allStdout.isEmpty {
            print("--- stdout ---")
            for line in allStdout.prefix(10) {
                print("  \(String(line.prefix(200)))")
            }
        }

        // Show relevant output (skip bun:setup, show errors and lifecycle)
        for log in allLogs.filter({ !$0.hasPrefix("[bun:setup]") }).prefix(20) {
            print("  \(String(log.prefix(200)))")
        }

        let exitedEarly = allLogs.contains { $0.contains("checkExitCondition → exiting") }
        let hasStdinRef = allLogs.contains { $0.contains("ref(stdin)") }
        print("Has stdin ref: \(hasStdinRef)")
        print("Exited early: \(exitedEarly)")

        #expect(!exitedEarly, "cli.js exited early via checkExitCondition")
    }

    @Test func noRemainingStaticImports() throws {
        guard let (source, result) = try loadAndTransform() else { return }

        // Use es-module-lexer on the RESULT to verify no static imports remain
        // If parse finds 0 static imports in the result, the transform is complete
        let ctx = JSContext()!
        ctx.evaluateScript("""
        (function() {
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
        """)

        guard let bundleURL = Bundle.module.url(
            forResource: "esm-transformer.bundle",
            withExtension: "js",

        ) else { return }
        let bundle = try String(contentsOf: bundleURL, encoding: .utf8)
        ctx.evaluateScript(bundle)

        ctx.setObject(result as NSString, forKeyedSubscript: "__resultSrc" as NSString)
        let check = ctx.evaluateScript("""
        (function() {
            var parse = require('es-module-lexer').parse;
            var imps = parse(__resultSrc)[0];
            var staticImports = imps.filter(function(i) { return i.d === -1; });
            return JSON.stringify({
                total: imps.length,
                static: staticImports.length,
                dynamic: imps.filter(function(i) { return i.d >= 0; }).length,
                meta: imps.filter(function(i) { return i.d === -2; }).length
            });
        })()
        """)

        // es-module-lexer's require won't work here since we don't have ESMResolver
        // Instead, use the already-loaded __transformESM context to verify
        // Just check: result should not contain "import " followed by "{" or identifier + "from"
        // using the same es-module-lexer that already ran

        // Simple verification: count import patterns with from in result
        let resultChars = Array(result)
        var remaining = 0
        for i in 0..<(resultChars.count - 10) {
            guard resultChars[i] == "i", resultChars[i+1] == "m", resultChars[i+2] == "p",
                  resultChars[i+3] == "o", resultChars[i+4] == "r", resultChars[i+5] == "t" else { continue }
            if i > 0 {
                let prev = resultChars[i-1]
                if prev.isLetter || prev.isNumber || prev == "_" || prev == "$" || prev == "." { continue }
            }
            let next = i + 6
            guard next < resultChars.count else { continue }
            let c = resultChars[next]
            guard c == "{" || c == "*" || (c == " " && next+1 < resultChars.count && (resultChars[next+1].isLetter || resultChars[next+1] == "_")) else { continue }

            // Check context — is "from" + quote nearby?
            let lookahead = String(resultChars[i..<min(resultChars.count, i + 200)])
            if lookahead.range(of: #"from\s*["']"#, options: .regularExpression) != nil {
                // Verify this is NOT inside a string by checking source context
                // If the original source had this as a string, it should still be a string
                let origLookahead = String(Array(source)[i..<min(source.count, i + 200)])
                if origLookahead.hasPrefix("import") {
                    remaining += 1
                    if remaining <= 3 {
                        let ctx = String(resultChars[max(0,i-20)..<min(resultChars.count,i+60)])
                        print("  [\(i)] \(ctx)")
                    }
                }
            }
        }

        print("Approximate remaining in-code imports: \(remaining)")
        // Allow 0 — es-module-lexer should transform all real imports
        #expect(remaining == 0, "Found \(remaining) untransformed static imports")
    }
}
