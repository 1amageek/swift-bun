import Testing
@preconcurrency import JavaScriptCore
import Foundation
@testable import BunRuntime
import TestHeartbeat

@Suite("EventEmitter Edge Cases", .serialized, .heartbeat)
struct EventEmitterEdgeCaseTests {

    @Test("once fires only once")
    func onceFiresOnce() async throws {
        let result = try await TestProcessSupport.evaluate("""
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
        let result = try await TestProcessSupport.evaluate("""
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
        let result = try await TestProcessSupport.evaluate("""
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
        let result = try await TestProcessSupport.evaluate("""
            var ee = new (require('node:events').EventEmitter)();
            ee.emit('nonexistent');
        """)
        #expect(result.boolValue == false)
    }
}
