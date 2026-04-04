# Runtime Architecture

`swift-bun` uses a three-layer runtime model.

## Layer ownership

### Layer 0: Web/Bun JS Polyfills
- Source of truth: `Fixtures/polyfills/index.js`
- Generated bundle: `Sources/BunRuntime/Resources/polyfills.bundle.js`
- Owns Web API surface and JS object identity
- Some host-coupled Web APIs are installed later from runtime-owned JS helpers after native bridges exist
- Owns:
  - `ReadableStream`, `WritableStream`, `TransformStream`
  - `fetch`, `Headers`, `Request`, `Response`
  - `TextDecoderStream`, `TextEncoderStream`
  - `queueMicrotask`
  - `process.stdin`, `process.stdout`, `process.stderr`
  - `globalThis.WebSocket` JS object semantics

Layer 0 defines JS semantics. It may call narrow native bridges such as `__nativeFetchStream`, `__nativeStdoutWrite`, `__stdinRef`, and `__stdinUnref`, but it does not own transport.

Layer 0 prefers community JS polyfills when they are compatible with JavaScriptCore and the pre-`require()` bootstrap phase. Incompatible packages are replaced with local thin adapters. Current examples:
- package-backed: `web-streams-polyfill`, `@ungap/structured-clone`, `js-yaml`, `picomatch`, `semver`
- local thin adapters: `Blob`, `File`, `FormData`, `XMLHttpRequest`, stdio stream objects, runtime-installed `WebSocketBridge`

### Layer 1: Node/Bun Module Surface
- Source of truth: `ModuleBootstrap` and `NodeCompat/*`
- Owns `require('node:*')` / `require('bun:*')` export shapes
- Owns plain `node_modules` CommonJS package resolution
- Composes Layer 0 APIs into Node/Bun modules
- Must not redefine Web APIs already owned by Layer 0

`ModuleBootstrap` is an orchestrator, not the source of truth for every step itself. Its internal phases are split into:
- `ModuleGlobalBootstrap`
- `BuiltinModuleBootstrap`
- `RequireBootstrap`

The current package-loading target is deliberately narrow:
- plain `node_modules` layout
- CommonJS packages
- `package.json.main`, `.js`, `.json`, `index.js`, and `index.json`

The architecture does not currently promise support for:
- `exports` / `imports`
- `.mjs` / `.cjs` mode distinctions
- native addons
- package-manager-specific install layouts

Examples:
- `node:http` composes `fetch` and stream constructors from Layer 0
- `node:http.createServer` and `node:net` expose JS server/socket objects while delegating transport to Layer 2
- `node:stream` re-exports Layer 0 stream constructors and adds `stream/promises` / `stream/consumers`
- `require()` resolves built-ins first, then installed CommonJS packages from plain `node_modules`
- process-mode entry scripts are executed as the CommonJS main module
- `globalThis.WebSocket` is installed from `Runtime/WebSocketBridge.js`, not from `ModuleBootstrap`

### Layer 2: Runtime Host Layer
- Source of truth: Swift runtime components
- Owns:
  - JS thread execution
  - host callback scheduling
  - lifecycle and shutdown
  - timer, filesystem, network, stdin/stdout transport
  - streaming fetch delivery, WebSocket transport, Web Crypto, DNS lookup, compression, TCP/HTTP server bridges

Layer 2 must not own JS API semantics such as `fetch`, `Headers`, `Request`, `Response`, or stream method behavior.

## Ownership rules

- A given API concept is owned by exactly one layer.
- Layer 0 owns JS object creation for stdio streams.
- Layer 1 owns module wiring only.
- Layer 2 exposes only narrow `__native*` hooks into JS.
- Host-backed globals that require bridge-first installation, such as `globalThis.WebSocket`, are installed by runtime JS helpers while Swift remains the source of truth for transport and lifecycle.
- `ModuleBootstrap.installGlobals` must not recreate `process.stdin/stdout/stderr`, `queueMicrotask`, or `fetch`.
- `NodeHTTP` must not redefine `fetch`, `Headers`, `Request`, or `Response`.
- `NodeStream` must not provide an independent fallback stream implementation.

## JavaScript source placement

Not every `context.evaluateScript(...)` block should be treated the same way. This project distinguishes between JavaScript implementation code and JavaScript bootstrapping glue.

