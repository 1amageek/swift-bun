// Web API polyfills for JavaScriptCore (evaluateScript context).
//
// JSCore provides only ECMAScript language features (Promise, Symbol, etc.)
// but no Web APIs. This bundle provides the Web APIs that Bun-built bundles
// (including cli.js) expect to exist.
//
// Bundled with esbuild and loaded by BunProcess before ESMResolver.

// --- Web Streams API (full spec implementation) ---
require("web-streams-polyfill/polyfill");

// --- Event / EventTarget / CustomEvent ---
if (typeof globalThis.Event === "undefined") {
  function Event(type, options) {
    options = options || {};
    this.type = type;
    this.bubbles = !!options.bubbles;
    this.cancelable = !!options.cancelable;
    this.composed = !!options.composed;
    this.defaultPrevented = false;
    this.target = null;
    this.currentTarget = null;
    this.eventPhase = 0;
    this.timeStamp = Date.now();
    this.isTrusted = false;
  }
  Event.prototype.preventDefault = function () {
    if (this.cancelable) this.defaultPrevented = true;
  };
  Event.prototype.stopPropagation = function () {};
  Event.prototype.stopImmediatePropagation = function () {};
  Event.NONE = 0;
  Event.CAPTURING_PHASE = 1;
  Event.AT_TARGET = 2;
  Event.BUBBLING_PHASE = 3;
  globalThis.Event = Event;
}

if (typeof globalThis.EventTarget === "undefined") {
  function EventTarget() {
    this._listeners = {};
  }
  EventTarget.prototype.addEventListener = function (type, fn, options) {
    if (!fn) return;
    if (!this._listeners[type]) this._listeners[type] = [];
    var once = options && (options.once || options === true);
    this._listeners[type].push({ fn: fn, once: once });
  };
  EventTarget.prototype.removeEventListener = function (type, fn) {
    if (!this._listeners[type]) return;
    this._listeners[type] = this._listeners[type].filter(function (e) {
      return e.fn !== fn;
    });
  };
  EventTarget.prototype.dispatchEvent = function (event) {
    event.target = this;
    event.currentTarget = this;
    var entries = (this._listeners[event.type] || []).slice();
    var toRemove = [];
    for (var i = 0; i < entries.length; i++) {
      entries[i].fn.call(this, event);
      if (entries[i].once) toRemove.push(entries[i]);
    }
    for (var j = 0; j < toRemove.length; j++) {
      this.removeEventListener(event.type, toRemove[j].fn);
    }
    return !event.defaultPrevented;
  };
  globalThis.EventTarget = EventTarget;
}

if (typeof globalThis.CustomEvent === "undefined") {
  function CustomEvent(type, options) {
    Event.call(this, type, options);
    this.detail =
      options && options.detail !== undefined ? options.detail : null;
  }
  CustomEvent.prototype = Object.create(Event.prototype);
  CustomEvent.prototype.constructor = CustomEvent;
  globalThis.CustomEvent = CustomEvent;
}

// --- Blob ---
if (typeof globalThis.Blob === "undefined") {
  globalThis.Blob = function Blob(parts, options) {
    options = options || {};
    this.type = options.type || "";
    this._parts = parts || [];
    var size = 0;
    for (var i = 0; i < this._parts.length; i++) {
      var p = this._parts[i];
      if (typeof p === "string") size += p.length;
      else if (p instanceof ArrayBuffer) size += p.byteLength;
      else if (p instanceof Uint8Array) size += p.byteLength;
      else if (p instanceof Blob) size += p.size;
    }
    this.size = size;
  };
  Blob.prototype.text = function () {
    var result = "";
    for (var i = 0; i < this._parts.length; i++) {
      var p = this._parts[i];
      if (typeof p === "string") result += p;
    }
    return Promise.resolve(result);
  };
  Blob.prototype.arrayBuffer = function () {
    return this.text().then(function (t) {
      var enc = new TextEncoder();
      return enc.encode(t).buffer;
    });
  };
  Blob.prototype.slice = function (start, end, type) {
    return new Blob([], { type: type || this.type });
  };
  Blob.prototype.stream = function () {
    var blob = this;
    return new ReadableStream({
      start: function (controller) {
        blob.text().then(function (t) {
          controller.enqueue(new TextEncoder().encode(t));
          controller.close();
        });
      },
    });
  };
}

// --- File ---
if (typeof globalThis.File === "undefined") {
  globalThis.File = function File(parts, name, options) {
    Blob.call(this, parts, options);
    this.name = name;
    this.lastModified = (options && options.lastModified) || Date.now();
  };
  File.prototype = Object.create(Blob.prototype);
  File.prototype.constructor = File;
}

// --- FormData ---
if (typeof globalThis.FormData === "undefined") {
  globalThis.FormData = function FormData() {
    this._entries = [];
  };
  FormData.prototype.append = function (name, value, filename) {
    this._entries.push({ name: name, value: value, filename: filename });
  };
  FormData.prototype.get = function (name) {
    for (var i = 0; i < this._entries.length; i++) {
      if (this._entries[i].name === name) return this._entries[i].value;
    }
    return null;
  };
  FormData.prototype.getAll = function (name) {
    return this._entries
      .filter(function (e) {
        return e.name === name;
      })
      .map(function (e) {
        return e.value;
      });
  };
  FormData.prototype.has = function (name) {
    return this._entries.some(function (e) {
      return e.name === name;
    });
  };
  FormData.prototype.set = function (name, value, filename) {
    this._entries = this._entries.filter(function (e) {
      return e.name !== name;
    });
    this.append(name, value, filename);
  };
  FormData.prototype.delete = function (name) {
    this._entries = this._entries.filter(function (e) {
      return e.name !== name;
    });
  };
  FormData.prototype.forEach = function (cb) {
    for (var i = 0; i < this._entries.length; i++) {
      cb(this._entries[i].value, this._entries[i].name, this);
    }
  };
  FormData.prototype.entries = function () {
    var arr = this._entries.map(function (e) {
      return [e.name, e.value];
    });
    return arr[Symbol.iterator]();
  };
  FormData.prototype[Symbol.iterator] = FormData.prototype.entries;
}

