// Bootstrap: global aliases and process basics needed by npm packages
if (typeof globalThis.global === "undefined") globalThis.global = globalThis;
if (typeof globalThis.self === "undefined") globalThis.self = globalThis;

// Minimal process object needed by readable-stream before ModuleBootstrap runs
if (typeof globalThis.process === "undefined") globalThis.process = {};
if (typeof process.nextTick === "undefined") {
  process.nextTick = function (fn) {
    var args = Array.prototype.slice.call(arguments, 1);
    Promise.resolve().then(function () { fn.apply(null, args); });
  };
}
if (typeof process.env === "undefined") process.env = {};

// Web API and Node.js polyfills for JavaScriptCore (evaluateScript context).
//
// JSCore provides only ECMAScript language features. This bundle provides:
// 1. Web APIs (ReadableStream, Event, Blob, etc.)
// 2. Node.js stream infrastructure (readable-stream)
// 3. process.stdin/stdout/stderr as proper Stream instances
//
// Bundled with esbuild and loaded by BunProcess before ModuleBootstrap.

// =============================================================================
// Web Streams API (WHATWG spec)
// =============================================================================
require("web-streams-polyfill/polyfill");

if (!globalThis.__swiftBunPackages) {
  var __swiftBunStructuredClonePackage = require("@ungap/structured-clone");
  var __swiftBunYAMLPackage = require("js-yaml");
  globalThis.__swiftBunPackages = {
    structuredClone:
      __swiftBunStructuredClonePackage && __swiftBunStructuredClonePackage.default
        ? __swiftBunStructuredClonePackage.default
        : __swiftBunStructuredClonePackage,
    semver: require("semver"),
    YAML: {
      parse: function (input) {
        return __swiftBunYAMLPackage.load(String(input || ""));
      },
      stringify: function (value) {
        return __swiftBunYAMLPackage.dump(value);
      },
    },
    picomatch: require("picomatch"),
  };
}

