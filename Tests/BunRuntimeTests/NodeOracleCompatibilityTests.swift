import Testing
import Foundation
import TestHeartbeat

@Suite("Node Oracle Compatibility", .serialized, .heartbeat)
struct NodeOracleCompatibilityTests {
    @Test("fs.statSync missing file matches node")
    func fsStatSyncMissingFileMatchesNode() async throws {
        try await NodeOracleSupport.assertMatchesNode("""
            require('node:fs').statSync('/nonexistent/path/oracle-stat-sync.txt');
        """)
    }

    @Test("fs.promises.stat missing file matches node")
    func fsPromisesStatMissingFileMatchesNode() async throws {
        try await NodeOracleSupport.assertMatchesNode("""
            await require('node:fs').promises.stat('/nonexistent/path/oracle-stat-async.txt');
        """)
    }

    @Test("fs.readFileSync missing file matches node")
    func fsReadFileSyncMissingFileMatchesNode() async throws {
        try await NodeOracleSupport.assertMatchesNode("""
            require('node:fs').readFileSync('/nonexistent/path/oracle-read-sync.txt', 'utf8');
        """)
    }

    @Test("fs.promises.readFile missing file matches node")
    func fsPromisesReadFileMissingFileMatchesNode() async throws {
        try await NodeOracleSupport.assertMatchesNode("""
            await require('node:fs').promises.readFile('/nonexistent/path/oracle-read-async.txt', 'utf8');
        """)
    }

    @Test("fs.mkdirSync existing directory error matches node")
    func fsMkdirExistingDirectoryMatchesNode() async throws {
        let tmpDir = URL(fileURLWithPath: NSTemporaryDirectory()).appendingPathComponent("swift-bun-oracle-mkdir-\(UUID().uuidString)")
        try FileManager.default.createDirectory(at: tmpDir, withIntermediateDirectories: true)
        defer {
            do { try FileManager.default.removeItem(at: tmpDir) } catch { }
        }
        try await NodeOracleSupport.assertMatchesNode("""
            require('node:fs').mkdirSync('\(tmpDir.path)');
        """)
    }

    @Test("EventEmitter prependListener order matches node")
    func eventEmitterPrependListenerOrderMatchesNode() async throws {
        try await NodeOracleSupport.assertMatchesNode("""
            var EE = require('node:events').EventEmitter;
            var ee = new EE();
            var order = [];
            ee.on('tick', function() { order.push('on'); });
            ee.prependListener('tick', function() { order.push('prepend'); });
            ee.emit('tick');
            return order;
        """)
    }

    @Test("EventEmitter emit(error) without listener matches node")
    func eventEmitterUnhandledErrorMatchesNode() async throws {
        try await NodeOracleSupport.assertMatchesNode("""
            var EE = require('node:events').EventEmitter;
            var ee = new EE();
            ee.emit('error', new Error('boom'));
        """)
    }

    @Test("EventEmitter listeners unwrap once handlers like node")
    func eventEmitterListenersUnwrapOnceHandlers() async throws {
        try await NodeOracleSupport.assertMatchesNode("""
            var EE = require('node:events').EventEmitter;
            var ee = new EE();
            function handler() {}
            ee.once('tick', handler);
            return {
                listenerIsOriginal: ee.listeners('tick')[0] === handler,
                rawListenerIsOriginal: ee.rawListeners('tick')[0] === handler,
                rawListenerName: ee.rawListeners('tick')[0].name
            };
        """)
    }

    @Test("EventEmitter prependOnceListener order matches node")
    func eventEmitterPrependOnceListenerOrderMatchesNode() async throws {
        try await NodeOracleSupport.assertMatchesNode("""
            var EE = require('node:events').EventEmitter;
            var ee = new EE();
            var order = [];
            ee.on('tick', function() { order.push('on'); });
            ee.prependOnceListener('tick', function() { order.push('prependOnce'); });
            ee.emit('tick');
            ee.emit('tick');
            return order;
        """)
    }

    @Test("fs.readdir with Dirent shape matches node")
    func fsReaddirWithDirentShapeMatchesNode() async throws {
        let tmpDir = URL(fileURLWithPath: NSTemporaryDirectory()).appendingPathComponent("swift-bun-oracle-\(UUID().uuidString)")
        let targetPath = tmpDir.appendingPathComponent("target.txt")
        let nestedDir = tmpDir.appendingPathComponent("nested")
        try FileManager.default.createDirectory(at: tmpDir, withIntermediateDirectories: true)
        try FileManager.default.createDirectory(at: nestedDir, withIntermediateDirectories: true)
        try Data("hello".utf8).write(to: targetPath)
        defer {
            do {
                try FileManager.default.removeItem(at: tmpDir)
            } catch {
            }
        }

        try await NodeOracleSupport.assertMatchesNode("""
            var fs = require('node:fs').promises;
            var entries = await fs.readdir('\(tmpDir.path)', { withFileTypes: true });
            entries.sort(function(a, b) { return a.name.localeCompare(b.name); });
            return entries.map(function(entry) {
                return {
                    name: entry.name,
                    isDirectory: entry.isDirectory(),
                    isFile: entry.isFile(),
                    isSymbolicLink: entry.isSymbolicLink()
                };
            });
        """, cwd: tmpDir.path)
    }
}
