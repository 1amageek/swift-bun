var __getOwnPropNames = Object.getOwnPropertyNames;
var __commonJS = (cb, mod) => function __require() {
  return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};

// node_modules/@anthropic-ai/sdk/internal/tslib.js
var require_tslib = __commonJS({
  "node_modules/@anthropic-ai/sdk/internal/tslib.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.__setModuleDefault = exports2.__createBinding = void 0;
    exports2.__classPrivateFieldSet = __classPrivateFieldSet;
    exports2.__classPrivateFieldGet = __classPrivateFieldGet;
    exports2.__exportStar = __exportStar;
    exports2.__importStar = __importStar;
    function __classPrivateFieldSet(receiver, state, value, kind, f) {
      if (kind === "m")
        throw new TypeError("Private method is not writable");
      if (kind === "a" && !f)
        throw new TypeError("Private accessor was defined without a setter");
      if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver))
        throw new TypeError("Cannot write private member to an object whose class did not declare it");
      return kind === "a" ? f.call(receiver, value) : f ? f.value = value : state.set(receiver, value), value;
    }
    function __classPrivateFieldGet(receiver, state, kind, f) {
      if (kind === "a" && !f)
        throw new TypeError("Private accessor was defined without a getter");
      if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver))
        throw new TypeError("Cannot read private member from an object whose class did not declare it");
      return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
    }
    var __createBinding = Object.create ? function(o, m, k, k2) {
      if (k2 === void 0)
        k2 = k;
      var desc = Object.getOwnPropertyDescriptor(m, k);
      if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
        desc = {
          enumerable: true,
          get: function() {
            return m[k];
          }
        };
      }
      Object.defineProperty(o, k2, desc);
    } : function(o, m, k, k2) {
      if (k2 === void 0)
        k2 = k;
      o[k2] = m[k];
    };
    exports2.__createBinding = __createBinding;
    function __exportStar(m, o) {
      for (var p in m)
        if (p !== "default" && !Object.prototype.hasOwnProperty.call(o, p))
          __createBinding(o, m, p);
    }
    var __setModuleDefault = Object.create ? function(o, v) {
      Object.defineProperty(o, "default", { enumerable: true, value: v });
    } : function(o, v) {
      o["default"] = v;
    };
    exports2.__setModuleDefault = __setModuleDefault;
    var ownKeys = function(o) {
      ownKeys = Object.getOwnPropertyNames || function(o2) {
        var ar = [];
        for (var k in o2)
          if (Object.prototype.hasOwnProperty.call(o2, k))
            ar[ar.length] = k;
        return ar;
      };
      return ownKeys(o);
    };
    function __importStar(mod) {
      if (mod && mod.__esModule)
        return mod;
      var result = {};
      if (mod != null) {
        for (var k = ownKeys(mod), i = 0; i < k.length; i++)
          if (k[i] !== "default")
            __createBinding(result, mod, k[i]);
      }
      __setModuleDefault(result, mod);
      return result;
    }
  }
});

// node_modules/@anthropic-ai/sdk/internal/utils/uuid.js
var require_uuid = __commonJS({
  "node_modules/@anthropic-ai/sdk/internal/utils/uuid.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.uuid4 = void 0;
    var uuid4 = function() {
      const { crypto } = globalThis;
      if (crypto?.randomUUID) {
        exports2.uuid4 = crypto.randomUUID.bind(crypto);
        return crypto.randomUUID();
      }
      const u8 = new Uint8Array(1);
      const randomByte = crypto ? () => crypto.getRandomValues(u8)[0] : () => Math.random() * 255 & 255;
      return "10000000-1000-4000-8000-100000000000".replace(/[018]/g, (c) => (+c ^ randomByte() & 15 >> +c / 4).toString(16));
    };
    exports2.uuid4 = uuid4;
  }
});

// node_modules/@anthropic-ai/sdk/internal/errors.js
var require_errors = __commonJS({
  "node_modules/@anthropic-ai/sdk/internal/errors.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.castToError = void 0;
    exports2.isAbortError = isAbortError;
    function isAbortError(err) {
      return typeof err === "object" && err !== null && // Spec-compliant fetch implementations
      ("name" in err && err.name === "AbortError" || // Expo fetch
      "message" in err && String(err.message).includes("FetchRequestCanceledException"));
    }
    var castToError = (err) => {
      if (err instanceof Error)
        return err;
      if (typeof err === "object" && err !== null) {
        try {
          if (Object.prototype.toString.call(err) === "[object Error]") {
            const error = new Error(err.message, err.cause ? { cause: err.cause } : {});
            if (err.stack)
              error.stack = err.stack;
            if (err.cause && !error.cause)
              error.cause = err.cause;
            if (err.name)
              error.name = err.name;
            return error;
          }
        } catch {
        }
        try {
          return new Error(JSON.stringify(err));
        } catch {
        }
      }
      return new Error(err);
    };
    exports2.castToError = castToError;
  }
});

// node_modules/@anthropic-ai/sdk/core/error.js
var require_error = __commonJS({
  "node_modules/@anthropic-ai/sdk/core/error.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.InternalServerError = exports2.RateLimitError = exports2.UnprocessableEntityError = exports2.ConflictError = exports2.NotFoundError = exports2.PermissionDeniedError = exports2.AuthenticationError = exports2.BadRequestError = exports2.APIConnectionTimeoutError = exports2.APIConnectionError = exports2.APIUserAbortError = exports2.APIError = exports2.AnthropicError = void 0;
    var errors_1 = require_errors();
    var AnthropicError = class extends Error {
    };
    exports2.AnthropicError = AnthropicError;
    var APIError = class _APIError extends AnthropicError {
      constructor(status, error, message, headers) {
        super(`${_APIError.makeMessage(status, error, message)}`);
        this.status = status;
        this.headers = headers;
        this.requestID = headers?.get("request-id");
        this.error = error;
      }
      static makeMessage(status, error, message) {
        const msg = error?.message ? typeof error.message === "string" ? error.message : JSON.stringify(error.message) : error ? JSON.stringify(error) : message;
        if (status && msg) {
          return `${status} ${msg}`;
        }
        if (status) {
          return `${status} status code (no body)`;
        }
        if (msg) {
          return msg;
        }
        return "(no status code or body)";
      }
      static generate(status, errorResponse, message, headers) {
        if (!status || !headers) {
          return new APIConnectionError({ message, cause: (0, errors_1.castToError)(errorResponse) });
        }
        const error = errorResponse;
        if (status === 400) {
          return new BadRequestError(status, error, message, headers);
        }
        if (status === 401) {
          return new AuthenticationError(status, error, message, headers);
        }
        if (status === 403) {
          return new PermissionDeniedError(status, error, message, headers);
        }
        if (status === 404) {
          return new NotFoundError(status, error, message, headers);
        }
        if (status === 409) {
          return new ConflictError(status, error, message, headers);
        }
        if (status === 422) {
          return new UnprocessableEntityError(status, error, message, headers);
        }
        if (status === 429) {
          return new RateLimitError(status, error, message, headers);
        }
        if (status >= 500) {
          return new InternalServerError(status, error, message, headers);
        }
        return new _APIError(status, error, message, headers);
      }
    };
    exports2.APIError = APIError;
    var APIUserAbortError = class extends APIError {
      constructor({ message } = {}) {
        super(void 0, void 0, message || "Request was aborted.", void 0);
      }
    };
    exports2.APIUserAbortError = APIUserAbortError;
    var APIConnectionError = class extends APIError {
      constructor({ message, cause }) {
        super(void 0, void 0, message || "Connection error.", void 0);
        if (cause)
          this.cause = cause;
      }
    };
    exports2.APIConnectionError = APIConnectionError;
    var APIConnectionTimeoutError = class extends APIConnectionError {
      constructor({ message } = {}) {
        super({ message: message ?? "Request timed out." });
      }
    };
    exports2.APIConnectionTimeoutError = APIConnectionTimeoutError;
    var BadRequestError = class extends APIError {
    };
    exports2.BadRequestError = BadRequestError;
    var AuthenticationError = class extends APIError {
    };
    exports2.AuthenticationError = AuthenticationError;
    var PermissionDeniedError = class extends APIError {
    };
    exports2.PermissionDeniedError = PermissionDeniedError;
    var NotFoundError = class extends APIError {
    };
    exports2.NotFoundError = NotFoundError;
    var ConflictError = class extends APIError {
    };
    exports2.ConflictError = ConflictError;
    var UnprocessableEntityError = class extends APIError {
    };
    exports2.UnprocessableEntityError = UnprocessableEntityError;
    var RateLimitError = class extends APIError {
    };
    exports2.RateLimitError = RateLimitError;
    var InternalServerError = class extends APIError {
    };
    exports2.InternalServerError = InternalServerError;
  }
});

// node_modules/@anthropic-ai/sdk/internal/utils/values.js
var require_values = __commonJS({
  "node_modules/@anthropic-ai/sdk/internal/utils/values.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.pop = exports2.safeJSON = exports2.maybeCoerceBoolean = exports2.maybeCoerceFloat = exports2.maybeCoerceInteger = exports2.coerceBoolean = exports2.coerceFloat = exports2.coerceInteger = exports2.validatePositiveInteger = exports2.ensurePresent = exports2.isReadonlyArray = exports2.isArray = exports2.isAbsoluteURL = void 0;
    exports2.maybeObj = maybeObj;
    exports2.isEmptyObj = isEmptyObj;
    exports2.hasOwn = hasOwn;
    exports2.isObj = isObj;
    var error_1 = require_error();
    var startsWithSchemeRegexp = /^[a-z][a-z0-9+.-]*:/i;
    var isAbsoluteURL = (url) => {
      return startsWithSchemeRegexp.test(url);
    };
    exports2.isAbsoluteURL = isAbsoluteURL;
    var isArray = (val) => (exports2.isArray = Array.isArray, (0, exports2.isArray)(val));
    exports2.isArray = isArray;
    exports2.isReadonlyArray = exports2.isArray;
    function maybeObj(x) {
      if (typeof x !== "object") {
        return {};
      }
      return x ?? {};
    }
    function isEmptyObj(obj) {
      if (!obj)
        return true;
      for (const _k in obj)
        return false;
      return true;
    }
    function hasOwn(obj, key) {
      return Object.prototype.hasOwnProperty.call(obj, key);
    }
    function isObj(obj) {
      return obj != null && typeof obj === "object" && !Array.isArray(obj);
    }
    var ensurePresent = (value) => {
      if (value == null) {
        throw new error_1.AnthropicError(`Expected a value to be given but received ${value} instead.`);
      }
      return value;
    };
    exports2.ensurePresent = ensurePresent;
    var validatePositiveInteger = (name, n) => {
      if (typeof n !== "number" || !Number.isInteger(n)) {
        throw new error_1.AnthropicError(`${name} must be an integer`);
      }
      if (n < 0) {
        throw new error_1.AnthropicError(`${name} must be a positive integer`);
      }
      return n;
    };
    exports2.validatePositiveInteger = validatePositiveInteger;
    var coerceInteger = (value) => {
      if (typeof value === "number")
        return Math.round(value);
      if (typeof value === "string")
        return parseInt(value, 10);
      throw new error_1.AnthropicError(`Could not coerce ${value} (type: ${typeof value}) into a number`);
    };
    exports2.coerceInteger = coerceInteger;
    var coerceFloat = (value) => {
      if (typeof value === "number")
        return value;
      if (typeof value === "string")
        return parseFloat(value);
      throw new error_1.AnthropicError(`Could not coerce ${value} (type: ${typeof value}) into a number`);
    };
    exports2.coerceFloat = coerceFloat;
    var coerceBoolean = (value) => {
      if (typeof value === "boolean")
        return value;
      if (typeof value === "string")
        return value === "true";
      return Boolean(value);
    };
    exports2.coerceBoolean = coerceBoolean;
    var maybeCoerceInteger = (value) => {
      if (value == null) {
        return void 0;
      }
      return (0, exports2.coerceInteger)(value);
    };
    exports2.maybeCoerceInteger = maybeCoerceInteger;
    var maybeCoerceFloat = (value) => {
      if (value == null) {
        return void 0;
      }
      return (0, exports2.coerceFloat)(value);
    };
    exports2.maybeCoerceFloat = maybeCoerceFloat;
    var maybeCoerceBoolean = (value) => {
      if (value == null) {
        return void 0;
      }
      return (0, exports2.coerceBoolean)(value);
    };
    exports2.maybeCoerceBoolean = maybeCoerceBoolean;
    var safeJSON = (text) => {
      try {
        return JSON.parse(text);
      } catch (err) {
        return void 0;
      }
    };
    exports2.safeJSON = safeJSON;
    var pop = (obj, key) => {
      const value = obj[key];
      delete obj[key];
      return value;
    };
    exports2.pop = pop;
  }
});

// node_modules/@anthropic-ai/sdk/internal/utils/sleep.js
var require_sleep = __commonJS({
  "node_modules/@anthropic-ai/sdk/internal/utils/sleep.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.sleep = void 0;
    var sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
    exports2.sleep = sleep;
  }
});

// node_modules/@anthropic-ai/sdk/version.js
var require_version = __commonJS({
  "node_modules/@anthropic-ai/sdk/version.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.VERSION = void 0;
    exports2.VERSION = "0.80.0";
  }
});

// node_modules/@anthropic-ai/sdk/internal/detect-platform.js
var require_detect_platform = __commonJS({
  "node_modules/@anthropic-ai/sdk/internal/detect-platform.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.getPlatformHeaders = exports2.isRunningInBrowser = void 0;
    var version_1 = require_version();
    var isRunningInBrowser = () => {
      return (
        // @ts-ignore
        typeof window !== "undefined" && // @ts-ignore
        typeof window.document !== "undefined" && // @ts-ignore
        typeof navigator !== "undefined"
      );
    };
    exports2.isRunningInBrowser = isRunningInBrowser;
    function getDetectedPlatform() {
      if (typeof Deno !== "undefined" && Deno.build != null) {
        return "deno";
      }
      if (typeof EdgeRuntime !== "undefined") {
        return "edge";
      }
      if (Object.prototype.toString.call(typeof globalThis.process !== "undefined" ? globalThis.process : 0) === "[object process]") {
        return "node";
      }
      return "unknown";
    }
    var getPlatformProperties = () => {
      const detectedPlatform = getDetectedPlatform();
      if (detectedPlatform === "deno") {
        return {
          "X-Stainless-Lang": "js",
          "X-Stainless-Package-Version": version_1.VERSION,
          "X-Stainless-OS": normalizePlatform(Deno.build.os),
          "X-Stainless-Arch": normalizeArch(Deno.build.arch),
          "X-Stainless-Runtime": "deno",
          "X-Stainless-Runtime-Version": typeof Deno.version === "string" ? Deno.version : Deno.version?.deno ?? "unknown"
        };
      }
      if (typeof EdgeRuntime !== "undefined") {
        return {
          "X-Stainless-Lang": "js",
          "X-Stainless-Package-Version": version_1.VERSION,
          "X-Stainless-OS": "Unknown",
          "X-Stainless-Arch": `other:${EdgeRuntime}`,
          "X-Stainless-Runtime": "edge",
          "X-Stainless-Runtime-Version": globalThis.process.version
        };
      }
      if (detectedPlatform === "node") {
        return {
          "X-Stainless-Lang": "js",
          "X-Stainless-Package-Version": version_1.VERSION,
          "X-Stainless-OS": normalizePlatform(globalThis.process.platform ?? "unknown"),
          "X-Stainless-Arch": normalizeArch(globalThis.process.arch ?? "unknown"),
          "X-Stainless-Runtime": "node",
          "X-Stainless-Runtime-Version": globalThis.process.version ?? "unknown"
        };
      }
      const browserInfo = getBrowserInfo();
      if (browserInfo) {
        return {
          "X-Stainless-Lang": "js",
          "X-Stainless-Package-Version": version_1.VERSION,
          "X-Stainless-OS": "Unknown",
          "X-Stainless-Arch": "unknown",
          "X-Stainless-Runtime": `browser:${browserInfo.browser}`,
          "X-Stainless-Runtime-Version": browserInfo.version
        };
      }
      return {
        "X-Stainless-Lang": "js",
        "X-Stainless-Package-Version": version_1.VERSION,
        "X-Stainless-OS": "Unknown",
        "X-Stainless-Arch": "unknown",
        "X-Stainless-Runtime": "unknown",
        "X-Stainless-Runtime-Version": "unknown"
      };
    };
    function getBrowserInfo() {
      if (typeof navigator === "undefined" || !navigator) {
        return null;
      }
      const browserPatterns = [
        { key: "edge", pattern: /Edge(?:\W+(\d+)\.(\d+)(?:\.(\d+))?)?/ },
        { key: "ie", pattern: /MSIE(?:\W+(\d+)\.(\d+)(?:\.(\d+))?)?/ },
        { key: "ie", pattern: /Trident(?:.*rv\:(\d+)\.(\d+)(?:\.(\d+))?)?/ },
        { key: "chrome", pattern: /Chrome(?:\W+(\d+)\.(\d+)(?:\.(\d+))?)?/ },
        { key: "firefox", pattern: /Firefox(?:\W+(\d+)\.(\d+)(?:\.(\d+))?)?/ },
        { key: "safari", pattern: /(?:Version\W+(\d+)\.(\d+)(?:\.(\d+))?)?(?:\W+Mobile\S*)?\W+Safari/ }
      ];
      for (const { key, pattern } of browserPatterns) {
        const match = pattern.exec(navigator.userAgent);
        if (match) {
          const major = match[1] || 0;
          const minor = match[2] || 0;
          const patch = match[3] || 0;
          return { browser: key, version: `${major}.${minor}.${patch}` };
        }
      }
      return null;
    }
    var normalizeArch = (arch) => {
      if (arch === "x32")
        return "x32";
      if (arch === "x86_64" || arch === "x64")
        return "x64";
      if (arch === "arm")
        return "arm";
      if (arch === "aarch64" || arch === "arm64")
        return "arm64";
      if (arch)
        return `other:${arch}`;
      return "unknown";
    };
    var normalizePlatform = (platform) => {
      platform = platform.toLowerCase();
      if (platform.includes("ios"))
        return "iOS";
      if (platform === "android")
        return "Android";
      if (platform === "darwin")
        return "MacOS";
      if (platform === "win32")
        return "Windows";
      if (platform === "freebsd")
        return "FreeBSD";
      if (platform === "openbsd")
        return "OpenBSD";
      if (platform === "linux")
        return "Linux";
      if (platform)
        return `Other:${platform}`;
      return "Unknown";
    };
    var _platformHeaders;
    var getPlatformHeaders = () => {
      return _platformHeaders ?? (_platformHeaders = getPlatformProperties());
    };
    exports2.getPlatformHeaders = getPlatformHeaders;
  }
});

// node_modules/@anthropic-ai/sdk/internal/shims.js
var require_shims = __commonJS({
  "node_modules/@anthropic-ai/sdk/internal/shims.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.getDefaultFetch = getDefaultFetch;
    exports2.makeReadableStream = makeReadableStream;
    exports2.ReadableStreamFrom = ReadableStreamFrom;
    exports2.ReadableStreamToAsyncIterable = ReadableStreamToAsyncIterable;
    exports2.CancelReadableStream = CancelReadableStream;
    function getDefaultFetch() {
      if (typeof fetch !== "undefined") {
        return fetch;
      }
      throw new Error("`fetch` is not defined as a global; Either pass `fetch` to the client, `new Anthropic({ fetch })` or polyfill the global, `globalThis.fetch = fetch`");
    }
    function makeReadableStream(...args) {
      const ReadableStream = globalThis.ReadableStream;
      if (typeof ReadableStream === "undefined") {
        throw new Error("`ReadableStream` is not defined as a global; You will need to polyfill it, `globalThis.ReadableStream = ReadableStream`");
      }
      return new ReadableStream(...args);
    }
    function ReadableStreamFrom(iterable) {
      let iter = Symbol.asyncIterator in iterable ? iterable[Symbol.asyncIterator]() : iterable[Symbol.iterator]();
      return makeReadableStream({
        start() {
        },
        async pull(controller) {
          const { done, value } = await iter.next();
          if (done) {
            controller.close();
          } else {
            controller.enqueue(value);
          }
        },
        async cancel() {
          await iter.return?.();
        }
      });
    }
    function ReadableStreamToAsyncIterable(stream) {
      if (stream[Symbol.asyncIterator])
        return stream;
      const reader = stream.getReader();
      return {
        async next() {
          try {
            const result = await reader.read();
            if (result?.done)
              reader.releaseLock();
            return result;
          } catch (e) {
            reader.releaseLock();
            throw e;
          }
        },
        async return() {
          const cancelPromise = reader.cancel();
          reader.releaseLock();
          await cancelPromise;
          return { done: true, value: void 0 };
        },
        [Symbol.asyncIterator]() {
          return this;
        }
      };
    }
    async function CancelReadableStream(stream) {
      if (stream === null || typeof stream !== "object")
        return;
      if (stream[Symbol.asyncIterator]) {
        await stream[Symbol.asyncIterator]().return?.();
        return;
      }
      const reader = stream.getReader();
      const cancelPromise = reader.cancel();
      reader.releaseLock();
      await cancelPromise;
    }
  }
});

// node_modules/@anthropic-ai/sdk/internal/request-options.js
var require_request_options = __commonJS({
  "node_modules/@anthropic-ai/sdk/internal/request-options.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.FallbackEncoder = void 0;
    var FallbackEncoder = ({ headers, body }) => {
      return {
        bodyHeaders: {
          "content-type": "application/json"
        },
        body: JSON.stringify(body)
      };
    };
    exports2.FallbackEncoder = FallbackEncoder;
  }
});

// node_modules/@anthropic-ai/sdk/internal/utils/query.js
var require_query = __commonJS({
  "node_modules/@anthropic-ai/sdk/internal/utils/query.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.stringifyQuery = stringifyQuery;
    var error_1 = require_error();
    function stringifyQuery(query) {
      return Object.entries(query).filter(([_, value]) => typeof value !== "undefined").map(([key, value]) => {
        if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
          return `${encodeURIComponent(key)}=${encodeURIComponent(value)}`;
        }
        if (value === null) {
          return `${encodeURIComponent(key)}=`;
        }
        throw new error_1.AnthropicError(`Cannot stringify type ${typeof value}; Expected string, number, boolean, or null. If you need to pass nested query parameters, you can manually encode them, e.g. { query: { 'foo[key1]': value1, 'foo[key2]': value2 } }, and please open a GitHub issue requesting better support for your use case.`);
      }).join("&");
    }
  }
});

// node_modules/@anthropic-ai/sdk/internal/utils/bytes.js
var require_bytes = __commonJS({
  "node_modules/@anthropic-ai/sdk/internal/utils/bytes.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.concatBytes = concatBytes;
    exports2.encodeUTF8 = encodeUTF8;
    exports2.decodeUTF8 = decodeUTF8;
    function concatBytes(buffers) {
      let length = 0;
      for (const buffer of buffers) {
        length += buffer.length;
      }
      const output = new Uint8Array(length);
      let index = 0;
      for (const buffer of buffers) {
        output.set(buffer, index);
        index += buffer.length;
      }
      return output;
    }
    var encodeUTF8_;
    function encodeUTF8(str) {
      let encoder;
      return (encodeUTF8_ ?? (encoder = new globalThis.TextEncoder(), encodeUTF8_ = encoder.encode.bind(encoder)))(str);
    }
    var decodeUTF8_;
    function decodeUTF8(bytes) {
      let decoder;
      return (decodeUTF8_ ?? (decoder = new globalThis.TextDecoder(), decodeUTF8_ = decoder.decode.bind(decoder)))(bytes);
    }
  }
});

// node_modules/@anthropic-ai/sdk/internal/decoders/line.js
var require_line = __commonJS({
  "node_modules/@anthropic-ai/sdk/internal/decoders/line.js"(exports2) {
    "use strict";
    var _LineDecoder_buffer;
    var _LineDecoder_carriageReturnIndex;
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.LineDecoder = void 0;
    exports2.findDoubleNewlineIndex = findDoubleNewlineIndex;
    var tslib_1 = require_tslib();
    var bytes_1 = require_bytes();
    var LineDecoder = class {
      constructor() {
        _LineDecoder_buffer.set(this, void 0);
        _LineDecoder_carriageReturnIndex.set(this, void 0);
        tslib_1.__classPrivateFieldSet(this, _LineDecoder_buffer, new Uint8Array(), "f");
        tslib_1.__classPrivateFieldSet(this, _LineDecoder_carriageReturnIndex, null, "f");
      }
      decode(chunk) {
        if (chunk == null) {
          return [];
        }
        const binaryChunk = chunk instanceof ArrayBuffer ? new Uint8Array(chunk) : typeof chunk === "string" ? (0, bytes_1.encodeUTF8)(chunk) : chunk;
        tslib_1.__classPrivateFieldSet(this, _LineDecoder_buffer, (0, bytes_1.concatBytes)([tslib_1.__classPrivateFieldGet(this, _LineDecoder_buffer, "f"), binaryChunk]), "f");
        const lines = [];
        let patternIndex;
        while ((patternIndex = findNewlineIndex(tslib_1.__classPrivateFieldGet(this, _LineDecoder_buffer, "f"), tslib_1.__classPrivateFieldGet(this, _LineDecoder_carriageReturnIndex, "f"))) != null) {
          if (patternIndex.carriage && tslib_1.__classPrivateFieldGet(this, _LineDecoder_carriageReturnIndex, "f") == null) {
            tslib_1.__classPrivateFieldSet(this, _LineDecoder_carriageReturnIndex, patternIndex.index, "f");
            continue;
          }
          if (tslib_1.__classPrivateFieldGet(this, _LineDecoder_carriageReturnIndex, "f") != null && (patternIndex.index !== tslib_1.__classPrivateFieldGet(this, _LineDecoder_carriageReturnIndex, "f") + 1 || patternIndex.carriage)) {
            lines.push((0, bytes_1.decodeUTF8)(tslib_1.__classPrivateFieldGet(this, _LineDecoder_buffer, "f").subarray(0, tslib_1.__classPrivateFieldGet(this, _LineDecoder_carriageReturnIndex, "f") - 1)));
            tslib_1.__classPrivateFieldSet(this, _LineDecoder_buffer, tslib_1.__classPrivateFieldGet(this, _LineDecoder_buffer, "f").subarray(tslib_1.__classPrivateFieldGet(this, _LineDecoder_carriageReturnIndex, "f")), "f");
            tslib_1.__classPrivateFieldSet(this, _LineDecoder_carriageReturnIndex, null, "f");
            continue;
          }
          const endIndex = tslib_1.__classPrivateFieldGet(this, _LineDecoder_carriageReturnIndex, "f") !== null ? patternIndex.preceding - 1 : patternIndex.preceding;
          const line = (0, bytes_1.decodeUTF8)(tslib_1.__classPrivateFieldGet(this, _LineDecoder_buffer, "f").subarray(0, endIndex));
          lines.push(line);
          tslib_1.__classPrivateFieldSet(this, _LineDecoder_buffer, tslib_1.__classPrivateFieldGet(this, _LineDecoder_buffer, "f").subarray(patternIndex.index), "f");
          tslib_1.__classPrivateFieldSet(this, _LineDecoder_carriageReturnIndex, null, "f");
        }
        return lines;
      }
      flush() {
        if (!tslib_1.__classPrivateFieldGet(this, _LineDecoder_buffer, "f").length) {
          return [];
        }
        return this.decode("\n");
      }
    };
    exports2.LineDecoder = LineDecoder;
    _LineDecoder_buffer = /* @__PURE__ */ new WeakMap(), _LineDecoder_carriageReturnIndex = /* @__PURE__ */ new WeakMap();
    LineDecoder.NEWLINE_CHARS = /* @__PURE__ */ new Set(["\n", "\r"]);
    LineDecoder.NEWLINE_REGEXP = /\r\n|[\n\r]/g;
    function findNewlineIndex(buffer, startIndex) {
      const newline = 10;
      const carriage = 13;
      for (let i = startIndex ?? 0; i < buffer.length; i++) {
        if (buffer[i] === newline) {
          return { preceding: i, index: i + 1, carriage: false };
        }
        if (buffer[i] === carriage) {
          return { preceding: i, index: i + 1, carriage: true };
        }
      }
      return null;
    }
    function findDoubleNewlineIndex(buffer) {
      const newline = 10;
      const carriage = 13;
      for (let i = 0; i < buffer.length - 1; i++) {
        if (buffer[i] === newline && buffer[i + 1] === newline) {
          return i + 2;
        }
        if (buffer[i] === carriage && buffer[i + 1] === carriage) {
          return i + 2;
        }
        if (buffer[i] === carriage && buffer[i + 1] === newline && i + 3 < buffer.length && buffer[i + 2] === carriage && buffer[i + 3] === newline) {
          return i + 4;
        }
      }
      return -1;
    }
  }
});

