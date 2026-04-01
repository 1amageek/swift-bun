import Testing
import Foundation
import Synchronization
@testable import BunRuntime
import TestHeartbeat

private final class Lines: Sendable {
    private let storage = Mutex<[String]>([])
    func append(_ s: String) { storage.withLock { $0.append(s) } }
    var values: [String] { storage.withLock { $0 } }
}

/// Tests that isolate each async primitive to identify which pattern
/// causes evaluateScript to hang during CLI workloads.
@Suite("Async Primitives", .serialized, .heartbeat)
struct AsyncPrimitiveTests {

    // MARK: - 1. nextTick only (no await)

    @Test(.timeLimit(.minutes(1)))
    func nextTickOnly() async throws {
        guard let url = Bundle.module.url(forResource: "test-nexttick-only", withExtension: "js") else {
            Issue.record("test-nexttick-only.js not found"); return
        }

        let bp = BunProcess(bundle: url)
        let lines = Lines()
        Task { for await line in bp.stdout { lines.append(line.trimmingCharacters(in: .newlines)) } }

        let code = try await bp.run()
        try await Task.sleep(for: .milliseconds(100))

        print("[nexttick-only] stdout: \(lines.values)")
        #expect(code == 0)
        #expect(lines.values.contains("tick1"))
        #expect(lines.values.contains("tick2"))
        #expect(lines.values.contains(where: { $0.hasPrefix("done:") }))
    }

    // MARK: - 2. await setTimeout

    @Test(.timeLimit(.minutes(1)))
    func awaitSetTimeout() async throws {
        guard let url = Bundle.module.url(forResource: "test-settimeout-await", withExtension: "js") else {
            Issue.record("test-settimeout-await.js not found"); return
        }

        let bp = BunProcess(bundle: url)
        let lines = Lines()
        Task { for await line in bp.stdout { lines.append(line.trimmingCharacters(in: .newlines)) } }

        let code = try await bp.run()
        try await Task.sleep(for: .milliseconds(100))

        print("[settimeout-await] stdout: \(lines.values)")
        #expect(code == 0)
        #expect(lines.values.contains("before-await"))
        #expect(lines.values.contains("timer-fired"))
        #expect(lines.values.contains("after-await"))
    }

    // MARK: - 3. await fetch

    @Test(.tags(.slow), .timeLimit(.minutes(1)))
    func awaitFetch() async throws {
        guard let url = Bundle.module.url(forResource: "test-fetch-await", withExtension: "js") else {
            Issue.record("test-fetch-await.js not found"); return
        }

        let bp = BunProcess(bundle: url)
        let lines = Lines()
        Task { for await line in bp.stdout { lines.append(line.trimmingCharacters(in: .newlines)) } }

        let code = try await bp.run()
        try await Task.sleep(for: .milliseconds(100))

        print("[fetch-await] stdout: \(lines.values)")
        #expect(code == 0)
        #expect(lines.values.contains("before-fetch"))
        #expect(lines.values.contains("after-fetch"))
    }

    // MARK: - 4. await nextTick

    @Test(.timeLimit(.minutes(1)))
    func awaitNextTick() async throws {
        guard let url = Bundle.module.url(forResource: "test-nexttick-await", withExtension: "js") else {
            Issue.record("test-nexttick-await.js not found"); return
        }

        let bp = BunProcess(bundle: url)
        let lines = Lines()
        Task { for await line in bp.stdout { lines.append(line.trimmingCharacters(in: .newlines)) } }

        let code = try await bp.run()
        try await Task.sleep(for: .milliseconds(100))

        print("[nexttick-await] stdout: \(lines.values)")
        #expect(code == 0)
        #expect(lines.values.contains("before-nexttick-await"))
        #expect(lines.values.contains("nexttick-fired"))
        #expect(lines.values.contains("after-nexttick-await"))
    }

    // MARK: - 5. All modules comprehensive

    @Test(.timeLimit(.minutes(1)))
    func allModules() async throws {
        guard let url = Bundle.module.url(forResource: "test-all-modules", withExtension: "js") else {
            Issue.record("test-all-modules.js not found"); return
        }

        let bp = BunProcess(bundle: url)
        let lines = Lines()
        Task { for await line in bp.stdout { lines.append(line.trimmingCharacters(in: .newlines)) } }

        let code = try await bp.run()
        try await Task.sleep(for: .milliseconds(100))

        let failures = lines.values.filter { $0.hasPrefix("FAIL:") }
        let summary = lines.values.first(where: { $0.hasPrefix("SUMMARY:") }) ?? "SUMMARY:?/?"

        print("[all-modules] \(summary)")
        for f in failures {
            print("[all-modules] \(f)")
        }

        #expect(failures.isEmpty, "Failed tests: \(failures)")
        #expect(code == 0)
    }
}
