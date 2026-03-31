@preconcurrency import JavaScriptCore
import Foundation

/// `node:fs` implementation bridging to `FileManager`.
enum NodeFS {
    static func install(in context: JSContext) {
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

        // existsSync
        let existsBlock: @convention(block) (String) -> Bool = { path in
            fm.fileExists(atPath: path)
        }
        context.setObject(existsBlock, forKeyedSubscript: "__fsExistsSync" as NSString)

        // statSync — returns { value: dict } or { error: string }
        let statBlock: @convention(block) (String) -> [String: Any] = { path in
            do {
                let attrs = try fm.attributesOfItem(atPath: path)
                let type = attrs[.type] as? FileAttributeType
                let isDir = type == .typeDirectory
                let size = (attrs[.size] as? UInt64) ?? 0
                let mtime = (attrs[.modificationDate] as? Date)?.timeIntervalSince1970 ?? 0
                let ctime = (attrs[.creationDate] as? Date)?.timeIntervalSince1970 ?? 0
                return ["value": [
                    "isFile": !isDir,
                    "isDirectory": isDir,
                    "isSymbolicLink": type == .typeSymbolicLink,
                    "size": size,
                    "mtimeMs": mtime * 1000,
                    "ctimeMs": ctime * 1000,
                    "atimeMs": mtime * 1000,
                    "birthtimeMs": ctime * 1000,
                    "mode": isDir ? 0o040755 : 0o100644,
                ] as [String: Any]]
            } catch {
                return ["error": mapFSError(error, operation: "stat", path: path)]
            }
        }
        context.setObject(statBlock, forKeyedSubscript: "__fsStatSync" as NSString)

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

        // chmodSync — no-op on iOS (returns success)
        let chmodBlock: @convention(block) (String, Int32) -> [String: Any] = { _, _ in
            return [:]
        }
        context.setObject(chmodBlock, forKeyedSubscript: "__fsChmodSync" as NSString)

        context.evaluateScript("""
        (function() {
            function makeStatResult(res) {
                if (res.error) throw new Error(res.error);
                var raw = res.value;
                return {
                    isFile: function() { return raw.isFile; },
                    isDirectory: function() { return raw.isDirectory; },
                    isSymbolicLink: function() { return raw.isSymbolicLink; },
                    isBlockDevice: function() { return false; },
                    isCharacterDevice: function() { return false; },
                    isFIFO: function() { return false; },
                    isSocket: function() { return false; },
                    size: raw.size,
                    mode: raw.mode,
                    mtimeMs: raw.mtimeMs,
                    ctimeMs: raw.ctimeMs,
                    atimeMs: raw.atimeMs,
                    birthtimeMs: raw.birthtimeMs,
                    mtime: new Date(raw.mtimeMs),
                    ctime: new Date(raw.ctimeMs),
                    atime: new Date(raw.atimeMs),
                    birthtime: new Date(raw.birthtimeMs),
                };
            }

            function checkResult(res) {
                if (res.error) throw new Error(res.error);
                return res.value;
            }

            function toBuffer(value) {
                if (typeof Buffer !== 'undefined' && Array.isArray(value)) {
                    return Buffer.from(value);
                }
                return value;
            }

            var fs = {
                readFileSync: function(path, options) {
                    var encoding = typeof options === 'string' ? options : (options && options.encoding);
                    var res = __fsReadFileSync(path, encoding || '');
                    return encoding ? checkResult(res) : toBuffer(checkResult(res));
                },
                writeFileSync: function(path, data, options) {
                    var str = typeof data === 'string' ? data : String(data);
                    var res = __fsWriteFileSync(path, str);
                    if (res.error) throw new Error(res.error);
                },
                appendFileSync: function(path, data, options) {
                    if (path && typeof path === 'object' && typeof path.path === 'string') {
                        path = path.path;
                    }
                    var str = typeof data === 'string' ? data : String(data);
                    var res = __fsAppendFileSync(path, str);
                    if (res.error) throw new Error(res.error);
                },
                existsSync: function(path) {
                    return __fsExistsSync(path);
                },
                statSync: function(path) {
                    return makeStatResult(__fsStatSync(path));
                },
                lstatSync: function(path) {
                    return makeStatResult(__fsStatSync(path));
                },
                mkdirSync: function(path, options) {
                    var recursive = typeof options === 'object' ? (options.recursive || false) : false;
                    var res = __fsMkdirSync(path, recursive);
                    if (res.error) throw new Error(res.error);
                },
                readdirSync: function(path, options) {
                    var names = checkResult(__fsReaddirSync(path));
                    var withFileTypes = options && typeof options === 'object' && options.withFileTypes === true;
                    if (!withFileTypes) return names;

                    return names.map(function(name) {
                        var fullPath = path.replace(/\\/$/, '') + '/' + name;
                        var stat = makeStatResult(__fsStatSync(fullPath));
                        return {
                            name: name,
                            path: fullPath,
                            parentPath: path,
                            isFile: function() { return stat.isFile(); },
                            isDirectory: function() { return stat.isDirectory(); },
                            isSymbolicLink: function() { return stat.isSymbolicLink(); },
                            isBlockDevice: function() { return stat.isBlockDevice(); },
                            isCharacterDevice: function() { return stat.isCharacterDevice(); },
                            isFIFO: function() { return stat.isFIFO(); },
                            isSocket: function() { return stat.isSocket(); },
                        };
                    });
                },
                unlinkSync: function(path) {
                    var res = __fsUnlinkSync(path);
                    if (res.error) throw new Error(res.error);
                },
                renameSync: function(oldPath, newPath) {
                    var res = __fsRenameSync(oldPath, newPath);
                    if (res.error) throw new Error(res.error);
                },
                realpathSync: function(path) {
                    return checkResult(__fsRealpathSync(path));
                },
                accessSync: function(path) {
                    var res = __fsAccessSync(path);
                    if (res.error) throw new Error(res.error);
                },
                chmodSync: function(path, mode) {
                    var res = __fsChmodSync(path, mode || 0);
                    if (res.error) throw new Error(res.error);
                },
                openSync: function(path, flags, mode) {
                    return { path: path, flags: flags || 'r', mode: mode, fd: path };
                },
                closeSync: function(fd) {
                    return;
                },
                readSync: function(fd, buffer, offset, length, position) {
                    var path = typeof fd === 'string' ? fd : (fd && fd.path);
                    if (!path) throw new Error('EBADF: bad file descriptor');

                    var data = fs.readFileSync(path);
                    var source = typeof Buffer !== 'undefined' && Buffer.isBuffer(data) ? data : Buffer.from(data);
                    var start = position == null ? 0 : position;
                    var targetOffset = offset || 0;
                    var bytesToCopy = Math.max(0, Math.min(length || source.length, source.length - start));
                    if (bytesToCopy === 0) return 0;
                    source.copy(buffer, targetOffset, start, start + bytesToCopy);
                    return bytesToCopy;
                },
                chownSync: function() {},
                copyFileSync: function(src, dest) {
                    var data = fs.readFileSync(src);
                    fs.writeFileSync(dest, data);
                },
                appendFile: function(path, data, options, callback) {
                    var cb = typeof options === 'function' ? options : callback;
                    try {
                        fs.appendFileSync(path, data, options);
                        if (cb) cb(null);
                    } catch (e) {
                        if (cb) cb(e);
                        else throw e;
                    }
                },
                createReadStream: function() {
                    throw new Error('createReadStream is not supported in swift-bun');
                },
                createWriteStream: function() {
                    throw new Error('createWriteStream is not supported in swift-bun');
                },
                constants: {
                    F_OK: 0, R_OK: 4, W_OK: 2, X_OK: 1,
                },
                promises: {
                    readFile: function(path, options) {
                        return new Promise(function(resolve, reject) {
                            try { resolve(fs.readFileSync(path, options)); }
                            catch(e) { reject(e); }
                        });
                    },
                    writeFile: function(path, data, options) {
                        return new Promise(function(resolve, reject) {
                            try { fs.writeFileSync(path, data, options); resolve(); }
                            catch(e) { reject(e); }
                        });
                    },
                    appendFile: function(path, data, options) {
                        return new Promise(function(resolve, reject) {
                            try { fs.appendFileSync(path, data, options); resolve(); }
                            catch(e) { reject(e); }
                        });
                    },
                    stat: function(path) {
                        return new Promise(function(resolve, reject) {
                            try { resolve(fs.statSync(path)); }
                            catch(e) { reject(e); }
                        });
                    },
                    access: function(path) {
                        return new Promise(function(resolve, reject) {
                            try { fs.accessSync(path); resolve(); }
                            catch(e) { reject(e); }
                        });
                    },
                    mkdir: function(path, options) {
                        return new Promise(function(resolve, reject) {
                            try { fs.mkdirSync(path, options); resolve(); }
                            catch(e) { reject(e); }
                        });
                    },
                    readdir: function(path, options) {
                        return new Promise(function(resolve, reject) {
                            try { resolve(fs.readdirSync(path, options)); }
                            catch(e) { reject(e); }
                        });
                    },
                    unlink: function(path) {
                        return new Promise(function(resolve, reject) {
                            try { fs.unlinkSync(path); resolve(); }
                            catch(e) { reject(e); }
                        });
                    },
                    rename: function(oldPath, newPath) {
                        return new Promise(function(resolve, reject) {
                            try { fs.renameSync(oldPath, newPath); resolve(); }
                            catch(e) { reject(e); }
                        });
                    },
                    realpath: function(path) {
                        return new Promise(function(resolve, reject) {
                            try { resolve(fs.realpathSync(path)); }
                            catch(e) { reject(e); }
                        });
                    },
                    chmod: function(path, mode) {
                        return new Promise(function(resolve, reject) {
                            try { fs.chmodSync(path, mode); resolve(); }
                            catch(e) { reject(e); }
                        });
                    },
                    lstat: function(path) {
                        return new Promise(function(resolve, reject) {
                            try { resolve(fs.statSync(path)); }
                            catch(e) { reject(e); }
                        });
                    },
                    rm: function(path) {
                        return new Promise(function(resolve, reject) {
                            try { fs.unlinkSync(path); resolve(); }
                            catch(e) { reject(e); }
                        });
                    },
                    copyFile: function(src, dest) {
                        return new Promise(function(resolve, reject) {
                            try { fs.copyFileSync(src, dest); resolve(); }
                            catch(e) { reject(e); }
                        });
                    },
                    open: function(path, flags) {
                        return new Promise(function(resolve, reject) {
                            // Return a minimal file handle stub
                            try {
                                var exists = fs.existsSync(path);
                                resolve({
                                    read: function() { return Promise.resolve({ bytesRead: 0, buffer: new Uint8Array(0) }); },
                                    write: function(data) {
                                        fs.writeFileSync(path, typeof data === 'string' ? data : String(data));
                                        return Promise.resolve({ bytesWritten: data.length });
                                    },
                                    close: function() { return Promise.resolve(); },
                                    stat: function() { return Promise.resolve(fs.statSync(path)); },
                                });
                            } catch(e) { reject(e); }
                        });
                    },
                },
            };

            if (!globalThis.__nodeModules) globalThis.__nodeModules = {};
            __nodeModules.fs = fs;
        })();
        """)
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
