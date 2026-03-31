import Testing
import Foundation
import Synchronization
@testable import BunRuntime

private final class LinesCollector: Sendable {
    private let storage = Mutex<[String]>([])
    func append(_ line: String) { storage.withLock { $0.append(line) } }
    var values: [String] { storage.withLock { $0 } }
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

    // MARK: - Timers

    @Test func setTimeout() async throws {
        let url = try tempBundle("setTimeout(function() { process.exit(0); }, 10);")
        defer { try? FileManager.default.removeItem(at: url) }
        #expect(try await BunProcess(bundle: url).run() == 0)
    }

    @Test func setTimeoutArgs() async throws {
        let url = try tempBundle("""
            setTimeout(function(a, b) {
                process.exit(a + b === 30 ? 0 : 1);
            }, 10, 10, 20);
        """)
        defer { try? FileManager.default.removeItem(at: url) }
        #expect(try await BunProcess(bundle: url).run() == 0)
    }

    @Test func clearTimeout() async throws {
        let url = try tempBundle("""
            var id = setTimeout(function() { process.exit(1); }, 200);
            clearTimeout(id);
            setTimeout(function() { process.exit(0); }, 50);
        """)
        defer { try? FileManager.default.removeItem(at: url) }
        #expect(try await BunProcess(bundle: url).run() == 0)
    }

    @Test func nestedTimeout() async throws {
        let url = try tempBundle("""
            setTimeout(function() {
                setTimeout(function() {
                    setTimeout(function() { process.exit(0); }, 5);
                }, 5);
            }, 5);
        """)
        defer { try? FileManager.default.removeItem(at: url) }
        #expect(try await BunProcess(bundle: url).run() == 0)
    }

    @Test func setInterval() async throws {
        let url = try tempBundle("""
            var c = 0;
            var id = setInterval(function() {
                if (++c >= 3) { clearInterval(id); process.exit(0); }
            }, 10);
        """)
        defer { try? FileManager.default.removeItem(at: url) }
        #expect(try await BunProcess(bundle: url).run() == 0)
    }

    @Test func setImmediate() async throws {
        let url = try tempBundle("setImmediate(function() { process.exit(0); });")
        defer { try? FileManager.default.removeItem(at: url) }
        #expect(try await BunProcess(bundle: url).run() == 0)
    }

    @Test func requireTimers() async throws {
        let url = try tempBundle("""
            var t = require('node:timers');
            t.setTimeout(function() { process.exit(0); }, 10);
        """)
        defer { try? FileManager.default.removeItem(at: url) }
        #expect(try await BunProcess(bundle: url).run() == 0)
    }

    @Test func timersPromises() async throws {
        let url = try tempBundle("""
            require('node:timers/promises').setTimeout(10)
                .then(function() { process.exit(0); });
        """)
        defer { try? FileManager.default.removeItem(at: url) }
        #expect(try await BunProcess(bundle: url).run() == 0)
    }

    // MARK: - Promises & async

    @Test func promiseResolve() async throws {
        let url = try tempBundle("""
            Promise.resolve(42).then(function(v) {
                process.exit(v === 42 ? 0 : 1);
            });
        """)
        defer { try? FileManager.default.removeItem(at: url) }
        #expect(try await BunProcess(bundle: url).run() == 0)
    }

    @Test func promiseWithTimeout() async throws {
        let url = try tempBundle("""
            new Promise(function(resolve) {
                setTimeout(function() { resolve('ok'); }, 10);
            }).then(function(v) {
                process.exit(v === 'ok' ? 0 : 1);
            });
        """)
        defer { try? FileManager.default.removeItem(at: url) }
        #expect(try await BunProcess(bundle: url).run() == 0)
    }

    @Test func asyncAwait() async throws {
        let url = try tempBundle("""
            (async function() {
                var r = await new Promise(function(resolve) {
                    setTimeout(function() { resolve(99); }, 10);
                });
                process.exit(r === 99 ? 0 : 1);
            })();
        """)
        defer { try? FileManager.default.removeItem(at: url) }
        #expect(try await BunProcess(bundle: url).run() == 0)
    }

    @Test func nextTick() async throws {
        let url = try tempBundle("""
            var called = false;
            process.nextTick(function() { called = true; });
            setTimeout(function() { process.exit(called ? 0 : 1); }, 10);
        """)
        defer { try? FileManager.default.removeItem(at: url) }
        #expect(try await BunProcess(bundle: url).run() == 0)
    }

    @Test func microtask() async throws {
        let url = try tempBundle("""
            var called = false;
            queueMicrotask(function() { called = true; });
            setTimeout(function() { process.exit(called ? 0 : 1); }, 10);
        """)
        defer { try? FileManager.default.removeItem(at: url) }
        #expect(try await BunProcess(bundle: url).run() == 0)
    }

