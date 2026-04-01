(function() {
    var moduleCache = {};

    var modules = {
        'path': __nodeModules.path,
        'node:path': __nodeModules.path,
        'buffer': __nodeModules.buffer,
        'node:buffer': __nodeModules.buffer,
        'url': __nodeModules.url,
        'node:url': __nodeModules.url,
        'util': __nodeModules.util,
        'node:util': __nodeModules.util,
        'os': __nodeModules.os,
        'node:os': __nodeModules.os,
        'fs': __nodeModules.fs,
        'node:fs': __nodeModules.fs,
        'fs/promises': __nodeModules.fs.promises,
        'node:fs/promises': __nodeModules.fs.promises,
        'crypto': __nodeModules.crypto,
        'node:crypto': __nodeModules.crypto,
        'http': __nodeModules.http,
        'node:http': __nodeModules.http,
        'https': __nodeModules.https,
        'node:https': __nodeModules.https,
        'stream': __nodeModules.stream,
        'node:stream': __nodeModules.stream,
        'stream/web': __nodeModules.stream,
        'node:stream/web': __nodeModules.stream,
        'timers': __nodeModules.timers,
        'node:timers': __nodeModules.timers,
        'timers/promises': __nodeModules.timers.promises,
        'node:timers/promises': __nodeModules.timers.promises,
        'events': __nodeModules.events,
        'node:events': __nodeModules.events,
        'string_decoder': __nodeModules.string_decoder,
        'node:string_decoder': __nodeModules.string_decoder,
        'querystring': __nodeModules.querystring,
        'node:querystring': __nodeModules.querystring,
        'net': __nodeModules.net,
        'node:net': __nodeModules.net,
        'tls': __nodeModules.tls,
        'node:tls': __nodeModules.tls,
        'zlib': __nodeModules.zlib,
        'node:zlib': __nodeModules.zlib,
        'child_process': __nodeModules.child_process,
        'node:child_process': __nodeModules.child_process,
        'tty': __nodeModules.tty,
        'node:tty': __nodeModules.tty,
        'readline': __nodeModules.readline,
        'node:readline': __nodeModules.readline,
        'async_hooks': __nodeModules.async_hooks,
        'node:async_hooks': __nodeModules.async_hooks,
        'module': __nodeModules.module,
        'node:module': __nodeModules.module,
        'assert': __nodeModules.assert,
        'node:assert': __nodeModules.assert,
        'worker_threads': __nodeModules.worker_threads,
        'node:worker_threads': __nodeModules.worker_threads,
        'perf_hooks': __nodeModules.perf_hooks,
        'node:perf_hooks': __nodeModules.perf_hooks,
        'diagnostics_channel': __nodeModules.diagnostics_channel,
        'node:diagnostics_channel': __nodeModules.diagnostics_channel,
        'process': globalThis.process,
        'node:process': globalThis.process,
        'http2': __nodeModules.http2,
        'node:http2': __nodeModules.http2,
        'inspector': __nodeModules.inspector,
        'node:inspector': __nodeModules.inspector,
        'node:inspector/promises': __nodeModules.inspector,
        'path/posix': __nodeModules.path,
        'path/win32': __nodeModules.path,
        'node:path/posix': __nodeModules.path,
        'node:path/win32': __nodeModules.path,
        'stream/consumers': __nodeModules.stream_consumers,
        'node:stream/consumers': __nodeModules.stream_consumers,
        'stream/promises': __nodeModules.stream_promises,
        'node:stream/promises': __nodeModules.stream_promises,
        'v8': __nodeModules.v8,
        'node:v8': __nodeModules.v8,
        'dns': __nodeModules.dns,
        'node:dns': __nodeModules.dns,
        'constants': __nodeModules.constants,
        'node:constants': __nodeModules.constants,
    };

    globalThis.require = function require(id) {
        if (moduleCache[id]) return moduleCache[id];
        var module = modules[id];
        if (module) {
            moduleCache[id] = module;
            return module;
        }
        throw new Error("Cannot find module '" + id + "'. This module is not available in swift-bun runtime.");
    };

    globalThis.require.resolve = function(id) { return id; };
    globalThis.require.cache = moduleCache;
})();
