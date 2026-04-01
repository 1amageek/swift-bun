import Foundation
import Testing
@testable import BunRuntime

@Suite("CommonJS Package Loading", .serialized)
struct PackageLoadingTests {
    private func evaluate(_ js: String, cwd: String) async throws -> JSResult {
        try await TestProcessSupport.evaluate(js, process: BunProcess(cwd: cwd))
    }

    private func normalizeResolvedPath(_ value: String) -> String {
        value.hasPrefix("/private/var/") ? String(value.dropFirst("/private".count)) : value
    }

    @Test("require('semver') resolves installed package main")
    func requireSemverMain() async throws {
        let projectURL = try PackageFixtureSupport.makeProject(packages: ["semver"])
        defer { PackageFixtureSupport.removeProject(projectURL) }

        let result = try await evaluate("require('semver').valid('1.2.3')", cwd: projectURL.path)
        #expect(result.stringValue == "1.2.3")
    }

    @Test("package subpath require works")
    func requirePackageSubpath() async throws {
        let projectURL = try PackageFixtureSupport.makeProject(packages: ["semver"])
        defer { PackageFixtureSupport.removeProject(projectURL) }

        let result = try await evaluate("require('semver/functions/valid')('1.2.3')", cwd: projectURL.path)
        #expect(result.stringValue == "1.2.3")
    }

    @Test("require.resolve returns resolved filename")
    func requireResolveInstalledPackage() async throws {
        let projectURL = try PackageFixtureSupport.makeProject(packages: ["semver"])
        defer { PackageFixtureSupport.removeProject(projectURL) }

        let expected = projectURL
            .appendingPathComponent("node_modules", isDirectory: true)
            .appendingPathComponent("semver", isDirectory: true)
            .appendingPathComponent("index.js")

        let result = try await evaluate("require.resolve('semver')", cwd: projectURL.path)
        #expect(normalizeResolvedPath(result.stringValue) == normalizeResolvedPath(expected.path))
    }

    @Test("require cache returns same module instance")
    func requireCacheUsesResolvedFilename() async throws {
        let projectURL = try PackageFixtureSupport.makeProject(packages: ["semver"])
        defer { PackageFixtureSupport.removeProject(projectURL) }

        let result = try await evaluate("""
            (function() {
                var first = require('semver');
                var second = require('semver');
                return first === second;
            })()
        """, cwd: projectURL.path)
        #expect(result.boolValue == true)
    }

    @Test("package.json main and internal relative require work")
    func packageMainAndInternalRelativeRequire() async throws {
        let projectURL = try PackageFixtureSupport.makeProject(packages: ["main-package"])
        defer { PackageFixtureSupport.removeProject(projectURL) }

        let result = try await evaluate("JSON.stringify(require('main-package'))", cwd: projectURL.path)
        #expect(result.stringValue == #"{"answer":42}"#)
    }

    @Test("index.js fallback works")
    func indexFallback() async throws {
        let projectURL = try PackageFixtureSupport.makeProject(packages: ["index-package"])
        defer { PackageFixtureSupport.removeProject(projectURL) }

        let result = try await evaluate("require('index-package').value", cwd: projectURL.path)
        #expect(result.stringValue == "index-fallback")
    }

    @Test("json package main works")
    func jsonMain() async throws {
        let projectURL = try PackageFixtureSupport.makeProject(packages: ["json-package"])
        defer { PackageFixtureSupport.removeProject(projectURL) }

        let result = try await evaluate("JSON.stringify(require('json-package'))", cwd: projectURL.path)
        #expect(result.stringValue == #"{"answer":42,"kind":"json"}"#)
    }

    @Test("package.json main dot falls back to index.js")
    func dotMainFallsBackToIndex() async throws {
        let projectURL = try PackageFixtureSupport.makeProject(packages: ["dot-main"])
        defer { PackageFixtureSupport.removeProject(projectURL) }

        let result = try await evaluate("require('dot-main').value", cwd: projectURL.path)
        #expect(result.stringValue == "dot-main-index")
    }

    @Test("unknown bare specifier throws MODULE_NOT_FOUND style error")
    func unknownBareSpecifier() async throws {
        let projectURL = try PackageFixtureSupport.makeProject(packages: [])
        defer { PackageFixtureSupport.removeProject(projectURL) }

        do {
            _ = try await evaluate("require('unknown-package')", cwd: projectURL.path)
            Issue.record("expected missing package error")
        } catch let error as BunRuntimeError {
            guard case .javaScriptException(let message) = error else {
                Issue.record("unexpected error: \(error)")
                return
            }
            #expect(message.contains("Cannot find module 'unknown-package'"))
        }
    }

