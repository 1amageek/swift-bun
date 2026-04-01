@preconcurrency import JavaScriptCore
import Foundation

/// `node:fs` implementation bridging to `FileManager`.
enum NodeFS {
    static func install(in context: JSContext, asyncBridge: FileSystemAsyncBridge? = nil) throws {
        let fm = FileManager.default

        // readFileSync — returns { value: string|[UInt8] } or { error: string }
        let readFileBlock: @convention(block) (String, String) -> [String: Any] = { path, encoding in
            do {
                let data = try Data(contentsOf: URL(fileURLWithPath: path))
                if encoding == "utf8" || encoding == "utf-8" {
                    guard let str = String(data: data, encoding: .utf8) else {
                        return ["error": "ENCODING: failed to decode '\(path)' as UTF-8"]
                    }
                    return ["value": str]
                }
                return ["value": [UInt8](data)]
            } catch {
                return ["error": mapFSError(error, operation: "open", path: path)]
            }
        }
        context.setObject(readFileBlock, forKeyedSubscript: "__fsReadFileSync" as NSString)

        // writeFileSync — returns { error: string } or {}
        let writeFileBlock: @convention(block) (String, String) -> [String: Any] = { path, content in
            do {
                try content.write(toFile: path, atomically: true, encoding: .utf8)
                return [:]
            } catch {
                return ["error": mapFSError(error, operation: "open", path: path)]
            }
        }
        context.setObject(writeFileBlock, forKeyedSubscript: "__fsWriteFileSync" as NSString)

        let writeFileBytesBlock: @convention(block) (String, String) -> [String: Any] = { path, base64 in
            guard let data = Data(base64Encoded: base64) else {
                return ["error": "EINVAL: invalid base64 payload, open '\(path)'"]
            }
            do {
                try data.write(to: URL(fileURLWithPath: path))
                return [:]
            } catch {
                return ["error": mapFSError(error, operation: "open", path: path)]
            }
        }
        context.setObject(writeFileBytesBlock, forKeyedSubscript: "__fsWriteFileBytesSync" as NSString)

        // appendFileSync — returns { error: string } or {}
        let appendFileBlock: @convention(block) (String, String) -> [String: Any] = { path, content in
            let data = Data(content.utf8)
            if !fm.fileExists(atPath: path) {
                do {
                    try data.write(to: URL(fileURLWithPath: path))
                    return [:]
                } catch {
                    return ["error": mapFSError(error, operation: "open", path: path)]
                }
            }

            do {
                let handle = try FileHandle(forWritingTo: URL(fileURLWithPath: path))
                defer {
                    do {
                        try handle.close()
                    } catch {
                        // Ignore close errors to match Node's best-effort cleanup behavior.
                    }
                }
                try handle.seekToEnd()
                try handle.write(contentsOf: data)
                return [:]
            } catch {
                return ["error": mapFSError(error, operation: "open", path: path)]
            }
        }
        context.setObject(appendFileBlock, forKeyedSubscript: "__fsAppendFileSync" as NSString)

        let appendFileBytesBlock: @convention(block) (String, String) -> [String: Any] = { path, base64 in
            guard let data = Data(base64Encoded: base64) else {
                return ["error": "EINVAL: invalid base64 payload, open '\(path)'"]
            }
            if !fm.fileExists(atPath: path) {
                do {
                    try data.write(to: URL(fileURLWithPath: path))
                    return [:]
                } catch {
                    return ["error": mapFSError(error, operation: "open", path: path)]
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
                return [:]
            } catch {
                return ["error": mapFSError(error, operation: "open", path: path)]
            }
        }
        context.setObject(appendFileBytesBlock, forKeyedSubscript: "__fsAppendFileBytesSync" as NSString)

        // existsSync
        let existsBlock: @convention(block) (String) -> Bool = { path in
            fm.fileExists(atPath: path)
        }
        context.setObject(existsBlock, forKeyedSubscript: "__fsExistsSync" as NSString)

        // statSync — follows symlinks, returns target attributes
        let statBlock: @convention(block) (String) -> [String: Any] = { path in
            do {
                // Resolve symlinks using realpath(3) — NSString.resolvingSymlinksInPath
                // does not correctly resolve /tmp → /private/tmp on macOS
                var buf = [CChar](repeating: 0, count: Int(PATH_MAX))
                let resolvedPath: String
                if realpath(path, &buf) != nil {
                    resolvedPath = buf.withUnsafeBufferPointer { ptr in
                        String(decoding: ptr.prefix(while: { $0 != 0 }).map { UInt8(bitPattern: $0) }, as: UTF8.self)
                    }
                } else {
                    resolvedPath = path
                }
                let attrs = try fm.attributesOfItem(atPath: resolvedPath)
                let type = attrs[.type] as? FileAttributeType
                let isDir = type == .typeDirectory
                let size = (attrs[.size] as? UInt64) ?? 0
                let mtime = (attrs[.modificationDate] as? Date)?.timeIntervalSince1970 ?? 0
                let ctime = (attrs[.creationDate] as? Date)?.timeIntervalSince1970 ?? 0
                let posixPerms = (attrs[.posixPermissions] as? UInt16) ?? (isDir ? 0o755 : 0o644)
                let modePrefix: UInt16 = isDir ? 0o040000 : 0o100000
                return ["value": [
                    "isFile": !isDir,
                    "isDirectory": isDir,
                    "isSymbolicLink": false,
                    "size": size,
                    "mtimeMs": mtime * 1000,
                    "ctimeMs": ctime * 1000,
                    "atimeMs": mtime * 1000,
                    "birthtimeMs": ctime * 1000,
                    "mode": Int(modePrefix | posixPerms),
                ] as [String: Any]]
            } catch {
                return ["error": mapFSError(error, operation: "stat", path: path)]
            }
        }
        context.setObject(statBlock, forKeyedSubscript: "__fsStatSync" as NSString)

        // lstatSync — does NOT follow symlinks, returns symlink attributes
        let lstatBlock: @convention(block) (String) -> [String: Any] = { path in
            do {
                let attrs = try fm.attributesOfItem(atPath: path)
                let type = attrs[.type] as? FileAttributeType
                let isSymlink = type == .typeSymbolicLink
                let isDir = type == .typeDirectory
                let size = (attrs[.size] as? UInt64) ?? 0
                let mtime = (attrs[.modificationDate] as? Date)?.timeIntervalSince1970 ?? 0
                let ctime = (attrs[.creationDate] as? Date)?.timeIntervalSince1970 ?? 0
                let posixPerms = (attrs[.posixPermissions] as? UInt16) ?? (isDir ? 0o755 : 0o644)
                let modePrefix: UInt16 = isSymlink ? 0o120000 : (isDir ? 0o040000 : 0o100000)
                return ["value": [
                    "isFile": !isDir && !isSymlink,
                    "isDirectory": isDir,
                    "isSymbolicLink": isSymlink,
                    "size": size,
                    "mtimeMs": mtime * 1000,
                    "ctimeMs": ctime * 1000,
                    "atimeMs": mtime * 1000,
                    "birthtimeMs": ctime * 1000,
                    "mode": Int(modePrefix | posixPerms),
                ] as [String: Any]]
            } catch {
                return ["error": mapFSError(error, operation: "lstat", path: path)]
            }
        }
        context.setObject(lstatBlock, forKeyedSubscript: "__fsLstatSync" as NSString)

        // mkdirSync — returns { error: string } or {}
        let mkdirBlock: @convention(block) (String, Bool) -> [String: Any] = { path, recursive in
            do {
                try fm.createDirectory(atPath: path, withIntermediateDirectories: recursive, attributes: nil)
                return [:]
            } catch {
                return ["error": mapFSError(error, operation: "mkdir", path: path)]
            }
        }
        context.setObject(mkdirBlock, forKeyedSubscript: "__fsMkdirSync" as NSString)

        // readdirSync — returns { value: [String] } or { error: string }
        let readdirBlock: @convention(block) (String) -> [String: Any] = { path in
            do {
                let contents = try fm.contentsOfDirectory(atPath: path)
                return ["value": contents]
            } catch {
                return ["error": mapFSError(error, operation: "scandir", path: path)]
            }
        }
        context.setObject(readdirBlock, forKeyedSubscript: "__fsReaddirSync" as NSString)

        // unlinkSync — returns { error: string } or {}
        let unlinkBlock: @convention(block) (String) -> [String: Any] = { path in
            do {
                try fm.removeItem(atPath: path)
                return [:]
            } catch {
                return ["error": mapFSError(error, operation: "unlink", path: path)]
            }
        }
        context.setObject(unlinkBlock, forKeyedSubscript: "__fsUnlinkSync" as NSString)
        context.setObject(unlinkBlock, forKeyedSubscript: "__fsRmdirSync" as NSString)

        // renameSync — returns { error: string } or {}
        let renameBlock: @convention(block) (String, String) -> [String: Any] = { oldPath, newPath in
            do {
                try performRename(using: fm, from: oldPath, to: newPath)
                return [:]
            } catch {
                return ["error": mapFSError(error, operation: "rename", path: oldPath)]
            }
        }
        context.setObject(renameBlock, forKeyedSubscript: "__fsRenameSync" as NSString)

        // realpathSync — returns { value: string } or { error: string }
        let realpathBlock: @convention(block) (String) -> [String: Any] = { path in
            let resolved = (path as NSString).standardizingPath
            if fm.fileExists(atPath: resolved) {
                return ["value": resolved]
            }
            return ["error": mapFSError(
                NSError(domain: NSCocoaErrorDomain, code: NSFileNoSuchFileError),
                operation: "realpath", path: path
            )]
        }
        context.setObject(realpathBlock, forKeyedSubscript: "__fsRealpathSync" as NSString)

        let readlinkBlock: @convention(block) (String) -> [String: Any] = { path in
            do {
                return ["value": try fm.destinationOfSymbolicLink(atPath: path)]
            } catch {
                return ["error": mapFSError(error, operation: "readlink", path: path)]
            }
        }
        context.setObject(readlinkBlock, forKeyedSubscript: "__fsReadlinkSync" as NSString)

        let symlinkBlock: @convention(block) (String, String) -> [String: Any] = { targetPath, linkPath in
            do {
                try fm.createSymbolicLink(atPath: linkPath, withDestinationPath: targetPath)
                return [:]
            } catch {
                return ["error": mapFSError(error, operation: "symlink", path: linkPath)]
            }
        }
        context.setObject(symlinkBlock, forKeyedSubscript: "__fsSymlinkSync" as NSString)

        let linkBlock: @convention(block) (String, String) -> [String: Any] = { existingPath, newPath in
            do {
                try fm.linkItem(atPath: existingPath, toPath: newPath)
                return [:]
            } catch {
                return ["error": mapFSError(error, operation: "link", path: newPath)]
            }
        }
        context.setObject(linkBlock, forKeyedSubscript: "__fsLinkSync" as NSString)

        let mkdtempBlock: @convention(block) (String) -> [String: Any] = { prefix in
            do {
                let prefixURL = URL(fileURLWithPath: prefix)
                let parentURL = prefixURL.deletingLastPathComponent()
                let baseName = prefixURL.lastPathComponent
                try fm.createDirectory(at: parentURL, withIntermediateDirectories: true)

                for _ in 0..<32 {
                    let suffix = String(UUID().uuidString.replacingOccurrences(of: "-", with: "").prefix(6))
                    let candidate = parentURL.appendingPathComponent(baseName + suffix, isDirectory: true)
                    if !fm.fileExists(atPath: candidate.path) {
                        try fm.createDirectory(at: candidate, withIntermediateDirectories: false)
                        return ["value": candidate.path]
                    }
                }

                return ["error": "EEXIST: file already exists, mkdtemp '\(prefix)'"]
            } catch {
                return ["error": mapFSError(error, operation: "mkdtemp", path: prefix)]
            }
        }
        context.setObject(mkdtempBlock, forKeyedSubscript: "__fsMkdtempSync" as NSString)

        // accessSync — returns { error: string } or {}
        let accessBlock: @convention(block) (String) -> [String: Any] = { path in
            if fm.fileExists(atPath: path) {
                return [:]
            }
            return ["error": mapFSError(
                NSError(domain: NSCocoaErrorDomain, code: NSFileNoSuchFileError),
                operation: "access", path: path
            )]
        }
        context.setObject(accessBlock, forKeyedSubscript: "__fsAccessSync" as NSString)

        // chmodSync — sets POSIX permissions via FileManager
        let chmodBlock: @convention(block) (String, Int32) -> [String: Any] = { path, mode in
            do {
                let posixMode = mode & 0o7777
                try fm.setAttributes(
                    [.posixPermissions: NSNumber(value: posixMode)],
                    ofItemAtPath: path
                )
                return [:]
            } catch {
                return ["error": mapFSError(error, operation: "chmod", path: path)]
            }
        }
        context.setObject(chmodBlock, forKeyedSubscript: "__fsChmodSync" as NSString)

        let utimesBlock: @convention(block) (String, Double) -> [String: Any] = { path, mtimeMs in
            do {
                try fm.setAttributes(
                    [.modificationDate: Date(timeIntervalSince1970: mtimeMs / 1000)],
                    ofItemAtPath: path
                )
                return [:]
            } catch {
                return ["error": mapFSError(error, operation: "utime", path: path)]
            }
        }
        context.setObject(utimesBlock, forKeyedSubscript: "__fsUtimesSync" as NSString)

        let rmBlock: @convention(block) (String, Bool, Bool) -> [String: Any] = { path, _, force in
            do {
                try fm.removeItem(atPath: path)
                return [:]
            } catch {
                if force, (error as NSError).code == NSFileNoSuchFileError {
                    return [:]
                }
                return ["error": mapFSError(error, operation: "rm", path: path)]
            }
        }
        context.setObject(rmBlock, forKeyedSubscript: "__fsRmSync" as NSString)

        let truncateBlock: @convention(block) (String, Int64) -> [String: Any] = { path, length in
            do {
                var data = try Data(contentsOf: URL(fileURLWithPath: path))
                let targetLength = max(0, Int(length))
                if data.count > targetLength {
                    data.removeSubrange(targetLength..<data.count)
                } else if data.count < targetLength {
                    data.append(Data(repeating: 0, count: targetLength - data.count))
                }
                try data.write(to: URL(fileURLWithPath: path))
                return [:]
            } catch {
                return ["error": mapFSError(error, operation: "truncate", path: path)]
            }
        }
        context.setObject(truncateBlock, forKeyedSubscript: "__fsTruncateSync" as NSString)

        if let asyncBridge {
            let readFileAsyncBlock: @convention(block) (String, String, Int32) -> Void = { path, encoding, token in
                asyncBridge.readFile(path: path, encoding: encoding, token: token)
            }
            context.setObject(readFileAsyncBlock, forKeyedSubscript: "__fsReadFileAsync" as NSString)

            let writeFileAsyncBlock: @convention(block) (String, String, Int32) -> Void = { path, content, token in
                asyncBridge.writeFile(path: path, content: content, token: token)
            }
            context.setObject(writeFileAsyncBlock, forKeyedSubscript: "__fsWriteFileAsync" as NSString)

            let appendFileAsyncBlock: @convention(block) (String, String, Int32) -> Void = { path, content, token in
                asyncBridge.appendFile(path: path, content: content, token: token)
            }
            context.setObject(appendFileAsyncBlock, forKeyedSubscript: "__fsAppendFileAsync" as NSString)

            let statAsyncBlock: @convention(block) (String, Int32) -> Void = { path, token in
                asyncBridge.stat(path: path, token: token)
            }
            context.setObject(statAsyncBlock, forKeyedSubscript: "__fsStatAsync" as NSString)

            let lstatAsyncBlock: @convention(block) (String, Int32) -> Void = { path, token in
                asyncBridge.lstat(path: path, token: token)
            }
            context.setObject(lstatAsyncBlock, forKeyedSubscript: "__fsLstatAsync" as NSString)

            let readdirAsyncBlock: @convention(block) (String, Bool, Int32) -> Void = { path, withFileTypes, token in
                asyncBridge.readdir(path: path, withFileTypes: withFileTypes, token: token)
            }
            context.setObject(readdirAsyncBlock, forKeyedSubscript: "__fsReaddirAsync" as NSString)

            let mkdirAsyncBlock: @convention(block) (String, Bool, Int32) -> Void = { path, recursive, token in
                asyncBridge.mkdir(path: path, recursive: recursive, token: token)
            }
            context.setObject(mkdirAsyncBlock, forKeyedSubscript: "__fsMkdirAsync" as NSString)

            let unlinkAsyncBlock: @convention(block) (String, Int32) -> Void = { path, token in
                asyncBridge.unlink(path: path, token: token)
            }
            context.setObject(unlinkAsyncBlock, forKeyedSubscript: "__fsUnlinkAsync" as NSString)

            let rmdirAsyncBlock: @convention(block) (String, Int32) -> Void = { path, token in
                asyncBridge.rmdir(path: path, token: token)
            }
            context.setObject(rmdirAsyncBlock, forKeyedSubscript: "__fsRmdirAsync" as NSString)

            let renameAsyncBlock: @convention(block) (String, String, Int32) -> Void = { oldPath, newPath, token in
                asyncBridge.rename(oldPath: oldPath, newPath: newPath, token: token)
            }
            context.setObject(renameAsyncBlock, forKeyedSubscript: "__fsRenameAsync" as NSString)

            let realpathAsyncBlock: @convention(block) (String, Int32) -> Void = { path, token in
                asyncBridge.realpath(path: path, token: token)
            }
            context.setObject(realpathAsyncBlock, forKeyedSubscript: "__fsRealpathAsync" as NSString)

            let readlinkAsyncBlock: @convention(block) (String, Int32) -> Void = { path, token in
                asyncBridge.readlink(path: path, token: token)
            }
            context.setObject(readlinkAsyncBlock, forKeyedSubscript: "__fsReadlinkAsync" as NSString)

            let symlinkAsyncBlock: @convention(block) (String, String, Int32) -> Void = { targetPath, linkPath, token in
                asyncBridge.symlink(targetPath: targetPath, linkPath: linkPath, token: token)
            }
            context.setObject(symlinkAsyncBlock, forKeyedSubscript: "__fsSymlinkAsync" as NSString)

            let linkAsyncBlock: @convention(block) (String, String, Int32) -> Void = { existingPath, newPath, token in
                asyncBridge.link(existingPath: existingPath, newPath: newPath, token: token)
            }
            context.setObject(linkAsyncBlock, forKeyedSubscript: "__fsLinkAsync" as NSString)

            let mkdtempAsyncBlock: @convention(block) (String, Int32) -> Void = { prefix, token in
                asyncBridge.mkdtemp(prefix: prefix, token: token)
            }
            context.setObject(mkdtempAsyncBlock, forKeyedSubscript: "__fsMkdtempAsync" as NSString)

            let accessAsyncBlock: @convention(block) (String, Int32) -> Void = { path, token in
                asyncBridge.access(path: path, token: token)
            }
            context.setObject(accessAsyncBlock, forKeyedSubscript: "__fsAccessAsync" as NSString)

            let chmodAsyncBlock: @convention(block) (String, Int32, Int32) -> Void = { path, mode, token in
                asyncBridge.chmod(path: path, mode: mode, token: token)
            }
            context.setObject(chmodAsyncBlock, forKeyedSubscript: "__fsChmodAsync" as NSString)

            let utimesAsyncBlock: @convention(block) (String, Double, Int32) -> Void = { path, mtimeMs, token in
                asyncBridge.utimes(path: path, mtimeMs: mtimeMs, token: token)
            }
            context.setObject(utimesAsyncBlock, forKeyedSubscript: "__fsUtimesAsync" as NSString)

            let rmAsyncBlock: @convention(block) (String, Bool, Bool, Int32) -> Void = { path, recursive, force, token in
                asyncBridge.rm(path: path, recursive: recursive, force: force, token: token)
            }
            context.setObject(rmAsyncBlock, forKeyedSubscript: "__fsRmAsync" as NSString)

            let copyFileAsyncBlock: @convention(block) (String, String, Int32) -> Void = { sourcePath, destinationPath, token in
                asyncBridge.copyFile(sourcePath: sourcePath, destinationPath: destinationPath, token: token)
            }
            context.setObject(copyFileAsyncBlock, forKeyedSubscript: "__fsCopyFileAsync" as NSString)

            let openAsyncBlock: @convention(block) (String, String, Int32) -> Void = { path, flags, token in
                asyncBridge.open(path: path, flags: flags, token: token)
            }
            context.setObject(openAsyncBlock, forKeyedSubscript: "__fsOpenAsync" as NSString)

            let readHandleAsyncBlock: @convention(block) (String, Int32, Int64, Int32) -> Void = { path, length, position, token in
                asyncBridge.readHandle(path: path, length: length, position: position, token: token)
            }
            context.setObject(readHandleAsyncBlock, forKeyedSubscript: "__fsReadHandleAsync" as NSString)

            let writeHandleAsyncBlock: @convention(block) (String, String, Bool, Int32) -> Void = { path, content, appendMode, token in
                asyncBridge.writeHandle(path: path, content: content, appendMode: appendMode, token: token)
            }
            context.setObject(writeHandleAsyncBlock, forKeyedSubscript: "__fsWriteHandleAsync" as NSString)

            let truncateAsyncBlock: @convention(block) (String, Int64, Int32) -> Void = { path, length, token in
                asyncBridge.truncate(path: path, length: length, token: token)
            }
            context.setObject(truncateAsyncBlock, forKeyedSubscript: "__fsTruncateAsync" as NSString)

            let closeHandleAsyncBlock: @convention(block) (Int32) -> Void = { token in
                asyncBridge.closeHandle(token: token)
            }
            context.setObject(closeHandleAsyncBlock, forKeyedSubscript: "__fsCloseHandleAsync" as NSString)
        }

        try JavaScriptResource.evaluate(.nodeCompat(.fs), in: context)

    }

    private static func performRename(using fileManager: FileManager, from oldPath: String, to newPath: String) throws {
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

    /// Map a Swift error to a Node.js-style error string (e.g. ENOENT, EACCES).
    private static func mapFSError(_ error: any Error, operation: String, path: String) -> String {
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
