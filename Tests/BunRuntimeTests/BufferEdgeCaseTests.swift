import Testing
@preconcurrency import JavaScriptCore
import Foundation
@testable import BunRuntime
import TestHeartbeat

@Suite("Buffer Edge Cases", .serialized, .heartbeat)
struct BufferEdgeCaseTests {

    @Test("Buffer.from base64 encoding")
    func base64Roundtrip() async throws {
        let result = try await TestProcessSupport.evaluate("""
            Buffer.from('SGVsbG8gV29ybGQ=', 'base64').toString('utf-8')
        """)
        #expect(result.stringValue == "Hello World")
    }

    @Test("Buffer.from hex roundtrip")
    func hexRoundtrip() async throws {
        let result = try await TestProcessSupport.evaluate("""
            Buffer.from(Buffer.from('test data').toString('hex'), 'hex').toString('utf-8')
        """)
        #expect(result.stringValue == "test data")
    }

    @Test("Buffer.alloc creates zeroed buffer")
    func allocZeroed() async throws {
        let result = try await TestProcessSupport.evaluate("""
            var b = Buffer.alloc(4);
            b[0] === 0 && b[1] === 0 && b[2] === 0 && b[3] === 0;
        """)
        #expect(result.boolValue == true)
    }

    @Test("Buffer.isBuffer distinguishes Buffer from Uint8Array")
    func isBuffer() async throws {
        let result = try await TestProcessSupport.evaluate("""
            Buffer.isBuffer(Buffer.from('x')) + '|' + Buffer.isBuffer(new Uint8Array(1));
        """)
        #expect(result.stringValue == "true|false")
    }

    @Test("Buffer.byteLength for multibyte UTF-8")
    func byteLengthMultibyte() async throws {
        let result = try await TestProcessSupport.evaluate("""
            Buffer.byteLength('café')
        """)
        // 'café' = c(1) + a(1) + f(1) + é(2) = 5 bytes
        #expect(result.int32Value == 5)
    }

    @Test("Buffer.concat with empty array")
    func concatEmpty() async throws {
        let result = try await TestProcessSupport.evaluate("""
            Buffer.concat([]).length
        """)
        #expect(result.int32Value == 0)
    }

    @Test("Buffer.compare ordering")
    func compare() async throws {
        let result = try await TestProcessSupport.evaluate("""
            var a = Buffer.from('abc');
            var b = Buffer.from('abd');
            var c = Buffer.from('abc');
            a.compare(b) + '|' + b.compare(a) + '|' + a.compare(c);
        """)
        #expect(result.stringValue == "-1|1|0")
    }

    @Test("Buffer.allocUnsafeSlow returns Buffer-backed view")
    func allocUnsafeSlow() async throws {
        let result = try await TestProcessSupport.evaluate("""
            var buffer = Buffer.allocUnsafeSlow(4);
            Buffer.isBuffer(buffer) && buffer.length === 4;
        """)
        #expect(result.boolValue == true)
    }

    @Test("Buffer integer read/write helpers roundtrip")
    func integerReadWrite() async throws {
        let result = try await TestProcessSupport.evaluate("""
            var buffer = Buffer.alloc(8);
            buffer.writeUInt32LE(0x78563412, 0);
            buffer.writeInt16BE(-2, 4);
            buffer.writeUInt8(255, 6);
            JSON.stringify({
                u32: buffer.readUInt32LE(0),
                i16: buffer.readInt16BE(4),
                u8: buffer.readUInt8(6)
            });
        """)
        #expect(result.stringValue == #"{"u32":2018915346,"i16":-2,"u8":255}"#)
    }

    @Test("Buffer float and double helpers roundtrip")
    func floatingPointReadWrite() async throws {
        let result = try await TestProcessSupport.evaluate("""
            var buffer = Buffer.alloc(12);
            buffer.writeFloatLE(3.5, 0);
            buffer.writeDoubleBE(Math.PI, 4);
            JSON.stringify({
                float: buffer.readFloatLE(0).toFixed(1),
                double: buffer.readDoubleBE(4).toFixed(6)
            });
        """)
        #expect(result.stringValue == #"{"float":"3.5","double":"3.141593"}"#)
    }
}
