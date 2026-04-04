# Polyfill Implementation Report

Date: 2026-04-04

## Summary

This report records the production-readiness polyfill work completed across Web APIs, Node compatibility layers, host-backed modules, and diagnostics.

The implementation followed a strict loop:

1. implement one feature
2. run only the focused test for that feature
3. fix failures before moving on
4. run grouped regression suites
5. run the full suite at the end

Specification sources were fixed to:

- MDN for Web APIs such as `Response.body`, `TextDecoderStream`, `TextEncoderStream`, `AbortSignal.any()`, `TextEncoder.encodeInto()`, and `SubtleCrypto`
- Node.js official documentation for `http`, `net`, `zlib`, `dns`, `v8`, `process`, `buffer`, `console`, `async_hooks`, `util`, `os`, `fs`, and `child_process`

## Implemented

### Phase 1: Streams and Crypto

- `fetch` now exposes a streaming `Response.body` backed by `ReadableStream<Uint8Array>`
- `Response.text()`, `json()`, `arrayBuffer()`, and `blob()` consume stream-backed bodies
- `TextDecoderStream` and `TextEncoderStream` were added
- `AbortSignal.any()` was added
- `crypto.subtle` now implements:
  - `digest`
  - `importKey`
  - `exportKey`
  - `generateKey`
  - `sign`
  - `verify`
  - `encrypt`
  - `decrypt`
  - `deriveBits`
  - `deriveKey`
  - `wrapKey`
  - `unwrapKey`
- supported subtle algorithms currently cover the common JWT/OAuth paths:
  - `SHA-1`
  - `SHA-256`, `SHA-384`, `SHA-512`
  - `HMAC`
  - `AES-GCM`
  - `PBKDF2`
  - `HKDF`
  - `RSASSA-PKCS1-v1_5`
  - `RSA-PSS`
  - `ECDSA`

### Phase 2: Node compatibility gaps

- `fs.rm` callback form
- `fs.watchFile` / `unwatchFile` with polling semantics
- `AsyncResource.bind`, `runInAsyncScope`, `emitDestroy`
- `util.isDeepStrictEqual`
- `os.version`
- `Buffer.allocUnsafeSlow`
- integer, float, and double `Buffer` read/write helpers
- `console.table`, `group`, `groupEnd`, `count`, `countReset`
- EventTarget / AbortSignal support in `events` helpers
- `TextEncoder.encodeInto`
- additional `TextDecoder` encodings:
  - `utf-16le`
  - `utf-16be`
  - `windows-1252`

### Phase 3: Host-backed APIs

- `http.createServer`
- `net.createServer`, `connect`, `createConnection`
- `zlib` sync, callback, promise, and transform APIs for gzip/deflate/inflate/raw/unzip/brotli
- `crypto.createPrivateKey`
- `child_process` now exposes only a narrow compatibility surface:
  - `ChildProcess` identity
  - builtin native-command bridges for specific host capabilities

### Phase 4: Diagnostics and edge compatibility

- `v8.getHeapSpaceStatistics`
- `process._rawDebug`
- `process._getActiveHandles`
- `dns.lookup`
- URL property setter synchronization for `href`, `search`, and `searchParams`
- `performance.markResourceTiming`

### Phase 5: Host-backed WebSocket client

- `globalThis.WebSocket` now installs from a runtime bridge instead of a stub
- the client transport is backed by `URLSessionWebSocketTask`
- supported constructor shapes currently cover:
  - `new WebSocket(url)`
  - `new WebSocket(url, protocols)`
  - `new WebSocket(url, options)`
  - `new WebSocket(url, protocols, options)`
- current option support includes:
  - `protocols`
  - `headers`
  - accepted-but-ignored `proxy`
  - accepted-but-ignored `tls`
- supported events and behaviors include:
  - `open`
  - `message` for text and binary payloads
  - `error`
  - `close`
  - `pong`
- process-mode liveness is acquired when connect starts so `run()` does not exit before the first WebSocket callback

## Before / After

