import Foundation
import NIOCore
import NIOHTTP1
import NIOPosix
import NIOWebSocket
import Synchronization

final class LocalWebSocketTestServer {
    struct HandshakeSnapshot: Sendable {
        var headers: [String: String] = [:]
        var requestedProtocols: [String] = []
        var negotiatedProtocol = ""
    }

    let baseURL: String

    private struct State: Sendable {
        var handshake = HandshakeSnapshot()
    }

    private final class HandshakeStore: Sendable {
        private let state = Mutex(State())

        func record(headers: HTTPHeaders, requestedProtocols: [String], negotiatedProtocol: String) {
            state.withLock { state in
                state.handshake.headers = LocalWebSocketTestServer.canonicalHeaders(headers)
                state.handshake.requestedProtocols = requestedProtocols
                state.handshake.negotiatedProtocol = negotiatedProtocol
            }
        }

        func snapshot() -> HandshakeSnapshot {
            state.withLock { $0.handshake }
        }
    }

    private let group: MultiThreadedEventLoopGroup
    private let channel: Channel
    private let state: HandshakeStore

    private init(group: MultiThreadedEventLoopGroup, channel: Channel, baseURL: String, state: HandshakeStore) {
        self.group = group
        self.channel = channel
        self.baseURL = baseURL
        self.state = state
    }

    static func start() async throws -> LocalWebSocketTestServer {
        let group = MultiThreadedEventLoopGroup(numberOfThreads: 1)
        let state = HandshakeStore()

        let upgrader = NIOWebSocketServerUpgrader(
            shouldUpgrade: { channel, head in
                let requestedProtocols = Self.parseRequestedProtocols(from: head.headers)
                let negotiatedProtocol = requestedProtocols.contains("mcp") ? "mcp" : (requestedProtocols.first ?? "")
                state.record(headers: head.headers, requestedProtocols: requestedProtocols, negotiatedProtocol: negotiatedProtocol)

                var headers = HTTPHeaders()
                if !negotiatedProtocol.isEmpty {
                    headers.add(name: "Sec-WebSocket-Protocol", value: negotiatedProtocol)
                }
                return channel.eventLoop.makeSucceededFuture(headers)
            },
            upgradePipelineHandler: { channel, _ in
                channel.pipeline.addHandler(LocalWebSocketServerHandler())
            }
        )

        let upgradeConfiguration = NIOHTTPServerUpgradeConfiguration(
            upgraders: [upgrader],
            completionHandler: { _ in }
        )

        let bootstrap = ServerBootstrap(group: group)
            .serverChannelOption(ChannelOptions.backlog, value: 256)
            .serverChannelOption(ChannelOptions.socketOption(.so_reuseaddr), value: 1)
            .childChannelInitializer { channel in
                channel.pipeline.configureHTTPServerPipeline(withServerUpgrade: upgradeConfiguration)
            }
            .childChannelOption(ChannelOptions.socketOption(.so_reuseaddr), value: 1)

        let channel = try await bootstrap.bind(host: "127.0.0.1", port: 0).get()
        guard let address = channel.localAddress, let port = address.port else {
            try await Self.shutdownGroup(group)
            throw NSError(domain: "LocalWebSocketTestServer", code: 1, userInfo: [NSLocalizedDescriptionKey: "Missing local port"])
        }

        return LocalWebSocketTestServer(
            group: group,
            channel: channel,
            baseURL: "ws://127.0.0.1:\(port)",
            state: state
        )
    }

    func shutdown() async throws {
        try await channel.close().get()
        try await Self.shutdownGroup(group)
    }

    func handshakeSnapshot() -> HandshakeSnapshot {
        state.snapshot()
    }

    private static func parseRequestedProtocols(from headers: HTTPHeaders) -> [String] {
        headers["Sec-WebSocket-Protocol"]
            .flatMap { value in
                value.split(separator: ",").map {
                    $0.trimmingCharacters(in: .whitespacesAndNewlines)
                }
            }
    }

    private static func canonicalHeaders(_ headers: HTTPHeaders) -> [String: String] {
        var values: [String: String] = [:]
        for header in headers {
            values[canonicalHeaderName(header.name)] = header.value
        }
        return values
    }

    private static func canonicalHeaderName(_ name: String) -> String {
        name
            .split(separator: "-")
            .map { part in
                let lower = part.lowercased()
                return lower.prefix(1).uppercased() + lower.dropFirst()
            }
            .joined(separator: "-")
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
}

private final class LocalWebSocketServerHandler: ChannelInboundHandler {
    typealias InboundIn = WebSocketFrame
    typealias OutboundOut = WebSocketFrame

    func channelRead(context: ChannelHandlerContext, data: NIOAny) {
        let frame = unwrapInboundIn(data)

        switch frame.opcode {
        case .text:
            writeFrame(context: context, opcode: .text, data: frame.unmaskedData)
        case .binary:
            writeFrame(context: context, opcode: .binary, data: frame.unmaskedData)
        case .ping:
            writeFrame(context: context, opcode: .pong, data: frame.unmaskedData)
        case .connectionClose:
            var closeData = frame.unmaskedData
            var responseData = ByteBuffer()
            if let code = closeData.readWebSocketErrorCode() {
                responseData.write(webSocketErrorCode: code)
            }
            if let reason = closeData.readString(length: closeData.readableBytes) {
                responseData.writeString(reason)
            }
            writeFrame(context: context, opcode: .connectionClose, data: responseData)
            context.close(promise: nil)
        case .pong, .continuation:
            break
        default:
            break
        }
    }

    func errorCaught(context: ChannelHandlerContext, error: Error) {
        context.close(promise: nil)
    }

    private func writeFrame(context: ChannelHandlerContext, opcode: WebSocketOpcode, data: ByteBuffer) {
        let frame = WebSocketFrame(fin: true, opcode: opcode, data: data)
        context.writeAndFlush(wrapOutboundOut(frame), promise: nil)
    }
}
