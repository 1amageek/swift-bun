import Testing
import Foundation
@testable import BunRuntime

@Suite("BunRuntime")
struct BunRuntimeTests {

    @Test("Create context and evaluate basic JS")
    func evaluateBasicJS() async throws {
        let process = BunProcess()
        try await process.load()
        let result = try await process.evaluate(js: "1 + 2")
        #expect(result.int32Value == 3)
    }

    @Test("String evaluation")
    func evaluateString() async throws {
        let process = BunProcess()
        try await process.load()
        let result = try await process.evaluate(js: "'hello' + ' ' + 'world'")
        #expect(result.stringValue == "hello world")
    }

    @Test("Call global function")
    func callGlobalFunction() async throws {
        let process = BunProcess()
        try await process.load()
        try await process.evaluate(js: "function add(a, b) { return a + b; }")
        let result = try await process.call("add", arguments: [3, 4])
        #expect(result.int32Value == 7)
    }

    @Test("JavaScript exception is thrown")
    func javaScriptException() async throws {
        let process = BunProcess()
        try await process.load()
        await #expect(throws: BunRuntimeError.self) {
            try await process.evaluate(js: "throw new Error('test error')")
        }
    }

    @Test("Function not found throws error")
    func functionNotFound() async throws {
        let process = BunProcess()
        try await process.load()
        await #expect(throws: BunRuntimeError.self) {
            try await process.call("nonexistentFunction")
        }
    }
}

@Suite("Node.js Compatibility")
struct NodeCompatTests {

    @Test("require('node:path') works")
    func requireNodePath() async throws {
        let process = BunProcess()
        try await process.load()
        let result = try await process.evaluate(js: """
            var path = require('node:path');
            path.join('/foo', 'bar', 'baz');
        """)
        #expect(result.stringValue == "/foo/bar/baz")
    }

    @Test("path.basename")
    func pathBasename() async throws {
        let process = BunProcess()
        try await process.load()
        let result = try await process.evaluate(js: """
            require('node:path').basename('/foo/bar/baz.txt')
        """)
        #expect(result.stringValue == "baz.txt")
    }

    @Test("path.dirname")
    func pathDirname() async throws {
        let process = BunProcess()
        try await process.load()
        let result = try await process.evaluate(js: """
            require('node:path').dirname('/foo/bar/baz.txt')
        """)
        #expect(result.stringValue == "/foo/bar")
    }

    @Test("path.extname")
    func pathExtname() async throws {
        let process = BunProcess()
        try await process.load()
        let result = try await process.evaluate(js: """
            require('node:path').extname('/foo/bar/baz.txt')
        """)
        #expect(result.stringValue == ".txt")
    }

    @Test("path.isAbsolute")
    func pathIsAbsolute() async throws {
        let process = BunProcess()
        try await process.load()
        let result = try await process.evaluate(js: """
            require('node:path').isAbsolute('/foo')
        """)
        #expect(result.boolValue == true)
    }

    @Test("Buffer.from string")
    func bufferFromString() async throws {
        let process = BunProcess()
        try await process.load()
        let result = try await process.evaluate(js: """
            Buffer.from('hello').toString('utf-8')
        """)
        #expect(result.stringValue == "hello")
    }

    @Test("Buffer.from hex encoding")
    func bufferHex() async throws {
        let process = BunProcess()
        try await process.load()
        let result = try await process.evaluate(js: """
            Buffer.from('hello').toString('hex')
        """)
        #expect(result.stringValue == "68656c6c6f")
    }

    @Test("Buffer.concat")
    func bufferConcat() async throws {
        let process = BunProcess()
        try await process.load()
        let result = try await process.evaluate(js: """
            Buffer.concat([Buffer.from('hello'), Buffer.from(' world')]).toString('utf-8')
        """)
        #expect(result.stringValue == "hello world")
    }

    @Test("require('node:crypto') randomUUID")
    func cryptoRandomUUID() async throws {
        let process = BunProcess()
        try await process.load()
        let result = try await process.evaluate(js: """
            require('node:crypto').randomUUID()
        """)
        let uuid = result.stringValue
        #expect(uuid.count == 36)
        #expect(uuid.contains("-"))
    }

    @Test("crypto.createHash('sha256')")
    func cryptoHash() async throws {
        let process = BunProcess()
        try await process.load()
        let result = try await process.evaluate(js: """
            require('node:crypto').createHash('sha256').update('hello').digest('hex')
        """)
        #expect(result.stringValue == "2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824")
    }

    @Test("process.env is accessible")
    func processEnv() async throws {
        let process = BunProcess()
        try await process.load()
        let result = try await process.evaluate(js: """
            typeof process.env
        """)
        #expect(result.stringValue == "object")
    }

    @Test("process.platform is darwin")
    func processPlatform() async throws {
        let process = BunProcess()
        try await process.load()
        let result = try await process.evaluate(js: "process.platform")
        #expect(result.stringValue == "darwin")
    }

    @Test("console.log does not crash")
    func consoleLog() async throws {
        let process = BunProcess()
        try await process.load()
        try await process.evaluate(js: "console.log('test message from JS')")
    }