// node_modules/@anthropic-ai/sdk/internal/utils/log.js
var require_log = __commonJS({
  "node_modules/@anthropic-ai/sdk/internal/utils/log.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.formatRequestDetails = exports2.parseLogLevel = void 0;
    exports2.loggerFor = loggerFor;
    var values_1 = require_values();
    var levelNumbers = {
      off: 0,
      error: 200,
      warn: 300,
      info: 400,
      debug: 500
    };
    var parseLogLevel = (maybeLevel, sourceName, client) => {
      if (!maybeLevel) {
        return void 0;
      }
      if ((0, values_1.hasOwn)(levelNumbers, maybeLevel)) {
        return maybeLevel;
      }
      loggerFor(client).warn(`${sourceName} was set to ${JSON.stringify(maybeLevel)}, expected one of ${JSON.stringify(Object.keys(levelNumbers))}`);
      return void 0;
    };
    exports2.parseLogLevel = parseLogLevel;
    function noop() {
    }
    function makeLogFn(fnLevel, logger, logLevel) {
      if (!logger || levelNumbers[fnLevel] > levelNumbers[logLevel]) {
        return noop;
      } else {
        return logger[fnLevel].bind(logger);
      }
    }
    var noopLogger = {
      error: noop,
      warn: noop,
      info: noop,
      debug: noop
    };
    var cachedLoggers = /* @__PURE__ */ new WeakMap();
    function loggerFor(client) {
      const logger = client.logger;
      const logLevel = client.logLevel ?? "off";
      if (!logger) {
        return noopLogger;
      }
      const cachedLogger = cachedLoggers.get(logger);
      if (cachedLogger && cachedLogger[0] === logLevel) {
        return cachedLogger[1];
      }
      const levelLogger = {
        error: makeLogFn("error", logger, logLevel),
        warn: makeLogFn("warn", logger, logLevel),
        info: makeLogFn("info", logger, logLevel),
        debug: makeLogFn("debug", logger, logLevel)
      };
      cachedLoggers.set(logger, [logLevel, levelLogger]);
      return levelLogger;
    }
    var formatRequestDetails = (details) => {
      if (details.options) {
        details.options = { ...details.options };
        delete details.options["headers"];
      }
      if (details.headers) {
        details.headers = Object.fromEntries((details.headers instanceof Headers ? [...details.headers] : Object.entries(details.headers)).map(([name, value]) => [
          name,
          name.toLowerCase() === "x-api-key" || name.toLowerCase() === "authorization" || name.toLowerCase() === "cookie" || name.toLowerCase() === "set-cookie" ? "***" : value
        ]));
      }
      if ("retryOfRequestLogID" in details) {
        if (details.retryOfRequestLogID) {
          details.retryOf = details.retryOfRequestLogID;
        }
        delete details.retryOfRequestLogID;
      }
      return details;
    };
    exports2.formatRequestDetails = formatRequestDetails;
  }
});

// node_modules/@anthropic-ai/sdk/core/streaming.js
var require_streaming = __commonJS({
  "node_modules/@anthropic-ai/sdk/core/streaming.js"(exports2) {
    "use strict";
    var _Stream_client;
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.Stream = void 0;
    exports2._iterSSEMessages = _iterSSEMessages;
    var tslib_1 = require_tslib();
    var error_1 = require_error();
    var shims_1 = require_shims();
    var line_1 = require_line();
    var shims_2 = require_shims();
    var errors_1 = require_errors();
    var values_1 = require_values();
    var bytes_1 = require_bytes();
    var log_1 = require_log();
    var error_2 = require_error();
    var Stream = class _Stream {
      constructor(iterator, controller, client) {
        this.iterator = iterator;
        _Stream_client.set(this, void 0);
        this.controller = controller;
        tslib_1.__classPrivateFieldSet(this, _Stream_client, client, "f");
      }
      static fromSSEResponse(response, controller, client) {
        let consumed = false;
        const logger = client ? (0, log_1.loggerFor)(client) : console;
        async function* iterator() {
          if (consumed) {
            throw new error_1.AnthropicError("Cannot iterate over a consumed stream, use `.tee()` to split the stream.");
          }
          consumed = true;
          let done = false;
          try {
            for await (const sse of _iterSSEMessages(response, controller)) {
              if (sse.event === "completion") {
                try {
                  yield JSON.parse(sse.data);
                } catch (e) {
                  logger.error(`Could not parse message into JSON:`, sse.data);
                  logger.error(`From chunk:`, sse.raw);
                  throw e;
                }
              }
              if (sse.event === "message_start" || sse.event === "message_delta" || sse.event === "message_stop" || sse.event === "content_block_start" || sse.event === "content_block_delta" || sse.event === "content_block_stop") {
                try {
                  yield JSON.parse(sse.data);
                } catch (e) {
                  logger.error(`Could not parse message into JSON:`, sse.data);
                  logger.error(`From chunk:`, sse.raw);
                  throw e;
                }
              }
              if (sse.event === "ping") {
                continue;
              }
              if (sse.event === "error") {
                throw new error_2.APIError(void 0, (0, values_1.safeJSON)(sse.data) ?? sse.data, void 0, response.headers);
              }
            }
            done = true;
          } catch (e) {
            if ((0, errors_1.isAbortError)(e))
              return;
            throw e;
          } finally {
            if (!done)
              controller.abort();
          }
        }
        return new _Stream(iterator, controller, client);
      }
      /**
       * Generates a Stream from a newline-separated ReadableStream
       * where each item is a JSON value.
       */
      static fromReadableStream(readableStream, controller, client) {
        let consumed = false;
        async function* iterLines() {
          const lineDecoder = new line_1.LineDecoder();
          const iter = (0, shims_2.ReadableStreamToAsyncIterable)(readableStream);
          for await (const chunk of iter) {
            for (const line of lineDecoder.decode(chunk)) {
              yield line;
            }
          }
          for (const line of lineDecoder.flush()) {
            yield line;
          }
        }
        async function* iterator() {
          if (consumed) {
            throw new error_1.AnthropicError("Cannot iterate over a consumed stream, use `.tee()` to split the stream.");
          }
          consumed = true;
          let done = false;
          try {
            for await (const line of iterLines()) {
              if (done)
                continue;
              if (line)
                yield JSON.parse(line);
            }
            done = true;
          } catch (e) {
            if ((0, errors_1.isAbortError)(e))
              return;
            throw e;
          } finally {
            if (!done)
              controller.abort();
          }
        }
        return new _Stream(iterator, controller, client);
      }
      [(_Stream_client = /* @__PURE__ */ new WeakMap(), Symbol.asyncIterator)]() {
        return this.iterator();
      }
      /**
       * Splits the stream into two streams which can be
       * independently read from at different speeds.
       */
      tee() {
        const left = [];
        const right = [];
        const iterator = this.iterator();
        const teeIterator = (queue) => {
          return {
            next: () => {
              if (queue.length === 0) {
                const result = iterator.next();
                left.push(result);
                right.push(result);
              }
              return queue.shift();
            }
          };
        };
        return [
          new _Stream(() => teeIterator(left), this.controller, tslib_1.__classPrivateFieldGet(this, _Stream_client, "f")),
          new _Stream(() => teeIterator(right), this.controller, tslib_1.__classPrivateFieldGet(this, _Stream_client, "f"))
        ];
      }
      /**
       * Converts this stream to a newline-separated ReadableStream of
       * JSON stringified values in the stream
       * which can be turned back into a Stream with `Stream.fromReadableStream()`.
       */
      toReadableStream() {
        const self = this;
        let iter;
        return (0, shims_1.makeReadableStream)({
          async start() {
            iter = self[Symbol.asyncIterator]();
          },
          async pull(ctrl) {
            try {
              const { value, done } = await iter.next();
              if (done)
                return ctrl.close();
              const bytes = (0, bytes_1.encodeUTF8)(JSON.stringify(value) + "\n");
              ctrl.enqueue(bytes);
            } catch (err) {
              ctrl.error(err);
            }
          },
          async cancel() {
            await iter.return?.();
          }
        });
      }
    };
    exports2.Stream = Stream;
    async function* _iterSSEMessages(response, controller) {
      if (!response.body) {
        controller.abort();
        if (typeof globalThis.navigator !== "undefined" && globalThis.navigator.product === "ReactNative") {
          throw new error_1.AnthropicError(`The default react-native fetch implementation does not support streaming. Please use expo/fetch: https://docs.expo.dev/versions/latest/sdk/expo/#expofetch-api`);
        }
        throw new error_1.AnthropicError(`Attempted to iterate over a response with no body`);
      }
      const sseDecoder = new SSEDecoder();
      const lineDecoder = new line_1.LineDecoder();
      const iter = (0, shims_2.ReadableStreamToAsyncIterable)(response.body);
      for await (const sseChunk of iterSSEChunks(iter)) {
        for (const line of lineDecoder.decode(sseChunk)) {
          const sse = sseDecoder.decode(line);
          if (sse)
            yield sse;
        }
      }
      for (const line of lineDecoder.flush()) {
        const sse = sseDecoder.decode(line);
        if (sse)
          yield sse;
      }
    }
    async function* iterSSEChunks(iterator) {
      let data = new Uint8Array();
      for await (const chunk of iterator) {
        if (chunk == null) {
          continue;
        }
        const binaryChunk = chunk instanceof ArrayBuffer ? new Uint8Array(chunk) : typeof chunk === "string" ? (0, bytes_1.encodeUTF8)(chunk) : chunk;
        let newData = new Uint8Array(data.length + binaryChunk.length);
        newData.set(data);
        newData.set(binaryChunk, data.length);
        data = newData;
        let patternIndex;
        while ((patternIndex = (0, line_1.findDoubleNewlineIndex)(data)) !== -1) {
          yield data.slice(0, patternIndex);
          data = data.slice(patternIndex);
        }
      }
      if (data.length > 0) {
        yield data;
      }
    }
    var SSEDecoder = class {
      constructor() {
        this.event = null;
        this.data = [];
        this.chunks = [];
      }
      decode(line) {
        if (line.endsWith("\r")) {
          line = line.substring(0, line.length - 1);
        }
        if (!line) {
          if (!this.event && !this.data.length)
            return null;
          const sse = {
            event: this.event,
            data: this.data.join("\n"),
            raw: this.chunks
          };
          this.event = null;
          this.data = [];
          this.chunks = [];
          return sse;
        }
        this.chunks.push(line);
        if (line.startsWith(":")) {
          return null;
        }
        let [fieldname, _, value] = partition(line, ":");
        if (value.startsWith(" ")) {
          value = value.substring(1);
        }
        if (fieldname === "event") {
          this.event = value;
        } else if (fieldname === "data") {
          this.data.push(value);
        }
        return null;
      }
    };
    function partition(str, delimiter) {
      const index = str.indexOf(delimiter);
      if (index !== -1) {
        return [str.substring(0, index), delimiter, str.substring(index + delimiter.length)];
      }
      return [str, "", ""];
    }
  }
});

// node_modules/@anthropic-ai/sdk/internal/parse.js
var require_parse = __commonJS({
  "node_modules/@anthropic-ai/sdk/internal/parse.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.defaultParseResponse = defaultParseResponse;
    exports2.addRequestID = addRequestID;
    var streaming_1 = require_streaming();
    var log_1 = require_log();
    async function defaultParseResponse(client, props) {
      const { response, requestLogID, retryOfRequestLogID, startTime } = props;
      const body = await (async () => {
        if (props.options.stream) {
          (0, log_1.loggerFor)(client).debug("response", response.status, response.url, response.headers, response.body);
          if (props.options.__streamClass) {
            return props.options.__streamClass.fromSSEResponse(response, props.controller);
          }
          return streaming_1.Stream.fromSSEResponse(response, props.controller);
        }
        if (response.status === 204) {
          return null;
        }
        if (props.options.__binaryResponse) {
          return response;
        }
        const contentType = response.headers.get("content-type");
        const mediaType = contentType?.split(";")[0]?.trim();
        const isJSON = mediaType?.includes("application/json") || mediaType?.endsWith("+json");
        if (isJSON) {
          const contentLength = response.headers.get("content-length");
          if (contentLength === "0") {
            return void 0;
          }
          const json = await response.json();
          return addRequestID(json, response);
        }
        const text = await response.text();
        return text;
      })();
      (0, log_1.loggerFor)(client).debug(`[${requestLogID}] response parsed`, (0, log_1.formatRequestDetails)({
        retryOfRequestLogID,
        url: response.url,
        status: response.status,
        body,
        durationMs: Date.now() - startTime
      }));
      return body;
    }
    function addRequestID(value, response) {
      if (!value || typeof value !== "object" || Array.isArray(value)) {
        return value;
      }
      return Object.defineProperty(value, "_request_id", {
        value: response.headers.get("request-id"),
        enumerable: false
      });
    }
  }
});

// node_modules/@anthropic-ai/sdk/core/api-promise.js
var require_api_promise = __commonJS({
  "node_modules/@anthropic-ai/sdk/core/api-promise.js"(exports2) {
    "use strict";
    var _APIPromise_client;
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.APIPromise = void 0;
    var tslib_1 = require_tslib();
    var parse_1 = require_parse();
    var APIPromise = class _APIPromise extends Promise {
      constructor(client, responsePromise, parseResponse = parse_1.defaultParseResponse) {
        super((resolve) => {
          resolve(null);
        });
        this.responsePromise = responsePromise;
        this.parseResponse = parseResponse;
        _APIPromise_client.set(this, void 0);
        tslib_1.__classPrivateFieldSet(this, _APIPromise_client, client, "f");
      }
      _thenUnwrap(transform) {
        return new _APIPromise(tslib_1.__classPrivateFieldGet(this, _APIPromise_client, "f"), this.responsePromise, async (client, props) => (0, parse_1.addRequestID)(transform(await this.parseResponse(client, props), props), props.response));
      }
      /**
       * Gets the raw `Response` instance instead of parsing the response
       * data.
       *
       * If you want to parse the response body but still get the `Response`
       * instance, you can use {@link withResponse()}.
       *
       * 👋 Getting the wrong TypeScript type for `Response`?
       * Try setting `"moduleResolution": "NodeNext"` or add `"lib": ["DOM"]`
       * to your `tsconfig.json`.
       */
      asResponse() {
        return this.responsePromise.then((p) => p.response);
      }
      /**
       * Gets the parsed response data, the raw `Response` instance and the ID of the request,
       * returned via the `request-id` header which is useful for debugging requests and resporting
       * issues to Anthropic.
       *
       * If you just want to get the raw `Response` instance without parsing it,
       * you can use {@link asResponse()}.
       *
       * 👋 Getting the wrong TypeScript type for `Response`?
       * Try setting `"moduleResolution": "NodeNext"` or add `"lib": ["DOM"]`
       * to your `tsconfig.json`.
       */
      async withResponse() {
        const [data, response] = await Promise.all([this.parse(), this.asResponse()]);
        return { data, response, request_id: response.headers.get("request-id") };
      }
      parse() {
        if (!this.parsedPromise) {
          this.parsedPromise = this.responsePromise.then((data) => this.parseResponse(tslib_1.__classPrivateFieldGet(this, _APIPromise_client, "f"), data));
        }
        return this.parsedPromise;
      }
      then(onfulfilled, onrejected) {
        return this.parse().then(onfulfilled, onrejected);
      }
      catch(onrejected) {
        return this.parse().catch(onrejected);
      }
      finally(onfinally) {
        return this.parse().finally(onfinally);
      }
    };
    exports2.APIPromise = APIPromise;
    _APIPromise_client = /* @__PURE__ */ new WeakMap();
  }
});

// node_modules/@anthropic-ai/sdk/core/pagination.js
var require_pagination = __commonJS({
  "node_modules/@anthropic-ai/sdk/core/pagination.js"(exports2) {
    "use strict";
    var _AbstractPage_client;
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.PageCursor = exports2.TokenPage = exports2.Page = exports2.PagePromise = exports2.AbstractPage = void 0;
    var tslib_1 = require_tslib();
    var error_1 = require_error();
    var parse_1 = require_parse();
    var api_promise_1 = require_api_promise();
    var values_1 = require_values();
    var AbstractPage = class {
      constructor(client, response, body, options) {
        _AbstractPage_client.set(this, void 0);
        tslib_1.__classPrivateFieldSet(this, _AbstractPage_client, client, "f");
        this.options = options;
        this.response = response;
        this.body = body;
      }
      hasNextPage() {
        const items = this.getPaginatedItems();
        if (!items.length)
          return false;
        return this.nextPageRequestOptions() != null;
      }
      async getNextPage() {
        const nextOptions = this.nextPageRequestOptions();
        if (!nextOptions) {
          throw new error_1.AnthropicError("No next page expected; please check `.hasNextPage()` before calling `.getNextPage()`.");
        }
        return await tslib_1.__classPrivateFieldGet(this, _AbstractPage_client, "f").requestAPIList(this.constructor, nextOptions);
      }
      async *iterPages() {
        let page = this;
        yield page;
        while (page.hasNextPage()) {
          page = await page.getNextPage();
          yield page;
        }
      }
      async *[(_AbstractPage_client = /* @__PURE__ */ new WeakMap(), Symbol.asyncIterator)]() {
        for await (const page of this.iterPages()) {
          for (const item of page.getPaginatedItems()) {
            yield item;
          }
        }
      }
    };
    exports2.AbstractPage = AbstractPage;
    var PagePromise = class extends api_promise_1.APIPromise {
      constructor(client, request, Page2) {
        super(client, request, async (client2, props) => new Page2(client2, props.response, await (0, parse_1.defaultParseResponse)(client2, props), props.options));
      }
      /**
       * Allow auto-paginating iteration on an unawaited list call, eg:
       *
       *    for await (const item of client.items.list()) {
       *      console.log(item)
       *    }
       */
      async *[Symbol.asyncIterator]() {
        const page = await this;
        for await (const item of page) {
          yield item;
        }
      }
    };
    exports2.PagePromise = PagePromise;
    var Page = class extends AbstractPage {
      constructor(client, response, body, options) {
        super(client, response, body, options);
        this.data = body.data || [];
        this.has_more = body.has_more || false;
        this.first_id = body.first_id || null;
        this.last_id = body.last_id || null;
      }
      getPaginatedItems() {
        return this.data ?? [];
      }
      hasNextPage() {
        if (this.has_more === false) {
          return false;
        }
        return super.hasNextPage();
      }
      nextPageRequestOptions() {
        if (this.options.query?.["before_id"]) {
          const first_id = this.first_id;
          if (!first_id) {
            return null;
          }
          return {
            ...this.options,
            query: {
              ...(0, values_1.maybeObj)(this.options.query),
              before_id: first_id
            }
          };
        }
        const cursor = this.last_id;
        if (!cursor) {
          return null;
        }
        return {
          ...this.options,
          query: {
            ...(0, values_1.maybeObj)(this.options.query),
            after_id: cursor
          }
        };
      }
    };
    exports2.Page = Page;
    var TokenPage = class extends AbstractPage {
      constructor(client, response, body, options) {
        super(client, response, body, options);
        this.data = body.data || [];
        this.has_more = body.has_more || false;
        this.next_page = body.next_page || null;
      }
      getPaginatedItems() {
        return this.data ?? [];
      }
      hasNextPage() {
        if (this.has_more === false) {
          return false;
        }
        return super.hasNextPage();
      }
      nextPageRequestOptions() {
        const cursor = this.next_page;
        if (!cursor) {
          return null;
        }
        return {
          ...this.options,
          query: {
            ...(0, values_1.maybeObj)(this.options.query),
            page_token: cursor
          }
        };
      }
    };
    exports2.TokenPage = TokenPage;
    var PageCursor = class extends AbstractPage {
      constructor(client, response, body, options) {
        super(client, response, body, options);
        this.data = body.data || [];
        this.has_more = body.has_more || false;
        this.next_page = body.next_page || null;
      }
      getPaginatedItems() {
        return this.data ?? [];
      }
      hasNextPage() {
        if (this.has_more === false) {
          return false;
        }
        return super.hasNextPage();
      }
      nextPageRequestOptions() {
        const cursor = this.next_page;
        if (!cursor) {
          return null;
        }
        return {
          ...this.options,
          query: {
            ...(0, values_1.maybeObj)(this.options.query),
            page: cursor
          }
        };
      }
    };
    exports2.PageCursor = PageCursor;
  }
});

// node_modules/@anthropic-ai/sdk/internal/uploads.js
var require_uploads = __commonJS({
  "node_modules/@anthropic-ai/sdk/internal/uploads.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.createForm = exports2.multipartFormRequestOptions = exports2.maybeMultipartFormRequestOptions = exports2.isAsyncIterable = exports2.checkFileSupport = void 0;
    exports2.makeFile = makeFile;
    exports2.getName = getName;
    var shims_1 = require_shims();
    var checkFileSupport = () => {
      if (typeof File === "undefined") {
        const { process: process2 } = globalThis;
        const isOldNode = typeof process2?.versions?.node === "string" && parseInt(process2.versions.node.split(".")) < 20;
        throw new Error("`File` is not defined as a global, which is required for file uploads." + (isOldNode ? " Update to Node 20 LTS or newer, or set `globalThis.File` to `import('node:buffer').File`." : ""));
      }
    };
    exports2.checkFileSupport = checkFileSupport;
    function makeFile(fileBits, fileName, options) {
      (0, exports2.checkFileSupport)();
      return new File(fileBits, fileName ?? "unknown_file", options);
    }
    function getName(value, stripPath) {
      const val = typeof value === "object" && value !== null && ("name" in value && value.name && String(value.name) || "url" in value && value.url && String(value.url) || "filename" in value && value.filename && String(value.filename) || "path" in value && value.path && String(value.path)) || "";
      return stripPath ? val.split(/[\\/]/).pop() || void 0 : val;
    }
    var isAsyncIterable = (value) => value != null && typeof value === "object" && typeof value[Symbol.asyncIterator] === "function";
    exports2.isAsyncIterable = isAsyncIterable;
    var maybeMultipartFormRequestOptions = async (opts, fetch2) => {
      if (!hasUploadableValue(opts.body))
        return opts;
      return { ...opts, body: await (0, exports2.createForm)(opts.body, fetch2) };
    };
    exports2.maybeMultipartFormRequestOptions = maybeMultipartFormRequestOptions;
    var multipartFormRequestOptions = async (opts, fetch2, stripFilenames = true) => {
      return { ...opts, body: await (0, exports2.createForm)(opts.body, fetch2, stripFilenames) };
    };
    exports2.multipartFormRequestOptions = multipartFormRequestOptions;
    var supportsFormDataMap = /* @__PURE__ */ new WeakMap();
    function supportsFormData(fetchObject) {
      const fetch2 = typeof fetchObject === "function" ? fetchObject : fetchObject.fetch;
      const cached = supportsFormDataMap.get(fetch2);
      if (cached)
        return cached;
      const promise = (async () => {
        try {
          const FetchResponse = "Response" in fetch2 ? fetch2.Response : (await fetch2("data:,")).constructor;
          const data = new FormData();
          if (data.toString() === await new FetchResponse(data).text()) {
            return false;
          }
          return true;
        } catch {
          return true;
        }
      })();
      supportsFormDataMap.set(fetch2, promise);
      return promise;
    }
    var createForm = async (body, fetch2, stripFilenames = true) => {
      if (!await supportsFormData(fetch2)) {
        throw new TypeError("The provided fetch function does not support file uploads with the current global FormData class.");
      }
      const form = new FormData();
      await Promise.all(Object.entries(body || {}).map(([key, value]) => addFormValue(form, key, value, stripFilenames)));
      return form;
    };
    exports2.createForm = createForm;
    var isNamedBlob = (value) => value instanceof Blob && "name" in value;
    var isUploadable = (value) => typeof value === "object" && value !== null && (value instanceof Response || (0, exports2.isAsyncIterable)(value) || isNamedBlob(value));
    var hasUploadableValue = (value) => {
      if (isUploadable(value))
        return true;
      if (Array.isArray(value))
        return value.some(hasUploadableValue);
      if (value && typeof value === "object") {
        for (const k in value) {
          if (hasUploadableValue(value[k]))
            return true;
        }
      }
      return false;
    };
    var addFormValue = async (form, key, value, stripFilenames) => {
      if (value === void 0)
        return;
      if (value == null) {
        throw new TypeError(`Received null for "${key}"; to pass null in FormData, you must use the string 'null'`);
      }
      if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
        form.append(key, String(value));
      } else if (value instanceof Response) {
        let options = {};
        const contentType = value.headers.get("Content-Type");
        if (contentType) {
          options = { type: contentType };
        }
        form.append(key, makeFile([await value.blob()], getName(value, stripFilenames), options));
      } else if ((0, exports2.isAsyncIterable)(value)) {
        form.append(key, makeFile([await new Response((0, shims_1.ReadableStreamFrom)(value)).blob()], getName(value, stripFilenames)));
      } else if (isNamedBlob(value)) {
        form.append(key, makeFile([value], getName(value, stripFilenames), { type: value.type }));
      } else if (Array.isArray(value)) {
        await Promise.all(value.map((entry) => addFormValue(form, key + "[]", entry, stripFilenames)));
      } else if (typeof value === "object") {
        await Promise.all(Object.entries(value).map(([name, prop]) => addFormValue(form, `${key}[${name}]`, prop, stripFilenames)));
      } else {
        throw new TypeError(`Invalid value given to form, expected a string, number, boolean, object, Array, File or Blob but got ${value} instead`);
      }
    };
  }
});