// =============================================================================
// Node.js Streams (Layer 0 ownership)
// =============================================================================
(function () {
  function EventEmitter() {
    this._events = {};
    this._maxListeners = 10;
  }
  EventEmitter.prototype.on = function (event, fn) {
    if (!this._events[event]) this._events[event] = [];
    this._events[event].push(fn);
    return this;
  };
  EventEmitter.prototype.addListener = EventEmitter.prototype.on;
  EventEmitter.prototype.once = function (event, fn) {
    var self = this;
    function wrapper() {
      self.removeListener(event, wrapper);
      fn.apply(this, arguments);
    }
    wrapper._original = fn;
    return this.on(event, wrapper);
  };
  EventEmitter.prototype.off = function (event, fn) {
    return this.removeListener(event, fn);
  };
  EventEmitter.prototype.removeListener = function (event, fn) {
    if (!this._events[event]) return this;
    this._events[event] = this._events[event].filter(function (listener) {
      return listener !== fn && listener._original !== fn;
    });
    return this;
  };
  EventEmitter.prototype.removeAllListeners = function (event) {
    if (event) delete this._events[event];
    else this._events = {};
    return this;
  };
  EventEmitter.prototype.emit = function (event) {
    if (!this._events[event]) return false;
    var args = Array.prototype.slice.call(arguments, 1);
    var listeners = this._events[event].slice();
    for (var index = 0; index < listeners.length; index++) {
      listeners[index].apply(this, args);
    }
    return true;
  };
  EventEmitter.prototype.listeners = function (event) {
    return (this._events[event] || []).slice();
  };
  EventEmitter.prototype.listenerCount = function (event) {
    return (this._events[event] || []).length;
  };
  EventEmitter.prototype.setMaxListeners = function (n) {
    this._maxListeners = n;
    return this;
  };
  EventEmitter.prototype.getMaxListeners = function () {
    return this._maxListeners;
  };
  EventEmitter.prototype.rawListeners = EventEmitter.prototype.listeners;
  EventEmitter.prototype.prependListener = EventEmitter.prototype.on;
  EventEmitter.prototype.prependOnceListener = EventEmitter.prototype.once;
  EventEmitter.prototype.eventNames = function () {
    return Object.keys(this._events);
  };
  EventEmitter.defaultMaxListeners = 10;
  EventEmitter.listenerCount = function (emitter, event) {
    return emitter.listenerCount(event);
  };

  function Readable() {
    EventEmitter.call(this);
    this.readable = true;
    this.destroyed = false;
    this._readableState = {
      flowing: null,
      ended: false,
      buffer: [],
      encoding: null,
    };
  }
  Readable.prototype = Object.create(EventEmitter.prototype);
  Readable.prototype.constructor = Readable;
  Readable.prototype.read = function () {
    if (this._readableState.buffer.length === 0) return null;
    return this._readableState.buffer.shift();
  };
  Readable.prototype.pipe = function (dest) {
    var self = this;
    self.on("end", function () {
      dest.end();
    });
    self.on("data", function (chunk) {
      dest.write(chunk);
    });
    if (typeof self.resume === "function") {
      self.resume();
    }
    return dest;
  };
  Readable.prototype.unpipe = function () {
    return this;
  };
  Readable.prototype.resume = function () {
    this._readableState.flowing = true;
    while (this._readableState.buffer.length > 0) {
      this.emit("data", this._readableState.buffer.shift());
    }
    if (this._readableState.ended && this._readableState.buffer.length === 0) {
      this.emit("end");
    }
    return this;
  };
  Readable.prototype.pause = function () {
    this._readableState.flowing = false;
    return this;
  };
  Readable.prototype.setEncoding = function (encoding) {
    this._readableState.encoding = encoding || "utf8";
    return this;
  };
  Readable.prototype.destroy = function (error) {
    this.destroyed = true;
    if (error) this.emit("error", error);
    return this;
  };
  Readable.prototype.push = function (chunk) {
    if (chunk === null) {
      this._readableState.ended = true;
      if (this.listenerCount("readable") > 0) {
        this.emit("readable");
      }
      if (this._readableState.flowing !== false && this._readableState.buffer.length === 0) {
        this.emit("end");
      }
      return false;
    }

    if (this._readableState.flowing === false) {
      this._readableState.buffer.push(chunk);
      if (this.listenerCount("readable") > 0) {
        this.emit("readable");
      }
      return true;
    }

    if (this.listenerCount("data") === 0) {
      this._readableState.buffer.push(chunk);
      if (this.listenerCount("readable") > 0) {
        this.emit("readable");
      }
      return true;
    }

    if (this.listenerCount("readable") > 0) {
      this._readableState.buffer.push(chunk);
      this.emit("readable");
      return true;
    }

    this.emit("data", chunk);
    return true;
  };
  Readable.prototype[Symbol.asyncIterator] = function () {
    var self = this;
    var done = false;
    var waiting = null;
    var pendingError = null;

    function resolveNext(result) {
      if (!waiting) return;
      var current = waiting;
      waiting = null;
      current.resolve(result);
    }

    self.on("data", function (chunk) {
      if (waiting) {
        resolveNext({ value: chunk, done: false });
      }
    });
    self.on("end", function () {
      done = true;
      resolveNext({ value: undefined, done: true });
    });
    self.on("error", function (error) {
      done = true;
      if (waiting) {
        var current = waiting;
        waiting = null;
        current.reject(error);
      } else {
        pendingError = error;
      }
    });

    return {
      next: function () {
        var chunk = self.read();
        if (chunk !== null) return Promise.resolve({ value: chunk, done: false });
        if (pendingError) {
          var error = pendingError;
          pendingError = null;
          return Promise.reject(error);
        }
        if (done) return Promise.resolve({ value: undefined, done: true });
        return new Promise(function (resolve, reject) {
          waiting = { resolve: resolve, reject: reject };
          self.resume();
        });
      },
      return: function () {
        done = true;
        self.destroy();
        return Promise.resolve({ value: undefined, done: true });
      },
      [Symbol.asyncIterator]: function () {
        return this;
      },
    };
  };

  function Writable(options) {
    EventEmitter.call(this);
    this.writable = true;
    this.destroyed = false;
    this._writableState = { ended: false, finished: false };
    this._impl = options || {};
  }
  Writable.prototype = Object.create(EventEmitter.prototype);
  Writable.prototype.constructor = Writable;
  Writable.prototype.write = function (chunk, encoding, cb) {
    if (typeof encoding === "function") cb = encoding;
    if (typeof this._impl.write === "function") {
      this._impl.write(chunk, encoding, cb || function () {});
    } else if (cb) {
      cb();
    }
    return true;
  };
  Writable.prototype.end = function (chunk, encoding, cb) {
    if (chunk) this.write(chunk, encoding);
    if (typeof chunk === "function") cb = chunk;
    if (typeof encoding === "function") cb = encoding;
    if (typeof this._impl.final === "function") {
      this._impl.final(cb || function () {});
    }
    this._writableState.ended = true;
    this._writableState.finished = true;
    this.emit("finish");
    if (cb) cb();
    return this;
  };
  Writable.prototype.destroy = function (error) {
    this.destroyed = true;
    if (error) this.emit("error", error);
    return this;
  };
  Writable.prototype.cork = function () {};
  Writable.prototype.uncork = function () {};
  Writable.prototype.setDefaultEncoding = function () {
    return this;
  };

  function Duplex(options) {
    Readable.call(this, options);
    Writable.call(this, options);
  }
  Duplex.prototype = Object.create(Readable.prototype);
  Object.assign(Duplex.prototype, Writable.prototype);
  Duplex.prototype.constructor = Duplex;

  function Transform(options) {
    Duplex.call(this, options);
  }
  Transform.prototype = Object.create(Duplex.prototype);
  Transform.prototype.constructor = Transform;
  Transform.prototype._transform = function (chunk, encoding, cb) {
    cb(null, chunk);
  };

  function PassThrough(options) {
    Transform.call(this, options);
  }
  PassThrough.prototype = Object.create(Transform.prototype);
  PassThrough.prototype.constructor = PassThrough;
  PassThrough.prototype.write = function (chunk, encoding, cb) {
    this.push(chunk);
    if (typeof cb === "function") cb();
    return true;
  };
  PassThrough.prototype.end = function (chunk, encoding, cb) {
    if (chunk) this.write(chunk, encoding);
    this.push(null);
    this.emit("finish");
    if (typeof cb === "function") cb();
    return this;
  };

  function pipeline() {
    var streams = Array.prototype.slice.call(arguments);
    var callback = typeof streams[streams.length - 1] === "function" ? streams.pop() : null;
    var last = streams[streams.length - 1];
    if (callback) {
      last.on("finish", function () {
        callback(null);
      });
      last.on("error", function (error) {
        callback(error);
      });
    }
    for (var index = 0; index < streams.length - 1; index++) {
      streams[index].pipe(streams[index + 1]);
    }
    return last;
  }

  function finished(stream, callback) {
    stream.on("end", function () {
      callback(null);
    });
    stream.on("finish", function () {
      callback(null);
    });
    stream.on("error", function (error) {
      callback(error);
    });
  }

  var stream = {
    Readable: Readable,
    Writable: Writable,
    Duplex: Duplex,
    Transform: Transform,
    PassThrough: PassThrough,
    EventEmitter: EventEmitter,
    pipeline: pipeline,
    finished: finished,
    Stream: Readable,
  };
  stream.default = stream;

  globalThis.__readableStream = stream;
  if (!globalThis.__nodeModules) globalThis.__nodeModules = {};
  globalThis.__nodeModules.stream = stream;

  // =============================================================================
  // process.stdin — Readable stream backed by native sendInput()
  // =============================================================================
  var stdin = new Readable();

  // Default to utf-8 string mode (Node.js stdin is binary by default, but
  // cli.js and most consumers expect strings in stream-json mode)
  stdin.setEncoding("utf8");

  // Node.js compat properties
  stdin.fd = 0;
  stdin.isTTY = false;
  stdin.setRawMode = function () {
    return stdin;
  };

  // Native bridge: called from Swift's deliverStdin
  globalThis.__deliverStdinData = function (chunk) {
    if (chunk === null) {
      stdin.push(null); // EOF
    } else {
      stdin.push(chunk);
    }
  };

  // Attach to process (will be created by ModuleBootstrap if not exists)
  if (!globalThis.process) globalThis.process = {};
  globalThis.process.stdin = stdin;
})();

