# Release Readiness: 0.1.0

This document records the intended scope and verification status for the `0.1.0` release.

## Positioning

`0.1.0` is an experimental public release of `swift-bun`.

It is suitable for:

- evaluating the runtime architecture
- running selected Bun-built or esbuild-built bundles on iOS and macOS
- local and embedded compatibility workflows that fit the documented subset

It is not positioned as full Bun or Node parity.

## Verification method

Release verification for `0.1.0` is defined by:

- [`scripts/release-check-0.1.0.sh`](/Users/1amageek/Desktop/swift-bun/scripts/release-check-0.1.0.sh)

The release check intentionally does **not** use one broad `swift test --skip-build` invocation as the gate.

Reason:

- `BunProcess`-backed tests are not reliable when broad suite filters cause many runtime-heavy suites to start together.
- Swift Testing only serializes within a suite, not across suites.
- `0.1.0` verification therefore uses sequential bounded runs with stale-helper cleanup between invocations.

The release script performs:

- deinit shutdown guard: `scripts/check-sync-shutdown-in-deinit.sh Sources Tests`
- bounded build: `scripts/swift-test-timeout.sh 120 --build`
- sequential runtime suite checks
- `BunProcessStdinTests` suite check
- compatibility suite checks
- representative CLI streaming and managed-home checks

## Verified areas

The release script covers:

- `BunProcess` lifecycle, library mode, async scheduling, timers, stdio, echo-delay, and selected package loading
- `process.stdin` keep-alive and buffering behavior through the `BunProcessStdinTests` regression suite
- WebSocket client behavior and `run()`-mode liveness
- `crypto.subtle` digest, key import/export, HMAC, AES-GCM, PBKDF2, HKDF, RSA PKCS#1 v1.5, RSA-PSS, ECDSA, derive, and wrap/unwrap flows
- `node:zlib` gzip/deflate/inflate/raw/unzip/brotli sync, callback, promise, and transform APIs
- JS resource loading and runtime-script registration
- representative CLI message-loop initialization under isolated HOME, empty changelog cache, and managed ClaudeStand home

## Scope statements for 0.1.0

Supported and tested:

- `BunProcess` library mode and process mode
- plain CommonJS package loading from a normal `node_modules` tree
- Web API polyfills documented in `README.md`
- Node compatibility modules documented in `README.md`

Explicitly out of scope:

- `Bun.serve()`
- `node:tls`
- `node:http2`
- general `node:child_process` subprocess execution
- `Worker`
- native addons
- full Web Crypto parity
- full Node zlib parity

## Release checklist

- docs match tested behavior
- generated `polyfills.bundle.js` matches `Fixtures/polyfills/index.js`
- `scripts/release-check-0.1.0.sh` is green
- release notes or changelog clearly state the compatibility subset
