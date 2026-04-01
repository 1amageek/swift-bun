import Testing
import Foundation
@testable import BunRuntime
import TestHeartbeat

@Suite("Node.js Basic Module Compatibility", .serialized, .heartbeat)
struct NodeCompatBasicTests {
    private func evaluate(_ js: String) async throws -> JSResult {
        try await TestProcessSupport.withLoadedProcess { process in
            try await process.evaluate(js: js)
        }
    }

    // MARK: - Path

    @Test("path.basename")
    func pathBasename() async throws {
        let result = try await evaluate("require('node:path').basename('/foo/bar/baz.txt')")
        #expect(result.stringValue == "baz.txt")
    }

    @Test("path.dirname")
    func pathDirname() async throws {
        let result = try await evaluate("require('node:path').dirname('/foo/bar/baz.txt')")
        #expect(result.stringValue == "/foo/bar")
    }

    @Test("path.extname")
    func pathExtname() async throws {
        let result = try await evaluate("require('node:path').extname('/foo/bar/baz.txt')")
        #expect(result.stringValue == ".txt")
    }

    @Test("path.isAbsolute")
    func pathIsAbsolute() async throws {
        let result = try await evaluate("require('node:path').isAbsolute('/foo')")
        #expect(result.boolValue == true)
    }

    // MARK: - Buffer

    @Test("Buffer.from string")
    func bufferFromString() async throws {
        let result = try await evaluate("Buffer.from('hello').toString('utf-8')")
        #expect(result.stringValue == "hello")
    }

    @Test("Buffer.from hex encoding")
    func bufferHex() async throws {
        let result = try await evaluate("Buffer.from('hello').toString('hex')")
        #expect(result.stringValue == "68656c6c6f")
    }

    @Test("Buffer.concat")
    func bufferConcat() async throws {
        let result = try await evaluate("""
            Buffer.concat([Buffer.from('hello'), Buffer.from(' world')]).toString('utf-8')
        """)
        #expect(result.stringValue == "hello world")
    }

    // MARK: - Crypto

    @Test("require('node:crypto') randomUUID")
    func cryptoRandomUUID() async throws {
        let result = try await evaluate("require('node:crypto').randomUUID()")
        let uuid = result.stringValue
        #expect(uuid.count == 36)
        #expect(uuid.contains("-"))
    }

    @Test("crypto.createHash('sha256')")
    func cryptoHash() async throws {
        let result = try await evaluate("""
            require('node:crypto').createHash('sha256').update('hello').digest('hex')
        """)
        #expect(result.stringValue == "2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824")
    }

    // MARK: - URL / Util / TextCodec

    @Test("TextEncoder/TextDecoder roundtrip")
    func textEncoderDecoder() async throws {
        let result = try await evaluate("""
            new TextDecoder().decode(new TextEncoder().encode('hello'))
        """)
        #expect(result.stringValue == "hello")
    }

    @Test("require('node:url').parse")
    func urlParse() async throws {
        let result = try await evaluate("""
            var u = require('node:url').parse('https://example.com/path?q=1');
            u.hostname;
        """)
        #expect(result.stringValue == "example.com")
    }

    @Test("require('node:util').format")
    func utilFormat() async throws {
        let result = try await evaluate("""
            require('node:util').format('hello %s, you are %d', 'world', 42)
        """)
        #expect(result.stringValue == "hello world, you are 42")
    }
}
