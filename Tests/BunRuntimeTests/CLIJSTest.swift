import Testing
import Foundation
import Synchronization
@preconcurrency import JavaScriptCore
@testable import BunRuntime
import TestHeartbeat

@Suite("CLI JS Transform", .serialized, .heartbeat)
struct CLIJSTest {
    private final class LogCollector: Sendable {
        private let storage = Mutex<[String]>([])

        func append(_ value: String) {
            storage.withLock { $0.append(value) }
        }

        var values: [String] {
            storage.withLock { $0 }
        }
    }

    private struct CLIRunObservation {
        let exitCode: Int
        let output: [String]
        let stdout: [String]
        let diagnosticsLines: [String]

        private func countMatching(_ needle: String) -> Int {
            output.reduce(into: 0) { count, line in
                if line.contains(needle) {
                    count += 1
                }
            }
        }

        private func containsMarker(_ marker: String) -> Bool {
            let combined = output + diagnosticsLines
            return combined.contains { $0.contains(marker) }
        }

        var startupLogs: [String] {
            let combined = output + diagnosticsLines
            return combined.filter {
                $0.contains("[STARTUP]") ||
                $0.contains("setup_started") ||
                $0.contains("action_after_setup") ||
                $0.contains("action_commands_loaded") ||
                $0.contains("before_runHeadlessStreaming") ||
                $0.contains("cli_message_loop_started") ||
                $0.contains("cli_stdin_message_parsed")
            }
        }

        var diagnosticLogs: [String] {
            output.filter {
                !$0.hasPrefix("[bun:setup]") && (
                $0.contains("[bun:diag]") ||
                $0.contains("[bun:executor]") ||
                $0.contains("[bun:lifecycle]") ||
                $0.contains("[bun:fetch]") ||
                $0.contains("[bun:scheduler]") ||
                    $0.contains("[bun:stdin]")
                )
            }
        }

        var stdinLogs: [String] {
            output.filter { $0.contains("[bun:stdin]") }
        }

        var fsLogs: [String] {
            output.filter { $0.contains("[bun:fs]") }
        }

        var fsSummary: [(String, Int, Int)] {
            let operations = [
                "fs.readFile",
                "fs.writeFile",
                "fs.appendFile",
                "fs.stat",
                "fs.lstat",
                "fs.readdir",
                "fs.mkdir",
                "fs.unlink",
                "fs.rmdir",
                "fs.rename",
                "fs.realpath",
                "fs.readlink",
                "fs.symlink",
                "fs.link",
                "fs.mkdtemp",
                "fs.access",
                "fs.chmod",
                "fs.utimes",
                "fs.rm",
                "fs.copyFile",
                "fs.open",
                "fs.handle.read",
                "fs.handle.write",
                "fs.truncate",
                "fs.handle.close",
            ]

            return operations.compactMap { operation in
                let started = countMatching("[bun:fs] start \(operation)")
                let completed = countMatching("[bun:fs] complete \(operation)")
                guard started > 0 || completed > 0 else { return nil }
                return (operation, started, completed)
            }
        }

        var fsTimingSummary: [(String, Int, Int)] {
            var maxDurations: [String: Int] = [:]
            var maxWaits: [String: Int] = [:]

            for line in output {
                if let source = extractFSMetricSource(prefix: "[bun:fs] complete ", from: line),
                   let duration = extractMetric(named: "dt", from: line) {
                    maxDurations[source] = max(maxDurations[source] ?? 0, duration)
                }
                if let source = extractFSMetricSource(prefix: "[bun:fs] resolve ", from: line),
                   let wait = extractMetric(named: "wait", from: line) {
                    maxWaits[source] = max(maxWaits[source] ?? 0, wait)
                }
            }

            let keys = Set(maxDurations.keys).union(maxWaits.keys).sorted()
            return keys.map { key in
                (key, maxDurations[key] ?? 0, maxWaits[key] ?? 0)
            }
        }

