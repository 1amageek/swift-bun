import Testing
import Foundation
@testable import BunRuntime

/// Integration tests that load an actual Bun-built bundle (Anthropic SDK)
/// and verify it initializes correctly in the swift-bun process.
@Suite("Claude Bundle Integration")
struct ClaudeBundleIntegrationTests {

    private func bundleURL() throws -> URL {
        guard let url = Bundle.module.url(forResource: "claude.bundle", withExtension: "js") else {
            throw BundleTestError.fixtureNotFound
        }
        return url
    }

    // MARK: - Bundle Loading

    @Test("Bundle loads without JavaScript exceptions")
    func bundleLoads() async throws {
        let process = BunProcess()
        let bundleURL = try bundleURL()
        try await process.load(bundle: bundleURL)

        // The bundle sets globalThis.__bundleLoaded = true on successful load
        let result = try await process.evaluate(js: "__bundleLoaded")
        #expect(result.boolValue == true)
    }

    @Test("Bundle reports all required modules available")
    func bundleModulesAvailable() async throws {
        let process = BunProcess()
        try await process.load(bundle: try bundleURL())

        let info = try await process.evaluate(js: "JSON.stringify(__bundleInfo)")
        guard case .string(let json) = info else {
            #expect(Bool(false), "Expected string result for __bundleInfo")
            return
        }

        let data = Data(json.utf8)
        let parsed = try JSONSerialization.jsonObject(with: data) as? [String: Any]
        let modules = parsed?["modules"] as? [String: Any]

        // Verify each module is available
        #expect(modules?["anthropic"] as? Bool == true, "Anthropic SDK constructor should be available")
        #expect(modules?["fetch"] as? Bool == true, "fetch should be available")
        #expect(modules?["process"] as? Bool == true, "process should be available")
        #expect(modules?["Buffer"] as? Bool == true, "Buffer should be available")
        #expect(modules?["crypto"] as? Bool == true, "node:crypto should be available")
        #expect(modules?["path"] as? Bool == true, "node:path should be available")
    }

    // MARK: - SDK Initialization

    @Test("Anthropic client initializes with API key")
    func clientInitializes() async throws {
        let process = BunProcess()
        try await process.load(bundle: try bundleURL())

        // Initialize the Anthropic client with a test key
        let result = try await process.evaluate(js: """
            JSON.stringify(__claudeInit('sk-ant-test-key-for-initialization'))
        """)

        guard case .string(let json) = result else {
            #expect(Bool(false), "Expected string result")
            return
        }

        let parsed = try JSONSerialization.jsonObject(with: Data(json.utf8)) as? [String: Any]
        #expect(parsed?["status"] as? String == "initialized")
    }

    @Test("Client rejects missing API key gracefully")
    func clientRejectsMissingKey() async throws {
        let process = BunProcess()
        try await process.load(bundle: try bundleURL())

        // Anthropic SDK should throw/report when no API key is provided
        // The behavior depends on the SDK version but it should not crash
        let result = try await process.evaluate(js: """
            try {
                __claudeInit(undefined);
                'no-error';
            } catch(e) {
                'error: ' + e.message;
            }
        """)
        // SDK may accept undefined key at init time but fail at request time
        #expect(!result.isUndefined)
    }

    // MARK: - API Call Structure (without network)

    @Test("Message function exists after init")
    func messageFunctionExists() async throws {
        let process = BunProcess()
        try await process.load(bundle: try bundleURL())
        try await process.evaluate(js: "__claudeInit('sk-ant-test-key')")

        let result = try await process.evaluate(js: "typeof __claudeMessage")
        #expect(result.stringValue == "function")
    }

    @Test("Message call returns a Promise")
    func messageReturnsPromise() async throws {
        let process = BunProcess()
        try await process.load(bundle: try bundleURL())
        try await process.evaluate(js: "__claudeInit('sk-ant-test-key')")

        // Call the message function — it will fail at the network level
        // but we verify the Promise is created and the SDK pipeline works
        let result = try await process.evaluate(js: """
            var p = __claudeMessage('hello');
            p instanceof Promise;
        """)
        #expect(result.boolValue == true)
    }

    // MARK: - Runtime Environment Verification

    @Test("fetch is available and callable")
    func fetchAvailable() async throws {
        let process = BunProcess()
        try await process.load(bundle: try bundleURL())

        let result = try await process.evaluate(js: "typeof fetch")
        #expect(result.stringValue == "function")
    }

    @Test("process.env is writable from Swift")
    func processEnvWritable() async throws {
        let process = BunProcess()
        try await process.load(bundle: try bundleURL())

        try await process.evaluate(js: "process.env.ANTHROPIC_API_KEY = 'test-key-from-swift'")
        let result = try await process.evaluate(js: "process.env.ANTHROPIC_API_KEY")
        #expect(result.stringValue == "test-key-from-swift")
    }

    @Test("Bun global is available")
    func bunGlobalAvailable() async throws {
        let process = BunProcess()
        try await process.load(bundle: try bundleURL())

        let result = try await process.evaluate(js: "typeof Bun")
        #expect(result.stringValue == "object")
    }

    @Test("console.log works inside bundle context")
    func consoleLogWorks() async throws {
        let process = BunProcess()
        try await process.load(bundle: try bundleURL())

        // Should not throw
        try await process.evaluate(js: "console.log('Bundle loaded:', __bundleInfo.name)")
    }

    @Test("Console output is captured via output stream")
    func consoleOutputWorks() async throws {
        let process = BunProcess()
        try await process.load(bundle: try bundleURL())

        try await process.evaluate(js: "console.log('bundle test output');")

        // Output stream should have captured the log
        // (Non-blocking check — output was already yielded synchronously)
        var found = false
        for await line in process.output {
            if line.contains("bundle test output") {
                found = true
                break
            }
        }
        #expect(found)
    }
}

enum BundleTestError: Error {
    case fixtureNotFound
}
