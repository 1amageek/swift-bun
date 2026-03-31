# swift-bun

A Swift package that runs Bun-built JavaScript bundles natively on iOS and macOS via JavaScriptCore.

## Overview

swift-bun provides a Node.js/Bun compatibility layer on top of JavaScriptCore, enabling JavaScript code bundled with Bun (or esbuild) to execute on Apple platforms without embedding a full Node.js runtime.

**What it does:**
- Loads and executes ESM and CJS bundles built by Bun or esbuild
- Polyfills Node.js built-in modules (`fs`, `path`, `crypto`, `http`, `stream`, etc.)
- Bridges `fetch()` to `URLSession` for real HTTP networking
- Provides `Bun.*` API shims (`Bun.file()`, `Bun.env`, `Bun.write()`, etc.)
- Runs long-lived JS applications with a NIO EventLoop (timers, fetch, stdin)
- Separates `process.stdout.write` (application data) from `console.log` (diagnostics)

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

### Process mode: run a long-lived application

```swift
import BunRuntime

let process = BunProcess(
    bundle: cliBundle,
    arguments: ["-p", "--input-format", "stream-json"],
    cwd: "/path/to/project",
    environment: ["API_KEY": "sk-ant-..."]
)

// Read application protocol data from stdout
Task {
    for await data in process.stdout {
        let event = parseNDJSON(data)
    }
}

// Read diagnostic console output
Task {
    for await line in process.output {
        print(line) // "[log] hello", "[error] bad"
    }
}

// Run until process.exit() or all pending work completes
let exitCode = try await process.run()
```

`process.stdout.write()` in JS writes to `stdout`. `console.log/error` writes to `output`. They are separate channels — stdout carries protocol data, output carries diagnostics.

### Sending stdin input

```swift
let process = BunProcess(bundle: interactiveApp)
let task = Task { try await process.run() }

process.sendInput("user input\n".data(using: .utf8)!)
process.sendInput(nil) // EOF

let exitCode = try await task.value
```

### Library mode: load a bundle and call functions

```swift
let runtime = BunProcess(
    bundle: Bundle.main.url(forResource: "app.bundle", withExtension: "js")!
)
try await runtime.load()

let result = try await runtime.evaluate(js: "1 + 2")
print(result.int32Value) // 3

let greeting = try await runtime.call("greet", arguments: ["World"])
print(greeting.stringValue) // "Hello, World!"
```

### Bare context (no bundle)

```swift
let runtime = BunProcess()
try await runtime.load()
try await runtime.evaluate(js: "var path = require('node:path')")
let result = try await runtime.evaluate(js: "path.join('/usr', 'local')")
```

## API

```swift
public final class BunProcess: Sendable {
    // Configuration at init
    init(bundle: URL? = nil, arguments: [String] = [], cwd: String? = nil, environment: [String: String] = [:])

    // Streams (available immediately after init)
    let stdout: AsyncStream<String>   // process.stdout.write() data
    let output: AsyncStream<String>   // console.log/error diagnostics

    // Library mode
    func load() async throws
    func evaluate(js: String) async throws -> JSResult
    func call(_ function: String, arguments: [Any]) async throws -> JSResult

    // Process mode
    func run() async throws -> Int32
    func sendInput(_ data: Data?)
    func terminate(exitCode: Int32)
}
```

`load()` and `run()` are mutually exclusive on a single instance.

`process.argv` is automatically set to `["node", bundlePath, ...arguments]`.

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
| `node:timers` | NIO bridge | EventLoop-backed setTimeout/setInterval |
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
# With Bun (ESM — transformed automatically by es-module-lexer)
bun build src/index.ts --target=node --format=esm --outfile=app.bundle.js

# With esbuild (CJS — no transformation needed)
npx esbuild src/index.ts --bundle --platform=node --format=cjs \
  --external:node:* --outfile=app.bundle.js
```

Both ESM and CJS bundles are supported. ESM bundles are automatically transformed to CJS before evaluation using es-module-lexer (WASM).

## Architecture

```
┌──────────────────────────────────────────────┐
│               Your Swift App                 │
│                                              │
│   BunProcess(bundle:arguments:cwd:env:)      │
│     .run()  → Int32      (process mode)      │
│     .load() → evaluate() (library mode)      │
│     .stdout → AsyncStream (protocol data)    │
│     .output → AsyncStream (console logs)     │
│     .sendInput(data)                         │
│        ↓                                     │
│   ┌──────────────────────────────────────┐   │
│   │     NIO EventLoop (dedicated thread)  │  │
│   │  ┌────────────────────────────────┐  │   │
│   │  │  JavaScriptCore.framework      │  │   │
│   │  │  ┌──────────────────────────┐  │  │   │
│   │  │  │  ESMResolver polyfills   │  │  │   │
│   │  │  │  • Node.js modules       │  │  │   │
│   │  │  │  • Bun API shims         │  │  │   │
│   │  │  └──────────────────────────┘  │  │   │
│   │  │  ┌──────────────────────────┐  │  │   │
│   │  │  │  NIO-backed bridges      │  │  │   │
│   │  │  │  • setTimeout → sched    │  │  │   │
│   │  │  │  • fetch → URLSession    │  │  │   │
│   │  │  │  • stdin → sendInput     │  │  │   │
│   │  │  │  • stdout.write → stdout │  │  │   │
│   │  │  │  • console → output      │  │  │   │
│   │  │  └──────────────────────────┘  │  │   │
│   │  └────────────────────────────────┘  │   │
│   └──────────────────────────────────────┘   │
└──────────────────────────────────────────────┘
```

## License

MIT
