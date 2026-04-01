        (function() {
            function unwrapFSResult(result, path, operation) {
                if (!result || typeof result !== 'object') {
                    throw new Error('EIO: invalid fs result for ' + operation + " '" + path + "'");
                }
                if (result.error) {
                    throw new Error(result.error);
                }
                return result.value;
            }

            function toUint8Array(data) {
                if (data instanceof Uint8Array) return data;
                if (Array.isArray(data)) return Uint8Array.from(data);
                if (data instanceof ArrayBuffer) return new Uint8Array(data);
                if (ArrayBuffer.isView(data)) return new Uint8Array(data.buffer, data.byteOffset, data.byteLength);
                return new TextEncoder().encode(String(data));
            }

            function cloneArrayBuffer(buffer, byteOffset, byteLength) {
                var start = byteOffset || 0;
                var end = byteLength === undefined ? buffer.byteLength : start + byteLength;
                return buffer.slice(start, end);
            }

            function basename(path) {
                var parts = String(path).split('/');
                return parts.length === 0 ? String(path) : parts[parts.length - 1];
            }

            function byteLengthOf(data) {
                if (typeof data === 'string') return new TextEncoder().encode(data).byteLength;
                if (data instanceof Uint8Array) return data.byteLength;
                if (ArrayBuffer.isView(data)) return data.byteLength;
                if (data instanceof ArrayBuffer) return data.byteLength;
                if (typeof Blob === 'function' && data instanceof Blob) return data.size;
                return new TextEncoder().encode(String(data)).byteLength;
            }

            function isBunFileLike(value) {
                return value && typeof value === 'object' && typeof value._path === 'string' &&
                    typeof value.text === 'function' && typeof value.arrayBuffer === 'function';
            }

            function readAsText(data) {
                if (typeof data === 'string') return Promise.resolve(data);
                if (data instanceof Uint8Array) return Promise.resolve(new TextDecoder().decode(data));
                if (ArrayBuffer.isView(data)) {
                    return Promise.resolve(new TextDecoder().decode(new Uint8Array(data.buffer, data.byteOffset, data.byteLength)));
                }
                if (data instanceof ArrayBuffer) return Promise.resolve(new TextDecoder().decode(new Uint8Array(data)));
                if (typeof Blob === 'function' && data instanceof Blob && typeof data.text === 'function') {
                    return data.text();
                }
                if (isBunFileLike(data)) {
                    return data.text();
                }
                return Promise.resolve(String(data));
            }

            function normalizeWritableData(data) {
                if (typeof data === 'string') return Promise.resolve(data);
                if (data instanceof Uint8Array) return Promise.resolve(data);
                if (ArrayBuffer.isView(data)) {
                    return Promise.resolve(new Uint8Array(data.buffer, data.byteOffset, data.byteLength));
                }
                if (data instanceof ArrayBuffer) return Promise.resolve(new Uint8Array(data));
                if (typeof Blob === 'function' && data instanceof Blob && typeof data.arrayBuffer === 'function') {
                    return data.arrayBuffer().then(function(buffer) { return new Uint8Array(buffer); });
                }
                if (isBunFileLike(data) && typeof data.bytes === 'function') {
                    return data.bytes();
                }
                return Promise.resolve(String(data));
            }

            function inferContentType(path) {
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
            }

            Bun.file = function(path) {
                var file = {
                    _path: path,
                    name: basename(path),
                    type: inferContentType(path),
                    exists: function() {
                        return Promise.resolve(__fsExistsSync(path));
                    },
                    stat: function() {
                        return unwrapFSResult(__fsStatSync(path), path, 'stat');
                    },
                    text: function() {
                        return new Promise(function(resolve, reject) {
                            try {
                                var content = unwrapFSResult(__fsReadFileSync(path, 'utf-8'), path, 'readFile');
                                resolve(content);
                            } catch (error) {
                                reject(error);
                            }
                        });
                    },
                    json: function() {
                        return this.text().then(function(text) {
                            return JSON.parse(text);
                        });
                    },
                    arrayBuffer: function() {
                        return new Promise(function(resolve, reject) {
                            try {
                                var bytes = unwrapFSResult(__fsReadFileSync(path, ''), path, 'readFile');
                                var normalized = toUint8Array(bytes);
                                resolve(cloneArrayBuffer(normalized.buffer, normalized.byteOffset, normalized.byteLength));
                            } catch (error) {
                                reject(error);
                            }
                        });
                    },
                    bytes: function() {
                        return new Promise(function(resolve, reject) {
                            try {
                                var bytes = unwrapFSResult(__fsReadFileSync(path, ''), path, 'readFile');
                                resolve(toUint8Array(bytes));
                            } catch (error) {
                                reject(error);
                            }
                        });
                    },
                    stream: function() {
                        var self = this;
                        return new ReadableStream({
                            start: function(controller) {
                                self.bytes().then(function(bytes) {
                                    controller.enqueue(bytes);
                                    controller.close();
                                }, function(error) {
                                    controller.error(error);
                                });
                            }
                        });
                    },
                    slice: function(begin, end) {
                        var self = this;
                        return {
                            async arrayBuffer() {
                                var bytes = await self.bytes();
                                var sliced = bytes.slice(begin || 0, end == null ? bytes.length : end);
                                return cloneArrayBuffer(sliced.buffer, sliced.byteOffset, sliced.byteLength);
                            },
                            async bytes() {
                                var bytes = await self.bytes();
                                return bytes.slice(begin || 0, end == null ? bytes.length : end);
                            },
                            async text() {
                                var bytes = await this.bytes();
                                return new TextDecoder().decode(bytes);
                            },
                            async json() {
                                return JSON.parse(await this.text());
                            },
                            stream: function() {
                                var sliced = this;
                                return new ReadableStream({
                                    start: function(controller) {
                                        sliced.bytes().then(function(bytes) {
                                            controller.enqueue(bytes);
                                            controller.close();
                                        }, function(error) {
                                            controller.error(error);
                                        });
                                    }
                                });
                            },
                            get size() {
                                try {
                                    var stat = self.stat();
                                    var start = begin || 0;
                                    var finish = end == null ? stat.size : end;
                                    return Math.max(0, finish - start);
                                } catch (error) {
                                    return 0;
                                }
                            },
                            type: self.type
                        };
                    },
                    writer: function() {
                        var chunks = [];
                        return {
                            write: function(data) {
                                chunks.push(toUint8Array(data));
                                return Promise.resolve();
                            },
                            flush: function() {
                                return Promise.resolve();
                            },
                            end: function(data) {
                                if (data !== undefined) {
                                    chunks.push(toUint8Array(data));
                                }
                                var total = 0;
                                for (var i = 0; i < chunks.length; i++) total += chunks[i].byteLength;
                                var merged = new Uint8Array(total);
                                var offset = 0;
                                for (var i = 0; i < chunks.length; i++) {
                                    merged.set(chunks[i], offset);
                                    offset += chunks[i].byteLength;
                                }
                                try {
                                    require('node:fs').writeFileSync(path, merged);
                                    return Promise.resolve(total);
                                } catch (error) {
                                    return Promise.reject(error);
                                }
                            }
                        };
                    },
                    toString: function() {
                        return path;
                    },
                };

                Object.defineProperty(file, 'size', {
                    enumerable: true,
                    configurable: true,
                    get: function() {
                        try {
                            return file.stat().size;
                        } catch (error) {
                            return 0;
                        }
                    }
                });

                return file;
            };

            Bun.write = function(destination, data) {
                return new Promise(function(resolve, reject) {
                    var path = typeof destination === 'string' ? destination : destination._path;
                    normalizeWritableData(data).then(function(payload) {
                        try {
                            require('node:fs').writeFileSync(path, payload);
                            resolve(byteLengthOf(payload));
                        } catch (error) {
                            reject(error);
                        }
                    }, reject);
                });
            };

            Bun.stdin = {
                stream: function() {
                    return new ReadableStream({
                        async start(controller) {
                            try {
                                for await (var chunk of process.stdin) {
                                    if (typeof chunk === 'string') controller.enqueue(new TextEncoder().encode(chunk));
                                    else controller.enqueue(toUint8Array(chunk));
                                }
                                controller.close();
                            } catch (error) {
                                controller.error(error);
                            }
                        }
                    });
                },
                text: async function() {
                    var chunks = [];
                    for await (var chunk of process.stdin) {
                        chunks.push(typeof chunk === 'string' ? chunk : new TextDecoder().decode(toUint8Array(chunk)));
                    }
                    return chunks.join('');
                },
            };

            Bun.stdout = {
                write: function(data) {
                    var text = typeof data === 'string' ? data : new TextDecoder().decode(toUint8Array(data));
                    process.stdout.write(text);
                    return byteLengthOf(data);
                },
            };

            Bun.stderr = {
                write: function(data) {
                    var text = typeof data === 'string' ? data : new TextDecoder().decode(toUint8Array(data));
                    process.stderr.write(text);
                    return byteLengthOf(data);
                },
            };
        })();