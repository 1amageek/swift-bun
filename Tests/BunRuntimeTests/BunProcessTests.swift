import Testing
import Foundation
import Synchronization
@testable import BunRuntime
import TestHeartbeat

// MARK: - Shared test helpers (internal for cross-file access)

final class LinesCollector: Sendable {
    private let storage = Mutex<[String]>([])
    func append(_ line: String) { storage.withLock { $0.append(line) } }
    var values: [String] { storage.withLock { $0 } }
}

func tempBundle(_ js: String) throws -> URL {
    let url = FileManager.default.temporaryDirectory
        .appendingPathComponent(UUID().uuidString + ".js")
    try js.write(to: url, atomically: true, encoding: .utf8)
    return url
}

func withLocalHTTPServer(
    _ body: (String) async throws -> Void
) async throws {
    let server = try await LocalHTTPTestServer.start()
    do {
        try await body(server.baseURL)
        try await server.shutdown()
    } catch {
        do {
            try await server.shutdown()
        } catch {
        }
        throw error
    }
}

// MARK: - BunProcess Lifecycle

@Suite("BunProcess Lifecycle", .serialized, .heartbeat)
struct BunProcessLifecycleTests {

    @Test func exitWithCode() async throws {
        let url = try tempBundle("process.exit(42);")
        defer { try? FileManager.default.removeItem(at: url) }
        let p = BunProcess(bundle: url)
        #expect(try await p.run() == 42)
    }

    @Test func exitZero() async throws {
        let url = try tempBundle("process.exit();")
        defer { try? FileManager.default.removeItem(at: url) }
        #expect(try await BunProcess(bundle: url).run() == 0)
    }

    @Test func naturalExit() async throws {
        let url = try tempBundle("setTimeout(function() {}, 10);")
        defer { try? FileManager.default.removeItem(at: url) }
        #expect(try await BunProcess(bundle: url).run() == 0)
    }

    @Test func startupPromiseKeepsAsyncBundleAlive() async throws {
        let url = try tempBundle("""
            async function vsY() {
                var fs = require('node:fs');
                await fs.promises.readFile(process.argv[1], 'utf8');
                process.exit(0);
            }
            vsY();
        """)
        defer {
            do {
                try FileManager.default.removeItem(at: url)
            } catch {
            }
        }
        #expect(try await BunProcess(bundle: url).run() == 0)
    }

    @Test func startupPromiseKeepsProcessAliveThroughHeavySynchronousContinuation() async throws {
        let url = try tempBundle("""
            async function vsY() {
                var fs = require('node:fs');
                await fs.promises.readFile(process.argv[1], 'utf8');

                var started = Date.now();
                while (Date.now() - started < 50) {
                }

                await fs.promises.readFile(process.argv[1], 'utf8');
                process.exit(0);
            }
            vsY();
        """)
        defer {
            do {
                try FileManager.default.removeItem(at: url)
            } catch {
            }
        }
        #expect(try await BunProcess(bundle: url).run() == 0)
    }

    @Test func terminate() async throws {
        let url = try tempBundle("setInterval(function() {}, 1000);")
        defer { try? FileManager.default.removeItem(at: url) }
        let p = BunProcess(bundle: url)
        let task = Task { try await p.run() }
        try await Task.sleep(for: .milliseconds(50))
        p.terminate(exitCode: 7)
        #expect(try await task.value == 7)
    }

    @Test func envVars() async throws {
        let url = try tempBundle("process.exit(process.env.K === 'V' ? 0 : 1);")
        defer { try? FileManager.default.removeItem(at: url) }
        #expect(try await BunProcess(bundle: url, environment: ["K": "V"]).run() == 0)
    }

    @Test func bundleNotFound() async throws {
        let p = BunProcess(bundle: URL(fileURLWithPath: "/nonexistent.js"))
        await #expect(throws: BunRuntimeError.self) {
            try await p.run()
        }
    }

    @Test func jsException() async throws {
        let url = try tempBundle("throw new Error('boom');")
        defer { try? FileManager.default.removeItem(at: url) }
        await #expect(throws: BunRuntimeError.self) {
            try await BunProcess(bundle: url).run()
        }
    }

    @Test func runWithoutBundle() async throws {
        let p = BunProcess()
        await #expect(throws: BunRuntimeError.self) {
            try await p.run()
        }
    }
}

// MARK: - BunProcess Library Mode

@Suite("BunProcess Library Mode", .serialized, .heartbeat)
struct BunProcessLibraryModeTests {
    private func withLoadedProcess<T: Sendable>(
        _ process: BunProcess = BunProcess(),
        _ body: (BunProcess) async throws -> T
    ) async throws -> T {
        try await TestProcessSupport.withLoadedProcess(process, operation: body)
    }

