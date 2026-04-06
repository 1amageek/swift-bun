import Testing
import Foundation
@testable import BunRuntime
import TestHeartbeat

@Suite("Net E2E", .serialized, .heartbeat)
struct NetE2ETests {
    private func withTCPEchoServer(
        _ body: (LocalTCPEchoTestServer) async throws -> Void
    ) async throws {
        try await TestProcessSupport.withExclusiveRuntimeAccess {
            let server = try await LocalTCPEchoTestServer.start()
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

    @Test("run() completes node:net client roundtrip against local TCP server")
    func runModeNetClientRoundtrip() async throws {
        try await withTCPEchoServer { server in
            let url = try tempBundle("""
                var net = require('node:net');
                var socket = new net.Socket();
                var validated = false;

                socket.on('error', function(error) {
                    console.error(error && error.message ? error.message : String(error));
                    process.exit(1);
                });

                socket.setEncoding('utf8');
                socket.connect({ host: '\(server.host)', port: \(server.port) }, function() {
                    socket.write('net-e2e');
                });

                socket.on('data', function(chunk) {
                    var local = socket.address();
                    validated =
                        chunk === 'net-e2e' &&
                        local.address === '127.0.0.1' &&
                        socket.remoteAddress === '127.0.0.1' &&
                        socket.remotePort === \(server.port);
                    setTimeout(function() {
                        socket.end();
                    }, 0);
                });

                socket.on('end', function() {
                    setTimeout(function() {
                        process.exit(validated ? 0 : 2);
                    }, 0);
                });
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
            #expect(!output.values.contains { $0.lowercased().contains("error") })
        }
    }
}
