import Testing
import Foundation
import Synchronization
@testable import BunRuntime
import TestHeartbeat

@Suite("BunProcess Stdio", .serialized, .heartbeat)
struct BunProcessStdioTests {

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

    // MARK: - process API completeness

    @Test func processGetuid() async throws {
        let url = try tempBundle("process.exit(typeof process.getuid() === 'number' ? 0 : 1);")
        defer { try? FileManager.default.removeItem(at: url) }
        #expect(try await BunProcess(bundle: url).run() == 0)
    }

    @Test func processExitCode() async throws {
        let url = try tempBundle("""
            process.exitCode = 0;
            process.exitCode = 42;
            process.exit(process.exitCode === 42 ? 0 : 1);
        """)
        defer { try? FileManager.default.removeItem(at: url) }
        #expect(try await BunProcess(bundle: url).run() == 0)
    }

    @Test func processExitCodeDefaultsToUndefined() async throws {
        let url = try tempBundle("""
            process.exit(process.exitCode === undefined ? 0 : 1);
        """)
        defer { try? FileManager.default.removeItem(at: url) }
        #expect(try await BunProcess(bundle: url).run() == 0)
    }

    @Test func processReport() async throws {
        let url = try tempBundle("process.exit(typeof process.report === 'object' ? 0 : 1);")
        defer { try? FileManager.default.removeItem(at: url) }
        #expect(try await BunProcess(bundle: url).run() == 0)
    }

    @Test func stdinIsReadableNotWritable() async throws {
        let url = try tempBundle("""
            var ok = process.stdin.readable === true &&
                     typeof process.stdin.read === 'function' &&
                     typeof process.stdin.write === 'undefined' &&
                     process.stdin.writable !== true;
            process.exit(ok ? 0 : 1);
        """)
        defer { try? FileManager.default.removeItem(at: url) }
        #expect(try await BunProcess(bundle: url).run() == 0)
    }

    @Test func stdoutWritable() async throws {
        let url = try tempBundle("process.exit(process.stdout.writable === true ? 0 : 1);")
        defer { try? FileManager.default.removeItem(at: url) }
        #expect(try await BunProcess(bundle: url).run() == 0)
    }

    @Test func stdoutRemoveListener() async throws {
        let url = try tempBundle("""
            var result = process.stdout.removeListener('drain', function(){});
            process.exit(result === process.stdout ? 0 : 1);
        """)
        defer { try? FileManager.default.removeItem(at: url) }
        #expect(try await BunProcess(bundle: url).run() == 0)
    }

    @Test func stderrIsWritable() async throws {
        let url = try tempBundle("""
            var ok = process.stderr.writable === true &&
                     typeof process.stderr.write === 'function' &&
                     process.stderr.fd === 2;
            process.exit(ok ? 0 : 1);
        """)
        defer { try? FileManager.default.removeItem(at: url) }
        #expect(try await BunProcess(bundle: url).run() == 0)
    }

    @Test func stderrFd() async throws {
        let url = try tempBundle("process.exit(process.stderr.fd === 2 ? 0 : 1);")
        defer { try? FileManager.default.removeItem(at: url) }
        #expect(try await BunProcess(bundle: url).run() == 0)
    }

    @Test func stdoutFd() async throws {
        let url = try tempBundle("process.exit(process.stdout.fd === 1 ? 0 : 1);")
        defer { try? FileManager.default.removeItem(at: url) }
        #expect(try await BunProcess(bundle: url).run() == 0)
    }

    @Test func stdinFd() async throws {
        let url = try tempBundle("process.exit(process.stdin.fd === 0 ? 0 : 1);")
        defer { try? FileManager.default.removeItem(at: url) }
        #expect(try await BunProcess(bundle: url).run() == 0)
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
}