    // MARK: - stdin

    @Test func stdinData() async throws {
        let url = try tempBundle("""
            process.stdin.on('data', function(c) {
                process.exit(c === 'hello' ? 0 : 1);
            });
        """)
        defer { try? FileManager.default.removeItem(at: url) }
        let p = BunProcess(bundle: url)
        let task = Task { try await p.run() }
        try await Task.sleep(for: .milliseconds(50))
        p.sendInput("hello".data(using: .utf8)!)
        #expect(try await task.value == 0)
    }

    @Test func stdinEOF() async throws {
        let url = try tempBundle("""
            process.stdin.on('end', function() { process.exit(0); });
        """)
        defer { try? FileManager.default.removeItem(at: url) }
        let p = BunProcess(bundle: url)
        let task = Task { try await p.run() }
        try await Task.sleep(for: .milliseconds(50))
        p.sendInput(nil)
        #expect(try await task.value == 0)
    }

    @Test func stdinAsyncIterator() async throws {
        let url = try tempBundle("""
            (async function() {
                var chunks = [];
                for await (var chunk of process.stdin) {
                    chunks.push(chunk);
                    if (chunks.length >= 2) break;
                }
                process.exit(chunks.join(',') === 'a,b' ? 0 : 1);
            })();
        """)
        defer { try? FileManager.default.removeItem(at: url) }
        let p = BunProcess(bundle: url)
        let task = Task { try await p.run() }
        try await Task.sleep(for: .milliseconds(50))
        p.sendInput("a".data(using: .utf8)!)
        try await Task.sleep(for: .milliseconds(10))
        p.sendInput("b".data(using: .utf8)!)
        #expect(try await task.value == 0)
    }

    @Test func stdinPipe() async throws {
        let url = try tempBundle("""
            var output = '';
            var writable = {
                write: function(chunk) { output += chunk; },
                end: function() {
                    process.exit(output === 'hello' ? 0 : 1);
                }
            };
            process.stdin.pipe(writable);
        """)
        defer { try? FileManager.default.removeItem(at: url) }
        let p = BunProcess(bundle: url)
        let task = Task { try await p.run() }
        try await Task.sleep(for: .milliseconds(50))
        p.sendInput("hello".data(using: .utf8)!)
        try await Task.sleep(for: .milliseconds(10))
        p.sendInput(nil) // EOF triggers end
        #expect(try await task.value == 0)
    }

    @Test func stdinRead() async throws {
        let url = try tempBundle("""
            process.stdin.on('readable', function() {
                var chunk = process.stdin.read();
                if (chunk !== null) {
                    process.exit(chunk === 'test' ? 0 : 1);
                }
            });
        """)
        defer { try? FileManager.default.removeItem(at: url) }
        let p = BunProcess(bundle: url)
        let task = Task { try await p.run() }
        try await Task.sleep(for: .milliseconds(50))
        p.sendInput("test".data(using: .utf8)!)
        #expect(try await task.value == 0)
    }

    @Test func stdinKeepsProcessAlive() async throws {
        // Process registers stdin.on('data') but receives no data yet.
        // The process must NOT exit immediately — stdin listener is an active handle.
        let url = try tempBundle("""
            process.stdin.on('data', function(chunk) {
                process.exit(chunk === 'go' ? 0 : 1);
            });
            // No process.exit here — process should stay alive waiting for stdin
        """)
        defer { try? FileManager.default.removeItem(at: url) }
        let p = BunProcess(bundle: url)
        let task = Task { try await p.run() }

        // Wait 200ms — if process exited already, task.value would be available
        try await Task.sleep(for: .milliseconds(200))

        // Send data to unblock
        p.sendInput("go".data(using: .utf8)!)
        #expect(try await task.value == 0)
    }

    @Test func stdinUnrefOnEndWithListener() async throws {
        let url = try tempBundle("""
            process.stdin.on('data', function() {});
            process.stdin.on('end', function() {});
        """)
        defer { try? FileManager.default.removeItem(at: url) }
        let p = BunProcess(bundle: url)
        let task = Task { try await p.run() }
        try await Task.sleep(for: .milliseconds(50))
        p.sendInput(nil)
        #expect(try await task.value == 0)
    }

    @Test func stdinUnrefOnEndWithoutListener() async throws {
        // Even without an 'end' listener, emit('end') must still unref stdin.
        let url = try tempBundle("""
            process.stdin.on('data', function() {});
            // No 'end' listener registered
        """)
        defer { try? FileManager.default.removeItem(at: url) }
        let p = BunProcess(bundle: url)
        let task = Task { try await p.run() }
        try await Task.sleep(for: .milliseconds(50))
        p.sendInput(nil)
        #expect(try await task.value == 0)
    }

