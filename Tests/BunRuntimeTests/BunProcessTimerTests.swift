import Testing
import Foundation
import Synchronization
@testable import BunRuntime
import TestHeartbeat

@Suite("BunProcess Timers", .serialized, .heartbeat)
struct BunProcessTimerTests {

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

    @Test func timeoutHandleUnref() async throws {
        let url = try tempBundle("""
            var handle = setTimeout(function() { process.exit(1); }, 100);
            process.exit(
                typeof handle.unref === 'function' &&
                typeof handle.ref === 'function' &&
                typeof handle.hasRef === 'function' &&
                handle.hasRef() === true &&
                handle.unref().hasRef() === false ? 0 : 1
            );
        """)
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
}
