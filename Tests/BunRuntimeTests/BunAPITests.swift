import Testing
@preconcurrency import JavaScriptCore
import Foundation
@testable import BunRuntime
import TestHeartbeat

@Suite("Bun API", .serialized, .heartbeat)
struct BunAPITests {
    private func evaluate(_ js: String) async throws -> JSResult {
        try await TestProcessSupport.withLoadedProcess { process in
            try await process.evaluate(js: js)
        }
    }

    private func evaluateAsync(_ js: String) async throws -> JSResult {
        try await TestProcessSupport.withLoadedProcess { process in
            try await process.evaluateAsync(js: js)
        }
    }

    private func withLoadedProcess<T: Sendable>(
        _ body: (BunProcess) async throws -> T
    ) async throws -> T {
        try await TestProcessSupport.withLoadedProcess(operation: body)
    }

    @Test("Bun.version is set")
    func bunVersion() async throws {
        let result = try await evaluate("Bun.version")
        #expect(result.stringValue == "swift-bun-shim")
    }

    @Test("Bun.nanoseconds returns number")
    func bunNanoseconds() async throws {
        let result = try await evaluate("typeof Bun.nanoseconds()")
        #expect(result.stringValue == "number")
    }

    @Test("Bun.env mirrors process.env")
    func bunEnvMirror() async throws {
        let result = try await evaluate("""
            process.env.TEST_KEY = 'test_value';
            Bun.env.TEST_KEY;
        """)
        #expect(result.stringValue == "test_value")
    }

    @Test("Bun.escapeHTML")
    func bunEscapeHTML() async throws {
        let result = try await evaluate("""
            Bun.escapeHTML('<script>alert("xss")</script>')
        """)
        let expected = "&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;"
        #expect(result.stringValue == expected)
    }

    @Test("Bun.deepEquals basic objects")
    func bunDeepEquals() async throws {
        let result = try await evaluate("""
            Bun.deepEquals({a: 1, b: [2, 3]}, {a: 1, b: [2, 3]})
        """)
        #expect(result.boolValue == true)
    }

    @Test("Bun.deepEquals NaN === NaN")
    func bunDeepEqualsNaN() async throws {
        let result = try await evaluate("Bun.deepEquals(NaN, NaN)")
        #expect(result.boolValue == true)
    }

    @Test("Bun.deepEquals Date comparison")
    func bunDeepEqualsDate() async throws {
        let result = try await evaluate("""
            Bun.deepEquals(new Date(1000), new Date(1000))
                && !Bun.deepEquals(new Date(1000), new Date(2000))
        """)
        #expect(result.boolValue == true)
    }

    @Test("Bun.deepEquals shared reference is compared correctly")
    func bunDeepEqualsSharedRef() async throws {
        let result = try await evaluate("""
            var shared = {a: 1};
            Bun.deepEquals({x: shared, y: shared}, {x: shared, y: {a: 2}})
        """)
        #expect(result.boolValue == false)
    }

    @Test("Bun.deepEquals circular reference does not hang")
    func bunDeepEqualsCircular() async throws {
        let result = try await evaluate("""
            var a = {}; a.self = a;
            var b = {}; b.self = b;
            Bun.deepEquals(a, b)
        """)
        #expect(result.boolValue == true)
    }

    @Test("Bun.hash returns number")
    func bunHash() async throws {
        let result = try await evaluate("typeof Bun.hash('hello')")
        #expect(result.stringValue == "number")
    }

    @Test("Bun.fileURLToPath converts correctly")
    func bunFileURLToPath() async throws {
        let result = try await evaluate("Bun.fileURLToPath('file:///tmp/test.js')")
        #expect(result.stringValue == "/tmp/test.js")
    }

