import Testing
import Foundation
@testable import BunRuntime

// MARK: - Dynamic import assertions

struct ImportAssertionTests {

    @Test func noImportKeyword() {
        let source = "console.log('hello');"
        #expect(SourceTransformer.stripImportAssertions(source) == source)
    }

    @Test func dynamicImportWithoutAssertion() {
        let source = #"import("./module.js")"#
        #expect(SourceTransformer.stripImportAssertions(source) == source)
    }

    @Test func stripWithAssertion() {
        let source = #"import("./data.json", { with: { type: "json" } })"#
        let expected = #"import("./data.json")"#
        #expect(SourceTransformer.stripImportAssertions(source) == expected)
    }

    @Test func stripAssertAssertion() {
        let source = #"import("./data.json", { assert: { type: "json" } })"#
        let expected = #"import("./data.json")"#
        #expect(SourceTransformer.stripImportAssertions(source) == expected)
    }

    @Test func preserveSurroundingCode() {
        let source = #"var x = 1; import("./data.json", { with: { type: "json" } }); var y = 2;"#
        let expected = #"var x = 1; import("./data.json"); var y = 2;"#
        #expect(SourceTransformer.stripImportAssertions(source) == expected)
    }

    @Test func multipleImports() {
        let source = #"import("a.json", { with: { type: "json" } }); import("b.json", { assert: { type: "json" } });"#
        let expected = #"import("a.json"); import("b.json");"#
        #expect(SourceTransformer.stripImportAssertions(source) == expected)
    }

    @Test func importInsideSingleQuotedString() {
        let source = #"var s = 'import("a.json", { with: { type: "json" } })';"#
        #expect(SourceTransformer.stripImportAssertions(source) == source)
    }

    @Test func importInsideDoubleQuotedString() {
        let source = "var s = \"import('a.json', { with: { type: 'json' } })\";"
        #expect(SourceTransformer.stripImportAssertions(source) == source)
    }

    @Test func importInsideLineComment() {
        let source = "// import(\"a.json\", { with: { type: \"json\" } })\nvar x = 1;"
        #expect(SourceTransformer.stripImportAssertions(source) == source)
    }

    @Test func importInsideBlockComment() {
        let source = "/* import(\"a.json\", { with: { type: \"json\" } }) */\nvar x = 1;"
        #expect(SourceTransformer.stripImportAssertions(source) == source)
    }

    @Test func propertyImportNotTransformed() {
        let source = #"obj.import("a.json", { with: { type: "json" } })"#
        #expect(SourceTransformer.stripImportAssertions(source) == source)
    }

    @Test func identifierEndingInImportNotTransformed() {
        let source = #"reimport("a.json", { with: { type: "json" } })"#
        #expect(SourceTransformer.stripImportAssertions(source) == source)
    }

    @Test func nestedFunctionCallAsSpecifier() {
        let source = #"import(getPath("config", "json"), { with: { type: "json" } })"#
        let expected = #"import(getPath("config", "json"))"#
        #expect(SourceTransformer.stripImportAssertions(source) == expected)
    }

    @Test func variableSpecifier() {
        let source = #"import(modulePath, { with: { type: "json" } })"#
        let expected = #"import(modulePath)"#
        #expect(SourceTransformer.stripImportAssertions(source) == expected)
    }

    @Test func secondArgWithoutAssertionNotTransformed() {
        let source = #"import("a.json", { other: "value" })"#
        #expect(SourceTransformer.stripImportAssertions(source) == source)
    }

    @Test func awaitImport() {
        let source = #"const data = await import("config.json", { with: { type: "json" } });"#
        let expected = #"const data = await import("config.json");"#
        #expect(SourceTransformer.stripImportAssertions(source) == expected)
    }

    @Test func mixedTransformedAndUntouched() {
        let source = #"import("a.js"); import("b.json", { with: { type: "json" } }); import("c.js");"#
        let expected = #"import("a.js"); import("b.json"); import("c.js");"#
        #expect(SourceTransformer.stripImportAssertions(source) == expected)
    }

    @Test func emptySource() {
        #expect(SourceTransformer.stripImportAssertions("") == "")
    }

    @Test func multipleAssertionKeys() {
        let source = #"import("data.json", { with: { type: "json", integrity: "sha256-abc" } })"#
        let expected = #"import("data.json")"#
        #expect(SourceTransformer.stripImportAssertions(source) == expected)
    }

    @Test func minifiedWithNoSpaces() {
        let source = #"import("data.json",{with:{type:"json"}})"#
        let expected = #"import("data.json")"#
        #expect(SourceTransformer.stripImportAssertions(source) == expected)
    }

