import Testing
@preconcurrency import JavaScriptCore
import Foundation
@testable import BunRuntime
import TestHeartbeat

@Suite("Node.js Stream Compatibility", .serialized, .heartbeat)
struct NodeCompatStreamTests {
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

    private func withServer(
        _ body: (String) async throws -> Void
    ) async throws {
        let server = try await LocalHTTPTestServer.start()
        do {
            try await body(server.baseURL)
            try await server.shutdown()
        } catch {
            do { try await server.shutdown() } catch {}
            throw error
        }
    }

    private func makeLayer0Context() throws -> JSContext {
        guard let context = JSContext() else {
            throw BunRuntimeError.contextCreationFailed
        }
        let (polyfillsURL, source) = try JavaScriptResource.source(for: .bundle(.polyfills))
        context.evaluateScript(source, withSourceURL: polyfillsURL)
        if let exception = context.exception {
            let message = exception.toString() ?? "Unknown JS exception"
            context.exception = nil
            throw BunRuntimeError.javaScriptException(message)
        }
        return context
    }

    @Test("NodeHTTP install leaves native fetch undefined")
    func nodeHTTPInstallDoesNotInstallNativeFetch() throws {
        guard let context = JSContext() else {
            #expect(Bool(false))
            return
        }
        try JavaScriptModuleInstaller(script: .nodeCompat(.http)).install(into: context)
        let result = context.evaluateScript("typeof __nativeFetch")
        #expect(result?.toString() == "undefined")
    }

    @Test("installModules preserves Layer 0 stdio object identity")
    func installModulesPreservesLayer0Stdio() throws {
        let context = try makeLayer0Context()
        let stdinBefore = context.evaluateScript("process.stdin")
        let stdoutBefore = context.evaluateScript("process.stdout")

        try ESMResolver().installModules(into: context)

        let stdinAfter = context.evaluateScript("process.stdin")
        let stdoutAfter = context.evaluateScript("process.stdout")

        #expect(stdinBefore?.isEqual(to: stdinAfter) == true)
        #expect(stdoutBefore?.isEqual(to: stdoutAfter) == true)
    }

    @Test("node:stream reuses Layer 0 stream constructors")
    func nodeStreamReusesLayer0Constructors() throws {
        let context = try makeLayer0Context()
        let resolver = ESMResolver()
        try resolver.installModules(into: context)
        try resolver.installRequire(into: context)

        let result = context.evaluateScript("""
            (function() {
                var stream = require('node:stream');
                return stream.Readable === globalThis.__readableStream.Readable &&
                    stream.Writable === globalThis.__readableStream.Writable &&
                    process.stdin.constructor === stream.Readable &&
                    process.stdout.constructor === stream.Writable;
            })()
        """)

        #expect(result?.toBool() == true)
    }

    @Test("fetch Response.body exposes a readable stream")
    func fetchResponseBodyReadableStream() async throws {
        try await withServer { baseURL in
            let result = try await evaluateAsync("""
                (async function() {
                    var response = await fetch('\(baseURL)/json');
                    if (!response.body || typeof response.body.getReader !== 'function') {
                        return 'missing-body';
                    }

                    var reader = response.body.getReader();
                    var chunks = [];
                    while (true) {
                        var step = await reader.read();
                        if (step.done) break;
                        chunks.push(new TextDecoder().decode(step.value));
                    }
                    return chunks.join('');
                })()
            """)

            #expect(result.stringValue.contains("Sample Slide Show"))
        }
    }

    @Test("http.request response is pipeable and readable")
    func httpRequestResponsePipeable() async throws {
        try await withServer { baseURL in
            let result = try await evaluateAsync("""
                (async function() {
                    var http = require('node:http');
                    var Stream = require('node:stream');

                    return await new Promise(function(resolve) {
                        var req = http.request('\(baseURL)/json', function(res) {
                            if (typeof res.pipe !== 'function' || typeof res.resume !== 'function') {
                                resolve('missing-stream-methods');
                                return;
                            }

                            var dest = new Stream.PassThrough();
                            dest.setEncoding('utf8');

                            var chunks = [];
                            dest.on('data', function(chunk) { chunks.push(chunk); });
                            dest.on('end', function() { resolve(chunks.join('')); });
                            res.on('error', function(error) { resolve('response-error:' + error.message); });

                            res.pipe(dest);
                        });

                        req.on('error', function(error) { resolve('request-error:' + error.message); });
                        req.end();
                    });
                })()
            """)

            #expect(result.stringValue.contains("Sample Slide Show"))
        }
    }

    @Test("stream/promises pipeline writes to fs.createWriteStream")
    func streamPromisesPipelineWithFSWriteStream() async throws {
        let tmpPath = NSTemporaryDirectory() + "swift-bun-pipeline-\(UUID().uuidString).txt"
        defer { try? FileManager.default.removeItem(atPath: tmpPath) }

        let result = try await evaluateAsync("""
            (async function() {
                var fs = require('node:fs');
                var Stream = require('node:stream');
                var promises = require('node:stream/promises');

                var source = new Stream.PassThrough();
                var destination = fs.createWriteStream('\(tmpPath)');
                source.end('hello pipeline');

                await promises.pipeline(source, destination);
                return fs.readFileSync('\(tmpPath)', 'utf-8');
            })()
        """)

        #expect(result.stringValue == "hello pipeline")
    }
}