// --- WebSocket (stub — operations throw, but class exists for instanceof checks) ---
if (typeof globalThis.WebSocket === "undefined") {
  function WebSocket(url, protocols) {
    EventTarget.call(this);
    this.url = url;
    this.readyState = WebSocket.CONNECTING;
    this.protocol = "";
    this.extensions = "";
    this.binaryType = "blob";
    this.bufferedAmount = 0;
    this.onopen = null;
    this.onclose = null;
    this.onmessage = null;
    this.onerror = null;
  }
  WebSocket.prototype = Object.create(EventTarget.prototype);
  WebSocket.prototype.constructor = WebSocket;
  WebSocket.prototype.send = function () {};
  WebSocket.prototype.close = function () {
    this.readyState = WebSocket.CLOSED;
  };
  WebSocket.CONNECTING = 0;
  WebSocket.OPEN = 1;
  WebSocket.CLOSING = 2;
  WebSocket.CLOSED = 3;
  globalThis.WebSocket = WebSocket;
}

// --- MessageChannel / MessagePort ---
if (typeof globalThis.MessageChannel === "undefined") {
  function MessagePort() {
    EventTarget.call(this);
    this.onmessage = null;
    this.onmessageerror = null;
  }
  MessagePort.prototype = Object.create(EventTarget.prototype);
  MessagePort.prototype.constructor = MessagePort;
  MessagePort.prototype.postMessage = function (data) {
    var self = this;
    if (self._other && self._other.onmessage) {
      Promise.resolve().then(function () {
        self._other.onmessage({ data: data });
      });
    }
  };
  MessagePort.prototype.start = function () {};
  MessagePort.prototype.close = function () {};

  function MessageChannel() {
    this.port1 = new MessagePort();
    this.port2 = new MessagePort();
    this.port1._other = this.port2;
    this.port2._other = this.port1;
  }

  globalThis.MessagePort = MessagePort;
  globalThis.MessageChannel = MessageChannel;
}

// --- Worker (stub) ---
if (typeof globalThis.Worker === "undefined") {
  globalThis.Worker = function Worker() {
    throw new Error("Worker is not supported in swift-bun");
  };
}

// --- XMLHttpRequest (stub) ---
if (typeof globalThis.XMLHttpRequest === "undefined") {
  globalThis.XMLHttpRequest = function XMLHttpRequest() {
    this.readyState = 0;
    this.status = 0;
    this.responseText = "";
  };
  XMLHttpRequest.prototype.open = function () {};
  XMLHttpRequest.prototype.send = function () {};
  XMLHttpRequest.prototype.setRequestHeader = function () {};
  XMLHttpRequest.prototype.abort = function () {};
  XMLHttpRequest.UNSENT = 0;
  XMLHttpRequest.OPENED = 1;
  XMLHttpRequest.HEADERS_RECEIVED = 2;
  XMLHttpRequest.LOADING = 3;
  XMLHttpRequest.DONE = 4;
}

// --- crypto (Web Crypto API stub) ---
if (typeof globalThis.crypto === "undefined") {
  globalThis.crypto = {
    getRandomValues: function (arr) {
      for (var i = 0; i < arr.length; i++) {
        arr[i] = Math.floor(Math.random() * 256);
      }
      return arr;
    },
    randomUUID: function () {
      var bytes = new Uint8Array(16);
      crypto.getRandomValues(bytes);
      bytes[6] = (bytes[6] & 0x0f) | 0x40;
      bytes[8] = (bytes[8] & 0x3f) | 0x80;
      var hex = [];
      for (var i = 0; i < 16; i++)
        hex.push(("0" + bytes[i].toString(16)).slice(-2));
      return (
        hex.slice(0, 4).join("") +
        "-" +
        hex.slice(4, 6).join("") +
        "-" +
        hex.slice(6, 8).join("") +
        "-" +
        hex.slice(8, 10).join("") +
        "-" +
        hex.slice(10).join("")
      );
    },
    subtle: {
      digest: function (algo, data) {
        return Promise.resolve(new ArrayBuffer(32));
      },
      importKey: function () {
        return Promise.resolve({});
      },
      sign: function () {
        return Promise.resolve(new ArrayBuffer(32));
      },
      verify: function () {
        return Promise.resolve(true);
      },
      encrypt: function () {
        return Promise.resolve(new ArrayBuffer(0));
      },
      decrypt: function () {
        return Promise.resolve(new ArrayBuffer(0));
      },
    },
  };
}

// --- structuredClone ---
if (typeof globalThis.structuredClone === "undefined") {
  globalThis.structuredClone = function (obj) {
    if (obj === undefined) return undefined;
    return JSON.parse(JSON.stringify(obj));
  };
}

// --- navigator ---
if (typeof globalThis.navigator === "undefined") {
  globalThis.navigator = {
    userAgent: "swift-bun",
    platform: "darwin",
    language: "en",
    languages: ["en"],
  };
}

// --- Symbol.dispose / Symbol.asyncDispose ---
// Required for TC39 Explicit Resource Management (`using` declarations)
if (!Symbol.dispose) {
  Symbol.dispose = Symbol.for("Symbol.dispose");
}
if (!Symbol.asyncDispose) {
  Symbol.asyncDispose = Symbol.for("Symbol.asyncDispose");
}