// =============================================================================
// stdin keep-alive semantics (bridged by Layer 2 through __stdinRef/__stdinUnref)
// =============================================================================
(function () {
  if (!globalThis.process || !globalThis.process.stdin) return;

  var stdin = globalThis.process.stdin;
  if (typeof stdin.listenerCount !== "function") return;
  var nativeRefed = false;
  var manualRefed = false;
  var listenerRefed = false;
  var iteratorRefs = 0;
  var resumeRefed = false;

  function nativeRef() {
    if (typeof globalThis.__stdinRef === "function") {
      globalThis.__stdinRef();
    }
  }

  function nativeUnref() {
    if (typeof globalThis.__stdinUnref === "function") {
      globalThis.__stdinUnref();
    }
  }

  function syncRefState() {
    var shouldRef = manualRefed || listenerRefed || iteratorRefs > 0 || resumeRefed;
    if (shouldRef && !nativeRefed) {
      nativeRefed = true;
      nativeRef();
    } else if (!shouldRef && nativeRefed) {
      nativeRefed = false;
      nativeUnref();
    }
  }

  function refreshListenerRef() {
    listenerRefed = stdin.listenerCount("data") > 0 || stdin.listenerCount("readable") > 0;
    syncRefState();
  }

  function releaseIteratorRef() {
    if (iteratorRefs > 0) {
      iteratorRefs -= 1;
      syncRefState();
    }
  }

  stdin.ref = function () {
    manualRefed = true;
    syncRefState();
    return stdin;
  };

  stdin.unref = function () {
    manualRefed = false;
    syncRefState();
    return stdin;
  };

  if (typeof stdin.resume === "function") {
    var origResume = stdin.resume;
    stdin.resume = function () {
      resumeRefed = true;
      syncRefState();
      return origResume.call(stdin);
    };
  }

  if (typeof stdin.pause === "function") {
    var origPause = stdin.pause;
    stdin.pause = function () {
      resumeRefed = false;
      syncRefState();
      return origPause.call(stdin);
    };
  }

  if (typeof stdin.on === "function") {
    var origOn = stdin.on;
    stdin.on = function (event, fn) {
      var result = origOn.call(stdin, event, fn);
      if (event === "data" || event === "readable") {
        refreshListenerRef();
      }
      return result;
    };
    stdin.addListener = stdin.on;
  }

  if (typeof stdin.once === "function") {
    var origOnce = stdin.once;
    stdin.once = function (event, fn) {
      var result = origOnce.call(stdin, event, fn);
      if (event === "data" || event === "readable") {
        refreshListenerRef();
      }
      return result;
    };
  }

  if (typeof stdin.prependListener === "function") {
    var origPrependListener = stdin.prependListener;
    stdin.prependListener = function (event, fn) {
      var result = origPrependListener.call(stdin, event, fn);
      if (event === "data" || event === "readable") {
        refreshListenerRef();
      }
      return result;
    };
  }

  if (typeof stdin.prependOnceListener === "function") {
    var origPrependOnceListener = stdin.prependOnceListener;
    stdin.prependOnceListener = function (event, fn) {
      var result = origPrependOnceListener.call(stdin, event, fn);
      if (event === "data" || event === "readable") {
        refreshListenerRef();
      }
      return result;
    };
  }

  if (typeof stdin.removeListener === "function") {
    var origRemoveListener = stdin.removeListener;
    stdin.removeListener = function (event, fn) {
      var result = origRemoveListener.call(stdin, event, fn);
      if (event === "data" || event === "readable") {
        refreshListenerRef();
      }
      return result;
    };
  }

  if (typeof stdin.off === "function") {
    stdin.off = function (event, fn) {
      return stdin.removeListener(event, fn);
    };
  }

  if (typeof stdin.removeAllListeners === "function") {
    var origRemoveAllListeners = stdin.removeAllListeners;
    stdin.removeAllListeners = function (event) {
      var result = origRemoveAllListeners.call(stdin, event);
      if (event === undefined || event === "data" || event === "readable") {
        refreshListenerRef();
      }
      return result;
    };
  }

  if (typeof stdin.on === "function") {
    stdin.on("end", function () {
      listenerRefed = false;
      iteratorRefs = 0;
      resumeRefed = false;
      syncRefState();
    });
  }

  var origIterator = stdin[Symbol.asyncIterator];
  if (origIterator) {
    stdin[Symbol.asyncIterator] = function () {
      iteratorRefs += 1;
      syncRefState();

      var iterator = origIterator.call(stdin);
      var released = false;

      function releaseOnce() {
        if (released) return;
        released = true;
        releaseIteratorRef();
      }

      return {
        next: function () {
          return Promise.resolve(iterator.next.apply(iterator, arguments)).then(
            function (result) {
              if (result && result.done) releaseOnce();
              return result;
            },
            function (error) {
              releaseOnce();
              throw error;
            }
          );
        },
        return: function () {
          releaseOnce();
          if (typeof iterator.return === "function") {
            return iterator.return.apply(iterator, arguments);
          }
          return Promise.resolve({ value: undefined, done: true });
        },
        throw: function () {
          releaseOnce();
          if (typeof iterator.throw === "function") {
            return iterator.throw.apply(iterator, arguments);
          }
          return Promise.reject(arguments[0]);
        },
        [Symbol.asyncIterator]: function () {
          return this;
        },
      };
    };
  }
})();

// =============================================================================
// process.stdout — Writable stream backed by native __nativeStdoutWrite
// =============================================================================
(function () {
  var Writable = globalThis.__readableStream.Writable;

  var stdout = new Writable({
    write: function (chunk, encoding, callback) {
      var str = typeof chunk === "string" ? chunk : chunk.toString();
      if (typeof globalThis.__nativeStdoutWrite === "function") {
        globalThis.__nativeStdoutWrite(str);
      }
      callback();
    },
  });

  stdout.fd = 1;
  stdout.isTTY = false;
  stdout.columns = 80;
  stdout.rows = 24;
  stdout.writable = true;

  // cork/uncork for buffering compat
  var _origCork = stdout.cork;
  var _origUncork = stdout.uncork;
  stdout.cork = function () {
    if (_origCork) _origCork.call(stdout);
  };
  stdout.uncork = function () {
    if (_origUncork) _origUncork.call(stdout);
  };

  if (!globalThis.process) globalThis.process = {};
  globalThis.process.stdout = stdout;
})();

// =============================================================================
// process.stderr — Writable stream backed by native __nativeStderrWrite
// =============================================================================
(function () {
  var Writable = globalThis.__readableStream.Writable;

  var stderr = new Writable({
    write: function (chunk, encoding, callback) {
      var str = typeof chunk === "string" ? chunk : chunk.toString();
      if (typeof globalThis.__nativeStderrWrite === "function") {
        globalThis.__nativeStderrWrite(str);
      }
      callback();
    },
  });

  stderr.fd = 2;
  stderr.isTTY = false;
  stderr.writable = true;

  if (!globalThis.process) globalThis.process = {};
  globalThis.process.stderr = stderr;
})();

