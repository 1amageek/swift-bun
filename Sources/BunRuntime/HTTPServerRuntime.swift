import Foundation
import NIOCore
import NIOHTTP1
import NIOPosix
import Synchronization

final class HTTPServerRuntime: Sendable {
    private struct ServerEntry: Sendable {
        let channel: Channel
        let visibleHandleToken: LifecycleController.VisibleHandleToken
    }

    private struct PendingResponse: Sendable {
        let channel: Channel
        let version: HTTPVersion
    }

    private struct State: Sendable {
        var nextRequestID: Int32 = 1
        var serverChannels: [Int32: ServerEntry] = [:]
        var pendingResponses: [Int32: PendingResponse] = [:]
    }

    private let group: MultiThreadedEventLoopGroup
    private let state = Mutex(State())
    private let onServerOpened: @Sendable () -> LifecycleController.VisibleHandleToken
    private let onServerClosed: @Sendable (LifecycleController.VisibleHandleToken) -> Void

    init(
        onServerOpened: @escaping @Sendable () -> LifecycleController.VisibleHandleToken,
        onServerClosed: @escaping @Sendable (LifecycleController.VisibleHandleToken) -> Void
    ) {
        group = MultiThreadedEventLoopGroup(numberOfThreads: 1)
        self.onServerOpened = onServerOpened
        self.onServerClosed = onServerClosed
    }

    func shutdown() async throws {
        let entries = state.withLock { state -> [ServerEntry] in
            let values = Array(state.serverChannels.values)
            state.serverChannels.removeAll()
            state.pendingResponses.removeAll()
            return values
        }
        for entry in entries {
            onServerClosed(entry.visibleHandleToken)
        }
        for channel in entries.map(\.channel) {
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
            .childChannelInitializer { channel in
                channel.pipeline.configureHTTPServerPipeline().flatMap {
                    channel.pipeline.addHandler(
                        HTTPServerInboundHandler(
                            serverID: serverID,
                            requestIDProvider: { [weak self] context, version in
                                self?.state.withLock { state -> Int32 in
                                    let identifier = state.nextRequestID
                                    state.nextRequestID += 1
                                    state.pendingResponses[identifier] = PendingResponse(channel: context.channel, version: version)
                                    return identifier
                                } ?? 0
                            },
                            callback: callback
                        )
                    )
                }
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

    func respond(requestID: Int32, statusCode: Int, headers: [String: String], body: [UInt8]) {
        guard let pending = state.withLock({ $0.pendingResponses.removeValue(forKey: requestID) }) else { return }

        var nioHeaders = HTTPHeaders()
        for (name, value) in headers {
            nioHeaders.add(name: name, value: value)
        }
        if nioHeaders["Content-Length"].isEmpty {
            nioHeaders.add(name: "Content-Length", value: "\(body.count)")
        }

        let status = HTTPResponseStatus(statusCode: statusCode)
        let head = HTTPResponseHead(version: pending.version, status: status, headers: nioHeaders)
        var buffer = pending.channel.allocator.buffer(capacity: body.count)
        buffer.writeBytes(body)

        pending.channel.write(HTTPServerResponsePart.head(head), promise: nil)
        pending.channel.write(HTTPServerResponsePart.body(.byteBuffer(buffer)), promise: nil)
        pending.channel.writeAndFlush(HTTPServerResponsePart.end(nil), promise: nil)
    }
}

private final class HTTPServerInboundHandler: ChannelInboundHandler {
    typealias InboundIn = HTTPServerRequestPart

    private let serverID: Int32
    private let requestIDProvider: @Sendable (ChannelHandlerContext, HTTPVersion) -> Int32
    private let callback: @Sendable ([String: Any]) -> Void
    private var requestHead: HTTPRequestHead?
    private var requestBody = ByteBuffer()

    init(
        serverID: Int32,
        requestIDProvider: @escaping @Sendable (ChannelHandlerContext, HTTPVersion) -> Int32,
        callback: @escaping @Sendable ([String: Any]) -> Void
    ) {
        self.serverID = serverID
        self.requestIDProvider = requestIDProvider
        self.callback = callback
    }

    func channelRead(context: ChannelHandlerContext, data: NIOAny) {
        switch unwrapInboundIn(data) {
        case .head(let head):
            requestHead = head
            requestBody = context.channel.allocator.buffer(capacity: 0)
        case .body(var body):
            requestBody.writeBuffer(&body)
        case .end:
            guard let requestHead else { return }
            let requestID = requestIDProvider(context, requestHead.version)
            let bodyBytes = requestBody.readBytes(length: requestBody.readableBytes) ?? []

            var headers: [String: String] = [:]
            for header in requestHead.headers {
                headers[header.name.lowercased()] = header.value
            }

            callback([
                "type": "request",
                "serverID": Int(serverID),
                "requestID": Int(requestID),
                "method": requestHead.method.rawValue,
                "url": requestHead.uri,
                "remoteAddress": context.channel.remoteAddress?.ipAddress ?? "",
                "remotePort": context.channel.remoteAddress?.port ?? 0,
                "localAddress": context.channel.localAddress?.ipAddress ?? "",
                "localPort": context.channel.localAddress?.port ?? 0,
                "headers": headers,
                "body": bodyBytes.map(Int.init),
            ])

            self.requestHead = nil
            self.requestBody = context.channel.allocator.buffer(capacity: 0)
        }
    }

    func errorCaught(context: ChannelHandlerContext, error: Error) {
        callback([
            "type": "error",
            "serverID": Int(serverID),
            "message": "\(error)",
        ])
        context.close(promise: nil)
    }
}
