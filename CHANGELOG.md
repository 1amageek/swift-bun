# Changelog

## 0.1.0

Initial public release of `swift-bun` as an experimental Bun/Node compatibility runtime for iOS and macOS.

Highlights:

- `BunProcess` execution model for process mode and library mode
- CommonJS loading from plain `node_modules`
- Web API polyfills for streams, `fetch`, `Blob`, `FormData`, `XMLHttpRequest`, and `structuredClone`
- Host-backed client `WebSocket` support with `run()`-mode end-to-end coverage
- Node compatibility coverage for `fs`, `path`, `buffer`, `url`, `util`, `os`, `http`, `stream`, `events`, `timers`, `dns.lookup`, and plain TCP `net`
- Expanded `crypto.subtle` support for:
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
- `node:zlib` coverage for gzip/deflate/inflate/raw/unzip/brotli across sync, callback, promise, and transform APIs

Boundaries for 0.1.0:

- experimental compatibility release, not full Bun or Node parity
- `Bun.serve()` is not supported
- `node:tls` and `node:http2` are not supported
- `node:child_process` does not provide general subprocess execution
- `Worker` and native addons are not supported
- `crypto.getRandomValues` is still a non-cryptographic fallback
- `crypto.subtle` remains a subset of the full Web Crypto surface
- `node:dns` currently exposes `lookup` only
