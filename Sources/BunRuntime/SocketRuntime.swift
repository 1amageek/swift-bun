import Foundation
import NIOCore
import NIOPosix
import Synchronization

final class SocketRuntime: Sendable {
    private struct State: Sendable {
        var nextSocketID: Int32 = 1
        var serverChannels: [Int32: Channel] = [:]
        var socketChannels: [Int32: Channel] = [:]
    }

    private let group: MultiThreadedEventLoopGroup
    private let state = Mutex(State())

    init() {
        group = MultiThreadedEventLoopGroup(numberOfThreads: 1)
    }

    func shutdown() async throws {
        let channels = state.withLock { state -> [Channel] in
            let values = Array(state.serverChannels.values) + Array(state.socketChannels.values)
            state.serverChannels.removeAll()
            state.socketChannels.removeAll()
            return values
        }

        for channel in channels {
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
                let socketID = self.state.withLock { state -> Int32 in
                    let identifier = state.nextSocketID
                    state.nextSocketID += 1
                    state.socketChannels[identifier] = channel
                    return identifier
                }

                let eventHandler = TCPSocketInboundHandler(
                    socketID: socketID,
                    serverID: serverID,
                    callback: callback,
                    onClose: { [weak self] identifier in
                        _ = self?.state.withLock { state in
                            state.socketChannels.removeValue(forKey: identifier)
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
                state.withLock { $0.serverChannels[serverID] = channel }
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
                    self.state.withLock { state in
                        state.serverChannels.removeValue(forKey: serverID)
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
        let channel = state.withLock { $0.serverChannels.removeValue(forKey: id) }
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
                self?.state.withLock { $0.socketChannels[socketID] = channel }
                return channel.pipeline.addHandler(
                    TCPSocketInboundHandler(
                        socketID: socketID,
                        serverID: nil,
                        callback: callback,
                        onClose: { [weak self] identifier in
                            _ = self?.state.withLock { state in
                                state.socketChannels.removeValue(forKey: identifier)
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
        guard let channel = state.withLock({ $0.socketChannels[socketID] }) else { return }
        var buffer = channel.allocator.buffer(capacity: bytes.count)
        buffer.writeBytes(bytes)
        channel.writeAndFlush(buffer, promise: nil)
    }

    func end(socketID: Int32, bytes: [UInt8]?) {
        guard let channel = state.withLock({ $0.socketChannels[socketID] }) else { return }
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
        let channel = state.withLock { $0.socketChannels.removeValue(forKey: socketID) }
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
