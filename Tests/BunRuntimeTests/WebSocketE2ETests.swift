import Testing
import Foundation
@testable import BunRuntime
import TestHeartbeat

@Suite("WebSocket E2E", .serialized, .heartbeat)
struct WebSocketE2ETests {
    private func withWebSocketServer(
        _ body: (LocalWebSocketTestServer) async throws -> Void
    ) async throws {
        try await TestProcessSupport.withExclusiveRuntimeAccess {
            let server = try await LocalWebSocketTestServer.start()
            do {
                try await body(server)
                try await server.shutdown()
            } catch {
                do {
                    try await server.shutdown()
                } catch {
                }
                throw error
            }
        }
    }

    private func removeIfPresent(_ url: URL) {
        guard FileManager.default.fileExists(atPath: url.path) else {
            return
        }

        do {
            try FileManager.default.removeItem(at: url)
        } catch {
        }
    }

    @Test("run() keeps process alive through WebSocket round-trip and exits naturally")
    func runModeWebSocketRoundTrip() async throws {
        try await withWebSocketServer { server in
            let url = try tempBundle("""
                var socket = new WebSocket('\(server.baseURL)');

                socket.onerror = function(event) {
                    console.error(event.message || 'websocket error');
                    process.exit(1);
                };

                socket.onopen = function() {
                    socket.send('e2e-run');
                };

                socket.onmessage = function(event) {
                    process.stdout.write(JSON.stringify({
                        open: socket.readyState === WebSocket.OPEN,
                        data: event.data
                    }) + '\\n');
                    socket.close(1000, 'done');
                };

                socket.onclose = function(event) {
                    if (event.code !== 1000 || event.reason !== 'done') {
                        console.error('unexpected close:' + event.code + ':' + event.reason);
                        process.exit(1);
                    }
                };
            """)
            defer {
                removeIfPresent(url)
            }

            let process = BunProcess(bundle: url)
            let stdout = LinesCollector()
            let output = LinesCollector()
            let stdoutTask = Task { [stdout] in
                for await line in process.stdout {
                    stdout.append(line)
                }
            }
            let outputTask = Task { [output] in
                for await line in process.output {
                    output.append(line)
                }
            }

            let exitCode = try await TestProcessSupport.run(process)
            _ = await stdoutTask.result
            _ = await outputTask.result

            #expect(exitCode == 0)
            #expect(stdout.values.contains(#"{"open":true,"data":"e2e-run"}"# + "\n"))
            #expect(!output.values.contains { $0.contains("websocket error") || $0.contains("unexpected close:") })
        }
    }

    @Test("run() supports CLI-style WebSocket options end to end")
    func runModeWebSocketCLIOptions() async throws {
        try await withWebSocketServer { server in
            let url = try tempBundle("""
                var socket = new WebSocket('\(server.baseURL)', {
                    protocols: ['mcp'],
                    headers: { 'x-test-header': 'ws-e2e' },
                    proxy: undefined,
                    tls: undefined
                });

                socket.onerror = function(event) {
                    console.error(event.message || 'websocket error');
                    process.exit(1);
                };

                socket.onopen = function() {
                    socket.send('cli-options');
                };

                socket.onmessage = function(event) {
                    process.stdout.write(JSON.stringify({
                        protocol: socket.protocol,
                        data: event.data
                    }) + '\\n');
                    socket.close(1000, 'done');
                };
            """)
            defer {
                removeIfPresent(url)
            }

            let process = BunProcess(bundle: url)
            let stdout = LinesCollector()
            let output = LinesCollector()
            let stdoutTask = Task { [stdout] in
                for await line in process.stdout {
                    stdout.append(line)
                }
            }
            let outputTask = Task { [output] in
                for await line in process.output {
                    output.append(line)
                }
            }

            let exitCode = try await TestProcessSupport.run(process)
            _ = await stdoutTask.result
            _ = await outputTask.result

            let snapshot = server.handshakeSnapshot()

            #expect(exitCode == 0)
            #expect(stdout.values.contains(#"{"protocol":"mcp","data":"cli-options"}"# + "\n"))
            #expect(snapshot.headers["X-Test-Header"] == "ws-e2e")
            #expect(snapshot.requestedProtocols == ["mcp"])
            #expect(snapshot.negotiatedProtocol == "mcp")
            #expect(!output.values.contains { $0.contains("websocket error") })
        }
    }
}
