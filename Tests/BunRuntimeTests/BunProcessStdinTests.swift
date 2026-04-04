import Testing
import Foundation
import Synchronization
@testable import BunRuntime
import TestHeartbeat

@Suite("BunProcess Stdin", .serialized, .heartbeat)
struct BunProcessStdinTests {

    @Test func stdinData() async throws {
        let url = try tempBundle("""
            process.stdin.on('data', function(c) {
                // Use setTimeout to exit outside the stream callback
                // (process.exit throws a sentinel that breaks readable-stream internals)
                setTimeout(function() { process.exit(c === 'hello' ? 0 : 1); }, 0);
            });
        """)
        defer { try? FileManager.default.removeItem(at: url) }
        let p = BunProcess(bundle: url)
        let task = Task { try await TestProcessSupport.run(p) }
        try await Task.sleep(for: .milliseconds(50))
        p.sendInput("hello".data(using: .utf8)!)
        #expect(try await task.value == 0)
    }

    @Test func stdinPreservesNewlines() async throws {
        let url = try tempBundle("""
            process.stdin.on('data', function(c) {
                var hasActualNewline = c.indexOf('\\n') !== -1;
                var hasEscapedBackslashN = c.indexOf('\\\\n') !== -1;
                setTimeout(function() {
                    process.exit(hasActualNewline && !hasEscapedBackslashN ? 0 : 1);
                }, 0);
            });
        """)
        defer { try? FileManager.default.removeItem(at: url) }
        let p = BunProcess(bundle: url)
        let task = Task { try await TestProcessSupport.run(p) }
        try await Task.sleep(for: .milliseconds(50))
        p.sendInput("line1\nline2".data(using: .utf8)!)
        #expect(try await task.value == 0)
    }

    @Test func stdinEOF() async throws {
        let url = try tempBundle("""
            process.stdin.on('end', function() {
                setTimeout(function() { process.exit(0); }, 0);
            });
        """)
        defer { try? FileManager.default.removeItem(at: url) }
        let p = BunProcess(bundle: url)
        let task = Task { try await TestProcessSupport.run(p) }
        try await Task.sleep(for: .milliseconds(50))
        p.sendInput(nil)
        #expect(try await task.value == 0)
    }

    @Test func stdinAsyncIteratorKeepsAlive() async throws {
        // for await on stdin should ref() and keep the process alive
        let url = try tempBundle("""
            (async function() {
                for await (var chunk of process.stdin) {
                    setTimeout(function(){ process.exit(chunk === 'ok' ? 0 : 1); }, 0);
                }
            })();
        """)
        defer { try? FileManager.default.removeItem(at: url) }
        let p = BunProcess(bundle: url)
        let task = Task { try await TestProcessSupport.run(p) }

        // Process should still be alive after 200ms (waiting for stdin)
        try await Task.sleep(for: .milliseconds(200))

        p.sendInput("ok".data(using: .utf8)!)
        #expect(try await task.value == 0)
    }

    @Test func stdinAsyncIterator() async throws {
        let url = try tempBundle("""
            (async function() {
                var chunks = [];
                for await (var chunk of process.stdin) {
                    chunks.push(chunk);
                    if (chunks.length >= 2) break;
                }
                setTimeout(function(){ process.exit(chunks.join(',') === 'a,b' ? 0 : 1); }, 0);
            })();
        """)
        defer { try? FileManager.default.removeItem(at: url) }
        let p = BunProcess(bundle: url)
        let task = Task { try await TestProcessSupport.run(p) }
        try await Task.sleep(for: .milliseconds(50))
        p.sendInput("a".data(using: .utf8)!)
        try await Task.sleep(for: .milliseconds(10))
        p.sendInput("b".data(using: .utf8)!)
        #expect(try await task.value == 0)
    }

    @Test func stdinAsyncIteratorUnrefsAfterEOF() async throws {
        let url = try tempBundle("""
            (async function() {
                for await (const _ of process.stdin) {
                }
                // Iterator completed on EOF. No explicit exit here:
                // stdin keep-alive must be released so the process can exit naturally.
            })();
        """)
        defer { try? FileManager.default.removeItem(at: url) }
        let p = BunProcess(bundle: url)
        let task = Task { try await TestProcessSupport.run(p) }

        try await Task.sleep(for: .milliseconds(50))
        p.sendInput(nil)
        #expect(try await task.value == 0)
    }

    @Test func stdinPipe() async throws {
        let url = try tempBundle("""
            var output = '';
            var writable = {
                write: function(chunk, enc, cb) { output += chunk; if (cb) cb(); },
                end: function() {
                    setTimeout(function() { process.exit(output === 'hello' ? 0 : 1); }, 0);
                }
            };
            var W = require('stream').Writable;
            var dest = new W({ write: writable.write });
            dest.on('finish', writable.end);
            process.stdin.pipe(dest);
        """)
        defer { try? FileManager.default.removeItem(at: url) }
        let p = BunProcess(bundle: url)
        let task = Task { try await TestProcessSupport.run(p) }
        try await Task.sleep(for: .milliseconds(50))
        p.sendInput("hello".data(using: .utf8)!)
        try await Task.sleep(for: .milliseconds(10))
        p.sendInput(nil) // EOF triggers end
        #expect(try await task.value == 0)
    }

