@preconcurrency import JavaScriptCore
import Foundation

/// `node:http` and `node:https` implementation bridging to `URLSession`.
///
/// Provides `globalThis.fetch` and basic `http.request` / `https.request`.
enum NodeHTTP {
    static func install(in context: JSContext) {
        // Native fetch bridge: performs HTTP requests via URLSession
        let fetchBlock: @convention(block) (String, String, JSValue, JSValue) -> Void = { urlString, optionsJSON, resolveCallback, rejectCallback in
            guard let url = URL(string: urlString) else {
                rejectCallback.call(withArguments: ["Invalid URL: \(urlString)"])
                return
            }

            var request = URLRequest(url: url)

            // Parse options
            if let data = optionsJSON.data(using: .utf8),
               let options = try? JSONSerialization.jsonObject(with: data) as? [String: Any] {
                request.httpMethod = (options["method"] as? String)?.uppercased() ?? "GET"

                if let headers = options["headers"] as? [String: Any] {
                    for (key, value) in headers {
                        request.setValue("\(value)", forHTTPHeaderField: key)
                    }
                }

                if let body = options["body"] as? String {
                    request.httpBody = body.data(using: .utf8)
                }

                if let signal = options["signal"] as? [String: Any],
                   let timeout = signal["timeout"] as? Double {
                    request.timeoutInterval = timeout / 1000.0
                }
            }

            let task = URLSession.shared.dataTask(with: request) { data, response, error in
                if let error {
                    rejectCallback.call(withArguments: [error.localizedDescription])
                    return
                }

                guard let httpResponse = response as? HTTPURLResponse else {
                    rejectCallback.call(withArguments: ["Invalid response"])
                    return
                }

                let body = data.flatMap { String(data: $0, encoding: .utf8) } ?? ""
                var headerDict: [String: String] = [:]
                for (key, value) in httpResponse.allHeaderFields {
                    headerDict["\(key)".lowercased()] = "\(value)"
                }

                let headerJSON: String
                do {
                    let headerData = try JSONSerialization.data(withJSONObject: headerDict)
                    headerJSON = String(data: headerData, encoding: .utf8) ?? "{}"
                } catch {
                    headerJSON = "{}"
                }

                resolveCallback.call(withArguments: [
                    httpResponse.statusCode,
                    httpResponse.url?.absoluteString ?? urlString,
                    headerJSON,
                    body,
                ])
            }
            task.resume()
        }
        context.setObject(fetchBlock, forKeyedSubscript: "__nativeFetch" as NSString)

        context.evaluateScript("""
        (function() {
            // Headers polyfill
            function Headers(init) {
                this._map = {};
                if (init) {
                    if (init instanceof Headers) {
                        var self = this;
                        init.forEach(function(value, key) { self._map[key] = value; });
                    } else if (Array.isArray(init)) {
                        for (var i = 0; i < init.length; i++) this._map[init[i][0].toLowerCase()] = init[i][1];
                    } else {
                        for (var key in init) this._map[key.toLowerCase()] = String(init[key]);
                    }
                }
            }
            Headers.prototype.get = function(name) { return this._map[name.toLowerCase()] || null; };
            Headers.prototype.set = function(name, value) { this._map[name.toLowerCase()] = String(value); };
            Headers.prototype.has = function(name) { return name.toLowerCase() in this._map; };
            Headers.prototype.delete = function(name) { delete this._map[name.toLowerCase()]; };
            Headers.prototype.append = function(name, value) {
                var key = name.toLowerCase();
                if (this._map[key]) this._map[key] += ', ' + value;
                else this._map[key] = String(value);
            };
            Headers.prototype.forEach = function(cb) {
                for (var key in this._map) cb(this._map[key], key, this);
            };
            Headers.prototype.entries = function() {
                var pairs = [];
                for (var key in this._map) pairs.push([key, this._map[key]]);
                return pairs[Symbol.iterator]();
            };
            Headers.prototype.keys = function() {
                var keys = Object.keys(this._map);
                return keys[Symbol.iterator]();
            };
            Headers.prototype.values = function() {
                var vals = [];
                for (var key in this._map) vals.push(this._map[key]);
                return vals[Symbol.iterator]();
            };
            Headers.prototype[Symbol.iterator] = Headers.prototype.entries;

            if (!globalThis.Headers) globalThis.Headers = Headers;

            // Response polyfill
            function Response(body, init) {
                init = init || {};
                this._body = body || '';
                this.status = init.status || 200;
                this.ok = this.status >= 200 && this.status < 300;
                this.statusText = init.statusText || '';
                this.headers = new Headers(init.headers || {});
                this.url = init.url || '';
                this.type = 'default';
                this.redirected = false;
                this.bodyUsed = false;
            }
            Response.prototype.text = function() {
                this.bodyUsed = true;
                return Promise.resolve(this._body);
            };
            Response.prototype.json = function() {
                this.bodyUsed = true;
                var body = this._body;
                return Promise.resolve(JSON.parse(body));
            };
            Response.prototype.arrayBuffer = function() {
                this.bodyUsed = true;
                var enc = new TextEncoder();
                return Promise.resolve(enc.encode(this._body).buffer);
            };
            Response.prototype.blob = function() {
                return this.arrayBuffer();
            };
            Response.prototype.clone = function() {
                return new Response(this._body, {
                    status: this.status,
                    statusText: this.statusText,
                    headers: this.headers,
                    url: this.url,
                });
            };
            Response.json = function(data, init) {
                init = init || {};
                var headers = new Headers(init.headers || {});
                headers.set('content-type', 'application/json');
                return new Response(JSON.stringify(data), {
                    status: init.status || 200,
                    statusText: init.statusText || '',
                    headers: headers,
                });
            };

            if (!globalThis.Response) globalThis.Response = Response;

            // Request polyfill
            function Request(input, init) {
                init = init || {};
                if (typeof input === 'string') {
                    this.url = input;
                } else {
                    this.url = input.url;
                    init = Object.assign({}, input, init);
                }
                this.method = (init.method || 'GET').toUpperCase();
                this.headers = new Headers(init.headers || {});
                this.body = init.body || null;
                this.signal = init.signal || null;
            }

            if (!globalThis.Request) globalThis.Request = Request;

            // fetch implementation
            globalThis.fetch = function fetch(input, init) {
                var url, options;
                if (typeof input === 'string') {
                    url = input;
                    options = init || {};
                } else if (input instanceof Request) {
                    url = input.url;
                    options = {
                        method: input.method,
                        headers: {},
                        body: input.body,
                    };
                    input.headers.forEach(function(v, k) { options.headers[k] = v; });
                    if (init) Object.assign(options, init);
                } else {
                    url = String(input);
                    options = init || {};
                }

                var fetchOptions = {
                    method: options.method || 'GET',
                    headers: {},
                    body: options.body || undefined,
                };

                if (options.headers) {
                    if (options.headers instanceof Headers) {
                        options.headers.forEach(function(v, k) { fetchOptions.headers[k] = v; });
                    } else {
                        for (var k in options.headers) fetchOptions.headers[k] = options.headers[k];
                    }
                }

                return new Promise(function(resolve, reject) {
                    __nativeFetch(url, JSON.stringify(fetchOptions), function(statusCode, responseURL, headersJSON, body) {
                        var parsedHeaders = {};
                        try { parsedHeaders = JSON.parse(headersJSON); } catch(e) {}
                        resolve(new Response(body, {
                            status: statusCode,
                            headers: parsedHeaders,
                            url: responseURL,
                        }));
                    }, function(error) {
                        reject(new TypeError('fetch failed: ' + error));
                    });
                });
            };

            // http / https module shims
            function makeRequestFunction(defaultProtocol) {
                return function(urlOrOptions, optionsOrCallback, callback) {
                    // Normalize arguments
                    var options = {};
                    var cb;

                    if (typeof urlOrOptions === 'string') {
                        var parsed = new URL(urlOrOptions);
                        options.hostname = parsed.hostname;
                        options.port = parsed.port;
                        options.path = parsed.pathname + parsed.search;
                        options.protocol = parsed.protocol;
                        if (typeof optionsOrCallback === 'function') {
                            cb = optionsOrCallback;
                        } else {
                            Object.assign(options, optionsOrCallback || {});
                            cb = callback;
                        }
                    } else {
                        options = urlOrOptions || {};
                        cb = typeof optionsOrCallback === 'function' ? optionsOrCallback : callback;
                    }

                    var protocol = options.protocol || defaultProtocol;
                    var hostname = options.hostname || options.host || 'localhost';
                    var port = options.port ? ':' + options.port : '';
                    var path = options.path || '/';
                    var url = protocol + '//' + hostname + port + path;

                    var method = (options.method || 'GET').toUpperCase();
                    var headers = options.headers || {};
                    var body = '';

                    // ClientRequest-like object
                    var req = {
                        _headers: headers,
                        _body: '',
                        _ended: false,

                        setHeader: function(name, value) { this._headers[name] = value; },
                        getHeader: function(name) { return this._headers[name]; },
                        removeHeader: function(name) { delete this._headers[name]; },
                        write: function(chunk) { this._body += chunk; },
                        end: function(data) {
                            if (data) this._body += data;
                            this._ended = true;

                            var fetchOptions = {
                                method: method,
                                headers: this._headers,
                            };
                            if (this._body && method !== 'GET' && method !== 'HEAD') {
                                fetchOptions.body = this._body;
                            }

                            fetch(url, fetchOptions).then(function(response) {
                                return response.text().then(function(text) {
                                    // IncomingMessage-like response
                                    var res = {
                                        statusCode: response.status,
                                        headers: {},
                                        _data: text,
                                        _listeners: {},
                                        on: function(event, handler) {
                                            if (!this._listeners[event]) this._listeners[event] = [];
                                            this._listeners[event].push(handler);
                                            if (event === 'data') {
                                                var self = this;
                                                Promise.resolve().then(function() {
                                                    self._listeners['data'].forEach(function(h) { h(self._data); });
                                                    if (self._listeners['end']) {
                                                        self._listeners['end'].forEach(function(h) { h(); });
                                                    }
                                                });
                                            }
                                            return this;
                                        },
                                        setEncoding: function() { return this; },
                                    };

                                    response.headers.forEach(function(v, k) { res.headers[k] = v; });

                                    if (cb) cb(res);
                                    if (req._listeners && req._listeners['response']) {
                                        req._listeners['response'].forEach(function(h) { h(res); });
                                    }
                                });
                            }).catch(function(err) {
                                if (req._listeners && req._listeners['error']) {
                                    req._listeners['error'].forEach(function(h) { h(err); });
                                }
                            });
                        },
                        on: function(event, handler) {
                            if (!this._listeners) this._listeners = {};
                            if (!this._listeners[event]) this._listeners[event] = [];
                            this._listeners[event].push(handler);
                            return this;
                        },
                        abort: function() {},
                        destroy: function() {},
                        setTimeout: function() { return this; },
                    };

                    return req;
                };
            }

            var http = {
                request: makeRequestFunction('http:'),
                get: function(url, options, cb) {
                    var req = http.request(url, options, cb);
                    req.end();
                    return req;
                },
                Agent: function() {},
                globalAgent: {},
                METHODS: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS'],
                STATUS_CODES: {
                    200: 'OK', 201: 'Created', 204: 'No Content',
                    301: 'Moved Permanently', 302: 'Found', 304: 'Not Modified',
                    400: 'Bad Request', 401: 'Unauthorized', 403: 'Forbidden', 404: 'Not Found',
                    500: 'Internal Server Error', 502: 'Bad Gateway', 503: 'Service Unavailable',
                },
            };
            http.Agent.prototype = { destroy: function() {} };

            var https = {
                request: makeRequestFunction('https:'),
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
        """)
    }
}
