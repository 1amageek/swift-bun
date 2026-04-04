import Foundation
import Compression
import zlib

struct ZlibCodec {
    enum Format: Sendable, CustomStringConvertible, Equatable {
        case zlib
        case gzip
        case raw
        case auto
        case brotli

        init?(name: String) {
            switch name {
            case "zlib": self = .zlib
            case "gzip": self = .gzip
            case "raw": self = .raw
            case "auto": self = .auto
            case "brotli": self = .brotli
            default: return nil
            }
        }

        var windowBits: Int32 {
            switch self {
            case .zlib:
                return MAX_WBITS
            case .gzip:
                return MAX_WBITS + 16
            case .raw:
                return -MAX_WBITS
            case .auto:
                return MAX_WBITS + 32
            case .brotli:
                return MAX_WBITS
            }
        }

        var description: String {
            switch self {
            case .zlib: return "zlib"
            case .gzip: return "gzip"
            case .raw: return "raw"
            case .auto: return "auto"
            case .brotli: return "brotli"
            }
        }
    }

    static func decodeBase64(_ encoded: String) throws -> Data {
        guard let data = Data(base64Encoded: encoded) else {
            throw NSError(
                domain: "swift-bun.zlib",
                code: Int(Z_DATA_ERROR),
                userInfo: [NSLocalizedDescriptionKey: "Invalid base64-encoded zlib payload"]
            )
        }
        return data
    }

    static func compress(_ data: Data, format: Format) throws -> Data {
        if format == .brotli {
            return try processCompressionStream(data, operation: COMPRESSION_STREAM_ENCODE, algorithm: COMPRESSION_BROTLI)
        }

        var stream = z_stream()
        let status = deflateInit2_(
            &stream,
            Z_DEFAULT_COMPRESSION,
            Z_DEFLATED,
            format.windowBits,
            MAX_MEM_LEVEL,
            Z_DEFAULT_STRATEGY,
            ZLIB_VERSION,
            Int32(MemoryLayout<z_stream>.size)
        )
        guard status == Z_OK else {
            throw zlibError(code: status, stream: stream, operation: "deflateInit2")
        }
        defer { deflateEnd(&stream) }

        return try processCompression(stream: &stream, input: data)
    }

    static func decompress(_ data: Data, format: Format) throws -> Data {
        if format == .brotli {
            return try processCompressionStream(data, operation: COMPRESSION_STREAM_DECODE, algorithm: COMPRESSION_BROTLI)
        }

        var stream = z_stream()
        let status = inflateInit2_(
            &stream,
            format.windowBits,
            ZLIB_VERSION,
            Int32(MemoryLayout<z_stream>.size)
        )
        guard status == Z_OK else {
            throw zlibError(code: status, stream: stream, operation: "inflateInit2")
        }
        defer { inflateEnd(&stream) }

        return try processDecompression(stream: &stream, input: data, format: format)
    }

    private static func processCompression(stream: inout z_stream, input: Data) throws -> Data {
        var output = Data()
        let chunkSize = max(4_096, input.count + 256)

        try input.withUnsafeBytes { inputBuffer in
            stream.next_in = inputBuffer.baseAddress.map {
                UnsafeMutablePointer<Bytef>(mutating: $0.assumingMemoryBound(to: Bytef.self))
            }
            stream.avail_in = uInt(input.count)

            while true {
                var chunk = Data(count: chunkSize)
                let status: Int32 = chunk.withUnsafeMutableBytes { outputBuffer in
                    stream.next_out = outputBuffer.bindMemory(to: Bytef.self).baseAddress
                    stream.avail_out = uInt(outputBuffer.count)
                    return deflate(&stream, Z_FINISH)
                }

                let written = chunk.count - Int(stream.avail_out)
                appendWrittenBytes(from: chunk, count: written, to: &output)

                if status == Z_STREAM_END {
                    break
                }

                guard status == Z_OK else {
                    throw zlibError(code: status, stream: stream, operation: "deflate")
                }
            }
        }

        return output
    }

