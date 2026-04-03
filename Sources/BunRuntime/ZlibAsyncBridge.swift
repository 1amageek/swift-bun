import Foundation

final class ZlibAsyncBridge: Sendable {
    enum Operation: String, Sendable {
        case compress
        case uncompress
    }

    struct Payload: Sendable {
        let base64: String?
        let error: String?

        var jsValue: [String: Any] {
            if let error {
                return ["error": error]
            }
            return ["base64": base64 ?? ""]
        }
    }

    private let completeOnJSThread: @Sendable (Int32, String, String, Payload) -> Void
    private let onOperationStarted: @Sendable (Int32, String, String) -> Void
    private let log: @Sendable (String) -> Void

    init(
        completeOnJSThread: @escaping @Sendable (Int32, String, String, Payload) -> Void,
        onOperationStarted: @escaping @Sendable (Int32, String, String) -> Void,
        log: @escaping @Sendable (String) -> Void
    ) {
        self.completeOnJSThread = completeOnJSThread
        self.onOperationStarted = onOperationStarted
        self.log = log
    }

    @discardableResult
    func start(operationName: String, formatName: String, base64: String, token: Int32) -> Bool {
        guard let operation = Operation(rawValue: operationName),
              let format = ZlibCodec.Format(name: formatName) else {
            return false
        }

        let detail = "\(operation.rawValue):\(format)"
        run(source: "zlib", detail: detail, token: token) {
            do {
                let input = try ZlibCodec.decodeBase64(base64)
                let output: Data
                switch operation {
                case .compress:
                    output = try ZlibCodec.compress(input, format: format)
                case .uncompress:
                    output = try ZlibCodec.decompress(input, format: format)
                }
                return Payload(base64: output.base64EncodedString(), error: nil)
            } catch {
                return Payload(base64: nil, error: String(describing: error))
            }
        }
        return true
    }

    private func run(
        source: String,
        detail: String,
        token: Int32,
        operation: @escaping @Sendable () -> Payload
    ) {
        let startUptimeMs = Int(ProcessInfo.processInfo.systemUptime * 1000)
        onOperationStarted(token, source, detail)
        log("[bun:zlib] start \(detail) token=\(token) t=\(startUptimeMs)")

        Task.detached(priority: .utility) { [completeOnJSThread, log] in
            let payload = operation()
            let endUptimeMs = Int(ProcessInfo.processInfo.systemUptime * 1000)
            log("[bun:zlib] complete \(detail) token=\(token) t=\(endUptimeMs) dt=\(endUptimeMs - startUptimeMs)")
            completeOnJSThread(token, source, detail, payload)
        }
    }
}