// =============================================================================
// queueMicrotask
// =============================================================================
if (typeof globalThis.queueMicrotask === "undefined") {
  globalThis.queueMicrotask = function (fn) {
    Promise.resolve().then(fn);
  };
}

// =============================================================================
// Fetch / Headers / Request / Response
// =============================================================================
(function () {
  function getBufferCtor() {
    return typeof Buffer !== "undefined" ? Buffer : null;
  }

  function normalizeHeaders(init) {
    var map = {};
    if (!init) return map;
    if (typeof globalThis.Headers === "function" && init instanceof globalThis.Headers) {
      init.forEach(function (value, key) {
        map[key.toLowerCase()] = String(value);
      });
      return map;
    }
    if (Array.isArray(init)) {
      for (var i = 0; i < init.length; i++) {
        map[String(init[i][0]).toLowerCase()] = String(init[i][1]);
      }
      return map;
    }
    for (var key in init) {
      map[key.toLowerCase()] = String(init[key]);
    }
    return map;
  }

  function bodyToText(body) {
    if (body === undefined || body === null) return "";
    if (typeof body === "string") return body;
    var BufferCtor = getBufferCtor();
    if (BufferCtor && BufferCtor.isBuffer && BufferCtor.isBuffer(body)) {
      return body.toString("utf8");
    }
    if (body instanceof Uint8Array) {
      return new TextDecoder().decode(body);
    }
    if (body instanceof ArrayBuffer) {
      return new TextDecoder().decode(new Uint8Array(body));
    }
    if (typeof Blob === "function" && body instanceof Blob && typeof body.text === "function") {
      throw new TypeError("Blob request bodies must be consumed before fetch()");
    }
    return String(body);
  }

  function isReadableStreamBody(body) {
    return !!body && typeof body.getReader === "function";
  }

  function encodeBodyChunk(bodyText) {
    var BufferCtor = getBufferCtor();
    if (BufferCtor) return BufferCtor.from(bodyText, "utf8");
    return new TextEncoder().encode(bodyText);
  }

  function concatByteChunks(chunks, totalLength) {
    var BufferCtor = getBufferCtor();
    if (BufferCtor) {
      var buffers = [];
      for (var i = 0; i < chunks.length; i++) {
        buffers.push(BufferCtor.from(chunks[i]));
      }
      return BufferCtor.concat(buffers, totalLength);
    }
    var result = new Uint8Array(totalLength);
    var offset = 0;
    for (var j = 0; j < chunks.length; j++) {
      result.set(chunks[j], offset);
      offset += chunks[j].length;
    }
    return result;
  }

  function consumeBodyStream(body) {
    if (!body) {
      return Promise.resolve(new Uint8Array(0));
    }
    if (!isReadableStreamBody(body)) {
      return Promise.resolve(encodeBodyChunk(bodyToText(body)));
    }
    var reader = body.getReader();
    var chunks = [];
    var totalLength = 0;
    function pump() {
      return reader.read().then(function (step) {
        if (step.done) {
          return concatByteChunks(chunks, totalLength);
        }
        var value = step.value instanceof Uint8Array ? step.value : new Uint8Array(step.value);
        chunks.push(value);
        totalLength += value.length;
        return pump();
      });
    }
    return pump();
  }

  function makeReadableBodyStream(bodyText) {
    if (typeof ReadableStream !== "function") return null;
    return new ReadableStream({
      start: function (controller) {
        var chunk = encodeBodyChunk(bodyText);
        if (chunk && chunk.length > 0) {
          controller.enqueue(chunk);
        }
        controller.close();
      },
    });
  }

  function createAbortError(message) {
    var text = message || "The operation was aborted.";
    if (typeof DOMException === "function") {
      return new DOMException(text, "AbortError");
    }
    var error = new Error(text);
    error.name = "AbortError";
    return error;
  }

  function Headers(init) {
    this._map = normalizeHeaders(init);
  }

  Headers.prototype.get = function (name) {
    return this._map[name.toLowerCase()] || null;
  };
  Headers.prototype.set = function (name, value) {
    this._map[name.toLowerCase()] = String(value);
  };
  Headers.prototype.has = function (name) {
    return name.toLowerCase() in this._map;
  };
  Headers.prototype.delete = function (name) {
    delete this._map[name.toLowerCase()];
  };
  Headers.prototype.append = function (name, value) {
    var key = name.toLowerCase();
    if (this._map[key]) this._map[key] += ", " + value;
    else this._map[key] = String(value);
  };
  Headers.prototype.forEach = function (cb) {
    for (var key in this._map) cb(this._map[key], key, this);
  };
  Headers.prototype.entries = function () {
    var pairs = [];
    for (var key in this._map) pairs.push([key, this._map[key]]);
    return pairs[Symbol.iterator]();
  };
  Headers.prototype.keys = function () {
    return Object.keys(this._map)[Symbol.iterator]();
  };
  Headers.prototype.values = function () {
    var values = [];
    for (var key in this._map) values.push(this._map[key]);
    return values[Symbol.iterator]();
  };
  Headers.prototype[Symbol.iterator] = Headers.prototype.entries;

  function Response(body, init) {
    init = init || {};
    this._bodyText = isReadableStreamBody(body) ? null : bodyToText(body);
    this.status = init.status || 200;
    this.ok = this.status >= 200 && this.status < 300;
    this.statusText = init.statusText || "";
    this.headers = init.headers instanceof Headers ? init.headers : new Headers(init.headers || {});
    this.url = init.url || "";
    this.type = "default";
    this.redirected = false;
    this.bodyUsed = false;
    if (body === undefined || body === null) {
      this.body = null;
    } else if (isReadableStreamBody(body)) {
      this.body = body;
    } else {
      this.body = makeReadableBodyStream(this._bodyText);
    }
  }

  Response.prototype._consumeBody = function (mapper) {
    if (this.bodyUsed) {
      return Promise.reject(new TypeError("Body is unusable"));
    }
    this.bodyUsed = true;
    if (this._bodyText !== null) {
      return Promise.resolve(mapper(this._bodyText, encodeBodyChunk(this._bodyText)));
    }
    var body = this.body;
    this.body = null;
    return consumeBodyStream(body).then(function (bytes) {
      return mapper(new TextDecoder().decode(bytes), bytes);
    });
  };
  Response.prototype.text = function () {
    return this._consumeBody(function (text) {
      return text;
    });
  };
  Response.prototype.json = function () {
    return this._consumeBody(function (text) {
      return JSON.parse(text);
    });
  };
  Response.prototype.arrayBuffer = function () {
    return this._consumeBody(function (_text, bytes) {
      return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
    });
  };
  Response.prototype.blob = function () {
    return this._consumeBody(function (_text, bytes) {
      return typeof Blob === "function" ? new Blob([bytes]) : bytes;
    });
  };
  Response.prototype.clone = function () {
    if (this.bodyUsed) {
      throw new TypeError("Body is unusable");
    }
    if (this._bodyText === null && this.body && typeof this.body.tee === "function") {
      var branches = this.body.tee();
      this.body = branches[0];
      return new Response(branches[1], {
        status: this.status,
        statusText: this.statusText,
        headers: new Headers(this.headers),
        url: this.url,
      });
    }
    return new Response(this._bodyText, {
      status: this.status,
      statusText: this.statusText,
      headers: new Headers(this.headers),
      url: this.url,
    });
  };
  Response.json = function (data, init) {
    init = init || {};
    var headers = new Headers(init.headers || {});
    headers.set("content-type", "application/json");
    return new Response(JSON.stringify(data), {
      status: init.status || 200,
      statusText: init.statusText || "",
      headers: headers,
    });
  };

  function Request(input, init) {
    init = init || {};
    if (typeof input === "string") {
      this.url = input;
    } else {
      this.url = input.url;
      init = Object.assign({}, input, init);
    }
    this.method = (init.method || "GET").toUpperCase();
    this.headers = init.headers instanceof Headers ? init.headers : new Headers(init.headers || {});
    this.body = init.body || null;
    this.signal = init.signal || null;
  }

  if (typeof globalThis.Headers === "undefined") globalThis.Headers = Headers;
  if (typeof globalThis.Request === "undefined") globalThis.Request = Request;
  if (typeof globalThis.Response === "undefined") globalThis.Response = Response;

  if (typeof globalThis.fetch === "undefined") {
    globalThis.fetch = function fetch(input, init) {
      var request = input instanceof Request ? new Request(input, init) : new Request(input, init || {});
      var fetchOptions = {
        method: request.method,
        headers: normalizeHeaders(request.headers),
      };

      if (request.body !== undefined && request.body !== null && request.method !== "GET" && request.method !== "HEAD") {
        fetchOptions.body = bodyToText(request.body);
      }

      return new Promise(function (resolve, reject) {
        if (typeof globalThis.__nativeFetchStream !== "function" && typeof globalThis.__nativeFetch !== "function") {
          reject(new TypeError("fetch failed: missing native transport"));
          return;
        }

        var settled = false;
        var abortHandler = null;

        function finishWithFailure(error) {
          if (settled) return;
          settled = true;
          if (request.signal && abortHandler && typeof request.signal.removeEventListener === "function") {
            request.signal.removeEventListener("abort", abortHandler);
          }
          reject(error);
        }

        function finishWithSuccess(response) {
          if (settled) return;
          settled = true;
          if (request.signal && abortHandler && typeof request.signal.removeEventListener === "function") {
            request.signal.removeEventListener("abort", abortHandler);
          }
          resolve(response);
        }

        if (request.signal && request.signal.aborted) {
          finishWithFailure(createAbortError());
          return;
        }

        if (request.signal && typeof request.signal.addEventListener === "function") {
          abortHandler = function () {
            finishWithFailure(createAbortError());
          };
          request.signal.addEventListener("abort", abortHandler);
        }

        if (typeof globalThis.__nativeFetchStream === "function") {
          var streamController = null;
          var streamCancelled = false;
          var operationID = 0;
          var responseStream = typeof ReadableStream === "function"
            ? new ReadableStream({
              start: function (controller) {
                streamController = controller;
              },
              cancel: function () {
                streamCancelled = true;
                if (typeof globalThis.__cancelFetch === "function" && operationID) {
                  globalThis.__cancelFetch(operationID);
                }
              },
            })
            : null;

          operationID = globalThis.__nativeFetchStream(
            request.url,
            JSON.stringify(fetchOptions),
            function (statusCode, responseURL, headersJSON) {
              var parsedHeaders = {};
              try {
                parsedHeaders = JSON.parse(headersJSON);
              } catch (error) {}
              finishWithSuccess(
                new Response(responseStream, {
                  status: statusCode,
                  headers: parsedHeaders,
                  url: responseURL,
                })
              );
            },
            function (bytes) {
              if (streamCancelled || !streamController) return;
              streamController.enqueue(bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes));
            },
            function () {
              if (streamCancelled || !streamController) return;
              streamController.close();
            },
            function (error) {
              var wrappedError = new TypeError("fetch failed: " + error);
              if (!settled) {
                finishWithFailure(wrappedError);
                return;
              }
              if (streamController) {
                streamController.error(wrappedError);
              }
            }
          );
          if (request.signal && abortHandler) {
            var priorAbortHandler = abortHandler;
            abortHandler = function () {
              if (typeof globalThis.__cancelFetch === "function" && operationID) {
                globalThis.__cancelFetch(operationID);
              }
              priorAbortHandler();
              if (streamController && settled) {
                streamController.error(createAbortError());
              }
            };
            request.signal.removeEventListener("abort", priorAbortHandler);
            request.signal.addEventListener("abort", abortHandler);
          }
          return;
        }

        globalThis.__nativeFetch(
          request.url,
          JSON.stringify(fetchOptions),
          function (statusCode, responseURL, headersJSON, body) {
            var parsedHeaders = {};
            try {
              parsedHeaders = JSON.parse(headersJSON);
            } catch (error) {}
            finishWithSuccess(
              new Response(body, {
                status: statusCode,
                headers: parsedHeaders,
                url: responseURL,
              })
            );
          },
          function (error) {
            finishWithFailure(new TypeError("fetch failed: " + error));
          }
        );
      });
    };
  }
})();

