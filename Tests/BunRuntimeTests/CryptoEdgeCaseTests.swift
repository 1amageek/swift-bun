import Testing
@preconcurrency import JavaScriptCore
import Foundation
@testable import BunRuntime
import TestHeartbeat

@Suite("Crypto Edge Cases", .serialized, .heartbeat)
struct CryptoEdgeCaseTests {

    @Test("SHA-256 of empty string")
    func sha256Empty() async throws {
        let result = try await TestProcessSupport.evaluate("""
            require('node:crypto').createHash('sha256').update('').digest('hex')
        """)
        #expect(result.stringValue == "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855")
    }

    @Test("SHA-512 produces correct length")
    func sha512Length() async throws {
        let result = try await TestProcessSupport.evaluate("""
            require('node:crypto').createHash('sha512').update('test').digest('hex').length
        """)
        #expect(result.int32Value == 128) // 64 bytes = 128 hex chars
    }

    @Test("HMAC-SHA256")
    func hmacSHA256() async throws {
        let result = try await TestProcessSupport.evaluate("""
            require('node:crypto').createHmac('sha256', 'secret').update('message').digest('hex')
        """)
        #expect(result.stringValue == "8b5f48702995c1598c573db1e21866a9b825d4a794d169d7060a03605796360b")
    }

    @Test("Hash chaining with multiple updates")
    func hashChaining() async throws {
        let result = try await TestProcessSupport.evaluate("""
            var h = require('node:crypto').createHash('sha256');
            h.update('hello');
            h.update(' world');
            h.digest('hex');
        """)
        // sha256('hello world')
        #expect(result.stringValue == "b94d27b9934d3e08a52e52d7da7dabfac484efe37a5380ee9088f7ace2efcde9")
    }

    @Test("randomBytes returns correct length")
    func randomBytesLength() async throws {
        let result = try await TestProcessSupport.evaluate("""
            require('node:crypto').randomBytes(16).length
        """)
        #expect(result.int32Value == 16)
    }

    @Test("Unsupported hash algorithm throws")
    func unsupportedAlgorithm() async throws {
        await #expect(throws: BunRuntimeError.self) {
            try await TestProcessSupport.evaluate("""
                require('node:crypto').createHash('md5').update('test').digest('hex')
            """)
        }
    }

    @Test("Hash digest base64 encoding")
    func hashBase64() async throws {
        let result = try await TestProcessSupport.evaluate("""
            require('node:crypto').createHash('sha256').update('hello').digest('base64')
        """)
        #expect(result.stringValue == "LPJNul+wow4m6DsqxbninhsWHlwfp0JecwQzYpOLmCQ=")
    }

    @Test("Hash update with Uint8Array binary data")
    func hashBinaryUpdate() async throws {
        let result = try await TestProcessSupport.evaluate("""
            var crypto = require('node:crypto');
            // SHA-256 of bytes [0x00, 0x01, 0xFF] — known hash
            var data = new Uint8Array([0, 1, 255]);
            crypto.createHash('sha256').update(data).digest('hex');
        """)
        // SHA-256 of [0x00, 0x01, 0xFF] (verified with Node.js)
        #expect(result.stringValue == "26a66b061e8f48f39927c312f25293959729eee95978e2892d49d3512a5cc092")
    }

    @Test("HMAC with binary key and data")
    func hmacBinaryKeyData() async throws {
        let result = try await TestProcessSupport.evaluate("""
            var crypto = require('node:crypto');
            var key = new Uint8Array([1, 2, 3]);
            var data = new Uint8Array([4, 5, 6]);
            crypto.createHmac('sha256', key).update(data).digest('hex');
        """)
        #expect(result.stringValue == "52f0bd967282a27354acf04172d09644ad38d9411091496cd4b9e43c1b7eee15")
    }

    @Test("HMAC with unsupported algorithm throws")
    func hmacUnsupportedAlgorithm() async throws {
        await #expect(throws: BunRuntimeError.self) {
            try await TestProcessSupport.evaluate("""
                require('node:crypto').createHmac('md5', 'key').update('data').digest('hex')
            """)
        }
    }

    @Test("randomInt returns value in range")
    func randomIntRange() async throws {
        let result = try await TestProcessSupport.evaluate("""
            var crypto = require('node:crypto');
            var results = [];
            for (var i = 0; i < 100; i++) {
                var v = crypto.randomInt(0, 10);
                if (v < 0 || v >= 10) results.push(v);
            }
            results.length === 0;
        """)
        #expect(result.boolValue == true)
    }

    @Test("randomInt with single argument uses 0 as min")
    func randomIntSingleArg() async throws {
        let result = try await TestProcessSupport.evaluate("""
            var crypto = require('node:crypto');
            var v = crypto.randomInt(1);
            v === 0;
        """)
        #expect(result.boolValue == true)
    }

    @Test("randomInt throws on invalid range")
    func randomIntInvalidRange() async throws {
        await #expect(throws: BunRuntimeError.self) {
            try await TestProcessSupport.evaluate("""
                require('node:crypto').randomInt(5, 5)
            """)
        }
    }

    @Test("Hash update with mixed string and Uint8Array")
    func hashMixedUpdate() async throws {
        let result = try await TestProcessSupport.evaluate("""
            var crypto = require('node:crypto');
            var h = crypto.createHash('sha256');
            h.update('hello');
            h.update(new Uint8Array([0x00, 0xFF]));
            h.digest('hex');
        """)
        #expect(result.stringValue == "55dfc00c01f3ea84a2f1472b04669ad3ed588c04bad216e855f24fbe6a84822c")
    }
}