    @Test("TextEncoder/TextDecoder roundtrip")
    func textEncoderDecoder() async throws {
        let process = BunProcess()
        try await process.load()
        let result = try await process.evaluate(js: """
            new TextDecoder().decode(new TextEncoder().encode('hello'))
        """)
        #expect(result.stringValue == "hello")
    }

    @Test("require('node:url').parse")
    func urlParse() async throws {
        let process = BunProcess()
        try await process.load()
        let result = try await process.evaluate(js: """
            var u = require('node:url').parse('https://example.com/path?q=1');
            u.hostname;
        """)
        #expect(result.stringValue == "example.com")
    }

    @Test("require('node:util').format")
    func utilFormat() async throws {
        let process = BunProcess()
        try await process.load()
        let result = try await process.evaluate(js: """
            require('node:util').format('hello %s, you are %d', 'world', 42)
        """)
        #expect(result.stringValue == "hello world, you are 42")
    }

    @Test("require('node:os').platform()")
    func osPlatform() async throws {
        let process = BunProcess()
        try await process.load()
        let result = try await process.evaluate(js: """
            require('node:os').platform()
        """)
        #expect(result.stringValue == "darwin")
    }

    @Test("EventEmitter basic usage")
    func eventEmitter() async throws {
        let process = BunProcess()
        try await process.load()
        let result = try await process.evaluate(js: """
            var EventEmitter = require('node:events').EventEmitter;
            var ee = new EventEmitter();
            var received = '';
            ee.on('test', function(data) { received = data; });
            ee.emit('test', 'hello');
            received;
        """)
        #expect(result.stringValue == "hello")
    }

    @Test("require without node: prefix")
    func requireWithoutPrefix() async throws {
        let process = BunProcess()
        try await process.load()
        let result = try await process.evaluate(js: """
            var path = require('path');
            path.join('a', 'b');
        """)
        #expect(result.stringValue == "a/b")
    }

    @Test("require unknown module throws")
    func requireUnknown() async throws {
        let process = BunProcess()
        try await process.load()
        await #expect(throws: BunRuntimeError.self) {
            try await process.evaluate(js: "require('unknown-module')")
        }
    }

    @Test("fs.readFileSync throws ENOENT for missing file")
    func fsReadFileThrowsENOENT() async throws {
        let process = BunProcess()
        try await process.load()
        await #expect(throws: BunRuntimeError.self) {
            try await process.evaluate(js: """
                require('node:fs').readFileSync('/nonexistent/path/file.txt')
            """)
        }
    }

    @Test("fs.writeFileSync and readFileSync roundtrip")
    func fsWriteReadRoundtrip() async throws {
        let process = BunProcess()
        try await process.load()
        let tmpPath = NSTemporaryDirectory() + "swift-bun-test-\(UUID().uuidString).txt"
        defer { try? FileManager.default.removeItem(atPath: tmpPath) }

        let result = try await process.evaluate(js: """
            var fs = require('node:fs');
            fs.writeFileSync('\(tmpPath)', 'hello from swift-bun');
            fs.readFileSync('\(tmpPath)', 'utf-8');
        """)
        #expect(result.stringValue == "hello from swift-bun")
    }

    @Test("fs.existsSync returns false for missing file")
    func fsExistsSyncMissing() async throws {
        let process = BunProcess()
        try await process.load()
        let result = try await process.evaluate(js: """
            require('node:fs').existsSync('/nonexistent/file.txt')
        """)
        #expect(result.boolValue == false)
    }
}

@Suite("Bun API")
struct BunAPITests {

    @Test("Bun.version is set")
    func bunVersion() async throws {
        let process = BunProcess()
        try await process.load()
        let result = try await process.evaluate(js: "Bun.version")
        #expect(result.stringValue == "swift-bun-shim")
    }

    @Test("Bun.nanoseconds returns number")
    func bunNanoseconds() async throws {
        let process = BunProcess()
        try await process.load()
        let result = try await process.evaluate(js: "typeof Bun.nanoseconds()")
        #expect(result.stringValue == "number")
    }

    @Test("Bun.env mirrors process.env")
    func bunEnvMirror() async throws {
        let process = BunProcess()
        try await process.load()
        let result = try await process.evaluate(js: """
            process.env.TEST_KEY = 'test_value';
            Bun.env.TEST_KEY;
        """)
        #expect(result.stringValue == "test_value")
    }

    @Test("Bun.escapeHTML")
    func bunEscapeHTML() async throws {
        let process = BunProcess()
        try await process.load()
        let result = try await process.evaluate(js: """
            Bun.escapeHTML('<script>alert("xss")</script>')
        """)
        let expected = "&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;"
        #expect(result.stringValue == expected)
    }

    @Test("Bun.deepEquals")
    func bunDeepEquals() async throws {
        let process = BunProcess()
        try await process.load()
        let result = try await process.evaluate(js: """
            Bun.deepEquals({a: 1, b: [2, 3]}, {a: 1, b: [2, 3]})
        """)
        #expect(result.boolValue == true)
    }

