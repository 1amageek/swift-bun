import Foundation
import NIOCore
import NIOPosix

final class LocalTCPEchoTestServer {
    let host: String
    let port: Int

    private let group: MultiThreadedEventLoopGroup
    private let channel: Channel

    private init(group: MultiThreadedEventLoopGroup, channel: Channel, host: String, port: Int) {
        self.group = group
        self.channel = channel
        self.host = host
        self.port = port
    }

    static func start() async throws -> LocalTCPEchoTestServer {
        let group = MultiThreadedEventLoopGroup(numberOfThreads: 1)
        let bootstrap = ServerBootstrap(group: group)
            .serverChannelOption(ChannelOptions.backlog, value: 256)
            .serverChannelOption(ChannelOptions.socketOption(.so_reuseaddr), value: 1)
            .childChannelInitializer { channel in
                channel.pipeline.addHandler(LocalTCPEchoServerHandler())
            }
            .childChannelOption(ChannelOptions.socketOption(.so_reuseaddr), value: 1)

        let channel = try await bootstrap.bind(host: "127.0.0.1", port: 0).get()
        guard let address = channel.localAddress, let port = address.port else {
            try await shutdownGroup(group)
            throw NSError(
                domain: "LocalTCPEchoTestServer",
                code: 1,
                userInfo: [NSLocalizedDescriptionKey: "Missing local port"]
            )
        }

        return LocalTCPEchoTestServer(
            group: group,
            channel: channel,
            host: "127.0.0.1",
            port: port
        )
    }

    func shutdown() async throws {
        try await closeChannel(channel)
        try await Self.shutdownGroup(group)
    }

    private static func shutdownGroup(_ group: MultiThreadedEventLoopGroup) async throws {
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

    private func closeChannel(_ channel: Channel) async throws {
        try await withCheckedThrowingContinuation { (continuation: CheckedContinuation<Void, Error>) in
            channel.closeFuture.whenComplete { result in
                switch result {
                case .success:
                    continuation.resume()
                case .failure(let error):
                    continuation.resume(throwing: error)
                }
            }
            channel.close(promise: nil)
        }
    }
}

private final class LocalTCPEchoServerHandler: ChannelInboundHandler {
    typealias InboundIn = ByteBuffer
    typealias OutboundOut = ByteBuffer

    func channelRead(context: ChannelHandlerContext, data: NIOAny) {
        let buffer = unwrapInboundIn(data)
        context.writeAndFlush(wrapOutboundOut(buffer), promise: nil)
    }

    func errorCaught(context: ChannelHandlerContext, error: Error) {
        context.close(promise: nil)
    }
}