    @Test("Bun.file exposes text json bytes and size")
    func bunFileCoreMethods() async throws {
        let url = FileManager.default.temporaryDirectory.appendingPathComponent(UUID().uuidString + ".json")
        try #"{"value":"hello"}"#.write(to: url, atomically: true, encoding: .utf8)
        defer {
            do { try FileManager.default.removeItem(at: url) } catch {}
        }

        let result = try await evaluateAsync("""
            (async function() {
                var file = Bun.file('\(url.path)');
                var text = await file.text();
                var json = await file.json();
                var bytes = await file.bytes();
                return JSON.stringify({
                    text: text,
                    value: json.value,
                    size: file.size,
                    bytesLength: bytes.length,
                    type: file.type
                });
            })()
        """)

        #expect(result.stringValue.contains(#""text":"{\"value\":\"hello\"}""#))
        #expect(result.stringValue.contains(#""value":"hello""#))
        #expect(result.stringValue.contains(#""size":17"#))
        #expect(result.stringValue.contains(#""bytesLength":17"#))
        #expect(result.stringValue.contains(#""type":"application/json""#))
    }

    @Test("Bun.file stream slice and writer work")
    func bunFileStreamSliceAndWriter() async throws {
        let inputURL = FileManager.default.temporaryDirectory.appendingPathComponent(UUID().uuidString + ".txt")
        let outputURL = FileManager.default.temporaryDirectory.appendingPathComponent(UUID().uuidString + ".txt")
        try "abcdef".write(to: inputURL, atomically: true, encoding: .utf8)
        defer {
            do { try FileManager.default.removeItem(at: inputURL) } catch {}
            do { try FileManager.default.removeItem(at: outputURL) } catch {}
        }

        let result = try await evaluateAsync("""
            (async function() {
                var file = Bun.file('\(inputURL.path)');
                var reader = file.stream().getReader();
                var first = await reader.read();
                var slice = await file.slice(1, 4).text();

                var writer = Bun.file('\(outputURL.path)').writer();
                await writer.write('xy');
                var written = await writer.end('z');
                var output = await Bun.file('\(outputURL.path)').text();

                return JSON.stringify({
                    stream: new TextDecoder().decode(first.value),
                    done: first.done,
                    slice: slice,
                    written: written,
                    output: output
                });
            })()
        """)

        #expect(result.stringValue.contains(#""stream":"abcdef""#))
        #expect(result.stringValue.contains(#""done":false"#))
        #expect(result.stringValue.contains(#""slice":"bcd""#))
        #expect(result.stringValue.contains(#""written":3"#))
        #expect(result.stringValue.contains(#""output":"xyz""#))
    }

    @Test("Bun.write accepts string Uint8Array Blob and Bun.file")
    func bunWriteAcceptedInputs() async throws {
        let stringURL = FileManager.default.temporaryDirectory.appendingPathComponent(UUID().uuidString + ".txt")
        let bytesURL = FileManager.default.temporaryDirectory.appendingPathComponent(UUID().uuidString + ".txt")
        let blobURL = FileManager.default.temporaryDirectory.appendingPathComponent(UUID().uuidString + ".txt")
        let sourceURL = FileManager.default.temporaryDirectory.appendingPathComponent(UUID().uuidString + ".txt")
        let fileURL = FileManager.default.temporaryDirectory.appendingPathComponent(UUID().uuidString + ".txt")
        try "from file".write(to: sourceURL, atomically: true, encoding: .utf8)
        defer {
            for url in [stringURL, bytesURL, blobURL, sourceURL, fileURL] {
                do { try FileManager.default.removeItem(at: url) } catch {}
            }
        }

        let result = try await evaluateAsync("""
            (async function() {
                await Bun.write('\(stringURL.path)', 'hello');
                await Bun.write('\(bytesURL.path)', new Uint8Array([119, 111, 114, 108, 100]));
                await Bun.write('\(blobURL.path)', new Blob(['blob text'], { type: 'text/plain' }));
                await Bun.write('\(fileURL.path)', Bun.file('\(sourceURL.path)'));

                return JSON.stringify({
                    string: await Bun.file('\(stringURL.path)').text(),
                    bytes: await Bun.file('\(bytesURL.path)').text(),
                    blob: await Bun.file('\(blobURL.path)').text(),
                    file: await Bun.file('\(fileURL.path)').text()
                });
            })()
        """)

        #expect(result.stringValue == #"{"string":"hello","bytes":"world","blob":"blob text","file":"from file"}"#)
    }