        var hostCallbackSummary: [(String, Int)] {
            let needles = [
                "fs.readFile",
                "fs.writeFile",
                "fs.appendFile",
                "fs.stat",
                "fs.lstat",
                "fs.readdir",
                "fs.mkdir",
                "fs.unlink",
                "fs.rename",
                "fs.realpath",
                "fs.readlink",
                "fs.symlink",
                "fetch:",
                "stdin",
                "setTimeout",
                "terminate",
            ]

            return needles.compactMap { needle in
                let count = countMatching("hostCallback(\(needle)")
                guard count > 0 else { return nil }
                return (needle, count)
            }
        }

        var hostCallbackTimingSummary: [(String, Int)] {
            var maxDurations: [String: Int] = [:]

            for line in output {
                guard let source = extractHostCallbackSource(from: line),
                      let duration = extractMetric(named: "dt", from: line) else {
                    continue
                }
                maxDurations[source] = max(maxDurations[source] ?? 0, duration)
            }

            return maxDurations.keys.sorted().map { key in
                (key, maxDurations[key] ?? 0)
            }
        }

        private struct FSTokenDetail {
            var path: String?
            var maxDuration = 0
            var maxWait = 0
        }

        private var fsTokenDetails: [String: FSTokenDetail] {
            var details: [String: FSTokenDetail] = [:]

            for line in output {
                if let entry = extractFSTokenSource(prefix: "[bun:fs] complete ", from: line) {
                    let key = "\(entry.source):\(entry.token)"
                    var detail = details[key] ?? FSTokenDetail()
                    detail.path = extractPath(from: line) ?? detail.path
                    detail.maxDuration = max(detail.maxDuration, extractMetric(named: "dt", from: line) ?? 0)
                    details[key] = detail
                }

                if let entry = extractFSTokenSource(prefix: "[bun:fs] resolve ", from: line) {
                    let key = "\(entry.source):\(entry.token)"
                    var detail = details[key] ?? FSTokenDetail()
                    detail.path = extractPath(from: line) ?? detail.path
                    detail.maxWait = max(detail.maxWait, extractMetric(named: "wait", from: line) ?? 0)
                    details[key] = detail
                }
            }

            return details
        }

        var slowHostCallbackDetails: [(String, Int, String?, Int, Int)] {
            var result: [(String, Int, String?, Int, Int)] = []

            for line in output {
                guard let source = extractHostCallbackSource(from: line),
                      let duration = extractMetric(named: "dt", from: line),
                      duration >= 1000 else {
                    continue
                }

                let detail = fsTokenDetails[source]
                result.append((
                    source,
                    duration,
                    detail?.path,
                    detail?.maxWait ?? 0,
                    detail?.maxDuration ?? 0
                ))
            }

            return result
        }

        var slowFSResolveLines: [String] {
            output.filter {
                $0.contains("[bun:fs] resolve ") &&
                (extractMetric(named: "wait", from: $0) ?? 0) >= 1000
            }
        }

        var slowHostCallbackLines: [String] {
            output.filter {
                $0.contains("hostCallback(") &&
                $0.contains(" dt=") &&
                (extractMetric(named: "dt", from: $0) ?? 0) >= 1000
            }
        }

        private func extractFSMetricSource(prefix: String, from line: String) -> String? {
            guard let range = line.range(of: prefix) else { return nil }
            let tail = line[range.upperBound...]
            guard let tokenRange = tail.range(of: " token=") else { return nil }
            return String(tail[..<tokenRange.lowerBound])
        }

        private func extractFSTokenSource(prefix: String, from line: String) -> (source: String, token: Int)? {
            guard let range = line.range(of: prefix) else { return nil }
            let tail = line[range.upperBound...]
            guard let tokenRange = tail.range(of: " token=") else { return nil }
            let source = String(tail[..<tokenRange.lowerBound])
            let tokenTail = tail[tokenRange.upperBound...]
            let digits = tokenTail.prefix { $0.isNumber }
            guard let token = Int(digits) else { return nil }
            return (source, token)
        }