    @Test func loadAndEval() async throws {
        let url = try tempBundle("function add(a, b) { return a + b; }")
        defer { try? FileManager.default.removeItem(at: url) }
        let result = try await withLoadedProcess(BunProcess(bundle: url)) { process in
            try await process.evaluate(js: "add(2, 3)")
        }
        #expect(result.int32Value == 5)
    }

    @Test func evaluateRejectsPromiseResult() async throws {
        var matched = false
        do {
            _ = try await TestProcessSupport.evaluate("Promise.resolve(42)")
        } catch let error as BunRuntimeError {
            if case .asyncResultRequiresAsyncAPI = error {
                matched = true
            }
        }

        #expect(matched == true)
    }

    @Test func evaluateAsyncResolvesPromise() async throws {
        let result = try await TestProcessSupport.evaluateAsync("Promise.resolve(42)")
        #expect(result.int32Value == 42)
    }

    @Test func evaluateAsyncResolvesPromiseFromNextTick() async throws {
        let result = try await TestProcessSupport.evaluateAsync("""
            new Promise(function(resolve) {
                process.nextTick(function() {
                    resolve(42);
                });
            })
        """)
        #expect(result.int32Value == 42)
    }

    @Test func callAsyncResolvesPromise() async throws {
        let result = try await withLoadedProcess { process in
            try await process.evaluate(js: """
                function asyncAdd(a, b) {
                    return Promise.resolve(a + b);
                }
            """)
            return try await process.callAsync("asyncAdd", arguments: [20, 22])
        }
        #expect(result.int32Value == 42)
    }

    @Test func shutdownFinishesStreams() async throws {
        let process = BunProcess()
        try await process.load()

        let stdoutTask = Task {
            for await _ in process.stdout {
            }
            return true
        }
        let outputTask = Task {
            for await _ in process.output {
            }
            return true
        }

        try await process.shutdown()

        #expect(await stdoutTask.value == true)
        #expect(await outputTask.value == true)
    }

    @Test func shutdownIsIdempotent() async throws {
        let process = BunProcess()
        try await process.load()
        try await process.shutdown()
        try await process.shutdown()
    }

    @Test func evaluateAfterShutdownThrowsShutdownRequired() async throws {
        let process = BunProcess()
        try await process.load()
        try await process.shutdown()

        await #expect(throws: BunRuntimeError.self) {
            try await process.evaluate(js: "1 + 1")
        }
    }

    @Test func shutdownDuringRunFailsRunWithShutdownRequired() async throws {
        let url = try tempBundle("setInterval(function() {}, 1000);")
        defer { try? FileManager.default.removeItem(at: url) }

        let process = BunProcess(bundle: url)
        let runTask = Task { try await process.run() }
        try await Task.sleep(for: .milliseconds(50))
        try await process.shutdown()

        await #expect(throws: BunRuntimeError.self) {
            try await runTask.value
        }
    }

    @Test func loadFailureShutsDownStreams() async throws {
        let url = try tempBundle("throw new Error('boom');")
        defer { try? FileManager.default.removeItem(at: url) }

        let process = BunProcess(bundle: url)
        let stdoutTask = Task {
            for await _ in process.stdout {
            }
            return true
        }
        let outputTask = Task {
            for await _ in process.output {
            }
            return true
        }

        await #expect(throws: BunRuntimeError.self) {
            try await process.load()
        }

        #expect(await stdoutTask.value == true)
        #expect(await outputTask.value == true)
    }

    @Test func runFailureShutsDownStreams() async throws {
        let process = BunProcess(bundle: URL(fileURLWithPath: "/nonexistent.js"))
        let stdoutTask = Task {
            for await _ in process.stdout {
            }
            return true
        }
        let outputTask = Task {
            for await _ in process.output {
            }
            return true
        }

        await #expect(throws: BunRuntimeError.self) {
            try await process.run()
        }

        #expect(await stdoutTask.value == true)
        #expect(await outputTask.value == true)
    }

    @Test func requireAfterLoad() async throws {
        let url = try tempBundle("var path = require('node:path');")
        defer { try? FileManager.default.removeItem(at: url) }
        let result = try await withLoadedProcess(BunProcess(bundle: url)) { process in
            try await process.evaluate(js: "path.join('/usr', 'local')")
        }
        #expect(result.stringValue == "/usr/local")
    }

    @Test func bareContext() async throws {
        let result = try await withLoadedProcess { process in
            try await process.evaluate(js: "1 + 2")
        }
        #expect(result.int32Value == 3)
    }
}