// =============================================================================
// Event / EventTarget / CustomEvent
// =============================================================================
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

// =============================================================================
// Blob / File / FormData
// =============================================================================
function __swiftBunCloneArrayBuffer(buffer, byteOffset, byteLength) {
  var start = byteOffset || 0;
  var end = byteLength === undefined ? buffer.byteLength : start + byteLength;
  return buffer.slice(start, end);
}

function __swiftBunEncodeText(value) {
  return new TextEncoder().encode(String(value));
}

function __swiftBunDecodeText(bytes) {
  return new TextDecoder().decode(bytes);
}

function __swiftBunConcatUint8Arrays(chunks) {
  var total = 0;
  for (var i = 0; i < chunks.length; i++) {
    total += chunks[i].byteLength;
  }
  var merged = new Uint8Array(total);
  var offset = 0;
  for (var j = 0; j < chunks.length; j++) {
    merged.set(chunks[j], offset);
    offset += chunks[j].byteLength;
  }
  return merged;
}

function __swiftBunNormalizeBlobPart(part) {
  if (part === undefined || part === null) {
    return __swiftBunEncodeText("");
  }
  if (part instanceof Uint8Array) {
    return new Uint8Array(part);
  }
  if (part instanceof ArrayBuffer) {
    return new Uint8Array(__swiftBunCloneArrayBuffer(part));
  }
  if (ArrayBuffer.isView(part)) {
    return new Uint8Array(__swiftBunCloneArrayBuffer(part.buffer, part.byteOffset, part.byteLength));
  }
  if (typeof Blob === "function" && part instanceof Blob && part._bytes instanceof Uint8Array) {
    return new Uint8Array(part._bytes);
  }
  return __swiftBunEncodeText(String(part));
}

