(function() {
    "use strict";

    if (typeof __nativeWebSocketConnect !== "function") {
        return;
    }

    var sockets = Object.create(null);
    var nextSocketID = 1;
    var protocolPattern = /^[!#$%&'*+\-.^_`|~0-9A-Za-z]+$/;

    function isProtocolList(value) {
        return typeof value === "string" || Array.isArray(value);
    }

    function makeDOMException(message, name) {
        if (typeof DOMException === "function") {
            return new DOMException(message, name);
        }

        var error = new Error(message);
        error.name = name;
        return error;
    }

    function normalizeProtocols(value) {
        if (value === undefined || value === null) {
            return [];
        }
        if (typeof value === "string") {
            value = value ? [value] : [];
        }
        if (!Array.isArray(value)) {
            throw new TypeError("WebSocket protocols must be a string or array");
        }

        var normalized = [];
        var seen = Object.create(null);
        for (var index = 0; index < value.length; index++) {
            var protocol = String(value[index]);
            if (!protocolPattern.test(protocol)) {
                throw new SyntaxError("Invalid WebSocket protocol");
            }
            if (seen[protocol]) {
                throw new SyntaxError("Duplicate WebSocket protocol");
            }
            seen[protocol] = true;
            normalized.push(protocol);
        }
        return normalized;
    }

    function normalizeHeaders(value) {
        if (value === undefined || value === null) {
            return {};
        }

        var normalized = {};
        if (typeof value.forEach === "function") {
            value.forEach(function(headerValue, headerName) {
                normalized[String(headerName)] = String(headerValue);
            });
            return normalized;
        }
        if (Array.isArray(value)) {
            for (var pairIndex = 0; pairIndex < value.length; pairIndex++) {
                var pair = value[pairIndex];
                if (!Array.isArray(pair) || pair.length < 2) {
                    throw new TypeError("WebSocket headers entries must be [name, value] pairs");
                }
                normalized[String(pair[0])] = String(pair[1]);
            }
            return normalized;
        }
        if (typeof value !== "object") {
            throw new TypeError("WebSocket headers must be an object, Headers, or entry list");
        }

        var keys = Object.keys(value);
        for (var index = 0; index < keys.length; index++) {
            var key = keys[index];
            normalized[String(key)] = String(value[key]);
        }
        return normalized;
    }

    function parseWebSocketArguments(protocolsOrOptions, maybeOptions) {
        var options = {};
        var protocols = [];

        if (isProtocolList(protocolsOrOptions)) {
            protocols = normalizeProtocols(protocolsOrOptions);
            if (maybeOptions && typeof maybeOptions === "object") {
                options = maybeOptions;
            }
        } else if (protocolsOrOptions && typeof protocolsOrOptions === "object") {
            options = protocolsOrOptions;
            protocols = normalizeProtocols(options.protocols);
        } else if (protocolsOrOptions !== undefined) {
            throw new TypeError("Invalid WebSocket constructor arguments");
        }

        return {
            protocols: protocols,
            headers: normalizeHeaders(options.headers),
            proxy: options.proxy,
            tls: options.tls
        };
    }

    function validateURL(url) {
        var parsed = new URL(String(url));
        if (parsed.protocol !== "ws:" && parsed.protocol !== "wss:") {
            throw new TypeError("WebSocket URL must use ws: or wss:");
        }
        return parsed.toString();
    }

    function toByteArray(data) {
        if (typeof Buffer !== "undefined" && Buffer.isBuffer && Buffer.isBuffer(data)) {
            return Array.from(data);
        }
        if (data instanceof Uint8Array) {
            return Array.from(data);
        }
        if (ArrayBuffer.isView(data)) {
            return Array.from(new Uint8Array(data.buffer, data.byteOffset, data.byteLength));
        }
        if (data instanceof ArrayBuffer) {
            return Array.from(new Uint8Array(data));
        }
        throw new TypeError("Unsupported WebSocket payload");
    }

    function byteLengthOfString(value) {
        return new TextEncoder().encode(String(value)).byteLength;
    }

    function isValidCloseCode(code) {
        return code === 1000 || (code >= 3000 && code <= 4999);
    }

    function invokePropertyHandler(target, type, event) {
        var handler = target["on" + type];
        if (typeof handler === "function") {
            handler.call(target, event);
        }
    }

    function dispatchSocketEvent(target, type, event) {
        invokePropertyHandler(target, type, event);
        return EventTarget.prototype.dispatchEvent.call(target, event);
    }

    function createEvent(type) {
        return new Event(type);
    }

    function createMessageEvent(data) {
        var event = createEvent("message");
        event.data = data;
        return event;
    }

    function createErrorEvent(message) {
        var error = new Error(message || "WebSocket error");
        var event = createEvent("error");
        event.message = error.message;
        event.error = error;
        return event;
    }

    function createCloseEvent(code, reason, wasClean) {
        var event = createEvent("close");
        event.code = code;
        event.reason = reason || "";
        event.wasClean = !!wasClean;
        return event;
    }

    function failSendBecauseState(socket) {
        throw makeDOMException("WebSocket is not open", "InvalidStateError");
    }

    function toIncomingBinary(socket, bytes) {
        var payload = new Uint8Array(bytes || []);
        if (socket.binaryType === "arraybuffer") {
            return payload.buffer.slice(payload.byteOffset, payload.byteOffset + payload.byteLength);
        }
        return typeof Blob === "function" ? new Blob([payload]) : payload;
    }

    function WebSocket(url, protocolsOrOptions, maybeOptions) {
        if (!(this instanceof WebSocket)) {
            throw new TypeError("Failed to construct 'WebSocket': Please use the 'new' operator.");
        }

        EventTarget.call(this);

        var parsedURL = validateURL(url);
        var normalized = parseWebSocketArguments(protocolsOrOptions, maybeOptions);
        void normalized.proxy;
        void normalized.tls;

        this._id = nextSocketID++;
        this.url = parsedURL;
        this.readyState = WebSocket.CONNECTING;
        this.protocol = "";
        this.extensions = "";
        this._binaryType = "blob";
        this.bufferedAmount = 0;
        this.onopen = null;
        this.onmessage = null;
        this.onerror = null;
        this.onclose = null;
        this.onpong = null;

        sockets[this._id] = this;
        __nativeWebSocketConnect(
            this._id,
            parsedURL,
            JSON.stringify(normalized.protocols),
            JSON.stringify(normalized.headers)
        );
    }

    WebSocket.prototype = Object.create(EventTarget.prototype);
    WebSocket.prototype.constructor = WebSocket;

    WebSocket.CONNECTING = 0;
    WebSocket.OPEN = 1;
    WebSocket.CLOSING = 2;
    WebSocket.CLOSED = 3;
    WebSocket.prototype.CONNECTING = WebSocket.CONNECTING;
    WebSocket.prototype.OPEN = WebSocket.OPEN;
    WebSocket.prototype.CLOSING = WebSocket.CLOSING;
    WebSocket.prototype.CLOSED = WebSocket.CLOSED;
    Object.defineProperty(WebSocket.prototype, "binaryType", {
        configurable: true,
        enumerable: true,
        get: function() {
            return this._binaryType;
        },
        set: function(value) {
            if (value === "blob" || value === "arraybuffer") {
                this._binaryType = value;
            }
        }
    });

    WebSocket.prototype.send = function(data) {
        if (this.readyState !== WebSocket.OPEN) {
            failSendBecauseState(this);
        }

        if (typeof data === "string") {
            __nativeWebSocketSendText(this._id, data);
            return;
        }

        __nativeWebSocketSendBinary(this._id, toByteArray(data));
    };

    WebSocket.prototype.close = function(code, reason) {
        if (this.readyState === WebSocket.CLOSING || this.readyState === WebSocket.CLOSED) {
            return;
        }

        var closeCode = 1000;
        if (code !== undefined) {
            closeCode = Number(code);
            if (!Number.isInteger(closeCode) || !isValidCloseCode(closeCode)) {
                throw makeDOMException("The close code must be 1000 or between 3000 and 4999.", "InvalidAccessError");
            }
        } else if (reason !== undefined && String(reason) !== "") {
            throw makeDOMException("A close reason requires a valid close code.", "InvalidAccessError");
        }

        var closeReason = reason === undefined ? "" : String(reason);
        if (byteLengthOfString(closeReason) > 123) {
            throw makeDOMException("The close reason must be 123 bytes or fewer.", "SyntaxError");
        }

        this.readyState = WebSocket.CLOSING;
        __nativeWebSocketClose(
            this._id,
            closeCode,
            closeReason
        );
    };

    WebSocket.prototype.ping = function() {
        if (this.readyState !== WebSocket.OPEN) {
            return;
        }
        __nativeWebSocketPing(this._id);
    };

    globalThis.__swiftBunWebSocketDispatch = function(event) {
        if (!event || typeof event.socketID !== "number") {
            return;
        }

        var socket = sockets[event.socketID];
        if (!socket) {
            return;
        }

        switch (event.type) {
        case "open":
            socket.readyState = WebSocket.OPEN;
            socket.protocol = event.protocol || "";
            dispatchSocketEvent(socket, "open", createEvent("open"));
            return;
        case "message":
            if (event.kind === "binary") {
                dispatchSocketEvent(socket, "message", createMessageEvent(toIncomingBinary(socket, event.bytes)));
                return;
            }
            dispatchSocketEvent(socket, "message", createMessageEvent(event.text || ""));
            return;
        case "pong":
            dispatchSocketEvent(socket, "pong", createEvent("pong"));
            return;
        case "error":
            dispatchSocketEvent(socket, "error", createErrorEvent(event.message));
            return;
        case "close":
            socket.readyState = WebSocket.CLOSED;
            delete sockets[event.socketID];
            dispatchSocketEvent(
                socket,
                "close",
                createCloseEvent(event.code || 1000, event.reason || "", !!event.wasClean)
            );
            return;
        default:
            return;
        }
    };

    globalThis.WebSocket = WebSocket;
})();
