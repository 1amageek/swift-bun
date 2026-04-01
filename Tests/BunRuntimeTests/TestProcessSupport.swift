import Foundation
@testable import BunRuntime

enum TestProcessSupport {
    static func withLoadedProcess<T: Sendable>(
        _ process: BunProcess = BunProcess(),
        operation: (BunProcess) async throws -> T
    ) async throws -> T {
        try await process.load()

        var operationResult: T?
        var operationError: (any Error)?
        do {
            operationResult = try await operation(process)
        } catch {
            operationError = error
        }

        do {
            try await process.shutdown()
        } catch {
            if let operationError {
                throw operationError
            }
            throw error
        }

        if let operationResult {
            return operationResult
        }
        throw operationError ?? BunRuntimeError.shutdownRequired
    }

    static func evaluate(
        _ js: String,
        process: BunProcess = BunProcess()
    ) async throws -> JSResult {
        try await withLoadedProcess(process) { loaded in
            try await loaded.evaluate(js: js)
        }
    }

    static func evaluateAsync(
        _ js: String,
        process: BunProcess = BunProcess()
    ) async throws -> JSResult {
        try await withLoadedProcess(process) { loaded in
            try await loaded.evaluateAsync(js: js)
        }
    }
}