    @Test("Bun.hash returns number")
    func bunHash() async throws {
        let process = BunProcess()
        try await process.load()
        let result = try await process.evaluate(js: "typeof Bun.hash('hello')")
        #expect(result.stringValue == "number")
    }

    @Test("Bun.fileURLToPath converts correctly")
    func bunFileURLToPath() async throws {
        let process = BunProcess()
        try await process.load()
        let result = try await process.evaluate(js: "Bun.fileURLToPath('file:///tmp/test.js')")
        #expect(result.stringValue == "/tmp/test.js")
    }

    @Test("Bun.serve throws not supported")
    func bunServeNotSupported() async throws {
        let process = BunProcess()
        try await process.load()
        await #expect(throws: BunRuntimeError.self) {
            try await process.evaluate(js: "Bun.serve({})")
        }
    }

    @Test("Bun.spawn throws not supported")
    func bunSpawnNotSupported() async throws {
        let process = BunProcess()
        try await process.load()
        await #expect(throws: BunRuntimeError.self) {
            try await process.evaluate(js: "Bun.spawn(['echo', 'hello'])")
        }
    }
}

// MARK: - Edge Case Tests

@Suite("TextEncoder/TextDecoder Edge Cases")
struct TextCodecEdgeCaseTests {

    @Test("ASCII roundtrip")
    func asciiRoundtrip() async throws {
        let process = BunProcess()
        try await process.load()
        let result = try await process.evaluate(js: """
            new TextDecoder().decode(new TextEncoder().encode('Hello, World!'))
        """)
        #expect(result.stringValue == "Hello, World!")
    }

    @Test("Multibyte UTF-8 roundtrip (Japanese)")
    func multibyteCJK() async throws {
        let process = BunProcess()
        try await process.load()
        let result = try await process.evaluate(js: """
            new TextDecoder().decode(new TextEncoder().encode('こんにちは'))
        """)
        #expect(result.stringValue == "こんにちは")
    }

    @Test("4-byte UTF-8 emoji roundtrip")
    func fourByteEmoji() async throws {
        let process = BunProcess()
        try await process.load()
        let result = try await process.evaluate(js: """
            new TextDecoder().decode(new TextEncoder().encode('🎉🚀'))
        """)
        #expect(result.stringValue == "🎉🚀")
    }

    @Test("Empty string roundtrip")
    func emptyString() async throws {
        let process = BunProcess()
        try await process.load()
        let result = try await process.evaluate(js: """
            new TextDecoder().decode(new TextEncoder().encode(''))
        """)
        #expect(result.stringValue == "")
    }

    @Test("Truncated 2-byte sequence does not crash")
    func truncated2Byte() async throws {
        let process = BunProcess()
        try await process.load()
        // 0xC3 starts a 2-byte sequence but is alone
        let result = try await process.evaluate(js: """
            new TextDecoder().decode(new Uint8Array([0x41, 0xC3]))
        """)
        // Should return at least 'A' and not crash
        #expect(result.stringValue.hasPrefix("A"))
    }

    @Test("Truncated 3-byte sequence does not crash")
    func truncated3Byte() async throws {
        let process = BunProcess()
        try await process.load()
        // 0xE3 starts a 3-byte sequence but only has 1 continuation byte
        let result = try await process.evaluate(js: """
            new TextDecoder().decode(new Uint8Array([0x42, 0xE3, 0x81]))
        """)
        #expect(result.stringValue.hasPrefix("B"))
    }

    @Test("Truncated 4-byte sequence does not crash")
    func truncated4Byte() async throws {
        let process = BunProcess()
        try await process.load()
        // 0xF0 0x9F starts a 4-byte sequence but is incomplete
        let result = try await process.evaluate(js: """
            new TextDecoder().decode(new Uint8Array([0x43, 0xF0, 0x9F]))
        """)
        #expect(result.stringValue.hasPrefix("C"))
    }
}

@Suite("URL Polyfill Edge Cases")
struct URLEdgeCaseTests {

    @Test("Parse HTTPS URL with path and query")
    func parseHTTPS() async throws {
        let process = BunProcess()
        try await process.load()
        let result = try await process.evaluate(js: """
            var u = new URL('https://api.example.com:8080/v1/chat?model=claude');
            u.hostname + '|' + u.port + '|' + u.pathname + '|' + u.searchParams.get('model');
        """)
        #expect(result.stringValue == "api.example.com|8080|/v1/chat|claude")
    }

    @Test("Parse file:/// URL with empty hostname")
    func parseFileURL() async throws {
        let process = BunProcess()
        try await process.load()
        let result = try await process.evaluate(js: """
            var u = new URL('file:///tmp/test.js');
            u.protocol + '|' + u.pathname;
        """)
        #expect(result.stringValue == "file:|/tmp/test.js")
    }

    @Test("Parse URL with auth")
    func parseURLWithAuth() async throws {
        let process = BunProcess()
        try await process.load()
        let result = try await process.evaluate(js: """
            var u = new URL('https://user:pass@example.com/path');
            u.username + '|' + u.password + '|' + u.hostname;
        """)
        #expect(result.stringValue == "user|pass|example.com")
    }

