import Foundation
import NIOCore
import NIOHTTP1
import NIOPosix

final class LocalHTTPTestServer {
    let baseURL: String

    private let group: MultiThreadedEventLoopGroup
    private let channel: Channel

    private init(group: MultiThreadedEventLoopGroup, channel: Channel, baseURL: String) {
        self.group = group
        self.channel = channel
        self.baseURL = baseURL
    }

    static func start() async throws -> LocalHTTPTestServer {
        let group = MultiThreadedEventLoopGroup(numberOfThreads: 1)
        let bootstrap = ServerBootstrap(group: group)
            .serverChannelOption(ChannelOptions.backlog, value: 256)
            .serverChannelOption(ChannelOptions.socketOption(.so_reuseaddr), value: 1)
            .childChannelInitializer { channel in
                channel.pipeline.configureHTTPServerPipeline().flatMap {
                    channel.pipeline.addHandler(LocalHTTPTestServerHandler())
                }
            }
            .childChannelOption(ChannelOptions.socketOption(.so_reuseaddr), value: 1)

        let channel = try await bootstrap.bind(host: "127.0.0.1", port: 0).get()
        guard let address = channel.localAddress, let port = address.port else {
            try await withCheckedThrowingContinuation { (continuation: CheckedContinuation<Void, Error>) in
                group.shutdownGracefully { error in
                    if let error {
                        continuation.resume(throwing: error)
                    } else {
                        continuation.resume()
                    }
                }
            }
            throw NSError(domain: "LocalHTTPTestServer", code: 1, userInfo: [NSLocalizedDescriptionKey: "Missing local port"])
        }

        return LocalHTTPTestServer(
            group: group,
            channel: channel,
            baseURL: "http://127.0.0.1:\(port)"
        )
    }

    func shutdown() async throws {
        try await channel.close().get()
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

private final class LocalHTTPTestServerHandler: ChannelInboundHandler {
    typealias InboundIn = HTTPServerRequestPart
    typealias OutboundOut = HTTPServerResponsePart

    private var requestHead: HTTPRequestHead?
    private var requestBody = ByteBuffer()

    func channelRead(context: ChannelHandlerContext, data: NIOAny) {
        switch unwrapInboundIn(data) {
        case .head(let head):
            requestHead = head
            requestBody = context.channel.allocator.buffer(capacity: 0)

        case .body(var body):
            requestBody.writeBuffer(&body)

        case .end:
            guard let requestHead else { return }
            let components = URLComponents(string: "http://localhost\(requestHead.uri)")
            let path = components?.path ?? requestHead.uri

            if path == "/stream" {
                var headers = HTTPHeaders()
                headers.add(name: "Content-Type", value: "text/plain; charset=utf-8")
                let head = HTTPResponseHead(version: requestHead.version, status: .ok, headers: headers)

                context.write(wrapOutboundOut(.head(head)), promise: nil)

                var first = context.channel.allocator.buffer(capacity: 6)
                first.writeString("hello ")
                context.writeAndFlush(wrapOutboundOut(.body(.byteBuffer(first))), promise: nil)

                context.eventLoop.scheduleTask(in: .milliseconds(75)) {
                    var second = context.channel.allocator.buffer(capacity: 5)
                    second.writeString("world")
                    context.write(self.wrapOutboundOut(.body(.byteBuffer(second))), promise: nil)
                    context.writeAndFlush(self.wrapOutboundOut(.end(nil)), promise: nil)
                }

                self.requestHead = nil
                self.requestBody = context.channel.allocator.buffer(capacity: 0)
                return
            }

            let body = requestBody.readString(length: requestBody.readableBytes) ?? ""
            let response = Self.makeResponse(for: requestHead, body: body)

            var headers = HTTPHeaders()
            headers.add(name: "Content-Type", value: response.contentType)
            headers.add(name: "Content-Length", value: "\(response.body.utf8.count)")

            let head = HTTPResponseHead(version: requestHead.version, status: response.status, headers: headers)
            var buffer = context.channel.allocator.buffer(capacity: response.body.utf8.count)
            buffer.writeString(response.body)

            context.write(wrapOutboundOut(.head(head)), promise: nil)
            context.write(wrapOutboundOut(.body(.byteBuffer(buffer))), promise: nil)
            context.writeAndFlush(wrapOutboundOut(.end(nil)), promise: nil)

            self.requestHead = nil
            self.requestBody = context.channel.allocator.buffer(capacity: 0)
        }
    }

    func errorCaught(context: ChannelHandlerContext, error: any Error) {
        context.close(promise: nil)
    }

    private static func makeResponse(for requestHead: HTTPRequestHead, body: String) -> (status: HTTPResponseStatus, contentType: String, body: String) {
        let components = URLComponents(string: "http://localhost\(requestHead.uri)")
        let path = components?.path ?? requestHead.uri
        let queryItems = components?.queryItems ?? []
        let args = Dictionary(uniqueKeysWithValues: queryItems.map { ($0.name, $0.value ?? "") })
        let headers = canonicalHeaders(requestHead.headers)

        switch path {
        case "/delay":
            let milliseconds = Int(args["ms"] ?? "") ?? 50
            Thread.sleep(forTimeInterval: Double(milliseconds) / 1000.0)
            return (.ok, "text/plain; charset=utf-8", "delayed")

        case "/get":
            return (.ok, "application/json", jsonString([
                "args": args,
                "headers": headers,
            ]))

        case "/post", "/put":
            return (.ok, "application/json", jsonString([
                "data": body,
                "headers": headers,
            ]))

        case "/delete":
            return (.ok, "application/json", jsonString([
                "ok": true,
            ]))

        case "/status/404":
            return (.notFound, "application/json", jsonString([
                "status": 404,
            ]))

        case "/html":
            return (.ok, "text/html; charset=utf-8", """
            <html><body><h1>Herman Melville</h1></body></html>
            """)

        case "/json":
            return (.ok, "application/json", jsonString([
                "slideshow": [
                    "title": "Sample Slide Show",
                ],
            ]))

        case "/v1/messages":
            return (.ok, "text/event-stream", """
            event: message_start
            data: {"type":"message_start","message":{"id":"msg_local_test","type":"message","role":"assistant","content":[],"model":"claude-sonnet-4-20250514","stop_reason":null,"stop_sequence":null,"usage":{"input_tokens":1,"output_tokens":0}}}

            event: message_stop
            data: {"type":"message_stop"}

            """)

        default:
            return (.notFound, "application/json", jsonString([
                "status": 404,
                "path": path,
            ]))
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

    private static func jsonString(_ object: Any) -> String {
        do {
            let data = try JSONSerialization.data(withJSONObject: object)
            guard let string = String(data: data, encoding: .utf8) else {
                return "{}"
            }
            return string
        } catch {
            return "{}"
        }
    }
}
