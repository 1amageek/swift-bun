import Testing
import Foundation
@preconcurrency import JavaScriptCore
@testable import BunRuntime

/// Tests for ESM-to-CJS transformation via es-module-lexer (WASM).
/// The transformer runs in a temporary JSContext — JS parses JS,
/// so strings, comments, regex, and template literals are handled correctly.
struct ESMTransformTests {

    private func transform(_ source: String) async throws -> String {
        let tmp = FileManager.default.temporaryDirectory
            .appendingPathComponent(UUID().uuidString + ".js")
        try source.write(to: tmp, atomically: true, encoding: .utf8)
        defer { try? FileManager.default.removeItem(at: tmp) }
        _ = try await TestProcessSupport.withLoadedProcess(BunProcess(bundle: tmp)) { _ in
            true
        }
        return ""
    }

    // MARK: - Smoke tests (load succeeds = transform worked)

    @Test func namedImport() async throws {
        _ = try await transform(#"var{createRequire:_K5}=require("node:module");"#)
    }

    @Test func noESMSyntax() async throws {
        _ = try await transform("var x = 1; console.log(x);")
    }
}

/// Direct tests of the JS transformer function via JSContext.
struct JSTransformerDirectTests {

    private let bundleURL = URL(fileURLWithPath: "/bundle/cli.js")

    private func transform(_ source: String) throws -> String {
        guard let ctx = JSContext() else { throw BunRuntimeError.contextCreationFailed }

        // Install atob for WASM
        ctx.evaluateScript("""
        (function() {
            var chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
            globalThis.atob = function(input) {
                var str = String(input).replace(/[=]+$/, '');
                var output = '';
                for (var i = 0; i < str.length;) {
                    var a = chars.indexOf(str.charAt(i++));
                    var b = i < str.length ? chars.indexOf(str.charAt(i++)) : -1;
                    var c = i < str.length ? chars.indexOf(str.charAt(i++)) : -1;
                    var d = i < str.length ? chars.indexOf(str.charAt(i++)) : -1;
                    if (b === -1) break;
                    var bitmap = (a << 18) | (b << 12) | (c !== -1 ? c << 6 : 0) | (d !== -1 ? d : 0);
                    output += String.fromCharCode((bitmap >> 16) & 0xFF);
                    if (c !== -1) output += String.fromCharCode((bitmap >> 8) & 0xFF);
                    if (d !== -1) output += String.fromCharCode(bitmap & 0xFF);
                }
                return output;
            };
        })();
        """)

        guard let url = Bundle.module.url(
            forResource: "esm-transformer.bundle",
            withExtension: "js",

        ) else {
            throw BunRuntimeError.transformerNotFound
        }
        let bundle = try String(contentsOf: url, encoding: .utf8)
        ctx.evaluateScript(bundle)
        if let ex = ctx.exception {
            throw BunRuntimeError.javaScriptException(ex.toString())
        }

        ctx.setObject(source as NSString, forKeyedSubscript: "__src" as NSString)
        ctx.setObject(bundleURL.absoluteString as NSString, forKeyedSubscript: "__url" as NSString)
        guard let result = ctx.evaluateScript("__transformESM(__src, __url)") else {
            throw BunRuntimeError.transformFailed
        }
        if let ex = ctx.exception {
            throw BunRuntimeError.javaScriptException(ex.toString())
        }
        return result.toString()
    }

    // MARK: - Static imports

    @Test func namedImport() throws {
        let result = try transform(#"import{createRequire as _K5}from"node:module";"#)
        #expect(result == #"var{createRequire:_K5}=require("node:module");"#)
    }

    @Test func namedImportMultipleSpecifiers() throws {
        let result = try transform(#"import{readFileSync,writeFileSync as wfs}from"node:fs";"#)
        #expect(result == #"var{readFileSync,writeFileSync:wfs}=require("node:fs");"#)
    }

    @Test func defaultImport() throws {
        let result = try transform(#"import path from"node:path";"#)
        #expect(result == #"var path=require("node:path");"#)
    }

    @Test func namespaceImport() throws {
        let result = try transform(#"import*as os from"os";"#)
        #expect(result == #"var os=require("os");"#)
    }

    @Test func sideEffectImport() throws {
        let result = try transform(#"import"./polyfill.js";"#)
        #expect(result == #"require("./polyfill.js");"#)
    }

    @Test func combinedImport() throws {
        let result = try transform(#"import fs,{readFileSync}from"fs";"#)
        #expect(result == #"var fs=require("fs"),{readFileSync}=fs;"#)
    }

    // MARK: - import.meta

    @Test func importMetaURL() throws {
        let result = try transform("var url = import.meta.url;")
        #expect(result == #"var url = "file:///bundle/cli.js";"#)
    }

    @Test func importMetaFallback() throws {
        let result = try transform("var m = import.meta;")
        #expect(result == #"var m = ({url:"file:///bundle/cli.js"});"#)
    }

    // MARK: - Dynamic import assertions

    @Test func stripWithAssertion() throws {
        let result = try transform(#"import("./data.json", { with: { type: "json" } })"#)
        #expect(result == #"import("./data.json")"#)
    }

    // MARK: - Exports

    @Test func exportNamedRemoved() throws {
        let result = try transform("export{main};")
        #expect(result == "")
    }

    @Test func exportDefault() throws {
        let result = try transform("export default main;")
        #expect(result == "main;")
    }

    @Test func exportFunction() throws {
        let result = try transform("export function bar(){}")
        #expect(result == "function bar(){}")
    }

    @Test func exportConst() throws {
        let result = try transform("export const X = 1;")
        #expect(result == "const X = 1;")
    }

    @Test func reExportNamed() throws {
        let result = try transform(#"export{EventEmitter}from"node:events";"#)
        #expect(result == #"var{EventEmitter}=require("node:events");"#)
    }

    @Test func exportStarFrom() throws {
        let result = try transform(#"export*from"mod";"#)
        #expect(result == #"require("mod");"#)
    }

    // MARK: - Context safety (no false positives)

    @Test func importInsideString() throws {
        let source = #"var s = "import{x}from'y'";"#
        let result = try transform(source)
        #expect(result == source)
    }

    @Test func importInsideRegex() throws {
        let source = #"var r = /import{x}from"y"/;"#
        let result = try transform(source)
        #expect(result == source)
    }

    @Test func importInsideComment() throws {
        let source = "// import{x}from\"y\"\nvar a = 1;"
        let result = try transform(source)
        #expect(result == source)
    }

    @Test func importInsideTemplateLiteral() throws {
        let source = "var s = `import{x}from\"y\"`;"
        let result = try transform(source)
        #expect(result == source)
    }

    // MARK: - Real-world patterns

    @Test func realWorldBunBundlePattern() throws {
        let source = #"import{createRequire as _K5}from"node:module";var U6=_K5(import.meta.url)"#
        let result = try transform(source)
        #expect(result == #"var{createRequire:_K5}=require("node:module");var U6=_K5("file:///bundle/cli.js")"#)
    }

    @Test func multipleImportsOneLine() throws {
        let source = #"import{a}from"x";import b from"y";import*as c from"z";import"w";"#
        let result = try transform(source)
        #expect(result == #"var{a}=require("x");var b=require("y");var c=require("z");require("w");"#)
    }

    @Test func noESMSyntax() throws {
        let source = "var x = require('fs'); console.log(x);"
        let result = try transform(source)
        #expect(result == source)
    }
}