    @Test("Parse URL with hash fragment")
    func parseURLWithHash() async throws {
        let process = BunProcess()
        try await process.load()
        let result = try await process.evaluate(js: """
            var u = new URL('https://example.com/page#section');
            u.hash;
        """)
        #expect(result.stringValue == "#section")
    }

    @Test("URLSearchParams multiple values")
    func searchParamsMultiple() async throws {
        let process = BunProcess()
        try await process.load()
        let result = try await process.evaluate(js: """
            var sp = new URLSearchParams('a=1&b=2&c=hello%20world');
            sp.get('a') + '|' + sp.get('b') + '|' + sp.get('c');
        """)
        #expect(result.stringValue == "1|2|hello world")
    }
}

@Suite("Path Edge Cases")
struct PathEdgeCaseTests {

    @Test("path.join with .. normalization")
    func joinWithDotDot() async throws {
        let process = BunProcess()
        try await process.load()
        let result = try await process.evaluate(js: """
            require('node:path').join('/foo/bar', '..', 'baz')
        """)
        #expect(result.stringValue == "/foo/baz")
    }

    @Test("path.join with . normalization")
    func joinWithDot() async throws {
        let process = BunProcess()
        try await process.load()
        let result = try await process.evaluate(js: """
            require('node:path').join('/foo', '.', 'bar')
        """)
        #expect(result.stringValue == "/foo/bar")
    }

    @Test("path.relative between two absolute paths")
    func relative() async throws {
        let process = BunProcess()
        try await process.load()
        let result = try await process.evaluate(js: """
            require('node:path').relative('/data/orandea/test/aaa', '/data/orandea/impl/bbb')
        """)
        #expect(result.stringValue == "../../impl/bbb")
    }

    @Test("path.parse extracts all components")
    func parse() async throws {
        let process = BunProcess()
        try await process.load()
        let result = try await process.evaluate(js: """
            var p = require('node:path').parse('/home/user/dir/file.txt');
            p.root + '|' + p.base + '|' + p.ext + '|' + p.name;
        """)
        #expect(result.stringValue == "/|file.txt|.txt|file")
    }

    @Test("path.basename with extension removal")
    func basenameWithExt() async throws {
        let process = BunProcess()
        try await process.load()
        let result = try await process.evaluate(js: """
            require('node:path').basename('/foo/bar.html', '.html')
        """)
        #expect(result.stringValue == "bar")
    }
}

@Suite("Buffer Edge Cases")
struct BufferEdgeCaseTests {

    @Test("Buffer.from base64 encoding")
    func base64Roundtrip() async throws {
        let process = BunProcess()
        try await process.load()
        let result = try await process.evaluate(js: """
            Buffer.from('SGVsbG8gV29ybGQ=', 'base64').toString('utf-8')
        """)
        #expect(result.stringValue == "Hello World")
    }

    @Test("Buffer.from hex roundtrip")
    func hexRoundtrip() async throws {
        let process = BunProcess()
        try await process.load()
        let result = try await process.evaluate(js: """
            Buffer.from(Buffer.from('test data').toString('hex'), 'hex').toString('utf-8')
        """)
        #expect(result.stringValue == "test data")
    }

    @Test("Buffer.alloc creates zeroed buffer")
    func allocZeroed() async throws {
        let process = BunProcess()
        try await process.load()
        let result = try await process.evaluate(js: """
            var b = Buffer.alloc(4);
            b[0] === 0 && b[1] === 0 && b[2] === 0 && b[3] === 0;
        """)
        #expect(result.boolValue == true)
    }

    @Test("Buffer.isBuffer distinguishes Buffer from Uint8Array")
    func isBuffer() async throws {
        let process = BunProcess()
        try await process.load()
        let result = try await process.evaluate(js: """
            Buffer.isBuffer(Buffer.from('x')) + '|' + Buffer.isBuffer(new Uint8Array(1));
        """)
        #expect(result.stringValue == "true|false")
    }

    @Test("Buffer.byteLength for multibyte UTF-8")
    func byteLengthMultibyte() async throws {
        let process = BunProcess()
        try await process.load()
        let result = try await process.evaluate(js: """
            Buffer.byteLength('café')
        """)
        // 'café' = c(1) + a(1) + f(1) + é(2) = 5 bytes
        #expect(result.int32Value == 5)
    }

    @Test("Buffer.concat with empty array")
    func concatEmpty() async throws {
        let process = BunProcess()
        try await process.load()
        let result = try await process.evaluate(js: """
            Buffer.concat([]).length
        """)
        #expect(result.int32Value == 0)
    }

    @Test("Buffer.compare ordering")
    func compare() async throws {
        let process = BunProcess()
        try await process.load()
        let result = try await process.evaluate(js: """
            var a = Buffer.from('abc');
            var b = Buffer.from('abd');
            var c = Buffer.from('abc');
            a.compare(b) + '|' + b.compare(a) + '|' + a.compare(c);
        """)
        #expect(result.stringValue == "-1|1|0")
    }
}

