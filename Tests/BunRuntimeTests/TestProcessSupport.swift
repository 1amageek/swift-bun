import Foundation
@testable import BunRuntime

private actor RuntimeTestGate {
    static let shared = RuntimeTestGate()

    private var isHeld = false
    private var waiters: [CheckedContinuation<Void, Never>] = []

    func acquire() async {
        guard isHeld else {
            isHeld = true
            return
        }

        await withCheckedContinuation { continuation in
            waiters.append(continuation)
        }
    }

    func release() {
        guard let next = waiters.first else {
            isHeld = false
            return
        }

        waiters.removeFirst()
        next.resume()
    }
}

enum TestProcessSupport {
    @TaskLocal
    static var runtimeAccessDepth: Int = 0

    static func withExclusiveRuntimeAccess<T: Sendable>(
        operation: () async throws -> T
    ) async throws -> T {
        if runtimeAccessDepth > 0 {
            return try await Self.$runtimeAccessDepth.withValue(runtimeAccessDepth + 1) {
                try await operation()
            }
        }

        await RuntimeTestGate.shared.acquire()
        do {
            let result = try await Self.$runtimeAccessDepth.withValue(1) {
                try await operation()
            }
            await RuntimeTestGate.shared.release()
            return result
        } catch {
            await RuntimeTestGate.shared.release()
            throw error
        }
    }

    static func run(_ process: BunProcess) async throws -> Int32 {
        try await withExclusiveRuntimeAccess {
            try await process.run()
        }
    }

    static func withLoadedProcess<T: Sendable>(
        _ process: BunProcess = BunProcess(),
        operation: (BunProcess) async throws -> T
    ) async throws -> T {
        try await withExclusiveRuntimeAccess {
            try await process.load()

            var operationResult: Result<T, any Error>?
            do {
                operationResult = .success(try await operation(process))
            } catch {
                operationResult = .failure(error)
            }

            do {
                try await process.shutdown()
            } catch {
                if case let .failure(operationError)? = operationResult {
                    throw operationError
                }
                throw error
            }

            guard let operationResult else {
                throw BunRuntimeError.shutdownRequired
            }

            switch operationResult {
            case .success(let value):
                return value
            case .failure(let error):
                throw error
            }
        }
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
