import Foundation
import Synchronization

/// A one-shot result container backed by sendable callbacks.
final class AsyncResultBox<Value: Sendable>: Sendable {
    private enum State: Sendable {
        case pending
        case completed
    }

    private let state = Mutex(State.pending)
    private let onSuccess: @Sendable (Value) -> Void
    private let onFailure: @Sendable (any Error) -> Void

    init(
        onSuccess: @escaping @Sendable (Value) -> Void,
        onFailure: @escaping @Sendable (any Error) -> Void
    ) {
        self.onSuccess = onSuccess
        self.onFailure = onFailure
    }

    func succeed(_ value: Value) {
        guard beginCompletion() else { return }
        onSuccess(value)
    }

    func fail(_ error: any Error) {
        guard beginCompletion() else { return }
        onFailure(error)
    }

    private func beginCompletion() -> Bool {
        state.withLock {
            guard case .pending = $0 else { return false }
            $0 = .completed
            return true
        }
    }
}
