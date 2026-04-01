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

            function normalizedEncoding(options, fallback) {
                if (typeof options === 'string') return options;
                if (options && typeof options === 'object' && typeof options.encoding === 'string') {
                    return options.encoding;
                }
                return fallback || 'utf8';
            }

            function toBufferValue(value, encoding) {
                var effectiveEncoding = encoding || 'utf8';
                if (typeof Buffer !== 'undefined') {
                    if (Buffer.isBuffer && Buffer.isBuffer(value)) return value;
                    if (value instanceof Uint8Array) return Buffer.from(value);
                    if (ArrayBuffer.isView(value)) {
                        return Buffer.from(value.buffer, value.byteOffset, value.byteLength);
                    }
                    if (value instanceof ArrayBuffer) return Buffer.from(new Uint8Array(value));
                    if (typeof value === 'string') return Buffer.from(value, effectiveEncoding);
                    return Buffer.from(String(value), effectiveEncoding);
                }
                if (value instanceof Uint8Array) return value;
                if (ArrayBuffer.isView(value)) {
                    return new Uint8Array(value.buffer, value.byteOffset, value.byteLength);
                }
                if (value instanceof ArrayBuffer) return new Uint8Array(value);
                return new TextEncoder().encode(typeof value === 'string' ? value : String(value));
            }

            function writeBufferSync(path, buffer) {
                var res = __fsWriteFileBytesSync(path, Buffer.from(buffer).toString('base64'));
                if (res.error) throw new Error(res.error);
            }

            function appendBufferSync(path, buffer) {
                var res = __fsAppendFileBytesSync(path, Buffer.from(buffer).toString('base64'));
                if (res.error) throw new Error(res.error);
            }

            function normalizePath(value) {
                if (value && typeof value === 'object' && typeof value.path === 'string') {
                    return value.path;
                }
                return value;
            }

            function normalizeDescriptor(fd) {
                if (typeof fd === 'string') return fd;
                if (fd && typeof fd.path === 'string') return fd.path;
                throw new Error('EBADF: bad file descriptor');
            }

            function makeDirent(path, entry) {
                var fullPath = path.replace(/\/$/, '') + '/' + entry.name;
                return {
                    name: entry.name,
                    path: fullPath,
                    parentPath: path,
                    isFile: function() { return !!entry.isFile; },
                    isDirectory: function() { return !!entry.isDirectory; },
                    isSymbolicLink: function() { return !!entry.isSymbolicLink; },
                    isBlockDevice: function() { return false; },
                    isCharacterDevice: function() { return false; },
                    isFIFO: function() { return false; },
                    isSocket: function() { return false; },
                };
            }

            function scheduleAsync(callback) {
                if (typeof setImmediate === 'function') {
                    setImmediate(callback);
                    return;
                }
                setTimeout(callback, 0);
            }

            function asyncResult(operation) {
                return new Promise(function(resolve, reject) {
                    scheduleAsync(function() {
                        try {
                            resolve(operation());
                        } catch (error) {
                            reject(error);
                        }
                    });
                });
            }

            var __fsAsyncNextToken = 1;
            var __fsAsyncPending = Object.create(null);

            globalThis.__resolveFSAsyncToken = function(token, payload) {
                var pending = __fsAsyncPending[token];
                if (!pending) return;
                delete __fsAsyncPending[token];
                if (payload && payload.error) {
                    pending.reject(new Error(payload.error));
                    return;
                }
                pending.resolve(payload ? payload.value : undefined);
            };

            function nativeAsync(start) {
                return new Promise(function(resolve, reject) {
                    var token = __fsAsyncNextToken++;
                    __fsAsyncPending[token] = { resolve: resolve, reject: reject };
                    try {
                        start(token);
                    } catch (error) {
                        delete __fsAsyncPending[token];
                        reject(error);
                    }
                });
            }

            function asyncValue(nativeStart, fallbackOperation) {
                if (typeof nativeStart === 'function') {
                    return nativeAsync(nativeStart);
                }
                return asyncResult(fallbackOperation);
            }

            function createFileHandle(path, flags, prepared) {
                var normalizedFlags = flags || 'r';
                var appendMode = normalizedFlags.indexOf('a') !== -1;
                var createMode = appendMode || normalizedFlags.indexOf('w') !== -1;
                var currentPosition = appendMode
                    ? (fs.existsSync(path) ? fs.statSync(path).size : 0)
                    : 0;

                if (!prepared && createMode) {
                    if (appendMode) {
                        if (!fs.existsSync(path)) fs.writeFileSync(path, '');
                    } else {
                        fs.writeFileSync(path, '');
                    }
                }

                return {
                    fd: path,
                    path: path,
                    flags: normalizedFlags,
                    read: function(buffer, offset, length, position) {
                        var targetBuffer = buffer || Buffer.alloc(0);
                        var effectiveOffset = offset || 0;
                        var effectiveLength = typeof length === 'number' ? length : targetBuffer.length;
                        var effectivePosition = position == null ? currentPosition : position;
                        if (arguments.length === 0) {
                            return asyncValue(null, function() {
                                return { bytesRead: 0, buffer: Buffer.alloc(0) };
                            });
                        }
                        return asyncValue(
                            typeof __fsReadHandleAsync === 'function'
                                ? function(token) {
                                    __fsReadHandleAsync(path, effectiveLength, effectivePosition, token);
                                }
                                : null,
                            function() {
                                var bytesRead = fs.readSync(path, targetBuffer, effectiveOffset, effectiveLength, effectivePosition);
                                return { bytesRead: bytesRead, buffer: targetBuffer };
                            }
                        ).then(function(result) {
                            if (result && Array.isArray(result.bytes)) {
                                Buffer.from(result.bytes).copy(targetBuffer, effectiveOffset, 0, result.bytesRead);
                                currentPosition = effectivePosition + result.bytesRead;
                                return { bytesRead: result.bytesRead, buffer: targetBuffer };
                            }
                            currentPosition = effectivePosition + (result && typeof result.bytesRead === 'number' ? result.bytesRead : 0);
                            return result;
                        });
                    },
                    readFile: function(options) {
                        return asyncValue(
                            typeof __fsReadFileAsync === 'function'
                                ? function(token) {
                                    var encoding = typeof options === 'string' ? options : (options && options.encoding);
                                    __fsReadFileAsync(path, encoding || '', token);
                                }
                                : null,
                            function() {
                            return fs.readFileSync(path, options);
                            }
                        );
                    },
                    write: function(data, position, encoding) {
                        return asyncResult(function() {
                            var effectiveEncoding = typeof encoding === 'string' ? encoding : 'utf8';
                            var effectivePosition = appendMode ? null : (position == null ? currentPosition : position);
                            var bytesWritten = fs.writeSync(path, data, 0, undefined, effectivePosition, effectiveEncoding);
                            if (appendMode) currentPosition += bytesWritten;
                            else currentPosition = (effectivePosition == null ? currentPosition : effectivePosition) + bytesWritten;
                            return { bytesWritten: bytesWritten, buffer: data };
                        });
                    },
                    writeFile: function(data, options) {
                        return asyncResult(function() {
                            if (appendMode) fs.appendFileSync(path, data, options);
                            else fs.writeFileSync(path, data, options);
                            currentPosition = appendMode ? fs.statSync(path).size : fs.statSync(path).size;
                        });
                    },
                    appendFile: function(data, options) {
                        return asyncResult(function() {
                            fs.appendFileSync(path, data, options);
                            currentPosition = fs.statSync(path).size;
                        });
                    },
                    datasync: function() { return asyncResult(function() {}); },
                    sync: function() { return asyncResult(function() {}); },
                    stat: function() {
                        return asyncValue(
                            typeof __fsStatAsync === 'function'
                                ? function(token) { __fsStatAsync(path, token); }
                                : null,
                            function() {
                            return fs.statSync(path);
                            }
                        ).then(function(value) {
                            return value && typeof value.isFile === 'boolean' ? makeStatResult({ value: value }) : value;
                        });
                    },
                    truncate: function() {
                        var targetLength = arguments.length > 0 && typeof arguments[0] === 'number' ? arguments[0] : 0;
                        return asyncValue(
                            typeof __fsTruncateAsync === 'function'
                                ? function(token) { __fsTruncateAsync(path, targetLength, token); }
                                : null,
                            function() {
                            fs.truncateSync(path, targetLength);
                            }
                        ).then(function(result) {
                            currentPosition = Math.min(currentPosition, targetLength);
                            return result;
                        });
                    },
                    close: function() {
                        return asyncValue(
                            typeof __fsCloseHandleAsync === 'function'
                                ? function(token) { __fsCloseHandleAsync(token); }
                                : null,
                            function() {}
                        );
                    },
                };
            }

            var fs = {
                readFileSync: function(path, options) {
                    path = normalizePath(path);
                    var encoding = typeof options === 'string' ? options : (options && options.encoding);
                    var res = __fsReadFileSync(path, encoding || '');
                    return encoding ? checkResult(res) : toBuffer(checkResult(res));
                },
                writeFileSync: function(path, data, options) {
                    path = normalizePath(path);
                    writeBufferSync(path, toBufferValue(data, normalizedEncoding(options, 'utf8')));
                },
                appendFileSync: function(path, data, options) {
                    path = normalizePath(path);
                    appendBufferSync(path, toBufferValue(data, normalizedEncoding(options, 'utf8')));
                },
                existsSync: function(path) {
                    path = normalizePath(path);
                    return __fsExistsSync(path);
                },
                statSync: function(path) {
                    path = normalizePath(path);
                    return makeStatResult(__fsStatSync(path));
                },
                lstatSync: function(path) {
                    path = normalizePath(path);
                    return makeStatResult(__fsLstatSync(path));
                },
                mkdirSync: function(path, options) {
                    path = normalizePath(path);
                    var recursive = typeof options === 'object' ? (options.recursive || false) : false;
                    var res = __fsMkdirSync(path, recursive);
                    if (res.error) throw new Error(res.error);
                },
                readdirSync: function(path, options) {
                    path = normalizePath(path);
                    var names = checkResult(__fsReaddirSync(path));
                    var withFileTypes = options && typeof options === 'object' && options.withFileTypes === true;
                    if (!withFileTypes) return names;

                    return names.map(function(name) {
                        var fullPath = path.replace(/\/$/, '') + '/' + name;
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
                    path = normalizePath(path);
                    var res = __fsUnlinkSync(path);
                    if (res.error) throw new Error(res.error);
                },
                rmdirSync: function(path) {
                    path = normalizePath(path);
                    var res = __fsRmdirSync(path);
                    if (res.error) throw new Error(res.error);
                },
                renameSync: function(oldPath, newPath) {
                    oldPath = normalizePath(oldPath);
                    newPath = normalizePath(newPath);
                    var res = __fsRenameSync(oldPath, newPath);
                    if (res.error) throw new Error(res.error);
                },
                realpathSync: function(path) {
                    path = normalizePath(path);
                    return checkResult(__fsRealpathSync(path));
                },
                readlinkSync: function(path) {
                    path = normalizePath(path);
                    return checkResult(__fsReadlinkSync(path));
                },
                symlinkSync: function(target, path) {
                    path = normalizePath(path);
                    var res = __fsSymlinkSync(target, path);
                    if (res.error) throw new Error(res.error);
                },
                linkSync: function(existingPath, newPath) {
                    existingPath = normalizePath(existingPath);
                    newPath = normalizePath(newPath);
                    var res = __fsLinkSync(existingPath, newPath);
                    if (res.error) throw new Error(res.error);
                },
                mkdtempSync: function(prefix, options) {
                    prefix = normalizePath(prefix);
                    var value = checkResult(__fsMkdtempSync(prefix));
                    if (options === 'buffer' || (options && options.encoding === 'buffer')) {
                        return Buffer.from(value);
                    }
                    return value;
                },
                accessSync: function(path) {
                    path = normalizePath(path);
                    var res = __fsAccessSync(path);
                    if (res.error) throw new Error(res.error);
                },
                chmodSync: function(path, mode) {
                    path = normalizePath(path);
                    var res = __fsChmodSync(path, mode || 0);
                    if (res.error) throw new Error(res.error);
                },
                utimesSync: function(path, atime, mtime) {
                    path = normalizePath(path);
                    var mtimeMs = mtime instanceof Date ? mtime.getTime() : Number(mtime) * 1000;
                    var res = __fsUtimesSync(path, mtimeMs);
                    if (res.error) throw new Error(res.error);
                },
                rmSync: function(path, options) {
                    path = normalizePath(path);
                    var recursive = !!(options && options.recursive);
                    var force = !!(options && options.force);
                    var res = __fsRmSync(path, recursive, force);
                    if (res.error) throw new Error(res.error);
                },
                openSync: function(path, flags, mode) {
                    path = normalizePath(path);
                    return { path: path, flags: flags || 'r', mode: mode, fd: path };
                },
                closeSync: function(fd) {
                    return;
                },
                readSync: function(fd, buffer, offset, length, position) {
                    var path = normalizeDescriptor(fd);
                    var data = fs.readFileSync(path);
                    var source = typeof Buffer !== 'undefined' && Buffer.isBuffer(data) ? data : Buffer.from(data);
                    var start = position == null ? 0 : position;
                    var targetOffset = offset || 0;
                    var bytesToCopy = Math.max(0, Math.min(length || source.length, source.length - start));
                    if (bytesToCopy === 0) return 0;
                    source.copy(buffer, targetOffset, start, start + bytesToCopy);
                    return bytesToCopy;
                },
                writeSync: function(fd, data, offset, length, position, encoding) {
                    var path = normalizeDescriptor(fd);
                    var chunk;
                    var effectivePosition = position;
                    if (typeof data === 'string') {
                        if (typeof offset === 'number') {
                            effectivePosition = offset;
                        }
                        var stringEncoding = typeof encoding === 'string'
                            ? encoding
                            : (typeof length === 'string' ? length : 'utf8');
                        chunk = toBufferValue(data, stringEncoding);
                    } else {
                        var source = Buffer.from(data);
                        var start = offset || 0;
                        var end = typeof length === 'number' ? start + length : source.length;
                        chunk = source.subarray(start, end);
                    }

                    if (effectivePosition != null) {
                        var existing = fs.existsSync(path) ? fs.readFileSync(path) : Buffer.alloc(0);
                        var prefix = existing.subarray(0, effectivePosition);
                        var suffixStart = effectivePosition + chunk.length;
                        var suffix = suffixStart < existing.length ? existing.subarray(suffixStart) : Buffer.alloc(0);
                        writeBufferSync(path, Buffer.concat([prefix, Buffer.from(chunk), suffix]));
                    } else {
                        appendBufferSync(path, chunk);
                    }
                    return chunk.length;
                },
                fstatSync: function(fd) {
                    return fs.statSync(normalizeDescriptor(fd));
                },
                fsyncSync: function(fd) {
                    normalizeDescriptor(fd);
                    return;
                },
                truncateSync: function(path, length) {
                    path = normalizePath(path);
                    var targetLength = typeof length === 'number' ? length : 0;
                    var res = __fsTruncateSync(path, targetLength);
                    if (res.error) throw new Error(res.error);
                },
                chownSync: function() {},
                copyFileSync: function(src, dest) {
                    var data = fs.readFileSync(src);
                    fs.writeFileSync(dest, data);
                },
                stat: function(path, callback) {
                    path = normalizePath(path);
                    asyncResult(function() {
                        return fs.statSync(path);
                    }).then(function(value) {
                        if (callback) callback(null, value);
                    }, function(error) {
                        if (callback) callback(error);
                    });
                },
                lstat: function(path, callback) {
                    path = normalizePath(path);
                    asyncResult(function() {
                        return fs.lstatSync(path);
                    }).then(function(value) {
                        if (callback) callback(null, value);
                    }, function(error) {
                        if (callback) callback(error);
                    });
                },
                fstat: function(fd, callback) {
                    asyncResult(function() {
                        return fs.fstatSync(fd);
                    }).then(function(value) {
                        if (callback) callback(null, value);
                    }, function(error) {
                        if (callback) callback(error);
                    });
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
                createReadStream: function(path, options) {
                    var Stream = require('stream');
                    var opts = options || {};
                    var data = fs.readFileSync(path, opts.encoding || null);
                    if (typeof opts.start === 'number' || typeof opts.end === 'number') {
                        var start = typeof opts.start === 'number' ? opts.start : 0;
                        var end = typeof opts.end === 'number' ? opts.end + 1 : undefined;
                        data = typeof data === 'string' ? data.slice(start, end) : data.slice(start, end);
                    }

                    var stream = new Stream.Readable({
                        read: function() {}
                    });
                    stream.path = path;
                    process.nextTick(function() {
                        stream.push(data);
                        stream.push(null);
                    });
                    return stream;
                },
                createWriteStream: function(path, options) {
                    var Stream = require('stream');
                    var opts = options || {};
                    var flags = opts.flags || 'w';
                    var appendMode = flags.indexOf('a') !== -1;

                    if (appendMode) {
                        if (!fs.existsSync(path)) fs.writeFileSync(path, '');
                    } else {
                        fs.writeFileSync(path, '');
                    }

                    var writable = new Stream.Writable({
                        write: function(chunk, encoding, callback) {
                            try {
                                var value = typeof chunk === 'string'
                                    ? chunk
                                    : Buffer.from(chunk);
                                fs.appendFileSync(path, value, { encoding: encoding || opts.encoding || 'utf8' });
                                writable.bytesWritten += Buffer.from(value).length;
                                callback();
                            } catch (error) {
                                callback(error);
                            }
                        }
                    });

                    writable.path = path;
                    writable.fd = path;
                    writable.bytesWritten = 0;
                    writable.close = function(callback) {
                        if (callback) this.once('close', callback);
                        this.end();
                        return this;
                    };
                    writable.on('finish', function() {
                        writable.emit('close');
                    });
                    return writable;
                },
                watch: function(path, options, listener) {
                    var EventEmitter = require('events');
                    var watcher = new EventEmitter();
                    watcher.close = function() {
                        watcher.emit('close');
                    };
                    watcher.ref = function() { return watcher; };
                    watcher.unref = function() { return watcher; };
                    if (typeof options === 'function') listener = options;
                    if (listener) watcher.on('change', listener);
                    return watcher;
                },
                constants: {
                    F_OK: 0, R_OK: 4, W_OK: 2, X_OK: 1,
                },
                promises: {
                    readFile: function(path, options) {
                        return asyncValue(
                            typeof __fsReadFileAsync === 'function'
                                ? function(token) {
                                    var encoding = typeof options === 'string' ? options : (options && options.encoding);
                                    __fsReadFileAsync(path, encoding || '', token);
                                }
                                : null,
                            function() {
                            return fs.readFileSync(path, options);
                            }
                        );
                    },
                    writeFile: function(path, data, options) {
                        if (typeof data === 'string') {
                            return asyncValue(
                                typeof __fsWriteFileAsync === 'function'
                                    ? function(token) {
                                        __fsWriteFileAsync(path, data, token);
                                    }
                                    : null,
                                function() {
                                    fs.writeFileSync(path, data, options);
                                }
                            );
                        }
                        return asyncResult(function() {
                            fs.writeFileSync(path, data, options);
                        });
                    },
                    appendFile: function(path, data, options) {
                        if (typeof data === 'string') {
                            return asyncValue(
                                typeof __fsAppendFileAsync === 'function'
                                    ? function(token) { __fsAppendFileAsync(path, data, token); }
                                    : null,
                                function() {
                                    fs.appendFileSync(path, data, options);
                                }
                            );
                        }
                        return asyncResult(function() {
                            fs.appendFileSync(path, data, options);
                        });
                    },
                    stat: function(path) {
                        return asyncValue(
                            typeof __fsStatAsync === 'function'
                                ? function(token) { __fsStatAsync(path, token); }
                                : null,
                            function() {
                            return fs.statSync(path);
                            }
                        ).then(function(value) {
                            return value && typeof value.isFile === 'boolean' ? makeStatResult({ value: value }) : value;
                        });
                    },
                    access: function(path) {
                        return asyncValue(
                            typeof __fsAccessAsync === 'function'
                                ? function(token) { __fsAccessAsync(path, token); }
                                : null,
                            function() {
                            fs.accessSync(path);
                            }
                        );
                    },
                    mkdir: function(path, options) {
                        return asyncValue(
                            typeof __fsMkdirAsync === 'function'
                                ? function(token) {
                                    var recursive = typeof options === 'object' ? (options.recursive || false) : false;
                                    __fsMkdirAsync(path, recursive, token);
                                }
                                : null,
                            function() {
                            fs.mkdirSync(path, options);
                            }
                        );
                    },
                    readdir: function(path, options) {
                        return asyncValue(
                            typeof __fsReaddirAsync === 'function'
                                ? function(token) {
                                    var withFileTypes = !!(options && typeof options === 'object' && options.withFileTypes === true);
                                    __fsReaddirAsync(path, withFileTypes, token);
                                }
                                : null,
                            function() {
                                return fs.readdirSync(path, options);
                            }
                        ).then(function(value) {
                            if (options && typeof options === 'object' && options.withFileTypes === true) {
                                if (Array.isArray(value)) {
                                    return value.map(function(entry) { return makeDirent(path, entry); });
                                }
                                return fs.readdirSync(path, options);
                            }
                            return value;
                        });
                    },
                    unlink: function(path) {
                        return asyncValue(
                            typeof __fsUnlinkAsync === 'function'
                                ? function(token) { __fsUnlinkAsync(path, token); }
                                : null,
                            function() {
                            fs.unlinkSync(path);
                            }
                        );
                    },
                    rmdir: function(path) {
                        return asyncValue(
                            typeof __fsRmdirAsync === 'function'
                                ? function(token) { __fsRmdirAsync(path, token); }
                                : null,
                            function() {
                            fs.rmdirSync(path);
                            }
                        );
                    },
                    rename: function(oldPath, newPath) {
                        return asyncValue(
                            typeof __fsRenameAsync === 'function'
                                ? function(token) { __fsRenameAsync(oldPath, newPath, token); }
                                : null,
                            function() {
                            fs.renameSync(oldPath, newPath);
                            }
                        );
                    },
                    realpath: function(path) {
                        return asyncValue(
                            typeof __fsRealpathAsync === 'function'
                                ? function(token) { __fsRealpathAsync(path, token); }
                                : null,
                            function() {
                            return fs.realpathSync(path);
                            }
                        );
                    },
                    readlink: function(path) {
                        return asyncValue(
                            typeof __fsReadlinkAsync === 'function'
                                ? function(token) { __fsReadlinkAsync(path, token); }
                                : null,
                            function() {
                                return fs.readlinkSync(path);
                            }
                        );
                    },
                    symlink: function(target, path) {
                        return asyncValue(
                            typeof __fsSymlinkAsync === 'function'
                                ? function(token) { __fsSymlinkAsync(target, path, token); }
                                : null,
                            function() {
                                fs.symlinkSync(target, path);
                            }
                        );
                    },
                    chmod: function(path, mode) {
                        return asyncValue(
                            typeof __fsChmodAsync === 'function'
                                ? function(token) { __fsChmodAsync(path, mode, token); }
                                : null,
                            function() {
                            fs.chmodSync(path, mode);
                            }
                        );
                    },
                    lstat: function(path) {
                        return asyncValue(
                            typeof __fsLstatAsync === 'function'
                                ? function(token) { __fsLstatAsync(path, token); }
                                : null,
                            function() {
                            return fs.lstatSync(path);
                            }
                        ).then(function(value) {
                            return value && typeof value.isFile === 'boolean' ? makeStatResult({ value: value }) : value;
                        });
                    },
                    link: function(existingPath, newPath) {
                        return asyncValue(
                            typeof __fsLinkAsync === 'function'
                                ? function(token) { __fsLinkAsync(existingPath, newPath, token); }
                                : null,
                            function() {
                                fs.linkSync(existingPath, newPath);
                            }
                        );
                    },
                    mkdtemp: function(prefix, options) {
                        return asyncValue(
                            typeof __fsMkdtempAsync === 'function'
                                ? function(token) { __fsMkdtempAsync(prefix, token); }
                                : null,
                            function() {
                                return fs.mkdtempSync(prefix, options);
                            }
                        ).then(function(value) {
                            if (options === 'buffer' || (options && options.encoding === 'buffer')) {
                                return Buffer.from(value);
                            }
                            return value;
                        });
                    },
                    utimes: function(path, atime, mtime) {
                        var mtimeMs = mtime instanceof Date ? mtime.getTime() : Number(mtime) * 1000;
                        return asyncValue(
                            typeof __fsUtimesAsync === 'function'
                                ? function(token) { __fsUtimesAsync(path, mtimeMs, token); }
                                : null,
                            function() {
                                fs.utimesSync(path, atime, mtime);
                            }
                        );
                    },
                    rm: function(path) {
                        var options = arguments.length > 1 ? arguments[1] : undefined;
                        return asyncValue(
                            typeof __fsRmAsync === 'function'
                                ? function(token) {
                                    var recursive = !!(options && options.recursive);
                                    var force = !!(options && options.force);
                                    __fsRmAsync(path, recursive, force, token);
                                }
                                : null,
                            function() {
                                fs.rmSync(path, options);
                            }
                        );
                    },
                    copyFile: function(src, dest) {
                        return asyncValue(
                            typeof __fsCopyFileAsync === 'function'
                                ? function(token) { __fsCopyFileAsync(src, dest, token); }
                                : null,
                            function() {
                            fs.copyFileSync(src, dest);
                            }
                        );
                    },
                    truncate: function(path, length) {
                        return asyncValue(
                            typeof __fsTruncateAsync === 'function'
                                ? function(token) { __fsTruncateAsync(path, typeof length === 'number' ? length : 0, token); }
                                : null,
                            function() {
                                fs.truncateSync(path, length);
                            }
                        );
                    },
                    open: function(path, flags) {
                        return asyncValue(
                            typeof __fsOpenAsync === 'function'
                                ? function(token) { __fsOpenAsync(path, flags || 'r', token); }
                                : null,
                            function() {
                            return createFileHandle(path, flags);
                            }
                        ).then(function(value) {
                            if (value && typeof value.path === 'string') {
                                return createFileHandle(value.path, value.flags || flags, true);
                            }
                            return value;
                        });
                    },
                },
            };

            if (!globalThis.__nodeModules) globalThis.__nodeModules = {};
            __nodeModules.fs = fs;
            fs.realpathSync.native = fs.realpathSync;
            fs.promises.realpath.native = fs.promises.realpath;
        })();