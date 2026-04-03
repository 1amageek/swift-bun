# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

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

### Test design

**Framework**: Swift Testing (`import Testing`). All tests use `@Test` / `@Suite` macros with `async throws`.

**Lifecycle**: Every test creates a fresh `BunProcess` via `TestProcessSupport.withLoadedProcess`. This guarantees `load()` → operation → `shutdown()` (shutdown runs even on error). No state is shared between tests.

```swift
@Test("description")
func testXxx() async throws {
    try await TestProcessSupport.withLoadedProcess { process in
        let result = try await process.evaluate(js: "1 + 1")
        #expect(result.int32Value == 2)
    }
}
```

**Suite traits**: All suites use `.serialized` (no parallel BunProcess) and `.heartbeat` (hang detection via swift-testing-heartbeat).

**Test categories**:

| Category | Pattern | Example |
|----------|---------|---------|
| Edge case | Single API, one assertion per test | `CryptoEdgeCaseTests`, `BufferEdgeCaseTests` |
| Compat | Broad coverage of a module | `NodeCompatTests`, `WebAPIPolyfillTests` |
| Integration | Real bundles, HTTP server | `ClaudeBundleIntegrationTests`, `FetchRoundtripTests` |
| Async | Process mode with stdout capture | `AsyncPrimitiveTests` |
| Lifecycle | State machine unit tests | `LifecycleControllerTests` |

**Evaluation methods**:
- `process.evaluate(js:)` — synchronous JS, throws if result is a Promise
- `process.evaluateAsync(js:)` — awaits Promise resolution
- `process.run()` — process mode execution with stdout/output streams

**Assertions**: `#expect(result.stringValue == "expected")`, `#expect(result.int32Value == 42)`, `await #expect(throws: BunRuntimeError.self) { ... }`

**Helpers**: `TestProcessSupport` (core lifecycle), `LocalHTTPTestServer` (NIO-based test HTTP server), `LinesCollector` (thread-safe `Mutex<[String]>` output collector).

### Known test issues

- `BunProcessStdioTests/stdinWrite` — tests `process.stdin.write` existence, but stdin is Readable (write is a Writable method)

### Test bundle regeneration

The test bundle `Tests/BunRuntimeTests/claude.bundle.js` is a resource copied into the test target via `Package.swift`. To regenerate it from `Fixtures/claude-test/`:

```bash
cd Fixtures/claude-test && npm install
npx esbuild index.js --bundle --platform=node --target=es2020 --format=cjs \
  --external:node:* --outfile=claude.bundle.js
cp claude.bundle.js ../../Tests/BunRuntimeTests/
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

swift-bun provides a Bun-compatible JavaScript runtime for iOS/macOS by wrapping JavaScriptCore with Node.js/Bun polyfills. It uses SwiftNIO for the event loop (NIOCore + NIOPosix).

### Execution model: BunProcess

`BunProcess` is the sole execution model. Configuration is provided at `init`, execution via `load()` or `run()`.

```swift
BunProcess(bundle: URL?, arguments: [String], cwd: String?, environment: [String: String])

.load()  // Library mode — then evaluate(js:) / call()
.run()   // Process mode — blocks until exit
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
├── Lifecycle (ref/unref counting, like Node.js)
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

1. **Crypto random bridge** (`__cryptoRandomBytes`) — SecRandomCopyBytes-backed, installed before polyfills so Web Crypto can use it
2. **Web API polyfills** (`polyfills.bundle.js`) — ReadableStream, Event, Blob, crypto, etc.
3. **Node.js globals** (ModuleBootstrap.installGlobals) — global, self, performance, process, console, TextEncoder, URL, atob, AbortController, DOMException
4. **Node.js modules** (ModuleBootstrap.installModules) — path, buffer, url, util, os, fs, crypto, http, stream, timers, stubs
5. **Bun APIs** — Bun.file, Bun.env, Bun.write, etc.
6. **NIO bridges** — Timer override, Fetch override, process.exit, stdin, stdout/stderr, console → output stream
7. **Timer module patch** — Update `__nodeModules.timers` references to NIO-backed versions
8. **require()** — Installed last, reads from `__nodeModules`
9. **Configuration** — process.argv, process.cwd, process.env
10. **Bundle evaluation** — evaluateScript(source)

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
| Blob | ✅ Basic | Custom (text/arrayBuffer/stream) |
| File | ✅ Basic | Extends Blob |
| FormData | ✅ Full | Custom |
| WebSocket | ⚠️ Stub | Class exists for instanceof/extends, no actual connection |
| Worker | ⚠️ Stub | Throws on instantiation |
| MessageChannel / MessagePort | ✅ Basic | Functional postMessage |
| XMLHttpRequest | ✅ Async | fetch-backed, all responseTypes, abort support (sync mode throws) |
| crypto.getRandomValues | ✅ Full | SecRandomCopyBytes via `__cryptoRandomBytes` bridge (supports all TypedArray types) |
| crypto.randomUUID | ✅ Full | UUID v4 (backed by secure getRandomValues) |
| crypto.subtle | ⚠️ Stub | All methods throw "not supported" (no silent fallback) |
| structuredClone | ✅ Basic | @ungap/structured-clone (npm), Blob-aware |
| navigator | ✅ Stub | userAgent, platform |
| Symbol.dispose / asyncDispose | ✅ Full | Symbol.for polyfill |

