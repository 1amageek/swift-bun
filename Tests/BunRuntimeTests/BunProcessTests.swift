import Testing
import Foundation
@testable import BunRuntime

private final class LinesCollector: @unchecked Sendable {
    private var storage: [String] = []
    private let lock = NSLock()
    func append(_ line: String) { lock.lock(); storage.append(line); lock.unlock() }
    var values: [String] { lock.lock(); defer { lock.unlock() }; return storage }
}

private func tempBundle(_ js: String) throws -> URL {
    let url = FileManager.default.temporaryDirectory
        .appendingPathComponent(UUID().uuidString + ".js")
    try js.write(to: url, atomically: true, encoding: .utf8)
    return url
}

@Suite("BunProcess")
struct BunProcessTests {

    // MARK: - Lifecycle

    @Test func exitWithCode() async throws {
        let p = BunProcess()
        let url = try tempBundle("process.exit(42);")
        defer { try? FileManager.default.removeItem(at: url) }
        #expect(try await p.run(bundle: url) == 42)
    }

    @Test func exitCodeZeroByDefault() async throws {
        let p = BunProcess()
        let url = try tempBundle("process.exit();")
        defer { try? FileManager.default.removeItem(at: url) }
        #expect(try await p.run(bundle: url) == 0)
    }

    @Test func naturalExit() async throws {
        let p = BunProcess()
        let url = try tempBundle("setTimeout(function() {}, 10);")
        defer { try? FileManager.default.removeItem(at: url) }
        #expect(try await p.run(bundle: url) == 0)
    }

    @Test func terminate() async throws {
        let p = BunProcess()
        let url = try tempBundle("setInterval(function() {}, 1000);")
        defer { try? FileManager.default.removeItem(at: url) }
        let task = Task { try await p.run(bundle: url) }
        try await Task.sleep(for: .milliseconds(50))
        p.terminate(exitCode: 7)
        #expect(try await task.value == 7)
    }

    @Test func envVars() async throws {
        let p = BunProcess()
        let url = try tempBundle("process.exit(process.env.K === 'V' ? 0 : 1);")
        defer { try? FileManager.default.removeItem(at: url) }
        #expect(try await p.run(bundle: url, environment: ["K": "V"]) == 0)
    }

