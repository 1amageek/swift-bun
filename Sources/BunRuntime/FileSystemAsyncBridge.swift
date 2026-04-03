import Foundation

/// Runs filesystem work off the JS thread and completes back on the JS executor.
final class FileSystemAsyncBridge: Sendable {
    struct StatSnapshot: Sendable {
        let isFile: Bool
        let isDirectory: Bool
        let isSymbolicLink: Bool
        let size: UInt64
        let mtimeMs: Double
        let ctimeMs: Double
        let atimeMs: Double
        let birthtimeMs: Double
        let mode: Int

        var jsValue: [String: Any] {
            [
                "isFile": isFile,
                "isDirectory": isDirectory,
                "isSymbolicLink": isSymbolicLink,
                "size": size,
                "mtimeMs": mtimeMs,
                "ctimeMs": ctimeMs,
                "atimeMs": atimeMs,
                "birthtimeMs": birthtimeMs,
                "mode": mode,
            ]
        }
    }

    struct HandleDescriptor: Sendable {
        let path: String
        let flags: String

        var jsValue: [String: Any] {
            [
                "fd": path,
                "path": path,
                "flags": flags,
            ]
        }
    }

    struct ReadSnapshot: Sendable {
        let bytesRead: Int
        let bytes: [UInt8]

        var jsValue: [String: Any] {
            [
                "bytesRead": bytesRead,
                "bytes": bytes,
            ]
        }
    }

    struct DirEntrySnapshot: Sendable {
        let name: String
        let isFile: Bool
        let isDirectory: Bool
        let isSymbolicLink: Bool

        var jsValue: [String: Any] {
            [
                "name": name,
                "isFile": isFile,
                "isDirectory": isDirectory,
                "isSymbolicLink": isSymbolicLink,
            ]
        }
    }

    enum Payload: Sendable {
        case void
        case string(String)
        case bytes([UInt8])
        case names([String])
        case dirEntries([DirEntrySnapshot])
        case stat(StatSnapshot)
        case handle(HandleDescriptor)
        case read(ReadSnapshot)
        case failure(String)

        var jsValue: [String: Any] {
            switch self {
            case .void:
                return ["value": NSNull()]
            case let .string(value):
                return ["value": value]
            case let .bytes(value):
                return ["value": value]
            case let .names(value):
                return ["value": value]
            case let .dirEntries(value):
                return ["value": value.map(\.jsValue)]
            case let .stat(value):
                return ["value": value.jsValue]
            case let .handle(value):
                return ["value": value.jsValue]
            case let .read(value):
                return ["value": value.jsValue]
            case let .failure(message):
                return ["error": message]
            }
        }
    }

    private let completeOnJSThread: @Sendable (Int32, String, String?, Payload) -> Void
    private let onOperationStarted: @Sendable (Int32, String, String?) -> Void
    private let log: @Sendable (String) -> Void

    init(
        completeOnJSThread: @escaping @Sendable (Int32, String, String?, Payload) -> Void,
        onOperationStarted: @escaping @Sendable (Int32, String, String?) -> Void,
        log: @escaping @Sendable (String) -> Void
    ) {
        self.completeOnJSThread = completeOnJSThread
        self.onOperationStarted = onOperationStarted
        self.log = log
    }

    func readFile(path: String, encoding: String, token: Int32) {
        run(source: "fs.readFile", token: token, detail: path) { [self] in
            self.readFilePayload(path: path, encoding: encoding)
        }
    }

    func writeFile(path: String, content: String, token: Int32) {
        run(source: "fs.writeFile", token: token, detail: path) { [self] in
            self.writeFilePayload(path: path, content: content)
        }
    }

    func appendFile(path: String, content: String, token: Int32) {
        run(source: "fs.appendFile", token: token, detail: path) { [self] in
            self.appendFilePayload(path: path, content: content)
        }
    }

    func stat(path: String, token: Int32) {
        run(source: "fs.stat", token: token, detail: path) { [self] in
            self.statPayload(path: path, followSymlinks: true)
        }
    }

    func lstat(path: String, token: Int32) {
        run(source: "fs.lstat", token: token, detail: path) { [self] in
            self.statPayload(path: path, followSymlinks: false)
        }
    }

    func readdir(path: String, withFileTypes: Bool, token: Int32) {
        run(source: "fs.readdir", token: token, detail: path) { [self] in
            self.readdirPayload(path: path, withFileTypes: withFileTypes)
        }
    }

