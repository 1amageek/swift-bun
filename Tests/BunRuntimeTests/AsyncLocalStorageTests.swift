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
}

// MARK: - Web API Polyfills
