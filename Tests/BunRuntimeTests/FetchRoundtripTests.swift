import Testing
import Foundation
import Synchronization
@testable import BunRuntime
import TestHeartbeat

private final class OutputCollector: Sendable {
    private let storage = Mutex<[String]>([])

    func append(_ line: String) {
        storage.withLock { $0.append(line) }
    }

    var values: [String] {
        storage.withLock { $0 }
    }

    var joined: String {
        storage.withLock { $0.joined() }
    }
}

/// Tests that verify actual HTTP roundtrips through the fetch → URLSession bridge.
/// These tests use a localhost server to validate the full pipeline:
///   JS fetch() → __nativeFetch → URLRequest → URLSession → HTTPURLResponse → JS Response
@Suite("Fetch Roundtrip", .serialized, .tags(.integration, .slow), .heartbeat)
struct FetchRoundtripTests {

    // MARK: - GET Requests

    @Test("GET request returns status 200 and body")
    func getRequest() async throws {
        try await withServer { baseURL in
            let value = try await runAsyncExpression("""
                fetch('\(baseURL)/get').then(function(res) {
                    return res.text().then(function(body) {
                        return JSON.stringify({ status: res.status, ok: res.ok, hasBody: body.length > 0 });
                    });
                })
            """)
            let json = try parseJSONValue(value)
            #expect(json["status"] as? Int == 200)
            #expect(json["ok"] as? Bool == true)
            #expect(json["hasBody"] as? Bool == true)
        }
    }

    @Test("GET request response headers are accessible")
    func getResponseHeaders() async throws {
        try await withServer { baseURL in
            let value = try await runAsyncExpression("""
                fetch('\(baseURL)/get').then(function(res) {
                    return res.headers.get('content-type');
                })
            """)
            let contentType = try stringValue(value)
            #expect(contentType.contains("application/json"))
        }
    }

    @Test("GET request response body parses as JSON")
    func getResponseJSON() async throws {
        try await withServer { baseURL in
            let value = try await runAsyncExpression("""
                fetch('\(baseURL)/get?foo=bar').then(function(res) {
                    return res.json();
                }).then(function(data) {
                    return data.args.foo;
                })
            """)
            #expect(try stringValue(value) == "bar")
        }
    }

    // MARK: - POST Requests

    @Test("POST request sends body and receives echo")
    func postRequestWithBody() async throws {
        try await withServer { baseURL in
            let value = try await runAsyncExpression("""
                fetch('\(baseURL)/post', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ message: 'hello from swift-bun' })
                }).then(function(res) {
                    return res.json();
                }).then(function(data) {
                    var parsed = JSON.parse(data.data);
                    return parsed.message;
                })
            """)
            #expect(try stringValue(value) == "hello from swift-bun")
        }
    }

    @Test("POST request custom headers are sent")
    func postRequestCustomHeaders() async throws {
        try await withServer { baseURL in
            let value = try await runAsyncExpression("""
                fetch('\(baseURL)/post', {
                    method: 'POST',
                    headers: {
                        'X-Custom-Header': 'swift-bun-test',
                        'Content-Type': 'text/plain'
                    },
                    body: 'test'
                }).then(function(res) {
                    return res.json();
                }).then(function(data) {
                    return data.headers['X-Custom-Header'];
                })
            """)
            #expect(try stringValue(value) == "swift-bun-test")
        }
    }

    // MARK: - HTTP Methods

    @Test("PUT request works")
    func putRequest() async throws {
        try await withServer { baseURL in
            let value = try await runAsyncExpression("""
                fetch('\(baseURL)/put', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ key: 'value' })
                }).then(function(res) {
                    return JSON.stringify({ status: res.status, ok: res.ok });
                })
            """)
            let json = try parseJSONValue(value)
            #expect(json["status"] as? Int == 200)
            #expect(json["ok"] as? Bool == true)
        }
    }

    @Test("DELETE request works")
    func deleteRequest() async throws {
        try await withServer { baseURL in
            let value = try await runAsyncExpression("""
                fetch('\(baseURL)/delete', { method: 'DELETE' })
                .then(function(res) { return res.status; })
            """)
            #expect(try intValue(value) == 200)
        }
    }

    // MARK: - Error Handling

    @Test("404 response is not ok but does not reject")
    func notFoundResponse() async throws {
        try await withServer { baseURL in
            let value = try await runAsyncExpression("""
                fetch('\(baseURL)/status/404').then(function(res) {
                    return JSON.stringify({ status: res.status, ok: res.ok });
                })
            """)
            let json = try parseJSONValue(value)
            #expect(json["status"] as? Int == 404)
            #expect(json["ok"] as? Bool == false)
        }
    }

    @Test("fetch rejects on network error")
    func networkError() async throws {
        let value = try await runAsyncExpression("""
            fetch('https://this-domain-does-not-exist-12345.invalid/')
            .then(function() { return 'resolved'; })
            .catch(function(err) { return 'rejected: ' + err.message; })
        """)
        #expect(try stringValue(value).hasPrefix("rejected:"))
    }

    // MARK: - Response Methods

    @Test("Response.text() returns string body")
    func responseText() async throws {
        try await withServer { baseURL in
            let value = try await runAsyncExpression("""
                fetch('\(baseURL)/html').then(function(res) {
                    return res.text();
                }).then(function(text) {
                    return text.indexOf('Herman Melville') !== -1;
                })
            """)
            #expect(try boolValue(value) == true)
        }
    }