// node_modules/@anthropic-ai/sdk/internal/to-file.js
var require_to_file = __commonJS({
  "node_modules/@anthropic-ai/sdk/internal/to-file.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.toFile = toFile;
    var uploads_1 = require_uploads();
    var uploads_2 = require_uploads();
    var isBlobLike = (value) => value != null && typeof value === "object" && typeof value.size === "number" && typeof value.type === "string" && typeof value.text === "function" && typeof value.slice === "function" && typeof value.arrayBuffer === "function";
    var isFileLike = (value) => value != null && typeof value === "object" && typeof value.name === "string" && typeof value.lastModified === "number" && isBlobLike(value);
    var isResponseLike = (value) => value != null && typeof value === "object" && typeof value.url === "string" && typeof value.blob === "function";
    async function toFile(value, name, options) {
      (0, uploads_2.checkFileSupport)();
      value = await value;
      name || (name = (0, uploads_1.getName)(value, true));
      if (isFileLike(value)) {
        if (value instanceof File && name == null && options == null) {
          return value;
        }
        return (0, uploads_1.makeFile)([await value.arrayBuffer()], name ?? value.name, {
          type: value.type,
          lastModified: value.lastModified,
          ...options
        });
      }
      if (isResponseLike(value)) {
        const blob = await value.blob();
        name || (name = new URL(value.url).pathname.split(/[\\/]/).pop());
        return (0, uploads_1.makeFile)(await getBytes(blob), name, options);
      }
      const parts = await getBytes(value);
      if (!options?.type) {
        const type = parts.find((part) => typeof part === "object" && "type" in part && part.type);
        if (typeof type === "string") {
          options = { ...options, type };
        }
      }
      return (0, uploads_1.makeFile)(parts, name, options);
    }
    async function getBytes(value) {
      let parts = [];
      if (typeof value === "string" || ArrayBuffer.isView(value) || // includes Uint8Array, Buffer, etc.
      value instanceof ArrayBuffer) {
        parts.push(value);
      } else if (isBlobLike(value)) {
        parts.push(value instanceof Blob ? value : await value.arrayBuffer());
      } else if ((0, uploads_1.isAsyncIterable)(value)) {
        for await (const chunk of value) {
          parts.push(...await getBytes(chunk));
        }
      } else {
        const constructor = value?.constructor?.name;
        throw new Error(`Unexpected data type: ${typeof value}${constructor ? `; constructor: ${constructor}` : ""}${propsForError(value)}`);
      }
      return parts;
    }
    function propsForError(value) {
      if (typeof value !== "object" || value === null)
        return "";
      const props = Object.getOwnPropertyNames(value);
      return `; props: [${props.map((p) => `"${p}"`).join(", ")}]`;
    }
  }
});

// node_modules/@anthropic-ai/sdk/core/uploads.js
var require_uploads2 = __commonJS({
  "node_modules/@anthropic-ai/sdk/core/uploads.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.toFile = void 0;
    var to_file_1 = require_to_file();
    Object.defineProperty(exports2, "toFile", { enumerable: true, get: function() {
      return to_file_1.toFile;
    } });
  }
});

// node_modules/@anthropic-ai/sdk/resources/shared.js
var require_shared = __commonJS({
  "node_modules/@anthropic-ai/sdk/resources/shared.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
  }
});

// node_modules/@anthropic-ai/sdk/core/resource.js
var require_resource = __commonJS({
  "node_modules/@anthropic-ai/sdk/core/resource.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.APIResource = void 0;
    var APIResource = class {
      constructor(client) {
        this._client = client;
      }
    };
    exports2.APIResource = APIResource;
  }
});

// node_modules/@anthropic-ai/sdk/internal/headers.js
var require_headers = __commonJS({
  "node_modules/@anthropic-ai/sdk/internal/headers.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.isEmptyHeaders = exports2.buildHeaders = void 0;
    var values_1 = require_values();
    var brand_privateNullableHeaders = /* @__PURE__ */ Symbol.for("brand.privateNullableHeaders");
    function* iterateHeaders(headers) {
      if (!headers)
        return;
      if (brand_privateNullableHeaders in headers) {
        const { values, nulls } = headers;
        yield* values.entries();
        for (const name of nulls) {
          yield [name, null];
        }
        return;
      }
      let shouldClear = false;
      let iter;
      if (headers instanceof Headers) {
        iter = headers.entries();
      } else if ((0, values_1.isReadonlyArray)(headers)) {
        iter = headers;
      } else {
        shouldClear = true;
        iter = Object.entries(headers ?? {});
      }
      for (let row of iter) {
        const name = row[0];
        if (typeof name !== "string")
          throw new TypeError("expected header name to be a string");
        const values = (0, values_1.isReadonlyArray)(row[1]) ? row[1] : [row[1]];
        let didClear = false;
        for (const value of values) {
          if (value === void 0)
            continue;
          if (shouldClear && !didClear) {
            didClear = true;
            yield [name, null];
          }
          yield [name, value];
        }
      }
    }
    var buildHeaders = (newHeaders) => {
      const targetHeaders = new Headers();
      const nullHeaders = /* @__PURE__ */ new Set();
      for (const headers of newHeaders) {
        const seenHeaders = /* @__PURE__ */ new Set();
        for (const [name, value] of iterateHeaders(headers)) {
          const lowerName = name.toLowerCase();
          if (!seenHeaders.has(lowerName)) {
            targetHeaders.delete(name);
            seenHeaders.add(lowerName);
          }
          if (value === null) {
            targetHeaders.delete(name);
            nullHeaders.add(lowerName);
          } else {
            targetHeaders.append(name, value);
            nullHeaders.delete(lowerName);
          }
        }
      }
      return { [brand_privateNullableHeaders]: true, values: targetHeaders, nulls: nullHeaders };
    };
    exports2.buildHeaders = buildHeaders;
    var isEmptyHeaders = (headers) => {
      for (const _ of iterateHeaders(headers))
        return false;
      return true;
    };
    exports2.isEmptyHeaders = isEmptyHeaders;
  }
});

// node_modules/@anthropic-ai/sdk/lib/stainless-helper-header.js
var require_stainless_helper_header = __commonJS({
  "node_modules/@anthropic-ai/sdk/lib/stainless-helper-header.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.SDK_HELPER_SYMBOL = void 0;
    exports2.wasCreatedByStainlessHelper = wasCreatedByStainlessHelper;
    exports2.collectStainlessHelpers = collectStainlessHelpers;
    exports2.stainlessHelperHeader = stainlessHelperHeader;
    exports2.stainlessHelperHeaderFromFile = stainlessHelperHeaderFromFile;
    exports2.SDK_HELPER_SYMBOL = /* @__PURE__ */ Symbol("anthropic.sdk.stainlessHelper");
    function wasCreatedByStainlessHelper(value) {
      return typeof value === "object" && value !== null && exports2.SDK_HELPER_SYMBOL in value;
    }
    function collectStainlessHelpers(tools, messages) {
      const helpers = /* @__PURE__ */ new Set();
      if (tools) {
        for (const tool of tools) {
          if (wasCreatedByStainlessHelper(tool)) {
            helpers.add(tool[exports2.SDK_HELPER_SYMBOL]);
          }
        }
      }
      if (messages) {
        for (const message of messages) {
          if (wasCreatedByStainlessHelper(message)) {
            helpers.add(message[exports2.SDK_HELPER_SYMBOL]);
          }
          if (Array.isArray(message.content)) {
            for (const block of message.content) {
              if (wasCreatedByStainlessHelper(block)) {
                helpers.add(block[exports2.SDK_HELPER_SYMBOL]);
              }
            }
          }
        }
      }
      return Array.from(helpers);
    }
    function stainlessHelperHeader(tools, messages) {
      const helpers = collectStainlessHelpers(tools, messages);
      if (helpers.length === 0)
        return {};
      return { "x-stainless-helper": helpers.join(", ") };
    }
    function stainlessHelperHeaderFromFile(file) {
      if (wasCreatedByStainlessHelper(file)) {
        return { "x-stainless-helper": file[exports2.SDK_HELPER_SYMBOL] };
      }
      return {};
    }
  }
});

// node_modules/@anthropic-ai/sdk/internal/utils/path.js
var require_path = __commonJS({
  "node_modules/@anthropic-ai/sdk/internal/utils/path.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.path = exports2.createPathTagFunction = void 0;
    exports2.encodeURIPath = encodeURIPath;
    var error_1 = require_error();
    function encodeURIPath(str) {
      return str.replace(/[^A-Za-z0-9\-._~!$&'()*+,;=:@]+/g, encodeURIComponent);
    }
    var EMPTY = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.create(null));
    var createPathTagFunction = (pathEncoder = encodeURIPath) => function path(statics, ...params) {
      if (statics.length === 1)
        return statics[0];
      let postPath = false;
      const invalidSegments = [];
      const path2 = statics.reduce((previousValue, currentValue, index) => {
        if (/[?#]/.test(currentValue)) {
          postPath = true;
        }
        const value = params[index];
        let encoded = (postPath ? encodeURIComponent : pathEncoder)("" + value);
        if (index !== params.length && (value == null || typeof value === "object" && // handle values from other realms
        value.toString === Object.getPrototypeOf(Object.getPrototypeOf(value.hasOwnProperty ?? EMPTY) ?? EMPTY)?.toString)) {
          encoded = value + "";
          invalidSegments.push({
            start: previousValue.length + currentValue.length,
            length: encoded.length,
            error: `Value of type ${Object.prototype.toString.call(value).slice(8, -1)} is not a valid path parameter`
          });
        }
        return previousValue + currentValue + (index === params.length ? "" : encoded);
      }, "");
      const pathOnly = path2.split(/[?#]/, 1)[0];
      const invalidSegmentPattern = /(?<=^|\/)(?:\.|%2e){1,2}(?=\/|$)/gi;
      let match;
      while ((match = invalidSegmentPattern.exec(pathOnly)) !== null) {
        invalidSegments.push({
          start: match.index,
          length: match[0].length,
          error: `Value "${match[0]}" can't be safely passed as a path parameter`
        });
      }
      invalidSegments.sort((a, b) => a.start - b.start);
      if (invalidSegments.length > 0) {
        let lastEnd = 0;
        const underline = invalidSegments.reduce((acc, segment) => {
          const spaces = " ".repeat(segment.start - lastEnd);
          const arrows = "^".repeat(segment.length);
          lastEnd = segment.start + segment.length;
          return acc + spaces + arrows;
        }, "");
        throw new error_1.AnthropicError(`Path parameters result in path with invalid segments:
${invalidSegments.map((e) => e.error).join("\n")}
${path2}
${underline}`);
      }
      return path2;
    };
    exports2.createPathTagFunction = createPathTagFunction;
    exports2.path = (0, exports2.createPathTagFunction)(encodeURIPath);
  }
});

// node_modules/@anthropic-ai/sdk/resources/beta/files.js
var require_files = __commonJS({
  "node_modules/@anthropic-ai/sdk/resources/beta/files.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.Files = void 0;
    var resource_1 = require_resource();
    var pagination_1 = require_pagination();
    var headers_1 = require_headers();
    var stainless_helper_header_1 = require_stainless_helper_header();
    var uploads_1 = require_uploads();
    var path_1 = require_path();
    var Files = class extends resource_1.APIResource {
      /**
       * List Files
       *
       * @example
       * ```ts
       * // Automatically fetches more pages as needed.
       * for await (const fileMetadata of client.beta.files.list()) {
       *   // ...
       * }
       * ```
       */
      list(params = {}, options) {
        const { betas, ...query } = params ?? {};
        return this._client.getAPIList("/v1/files", pagination_1.Page, {
          query,
          ...options,
          headers: (0, headers_1.buildHeaders)([
            { "anthropic-beta": [...betas ?? [], "files-api-2025-04-14"].toString() },
            options?.headers
          ])
        });
      }
      /**
       * Delete File
       *
       * @example
       * ```ts
       * const deletedFile = await client.beta.files.delete(
       *   'file_id',
       * );
       * ```
       */
      delete(fileID, params = {}, options) {
        const { betas } = params ?? {};
        return this._client.delete((0, path_1.path)`/v1/files/${fileID}`, {
          ...options,
          headers: (0, headers_1.buildHeaders)([
            { "anthropic-beta": [...betas ?? [], "files-api-2025-04-14"].toString() },
            options?.headers
          ])
        });
      }
      /**
       * Download File
       *
       * @example
       * ```ts
       * const response = await client.beta.files.download(
       *   'file_id',
       * );
       *
       * const content = await response.blob();
       * console.log(content);
       * ```
       */
      download(fileID, params = {}, options) {
        const { betas } = params ?? {};
        return this._client.get((0, path_1.path)`/v1/files/${fileID}/content`, {
          ...options,
          headers: (0, headers_1.buildHeaders)([
            {
              "anthropic-beta": [...betas ?? [], "files-api-2025-04-14"].toString(),
              Accept: "application/binary"
            },
            options?.headers
          ]),
          __binaryResponse: true
        });
      }
      /**
       * Get File Metadata
       *
       * @example
       * ```ts
       * const fileMetadata =
       *   await client.beta.files.retrieveMetadata('file_id');
       * ```
       */
      retrieveMetadata(fileID, params = {}, options) {
        const { betas } = params ?? {};
        return this._client.get((0, path_1.path)`/v1/files/${fileID}`, {
          ...options,
          headers: (0, headers_1.buildHeaders)([
            { "anthropic-beta": [...betas ?? [], "files-api-2025-04-14"].toString() },
            options?.headers
          ])
        });
      }
      /**
       * Upload File
       *
       * @example
       * ```ts
       * const fileMetadata = await client.beta.files.upload({
       *   file: fs.createReadStream('path/to/file'),
       * });
       * ```
       */
      upload(params, options) {
        const { betas, ...body } = params;
        return this._client.post("/v1/files", (0, uploads_1.multipartFormRequestOptions)({
          body,
          ...options,
          headers: (0, headers_1.buildHeaders)([
            { "anthropic-beta": [...betas ?? [], "files-api-2025-04-14"].toString() },
            (0, stainless_helper_header_1.stainlessHelperHeaderFromFile)(body.file),
            options?.headers
          ])
        }, this._client));
      }
    };
    exports2.Files = Files;
  }
});

// node_modules/@anthropic-ai/sdk/resources/beta/models.js
var require_models = __commonJS({
  "node_modules/@anthropic-ai/sdk/resources/beta/models.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.Models = void 0;
    var resource_1 = require_resource();
    var pagination_1 = require_pagination();
    var headers_1 = require_headers();
    var path_1 = require_path();
    var Models = class extends resource_1.APIResource {
      /**
       * Get a specific model.
       *
       * The Models API response can be used to determine information about a specific
       * model or resolve a model alias to a model ID.
       *
       * @example
       * ```ts
       * const betaModelInfo = await client.beta.models.retrieve(
       *   'model_id',
       * );
       * ```
       */
      retrieve(modelID, params = {}, options) {
        const { betas } = params ?? {};
        return this._client.get((0, path_1.path)`/v1/models/${modelID}?beta=true`, {
          ...options,
          headers: (0, headers_1.buildHeaders)([
            { ...betas?.toString() != null ? { "anthropic-beta": betas?.toString() } : void 0 },
            options?.headers
          ])
        });
      }
      /**
       * List available models.
       *
       * The Models API response can be used to determine which models are available for
       * use in the API. More recently released models are listed first.
       *
       * @example
       * ```ts
       * // Automatically fetches more pages as needed.
       * for await (const betaModelInfo of client.beta.models.list()) {
       *   // ...
       * }
       * ```
       */
      list(params = {}, options) {
        const { betas, ...query } = params ?? {};
        return this._client.getAPIList("/v1/models?beta=true", pagination_1.Page, {
          query,
          ...options,
          headers: (0, headers_1.buildHeaders)([
            { ...betas?.toString() != null ? { "anthropic-beta": betas?.toString() } : void 0 },
            options?.headers
          ])
        });
      }
    };
    exports2.Models = Models;
  }
});

// node_modules/@anthropic-ai/sdk/error.js
var require_error2 = __commonJS({
  "node_modules/@anthropic-ai/sdk/error.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    var tslib_1 = require_tslib();
    tslib_1.__exportStar(require_error(), exports2);
  }
});

// node_modules/@anthropic-ai/sdk/internal/constants.js
var require_constants = __commonJS({
  "node_modules/@anthropic-ai/sdk/internal/constants.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.MODEL_NONSTREAMING_TOKENS = void 0;
    exports2.MODEL_NONSTREAMING_TOKENS = {
      "claude-opus-4-20250514": 8192,
      "claude-opus-4-0": 8192,
      "claude-4-opus-20250514": 8192,
      "anthropic.claude-opus-4-20250514-v1:0": 8192,
      "claude-opus-4@20250514": 8192,
      "claude-opus-4-1-20250805": 8192,
      "anthropic.claude-opus-4-1-20250805-v1:0": 8192,
      "claude-opus-4-1@20250805": 8192
    };
  }
});

// node_modules/@anthropic-ai/sdk/lib/beta-parser.js
var require_beta_parser = __commonJS({
  "node_modules/@anthropic-ai/sdk/lib/beta-parser.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.maybeParseBetaMessage = maybeParseBetaMessage;
    exports2.parseBetaMessage = parseBetaMessage;
    var error_1 = require_error();
    function getOutputFormat(params) {
      return params?.output_format ?? params?.output_config?.format;
    }
    function maybeParseBetaMessage(message, params, opts) {
      const outputFormat = getOutputFormat(params);
      if (!params || !("parse" in (outputFormat ?? {}))) {
        return {
          ...message,
          content: message.content.map((block) => {
            if (block.type === "text") {
              const parsedBlock = Object.defineProperty({ ...block }, "parsed_output", {
                value: null,
                enumerable: false
              });
              return Object.defineProperty(parsedBlock, "parsed", {
                get() {
                  opts.logger.warn("The `parsed` property on `text` blocks is deprecated, please use `parsed_output` instead.");
                  return null;
                },
                enumerable: false
              });
            }
            return block;
          }),
          parsed_output: null
        };
      }
      return parseBetaMessage(message, params, opts);
    }
    function parseBetaMessage(message, params, opts) {
      let firstParsedOutput = null;
      const content = message.content.map((block) => {
        if (block.type === "text") {
          const parsedOutput = parseBetaOutputFormat(params, block.text);
          if (firstParsedOutput === null) {
            firstParsedOutput = parsedOutput;
          }
          const parsedBlock = Object.defineProperty({ ...block }, "parsed_output", {
            value: parsedOutput,
            enumerable: false
          });
          return Object.defineProperty(parsedBlock, "parsed", {
            get() {
              opts.logger.warn("The `parsed` property on `text` blocks is deprecated, please use `parsed_output` instead.");
              return parsedOutput;
            },
            enumerable: false
          });
        }
        return block;
      });
      return {
        ...message,
        content,
        parsed_output: firstParsedOutput
      };
    }
    function parseBetaOutputFormat(params, content) {
      const outputFormat = getOutputFormat(params);
      if (outputFormat?.type !== "json_schema") {
        return null;
      }
      try {
        if ("parse" in outputFormat) {
          return outputFormat.parse(content);
        }
        return JSON.parse(content);
      } catch (error) {
        throw new error_1.AnthropicError(`Failed to parse structured output: ${error}`);
      }
    }
  }
});

// node_modules/@anthropic-ai/sdk/_vendor/partial-json-parser/parser.js
var require_parser = __commonJS({
  "node_modules/@anthropic-ai/sdk/_vendor/partial-json-parser/parser.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.partialParse = void 0;
    var tokenize = (input) => {
      let current = 0;
      let tokens = [];
      while (current < input.length) {
        let char = input[current];
        if (char === "\\") {
          current++;
          continue;
        }
        if (char === "{") {
          tokens.push({
            type: "brace",
            value: "{"
          });
          current++;
          continue;
        }
        if (char === "}") {
          tokens.push({
            type: "brace",
            value: "}"
          });
          current++;
          continue;
        }
        if (char === "[") {
          tokens.push({
            type: "paren",
            value: "["
          });
          current++;
          continue;
        }
        if (char === "]") {
          tokens.push({
            type: "paren",
            value: "]"
          });
          current++;
          continue;
        }
        if (char === ":") {
          tokens.push({
            type: "separator",
            value: ":"
          });
          current++;
          continue;
        }
        if (char === ",") {
          tokens.push({
            type: "delimiter",
            value: ","
          });
          current++;
          continue;
        }
        if (char === '"') {
          let value = "";
          let danglingQuote = false;
          char = input[++current];
          while (char !== '"') {
            if (current === input.length) {
              danglingQuote = true;
              break;
            }
            if (char === "\\") {
              current++;
              if (current === input.length) {
                danglingQuote = true;
                break;
              }
              value += char + input[current];
              char = input[++current];
            } else {
              value += char;
              char = input[++current];
            }
          }
          char = input[++current];
          if (!danglingQuote) {
            tokens.push({
              type: "string",
              value
            });
          }
          continue;
        }
        let WHITESPACE = /\s/;
        if (char && WHITESPACE.test(char)) {
          current++;
          continue;
        }
        let NUMBERS = /[0-9]/;
        if (char && NUMBERS.test(char) || char === "-" || char === ".") {
          let value = "";
          if (char === "-") {
            value += char;
            char = input[++current];
          }
          while (char && NUMBERS.test(char) || char === ".") {
            value += char;
            char = input[++current];
          }
          tokens.push({
            type: "number",
            value
          });
          continue;
        }
        let LETTERS = /[a-z]/i;
        if (char && LETTERS.test(char)) {
          let value = "";
          while (char && LETTERS.test(char)) {
            if (current === input.length) {
              break;
            }
            value += char;
            char = input[++current];
          }
          if (value == "true" || value == "false" || value === "null") {
            tokens.push({
              type: "name",
              value
            });
          } else {
            current++;
            continue;
          }
          continue;
        }
        current++;
      }
      return tokens;
    };
    var strip = (tokens) => {
      if (tokens.length === 0) {
        return tokens;
      }
      let lastToken = tokens[tokens.length - 1];
      switch (lastToken.type) {
        case "separator":
          tokens = tokens.slice(0, tokens.length - 1);
          return strip(tokens);
          break;
        case "number":
          let lastCharacterOfLastToken = lastToken.value[lastToken.value.length - 1];
          if (lastCharacterOfLastToken === "." || lastCharacterOfLastToken === "-") {
            tokens = tokens.slice(0, tokens.length - 1);
            return strip(tokens);
          }
        case "string":
          let tokenBeforeTheLastToken = tokens[tokens.length - 2];
          if (tokenBeforeTheLastToken?.type === "delimiter") {
            tokens = tokens.slice(0, tokens.length - 1);
            return strip(tokens);
          } else if (tokenBeforeTheLastToken?.type === "brace" && tokenBeforeTheLastToken.value === "{") {
            tokens = tokens.slice(0, tokens.length - 1);
            return strip(tokens);
          }
          break;
        case "delimiter":
          tokens = tokens.slice(0, tokens.length - 1);
          return strip(tokens);
          break;
      }
      return tokens;
    };
    var unstrip = (tokens) => {
      let tail = [];
      tokens.map((token) => {
        if (token.type === "brace") {
          if (token.value === "{") {
            tail.push("}");
          } else {
            tail.splice(tail.lastIndexOf("}"), 1);
          }
        }
        if (token.type === "paren") {
          if (token.value === "[") {
            tail.push("]");
          } else {
            tail.splice(tail.lastIndexOf("]"), 1);
          }
        }
      });
      if (tail.length > 0) {
        tail.reverse().map((item) => {
          if (item === "}") {
            tokens.push({
              type: "brace",
              value: "}"
            });
          } else if (item === "]") {
            tokens.push({
              type: "paren",
              value: "]"
            });
          }
        });
      }
      return tokens;
    };
    var generate = (tokens) => {
      let output = "";
      tokens.map((token) => {
        switch (token.type) {
          case "string":
            output += '"' + token.value + '"';
            break;
          default:
            output += token.value;
            break;
        }
      });
      return output;
    };
    var partialParse = (input) => JSON.parse(generate(unstrip(strip(tokenize(input)))));
    exports2.partialParse = partialParse;
  }
});

// node_modules/@anthropic-ai/sdk/streaming.js
var require_streaming2 = __commonJS({
  "node_modules/@anthropic-ai/sdk/streaming.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    var tslib_1 = require_tslib();
    tslib_1.__exportStar(require_streaming(), exports2);
  }
});

