@preconcurrency import JavaScriptCore
import Foundation

/// Synchronous filesystem primitives used by the CommonJS loader.
struct ModuleResolutionBridge: JavaScriptModuleInstalling, Sendable {
    func install(into context: JSContext) throws {
        let fileManager = FileManager.default

        let existsBlock: @convention(block) (String) -> Bool = { path in
            fileManager.fileExists(atPath: path)
        }
        context.setObject(existsBlock, forKeyedSubscript: "__moduleExists" as NSString)

        let statBlock: @convention(block) (String) -> [String: Any] = { path in
            Self.stat(atPath: path, using: fileManager)
        }
        context.setObject(statBlock, forKeyedSubscript: "__moduleStat" as NSString)

        let readFileBlock: @convention(block) (String, String) -> [String: Any] = { path, encoding in
            do {
                let data = try Data(contentsOf: URL(fileURLWithPath: path))
                let normalizedEncoding = encoding.isEmpty ? "utf8" : encoding.lowercased()
                guard normalizedEncoding == "utf8" || normalizedEncoding == "utf-8" else {
                    return ["error": "Unsupported module encoding '\(encoding)' for '\(path)'"]
                }
                guard let source = String(data: data, encoding: .utf8) else {
                    return ["error": "ENCODING: failed to decode '\(path)' as UTF-8"]
                }
                return ["value": source]
            } catch {
                return ["error": Self.mapReadError(error, path: path)]
            }
        }
        context.setObject(readFileBlock, forKeyedSubscript: "__moduleReadFile" as NSString)

        let realpathBlock: @convention(block) (String) -> [String: Any] = { path in
            do {
                return ["value": try Self.resolveRealpath(of: path)]
            } catch {
                return ["error": Self.mapReadError(error, path: path)]
            }
        }
        context.setObject(realpathBlock, forKeyedSubscript: "__moduleRealpath" as NSString)
    }

    private static func stat(atPath path: String, using fileManager: FileManager) -> [String: Any] {
        var isDirectory = ObjCBool(false)
        guard fileManager.fileExists(atPath: path, isDirectory: &isDirectory) else {
            return [
                "exists": false,
                "isFile": false,
                "isDirectory": false,
                "isSymbolicLink": false,
            ]
        }

        do {
            let attributes = try fileManager.attributesOfItem(atPath: path)
            let type = attributes[.type] as? FileAttributeType
            let isSymbolicLink = type == .typeSymbolicLink
            let directory = isDirectory.boolValue || type == .typeDirectory
            return [
                "exists": true,
                "isFile": !directory && !isSymbolicLink,
                "isDirectory": directory,
                "isSymbolicLink": isSymbolicLink,
            ]
        } catch {
            return [
                "exists": false,
                "isFile": false,
                "isDirectory": false,
                "isSymbolicLink": false,
            ]
        }
    }

    private static func resolveRealpath(of path: String) throws -> String {
        var buffer = [CChar](repeating: 0, count: Int(PATH_MAX))
        guard realpath(path, &buffer) != nil else {
            throw NSError(domain: NSCocoaErrorDomain, code: NSFileNoSuchFileError)
        }
        return buffer.withUnsafeBufferPointer { pointer in
            String(
                decoding: pointer.prefix(while: { $0 != 0 }).map { UInt8(bitPattern: $0) },
                as: UTF8.self
            )
        }
    }

    private static func mapReadError(_ error: any Error, path: String) -> String {
        let nsError = error as NSError
        let code: String
        switch nsError.code {
        case NSFileNoSuchFileError, NSFileReadNoSuchFileError:
            code = "ENOENT: no such file or directory"
        case NSFileWriteNoPermissionError, NSFileReadNoPermissionError:
            code = "EACCES: permission denied"
        default:
            code = "EIO: \(error.localizedDescription)"
        }
        return "\(code), open '\(path)'"
    }
}
