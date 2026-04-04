import Testing
import Foundation
@testable import BunRuntime
import TestHeartbeat

@Suite("Node.js Process Compatibility", .serialized, .heartbeat)
struct NodeCompatProcessTests {
    private func evaluate(_ js: String) async throws -> JSResult {
        try await TestProcessSupport.withLoadedProcess { process in
            try await process.evaluate(js: js)
        }
    }

    private func withLoadedProcess<T: Sendable>(
        _ process: BunProcess = BunProcess(),
        _ body: (BunProcess) async throws -> T
    ) async throws -> T {
        try await TestProcessSupport.withLoadedProcess(process, operation: body)
    }

    @Test("process.platform is darwin")
    func processPlatform() async throws {
        let result = try await evaluate("process.platform")
        #expect(result.stringValue == "darwin")
    }

    @Test("process.env is accessible")
    func processEnv() async throws {
        let result = try await evaluate("typeof process.env")
        #expect(result.stringValue == "object")
    }

    @Test("console.log does not crash")
    func consoleLog() async throws {
        _ = try await evaluate("console.log('test message from JS')")
    }

    @Test("require('node:os').platform()")
    func osPlatform() async throws {
        let result = try await evaluate("require('node:os').platform()")
        #expect(result.stringValue == "darwin")
    }

    @Test("runtime environment overrides are reflected consistently")
    func runtimeEnvironmentOverrides() async throws {
        let customHome = FileManager.default.temporaryDirectory
            .appendingPathComponent("swift-bun-home-\(UUID().uuidString)", isDirectory: true)
        let customTmp = FileManager.default.temporaryDirectory
            .appendingPathComponent("swift-bun-tmp-\(UUID().uuidString)", isDirectory: true)
        try FileManager.default.createDirectory(at: customHome, withIntermediateDirectories: true)
        try FileManager.default.createDirectory(at: customTmp, withIntermediateDirectories: true)
        defer {
            do { try FileManager.default.removeItem(at: customHome) } catch {}
            do { try FileManager.default.removeItem(at: customTmp) } catch {}
        }

        let result = try await withLoadedProcess(
            BunProcess(
                cwd: customHome.path,
                environment: [
                    "HOME": customHome.path,
                    "TMPDIR": customTmp.path,
                ]
            )
        ) { process in
            try await process.evaluate(js: """
                (function() {
                    var os = require('node:os');
                    return JSON.stringify({
                        cwd: process.cwd(),
                        processHome: process.env.HOME,
                        bunHome: Bun.env.HOME,
                        osHome: os.homedir(),
                        osTmp: os.tmpdir(),
                        userHome: os.userInfo().homedir,
                    });
                })()
            """)
        }

        let data = try #require(result.stringValue.data(using: .utf8))
        let payload = try #require(JSONSerialization.jsonObject(with: data) as? [String: Any])
        #expect(payload["cwd"] as? String == customHome.path)
        #expect(payload["processHome"] as? String == customHome.path)
        #expect(payload["bunHome"] as? String == customHome.path)
        #expect(payload["osHome"] as? String == customHome.path)
        #expect(payload["osTmp"] as? String == customTmp.path)
        #expect(payload["userHome"] as? String == customHome.path)
    }

    @Test("runtime environment can remove inherited auth variables")
    func runtimeEnvironmentRemovesInheritedAuthVariables() async throws {
        let result = try await withLoadedProcess(
            BunProcess(
                environment: [
                    "HOME": FileManager.default.homeDirectoryForCurrentUser.path,
                    "ANTHROPIC_API_KEY": "override-should-not-win",
                ],
                removedEnvironmentKeys: [
                    "ANTHROPIC_API_KEY",
                    "ANTHROPIC_AUTH_TOKEN",
                ]
            )
        ) { process in
            try await process.evaluate(js: """
                (function() {
                    return JSON.stringify({
                        apiKey: Object.prototype.hasOwnProperty.call(process.env, 'ANTHROPIC_API_KEY') ? process.env.ANTHROPIC_API_KEY : null,
                        authToken: Object.prototype.hasOwnProperty.call(process.env, 'ANTHROPIC_AUTH_TOKEN') ? process.env.ANTHROPIC_AUTH_TOKEN : null,
                        home: process.env.HOME
                    });
                })()
            """)
        }

        let data = try #require(result.stringValue.data(using: .utf8))
        let payload = try #require(JSONSerialization.jsonObject(with: data) as? [String: Any])
        #expect(payload["apiKey"] is NSNull)
        #expect(payload["authToken"] is NSNull)
        #expect((payload["home"] as? String)?.isEmpty == false)
    }

    // MARK: - Silent fallback fixes