@Suite("Crypto Edge Cases")
struct CryptoEdgeCaseTests {

    @Test("SHA-256 of empty string")
    func sha256Empty() async throws {
        let process = BunProcess()
        try await process.load()
        let result = try await process.evaluate(js: """
            require('node:crypto').createHash('sha256').update('').digest('hex')
        """)
        #expect(result.stringValue == "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855")
    }

    @Test("SHA-512 produces correct length")
    func sha512Length() async throws {
        let process = BunProcess()
        try await process.load()
        let result = try await process.evaluate(js: """
            require('node:crypto').createHash('sha512').update('test').digest('hex').length
        """)
        #expect(result.int32Value == 128) // 64 bytes = 128 hex chars
    }

    @Test("HMAC-SHA256")
    func hmacSHA256() async throws {
        let process = BunProcess()
        try await process.load()
        let result = try await process.evaluate(js: """
            require('node:crypto').createHmac('sha256', 'secret').update('message').digest('hex')
        """)
        #expect(result.stringValue == "8b5f48702995c1598c573db1e21866a9b825d4a794d169d7060a03605796360b")
    }

    @Test("Hash chaining with multiple updates")
    func hashChaining() async throws {
        let process = BunProcess()
        try await process.load()
        let result = try await process.evaluate(js: """
            var h = require('node:crypto').createHash('sha256');
            h.update('hello');
            h.update(' world');
            h.digest('hex');
        """)
        // sha256('hello world')
        #expect(result.stringValue == "b94d27b9934d3e08a52e52d7da7dabfac484efe37a5380ee9088f7ace2efcde9")
    }

    @Test("randomBytes returns correct length")
    func randomBytesLength() async throws {
        let process = BunProcess()
        try await process.load()
        let result = try await process.evaluate(js: """
            require('node:crypto').randomBytes(16).length
        """)
        #expect(result.int32Value == 16)
    }

    @Test("Unsupported hash algorithm throws")
    func unsupportedAlgorithm() async throws {
        let process = BunProcess()
        try await process.load()
        await #expect(throws: BunRuntimeError.self) {
            try await process.evaluate(js: """
                require('node:crypto').createHash('md5').update('test').digest('hex')
            """)
        }
    }

    @Test("Hash digest base64 encoding")
    func hashBase64() async throws {
        let process = BunProcess()
        try await process.load()
        let result = try await process.evaluate(js: """
            require('node:crypto').createHash('sha256').update('hello').digest('base64')
        """)
        #expect(result.stringValue == "LPJNul+wow4m6DsqxbninhsWHlwfp0JecwQzYpOLmCQ=")
    }
}

@Suite("FS Error Handling Edge Cases")
struct FSEdgeCaseTests {

    @Test("fs.statSync throws for missing file")
    func statSyncMissing() async throws {
        let process = BunProcess()
        try await process.load()
        await #expect(throws: BunRuntimeError.self) {
            try await process.evaluate(js: """
                require('node:fs').statSync('/nonexistent/file.txt')
            """)
        }
    }

    @Test("fs.statSync returns correct isDirectory")
    func statSyncIsDirectory() async throws {
        let process = BunProcess()
        try await process.load()
        // Use /private/tmp instead of /tmp (macOS symlink)
        let result = try await process.evaluate(js: """
            require('node:fs').statSync('/private/tmp').isDirectory()
        """)
        #expect(result.boolValue == true)
    }

    @Test("fs.statSync returns correct isFile")
    func statSyncIsFile() async throws {
        let process = BunProcess()
        try await process.load()
        let tmpPath = NSTemporaryDirectory() + "swift-bun-stat-test-\(UUID().uuidString).txt"
        try "test".write(toFile: tmpPath, atomically: true, encoding: .utf8)
        defer { try? FileManager.default.removeItem(atPath: tmpPath) }

        let result = try await process.evaluate(js: """
            require('node:fs').statSync('\(tmpPath)').isFile()
        """)
        #expect(result.boolValue == true)
    }

    @Test("fs.readdirSync throws for missing directory")
    func readdirMissing() async throws {
        let process = BunProcess()
        try await process.load()
        await #expect(throws: BunRuntimeError.self) {
            try await process.evaluate(js: """
                require('node:fs').readdirSync('/nonexistent/dir')
            """)
        }
    }

    @Test("fs.mkdirSync recursive creates nested dirs")
    func mkdirRecursive() async throws {
        let process = BunProcess()
        try await process.load()
        let tmpDir = NSTemporaryDirectory() + "swift-bun-mkdir-\(UUID().uuidString)/a/b/c"
        let baseDir = (tmpDir as NSString).deletingLastPathComponent
        let rootDir = ((baseDir as NSString).deletingLastPathComponent as NSString).deletingLastPathComponent
        defer { try? FileManager.default.removeItem(atPath: rootDir) }

        try await process.evaluate(js: """
            require('node:fs').mkdirSync('\(tmpDir)', { recursive: true })
        """)
        let result = try await process.evaluate(js: """
            require('node:fs').existsSync('\(tmpDir)')
        """)
        #expect(result.boolValue == true)
    }

    @Test("fs.promises.readFile async")
    func promisesReadFile() async throws {
        let process = BunProcess()
        try await process.load()
        let tmpPath = NSTemporaryDirectory() + "swift-bun-async-test-\(UUID().uuidString).txt"
        try "async content".write(toFile: tmpPath, atomically: true, encoding: .utf8)
        defer { try? FileManager.default.removeItem(atPath: tmpPath) }

        let result = try await process.evaluate(js: """
            (async function() {
                return await require('node:fs').promises.readFile('\(tmpPath)', 'utf-8');
            })()
        """)
        // Note: JSResult captures the Promise object, not its resolved value.
        // Async promises resolution in JSContext requires event loop pumping.
        // This test verifies promises API is accessible without crash.
        #expect(!result.isUndefined)
    }
}