// node_modules/@anthropic-ai/sdk/lib/BetaMessageStream.js
var require_BetaMessageStream = __commonJS({
  "node_modules/@anthropic-ai/sdk/lib/BetaMessageStream.js"(exports2) {
    "use strict";
    var _BetaMessageStream_instances;
    var _BetaMessageStream_currentMessageSnapshot;
    var _BetaMessageStream_params;
    var _BetaMessageStream_connectedPromise;
    var _BetaMessageStream_resolveConnectedPromise;
    var _BetaMessageStream_rejectConnectedPromise;
    var _BetaMessageStream_endPromise;
    var _BetaMessageStream_resolveEndPromise;
    var _BetaMessageStream_rejectEndPromise;
    var _BetaMessageStream_listeners;
    var _BetaMessageStream_ended;
    var _BetaMessageStream_errored;
    var _BetaMessageStream_aborted;
    var _BetaMessageStream_catchingPromiseCreated;
    var _BetaMessageStream_response;
    var _BetaMessageStream_request_id;
    var _BetaMessageStream_logger;
    var _BetaMessageStream_getFinalMessage;
    var _BetaMessageStream_getFinalText;
    var _BetaMessageStream_handleError;
    var _BetaMessageStream_beginRequest;
    var _BetaMessageStream_addStreamEvent;
    var _BetaMessageStream_endRequest;
    var _BetaMessageStream_accumulateMessage;
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.BetaMessageStream = void 0;
    var tslib_1 = require_tslib();
    var parser_1 = require_parser();
    var error_1 = require_error2();
    var errors_1 = require_errors();
    var streaming_1 = require_streaming2();
    var beta_parser_1 = require_beta_parser();
    var JSON_BUF_PROPERTY = "__json_buf";
    function tracksToolInput(content) {
      return content.type === "tool_use" || content.type === "server_tool_use" || content.type === "mcp_tool_use";
    }
    var BetaMessageStream = class _BetaMessageStream {
      constructor(params, opts) {
        _BetaMessageStream_instances.add(this);
        this.messages = [];
        this.receivedMessages = [];
        _BetaMessageStream_currentMessageSnapshot.set(this, void 0);
        _BetaMessageStream_params.set(this, null);
        this.controller = new AbortController();
        _BetaMessageStream_connectedPromise.set(this, void 0);
        _BetaMessageStream_resolveConnectedPromise.set(this, () => {
        });
        _BetaMessageStream_rejectConnectedPromise.set(this, () => {
        });
        _BetaMessageStream_endPromise.set(this, void 0);
        _BetaMessageStream_resolveEndPromise.set(this, () => {
        });
        _BetaMessageStream_rejectEndPromise.set(this, () => {
        });
        _BetaMessageStream_listeners.set(this, {});
        _BetaMessageStream_ended.set(this, false);
        _BetaMessageStream_errored.set(this, false);
        _BetaMessageStream_aborted.set(this, false);
        _BetaMessageStream_catchingPromiseCreated.set(this, false);
        _BetaMessageStream_response.set(this, void 0);
        _BetaMessageStream_request_id.set(this, void 0);
        _BetaMessageStream_logger.set(this, void 0);
        _BetaMessageStream_handleError.set(this, (error) => {
          tslib_1.__classPrivateFieldSet(this, _BetaMessageStream_errored, true, "f");
          if ((0, errors_1.isAbortError)(error)) {
            error = new error_1.APIUserAbortError();
          }
          if (error instanceof error_1.APIUserAbortError) {
            tslib_1.__classPrivateFieldSet(this, _BetaMessageStream_aborted, true, "f");
            return this._emit("abort", error);
          }
          if (error instanceof error_1.AnthropicError) {
            return this._emit("error", error);
          }
          if (error instanceof Error) {
            const anthropicError = new error_1.AnthropicError(error.message);
            anthropicError.cause = error;
            return this._emit("error", anthropicError);
          }
          return this._emit("error", new error_1.AnthropicError(String(error)));
        });
        tslib_1.__classPrivateFieldSet(this, _BetaMessageStream_connectedPromise, new Promise((resolve, reject) => {
          tslib_1.__classPrivateFieldSet(this, _BetaMessageStream_resolveConnectedPromise, resolve, "f");
          tslib_1.__classPrivateFieldSet(this, _BetaMessageStream_rejectConnectedPromise, reject, "f");
        }), "f");
        tslib_1.__classPrivateFieldSet(this, _BetaMessageStream_endPromise, new Promise((resolve, reject) => {
          tslib_1.__classPrivateFieldSet(this, _BetaMessageStream_resolveEndPromise, resolve, "f");
          tslib_1.__classPrivateFieldSet(this, _BetaMessageStream_rejectEndPromise, reject, "f");
        }), "f");
        tslib_1.__classPrivateFieldGet(this, _BetaMessageStream_connectedPromise, "f").catch(() => {
        });
        tslib_1.__classPrivateFieldGet(this, _BetaMessageStream_endPromise, "f").catch(() => {
        });
        tslib_1.__classPrivateFieldSet(this, _BetaMessageStream_params, params, "f");
        tslib_1.__classPrivateFieldSet(this, _BetaMessageStream_logger, opts?.logger ?? console, "f");
      }
      get response() {
        return tslib_1.__classPrivateFieldGet(this, _BetaMessageStream_response, "f");
      }
      get request_id() {
        return tslib_1.__classPrivateFieldGet(this, _BetaMessageStream_request_id, "f");
      }
      /**
       * Returns the `MessageStream` data, the raw `Response` instance and the ID of the request,
       * returned vie the `request-id` header which is useful for debugging requests and resporting
       * issues to Anthropic.
       *
       * This is the same as the `APIPromise.withResponse()` method.
       *
       * This method will raise an error if you created the stream using `MessageStream.fromReadableStream`
       * as no `Response` is available.
       */
      async withResponse() {
        tslib_1.__classPrivateFieldSet(this, _BetaMessageStream_catchingPromiseCreated, true, "f");
        const response = await tslib_1.__classPrivateFieldGet(this, _BetaMessageStream_connectedPromise, "f");
        if (!response) {
          throw new Error("Could not resolve a `Response` object");
        }
        return {
          data: this,
          response,
          request_id: response.headers.get("request-id")
        };
      }
      /**
       * Intended for use on the frontend, consuming a stream produced with
       * `.toReadableStream()` on the backend.
       *
       * Note that messages sent to the model do not appear in `.on('message')`
       * in this context.
       */
      static fromReadableStream(stream) {
        const runner = new _BetaMessageStream(null);
        runner._run(() => runner._fromReadableStream(stream));
        return runner;
      }
      static createMessage(messages, params, options, { logger } = {}) {
        const runner = new _BetaMessageStream(params, { logger });
        for (const message of params.messages) {
          runner._addMessageParam(message);
        }
        tslib_1.__classPrivateFieldSet(runner, _BetaMessageStream_params, { ...params, stream: true }, "f");
        runner._run(() => runner._createMessage(messages, { ...params, stream: true }, { ...options, headers: { ...options?.headers, "X-Stainless-Helper-Method": "stream" } }));
        return runner;
      }
      _run(executor) {
        executor().then(() => {
          this._emitFinal();
          this._emit("end");
        }, tslib_1.__classPrivateFieldGet(this, _BetaMessageStream_handleError, "f"));
      }
      _addMessageParam(message) {
        this.messages.push(message);
      }
      _addMessage(message, emit = true) {
        this.receivedMessages.push(message);
        if (emit) {
          this._emit("message", message);
        }
      }
      async _createMessage(messages, params, options) {
        const signal = options?.signal;
        let abortHandler;
        if (signal) {
          if (signal.aborted)
            this.controller.abort();
          abortHandler = this.controller.abort.bind(this.controller);
          signal.addEventListener("abort", abortHandler);
        }
        try {
          tslib_1.__classPrivateFieldGet(this, _BetaMessageStream_instances, "m", _BetaMessageStream_beginRequest).call(this);
          const { response, data: stream } = await messages.create({ ...params, stream: true }, { ...options, signal: this.controller.signal }).withResponse();
          this._connected(response);
          for await (const event of stream) {
            tslib_1.__classPrivateFieldGet(this, _BetaMessageStream_instances, "m", _BetaMessageStream_addStreamEvent).call(this, event);
          }
          if (stream.controller.signal?.aborted) {
            throw new error_1.APIUserAbortError();
          }
          tslib_1.__classPrivateFieldGet(this, _BetaMessageStream_instances, "m", _BetaMessageStream_endRequest).call(this);
        } finally {
          if (signal && abortHandler) {
            signal.removeEventListener("abort", abortHandler);
          }
        }
      }
      _connected(response) {
        if (this.ended)
          return;
        tslib_1.__classPrivateFieldSet(this, _BetaMessageStream_response, response, "f");
        tslib_1.__classPrivateFieldSet(this, _BetaMessageStream_request_id, response?.headers.get("request-id"), "f");
        tslib_1.__classPrivateFieldGet(this, _BetaMessageStream_resolveConnectedPromise, "f").call(this, response);
        this._emit("connect");
      }
      get ended() {
        return tslib_1.__classPrivateFieldGet(this, _BetaMessageStream_ended, "f");
      }
      get errored() {
        return tslib_1.__classPrivateFieldGet(this, _BetaMessageStream_errored, "f");
      }
      get aborted() {
        return tslib_1.__classPrivateFieldGet(this, _BetaMessageStream_aborted, "f");
      }
      abort() {
        this.controller.abort();
      }
      /**
       * Adds the listener function to the end of the listeners array for the event.
       * No checks are made to see if the listener has already been added. Multiple calls passing
       * the same combination of event and listener will result in the listener being added, and
       * called, multiple times.
       * @returns this MessageStream, so that calls can be chained
       */
      on(event, listener) {
        const listeners = tslib_1.__classPrivateFieldGet(this, _BetaMessageStream_listeners, "f")[event] || (tslib_1.__classPrivateFieldGet(this, _BetaMessageStream_listeners, "f")[event] = []);
        listeners.push({ listener });
        return this;
      }
      /**
       * Removes the specified listener from the listener array for the event.
       * off() will remove, at most, one instance of a listener from the listener array. If any single
       * listener has been added multiple times to the listener array for the specified event, then
       * off() must be called multiple times to remove each instance.
       * @returns this MessageStream, so that calls can be chained
       */
      off(event, listener) {
        const listeners = tslib_1.__classPrivateFieldGet(this, _BetaMessageStream_listeners, "f")[event];
        if (!listeners)
          return this;
        const index = listeners.findIndex((l) => l.listener === listener);
        if (index >= 0)
          listeners.splice(index, 1);
        return this;
      }
      /**
       * Adds a one-time listener function for the event. The next time the event is triggered,
       * this listener is removed and then invoked.
       * @returns this MessageStream, so that calls can be chained
       */
      once(event, listener) {
        const listeners = tslib_1.__classPrivateFieldGet(this, _BetaMessageStream_listeners, "f")[event] || (tslib_1.__classPrivateFieldGet(this, _BetaMessageStream_listeners, "f")[event] = []);
        listeners.push({ listener, once: true });
        return this;
      }
      /**
       * This is similar to `.once()`, but returns a Promise that resolves the next time
       * the event is triggered, instead of calling a listener callback.
       * @returns a Promise that resolves the next time given event is triggered,
       * or rejects if an error is emitted.  (If you request the 'error' event,
       * returns a promise that resolves with the error).
       *
       * Example:
       *
       *   const message = await stream.emitted('message') // rejects if the stream errors
       */
      emitted(event) {
        return new Promise((resolve, reject) => {
          tslib_1.__classPrivateFieldSet(this, _BetaMessageStream_catchingPromiseCreated, true, "f");
          if (event !== "error")
            this.once("error", reject);
          this.once(event, resolve);
        });
      }
      async done() {
        tslib_1.__classPrivateFieldSet(this, _BetaMessageStream_catchingPromiseCreated, true, "f");
        await tslib_1.__classPrivateFieldGet(this, _BetaMessageStream_endPromise, "f");
      }
      get currentMessage() {
        return tslib_1.__classPrivateFieldGet(this, _BetaMessageStream_currentMessageSnapshot, "f");
      }
      /**
       * @returns a promise that resolves with the the final assistant Message response,
       * or rejects if an error occurred or the stream ended prematurely without producing a Message.
       * If structured outputs were used, this will be a ParsedMessage with a `parsed` field.
       */
      async finalMessage() {
        await this.done();
        return tslib_1.__classPrivateFieldGet(this, _BetaMessageStream_instances, "m", _BetaMessageStream_getFinalMessage).call(this);
      }
      /**
       * @returns a promise that resolves with the the final assistant Message's text response, concatenated
       * together if there are more than one text blocks.
       * Rejects if an error occurred or the stream ended prematurely without producing a Message.
       */
      async finalText() {
        await this.done();
        return tslib_1.__classPrivateFieldGet(this, _BetaMessageStream_instances, "m", _BetaMessageStream_getFinalText).call(this);
      }
      _emit(event, ...args) {
        if (tslib_1.__classPrivateFieldGet(this, _BetaMessageStream_ended, "f"))
          return;
        if (event === "end") {
          tslib_1.__classPrivateFieldSet(this, _BetaMessageStream_ended, true, "f");
          tslib_1.__classPrivateFieldGet(this, _BetaMessageStream_resolveEndPromise, "f").call(this);
        }
        const listeners = tslib_1.__classPrivateFieldGet(this, _BetaMessageStream_listeners, "f")[event];
        if (listeners) {
          tslib_1.__classPrivateFieldGet(this, _BetaMessageStream_listeners, "f")[event] = listeners.filter((l) => !l.once);
          listeners.forEach(({ listener }) => listener(...args));
        }
        if (event === "abort") {
          const error = args[0];
          if (!tslib_1.__classPrivateFieldGet(this, _BetaMessageStream_catchingPromiseCreated, "f") && !listeners?.length) {
            Promise.reject(error);
          }
          tslib_1.__classPrivateFieldGet(this, _BetaMessageStream_rejectConnectedPromise, "f").call(this, error);
          tslib_1.__classPrivateFieldGet(this, _BetaMessageStream_rejectEndPromise, "f").call(this, error);
          this._emit("end");
          return;
        }
        if (event === "error") {
          const error = args[0];
          if (!tslib_1.__classPrivateFieldGet(this, _BetaMessageStream_catchingPromiseCreated, "f") && !listeners?.length) {
            Promise.reject(error);
          }
          tslib_1.__classPrivateFieldGet(this, _BetaMessageStream_rejectConnectedPromise, "f").call(this, error);
          tslib_1.__classPrivateFieldGet(this, _BetaMessageStream_rejectEndPromise, "f").call(this, error);
          this._emit("end");
        }
      }
      _emitFinal() {
        const finalMessage = this.receivedMessages.at(-1);
        if (finalMessage) {
          this._emit("finalMessage", tslib_1.__classPrivateFieldGet(this, _BetaMessageStream_instances, "m", _BetaMessageStream_getFinalMessage).call(this));
        }
      }
      async _fromReadableStream(readableStream, options) {
        const signal = options?.signal;
        let abortHandler;
        if (signal) {
          if (signal.aborted)
            this.controller.abort();
          abortHandler = this.controller.abort.bind(this.controller);
          signal.addEventListener("abort", abortHandler);
        }
        try {
          tslib_1.__classPrivateFieldGet(this, _BetaMessageStream_instances, "m", _BetaMessageStream_beginRequest).call(this);
          this._connected(null);
          const stream = streaming_1.Stream.fromReadableStream(readableStream, this.controller);
          for await (const event of stream) {
            tslib_1.__classPrivateFieldGet(this, _BetaMessageStream_instances, "m", _BetaMessageStream_addStreamEvent).call(this, event);
          }
          if (stream.controller.signal?.aborted) {
            throw new error_1.APIUserAbortError();
          }
          tslib_1.__classPrivateFieldGet(this, _BetaMessageStream_instances, "m", _BetaMessageStream_endRequest).call(this);
        } finally {
          if (signal && abortHandler) {
            signal.removeEventListener("abort", abortHandler);
          }
        }
      }
      [(_BetaMessageStream_currentMessageSnapshot = /* @__PURE__ */ new WeakMap(), _BetaMessageStream_params = /* @__PURE__ */ new WeakMap(), _BetaMessageStream_connectedPromise = /* @__PURE__ */ new WeakMap(), _BetaMessageStream_resolveConnectedPromise = /* @__PURE__ */ new WeakMap(), _BetaMessageStream_rejectConnectedPromise = /* @__PURE__ */ new WeakMap(), _BetaMessageStream_endPromise = /* @__PURE__ */ new WeakMap(), _BetaMessageStream_resolveEndPromise = /* @__PURE__ */ new WeakMap(), _BetaMessageStream_rejectEndPromise = /* @__PURE__ */ new WeakMap(), _BetaMessageStream_listeners = /* @__PURE__ */ new WeakMap(), _BetaMessageStream_ended = /* @__PURE__ */ new WeakMap(), _BetaMessageStream_errored = /* @__PURE__ */ new WeakMap(), _BetaMessageStream_aborted = /* @__PURE__ */ new WeakMap(), _BetaMessageStream_catchingPromiseCreated = /* @__PURE__ */ new WeakMap(), _BetaMessageStream_response = /* @__PURE__ */ new WeakMap(), _BetaMessageStream_request_id = /* @__PURE__ */ new WeakMap(), _BetaMessageStream_logger = /* @__PURE__ */ new WeakMap(), _BetaMessageStream_handleError = /* @__PURE__ */ new WeakMap(), _BetaMessageStream_instances = /* @__PURE__ */ new WeakSet(), _BetaMessageStream_getFinalMessage = function _BetaMessageStream_getFinalMessage2() {
        if (this.receivedMessages.length === 0) {
          throw new error_1.AnthropicError("stream ended without producing a Message with role=assistant");
        }
        return this.receivedMessages.at(-1);
      }, _BetaMessageStream_getFinalText = function _BetaMessageStream_getFinalText2() {
        if (this.receivedMessages.length === 0) {
          throw new error_1.AnthropicError("stream ended without producing a Message with role=assistant");
        }
        const textBlocks = this.receivedMessages.at(-1).content.filter((block) => block.type === "text").map((block) => block.text);
        if (textBlocks.length === 0) {
          throw new error_1.AnthropicError("stream ended without producing a content block with type=text");
        }
        return textBlocks.join(" ");
      }, _BetaMessageStream_beginRequest = function _BetaMessageStream_beginRequest2() {
        if (this.ended)
          return;
        tslib_1.__classPrivateFieldSet(this, _BetaMessageStream_currentMessageSnapshot, void 0, "f");
      }, _BetaMessageStream_addStreamEvent = function _BetaMessageStream_addStreamEvent2(event) {
        if (this.ended)
          return;
        const messageSnapshot = tslib_1.__classPrivateFieldGet(this, _BetaMessageStream_instances, "m", _BetaMessageStream_accumulateMessage).call(this, event);
        this._emit("streamEvent", event, messageSnapshot);
        switch (event.type) {
          case "content_block_delta": {
            const content = messageSnapshot.content.at(-1);
            switch (event.delta.type) {
              case "text_delta": {
                if (content.type === "text") {
                  this._emit("text", event.delta.text, content.text || "");
                }
                break;
              }
              case "citations_delta": {
                if (content.type === "text") {
                  this._emit("citation", event.delta.citation, content.citations ?? []);
                }
                break;
              }
              case "input_json_delta": {
                if (tracksToolInput(content) && content.input) {
                  this._emit("inputJson", event.delta.partial_json, content.input);
                }
                break;
              }
              case "thinking_delta": {
                if (content.type === "thinking") {
                  this._emit("thinking", event.delta.thinking, content.thinking);
                }
                break;
              }
              case "signature_delta": {
                if (content.type === "thinking") {
                  this._emit("signature", content.signature);
                }
                break;
              }
              case "compaction_delta": {
                if (content.type === "compaction" && content.content) {
                  this._emit("compaction", content.content);
                }
                break;
              }
              default:
                checkNever(event.delta);
            }
            break;
          }
          case "message_stop": {
            this._addMessageParam(messageSnapshot);
            this._addMessage((0, beta_parser_1.maybeParseBetaMessage)(messageSnapshot, tslib_1.__classPrivateFieldGet(this, _BetaMessageStream_params, "f"), { logger: tslib_1.__classPrivateFieldGet(this, _BetaMessageStream_logger, "f") }), true);
            break;
          }
          case "content_block_stop": {
            this._emit("contentBlock", messageSnapshot.content.at(-1));
            break;
          }
          case "message_start": {
            tslib_1.__classPrivateFieldSet(this, _BetaMessageStream_currentMessageSnapshot, messageSnapshot, "f");
            break;
          }
          case "content_block_start":
          case "message_delta":
            break;
        }
      }, _BetaMessageStream_endRequest = function _BetaMessageStream_endRequest2() {
        if (this.ended) {
          throw new error_1.AnthropicError(`stream has ended, this shouldn't happen`);
        }
        const snapshot = tslib_1.__classPrivateFieldGet(this, _BetaMessageStream_currentMessageSnapshot, "f");
        if (!snapshot) {
          throw new error_1.AnthropicError(`request ended without sending any chunks`);
        }
        tslib_1.__classPrivateFieldSet(this, _BetaMessageStream_currentMessageSnapshot, void 0, "f");
        return (0, beta_parser_1.maybeParseBetaMessage)(snapshot, tslib_1.__classPrivateFieldGet(this, _BetaMessageStream_params, "f"), { logger: tslib_1.__classPrivateFieldGet(this, _BetaMessageStream_logger, "f") });
      }, _BetaMessageStream_accumulateMessage = function _BetaMessageStream_accumulateMessage2(event) {
        let snapshot = tslib_1.__classPrivateFieldGet(this, _BetaMessageStream_currentMessageSnapshot, "f");
        if (event.type === "message_start") {
          if (snapshot) {
            throw new error_1.AnthropicError(`Unexpected event order, got ${event.type} before receiving "message_stop"`);
          }
          return event.message;
        }
        if (!snapshot) {
          throw new error_1.AnthropicError(`Unexpected event order, got ${event.type} before "message_start"`);
        }
        switch (event.type) {
          case "message_stop":
            return snapshot;
          case "message_delta":
            snapshot.container = event.delta.container;
            snapshot.stop_reason = event.delta.stop_reason;
            snapshot.stop_sequence = event.delta.stop_sequence;
            snapshot.usage.output_tokens = event.usage.output_tokens;
            snapshot.context_management = event.context_management;
            if (event.usage.input_tokens != null) {
              snapshot.usage.input_tokens = event.usage.input_tokens;
            }
            if (event.usage.cache_creation_input_tokens != null) {
              snapshot.usage.cache_creation_input_tokens = event.usage.cache_creation_input_tokens;
            }
            if (event.usage.cache_read_input_tokens != null) {
              snapshot.usage.cache_read_input_tokens = event.usage.cache_read_input_tokens;
            }
            if (event.usage.server_tool_use != null) {
              snapshot.usage.server_tool_use = event.usage.server_tool_use;
            }
            if (event.usage.iterations != null) {
              snapshot.usage.iterations = event.usage.iterations;
            }
            return snapshot;
          case "content_block_start":
            snapshot.content.push(event.content_block);
            return snapshot;
          case "content_block_delta": {
            const snapshotContent = snapshot.content.at(event.index);
            switch (event.delta.type) {
              case "text_delta": {
                if (snapshotContent?.type === "text") {
                  snapshot.content[event.index] = {
                    ...snapshotContent,
                    text: (snapshotContent.text || "") + event.delta.text
                  };
                }
                break;
              }
              case "citations_delta": {
                if (snapshotContent?.type === "text") {
                  snapshot.content[event.index] = {
                    ...snapshotContent,
                    citations: [...snapshotContent.citations ?? [], event.delta.citation]
                  };
                }
                break;
              }
              case "input_json_delta": {
                if (snapshotContent && tracksToolInput(snapshotContent)) {
                  let jsonBuf = snapshotContent[JSON_BUF_PROPERTY] || "";
                  jsonBuf += event.delta.partial_json;
                  const newContent = { ...snapshotContent };
                  Object.defineProperty(newContent, JSON_BUF_PROPERTY, {
                    value: jsonBuf,
                    enumerable: false,
                    writable: true
                  });
                  if (jsonBuf) {
                    try {
                      newContent.input = (0, parser_1.partialParse)(jsonBuf);
                    } catch (err) {
                      const error = new error_1.AnthropicError(`Unable to parse tool parameter JSON from model. Please retry your request or adjust your prompt. Error: ${err}. JSON: ${jsonBuf}`);
                      tslib_1.__classPrivateFieldGet(this, _BetaMessageStream_handleError, "f").call(this, error);
                    }
                  }
                  snapshot.content[event.index] = newContent;
                }
                break;
              }
              case "thinking_delta": {
                if (snapshotContent?.type === "thinking") {
                  snapshot.content[event.index] = {
                    ...snapshotContent,
                    thinking: snapshotContent.thinking + event.delta.thinking
                  };
                }
                break;
              }
              case "signature_delta": {
                if (snapshotContent?.type === "thinking") {
                  snapshot.content[event.index] = {
                    ...snapshotContent,
                    signature: event.delta.signature
                  };
                }
                break;
              }
              case "compaction_delta": {
                if (snapshotContent?.type === "compaction") {
                  snapshot.content[event.index] = {
                    ...snapshotContent,
                    content: (snapshotContent.content || "") + event.delta.content
                  };
                }
                break;
              }
              default:
                checkNever(event.delta);
            }
            return snapshot;
          }
          case "content_block_stop":
            return snapshot;
        }
      }, Symbol.asyncIterator)]() {
        const pushQueue = [];
        const readQueue = [];
        let done = false;
        this.on("streamEvent", (event) => {
          const reader = readQueue.shift();
          if (reader) {
            reader.resolve(event);
          } else {
            pushQueue.push(event);
          }
        });
        this.on("end", () => {
          done = true;
          for (const reader of readQueue) {
            reader.resolve(void 0);
          }
          readQueue.length = 0;
        });
        this.on("abort", (err) => {
          done = true;
          for (const reader of readQueue) {
            reader.reject(err);
          }
          readQueue.length = 0;
        });
        this.on("error", (err) => {
          done = true;
          for (const reader of readQueue) {
            reader.reject(err);
          }
          readQueue.length = 0;
        });
        return {
          next: async () => {
            if (!pushQueue.length) {
              if (done) {
                return { value: void 0, done: true };
              }
              return new Promise((resolve, reject) => readQueue.push({ resolve, reject })).then((chunk2) => chunk2 ? { value: chunk2, done: false } : { value: void 0, done: true });
            }
            const chunk = pushQueue.shift();
            return { value: chunk, done: false };
          },
          return: async () => {
            this.abort();
            return { value: void 0, done: true };
          }
        };
      }
      toReadableStream() {
        const stream = new streaming_1.Stream(this[Symbol.asyncIterator].bind(this), this.controller);
        return stream.toReadableStream();
      }
    };
    exports2.BetaMessageStream = BetaMessageStream;
    function checkNever(x) {
    }
  }
});

// node_modules/@anthropic-ai/sdk/lib/tools/ToolError.js
var require_ToolError = __commonJS({
  "node_modules/@anthropic-ai/sdk/lib/tools/ToolError.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.ToolError = void 0;
    var ToolError = class extends Error {
      constructor(content) {
        const message = typeof content === "string" ? content : content.map((block) => {
          if (block.type === "text")
            return block.text;
          return `[${block.type}]`;
        }).join(" ");
        super(message);
        this.name = "ToolError";
        this.content = content;
      }
    };
    exports2.ToolError = ToolError;
  }
});

// node_modules/@anthropic-ai/sdk/lib/tools/CompactionControl.js
var require_CompactionControl = __commonJS({
  "node_modules/@anthropic-ai/sdk/lib/tools/CompactionControl.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.DEFAULT_SUMMARY_PROMPT = exports2.DEFAULT_TOKEN_THRESHOLD = void 0;
    exports2.DEFAULT_TOKEN_THRESHOLD = 1e5;
    exports2.DEFAULT_SUMMARY_PROMPT = `You have been working on the task described above but have not yet completed it. Write a continuation summary that will allow you (or another instance of yourself) to resume work efficiently in a future context window where the conversation history will be replaced with this summary. Your summary should be structured, concise, and actionable. Include:
1. Task Overview
The user's core request and success criteria
Any clarifications or constraints they specified
2. Current State
What has been completed so far
Files created, modified, or analyzed (with paths if relevant)
Key outputs or artifacts produced
3. Important Discoveries
Technical constraints or requirements uncovered
Decisions made and their rationale
Errors encountered and how they were resolved
What approaches were tried that didn't work (and why)
4. Next Steps
Specific actions needed to complete the task
Any blockers or open questions to resolve
Priority order if multiple steps remain
5. Context to Preserve
User preferences or style requirements
Domain-specific details that aren't obvious
Any promises made to the user
Be concise but complete\u2014err on the side of including information that would prevent duplicate work or repeated mistakes. Write in a way that enables immediate resumption of the task.
Wrap your summary in <summary></summary> tags.`;
  }
});

