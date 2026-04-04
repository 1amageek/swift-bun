# JavaScript Loading Design

This document defines how JavaScript source files are loaded into `JSContext` and how that loading is standardized across the runtime.

## Goals

- make JavaScript source debuggable with a real source URL
- make the source of truth obvious for each Node/Bun module
- avoid ad-hoc `context.evaluateScript("""...""")` blocks spread across Swift files
- preserve a clear boundary between Swift-owned runtime setup and JS-owned behavior

## Non-goals

- replacing every inline `evaluateScript(...)` call
- moving dynamically generated one-line configuration writes into resource files
- introducing a general-purpose ESM loader or package manager inside JavaScriptCore

## Source categories

There are three categories of JavaScript in this repository.

### 1. Resource-backed implementation scripts

These are the default for any meaningful JS behavior.

Examples:
- `node:fs`
- `node:http`
- `node:stream`
- `node:path`
- `node:buffer`
- `Bun.file`
- `Runtime/WebSocketBridge.js`
- `Bun` shims with non-trivial logic

Rules:
- stored as `.js` files under `Sources/BunRuntime/Resources/JavaScript/...`
- loaded through a single Swift helper
- evaluated with `withSourceURL:` so the script has a stable filename in stack traces and debugging
- must not depend on Swift string interpolation

### 2. Inline bootstrap glue

These remain in Swift.

Examples:
- `Bun.env = process.env`
- writing `process.argv`
- installing tiny one-shot patches around a Swift bridge name

Rules:
- must stay short
- must be directly coupled to nearby Swift setup
- must not accumulate module semantics or reusable helper logic

### 3. Generated bundles

These are build artifacts or vendored bundles, not hand-authored module sources.

Examples:
- `polyfills.bundle.js`
- `esm-transformer.bundle.js`

Rules:
- loaded as resources
- not mixed with handwritten module files
- regenerated from their source directories

## Directory layout

Use this layout for handwritten scripts:

```text
Sources/BunRuntime/Resources/JavaScript/
  Bootstrap/
  BunAPI/
  NodeCompat/
  Runtime/
```

Meaning:
- `Bootstrap/`: reusable startup scripts that install globals or shared runtime helpers
- `BunAPI/`: `Bun.*` API implementations
- `NodeCompat/`: `node:*` module implementations
- `Runtime/`: runtime coordination scripts owned by `BunProcess`, such as async bridging, timer patch helpers, or host-backed adapters like `WebSocketBridge`

Do not place generated bundles in this tree.

## Loader contract

All resource-backed scripts are loaded through `JavaScriptResource`.

Current API:

```swift
enum JavaScriptResource {
    enum Script {
        case bootstrap(BootstrapScript)
        case bunAPI(BunAPIScript)
        case nodeCompat(NodeCompatScript)
        case runtime(RuntimeScript)
        case bundle(BundleScript)
    }

    static func source(for script: Script) throws -> (url: URL, source: String)
    static func evaluate(_ script: Script, in context: JSContext) throws
}
```

The nested enums are the typed registry for all handwritten scripts and generated bundles.

Benefits:
- no stringly-typed filenames at call sites
- compile-time discoverability of what scripts exist
- one place to define path mapping
- one place to attach `withSourceURL:`
- one place to convert missing/read/evaluation failures into `BunRuntimeError`

## Loading sequence

A resource-backed script should be installed with this sequence:

1. Swift registers native bridge blocks on `JSContext`.
2. Swift writes any runtime configuration objects needed by the script.
3. Swift evaluates the static `.js` resource.
4. Swift checks `context.exception` and converts failures into runtime errors.

Generated bundles use the same entry point:

```swift
try JavaScriptResource.evaluate(.bundle(.polyfills), in: context)

let (url, source) = try JavaScriptResource.source(for: .bundle(.esmTransformer))
context.evaluateScript(source, withSourceURL: url)
```

The `.js` file should own behavior. Swift should only provide inputs.

At runtime, `ModuleBootstrap` orchestrates that setup in three explicit phases:
- `ModuleGlobalBootstrap`
- `BuiltinModuleBootstrap`
- `RequireBootstrap`

This split is intentional. Globals can be installed before built-in modules exist, and `require()` is exposed only after the built-in module registry and CommonJS bridge are ready.