    @Test("broken package main throws MODULE_NOT_FOUND style error")
    func brokenPackageMain() async throws {
        let projectURL = try PackageFixtureSupport.makeProject(packages: ["broken-main"])
        defer { PackageFixtureSupport.removeProject(projectURL) }

        do {
            _ = try await evaluate("require('broken-main')", cwd: projectURL.path)
            Issue.record("expected broken main error")
        } catch let error as BunRuntimeError {
            guard case .javaScriptException(let message) = error else {
                Issue.record("unexpected error: \(error)")
                return
            }
            #expect(message.contains("Cannot find module 'broken-main'"))
        }
    }

    @Test("syntax error mentions package source path")
    func syntaxErrorIncludesSourcePath() async throws {
        let projectURL = try PackageFixtureSupport.makeProject(packages: ["syntax-error-package"])
        defer { PackageFixtureSupport.removeProject(projectURL) }

        do {
            _ = try await evaluate("require('syntax-error-package')", cwd: projectURL.path)
            Issue.record("expected syntax error")
        } catch let error as BunRuntimeError {
            guard case .javaScriptException(let message) = error else {
                Issue.record("unexpected error: \(error)")
                return
            }
            #expect(message.contains("syntax-error-package/index.js"))
        }
    }

    @Test("circular dependency returns partially initialized exports")
    func circularDependencyReturnsPartialExports() async throws {
        let projectURL = try PackageFixtureSupport.makeProject(packages: ["cycle-package"])
        defer { PackageFixtureSupport.removeProject(projectURL) }

        let result = try await evaluate("JSON.stringify(require('cycle-package'))", cwd: projectURL.path)
        #expect(result.stringValue == #"{"name":"index","otherName":"other","otherSawName":"index"}"#)
    }

    @Test("built-in modules are not shadowed by installed package")
    func builtinsWinOverInstalledPackages() async throws {
        let projectURL = try PackageFixtureSupport.makeProject(packages: ["path"])
        defer { PackageFixtureSupport.removeProject(projectURL) }

        let result = try await evaluate("require('path').join('a', 'b')", cwd: projectURL.path)
        #expect(result.stringValue == "a/b")
    }

    @Test("module.createRequire accepts file URL input")
    func createRequireWithFileURL() async throws {
        let projectURL = try PackageFixtureSupport.makeProject(packages: ["semver"])
        defer { PackageFixtureSupport.removeProject(projectURL) }

        let result = try await evaluate("""
            (function() {
                var mod = require('node:module');
                var req = mod.createRequire(new URL('file://' + process.cwd() + '/entry.js'));
                return req('semver').valid('1.2.3');
            })()
        """, cwd: projectURL.path)
        #expect(result.stringValue == "1.2.3")
    }

    @Test("process mode resolves packages relative to entry script")
    func processModeResolvesInstalledPackagesFromEntryScript() async throws {
        let alternateCWD = FileManager.default.temporaryDirectory
            .appendingPathComponent("swift-bun-cwd-\(UUID().uuidString)", isDirectory: true)
        try FileManager.default.createDirectory(
            at: alternateCWD,
            withIntermediateDirectories: true,
            attributes: nil
        )

        let projectURL = try PackageFixtureSupport.makeProject(
            packages: ["semver"],
            files: [
                "entry.js": """
                    var semver = require('semver');
                    var path = require('node:path');
                    process.exit(
                        semver.valid('1.2.3') === '1.2.3' && path.join('a', 'b') === 'a/b'
                            ? 0
                            : 1
                    );
                    """
            ]
        )
        defer {
            PackageFixtureSupport.removeProject(projectURL)
            PackageFixtureSupport.removeProject(alternateCWD)
        }

        let entryURL = projectURL.appendingPathComponent("entry.js")
        let process = BunProcess(bundle: entryURL, cwd: alternateCWD.path)
        #expect(try await process.run() == 0)
    }

    @Test("process mode entry script gets CommonJS globals")
    func processModeEntryScriptUsesCommonJSGlobals() async throws {
        let alternateCWD = FileManager.default.temporaryDirectory
            .appendingPathComponent("swift-bun-cwd-\(UUID().uuidString)", isDirectory: true)
        try FileManager.default.createDirectory(
            at: alternateCWD,
            withIntermediateDirectories: true,
            attributes: nil
        )

        let projectURL = try PackageFixtureSupport.makeProject(
            packages: [],
            files: [
                "entry.js": """
                    var path = require('node:path');
                    process.exit(
                        require.main === module &&
                        __filename === process.argv[1] &&
                        __dirname === path.dirname(process.argv[1])
                            ? 0
                            : 1
                    );
                    """
            ]
        )
        defer {
            PackageFixtureSupport.removeProject(projectURL)
            PackageFixtureSupport.removeProject(alternateCWD)
        }

        let entryURL = projectURL.appendingPathComponent("entry.js")
        let process = BunProcess(bundle: entryURL, cwd: alternateCWD.path)
        #expect(try await process.run() == 0)
    }
}
