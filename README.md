# swift-bun

A Swift package that runs Bun-built JavaScript bundles natively on iOS and macOS via JavaScriptCore.

Bun でビルドされた JS バンドルを iOS/macOS 上でネイティブ実行するための Swift ランタイムです。

## Overview

swift-bun provides a Node.js/Bun compatibility layer on top of JavaScriptCore, enabling JavaScript code bundled with Bun (or esbuild) to execute on Apple platforms without embedding a full Node.js runtime.

**What it does:**
- Loads and executes CommonJS bundles built by Bun
- Polyfills Node.js built-in modules (`fs`, `path`, `crypto`, `http`, `stream`, etc.)
- Bridges `fetch()` to `URLSession` for real HTTP networking
- Provides `Bun.*` API shims (`Bun.file()`, `Bun.env`, `Bun.write()`, etc.)
- Bridges JS Promises to Swift async/await

**What it doesn't do:**
- Bundle or transpile JavaScript (use Bun or esbuild for that)
- Provide `bun install`, `bun test`, or other CLI features

## Requirements

- iOS 26.0+ / macOS 26.0+
- Swift 6.2+
- Xcode 26.0+

## Installation

Add to your `Package.swift`:

```swift
dependencies: [
    .package(url: "https://github.com/1amageek/swift-bun.git", branch: "main"),
],
targets: [
    .target(
        name: "YourApp",
        dependencies: [
            .product(name: "BunRuntime", package: "swift-bun"),
        ]
    ),
]
```

## Usage

### Load and execute a bundle

```swift
import BunRuntime

let runtime = BunRuntime()
let context = try await runtime.load(
    bundle: Bundle.main.url(forResource: "app.bundle", withExtension: "js")!
)
```

### Evaluate JavaScript

```swift
// Synchronous evaluation
let result = try await context.evaluate(js: "1 + 2")
print(result.int32Value) // 3

// Call a global function
let greeting = try await context.call("greet", arguments: ["World"])
print(greeting.stringValue) // "Hello, World!"
```

### Async operations (fetch, Promises)

```swift
let response = try await context.evaluateAsync(js: """
    fetch('https://api.example.com/data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: 'hello' })
    }).then(res => res.json())
""")
```

`evaluateAsync` bridges JS Promises to Swift async/await via `URLSession`.

### Environment variables

```swift
try await runtime.setEnvironment([
    "API_KEY": "sk-ant-...",
], in: context)
// Accessible in JS as process.env.API_KEY and Bun.env.API_KEY
```

### Event stream

JavaScript can emit events to Swift via `__emitEvent()`:

```javascript
// In your JS bundle
__emitEvent(JSON.stringify({ type: "response", data: result }));
```

```swift
// In Swift
for await line in await context.eventStream {
    let event = try JSONDecoder().decode(Event.self, from: Data(line.utf8))
    // handle event
}
// Call context.shutdown() to terminate the stream
```

## Supported Modules

### Node.js built-in modules

| Module | Implementation | Notes |
|--------|---------------|-------|
| `node:path` | Pure JS | Full POSIX path API |
| `node:buffer` | Pure JS | Uint8Array-based Buffer |
| `node:url` | Pure JS | URL/URLSearchParams polyfill |
| `node:util` | Pure JS | format, promisify, types |
| `node:os` | Native bridge | ProcessInfo-backed |
| `node:fs` | Native bridge | FileManager-backed (sync + promises) |
| `node:crypto` | Native bridge | CryptoKit (SHA-256/512, HMAC, randomBytes) |
| `node:http/https` | Native bridge | URLSession-backed fetch + http.request |
| `node:stream` | Pure JS | Readable, Writable, Transform, EventEmitter |
| `node:timers` | Pure JS | setTimeout/setInterval wrappers |
| `node:events` | Pure JS | EventEmitter |
| `node:async_hooks` | Stub | AsyncLocalStorage with basic run/getStore |
| `node:child_process` | Stub | Throws (not available on iOS) |

### Bun APIs

| API | Status |
|-----|--------|
| `Bun.file(path)` | Supported (text, json, exists) |
| `Bun.write(path, data)` | Supported |
| `Bun.env` | Supported (alias for process.env) |
| `Bun.version` | Returns `"swift-bun-shim"` |
| `Bun.nanoseconds()` | Supported |
| `Bun.sleep(ms)` | Supported |
| `Bun.hash(data)` | Supported (djb2) |
| `Bun.escapeHTML(str)` | Supported |
| `Bun.spawn()` | Delegate pattern (throws by default) |
| `Bun.serve()` | Not supported |

### Global APIs

`fetch`, `Request`, `Response`, `Headers`, `URL`, `URLSearchParams`, `TextEncoder`, `TextDecoder`, `AbortController`, `AbortSignal`, `Buffer`, `console`, `process`, `setTimeout`, `setInterval`, `setImmediate`, `queueMicrotask`, `atob`, `btoa`

## Building a JS bundle

```bash
# With Bun
bun build src/index.ts --target=bun --outfile=app.bundle.js

# With esbuild (Bun-compatible output)
npx esbuild src/index.ts --bundle --platform=node --format=cjs \
  --external:node:* --outfile=app.bundle.js
```

The bundle should use CommonJS (`require()`) for Node.js built-in modules. swift-bun's `require()` resolves both `'path'` and `'node:path'` forms.

## Architecture

```
┌─────────────────────────────────────────┐
│              Your Swift App             │
│                                         │
│   BunRuntime.load(bundle:)              │
│        ↓                                │
│   BunContext                            │
│     evaluate(js:) → JSResult            │
│     evaluateAsync(js:) → JSResult       │
│     eventStream → AsyncStream<String>   │
│        ↓                                │
│   ┌─────────────────────────────────┐   │
│   │      JavaScriptCore.framework   │   │
│   │  ┌───────────────────────────┐  │   │
│   │  │  ESMResolver polyfills    │  │   │
│   │  │  • Node.js modules        │  │   │
│   │  │  • Bun API shims          │  │   │
│   │  │  • fetch → URLSession     │  │   │
│   │  │  • fs → FileManager       │  │   │
│   │  │  • crypto → CryptoKit     │  │   │
│   │  └───────────────────────────┘  │   │
│   └─────────────────────────────────┘   │
└─────────────────────────────────────────┘
```

## License

MIT
