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

## Architecture

swift-bun provides a Bun-compatible JavaScript runtime for iOS/macOS by wrapping JavaScriptCore with Node.js/Bun polyfills. It uses SwiftNIO for the event loop (NIOCore + NIOPosix).

### Execution model: BunProcess

`BunProcess` is the sole execution model. Configuration is provided at `init`, execution via `load()` or `run()`.

```swift
// All configuration at init
BunProcess(bundle: URL?, arguments: [String], cwd: String?, environment: [String: String])

// Two modes (mutually exclusive per instance):
.load()  // Library mode — then evaluate(js:) / call()
.run()   // Process mode — blocks until exit
```

All JSContext access is serialized on a dedicated NIO EventLoop thread, guaranteeing thread safety. `preconditionInEventLoop()` guards every access point.

```
BunProcess (final class, Sendable)
├── Configuration (immutable): bundle, arguments, cwd, environment
├── EventLoop thread (NIO MultiThreadedEventLoopGroup, 1 thread)
│   ├── JSContext (all access pinned to this thread)
│   ├── ESMResolver polyfills (require, Node.js modules, Bun APIs)
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

### Streams: stdout vs output

Two separate `AsyncStream<String>` channels, available immediately after init:

- **`stdout`** — `process.stdout.write()` output. Application data channel (e.g. NDJSON protocol messages). Consumed by the caller to parse protocol data.
- **`output`** — `console.log/error/warn` output. Diagnostic channel with level prefixes (`[log] ...`, `[error] ...`). For debugging/logging.

These are intentionally separate: `process.stdout.write()` is the protocol data pipe, `console.log()` is diagnostics. Mixing them would break protocol parsers.

### process.argv and process.cwd

`init(bundle:arguments:cwd:)` configures `process.argv` and `process.cwd()` before bundle evaluation:

```
process.argv = ["node", bundlePath, ...arguments]
process.cwd = function() { return cwd; }
```

The caller passes only the user arguments (e.g. `["-p", "--input-format", "stream-json"]`). BunProcess prepends `["node", bundlePath]` to match Node.js conventions.

### ESM transformation

Bundles built with `bun build --format=esm` contain ESM syntax (`import`/`export`/`import.meta`) that JSCore's `evaluateScript()` cannot parse. Before evaluation, `ESMTransformer` converts ESM to CJS:

```
ESMTransformer.transform(source, bundleURL:)
  → temporary JSContext
  → atob polyfill (for WASM base64)
  → esm-transformer.bundle.js (es-module-lexer + transform logic)
  → es-module-lexer.initSync() (synchronous WASM compilation)
  → __transformESM(source, url)
  → CJS-equivalent source
```

es-module-lexer provides exact positions of all imports/exports, correctly handling strings, comments, regex, and template literals. JS parses JS — no false positives.

### ESMResolver module installation order

Order matters — later modules depend on earlier ones:

1. **Globals**: `performance`, `URL`, `URLSearchParams`, `console`, `process`, `TextEncoder`/`TextDecoder`, `atob`/`btoa`, `AbortController`
2. **Node modules**: Path → Buffer → URL → Util → OS → FS → Crypto → HTTP → Stream → Timers → Stubs
3. **Bun APIs**: Shims → Env → File → Spawn
4. **NIO bridges**: Console → stdout → Timer override → Fetch override → process.exit → stdin → timer module patch
5. **`require()`**: Installed last — reads from `globalThis.__nodeModules` populated by steps 2-3
6. **Configuration**: process.argv, process.cwd, process.env
7. **Bundle evaluation**: evaluateScript(source)

### Timer bridge (NIO-backed)

`BunProcess` replaces JSCore's built-in `setTimeout`/`setInterval` with NIO `scheduleTask`:

```
JS: setTimeout(fn, 100)
  → __nativeSetTimeout(fn, 100, args)
  → ref() (refCount++)
  → eventLoop.scheduleTask(in: .milliseconds(100)) {
      callback.call(withArguments: args)
      unref() (refCount--)
    }
```

Each pending timer/fetch holds a ref. When refCount drops to 0, the process exits naturally (like Node.js).

### Fetch bridge (thread-safe)

`__nativeFetch` uses `URLSession.shared.dataTask`. The completion handler marshals back to the EventLoop thread via `eventLoop.execute {}` before touching any JSValue:

```
JS: fetch(url) → Promise
  → __nativeFetch(url, options, resolve, reject)
  → ref()
  → URLSession.dataTask { data, response, error in
      eventLoop.execute {  // ← back on EventLoop thread
          resolve.call(withArguments: [...])
          unref()
      }
    }
```

### Native bridges pattern

Modules needing system APIs use `@convention(block)` closures registered on JSContext:

- **NodeFS**: `__fsReadFileSync` etc. → `FileManager` — returns `{value: ...}` or `{error: "ENOENT: ..."}`
- **NodeCrypto**: `__cryptoSHA256` etc. → `CryptoKit`
- **NodeHTTP**: `__nativeFetch` → `URLSession` (EventLoop-safe)
- **NodeOS**: `__osHostname` etc. → `ProcessInfo`

### Known limitations

- `process.exit()` throws a frozen sentinel object to unwind the JS stack. If JS code catches this, the exit may be suppressed.
- `node:child_process` is stubbed (throws) — not available on iOS.
- `Bun.serve()` is not supported.