if (typeof globalThis.Blob === "undefined") {
  globalThis.Blob = function Blob(parts, options) {
    options = options || {};
    var normalized = [];
    var sourceParts = parts || [];
    for (var i = 0; i < sourceParts.length; i++) {
      normalized.push(__swiftBunNormalizeBlobPart(sourceParts[i]));
    }
    this.type = String(options.type || "").toLowerCase();
    this._bytes = __swiftBunConcatUint8Arrays(normalized);
    this.size = this._bytes.byteLength;
  };
  Blob.prototype.text = function () {
    return Promise.resolve(__swiftBunDecodeText(this._bytes));
  };
  Blob.prototype.arrayBuffer = function () {
    return Promise.resolve(__swiftBunCloneArrayBuffer(this._bytes.buffer, this._bytes.byteOffset, this._bytes.byteLength));
  };
  Blob.prototype.slice = function (start, end, type) {
    var relativeStart = start === undefined ? 0 : start;
    var relativeEnd = end === undefined ? this.size : end;
    var size = this.size;

    if (relativeStart < 0) relativeStart = Math.max(size + relativeStart, 0);
    else relativeStart = Math.min(relativeStart, size);
    if (relativeEnd < 0) relativeEnd = Math.max(size + relativeEnd, 0);
    else relativeEnd = Math.min(relativeEnd, size);

    var span = Math.max(relativeEnd - relativeStart, 0);
    var sliced = this._bytes.slice(relativeStart, relativeStart + span);
    return new Blob([sliced], { type: type === undefined ? this.type : type });
  };
  Blob.prototype.stream = function () {
    var bytes = new Uint8Array(this._bytes);
    return new ReadableStream({
      start: function (controller) {
        if (bytes.byteLength > 0) {
          controller.enqueue(bytes);
        }
        controller.close();
      },
    });
  };
}

if (typeof globalThis.File === "undefined") {
  globalThis.File = function File(parts, name, options) {
    Blob.call(this, parts, options);
    this.name = String(name || "");
    this.lastModified = options && typeof options.lastModified === "number" ? options.lastModified : Date.now();
  };
  File.prototype = Object.create(Blob.prototype);
  File.prototype.constructor = File;
}

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
      .filter(function (e) { return e.name === name; })
      .map(function (e) { return e.value; });
  };
  FormData.prototype.has = function (name) {
    return this._entries.some(function (e) { return e.name === name; });
  };
  FormData.prototype.set = function (name, value, filename) {
    this._entries = this._entries.filter(function (e) { return e.name !== name; });
    this.append(name, value, filename);
  };
  FormData.prototype.delete = function (name) {
    this._entries = this._entries.filter(function (e) { return e.name !== name; });
  };
  FormData.prototype.forEach = function (cb) {
    for (var i = 0; i < this._entries.length; i++) {
      cb(this._entries[i].value, this._entries[i].name, this);
    }
  };
  FormData.prototype.entries = function () {
    var arr = this._entries.map(function (e) { return [e.name, e.value]; });
    return arr[Symbol.iterator]();
  };
  FormData.prototype[Symbol.iterator] = FormData.prototype.entries;
}

// =============================================================================
// WebSocket / Worker / MessageChannel / XMLHttpRequest (stubs)
// =============================================================================
if (typeof globalThis.WebSocket === "undefined") {
  function WebSocket(url) {
    EventTarget.call(this);
    this.url = url;
    this.readyState = WebSocket.CONNECTING;
    this.protocol = "";
    this.extensions = "";
    this.binaryType = "blob";
    this.bufferedAmount = 0;
  }
  WebSocket.prototype = Object.create(EventTarget.prototype);
  WebSocket.prototype.constructor = WebSocket;
  WebSocket.prototype.send = function () {};
  WebSocket.prototype.close = function () { this.readyState = WebSocket.CLOSED; };
  WebSocket.CONNECTING = 0;
  WebSocket.OPEN = 1;
  WebSocket.CLOSING = 2;
  WebSocket.CLOSED = 3;
  globalThis.WebSocket = WebSocket;
}

