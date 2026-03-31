@preconcurrency import JavaScriptCore
import Foundation

/// A JavaScript execution context that wraps JSContext with Node.js/Bun compatibility layers.
public actor BunContext {

    private let jsContext: JSContext
    private let _eventContinuation: AsyncStream<String>.Continuation

    /// Stream of NDJSON event lines emitted from JavaScript via `__emitEvent`.
    public let eventStream: AsyncStream<String>

    init(jsContext: JSContext) {
        let (stream, continuation) = AsyncStream<String>.makeStream()
        self.eventStream = stream
        self._eventContinuation = continuation
        self.jsContext = jsContext

        // Register event bridge directly (cannot call actor-isolated methods from init)
        let emitBlock: @convention(block) (String) -> Void = { line in
            continuation.yield(line)
        }
        jsContext.setObject(
            emitBlock,
            forKeyedSubscript: "__emitEvent" as NSString
        )
    }

    // MARK: - Public API

    /// Evaluate raw JavaScript source and return the result as a `JSResult`.
    @discardableResult
    public func evaluate(js source: String) throws -> JSResult {
        let result = jsContext.evaluateScript(source)
        try checkException()
        return JSResult(from: result)
    }

    /// Evaluate JavaScript that returns a Promise. Waits for the Promise to resolve
    /// and returns the resolved value, or throws if the Promise rejects.
    ///
    /// Use this for any JS code that involves async operations (fetch, timers, etc.).
    @discardableResult
    public func evaluateAsync(js source: String) async throws -> JSResult {
        let jsValue = jsContext.evaluateScript(source)
        try checkException()

        guard let jsValue else {
            return .undefined
        }

        // Check if result is a Promise
        guard let promiseClass = jsContext.objectForKeyedSubscript("Promise"),
              jsValue.isInstance(of: promiseClass) else {
            return JSResult(from: jsValue)
        }

        // Bridge Promise → async/await via withCheckedThrowingContinuation
        return try await withCheckedThrowingContinuation { continuation in
            let onResolve: @convention(block) (JSValue) -> Void = { value in
                continuation.resume(returning: JSResult(from: value))
            }
            let onReject: @convention(block) (JSValue) -> Void = { error in
                let message = error.toString() ?? "Promise rejected"
                continuation.resume(throwing: BunRuntimeError.javaScriptException(message))
            }
            jsValue.invokeMethod("then", withArguments: [onResolve as Any, onReject as Any])
        }
    }

    /// Call a global JavaScript function by name and return the result as a `JSResult`.
    @discardableResult
    public func call(_ function: String, arguments: [Any] = []) throws -> JSResult {
        guard let fn = jsContext.objectForKeyedSubscript(function),
              !fn.isUndefined else {
            throw BunRuntimeError.functionNotFound(function)
        }
        let result = fn.call(withArguments: arguments)
        try checkException()
        return JSResult(from: result)
    }

    /// Shut down this context, finishing the event stream.
    public func shutdown() {
        _eventContinuation.finish()
    }

    // MARK: - Private

    private func checkException() throws {
        if let exception = jsContext.exception {
            jsContext.exception = nil
            throw BunRuntimeError.javaScriptException(exception.toString())
        }
    }
}