    func mkdir(path: String, recursive: Bool, token: Int32) {
        run(source: "fs.mkdir", token: token, detail: path) { [self] in
            self.mkdirPayload(path: path, recursive: recursive)
        }
    }

    func unlink(path: String, token: Int32) {
        run(source: "fs.unlink", token: token, detail: path) { [self] in
            self.unlinkPayload(path: path)
        }
    }

    func rmdir(path: String, token: Int32) {
        run(source: "fs.rmdir", token: token, detail: path) { [self] in
            self.unlinkPayload(path: path)
        }
    }

    func rename(oldPath: String, newPath: String, token: Int32) {
        run(source: "fs.rename", token: token, detail: "\(oldPath) -> \(newPath)") { [self] in
            self.renamePayload(oldPath: oldPath, newPath: newPath)
        }
    }

    func realpath(path: String, token: Int32) {
        run(source: "fs.realpath", token: token, detail: path) { [self] in
            self.realpathPayload(path: path)
        }
    }

    func readlink(path: String, token: Int32) {
        run(source: "fs.readlink", token: token, detail: path) { [self] in
            self.readlinkPayload(path: path)
        }
    }

    func symlink(targetPath: String, linkPath: String, token: Int32) {
        run(source: "fs.symlink", token: token, detail: "\(targetPath) -> \(linkPath)") { [self] in
            self.symlinkPayload(targetPath: targetPath, linkPath: linkPath)
        }
    }

    func link(existingPath: String, newPath: String, token: Int32) {
        run(source: "fs.link", token: token, detail: "\(existingPath) -> \(newPath)") { [self] in
            self.linkPayload(existingPath: existingPath, newPath: newPath)
        }
    }

    func mkdtemp(prefix: String, token: Int32) {
        run(source: "fs.mkdtemp", token: token, detail: prefix) { [self] in
            self.mkdtempPayload(prefix: prefix)
        }
    }

    func access(path: String, token: Int32) {
        run(source: "fs.access", token: token, detail: path) { [self] in
            self.accessPayload(path: path)
        }
    }

    func chmod(path: String, mode: Int32, token: Int32) {
        run(source: "fs.chmod", token: token, detail: path) { [self] in
            self.chmodPayload(path: path, mode: mode)
        }
    }

    func utimes(path: String, mtimeMs: Double, token: Int32) {
        run(source: "fs.utimes", token: token, detail: path) { [self] in
            self.utimesPayload(path: path, mtimeMs: mtimeMs)
        }
    }

    func rm(path: String, recursive: Bool, force: Bool, token: Int32) {
        run(source: "fs.rm", token: token, detail: path) { [self] in
            self.rmPayload(path: path, recursive: recursive, force: force)
        }
    }

    func copyFile(sourcePath: String, destinationPath: String, token: Int32) {
        run(source: "fs.copyFile", token: token, detail: "\(sourcePath) -> \(destinationPath)") { [self] in
            self.copyFilePayload(sourcePath: sourcePath, destinationPath: destinationPath)
        }
    }

    func open(path: String, flags: String, token: Int32) {
        run(source: "fs.open", token: token, detail: path) { [self] in
            self.openPayload(path: path, flags: flags)
        }
    }

    func readHandle(path: String, length: Int32, position: Int64, token: Int32) {
        run(source: "fs.handle.read", token: token, detail: path) { [self] in
            self.readHandlePayload(path: path, length: Int(length), position: position)
        }
    }

    func writeHandle(path: String, content: String, appendMode: Bool, token: Int32) {
        run(source: "fs.handle.write", token: token, detail: path) { [self] in
            if appendMode {
                return self.appendFilePayload(path: path, content: content)
            }
            return self.writeFilePayload(path: path, content: content)
        }
    }

    func truncate(path: String, length: Int64, token: Int32) {
        run(source: "fs.truncate", token: token, detail: path) { [self] in
            self.truncatePayload(path: path, length: length)
        }
    }

    func closeHandle(token: Int32) {
        run(source: "fs.handle.close", token: token, detail: nil) {
            .void
        }
    }

