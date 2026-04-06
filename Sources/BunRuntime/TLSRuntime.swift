import Foundation

actor TLSRuntime {
    private struct SocketEntry {
        let task: URLSessionStreamTask
        var visibleHandleToken: LifecycleController.VisibleHandleToken?
        let callback: @Sendable ([String: Any]) -> Void
        let host: String
        let port: Int
        var didFinish = false
    }

    private let onSocketOpened: @Sendable () -> LifecycleController.VisibleHandleToken
    private let onSocketClosed: @Sendable (LifecycleController.VisibleHandleToken?) -> Void
    private let session: URLSession
    private var sockets: [Int32: SocketEntry] = [:]
    private var isActive = true

    init(
        onSocketOpened: @escaping @Sendable () -> LifecycleController.VisibleHandleToken,
        onSocketClosed: @escaping @Sendable (LifecycleController.VisibleHandleToken?) -> Void
    ) {
        self.onSocketOpened = onSocketOpened
        self.onSocketClosed = onSocketClosed
        self.session = URLSession(configuration: .ephemeral)
    }

    func shutdown() async throws {
        guard isActive else { return }
        isActive = false

        let entries = Array(sockets.values)
        sockets.removeAll()
        for entry in entries {
            entry.task.closeRead()
            entry.task.closeWrite()
            onSocketClosed(entry.visibleHandleToken)
        }
        session.invalidateAndCancel()
    }

    func connect(
        socketID: Int32,
        host: String,
        port: Int,
        serverName: String?,
        rejectUnauthorized: Bool,
        callback: @escaping @Sendable ([String: Any]) -> Void
    ) {
        guard isActive else { return }
        let token = onSocketOpened()
        let task = session.streamTask(withHostName: host, port: port)
        sockets[socketID] = SocketEntry(
            task: task,
            visibleHandleToken: token,
            callback: callback,
            host: serverName?.isEmpty == false ? serverName! : host,
            port: port
        )
        task.resume()
        task.startSecureConnection()

        callback([
            "type": "secureConnect",
            "socketID": Int(socketID),
            "authorized": true,
            "authorizationError": "",
            "alpnProtocol": "",
            "remoteAddress": host,
            "remotePort": port,
            "serverName": serverName ?? host,
            "rejectUnauthorized": rejectUnauthorized,
        ])
        scheduleRead(socketID: socketID)
    }

    func write(socketID: Int32, bytes: [UInt8], endAfterWrite: Bool = false) {
        guard let entry = sockets[socketID], isActive else { return }
        entry.task.write(Data(bytes), timeout: 30) { [weak self] error in
            guard let self else { return }
            Task {
                if let error {
                    await self.handleFailure(socketID: socketID, message: error.localizedDescription)
                    return
                }
                if endAfterWrite {
                    await self.end(socketID: socketID)
                }
            }
        }
    }

    func end(socketID: Int32) {
        guard let entry = sockets[socketID], isActive else { return }
        entry.task.closeWrite()
    }

    func destroy(socketID: Int32) {
        finish(socketID: socketID, emitEnd: false, message: nil)
    }

    func setSocketRef(id: Int32, isRefed: Bool) {
        let releasedToken = sockets[id]?.visibleHandleToken
        guard var entry = sockets[id] else { return }
        if isRefed {
            guard entry.visibleHandleToken == nil else { return }
            entry.visibleHandleToken = onSocketOpened()
            sockets[id] = entry
            return
        }
        entry.visibleHandleToken = nil
        sockets[id] = entry
        onSocketClosed(releasedToken)
    }

    private func scheduleRead(socketID: Int32) {
        guard let entry = sockets[socketID], isActive else { return }
        entry.task.readData(ofMinLength: 1, maxLength: 16 * 1024, timeout: 30) { [weak self] data, atEOF, error in
            guard let self else { return }
            Task {
                if let error {
                    await self.handleFailure(socketID: socketID, message: error.localizedDescription)
                    return
                }

                if let data, !data.isEmpty {
                    await self.handleData(socketID: socketID, data: data)
                }

                if atEOF {
                    await self.finish(socketID: socketID, emitEnd: true, message: nil)
                    return
                }

                await self.scheduleRead(socketID: socketID)
            }
        }
    }

    private func handleData(socketID: Int32, data: Data) {
        guard let entry = sockets[socketID], !entry.didFinish, isActive else { return }
        entry.callback([
            "type": "data",
            "socketID": Int(socketID),
            "bytes": [UInt8](data),
        ])
    }

    private func handleFailure(socketID: Int32, message: String) {
        finish(socketID: socketID, emitEnd: false, message: message)
    }

    private func finish(socketID: Int32, emitEnd: Bool, message: String?) {
        guard var entry = sockets.removeValue(forKey: socketID), !entry.didFinish else { return }
        entry.didFinish = true
        if let message {
            entry.callback([
                "type": "error",
                "socketID": Int(socketID),
                "message": message,
            ])
        }
        if emitEnd {
            entry.callback([
                "type": "end",
                "socketID": Int(socketID),
            ])
        }
        entry.callback([
            "type": "close",
            "socketID": Int(socketID),
            "hadError": message != nil,
        ])
        entry.task.closeRead()
        entry.task.closeWrite()
        onSocketClosed(entry.visibleHandleToken)
    }
}
