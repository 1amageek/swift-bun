        (function() {
            function createAbortError(message) {
                var text = message || 'The operation was aborted.';
                if (typeof DOMException === 'function') {
                    return new DOMException(text, 'AbortError');
                }
                var error = new Error(text);
                error.name = 'AbortError';
                return error;
            }

            function getStreamModule() {
                if (globalThis.__nodeModules && __nodeModules.stream) return __nodeModules.stream;
                if (globalThis.__readableStream) return globalThis.__readableStream;
                if (typeof require === 'function') return require('stream');
                throw new Error('stream module is not available');
            }

            function bodyToText(body) {
                if (body === undefined || body === null) return '';
                if (typeof body === 'string') return body;
                if (typeof Buffer !== 'undefined' && Buffer.isBuffer && Buffer.isBuffer(body)) {
                    return body.toString('utf8');
                }
                if (body instanceof Uint8Array) {
                    return new TextDecoder().decode(body);
                }
                if (body instanceof ArrayBuffer) {
                    return new TextDecoder().decode(new Uint8Array(body));
                }
                return String(body);
            }

            function chunkToBuffer(chunk) {
                if (chunk == null) return null;
                if (typeof Buffer !== 'undefined' && Buffer.isBuffer && Buffer.isBuffer(chunk)) {
                    return chunk;
                }
                if (chunk instanceof Uint8Array) {
                    return Buffer.from(chunk);
                }
                if (chunk instanceof ArrayBuffer) {
                    return Buffer.from(new Uint8Array(chunk));
                }
                if (typeof chunk === 'string') {
                    return Buffer.from(chunk, 'utf8');
                }
                return Buffer.from(String(chunk), 'utf8');
            }

            function normalizeHeaders(init) {
                var map = {};
                if (!init) return map;
                if (typeof globalThis.Headers === 'function' && init instanceof globalThis.Headers) {
                    init.forEach(function(value, key) {
                        map[key.toLowerCase()] = String(value);
                    });
                    return map;
                }
                if (Array.isArray(init)) {
                    for (var index = 0; index < init.length; index++) {
                        map[String(init[index][0]).toLowerCase()] = String(init[index][1]);
                    }
                    return map;
                }
                for (var key in init) {
                    map[key.toLowerCase()] = String(init[key]);
                }
                return map;
            }

            function sanitizeResponseHeaders(headers) {
                var sanitized = {};
                for (var key in headers) {
                    sanitized[key] = headers[key];
                }
                delete sanitized['content-encoding'];
                delete sanitized['content-length'];
                delete sanitized['transfer-encoding'];
                return sanitized;
            }

            async function pumpResponseBody(body, target) {
                if (!body) {
                    target.complete = true;
                    target.end();
                    return;
                }

                if (typeof body.getReader === 'function') {
                    var reader = body.getReader();
                    while (true) {
                        var step = await reader.read();
                        if (step.done) break;
                        var buffer = chunkToBuffer(step.value);
                        if (buffer && buffer.length > 0) {
                            target.write(buffer);
                        }
                    }
                    target.complete = true;
                    target.end();
                    return;
                }

                if (typeof body[Symbol.asyncIterator] === 'function') {
                    for await (var chunk of body) {
                        var iterBuffer = chunkToBuffer(chunk);
                        if (iterBuffer && iterBuffer.length > 0) {
                            target.write(iterBuffer);
                        }
                    }
                    target.complete = true;
                    target.end();
                    return;
                }

                var text = bodyToText(body);
                var fallback = chunkToBuffer(text);
                if (fallback && fallback.length > 0) {
                    target.write(fallback);
                }
                target.complete = true;
                target.end();
            }

            function createIncomingMessage(method, response, statusCodes) {
                var Stream = getStreamModule();
                var headers = {};
                if (response.headers && typeof response.headers.forEach === 'function') {
                    response.headers.forEach(function(value, key) {
                        headers[key.toLowerCase()] = String(value);
                    });
                }
                headers = sanitizeResponseHeaders(headers);

                var incoming = new Stream.PassThrough();
                incoming.statusCode = response.status;
                incoming.statusMessage = statusCodes[response.status] || response.statusText || '';
                incoming.headers = headers;
                incoming.rawHeaders = [];
                for (var key in headers) {
                    incoming.rawHeaders.push(key, String(headers[key]));
                }
                incoming.trailers = {};
                incoming.complete = false;
                incoming.aborted = false;
                incoming.url = response.url || '';
                incoming.httpVersion = '1.1';
                incoming.socket = {
                    destroy: function() {},
                    setKeepAlive: function() {},
                    setNoDelay: function() {},
                    pause: function() {},
                    resume: function() {},
                };

                queueMicrotask(function() {
                    (async function() {
                        try {
                            if (method === 'HEAD') {
                                incoming.complete = true;
                                incoming.end();
                                return;
                            }
                            await pumpResponseBody(response.body, incoming);
                        } catch (error) {
                            incoming.destroy(error);
                        }
                    })();
                });

                return incoming;
            }

            function makeRequestFunction(defaultProtocol, statusCodes) {
                return function(urlOrOptions, optionsOrCallback, callback) {
                    var Stream = getStreamModule();
                    var options = {};
                    var responseCallback;

                    if (typeof urlOrOptions === 'string') {
                        var parsed = new URL(urlOrOptions);
                        options.hostname = parsed.hostname;
                        options.port = parsed.port;
                        options.path = parsed.pathname + parsed.search;
                        options.protocol = parsed.protocol;
                        if (typeof optionsOrCallback === 'function') {
                            responseCallback = optionsOrCallback;
                        } else {
                            Object.assign(options, optionsOrCallback || {});
                            responseCallback = callback;
                        }
                    } else {
                        options = urlOrOptions || {};
                        responseCallback = typeof optionsOrCallback === 'function' ? optionsOrCallback : callback;
                    }

                    var protocol = options.protocol || defaultProtocol;
                    var hostname = options.hostname || options.host || 'localhost';
                    var port = options.port ? ':' + options.port : '';
                    var path = options.path || '/';
                    var url = protocol + '//' + hostname + port + path;
                    var method = (options.method || 'GET').toUpperCase();
                    var headers = normalizeHeaders(options.headers || {});
                    var bodyChunks = [];
                    var started = false;
                    var finished = false;
                    var timeoutHandle = null;
                    var abortController = typeof AbortController === 'function' ? new AbortController() : null;

                    var req = new Stream.Writable({
                        write: function(chunk, encoding, done) {
                            bodyChunks.push(bodyToText(chunk));
                            done();
                        },
                        final: function(done) {
                            startRequest();
                            done();
                        },
                    });

                    req._headers = headers;
                    req._aborted = false;
                    req._timeoutMs = 0;
                    req._socket = {
                        destroy: function() {},
                        setKeepAlive: function() {},
                        setNoDelay: function() {},
                        pause: function() {},
                        resume: function() {},
                    };

                    function clearRequestTimeout() {
                        if (timeoutHandle !== null) {
                            clearTimeout(timeoutHandle);
                            timeoutHandle = null;
                        }
                    }

                    function failRequest(error) {
                        if (finished) return;
                        finished = true;
                        clearRequestTimeout();
                        req.emit('error', error);
                    }

                    function completeRequest(response) {
                        if (finished) return;
                        finished = true;
                        clearRequestTimeout();
                        if (typeof responseCallback === 'function') responseCallback(response);
                        req.emit('response', response);
                    }

                    function startRequest() {
                        if (started || req._aborted) return;
                        started = true;

                        if (req._timeoutMs > 0) {
                            timeoutHandle = setTimeout(function() {
                                req.emit('timeout');
                                if (abortController) abortController.abort();
                                failRequest(createAbortError('The operation timed out.'));
                            }, req._timeoutMs);
                        }

                        queueMicrotask(function() {
                            req.emit('socket', req._socket);
                        });

                        var init = {
                            method: method,
                            headers: req._headers,
                        };

                        var body = bodyChunks.join('');
                        if (body && method !== 'GET' && method !== 'HEAD') {
                            init.body = body;
                        }
                        if (abortController) {
                            init.signal = abortController.signal;
                        }

                        globalThis.fetch(url, init).then(function(response) {
                            completeRequest(createIncomingMessage(method, response, statusCodes));
                        }, function(error) {
                            failRequest(error instanceof Error ? error : new Error(String(error)));
                        });
                    }

                    req.setHeader = function(name, value) {
                        this._headers[String(name).toLowerCase()] = String(value);
                    };
                    req.getHeader = function(name) {
                        return this._headers[String(name).toLowerCase()];
                    };
                    req.removeHeader = function(name) {
                        delete this._headers[String(name).toLowerCase()];
                    };
                    req.abort = function() {
                        this._aborted = true;
                        if (abortController) abortController.abort();
                        failRequest(createAbortError());
                    };
                    req.destroy = function(error) {
                        this._aborted = true;
                        if (abortController) abortController.abort();
                        Stream.Writable.prototype.destroy.call(this, error);
                        if (error) {
                            failRequest(error);
                        }
                        return this;
                    };
                    req.setTimeout = function(ms, handler) {
                        this._timeoutMs = ms || 0;
                        if (typeof handler === 'function') this.on('timeout', handler);
                        return this;
                    };

                    return req;
                };
            }

            var STATUS_CODES = {
                200: 'OK', 201: 'Created', 204: 'No Content',
                301: 'Moved Permanently', 302: 'Found', 304: 'Not Modified',
                400: 'Bad Request', 401: 'Unauthorized', 403: 'Forbidden', 404: 'Not Found',
                500: 'Internal Server Error', 502: 'Bad Gateway', 503: 'Service Unavailable',
            };

            var http = {
                request: makeRequestFunction('http:', STATUS_CODES),
                get: function(url, options, cb) {
                    var req = http.request(url, options, cb);
                    req.end();
                    return req;
                },
                createServer: function(options, requestListener) {
                    if (typeof options === 'function') {
                        requestListener = options;
                        options = {};
                    }
                    var EventEmitter = __nodeModules.events && (__nodeModules.events.EventEmitter || __nodeModules.events);
                    var Stream = getStreamModule();
                    var server = new EventEmitter();
                    server._id = (http.__nextServerID = (http.__nextServerID || 0) + 1);
                    server._host = '127.0.0.1';
                    server._port = 0;
                    server.listening = false;
                    http.__servers = http.__servers || Object.create(null);
                    http.__servers[server._id] = server;

                    if (typeof requestListener === 'function') {
                        server.on('request', requestListener);
                    }

                    server.listen = function(port, host, callback) {
                        if (typeof host === 'function') {
                            callback = host;
                            host = undefined;
                        }
                        if (callback) server.once('listening', callback);
                        server._host = host || '127.0.0.1';
                        __httpListen(server._id, server._host, port | 0, 256);
                        return server;
                    };
                    server.close = function(callback) {
                        if (callback) server.once('close', callback);
                        __httpCloseServer(server._id);
                        return server;
                    };
                    server.address = function() {
                        return { address: server._host, family: server._host.indexOf(':') !== -1 ? 'IPv6' : 'IPv4', port: server._port };
                    };

                    if (!globalThis.__swiftBunHTTPDispatch) {
                        globalThis.__swiftBunHTTPDispatch = function(event) {
                            if (!event || !event.type) return;
                            var currentServer = http.__servers && http.__servers[event.serverID];
                            if (!currentServer) return;
                            if (event.type === 'listening') {
                                currentServer.listening = true;
                                currentServer._host = event.host || currentServer._host;
                                currentServer._port = event.port;
                                currentServer.emit('listening');
                                return;
                            }
                            if (event.type === 'close') {
                                currentServer.listening = false;
                                currentServer.emit('close');
                                delete http.__servers[event.serverID];
                                return;
                            }
                            if (event.type === 'error') {
                                currentServer.emit('error', new Error(event.message || 'http server error'));
                                return;
                            }
                            if (event.type === 'request') {
                                var request = new Stream.PassThrough();
                                request.method = event.method;
                                request.url = event.url;
                                request.headers = event.headers || {};
                                request.httpVersion = '1.1';
                                request.socket = {
                                    remoteAddress: event.remoteAddress || '',
                                    remotePort: event.remotePort || 0,
                                    localAddress: event.localAddress || currentServer._host,
                                    localPort: event.localPort || currentServer._port,
                                    destroy: function() {}
                                };
                                var responseChunks = [];
                                var headers = {};
                                var statusCode = 200;
                                var response = new EventEmitter();
                                response.statusCode = 200;
                                response.headersSent = false;
                                response.setHeader = function(name, value) {
                                    headers[String(name)] = String(value);
                                };
                                response.getHeader = function(name) {
                                    return headers[String(name)];
                                };
                                response.removeHeader = function(name) {
                                    delete headers[String(name)];
                                };
                                response.writeHead = function(code, head) {
                                    statusCode = code;
                                    response.statusCode = code;
                                    if (head) {
                                        for (var key in head) headers[key] = String(head[key]);
                                    }
                                    return response;
                                };
                                response.write = function(chunk, encoding, callback) {
                                    if (typeof encoding === 'function') {
                                        callback = encoding;
                                        encoding = undefined;
                                    }
                                    responseChunks.push(chunkToBuffer(chunk, encoding));
                                    if (callback) callback();
                                    return true;
                                };
                                response.end = function(chunk, encoding, callback) {
                                    if (typeof chunk === 'function') {
                                        callback = chunk;
                                        chunk = undefined;
                                        encoding = undefined;
                                    } else if (typeof encoding === 'function') {
                                        callback = encoding;
                                        encoding = undefined;
                                    }
                                    if (chunk != null) responseChunks.push(chunkToBuffer(chunk, encoding));
                                    var body = Buffer.concat(responseChunks.filter(Boolean));
                                    __httpRespond(event.requestID, statusCode, JSON.stringify(headers), Array.from(body));
                                    response.headersSent = true;
                                    response.emit('finish');
                                    if (callback) callback();
                                    return response;
                                };

                                currentServer.emit('request', request, response);
                                var bodyBuffer = Buffer.from(event.body || []);
                                if (bodyBuffer.length > 0) request.write(bodyBuffer);
                                request.end();
                            }
                        };
                    }
                    return server;
                },
                Agent: function() {},
                globalAgent: {},
                METHODS: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS'],
                STATUS_CODES: STATUS_CODES,
            };
            http.Agent.prototype = { destroy: function() {} };

            var https = {
                request: makeRequestFunction('https:', STATUS_CODES),
                get: function(url, options, cb) {
                    var req = https.request(url, options, cb);
                    req.end();
                    return req;
                },
                Agent: http.Agent,
                globalAgent: {},
            };

            if (!globalThis.__nodeModules) globalThis.__nodeModules = {};
            __nodeModules.http = http;
            __nodeModules.https = https;
        })();