    private func run(source: String, token: Int32, detail: String?, operation: @escaping @Sendable () -> Payload) {
        let startUptimeMs = Int(ProcessInfo.processInfo.systemUptime * 1000)
        onOperationStarted(token, source, detail)
        if let detail {
            log("[bun:fs] start \(source) token=\(token) t=\(startUptimeMs) path=\(detail)")
        } else {
            log("[bun:fs] start \(source) token=\(token) t=\(startUptimeMs)")
        }
        Task.detached(priority: .utility) { [completeOnJSThread, log] in
            let payload = operation()
            let endUptimeMs = Int(ProcessInfo.processInfo.systemUptime * 1000)
            if let detail {
                log("[bun:fs] complete \(source) token=\(token) t=\(endUptimeMs) dt=\(endUptimeMs - startUptimeMs) path=\(detail)")
            } else {
                log("[bun:fs] complete \(source) token=\(token) t=\(endUptimeMs) dt=\(endUptimeMs - startUptimeMs)")
            }
            completeOnJSThread(token, source, detail, payload)
        }
    }

    private func readFilePayload(path: String, encoding: String) -> Payload {
        do {
            let data = try Data(contentsOf: URL(fileURLWithPath: path))
            if encoding == "utf8" || encoding == "utf-8" {
                guard let string = String(data: data, encoding: .utf8) else {
                    return .failure("ENCODING: failed to decode '\(path)' as UTF-8")
                }
                return .string(string)
            }
            return .bytes([UInt8](data))
        } catch {
            return .failure(mapFSError(error, operation: "open", path: path))
        }
    }

    private func writeFilePayload(path: String, content: String) -> Payload {
        do {
            try content.write(toFile: path, atomically: true, encoding: .utf8)
            return .void
        } catch {
            return .failure(mapFSError(error, operation: "open", path: path))
        }
    }

    private func appendFilePayload(path: String, content: String) -> Payload {
        let fileManager = FileManager.default
        let data = Data(content.utf8)
        if !fileManager.fileExists(atPath: path) {
            do {
                try data.write(to: URL(fileURLWithPath: path))
                return .void
            } catch {
                return .failure(mapFSError(error, operation: "open", path: path))
            }
        }

        do {
            let handle = try FileHandle(forWritingTo: URL(fileURLWithPath: path))
            defer {
                do {
                    try handle.close()
                } catch {
                }
            }
            try handle.seekToEnd()
            try handle.write(contentsOf: data)
            return .void
        } catch {
            return .failure(mapFSError(error, operation: "open", path: path))
        }
    }

    private func statPayload(path: String, followSymlinks: Bool) -> Payload {
        let fileManager = FileManager.default
        do {
            let effectivePath: String
            if followSymlinks {
                var buf = [CChar](repeating: 0, count: Int(PATH_MAX))
                if Darwin.realpath(path, &buf) != nil {
                    effectivePath = buf.withUnsafeBufferPointer { ptr in
                        String(decoding: ptr.prefix(while: { $0 != 0 }).map { UInt8(bitPattern: $0) }, as: UTF8.self)
                    }
                } else {
                    effectivePath = path
                }
            } else {
                effectivePath = path
            }
            let attrs = try fileManager.attributesOfItem(atPath: effectivePath)
            let type = attrs[.type] as? FileAttributeType
            let isSymlink = type == .typeSymbolicLink
            let isDirectory = type == .typeDirectory
            let size = (attrs[.size] as? UInt64) ?? 0
            let mtime = (attrs[.modificationDate] as? Date)?.timeIntervalSince1970 ?? 0
            let ctime = (attrs[.creationDate] as? Date)?.timeIntervalSince1970 ?? 0
            let posixPerms = (attrs[.posixPermissions] as? UInt16) ?? (isDirectory ? 0o755 : 0o644)
            let modePrefix: UInt16 = isSymlink ? 0o120000 : (isDirectory ? 0o040000 : 0o100000)
            return .stat(
                StatSnapshot(
                    isFile: !isDirectory && !isSymlink,
                    isDirectory: isDirectory,
                    isSymbolicLink: followSymlinks ? false : isSymlink,
                    size: size,
                    mtimeMs: mtime * 1000,
                    ctimeMs: ctime * 1000,
                    atimeMs: mtime * 1000,
                    birthtimeMs: ctime * 1000,
                    mode: Int(modePrefix | posixPerms)
                )
            )
        } catch {
            let operation = followSymlinks ? "stat" : "lstat"
            return .failure(mapFSError(error, operation: operation, path: path))
        }
    }