For application bundles, the final execution path depends on runtime mode:

- `load()` evaluates the transformed bundle directly with `evaluateScript(..., withSourceURL:)`
- `run()` routes the transformed entry script through `__swiftBunModuleLoader.executeMainSource(...)`

That split is intentional. Library mode preserves global bundle definitions for follow-up `evaluate(js:)` calls, while process mode gives the entry script CommonJS main-module semantics.

## Dynamic values and configuration

Resource files should stay static. Do not build them by interpolating runtime values into Swift multi-line strings.

When a script needs runtime data:
- expose it through bridge functions such as `__osHostname`
- or write a small config object such as `globalThis.__swiftBunConfig`
- then evaluate the static resource file

Use inline JS only for the config write itself when needed.

Preferred pattern:

```swift
context.setObject(hostnameBlock, forKeyedSubscript: "__osHostname" as NSString)
context.evaluateScript("""
globalThis.__swiftBunConfig = globalThis.__swiftBunConfig || {};
globalThis.__swiftBunConfig.os = { release: "..." };
""")
try JavaScriptResource.evaluate(.nodeCompat(.os), in: context)
```

Avoid:

```swift
context.evaluateScript("""
(function() {
    var release = '\(releaseString)';
    ...
})();
""")
```

## File conventions

Each handwritten resource file should follow these conventions.

- one file installs one conceptual module or runtime helper
- the file is self-contained and executable as plain JavaScript
- the file may use an IIFE for isolation
- the file should write exports into `globalThis`, `Bun`, or `__nodeModules` as appropriate
- the file should assume required Swift bridges already exist
- the file should not reach into Swift implementation details beyond documented bridge names

## Error handling

Loading resource files is fallible runtime setup.

Current loader failures:
- `BunRuntimeError.javaScriptResourceNotFound`
- `BunRuntimeError.javaScriptResourceReadFailed`
- `BunRuntimeError.javaScriptException`

`JavaScriptResource` owns the mapping from resource lookup and `JSContext` evaluation failures into those errors. Call sites should propagate them with `throws`.

## What stays inline

Keep inline `evaluateScript(...)` only for these cases:
- tiny aliases and object exposure
- tiny configuration writes
- immediate post-install patches tightly coupled to the surrounding Swift code
- probes, diagnostics, or one-off startup wiring that would become less clear if extracted

If the snippet grows large enough that you would want ESLint, syntax highlighting, stack traces, or JS breakpoints, it has crossed into resource-backed code.

## Migration rule

When touching an existing inline JS module:
- if it contains reusable behavior or more than trivial glue, migrate it to a resource file
- if it is only setup glue, keep it inline and keep it short

Do not rewrite unrelated inline bootstrapping code just to satisfy the pattern mechanically.

## Current coverage

Resource-backed today:
- Bootstrap globals and the CommonJS `require()` loader under `Bootstrap/`
- `Bun.file`, `BunShims`, `BunSpawn` under `BunAPI/`
- `node:fs`, `node:http`, `node:stream`, `node:path`, `node:buffer`, `node:url`, `node:util`, `node:timers`, `node:crypto`, `node:os`
- split `NodeStubs` modules under `NodeCompat/`
- `BunProcess` runtime helpers under `Runtime/`
- generated bundles via `.bundle(.polyfills)` and `.bundle(.esmTransformer)`

These remain inline unless they grow:
- `BunEnv` aliasing of `process.env`
- `process.argv` assignment
- small config writes to `globalThis.__swiftBunConfig`

## CommonJS boundary

The CommonJS loader owns:
- built-in module resolution
- plain `node_modules` package resolution
- `require.resolve()`
- `module.createRequire()`
- process-mode entry script execution as the main module

Current supported package-loading scope:
- CommonJS only
- `package.json.main`
- `index.js` / `index.json`
- `.js` / `.json`
- bare specifiers and subpath specifiers from a plain `node_modules` layout

Current non-goals for the loader:
- `package.json.exports`
- `package.json.imports`
- `.mjs` / `.cjs` mode differences
- native `.node` addons
- package manager behavior such as `bun install`

Swift-owned library mode intentionally does not run its bundle through the CommonJS main-module path.
