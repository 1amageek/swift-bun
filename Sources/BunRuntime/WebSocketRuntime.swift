import Foundation

actor WebSocketRuntime {
    private enum DelegateEvent: Sendable {
        case didOpen(socketID: Int32, protocolName: String?)
        case didClose(socketID: Int32, closeCode: URLSessionWebSocketTask.CloseCode, reason: Data?)
        case didComplete(socketID: Int32, error: Error?)
    }

    private struct SocketEntry {
        let task: URLSessionWebSocketTask
        let visibleHandleToken: LifecycleController.VisibleHandleToken
        let callback: @Sendable ([String: Any]) -> Void
    }

    private final class SessionDelegate: NSObject, URLSessionWebSocketDelegate, URLSessionTaskDelegate {
        let emit: @Sendable (DelegateEvent) -> Void

        init(emit: @escaping @Sendable (DelegateEvent) -> Void) {
            self.emit = emit
        }

        func urlSession(
            _ session: URLSession,
            webSocketTask: URLSessionWebSocketTask,
            didOpenWithProtocol protocol: String?
        ) {
            guard let socketID = Self.socketID(from: webSocketTask) else { return }
            emit(.didOpen(socketID: socketID, protocolName: `protocol`))
        }

        func urlSession(
            _ session: URLSession,
            webSocketTask: URLSessionWebSocketTask,
            didCloseWith closeCode: URLSessionWebSocketTask.CloseCode,
            reason: Data?
        ) {
            guard let socketID = Self.socketID(from: webSocketTask) else { return }
            emit(.didClose(socketID: socketID, closeCode: closeCode, reason: reason))
        }

        func urlSession(
            _ session: URLSession,
            task: URLSessionTask,
            didCompleteWithError error: Error?
        ) {
            guard let webSocketTask = task as? URLSessionWebSocketTask else { return }
            guard let socketID = Self.socketID(from: webSocketTask) else { return }
            emit(.didComplete(socketID: socketID, error: error))
        }

        private static func socketID(from task: URLSessionWebSocketTask) -> Int32? {
            guard let description = task.taskDescription else { return nil }
            return Int32(description)
        }
    }

    private let onSocketOpened: @Sendable () -> LifecycleController.VisibleHandleToken
    private let onSocketClosed: @Sendable (LifecycleController.VisibleHandleToken) -> Void
    private let delegate: SessionDelegate
    private let session: URLSession
    private let delegateEventContinuation: AsyncStream<DelegateEvent>.Continuation
    private var sockets: [Int32: SocketEntry] = [:]
    private var isActive = true

    init(
        onSocketOpened: @escaping @Sendable () -> LifecycleController.VisibleHandleToken,
        onSocketClosed: @escaping @Sendable (LifecycleController.VisibleHandleToken) -> Void
    ) {
        self.onSocketOpened = onSocketOpened
        self.onSocketClosed = onSocketClosed

        let (delegateEvents, continuation) = AsyncStream<DelegateEvent>.makeStream()
        self.delegateEventContinuation = continuation

        let delegate = SessionDelegate { event in
            continuation.yield(event)
        }
        self.delegate = delegate
        self.session = URLSession(configuration: .default, delegate: delegate, delegateQueue: nil)

        Task {
            for await event in delegateEvents {
                switch event {
                case .didOpen(let socketID, let protocolName):
                    await self.handleDidOpen(socketID: socketID, protocolName: protocolName)
                case .didClose(let socketID, let closeCode, let reason):
                    await self.handleDidClose(socketID: socketID, closeCode: closeCode, reason: reason)
                case .didComplete(let socketID, let error):
                    await self.handleDidComplete(socketID: socketID, error: error)
                }
            }
        }
    }

    func shutdown() async throws {
        guard isActive else {
            return
        }
        isActive = false

        let entries = Array(sockets.values)
        sockets.removeAll()
        for entry in entries {
            entry.task.cancel(with: .goingAway, reason: nil)
            onSocketClosed(entry.visibleHandleToken)
        }

        delegateEventContinuation.finish()
        session.invalidateAndCancel()
    }

    func connect(
        socketID: Int32,
        urlString: String,
        protocols: [String],
        headers: [String: String],
        callback: @escaping @Sendable ([String: Any]) -> Void
    ) {
        guard isActive else { return }
        guard let url = URL(string: urlString) else {
            callback([
                "type": "error",
                "socketID": Int(socketID),
                "message": "Invalid URL: \(urlString)",
            ])
            callback([
                "type": "close",
                "socketID": Int(socketID),
                "code": 1006,
                "reason": "",
                "wasClean": false,
            ])
            return
        }

        var request = URLRequest(url: url)
        for (name, value) in headers {
            request.setValue(value, forHTTPHeaderField: name)
        }
        if !protocols.isEmpty {
            request.setValue(protocols.joined(separator: ", "), forHTTPHeaderField: "Sec-WebSocket-Protocol")
        }

        let task = session.webSocketTask(with: request)
        task.taskDescription = "\(socketID)"

        let visibleHandleToken = onSocketOpened()
        sockets[socketID] = SocketEntry(
            task: task,
            visibleHandleToken: visibleHandleToken,
            callback: callback
        )

        task.resume()
        scheduleReceive(socketID: socketID)
    }

    func sendText(socketID: Int32, text: String) {
        guard let entry = sockets[socketID] else { return }
        entry.task.send(.string(text)) { [weak self] error in
            guard let self else { return }
            guard let error else { return }
            Task {
                await self.handleFailure(socketID: socketID, message: error.localizedDescription)
            }
        }
    }

    func sendBinary(socketID: Int32, bytes: [UInt8]) {
        guard let entry = sockets[socketID] else { return }
        entry.task.send(.data(Data(bytes))) { [weak self] error in
            guard let self else { return }
            guard let error else { return }
            Task {
                await self.handleFailure(socketID: socketID, message: error.localizedDescription)
            }
        }
    }

    func close(socketID: Int32, code: Int32, reason: String) {
        guard let entry = sockets[socketID] else { return }
        let closeCode = URLSessionWebSocketTask.CloseCode(rawValue: Int(code)) ?? .normalClosure
        let reasonData = reason.data(using: .utf8)
        entry.task.cancel(with: closeCode, reason: reasonData)
    }

    func ping(socketID: Int32) {
        guard let entry = sockets[socketID] else { return }
        entry.task.sendPing { [weak self] error in
            guard let self else { return }
            Task {
                if let error {
                    await self.handleFailure(socketID: socketID, message: error.localizedDescription)
                    return
                }
                await self.handlePong(socketID: socketID)
            }
        }
    }

    private func scheduleReceive(socketID: Int32) {
        guard let entry = sockets[socketID], isActive else { return }
        entry.task.receive { [weak self] result in
            guard let self else { return }
            Task {
                await self.handleReceiveResult(result, socketID: socketID)
            }
        }
    }

    private func handleDidOpen(socketID: Int32, protocolName: String?) {
        guard let entry = sockets[socketID], isActive else { return }
        entry.callback([
            "type": "open",
            "socketID": Int(socketID),
            "protocol": protocolName ?? "",
        ])
    }

    private func handleDidClose(
        socketID: Int32,
        closeCode: URLSessionWebSocketTask.CloseCode,
        reason: Data?
    ) {
        let reasonString = reason.flatMap { String(data: $0, encoding: .utf8) } ?? ""
        finishSocket(
            socketID: socketID,
            closeCode: Int(closeCode.rawValue),
            reason: reasonString,
            wasClean: true
        )
    }

    private func handleDidComplete(socketID: Int32, error: Error?) {
        guard let error else { return }
        handleFailure(socketID: socketID, message: error.localizedDescription)
    }

    private func handleReceiveResult(
        _ result: Result<URLSessionWebSocketTask.Message, Error>,
        socketID: Int32
    ) {
        guard let entry = sockets[socketID], isActive else { return }

        switch result {
        case .success(let message):
            switch message {
            case .string(let text):
                entry.callback([
                    "type": "message",
                    "socketID": Int(socketID),
                    "kind": "text",
                    "text": text,
                ])
            case .data(let data):
                entry.callback([
                    "type": "message",
                    "socketID": Int(socketID),
                    "kind": "binary",
                    "bytes": [UInt8](data),
                ])
            @unknown default:
                entry.callback([
                    "type": "error",
                    "socketID": Int(socketID),
                    "message": "Unsupported WebSocket message",
                ])
                finishSocket(socketID: socketID, closeCode: 1006, reason: "", wasClean: false)
                return
            }
            scheduleReceive(socketID: socketID)
        case .failure(let error):
            handleFailure(socketID: socketID, message: error.localizedDescription)
        }
    }

    private func handlePong(socketID: Int32) {
        guard let entry = sockets[socketID], isActive else { return }
        entry.callback([
            "type": "pong",
            "socketID": Int(socketID),
        ])
    }

    private func handleFailure(socketID: Int32, message: String) {
        guard let entry = sockets[socketID], isActive else { return }
        entry.callback([
            "type": "error",
            "socketID": Int(socketID),
            "message": message,
        ])
        finishSocket(socketID: socketID, closeCode: 1006, reason: "", wasClean: false)
    }

    private func finishSocket(socketID: Int32, closeCode: Int, reason: String, wasClean: Bool) {
        guard let entry = sockets.removeValue(forKey: socketID) else { return }
        entry.callback([
            "type": "close",
            "socketID": Int(socketID),
            "code": closeCode,
            "reason": reason,
            "wasClean": wasClean,
        ])
        onSocketClosed(entry.visibleHandleToken)
    }
}