@Suite("EventEmitter Edge Cases")
struct EventEmitterEdgeCaseTests {

    @Test("once fires only once")
    func onceFiresOnce() async throws {
        let process = BunProcess()
        try await process.load()
        let result = try await process.evaluate(js: """
            var EE = require('node:events').EventEmitter;
            var ee = new EE();
            var count = 0;
            ee.once('x', function() { count++; });
            ee.emit('x');
            ee.emit('x');
            ee.emit('x');
            count;
        """)
        #expect(result.int32Value == 1)
    }

    @Test("removeListener removes correct listener")
    func removeListener() async throws {
        let process = BunProcess()
        try await process.load()
        let result = try await process.evaluate(js: """
            var EE = require('node:events').EventEmitter;
            var ee = new EE();
            var log = '';
            var fn1 = function() { log += 'a'; };
            var fn2 = function() { log += 'b'; };
            ee.on('x', fn1);
            ee.on('x', fn2);
            ee.emit('x');
            ee.removeListener('x', fn1);
            ee.emit('x');
            log;
        """)
        #expect(result.stringValue == "abb")
    }

    @Test("listenerCount returns correct count")
    func listenerCount() async throws {
        let process = BunProcess()
        try await process.load()
        let result = try await process.evaluate(js: """
            var EE = require('node:events').EventEmitter;
            var ee = new EE();
            ee.on('x', function() {});
            ee.on('x', function() {});
            ee.on('y', function() {});
            ee.listenerCount('x') + '|' + ee.listenerCount('y') + '|' + ee.listenerCount('z');
        """)
        #expect(result.stringValue == "2|1|0")
    }

    @Test("emit returns false for no listeners")
    func emitNoListeners() async throws {
        let process = BunProcess()
        try await process.load()
        let result = try await process.evaluate(js: """
            var ee = new (require('node:events').EventEmitter)();
            ee.emit('nonexistent');
        """)
        #expect(result.boolValue == false)
    }
}

@Suite("JSResult Edge Cases")
struct JSResultEdgeCaseTests {

    @Test("Number result preserves integer")
    func integerResult() async throws {
        let process = BunProcess()
        try await process.load()
        let result = try await process.evaluate(js: "42")
        #expect(result == .number(42))
        #expect(result.int32Value == 42)
        #expect(result.stringValue == "42")
    }

    @Test("Number result preserves float")
    func floatResult() async throws {
        let process = BunProcess()
        try await process.load()
        let result = try await process.evaluate(js: "3.14")
        #expect(result == .number(3.14))
        #expect(result.stringValue == "3.14")
    }

    @Test("Boolean true")
    func boolTrue() async throws {
        let process = BunProcess()
        try await process.load()
        let result = try await process.evaluate(js: "true")
        #expect(result == .bool(true))
        #expect(result.boolValue == true)
        #expect(result.int32Value == 1)
    }

    @Test("Null result")
    func nullResult() async throws {
        let process = BunProcess()
        try await process.load()
        let result = try await process.evaluate(js: "null")
        #expect(result == .null)
        #expect(result.isNull == true)
        #expect(result.boolValue == false)
        #expect(result.stringValue == "null")
    }

    @Test("Undefined result")
    func undefinedResult() async throws {
        let process = BunProcess()
        try await process.load()
        let result = try await process.evaluate(js: "undefined")
        #expect(result == .undefined)
        #expect(result.isUndefined == true)
        #expect(result.boolValue == false)
    }

    @Test("Object result serialized as JSON")
    func objectResult() async throws {
        let process = BunProcess()
        try await process.load()
        let result = try await process.evaluate(js: "({key: 'value', num: 42})")
        if case .json(let j) = result {
            #expect(j.contains("\"key\""))
            #expect(j.contains("\"value\""))
        } else {
            #expect(Bool(false), "Expected .json case")
        }
    }

    @Test("Array result serialized as JSON")
    func arrayResult() async throws {
        let process = BunProcess()
        try await process.load()
        let result = try await process.evaluate(js: "[1, 2, 3]")
        if case .json(let j) = result {
            #expect(j == "[1,2,3]")
        } else {
            #expect(Bool(false), "Expected .json case")
        }
    }
}

