import Foundation

/// Errors thrown by BunRuntime operations.
public enum BunRuntimeError: Error, Sendable {
    case bundleNotFound(URL)
    case bundleReadFailed(URL, underlying: any Error)
    case javaScriptResourceNotFound(String)
    case javaScriptResourceReadFailed(String, underlying: any Error)
    case contextCreationFailed
    case javaScriptException(String)
    case functionNotFound(String)
    case transformerNotFound
    case transformFailed
    case contextNotReady
    case asyncResultRequiresAsyncAPI
    case shutdownRequired
}
