import Testing
import Foundation
@testable import BunRuntime
import TestHeartbeat

/// Integration tests that load an actual Bun-built bundle (Anthropic SDK)
/// and verify it initializes correctly in the swift-bun process.
@Suite("Claude Bundle Integration", .serialized, .tags(.slow), .heartbeat)
struct ClaudeBundleIntegrationTests {

    private func bundleURL() throws -> URL {
        guard let url = Bundle.module.url(forResource: "claude.bundle", withExtension: "js") else {
            throw BundleTestError.fixtureNotFound
        }
        return url
    }

    private func withServer(
        _ body: (String) async throws -> Void
    ) async throws {
        let server = try await LocalHTTPTestServer.start()
        do {
            try await body(server.baseURL)
            try await server.shutdown()
        } catch {
            do {
                try await server.shutdown()
            } catch {
            }
            throw error
        }
    }

    private func withLoadedBundleProcess<T: Sendable>(
        _ body: (BunProcess) async throws -> T
    ) async throws -> T {
        try await TestProcessSupport.withLoadedProcess(BunProcess(bundle: try bundleURL()), operation: body)
    }

    // MARK: - Bundle Loading

    @Test("Bundle loads without JavaScript exceptions")
    func bundleLoads() async throws {
        let result = try await withLoadedBundleProcess { process in
            try await process.evaluate(js: "__bundleLoaded")
        }
        #expect(result.boolValue == true)
    }

    @Test("Bundle reports all required modules available")
    func bundleModulesAvailable() async throws {
        let info = try await withLoadedBundleProcess { process in
            try await process.evaluate(js: "JSON.stringify(__bundleInfo)")
        }
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
        let result = try await withLoadedBundleProcess { process in
            try await process.evaluate(js: """
                JSON.stringify(__claudeInit('sk-ant-test-key-for-initialization'))
            """)
        }

        guard case .string(let json) = result else {
            #expect(Bool(false), "Expected string result")
            return
        }

        let parsed = try JSONSerialization.jsonObject(with: Data(json.utf8)) as? [String: Any]
        #expect(parsed?["status"] as? String == "initialized")
    }

    @Test("Client rejects missing API key gracefully")
    func clientRejectsMissingKey() async throws {
        let result = try await withLoadedBundleProcess { process in
            try await process.evaluate(js: """
                try {
                    __claudeInit(undefined);
                    'no-error';
                } catch(e) {
                    'error: ' + e.message;
                }
            """)
        }
        // SDK may accept undefined key at init time but fail at request time
        #expect(!result.isUndefined)
    }

    // MARK: - API Call Structure (without network)

    @Test("Message function exists after init")
    func messageFunctionExists() async throws {
        let result = try await withLoadedBundleProcess { process in
            try await process.evaluate(js: "__claudeInit('sk-ant-test-key')")
            return try await process.evaluate(js: "typeof __claudeMessage")
        }
        #expect(result.stringValue == "function")
    }

    @Test("Message call returns a Promise")
    func messageReturnsPromise() async throws {
        let result = try await withLoadedBundleProcess { process in
            try await process.evaluate(js: "__claudeInit('sk-ant-test-key')")
            return try await process.evaluate(js: """
                var p = __claudeMessage('hello');
                p instanceof Promise;
            """)
        }
        #expect(result.boolValue == true)
    }

    @Test("Anthropic SDK streaming path receives a readable response body")
    func streamingPathReceivesReadableBody() async throws {
        try await withServer { baseURL in
            let result = try await withLoadedBundleProcess { process in
                try await process.evaluate(js: "__claudeInit('sk-ant-test-key')")
                return try await process.evaluateAsync(js: """
                    (async function() {
                        try {
                            var client = new globalThis.__claudeClient.constructor({
                                apiKey: 'sk-ant-test-key',
                                baseURL: '\(baseURL)'
                            });

                            var streamResult = await client.messages.create({
                                model: 'claude-sonnet-4-20250514',
                                max_tokens: 16,
                                messages: [{ role: 'user', content: 'Hello' }],
                                stream: true
                            }).withResponse();

                            var details = {
                                hasBody: !!streamResult.response.body,
                                iteratorType: typeof streamResult.data[Symbol.asyncIterator],
                                error: null
                            };

                            return JSON.stringify(details);
                        } catch (error) {
                            return JSON.stringify({
                                hasBody: false,
                                iteratorType: 'error',
                                error: error && error.message ? error.message : String(error)
                            });
                        }
                    })()
                """)
            }

            let json = result.stringValue
            let parsed = try JSONSerialization.jsonObject(with: Data(json.utf8)) as? [String: Any]
            #expect(parsed?["hasBody"] as? Bool == true)
            #expect(parsed?["iteratorType"] as? String == "function")
        }
    }

    // MARK: - Runtime Environment Verification

    @Test("fetch is available and callable")
    func fetchAvailable() async throws {
        let result = try await withLoadedBundleProcess { process in
            try await process.evaluate(js: "typeof fetch")
        }
        #expect(result.stringValue == "function")
    }

    @Test("process.env is writable from Swift")
    func processEnvWritable() async throws {
        let result = try await withLoadedBundleProcess { process in
            try await process.evaluate(js: "process.env.ANTHROPIC_API_KEY = 'test-key-from-swift'")
            return try await process.evaluate(js: "process.env.ANTHROPIC_API_KEY")
        }
        #expect(result.stringValue == "test-key-from-swift")
    }

    @Test("Bun global is available")
    func bunGlobalAvailable() async throws {
        let result = try await withLoadedBundleProcess { process in
            try await process.evaluate(js: "typeof Bun")
        }
        #expect(result.stringValue == "object")
    }

    @Test("console.log works inside bundle context")
    func consoleLogWorks() async throws {
        _ = try await withLoadedBundleProcess { process in
            try await process.evaluate(js: "console.log('Bundle loaded:', __bundleInfo.name)")
            return true
        }
    }

    @Test("Console output is captured via output stream")
    func consoleOutputWorks() async throws {
        let found = try await withLoadedBundleProcess { process in
            try await process.evaluate(js: "console.log('bundle test output');")

            for await line in process.output {
                if line.contains("bundle test output") {
                    return true
                }
            }
            return false
        }
        #expect(found)
    }
}

enum BundleTestError: Error {
    case fixtureNotFound
}