@Suite("AsyncLocalStorage Edge Cases")
struct AsyncLocalStorageTests {

    @Test("AsyncLocalStorage run and getStore")
    func runAndGetStore() async throws {
        let process = BunProcess()
        try await process.load()
        let result = try await process.evaluate(js: """
            var als = new (require('node:async_hooks').AsyncLocalStorage)();
            var captured = null;
            als.run({ userId: 42 }, function() {
                captured = als.getStore();
            });
            captured.userId;
        """)
        #expect(result.int32Value == 42)
    }

    @Test("AsyncLocalStorage nested run")
    func nestedRun() async throws {
        let process = BunProcess()
        try await process.load()
        let result = try await process.evaluate(js: """
            var als = new (require('node:async_hooks').AsyncLocalStorage)();
            var log = '';
            als.run('outer', function() {
                log += als.getStore() + ',';
                als.run('inner', function() {
                    log += als.getStore() + ',';
                });
                log += als.getStore();
            });
            log;
        """)
        #expect(result.stringValue == "outer,inner,outer")
    }
}

// MARK: - Web API Polyfills

@Suite("Web API Polyfills")
struct WebAPIPolyfillTests {

    @Test("ReadableStream exists and is constructable")
    func readableStream() async throws {
        let p = BunProcess()
        try await p.load()
        let result = try await p.evaluate(js: """
            var rs = new ReadableStream({
                start: function(controller) {
                    controller.enqueue('hello');
                    controller.close();
                }
            });
            typeof rs.getReader === 'function' && typeof rs.pipeTo === 'function';
        """)
        #expect(result.boolValue == true)
    }

    @Test("TransformStream exists")
    func transformStream() async throws {
        let p = BunProcess()
        try await p.load()
        let result = try await p.evaluate(js: """
            var ts = new TransformStream();
            typeof ts.readable === 'object' && typeof ts.writable === 'object';
        """)
        #expect(result.boolValue == true)
    }

    @Test("Event and EventTarget work")
    func eventTarget() async throws {
        let p = BunProcess()
        try await p.load()
        let result = try await p.evaluate(js: """
            var received = '';
            var target = new EventTarget();
            target.addEventListener('test', function(e) { received = e.type; });
            target.dispatchEvent(new Event('test'));
            received;
        """)
        #expect(result.stringValue == "test")
    }

    @Test("CustomEvent carries detail")
    func customEvent() async throws {
        let p = BunProcess()
        try await p.load()
        let result = try await p.evaluate(js: """
            var detail = null;
            var target = new EventTarget();
            target.addEventListener('msg', function(e) { detail = e.detail; });
            target.dispatchEvent(new CustomEvent('msg', { detail: 42 }));
            detail;
        """)
        #expect(result.int32Value == 42)
    }

    @Test("class extends EventTarget works")
    func extendsEventTarget() async throws {
        let p = BunProcess()
        try await p.load()
        let result = try await p.evaluate(js: """
            class MyTarget extends EventTarget {
                constructor() { super(); this.x = 1; }
            }
            var t = new MyTarget();
            var ok = t.x === 1 && typeof t.addEventListener === 'function';
            ok;
        """)
        #expect(result.boolValue == true)
    }

    @Test("Blob size and type")
    func blob() async throws {
        let p = BunProcess()
        try await p.load()
        let result = try await p.evaluate(js: """
            var b = new Blob(['hello', ' ', 'world'], { type: 'text/plain' });
            JSON.stringify({ size: b.size, type: b.type, instanceof: b instanceof Blob });
        """)
        #expect(result.stringValue == #"{"size":11,"type":"text/plain","instanceof":true}"#)
    }

    @Test("File extends Blob with name")
    func file() async throws {
        let p = BunProcess()
        try await p.load()
        let result = try await p.evaluate(js: """
            var f = new File(['content'], 'test.txt', { type: 'text/plain' });
            JSON.stringify({ name: f.name, instanceof: f instanceof Blob });
        """)
        #expect(result.stringValue == #"{"name":"test.txt","instanceof":true}"#)
    }

    @Test("FormData append and get")
    func formData() async throws {
        let p = BunProcess()
        try await p.load()
        let result = try await p.evaluate(js: """
            var fd = new FormData();
            fd.append('key', 'value');
            fd.append('key', 'value2');
            JSON.stringify({ get: fd.get('key'), all: fd.getAll('key'), has: fd.has('key') });
        """)
        #expect(result.stringValue == #"{"get":"value","all":["value","value2"],"has":true}"#)
    }

    @Test("MessageChannel exists")
    func messageChannel() async throws {
        let p = BunProcess()
        try await p.load()
        let result = try await p.evaluate(js: """
            var ch = new MessageChannel();
            typeof ch.port1.postMessage === 'function' && typeof ch.port2.postMessage === 'function';
        """)
        #expect(result.boolValue == true)
    }