    @Test func singleQuotedSpecifier() {
        let source = "import('data.json', { with: { type: 'json' } })"
        let expected = "import('data.json')"
        #expect(SourceTransformer.stripImportAssertions(source) == expected)
    }
}

// MARK: - Static imports (transformForJSC)

struct StaticImportTests {

    private let bundleURL = URL(fileURLWithPath: "/bundle/cli.js")

    @Test func namedImport() {
        let source = #"import{createRequire as _K5}from"node:module";"#
        let result = SourceTransformer.transformForJSC(source, bundleURL: bundleURL)
        #expect(result == #"var{createRequire:_K5}=require("node:module")"#)
    }

    @Test func namedImportMultipleSpecifiers() {
        let source = #"import{readFileSync,writeFileSync as wfs}from"node:fs";"#
        let result = SourceTransformer.transformForJSC(source, bundleURL: bundleURL)
        #expect(result == #"var{readFileSync,writeFileSync:wfs}=require("node:fs")"#)
    }

    @Test func namedImportWithSpaces() {
        let source = #"import { resolve, join as pathJoin } from "node:path";"#
        let result = SourceTransformer.transformForJSC(source, bundleURL: bundleURL)
        #expect(result == #"var{ resolve, join:pathJoin }=require("node:path")"#)
    }

    @Test func namedImportSingleQuotes() {
        let source = "import{EventEmitter}from'node:events';"
        let result = SourceTransformer.transformForJSC(source, bundleURL: bundleURL)
        #expect(result == #"var{EventEmitter}=require("node:events")"#)
    }

    @Test func defaultImport() {
        let source = #"import path from"node:path";"#
        let result = SourceTransformer.transformForJSC(source, bundleURL: bundleURL)
        #expect(result == #"var path=require("node:path")"#)
    }

    @Test func defaultImportWithSpaces() {
        let source = #"import fs from "node:fs";"#
        let result = SourceTransformer.transformForJSC(source, bundleURL: bundleURL)
        #expect(result == #"var fs=require("node:fs")"#)
    }

    @Test func namespaceImport() {
        let source = #"import*as os from"node:os";"#
        let result = SourceTransformer.transformForJSC(source, bundleURL: bundleURL)
        #expect(result == #"var os=require("node:os")"#)
    }

    @Test func namespaceImportWithSpaces() {
        let source = #"import * as crypto from "node:crypto";"#
        let result = SourceTransformer.transformForJSC(source, bundleURL: bundleURL)
        #expect(result == #"var crypto=require("node:crypto")"#)
    }

    @Test func sideEffectImport() {
        let source = #"import"./polyfill.js";"#
        let result = SourceTransformer.transformForJSC(source, bundleURL: bundleURL)
        #expect(result == #"require("./polyfill.js")"#)
    }

    @Test func sideEffectImportWithSpaces() {
        let source = #"import "./setup.js";"#
        let result = SourceTransformer.transformForJSC(source, bundleURL: bundleURL)
        #expect(result == #"require("./setup.js")"#)
    }

    @Test func multipleStaticImports() {
        let source = #"import{a}from"x";import{b}from"y";"#
        let result = SourceTransformer.transformForJSC(source, bundleURL: bundleURL)
        #expect(result == #"var{a}=require("x")var{b}=require("y")"#)
    }

    @Test func staticImportInsideString() {
        let source = #"var s = "import{x}from'y'";"#
        let result = SourceTransformer.transformForJSC(source, bundleURL: bundleURL)
        #expect(result == source)
    }

    @Test func staticImportInsideComment() {
        let source = "// import{x}from\"y\"\nvar a = 1;"
        let result = SourceTransformer.transformForJSC(source, bundleURL: bundleURL)
        #expect(result == source)
    }

    @Test func identifierImportsNotTransformed() {
        let source = "reimport{x}from\"y\";"
        let result = SourceTransformer.transformForJSC(source, bundleURL: bundleURL)
        #expect(result == source)
    }

    @Test func noSemicolon() {
        let source = #"import{x}from"y""#
        let result = SourceTransformer.transformForJSC(source, bundleURL: bundleURL)
        #expect(result == #"var{x}=require("y")"#)
    }

    @Test func importWithoutFrom() {
        // "import x" without "from" should not be transformed
        let source = "import x\nvar y = 1;"
        let result = SourceTransformer.transformForJSC(source, bundleURL: bundleURL)
        #expect(result == source)
    }
}

// MARK: - import.meta

struct ImportMetaTests {

    private let bundleURL = URL(fileURLWithPath: "/bundle/cli.js")