The concrete loading design and directory conventions are defined in `Docs/JavaScriptLoading.md`.

### Move JS into resource files

Use standalone `.js` resources when the code is the source of truth for behavior and benefits from normal JavaScript tooling.

- Node/Bun module implementations such as `node:fs`, `node:http`, or `Bun.file`
- code with non-trivial control flow, helper functions, error handling, or state
- code that should be linted, syntax-checked, stepped through, or debugged as JavaScript
- code reused across multiple call sites or large enough that keeping it inline would hide the module's real behavior

These files live under `Sources/BunRuntime/Resources/JavaScript/...` and are loaded through `JavaScriptResource` using a typed registry:

- `.bootstrap(...)`
- `.bunAPI(...)`
- `.nodeCompat(...)`
- `.runtime(...)`
- `.bundle(...)`

This gives one place for path mapping, `withSourceURL:` evaluation, and `BunRuntimeError` conversion.

### Keep JS inline in Swift

Keep short inline `evaluateScript(...)` snippets only when they are bootstrap glue that is tightly coupled to Swift-side setup.

- aliasing or exposing already-constructed objects such as `Bun.env = process.env`
- one-shot runtime patches that depend directly on Swift-registered bridge names
- small configuration writes where Swift is injecting runtime values into the JS context
- ordering-sensitive boot code that is clearer when it stays next to the Swift setup that owns it

The shared config object key is `globalThis.__swiftBunConfig`. Current namespaces include:
- `globalThis.__swiftBunConfig.process`
- `globalThis.__swiftBunConfig.os`

### Rule of thumb

- Swift owns bridge registration, host data collection, and startup ordering.
- JavaScript resource files own reusable behavior and module semantics.
- If an inline snippet grows into logic you would want ESLint, syntax highlighting, or JS breakpoints for, move it out of Swift.
- If a snippet is only exposing Swift-prepared state into JS and would become harder to understand when separated, keep it inline.

## Lifecycle model

Lifecycle is separate from Node/Bun API compatibility.

### Public execution contract
- `load()` enters library mode.
- Library mode does not naturally exit.
- A successful `load()` must be paired with `shutdown()`.
- `run()` enters process mode and always performs shutdown before it returns.
- Tests and helper utilities must treat `shutdown()` as mandatory cleanup, not optional best effort.

### Entry script semantics

- `load()` keeps the existing library-style behavior: if a bundle URL is provided, the transformed source is evaluated directly into the global context.
- `run()` uses process mode semantics: the entry script is executed through the CommonJS loader as `require.main`.
- As a result, `run()` entry scripts can rely on `module`, `exports`, `require.main`, `__filename`, and `__dirname`.
- `load()` is intentionally different so that existing library-mode tests and REPL-style evaluation can continue to see bundle-defined globals.

### States
- `idle`
- `booting`
- `running`
- `exitRequested`
- `shuttingDown`
- `exited`

### Liveness domains
- `visibleHandles`
  - user-visible keep-alive state such as ref'ed timers, in-flight fetches, and ref'ed stdin
- `pendingHostCallbacks`
  - native completions not yet processed on the JS thread
- `bootBarriers`
  - startup responsibilities that must finish before natural exit is allowed
- `schedulerSnapshot`
  - host queue count, nextTick queue count, and JS turn activity

### Exit semantics

Natural exit is evaluated only in process mode and only while state is `running`.

Natural exit is allowed when all of the following are true:
- `bootBarriers == 0`
- `visibleHandles == 0`
- `pendingHostCallbacks == 0`
- `hostQueueCount == 0`
- `nextTickQueueCount == 0`
- `jsTurnActive == false`
- no explicit exit has been requested

`process.exit()` has priority over natural-exit checks.

`load()` uses library mode and never naturally exits.

### Shutdown semantics
- `shutdown()` is explicit and idempotent from the caller's perspective.
- `shutdown()` transitions the runtime into `shuttingDown`, rejects pending async waits, deactivates scheduler/native runtime, clears the JS context, finishes `stdout`/`output`, and then marks the lifecycle `exited`.
- Dropping a loaded `BunProcess` without `shutdown()` is a lifecycle bug. The runtime may log the misuse, but callers must not rely on deinit for cleanup.
