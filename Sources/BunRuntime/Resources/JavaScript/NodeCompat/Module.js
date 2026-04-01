(function() {
    if (!globalThis.__nodeModules) globalThis.__nodeModules = {};
    var builtinModuleNames = [
        'assert', 'async_hooks', 'buffer', 'child_process', 'constants', 'crypto',
        'diagnostics_channel', 'dns', 'events', 'fs', 'fs/promises', 'http', 'https',
        'http2', 'inspector', 'inspector/promises', 'module', 'net', 'os', 'path',
        'path/posix', 'path/win32', 'perf_hooks', 'process', 'querystring', 'readline',
        'stream', 'stream/consumers', 'stream/promises', 'stream/web', 'string_decoder',
        'timers', 'timers/promises', 'tls', 'tty', 'url', 'util', 'v8',
        'worker_threads', 'zlib'
    ];

    function dedupeStrings(values) {
        var seen = {};
        var result = [];
        for (var i = 0; i < values.length; i++) {
            var value = values[i];
            if (!seen[value]) {
                seen[value] = true;
                result.push(value);
            }
        }
        return result;
    }

    function moduleLoader() {
        if (!globalThis.__swiftBunModuleLoader) {
            throw new Error('CommonJS loader is not installed');
        }
        return globalThis.__swiftBunModuleLoader;
    }

    var moduleValue = {
        createRequire: function(fromPath) {
            return moduleLoader().createRequire(fromPath, null);
        },
        builtinModules: dedupeStrings(builtinModuleNames.concat(builtinModuleNames.map(function(name) {
            return name.startsWith('node:') ? name : 'node:' + name;
        }))).sort(),
        _resolveFilename: function(id, fromPath) {
            return moduleLoader().resolveFrom(id, fromPath);
        },
    };
    moduleValue.default = moduleValue;
    __nodeModules.module = moduleValue;
})();
