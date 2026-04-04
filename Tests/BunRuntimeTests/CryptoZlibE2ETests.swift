import Testing
import Foundation
@testable import BunRuntime
import TestHeartbeat

@Suite("Crypto and Zlib E2E", .serialized, .heartbeat)
struct CryptoZlibE2ETests {
    private func removeIfPresent(_ url: URL) {
        guard FileManager.default.fileExists(atPath: url.path) else {
            return
        }

        do {
            try FileManager.default.removeItem(at: url)
        } catch {
        }
    }

    @Test("run() completes subtle crypto workflow and exits naturally")
    func runModeSubtleCryptoWorkflow() async throws {
        let url = try tempBundle("""
            globalThis.__swiftBunStartupPromise = (async function() {
                var passwordKey = await crypto.subtle.importKey(
                    'raw',
                    new TextEncoder().encode('password'),
                    'PBKDF2',
                    false,
                    ['deriveKey']
                );
                var wrappingKey = await crypto.subtle.deriveKey(
                    {
                        name: 'PBKDF2',
                        hash: 'SHA-256',
                        salt: new TextEncoder().encode('salt'),
                        iterations: 500
                    },
                    passwordKey,
                    { name: 'AES-GCM', length: 128 },
                    true,
                    ['wrapKey', 'unwrapKey', 'encrypt', 'decrypt']
                );

                var aesKey = await crypto.subtle.generateKey(
                    { name: 'AES-GCM', length: 256 },
                    true,
                    ['encrypt', 'decrypt']
                );
                var iv = new Uint8Array(12);
                crypto.getRandomValues(iv);
                var plaintext = new TextEncoder().encode('crypto-e2e');
                var ciphertext = await crypto.subtle.encrypt(
                    { name: 'AES-GCM', iv: iv, tagLength: 128 },
                    aesKey,
                    plaintext
                );
                var decrypted = await crypto.subtle.decrypt(
                    { name: 'AES-GCM', iv: iv, tagLength: 128 },
                    aesKey,
                    ciphertext
                );

                var hmacKey = await crypto.subtle.generateKey(
                    { name: 'HMAC', hash: { name: 'SHA-256' } },
                    true,
                    ['sign', 'verify']
                );
                var signature = await crypto.subtle.sign({ name: 'HMAC' }, hmacKey, plaintext);
                var verified = await crypto.subtle.verify({ name: 'HMAC' }, hmacKey, signature, plaintext);

                var wrapIv = new Uint8Array(12);
                crypto.getRandomValues(wrapIv);
                var wrapped = await crypto.subtle.wrapKey(
                    'raw',
                    hmacKey,
                    wrappingKey,
                    { name: 'AES-GCM', iv: wrapIv, tagLength: 128 }
                );
                var unwrapped = await crypto.subtle.unwrapKey(
                    'raw',
                    wrapped,
                    wrappingKey,
                    { name: 'AES-GCM', iv: wrapIv, tagLength: 128 },
                    { name: 'HMAC', hash: { name: 'SHA-256' } },
                    true,
                    ['sign', 'verify']
                );
                var unwrappedVerified = await crypto.subtle.verify({ name: 'HMAC' }, unwrapped, signature, plaintext);

                process.stdout.write(JSON.stringify({
                    decrypted: new TextDecoder().decode(decrypted),
                    verified: verified,
                    unwrappedVerified: unwrappedVerified,
                    signatureLength: new Uint8Array(signature).length,
                    wrappedLength: new Uint8Array(wrapped).length
                }) + '\\n');
            })();
        """)
        defer {
            removeIfPresent(url)
        }

        let process = BunProcess(bundle: url)
        let stdout = LinesCollector()
        let output = LinesCollector()
        let stdoutTask = Task { [stdout] in
            for await line in process.stdout {
                stdout.append(line)
            }
        }
        let outputTask = Task { [output] in
            for await line in process.output {
                output.append(line)
            }
        }

        let exitCode = try await TestProcessSupport.run(process)
        _ = await stdoutTask.result
        _ = await outputTask.result

        #expect(exitCode == 0)
        #expect(stdout.values.contains(where: { line in
            line.contains(#""decrypted":"crypto-e2e""#)
                && line.contains(#""verified":true"#)
                && line.contains(#""unwrappedVerified":true"#)
                && line.contains(#""signatureLength":32"#)
                && !line.contains(#""wrappedLength":0"#)
        }))
        #expect(!output.values.contains { $0.lowercased().contains("error") })
    }

    @Test("run() completes zlib promise and transform workflow and exits naturally")
    func runModeZlibWorkflow() async throws {
        let url = try tempBundle("""
            globalThis.__swiftBunStartupPromise = (async function() {
                var zlib = require('node:zlib');
                var consumers = require('node:stream/consumers');

                var compressed = await zlib.promises.gzip('zlib-e2e');
                var promiseValue = (await zlib.promises.unzip(compressed)).toString();

                var encoder = new zlib.Gzip();
                var decoder = new zlib.Unzip();
                encoder.pipe(decoder);
                encoder.end('transform-e2e');
                var streamed = await consumers.text(decoder);

                process.stdout.write(JSON.stringify({
                    promiseValue: promiseValue,
                    streamed: streamed
                }) + '\\n');
            })();
        """)
        defer {
            removeIfPresent(url)
        }

        let process = BunProcess(bundle: url)
        let stdout = LinesCollector()
        let output = LinesCollector()
        let stdoutTask = Task { [stdout] in
            for await line in process.stdout {
                stdout.append(line)
            }
        }
        let outputTask = Task { [output] in
            for await line in process.output {
                output.append(line)
            }
        }

        let exitCode = try await TestProcessSupport.run(process)
        _ = await stdoutTask.result
        _ = await outputTask.result

        #expect(exitCode == 0)
        #expect(stdout.values.contains(#"{"promiseValue":"zlib-e2e","streamed":"transform-e2e"}"# + "\n"))
        #expect(!output.values.contains { $0.lowercased().contains("error") })
    }

    @Test("run() completes brotli workflow and exits naturally")
    func runModeBrotliWorkflow() async throws {
        let url = try tempBundle("""
            globalThis.__swiftBunStartupPromise = (async function() {
                var zlib = require('node:zlib');
                var consumers = require('node:stream/consumers');

                var compressed = await zlib.promises.brotliCompress('brotli-e2e');
                var promiseValue = (await zlib.promises.brotliDecompress(compressed)).toString();

                var encoder = new zlib.BrotliCompress();
                var decoder = new zlib.BrotliDecompress();
                encoder.pipe(decoder);
                encoder.end('brotli-transform');
                var streamed = await consumers.text(decoder);

                process.stdout.write(JSON.stringify({
                    promiseValue: promiseValue,
                    streamed: streamed
                }) + '\\n');
            })();
        """)
        defer {
            removeIfPresent(url)
        }

        let process = BunProcess(bundle: url)
        let stdout = LinesCollector()
        let output = LinesCollector()
        let stdoutTask = Task { [stdout] in
            for await line in process.stdout {
                stdout.append(line)
            }
        }
        let outputTask = Task { [output] in
            for await line in process.output {
                output.append(line)
            }
        }

        let exitCode = try await TestProcessSupport.run(process)
        _ = await stdoutTask.result
        _ = await outputTask.result

        #expect(exitCode == 0)
        #expect(stdout.values.contains(#"{"promiseValue":"brotli-e2e","streamed":"brotli-transform"}"# + "\n"))
        #expect(!output.values.contains { $0.lowercased().contains("error") })
    }
}
