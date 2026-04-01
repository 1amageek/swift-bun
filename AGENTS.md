# AGENTS.md

This file provides guidance to Codex (Codex.ai/code) when working with code in this repository.

## Build & Test

```bash
# Build
swift build

# Run all tests (with timeout)
swift test

# Run a specific test suite
swift test --filter "BunProcess"

# Run a single test by name
swift test --filter "setTimeout"
```

Network roundtrip tests (`FetchRoundtripTests`) hit `httpbin.org` and require internet access.

### Test bundle regeneration

The test bundle `Tests/BunRuntimeTests/Codex.bundle.js` is a resource copied into the test target via `Package.swift`. To regenerate it from `Fixtures/Codex-test/`:

```bash
cd Fixtures/Codex-test && npm install
npx esbuild index.js --bundle --platform=node --target=es2020 --format=cjs \
  --external:node:* --outfile=Codex.bundle.js
cp Codex.bundle.js ../../Tests/BunRuntimeTests/
```

The ESM transformer bundle `Sources/BunRuntime/Resources/esm-transformer.bundle.js` is regenerated from `Fixtures/esm-transformer/`:

```bash
cd Fixtures/esm-transformer && npm install
npx esbuild index.js --bundle --platform=node --target=es2020 --format=cjs \
  --outfile=esm-transformer.bundle.js
cp esm-transformer.bundle.js ../../Sources/BunRuntime/Resources/
cp esm-transformer.bundle.js ../../Tests/BunRuntimeTests/
```

The Web API polyfills bundle `Sources/BunRuntime/Resources/polyfills.bundle.js` is regenerated from `Fixtures/polyfills/`:

```bash
cd Fixtures/polyfills && npm install
npx esbuild index.js --bundle --platform=node --target=es2020 --format=cjs \
  --outfile=polyfills.bundle.js
cp polyfills.bundle.js ../../Sources/BunRuntime/Resources/
cp polyfills.bundle.js ../../Tests/BunRuntimeTests/
```

## Architecture

Primary architecture spec: `Docs/RuntimeArchitecture.md`

JavaScript placement rules are also defined in `Docs/RuntimeArchitecture.md` under `JavaScript source placement`.
JavaScript loading and resource layout are defined in `Docs/JavaScriptLoading.md`.

swift-bun provides a Bun-compatible JavaScript runtime for iOS/macOS by wrapping JavaScriptCore with Node.js/Bun polyfills. It uses SwiftNIO for the event loop (NIOCore + NIOPosix).

### Execution model: BunProcess

`BunProcess` is the sole execution model. Configuration is provided at `init`, execution via `load()` or `run()`.

```swift
BunProcess(bundle: URL?, arguments: [String], cwd: String?, environment: [String: String])

.load()  // Library mode — then evaluate(js:) / call(), and must be paired with shutdown()
.run()   // Process mode — blocks until exit and shuts down before returning
.shutdown() // Explicit cleanup for library mode
```

All JSContext access is serialized on a dedicated NIO EventLoop thread, guaranteeing thread safety.

```
BunProcess (final class, Sendable)
├── Configuration (immutable): bundle, arguments, cwd, environment
├── EventLoop thread (NIO MultiThreadedEventLoopGroup, 1 thread)
│   ├── JSContext (all access pinned to this thread)
│   ├── Web API polyfills (polyfills.bundle.js)
│   ├── ModuleBootstrap polyfills (require, Node.js modules, Bun APIs)
│   └── NIO-backed bridges:
│       ├── setTimeout/setInterval → eventLoop.scheduleTask
│       ├── fetch (__nativeFetch) → URLSession + eventLoop.execute
│       ├── process.stdout.write → stdout AsyncStream
│       ├── process.stdin → sendInput() from Swift
│       ├── process.exit → resolveExit()
│       └── console.log → output AsyncStream
├── Lifecycle (state machine + boot barriers + explicit shutdown)
└── ESM transformer (es-module-lexer WASM, temporary JSContext)
```

### Polyfill layers

JSCore's `evaluateScript()` provides only ECMAScript language features (Promise, Symbol, BigInt, etc.). All platform APIs are polyfilled in three layers:

```
Layer 0: polyfills.bundle.js    ← Web APIs (npm packages, esbuild bundled)
Layer 1: ModuleBootstrap        ← Node.js globals + modules (Swift strings)
Layer 2: NIO bridges            ← EventLoop-backed overrides (Swift closures)
```

