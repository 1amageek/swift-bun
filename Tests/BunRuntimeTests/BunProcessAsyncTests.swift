import Testing
import Foundation
import Synchronization
@testable import BunRuntime
import TestHeartbeat

@Suite("BunProcess Async", .serialized, .heartbeat)
struct BunProcessAsyncTests {

    @Test func promiseResolve() async throws {
        let url = try tempBundle("""
            Promise.resolve(42).then(function(v) {
                process.exit(v === 42 ? 0 : 1);
            });
        """)
        defer { try? FileManager.default.removeItem(at: url) }
        #expect(try await TestProcessSupport.run(BunProcess(bundle: url)) == 0)
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
        #expect(try await TestProcessSupport.run(BunProcess(bundle: url)) == 0)
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
        #expect(try await TestProcessSupport.run(BunProcess(bundle: url)) == 0)
    }

    @Test func naturalExitWaitsForPromiseContinuationAfterTimer() async throws {
        let url = try tempBundle("""
            (async function() {
                await new Promise(function(resolve) {
                    setTimeout(resolve, 0);
                });
                process.stdout.write('after-await\\n');
            })();
        """)
        defer { try? FileManager.default.removeItem(at: url) }

        let process = BunProcess(bundle: url)
        let lines = LinesCollector()
        let collect = Task { [lines] in
            for await line in process.stdout {
                lines.append(line)
            }
        }

        #expect(try await TestProcessSupport.run(process) == 0)
        _ = await collect.result
        #expect(lines.values.contains("after-await\n"))
    }

    @Test func nextTick() async throws {
        let url = try tempBundle("""
            var called = false;
            process.nextTick(function() { called = true; });
            setTimeout(function() { process.exit(called ? 0 : 1); }, 10);
        """)
        defer { try? FileManager.default.removeItem(at: url) }
        #expect(try await TestProcessSupport.run(BunProcess(bundle: url)) == 0)
    }

    @Test func nextTickWithoutTimer() async throws {
        let url = try tempBundle("""
            process.nextTick(function() { process.exit(0); });
        """)
        defer { try? FileManager.default.removeItem(at: url) }
        #expect(try await TestProcessSupport.run(BunProcess(bundle: url)) == 0)
    }

    @Test func microtask() async throws {
        let url = try tempBundle("""
            var called = false;
            queueMicrotask(function() { called = true; });
            setTimeout(function() { process.exit(called ? 0 : 1); }, 10);
        """)
        defer { try? FileManager.default.removeItem(at: url) }
        #expect(try await TestProcessSupport.run(BunProcess(bundle: url)) == 0)
    }

    @Test func microtaskWithoutTimer() async throws {
        let url = try tempBundle("""
            queueMicrotask(function() { process.exit(0); });
        """)
        defer { try? FileManager.default.removeItem(at: url) }
        #expect(try await TestProcessSupport.run(BunProcess(bundle: url)) == 0)
    }

    @Test func schedulerOrdering() async throws {
        let url = try tempBundle("""
            var order = [];
            order.push('sync');
            process.nextTick(function() { order.push('nextTick'); });
            Promise.resolve().then(function() { order.push('microtask'); });
            setTimeout(function() {
                order.push('timer');
                process.stdout.write(JSON.stringify(order));
                process.exit(0);
            }, 0);
        """)
        defer {
            do {
                try FileManager.default.removeItem(at: url)
            } catch {
            }
        }

        let process = BunProcess(bundle: url)
        let lines = LinesCollector()
        let collect = Task { [lines] in
            for await line in process.stdout {
                lines.append(line)
            }
        }

        _ = try await TestProcessSupport.run(process)
        _ = await collect.result
        #expect(lines.values.joined() == #"["sync","nextTick","microtask","timer"]"#)
    }