// node_modules/@anthropic-ai/sdk/lib/tools/BetaToolRunner.js
var require_BetaToolRunner = __commonJS({
  "node_modules/@anthropic-ai/sdk/lib/tools/BetaToolRunner.js"(exports2) {
    "use strict";
    var _BetaToolRunner_instances;
    var _BetaToolRunner_consumed;
    var _BetaToolRunner_mutated;
    var _BetaToolRunner_state;
    var _BetaToolRunner_options;
    var _BetaToolRunner_message;
    var _BetaToolRunner_toolResponse;
    var _BetaToolRunner_completion;
    var _BetaToolRunner_iterationCount;
    var _BetaToolRunner_checkAndCompact;
    var _BetaToolRunner_generateToolResponse;
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.BetaToolRunner = void 0;
    var tslib_1 = require_tslib();
    var ToolError_1 = require_ToolError();
    var error_1 = require_error();
    var headers_1 = require_headers();
    var CompactionControl_1 = require_CompactionControl();
    var stainless_helper_header_1 = require_stainless_helper_header();
    function promiseWithResolvers() {
      let resolve;
      let reject;
      const promise = new Promise((res, rej) => {
        resolve = res;
        reject = rej;
      });
      return { promise, resolve, reject };
    }
    var BetaToolRunner = class {
      constructor(client, params, options) {
        _BetaToolRunner_instances.add(this);
        this.client = client;
        _BetaToolRunner_consumed.set(this, false);
        _BetaToolRunner_mutated.set(this, false);
        _BetaToolRunner_state.set(this, void 0);
        _BetaToolRunner_options.set(this, void 0);
        _BetaToolRunner_message.set(this, void 0);
        _BetaToolRunner_toolResponse.set(this, void 0);
        _BetaToolRunner_completion.set(this, void 0);
        _BetaToolRunner_iterationCount.set(this, 0);
        tslib_1.__classPrivateFieldSet(this, _BetaToolRunner_state, {
          params: {
            // You can't clone the entire params since there are functions as handlers.
            // You also don't really need to clone params.messages, but it probably will prevent a foot gun
            // somewhere.
            ...params,
            messages: structuredClone(params.messages)
          }
        }, "f");
        const helpers = (0, stainless_helper_header_1.collectStainlessHelpers)(params.tools, params.messages);
        const helperValue = ["BetaToolRunner", ...helpers].join(", ");
        tslib_1.__classPrivateFieldSet(this, _BetaToolRunner_options, {
          ...options,
          headers: (0, headers_1.buildHeaders)([{ "x-stainless-helper": helperValue }, options?.headers])
        }, "f");
        tslib_1.__classPrivateFieldSet(this, _BetaToolRunner_completion, promiseWithResolvers(), "f");
      }
      async *[(_BetaToolRunner_consumed = /* @__PURE__ */ new WeakMap(), _BetaToolRunner_mutated = /* @__PURE__ */ new WeakMap(), _BetaToolRunner_state = /* @__PURE__ */ new WeakMap(), _BetaToolRunner_options = /* @__PURE__ */ new WeakMap(), _BetaToolRunner_message = /* @__PURE__ */ new WeakMap(), _BetaToolRunner_toolResponse = /* @__PURE__ */ new WeakMap(), _BetaToolRunner_completion = /* @__PURE__ */ new WeakMap(), _BetaToolRunner_iterationCount = /* @__PURE__ */ new WeakMap(), _BetaToolRunner_instances = /* @__PURE__ */ new WeakSet(), _BetaToolRunner_checkAndCompact = async function _BetaToolRunner_checkAndCompact2() {
        const compactionControl = tslib_1.__classPrivateFieldGet(this, _BetaToolRunner_state, "f").params.compactionControl;
        if (!compactionControl || !compactionControl.enabled) {
          return false;
        }
        let tokensUsed = 0;
        if (tslib_1.__classPrivateFieldGet(this, _BetaToolRunner_message, "f") !== void 0) {
          try {
            const message = await tslib_1.__classPrivateFieldGet(this, _BetaToolRunner_message, "f");
            const totalInputTokens = message.usage.input_tokens + (message.usage.cache_creation_input_tokens ?? 0) + (message.usage.cache_read_input_tokens ?? 0);
            tokensUsed = totalInputTokens + message.usage.output_tokens;
          } catch {
            return false;
          }
        }
        const threshold = compactionControl.contextTokenThreshold ?? CompactionControl_1.DEFAULT_TOKEN_THRESHOLD;
        if (tokensUsed < threshold) {
          return false;
        }
        const model = compactionControl.model ?? tslib_1.__classPrivateFieldGet(this, _BetaToolRunner_state, "f").params.model;
        const summaryPrompt = compactionControl.summaryPrompt ?? CompactionControl_1.DEFAULT_SUMMARY_PROMPT;
        const messages = tslib_1.__classPrivateFieldGet(this, _BetaToolRunner_state, "f").params.messages;
        if (messages[messages.length - 1].role === "assistant") {
          const lastMessage = messages[messages.length - 1];
          if (Array.isArray(lastMessage.content)) {
            const nonToolBlocks = lastMessage.content.filter((block) => block.type !== "tool_use");
            if (nonToolBlocks.length === 0) {
              messages.pop();
            } else {
              lastMessage.content = nonToolBlocks;
            }
          }
        }
        const response = await this.client.beta.messages.create({
          model,
          messages: [
            ...messages,
            {
              role: "user",
              content: [
                {
                  type: "text",
                  text: summaryPrompt
                }
              ]
            }
          ],
          max_tokens: tslib_1.__classPrivateFieldGet(this, _BetaToolRunner_state, "f").params.max_tokens
        }, {
          headers: { "x-stainless-helper": "compaction" }
        });
        if (response.content[0]?.type !== "text") {
          throw new error_1.AnthropicError("Expected text response for compaction");
        }
        tslib_1.__classPrivateFieldGet(this, _BetaToolRunner_state, "f").params.messages = [
          {
            role: "user",
            content: response.content
          }
        ];
        return true;
      }, Symbol.asyncIterator)]() {
        var _a;
        if (tslib_1.__classPrivateFieldGet(this, _BetaToolRunner_consumed, "f")) {
          throw new error_1.AnthropicError("Cannot iterate over a consumed stream");
        }
        tslib_1.__classPrivateFieldSet(this, _BetaToolRunner_consumed, true, "f");
        tslib_1.__classPrivateFieldSet(this, _BetaToolRunner_mutated, true, "f");
        tslib_1.__classPrivateFieldSet(this, _BetaToolRunner_toolResponse, void 0, "f");
        try {
          while (true) {
            let stream;
            try {
              if (tslib_1.__classPrivateFieldGet(this, _BetaToolRunner_state, "f").params.max_iterations && tslib_1.__classPrivateFieldGet(this, _BetaToolRunner_iterationCount, "f") >= tslib_1.__classPrivateFieldGet(this, _BetaToolRunner_state, "f").params.max_iterations) {
                break;
              }
              tslib_1.__classPrivateFieldSet(this, _BetaToolRunner_mutated, false, "f");
              tslib_1.__classPrivateFieldSet(this, _BetaToolRunner_toolResponse, void 0, "f");
              tslib_1.__classPrivateFieldSet(this, _BetaToolRunner_iterationCount, (_a = tslib_1.__classPrivateFieldGet(this, _BetaToolRunner_iterationCount, "f"), _a++, _a), "f");
              tslib_1.__classPrivateFieldSet(this, _BetaToolRunner_message, void 0, "f");
              const { max_iterations, compactionControl, ...params } = tslib_1.__classPrivateFieldGet(this, _BetaToolRunner_state, "f").params;
              if (params.stream) {
                stream = this.client.beta.messages.stream({ ...params }, tslib_1.__classPrivateFieldGet(this, _BetaToolRunner_options, "f"));
                tslib_1.__classPrivateFieldSet(this, _BetaToolRunner_message, stream.finalMessage(), "f");
                tslib_1.__classPrivateFieldGet(this, _BetaToolRunner_message, "f").catch(() => {
                });
                yield stream;
              } else {
                tslib_1.__classPrivateFieldSet(this, _BetaToolRunner_message, this.client.beta.messages.create({ ...params, stream: false }, tslib_1.__classPrivateFieldGet(this, _BetaToolRunner_options, "f")), "f");
                yield tslib_1.__classPrivateFieldGet(this, _BetaToolRunner_message, "f");
              }
              const isCompacted = await tslib_1.__classPrivateFieldGet(this, _BetaToolRunner_instances, "m", _BetaToolRunner_checkAndCompact).call(this);
              if (!isCompacted) {
                if (!tslib_1.__classPrivateFieldGet(this, _BetaToolRunner_mutated, "f")) {
                  const { role, content } = await tslib_1.__classPrivateFieldGet(this, _BetaToolRunner_message, "f");
                  tslib_1.__classPrivateFieldGet(this, _BetaToolRunner_state, "f").params.messages.push({ role, content });
                }
                const toolMessage = await tslib_1.__classPrivateFieldGet(this, _BetaToolRunner_instances, "m", _BetaToolRunner_generateToolResponse).call(this, tslib_1.__classPrivateFieldGet(this, _BetaToolRunner_state, "f").params.messages.at(-1));
                if (toolMessage) {
                  tslib_1.__classPrivateFieldGet(this, _BetaToolRunner_state, "f").params.messages.push(toolMessage);
                } else if (!tslib_1.__classPrivateFieldGet(this, _BetaToolRunner_mutated, "f")) {
                  break;
                }
              }
            } finally {
              if (stream) {
                stream.abort();
              }
            }
          }
          if (!tslib_1.__classPrivateFieldGet(this, _BetaToolRunner_message, "f")) {
            throw new error_1.AnthropicError("ToolRunner concluded without a message from the server");
          }
          tslib_1.__classPrivateFieldGet(this, _BetaToolRunner_completion, "f").resolve(await tslib_1.__classPrivateFieldGet(this, _BetaToolRunner_message, "f"));
        } catch (error) {
          tslib_1.__classPrivateFieldSet(this, _BetaToolRunner_consumed, false, "f");
          tslib_1.__classPrivateFieldGet(this, _BetaToolRunner_completion, "f").promise.catch(() => {
          });
          tslib_1.__classPrivateFieldGet(this, _BetaToolRunner_completion, "f").reject(error);
          tslib_1.__classPrivateFieldSet(this, _BetaToolRunner_completion, promiseWithResolvers(), "f");
          throw error;
        }
      }
      setMessagesParams(paramsOrMutator) {
        if (typeof paramsOrMutator === "function") {
          tslib_1.__classPrivateFieldGet(this, _BetaToolRunner_state, "f").params = paramsOrMutator(tslib_1.__classPrivateFieldGet(this, _BetaToolRunner_state, "f").params);
        } else {
          tslib_1.__classPrivateFieldGet(this, _BetaToolRunner_state, "f").params = paramsOrMutator;
        }
        tslib_1.__classPrivateFieldSet(this, _BetaToolRunner_mutated, true, "f");
        tslib_1.__classPrivateFieldSet(this, _BetaToolRunner_toolResponse, void 0, "f");
      }
      /**
       * Get the tool response for the last message from the assistant.
       * Avoids redundant tool executions by caching results.
       *
       * @returns A promise that resolves to a BetaMessageParam containing tool results, or null if no tools need to be executed
       *
       * @example
       * const toolResponse = await runner.generateToolResponse();
       * if (toolResponse) {
       *   console.log('Tool results:', toolResponse.content);
       * }
       */
      async generateToolResponse() {
        const message = await tslib_1.__classPrivateFieldGet(this, _BetaToolRunner_message, "f") ?? this.params.messages.at(-1);
        if (!message) {
          return null;
        }
        return tslib_1.__classPrivateFieldGet(this, _BetaToolRunner_instances, "m", _BetaToolRunner_generateToolResponse).call(this, message);
      }
      /**
       * Wait for the async iterator to complete. This works even if the async iterator hasn't yet started, and
       * will wait for an instance to start and go to completion.
       *
       * @returns A promise that resolves to the final BetaMessage when the iterator completes
       *
       * @example
       * // Start consuming the iterator
       * for await (const message of runner) {
       *   console.log('Message:', message.content);
       * }
       *
       * // Meanwhile, wait for completion from another part of the code
       * const finalMessage = await runner.done();
       * console.log('Final response:', finalMessage.content);
       */
      done() {
        return tslib_1.__classPrivateFieldGet(this, _BetaToolRunner_completion, "f").promise;
      }
      /**
       * Returns a promise indicating that the stream is done. Unlike .done(), this will eagerly read the stream:
       * * If the iterator has not been consumed, consume the entire iterator and return the final message from the
       * assistant.
       * * If the iterator has been consumed, waits for it to complete and returns the final message.
       *
       * @returns A promise that resolves to the final BetaMessage from the conversation
       * @throws {AnthropicError} If no messages were processed during the conversation
       *
       * @example
       * const finalMessage = await runner.runUntilDone();
       * console.log('Final response:', finalMessage.content);
       */
      async runUntilDone() {
        if (!tslib_1.__classPrivateFieldGet(this, _BetaToolRunner_consumed, "f")) {
          for await (const _ of this) {
          }
        }
        return this.done();
      }
      /**
       * Get the current parameters being used by the ToolRunner.
       *
       * @returns A readonly view of the current ToolRunnerParams
       *
       * @example
       * const currentParams = runner.params;
       * console.log('Current model:', currentParams.model);
       * console.log('Message count:', currentParams.messages.length);
       */
      get params() {
        return tslib_1.__classPrivateFieldGet(this, _BetaToolRunner_state, "f").params;
      }
      /**
       * Add one or more messages to the conversation history.
       *
       * @param messages - One or more BetaMessageParam objects to add to the conversation
       *
       * @example
       * runner.pushMessages(
       *   { role: 'user', content: 'Also, what about the weather in NYC?' }
       * );
       *
       * @example
       * // Adding multiple messages
       * runner.pushMessages(
       *   { role: 'user', content: 'What about NYC?' },
       *   { role: 'user', content: 'And Boston?' }
       * );
       */
      pushMessages(...messages) {
        this.setMessagesParams((params) => ({
          ...params,
          messages: [...params.messages, ...messages]
        }));
      }
      /**
       * Makes the ToolRunner directly awaitable, equivalent to calling .runUntilDone()
       * This allows using `await runner` instead of `await runner.runUntilDone()`
       */
      then(onfulfilled, onrejected) {
        return this.runUntilDone().then(onfulfilled, onrejected);
      }
    };
    exports2.BetaToolRunner = BetaToolRunner;
    _BetaToolRunner_generateToolResponse = async function _BetaToolRunner_generateToolResponse2(lastMessage) {
      if (tslib_1.__classPrivateFieldGet(this, _BetaToolRunner_toolResponse, "f") !== void 0) {
        return tslib_1.__classPrivateFieldGet(this, _BetaToolRunner_toolResponse, "f");
      }
      tslib_1.__classPrivateFieldSet(this, _BetaToolRunner_toolResponse, generateToolResponse(tslib_1.__classPrivateFieldGet(this, _BetaToolRunner_state, "f").params, lastMessage), "f");
      return tslib_1.__classPrivateFieldGet(this, _BetaToolRunner_toolResponse, "f");
    };
    async function generateToolResponse(params, lastMessage = params.messages.at(-1)) {
      if (!lastMessage || lastMessage.role !== "assistant" || !lastMessage.content || typeof lastMessage.content === "string") {
        return null;
      }
      const toolUseBlocks = lastMessage.content.filter((content) => content.type === "tool_use");
      if (toolUseBlocks.length === 0) {
        return null;
      }
      const toolResults = await Promise.all(toolUseBlocks.map(async (toolUse) => {
        const tool = params.tools.find((t) => ("name" in t ? t.name : t.mcp_server_name) === toolUse.name);
        if (!tool || !("run" in tool)) {
          return {
            type: "tool_result",
            tool_use_id: toolUse.id,
            content: `Error: Tool '${toolUse.name}' not found`,
            is_error: true
          };
        }
        try {
          let input = toolUse.input;
          if ("parse" in tool && tool.parse) {
            input = tool.parse(input);
          }
          const result = await tool.run(input);
          return {
            type: "tool_result",
            tool_use_id: toolUse.id,
            content: result
          };
        } catch (error) {
          return {
            type: "tool_result",
            tool_use_id: toolUse.id,
            content: error instanceof ToolError_1.ToolError ? error.content : `Error: ${error instanceof Error ? error.message : String(error)}`,
            is_error: true
          };
        }
      }));
      return {
        role: "user",
        content: toolResults
      };
    }
  }
});

// node_modules/@anthropic-ai/sdk/internal/decoders/jsonl.js
var require_jsonl = __commonJS({
  "node_modules/@anthropic-ai/sdk/internal/decoders/jsonl.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.JSONLDecoder = void 0;
    var error_1 = require_error();
    var shims_1 = require_shims();
    var line_1 = require_line();
    var JSONLDecoder = class _JSONLDecoder {
      constructor(iterator, controller) {
        this.iterator = iterator;
        this.controller = controller;
      }
      async *decoder() {
        const lineDecoder = new line_1.LineDecoder();
        for await (const chunk of this.iterator) {
          for (const line of lineDecoder.decode(chunk)) {
            yield JSON.parse(line);
          }
        }
        for (const line of lineDecoder.flush()) {
          yield JSON.parse(line);
        }
      }
      [Symbol.asyncIterator]() {
        return this.decoder();
      }
      static fromResponse(response, controller) {
        if (!response.body) {
          controller.abort();
          if (typeof globalThis.navigator !== "undefined" && globalThis.navigator.product === "ReactNative") {
            throw new error_1.AnthropicError(`The default react-native fetch implementation does not support streaming. Please use expo/fetch: https://docs.expo.dev/versions/latest/sdk/expo/#expofetch-api`);
          }
          throw new error_1.AnthropicError(`Attempted to iterate over a response with no body`);
        }
        return new _JSONLDecoder((0, shims_1.ReadableStreamToAsyncIterable)(response.body), controller);
      }
    };
    exports2.JSONLDecoder = JSONLDecoder;
  }
});

// node_modules/@anthropic-ai/sdk/resources/beta/messages/batches.js
var require_batches = __commonJS({
  "node_modules/@anthropic-ai/sdk/resources/beta/messages/batches.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.Batches = void 0;
    var resource_1 = require_resource();
    var pagination_1 = require_pagination();
    var headers_1 = require_headers();
    var jsonl_1 = require_jsonl();
    var error_1 = require_error2();
    var path_1 = require_path();
    var Batches = class extends resource_1.APIResource {
      /**
       * Send a batch of Message creation requests.
       *
       * The Message Batches API can be used to process multiple Messages API requests at
       * once. Once a Message Batch is created, it begins processing immediately. Batches
       * can take up to 24 hours to complete.
       *
       * Learn more about the Message Batches API in our
       * [user guide](https://docs.claude.com/en/docs/build-with-claude/batch-processing)
       *
       * @example
       * ```ts
       * const betaMessageBatch =
       *   await client.beta.messages.batches.create({
       *     requests: [
       *       {
       *         custom_id: 'my-custom-id-1',
       *         params: {
       *           max_tokens: 1024,
       *           messages: [
       *             { content: 'Hello, world', role: 'user' },
       *           ],
       *           model: 'claude-opus-4-6',
       *         },
       *       },
       *     ],
       *   });
       * ```
       */
      create(params, options) {
        const { betas, ...body } = params;
        return this._client.post("/v1/messages/batches?beta=true", {
          body,
          ...options,
          headers: (0, headers_1.buildHeaders)([
            { "anthropic-beta": [...betas ?? [], "message-batches-2024-09-24"].toString() },
            options?.headers
          ])
        });
      }
      /**
       * This endpoint is idempotent and can be used to poll for Message Batch
       * completion. To access the results of a Message Batch, make a request to the
       * `results_url` field in the response.
       *
       * Learn more about the Message Batches API in our
       * [user guide](https://docs.claude.com/en/docs/build-with-claude/batch-processing)
       *
       * @example
       * ```ts
       * const betaMessageBatch =
       *   await client.beta.messages.batches.retrieve(
       *     'message_batch_id',
       *   );
       * ```
       */
      retrieve(messageBatchID, params = {}, options) {
        const { betas } = params ?? {};
        return this._client.get((0, path_1.path)`/v1/messages/batches/${messageBatchID}?beta=true`, {
          ...options,
          headers: (0, headers_1.buildHeaders)([
            { "anthropic-beta": [...betas ?? [], "message-batches-2024-09-24"].toString() },
            options?.headers
          ])
        });
      }
      /**
       * List all Message Batches within a Workspace. Most recently created batches are
       * returned first.
       *
       * Learn more about the Message Batches API in our
       * [user guide](https://docs.claude.com/en/docs/build-with-claude/batch-processing)
       *
       * @example
       * ```ts
       * // Automatically fetches more pages as needed.
       * for await (const betaMessageBatch of client.beta.messages.batches.list()) {
       *   // ...
       * }
       * ```
       */
      list(params = {}, options) {
        const { betas, ...query } = params ?? {};
        return this._client.getAPIList("/v1/messages/batches?beta=true", pagination_1.Page, {
          query,
          ...options,
          headers: (0, headers_1.buildHeaders)([
            { "anthropic-beta": [...betas ?? [], "message-batches-2024-09-24"].toString() },
            options?.headers
          ])
        });
      }
      /**
       * Delete a Message Batch.
       *
       * Message Batches can only be deleted once they've finished processing. If you'd
       * like to delete an in-progress batch, you must first cancel it.
       *
       * Learn more about the Message Batches API in our
       * [user guide](https://docs.claude.com/en/docs/build-with-claude/batch-processing)
       *
       * @example
       * ```ts
       * const betaDeletedMessageBatch =
       *   await client.beta.messages.batches.delete(
       *     'message_batch_id',
       *   );
       * ```
       */
      delete(messageBatchID, params = {}, options) {
        const { betas } = params ?? {};
        return this._client.delete((0, path_1.path)`/v1/messages/batches/${messageBatchID}?beta=true`, {
          ...options,
          headers: (0, headers_1.buildHeaders)([
            { "anthropic-beta": [...betas ?? [], "message-batches-2024-09-24"].toString() },
            options?.headers
          ])
        });
      }
      /**
       * Batches may be canceled any time before processing ends. Once cancellation is
       * initiated, the batch enters a `canceling` state, at which time the system may
       * complete any in-progress, non-interruptible requests before finalizing
       * cancellation.
       *
       * The number of canceled requests is specified in `request_counts`. To determine
       * which requests were canceled, check the individual results within the batch.
       * Note that cancellation may not result in any canceled requests if they were
       * non-interruptible.
       *
       * Learn more about the Message Batches API in our
       * [user guide](https://docs.claude.com/en/docs/build-with-claude/batch-processing)
       *
       * @example
       * ```ts
       * const betaMessageBatch =
       *   await client.beta.messages.batches.cancel(
       *     'message_batch_id',
       *   );
       * ```
       */
      cancel(messageBatchID, params = {}, options) {
        const { betas } = params ?? {};
        return this._client.post((0, path_1.path)`/v1/messages/batches/${messageBatchID}/cancel?beta=true`, {
          ...options,
          headers: (0, headers_1.buildHeaders)([
            { "anthropic-beta": [...betas ?? [], "message-batches-2024-09-24"].toString() },
            options?.headers
          ])
        });
      }
      /**
       * Streams the results of a Message Batch as a `.jsonl` file.
       *
       * Each line in the file is a JSON object containing the result of a single request
       * in the Message Batch. Results are not guaranteed to be in the same order as
       * requests. Use the `custom_id` field to match results to requests.
       *
       * Learn more about the Message Batches API in our
       * [user guide](https://docs.claude.com/en/docs/build-with-claude/batch-processing)
       *
       * @example
       * ```ts
       * const betaMessageBatchIndividualResponse =
       *   await client.beta.messages.batches.results(
       *     'message_batch_id',
       *   );
       * ```
       */
      async results(messageBatchID, params = {}, options) {
        const batch = await this.retrieve(messageBatchID);
        if (!batch.results_url) {
          throw new error_1.AnthropicError(`No batch \`results_url\`; Has it finished processing? ${batch.processing_status} - ${batch.id}`);
        }
        const { betas } = params ?? {};
        return this._client.get(batch.results_url, {
          ...options,
          headers: (0, headers_1.buildHeaders)([
            {
              "anthropic-beta": [...betas ?? [], "message-batches-2024-09-24"].toString(),
              Accept: "application/binary"
            },
            options?.headers
          ]),
          stream: true,
          __binaryResponse: true
        })._thenUnwrap((_, props) => jsonl_1.JSONLDecoder.fromResponse(props.response, props.controller));
      }
    };
    exports2.Batches = Batches;
  }
});

