import Testing
@testable import BunRuntime
import TestHeartbeat

@Suite("TLS E2E", .serialized, .tags(.integration, .slow), .heartbeat)
struct TLSE2ETests {
    @Test("tls.connect establishes a secure client connection and reads response data")
    func tlsConnectExampleDotCom() async throws {
        let result = try await TestProcessSupport.withLoadedProcess { process in
            try await process.evaluateAsync(js: """
                (async function() {
                    var tls = require('node:tls');
                    return await new Promise(function(resolve, reject) {
                        var socket = tls.connect({
                            host: 'example.com',
                            port: 443,
                            servername: 'example.com',
                            rejectUnauthorized: true
                        }, function() {
                            socket.write('GET / HTTP/1.1\\r\\nHost: example.com\\r\\nConnection: close\\r\\n\\r\\n');
                        });

                        var body = '';
                        socket.setEncoding('utf8');
                        socket.setTimeout(10000, function() {
                            socket.destroy(new Error('timeout'));
                        });
                        socket.on('data', function(chunk) {
                            body += chunk;
                        });
                        socket.on('end', function() {
                            resolve(JSON.stringify({
                                authorized: socket.authorized,
                                hasResponse: body.indexOf('HTTP/1.1 200') !== -1 || body.indexOf('HTTP/1.0 200') !== -1,
                                hasExample: body.indexOf('Example Domain') !== -1
                            }));
                        });
                        socket.on('error', reject);
                    });
                })()
            """)
        }

        #expect(result.stringValue == #"{"authorized":true,"hasResponse":true,"hasExample":true}"#)
    }
}