    private func readdirPayload(path: String, withFileTypes: Bool) -> Payload {
        do {
            let names = try FileManager.default.contentsOfDirectory(atPath: path)
            guard withFileTypes else {
                return .names(names)
            }

            let entries = try names.map { name -> DirEntrySnapshot in
                let fullPath = (path as NSString).appendingPathComponent(name)
                let attrs = try FileManager.default.attributesOfItem(atPath: fullPath)
                let type = attrs[.type] as? FileAttributeType
                let isDirectory = type == .typeDirectory
                return DirEntrySnapshot(
                    name: name,
                    isFile: !isDirectory,
                    isDirectory: isDirectory,
                    isSymbolicLink: type == .typeSymbolicLink
                )
            }
            return .dirEntries(entries)
        } catch {
            return .failure(mapFSError(error, operation: "scandir", path: path))
        }
    }

    private func mkdirPayload(path: String, recursive: Bool) -> Payload {
        do {
            try FileManager.default.createDirectory(
                atPath: path,
                withIntermediateDirectories: recursive,
                attributes: nil
            )
            return .void
        } catch {
            return .failure(mapFSError(error, operation: "mkdir", path: path))
        }
    }

    private func unlinkPayload(path: String) -> Payload {
        do {
            try FileManager.default.removeItem(atPath: path)
            return .void
        } catch {
            return .failure(mapFSError(error, operation: "unlink", path: path))
        }
    }

    private func renamePayload(oldPath: String, newPath: String) -> Payload {
        do {
            try performRename(using: FileManager.default, from: oldPath, to: newPath)
            return .void
        } catch {
            return .failure(mapFSError(error, operation: "rename", path: oldPath))
        }
    }

    private func realpathPayload(path: String) -> Payload {
        let resolved = (path as NSString).standardizingPath
        if FileManager.default.fileExists(atPath: resolved) {
            return .string(resolved)
        }
        return .failure(
            mapFSError(
                NSError(domain: NSCocoaErrorDomain, code: NSFileNoSuchFileError),
                operation: "realpath",
                path: path
            )
        )
    }

    private func readlinkPayload(path: String) -> Payload {
        do {
            return .string(try FileManager.default.destinationOfSymbolicLink(atPath: path))
        } catch {
            return .failure(mapFSError(error, operation: "readlink", path: path))
        }
    }

    private func symlinkPayload(targetPath: String, linkPath: String) -> Payload {
        do {
            try FileManager.default.createSymbolicLink(
                atPath: linkPath,
                withDestinationPath: targetPath
            )
            return .void
        } catch {
            return .failure(mapFSError(error, operation: "symlink", path: linkPath))
        }
    }

    private func linkPayload(existingPath: String, newPath: String) -> Payload {
        do {
            try FileManager.default.linkItem(atPath: existingPath, toPath: newPath)
            return .void
        } catch {
            return .failure(mapFSError(error, operation: "link", path: newPath))
        }
    }

    private func mkdtempPayload(prefix: String) -> Payload {
        let fileManager = FileManager.default
        let basePrefixURL = URL(fileURLWithPath: prefix)
        let parentURL = basePrefixURL.deletingLastPathComponent()
        let prefixName = basePrefixURL.lastPathComponent

        do {
            try fileManager.createDirectory(at: parentURL, withIntermediateDirectories: true)
            for _ in 0..<32 {
                let suffix = String(UUID().uuidString.replacingOccurrences(of: "-", with: "").prefix(6))
                let candidateURL = parentURL.appendingPathComponent(prefixName + suffix, isDirectory: true)
                if !fileManager.fileExists(atPath: candidateURL.path) {
                    try fileManager.createDirectory(at: candidateURL, withIntermediateDirectories: false)
                    return .string(candidateURL.path)
                }
            }
            return .failure("EEXIST: file already exists, mkdtemp '\(prefix)'")
        } catch {
            return .failure(mapFSError(error, operation: "mkdtemp", path: prefix))
        }
    }

    private func accessPayload(path: String) -> Payload {
        if FileManager.default.fileExists(atPath: path) {
            return .void
        }
        return .failure(
            mapFSError(
                NSError(domain: NSCocoaErrorDomain, code: NSFileNoSuchFileError),
                operation: "access",
                path: path
            )
        )
    }

    private func chmodPayload(path: String, mode: Int32) -> Payload {
        do {
            let posixMode = mode & 0o7777
            try FileManager.default.setAttributes(
                [.posixPermissions: NSNumber(value: posixMode)],
                ofItemAtPath: path
            )
            return .void
        } catch {
            return .failure(mapFSError(error, operation: "chmod", path: path))
        }
    }