    @Test("Bun.write and Bun.file writer preserve binary bytes")
    func bunWriteAndWriterPreserveBinaryBytes() async throws {
        let writeURL = FileManager.default.temporaryDirectory.appendingPathComponent(UUID().uuidString + ".bin")
        let writerURL = FileManager.default.temporaryDirectory.appendingPathComponent(UUID().uuidString + ".bin")
        defer {
            do { try FileManager.default.removeItem(at: writeURL) } catch {}
            do { try FileManager.default.removeItem(at: writerURL) } catch {}
        }

        _ = try await evaluateAsync("""
            (async function() {
                await Bun.write('\(writeURL.path)', new Uint8Array([0, 255, 128, 65]));

                var writer = Bun.file('\(writerURL.path)').writer();
                await writer.write(new Uint8Array([0, 255]));
                await writer.end(new Uint8Array([128, 65]));
                return true;
            })()
        """)

        let writtenBytes = try Data(contentsOf: writeURL)
        let writerBytes = try Data(contentsOf: writerURL)
        #expect(Array(writtenBytes) == [0, 255, 128, 65])
        #expect(Array(writerBytes) == [0, 255, 128, 65])
    }

    @Test("Bun.stdin text and stream consume stdin")
    func bunStdinTextAndStream() async throws {
        let textResult = try await withLoadedProcess { process in
            let textPromise = Task {
                try await process.evaluateAsync(js: """
                (async function() {
                    return await Bun.stdin.text();
                })()
            """)
            }
            try await Task.sleep(nanoseconds: 50_000_000)
            process.sendInput("alpha".data(using: .utf8)!)
            process.sendInput(nil)
            return try await textPromise.value
        }
        #expect(textResult.stringValue == "alpha")

        let streamResult = try await withLoadedProcess { process in
            let streamPromise = Task {
                try await process.evaluateAsync(js: """
                (async function() {
                    var reader = Bun.stdin.stream().getReader();
                    var chunks = [];
                    while (true) {
                        var step = await reader.read();
                        if (step.done) break;
                        chunks.push(new TextDecoder().decode(step.value));
                    }
                    return chunks.join('');
                })()
            """)
            }
            try await Task.sleep(nanoseconds: 50_000_000)
            process.sendInput("beta".data(using: .utf8)!)
            process.sendInput(nil)
            return try await streamPromise.value
        }
        #expect(streamResult.stringValue == "beta")
    }

    @Test("Bun stdout and stderr write return byte counts")
    func bunStdoutStderrWrite() async throws {
        let result = try await evaluate("""
            JSON.stringify({
                stdout: Bun.stdout.write(new Uint8Array([65, 66])),
                stderr: Bun.stderr.write('xyz')
            })
        """)
        #expect(result.stringValue == #"{"stdout":2,"stderr":3}"#)
    }

    @Test("Bun semver YAML and Glob use package-backed behavior")
    func bunUtilityPackages() async throws {
        let result = try await evaluate("""
            (function() {
                var yaml = Bun.YAML.parse('name: demo\\nitems:\\n  - one\\n  - two\\n');
                var glob = new Bun.Glob('src/**/*.swift');
                return JSON.stringify({
                    semver: Bun.semver.satisfies('1.2.3', '^1.2.0'),
                    yamlItems: yaml.items.length,
                    globMatch: glob.match('src/BunRuntime/BunFile.swift')
                });
            })()
        """)
        #expect(result.stringValue == #"{"semver":true,"yamlItems":2,"globMatch":true}"#)
    }

    @Test("Bun.serve throws not supported")
    func bunServeNotSupported() async throws {
        await #expect(throws: BunRuntimeError.self) {
            try await withLoadedProcess { process in
                try await process.evaluate(js: "Bun.serve({})")
            }
        }
    }

    @Test("Bun.spawn throws not supported")
    func bunSpawnNotSupported() async throws {
        await #expect(throws: BunRuntimeError.self) {
            try await withLoadedProcess { process in
                try await process.evaluate(js: "Bun.spawn(['echo', 'hello'])")
            }
        }
    }
}

// MARK: - Edge Case Tests