    @Test("process.chdir throws")
    func processChdirThrows() async throws {
        await #expect(throws: BunRuntimeError.self) {
            try await evaluate("process.chdir('/tmp')")
        }
    }

    @Test("process.kill throws")
    func processKillThrows() async throws {
        await #expect(throws: BunRuntimeError.self) {
            try await evaluate("process.kill(1)")
        }
    }

    @Test("console.time/timeEnd does not throw")
    func consoleTimeEnd() async throws {
        let result = try await evaluate("""
            console.time('t');
            console.timeEnd('t');
            true;
        """)
        #expect(result.boolValue == true)
    }

    @Test("console group count and table emit formatted output")
    func consoleExtras() async throws {
        let collector = NodeCompatLogCollector()
        let outputTask = try await withLoadedProcess { process in
            let outputTask = Task { [collector] in
                for await line in process.output {
                    collector.append(line)
                }
            }

            _ = try await process.evaluate(js: """
                console.group('outer');
                console.count('hits');
                console.table([{ value: 1 }]);
                console.groupEnd();
                console.countReset('hits');
                true;
            """)

            try await Task.sleep(nanoseconds: 50_000_000)
            return outputTask
        }
        _ = await outputTask.result
        let lines = collector.values

        #expect(lines.contains(where: { $0.contains("[log] outer") }))
        #expect(lines.contains(where: { $0.contains("[log]   hits: 1") }))
        #expect(lines.contains(where: { $0.contains("0\t{\"value\":1}") }))
    }

    @Test("console.timeEnd with unknown label does not throw")
    func consoleTimeEndUnknown() async throws {
        let result = try await evaluate("""
            console.timeEnd('nonexistent');
            true;
        """)
        #expect(result.boolValue == true)
    }

    // MARK: - Dynamic values

    @Test("process.pid matches actual process ID")
    func processPidDynamic() async throws {
        let expected = ProcessInfo.processInfo.processIdentifier
        let result = try await evaluate("process.pid")
        #expect(result.int32Value == expected)
    }

    @Test("process.getuid returns actual UID")
    func processGetuidDynamic() async throws {
        let expected = Int32(getuid())
        let result = try await evaluate("process.getuid()")
        #expect(result.int32Value == expected)
    }

    @Test("os.release returns actual version")
    func osReleaseDynamic() async throws {
        let result = try await evaluate("require('node:os').release()")
        let v = ProcessInfo.processInfo.operatingSystemVersion
        let expected = "\(v.majorVersion).\(v.minorVersion).\(v.patchVersion)"
        #expect(result.stringValue == expected)
    }

    @Test("os.userInfo().uid matches process.getuid()")
    func osUserInfoUidConsistency() async throws {
        let result = try await evaluate("""
            var os = require('node:os');
            os.userInfo().uid === process.getuid();
        """)
        #expect(result.boolValue == true)
    }

    @Test("os.version returns non-empty string")
    func osVersion() async throws {
        let result = try await evaluate("require('node:os').version()")
        #expect(result.stringValue.isEmpty == false)
    }

    @Test("performance.mark and measure work")
    func performanceMarkMeasure() async throws {
        let result = try await evaluate("""
            performance.mark('start');
            performance.mark('end');
            performance.measure('duration', 'start', 'end');
            var entries = performance.getEntriesByType('measure');
            entries.length === 1 && entries[0].name === 'duration' && typeof entries[0].duration === 'number';
        """)
        #expect(result.boolValue == true)
    }

    @Test("performance.markResourceTiming records resource entry")
    func performanceMarkResourceTiming() async throws {
        let result = try await evaluate("""
            (function() {
                performance.markResourceTiming(
                    { startTime: 1, duration: 2 },
                    'https://example.com/data',
                    'fetch',
                    globalThis,
                    '',
                    {},
                    200,
                    ''
                );
                var entries = performance.getEntriesByType('resource');
                return JSON.stringify(entries[0]);
            })()
        """)
        #expect(result.stringValue.contains(#""entryType":"resource""#))
        #expect(result.stringValue.contains(#""name":"https://example.com/data""#))
    }

    @Test("process._rawDebug and _getActiveHandles are exposed")
    func processDiagnostics() async throws {
        let collector = NodeCompatLogCollector()
        let result = try await withLoadedProcess { process in
            let outputTask = Task { [collector] in
                for await line in process.output {
                    collector.append(line)
                }
            }

            let result = try await process.evaluate(js: """
                (function() {
                    process._rawDebug('diagnostic line');
                    return JSON.stringify({
                        handles: process._getActiveHandles().length,
                        send: process.send('message')
                    });
                })()
            """)
            try await Task.sleep(nanoseconds: 50_000_000)
            return (result.stringValue, outputTask)
        }
        _ = await result.1.result
        let payload = result.0

        #expect(payload.contains(#""send":false"#))
        #expect(collector.values.contains(where: { $0.contains("[stderr] diagnostic line") }))
    }

    @Test("process._getActiveHandles includes listening servers")
    func processActiveHandlesIncludeServers() async throws {
        let result = try await withLoadedProcess { process in
            try await process.evaluateAsync(js: """
                (async function() {
                    var net = require('node:net');
                    var http = require('node:http');

                    var tcpServer = net.createServer(function() {});
                    await new Promise(function(resolve, reject) {
                        tcpServer.once('error', reject);
                        tcpServer.listen(0, '127.0.0.1', resolve);
                    });
                    var afterTCP = process._getActiveHandles().slice();
                    await new Promise(function(resolve) { tcpServer.close(resolve); });

                    var httpServer = http.createServer(function(req, res) { res.end('ok'); });
                    await new Promise(function(resolve, reject) {
                        httpServer.once('error', reject);
                        httpServer.listen(0, '127.0.0.1', resolve);
                    });
                    var afterHTTP = process._getActiveHandles().slice();
                    await new Promise(function(resolve) { httpServer.close(resolve); });

                    return JSON.stringify({ afterTCP: afterTCP, afterHTTP: afterHTTP });
                })()
            """)
        }

        #expect(result.stringValue.contains(#""TCPServer""#))
        #expect(result.stringValue.contains(#""HTTPServer""#))
    }
}
