import Testing
@preconcurrency import JavaScriptCore
import Foundation
@testable import BunRuntime
import TestHeartbeat

@Suite("TextEncoder/TextDecoder Edge Cases", .serialized, .heartbeat)
struct TextCodecEdgeCaseTests {

    @Test("ASCII roundtrip")
    func asciiRoundtrip() async throws {
        let result = try await TestProcessSupport.evaluate("""
            new TextDecoder().decode(new TextEncoder().encode('Hello, World!'))
        """)
        #expect(result.stringValue == "Hello, World!")
    }

    @Test("Multibyte UTF-8 roundtrip (Japanese)")
    func multibyteCJK() async throws {
        let result = try await TestProcessSupport.evaluate("""
            new TextDecoder().decode(new TextEncoder().encode('こんにちは'))
        """)
        #expect(result.stringValue == "こんにちは")
    }

    @Test("4-byte UTF-8 emoji roundtrip")
    func fourByteEmoji() async throws {
        let result = try await TestProcessSupport.evaluate("""
            new TextDecoder().decode(new TextEncoder().encode('🎉🚀'))
        """)
        #expect(result.stringValue == "🎉🚀")
    }

    @Test("Empty string roundtrip")
    func emptyString() async throws {
        let result = try await TestProcessSupport.evaluate("""
            new TextDecoder().decode(new TextEncoder().encode(''))
        """)
        #expect(result.stringValue == "")
    }

    @Test("Truncated 2-byte sequence does not crash")
    func truncated2Byte() async throws {
        // 0xC3 starts a 2-byte sequence but is alone
        let result = try await TestProcessSupport.evaluate("""
            new TextDecoder().decode(new Uint8Array([0x41, 0xC3]))
        """)
        // Should return at least 'A' and not crash
        #expect(result.stringValue.hasPrefix("A"))
    }

    @Test("Truncated 3-byte sequence does not crash")
    func truncated3Byte() async throws {
        // 0xE3 starts a 3-byte sequence but only has 1 continuation byte
        let result = try await TestProcessSupport.evaluate("""
            new TextDecoder().decode(new Uint8Array([0x42, 0xE3, 0x81]))
        """)
        #expect(result.stringValue.hasPrefix("B"))
    }

    @Test("Truncated 4-byte sequence does not crash")
    func truncated4Byte() async throws {
        // 0xF0 0x9F starts a 4-byte sequence but is incomplete
        let result = try await TestProcessSupport.evaluate("""
            new TextDecoder().decode(new Uint8Array([0x43, 0xF0, 0x9F]))
        """)
        #expect(result.stringValue.hasPrefix("C"))
    }

    @Test("TextDecoder supports utf-16le and utf-16be")
    func utf16Decoding() async throws {
        let result = try await TestProcessSupport.evaluate("""
            (function() {
                var little = new TextDecoder('utf-16le').decode(new Uint8Array([0x41, 0x00, 0x42, 0x00]));
                var big = new TextDecoder('utf-16be').decode(new Uint8Array([0x00, 0x41, 0x00, 0x42]));
                return little + '|' + big;
            })()
        """)
        #expect(result.stringValue == "AB|AB")
    }

    @Test("TextDecoder supports windows-1252 single-byte decoding")
    func windows1252Decoding() async throws {
        let result = try await TestProcessSupport.evaluate("""
            new TextDecoder('windows-1252').decode(new Uint8Array([0x48, 0x80]))
        """)
        #expect(result.stringValue == "H€")
    }
}