    @Test("Response.json() parses body")
    func responseJSON() async throws {
        try await withServer { baseURL in
            let value = try await runAsyncExpression("""
                fetch('\(baseURL)/json').then(function(res) {
                    return res.json();
                }).then(function(data) {
                    return typeof data.slideshow;
                })
            """)
            #expect(try stringValue(value) == "object")
        }
    }

    // MARK: - Integration: Anthropic SDK Pattern

    @Test("Anthropic API pattern: POST JSON and receive response")
    func anthropicPattern() async throws {
        // Simulate Anthropic API request pattern (POST JSON, receive JSON)
        try await withServer { baseURL in
            let value = try await runAsyncExpression("""
                fetch('\(baseURL)/post', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-API-Key': 'test-key',
                        'Anthropic-Version': '2023-06-01'
                    },
                    body: JSON.stringify({
                        model: 'claude-sonnet-4-20250514',
                        max_tokens: 1024,
                        messages: [{ role: 'user', content: 'Hello' }]
                    })
                }).then(function(res) {
                    return res.json();
                }).then(function(data) {
                    var sent = JSON.parse(data.data);
                    return JSON.stringify({
                        echoedModel: sent.model,
                        echoedContent: sent.messages[0].content,
                        receivedApiKey: data.headers['X-Api-Key'],
                        receivedVersion: data.headers['Anthropic-Version']
                    });
                })
            """)
            let json = try parseJSONValue(value)
            #expect(json["echoedModel"] as? String == "claude-sonnet-4-20250514")
            #expect(json["echoedContent"] as? String == "Hello")
            #expect(json["receivedApiKey"] as? String == "test-key")
            #expect(json["receivedVersion"] as? String == "2023-06-01")
        }
    }

    // MARK: - evaluate Non-Promise Path

    @Test("evaluate with synchronous value returns immediately")
    func evaluateSync() async throws {
        let result = try await TestProcessSupport.evaluate("1 + 2")
        #expect(result.int32Value == 3)
    }

    @Test("run with resolved Promise returns value")
    func runResolvedPromise() async throws {
        let value = try await runAsyncExpression("Promise.resolve(42)")
        #expect(try intValue(value) == 42)
    }

    @Test("run with rejected Promise throws")
    func runRejectedPromise() async throws {
        await #expect(throws: BunRuntimeError.self) {
            _ = try await runAsyncExpression("Promise.reject(new Error('test rejection'))")
        }
    }

    // MARK: - Helpers

    private func runAsyncExpression(_ expression: String) async throws -> Any? {
        let bundle = try tempBundle("""
        (async function() {
            try {
                var value = await (\(expression));
                process.stdout.write(JSON.stringify({ ok: true, value: value }));
                process.exit(0);
            } catch (error) {
                process.stdout.write(JSON.stringify({
                    ok: false,
                    error: error && error.message ? error.message : String(error)
                }));
                process.exit(1);
            }
        })();
        """)
        defer {
            do {
                try FileManager.default.removeItem(at: bundle)
            } catch {
            }
        }

        let process = BunProcess(bundle: bundle)
        let stdout = OutputCollector()
        let output = OutputCollector()
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

        let exitCode = try await process.run()
        stdoutTask.cancel()
        outputTask.cancel()

        let payload = stdout.joined
        guard !payload.isEmpty else {
            throw ParseError.missingOutput(output.values)
        }

        let json = try parseJSONString(payload)
        guard let ok = json["ok"] as? Bool else {
            throw ParseError.invalidEnvelope
        }
        if ok {
            return json["value"]
        }
        let message = json["error"] as? String ?? "Unknown error"
        if exitCode != 0 {
            throw BunRuntimeError.javaScriptException(message)
        }
        throw ParseError.invalidEnvelope
    }

    private func withServer(
        _ body: (String) async throws -> Void
    ) async throws {
        let server = try await LocalHTTPTestServer.start()
        do {
            try await body(server.baseURL)
            try await server.shutdown()
        } catch {
            do {
                try await server.shutdown()
            } catch {
            }
            throw error
        }
    }

    private func parseJSONValue(_ value: Any?) throws -> [String: Any] {
        guard let string = value as? String else {
            throw ParseError.unexpectedType
        }
        return try parseJSONString(string)
    }

    private func parseJSONString(_ jsonString: String) throws -> [String: Any] {
        let data = Data(jsonString.utf8)
        guard let parsed = try JSONSerialization.jsonObject(with: data) as? [String: Any] else {
            throw ParseError.invalidJSON
        }
        return parsed
    }

    private func stringValue(_ value: Any?) throws -> String {
        guard let string = value as? String else {
            throw ParseError.unexpectedType
        }
        return string
    }

    private func boolValue(_ value: Any?) throws -> Bool {
        guard let bool = value as? Bool else {
            throw ParseError.unexpectedType
        }
        return bool
    }

    private func intValue(_ value: Any?) throws -> Int {
        guard let number = value as? NSNumber else {
            throw ParseError.unexpectedType
        }
        return number.intValue
    }
}

extension Tag {
    @Tag static var integration: Self
    @Tag static var slow: Self
}

enum ParseError: Error {
    case unexpectedType
    case invalidJSON
    case invalidEnvelope
    case missingOutput([String])
}