    @Test func bundleNotFound() async throws {
        let p = BunProcess()
        await #expect(throws: BunRuntimeError.self) {
            try await p.run(bundle: URL(fileURLWithPath: "/nonexistent.js"))
        }
    }

    @Test func jsException() async throws {
        let p = BunProcess()
        let url = try tempBundle("throw new Error('boom');")
        defer { try? FileManager.default.removeItem(at: url) }
        await #expect(throws: BunRuntimeError.self) {
            try await p.run(bundle: url)
        }
    }

    // MARK: - Timers

    @Test func setTimeout() async throws {
        let p = BunProcess()
        let url = try tempBundle("setTimeout(function() { process.exit(0); }, 10);")
        defer { try? FileManager.default.removeItem(at: url) }
        #expect(try await p.run(bundle: url) == 0)
    }

    @Test func setTimeoutArgs() async throws {
        let p = BunProcess()
        let url = try tempBundle("""
            setTimeout(function(a, b) {
                process.exit(a + b === 30 ? 0 : 1);
            }, 10, 10, 20);
        """)
        defer { try? FileManager.default.removeItem(at: url) }
        #expect(try await p.run(bundle: url) == 0)
    }

    @Test func clearTimeout() async throws {
        let p = BunProcess()
        let url = try tempBundle("""
            var id = setTimeout(function() { process.exit(1); }, 200);
            clearTimeout(id);
            setTimeout(function() { process.exit(0); }, 50);
        """)
        defer { try? FileManager.default.removeItem(at: url) }
        #expect(try await p.run(bundle: url) == 0)
    }

    @Test func nestedTimeout() async throws {
        let p = BunProcess()
        let url = try tempBundle("""
            setTimeout(function() {
                setTimeout(function() {
                    setTimeout(function() { process.exit(0); }, 5);
                }, 5);
            }, 5);
        """)
        defer { try? FileManager.default.removeItem(at: url) }
        #expect(try await p.run(bundle: url) == 0)
    }

    @Test func setInterval() async throws {
        let p = BunProcess()
        let url = try tempBundle("""
            var c = 0;
            var id = setInterval(function() {
                if (++c >= 3) { clearInterval(id); process.exit(0); }
            }, 10);
        """)
        defer { try? FileManager.default.removeItem(at: url) }
        #expect(try await p.run(bundle: url) == 0)
    }

    @Test func setImmediate() async throws {
        let p = BunProcess()
        let url = try tempBundle("setImmediate(function() { process.exit(0); });")
        defer { try? FileManager.default.removeItem(at: url) }
        #expect(try await p.run(bundle: url) == 0)
    }

    @Test func requireTimers() async throws {
        let p = BunProcess()
        let url = try tempBundle("""
            var t = require('node:timers');
            t.setTimeout(function() { process.exit(0); }, 10);
        """)
        defer { try? FileManager.default.removeItem(at: url) }
        #expect(try await p.run(bundle: url) == 0)
    }

    @Test func timersPromises() async throws {
        let p = BunProcess()
        let url = try tempBundle("""
            require('node:timers/promises').setTimeout(10)
                .then(function() { process.exit(0); });
        """)
        defer { try? FileManager.default.removeItem(at: url) }
        #expect(try await p.run(bundle: url) == 0)
    }

    // MARK: - Promises & async

    @Test func promiseResolve() async throws {
        let p = BunProcess()
        let url = try tempBundle("""
            Promise.resolve(42).then(function(v) {
                process.exit(v === 42 ? 0 : 1);
            });
        """)
        defer { try? FileManager.default.removeItem(at: url) }
        #expect(try await p.run(bundle: url) == 0)
    }

    @Test func promiseWithTimeout() async throws {
        let p = BunProcess()
        let url = try tempBundle("""
            new Promise(function(resolve) {
                setTimeout(function() { resolve('ok'); }, 10);
            }).then(function(v) {
                process.exit(v === 'ok' ? 0 : 1);
            });
        """)
        defer { try? FileManager.default.removeItem(at: url) }
        #expect(try await p.run(bundle: url) == 0)
    }

    @Test func asyncAwait() async throws {
        let p = BunProcess()
        let url = try tempBundle("""
            (async function() {
                var r = await new Promise(function(resolve) {
                    setTimeout(function() { resolve(99); }, 10);
                });
                process.exit(r === 99 ? 0 : 1);
            })();
        """)
        defer { try? FileManager.default.removeItem(at: url) }
        #expect(try await p.run(bundle: url) == 0)
    }

    @Test func nextTick() async throws {
        let p = BunProcess()
        let url = try tempBundle("""
            var called = false;
            process.nextTick(function() { called = true; });
            setTimeout(function() { process.exit(called ? 0 : 1); }, 10);
        """)
        defer { try? FileManager.default.removeItem(at: url) }
        #expect(try await p.run(bundle: url) == 0)
    }

    @Test func microtask() async throws {
        let p = BunProcess()
        let url = try tempBundle("""
            var called = false;
            queueMicrotask(function() { called = true; });
            setTimeout(function() { process.exit(called ? 0 : 1); }, 10);
        """)
        defer { try? FileManager.default.removeItem(at: url) }
        #expect(try await p.run(bundle: url) == 0)
    }

    // MARK: - stdin

    @Test func stdinData() async throws {
        let p = BunProcess()
        let url = try tempBundle("""
            process.stdin.on('data', function(c) {
                process.exit(c === 'hello' ? 0 : 1);
            });
        """)
        defer { try? FileManager.default.removeItem(at: url) }
        let task = Task { try await p.run(bundle: url) }
        try await Task.sleep(for: .milliseconds(50))
        p.sendInput("hello".data(using: .utf8)!)
        #expect(try await task.value == 0)
    }

    @Test func stdinEOF() async throws {
        let p = BunProcess()
        let url = try tempBundle("""
            process.stdin.on('end', function() { process.exit(0); });
        """)
        defer { try? FileManager.default.removeItem(at: url) }
        let task = Task { try await p.run(bundle: url) }
        try await Task.sleep(for: .milliseconds(50))
        p.sendInput(nil)
        #expect(try await task.value == 0)
    }

    // MARK: - Output

    @Test func consoleOutput() async throws {
        let p = BunProcess()
        let url = try tempBundle("""
            console.log('hello');
            console.error('bad');
            process.exit(0);
        """)
        defer { try? FileManager.default.removeItem(at: url) }

        let lines = LinesCollector()
        let collect = Task { [lines] in
            for await line in p.output { lines.append(line) }
        }
        _ = try await p.run(bundle: url)
        collect.cancel()

        #expect(lines.values.contains("[log] hello"))
        #expect(lines.values.contains("[error] bad"))
    }

    // MARK: - Library mode

    @Test func loadAndEval() async throws {
        let p = BunProcess()
        let url = try tempBundle("function add(a, b) { return a + b; }")
        defer { try? FileManager.default.removeItem(at: url) }
        try await p.load(bundle: url)
        #expect(try await p.evaluate(js: "add(2, 3)").int32Value == 5)
    }

    @Test func requireAfterLoad() async throws {
        let p = BunProcess()
        let url = try tempBundle("var path = require('node:path');")
        defer { try? FileManager.default.removeItem(at: url) }
        try await p.load(bundle: url)
        #expect(try await p.evaluate(js: "path.join('/usr', 'local')").stringValue == "/usr/local")
    }
}