    @Test func importMetaURL() {
        let source = "var url = import.meta.url;"
        let result = SourceTransformer.transformForJSC(source, bundleURL: bundleURL)
        #expect(result == #"var url = "file:///bundle/cli.js";"#)
    }

    @Test func importMetaURLInExpression() {
        let source = "var req = createRequire(import.meta.url);"
        let result = SourceTransformer.transformForJSC(source, bundleURL: bundleURL)
        #expect(result == #"var req = createRequire("file:///bundle/cli.js");"#)
    }

    @Test func importMetaFallback() {
        let source = "var m = import.meta;"
        let result = SourceTransformer.transformForJSC(source, bundleURL: bundleURL)
        #expect(result == #"var m = ({url:"file:///bundle/cli.js"});"#)
    }

    @Test func importMetaEnv() {
        let source = "var env = import.meta.env;"
        let result = SourceTransformer.transformForJSC(source, bundleURL: bundleURL)
        #expect(result == #"var env = ({url:"file:///bundle/cli.js"}).env;"#)
    }

    @Test func importMetaDataNotMatched() {
        // "import.metaData" should NOT be matched (longer property name)
        let source = "var x = import.metaData;"
        let result = SourceTransformer.transformForJSC(source, bundleURL: bundleURL)
        #expect(result == source)
    }

    @Test func importMetaURLFollowedByMoreProperty() {
        // "import.meta.urlFoo" should NOT match as import.meta.url
        let source = "var x = import.meta.urlFoo;"
        let result = SourceTransformer.transformForJSC(source, bundleURL: bundleURL)
        // import.meta should still be replaced (but not .url specifically)
        #expect(result == #"var x = ({url:"file:///bundle/cli.js"}).urlFoo;"#)
    }

    @Test func multipleImportMeta() {
        let source = "var a = import.meta.url; var b = import.meta.url;"
        let result = SourceTransformer.transformForJSC(source, bundleURL: bundleURL)
        #expect(result == #"var a = "file:///bundle/cli.js"; var b = "file:///bundle/cli.js";"#)
    }

    @Test func importMetaInsideString() {
        let source = #"var s = "import.meta.url";"#
        let result = SourceTransformer.transformForJSC(source, bundleURL: bundleURL)
        #expect(result == source)
    }

    @Test func importMetaInsideComment() {
        let source = "// import.meta.url\nvar x = 1;"
        let result = SourceTransformer.transformForJSC(source, bundleURL: bundleURL)
        #expect(result == source)
    }

    @Test func propertyImportMetaNotMatched() {
        let source = "obj.import.meta.url;"
        let result = SourceTransformer.transformForJSC(source, bundleURL: bundleURL)
        #expect(result == source)
    }

    @Test func importMetaURLWithSpecialCharsInPath() {
        let url = URL(fileURLWithPath: "/path/with spaces/cli.js")
        let source = "var u = import.meta.url;"
        let result = SourceTransformer.transformForJSC(source, bundleURL: url)
        #expect(result.contains("file:///path/with%20spaces/cli.js"))
    }
}

// MARK: - Export handling

struct ExportTests {

    private let bundleURL = URL(fileURLWithPath: "/bundle/cli.js")

    @Test func exportNamedRemoved() {
        let source = "export{main,helper};"
        let result = SourceTransformer.transformForJSC(source, bundleURL: bundleURL)
        #expect(result == "")
    }

    @Test func exportNamedWithSemicolon() {
        let source = "var x = 1; export{x}; var y = 2;"
        let result = SourceTransformer.transformForJSC(source, bundleURL: bundleURL)
        #expect(result == "var x = 1;  var y = 2;")
    }

    @Test func exportDefault() {
        let source = "export default main;"
        let result = SourceTransformer.transformForJSC(source, bundleURL: bundleURL)
        #expect(result == " main;")
    }

    @Test func exportFunction() {
        let source = "export function hello() {}"
        let result = SourceTransformer.transformForJSC(source, bundleURL: bundleURL)
        #expect(result == " function hello() {}")
    }

    @Test func exportConst() {
        let source = "export const X = 1;"
        let result = SourceTransformer.transformForJSC(source, bundleURL: bundleURL)
        #expect(result == " const X = 1;")
    }

    @Test func exportVar() {
        let source = "export var x = 1;"
        let result = SourceTransformer.transformForJSC(source, bundleURL: bundleURL)
        #expect(result == " var x = 1;")
    }

    @Test func exportLet() {
        let source = "export let x = 1;"
        let result = SourceTransformer.transformForJSC(source, bundleURL: bundleURL)
        #expect(result == " let x = 1;")
    }

    @Test func exportClass() {
        let source = "export class Foo {}"
        let result = SourceTransformer.transformForJSC(source, bundleURL: bundleURL)
        #expect(result == " class Foo {}")
    }