        private func extractMetric(named name: String, from line: String) -> Int? {
            guard let range = line.range(of: "\(name)=") else { return nil }
            let tail = line[range.upperBound...]
            let digits = tail.prefix { $0.isNumber }
            return Int(digits)
        }

        private func extractPath(from line: String) -> String? {
            guard let range = line.range(of: " path=") else { return nil }
            return String(line[range.upperBound...])
        }

        private func extractHostCallbackSource(from line: String) -> String? {
            guard let range = line.range(of: "hostCallback(") else { return nil }
            let tail = line[range.upperBound...]
            guard let endRange = tail.range(of: ") end") else { return nil }
            return String(tail[..<endRange.lowerBound])
        }

        var markerSummary: [(String, Bool)] {
            [
                ("setup_started", containsMarker("setup_started")),
                ("setup_hooks_captured", containsMarker("setup_hooks_captured")),
                ("setup_background_jobs_launched", containsMarker("setup_background_jobs_launched")),
                ("setup_prefetch_starting", containsMarker("setup_prefetch_starting")),
                ("user_context_completed", containsMarker("user_context_completed")),
                ("started", containsMarker("\"event\":\"started\"")),
                ("before_validateForceLoginOrg", containsMarker("before_validateForceLoginOrg")),
                ("before_runHeadlessStreaming", containsMarker("before_runHeadlessStreaming")),
                ("cli_message_loop_started", containsMarker("cli_message_loop_started")),
                ("cli_stdin_message_parsed", containsMarker("cli_stdin_message_parsed")),
            ]
        }
    }

    private func cliPath() -> String {
        NSHomeDirectory() + "/Library/Caches/claude-code/package/cli.js"
    }

    private func makeTempDirectory(prefix: String) throws -> URL {
        let url = FileManager.default.temporaryDirectory
            .appendingPathComponent(prefix, isDirectory: true)
            .appendingPathComponent(UUID().uuidString, isDirectory: true)
        try FileManager.default.createDirectory(at: url, withIntermediateDirectories: true)
        return url
    }

    private func removeDirectoryIfPresent(_ url: URL) {
        do {
            if FileManager.default.fileExists(atPath: url.path) {
                try FileManager.default.removeItem(at: url)
            }
        } catch {
            print("cleanup failed for \(url.path): \(error)")
        }
    }

    private func prepareIsolatedClaudeHome(
        baseURL: String,
        seedEmptyChangelog: Bool = false
    ) throws -> (home: URL, workspace: URL, environment: [String: String]) {
        let home = try makeTempDirectory(prefix: "swift-bun-cli-home")
        let workspace = home.appendingPathComponent("workspace", isDirectory: true)
        let claudeDirectory = home.appendingPathComponent(".claude", isDirectory: true)
        let cacheDirectory = claudeDirectory.appendingPathComponent("cache", isDirectory: true)
        let diagnosticsFile = claudeDirectory.appendingPathComponent("diagnostics.ndjson")
        try FileManager.default.createDirectory(at: workspace, withIntermediateDirectories: true)
        try FileManager.default.createDirectory(at: claudeDirectory, withIntermediateDirectories: true)
        try FileManager.default.createDirectory(at: cacheDirectory, withIntermediateDirectories: true)

        let settingsURL = claudeDirectory.appendingPathComponent("settings.json")
        let installedPluginsURL = claudeDirectory.appendingPathComponent("installed_plugins.json")
        try """
        {
          "enabledPlugins": {}
        }
        """.write(to: settingsURL, atomically: true, encoding: .utf8)
        try """
        {
          "version": 2,
          "plugins": {}
        }
        """.write(to: installedPluginsURL, atomically: true, encoding: .utf8)
        if seedEmptyChangelog {
            let changelogURL = cacheDirectory.appendingPathComponent("changelog.md")
            try "".write(to: changelogURL, atomically: true, encoding: .utf8)
        }

        return (
            home: home,
            workspace: workspace,
            environment: [
                "HOME": home.path,
                "ANTHROPIC_API_KEY": "sk-ant-test-key",
                "ANTHROPIC_BASE_URL": baseURL,
                "CLAUDE_CODE_DIAGNOSTICS_FILE": diagnosticsFile.path,
            ]
        )
    }

