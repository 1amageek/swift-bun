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

    @Test("EventEmitter prepend APIs preserve listener order")
    func eventEmitterPrependListener() async throws {
        let result = try await evaluate("""
            (function() {
                var EventEmitter = require('node:events').EventEmitter;
                var ee = new EventEmitter();
                var calls = [];
                ee.on('tick', function() { calls.push('tail'); });
                ee.prependListener('tick', function() { calls.push('head'); });
                ee.prependOnceListener('tick', function() { calls.push('once'); });
                ee.emit('tick');
                ee.emit('tick');
                return calls.join(',');
            })()
        """)
        #expect(result.stringValue == "once,head,tail,head,tail")
    }

    @Test("EventEmitter throws on unhandled error")
    func eventEmitterUnhandledError() async throws {
        await #expect(throws: BunRuntimeError.self) {
            try await evaluate("""
                (function() {
                    var EventEmitter = require('node:events').EventEmitter;
                    var ee = new EventEmitter();
                    ee.emit('error', new Error('boom'));
                })()
            """)
        }
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

    @Test("string_decoder handles multibyte characters across chunk boundaries")
    func stringDecoderHandlesSplitCodepoints() async throws {
        let result = try await evaluate("""
            (function() {
                var StringDecoder = require('node:string_decoder').StringDecoder;
                var decoder = new StringDecoder('utf8');
                var bytes = Buffer.from('😀');
                return decoder.write(bytes.slice(0, 2)) + decoder.end(bytes.slice(2));
            })()
        """)
        #expect(result.stringValue == "😀")
    }

    @Test("querystring parse and stringify support repeated keys and arrays")
    func querystringSupportsRepeatedKeysAndArrays() async throws {
        let result = try await evaluate("""
            (function() {
                var qs = require('node:querystring');
                var parsed = qs.parse('tag=swift&tag=bun&name=swift+bun');
                var stringified = qs.stringify({ tag: ['swift', 'bun'], ok: true });
                return JSON.stringify({
                    tags: parsed.tag,
                    name: parsed.name,
                    stringified: stringified
                });
            })()
        """)
        #expect(result.stringValue == #"{"tags":["swift","bun"],"name":"swift bun","stringified":"tag=swift&tag=bun&ok=true"}"#)
    }

    @Test("timers/promises rejects aborted timeouts with AbortError shape")
    func timersPromisesAbortSignal() async throws {
        let result = try await evaluateAsync("""
            (async function() {
                var timers = require('node:timers/promises');
                var controller = new AbortController();
                var promise = timers.setTimeout(50, 'value', { signal: controller.signal });
                controller.abort();
                try {
                    await promise;
                    return 'fulfilled';
                } catch (error) {
                    return JSON.stringify({
                        name: error && error.name,
                        code: error && error.code
                    });
                }
            })()
        """)
        #expect(result.stringValue == #"{"name":"AbortError","code":"ABORT_ERR"}"#)
    }

    @Test("timers/promises setInterval removes abort listeners after each tick")
    func timersPromisesSetIntervalCleansAbortListeners() async throws {
        let result = try await evaluateAsync("""
            (async function() {
                var timers = require('node:timers/promises');
                var added = 0;
                var removed = 0;
                var signal = {
                    aborted: false,
                    addEventListener: function(type, fn) {
                        if (type === 'abort') added += 1;
                    },
                    removeEventListener: function(type, fn) {
                        if (type === 'abort') removed += 1;
                    }
                };
                var iterator = timers.setInterval(1, 'tick', { signal: signal });
                await iterator.next();
                await iterator.next();
                await iterator.return();
                return JSON.stringify({ added: added, removed: removed });
            })()
        """)
        #expect(result.stringValue == #"{"added":3,"removed":3}"#)
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

    @Test("assert strict, match, and negative deep equality behave like Node")
    func assertStrictAndMatch() async throws {
        let result = try await evaluateAsync("""
            (async function() {
                var assert = require('node:assert');
                var strictFailed = false;
                try {
                    assert.strict.equal(1, '1');
                } catch (error) {
                    strictFailed = error && error.code === 'ERR_ASSERTION';
                }

                assert.notDeepEqual({ value: 1 }, { value: 2 });
                assert.notDeepStrictEqual({ value: 1 }, { value: '1' });
                assert.match('hello world', /world/);
                assert.doesNotMatch('hello world', /goodbye/);
                await assert.doesNotReject(async function() { return 42; });

                return JSON.stringify({
                    strictFailed: strictFailed,
                    failCode: (function() {
                        try {
                            assert.fail(1, 2, 'boom', '!==');
                        } catch (error) {
                            return error.code + ':' + error.operator;
                        }
                        return 'missing';
                    })(),
                    strictAlias: assert.strict === assert.strict.strict,
                    strictDeepEqual: typeof assert.strict.deepEqual
                });
            })()
        """)
        #expect(result.stringValue == #"{"strictFailed":true,"failCode":"ERR_ASSERTION:!==","strictAlias":true,"strictDeepEqual":"function"}"#)
    }

    @Test("assert partialDeepStrictEqual supports subset matching")
    func assertPartialDeepStrictEqual() async throws {
        let result = try await evaluate("""
            (function() {
                var assert = require('node:assert');
                assert.partialDeepStrictEqual(
                    { a: 1, b: 2, nested: { c: 3, d: [1, 2, 3] } },
                    { a: 1, nested: { c: 3, d: [1, 2] } }
                );
                try {
                    assert.partialDeepStrictEqual(
                        { a: 1, nested: { c: 4 } },
                        { a: 1, nested: { c: 3 } }
                    );
                } catch (error) {
                    return error.code + ':' + error.operator;
                }
                return 'missing';
            })()
        """)
        #expect(result.stringValue == "ERR_ASSERTION:partialDeepStrictEqual")
    }

    @Test("assert partialDeepStrictEqual supports maps sets typed arrays and cycles")
    func assertPartialDeepStrictEqualCompositeTypes() async throws {
        let result = try await evaluate("""
            (function() {
                var assert = require('node:assert');
                var actual = {
                    map: new Map([['a', { count: 1 }], ['b', { count: 2 }]]),
                    set: new Set([{ id: 1 }, { id: 2 }, { id: 3 }]),
                    bytes: Uint8Array.from([1, 2, 3]),
                    nested: { value: 9 }
                };
                actual.self = actual;

                var expected = {
                    map: new Map([['a', { count: 1 }]]),
                    set: new Set([{ id: 2 }, { id: 3 }]),
                    bytes: Uint8Array.from([1, 2]),
                    nested: { value: 9 }
                };
                expected.self = expected;

                assert.partialDeepStrictEqual(actual, expected);

                try {
                    assert.partialDeepStrictEqual(actual, {
                        map: new Map([['z', { count: 7 }]])
                    });
                } catch (error) {
                    return error.code + ':' + error.operator;
                }

                return 'missing';
            })()
        """)
        #expect(result.stringValue == "ERR_ASSERTION:partialDeepStrictEqual")
    }

    @Test("assert CallTracker tracks calls, reports pending counts, and resets tracked functions")
    func assertCallTracker() async throws {
        let result = try await evaluate("""
            (function() {
                var assert = require('node:assert');
                var tracker = new assert.CallTracker();
                var wrapped = tracker.calls(function(a, b) { return a + b; }, 2);
                var noop = tracker.calls(1);

                var initialReport = tracker.report(wrapped);
                var first = wrapped(1, 2);
                noop();
                var callsAfterFirst = tracker.getCalls(wrapped);
                var verifyAfterFirst;
                try {
                    tracker.verify(wrapped);
                    verifyAfterFirst = 'ok';
                } catch (error) {
                    verifyAfterFirst = error.code + ':' + String(error.actual) + ':' + String(error.expected);
                }
                var second = wrapped(3, 4);
                tracker.verify(wrapped);
                var reportBeforeReset = tracker.report(wrapped).length;
                tracker.reset(wrapped);

                return JSON.stringify({
                    first: first,
                    second: second,
                    initialReport: initialReport[0].actual + ':' + initialReport[0].expected,
                    callCount: callsAfterFirst.length,
                    firstCallArgs: callsAfterFirst[0].arguments.join(','),
                    verifyAfterFirst: verifyAfterFirst,
                    reportBeforeReset: reportBeforeReset,
                    reportAfterReset: tracker.report(wrapped).length,
                    reportNoopAfterReset: tracker.report(noop).length,
                    noopCalls: tracker.getCalls(noop).length,
                    callsAfterReset: tracker.getCalls(wrapped).length
                });
            })()
        """)
        #expect(result.stringValue == #"{"first":3,"second":7,"initialReport":"0:2","callCount":1,"firstCallArgs":"1,2","verifyAfterFirst":"ERR_ASSERTION:undefined:undefined","reportBeforeReset":0,"reportAfterReset":1,"reportNoopAfterReset":0,"noopCalls":1,"callsAfterReset":0}"#)
    }

    @Test("assert CallTracker validates expected range and invalid tracked functions")
    func assertCallTrackerValidation() async throws {
        let result = try await evaluate("""
            (function() {
                var assert = require('node:assert');
                var tracker = new assert.strict.CallTracker();
                var invalidExact;
                try {
                    tracker.calls(function() {}, 0);
                    invalidExact = 'missing';
                } catch (error) {
                    invalidExact = error.code + ':' + error.name;
                }

                var invalidTracked;
                try {
                    tracker.getCalls(function() {});
                    invalidTracked = 'missing';
                } catch (error) {
                    invalidTracked = error.code + ':' + error.name;
                }

                var wrapped = tracker.calls(function(value) { return value; }, 1);
                var pending = tracker.report(wrapped)[0];
                return JSON.stringify({
                    invalidExact: invalidExact,
                    invalidTracked: invalidTracked,
                    pending: pending.actual + ':' + pending.expected + ':' + (pending.stack instanceof Error),
                    strictCallTracker: typeof assert.strict.CallTracker
                });
            })()
        """)
        #expect(result.stringValue == #"{"invalidExact":"ERR_OUT_OF_RANGE:RangeError","invalidTracked":"ERR_INVALID_ARG_VALUE:TypeError","pending":"0:1:true","strictCallTracker":"function"}"#)
    }

    @Test("assert CallTracker report and verify cover multiple tracked functions")
    func assertCallTrackerAggregateVerify() async throws {
        let result = try await evaluate("""
            (function() {
                var assert = require('node:assert');
                var tracker = new assert.CallTracker();
                var first = tracker.calls(function() {}, 2);
                var second = tracker.calls(function() {}, 1);
                first();

                var report = tracker.report().map(function(item) {
                    return item.actual + ':' + item.expected;
                }).join(',');

                try {
                    tracker.verify();
                } catch (error) {
                    return JSON.stringify({
                        report: report,
                        code: error.code,
                        message: error.message
                    });
                }

                return 'missing';
            })()
        """)
        #expect(result.stringValue == #"{"report":"1:2,0:1","code":"ERR_ASSERTION","message":"Functions were not called the expected number of times"}"#)
    }

    @Test("assert error matchers support deep object matching and selective rethrow")
    func assertErrorMatchers() async throws {
        let result = try await evaluateAsync("""
            (async function() {
                var assert = require('node:assert');
                assert.throws(function() {
                    var error = new Error('boom');
                    error.code = 'E_FAIL';
                    error.meta = { retry: true, count: 2 };
                    throw error;
                }, {
                    code: 'E_FAIL',
                    meta: { retry: true }
                });

                await assert.rejects((async function() {
                    var error = new Error('boom');
                    error.code = 'E_ASYNC';
                    error.meta = { retry: true, count: 3 };
                    throw error;
                })(), {
                    code: 'E_ASYNC',
                    meta: { retry: true }
                });

                var doesNotThrowSameError = false;
                var doesNotRejectSameError = false;

                var rangeError = new RangeError('range');
                try {
                    assert.doesNotThrow(function() { throw rangeError; }, TypeError);
                } catch (error) {
                    doesNotThrowSameError = error === rangeError;
                }

                var asyncRangeError = new RangeError('async-range');
                try {
                    await assert.doesNotReject(async function() { throw asyncRangeError; }, TypeError);
                } catch (error) {
                    doesNotRejectSameError = error === asyncRangeError;
                }

                var unwantedException;
                try {
                    assert.doesNotThrow(function() { throw new TypeError('boom'); }, TypeError);
                    unwantedException = 'missing';
                } catch (error) {
                    unwantedException = error.code + ':' + error.operator + ':' + error.actual.name;
                }

                return JSON.stringify({
                    doesNotThrowSameError: doesNotThrowSameError,
                    doesNotRejectSameError: doesNotRejectSameError,
                    unwantedException: unwantedException
                });
            })()
        """)
        #expect(result.stringValue == #"{"doesNotThrowSameError":true,"doesNotRejectSameError":true,"unwantedException":"ERR_ASSERTION:doesNotThrow:TypeError"}"#)
    }

    @Test("assert AssertionError uses Node-like operator metadata")
    func assertAssertionErrorShape() async throws {
        let result = try await evaluate("""
            (function() {
                var assert = require('node:assert');
                var strictEqual;
                try {
                    assert.strictEqual(1, 2);
                } catch (error) {
                    strictEqual = {
                        code: error.code,
                        operator: error.operator,
                        generatedMessage: error.generatedMessage,
                        firstLine: error.message.split('\\n')[0]
                    };
                }

                var notStrictEqual;
                try {
                    assert.notStrictEqual(1, 1);
                } catch (error) {
                    notStrictEqual = {
                        operator: error.operator,
                        generatedMessage: error.generatedMessage,
                        firstLine: error.message.split('\\n')[0]
                    };
                }

                return JSON.stringify({
                    strictEqual: strictEqual,
                    notStrictEqual: notStrictEqual
                });
            })()
        """)
        #expect(result.stringValue == #"{"strictEqual":{"code":"ERR_ASSERTION","operator":"strictEqual","generatedMessage":true,"firstLine":"Expected values to be strictly equal:"},"notStrictEqual":{"operator":"notStrictEqual","generatedMessage":true,"firstLine":"Expected \"actual\" to be strictly unequal to: 1"}}"#)
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

    @Test("readline promises question and prompt helpers work")
    func readlinePromisesAndPrompt() async throws {
        let stdoutCollector = NodeCompatLogCollector()
        let outputTaskResult = try await withLoadedProcess { process in
            let outputTask = Task { [stdoutCollector] in
                for await line in process.stdout {
                    stdoutCollector.append(line)
                }
            }

            let promise = Task {
                try await process.evaluateAsync(js: """
                    (async function() {
                        var readline = require('node:readline');
                        var rlp = readline.promises;
                        var writes = [];
                        var output = {
                            write: function(text) {
                                writes.push(String(text));
                                process.stdout.write(String(text));
                                return true;
                            },
                            clearLine: function(dir, cb) { writes.push('clear:' + dir); if (cb) cb(null); return true; },
                            clearScreenDown: function(cb) { writes.push('clearScreen'); if (cb) cb(null); return true; },
                            cursorTo: function(x, y, cb) { writes.push('cursor:' + x + ':' + y); if (cb) cb(null); return true; },
                            moveCursor: function(dx, dy, cb) { writes.push('move:' + dx + ':' + dy); if (cb) cb(null); return true; }
                        };
                        var rl = rlp.createInterface({ input: process.stdin, output: output, prompt: 'prompt> ' });
                        rl.setPrompt('next> ').prompt();
                        var answer = await rl.question('ask> ');
                        readline.clearLine(output, 0);
                        readline.clearScreenDown(output);
                        readline.cursorTo(output, 3, 1);
                        readline.moveCursor(output, -1, 2);
                        rl.close();
                        return JSON.stringify({
                            answer: answer,
                            writes: writes,
                            promisesInterface: typeof rlp.Interface,
                            paused: typeof rl.pause,
                            resumed: typeof rl.resume
                        });
                    })()
                """)
            }

            try await Task.sleep(nanoseconds: 50_000_000)
            process.sendInput("promise answer\n".data(using: .utf8)!)
            let evaluation = try await promise.value
            try await Task.sleep(nanoseconds: 50_000_000)
            return (evaluation.stringValue, outputTask)
        }
        _ = await outputTaskResult.1.result
        let result = (outputTaskResult.0, stdoutCollector.values)

        let data = try #require(result.0.data(using: .utf8))
        let payload = try #require(JSONSerialization.jsonObject(with: data) as? [String: Any])
        #expect(payload["answer"] as? String == "promise answer")
        #expect(payload["promisesInterface"] as? String == "function")
        #expect(payload["paused"] as? String == "function")
        #expect(payload["resumed"] as? String == "function")
        let writes = try #require(payload["writes"] as? [String])
        #expect(writes.contains("next> "))
        #expect(writes.contains("ask> "))
        #expect(writes.contains("clear:0"))
        #expect(writes.contains("clearScreen"))
        #expect(writes.contains("cursor:3:1"))
        #expect(writes.contains("move:-1:2"))
        #expect(result.1.contains("next> "))
        #expect(result.1.contains("ask> "))
    }

    @Test("tty exposes non-TTY stream shape")
    func ttyModule() async throws {
        let result = try await evaluate("""
            (function() {
                var tty = require('node:tty');
                var out = new tty.WriteStream(1);
                var input = new tty.ReadStream(0);
                var rawResult = input.setRawMode(true);
                var size = out.getWindowSize();
                return JSON.stringify({
                    isTTY: tty.isatty(1),
                    outTTY: out.isTTY,
                    inTTY: input.isTTY,
                    colorDepth: out.getColorDepth(),
                    hasColors: out.hasColors(),
                    columns: out.columns,
                    rows: out.rows,
                    windowSize: Array.isArray(size) && size.length === 2,
                    rawMode: input.isRaw,
                    rawReturn: rawResult === input,
                    readSetRawMode: typeof input.setRawMode,
                    writeRefreshSize: typeof out._refreshSize
                });
            })()
        """)
        #expect(result.stringValue == #"{"isTTY":false,"outTTY":false,"inTTY":false,"colorDepth":1,"hasColors":false,"columns":80,"rows":24,"windowSize":true,"rawMode":false,"rawReturn":true,"readSetRawMode":"function","writeRefreshSize":"function"}"#)
    }

    @Test("process stdio exposes tty-compatible helpers")
    func processTTYShape() async throws {
        let result = try await evaluate("""
            (function() {
                return JSON.stringify({
                    stdoutTTY: process.stdout.isTTY,
                    stderrTTY: process.stderr.isTTY,
                    stdinTTY: process.stdin.isTTY,
                    stdoutColorDepth: typeof process.stdout.getColorDepth,
                    stdoutHasColors: typeof process.stdout.hasColors,
                    stdoutGetWindowSize: typeof process.stdout.getWindowSize,
                    stdinSetRawMode: typeof process.stdin.setRawMode,
                    stdinIsRaw: process.stdin.isRaw
                });
            })()
        """)
        #expect(result.stringValue == #"{"stdoutTTY":false,"stderrTTY":false,"stdinTTY":false,"stdoutColorDepth":"function","stdoutHasColors":"function","stdoutGetWindowSize":"function","stdinSetRawMode":"function","stdinIsRaw":false}"#)
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

    @Test("dns.lookup callback is async and respects family option")
    func dnsLookupAsyncFamily() async throws {
        let result = try await evaluateAsync("""
            (async function() {
                var dns = require('node:dns');
                var order = ['before'];
                var callbackResult = await new Promise(function(resolve, reject) {
                    dns.lookup('localhost', { family: 4 }, function(error, address, family) {
                        order.push('callback');
                        if (error) reject(error);
                        else resolve({ address: address, family: family });
                    });
                    order.push('after');
                });
                return JSON.stringify({
                    order: order,
                    family: callbackResult.family,
                    address: callbackResult.address
                });
            })()
        """)
        #expect(result.stringValue.contains(#""order":["before","after","callback"]"#))
        #expect(result.stringValue.contains(#""family":4"#))
    }

    @Test("dns.lookup all:true returns all localhost addresses")
    func dnsLookupAllAddresses() async throws {
        let result = try await evaluateAsync("""
            (async function() {
                var dns = require('node:dns');
                var callbackResult = await new Promise(function(resolve, reject) {
                    dns.lookup('localhost', { all: true }, function(error, addresses) {
                        if (error) reject(error);
                        else resolve(addresses);
                    });
                });
                var promiseResult = await dns.promises.lookup('localhost', { all: true });
                return JSON.stringify({
                    callbackCount: callbackResult.length,
                    promiseCount: promiseResult.length,
                    callbackFamilies: callbackResult.map(function(entry) { return entry.family; }).sort(),
                    promiseFamilies: promiseResult.map(function(entry) { return entry.family; }).sort()
                });
            })()
        """)
        #expect(result.stringValue.contains(#""callbackCount":2"#))
        #expect(result.stringValue.contains(#""promiseCount":2"#))
        #expect(result.stringValue.contains(#""callbackFamilies":[4,6]"#))
        #expect(result.stringValue.contains(#""promiseFamilies":[4,6]"#))
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

    @Test("zlib inflate roundtrip works")
    func zlibInflateSync() async throws {
        let result = try await evaluate("""
            (function() {
                var zlib = require('node:zlib');
                return zlib.inflateSync(zlib.deflateSync('hello world')).toString();
            })()
        """)
        #expect(result.stringValue == "hello world")
    }

    @Test("zlib gzip, gunzip, and unzip sync APIs roundtrip")
    func zlibGzipGunzipSync() async throws {
        let result = try await evaluate("""
            (function() {
                var zlib = require('node:zlib');
                var gzip = zlib.gzipSync('hello gzip');
                return JSON.stringify({
                    gunzip: zlib.gunzipSync(gzip).toString(),
                    unzip: zlib.unzipSync(gzip).toString()
                });
            })()
        """)
        #expect(result.stringValue == #"{"gunzip":"hello gzip","unzip":"hello gzip"}"#)
    }

    @Test("zlib callback and transform APIs produce expected output")
    func zlibCallbackAndTransformAPIs() async throws {
        let result = try await evaluateAsync("""
            (async function() {
                var zlib = require('node:zlib');
                var consumers = require('node:stream/consumers');

                var callbackResult = await new Promise(function(resolve, reject) {
                    zlib.gzip('callback path', function(error, compressed) {
                        if (error) {
                            reject(error);
                            return;
                        }
                        zlib.gunzip(compressed, function(secondError, uncompressed) {
                            if (secondError) {
                                reject(secondError);
                                return;
                            }
                            resolve(uncompressed.toString());
                        });
                    });
                });

                var encoder = zlib.createGzip();
                var decoder = zlib.createGunzip();
                encoder.pipe(decoder);
                encoder.end('stream path');
                var streamed = await consumers.text(decoder);

                return JSON.stringify({
                    callbackResult: callbackResult,
                    streamed: streamed
                });
            })()
        """)
        #expect(result.stringValue == #"{"callbackResult":"callback path","streamed":"stream path"}"#)
    }

    @Test("zlib callback API does not block timers while compressing")
    func zlibAsyncCallbackDoesNotBlockTimers() async throws {
        let result = try await evaluateAsync("""
            (async function() {
                var zlib = require('node:zlib');
                var timers = require('node:timers/promises');
                var input = Buffer.allocUnsafe(16 * 1024 * 1024);
                for (var index = 0; index < input.length; index += 1) {
                    input[index] = (index * 31) & 255;
                }

                var gzipDone = new Promise(function(resolve, reject) {
                    zlib.gzip(input, function(error) {
                        if (error) {
                            reject(error);
                            return;
                        }
                        resolve('gzip');
                    });
                });

                return await Promise.race([
                    gzipDone,
                    timers.setTimeout(0, 'timer')
                ]);
            })()
        """)
        #expect(result.stringValue == "timer")
    }

    @Test("zlib rejects truncated gzip payloads")
    func zlibRejectsTruncatedPayloads() async throws {
        let result = try await evaluate("""
            (function() {
                var zlib = require('node:zlib');
                var compressed = zlib.gzipSync('hello gzip');
                try {
                    zlib.gunzipSync(compressed.slice(0, compressed.length - 2));
                    return 'missing';
                } catch (error) {
                    return typeof error.message === 'string' && error.message.length > 0;
                }
            })()
        """)
        #expect(result.boolValue == true)
    }

    @Test("zlib promises and constructor aliases roundtrip")
    func zlibPromisesAndConstructors() async throws {
        let result = try await evaluateAsync("""
            (async function() {
                var zlib = require('node:zlib');
                var consumers = require('node:stream/consumers');

                var compressed = await zlib.promises.gzip('promise path', { level: 9 });
                var promiseValue = (await zlib.promises.unzip(compressed)).toString();

                var encoder = new zlib.Gzip({ level: 6 });
                var decoder = new zlib.Unzip();
                encoder.pipe(decoder);
                encoder.end('constructor path');
                var streamed = await consumers.text(decoder);

                return JSON.stringify({
                    promiseValue: promiseValue,
                    streamed: streamed,
                    hasTreeConstant: zlib.constants.Z_TREES === 6
                });
            })()
        """)
        #expect(result.stringValue == #"{"promiseValue":"promise path","streamed":"constructor path","hasTreeConstant":true}"#)
    }

    @Test("zlib promises and callbacks surface decompression errors")
    func zlibPromiseAndCallbackErrors() async throws {
        let result = try await evaluateAsync("""
            (async function() {
                var zlib = require('node:zlib');
                var bad = Buffer.from('not-a-valid-gzip');

                var promiseMessage;
                try {
                    await zlib.promises.gunzip(bad);
                    promiseMessage = 'missing';
                } catch (error) {
                    promiseMessage = typeof error.message === 'string' && error.message.length > 0;
                }

                var callbackMessage = await new Promise(function(resolve) {
                    zlib.gunzip(bad, function(error) {
                        resolve(typeof (error && error.message) === 'string' && error.message.length > 0);
                    });
                });

                return JSON.stringify({
                    promiseMessage: promiseMessage,
                    callbackMessage: callbackMessage
                });
            })()
        """)
        #expect(result.stringValue == #"{"promiseMessage":true,"callbackMessage":true}"#)
    }

    @Test("zlib raw deflate and inflate roundtrip through promises")
    func zlibRawPromiseRoundtrip() async throws {
        let result = try await evaluateAsync("""
            (async function() {
                var zlib = require('node:zlib');
                var compressed = await zlib.promises.deflateRaw(Buffer.from([1, 2, 3, 4, 5]));
                var uncompressed = await zlib.promises.inflateRaw(compressed);
                return JSON.stringify(Array.from(uncompressed));
            })()
        """)
        #expect(result.stringValue == "[1,2,3,4,5]")
    }

    @Test("zlib brotli sync, callback, promise, and transform APIs roundtrip")
    func zlibBrotliAPIs() async throws {
        let result = try await evaluateAsync("""
            (async function() {
                var zlib = require('node:zlib');
                var consumers = require('node:stream/consumers');

                var syncValue = zlib.brotliDecompressSync(zlib.brotliCompressSync('brotli sync')).toString();

                var callbackValue = await new Promise(function(resolve, reject) {
                    zlib.brotliCompress('brotli callback', function(error, compressed) {
                        if (error) {
                            reject(error);
                            return;
                        }
                        zlib.brotliDecompress(compressed, function(secondError, uncompressed) {
                            if (secondError) {
                                reject(secondError);
                                return;
                            }
                            resolve(uncompressed.toString());
                        });
                    });
                });

                var promiseCompressed = await zlib.promises.brotliCompress('brotli promise');
                var promiseValue = (await zlib.promises.brotliDecompress(promiseCompressed)).toString();

                var encoder = new zlib.BrotliCompress();
                var decoder = new zlib.BrotliDecompress();
                encoder.pipe(decoder);
                encoder.end('brotli stream');
                var streamed = await consumers.text(decoder);

                return JSON.stringify({
                    syncValue: syncValue,
                    callbackValue: callbackValue,
                    promiseValue: promiseValue,
                    streamed: streamed,
                    hasFinishConstant: zlib.constants.BROTLI_OPERATION_FINISH === 2
                });
            })()
        """)
        #expect(result.stringValue == #"{"syncValue":"brotli sync","callbackValue":"brotli callback","promiseValue":"brotli promise","streamed":"brotli stream","hasFinishConstant":true}"#)
    }

    @Test("zlib brotli decompression surfaces invalid payload errors")
    func zlibBrotliErrors() async throws {
        let result = try await evaluateAsync("""
            (async function() {
                var zlib = require('node:zlib');
                var bad = Buffer.from('not-a-valid-brotli');

                var promiseMessage;
                try {
                    await zlib.promises.brotliDecompress(bad);
                    promiseMessage = 'missing';
                } catch (error) {
                    promiseMessage = typeof error.message === 'string' && error.message.length > 0;
                }

                var callbackMessage = await new Promise(function(resolve) {
                    zlib.brotliDecompress(bad, function(error) {
                        resolve(typeof (error && error.message) === 'string' && error.message.length > 0);
                    });
                });

                return JSON.stringify({
                    promiseMessage: promiseMessage,
                    callbackMessage: callbackMessage
                });
            })()
        """)
        #expect(result.stringValue == #"{"promiseMessage":true,"callbackMessage":true}"#)
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

    @Test("net.BlockList matches IPv4 and IPv6 addresses")
    func netBlockListMatchesIPv4AndIPv6() async throws {
        let result = try await evaluate("""
            (function() {
                var net = require('node:net');
                var blockList = new net.BlockList();
                blockList.addAddress('10.0.0.1', 'ipv4');
                blockList.addSubnet('192.168.0.0', 16, 'ipv4');
                blockList.addAddress('::1', 'ipv6');
                blockList.addSubnet('2001:db8::', 32, 'ipv6');
                return JSON.stringify({
                    direct4: blockList.check('10.0.0.1', 'ipv4'),
                    subnet4: blockList.check('192.168.99.7', 'ipv4'),
                    miss4: blockList.check('172.16.0.1', 'ipv4'),
                    direct6: blockList.check('::1', 'ipv6'),
                    subnet6: blockList.check('2001:db8::42', 'ipv6'),
                    miss6: blockList.check('2001:dead::1', 'ipv6')
                });
            })()
        """)
        #expect(result.stringValue.contains(#""direct4":true"#))
        #expect(result.stringValue.contains(#""subnet4":true"#))
        #expect(result.stringValue.contains(#""miss4":false"#))
        #expect(result.stringValue.contains(#""direct6":true"#))
        #expect(result.stringValue.contains(#""subnet6":true"#))
        #expect(result.stringValue.contains(#""miss6":false"#))
    }

    @Test("net.connect supports port host overload")
    func netConnectSupportsPortHostOverload() async throws {
        let result = try await evaluateAsync("""
            (async function() {
                var net = require('node:net');
                return await new Promise(function(resolve, reject) {
                    var server = net.createServer(function(socket) {
                        socket.end('ok');
                    });
                    server.on('error', reject);
                    server.listen(0, '127.0.0.1', function() {
                        var address = server.address();
                        var client = net.connect(address.port, '127.0.0.1', function() {});
                        var seen = '';
                        client.setEncoding('utf8');
                        client.on('data', function(chunk) {
                            seen += chunk;
                        });
                        client.on('end', function() {
                            server.close(function() {
                                resolve(seen);
                            });
                        });
                        client.on('error', reject);
                    });
                });
            })()
        """)
        #expect(result.stringValue == "ok")
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
                            res.end(JSON.stringify({
                                method: req.method,
                                url: req.url,
                                body: body,
                                remoteAddress: req.socket.remoteAddress,
                                remotePort: req.socket.remotePort,
                                localAddress: req.socket.localAddress,
                                localPort: req.socket.localPort
                            }));
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
        let data = try #require(result.stringValue.data(using: .utf8))
        let payload = try #require(JSONSerialization.jsonObject(with: data) as? [String: Any])
        #expect(payload["status"] as? Int == 201)
        let responsePayload = try #require((payload["payload"] as? String)?.data(using: .utf8))
        let response = try #require(JSONSerialization.jsonObject(with: responsePayload) as? [String: Any])
        #expect(response["body"] as? String == "hello")
        #expect(response["remoteAddress"] as? String == "127.0.0.1")
        #expect((response["remotePort"] as? Int ?? 0) > 0)
        #expect((response["localPort"] as? Int ?? 0) > 0)
        #expect(response["remotePort"] as? Int != response["localPort"] as? Int)
    }

    @Test("child_process.execFile reports unsupported command")
    func childProcessExecFileUnsupported() async throws {
        let result = try await evaluateAsync("""
            (async function() {
                var cp = require('node:child_process');
                return await new Promise(function(resolve) {
                    cp.execFile('/usr/bin/printf', ['hello'], function(err, stdout, stderr) {
                        resolve(JSON.stringify({
                            hasError: !!err,
                            message: err && err.message,
                            stdout: stdout,
                            stderr: stderr
                        }));
                    });
                });
            })()
        """)
        #expect(result.stringValue.contains(#""hasError":true"#))
        #expect(result.stringValue.contains("not supported"))
    }

    @Test("child_process.spawn bridges rg --files without subprocesses")
    func childProcessBuiltinRipgrep() async throws {
        let tempDirectory = URL(fileURLWithPath: NSTemporaryDirectory()).appendingPathComponent("swift-bun-rg-\(UUID().uuidString)")
        let nestedDirectory = tempDirectory.appendingPathComponent(".hidden")
        let topLevelFile = tempDirectory.appendingPathComponent("visible.txt")
        let nestedFile = nestedDirectory.appendingPathComponent("nested.txt")
        try FileManager.default.createDirectory(at: nestedDirectory, withIntermediateDirectories: true)
        try Data("visible".utf8).write(to: topLevelFile)
        try Data("nested".utf8).write(to: nestedFile)
        defer {
            try? FileManager.default.removeItem(at: tempDirectory)
        }

        let result = try await evaluateAsync("""
            (async function() {
                var cp = require('node:child_process');
                var child = cp.spawn('rg', ['--files', '--hidden', '\(tempDirectory.path)']);
                var stdout = '';
                var events = [];
                child.stdout.on('data', function(chunk) { stdout += chunk.toString(); });
                child.on('exit', function() { events.push('exit'); });
                return await new Promise(function(resolve) {
                    child.on('close', function(code) {
                        events.push('close');
                        resolve(JSON.stringify({
                            code: code,
                            stdout: stdout.trim().split('\\n').sort(),
                            events: events,
                            instance: child instanceof cp.ChildProcess
                        }));
                    });
                });
            })()
        """)

        let data = try #require(result.stringValue.data(using: .utf8))
        let payload = try #require(JSONSerialization.jsonObject(with: data) as? [String: Any])
        #expect(payload["code"] as? Int == 0)
        #expect(payload["instance"] as? Bool == true)
        #expect((payload["events"] as? [String]) == ["exit", "close"])
        let stdout = try #require(payload["stdout"] as? [String])
        let normalizedStdout = Set(stdout.map { URL(fileURLWithPath: $0).standardizedFileURL.path })
        #expect(normalizedStdout.contains(topLevelFile.standardizedFileURL.path))
        #expect(normalizedStdout.contains(nestedFile.standardizedFileURL.path))
    }

    @Test("child_process builtin from timer callback does not stall the runtime")
    func childProcessBuiltinRipgrepInsideTimer() async throws {
        let tempDirectory = URL(fileURLWithPath: NSTemporaryDirectory()).appendingPathComponent("swift-bun-rg-timer-\(UUID().uuidString)")
        let file = tempDirectory.appendingPathComponent("visible.txt")
        try FileManager.default.createDirectory(at: tempDirectory, withIntermediateDirectories: true)
        try Data("visible".utf8).write(to: file)
        defer {
            try? FileManager.default.removeItem(at: tempDirectory)
        }

        let result = try await evaluateAsync("""
            (async function() {
                var cp = require('node:child_process');
                return await new Promise(function(resolve, reject) {
                    setTimeout(function() {
                        var child = cp.spawn('rg', ['--files', '\(tempDirectory.path)']);
                        var stdout = '';
                        child.stdout.on('data', function(chunk) { stdout += chunk.toString(); });
                        child.on('error', reject);
                        child.on('close', function(code) {
                            resolve(JSON.stringify({
                                code: code,
                                files: stdout.trim().split('\\n').filter(Boolean)
                            }));
                        });
                    }, 0);
                });
            })()
        """)

        let data = try #require(result.stringValue.data(using: .utf8))
        let payload = try #require(JSONSerialization.jsonObject(with: data) as? [String: Any])
        #expect(payload["code"] as? Int == 0)
        let files = try #require(payload["files"] as? [String])
        let normalizedFiles = Set(files.map { URL(fileURLWithPath: $0).standardizedFileURL.path })
        #expect(normalizedFiles.contains(file.standardizedFileURL.path))
    }

    @Test("child_process spawn reports builtin errors without stream exceptions")
    func childProcessSpawnBuiltinError() async throws {
        let result = try await evaluateAsync("""
            (async function() {
                var cp = require('node:child_process');
                var child = cp.spawn('rg', ['needle']);
                return await new Promise(function(resolve) {
                    var payload = {
                        errorMessage: null,
                        closeCode: 'unset',
                        closeSignal: 'unset'
                    };
                    child.on('error', function(err) {
                        payload.errorMessage = err && err.message || null;
                    });
                    child.on('close', function(code, signal) {
                        payload.closeCode = code;
                        payload.closeSignal = signal;
                        resolve(JSON.stringify(payload));
                    });
                });
            })()
        """)

        let data = try #require(result.stringValue.data(using: .utf8))
        let payload = try #require(JSONSerialization.jsonObject(with: data) as? [String: Any])
        #expect((payload["errorMessage"] as? String)?.isEmpty == false)
        #expect(payload["closeCode"] != nil)
    }
}