**Layer 0** is loaded first and provides Web APIs that both Layer 1 and the user's bundle may depend on.

### Context setup order

1. **Web API polyfills** (`polyfills.bundle.js`) — ReadableStream, Event, Blob, crypto, etc.
2. **Node.js globals** (ModuleBootstrap.installGlobals) — global, self, performance, process, console, TextEncoder, URL, atob, AbortController, DOMException
3. **Node.js modules** (ModuleBootstrap.installModules) — path, buffer, url, util, os, fs, crypto, http, stream, timers, stubs
4. **Bun APIs** — Bun.file, Bun.env, Bun.write, etc.
5. **NIO bridges** — Timer override, Fetch override, process.exit, stdin, stdout/stderr, console → output stream
6. **Timer module patch** — Update `__nodeModules.timers` references to NIO-backed versions
7. **require()** — Installed last, resolves built-ins first and then plain `node_modules` CommonJS packages
8. **Configuration** — process.argv, process.cwd, process.env
9. **Bundle evaluation**
   - `load()` / library mode: evaluate the bundle directly into the global context
   - `run()` / process mode: execute the entry script as the CommonJS main module

## Polyfill coverage status

### Web APIs (polyfills.bundle.js)

| API | Status | Implementation |
|-----|--------|---------------|
| ReadableStream | ✅ Full | web-streams-polyfill (npm) |
| WritableStream | ✅ Full | web-streams-polyfill (npm) |
| TransformStream | ✅ Full | web-streams-polyfill (npm) |
| Event | ✅ Full | Custom (in bundle) |
| EventTarget | ✅ Full | Custom (in bundle) |
| CustomEvent | ✅ Full | Custom (in bundle) |
| Blob | ✅ Basic | Custom (text/arrayBuffer/stream/slice) |
| File | ✅ Basic | Extends Blob with name/lastModified |
| FormData | ✅ Full | Custom |
| WebSocket | ⚠️ Stub | Class exists for instanceof/extends, no actual connection |
| Worker | ⚠️ Stub | Throws on instantiation |
| MessageChannel / MessagePort | ✅ Basic | Functional postMessage |
| XMLHttpRequest | ✅ Basic | Async-only adapter over fetch |
| crypto.getRandomValues | ✅ Basic | Math.random (not cryptographically secure) |
| crypto.randomUUID | ✅ Full | UUID v4 |
| crypto.subtle | ⚠️ Stub | Returns empty buffers |
| structuredClone | ✅ Basic | @ungap/structured-clone with Blob/File wrapper |
| navigator | ✅ Stub | userAgent, platform |
| Symbol.dispose / asyncDispose | ✅ Full | Symbol.for polyfill |

### Node.js globals (ModuleBootstrap)

| Global | Status |
|--------|--------|
| global / self | ✅ Alias for globalThis |
| performance | ✅ now(), timeOrigin |
| URL / URLSearchParams | ✅ Full parser |
| TextEncoder / TextDecoder | ✅ UTF-8 |
| atob / btoa | ✅ Base64 |
| AbortController / AbortSignal | ✅ Full |
| DOMException | ✅ Basic |
| console | ✅ Full (→ output stream) |
| process | ✅ Extended (argv, env, cwd, exit, stdin, stdout, stderr, on/emit, execArgv, hrtime, etc.) |
| queueMicrotask | ✅ Promise-based |
| setTimeout / setInterval / setImmediate | ✅ NIO EventLoop-backed |
| fetch / Headers / Request / Response | ✅ URLSession-backed |
| Buffer | ✅ Uint8Array-based |
| require() | ✅ Built-ins + plain `node_modules` CommonJS loader |

### Node.js modules (require)