if (typeof globalThis.MessageChannel === "undefined") {
  function MessagePort() {
    EventTarget.call(this);
    this.onmessage = null;
  }
  MessagePort.prototype = Object.create(EventTarget.prototype);
  MessagePort.prototype.constructor = MessagePort;
  MessagePort.prototype.postMessage = function (data) {
    var self = this;
    if (self._other && self._other.onmessage) {
      Promise.resolve().then(function () { self._other.onmessage({ data: data }); });
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

if (typeof globalThis.Worker === "undefined") {
  globalThis.Worker = function () { throw new Error("Worker is not supported in swift-bun"); };
}

if (typeof globalThis.XMLHttpRequest === "undefined") {
  function dispatchXMLHttpRequestEvent(target, type) {
    var event = new Event(type);
    target.dispatchEvent(event);
    var handler = target["on" + type];
    if (typeof handler === "function") {
      handler.call(target, event);
    }
  }

  function cloneHeaderMap(headers) {
    var map = {};
    if (!headers || typeof headers.forEach !== "function") {
      return map;
    }
    headers.forEach(function(value, key) {
      map[String(key).toLowerCase()] = String(value);
    });
    return map;
  }

  globalThis.XMLHttpRequest = function XMLHttpRequest() {
    EventTarget.call(this);
    this.readyState = XMLHttpRequest.UNSENT;
    this.status = 0;
    this.statusText = "";
    this.responseType = "";
    this.response = null;
    this.responseText = "";
    this.responseURL = "";
    this.onreadystatechange = null;
    this.onload = null;
    this.onerror = null;
    this.onabort = null;
    this.onloadend = null;
    this._method = "GET";
    this._url = "";
    this._async = true;
    this._headers = {};
    this._responseHeaders = {};
    this._sendFlag = false;
    this._aborted = false;
    this._controller = null;
  };
  XMLHttpRequest.prototype = Object.create(EventTarget.prototype);
  XMLHttpRequest.prototype.constructor = XMLHttpRequest;
  XMLHttpRequest.UNSENT = 0;
  XMLHttpRequest.OPENED = 1;
  XMLHttpRequest.HEADERS_RECEIVED = 2;
  XMLHttpRequest.LOADING = 3;
  XMLHttpRequest.DONE = 4;
  XMLHttpRequest.prototype.UNSENT = XMLHttpRequest.UNSENT;
  XMLHttpRequest.prototype.OPENED = XMLHttpRequest.OPENED;
  XMLHttpRequest.prototype.HEADERS_RECEIVED = XMLHttpRequest.HEADERS_RECEIVED;
  XMLHttpRequest.prototype.LOADING = XMLHttpRequest.LOADING;
  XMLHttpRequest.prototype.DONE = XMLHttpRequest.DONE;
  XMLHttpRequest.prototype.open = function (method, url, async) {
    if (async === false) {
      throw new Error("Synchronous XMLHttpRequest is not supported in swift-bun");
    }
    this._method = String(method || "GET").toUpperCase();
    this._url = String(url || "");
    this._async = async !== false;
    this._headers = {};
    this._responseHeaders = {};
    this._sendFlag = false;
    this._aborted = false;
    this.status = 0;
    this.statusText = "";
    this.response = null;
    this.responseText = "";
    this.responseURL = "";
    this.readyState = XMLHttpRequest.OPENED;
    dispatchXMLHttpRequestEvent(this, "readystatechange");
  };
  XMLHttpRequest.prototype.setRequestHeader = function (name, value) {
    if (this.readyState !== XMLHttpRequest.OPENED || this._sendFlag) {
      throw new Error("INVALID_STATE_ERR");
    }
    var headerName = String(name).toLowerCase();
    var headerValue = String(value);
    if (this._headers[headerName]) {
      this._headers[headerName] += ", " + headerValue;
    } else {
      this._headers[headerName] = headerValue;
    }
  };
  XMLHttpRequest.prototype.getResponseHeader = function (name) {
    if (this.readyState < XMLHttpRequest.HEADERS_RECEIVED) return null;
    var value = this._responseHeaders[String(name).toLowerCase()];
    return value === undefined ? null : value;
  };
  XMLHttpRequest.prototype.getAllResponseHeaders = function () {
    if (this.readyState < XMLHttpRequest.HEADERS_RECEIVED) return "";
    var lines = [];
    for (var key in this._responseHeaders) {
      lines.push(key + ": " + this._responseHeaders[key]);
    }
    return lines.join("\r\n");
  };
  XMLHttpRequest.prototype.overrideMimeType = function () {};
  XMLHttpRequest.prototype.abort = function () {
    if (this.readyState === XMLHttpRequest.UNSENT || (this.readyState === XMLHttpRequest.OPENED && !this._sendFlag)) {
      this.readyState = XMLHttpRequest.UNSENT;
      return;
    }
    this._aborted = true;
    this._sendFlag = false;
    if (this._controller && typeof this._controller.abort === "function") {
      this._controller.abort();
    }
    this.status = 0;
    this.statusText = "";
    this.response = null;
    this.responseText = "";
    this.readyState = XMLHttpRequest.DONE;
    dispatchXMLHttpRequestEvent(this, "readystatechange");
    dispatchXMLHttpRequestEvent(this, "abort");
    dispatchXMLHttpRequestEvent(this, "loadend");
  };
  XMLHttpRequest.prototype.send = function (body) {
    if (this.readyState !== XMLHttpRequest.OPENED) {
      throw new Error("INVALID_STATE_ERR");
    }
    if (this._sendFlag) {
      throw new Error("INVALID_STATE_ERR");
    }

    var self = this;
    self._sendFlag = true;
    self._aborted = false;
    self.response = null;
    self.responseText = "";

    var controller = typeof AbortController === "function" ? new AbortController() : null;
    self._controller = controller;

    var options = {
      method: self._method,
      headers: self._headers,
    };
    if (controller) {
      options.signal = controller.signal;
    }
    if (self._method !== "GET" && self._method !== "HEAD" && body !== undefined) {
      options.body = body;
    }

    var responseRef = null;
    fetch(self._url, options).then(function (response) {
      if (self._aborted) {
        return null;
      }
      responseRef = response;
      self.status = response.status;
      self.statusText = response.statusText || "";
      self.responseURL = response.url || self._url;
      self._responseHeaders = cloneHeaderMap(response.headers);
      self.readyState = XMLHttpRequest.HEADERS_RECEIVED;
      dispatchXMLHttpRequestEvent(self, "readystatechange");
      self.readyState = XMLHttpRequest.LOADING;
      dispatchXMLHttpRequestEvent(self, "readystatechange");

      if (self.responseType === "arraybuffer") {
        return response.arrayBuffer();
      }
      if (self.responseType === "blob") {
        return response.arrayBuffer().then(function (buffer) {
          return new Blob([buffer], { type: response.headers.get("content-type") || "" });
        });
      }
      return response.text();
    }).then(function (payload) {
      if (self._aborted || payload === null) {
        return;
      }
      if (self.responseType === "arraybuffer" || self.responseType === "blob") {
        self.response = payload;
      } else if (self.responseType === "json") {
        self.responseText = String(payload || "");
        self.response = self.responseText ? JSON.parse(self.responseText) : null;
      } else {
        self.responseText = String(payload || "");
        self.response = self.responseText;
      }
      if (self.responseType === "" || self.responseType === "text") {
        self.responseText = String(payload || "");
        self.response = self.responseText;
      }
      self._sendFlag = false;
      self.readyState = XMLHttpRequest.DONE;
      dispatchXMLHttpRequestEvent(self, "readystatechange");
      dispatchXMLHttpRequestEvent(self, "load");
      dispatchXMLHttpRequestEvent(self, "loadend");
    }, function (error) {
      if (self._aborted || (error && error.name === "AbortError")) {
        if (!self._aborted) {
          self.abort();
        }
        return;
      }
      self._sendFlag = false;
      self.status = 0;
      self.statusText = responseRef && responseRef.statusText ? responseRef.statusText : "";
      self.response = null;
      self.responseText = "";
      self.readyState = XMLHttpRequest.DONE;
      dispatchXMLHttpRequestEvent(self, "readystatechange");
      dispatchXMLHttpRequestEvent(self, "error");
      dispatchXMLHttpRequestEvent(self, "loadend");
    });
  };
}

// =============================================================================
// crypto (Web Crypto API stub)
// =============================================================================
if (typeof globalThis.crypto === "undefined") {
  globalThis.crypto = {
    getRandomValues: function (arr) {
      // Use native __cryptoRandomBytes if available (registered before polyfills load)
      if (typeof globalThis.__cryptoRandomBytes === "function") {
        // Fill the underlying byte buffer, then let the TypedArray view interpret the bytes
        var byteLen = arr.byteLength || arr.length;
        var randomBytes = globalThis.__cryptoRandomBytes(byteLen);
        var view = new Uint8Array(arr.buffer, arr.byteOffset, byteLen);
        for (var i = 0; i < byteLen; i++) view[i] = randomBytes[i];
      } else {
        // Fallback for environments without native bridge (should not happen in swift-bun)
        var fallbackView = new Uint8Array(arr.buffer, arr.byteOffset, arr.byteLength || arr.length);
        for (var i = 0; i < fallbackView.length; i++) fallbackView[i] = Math.floor(Math.random() * 256);
      }
      return arr;
    },
    randomUUID: function () {
      var b = new Uint8Array(16);
      crypto.getRandomValues(b);
      b[6] = (b[6] & 0x0f) | 0x40;
      b[8] = (b[8] & 0x3f) | 0x80;
      var h = [];
      for (var i = 0; i < 16; i++) h.push(("0" + b[i].toString(16)).slice(-2));
      return h.slice(0,4).join("") + "-" + h.slice(4,6).join("") + "-" + h.slice(6,8).join("") + "-" + h.slice(8,10).join("") + "-" + h.slice(10).join("");
    },
    subtle: {
      digest: function (algorithm, data) {
        if (typeof globalThis.__subtleDigest !== "function") {
          return Promise.reject(new Error("crypto.subtle is not supported in swift-bun"));
        }
        var name = typeof algorithm === "string" ? algorithm : (algorithm && algorithm.name);
        var bytes = globalThis.__subtleDigest(name, Array.from(data instanceof Uint8Array ? data : new Uint8Array(data)));
        if (!bytes || bytes.length === 0) {
          return Promise.reject(new DOMException("Algorithm is not supported", "NotSupportedError"));
        }
        var result = new Uint8Array(bytes);
        return Promise.resolve(result.buffer.slice(result.byteOffset, result.byteOffset + result.byteLength));
      },
      importKey: function (format, keyData, algorithm, extractable, keyUsages) {
        if (typeof globalThis.__subtleImportKey !== "function") {
          return Promise.reject(new Error("crypto.subtle is not supported in swift-bun"));
        }
        var payload;
        if (format === "jwk") {
          payload = new TextEncoder().encode(JSON.stringify(keyData));
        } else if (keyData instanceof Uint8Array) {
          payload = keyData;
        } else if (ArrayBuffer.isView(keyData)) {
          payload = new Uint8Array(keyData.buffer, keyData.byteOffset, keyData.byteLength);
        } else if (keyData instanceof ArrayBuffer) {
          payload = new Uint8Array(keyData);
        } else {
          payload = new TextEncoder().encode(String(keyData));
        }
        var imported = globalThis.__subtleImportKey(
          format,
          Array.from(payload),
          JSON.stringify(algorithm),
          !!extractable,
          JSON.stringify(keyUsages || [])
        );
        if (imported && imported.error) {
          return Promise.reject(new DOMException(imported.error, "NotSupportedError"));
        }
        imported.usages = imported.usages || [];
        imported.algorithm = imported.algorithm || algorithm;
        imported.extractable = !!imported.extractable;
        imported[Symbol.toStringTag] = "CryptoKey";
        return Promise.resolve(imported);
      },
      sign: function (algorithm, key, data) {
        if (typeof globalThis.__subtleSign !== "function") {
          return Promise.reject(new Error("crypto.subtle is not supported in swift-bun"));
        }
        var result = globalThis.__subtleSign(
          JSON.stringify(algorithm),
          key.token,
          Array.from(data instanceof Uint8Array ? data : new Uint8Array(data))
        );
        if (result && result.error) {
          return Promise.reject(new DOMException(result.error, "OperationError"));
        }
        var signature = new Uint8Array(result.bytes || []);
        return Promise.resolve(signature.buffer.slice(signature.byteOffset, signature.byteOffset + signature.byteLength));
      },
      verify: function (algorithm, key, signature, data) {
        if (typeof globalThis.__subtleVerify !== "function") {
          return Promise.reject(new Error("crypto.subtle is not supported in swift-bun"));
        }
        var result = globalThis.__subtleVerify(
          JSON.stringify(algorithm),
          key.token,
          Array.from(signature instanceof Uint8Array ? signature : new Uint8Array(signature)),
          Array.from(data instanceof Uint8Array ? data : new Uint8Array(data))
        );
        if (result && result.error) {
          return Promise.reject(new DOMException(result.error, "OperationError"));
        }
        return Promise.resolve(!!result.verified);
      },
      encrypt: function () { return Promise.reject(new Error("crypto.subtle is not supported in swift-bun")); },
      decrypt: function () { return Promise.reject(new Error("crypto.subtle is not supported in swift-bun")); },
    },
  };
}

// =============================================================================
// Misc globals
// =============================================================================
if (typeof globalThis.structuredClone === "undefined") {
  function cloneBlobLike(value) {
    if (typeof File === "function" && value instanceof File) {
      return new File([value._bytes ? new Uint8Array(value._bytes) : value], value.name, {
        type: value.type,
        lastModified: value.lastModified,
      });
    }
    if (typeof Blob === "function" && value instanceof Blob) {
      return new Blob([value._bytes ? new Uint8Array(value._bytes) : value], { type: value.type });
    }
    return null;
  }

  globalThis.structuredClone = function (obj) {
    if (obj === undefined) return undefined;
    var directBlobClone = cloneBlobLike(obj);
    if (directBlobClone) return directBlobClone;
    return globalThis.__swiftBunPackages.structuredClone(obj);
  };
}

if (typeof globalThis.navigator === "undefined") {
  globalThis.navigator = { userAgent: "swift-bun", platform: "darwin", language: "en", languages: ["en"] };
}

if (!Symbol.dispose) Symbol.dispose = Symbol.for("Symbol.dispose");
if (!Symbol.asyncDispose) Symbol.asyncDispose = Symbol.for("Symbol.asyncDispose");