    private func runCLIProcess(
        environment: [String: String],
        cwd: String,
        initWaitSeconds: Double,
        responseWaitSeconds: Double
    ) async throws -> CLIRunObservation {
        let process = BunProcess(
            bundle: URL(fileURLWithPath: cliPath()),
            arguments: ["-p", "--output-format", "stream-json", "--input-format", "stream-json", "--verbose", "--debug"],
            cwd: cwd,
            environment: environment
        )

        let logs = LogCollector()
        let stdoutLogs = LogCollector()
        let outputTask = Task { [logs] in
            for await line in process.output {
                logs.append(line)
            }
        }
        let stdoutTask = Task { [stdoutLogs] in
            for await line in process.stdout {
                stdoutLogs.append(line)
            }
        }
        let runTask = Task { try await process.run() }

        try await Task.sleep(for: .seconds(initWaitSeconds))
        let message = #"{"type":"user","session_id":"","message":{"role":"user","content":"What is 2+2? Answer in one word."},"parent_tool_use_id":null}"# + "\n"
        process.sendInput(message.data(using: .utf8)!)
        try await Task.sleep(for: .seconds(responseWaitSeconds))

        process.terminate(exitCode: 0)
        let exitCode = Int(try await runTask.value)
        outputTask.cancel()
        stdoutTask.cancel()

        let diagnosticsLines: [String]
        if let diagnosticsPath = environment["CLAUDE_CODE_DIAGNOSTICS_FILE"],
           FileManager.default.fileExists(atPath: diagnosticsPath) {
            let diagnostics = try String(contentsOfFile: diagnosticsPath, encoding: .utf8)
            diagnosticsLines = diagnostics
                .split(separator: "\n", omittingEmptySubsequences: true)
                .map(String.init)
        } else {
            diagnosticsLines = []
        }

        return CLIRunObservation(
            exitCode: exitCode,
            output: logs.values,
            stdout: stdoutLogs.values,
            diagnosticsLines: diagnosticsLines
        )
    }

