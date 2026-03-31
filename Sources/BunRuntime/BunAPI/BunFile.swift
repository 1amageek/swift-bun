@preconcurrency import JavaScriptCore

/// `Bun.file()` and `Bun.write()` implementation.
enum BunFile {
    static func install(in context: JSContext) {
        context.evaluateScript("""
        (function() {
            Bun.file = function(path) {
                return {
                    _path: path,
                    name: path,
                    size: (function() {
                        try {
                            var stat = __fsStatSync(path);
                            return stat ? stat.size : 0;
                        } catch(e) { return 0; }
                    })(),
                    type: (function() {
                        var ext = path.split('.').pop().toLowerCase();
                        var types = {
                            'txt': 'text/plain',
                            'json': 'application/json',
                            'js': 'application/javascript',
                            'mjs': 'application/javascript',
                            'html': 'text/html',
                            'css': 'text/css',
                            'png': 'image/png',
                            'jpg': 'image/jpeg',
                            'jpeg': 'image/jpeg',
                            'gif': 'image/gif',
                            'svg': 'image/svg+xml',
                            'pdf': 'application/pdf',
                            'xml': 'application/xml',
                        };
                        return types[ext] || 'application/octet-stream';
                    })(),
                    exists: function() {
                        return Promise.resolve(__fsExistsSync(path));
                    },
                    text: function() {
                        return new Promise(function(resolve, reject) {
                            var content = __fsReadFileSync(path, 'utf-8');
                            if (content === null || content === undefined) {
                                reject(new Error("ENOENT: no such file or directory, open '" + path + "'"));
                            } else {
                                resolve(content);
                            }
                        });
                    },
                    json: function() {
                        return this.text().then(function(text) {
                            return JSON.parse(text);
                        });
                    },
                    arrayBuffer: function() {
                        return this.text().then(function(text) {
                            return new TextEncoder().encode(text).buffer;
                        });
                    },
                    bytes: function() {
                        return this.text().then(function(text) {
                            return new TextEncoder().encode(text);
                        });
                    },
                    stream: function() {
                        throw new Error('Bun.file().stream() is not yet supported in swift-bun');
                    },
                    slice: function(begin, end) {
                        throw new Error('Bun.file().slice() is not yet supported in swift-bun');
                    },
                    writer: function() {
                        throw new Error('Bun.file().writer() is not yet supported in swift-bun');
                    },
                };
            };

            Bun.write = function(destination, data) {
                return new Promise(function(resolve, reject) {
                    var path = typeof destination === 'string' ? destination : destination._path;
                    var content;
                    if (typeof data === 'string') {
                        content = data;
                    } else if (data instanceof Uint8Array || ArrayBuffer.isView(data)) {
                        content = new TextDecoder().decode(data);
                    } else if (data instanceof ArrayBuffer) {
                        content = new TextDecoder().decode(new Uint8Array(data));
                    } else {
                        content = String(data);
                    }
                    var res = __fsWriteFileSync(path, content);
                    if (res.error) {
                        reject(new Error(res.error));
                    } else {
                        resolve(new TextEncoder().encode(content).length);
                    }
                });
            };

            Bun.stdin = {
                stream: function() {
                    throw new Error('Bun.stdin is not supported in swift-bun');
                },
                text: function() {
                    return Promise.reject(new Error('Bun.stdin is not supported in swift-bun'));
                },
            };

            Bun.stdout = {
                write: function(data) {
                    process.stdout.write(typeof data === 'string' ? data : new TextDecoder().decode(data));
                    return data.length || 0;
                },
            };

            Bun.stderr = {
                write: function(data) {
                    process.stderr.write(typeof data === 'string' ? data : new TextDecoder().decode(data));
                    return data.length || 0;
                },
            };
        })();
        """)
    }
}
