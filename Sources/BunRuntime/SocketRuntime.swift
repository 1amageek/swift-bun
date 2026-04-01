import Foundation
import NIOCore
import NIOPosix
import Synchronization

final class SocketRuntime: Sendable {
    private struct ServerEntry: Sendable {
        let channel: Channel
        let visibleHandleToken: LifecycleController.VisibleHandleToken
    }

    private struct SocketEntry: Sendable {
        let channel: Channel
        let visibleHandleToken: LifecycleController.VisibleHandleToken
    }

    private struct State: Sendable {
        var nextSocketID: Int32 = 1
        var serverChannels: [Int32: ServerEntry] = [:]
        var socketChannels: [Int32: SocketEntry] = [:]
    }

    private let group: MultiThreadedEventLoopGroup
    private let state = Mutex(State())
    private let onServerOpened: @Sendable () -> LifecycleController.VisibleHandleToken
    private let onServerClosed: @Sendable (LifecycleController.VisibleHandleToken) -> Void
    private let onSocketOpened: @Sendable () -> LifecycleController.VisibleHandleToken
    private let onSocketClosed: @Sendable (LifecycleController.VisibleHandleToken) -> Void

    init(
        onServerOpened: @escaping @Sendable () -> LifecycleController.VisibleHandleToken,
        onServerClosed: @escaping @Sendable (LifecycleController.VisibleHandleToken) -> Void,
        onSocketOpened: @escaping @Sendable () -> LifecycleController.VisibleHandleToken,
        onSocketClosed: @escaping @Sendable (LifecycleController.VisibleHandleToken) -> Void
    ) {
        group = MultiThreadedEventLoopGroup(numberOfThreads: 1)
        self.onServerOpened = onServerOpened
        self.onServerClosed = onServerClosed
        self.onSocketOpened = onSocketOpened
        self.onSocketClosed = onSocketClosed
    }

    func shutdown() async throws {
        let entries = state.withLock { state -> ([ServerEntry], [SocketEntry]) in
            let servers = Array(state.serverChannels.values)
            let sockets = Array(state.socketChannels.values)
            state.serverChannels.removeAll()
            state.socketChannels.removeAll()
            return (servers, sockets)
        }

        for entry in entries.0 {
            onServerClosed(entry.visibleHandleToken)
        }
        for entry in entries.1 {
            onSocketClosed(entry.visibleHandleToken)
        }

        for channel in entries.0.map(\.channel) + entries.1.map(\.channel) {
            do {
                try await channel.close().get()
            } catch {
            }
        }

        try await withCheckedThrowingContinuation { (continuation: CheckedContinuation<Void, Error>) in
            group.shutdownGracefully { error in
                if let error {
                    continuation.resume(throwing: error)
                } else {
                    continuation.resume()
                }
            }
        }
    }

    func listen(
        serverID: Int32,
        host: String,
        port: Int,
        backlog: Int,
        callback: @escaping @Sendable ([String: Any]) -> Void
    ) {
        let bootstrap = ServerBootstrap(group: group)
            .serverChannelOption(ChannelOptions.backlog, value: Int32(backlog))
            .serverChannelOption(ChannelOptions.socketOption(.so_reuseaddr), value: 1)
            .childChannelInitializer { [weak self] channel in
                guard let self else { return channel.eventLoop.makeSucceededFuture(()) }
                let visibleHandleToken = self.onSocketOpened()
                let socketID = self.state.withLock { state -> Int32 in
                    let identifier = state.nextSocketID
                    state.nextSocketID += 1
                    state.socketChannels[identifier] = SocketEntry(channel: channel, visibleHandleToken: visibleHandleToken)
                    return identifier
                }

                let eventHandler = TCPSocketInboundHandler(
                    socketID: socketID,
                    serverID: serverID,
                    callback: callback,
                    onClose: { [weak self] identifier in
                        let token = self?.state.withLock { state in
                            state.socketChannels.removeValue(forKey: identifier)?.visibleHandleToken
                        }
                        if let token {
                            self?.onSocketClosed(token)
                        }
                    }
                )

                return channel.pipeline.addHandler(eventHandler)
            }
            .childChannelOption(ChannelOptions.socketOption(.so_reuseaddr), value: 1)

        Task {
            do {
                let channel = try await bootstrap.bind(host: host, port: port).get()
                let localPort = channel.localAddress?.port ?? port
                let visibleHandleToken = self.onServerOpened()
                state.withLock { $0.serverChannels[serverID] = ServerEntry(channel: channel, visibleHandleToken: visibleHandleToken) }
                callback([
                    "type": "listening",
                    "serverID": Int(serverID),
                    "port": localPort,
                    "host": host,
                ])
                _ = channel.closeFuture.map { _ in
                    callback([
                        "type": "close",
                        "serverID": Int(serverID),
                    ])
                    let token = self.state.withLock { state in
                        state.serverChannels.removeValue(forKey: serverID)?.visibleHandleToken
                    }
                    if let token {
                        self.onServerClosed(token)
                    }
                }
            } catch {
                callback([
                    "type": "error",
                    "serverID": Int(serverID),
                    "message": "\(error)",
                ])
            }
        }
    }

