import Testing
@preconcurrency import JavaScriptCore
import Foundation
@testable import BunRuntime
import TestHeartbeat

@Suite("AsyncLocalStorage Edge Cases", .serialized, .heartbeat)
struct AsyncLocalStorageTests {

    @Test("AsyncLocalStorage run and getStore")
    func runAndGetStore() async throws {
        let result = try await TestProcessSupport.evaluate("""
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
        let result = try await TestProcessSupport.evaluate("""
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

    @Test("AsyncResource.runInAsyncScope binds this and arguments")
    func asyncResourceRunInAsyncScope() async throws {
        let result = try await TestProcessSupport.evaluate("""
            var AsyncResource = require('node:async_hooks').AsyncResource;
            var resource = new AsyncResource('scope-test');
            var receiver = { prefix: 'value:' };
            resource.runInAsyncScope(function(a, b) {
                return this.prefix + (a + b);
            }, receiver, 2, 3);
        """)
        #expect(result.stringValue == "value:5")
    }

    @Test("AsyncResource.bind returns callable wrapper and emitDestroy marks resource")
    func asyncResourceBindAndDestroy() async throws {
        let result = try await TestProcessSupport.evaluate("""
            var AsyncResource = require('node:async_hooks').AsyncResource;
            var resource = new AsyncResource('bind-test');
            var bound = resource.bind(function(name) {
                return this.prefix + name;
            }, { prefix: 'hello ' });
            var value = bound('world');
            resource.emitDestroy();
            JSON.stringify({ value: value, destroyed: resource.destroyed });
        """)
        #expect(result.stringValue == #"{"value":"hello world","destroyed":true}"#)
    }
}

// MARK: - Web API Polyfills