    private static func processDecompression(
        stream: inout z_stream,
        input: Data,
        format: Format
    ) throws -> Data {
        var output = Data()
        let chunkSize = max(4_096, input.count * 2 + 256)

        try input.withUnsafeBytes { inputBuffer in
            stream.next_in = inputBuffer.baseAddress.map {
                UnsafeMutablePointer<Bytef>(mutating: $0.assumingMemoryBound(to: Bytef.self))
            }
            stream.avail_in = uInt(input.count)

            while true {
                var chunk = Data(count: chunkSize)
                let status: Int32 = chunk.withUnsafeMutableBytes { outputBuffer in
                    stream.next_out = outputBuffer.bindMemory(to: Bytef.self).baseAddress
                    stream.avail_out = uInt(outputBuffer.count)
                    return inflate(&stream, Z_NO_FLUSH)
                }

                let written = chunk.count - Int(stream.avail_out)
                appendWrittenBytes(from: chunk, count: written, to: &output)

                if status == Z_STREAM_END {
                    break
                }

                if status == Z_BUF_ERROR, stream.avail_in == 0 {
                    throw NSError(
                        domain: "swift-bun.zlib",
                        code: Int(Z_DATA_ERROR),
                        userInfo: [NSLocalizedDescriptionKey: "Unexpected end of \(format) stream"]
                    )
                }

                guard status == Z_OK else {
                    throw zlibError(code: status, stream: stream, operation: "inflate")
                }
            }
        }

        return output
    }

    private static func appendWrittenBytes(from chunk: Data, count: Int, to output: inout Data) {
        guard count > 0 else { return }
        chunk.withUnsafeBytes { buffer in
            if let baseAddress = buffer.baseAddress {
                output.append(baseAddress.assumingMemoryBound(to: UInt8.self), count: count)
            }
        }
    }

    private static func zlibError(code: Int32, stream: z_stream, operation: String) -> NSError {
        let message = stream.msg.map { String(cString: $0) } ?? "zlib error \(code)"
        return NSError(
            domain: "swift-bun.zlib",
            code: Int(code),
            userInfo: [NSLocalizedDescriptionKey: "\(operation) failed: \(message)"]
        )
    }

    private static func processCompressionStream(
        _ input: Data,
        operation: compression_stream_operation,
        algorithm: compression_algorithm
    ) throws -> Data {
        let placeholder = UnsafeMutablePointer<UInt8>.allocate(capacity: 1)
        defer { placeholder.deallocate() }
        var stream = compression_stream(
            dst_ptr: placeholder,
            dst_size: 0,
            src_ptr: UnsafePointer(placeholder),
            src_size: 0,
            state: nil
        )
        let initStatus = compression_stream_init(&stream, operation, algorithm)
        guard initStatus != COMPRESSION_STATUS_ERROR else {
            throw NSError(
                domain: "swift-bun.zlib",
                code: Int(COMPRESSION_STATUS_ERROR.rawValue),
                userInfo: [NSLocalizedDescriptionKey: "compression_stream_init failed for \(algorithmName(algorithm))"]
            )
        }
        defer { compression_stream_destroy(&stream) }

        let dstBufferSize = max(4_096, input.count * 2 + 256)
        let dstBuffer = UnsafeMutablePointer<UInt8>.allocate(capacity: dstBufferSize)
        defer { dstBuffer.deallocate() }

        var output = Data()
        try input.withUnsafeBytes { sourceBuffer in
            stream.src_ptr = sourceBuffer.bindMemory(to: UInt8.self).baseAddress ?? UnsafePointer(placeholder)
            stream.src_size = sourceBuffer.count

            while true {
                stream.dst_ptr = dstBuffer
                stream.dst_size = dstBufferSize

                let status = compression_stream_process(&stream, Int32(COMPRESSION_STREAM_FINALIZE.rawValue))
                let produced = dstBufferSize - stream.dst_size
                if produced > 0 {
                    output.append(dstBuffer, count: produced)
                }

                switch status {
                case COMPRESSION_STATUS_OK:
                    continue
                case COMPRESSION_STATUS_END:
                    return
                default:
                    throw NSError(
                        domain: "swift-bun.zlib",
                        code: Int(COMPRESSION_STATUS_ERROR.rawValue),
                        userInfo: [NSLocalizedDescriptionKey: "\(compressionOperationName(operation)) failed for \(algorithmName(algorithm))"]
                    )
                }
            }
        }

        return output
    }

    private static func compressionOperationName(_ operation: compression_stream_operation) -> String {
        switch operation {
        case COMPRESSION_STREAM_ENCODE:
            return "encode"
        case COMPRESSION_STREAM_DECODE:
            return "decode"
        default:
            return "compression"
        }
    }

    private static func algorithmName(_ algorithm: compression_algorithm) -> String {
        switch algorithm {
        case COMPRESSION_BROTLI:
            return "brotli"
        case COMPRESSION_ZLIB:
            return "zlib"
        case COMPRESSION_LZ4:
            return "lz4"
        case COMPRESSION_LZFSE:
            return "lzfse"
        case COMPRESSION_LZMA:
            return "lzma"
        default:
            return "compression"
        }
    }
}