    @Test func fsPromiseContinuationWithoutTimer() async throws {
        let fileURL = FileManager.default.temporaryDirectory.appendingPathComponent("swift-bun-fs-\(UUID().uuidString).txt")
        try "ok".write(to: fileURL, atomically: true, encoding: .utf8)
        defer {
            do {
                try FileManager.default.removeItem(at: fileURL)
            } catch {
            }
        }

        let url = try tempBundle("""
            require('node:fs').promises.readFile('\(fileURL.path)', 'utf8').then(function(text) {
                process.exit(text === 'ok' ? 0 : 1);
            }, function() {
                process.exit(1);
            });
        """)
        defer {
            do {
                try FileManager.default.removeItem(at: url)
            } catch {
            }
        }

        #expect(try await TestProcessSupport.run(BunProcess(bundle: url)) == 0)
    }

    @Test func nextTickStormDoesNotStarveFetch() async throws {
        try await withLocalHTTPServer { baseURL in
            let url = try tempBundle("""
                var completed = false;
                fetch('\(baseURL)/get')
                    .then(function(response) { return response.text(); })
                    .then(function(body) { completed = body.length > 0; });

                var remaining = 20000;
                (function spin() {
                    if (remaining-- <= 0) {
                        var retries = 50;
                        (function waitForFetch() {
                            if (completed) {
                                process.exit(0);
                                return;
                            }
                            if (retries-- <= 0) {
                                process.exit(1);
                                return;
                            }
                            setTimeout(waitForFetch, 10);
                        })();
                        return;
                    }
                    process.nextTick(spin);
                })();
            """)
            defer {
                do {
                    try FileManager.default.removeItem(at: url)
                } catch {
                }
            }

            #expect(try await TestProcessSupport.run(BunProcess(bundle: url)) == 0)
        }
    }

    @Test func nextTickStormDoesNotStarveTimer() async throws {
        let url = try tempBundle("""
            var timerFired = false;
            setTimeout(function() {
                timerFired = true;
            }, 0);

            var remaining = 20000;
            (function spin() {
                if (remaining-- <= 0) {
                    var retries = 50;
                    (function waitForTimer() {
                        if (timerFired) {
                            process.exit(0);
                            return;
                        }
                        if (retries-- <= 0) {
                            process.exit(1);
                            return;
                        }
                        setTimeout(waitForTimer, 10);
                    })();
                    return;
                }
                process.nextTick(spin);
            })();
        """)
        defer {
            do {
                try FileManager.default.removeItem(at: url)
            } catch {
            }
        }

        #expect(try await TestProcessSupport.run(BunProcess(bundle: url)) == 0)
    }

    @Test func hostCallbackBudgetIsConfigurable() async throws {
        let url = try tempBundle("""
            var completed = 0;
            var target = 100;
            for (var i = 0; i < target; i++) {
                setTimeout(function() {
                    completed += 1;
                    if (completed === target) {
                        process.exit(0);
                    }
                }, 0);
            }
        """)
        defer {
            do {
                try FileManager.default.removeItem(at: url)
            } catch {
            }
        }

        func runAndCollectBudgetLogs(hostBudget: Int) async throws -> [String] {
            let process = BunProcess(
                bundle: url,
                diagnosticsEnabled: true,
                hostCallbackBudgetPerTurn: hostBudget
            )
            let outputTask = Task { () -> [String] in
                var lines: [String] = []
                for await line in process.output {
                    lines.append(line)
                }
                return lines
            }

            let exitCode = try await TestProcessSupport.run(process)
            let output = await outputTask.value
            #expect(exitCode == 0)
            return output
        }

        let lowBudgetOutput = try await runAndCollectBudgetLogs(hostBudget: 16)
        let highBudgetOutput = try await runAndCollectBudgetLogs(hostBudget: 256)

        #expect(lowBudgetOutput.contains { $0.contains("host callback budget exhausted at 16") })
        #expect(!highBudgetOutput.contains { $0.contains("host callback budget exhausted at 256") })
    }
}
