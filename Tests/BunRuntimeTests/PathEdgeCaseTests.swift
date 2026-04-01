import Testing
@preconcurrency import JavaScriptCore
import Foundation
@testable import BunRuntime
import TestHeartbeat

@Suite("Path Edge Cases", .serialized, .heartbeat)
struct PathEdgeCaseTests {

    @Test("path.join with .. normalization")
    func joinWithDotDot() async throws {
        let result = try await TestProcessSupport.evaluate("""
            require('node:path').join('/foo/bar', '..', 'baz')
        """)
        #expect(result.stringValue == "/foo/baz")
    }

    @Test("path.join with . normalization")
    func joinWithDot() async throws {
        let result = try await TestProcessSupport.evaluate("""
            require('node:path').join('/foo', '.', 'bar')
        """)
        #expect(result.stringValue == "/foo/bar")
    }

    @Test("path.relative between two absolute paths")
    func relative() async throws {
        let result = try await TestProcessSupport.evaluate("""
            require('node:path').relative('/data/orandea/test/aaa', '/data/orandea/impl/bbb')
        """)
        #expect(result.stringValue == "../../impl/bbb")
    }

    @Test("path.parse extracts all components")
    func parse() async throws {
        let result = try await TestProcessSupport.evaluate("""
            var p = require('node:path').parse('/home/user/dir/file.txt');
            p.root + '|' + p.base + '|' + p.ext + '|' + p.name;
        """)
        #expect(result.stringValue == "/|file.txt|.txt|file")
    }

    @Test("path.basename with extension removal")
    func basenameWithExt() async throws {
        let result = try await TestProcessSupport.evaluate("""
            require('node:path').basename('/foo/bar.html', '.html')
        """)
        #expect(result.stringValue == "bar")
    }
}
