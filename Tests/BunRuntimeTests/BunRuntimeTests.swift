import Testing
@preconcurrency import JavaScriptCore
import Foundation
@testable import BunRuntime
import TestHeartbeat

@Suite("BunRuntime", .serialized, .heartbeat)
struct BunRuntimeTests {
    private func evaluate(_ js: String) async throws -> JSResult {
        try await TestProcessSupport.withLoadedProcess { process in
            try await process.evaluate(js: js)
        }
    }

    private func withLoadedProcess<T: Sendable>(
        _ body: (BunProcess) async throws -> T
    ) async throws -> T {
        try await TestProcessSupport.withLoadedProcess(operation: body)
    }

    @Test("Create context and evaluate basic JS")
    func evaluateBasicJS() async throws {
        let result = try await evaluate("1 + 2")
        #expect(result.int32Value == 3)
    }

    @Test("String evaluation")
    func evaluateString() async throws {
        let result = try await evaluate("'hello' + ' ' + 'world'")
        #expect(result.stringValue == "hello world")
    }

    @Test("Call global function")
    func callGlobalFunction() async throws {
        let result = try await withLoadedProcess { process in
            try await process.evaluate(js: "function add(a, b) { return a + b; }")
            return try await process.call("add", arguments: [3, 4])
        }
        #expect(result.int32Value == 7)
    }

    @Test("JavaScript exception is thrown")
    func javaScriptException() async throws {
        await #expect(throws: BunRuntimeError.self) {
            try await withLoadedProcess { process in
                try await process.evaluate(js: "throw new Error('test error')")
            }
        }
    }

    @Test("Function not found throws error")
    func functionNotFound() async throws {
        await #expect(throws: BunRuntimeError.self) {
            try await withLoadedProcess { process in
                try await process.call("nonexistentFunction")
            }
        }
    }
}
