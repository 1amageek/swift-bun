@preconcurrency import JavaScriptCore
import Foundation

enum JavaScriptResource: Sendable {
    enum Script: Hashable, Sendable {
        case bootstrap(BootstrapScript)
        case bunAPI(BunAPIScript)
        case nodeCompat(NodeCompatScript)
        case runtime(RuntimeScript)
        case bundle(BundleScript)
    }

    enum BootstrapScript: String, CaseIterable, Hashable, Sendable {
        case globalAliases = "GlobalAliases"
        case performance = "Performance"
        case url = "URL"
        case console = "Console"
        case process = "Process"
        case textCodec = "TextCodec"
        case base64 = "Base64"
        case abortController = "AbortController"
        case domException = "DOMException"
        case require = "Require"
    }

    enum BunAPIScript: String, CaseIterable, Hashable, Sendable {
        case file = "BunFile"
        case shims = "BunShims"
        case spawn = "BunSpawn"
    }

    enum NodeCompatScript: String, CaseIterable, Hashable, Sendable {
        case events = "Events"
        case fs = "NodeFS"
        case http = "NodeHTTP"
        case stream = "NodeStream"
        case stringDecoder = "StringDecoder"
        case querystring = "QueryString"
        case path = "NodePath"
        case buffer = "NodeBuffer"
        case url = "NodeURL"
        case util = "NodeUtil"
        case timers = "NodeTimers"
        case crypto = "NodeCrypto"
        case os = "NodeOS"
        case net = "Net"
        case tls = "TLS"
        case zlib = "Zlib"
        case childProcess = "ChildProcess"
        case tty = "TTY"
        case readline = "Readline"
        case asyncHooks = "AsyncHooks"
        case module = "Module"
        case assert = "Assert"
        case workerThreads = "WorkerThreads"
        case perfHooks = "PerfHooks"
        case http2 = "HTTP2"
        case inspector = "Inspector"
        case v8 = "V8"
        case dns = "DNS"
        case constants = "Constants"
        case diagnosticsChannel = "DiagnosticsChannel"
    }

    enum RuntimeScript: String, CaseIterable, Hashable, Sendable {
        case startupPromiseObserver = "StartupPromiseObserver"
        case asyncBridge = "AsyncBridge"
        case timerBridge = "TimerBridge"
        case patchTimerModuleReferences = "PatchTimerModuleReferences"
        case processExit = "ProcessExit"
    }

    enum BundleScript: String, CaseIterable, Hashable, Sendable {
        case polyfills = "polyfills.bundle"
        case esmTransformer = "esm-transformer.bundle"
    }

    static func source(for script: Script) throws -> (url: URL, source: String) {
        let descriptor = descriptor(for: script)
        return try source(
            resourceName: descriptor.resourceName,
            subdirectory: descriptor.subdirectory,
            identifier: descriptor.identifier
        )
    }

    static func source(
        resourceName: String,
        subdirectory: String?,
        identifier: String
    ) throws -> (url: URL, source: String) {
        let url: URL

        if let subdirectory {
            guard let resourceURL = Bundle.module.url(
                forResource: resourceName,
                withExtension: "js",
                subdirectory: subdirectory
            ) else {
                throw BunRuntimeError.javaScriptResourceNotFound(identifier)
            }
            url = resourceURL
        } else {
            guard let resourceURL = Bundle.module.url(
                forResource: resourceName,
                withExtension: "js"
            ) else {
                throw BunRuntimeError.javaScriptResourceNotFound(identifier)
            }
            url = resourceURL
        }

        do {
            let source = try String(contentsOf: url, encoding: .utf8)
            return (url, source)
        } catch {
            throw BunRuntimeError.javaScriptResourceReadFailed(identifier, underlying: error)
        }
    }

    static func evaluate(_ script: Script, in context: JSContext) throws {
        let (url, source) = try source(for: script)
        context.evaluateScript(source, withSourceURL: url)
        if let exception = context.exception {
            context.exception = nil
            throw BunRuntimeError.javaScriptException(exception.toString())
        }
    }

    private struct Descriptor {
        let resourceName: String
        let subdirectory: String?
        let identifier: String
    }

    private static func descriptor(for script: Script) -> Descriptor {
        switch script {
        case .bootstrap(let script):
            let subdirectory = "JavaScript/Bootstrap"
            return Descriptor(
                resourceName: script.rawValue,
                subdirectory: subdirectory,
                identifier: "\(subdirectory)/\(script.rawValue).js"
            )
        case .bunAPI(let script):
            let subdirectory = "JavaScript/BunAPI"
            return Descriptor(
                resourceName: script.rawValue,
                subdirectory: subdirectory,
                identifier: "\(subdirectory)/\(script.rawValue).js"
            )
        case .nodeCompat(let script):
            let subdirectory = "JavaScript/NodeCompat"
            return Descriptor(
                resourceName: script.rawValue,
                subdirectory: subdirectory,
                identifier: "\(subdirectory)/\(script.rawValue).js"
            )
        case .runtime(let script):
            let subdirectory = "JavaScript/Runtime"
            return Descriptor(
                resourceName: script.rawValue,
                subdirectory: subdirectory,
                identifier: "\(subdirectory)/\(script.rawValue).js"
            )
        case .bundle(let script):
            return Descriptor(
                resourceName: script.rawValue,
                subdirectory: nil,
                identifier: "Resources/\(script.rawValue).js"
            )
        }
    }
}