// node_modules/@anthropic-ai/sdk/resources/beta/messages/messages.js
var require_messages = __commonJS({
  "node_modules/@anthropic-ai/sdk/resources/beta/messages/messages.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.ToolError = exports2.BetaToolRunner = exports2.Messages = void 0;
    var tslib_1 = require_tslib();
    var error_1 = require_error2();
    var resource_1 = require_resource();
    var constants_1 = require_constants();
    var headers_1 = require_headers();
    var stainless_helper_header_1 = require_stainless_helper_header();
    var beta_parser_1 = require_beta_parser();
    var BetaMessageStream_1 = require_BetaMessageStream();
    var BetaToolRunner_1 = require_BetaToolRunner();
    var ToolError_1 = require_ToolError();
    var BatchesAPI = tslib_1.__importStar(require_batches());
    var batches_1 = require_batches();
    var DEPRECATED_MODELS = {
      "claude-1.3": "November 6th, 2024",
      "claude-1.3-100k": "November 6th, 2024",
      "claude-instant-1.1": "November 6th, 2024",
      "claude-instant-1.1-100k": "November 6th, 2024",
      "claude-instant-1.2": "November 6th, 2024",
      "claude-3-sonnet-20240229": "July 21st, 2025",
      "claude-3-opus-20240229": "January 5th, 2026",
      "claude-2.1": "July 21st, 2025",
      "claude-2.0": "July 21st, 2025",
      "claude-3-7-sonnet-latest": "February 19th, 2026",
      "claude-3-7-sonnet-20250219": "February 19th, 2026"
    };
    var MODELS_TO_WARN_WITH_THINKING_ENABLED = ["claude-opus-4-6"];
    var Messages = class extends resource_1.APIResource {
      constructor() {
        super(...arguments);
        this.batches = new BatchesAPI.Batches(this._client);
      }
      create(params, options) {
        const modifiedParams = transformOutputFormat(params);
        const { betas, ...body } = modifiedParams;
        if (body.model in DEPRECATED_MODELS) {
          console.warn(`The model '${body.model}' is deprecated and will reach end-of-life on ${DEPRECATED_MODELS[body.model]}
Please migrate to a newer model. Visit https://docs.anthropic.com/en/docs/resources/model-deprecations for more information.`);
        }
        if (body.model in MODELS_TO_WARN_WITH_THINKING_ENABLED && body.thinking && body.thinking.type === "enabled") {
          console.warn(`Using Claude with ${body.model} and 'thinking.type=enabled' is deprecated. Use 'thinking.type=adaptive' instead which results in better model performance in our testing: https://platform.claude.com/docs/en/build-with-claude/adaptive-thinking`);
        }
        let timeout = this._client._options.timeout;
        if (!body.stream && timeout == null) {
          const maxNonstreamingTokens = constants_1.MODEL_NONSTREAMING_TOKENS[body.model] ?? void 0;
          timeout = this._client.calculateNonstreamingTimeout(body.max_tokens, maxNonstreamingTokens);
        }
        const helperHeader = (0, stainless_helper_header_1.stainlessHelperHeader)(body.tools, body.messages);
        return this._client.post("/v1/messages?beta=true", {
          body,
          timeout: timeout ?? 6e5,
          ...options,
          headers: (0, headers_1.buildHeaders)([
            { ...betas?.toString() != null ? { "anthropic-beta": betas?.toString() } : void 0 },
            helperHeader,
            options?.headers
          ]),
          stream: modifiedParams.stream ?? false
        });
      }
      /**
       * Send a structured list of input messages with text and/or image content, along with an expected `output_format` and
       * the response will be automatically parsed and available in the `parsed_output` property of the message.
       *
       * @example
       * ```ts
       * const message = await client.beta.messages.parse({
       *   model: 'claude-3-5-sonnet-20241022',
       *   max_tokens: 1024,
       *   messages: [{ role: 'user', content: 'What is 2+2?' }],
       *   output_format: zodOutputFormat(z.object({ answer: z.number() }), 'math'),
       * });
       *
       * console.log(message.parsed_output?.answer); // 4
       * ```
       */
      parse(params, options) {
        options = {
          ...options,
          headers: (0, headers_1.buildHeaders)([
            { "anthropic-beta": [...params.betas ?? [], "structured-outputs-2025-12-15"].toString() },
            options?.headers
          ])
        };
        return this.create(params, options).then((message) => (0, beta_parser_1.parseBetaMessage)(message, params, { logger: this._client.logger ?? console }));
      }
      /**
       * Create a Message stream
       */
      stream(body, options) {
        return BetaMessageStream_1.BetaMessageStream.createMessage(this, body, options);
      }
      /**
       * Count the number of tokens in a Message.
       *
       * The Token Count API can be used to count the number of tokens in a Message,
       * including tools, images, and documents, without creating it.
       *
       * Learn more about token counting in our
       * [user guide](https://docs.claude.com/en/docs/build-with-claude/token-counting)
       *
       * @example
       * ```ts
       * const betaMessageTokensCount =
       *   await client.beta.messages.countTokens({
       *     messages: [{ content: 'string', role: 'user' }],
       *     model: 'claude-opus-4-6',
       *   });
       * ```
       */
      countTokens(params, options) {
        const modifiedParams = transformOutputFormat(params);
        const { betas, ...body } = modifiedParams;
        return this._client.post("/v1/messages/count_tokens?beta=true", {
          body,
          ...options,
          headers: (0, headers_1.buildHeaders)([
            { "anthropic-beta": [...betas ?? [], "token-counting-2024-11-01"].toString() },
            options?.headers
          ])
        });
      }
      toolRunner(body, options) {
        return new BetaToolRunner_1.BetaToolRunner(this._client, body, options);
      }
    };
    exports2.Messages = Messages;
    function transformOutputFormat(params) {
      if (!params.output_format) {
        return params;
      }
      if (params.output_config?.format) {
        throw new error_1.AnthropicError("Both output_format and output_config.format were provided. Please use only output_config.format (output_format is deprecated).");
      }
      const { output_format, ...rest } = params;
      return {
        ...rest,
        output_config: {
          ...params.output_config,
          format: output_format
        }
      };
    }
    var BetaToolRunner_2 = require_BetaToolRunner();
    Object.defineProperty(exports2, "BetaToolRunner", { enumerable: true, get: function() {
      return BetaToolRunner_2.BetaToolRunner;
    } });
    var ToolError_2 = require_ToolError();
    Object.defineProperty(exports2, "ToolError", { enumerable: true, get: function() {
      return ToolError_2.ToolError;
    } });
    Messages.Batches = batches_1.Batches;
    Messages.BetaToolRunner = BetaToolRunner_1.BetaToolRunner;
    Messages.ToolError = ToolError_1.ToolError;
  }
});

// node_modules/@anthropic-ai/sdk/resources/beta/skills/versions.js
var require_versions = __commonJS({
  "node_modules/@anthropic-ai/sdk/resources/beta/skills/versions.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.Versions = void 0;
    var resource_1 = require_resource();
    var pagination_1 = require_pagination();
    var headers_1 = require_headers();
    var uploads_1 = require_uploads();
    var path_1 = require_path();
    var Versions = class extends resource_1.APIResource {
      /**
       * Create Skill Version
       *
       * @example
       * ```ts
       * const version = await client.beta.skills.versions.create(
       *   'skill_id',
       * );
       * ```
       */
      create(skillID, params = {}, options) {
        const { betas, ...body } = params ?? {};
        return this._client.post((0, path_1.path)`/v1/skills/${skillID}/versions?beta=true`, (0, uploads_1.multipartFormRequestOptions)({
          body,
          ...options,
          headers: (0, headers_1.buildHeaders)([
            { "anthropic-beta": [...betas ?? [], "skills-2025-10-02"].toString() },
            options?.headers
          ])
        }, this._client));
      }
      /**
       * Get Skill Version
       *
       * @example
       * ```ts
       * const version = await client.beta.skills.versions.retrieve(
       *   'version',
       *   { skill_id: 'skill_id' },
       * );
       * ```
       */
      retrieve(version, params, options) {
        const { skill_id, betas } = params;
        return this._client.get((0, path_1.path)`/v1/skills/${skill_id}/versions/${version}?beta=true`, {
          ...options,
          headers: (0, headers_1.buildHeaders)([
            { "anthropic-beta": [...betas ?? [], "skills-2025-10-02"].toString() },
            options?.headers
          ])
        });
      }
      /**
       * List Skill Versions
       *
       * @example
       * ```ts
       * // Automatically fetches more pages as needed.
       * for await (const versionListResponse of client.beta.skills.versions.list(
       *   'skill_id',
       * )) {
       *   // ...
       * }
       * ```
       */
      list(skillID, params = {}, options) {
        const { betas, ...query } = params ?? {};
        return this._client.getAPIList((0, path_1.path)`/v1/skills/${skillID}/versions?beta=true`, pagination_1.PageCursor, {
          query,
          ...options,
          headers: (0, headers_1.buildHeaders)([
            { "anthropic-beta": [...betas ?? [], "skills-2025-10-02"].toString() },
            options?.headers
          ])
        });
      }
      /**
       * Delete Skill Version
       *
       * @example
       * ```ts
       * const version = await client.beta.skills.versions.delete(
       *   'version',
       *   { skill_id: 'skill_id' },
       * );
       * ```
       */
      delete(version, params, options) {
        const { skill_id, betas } = params;
        return this._client.delete((0, path_1.path)`/v1/skills/${skill_id}/versions/${version}?beta=true`, {
          ...options,
          headers: (0, headers_1.buildHeaders)([
            { "anthropic-beta": [...betas ?? [], "skills-2025-10-02"].toString() },
            options?.headers
          ])
        });
      }
    };
    exports2.Versions = Versions;
  }
});

// node_modules/@anthropic-ai/sdk/resources/beta/skills/skills.js
var require_skills = __commonJS({
  "node_modules/@anthropic-ai/sdk/resources/beta/skills/skills.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.Skills = void 0;
    var tslib_1 = require_tslib();
    var resource_1 = require_resource();
    var VersionsAPI = tslib_1.__importStar(require_versions());
    var versions_1 = require_versions();
    var pagination_1 = require_pagination();
    var headers_1 = require_headers();
    var uploads_1 = require_uploads();
    var path_1 = require_path();
    var Skills = class extends resource_1.APIResource {
      constructor() {
        super(...arguments);
        this.versions = new VersionsAPI.Versions(this._client);
      }
      /**
       * Create Skill
       *
       * @example
       * ```ts
       * const skill = await client.beta.skills.create();
       * ```
       */
      create(params = {}, options) {
        const { betas, ...body } = params ?? {};
        return this._client.post("/v1/skills?beta=true", (0, uploads_1.multipartFormRequestOptions)({
          body,
          ...options,
          headers: (0, headers_1.buildHeaders)([
            { "anthropic-beta": [...betas ?? [], "skills-2025-10-02"].toString() },
            options?.headers
          ])
        }, this._client, false));
      }
      /**
       * Get Skill
       *
       * @example
       * ```ts
       * const skill = await client.beta.skills.retrieve('skill_id');
       * ```
       */
      retrieve(skillID, params = {}, options) {
        const { betas } = params ?? {};
        return this._client.get((0, path_1.path)`/v1/skills/${skillID}?beta=true`, {
          ...options,
          headers: (0, headers_1.buildHeaders)([
            { "anthropic-beta": [...betas ?? [], "skills-2025-10-02"].toString() },
            options?.headers
          ])
        });
      }
      /**
       * List Skills
       *
       * @example
       * ```ts
       * // Automatically fetches more pages as needed.
       * for await (const skillListResponse of client.beta.skills.list()) {
       *   // ...
       * }
       * ```
       */
      list(params = {}, options) {
        const { betas, ...query } = params ?? {};
        return this._client.getAPIList("/v1/skills?beta=true", pagination_1.PageCursor, {
          query,
          ...options,
          headers: (0, headers_1.buildHeaders)([
            { "anthropic-beta": [...betas ?? [], "skills-2025-10-02"].toString() },
            options?.headers
          ])
        });
      }
      /**
       * Delete Skill
       *
       * @example
       * ```ts
       * const skill = await client.beta.skills.delete('skill_id');
       * ```
       */
      delete(skillID, params = {}, options) {
        const { betas } = params ?? {};
        return this._client.delete((0, path_1.path)`/v1/skills/${skillID}?beta=true`, {
          ...options,
          headers: (0, headers_1.buildHeaders)([
            { "anthropic-beta": [...betas ?? [], "skills-2025-10-02"].toString() },
            options?.headers
          ])
        });
      }
    };
    exports2.Skills = Skills;
    Skills.Versions = versions_1.Versions;
  }
});

// node_modules/@anthropic-ai/sdk/resources/beta/beta.js
var require_beta = __commonJS({
  "node_modules/@anthropic-ai/sdk/resources/beta/beta.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.Beta = void 0;
    var tslib_1 = require_tslib();
    var resource_1 = require_resource();
    var FilesAPI = tslib_1.__importStar(require_files());
    var files_1 = require_files();
    var ModelsAPI = tslib_1.__importStar(require_models());
    var models_1 = require_models();
    var MessagesAPI = tslib_1.__importStar(require_messages());
    var messages_1 = require_messages();
    var SkillsAPI = tslib_1.__importStar(require_skills());
    var skills_1 = require_skills();
    var Beta = class extends resource_1.APIResource {
      constructor() {
        super(...arguments);
        this.models = new ModelsAPI.Models(this._client);
        this.messages = new MessagesAPI.Messages(this._client);
        this.files = new FilesAPI.Files(this._client);
        this.skills = new SkillsAPI.Skills(this._client);
      }
    };
    exports2.Beta = Beta;
    Beta.Models = models_1.Models;
    Beta.Messages = messages_1.Messages;
    Beta.Files = files_1.Files;
    Beta.Skills = skills_1.Skills;
  }
});

// node_modules/@anthropic-ai/sdk/resources/completions.js
var require_completions = __commonJS({
  "node_modules/@anthropic-ai/sdk/resources/completions.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.Completions = void 0;
    var resource_1 = require_resource();
    var headers_1 = require_headers();
    var Completions = class extends resource_1.APIResource {
      create(params, options) {
        const { betas, ...body } = params;
        return this._client.post("/v1/complete", {
          body,
          timeout: this._client._options.timeout ?? 6e5,
          ...options,
          headers: (0, headers_1.buildHeaders)([
            { ...betas?.toString() != null ? { "anthropic-beta": betas?.toString() } : void 0 },
            options?.headers
          ]),
          stream: params.stream ?? false
        });
      }
    };
    exports2.Completions = Completions;
  }
});

// node_modules/@anthropic-ai/sdk/lib/parser.js
var require_parser2 = __commonJS({
  "node_modules/@anthropic-ai/sdk/lib/parser.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.maybeParseMessage = maybeParseMessage;
    exports2.parseMessage = parseMessage;
    var error_1 = require_error();
    function getOutputFormat(params) {
      return params?.output_config?.format;
    }
    function maybeParseMessage(message, params, opts) {
      const outputFormat = getOutputFormat(params);
      if (!params || !("parse" in (outputFormat ?? {}))) {
        return {
          ...message,
          content: message.content.map((block) => {
            if (block.type === "text") {
              const parsedBlock = Object.defineProperty({ ...block }, "parsed_output", {
                value: null,
                enumerable: false
              });
              return parsedBlock;
            }
            return block;
          }),
          parsed_output: null
        };
      }
      return parseMessage(message, params, opts);
    }
    function parseMessage(message, params, opts) {
      let firstParsedOutput = null;
      const content = message.content.map((block) => {
        if (block.type === "text") {
          const parsedOutput = parseOutputFormat(params, block.text);
          if (firstParsedOutput === null) {
            firstParsedOutput = parsedOutput;
          }
          const parsedBlock = Object.defineProperty({ ...block }, "parsed_output", {
            value: parsedOutput,
            enumerable: false
          });
          return parsedBlock;
        }
        return block;
      });
      return {
        ...message,
        content,
        parsed_output: firstParsedOutput
      };
    }
    function parseOutputFormat(params, content) {
      const outputFormat = getOutputFormat(params);
      if (outputFormat?.type !== "json_schema") {
        return null;
      }
      try {
        if ("parse" in outputFormat) {
          return outputFormat.parse(content);
        }
        return JSON.parse(content);
      } catch (error) {
        throw new error_1.AnthropicError(`Failed to parse structured output: ${error}`);
      }
    }
  }
});

// node_modules/@anthropic-ai/sdk/lib/MessageStream.js
var require_MessageStream = __commonJS({
  "node_modules/@anthropic-ai/sdk/lib/MessageStream.js"(exports2) {
    "use strict";
    var _MessageStream_instances;
    var _MessageStream_currentMessageSnapshot;
    var _MessageStream_params;
    var _MessageStream_connectedPromise;
    var _MessageStream_resolveConnectedPromise;
    var _MessageStream_rejectConnectedPromise;
    var _MessageStream_endPromise;
    var _MessageStream_resolveEndPromise;
    var _MessageStream_rejectEndPromise;
    var _MessageStream_listeners;
    var _MessageStream_ended;
    var _MessageStream_errored;
    var _MessageStream_aborted;
    var _MessageStream_catchingPromiseCreated;
    var _MessageStream_response;
    var _MessageStream_request_id;
    var _MessageStream_logger;
    var _MessageStream_getFinalMessage;
    var _MessageStream_getFinalText;
    var _MessageStream_handleError;
    var _MessageStream_beginRequest;
    var _MessageStream_addStreamEvent;
    var _MessageStream_endRequest;
    var _MessageStream_accumulateMessage;
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.MessageStream = void 0;
    var tslib_1 = require_tslib();
    var errors_1 = require_errors();
    var error_1 = require_error2();
    var streaming_1 = require_streaming2();
    var parser_1 = require_parser();
    var parser_2 = require_parser2();
    var JSON_BUF_PROPERTY = "__json_buf";
    function tracksToolInput(content) {
      return content.type === "tool_use" || content.type === "server_tool_use";
    }
    var MessageStream = class _MessageStream {
      constructor(params, opts) {
        _MessageStream_instances.add(this);
        this.messages = [];
        this.receivedMessages = [];
        _MessageStream_currentMessageSnapshot.set(this, void 0);
        _MessageStream_params.set(this, null);
        this.controller = new AbortController();
        _MessageStream_connectedPromise.set(this, void 0);
        _MessageStream_resolveConnectedPromise.set(this, () => {
        });
        _MessageStream_rejectConnectedPromise.set(this, () => {
        });
        _MessageStream_endPromise.set(this, void 0);
        _MessageStream_resolveEndPromise.set(this, () => {
        });
        _MessageStream_rejectEndPromise.set(this, () => {
        });
        _MessageStream_listeners.set(this, {});
        _MessageStream_ended.set(this, false);
        _MessageStream_errored.set(this, false);
        _MessageStream_aborted.set(this, false);
        _MessageStream_catchingPromiseCreated.set(this, false);
        _MessageStream_response.set(this, void 0);
        _MessageStream_request_id.set(this, void 0);
        _MessageStream_logger.set(this, void 0);
        _MessageStream_handleError.set(this, (error) => {
          tslib_1.__classPrivateFieldSet(this, _MessageStream_errored, true, "f");
          if ((0, errors_1.isAbortError)(error)) {
            error = new error_1.APIUserAbortError();
          }
          if (error instanceof error_1.APIUserAbortError) {
            tslib_1.__classPrivateFieldSet(this, _MessageStream_aborted, true, "f");
            return this._emit("abort", error);
          }
          if (error instanceof error_1.AnthropicError) {
            return this._emit("error", error);
          }
          if (error instanceof Error) {
            const anthropicError = new error_1.AnthropicError(error.message);
            anthropicError.cause = error;
            return this._emit("error", anthropicError);
          }
          return this._emit("error", new error_1.AnthropicError(String(error)));
        });
        tslib_1.__classPrivateFieldSet(this, _MessageStream_connectedPromise, new Promise((resolve, reject) => {
          tslib_1.__classPrivateFieldSet(this, _MessageStream_resolveConnectedPromise, resolve, "f");
          tslib_1.__classPrivateFieldSet(this, _MessageStream_rejectConnectedPromise, reject, "f");
        }), "f");
        tslib_1.__classPrivateFieldSet(this, _MessageStream_endPromise, new Promise((resolve, reject) => {
          tslib_1.__classPrivateFieldSet(this, _MessageStream_resolveEndPromise, resolve, "f");
          tslib_1.__classPrivateFieldSet(this, _MessageStream_rejectEndPromise, reject, "f");
        }), "f");
        tslib_1.__classPrivateFieldGet(this, _MessageStream_connectedPromise, "f").catch(() => {
        });
        tslib_1.__classPrivateFieldGet(this, _MessageStream_endPromise, "f").catch(() => {
        });
        tslib_1.__classPrivateFieldSet(this, _MessageStream_params, params, "f");
        tslib_1.__classPrivateFieldSet(this, _MessageStream_logger, opts?.logger ?? console, "f");
      }
      get response() {
        return tslib_1.__classPrivateFieldGet(this, _MessageStream_response, "f");
      }
      get request_id() {
        return tslib_1.__classPrivateFieldGet(this, _MessageStream_request_id, "f");
      }
      /**
       * Returns the `MessageStream` data, the raw `Response` instance and the ID of the request,
       * returned vie the `request-id` header which is useful for debugging requests and resporting
       * issues to Anthropic.
       *
       * This is the same as the `APIPromise.withResponse()` method.
       *
       * This method will raise an error if you created the stream using `MessageStream.fromReadableStream`
       * as no `Response` is available.
       */
      async withResponse() {
        tslib_1.__classPrivateFieldSet(this, _MessageStream_catchingPromiseCreated, true, "f");
        const response = await tslib_1.__classPrivateFieldGet(this, _MessageStream_connectedPromise, "f");
        if (!response) {
          throw new Error("Could not resolve a `Response` object");
        }
        return {
          data: this,
          response,
          request_id: response.headers.get("request-id")
        };
      }
      /**
       * Intended for use on the frontend, consuming a stream produced with
       * `.toReadableStream()` on the backend.
       *
       * Note that messages sent to the model do not appear in `.on('message')`
       * in this context.
       */
      static fromReadableStream(stream) {
        const runner = new _MessageStream(null);
        runner._run(() => runner._fromReadableStream(stream));
        return runner;
      }
      static createMessage(messages, params, options, { logger } = {}) {
        const runner = new _MessageStream(params, { logger });
        for (const message of params.messages) {
          runner._addMessageParam(message);
        }
        tslib_1.__classPrivateFieldSet(runner, _MessageStream_params, { ...params, stream: true }, "f");
        runner._run(() => runner._createMessage(messages, { ...params, stream: true }, { ...options, headers: { ...options?.headers, "X-Stainless-Helper-Method": "stream" } }));
        return runner;
      }
      _run(executor) {
        executor().then(() => {
          this._emitFinal();
          this._emit("end");
        }, tslib_1.__classPrivateFieldGet(this, _MessageStream_handleError, "f"));
      }
      _addMessageParam(message) {
        this.messages.push(message);
      }
      _addMessage(message, emit = true) {
        this.receivedMessages.push(message);
        if (emit) {
          this._emit("message", message);
        }
      }
      async _createMessage(messages, params, options) {
        const signal = options?.signal;
        let abortHandler;
        if (signal) {
          if (signal.aborted)
            this.controller.abort();
          abortHandler = this.controller.abort.bind(this.controller);
          signal.addEventListener("abort", abortHandler);
        }
        try {
          tslib_1.__classPrivateFieldGet(this, _MessageStream_instances, "m", _MessageStream_beginRequest).call(this);
          const { response, data: stream } = await messages.create({ ...params, stream: true }, { ...options, signal: this.controller.signal }).withResponse();
          this._connected(response);
          for await (const event of stream) {
            tslib_1.__classPrivateFieldGet(this, _MessageStream_instances, "m", _MessageStream_addStreamEvent).call(this, event);
          }
          if (stream.controller.signal?.aborted) {
            throw new error_1.APIUserAbortError();
          }
          tslib_1.__classPrivateFieldGet(this, _MessageStream_instances, "m", _MessageStream_endRequest).call(this);
        } finally {
          if (signal && abortHandler) {
            signal.removeEventListener("abort", abortHandler);
          }
        }
      }
      _connected(response) {
        if (this.ended)
          return;
        tslib_1.__classPrivateFieldSet(this, _MessageStream_response, response, "f");
        tslib_1.__classPrivateFieldSet(this, _MessageStream_request_id, response?.headers.get("request-id"), "f");
        tslib_1.__classPrivateFieldGet(this, _MessageStream_resolveConnectedPromise, "f").call(this, response);
        this._emit("connect");
      }
      get ended() {
        return tslib_1.__classPrivateFieldGet(this, _MessageStream_ended, "f");
      }
      get errored() {
        return tslib_1.__classPrivateFieldGet(this, _MessageStream_errored, "f");
      }
      get aborted() {
        return tslib_1.__classPrivateFieldGet(this, _MessageStream_aborted, "f");
      }
      abort() {
        this.controller.abort();
      }
      /**
       * Adds the listener function to the end of the listeners array for the event.
       * No checks are made to see if the listener has already been added. Multiple calls passing
       * the same combination of event and listener will result in the listener being added, and
       * called, multiple times.
       * @returns this MessageStream, so that calls can be chained
       */
      on(event, listener) {
        const listeners = tslib_1.__classPrivateFieldGet(this, _MessageStream_listeners, "f")[event] || (tslib_1.__classPrivateFieldGet(this, _MessageStream_listeners, "f")[event] = []);
        listeners.push({ listener });
        return this;
      }
      /**
       * Removes the specified listener from the listener array for the event.
       * off() will remove, at most, one instance of a listener from the listener array. If any single
       * listener has been added multiple times to the listener array for the specified event, then
       * off() must be called multiple times to remove each instance.
       * @returns this MessageStream, so that calls can be chained
       */
      off(event, listener) {
        const listeners = tslib_1.__classPrivateFieldGet(this, _MessageStream_listeners, "f")[event];
        if (!listeners)
          return this;
        const index = listeners.findIndex((l) => l.listener === listener);
        if (index >= 0)
          listeners.splice(index, 1);
        return this;
      }
      /**
       * Adds a one-time listener function for the event. The next time the event is triggered,
       * this listener is removed and then invoked.
       * @returns this MessageStream, so that calls can be chained
       */
      once(event, listener) {
        const listeners = tslib_1.__classPrivateFieldGet(this, _MessageStream_listeners, "f")[event] || (tslib_1.__classPrivateFieldGet(this, _MessageStream_listeners, "f")[event] = []);
        listeners.push({ listener, once: true });
        return this;
      }
      /**
       * This is similar to `.once()`, but returns a Promise that resolves the next time
       * the event is triggered, instead of calling a listener callback.
       * @returns a Promise that resolves the next time given event is triggered,
       * or rejects if an error is emitted.  (If you request the 'error' event,
       * returns a promise that resolves with the error).
       *
       * Example:
       *
       *   const message = await stream.emitted('message') // rejects if the stream errors
       */
      emitted(event) {
        return new Promise((resolve, reject) => {
          tslib_1.__classPrivateFieldSet(this, _MessageStream_catchingPromiseCreated, true, "f");
          if (event !== "error")
            this.once("error", reject);
          this.once(event, resolve);
        });
      }
      async done() {
        tslib_1.__classPrivateFieldSet(this, _MessageStream_catchingPromiseCreated, true, "f");
        await tslib_1.__classPrivateFieldGet(this, _MessageStream_endPromise, "f");
      }
      get currentMessage() {
        return tslib_1.__classPrivateFieldGet(this, _MessageStream_currentMessageSnapshot, "f");
      }
      /**
       * @returns a promise that resolves with the the final assistant Message response,
       * or rejects if an error occurred or the stream ended prematurely without producing a Message.
       * If structured outputs were used, this will be a ParsedMessage with a `parsed_output` field.
       */
      async finalMessage() {
        await this.done();
        return tslib_1.__classPrivateFieldGet(this, _MessageStream_instances, "m", _MessageStream_getFinalMessage).call(this);
      }
      /**
       * @returns a promise that resolves with the the final assistant Message's text response, concatenated
       * together if there are more than one text blocks.
       * Rejects if an error occurred or the stream ended prematurely without producing a Message.
       */
      async finalText() {
        await this.done();
        return tslib_1.__classPrivateFieldGet(this, _MessageStream_instances, "m", _MessageStream_getFinalText).call(this);
      }
      _emit(event, ...args) {
        if (tslib_1.__classPrivateFieldGet(this, _MessageStream_ended, "f"))
          return;
        if (event === "end") {
          tslib_1.__classPrivateFieldSet(this, _MessageStream_ended, true, "f");
          tslib_1.__classPrivateFieldGet(this, _MessageStream_resolveEndPromise, "f").call(this);
        }
        const listeners = tslib_1.__classPrivateFieldGet(this, _MessageStream_listeners, "f")[event];
        if (listeners) {
          tslib_1.__classPrivateFieldGet(this, _MessageStream_listeners, "f")[event] = listeners.filter((l) => !l.once);
          listeners.forEach(({ listener }) => listener(...args));
        }
        if (event === "abort") {
          const error = args[0];
          if (!tslib_1.__classPrivateFieldGet(this, _MessageStream_catchingPromiseCreated, "f") && !listeners?.length) {
            Promise.reject(error);
          }
          tslib_1.__classPrivateFieldGet(this, _MessageStream_rejectConnectedPromise, "f").call(this, error);
          tslib_1.__classPrivateFieldGet(this, _MessageStream_rejectEndPromise, "f").call(this, error);
          this._emit("end");
          return;
        }
        if (event === "error") {
          const error = args[0];
          if (!tslib_1.__classPrivateFieldGet(this, _MessageStream_catchingPromiseCreated, "f") && !listeners?.length) {
            Promise.reject(error);
          }
          tslib_1.__classPrivateFieldGet(this, _MessageStream_rejectConnectedPromise, "f").call(this, error);
          tslib_1.__classPrivateFieldGet(this, _MessageStream_rejectEndPromise, "f").call(this, error);
          this._emit("end");
        }
      }
      _emitFinal() {
        const finalMessage = this.receivedMessages.at(-1);
        if (finalMessage) {
          this._emit("finalMessage", tslib_1.__classPrivateFieldGet(this, _MessageStream_instances, "m", _MessageStream_getFinalMessage).call(this));
        }
      }
      async _fromReadableStream(readableStream, options) {
        const signal = options?.signal;
        let abortHandler;
        if (signal) {
          if (signal.aborted)
            this.controller.abort();
          abortHandler = this.controller.abort.bind(this.controller);
          signal.addEventListener("abort", abortHandler);
        }
        try {
          tslib_1.__classPrivateFieldGet(this, _MessageStream_instances, "m", _MessageStream_beginRequest).call(this);
          this._connected(null);
          const stream = streaming_1.Stream.fromReadableStream(readableStream, this.controller);
          for await (const event of stream) {
            tslib_1.__classPrivateFieldGet(this, _MessageStream_instances, "m", _MessageStream_addStreamEvent).call(this, event);
          }
          if (stream.controller.signal?.aborted) {
            throw new error_1.APIUserAbortError();
          }
          tslib_1.__classPrivateFieldGet(this, _MessageStream_instances, "m", _MessageStream_endRequest).call(this);
        } finally {
          if (signal && abortHandler) {
            signal.removeEventListener("abort", abortHandler);
          }
        }
      }
      [(_MessageStream_currentMessageSnapshot = /* @__PURE__ */ new WeakMap(), _MessageStream_params = /* @__PURE__ */ new WeakMap(), _MessageStream_connectedPromise = /* @__PURE__ */ new WeakMap(), _MessageStream_resolveConnectedPromise = /* @__PURE__ */ new WeakMap(), _MessageStream_rejectConnectedPromise = /* @__PURE__ */ new WeakMap(), _MessageStream_endPromise = /* @__PURE__ */ new WeakMap(), _MessageStream_resolveEndPromise = /* @__PURE__ */ new WeakMap(), _MessageStream_rejectEndPromise = /* @__PURE__ */ new WeakMap(), _MessageStream_listeners = /* @__PURE__ */ new WeakMap(), _MessageStream_ended = /* @__PURE__ */ new WeakMap(), _MessageStream_errored = /* @__PURE__ */ new WeakMap(), _MessageStream_aborted = /* @__PURE__ */ new WeakMap(), _MessageStream_catchingPromiseCreated = /* @__PURE__ */ new WeakMap(), _MessageStream_response = /* @__PURE__ */ new WeakMap(), _MessageStream_request_id = /* @__PURE__ */ new WeakMap(), _MessageStream_logger = /* @__PURE__ */ new WeakMap(), _MessageStream_handleError = /* @__PURE__ */ new WeakMap(), _MessageStream_instances = /* @__PURE__ */ new WeakSet(), _MessageStream_getFinalMessage = function _MessageStream_getFinalMessage2() {
        if (this.receivedMessages.length === 0) {
          throw new error_1.AnthropicError("stream ended without producing a Message with role=assistant");
        }
        return this.receivedMessages.at(-1);
      }, _MessageStream_getFinalText = function _MessageStream_getFinalText2() {
        if (this.receivedMessages.length === 0) {
          throw new error_1.AnthropicError("stream ended without producing a Message with role=assistant");
        }
        const textBlocks = this.receivedMessages.at(-1).content.filter((block) => block.type === "text").map((block) => block.text);
        if (textBlocks.length === 0) {
          throw new error_1.AnthropicError("stream ended without producing a content block with type=text");
        }
        return textBlocks.join(" ");
      }, _MessageStream_beginRequest = function _MessageStream_beginRequest2() {
        if (this.ended)
          return;
        tslib_1.__classPrivateFieldSet(this, _MessageStream_currentMessageSnapshot, void 0, "f");
      }, _MessageStream_addStreamEvent = function _MessageStream_addStreamEvent2(event) {
        if (this.ended)
          return;
        const messageSnapshot = tslib_1.__classPrivateFieldGet(this, _MessageStream_instances, "m", _MessageStream_accumulateMessage).call(this, event);
        this._emit("streamEvent", event, messageSnapshot);
        switch (event.type) {
          case "content_block_delta": {
            const content = messageSnapshot.content.at(-1);
            switch (event.delta.type) {
              case "text_delta": {
                if (content.type === "text") {
                  this._emit("text", event.delta.text, content.text || "");
                }
                break;
              }
              case "citations_delta": {
                if (content.type === "text") {
                  this._emit("citation", event.delta.citation, content.citations ?? []);
                }
                break;
              }
              case "input_json_delta": {
                if (tracksToolInput(content) && content.input) {
                  this._emit("inputJson", event.delta.partial_json, content.input);
                }
                break;
              }
              case "thinking_delta": {
                if (content.type === "thinking") {
                  this._emit("thinking", event.delta.thinking, content.thinking);
                }
                break;
              }
              case "signature_delta": {
                if (content.type === "thinking") {
                  this._emit("signature", content.signature);
                }
                break;
              }
              default:
                checkNever(event.delta);
            }
            break;
          }
          case "message_stop": {
            this._addMessageParam(messageSnapshot);
            this._addMessage((0, parser_2.maybeParseMessage)(messageSnapshot, tslib_1.__classPrivateFieldGet(this, _MessageStream_params, "f"), { logger: tslib_1.__classPrivateFieldGet(this, _MessageStream_logger, "f") }), true);
            break;
          }
          case "content_block_stop": {
            this._emit("contentBlock", messageSnapshot.content.at(-1));
            break;
          }
          case "message_start": {
            tslib_1.__classPrivateFieldSet(this, _MessageStream_currentMessageSnapshot, messageSnapshot, "f");
            break;
          }
          case "content_block_start":
          case "message_delta":
            break;
        }
      }, _MessageStream_endRequest = function _MessageStream_endRequest2() {
        if (this.ended) {
          throw new error_1.AnthropicError(`stream has ended, this shouldn't happen`);
        }
        const snapshot = tslib_1.__classPrivateFieldGet(this, _MessageStream_currentMessageSnapshot, "f");
        if (!snapshot) {
          throw new error_1.AnthropicError(`request ended without sending any chunks`);
        }
        tslib_1.__classPrivateFieldSet(this, _MessageStream_currentMessageSnapshot, void 0, "f");
        return (0, parser_2.maybeParseMessage)(snapshot, tslib_1.__classPrivateFieldGet(this, _MessageStream_params, "f"), { logger: tslib_1.__classPrivateFieldGet(this, _MessageStream_logger, "f") });
      }, _MessageStream_accumulateMessage = function _MessageStream_accumulateMessage2(event) {
        let snapshot = tslib_1.__classPrivateFieldGet(this, _MessageStream_currentMessageSnapshot, "f");
        if (event.type === "message_start") {
          if (snapshot) {
            throw new error_1.AnthropicError(`Unexpected event order, got ${event.type} before receiving "message_stop"`);
          }
          return event.message;
        }
        if (!snapshot) {
          throw new error_1.AnthropicError(`Unexpected event order, got ${event.type} before "message_start"`);
        }
        switch (event.type) {
          case "message_stop":
            return snapshot;
          case "message_delta":
            snapshot.stop_reason = event.delta.stop_reason;
            snapshot.stop_sequence = event.delta.stop_sequence;
            snapshot.usage.output_tokens = event.usage.output_tokens;
            if (event.usage.input_tokens != null) {
              snapshot.usage.input_tokens = event.usage.input_tokens;
            }
            if (event.usage.cache_creation_input_tokens != null) {
              snapshot.usage.cache_creation_input_tokens = event.usage.cache_creation_input_tokens;
            }
            if (event.usage.cache_read_input_tokens != null) {
              snapshot.usage.cache_read_input_tokens = event.usage.cache_read_input_tokens;
            }
            if (event.usage.server_tool_use != null) {
              snapshot.usage.server_tool_use = event.usage.server_tool_use;
            }
            return snapshot;
          case "content_block_start":
            snapshot.content.push({ ...event.content_block });
            return snapshot;
          case "content_block_delta": {
            const snapshotContent = snapshot.content.at(event.index);
            switch (event.delta.type) {
              case "text_delta": {
                if (snapshotContent?.type === "text") {
                  snapshot.content[event.index] = {
                    ...snapshotContent,
                    text: (snapshotContent.text || "") + event.delta.text
                  };
                }
                break;
              }
              case "citations_delta": {
                if (snapshotContent?.type === "text") {
                  snapshot.content[event.index] = {
                    ...snapshotContent,
                    citations: [...snapshotContent.citations ?? [], event.delta.citation]
                  };
                }
                break;
              }
              case "input_json_delta": {
                if (snapshotContent && tracksToolInput(snapshotContent)) {
                  let jsonBuf = snapshotContent[JSON_BUF_PROPERTY] || "";
                  jsonBuf += event.delta.partial_json;
                  const newContent = { ...snapshotContent };
                  Object.defineProperty(newContent, JSON_BUF_PROPERTY, {
                    value: jsonBuf,
                    enumerable: false,
                    writable: true
                  });
                  if (jsonBuf) {
                    newContent.input = (0, parser_1.partialParse)(jsonBuf);
                  }
                  snapshot.content[event.index] = newContent;
                }
                break;
              }
              case "thinking_delta": {
                if (snapshotContent?.type === "thinking") {
                  snapshot.content[event.index] = {
                    ...snapshotContent,
                    thinking: snapshotContent.thinking + event.delta.thinking
                  };
                }
                break;
              }
              case "signature_delta": {
                if (snapshotContent?.type === "thinking") {
                  snapshot.content[event.index] = {
                    ...snapshotContent,
                    signature: event.delta.signature
                  };
                }
                break;
              }
              default:
                checkNever(event.delta);
            }
            return snapshot;
          }
          case "content_block_stop":
            return snapshot;
        }
      }, Symbol.asyncIterator)]() {
        const pushQueue = [];
        const readQueue = [];
        let done = false;
        this.on("streamEvent", (event) => {
          const reader = readQueue.shift();
          if (reader) {
            reader.resolve(event);
          } else {
            pushQueue.push(event);
          }
        });
        this.on("end", () => {
          done = true;
          for (const reader of readQueue) {
            reader.resolve(void 0);
          }
          readQueue.length = 0;
        });
        this.on("abort", (err) => {
          done = true;
          for (const reader of readQueue) {
            reader.reject(err);
          }
          readQueue.length = 0;
        });
        this.on("error", (err) => {
          done = true;
          for (const reader of readQueue) {
            reader.reject(err);
          }
          readQueue.length = 0;
        });
        return {
          next: async () => {
            if (!pushQueue.length) {
              if (done) {
                return { value: void 0, done: true };
              }
              return new Promise((resolve, reject) => readQueue.push({ resolve, reject })).then((chunk2) => chunk2 ? { value: chunk2, done: false } : { value: void 0, done: true });
            }
            const chunk = pushQueue.shift();
            return { value: chunk, done: false };
          },
          return: async () => {
            this.abort();
            return { value: void 0, done: true };
          }
        };
      }
      toReadableStream() {
        const stream = new streaming_1.Stream(this[Symbol.asyncIterator].bind(this), this.controller);
        return stream.toReadableStream();
      }
    };
    exports2.MessageStream = MessageStream;
    function checkNever(x) {
    }
  }
});

