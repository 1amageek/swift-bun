import Testing
@preconcurrency import JavaScriptCore
import Foundation
@testable import BunRuntime
import TestHeartbeat

@Suite("FS Error Handling Edge Cases", .serialized, .heartbeat)
struct FSEdgeCaseTests {

    @Test("fs.statSync throws for missing file")
    func statSyncMissing() async throws {
        await #expect(throws: BunRuntimeError.self) {
            try await TestProcessSupport.evaluate("""
                require('node:fs').statSync('/nonexistent/file.txt')
            """)
        }
    }

    @Test("fs.statSync returns correct isDirectory")
    func statSyncIsDirectory() async throws {
        // Use /private/tmp instead of /tmp (macOS symlink)
        let result = try await TestProcessSupport.evaluate("""
            require('node:fs').statSync('/private/tmp').isDirectory()
        """)
        #expect(result.boolValue == true)
    }

    @Test("fs.statSync returns correct isFile")
    func statSyncIsFile() async throws {
        let tmpPath = NSTemporaryDirectory() + "swift-bun-stat-test-\(UUID().uuidString).txt"
        try "test".write(toFile: tmpPath, atomically: true, encoding: .utf8)
        defer { try? FileManager.default.removeItem(atPath: tmpPath) }

        let result = try await TestProcessSupport.evaluate("""
            require('node:fs').statSync('\(tmpPath)').isFile()
        """)
        #expect(result.boolValue == true)
    }

    @Test("fs.readdirSync throws for missing directory")
    func readdirMissing() async throws {
        await #expect(throws: BunRuntimeError.self) {
            try await TestProcessSupport.evaluate("""
                require('node:fs').readdirSync('/nonexistent/dir')
            """)
        }
    }

    @Test("fs.mkdirSync recursive creates nested dirs")
    func mkdirRecursive() async throws {
        let tmpDir = NSTemporaryDirectory() + "swift-bun-mkdir-\(UUID().uuidString)/a/b/c"
        let baseDir = (tmpDir as NSString).deletingLastPathComponent
        let rootDir = ((baseDir as NSString).deletingLastPathComponent as NSString).deletingLastPathComponent
        defer { try? FileManager.default.removeItem(atPath: rootDir) }

        let result = try await TestProcessSupport.withLoadedProcess { process in
            try await process.evaluate(js: """
                require('node:fs').mkdirSync('\(tmpDir)', { recursive: true })
            """)
            return try await process.evaluate(js: """
                require('node:fs').existsSync('\(tmpDir)')
            """)
        }
        #expect(result.boolValue == true)
    }

    @Test("fs.promises.readFile async")
    func promisesReadFile() async throws {
        let tmpPath = NSTemporaryDirectory() + "swift-bun-async-test-\(UUID().uuidString).txt"
        try "async content".write(toFile: tmpPath, atomically: true, encoding: .utf8)
        defer { try? FileManager.default.removeItem(atPath: tmpPath) }

        let result = try await TestProcessSupport.evaluateAsync("""
            (async function() {
                return await require('node:fs').promises.readFile('\(tmpPath)', 'utf-8');
            })()
        """)
        #expect(result.stringValue == "async content")
    }

    @Test("statSync follows symlinks, lstatSync does not")
    func statLstatSymlink() async throws {
        let tmpDir = NSTemporaryDirectory() + "swift-bun-symlink-\(UUID().uuidString)"
        let target = tmpDir + "/target.txt"
        let link = tmpDir + "/link.txt"
        try FileManager.default.createDirectory(atPath: tmpDir, withIntermediateDirectories: true)
        try "hello".write(toFile: target, atomically: true, encoding: .utf8)
        try FileManager.default.createSymbolicLink(atPath: link, withDestinationPath: target)
        defer { try? FileManager.default.removeItem(atPath: tmpDir) }

        let result = try await TestProcessSupport.withLoadedProcess { process in
            let statResult = try await process.evaluate(js: """
                var fs = require('node:fs');
                var s = fs.statSync('\(link)');
                JSON.stringify({ isFile: s.isFile(), isSym: s.isSymbolicLink() });
            """)
            let lstatResult = try await process.evaluate(js: """
                var fs = require('node:fs');
                var s = fs.lstatSync('\(link)');
                JSON.stringify({ isFile: s.isFile(), isSym: s.isSymbolicLink() });
            """)
            return (statResult.stringValue, lstatResult.stringValue)
        }
        #expect(result.0.contains("\"isFile\":true"))
        #expect(result.0.contains("\"isSym\":false"))
        #expect(result.1.contains("\"isSym\":true"))
    }

    @Test("statSync mode reflects actual posixPermissions")
    func statModeActual() async throws {
        let tmpPath = NSTemporaryDirectory() + "swift-bun-mode-\(UUID().uuidString).txt"
        FileManager.default.createFile(atPath: tmpPath, contents: "test".data(using: .utf8))
        try FileManager.default.setAttributes([.posixPermissions: 0o644], ofItemAtPath: tmpPath)
        defer { try? FileManager.default.removeItem(atPath: tmpPath) }

        let result = try await TestProcessSupport.evaluate("""
            var s = require('node:fs').statSync('\(tmpPath)');
            // mode should be 0o100644 (regular file + 644 permissions)
            s.mode;
        """)
        #expect(result.int32Value == 0o100644)
    }

    @Test("fs.promises.stat follows symlinks")
    func asyncStatSymlink() async throws {
        let tmpDir = NSTemporaryDirectory() + "swift-bun-async-sym-\(UUID().uuidString)"
        let target = tmpDir + "/target.txt"
        let link = tmpDir + "/link.txt"
        try FileManager.default.createDirectory(atPath: tmpDir, withIntermediateDirectories: true)
        try "hello".write(toFile: target, atomically: true, encoding: .utf8)
        try FileManager.default.createSymbolicLink(atPath: link, withDestinationPath: target)
        defer { try? FileManager.default.removeItem(atPath: tmpDir) }

        let result = try await TestProcessSupport.evaluateAsync("""
            (async function() {
                var s = await require('node:fs').promises.stat('\(link)');
                return JSON.stringify({ isFile: s.isFile(), isSym: s.isSymbolicLink() });
            })()
        """)
        #expect(result.stringValue.contains("\"isFile\":true"))
        #expect(result.stringValue.contains("\"isSym\":false"))
    }

    @Test("fs.promises.lstat does not follow symlinks")
    func asyncLstatSymlink() async throws {
        let tmpDir = NSTemporaryDirectory() + "swift-bun-async-lsym-\(UUID().uuidString)"
        let target = tmpDir + "/target.txt"
        let link = tmpDir + "/link.txt"
        try FileManager.default.createDirectory(atPath: tmpDir, withIntermediateDirectories: true)
        try "hello".write(toFile: target, atomically: true, encoding: .utf8)
        try FileManager.default.createSymbolicLink(atPath: link, withDestinationPath: target)
        defer { try? FileManager.default.removeItem(atPath: tmpDir) }

        let result = try await TestProcessSupport.evaluateAsync("""
            (async function() {
                var s = await require('node:fs').promises.lstat('\(link)');
                return s.isSymbolicLink();
            })()
        """)
        #expect(result.boolValue == true)
    }

    @Test("fs.promises.chmod changes permissions")
    func asyncChmod() async throws {
        let tmpPath = NSTemporaryDirectory() + "swift-bun-async-chmod-\(UUID().uuidString).txt"
        FileManager.default.createFile(atPath: tmpPath, contents: "test".data(using: .utf8))
        try FileManager.default.setAttributes([.posixPermissions: 0o644], ofItemAtPath: tmpPath)
        defer { try? FileManager.default.removeItem(atPath: tmpPath) }

        let result = try await TestProcessSupport.evaluateAsync("""
            (async function() {
                var fs = require('node:fs');
                await fs.promises.chmod('\(tmpPath)', 0o755);
                var s = await fs.promises.stat('\(tmpPath)');
                return s.mode & 0o777;
            })()
        """)
        #expect(result.int32Value == 0o755)
    }

    @Test("chmodSync changes file permissions")
    func chmodSync() async throws {
        let tmpPath = NSTemporaryDirectory() + "swift-bun-chmod-\(UUID().uuidString).txt"
        FileManager.default.createFile(atPath: tmpPath, contents: "test".data(using: .utf8))
        try FileManager.default.setAttributes([.posixPermissions: 0o644], ofItemAtPath: tmpPath)
        defer { try? FileManager.default.removeItem(atPath: tmpPath) }

        let result = try await TestProcessSupport.withLoadedProcess { process in
            try await process.evaluate(js: """
                require('node:fs').chmodSync('\(tmpPath)', 0o755)
            """)
            return try await process.evaluate(js: """
                require('node:fs').statSync('\(tmpPath)').mode & 0o777
            """)
        }
        #expect(result.int32Value == 0o755)
    }
}
