import Testing
@preconcurrency import JavaScriptCore
import Foundation
@testable import BunRuntime
import TestHeartbeat

@Suite("JSResult Edge Cases", .serialized, .heartbeat)
struct JSResultEdgeCaseTests {

    @Test("Number result preserves integer")
    func integerResult() async throws {
        let result = try await TestProcessSupport.evaluate("42")
        #expect(result == .number(42))
        #expect(result.int32Value == 42)
        #expect(result.stringValue == "42")
    }

    @Test("Number result preserves float")
    func floatResult() async throws {
        let result = try await TestProcessSupport.evaluate("3.14")
        #expect(result == .number(3.14))
        #expect(result.stringValue == "3.14")
    }

    @Test("Boolean true")
    func boolTrue() async throws {
        let result = try await TestProcessSupport.evaluate("true")
        #expect(result == .bool(true))
        #expect(result.boolValue == true)
        #expect(result.int32Value == 1)
    }

    @Test("Null result")
    func nullResult() async throws {
        let result = try await TestProcessSupport.evaluate("null")
        #expect(result == .null)
        #expect(result.isNull == true)
        #expect(result.boolValue == false)
        #expect(result.stringValue == "null")
    }

    @Test("Undefined result")
    func undefinedResult() async throws {
        let result = try await TestProcessSupport.evaluate("undefined")
        #expect(result == .undefined)
        #expect(result.isUndefined == true)
        #expect(result.boolValue == false)
    }

    @Test("Object result serialized as JSON")
    func objectResult() async throws {
        let result = try await TestProcessSupport.evaluate("({key: 'value', num: 42})")
        if case .json(let j) = result {
            #expect(j.contains("\"key\""))
            #expect(j.contains("\"value\""))
        } else {
            #expect(Bool(false), "Expected .json case")
        }
    }

    @Test("Array result serialized as JSON")
    func arrayResult() async throws {
        let result = try await TestProcessSupport.evaluate("[1, 2, 3]")
        if case .json(let j) = result {
            #expect(j == "[1,2,3]")
        } else {
            #expect(Bool(false), "Expected .json case")
        }
    }
}
