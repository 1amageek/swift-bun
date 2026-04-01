import Testing
@preconcurrency import JavaScriptCore
import Foundation
@testable import BunRuntime
import TestHeartbeat

@Suite("Node.js Polyfill Additions", .serialized, .heartbeat)
struct NodePolyfillAdditionTests {
    private func evaluate(_ js: String) async throws -> JSResult {
        try await TestProcessSupport.evaluate(js)
    }

    @Test("util.debuglog returns callable function")
    func utilDebuglog() async throws {
        let result = try await evaluate("""
            var debuglog = require('node:util').debuglog;
            var fn = debuglog('test');
            typeof fn === 'function' && typeof fn.enabled === 'boolean';
        """)
        #expect(result.boolValue == true)
    }

    @Test("global is globalThis")
    func globalAlias() async throws {
        let result = try await evaluate("global === globalThis && self === globalThis")
        #expect(result.boolValue == true)
    }

    @Test("process.execArgv is array")
    func processExecArgv() async throws {
        let result = try await evaluate("Array.isArray(process.execArgv)")
        #expect(result.boolValue == true)
    }

    @Test("process.on returns process")
    func processOn() async throws {
        let result = try await evaluate("process.on('exit', function(){}) === process")
        #expect(result.boolValue == true)
    }

    @Test("require('events') is constructor")
    func eventsIsConstructor() async throws {
        let result = try await evaluate("""
            var EE = require('events');
            typeof EE === 'function' && typeof new EE().on === 'function';
        """)
        #expect(result.boolValue == true)
    }

    @Test("class extends require('events') works")
    func extendsEvents() async throws {
        let result = try await evaluate("""
            var EE = require('events');
            class MyEmitter extends EE { constructor() { super(); this.x = 1; } }
            var e = new MyEmitter();
            e.x === 1 && typeof e.on === 'function';
        """)
        #expect(result.boolValue == true)
    }

    @Test("fs.realpathSync resolves path")
    func fsRealpathSync() async throws {
        let result = try await evaluate("""
            var fs = require('node:fs');
            var resolved = fs.realpathSync('/tmp');
            typeof resolved === 'string' && resolved.length > 0;
        """)
        #expect(result.boolValue == true)
    }

    @Test("fs.realpathSync throws for missing path")
    func fsRealpathSyncMissing() async throws {
        let result = try await evaluate("""
            var fs = require('node:fs');
            try { fs.realpathSync('/nonexistent_path_xyz'); 'no-error'; }
            catch(e) { 'error'; }
        """)
        #expect(result.stringValue == "error")
    }

    @Test("fs.promises.realpath works")
    func fsPromisesRealpath() async throws {
        let result = try await evaluate("""
            var fsp = require('node:fs/promises');
            typeof fsp.realpath === 'function';
        """)
        #expect(result.boolValue == true)
    }

    @Test("fs.accessSync does not throw for existing path")
    func fsAccessSync() async throws {
        let result = try await evaluate("""
            var fs = require('node:fs');
            try { fs.accessSync('/tmp'); 'ok'; }
            catch(e) { 'error'; }
        """)
        #expect(result.stringValue == "ok")
    }
}
