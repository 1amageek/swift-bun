import Testing
import Foundation
@testable import BunRuntime
import TestHeartbeat

@Suite("Node.js Module Compatibility", .serialized, .heartbeat)
struct NodeCompatModuleTests {
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

    @Test("require('node:path') works")
    func requireNodePath() async throws {
        let result = try await evaluate("""
            var path = require('node:path');
            path.join('/foo', 'bar', 'baz');
        """)
        #expect(result.stringValue == "/foo/bar/baz")
    }

    @Test("require without node: prefix")
    func requireWithoutPrefix() async throws {
        let result = try await evaluate("""
            var path = require('path');
            path.join('a', 'b');
        """)
        #expect(result.stringValue == "a/b")
    }

    @Test("require unknown module throws")
    func requireUnknown() async throws {
        await #expect(throws: BunRuntimeError.self) {
            try await withLoadedProcess { process in
                try await process.evaluate(js: "require('unknown-module')")
            }
        }
    }

    @Test("EventEmitter basic usage")
    func eventEmitter() async throws {
        let result = try await evaluate("""
            var EventEmitter = require('node:events').EventEmitter;
            var ee = new EventEmitter();
            var received = '';
            ee.on('test', function(data) { received = data; });
            ee.emit('test', 'hello');
            received;
        """)
        #expect(result.stringValue == "hello")
    }

    @Test("events helpers support EventTarget and AbortSignal")
    func eventTargetHelpers() async throws {
        let result = try await evaluate("""
            (function() {
                var events = require('node:events');
                var target = new EventTarget();
                function onPing() {}
                target.addEventListener('ping', onPing);
                events.setMaxListeners(7, target);
                return JSON.stringify({
                    listeners: events.getEventListeners(target, 'ping').length,
                    max: events.getMaxListeners(target)
                });
            })()
        """)
        #expect(result.stringValue == #"{"listeners":1,"max":7}"#)
    }

    @Test("assert module supports equality throws and rejects")
    func assertModule() async throws {
        let result = try await evaluateAsync("""
            (async function() {
                var assert = require('node:assert');
                assert.equal(1, '1');
                assert.notEqual(1, 2);
                assert.ifError(null);
                assert.throws(function() { throw new TypeError('boom'); }, TypeError);
                await assert.rejects(async function() { throw new Error('nope'); }, /nope/);
                return assert.AssertionError != null && typeof assert.strictEqual === 'function';
            })()
        """)
        #expect(result.boolValue == true)
    }

    @Test("module.createRequire exposes builtinModules")
    func moduleCreateRequire() async throws {
        let result = try await evaluate("""
            (function() {
                var mod = require('node:module');
                var localRequire = mod.createRequire('/tmp/example.js');
                return JSON.stringify({
                    fs: typeof localRequire('node:fs').readFileSync === 'function',
                    resolved: localRequire.resolve('node:path'),
                    hasBuiltin: mod.builtinModules.includes('node:stream/promises') && mod.builtinModules.includes('path/posix')
                });
            })()
        """)
        #expect(result.stringValue == #"{"fs":true,"resolved":"node:path","hasBuiltin":true}"#)
    }

    @Test("readline question and line event work")
    func readlineQuestionAndLineEvent() async throws {
        let result = try await withLoadedProcess { process in
            let promise = Task {
                try await process.evaluateAsync(js: """
                (async function() {
                    var readline = require('node:readline');
                    var rl = readline.createInterface({ input: process.stdin, output: process.stdout });
                    var seenLine = null;
                    rl.on('line', function(line) {
                        seenLine = line;
                    });
                    return await new Promise(function(resolve) {
                        rl.question('prompt> ', function(answer) {
                            rl.close();
                            resolve(JSON.stringify({ answer: answer, seenLine: seenLine }));
                        });
                    });
                })()
            """)
            }

            try await Task.sleep(nanoseconds: 50_000_000)
            process.sendInput("hello readline\n".data(using: .utf8)!)
            return try await promise.value
        }
        #expect(result.stringValue == #"{"answer":"hello readline","seenLine":"hello readline"}"#)
    }

    @Test("readline async iterator yields lines")
    func readlineAsyncIterator() async throws {
        let result = try await withLoadedProcess { process in
            let promise = Task {
                try await process.evaluateAsync(js: """
                (async function() {
                    var readline = require('node:readline');
                    var rl = readline.createInterface({ input: process.stdin, output: process.stdout });
                    var values = [];
                    for await (var line of rl) {
                        values.push(line);
                        if (values.length === 2) {
                            rl.close();
                        }
                    }
                    return values.join('|');
                })()
            """)
            }

            try await Task.sleep(nanoseconds: 50_000_000)
            process.sendInput("line1\nline2\n".data(using: .utf8)!)
            return try await promise.value
        }
        #expect(result.stringValue == "line1|line2")
    }

    @Test("readline close preserves queued line for pending async iterator")
    func readlineClosePreservesQueuedLine() async throws {
        let result = try await withLoadedProcess { process in
            let promise = Task {
                try await process.evaluateAsync(js: """
                (async function() {
                    var readline = require('node:readline');
                    var rl = readline.createInterface({ input: process.stdin, output: process.stdout });
                    rl.on('line', function(line) {
                        if (line === 'line2') {
                            rl.close();
                        }
                    });

                    var iterator = rl[Symbol.asyncIterator]();
                    var firstPromise = iterator.next();
                    var secondPromise = iterator.next();
                    var first = await firstPromise;
                    var second = await secondPromise;
                    return JSON.stringify({
                        first: first.value,
                        firstDone: first.done,
                        second: second.value,
                        secondDone: second.done
                    });
                })()
            """)
            }

            try await Task.sleep(nanoseconds: 50_000_000)
            process.sendInput("line1\nline2\n".data(using: .utf8)!)
            return try await promise.value
        }
        #expect(result.stringValue == #"{"first":"line1","firstDone":false,"second":"line2","secondDone":false}"#)
    }

    @Test("tty exposes non-TTY stream shape")
    func ttyModule() async throws {
        let result = try await evaluate("""
            (function() {
                var tty = require('node:tty');
                var out = new tty.WriteStream(1);
                var input = new tty.ReadStream(0);
                return JSON.stringify({
                    isTTY: tty.isatty(1),
                    outTTY: out.isTTY,
                    inTTY: input.isTTY,
                    colorDepth: out.getColorDepth()
                });
            })()
        """)
        #expect(result.stringValue == #"{"isTTY":false,"outTTY":false,"inTTY":false,"colorDepth":1}"#)
    }

    @Test("perf_hooks performance is exported")
    func perfHooks() async throws {
        let result = try await evaluate("""
            (function() {
                var perf = require('node:perf_hooks');
                var observer = new perf.PerformanceObserver(function() {});
                observer.observe({ entryTypes: ['measure'] });
                observer.disconnect();
                return typeof perf.performance.now() === 'number' && Array.isArray(perf.PerformanceObserver.supportedEntryTypes);
            })()
        """)
        #expect(result.boolValue == true)
    }

    @Test("diagnostics_channel subscribe publish unsubscribe")
    func diagnosticsChannel() async throws {
        let result = try await evaluate("""
            (function() {
                var dc = require('node:diagnostics_channel');
                var ch = dc.channel('swift-bun-test');
                var seen = [];
                function listener(message, name) { seen.push(name + ':' + message.value); }
                ch.subscribe(listener);
                var subscribed = ch.hasSubscribers && dc.hasSubscribers('swift-bun-test');
                ch.publish({ value: 42 });
                ch.unsubscribe(listener);
                return JSON.stringify({
                    subscribed: subscribed,
                    seen: seen[0],
                    unsubscribed: ch.hasSubscribers === false
                });
            })()
        """)
        #expect(result.stringValue == #"{"subscribed":true,"seen":"swift-bun-test:42","unsubscribed":true}"#)
    }

    @Test("dns.lookup resolves localhost")
    func dnsLookup() async throws {
        let result = try await evaluateAsync("""
            (async function() {
                var dns = require('node:dns');
                var callbackResult = await new Promise(function(resolve, reject) {
                    dns.lookup('localhost', function(error, address, family) {
                        if (error) reject(error);
                        else resolve(JSON.stringify({ address: address, family: family }));
                    });
                });
                var promiseResult = await dns.promises.lookup('localhost');
                return JSON.stringify({
                    callback: JSON.parse(callbackResult),
                    promise: promiseResult
                });
            })()
        """)
        #expect(result.stringValue.contains(#""family":4"#) || result.stringValue.contains(#""family":6"#))
    }

    @Test("v8.getHeapSpaceStatistics returns array shape")
    func v8HeapSpaceStatistics() async throws {
        let result = try await evaluate("""
            (function() {
                var v8 = require('node:v8');
                var entries = v8.getHeapSpaceStatistics();
                return Array.isArray(entries) && entries.length > 0 && typeof entries[0].space_name === 'string';
            })()
        """)
        #expect(result.boolValue == true)
    }

    @Test("zlib.deflateSync compresses string input")
    func zlibDeflateSync() async throws {
        let result = try await evaluate("""
            require('node:zlib').deflateSync('hello').toString('hex')
        """)
        #expect(result.stringValue == "789ccb48cdc9c90700062c0215")
    }

    @Test("net.createServer and connect roundtrip")
    func netCreateServerAndConnect() async throws {
        let result = try await evaluateAsync("""
            (async function() {
                var net = require('node:net');
                return await new Promise(function(resolve, reject) {
                    var log = [];
                    var server = net.createServer(function(socket) {
                        log.push('server:connection');
                        socket.on('data', function(chunk) {
                            log.push('server:data:' + chunk.toString());
                            socket.end(chunk);
                        });
                    });
                    server.on('error', reject);
                    server.on('close', function() { log.push('server:close'); });
                    server.listen(0, '127.0.0.1', function() {
                        log.push('server:listening');
                        var address = server.address();
                        var client = net.connect({ host: '127.0.0.1', port: address.port }, function() {
                            log.push('client:connect');
                            client.write('ping');
                        });
                        var seen = '';
                        client.on('data', function(chunk) {
                            log.push('client:data:' + chunk.toString());
                            seen += chunk.toString();
                        });
                        client.on('end', function() {
                            log.push('client:end');
                            server.close(function() {
                                resolve(JSON.stringify({ seen: seen, log: log }));
                            });
                        });
                        client.on('error', reject);
                    });
                    setTimeout(function() {
                        resolve(JSON.stringify({ seen: 'timeout', log: log }));
                    }, 200);
                });
            })()
        """)
        #expect(result.stringValue.contains(#""seen":"ping""#))
    }

    @Test("http.createServer handles request and response")
    func httpCreateServer() async throws {
        let result = try await evaluateAsync("""
            (async function() {
                var http = require('node:http');
                return await new Promise(function(resolve, reject) {
                    var server = http.createServer(function(req, res) {
                        var body = '';
                        req.on('data', function(chunk) {
                            body += chunk.toString();
                        });
                        req.on('end', function() {
                            res.setHeader('content-type', 'application/json');
                            res.writeHead(201);
                            res.end(JSON.stringify({ method: req.method, url: req.url, body: body }));
                        });
                    });
                    server.on('error', reject);
                    server.listen(0, '127.0.0.1', function() {
                        var address = server.address();
                        var req = http.request({
                            hostname: '127.0.0.1',
                            port: address.port,
                            path: '/echo?x=1',
                            method: 'POST',
                            headers: { 'content-type': 'text/plain' }
                        }, function(resp) {
                            var payload = '';
                            resp.on('data', function(chunk) { payload += chunk.toString(); });
                            resp.on('end', function() {
                                server.close(function() {
                                    resolve(JSON.stringify({ status: resp.statusCode, payload: payload }));
                                });
                            });
                        });
                        req.on('error', reject);
                        req.end('hello');
                    });
                });
            })()
        """)
        #expect(result.stringValue.contains(#""status":201"#))
        #expect(result.stringValue.contains(#"\"body\":\"hello\""#))
    }

    #if os(macOS)
    @Test("child_process.execSync runs command on macOS")
    func childProcessExecSync() async throws {
        let result = try await evaluate("""
            require('node:child_process').execSync('printf hello').toString()
        """)
        #expect(result.stringValue == "hello")
    }

    @Test("child_process.execFileSync returns stdout on macOS")
    func childProcessExecFileSync() async throws {
        let result = try await evaluate("""
            require('node:child_process').execFileSync('/bin/echo', ['hello']).toString().trim()
        """)
        #expect(result.stringValue == "hello")
    }

    @Test("child_process.spawnSync returns stdout on macOS")
    func childProcessSpawnSync() async throws {
        let result = try await evaluate("""
            var r = require('node:child_process').spawnSync('/bin/echo', ['hello']);
            JSON.stringify({ status: r.status, stdout: r.stdout.toString().trim() })
        """)
        #expect(result.stringValue.contains(#""status":0"#))
        #expect(result.stringValue.contains(#""stdout":"hello""#))
    }

    @Test("child_process.execFile captures stdout on macOS")
    func childProcessExecFile() async throws {
        let result = try await evaluateAsync("""
            (async function() {
                var cp = require('node:child_process');
                return await new Promise(function(resolve, reject) {
                    cp.execFile('/usr/bin/printf', ['hello'], function(err, stdout) {
                        if (err) reject(err);
                        else resolve(stdout);
                    });
                });
            })()
        """)
        #expect(result.stringValue == "hello")
    }

    @Test("child_process.spawn emits close event on macOS")
    func childProcessSpawn() async throws {
        let result = try await evaluateAsync("""
            (async function() {
                var cp = require('node:child_process');
                var child = cp.spawn('/bin/echo', ['hello']);
                var stdout = '';
                child.stdout.on('data', function(c) { stdout += c.toString(); });
                return await new Promise(function(resolve) {
                    child.on('close', function(code) {
                        resolve(JSON.stringify({ code: code, stdout: stdout.trim() }));
                    });
                });
            })()
        """)
        #expect(result.stringValue.contains(#""code":0"#))
        #expect(result.stringValue.contains(#""stdout":"hello""#))
    }

    @Test("child_process.spawn returns ChildProcess instance on macOS")
    func childProcessInstance() async throws {
        let result = try await evaluate("""
            (function() {
                var cp = require('node:child_process');
                var child = cp.spawn('/bin/echo', ['hello']);
                return child instanceof cp.ChildProcess;
            })()
        """)
        #expect(result.boolValue == true)
    }
    #else
    @Test("child_process.execFile is unsupported on iOS")
    func childProcessExecFileUnsupported() async throws {
        await #expect(throws: BunRuntimeError.self) {
            try await evaluate("""
                require('node:child_process').execFile('/usr/bin/printf', ['hello'])
            """)
        }
    }

    @Test("child_process.spawn is unsupported on iOS")
    func childProcessSpawnUnsupported() async throws {
        await #expect(throws: BunRuntimeError.self) {
            try await evaluate("""
                require('node:child_process').spawn('/bin/cat', [], {})
            """)
        }
    }
    #endif
}