    private func utimesPayload(path: String, mtimeMs: Double) -> Payload {
        do {
            try FileManager.default.setAttributes(
                [.modificationDate: Date(timeIntervalSince1970: mtimeMs / 1000)],
                ofItemAtPath: path
            )
            return .void
        } catch {
            return .failure(mapFSError(error, operation: "utime", path: path))
        }
    }

    private func rmPayload(path: String, recursive: Bool, force: Bool) -> Payload {
        let _ = recursive
        do {
            try FileManager.default.removeItem(atPath: path)
            return .void
        } catch {
            let code = (error as NSError).code
            if force, code == NSFileNoSuchFileError {
                return .void
            }
            return .failure(mapFSError(error, operation: "rm", path: path))
        }
    }

    private func copyFilePayload(sourcePath: String, destinationPath: String) -> Payload {
        do {
            let data = try Data(contentsOf: URL(fileURLWithPath: sourcePath))
            try data.write(to: URL(fileURLWithPath: destinationPath))
            return .void
        } catch {
            return .failure(mapFSError(error, operation: "copyfile", path: sourcePath))
        }
    }

    private func openPayload(path: String, flags: String) -> Payload {
        let appendMode = flags.contains("a")
        let createMode = appendMode || flags.contains("w")

        if createMode {
            if appendMode {
                if !FileManager.default.fileExists(atPath: path) {
                    let create = writeFilePayload(path: path, content: "")
                    if case .failure = create {
                        return create
                    }
                }
            } else {
                let create = writeFilePayload(path: path, content: "")
                if case .failure = create {
                    return create
                }
            }
        }

        return .handle(HandleDescriptor(path: path, flags: flags))
    }

    private func readHandlePayload(path: String, length: Int, position: Int64) -> Payload {
        do {
            let data = try Data(contentsOf: URL(fileURLWithPath: path))
            let start = max(0, Int(position))
            guard start < data.count else {
                return .read(ReadSnapshot(bytesRead: 0, bytes: []))
            }
            let end = min(data.count, start + max(0, length))
            let slice = Array(data[start..<end])
            return .read(ReadSnapshot(bytesRead: slice.count, bytes: slice))
        } catch {
            return .failure(mapFSError(error, operation: "read", path: path))
        }
    }

    private func truncatePayload(path: String, length: Int64) -> Payload {
        do {
            var data = try Data(contentsOf: URL(fileURLWithPath: path))
            let targetLength = max(0, Int(length))
            if data.count > targetLength {
                data.removeSubrange(targetLength..<data.count)
            } else if data.count < targetLength {
                data.append(Data(repeating: 0, count: targetLength - data.count))
            }
            try data.write(to: URL(fileURLWithPath: path))
            return .void
        } catch {
            return .failure(mapFSError(error, operation: "truncate", path: path))
        }
    }

    private func performRename(using fileManager: FileManager, from oldPath: String, to newPath: String) throws {
        let sourceURL = URL(fileURLWithPath: oldPath).standardizedFileURL
        let destinationURL = URL(fileURLWithPath: newPath).standardizedFileURL

        if sourceURL.path == destinationURL.path {
            return
        }

        var sourceIsDirectory = ObjCBool(false)
        guard fileManager.fileExists(atPath: sourceURL.path, isDirectory: &sourceIsDirectory) else {
            throw NSError(domain: NSCocoaErrorDomain, code: NSFileNoSuchFileError)
        }

        var destinationIsDirectory = ObjCBool(false)
        if fileManager.fileExists(atPath: destinationURL.path, isDirectory: &destinationIsDirectory) {
            if sourceIsDirectory.boolValue != destinationIsDirectory.boolValue {
                throw NSError(domain: NSCocoaErrorDomain, code: NSFileWriteFileExistsError)
            }
            try fileManager.removeItem(at: destinationURL)
        }

        try fileManager.moveItem(at: sourceURL, to: destinationURL)
    }

    private func mapFSError(_ error: any Error, operation: String, path: String) -> String {
        let nsError = error as NSError
        let code: String
        switch nsError.code {
        case NSFileNoSuchFileError, NSFileReadNoSuchFileError:
            code = "ENOENT: no such file or directory"
        case NSFileWriteNoPermissionError, NSFileReadNoPermissionError:
            code = "EACCES: permission denied"
        case NSFileWriteOutOfSpaceError:
            code = "ENOSPC: no space left on device"
        case NSFileWriteFileExistsError:
            code = "EEXIST: file already exists"
        default:
            code = "EIO: \(error.localizedDescription)"
        }
        return "\(code), \(operation) '\(path)'"
    }
}