    @Test func stdinRead() async throws {
        let url = try tempBundle("""
            process.stdin.on('readable', function() {
                var chunk = process.stdin.read();
                if (chunk !== null) {
                    setTimeout(function(){ process.exit(chunk === 'test' ? 0 : 1); }, 0);
                }
            });
        """)
        defer { try? FileManager.default.removeItem(at: url) }
        let p = BunProcess(bundle: url)
        let task = Task { try await TestProcessSupport.run(p) }
        try await Task.sleep(for: .milliseconds(50))
        p.sendInput("test".data(using: .utf8)!)
        #expect(try await task.value == 0)
    }

    @Test func stdinRefUnref() async throws {
        let url = try tempBundle("""
            // ref() keeps alive, unref() allows exit
            process.stdin.ref();
            setTimeout(function() {
                process.stdin.unref();
                // No more refs -> natural exit
            }, 50);
        """)
        defer { try? FileManager.default.removeItem(at: url) }
        #expect(try await TestProcessSupport.run(BunProcess(bundle: url)) == 0)
    }

    @Test func stdinListenerCount() async throws {
        let url = try tempBundle("""
            var fn1 = function() {};
            var fn2 = function() {};
            process.stdin.on('data', fn1);
            process.stdin.on('data', fn2);
            var c = process.stdin.listenerCount('data');
            process.stdin.removeListener('data', fn1);
            var c2 = process.stdin.listenerCount('data');
            process.exit(c === 2 && c2 === 1 ? 0 : 1);
        """)
        defer { try? FileManager.default.removeItem(at: url) }
        #expect(try await TestProcessSupport.run(BunProcess(bundle: url)) == 0)
    }

    @Test func stdinSetRawMode() async throws {
        let url = try tempBundle("""
            // setRawMode should not throw (no-op on iOS)
            var result = process.stdin.setRawMode(true);
            process.exit(result === process.stdin ? 0 : 1);
        """)
        defer { try? FileManager.default.removeItem(at: url) }
        #expect(try await TestProcessSupport.run(BunProcess(bundle: url)) == 0)
    }

    @Test func stdinKeepsProcessAlive() async throws {
        // Process registers stdin.on('data') but receives no data yet.
        // The process must NOT exit immediately -- stdin listener is an active handle.
        let url = try tempBundle("""
            process.stdin.on('data', function(chunk) {
                setTimeout(function(){ process.exit(chunk === 'go' ? 0 : 1); }, 0);
            });
            // No process.exit here -- process should stay alive waiting for stdin
        """)
        defer { try? FileManager.default.removeItem(at: url) }
        let p = BunProcess(bundle: url)
        let task = Task { try await TestProcessSupport.run(p) }

        // Wait 200ms -- if process exited already, task.value would be available
        try await Task.sleep(for: .milliseconds(200))

        // Send data to unblock
        p.sendInput("go".data(using: .utf8)!)
        #expect(try await task.value == 0)
    }

    @Test func stdinBufferedBeforeAsyncIteratorAttaches() async throws {
        let url = try tempBundle("""
            setTimeout(async function() {
                for await (const chunk of process.stdin) {
                    setTimeout(function() {
                        process.exit(chunk === 'go' ? 0 : 1);
                    }, 0);
                    return;
                }
                process.exit(1);
            }, 100);
        """)
        defer { try? FileManager.default.removeItem(at: url) }
        let p = BunProcess(bundle: url)
        let task = Task { try await TestProcessSupport.run(p) }

        try await Task.sleep(for: .milliseconds(20))
        p.sendInput("go".data(using: .utf8)!)
        #expect(try await task.value == 0)
    }

    @Test func stdinBufferedUntilRuntimeIsRunning() async throws {
        let url = try tempBundle("""
            var received = false;
            process.stdin.on('data', function(chunk) {
                received = true;
                setTimeout(function() {
                    process.exit(chunk === 'boot-sequence' ? 0 : 1);
                }, 0);
            });
            setTimeout(function() {
                if (!received) process.exit(2);
            }, 300);
        """)
        defer { try? FileManager.default.removeItem(at: url) }
        let p = BunProcess(bundle: url)
        let task = Task { try await TestProcessSupport.run(p) }

        p.sendInput("boot-sequence".data(using: .utf8)!)

        #expect(try await task.value == 0)
    }

    @Test func stdinBufferedUntilListenerAttachesAfterAsyncStartup() async throws {
        let url = try tempBundle("""
            var received = false;
            setTimeout(function() {
                process.stdin.on('data', function(chunk) {
                    received = true;
                    setTimeout(function() {
                        process.exit(chunk === 'delayed-attach' ? 0 : 1);
                    }, 0);
                });
            }, 50);
            setTimeout(function() {
                if (!received) process.exit(2);
            }, 300);
        """)
        defer { try? FileManager.default.removeItem(at: url) }
        let p = BunProcess(bundle: url)
        let task = Task { try await TestProcessSupport.run(p) }

        p.sendInput("delayed-attach".data(using: .utf8)!)

        #expect(try await task.value == 0)
    }