// node_modules/@anthropic-ai/sdk/resources/messages/batches.js
var require_batches2 = __commonJS({
  "node_modules/@anthropic-ai/sdk/resources/messages/batches.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.Batches = void 0;
    var resource_1 = require_resource();
    var pagination_1 = require_pagination();
    var headers_1 = require_headers();
    var jsonl_1 = require_jsonl();
    var error_1 = require_error2();
    var path_1 = require_path();
    var Batches = class extends resource_1.APIResource {
      /**
       * Send a batch of Message creation requests.
       *
       * The Message Batches API can be used to process multiple Messages API requests at
       * once. Once a Message Batch is created, it begins processing immediately. Batches
       * can take up to 24 hours to complete.
       *
       * Learn more about the Message Batches API in our
       * [user guide](https://docs.claude.com/en/docs/build-with-claude/batch-processing)
       *
       * @example
       * ```ts
       * const messageBatch = await client.messages.batches.create({
       *   requests: [
       *     {
       *       custom_id: 'my-custom-id-1',
       *       params: {
       *         max_tokens: 1024,
       *         messages: [
       *           { content: 'Hello, world', role: 'user' },
       *         ],
       *         model: 'claude-opus-4-6',
       *       },
       *     },
       *   ],
       * });
       * ```
       */
      create(body, options) {
        return this._client.post("/v1/messages/batches", { body, ...options });
      }
      /**
       * This endpoint is idempotent and can be used to poll for Message Batch
       * completion. To access the results of a Message Batch, make a request to the
       * `results_url` field in the response.
       *
       * Learn more about the Message Batches API in our
       * [user guide](https://docs.claude.com/en/docs/build-with-claude/batch-processing)
       *
       * @example
       * ```ts
       * const messageBatch = await client.messages.batches.retrieve(
       *   'message_batch_id',
       * );
       * ```
       */
      retrieve(messageBatchID, options) {
        return this._client.get((0, path_1.path)`/v1/messages/batches/${messageBatchID}`, options);
      }
      /**
       * List all Message Batches within a Workspace. Most recently created batches are
       * returned first.
       *
       * Learn more about the Message Batches API in our
       * [user guide](https://docs.claude.com/en/docs/build-with-claude/batch-processing)
       *
       * @example
       * ```ts
       * // Automatically fetches more pages as needed.
       * for await (const messageBatch of client.messages.batches.list()) {
       *   // ...
       * }
       * ```
       */
      list(query = {}, options) {
        return this._client.getAPIList("/v1/messages/batches", pagination_1.Page, { query, ...options });
      }
      /**
       * Delete a Message Batch.
       *
       * Message Batches can only be deleted once they've finished processing. If you'd
       * like to delete an in-progress batch, you must first cancel it.
       *
       * Learn more about the Message Batches API in our
       * [user guide](https://docs.claude.com/en/docs/build-with-claude/batch-processing)
       *
       * @example
       * ```ts
       * const deletedMessageBatch =
       *   await client.messages.batches.delete('message_batch_id');
       * ```
       */
      delete(messageBatchID, options) {
        return this._client.delete((0, path_1.path)`/v1/messages/batches/${messageBatchID}`, options);
      }
      /**
       * Batches may be canceled any time before processing ends. Once cancellation is
       * initiated, the batch enters a `canceling` state, at which time the system may
       * complete any in-progress, non-interruptible requests before finalizing
       * cancellation.
       *
       * The number of canceled requests is specified in `request_counts`. To determine
       * which requests were canceled, check the individual results within the batch.
       * Note that cancellation may not result in any canceled requests if they were
       * non-interruptible.
       *
       * Learn more about the Message Batches API in our
       * [user guide](https://docs.claude.com/en/docs/build-with-claude/batch-processing)
       *
       * @example
       * ```ts
       * const messageBatch = await client.messages.batches.cancel(
       *   'message_batch_id',
       * );
       * ```
       */
      cancel(messageBatchID, options) {
        return this._client.post((0, path_1.path)`/v1/messages/batches/${messageBatchID}/cancel`, options);
      }
      /**
       * Streams the results of a Message Batch as a `.jsonl` file.
       *
       * Each line in the file is a JSON object containing the result of a single request
       * in the Message Batch. Results are not guaranteed to be in the same order as
       * requests. Use the `custom_id` field to match results to requests.
       *
       * Learn more about the Message Batches API in our
       * [user guide](https://docs.claude.com/en/docs/build-with-claude/batch-processing)
       *
       * @example
       * ```ts
       * const messageBatchIndividualResponse =
       *   await client.messages.batches.results('message_batch_id');
       * ```
       */
      async results(messageBatchID, options) {
        const batch = await this.retrieve(messageBatchID);
        if (!batch.results_url) {
          throw new error_1.AnthropicError(`No batch \`results_url\`; Has it finished processing? ${batch.processing_status} - ${batch.id}`);
        }
        return this._client.get(batch.results_url, {
          ...options,
          headers: (0, headers_1.buildHeaders)([{ Accept: "application/binary" }, options?.headers]),
          stream: true,
          __binaryResponse: true
        })._thenUnwrap((_, props) => jsonl_1.JSONLDecoder.fromResponse(props.response, props.controller));
      }
    };
    exports2.Batches = Batches;
  }
});

// node_modules/@anthropic-ai/sdk/resources/messages/messages.js
var require_messages2 = __commonJS({
  "node_modules/@anthropic-ai/sdk/resources/messages/messages.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.Messages = void 0;
    var tslib_1 = require_tslib();
    var resource_1 = require_resource();
    var headers_1 = require_headers();
    var stainless_helper_header_1 = require_stainless_helper_header();
    var MessageStream_1 = require_MessageStream();
    var parser_1 = require_parser2();
    var BatchesAPI = tslib_1.__importStar(require_batches2());
    var batches_1 = require_batches2();
    var constants_1 = require_constants();
    var Messages = class extends resource_1.APIResource {
      constructor() {
        super(...arguments);
        this.batches = new BatchesAPI.Batches(this._client);
      }
      create(body, options) {
        if (body.model in DEPRECATED_MODELS) {
          console.warn(`The model '${body.model}' is deprecated and will reach end-of-life on ${DEPRECATED_MODELS[body.model]}
Please migrate to a newer model. Visit https://docs.anthropic.com/en/docs/resources/model-deprecations for more information.`);
        }
        if (body.model in MODELS_TO_WARN_WITH_THINKING_ENABLED && body.thinking && body.thinking.type === "enabled") {
          console.warn(`Using Claude with ${body.model} and 'thinking.type=enabled' is deprecated. Use 'thinking.type=adaptive' instead which results in better model performance in our testing: https://platform.claude.com/docs/en/build-with-claude/adaptive-thinking`);
        }
        let timeout = this._client._options.timeout;
        if (!body.stream && timeout == null) {
          const maxNonstreamingTokens = constants_1.MODEL_NONSTREAMING_TOKENS[body.model] ?? void 0;
          timeout = this._client.calculateNonstreamingTimeout(body.max_tokens, maxNonstreamingTokens);
        }
        const helperHeader = (0, stainless_helper_header_1.stainlessHelperHeader)(body.tools, body.messages);
        return this._client.post("/v1/messages", {
          body,
          timeout: timeout ?? 6e5,
          ...options,
          headers: (0, headers_1.buildHeaders)([helperHeader, options?.headers]),
          stream: body.stream ?? false
        });
      }
      /**
       * Send a structured list of input messages with text and/or image content, along with an expected `output_config.format` and
       * the response will be automatically parsed and available in the `parsed_output` property of the message.
       *
       * @example
       * ```ts
       * const message = await client.messages.parse({
       *   model: 'claude-sonnet-4-5-20250929',
       *   max_tokens: 1024,
       *   messages: [{ role: 'user', content: 'What is 2+2?' }],
       *   output_config: {
       *     format: zodOutputFormat(z.object({ answer: z.number() })),
       *   },
       * });
       *
       * console.log(message.parsed_output?.answer); // 4
       * ```
       */
      parse(params, options) {
        return this.create(params, options).then((message) => (0, parser_1.parseMessage)(message, params, { logger: this._client.logger ?? console }));
      }
      /**
       * Create a Message stream.
       *
       * If `output_config.format` is provided with a parseable format (like `zodOutputFormat()`),
       * the final message will include a `parsed_output` property with the parsed content.
       *
       * @example
       * ```ts
       * const stream = client.messages.stream({
       *   model: 'claude-sonnet-4-5-20250929',
       *   max_tokens: 1024,
       *   messages: [{ role: 'user', content: 'What is 2+2?' }],
       *   output_config: {
       *     format: zodOutputFormat(z.object({ answer: z.number() })),
       *   },
       * });
       *
       * const message = await stream.finalMessage();
       * console.log(message.parsed_output?.answer); // 4
       * ```
       */
      stream(body, options) {
        return MessageStream_1.MessageStream.createMessage(this, body, options, { logger: this._client.logger ?? console });
      }
      /**
       * Count the number of tokens in a Message.
       *
       * The Token Count API can be used to count the number of tokens in a Message,
       * including tools, images, and documents, without creating it.
       *
       * Learn more about token counting in our
       * [user guide](https://docs.claude.com/en/docs/build-with-claude/token-counting)
       *
       * @example
       * ```ts
       * const messageTokensCount =
       *   await client.messages.countTokens({
       *     messages: [{ content: 'string', role: 'user' }],
       *     model: 'claude-opus-4-6',
       *   });
       * ```
       */
      countTokens(body, options) {
        return this._client.post("/v1/messages/count_tokens", { body, ...options });
      }
    };
    exports2.Messages = Messages;
    var DEPRECATED_MODELS = {
      "claude-1.3": "November 6th, 2024",
      "claude-1.3-100k": "November 6th, 2024",
      "claude-instant-1.1": "November 6th, 2024",
      "claude-instant-1.1-100k": "November 6th, 2024",
      "claude-instant-1.2": "November 6th, 2024",
      "claude-3-sonnet-20240229": "July 21st, 2025",
      "claude-3-opus-20240229": "January 5th, 2026",
      "claude-2.1": "July 21st, 2025",
      "claude-2.0": "July 21st, 2025",
      "claude-3-7-sonnet-latest": "February 19th, 2026",
      "claude-3-7-sonnet-20250219": "February 19th, 2026",
      "claude-3-5-haiku-latest": "February 19th, 2026",
      "claude-3-5-haiku-20241022": "February 19th, 2026"
    };
    var MODELS_TO_WARN_WITH_THINKING_ENABLED = ["claude-opus-4-6"];
    Messages.Batches = batches_1.Batches;
  }
});

// node_modules/@anthropic-ai/sdk/resources/models.js
var require_models2 = __commonJS({
  "node_modules/@anthropic-ai/sdk/resources/models.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.Models = void 0;
    var resource_1 = require_resource();
    var pagination_1 = require_pagination();
    var headers_1 = require_headers();
    var path_1 = require_path();
    var Models = class extends resource_1.APIResource {
      /**
       * Get a specific model.
       *
       * The Models API response can be used to determine information about a specific
       * model or resolve a model alias to a model ID.
       */
      retrieve(modelID, params = {}, options) {
        const { betas } = params ?? {};
        return this._client.get((0, path_1.path)`/v1/models/${modelID}`, {
          ...options,
          headers: (0, headers_1.buildHeaders)([
            { ...betas?.toString() != null ? { "anthropic-beta": betas?.toString() } : void 0 },
            options?.headers
          ])
        });
      }
      /**
       * List available models.
       *
       * The Models API response can be used to determine which models are available for
       * use in the API. More recently released models are listed first.
       */
      list(params = {}, options) {
        const { betas, ...query } = params ?? {};
        return this._client.getAPIList("/v1/models", pagination_1.Page, {
          query,
          ...options,
          headers: (0, headers_1.buildHeaders)([
            { ...betas?.toString() != null ? { "anthropic-beta": betas?.toString() } : void 0 },
            options?.headers
          ])
        });
      }
    };
    exports2.Models = Models;
  }
});

// node_modules/@anthropic-ai/sdk/resources/index.js
var require_resources = __commonJS({
  "node_modules/@anthropic-ai/sdk/resources/index.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.Models = exports2.Messages = exports2.Completions = exports2.Beta = void 0;
    var tslib_1 = require_tslib();
    tslib_1.__exportStar(require_shared(), exports2);
    var beta_1 = require_beta();
    Object.defineProperty(exports2, "Beta", { enumerable: true, get: function() {
      return beta_1.Beta;
    } });
    var completions_1 = require_completions();
    Object.defineProperty(exports2, "Completions", { enumerable: true, get: function() {
      return completions_1.Completions;
    } });
    var messages_1 = require_messages2();
    Object.defineProperty(exports2, "Messages", { enumerable: true, get: function() {
      return messages_1.Messages;
    } });
    var models_1 = require_models2();
    Object.defineProperty(exports2, "Models", { enumerable: true, get: function() {
      return models_1.Models;
    } });
  }
});

// node_modules/@anthropic-ai/sdk/internal/utils/env.js
var require_env = __commonJS({
  "node_modules/@anthropic-ai/sdk/internal/utils/env.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.readEnv = void 0;
    var readEnv = (env) => {
      if (typeof globalThis.process !== "undefined") {
        return globalThis.process.env?.[env]?.trim() ?? void 0;
      }
      if (typeof globalThis.Deno !== "undefined") {
        return globalThis.Deno.env?.get?.(env)?.trim();
      }
      return void 0;
    };
    exports2.readEnv = readEnv;
  }
});

