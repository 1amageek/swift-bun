@preconcurrency import JavaScriptCore
import Foundation

/// Isolate-scoped bootstrap orchestration for a single JSContext.
///
/// `BunProcess` remains the public lifecycle owner, while this type keeps the
/// per-isolate setup sequence explicit and reusable for future child isolates.
struct BunProcessIsolateBootstrap {
    struct EntryPointConfiguration {
        let bundle: URL?
        let arguments: [String]
    }

    let entryPoint: EntryPointConfiguration
    let runtimeEnvironment: [String: String]
    let makeContext: () throws -> JSContext
    let installContext: (JSContext) -> Void
    let makeModuleBootstrap: ([String: String]) -> ModuleBootstrap
    let installFoundation: (JSContext, ModuleBootstrap) throws -> Void
    let installHostBridges: (JSContext, ModuleBootstrap) throws -> Void
    let configureEntryPoint: (JSContext, EntryPointConfiguration) throws -> Void
    let installRejectionReporter: (JSContext) -> Void
    let evaluateEntryPoint: (JSContext, EntryPointConfiguration) throws -> Void

    func boot() throws {
        let context = try makeContext()
        installContext(context)

        let resolver = makeModuleBootstrap(runtimeEnvironment)
        try installFoundation(context, resolver)
        try installHostBridges(context, resolver)
        try configureEntryPoint(context, entryPoint)
        installRejectionReporter(context)
        try evaluateEntryPoint(context, entryPoint)
    }
}