    func closeServer(id: Int32) {
        let channel = state.withLock { $0.serverChannels[id]?.channel }
        channel?.close(promise: nil)
    }

    func connect(
        socketID: Int32,
        host: String,
        port: Int,
        callback: @escaping @Sendable ([String: Any]) -> Void
    ) {
        let bootstrap = ClientBootstrap(group: group)
            .channelInitializer { [weak self] channel in
                guard let self else { return channel.eventLoop.makeSucceededFuture(()) }
                let visibleHandleToken = self.onSocketOpened()
                self.state.withLock { $0.socketChannels[socketID] = SocketEntry(channel: channel, visibleHandleToken: visibleHandleToken) }
                return channel.pipeline.addHandler(
                    TCPSocketInboundHandler(
                        socketID: socketID,
                        serverID: nil,
                        callback: callback,
                        onClose: { [weak self] identifier in
                            let token = self?.state.withLock { state in
                                state.socketChannels.removeValue(forKey: identifier)?.visibleHandleToken
                            }
                            if let token {
                                self?.onSocketClosed(token)
                            }
                        }
                    )
                )
            }

        Task {
            do {
                let channel = try await bootstrap.connect(host: host, port: port).get()
                let localAddress = channel.localAddress
                let remoteAddress = channel.remoteAddress
                callback([
                    "type": "connect",
                    "socketID": Int(socketID),
                    "localAddress": localAddress?.ipAddress ?? "",
                    "localPort": localAddress?.port ?? 0,
                    "remoteAddress": remoteAddress?.ipAddress ?? host,
                    "remotePort": remoteAddress?.port ?? port,
                ])
            } catch {
                callback([
                    "type": "error",
                    "socketID": Int(socketID),
                    "message": "\(error)",
                ])
            }
        }
    }

    func write(socketID: Int32, bytes: [UInt8]) {
        guard let channel = state.withLock({ $0.socketChannels[socketID]?.channel }) else { return }
        var buffer = channel.allocator.buffer(capacity: bytes.count)
        buffer.writeBytes(bytes)
        channel.writeAndFlush(buffer, promise: nil)
    }

    func end(socketID: Int32, bytes: [UInt8]?) {
        guard let channel = state.withLock({ $0.socketChannels[socketID]?.channel }) else { return }
        if let bytes, !bytes.isEmpty {
            var buffer = channel.allocator.buffer(capacity: bytes.count)
            buffer.writeBytes(bytes)
            channel.writeAndFlush(buffer).whenComplete { _ in
                channel.close(promise: nil)
            }
            return
        }
        channel.close(promise: nil)
    }

    func destroy(socketID: Int32) {
        let channel = state.withLock { $0.socketChannels[socketID]?.channel }
        channel?.close(promise: nil)
    }
}

private final class TCPSocketInboundHandler: ChannelInboundHandler {
    typealias InboundIn = ByteBuffer

    private let socketID: Int32
    private let serverID: Int32?
    private let callback: @Sendable ([String: Any]) -> Void
    private let onClose: @Sendable (Int32) -> Void

    init(
        socketID: Int32,
        serverID: Int32?,
        callback: @escaping @Sendable ([String: Any]) -> Void,
        onClose: @escaping @Sendable (Int32) -> Void
    ) {
        self.socketID = socketID
        self.serverID = serverID
        self.callback = callback
        self.onClose = onClose
    }

    func channelActive(context: ChannelHandlerContext) {
        guard let serverID else { return }
        let localAddress = context.channel.localAddress
        let remoteAddress = context.channel.remoteAddress
        callback([
            "type": "connection",
            "serverID": Int(serverID),
            "socketID": Int(socketID),
            "localAddress": localAddress?.ipAddress ?? "",
            "localPort": localAddress?.port ?? 0,
            "remoteAddress": remoteAddress?.ipAddress ?? "",
            "remotePort": remoteAddress?.port ?? 0,
        ])
    }

    func channelRead(context: ChannelHandlerContext, data: NIOAny) {
        var buffer = unwrapInboundIn(data)
        let bytes = buffer.readBytes(length: buffer.readableBytes) ?? []
        callback([
            "type": "data",
            "socketID": Int(socketID),
            "bytes": bytes.map(Int.init),
        ])
    }

    func channelInactive(context: ChannelHandlerContext) {
        callback([
            "type": "end",
            "socketID": Int(socketID),
        ])
        callback([
            "type": "close",
            "socketID": Int(socketID),
        ])
        onClose(socketID)
    }

    func errorCaught(context: ChannelHandlerContext, error: Error) {
        callback([
            "type": "error",
            "socketID": Int(socketID),
            "message": "\(error)",
        ])
        context.close(promise: nil)
    }
}
