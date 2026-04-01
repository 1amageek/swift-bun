import Testing
@preconcurrency import JavaScriptCore
@testable import BunRuntime

@Suite("JavaScript Resource Loader")
struct JavaScriptResourceTests {
    @Test("all typed scripts resolve to non-empty sources")
    func allTypedScriptsResolve() throws {
        for script in JavaScriptResource.BootstrapScript.allCases {
            let resolved = try JavaScriptResource.source(for: .bootstrap(script))
            #expect(!resolved.source.isEmpty)
        }
        for script in JavaScriptResource.BunAPIScript.allCases {
            let resolved = try JavaScriptResource.source(for: .bunAPI(script))
            #expect(!resolved.source.isEmpty)
        }
        for script in JavaScriptResource.NodeCompatScript.allCases {
            let resolved = try JavaScriptResource.source(for: .nodeCompat(script))
            #expect(!resolved.source.isEmpty)
        }
        for script in JavaScriptResource.RuntimeScript.allCases {
            let resolved = try JavaScriptResource.source(for: .runtime(script))
            #expect(!resolved.source.isEmpty)
        }
        for script in JavaScriptResource.BundleScript.allCases {
            let resolved = try JavaScriptResource.source(for: .bundle(script))
            #expect(!resolved.source.isEmpty)
        }
    }

    @Test("missing resource throws javaScriptResourceNotFound")
    func missingResourceThrows() {
        do {
            _ = try JavaScriptResource.source(
                resourceName: "Missing",
                subdirectory: "JavaScript/Test",
                identifier: "JavaScript/Test/Missing.js"
            )
            Issue.record("expected javaScriptResourceNotFound")
        } catch let error as BunRuntimeError {
            guard case .javaScriptResourceNotFound(let identifier) = error else {
                Issue.record("unexpected error: \(error)")
                return
            }
            #expect(identifier == "JavaScript/Test/Missing.js")
        } catch {
            Issue.record("unexpected error: \(error)")
        }
    }

    @Test("unreadable resource throws javaScriptResourceReadFailed")
    func unreadableResourceThrows() {
        do {
            _ = try JavaScriptResource.source(
                resourceName: "Unreadable",
                subdirectory: "JavaScript/Test",
                identifier: "JavaScript/Test/Unreadable.js"
            )
            Issue.record("expected javaScriptResourceReadFailed")
        } catch let error as BunRuntimeError {
            guard case .javaScriptResourceReadFailed(let identifier, _) = error else {
                Issue.record("unexpected error: \(error)")
                return
            }
            #expect(identifier == "JavaScript/Test/Unreadable.js")
        } catch {
            Issue.record("unexpected error: \(error)")
        }
    }

    @Test("runtime script evaluation surfaces JS exceptions")
    func evaluationConvertsJavaScriptExceptions() throws {
        let context = try #require(JSContext())
        do {
            try JavaScriptResource.evaluate(.runtime(.processExit), in: context)
            Issue.record("expected javaScriptException")
        } catch let error as BunRuntimeError {
            guard case .javaScriptException(let message) = error else {
                Issue.record("unexpected error: \(error)")
                return
            }
            #expect(message == "ReferenceError: Can't find variable: process")
        } catch {
            Issue.record("unexpected error: \(error)")
        }
    }

    @Test("bundle source is loaded through the shared loader")
    func bundleSourceUsesSharedLoader() throws {
        let resolved = try JavaScriptResource.source(for: .bundle(.esmTransformer))
        #expect(resolved.url.lastPathComponent == "esm-transformer.bundle.js")
        #expect(resolved.source.contains("__transformESM"))
    }
}