    private func printObservation(_ observation: CLIRunObservation, label: String) {
        print("=== \(label) ===")
        print("Exit code: \(observation.exitCode)")
        print("Output lines: \(observation.output.count)")
        print("Stdout lines: \(observation.stdout.count)")
        print("--- marker summary ---")
        for (name, present) in observation.markerSummary {
            print("  \(name): \(present)")
        }

        if !observation.stdout.isEmpty {
            print("--- stdout ---")
            for line in observation.stdout.prefix(10) {
                print("  \(String(line.prefix(200)))")
            }
        }

        if !observation.diagnosticLogs.isEmpty {
            print("--- diagnostics ---")
            for line in observation.diagnosticLogs.prefix(40) {
                print("  \(String(line.prefix(240)))")
            }
        }

        let bunDiagnosticLines = observation.output.filter { $0.contains("[bun:diag]") }
        if !bunDiagnosticLines.isEmpty {
            print("--- bun diag ---")
            for line in bunDiagnosticLines.prefix(20) {
                print("  \(String(line.prefix(240)))")
            }
        }

        let executorLines = observation.output.filter { $0.contains("[bun:executor]") }
        if !executorLines.isEmpty {
            print("--- executor ---")
            for line in executorLines.prefix(40) {
                print("  \(String(line.prefix(240)))")
            }
        }

        let schedulerFocusLines = observation.output.filter {
            $0.contains("[bun:scheduler] drainTask") ||
            $0.contains("[bun:scheduler] hostCallback(") ||
            $0.contains("remaining-work")
        }
        if !schedulerFocusLines.isEmpty {
            print("--- scheduler focus ---")
            for line in schedulerFocusLines.prefix(40) {
                print("  \(String(line.prefix(240)))")
            }
        }

        if !observation.startupLogs.isEmpty {
            print("--- startup logs ---")
            for line in observation.startupLogs.prefix(40) {
                print("  \(String(line.prefix(240)))")
            }
        }

        let markerLines = observation.output.filter {
            $0.contains("setup_after_prefetch") ||
            $0.contains("action_before_setup") ||
            $0.contains("action_after_setup") ||
            $0.contains("Loading commands and agents") ||
            $0.contains("Commands and agents loaded") ||
            $0.contains("tengu_started") ||
            $0.contains("team-memory-watcher") ||
            $0.contains("plugin") ||
            $0.contains("apiKeyHelper") ||
            $0.contains("[error]") ||
            $0.contains("[warn]")
        }
        if !markerLines.isEmpty {
            print("--- markers ---")
            for line in markerLines.prefix(60) {
                print("  \(String(line.prefix(240)))")
            }
        }

        if !observation.stdinLogs.isEmpty {
            print("--- stdin logs ---")
            for line in observation.stdinLogs.prefix(20) {
                print("  \(String(line.prefix(200)))")
            }
        }

        if !observation.fsLogs.isEmpty {
            print("--- fs logs ---")
            for line in observation.fsLogs.prefix(40) {
                print("  \(String(line.prefix(220)))")
            }
        }

        if !observation.fsSummary.isEmpty {
            print("--- fs summary ---")
            for (operation, started, completed) in observation.fsSummary {
                print("  \(operation): start=\(started) complete=\(completed)")
            }
        }

        if !observation.fsTimingSummary.isEmpty {
            print("--- fs timing summary ---")
            for (operation, maxDuration, maxWait) in observation.fsTimingSummary {
                print("  \(operation): max_dt=\(maxDuration) max_wait=\(maxWait)")
            }
        }

        if !observation.hostCallbackSummary.isEmpty {
            print("--- host callback summary ---")
            for (source, count) in observation.hostCallbackSummary {
                print("  \(source): \(count)")
            }
        }

        if !observation.hostCallbackTimingSummary.isEmpty {
            print("--- host callback timing summary ---")
            for (source, maxDuration) in observation.hostCallbackTimingSummary {
                print("  \(source): max_dt=\(maxDuration)")
            }
        }

        if !observation.slowFSResolveLines.isEmpty {
            print("--- slow fs resolves ---")
            for line in observation.slowFSResolveLines.prefix(20) {
                print("  \(String(line.prefix(240)))")
            }
        }

        if !observation.slowHostCallbackLines.isEmpty {
            print("--- slow host callbacks ---")
            for line in observation.slowHostCallbackLines.prefix(20) {
                print("  \(String(line.prefix(240)))")
            }
        }

        if !observation.slowHostCallbackDetails.isEmpty {
            print("--- slow host callback details ---")
            for (source, duration, path, maxWait, maxDuration) in observation.slowHostCallbackDetails.prefix(20) {
                print("  \(source): dt=\(duration) fs_wait=\(maxWait) fs_dt=\(maxDuration) path=\(path ?? "<unknown>")")
            }
        }

        if !observation.diagnosticsLines.isEmpty {
            print("--- diagnostics file ---")
            for line in observation.diagnosticsLines.prefix(40) {
                print("  \(String(line.prefix(240)))")
            }
        }

        let outputTail = observation.output.suffix(20)
        if !outputTail.isEmpty {
            print("--- output tail ---")
            for line in outputTail {
                print("  \(String(line.prefix(240)))")
            }
        }
    }