### Node.js globals (ModuleBootstrap)

| Global | Status |
|--------|--------|
| global / self | ✅ Alias for globalThis |
| performance | ✅ now(), timeOrigin, mark(), measure(), getEntries/ByName/ByType(), clearMarks/Measures() |
| URL / URLSearchParams | ✅ Full parser |
| TextEncoder / TextDecoder | ✅ UTF-8 |
| atob / btoa | ✅ Base64 |
| AbortController / AbortSignal | ✅ Full |
| DOMException | ✅ Basic |
| console | ✅ Full (→ output stream, time/timeEnd/timeLog with performance.now) |
| process | ✅ Extended (argv, env, cwd, exit, stdin, stdout, stderr, on/emit, execArgv, hrtime, etc.) |
| queueMicrotask | ✅ Promise-based |
| setTimeout / setInterval / setImmediate | ✅ NIO EventLoop-backed |
| fetch / Headers / Request / Response | ✅ URLSession-backed |
| Buffer | ✅ Uint8Array-based |
| require() | ✅ __nodeModules dispatcher |

### Node.js modules (require)

| Module | Status | Notes |
|--------|--------|-------|
| node:path | ✅ Implemented | Full POSIX path API |
| node:buffer | ✅ Implemented | Uint8Array-based Buffer |
| node:url | ✅ Implemented | URL/URLSearchParams |
| node:util | ✅ Implemented | format, promisify, debuglog, types |
| node:os | ✅ Implemented | ProcessInfo-backed (homedir, platform, tmpdir, release via operatingSystemVersion, uid/gid via POSIX) |
| node:fs | ✅ Implemented | FileManager-backed (sync: readFile, writeFile, exists, stat, lstat, mkdir, readdir, unlink, rename, realpath, access, chmod, copyFile; promises: readFile, writeFile, stat, lstat, access, mkdir, readdir, unlink, rename, realpath, chmod, rm, copyFile, open). stat follows symlinks, lstat does not. chmod sets POSIX permissions. stat().mode returns actual file type prefix + posixPermissions. |
| node:crypto | ✅ Implemented | CryptoKit-backed binary hashing (SHA-256/512 accept Uint8Array), HMAC (binary key+data), SecRandomCopyBytes (randomBytes, randomInt, randomUUID) |
| node:http / node:https | ✅ Implemented | URLSession-backed fetch + http.request |
| node:stream | ✅ Implemented | Readable, Writable, Transform, Duplex, EventEmitter |
| node:events | ✅ Implemented | EventEmitter (constructor, supports extends) |
| node:timers | ✅ Implemented | NIO EventLoop-backed |
| node:timers/promises | ✅ Implemented | Promise-wrapped timers |
| node:module | ✅ Stub | createRequire returns globalThis.require |
| node:process | ✅ Implemented | Full process object |
| node:async_hooks | ⚠️ Partial | AsyncLocalStorage with run/getStore only |
| node:readline | ⚠️ Stub | Basic interface, no TTY |
| node:tty | ⚠️ Stub | isatty returns false |
| node:assert | ⚠️ Stub | Basic assert/ok/strictEqual/deepStrictEqual |
| node:child_process | ⚠️ Limited | `BuiltinCommandBridge`: sync (`__cpRunSync`) and async (`__cpBuiltinStart`) paths. Keychain via `NativeKeychainBridge`, `rg --files` via native `FileManager` enumeration. No general subprocess. |
| node:net | ⚠️ Stub | **Throws — TCP not implemented** |
| node:tls | ⚠️ Stub | Throws |
| node:zlib | ✅ Partial | `deflateSync`/`inflateSync` via Apple `Compression` framework (RFC 1950 zlib). Streaming methods throw. |
| node:dns | ✅ Partial | `lookup` via `getaddrinfo`. `resolve*` methods stubbed. |
| node:http2 | ⚠️ Stub | Throws |
| node:v8 | ⚠️ Stub | No-op |
| node:inspector | ⚠️ Stub | No-op |
| node:worker_threads | ⚠️ Stub | Throws |
| node:diagnostics_channel | ⚠️ Stub | No-op channel |
| node:perf_hooks | ⚠️ Stub | performance.now only |
| node:stream/consumers | ❌ Missing | Not implemented |
| node:stream/promises | ❌ Missing | Not implemented |
| path/posix | ❌ Missing | Not implemented (path uses POSIX by default) |
| path/win32 | ❌ Missing | Not applicable on iOS/macOS |

