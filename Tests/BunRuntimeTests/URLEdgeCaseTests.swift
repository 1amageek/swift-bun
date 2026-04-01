import Testing
@preconcurrency import JavaScriptCore
import Foundation
@testable import BunRuntime
import TestHeartbeat

@Suite("URL Polyfill Edge Cases", .serialized, .heartbeat)
struct URLEdgeCaseTests {

    @Test("Parse HTTPS URL with path and query")
    func parseHTTPS() async throws {
        let result = try await TestProcessSupport.evaluate("""
            var u = new URL('https://api.example.com:8080/v1/chat?model=claude');
            u.hostname + '|' + u.port + '|' + u.pathname + '|' + u.searchParams.get('model');
        """)
        #expect(result.stringValue == "api.example.com|8080|/v1/chat|claude")
    }

    @Test("Parse file:/// URL with empty hostname")
    func parseFileURL() async throws {
        let result = try await TestProcessSupport.evaluate("""
            var u = new URL('file:///tmp/test.js');
            u.protocol + '|' + u.pathname;
        """)
        #expect(result.stringValue == "file:|/tmp/test.js")
    }

    @Test("Parse URL with auth")
    func parseURLWithAuth() async throws {
        let result = try await TestProcessSupport.evaluate("""
            var u = new URL('https://user:pass@example.com/path');
            u.username + '|' + u.password + '|' + u.hostname;
        """)
        #expect(result.stringValue == "user|pass|example.com")
    }

    @Test("Parse URL with hash fragment")
    func parseURLWithHash() async throws {
        let result = try await TestProcessSupport.evaluate("""
            var u = new URL('https://example.com/page#section');
            u.hash;
        """)
        #expect(result.stringValue == "#section")
    }

    @Test("URLSearchParams multiple values")
    func searchParamsMultiple() async throws {
        let result = try await TestProcessSupport.evaluate("""
            var sp = new URLSearchParams('a=1&b=2&c=hello%20world');
            sp.get('a') + '|' + sp.get('b') + '|' + sp.get('c');
        """)
        #expect(result.stringValue == "1|2|hello world")
    }

    @Test("URL setters keep href and searchParams in sync")
    func urlSettersSynchronize() async throws {
        let result = try await TestProcessSupport.evaluate("""
            (function() {
                var url = new URL('https://example.com/start?foo=1#old');
                url.pathname = '/next';
                url.search = '?bar=2';
                url.hash = '#new';
                url.username = 'user';
                url.password = 'pass';
                url.searchParams.set('baz', '3');
                return JSON.stringify({
                    href: url.href,
                    search: url.search,
                    baz: url.searchParams.get('baz')
                });
            })()
        """)
        #expect(result.stringValue == #"{"href":"https://user:pass@example.com/next?bar=2&baz=3#new","search":"?bar=2&baz=3","baz":"3"}"#)
    }
}
