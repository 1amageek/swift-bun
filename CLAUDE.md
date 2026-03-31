# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build & Test

```bash
# Build
swift build

# Run all tests (with timeout)
swift test

# Run a specific test suite
swift test --filter "FetchRoundtrip"

# Run a single test by name
swift test --filter "getRequest"
```

Network roundtrip tests (`FetchRoundtripTests`) hit `httpbin.org` and require internet access.

The test bundle `Tests/BunRuntimeTests/claude.bundle.js` is a resource copied into the test target via `Package.swift`. To regenerate it from `Fixtures/claude-test/`:

```bash
cd Fixtures/claude-test && npm install
npx esbuild index.js --bundle --platform=node --target=es2020 --format=cjs \
  --external:node:* --outfile=claude.bundle.js
cp claude.bundle.js ../../Tests/BunRuntimeTests/
```

## Architecture

swift-bun provides a Bun-compatible JavaScript runtime for iOS/macOS by wrapping JavaScriptCore with Node.js/Bun polyfills. There are no external Swift dependencies — only system frameworks (JavaScriptCore, Foundation, CryptoKit).

### Execution flow

```
BunRuntime.load(bundle:)
  → JSContext()
  → ESMResolver.install()        # injects all polyfills + require()
  → BunContext(jsContext:)        # wraps JSContext in an actor
  → evaluateScript(bundleSource)  # runs the user's Bun-built bundle
```

### Key design: Actor + JSResult bridge

`JSContext` and `JSValue` are not `Sendable`. They are isolated inside `BunContext` (actor). The public API returns `JSResult` (a `Sendable` enum) instead of `JSValue` — all conversion happens inside the actor boundary before returning.

### Key design: Promise bridging

`evaluateAsync(js:)` detects if the JS result is a `Promise`, then calls `.then(onResolve, onReject)` with `@convention(block)` callbacks that resume a `withCheckedThrowingContinuation`. This is the mechanism that makes `fetch()` → URLSession roundtrips awaitable from Swift.

### Key design: fetch → URLSession

`NodeHTTP.install()` registers `__nativeFetch` as a `@convention(block)` closure that creates a `URLSession.shared.dataTask`. The JS-side `fetch()` function serializes options to JSON, calls `__nativeFetch`, and wraps the callback result in a `Response` polyfill object. The URLSession completion handler calls back into JSContext (which is thread-safe per Apple docs), resolving the Promise.

### ESMResolver module installation order

Order matters — later modules depend on earlier ones:

1. **Globals**: `performance`, `URL`, `URLSearchParams`, `console`, `process`, `TextEncoder`/`TextDecoder`, `atob`/`btoa`, `AbortController`
2. **Node modules**: Path → Buffer → URL → Util → OS → FS → Crypto → HTTP → Stream → Timers → Stubs
3. **Bun APIs**: Shims → Env → File → Spawn (File depends on FS native bridges)
4. **`require()`**: Installed last — reads from `globalThis.__nodeModules` populated by steps 2-3

### Native bridges pattern

Modules needing system APIs use `@convention(block)` closures registered on JSContext:

- **NodeFS**: `__fsReadFileSync` etc. → `FileManager` — returns `[String: Any]` with either `value` or `error` key
- **NodeCrypto**: `__cryptoSHA256` etc. → `CryptoKit`
- **NodeHTTP**: `__nativeFetch` → `URLSession`
- **NodeOS**: `__osHostname` etc. → `ProcessInfo`

The FS bridge returns structured results (`{value: ...}` or `{error: "ENOENT: ..."}`) rather than nil/bool, so JS-side error messages preserve the actual error code from Swift.

### Event stream

`BunContext` exposes an `AsyncStream<String>` via `eventStream`. JS code calls `globalThis.__emitEvent(string)` to push NDJSON lines. The stream **must** be terminated by calling `context.shutdown()` or `for await` loops will hang.