| Module | Status | Notes |
|--------|--------|-------|
| node:path | ✅ Implemented | Full POSIX path API |
| node:buffer | ✅ Implemented | Uint8Array-based Buffer |
| node:url | ✅ Implemented | URL/URLSearchParams |
| node:util | ✅ Implemented | format, promisify, debuglog, types |
| node:os | ✅ Implemented | ProcessInfo-backed (homedir, platform, tmpdir) |
| node:fs | ✅ Implemented | FileManager-backed (sync: readFile, writeFile, exists, stat, lstat, mkdir, readdir, unlink, rename, realpath, access, chmod, copyFile; promises: readFile, writeFile, stat, lstat, access, mkdir, readdir, unlink, rename, realpath, chmod, rm, copyFile, open) |
| node:crypto | ✅ Implemented | CryptoKit (SHA-256/512, HMAC, randomBytes, randomUUID) |
| node:http / node:https | ✅ Implemented | URLSession-backed fetch + http.request |
| node:stream | ✅ Implemented | Readable, Writable, Transform, Duplex, EventEmitter |
| node:events | ✅ Implemented | EventEmitter (constructor, supports extends) |
| node:timers | ✅ Implemented | NIO EventLoop-backed |
| node:timers/promises | ✅ Implemented | Promise-wrapped timers |
| node:module | ✅ Basic | createRequire + builtinModules + _resolveFilename for CommonJS packages |
| node:process | ✅ Implemented | Full process object |
| node:async_hooks | ⚠️ Partial | AsyncLocalStorage with run/getStore only |
| node:readline | ✅ Basic | createInterface, question, line events, async iterator |
| node:tty | ✅ Basic | non-TTY ReadStream/WriteStream shape |
| node:assert | ✅ Basic | ok/equality/deepEqual/throws/rejects/ifError |
| node:child_process | ⚠️ Stub | **Throws — not available on iOS** |
| node:net | ⚠️ Stub | **Throws — TCP not implemented** |
| node:tls | ⚠️ Stub | Throws |
| node:zlib | ⚠️ Stub | Throws |
| node:dns | ⚠️ Stub | Throws |
| node:http2 | ⚠️ Stub | Throws |
| node:v8 | ⚠️ Stub | No-op |
| node:inspector | ⚠️ Stub | No-op |
| node:worker_threads | ⚠️ Stub | Throws |
| node:diagnostics_channel | ✅ Basic | channel subscribe/publish/unsubscribe |
| node:perf_hooks | ✅ Basic | performance export + PerformanceObserver shape |
| node:stream/consumers | ✅ Implemented | buffer/text/json/arrayBuffer |
| node:stream/promises | ✅ Implemented | pipeline, finished |
| path/posix | ✅ Implemented | Alias of path POSIX implementation |
| path/win32 | ⚠️ Stub | Not applicable on iOS/macOS |

### Known limitations

- `process.exit()` throws a frozen sentinel object to unwind the JS stack. If JS code catches this, the exit may be suppressed.
- `node:child_process` is stubbed (throws) — subprocess execution is not available on iOS.
- `node:net` / `node:tls` are stubbed — raw TCP/TLS connections not implemented.
- `crypto.getRandomValues` uses `Math.random()`, not cryptographically secure. CryptoKit-backed `node:crypto` provides secure alternatives via `require('crypto')`.
- `Bun.serve()` is not supported.
- `WebSocket` is a stub — class exists for type checks but cannot establish connections.
- `crypto.subtle` methods return empty buffers — Web Crypto API is not functionally implemented.

### Streams: stdout vs output

Two separate `AsyncStream<String>` channels:

- **`stdout`** — `process.stdout.write()` output. Application data channel (e.g. NDJSON protocol messages).
- **`output`** — `console.log/error/warn` output. Diagnostic channel with level prefixes (`[log] ...`, `[error] ...`).

### Timer bridge (NIO-backed)

`BunProcess` replaces JSCore's built-in `setTimeout`/`setInterval` with NIO `scheduleTask`:

```
JS: setTimeout(fn, 100) → ref() → eventLoop.scheduleTask → callback → unref()
```

Each pending timer/fetch/stdin listener holds a ref. When refCount drops to 0, the process exits naturally (like Node.js).

### Fetch bridge (thread-safe)

`__nativeFetch` uses `URLSession.shared.dataTask`. The completion handler marshals back to the EventLoop thread via `eventLoop.execute {}` before touching any JSValue.

### Native bridges pattern

Modules needing system APIs use `@convention(block)` closures registered on JSContext:

- **NodeFS**: `__fsReadFileSync` etc. → `FileManager`
- **NodeCrypto**: `__cryptoSHA256` etc. → `CryptoKit`
- **NodeHTTP**: `__nativeFetch` → `URLSession` (EventLoop-safe)
- **NodeOS**: `__osHostname` etc. → `ProcessInfo`
