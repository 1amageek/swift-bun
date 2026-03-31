import Testing
import Foundation
@testable import BunRuntime

/// Helper to create a temporary JS bundle file for testing.
private func createTempBundle(_ js: String) throws -> URL {
    let tmp = FileManager.default.temporaryDirectory
        .appendingPathComponent(UUID().uuidString + ".js")
    try js.write(to: tmp, atomically: true, encoding: .utf8)
    return tmp
}

@Suite("BunProcess")
struct BunProcessTests {

    @Test func simpleExit() async throws {
        let process = BunProcess()
        let url = try createTempBundle("process.exit(0);")
        defer { try? FileManager.default.removeItem(at: url) }
        let code = try await process.run(bundle: url)
        #expect(code == 0)
    }

    @Test func exitWithCode() async throws {
        let process = BunProcess()
        let url = try createTempBundle("process.exit(42);")
        defer { try? FileManager.default.removeItem(at: url) }
        let code = try await process.run(bundle: url)
        #expect(code == 42)
    }

    @Test func setTimeoutFires() async throws {
        let process = BunProcess()
        let url = try createTempBundle("""
            var fired = false;
            setTimeout(function() {
                fired = true;
                process.exit(fired ? 0 : 1);
            }, 10);
        """)
        defer { try? FileManager.default.removeItem(at: url) }
        let code = try await process.run(bundle: url)
        #expect(code == 0)
    }

    @Test func clearTimeoutPreventsCallback() async throws {
        let process = BunProcess()
        let url = try createTempBundle("""
            var id = setTimeout(function() {
                process.exit(1);
            }, 200);
            clearTimeout(id);
            setTimeout(function() {
                process.exit(0);
            }, 50);
        """)
        defer { try? FileManager.default.removeItem(at: url) }
        let code = try await process.run(bundle: url)
        #expect(code == 0)
    }

    @Test func naturalExitWhenNoPendingWork() async throws {
        let process = BunProcess()
        let url = try createTempBundle("""
            setTimeout(function() {
                // After this fires, refCount drops to 0 and process exits naturally
            }, 10);
        """)
        defer { try? FileManager.default.removeItem(at: url) }
        let code = try await process.run(bundle: url)
        #expect(code == 0)
    }

    @Test func setIntervalRepeats() async throws {
        let process = BunProcess()
        let url = try createTempBundle("""
            var count = 0;
            var id = setInterval(function() {
                count++;
                if (count >= 3) {
                    clearInterval(id);
                    process.exit(0);
                }
            }, 10);
        """)
        defer { try? FileManager.default.removeItem(at: url) }
        let code = try await process.run(bundle: url)
        #expect(code == 0)
    }

    @Test func promiseResolution() async throws {
        let process = BunProcess()
        let url = try createTempBundle("""
            Promise.resolve(42).then(function(value) {
                process.exit(value === 42 ? 0 : 1);
            });
        """)
        defer { try? FileManager.default.removeItem(at: url) }
        let code = try await process.run(bundle: url)
        #expect(code == 0)
    }

    @Test func nestedSetTimeout() async throws {
        let process = BunProcess()
        let url = try createTempBundle("""
            setTimeout(function() {
                setTimeout(function() {
                    setTimeout(function() {
                        process.exit(0);
                    }, 5);
                }, 5);
            }, 5);
        """)
        defer { try? FileManager.default.removeItem(at: url) }
        let code = try await process.run(bundle: url)
        #expect(code == 0)
    }

    @Test func setTimeoutWithArgs() async throws {
        let process = BunProcess()
        let url = try createTempBundle("""
            setTimeout(function(a, b) {
                process.exit(a + b === 30 ? 0 : 1);
            }, 10, 10, 20);
        """)
        defer { try? FileManager.default.removeItem(at: url) }
        let code = try await process.run(bundle: url)
        #expect(code == 0)
    }

    @Test func stdinReceivesData() async throws {
        let process = BunProcess()
        let url = try createTempBundle("""
            process.stdin.on('data', function(chunk) {
                if (chunk === 'hello') process.exit(0);
                else process.exit(1);
            });
        """)
        defer { try? FileManager.default.removeItem(at: url) }

        let task = Task {
            try await process.run(bundle: url)
        }

        try await Task.sleep(for: .milliseconds(50))
        process.sendInput("hello".data(using: .utf8)!)

        let code = try await task.value
        #expect(code == 0)
    }

    @Test func stdinEOF() async throws {
        let process = BunProcess()
        let url = try createTempBundle("""
            process.stdin.on('end', function() {
                process.exit(0);
            });
        """)
        defer { try? FileManager.default.removeItem(at: url) }

        let task = Task {
            try await process.run(bundle: url)
        }

        try await Task.sleep(for: .milliseconds(50))
        process.sendInput(nil)

        let code = try await task.value
        #expect(code == 0)
    }

    @Test func requireTimersModule() async throws {
        let process = BunProcess()
        let url = try createTempBundle("""
            var timers = require('node:timers');
            timers.setTimeout(function() {
                process.exit(0);
            }, 10);
        """)
        defer { try? FileManager.default.removeItem(at: url) }
        let code = try await process.run(bundle: url)
        #expect(code == 0)
    }

    @Test func terminateFromSwift() async throws {
        let process = BunProcess()
        let url = try createTempBundle("""
            // Keep alive with an interval
            setInterval(function() {}, 1000);
        """)
        defer { try? FileManager.default.removeItem(at: url) }

        let task = Task {
            try await process.run(bundle: url)
        }

        try await Task.sleep(for: .milliseconds(50))
        process.terminate(exitCode: 7)

        let code = try await task.value
        #expect(code == 7)
    }

    @Test func environmentVariables() async throws {
        let process = BunProcess()
        let url = try createTempBundle("""
            process.exit(process.env.TEST_KEY === 'test_value' ? 0 : 1);
        """)
        defer { try? FileManager.default.removeItem(at: url) }
        let code = try await process.run(bundle: url, environment: ["TEST_KEY": "test_value"])
        #expect(code == 0)
    }
}
