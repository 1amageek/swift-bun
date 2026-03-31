import Testing
import Foundation
@testable import BunRuntime

/// Tests that verify actual HTTP roundtrips through the fetch → URLSession bridge.
/// These tests make real network requests to validate the full pipeline:
///   JS fetch() → __nativeFetch → URLRequest → URLSession → HTTPURLResponse → JS Response
@Suite("Fetch Roundtrip", .tags(.integration))
struct FetchRoundtripTests {

    // MARK: - GET Requests

    @Test("GET request returns status 200 and body")
    func getRequest() async throws {
        let process = BunProcess()
        try await process.load()

        let result = try await process.evaluate(js: """
            fetch('https://httpbin.org/get').then(function(res) {
                return res.text().then(function(body) {
                    return JSON.stringify({ status: res.status, ok: res.ok, hasBody: body.length > 0 });
                });
            })
        """)

        let json = try parseJSON(result)
        #expect(json["status"] as? Int == 200)
        #expect(json["ok"] as? Bool == true)
        #expect(json["hasBody"] as? Bool == true)
    }

    @Test("GET request response headers are accessible")
    func getResponseHeaders() async throws {
        let process = BunProcess()
        try await process.load()

        let result = try await process.evaluate(js: """
            fetch('https://httpbin.org/get').then(function(res) {
                return res.headers.get('content-type');
            })
        """)

        let contentType = result.stringValue
        #expect(contentType.contains("application/json"))
    }

    @Test("GET request response body parses as JSON")
    func getResponseJSON() async throws {
        let process = BunProcess()
        try await process.load()

        let result = try await process.evaluate(js: """
            fetch('https://httpbin.org/get?foo=bar').then(function(res) {
                return res.json();
            }).then(function(data) {
                return data.args.foo;
            })
        """)

        #expect(result.stringValue == "bar")
    }

    // MARK: - POST Requests

    @Test("POST request sends body and receives echo")
    func postRequestWithBody() async throws {
        let process = BunProcess()
        try await process.load()

        let result = try await process.evaluate(js: """
            fetch('https://httpbin.org/post', {
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

        #expect(result.stringValue == "hello from swift-bun")
    }

    @Test("POST request custom headers are sent")
    func postRequestCustomHeaders() async throws {
        let process = BunProcess()
        try await process.load()

        let result = try await process.evaluate(js: """
            fetch('https://httpbin.org/post', {
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

        #expect(result.stringValue == "swift-bun-test")
    }

    // MARK: - HTTP Methods

    @Test("PUT request works")
    func putRequest() async throws {
        let process = BunProcess()
        try await process.load()

        let result = try await process.evaluate(js: """
            fetch('https://httpbin.org/put', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ key: 'value' })
            }).then(function(res) {
                return JSON.stringify({ status: res.status, ok: res.ok });
            })
        """)

        let json = try parseJSON(result)
        #expect(json["status"] as? Int == 200)
        #expect(json["ok"] as? Bool == true)
    }

    @Test("DELETE request works")
    func deleteRequest() async throws {
        let process = BunProcess()
        try await process.load()

        let result = try await process.evaluate(js: """
            fetch('https://httpbin.org/delete', { method: 'DELETE' })
            .then(function(res) { return res.status; })
        """)

        #expect(result.int32Value == 200)
    }

    // MARK: - Error Handling

    @Test("404 response is not ok but does not reject")
    func notFoundResponse() async throws {
        let process = BunProcess()
        try await process.load()

        let result = try await process.evaluate(js: """
            fetch('https://httpbin.org/status/404').then(function(res) {
                return JSON.stringify({ status: res.status, ok: res.ok });
            })
        """)

        let json = try parseJSON(result)
        #expect(json["status"] as? Int == 404)
        #expect(json["ok"] as? Bool == false)
    }

    @Test("fetch rejects on network error")
    func networkError() async throws {
        let process = BunProcess()
        try await process.load()

        let result = try await process.evaluate(js: """
            fetch('https://this-domain-does-not-exist-12345.invalid/')
            .then(function() { return 'resolved'; })
            .catch(function(err) { return 'rejected: ' + err.message; })
        """)

        #expect(result.stringValue.hasPrefix("rejected:"))
    }

    // MARK: - Response Methods

    @Test("Response.text() returns string body")
    func responseText() async throws {
        let process = BunProcess()
        try await process.load()

        let result = try await process.evaluate(js: """
            fetch('https://httpbin.org/html').then(function(res) {
                return res.text();
            }).then(function(text) {
                return text.indexOf('Herman Melville') !== -1;
            })
        """)

        #expect(result.boolValue == true)
    }

    @Test("Response.json() parses body")
    func responseJSON() async throws {
        let process = BunProcess()
        try await process.load()

        let result = try await process.evaluate(js: """
            fetch('https://httpbin.org/json').then(function(res) {
                return res.json();
            }).then(function(data) {
                return typeof data.slideshow;
            })
        """)

        #expect(result.stringValue == "object")
    }

    // MARK: - Integration: Anthropic SDK Pattern

    @Test("Anthropic API pattern: POST JSON and receive response")
    func anthropicPattern() async throws {
        let process = BunProcess()
        try await process.load()

        // Simulate Anthropic API request pattern (POST JSON, receive JSON)
        // Using httpbin.org/post as a safe echo endpoint
        let result = try await process.evaluate(js: """
            fetch('https://httpbin.org/post', {
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

        let json = try parseJSON(result)
        #expect(json["echoedModel"] as? String == "claude-sonnet-4-20250514")
        #expect(json["echoedContent"] as? String == "Hello")
        #expect(json["receivedApiKey"] as? String == "test-key")
        #expect(json["receivedVersion"] as? String == "2023-06-01")
    }

    // MARK: - evaluate Non-Promise Path

    @Test("evaluate with synchronous value returns immediately")
    func evaluateSync() async throws {
        let process = BunProcess()
        try await process.load()

        let result = try await process.evaluate(js: "1 + 2")
        #expect(result.int32Value == 3)
    }

    @Test("evaluate with resolved Promise returns value")
    func evaluateResolvedPromise() async throws {
        let process = BunProcess()
        try await process.load()

        let result = try await process.evaluate(js: "Promise.resolve(42)")
        #expect(result.int32Value == 42)
    }

    @Test("evaluate with rejected Promise throws")
    func evaluateRejectedPromise() async throws {
        let process = BunProcess()
        try await process.load()

        await #expect(throws: BunRuntimeError.self) {
            try await process.evaluate(js: "Promise.reject(new Error('test rejection'))")
        }
    }

    // MARK: - Helpers

    private func parseJSON(_ result: JSResult) throws -> [String: Any] {
        let jsonString: String
        switch result {
        case .string(let s): jsonString = s
        case .json(let j): jsonString = j
        default: throw ParseError.unexpectedType
        }
        let data = Data(jsonString.utf8)
        guard let parsed = try JSONSerialization.jsonObject(with: data) as? [String: Any] else {
            throw ParseError.invalidJSON
        }
        return parsed
    }
}

extension Tag {
    @Tag static var integration: Self
}

enum ParseError: Error {
    case unexpectedType
    case invalidJSON
}
