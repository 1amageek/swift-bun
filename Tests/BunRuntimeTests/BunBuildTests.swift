import Testing
import Foundation
@testable import BunRuntime

/// Tests that bundles built with `bun build --target=node --format=esm` work.
/// Bun outputs ESM static imports — BunRuntime must transform them to CJS.
@Suite("Bun Build Integration")
struct BunBuildTests {

    private func bundleURL() throws -> URL {
        guard let url = Bundle.module.url(
            forResource: "bun-test.bundle",
            withExtension: "js"
        ) else {
            throw BunRuntimeError.bundleNotFound(
                URL(fileURLWithPath: "bun-test.bundle.js")
            )
        }
        return url
    }

    @Test func bundleLoads() async throws {
        let runtime = BunRuntime()
        let url = try bundleURL()
        let context = try await runtime.load(bundle: url)
        _ = context
    }

    @Test func pathOperations() async throws {
        let runtime = BunRuntime()
        let url = try bundleURL()
        let context = try await runtime.load(bundle: url)
        let result = try await context.evaluate(js: "JSON.stringify(__testResults.path)")
        #expect(result.stringValue == #"{"join":"/usr/local/bin","basename":"baz.txt","extname":".js"}"#)
    }

    @Test func cryptoUUID() async throws {
        let runtime = BunRuntime()
        let url = try bundleURL()
        let context = try await runtime.load(bundle: url)
        let result = try await context.evaluate(js: "__testResults.crypto.uuidLength")
        #expect(result.int32Value == 36)
    }

    @Test func bunGlobalAvailable() async throws {
        let runtime = BunRuntime()
        let url = try bundleURL()
        let context = try await runtime.load(bundle: url)
        let result = try await context.evaluate(js: "__testResults.bun.version")
        #expect(result.stringValue != "unknown")
    }

    @Test func allChecksPass() async throws {
        let runtime = BunRuntime()
        let url = try bundleURL()
        let context = try await runtime.load(bundle: url)
        let result = try await context.evaluate(js: "__testResults.ok")
        #expect(result.boolValue == true)
    }
}