    @Test func stdinUnrefOnRemoveListener() async throws {
        // Removing all data listeners should unref stdin.
        let url = try tempBundle("""
            var handler = function() {};
            process.stdin.on('data', handler);
            // Immediately remove — should unref and allow natural exit
            process.stdin.removeListener('data', handler);
            // No active handles → exit naturally
        """)
        defer { try? FileManager.default.removeItem(at: url) }
        #expect(try await BunProcess(bundle: url).run() == 0)
    }

    // MARK: - stdout and output

    @Test func stdoutWrite() async throws {
        let url = try tempBundle("""
            process.stdout.write('line1\\n');
            process.stdout.write('line2\\n');
            process.exit(0);
        """)
        defer { try? FileManager.default.removeItem(at: url) }
        let p = BunProcess(bundle: url)
        let lines = LinesCollector()
        let collect = Task { [lines] in
            for await line in p.stdout { lines.append(line) }
        }
        _ = try await p.run()
        collect.cancel()
        #expect(lines.values.contains("line1\n"))
        #expect(lines.values.contains("line2\n"))
    }

    @Test func stdoutSeparateFromConsole() async throws {
        let url = try tempBundle("""
            process.stdout.write('DATA\\n');
            console.log('debug');
            process.exit(0);
        """)
        defer { try? FileManager.default.removeItem(at: url) }
        let p = BunProcess(bundle: url)
        let stdoutLines = LinesCollector()
        let outputLines = LinesCollector()
        let c1 = Task { [stdoutLines] in for await l in p.stdout { stdoutLines.append(l) } }
        let c2 = Task { [outputLines] in for await l in p.output { outputLines.append(l) } }
        _ = try await p.run()
        c1.cancel(); c2.cancel()

        #expect(stdoutLines.values.contains("DATA\n"))
        #expect(!stdoutLines.values.contains { $0.contains("debug") })
        #expect(outputLines.values.contains("[log] debug"))
        #expect(!outputLines.values.contains { $0.contains("DATA") })
    }

    @Test func consoleOutput() async throws {
        let url = try tempBundle("""
            console.log('hello');
            console.error('bad');
            process.exit(0);
        """)
        defer { try? FileManager.default.removeItem(at: url) }
        let p = BunProcess(bundle: url)
        let lines = LinesCollector()
        let collect = Task { [lines] in for await l in p.output { lines.append(l) } }
        _ = try await p.run()
        collect.cancel()
        #expect(lines.values.contains("[log] hello"))
        #expect(lines.values.contains("[error] bad"))
    }

    // MARK: - argv and cwd

    @Test func processArgv() async throws {
        let url = try tempBundle("""
            var ok = process.argv[0] === 'node' &&
                     process.argv[2] === '-p' &&
                     process.argv[3] === '--verbose';
            process.exit(ok ? 0 : 1);
        """)
        defer { try? FileManager.default.removeItem(at: url) }
        #expect(try await BunProcess(bundle: url, arguments: ["-p", "--verbose"]).run() == 0)
    }

    @Test func processArgvBundlePath() async throws {
        let url = try tempBundle("""
            process.exit(process.argv[1].endsWith('.js') ? 0 : 1);
        """)
        defer { try? FileManager.default.removeItem(at: url) }
        #expect(try await BunProcess(bundle: url).run() == 0)
    }

    @Test func processCwd() async throws {
        let url = try tempBundle("""
            process.exit(process.cwd() === '/tmp/test' ? 0 : 1);
        """)
        defer { try? FileManager.default.removeItem(at: url) }
        #expect(try await BunProcess(bundle: url, cwd: "/tmp/test").run() == 0)
    }

    // MARK: - Library mode

    @Test func loadAndEval() async throws {
        let url = try tempBundle("function add(a, b) { return a + b; }")
        defer { try? FileManager.default.removeItem(at: url) }
        let p = BunProcess(bundle: url)
        try await p.load()
        #expect(try await p.evaluate(js: "add(2, 3)").int32Value == 5)
    }

    @Test func requireAfterLoad() async throws {
        let url = try tempBundle("var path = require('node:path');")
        defer { try? FileManager.default.removeItem(at: url) }
        let p = BunProcess(bundle: url)
        try await p.load()
        #expect(try await p.evaluate(js: "path.join('/usr', 'local')").stringValue == "/usr/local")
    }

    @Test func bareContext() async throws {
        let p = BunProcess()
        try await p.load()
        #expect(try await p.evaluate(js: "1 + 2").int32Value == 3)
    }
}