| Area | Before | After |
|------|--------|-------|
| `fetch` | buffered response only | streaming `Response.body` |
| `crypto.subtle` | reject/stub behavior | digest/import/export/generate/sign/verify/encrypt/decrypt/derive/wrap subset |
| `node:net` | stub | plain TCP client/server |
| `node:http.createServer` | missing | minimal server implementation |
| `node:zlib` | stub | gzip/deflate/inflate/raw/unzip/brotli sync + callback + promise + transform APIs |
| `node:dns` | stub | `lookup` |
| `node:v8` | no-op | heap stats shape |
| `child_process` | mostly stub | limited native-command bridges + `ChildProcess` identity |
| `WebSocket` | stub | client runtime backed by `URLSessionWebSocketTask` |
| URL mutation | setters did not fully recompute | setters keep `href` and `searchParams` in sync |

## Platform notes

- `child_process` does not provide general subprocess execution on any platform; required host capabilities must be bridged natively
- `node:net` and `http.createServer` are implemented for plain local TCP/HTTP use cases
- `globalThis.WebSocket` is implemented for client connections; server-side WebSocket APIs, `node:tls`, `node:http2`, `Worker`, and native addons remain unsupported
- `crypto.getRandomValues` still uses a non-cryptographic fallback; security-sensitive code should use `require('node:crypto')` or `crypto.subtle`

## Test coverage added

Focused tests were added or expanded in:

- `Tests/BunRuntimeTests/WebAPIPolyfillTests.swift`
- `Tests/BunRuntimeTests/WebSocketE2ETests.swift`
- `Tests/BunRuntimeTests/FetchRoundtripTests.swift`
- `Tests/BunRuntimeTests/TextCodecEdgeCaseTests.swift`
- `Tests/BunRuntimeTests/CryptoEdgeCaseTests.swift`
- `Tests/BunRuntimeTests/CryptoZlibE2ETests.swift`
- `Tests/BunRuntimeTests/NodeCompatFSTests.swift`
- `Tests/BunRuntimeTests/AsyncLocalStorageTests.swift`
- `Tests/BunRuntimeTests/NodeCompatBasicTests.swift`
- `Tests/BunRuntimeTests/NodeCompatProcessTests.swift`
- `Tests/BunRuntimeTests/NodeCompatModuleTests.swift`
- `Tests/BunRuntimeTests/BufferEdgeCaseTests.swift`
- `Tests/BunRuntimeTests/URLEdgeCaseTests.swift`

Focused execution covered:

- streaming fetch
- SSE-like incremental reads
- `pipeThrough(new TextDecoderStream())`
- `AbortSignal.any()`
- JWT-relevant HMAC and key import paths
- PBKDF2/HKDF derive and wrap/unwrap paths
- `fs.watchFile`
- callback `fs.rm`
- `AsyncResource.*`
- `Buffer` typed reads and writes
- `console` formatting helpers
- EventTarget compatibility in `events`
- `http.createServer`
- `net` loopback
- WebSocket open/message/close/error/ping coverage
- WebSocket `run()`-mode end-to-end coverage, including CLI-style options and natural exit
- `zlib` sync/callback/promise/transform coverage, including Brotli
- `crypto.createPrivateKey`
- `dns.lookup`
- URL setters
- `performance.markResourceTiming`

## Remaining limitations

- `crypto.subtle` is still a subset, not the full Web Crypto surface
- `globalThis.WebSocket` is client-only; `proxy` and custom `tls` options are currently accepted and ignored
- `node:dns` currently exposes `lookup` only
- `node:tls` remains unsupported
- `node:http.createServer` is intentionally minimal and not a full Node server implementation
- `node:net` is intentionally minimal and focused on plain TCP

## Residual risks

- URLSession streaming behavior differs from a browser fetch stack in some edge timing cases
- `node:http` and `node:net` are compatibility layers, not full Node core reimplementations
- `crypto.createPrivateKey` and `crypto.subtle.importKey` intentionally reject unsupported formats and algorithms instead of trying to guess
