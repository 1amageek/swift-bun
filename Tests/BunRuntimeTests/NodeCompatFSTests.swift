import Testing
import Foundation
import Synchronization
@testable import BunRuntime
import TestHeartbeat

@Suite("Node.js FS Compatibility", .serialized, .heartbeat)
struct NodeCompatFSTests {
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
        _ process: BunProcess = BunProcess(),
        _ body: (BunProcess) async throws -> T
    ) async throws -> T {
        try await TestProcessSupport.withLoadedProcess(process, operation: body)
    }

    // MARK: - Sync

    @Test("fs.readFileSync throws ENOENT for missing file")
    func fsReadFileThrowsENOENT() async throws {
        await #expect(throws: BunRuntimeError.self) {
            try await withLoadedProcess { process in
                try await process.evaluate(js: """
                    require('node:fs').readFileSync('/nonexistent/path/file.txt')
                """)
            }
        }
    }

    @Test("fs.statSync exposes Node-style ENOENT fields")
    func fsStatSyncENOENTFields() async throws {
        let result = try await withLoadedProcess { process in
            try await process.evaluate(js: """
                (function() {
                    try {
                        require('node:fs').statSync('/nonexistent/path/stat-sync.txt');
                        return 'unexpected-success';
                    } catch (error) {
                        return JSON.stringify({
                            code: error.code,
                            path: error.path,
                            syscall: error.syscall,
                            message: error.message
                        });
                    }
                })()
            """)
        }

        #expect(result.stringValue.contains(#""code":"ENOENT""#))
        #expect(result.stringValue.contains(#""path":"/nonexistent/path/stat-sync.txt""#))
        #expect(result.stringValue.contains(#""syscall":"stat""#))
    }

    @Test("fs.writeFileSync and readFileSync roundtrip")
    func fsWriteReadRoundtrip() async throws {
        let tmpPath = NSTemporaryDirectory() + "swift-bun-test-\(UUID().uuidString).txt"
        defer { try? FileManager.default.removeItem(atPath: tmpPath) }

        let result = try await withLoadedProcess { process in
            try await process.evaluate(js: """
                var fs = require('node:fs');
                fs.writeFileSync('\(tmpPath)', 'hello from swift-bun');
                fs.readFileSync('\(tmpPath)', 'utf-8');
            """)
        }
        #expect(result.stringValue == "hello from swift-bun")
    }

    @Test("fs.appendFileSync appends to existing file")
    func fsAppendFileSyncRoundtrip() async throws {
        let tmpPath = NSTemporaryDirectory() + "swift-bun-test-\(UUID().uuidString).txt"
        defer { try? FileManager.default.removeItem(atPath: tmpPath) }

        let result = try await withLoadedProcess { process in
            try await process.evaluate(js: """
                var fs = require('node:fs');
                fs.writeFileSync('\(tmpPath)', 'hello');
                fs.appendFileSync('\(tmpPath)', ' world');
                fs.readFileSync('\(tmpPath)', 'utf-8');
            """)
        }
        #expect(result.stringValue == "hello world")
    }

    @Test("fs.readFileSync without encoding returns Buffer")
    func fsReadFileSyncReturnsBuffer() async throws {
        let tmpPath = NSTemporaryDirectory() + "swift-bun-test-\(UUID().uuidString).txt"
        defer { try? FileManager.default.removeItem(atPath: tmpPath) }
        try "hello".write(toFile: tmpPath, atomically: true, encoding: .utf8)

        let result = try await withLoadedProcess { process in
            try await process.evaluate(js: """
                var fs = require('node:fs');
                var data = fs.readFileSync('\(tmpPath)');
                Buffer.isBuffer(data) && data.toString('utf8') === 'hello';
            """)
        }
        #expect(result.boolValue == true)
    }

    @Test("fs.existsSync returns false for missing file")
    func fsExistsSyncMissing() async throws {
        let result = try await evaluate("""
            require('node:fs').existsSync('/nonexistent/file.txt')
        """)
        #expect(result.boolValue == false)
    }

    @Test("fs.readdirSync supports withFileTypes")
    func fsReaddirWithFileTypes() async throws {
        let tmpDir = NSTemporaryDirectory() + "swift-bun-dir-\(UUID().uuidString)"
        let tmpFile = tmpDir + "/file.txt"
        try FileManager.default.createDirectory(atPath: tmpDir, withIntermediateDirectories: true)
        try "hello".write(toFile: tmpFile, atomically: true, encoding: .utf8)
        defer { try? FileManager.default.removeItem(atPath: tmpDir) }

        let result = try await withLoadedProcess { process in
            try await process.evaluate(js: """
                var fs = require('node:fs');
                var entries = fs.readdirSync('\(tmpDir)', { withFileTypes: true });
                entries.length === 1 &&
                    entries[0].name === 'file.txt' &&
                    entries[0].isFile() === true &&
                    entries[0].isDirectory() === false;
            """)
        }
        #expect(result.boolValue == true)
    }

    @Test("fs.readSync reads from openSync handle")
    func fsReadSyncFromOpenHandle() async throws {
        let tmpPath = NSTemporaryDirectory() + "swift-bun-test-\(UUID().uuidString).txt"
        defer { try? FileManager.default.removeItem(atPath: tmpPath) }
        try "abcdef".write(toFile: tmpPath, atomically: true, encoding: .utf8)

        let result = try await withLoadedProcess { process in
            try await process.evaluate(js: """
                var fs = require('node:fs');
                var fd = fs.openSync('\(tmpPath)', 'r');
                var buf = Buffer.alloc(3);
                var bytesRead = fs.readSync(fd, buf, 0, 3, 2);
                fs.closeSync(fd);
                bytesRead === 3 && buf.toString('utf8') === 'cde';
            """)
        }
        #expect(result.boolValue == true)
    }

    @Test("fs.renameSync overwrites existing file")
    func fsRenameSyncOverwritesExistingFile() async throws {
        let tmpDir = NSTemporaryDirectory() + "swift-bun-rename-\(UUID().uuidString)"
        let sourcePath = tmpDir + "/source.txt"
        let destinationPath = tmpDir + "/destination.txt"
        try FileManager.default.createDirectory(atPath: tmpDir, withIntermediateDirectories: true)
        try "source".write(toFile: sourcePath, atomically: true, encoding: .utf8)
        try "destination".write(toFile: destinationPath, atomically: true, encoding: .utf8)
        defer { try? FileManager.default.removeItem(atPath: tmpDir) }

        let result = try await withLoadedProcess { process in
            try await process.evaluate(js: """
                var fs = require('node:fs');
                fs.renameSync('\(sourcePath)', '\(destinationPath)');
                !fs.existsSync('\(sourcePath)') && fs.readFileSync('\(destinationPath)', 'utf-8') === 'source';
            """)
        }
        #expect(result.boolValue == true)
    }

    @Test("fs.writeSync with position zero overwrites from start")
    func fsWriteSyncPositionZeroOverwrites() async throws {
        let tmpPath = NSTemporaryDirectory() + "swift-bun-write-sync-\(UUID().uuidString).bin"
        try Data([65, 66, 67, 68]).write(to: URL(fileURLWithPath: tmpPath))
        defer { try? FileManager.default.removeItem(atPath: tmpPath) }

        let result = try await withLoadedProcess { process in
            try await process.evaluate(js: """
                var fs = require('node:fs');
                var fd = fs.openSync('\(tmpPath)', 'r+');
                fs.writeSync(fd, Buffer.from([90, 90]), 0, 2, 0);
                JSON.stringify(Array.from(fs.readFileSync('\(tmpPath)')));
            """)
        }

        #expect(result.stringValue == "[90,90,67,68]")
    }

    // MARK: - Promises

    @Test("fs.promises routes file work through native async bridge")
    func fsPromisesUsesNativeAsyncBridge() async throws {
        let tmpPath = NSTemporaryDirectory() + "swift-bun-native-fs-\(UUID().uuidString).txt"
        defer { try? FileManager.default.removeItem(atPath: tmpPath) }
        try "native async".write(toFile: tmpPath, atomically: true, encoding: .utf8)

        let collector = NodeCompatLogCollector()
        let lines = try await withLoadedProcess { process in
            let outputTask = Task { [collector] in
                for await line in process.output {
                    collector.append(line)
                }
            }
            defer { outputTask.cancel() }

            let result = try await process.evaluateAsync(js: """
                (async function() {
                    var fs = require('node:fs');
                    return await fs.promises.readFile('\(tmpPath)', 'utf-8');
                })()
            """)

            #expect(result.stringValue == "native async")
            return collector.values
        }

        #expect(lines.contains(where: { $0.contains("[bun:fs] start fs.readFile") }))
        #expect(lines.contains(where: { $0.contains("[bun:fs] complete fs.readFile") }))
        #expect(lines.contains(where: { $0.contains("hostCallback(fs.readFile:") }))
    }

    @Test("fs.promises.stat exposes Node-style ENOENT fields")
    func fsPromisesStatENOENTFields() async throws {
        let result = try await evaluateAsync("""
            (async function() {
                try {
                    await require('node:fs').promises.stat('/nonexistent/path/stat-async.txt');
                    return 'unexpected-success';
                } catch (error) {
                    return JSON.stringify({
                        code: error.code,
                        path: error.path,
                        syscall: error.syscall,
                        message: error.message
                    });
                }
            })()
        """)

        #expect(result.stringValue.contains(#""code":"ENOENT""#))
        #expect(result.stringValue.contains(#""path":"/nonexistent/path/stat-async.txt""#))
        #expect(result.stringValue.contains(#""syscall":"stat""#))
    }

    @Test("fs.promises.readdir supports withFileTypes via native async bridge")
    func fsPromisesReaddirWithFileTypes() async throws {
        let tmpDir = NSTemporaryDirectory() + "swift-bun-readdir-\(UUID().uuidString)"
        let tmpFile = tmpDir + "/file.txt"
        try FileManager.default.createDirectory(atPath: tmpDir, withIntermediateDirectories: true)
        try "hello".write(toFile: tmpFile, atomically: true, encoding: .utf8)
        defer { try? FileManager.default.removeItem(atPath: tmpDir) }

        let result = try await evaluateAsync("""
            (async function() {
                var fs = require('node:fs');
                var entries = await fs.promises.readdir('\(tmpDir)', { withFileTypes: true });
                return entries.length === 1 &&
                    entries[0].name === 'file.txt' &&
                    entries[0].isFile() === true &&
                    entries[0].isDirectory() === false;
            })()
        """)

        #expect(result.boolValue == true)
    }

    @Test("fs.promises.readlink and rm match Node semantics needed by CLI startup")
    func fsPromisesReadlinkAndRm() async throws {
        let tmpDir = NSTemporaryDirectory() + "swift-bun-readlink-\(UUID().uuidString)"
        let targetPath = tmpDir + "/target.txt"
        let linkPath = tmpDir + "/link.txt"
        try FileManager.default.createDirectory(atPath: tmpDir, withIntermediateDirectories: true)
        try "hello".write(toFile: targetPath, atomically: true, encoding: .utf8)
        try FileManager.default.createSymbolicLink(atPath: linkPath, withDestinationPath: targetPath)
        defer { try? FileManager.default.removeItem(atPath: tmpDir) }

        let result = try await evaluateAsync("""
            (async function() {
                var fs = require('node:fs');
                var target = await fs.promises.readlink('\(linkPath)');
                await fs.promises.rm('\(linkPath)', { force: true });
                await fs.promises.rm('\(tmpDir)/missing.txt', { force: true });
                return target === '\(targetPath)' && fs.existsSync('\(linkPath)') === false;
            })()
        """)

        #expect(result.boolValue == true)
    }

    @Test("fs.rm callback removes file asynchronously")
    func fsRmCallback() async throws {
        let tmpPath = NSTemporaryDirectory() + "swift-bun-rm-callback-\(UUID().uuidString).txt"
        try "delete me".write(toFile: tmpPath, atomically: true, encoding: .utf8)
        defer { try? FileManager.default.removeItem(atPath: tmpPath) }

        let result = try await evaluateAsync("""
            (async function() {
                var fs = require('node:fs');
                await new Promise(function(resolve, reject) {
                    fs.rm('\(tmpPath)', function(error) {
                        if (error) reject(error);
                        else resolve();
                    });
                });
                return fs.existsSync('\(tmpPath)');
            })()
        """)

        #expect(result.boolValue == false)
    }

    @Test("fs.watchFile observes changes and unwatchFile stops polling")
    func fsWatchFileAndUnwatchFile() async throws {
        let tmpPath = NSTemporaryDirectory() + "swift-bun-watch-file-\(UUID().uuidString).txt"
        try "before".write(toFile: tmpPath, atomically: true, encoding: .utf8)
        defer { try? FileManager.default.removeItem(atPath: tmpPath) }

        let result = try await withLoadedProcess { process in
            let evaluation = Task {
                try await process.evaluateAsync(js: """
                    (async function() {
                        var fs = require('node:fs');
                        return await new Promise(function(resolve, reject) {
                            var events = [];
                            function listener(current, previous) {
                                events.push({
                                    currentSize: current.size,
                                    previousSize: previous.size
                                });
                                fs.unwatchFile('\(tmpPath)', listener);
                                setTimeout(function() {
                                    resolve(JSON.stringify(events));
                                }, 30);
                            }
                            fs.watchFile('\(tmpPath)', { interval: 20 }, listener);
                            setTimeout(function() {
                                fs.writeFileSync('\(tmpPath)', 'after change');
                            }, 40);
                        });
                    })()
                """)
            }

            return try await evaluation.value
        }

        #expect(result.stringValue.contains(#""previousSize":6"#))
        #expect(result.stringValue.contains(#""currentSize":12"#))
    }

    @Test("fs.promises.symlink, lstat, and rmdir are exposed")
    func fsPromisesSymlinkLstatAndRmdir() async throws {
        let tmpDir = NSTemporaryDirectory() + "swift-bun-symlink-\(UUID().uuidString)"
        let targetPath = tmpDir + "/target.txt"
        let linkPath = tmpDir + "/link.txt"
        let emptyDir = tmpDir + "/empty"
        try FileManager.default.createDirectory(atPath: tmpDir, withIntermediateDirectories: true)
        try "hello".write(toFile: targetPath, atomically: true, encoding: .utf8)
        try FileManager.default.createDirectory(atPath: emptyDir, withIntermediateDirectories: true)
        defer { try? FileManager.default.removeItem(atPath: tmpDir) }

        let result = try await evaluateAsync("""
            (async function() {
                var fs = require('node:fs');
                await fs.promises.symlink('\(targetPath)', '\(linkPath)');
                var stats = await fs.promises.lstat('\(linkPath)');
                await fs.promises.rmdir('\(emptyDir)');
                return JSON.stringify({
                    symlink: stats.isSymbolicLink(),
                    emptyDirRemoved: !fs.existsSync('\(emptyDir)'),
                    linkExists: fs.existsSync('\(linkPath)')
                });
            })()
        """)

        #expect(result.stringValue.contains(#""symlink":true"#))
        #expect(result.stringValue.contains(#""emptyDirRemoved":true"#))
        #expect(result.stringValue.contains(#""linkExists":true"#))
    }

    @Test("fs.promises exposes mkdtemp, link, utimes, and truncate")
    func fsPromisesMkdtempLinkUtimesAndTruncate() async throws {
        let tmpDir = NSTemporaryDirectory() + "swift-bun-fs-extra-\(UUID().uuidString)"
        let prefix = tmpDir + "/session-"
        let sourcePath = tmpDir + "/source.txt"
        let linkPath = tmpDir + "/hardlink.txt"
        try FileManager.default.createDirectory(atPath: tmpDir, withIntermediateDirectories: true)
        try "hello world".write(toFile: sourcePath, atomically: true, encoding: .utf8)
        defer { try? FileManager.default.removeItem(atPath: tmpDir) }

        let result = try await evaluateAsync("""
            (async function() {
                var fs = require('node:fs');
                var created = await fs.promises.mkdtemp('\(prefix)');
                await fs.promises.link('\(sourcePath)', '\(linkPath)');
                await fs.promises.truncate('\(sourcePath)', 5);
                await fs.promises.utimes('\(sourcePath)', new Date(0), new Date(1712345678000));

                var stats = await fs.promises.stat('\(sourcePath)');
                return JSON.stringify({
                    createdStartsWithPrefix: created.indexOf('\(prefix)') === 0,
                    hardlinkExists: fs.existsSync('\(linkPath)'),
                    truncated: fs.readFileSync('\(sourcePath)', 'utf-8') === 'hello',
                    mtimeMatches: Math.abs(Math.round(stats.mtimeMs) - 1712345678000) < 2000
                });
            })()
        """)

        #expect(result.stringValue.contains(#""createdStartsWithPrefix":true"#))
        #expect(result.stringValue.contains(#""hardlinkExists":true"#))
        #expect(result.stringValue.contains(#""truncated":true"#))
        #expect(result.stringValue.contains(#""mtimeMatches":true"#))
    }

    @Test("fs.promises.open exposes file handle helpers")
    func fsPromisesOpenFileHandle() async throws {
        let tmpPath = NSTemporaryDirectory() + "swift-bun-open-\(UUID().uuidString).txt"
        defer { try? FileManager.default.removeItem(atPath: tmpPath) }

        let result = try await withLoadedProcess { process in
            try await process.evaluateAsync(js: """
                (async function() {
                    var fs = require('node:fs');
                    var writer = await fs.promises.open('\(tmpPath)', 'w');
                    await writer.writeFile('hello handle');
                    await writer.datasync();
                    await writer.close();

                    var reader = await fs.promises.open('\(tmpPath)', 'r');
                    var text = await reader.readFile('utf-8');
                    await reader.close();
                    return text;
                })()
            """)
        }

        #expect(result.stringValue == "hello handle")
    }

    @Test("fs.promises.open read matches CLI release-note scan pattern")
    func fsPromisesOpenReadPattern() async throws {
        let tmpPath = NSTemporaryDirectory() + "swift-bun-open-read-\(UUID().uuidString).jsonl"
        defer { try? FileManager.default.removeItem(atPath: tmpPath) }

        let lines = [
            #"{"type":"user","message":{"content":"first prompt"}}"#,
            #"{"type":"assistant","summary":"tail summary"}"#
        ]
        try lines.joined(separator: "\n").write(toFile: tmpPath, atomically: true, encoding: .utf8)

        let result = try await withLoadedProcess { process in
            try await process.evaluateAsync(js: """
                (async function() {
                    var fs = require('node:fs');
                    var handle = await fs.promises.open('\(tmpPath)', 'r');
                    var size = fs.statSync('\(tmpPath)').size;
                    var chunkSize = 64;
                    var buffer = Buffer.alloc(chunkSize);
                    try {
                        var first = await handle.read(buffer, 0, chunkSize, 0);
                        var head = buffer.toString('utf8', 0, first.bytesRead);
                        var tailStart = Math.max(0, size - chunkSize);
                        var second = await handle.read(buffer, 0, chunkSize, tailStart);
                        var tail = buffer.toString('utf8', 0, second.bytesRead);
                        return JSON.stringify({
                            firstBytesRead: first.bytesRead,
                            secondBytesRead: second.bytesRead,
                            head: head,
                            tail: tail
                        });
                    } finally {
                        await handle.close();
                    }
                })()
            """)
        }

        #expect(result.stringValue.contains("first prompt"))
        #expect(result.stringValue.contains("tail summary"))
    }

    @Test("fs.promises.open write honors explicit position")
    func fsPromisesOpenWriteHonorsPosition() async throws {
        let tmpPath = NSTemporaryDirectory() + "swift-bun-open-write-\(UUID().uuidString).bin"
        try Data([65, 66, 67, 68]).write(to: URL(fileURLWithPath: tmpPath))
        defer { try? FileManager.default.removeItem(atPath: tmpPath) }

        let result = try await withLoadedProcess { process in
            try await process.evaluateAsync(js: """
                (async function() {
                    var fs = require('node:fs');
                    var handle = await fs.promises.open('\(tmpPath)', 'r+');
                    try {
                        var bytes = Buffer.from([120, 121]);
                        var written = await handle.write(bytes, 1);
                        return JSON.stringify({
                            bytesWritten: written.bytesWritten,
                            content: Array.from(fs.readFileSync('\(tmpPath)'))
                        });
                    } finally {
                        await handle.close();
                    }
                })()
            """)
        }

        #expect(result.stringValue.contains(#""bytesWritten":2"#))
        #expect(result.stringValue.contains(#""content":[65,120,121,68]"#))
    }

    @Test("fs.promises.open truncate honors requested length")
    func fsPromisesOpenTruncateHonorsLength() async throws {
        let tmpPath = NSTemporaryDirectory() + "swift-bun-open-truncate-\(UUID().uuidString).txt"
        try "abcdef".write(toFile: tmpPath, atomically: true, encoding: .utf8)
        defer { try? FileManager.default.removeItem(atPath: tmpPath) }

        let result = try await withLoadedProcess { process in
            try await process.evaluateAsync(js: """
                (async function() {
                    var fs = require('node:fs');
                    var handle = await fs.promises.open('\(tmpPath)', 'r+');
                    try {
                        await handle.truncate(3);
                        return fs.readFileSync('\(tmpPath)', 'utf-8');
                    } finally {
                        await handle.close();
                    }
                })()
            """)
        }

        #expect(result.stringValue == "abc")
    }

    // MARK: - Streams with FS

    @Test("stream/consumers.text reads fs.createReadStream")
    func streamConsumersTextWithFSReadStream() async throws {
        let tmpPath = NSTemporaryDirectory() + "swift-bun-consumers-\(UUID().uuidString).txt"
        try "hello consumers".write(toFile: tmpPath, atomically: true, encoding: .utf8)
        defer { try? FileManager.default.removeItem(atPath: tmpPath) }

        let result = try await evaluateAsync("""
            (async function() {
                var fs = require('node:fs');
                var consumers = require('node:stream/consumers');
                return await consumers.text(fs.createReadStream('\(tmpPath)'));
            })()
        """)

        #expect(result.stringValue == "hello consumers")
    }

    @Test("fs.createReadStream supports async iteration")
    func fsCreateReadStreamAsyncIterator() async throws {
        let tmpPath = NSTemporaryDirectory() + "swift-bun-readstream-async-\(UUID().uuidString).jsonl"
        try """
        {"type":"summary","value":"one"}
        {"type":"user","value":"two"}
        """.write(toFile: tmpPath, atomically: true, encoding: .utf8)
        defer { try? FileManager.default.removeItem(atPath: tmpPath) }

        let result = try await evaluateAsync("""
            (async function() {
                var fs = require('node:fs');
                var stream = fs.createReadStream('\(tmpPath)', { end: 31 });
                var chunks = [];
                for await (var chunk of stream) {
                    chunks.push(Buffer.isBuffer(chunk) ? chunk.toString('utf8') : String(chunk));
                }
                return chunks.join('');
            })()
        """)

        #expect(result.stringValue.contains(#""type":"summary""#))
    }
}

// Shared helper
final class NodeCompatLogCollector: Sendable {
    private let storage = Mutex<[String]>([])
    func append(_ line: String) { storage.withLock { $0.append(line) } }
    var values: [String] { storage.withLock { $0 } }
}