    @Test func exportAsync() {
        let source = "export async function run() {}"
        let result = SourceTransformer.transformForJSC(source, bundleURL: bundleURL)
        #expect(result == " async function run() {}")
    }

    @Test func identifierExportNotTransformed() {
        let source = "reexport{x};"
        let result = SourceTransformer.transformForJSC(source, bundleURL: bundleURL)
        #expect(result == source)
    }
}

// MARK: - Combined transformations

struct CombinedTransformTests {

    private let bundleURL = URL(fileURLWithPath: "/bundle/cli.js")

    @Test func realWorldBunBundlePattern() {
        let source = """
        import{createRequire as _K5}from"node:module";var U6=_K5(import.meta.url)
        """
        let result = SourceTransformer.transformForJSC(source, bundleURL: bundleURL)
        let expected = """
        var{createRequire:_K5}=require("node:module")var U6=_K5("file:///bundle/cli.js")
        """
        #expect(result == expected)
    }

    @Test func staticAndDynamicImportsMixed() {
        let source = #"import{x}from"y";import("z.json",{with:{type:"json"}})"#
        let result = SourceTransformer.transformForJSC(source, bundleURL: bundleURL)
        #expect(result == #"var{x}=require("y")import("z.json")"#)
    }

    @Test func allTransformTypes() {
        let source = [
            #"import{a}from"x";"#,
            "var u=import.meta.url;",
            #"import("d.json",{with:{type:"json"}});"#,
            "export{main};",
        ].joined()
        let result = SourceTransformer.transformForJSC(source, bundleURL: bundleURL)
        let expected = [
            #"var{a}=require("x")"#,
            #"var u="file:///bundle/cli.js";"#,
            #"import("d.json");"#,
            "",
        ].joined()
        #expect(result == expected)
    }

    @Test func emptySource() {
        let result = SourceTransformer.transformForJSC("", bundleURL: bundleURL)
        #expect(result == "")
    }

    @Test func noESMSyntax() {
        let source = "var x = require('fs'); console.log(x);"
        let result = SourceTransformer.transformForJSC(source, bundleURL: bundleURL)
        #expect(result == source)
    }

    @Test func multilineImportStatement() {
        let source = """
        import {
          createRequire as _K5,
          builtinModules
        } from "node:module";
        """
        let result = SourceTransformer.transformForJSC(source, bundleURL: bundleURL)
        #expect(result.contains("require(\"node:module\")"))
        #expect(result.contains("createRequire:_K5"))
        #expect(result.contains("builtinModules"))
        #expect(!result.contains("import"))
        #expect(!result.contains("from"))
    }

    @Test func minifiedMultipleImportsOnOneLine() {
        let source = #"import{a}from"x";import b from"y";import*as c from"z";import"w";"#
        let result = SourceTransformer.transformForJSC(source, bundleURL: bundleURL)
        #expect(result.contains(#"var{a}=require("x")"#))
        #expect(result.contains(#"var b=require("y")"#))
        #expect(result.contains(#"var c=require("z")"#))
        #expect(result.contains(#"require("w")"#))
        #expect(!result.contains("import"))
    }

    @Test func importFollowedByNonImportCode() {
        let source = #"import{x}from"y";function foo() { return x; }"#
        let result = SourceTransformer.transformForJSC(source, bundleURL: bundleURL)
        #expect(result == #"var{x}=require("y")function foo() { return x; }"#)
    }

    @Test func preservesRegularCodeBetweenImports() {
        let source = #"import{a}from"x"; var mid = 42; import{b}from"y";"#
        let result = SourceTransformer.transformForJSC(source, bundleURL: bundleURL)
        #expect(result == #"var{a}=require("x") var mid = 42; var{b}=require("y")"#)
    }

    @Test func blockCommentBetweenImports() {
        let source = #"import{a}from"x";/* comment */import{b}from"y";"#
        let result = SourceTransformer.transformForJSC(source, bundleURL: bundleURL)
        #expect(result == #"var{a}=require("x")/* comment */var{b}=require("y")"#)
    }

    @Test func importsKeywordNotConfusedWithImport() {
        // "imports" (with trailing 's') should not be treated as import keyword
        let source = "var imports = {};"
        let result = SourceTransformer.transformForJSC(source, bundleURL: bundleURL)
        #expect(result == source)
    }

    @Test func exportKeywordNotConfusedWithExport() {
        // "exports" should not be treated as export keyword
        let source = "module.exports = {};"
        let result = SourceTransformer.transformForJSC(source, bundleURL: bundleURL)
        #expect(result == source)
    }
}