    @Test("structuredClone deep copies")
    func structuredClone() async throws {
        let p = BunProcess()
        try await p.load()
        let result = try await p.evaluate(js: """
            var obj = { a: 1, b: { c: 2 } };
            var clone = structuredClone(obj);
            clone.b.c = 99;
            obj.b.c;
        """)
        #expect(result.int32Value == 2)
    }

    @Test("crypto.getRandomValues fills array")
    func cryptoGetRandomValues() async throws {
        let p = BunProcess()
        try await p.load()
        let result = try await p.evaluate(js: """
            var arr = new Uint8Array(4);
            crypto.getRandomValues(arr);
            arr.length === 4 && (arr[0] !== 0 || arr[1] !== 0 || arr[2] !== 0 || arr[3] !== 0);
        """)
        #expect(result.boolValue == true)
    }

    @Test("crypto.randomUUID returns valid format")
    func cryptoRandomUUID() async throws {
        let p = BunProcess()
        try await p.load()
        let result = try await p.evaluate(js: """
            var uuid = crypto.randomUUID();
            /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(uuid);
        """)
        #expect(result.boolValue == true)
    }

    @Test("Symbol.dispose exists")
    func symbolDispose() async throws {
        let p = BunProcess()
        try await p.load()
        let result = try await p.evaluate(js: """
            typeof Symbol.dispose === 'symbol' && typeof Symbol.asyncDispose === 'symbol';
        """)
        #expect(result.boolValue == true)
    }

    @Test("navigator exists")
    func navigator() async throws {
        let p = BunProcess()
        try await p.load()
        let result = try await p.evaluate(js: "navigator.platform")
        #expect(result.stringValue == "darwin")
    }
}

// MARK: - Node.js polyfill additions

@Suite("Node.js Polyfill Additions")
struct NodePolyfillAdditionTests {

    @Test("util.debuglog returns callable function")
    func utilDebuglog() async throws {
        let p = BunProcess()
        try await p.load()
        let result = try await p.evaluate(js: """
            var debuglog = require('node:util').debuglog;
            var fn = debuglog('test');
            typeof fn === 'function' && typeof fn.enabled === 'boolean';
        """)
        #expect(result.boolValue == true)
    }

    @Test("global is globalThis")
    func globalAlias() async throws {
        let p = BunProcess()
        try await p.load()
        let result = try await p.evaluate(js: "global === globalThis && self === globalThis")
        #expect(result.boolValue == true)
    }

    @Test("process.execArgv is array")
    func processExecArgv() async throws {
        let p = BunProcess()
        try await p.load()
        let result = try await p.evaluate(js: "Array.isArray(process.execArgv)")
        #expect(result.boolValue == true)
    }

    @Test("process.on returns process")
    func processOn() async throws {
        let p = BunProcess()
        try await p.load()
        let result = try await p.evaluate(js: "process.on('exit', function(){}) === process")
        #expect(result.boolValue == true)
    }

    @Test("require('events') is constructor")
    func eventsIsConstructor() async throws {
        let p = BunProcess()
        try await p.load()
        let result = try await p.evaluate(js: """
            var EE = require('events');
            typeof EE === 'function' && typeof new EE().on === 'function';
        """)
        #expect(result.boolValue == true)
    }

    @Test("class extends require('events') works")
    func extendsEvents() async throws {
        let p = BunProcess()
        try await p.load()
        let result = try await p.evaluate(js: """
            var EE = require('events');
            class MyEmitter extends EE { constructor() { super(); this.x = 1; } }
            var e = new MyEmitter();
            e.x === 1 && typeof e.on === 'function';
        """)
        #expect(result.boolValue == true)
    }

    @Test("fs.realpathSync resolves path")
    func fsRealpathSync() async throws {
        let p = BunProcess()
        try await p.load()
        let result = try await p.evaluate(js: """
            var fs = require('node:fs');
            var resolved = fs.realpathSync('/tmp');
            typeof resolved === 'string' && resolved.length > 0;
        """)
        #expect(result.boolValue == true)
    }

    @Test("fs.realpathSync throws for missing path")
    func fsRealpathSyncMissing() async throws {
        let p = BunProcess()
        try await p.load()
        let result = try await p.evaluate(js: """
            var fs = require('node:fs');
            try { fs.realpathSync('/nonexistent_path_xyz'); 'no-error'; }
            catch(e) { 'error'; }
        """)
        #expect(result.stringValue == "error")
    }

    @Test("fs.promises.realpath works")
    func fsPromisesRealpath() async throws {
        let p = BunProcess()
        try await p.load()
        let result = try await p.evaluate(js: """
            var fsp = require('node:fs/promises');
            typeof fsp.realpath === 'function';
        """)
        #expect(result.boolValue == true)
    }

    @Test("fs.accessSync does not throw for existing path")
    func fsAccessSync() async throws {
        let p = BunProcess()
        try await p.load()
        let result = try await p.evaluate(js: """
            var fs = require('node:fs');
            try { fs.accessSync('/tmp'); 'ok'; }
            catch(e) { 'error'; }
        """)
        #expect(result.stringValue == "ok")
    }
}