### Known limitations

- `process.exit()` throws a frozen sentinel object to unwind the JS stack. If JS code catches this, the exit may be suppressed.
- `node:child_process` does not provide general subprocess execution. `BuiltinCommandBridge` handles Keychain (`security`) and file listing (`rg --files`) natively. Async commands go through `__cpBuiltinStart` → `__swiftBunChildProcessComplete` with lifecycle-tracked visible handles.
- `node:net` / `node:tls` are stubbed — raw TCP/TLS connections not implemented.
- `process.chdir()` throws — working directory is fixed at BunProcess init.
- `process.kill()` throws — not supported on iOS.
- `crypto.subtle` methods throw "not supported" — Web Crypto SubtleCrypto API is not implemented.
- `crypto.randomInt()` uses modulo on 4 random bytes — slight bias for non-power-of-2 ranges (~2^-32).
- `Bun.serve()` is not supported.
- `WebSocket` is a stub — class exists for type checks but cannot establish connections.
- `Bun.deepEquals()` uses JSON.stringify comparison — fails on undefined, Symbol, circular refs, Map/Set.
- `process.platform` / `process.arch` — detected at compile time via `#if os()` / `#if arch()`.
- `process.pid` / `process.ppid` / `uid` / `gid` — read at runtime from POSIX APIs.
- `os.release()` — read from `ProcessInfo.operatingSystemVersion`.
- `os.freemem()` / `os.cpus()` / `os.loadavg()` / `os.networkInterfaces()` — return approximate/stub values.
- `Buffer.write()` ignores encoding parameter (always UTF-8). `Buffer.from()` and `Buffer.toString()` support utf8/base64/hex.

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

### Fetch bridge (streaming)

`__nativeFetchStream` uses `URLSession.shared.bytes(for:)` for streaming. Response body is delivered to JS via `FetchChunkEmitter` which batches bytes into 8KB chunks (configurable via `fetchChunkSizeBytes`) with a 2ms flush delay. Headers are delivered immediately, body chunks arrive incrementally, and a `complete` event signals end-of-body. This supports SSE and streaming API responses.

### BuiltinCommandBridge (child_process)

Replaces general subprocess execution with a small set of native commands:
- **Keychain**: `security find-generic-password` / `add-generic-password` / `delete-generic-password` → `NativeKeychainBridge` → `SecItemCopyMatching` / `SecItemAdd` / `SecItemDelete` (works on iOS)
- **File listing**: `rg --files` → native `FileManager.enumerator` (async via `__cpBuiltinStart`)
- Sync path: `__cpRunSync` → `BuiltinCommandBridge.runSync`
- Async path: `__cpBuiltinStart` → `Task.detached` → `__swiftBunChildProcessComplete` callback

### BunProcess configuration

```swift
BunProcess(
    bundle: URL?,
    arguments: [String],
    cwd: String?,
    environment: [String: String],
    removedEnvironmentKeys: Set<String>,       // keys to strip from ProcessInfo.environment
    nextTickBudgetPerTurn: Int,                 // default 64
    hostCallbackBudgetPerTurn: Int              // default 256
)
```

### Native bridges pattern

Modules needing system APIs use `@convention(block)` closures registered on JSContext:

- **NodeFS**: `__fsReadFileSync`, `__fsStatSync`, `__fsLstatSync`, `__fsChmodSync` etc. → `FileManager` (stat resolves symlinks, lstat does not, chmod sets posixPermissions). Async FS operations track lifecycle via `RuntimeHandleRegistry` visible handles.
- **NodeCrypto**: `__cryptoSHA256([UInt8])`, `__cryptoSHA512([UInt8])` → `CryptoKit` (binary input), `__cryptoHMAC(String, [UInt8], [UInt8])` → `CryptoKit` HMAC, `__cryptoRandomBytes(Int)` → `SecRandomCopyBytes`
- **NodeHTTP**: `__nativeFetchStream` → `URLSession.bytes` (streaming)
- **NodeOS**: `__osHostname` etc. → `ProcessInfo`
- **Zlib**: `__zlibDeflateSync`, `__zlibInflateSync` → Apple `Compression` framework
- **DNS**: `__dnsLookup` → `getaddrinfo`