// node_modules/@anthropic-ai/sdk/client.js
var require_client = __commonJS({
  "node_modules/@anthropic-ai/sdk/client.js"(exports2) {
    "use strict";
    var _BaseAnthropic_instances;
    var _a;
    var _BaseAnthropic_encoder;
    var _BaseAnthropic_baseURLOverridden;
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.Anthropic = exports2.BaseAnthropic = exports2.AI_PROMPT = exports2.HUMAN_PROMPT = void 0;
    var tslib_1 = require_tslib();
    var uuid_1 = require_uuid();
    var values_1 = require_values();
    var sleep_1 = require_sleep();
    var errors_1 = require_errors();
    var detect_platform_1 = require_detect_platform();
    var Shims = tslib_1.__importStar(require_shims());
    var Opts = tslib_1.__importStar(require_request_options());
    var query_1 = require_query();
    var version_1 = require_version();
    var Errors = tslib_1.__importStar(require_error());
    var Pagination = tslib_1.__importStar(require_pagination());
    var Uploads = tslib_1.__importStar(require_uploads2());
    var API = tslib_1.__importStar(require_resources());
    var api_promise_1 = require_api_promise();
    var completions_1 = require_completions();
    var models_1 = require_models2();
    var beta_1 = require_beta();
    var messages_1 = require_messages2();
    var detect_platform_2 = require_detect_platform();
    var headers_1 = require_headers();
    var env_1 = require_env();
    var log_1 = require_log();
    var values_2 = require_values();
    exports2.HUMAN_PROMPT = "\\n\\nHuman:";
    exports2.AI_PROMPT = "\\n\\nAssistant:";
    var BaseAnthropic = class {
      /**
       * API Client for interfacing with the Anthropic API.
       *
       * @param {string | null | undefined} [opts.apiKey=process.env['ANTHROPIC_API_KEY'] ?? null]
       * @param {string | null | undefined} [opts.authToken=process.env['ANTHROPIC_AUTH_TOKEN'] ?? null]
       * @param {string} [opts.baseURL=process.env['ANTHROPIC_BASE_URL'] ?? https://api.anthropic.com] - Override the default base URL for the API.
       * @param {number} [opts.timeout=10 minutes] - The maximum amount of time (in milliseconds) the client will wait for a response before timing out.
       * @param {MergedRequestInit} [opts.fetchOptions] - Additional `RequestInit` options to be passed to `fetch` calls.
       * @param {Fetch} [opts.fetch] - Specify a custom `fetch` function implementation.
       * @param {number} [opts.maxRetries=2] - The maximum number of times the client will retry a request.
       * @param {HeadersLike} opts.defaultHeaders - Default headers to include with every request to the API.
       * @param {Record<string, string | undefined>} opts.defaultQuery - Default query parameters to include with every request to the API.
       * @param {boolean} [opts.dangerouslyAllowBrowser=false] - By default, client-side use of this library is not allowed, as it risks exposing your secret API credentials to attackers.
       */
      constructor({ baseURL = (0, env_1.readEnv)("ANTHROPIC_BASE_URL"), apiKey = (0, env_1.readEnv)("ANTHROPIC_API_KEY") ?? null, authToken = (0, env_1.readEnv)("ANTHROPIC_AUTH_TOKEN") ?? null, ...opts } = {}) {
        _BaseAnthropic_instances.add(this);
        _BaseAnthropic_encoder.set(this, void 0);
        const options = {
          apiKey,
          authToken,
          ...opts,
          baseURL: baseURL || `https://api.anthropic.com`
        };
        if (!options.dangerouslyAllowBrowser && (0, detect_platform_2.isRunningInBrowser)()) {
          throw new Errors.AnthropicError("It looks like you're running in a browser-like environment.\n\nThis is disabled by default, as it risks exposing your secret API credentials to attackers.\nIf you understand the risks and have appropriate mitigations in place,\nyou can set the `dangerouslyAllowBrowser` option to `true`, e.g.,\n\nnew Anthropic({ apiKey, dangerouslyAllowBrowser: true });\n");
        }
        this.baseURL = options.baseURL;
        this.timeout = options.timeout ?? _a.DEFAULT_TIMEOUT;
        this.logger = options.logger ?? console;
        const defaultLogLevel = "warn";
        this.logLevel = defaultLogLevel;
        this.logLevel = (0, log_1.parseLogLevel)(options.logLevel, "ClientOptions.logLevel", this) ?? (0, log_1.parseLogLevel)((0, env_1.readEnv)("ANTHROPIC_LOG"), "process.env['ANTHROPIC_LOG']", this) ?? defaultLogLevel;
        this.fetchOptions = options.fetchOptions;
        this.maxRetries = options.maxRetries ?? 2;
        this.fetch = options.fetch ?? Shims.getDefaultFetch();
        tslib_1.__classPrivateFieldSet(this, _BaseAnthropic_encoder, Opts.FallbackEncoder, "f");
        this._options = options;
        this.apiKey = typeof apiKey === "string" ? apiKey : null;
        this.authToken = authToken;
      }
      /**
       * Create a new client instance re-using the same options given to the current client with optional overriding.
       */
      withOptions(options) {
        const client = new this.constructor({
          ...this._options,
          baseURL: this.baseURL,
          maxRetries: this.maxRetries,
          timeout: this.timeout,
          logger: this.logger,
          logLevel: this.logLevel,
          fetch: this.fetch,
          fetchOptions: this.fetchOptions,
          apiKey: this.apiKey,
          authToken: this.authToken,
          ...options
        });
        return client;
      }
      defaultQuery() {
        return this._options.defaultQuery;
      }
      validateHeaders({ values, nulls }) {
        if (values.get("x-api-key") || values.get("authorization")) {
          return;
        }
        if (this.apiKey && values.get("x-api-key")) {
          return;
        }
        if (nulls.has("x-api-key")) {
          return;
        }
        if (this.authToken && values.get("authorization")) {
          return;
        }
        if (nulls.has("authorization")) {
          return;
        }
        throw new Error('Could not resolve authentication method. Expected either apiKey or authToken to be set. Or for one of the "X-Api-Key" or "Authorization" headers to be explicitly omitted');
      }
      async authHeaders(opts) {
        return (0, headers_1.buildHeaders)([await this.apiKeyAuth(opts), await this.bearerAuth(opts)]);
      }
      async apiKeyAuth(opts) {
        if (this.apiKey == null) {
          return void 0;
        }
        return (0, headers_1.buildHeaders)([{ "X-Api-Key": this.apiKey }]);
      }
      async bearerAuth(opts) {
        if (this.authToken == null) {
          return void 0;
        }
        return (0, headers_1.buildHeaders)([{ Authorization: `Bearer ${this.authToken}` }]);
      }
      /**
       * Basic re-implementation of `qs.stringify` for primitive types.
       */
      stringifyQuery(query) {
        return (0, query_1.stringifyQuery)(query);
      }
      getUserAgent() {
        return `${this.constructor.name}/JS ${version_1.VERSION}`;
      }
      defaultIdempotencyKey() {
        return `stainless-node-retry-${(0, uuid_1.uuid4)()}`;
      }
      makeStatusError(status, error, message, headers) {
        return Errors.APIError.generate(status, error, message, headers);
      }
      buildURL(path, query, defaultBaseURL) {
        const baseURL = !tslib_1.__classPrivateFieldGet(this, _BaseAnthropic_instances, "m", _BaseAnthropic_baseURLOverridden).call(this) && defaultBaseURL || this.baseURL;
        const url = (0, values_1.isAbsoluteURL)(path) ? new URL(path) : new URL(baseURL + (baseURL.endsWith("/") && path.startsWith("/") ? path.slice(1) : path));
        const defaultQuery = this.defaultQuery();
        const pathQuery = Object.fromEntries(url.searchParams);
        if (!(0, values_2.isEmptyObj)(defaultQuery) || !(0, values_2.isEmptyObj)(pathQuery)) {
          query = { ...pathQuery, ...defaultQuery, ...query };
        }
        if (typeof query === "object" && query && !Array.isArray(query)) {
          url.search = this.stringifyQuery(query);
        }
        return url.toString();
      }
      _calculateNonstreamingTimeout(maxTokens) {
        const defaultTimeout = 10 * 60;
        const expectedTimeout = 60 * 60 * maxTokens / 128e3;
        if (expectedTimeout > defaultTimeout) {
          throw new Errors.AnthropicError("Streaming is required for operations that may take longer than 10 minutes. See https://github.com/anthropics/anthropic-sdk-typescript#streaming-responses for more details");
        }
        return defaultTimeout * 1e3;
      }
      /**
       * Used as a callback for mutating the given `FinalRequestOptions` object.
       */
      async prepareOptions(options) {
      }
      /**
       * Used as a callback for mutating the given `RequestInit` object.
       *
       * This is useful for cases where you want to add certain headers based off of
       * the request properties, e.g. `method` or `url`.
       */
      async prepareRequest(request, { url, options }) {
      }
      get(path, opts) {
        return this.methodRequest("get", path, opts);
      }
      post(path, opts) {
        return this.methodRequest("post", path, opts);
      }
      patch(path, opts) {
        return this.methodRequest("patch", path, opts);
      }
      put(path, opts) {
        return this.methodRequest("put", path, opts);
      }
      delete(path, opts) {
        return this.methodRequest("delete", path, opts);
      }
      methodRequest(method, path, opts) {
        return this.request(Promise.resolve(opts).then((opts2) => {
          return { method, path, ...opts2 };
        }));
      }
      request(options, remainingRetries = null) {
        return new api_promise_1.APIPromise(this, this.makeRequest(options, remainingRetries, void 0));
      }
      async makeRequest(optionsInput, retriesRemaining, retryOfRequestLogID) {
        const options = await optionsInput;
        const maxRetries = options.maxRetries ?? this.maxRetries;
        if (retriesRemaining == null) {
          retriesRemaining = maxRetries;
        }
        await this.prepareOptions(options);
        const { req, url, timeout } = await this.buildRequest(options, {
          retryCount: maxRetries - retriesRemaining
        });
        await this.prepareRequest(req, { url, options });
        const requestLogID = "log_" + (Math.random() * (1 << 24) | 0).toString(16).padStart(6, "0");
        const retryLogStr = retryOfRequestLogID === void 0 ? "" : `, retryOf: ${retryOfRequestLogID}`;
        const startTime = Date.now();
        (0, log_1.loggerFor)(this).debug(`[${requestLogID}] sending request`, (0, log_1.formatRequestDetails)({
          retryOfRequestLogID,
          method: options.method,
          url,
          options,
          headers: req.headers
        }));
        if (options.signal?.aborted) {
          throw new Errors.APIUserAbortError();
        }
        const controller = new AbortController();
        const response = await this.fetchWithTimeout(url, req, timeout, controller).catch(errors_1.castToError);
        const headersTime = Date.now();
        if (response instanceof globalThis.Error) {
          const retryMessage = `retrying, ${retriesRemaining} attempts remaining`;
          if (options.signal?.aborted) {
            throw new Errors.APIUserAbortError();
          }
          const isTimeout = (0, errors_1.isAbortError)(response) || /timed? ?out/i.test(String(response) + ("cause" in response ? String(response.cause) : ""));
          if (retriesRemaining) {
            (0, log_1.loggerFor)(this).info(`[${requestLogID}] connection ${isTimeout ? "timed out" : "failed"} - ${retryMessage}`);
            (0, log_1.loggerFor)(this).debug(`[${requestLogID}] connection ${isTimeout ? "timed out" : "failed"} (${retryMessage})`, (0, log_1.formatRequestDetails)({
              retryOfRequestLogID,
              url,
              durationMs: headersTime - startTime,
              message: response.message
            }));
            return this.retryRequest(options, retriesRemaining, retryOfRequestLogID ?? requestLogID);
          }
          (0, log_1.loggerFor)(this).info(`[${requestLogID}] connection ${isTimeout ? "timed out" : "failed"} - error; no more retries left`);
          (0, log_1.loggerFor)(this).debug(`[${requestLogID}] connection ${isTimeout ? "timed out" : "failed"} (error; no more retries left)`, (0, log_1.formatRequestDetails)({
            retryOfRequestLogID,
            url,
            durationMs: headersTime - startTime,
            message: response.message
          }));
          if (isTimeout) {
            throw new Errors.APIConnectionTimeoutError();
          }
          throw new Errors.APIConnectionError({ cause: response });
        }
        const specialHeaders = [...response.headers.entries()].filter(([name]) => name === "request-id").map(([name, value]) => ", " + name + ": " + JSON.stringify(value)).join("");
        const responseInfo = `[${requestLogID}${retryLogStr}${specialHeaders}] ${req.method} ${url} ${response.ok ? "succeeded" : "failed"} with status ${response.status} in ${headersTime - startTime}ms`;
        if (!response.ok) {
          const shouldRetry = await this.shouldRetry(response);
          if (retriesRemaining && shouldRetry) {
            const retryMessage2 = `retrying, ${retriesRemaining} attempts remaining`;
            await Shims.CancelReadableStream(response.body);
            (0, log_1.loggerFor)(this).info(`${responseInfo} - ${retryMessage2}`);
            (0, log_1.loggerFor)(this).debug(`[${requestLogID}] response error (${retryMessage2})`, (0, log_1.formatRequestDetails)({
              retryOfRequestLogID,
              url: response.url,
              status: response.status,
              headers: response.headers,
              durationMs: headersTime - startTime
            }));
            return this.retryRequest(options, retriesRemaining, retryOfRequestLogID ?? requestLogID, response.headers);
          }
          const retryMessage = shouldRetry ? `error; no more retries left` : `error; not retryable`;
          (0, log_1.loggerFor)(this).info(`${responseInfo} - ${retryMessage}`);
          const errText = await response.text().catch((err2) => (0, errors_1.castToError)(err2).message);
          const errJSON = (0, values_1.safeJSON)(errText);
          const errMessage = errJSON ? void 0 : errText;
          (0, log_1.loggerFor)(this).debug(`[${requestLogID}] response error (${retryMessage})`, (0, log_1.formatRequestDetails)({
            retryOfRequestLogID,
            url: response.url,
            status: response.status,
            headers: response.headers,
            message: errMessage,
            durationMs: Date.now() - startTime
          }));
          const err = this.makeStatusError(response.status, errJSON, errMessage, response.headers);
          throw err;
        }
        (0, log_1.loggerFor)(this).info(responseInfo);
        (0, log_1.loggerFor)(this).debug(`[${requestLogID}] response start`, (0, log_1.formatRequestDetails)({
          retryOfRequestLogID,
          url: response.url,
          status: response.status,
          headers: response.headers,
          durationMs: headersTime - startTime
        }));
        return { response, options, controller, requestLogID, retryOfRequestLogID, startTime };
      }
      getAPIList(path, Page, opts) {
        return this.requestAPIList(Page, opts && "then" in opts ? opts.then((opts2) => ({ method: "get", path, ...opts2 })) : { method: "get", path, ...opts });
      }
      requestAPIList(Page, options) {
        const request = this.makeRequest(options, null, void 0);
        return new Pagination.PagePromise(this, request, Page);
      }
      async fetchWithTimeout(url, init, ms, controller) {
        const { signal, method, ...options } = init || {};
        const abort = this._makeAbort(controller);
        if (signal)
          signal.addEventListener("abort", abort, { once: true });
        const timeout = setTimeout(abort, ms);
        const isReadableBody = globalThis.ReadableStream && options.body instanceof globalThis.ReadableStream || typeof options.body === "object" && options.body !== null && Symbol.asyncIterator in options.body;
        const fetchOptions = {
          signal: controller.signal,
          ...isReadableBody ? { duplex: "half" } : {},
          method: "GET",
          ...options
        };
        if (method) {
          fetchOptions.method = method.toUpperCase();
        }
        try {
          return await this.fetch.call(void 0, url, fetchOptions);
        } finally {
          clearTimeout(timeout);
        }
      }
      async shouldRetry(response) {
        const shouldRetryHeader = response.headers.get("x-should-retry");
        if (shouldRetryHeader === "true")
          return true;
        if (shouldRetryHeader === "false")
          return false;
        if (response.status === 408)
          return true;
        if (response.status === 409)
          return true;
        if (response.status === 429)
          return true;
        if (response.status >= 500)
          return true;
        return false;
      }
      async retryRequest(options, retriesRemaining, requestLogID, responseHeaders) {
        let timeoutMillis;
        const retryAfterMillisHeader = responseHeaders?.get("retry-after-ms");
        if (retryAfterMillisHeader) {
          const timeoutMs = parseFloat(retryAfterMillisHeader);
          if (!Number.isNaN(timeoutMs)) {
            timeoutMillis = timeoutMs;
          }
        }
        const retryAfterHeader = responseHeaders?.get("retry-after");
        if (retryAfterHeader && !timeoutMillis) {
          const timeoutSeconds = parseFloat(retryAfterHeader);
          if (!Number.isNaN(timeoutSeconds)) {
            timeoutMillis = timeoutSeconds * 1e3;
          } else {
            timeoutMillis = Date.parse(retryAfterHeader) - Date.now();
          }
        }
        if (timeoutMillis === void 0) {
          const maxRetries = options.maxRetries ?? this.maxRetries;
          timeoutMillis = this.calculateDefaultRetryTimeoutMillis(retriesRemaining, maxRetries);
        }
        await (0, sleep_1.sleep)(timeoutMillis);
        return this.makeRequest(options, retriesRemaining - 1, requestLogID);
      }
      calculateDefaultRetryTimeoutMillis(retriesRemaining, maxRetries) {
        const initialRetryDelay = 0.5;
        const maxRetryDelay = 8;
        const numRetries = maxRetries - retriesRemaining;
        const sleepSeconds = Math.min(initialRetryDelay * Math.pow(2, numRetries), maxRetryDelay);
        const jitter = 1 - Math.random() * 0.25;
        return sleepSeconds * jitter * 1e3;
      }
      calculateNonstreamingTimeout(maxTokens, maxNonstreamingTokens) {
        const maxTime = 60 * 60 * 1e3;
        const defaultTime = 60 * 10 * 1e3;
        const expectedTime = maxTime * maxTokens / 128e3;
        if (expectedTime > defaultTime || maxNonstreamingTokens != null && maxTokens > maxNonstreamingTokens) {
          throw new Errors.AnthropicError("Streaming is required for operations that may take longer than 10 minutes. See https://github.com/anthropics/anthropic-sdk-typescript#long-requests for more details");
        }
        return defaultTime;
      }
      async buildRequest(inputOptions, { retryCount = 0 } = {}) {
        const options = { ...inputOptions };
        const { method, path, query, defaultBaseURL } = options;
        const url = this.buildURL(path, query, defaultBaseURL);
        if ("timeout" in options)
          (0, values_1.validatePositiveInteger)("timeout", options.timeout);
        options.timeout = options.timeout ?? this.timeout;
        const { bodyHeaders, body } = this.buildBody({ options });
        const reqHeaders = await this.buildHeaders({ options: inputOptions, method, bodyHeaders, retryCount });
        const req = {
          method,
          headers: reqHeaders,
          ...options.signal && { signal: options.signal },
          ...globalThis.ReadableStream && body instanceof globalThis.ReadableStream && { duplex: "half" },
          ...body && { body },
          ...this.fetchOptions ?? {},
          ...options.fetchOptions ?? {}
        };
        return { req, url, timeout: options.timeout };
      }
      async buildHeaders({ options, method, bodyHeaders, retryCount }) {
        let idempotencyHeaders = {};
        if (this.idempotencyHeader && method !== "get") {
          if (!options.idempotencyKey)
            options.idempotencyKey = this.defaultIdempotencyKey();
          idempotencyHeaders[this.idempotencyHeader] = options.idempotencyKey;
        }
        const headers = (0, headers_1.buildHeaders)([
          idempotencyHeaders,
          {
            Accept: "application/json",
            "User-Agent": this.getUserAgent(),
            "X-Stainless-Retry-Count": String(retryCount),
            ...options.timeout ? { "X-Stainless-Timeout": String(Math.trunc(options.timeout / 1e3)) } : {},
            ...(0, detect_platform_1.getPlatformHeaders)(),
            ...this._options.dangerouslyAllowBrowser ? { "anthropic-dangerous-direct-browser-access": "true" } : void 0,
            "anthropic-version": "2023-06-01"
          },
          await this.authHeaders(options),
          this._options.defaultHeaders,
          bodyHeaders,
          options.headers
        ]);
        this.validateHeaders(headers);
        return headers.values;
      }
      _makeAbort(controller) {
        return () => controller.abort();
      }
      buildBody({ options: { body, headers: rawHeaders } }) {
        if (!body) {
          return { bodyHeaders: void 0, body: void 0 };
        }
        const headers = (0, headers_1.buildHeaders)([rawHeaders]);
        if (
          // Pass raw type verbatim
          ArrayBuffer.isView(body) || body instanceof ArrayBuffer || body instanceof DataView || typeof body === "string" && // Preserve legacy string encoding behavior for now
          headers.values.has("content-type") || // `Blob` is superset of `File`
          globalThis.Blob && body instanceof globalThis.Blob || // `FormData` -> `multipart/form-data`
          body instanceof FormData || // `URLSearchParams` -> `application/x-www-form-urlencoded`
          body instanceof URLSearchParams || // Send chunked stream (each chunk has own `length`)
          globalThis.ReadableStream && body instanceof globalThis.ReadableStream
        ) {
          return { bodyHeaders: void 0, body };
        } else if (typeof body === "object" && (Symbol.asyncIterator in body || Symbol.iterator in body && "next" in body && typeof body.next === "function")) {
          return { bodyHeaders: void 0, body: Shims.ReadableStreamFrom(body) };
        } else if (typeof body === "object" && headers.values.get("content-type") === "application/x-www-form-urlencoded") {
          return {
            bodyHeaders: { "content-type": "application/x-www-form-urlencoded" },
            body: this.stringifyQuery(body)
          };
        } else {
          return tslib_1.__classPrivateFieldGet(this, _BaseAnthropic_encoder, "f").call(this, { body, headers });
        }
      }
    };
    exports2.BaseAnthropic = BaseAnthropic;
    _a = BaseAnthropic, _BaseAnthropic_encoder = /* @__PURE__ */ new WeakMap(), _BaseAnthropic_instances = /* @__PURE__ */ new WeakSet(), _BaseAnthropic_baseURLOverridden = function _BaseAnthropic_baseURLOverridden2() {
      return this.baseURL !== "https://api.anthropic.com";
    };
    BaseAnthropic.Anthropic = _a;
    BaseAnthropic.HUMAN_PROMPT = exports2.HUMAN_PROMPT;
    BaseAnthropic.AI_PROMPT = exports2.AI_PROMPT;
    BaseAnthropic.DEFAULT_TIMEOUT = 6e5;
    BaseAnthropic.AnthropicError = Errors.AnthropicError;
    BaseAnthropic.APIError = Errors.APIError;
    BaseAnthropic.APIConnectionError = Errors.APIConnectionError;
    BaseAnthropic.APIConnectionTimeoutError = Errors.APIConnectionTimeoutError;
    BaseAnthropic.APIUserAbortError = Errors.APIUserAbortError;
    BaseAnthropic.NotFoundError = Errors.NotFoundError;
    BaseAnthropic.ConflictError = Errors.ConflictError;
    BaseAnthropic.RateLimitError = Errors.RateLimitError;
    BaseAnthropic.BadRequestError = Errors.BadRequestError;
    BaseAnthropic.AuthenticationError = Errors.AuthenticationError;
    BaseAnthropic.InternalServerError = Errors.InternalServerError;
    BaseAnthropic.PermissionDeniedError = Errors.PermissionDeniedError;
    BaseAnthropic.UnprocessableEntityError = Errors.UnprocessableEntityError;
    BaseAnthropic.toFile = Uploads.toFile;
    var Anthropic2 = class extends BaseAnthropic {
      constructor() {
        super(...arguments);
        this.completions = new API.Completions(this);
        this.messages = new API.Messages(this);
        this.models = new API.Models(this);
        this.beta = new API.Beta(this);
      }
    };
    exports2.Anthropic = Anthropic2;
    Anthropic2.Completions = completions_1.Completions;
    Anthropic2.Messages = messages_1.Messages;
    Anthropic2.Models = models_1.Models;
    Anthropic2.Beta = beta_1.Beta;
  }
});

// node_modules/@anthropic-ai/sdk/index.js
var require_sdk = __commonJS({
  "node_modules/@anthropic-ai/sdk/index.js"(exports2, module2) {
    "use strict";
    exports2 = module2.exports = function(...args) {
      return new exports2.default(...args);
    };
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.UnprocessableEntityError = exports2.PermissionDeniedError = exports2.InternalServerError = exports2.AuthenticationError = exports2.BadRequestError = exports2.RateLimitError = exports2.ConflictError = exports2.NotFoundError = exports2.APIUserAbortError = exports2.APIConnectionTimeoutError = exports2.APIConnectionError = exports2.APIError = exports2.AnthropicError = exports2.PagePromise = exports2.AI_PROMPT = exports2.HUMAN_PROMPT = exports2.Anthropic = exports2.BaseAnthropic = exports2.APIPromise = exports2.toFile = exports2.default = void 0;
    var client_1 = require_client();
    Object.defineProperty(exports2, "default", { enumerable: true, get: function() {
      return client_1.Anthropic;
    } });
    var uploads_1 = require_uploads2();
    Object.defineProperty(exports2, "toFile", { enumerable: true, get: function() {
      return uploads_1.toFile;
    } });
    var api_promise_1 = require_api_promise();
    Object.defineProperty(exports2, "APIPromise", { enumerable: true, get: function() {
      return api_promise_1.APIPromise;
    } });
    var client_2 = require_client();
    Object.defineProperty(exports2, "BaseAnthropic", { enumerable: true, get: function() {
      return client_2.BaseAnthropic;
    } });
    Object.defineProperty(exports2, "Anthropic", { enumerable: true, get: function() {
      return client_2.Anthropic;
    } });
    Object.defineProperty(exports2, "HUMAN_PROMPT", { enumerable: true, get: function() {
      return client_2.HUMAN_PROMPT;
    } });
    Object.defineProperty(exports2, "AI_PROMPT", { enumerable: true, get: function() {
      return client_2.AI_PROMPT;
    } });
    var pagination_1 = require_pagination();
    Object.defineProperty(exports2, "PagePromise", { enumerable: true, get: function() {
      return pagination_1.PagePromise;
    } });
    var error_1 = require_error();
    Object.defineProperty(exports2, "AnthropicError", { enumerable: true, get: function() {
      return error_1.AnthropicError;
    } });
    Object.defineProperty(exports2, "APIError", { enumerable: true, get: function() {
      return error_1.APIError;
    } });
    Object.defineProperty(exports2, "APIConnectionError", { enumerable: true, get: function() {
      return error_1.APIConnectionError;
    } });
    Object.defineProperty(exports2, "APIConnectionTimeoutError", { enumerable: true, get: function() {
      return error_1.APIConnectionTimeoutError;
    } });
    Object.defineProperty(exports2, "APIUserAbortError", { enumerable: true, get: function() {
      return error_1.APIUserAbortError;
    } });
    Object.defineProperty(exports2, "NotFoundError", { enumerable: true, get: function() {
      return error_1.NotFoundError;
    } });
    Object.defineProperty(exports2, "ConflictError", { enumerable: true, get: function() {
      return error_1.ConflictError;
    } });
    Object.defineProperty(exports2, "RateLimitError", { enumerable: true, get: function() {
      return error_1.RateLimitError;
    } });
    Object.defineProperty(exports2, "BadRequestError", { enumerable: true, get: function() {
      return error_1.BadRequestError;
    } });
    Object.defineProperty(exports2, "AuthenticationError", { enumerable: true, get: function() {
      return error_1.AuthenticationError;
    } });
    Object.defineProperty(exports2, "InternalServerError", { enumerable: true, get: function() {
      return error_1.InternalServerError;
    } });
    Object.defineProperty(exports2, "PermissionDeniedError", { enumerable: true, get: function() {
      return error_1.PermissionDeniedError;
    } });
    Object.defineProperty(exports2, "UnprocessableEntityError", { enumerable: true, get: function() {
      return error_1.UnprocessableEntityError;
    } });
  }
});

// index.js
var Anthropic = require_sdk();
globalThis.__claudeInit = function(apiKey) {
  const client = new Anthropic({ apiKey });
  globalThis.__claudeClient = client;
  return { status: "initialized", version: Anthropic.VERSION || "unknown" };
};
globalThis.__claudeMessage = async function(prompt) {
  if (!globalThis.__claudeClient) {
    throw new Error("Client not initialized. Call __claudeInit first.");
  }
  const response = await globalThis.__claudeClient.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 256,
    messages: [{ role: "user", content: prompt }]
  });
  if (typeof __emitEvent === "function") {
    __emitEvent(JSON.stringify(response));
  }
  return response;
};
globalThis.__bundleLoaded = true;
globalThis.__bundleInfo = {
  name: "claude-test-bundle",
  modules: {
    anthropic: typeof Anthropic === "function",
    fetch: typeof fetch === "function",
    process: typeof process === "object",
    Buffer: typeof Buffer === "object",
    crypto: typeof require("node:crypto") === "object",
    path: typeof require("node:path") === "object"
  }
};