    private func loadAndTransform() throws -> (source: String, result: String)? {
        let path = cliPath()
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

    @Test(.tags(.slow)) func cliJSLifecycle() async throws {
        let path = cliPath()
        guard FileManager.default.fileExists(atPath: path) else { return }

        let observation = try await runCLIProcess(
            environment: ["HOME": NSHomeDirectory()],
            cwd: NSHomeDirectory(),
            initWaitSeconds: 10,
            responseWaitSeconds: 15
        )
        printObservation(observation, label: "real HOME")

        let exitedEarly = observation.output.contains { $0.contains("checkExitCondition → exiting") }
        let hasStdinRef = observation.output.contains { $0.contains("ref(stdin)") }
        print("Has stdin ref: \(hasStdinRef)")
        print("Exited early: \(exitedEarly)")

        #expect(!exitedEarly, "cli.js exited early via checkExitCondition")
    }

    @Test(.tags(.slow)) func cliJSMinimalHomeReachesMessageLoop() async throws {
        let path = cliPath()
        guard FileManager.default.fileExists(atPath: path) else { return }

        let server = try await LocalHTTPTestServer.start()
        let isolated = try prepareIsolatedClaudeHome(baseURL: server.baseURL)

        do {
            let observation = try await runCLIProcess(
                environment: isolated.environment,
                cwd: isolated.workspace.path,
                initWaitSeconds: 8,
                responseWaitSeconds: 20
            )
            printObservation(observation, label: "isolated HOME")

            let realClaudeHome = NSHomeDirectory() + "/.claude"
            let touchedRealClaudeHome = (observation.output + observation.diagnosticsLines).contains {
                $0.contains(realClaudeHome)
            }
            let touchedIsolatedClaudeHome = observation.fsLogs.contains {
                $0.contains(isolated.home.path + "/.claude")
            }
            let loadedSettings = observation.diagnosticsLines.contains {
                $0.contains("\"event\":\"settings_load_completed\"")
            }
            let completedGitRootProbe = observation.diagnosticsLines.contains {
                $0.contains("\"event\":\"find_git_root_completed\"")
            }

            #expect(observation.exitCode == 0)
            #expect(loadedSettings, "cli.js did not complete settings loading under isolated HOME")
            #expect(completedGitRootProbe, "cli.js did not complete git root probing under isolated HOME")
            #expect(touchedIsolatedClaudeHome, "cli.js did not touch the isolated .claude home")
            #expect(!touchedRealClaudeHome, "cli.js still touched the real ~/.claude under isolated HOME")
        } catch {
            removeDirectoryIfPresent(isolated.home)
            do {
                try await server.shutdown()
            } catch {
                print("server shutdown failed after error: \(error)")
            }
            throw error
        }

        removeDirectoryIfPresent(isolated.home)
        try await server.shutdown()
    }

    @Test(.tags(.slow)) func cliJSMinimalHomeWithEmptyChangelogCompletesSetup() async throws {
        let path = cliPath()
        guard FileManager.default.fileExists(atPath: path) else { return }

        let server = try await LocalHTTPTestServer.start()
        let isolated = try prepareIsolatedClaudeHome(
            baseURL: server.baseURL,
            seedEmptyChangelog: true
        )

        do {
            let observation = try await runCLIProcess(
                environment: isolated.environment,
                cwd: isolated.workspace.path,
                initWaitSeconds: 8,
                responseWaitSeconds: 20
            )
            printObservation(observation, label: "isolated HOME with empty changelog")

            let realClaudeHome = NSHomeDirectory() + "/.claude"
            let touchedRealClaudeHome = (observation.output + observation.diagnosticsLines).contains {
                $0.contains(realClaudeHome)
            }
            let loadedSettings = observation.diagnosticsLines.contains {
                $0.contains("\"event\":\"settings_load_completed\"")
            }
            let completedGitRootProbe = observation.diagnosticsLines.contains {
                $0.contains("\"event\":\"find_git_root_completed\"")
            }

            #expect(observation.exitCode == 0)
            #expect(loadedSettings, "cli.js did not complete settings loading when changelog cache was empty")
            #expect(completedGitRootProbe, "cli.js did not complete git root probing when changelog cache was empty")
            #expect(!touchedRealClaudeHome, "cli.js still touched the real ~/.claude when changelog cache was empty")
        } catch {
            removeDirectoryIfPresent(isolated.home)
            do {
                try await server.shutdown()
            } catch {
                print("server shutdown failed after error: \(error)")
            }
            throw error
        }

        removeDirectoryIfPresent(isolated.home)
        try await server.shutdown()
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
        _ = ctx.evaluateScript("""
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