    @Test func stdinCanBeBufferedBeforeAnyRefAndReadLater() async throws {
        let url = try tempBundle("""
            setTimeout(function() {
                var chunk = process.stdin.read();
                setTimeout(function() {
                    process.exit(chunk === 'prefetched' ? 0 : 1);
                }, 0);
            }, 50);
        """)
        defer { try? FileManager.default.removeItem(at: url) }
        let p = BunProcess(bundle: url)
        let task = Task { try await TestProcessSupport.run(p) }

        p.sendInput("prefetched".data(using: .utf8)!)

        #expect(try await task.value == 0)
    }

    @Test func stdinBufferedUntilImportedProcessListenerAttaches() async throws {
        let url = try tempBundle("""
            import nodeProcess from 'node:process';

            var received = false;
            setTimeout(function() {
                nodeProcess.stdin.on('data', function(chunk) {
                    received = true;
                    setTimeout(function() {
                        process.exit(chunk === 'imported-process' ? 0 : 1);
                    }, 0);
                });
            }, 50);
            setTimeout(function() {
                if (!received) process.exit(2);
            }, 300);
        """)
        defer { try? FileManager.default.removeItem(at: url) }
        let p = BunProcess(bundle: url)
        let task = Task { try await TestProcessSupport.run(p) }

        p.sendInput("imported-process".data(using: .utf8)!)

        #expect(try await task.value == 0)
    }

    @Test func stdinBufferedUntilWrappedAsyncReaderConsumesDuringStartupPromise() async throws {
        let url = try tempBundle("""
            class WrappedReader {
                constructor(input) {
                    this.input = input;
                }

                async *read() {
                    for await (const chunk of this.input) {
                        yield chunk;
                    }
                }
            }

            globalThis.__swiftBunStartupPromise = (async function() {
                var reader = new WrappedReader(process.stdin);
                for await (const chunk of reader.read()) {
                    process.exit(chunk === 'wrapped-startup' ? 0 : 1);
                    return;
                }
                process.exit(2);
            })();
        """)
        defer { try? FileManager.default.removeItem(at: url) }
        let p = BunProcess(bundle: url)
        let task = Task { try await TestProcessSupport.run(p) }

        p.sendInput("wrapped-startup".data(using: .utf8)!)

        #expect(try await task.value == 0)
    }

    @Test func stdinResumeKeepsProcessAlive() async throws {
        let url = try tempBundle("""
            process.stdin.resume();
        """)
        defer { try? FileManager.default.removeItem(at: url) }
        let p = BunProcess(bundle: url)
        let task = Task { try await TestProcessSupport.run(p) }

        try await Task.sleep(for: .milliseconds(200))

        p.terminate(exitCode: 0)
        #expect(try await task.value == 0)
    }

    @Test func stdinPauseReleasesKeepAlive() async throws {
        let url = try tempBundle("""
            process.stdin.resume();
            setTimeout(function() {
                process.stdin.pause();
            }, 20);
        """)
        defer { try? FileManager.default.removeItem(at: url) }
        #expect(try await TestProcessSupport.run(BunProcess(bundle: url)) == 0)
    }

    @Test func stdinUnrefOnEndWithListener() async throws {
        let url = try tempBundle("""
            process.stdin.on('data', function() {});
            process.stdin.on('end', function() {});
        """)
        defer { try? FileManager.default.removeItem(at: url) }
        let p = BunProcess(bundle: url)
        let task = Task { try await TestProcessSupport.run(p) }
        try await Task.sleep(for: .milliseconds(50))
        p.sendInput(nil)
        #expect(try await task.value == 0)
    }

    @Test func stdinUnrefOnEndWithoutListener() async throws {
        // Even without an 'end' listener, emit('end') must still unref stdin.
        let url = try tempBundle("""
            process.stdin.on('data', function() {});
            // No 'end' listener registered
        """)
        defer { try? FileManager.default.removeItem(at: url) }
        let p = BunProcess(bundle: url)
        let task = Task { try await TestProcessSupport.run(p) }
        try await Task.sleep(for: .milliseconds(50))
        p.sendInput(nil)
        #expect(try await task.value == 0)
    }

    @Test func stdinUnrefOnRemoveListener() async throws {
        // Removing all data listeners should unref stdin.
        let url = try tempBundle("""
            var handler = function() {};
            process.stdin.on('data', handler);
            // Immediately remove -- should unref and allow natural exit
            process.stdin.removeListener('data', handler);
            // No active handles -> exit naturally
        """)
        defer { try? FileManager.default.removeItem(at: url) }
        #expect(try await TestProcessSupport.run(BunProcess(bundle: url)) == 0)
    }
}
