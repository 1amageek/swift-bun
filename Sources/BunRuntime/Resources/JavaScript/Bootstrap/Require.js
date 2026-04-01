(function() {
    var path = __nodeModules.path;
    var fileModuleCache = Object.create(null);

    var builtinModules = {
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

    var mainModuleRecord = null;

    function isBuiltin(id) {
        return Object.prototype.hasOwnProperty.call(builtinModules, id);
    }

    function currentWorkingDirectory() {
        if (globalThis.process && typeof globalThis.process.cwd === 'function') {
            return globalThis.process.cwd();
        }
        return '/';
    }

    function currentMainFilename() {
        if (!globalThis.process || !process.argv || typeof process.argv[1] !== 'string') return null;
        return normalizeAsAbsolute(process.argv[1], currentWorkingDirectory());
    }

    function pathFromLookupInput(value) {
        if (typeof value === 'string') {
            if (value.slice(0, 7) === 'file://') {
                return decodeURIComponent(new URL(value).pathname);
            }
            return value;
        }

        if (value && typeof value === 'object' && value.protocol === 'file:' && typeof value.pathname === 'string') {
            return decodeURIComponent(value.pathname);
        }

        return null;
    }

    function makeModuleNotFoundError(id, parentFilename) {
        var message = "Cannot find module '" + id + "'";
        if (parentFilename) {
            message += "\nRequire stack:\n- " + parentFilename;
        }
        var error = new Error(message);
        error.code = 'MODULE_NOT_FOUND';
        if (parentFilename) {
            error.requireStack = [parentFilename];
        }
        return error;
    }

    function annotateModuleError(error, filename) {
        if (!error || typeof error !== 'object') {
            return new Error(filename + ': ' + String(error));
        }
        if (error.code !== 'MODULE_NOT_FOUND' && typeof error.message === 'string' && error.message.indexOf(filename) === -1) {
            try {
                error.message = filename + ': ' + error.message;
            } catch (messageError) {
            }
        }
        return error;
    }

    function normalizeAsAbsolute(value, baseDirectory) {
        if (path.isAbsolute(value)) return path.normalize(value);
        return path.normalize(path.join(baseDirectory || currentWorkingDirectory(), value));
    }

    function stripBOM(source) {
        return source.charCodeAt(0) === 0xfeff ? source.slice(1) : source;
    }

    function stripShebang(source) {
        if (source.slice(0, 2) !== '#!') return source;
        var newlineIndex = source.indexOf('\n');
        return newlineIndex === -1 ? '' : source.slice(newlineIndex);
    }

    function stat(pathname) {
        return __moduleStat(pathname) || {
            exists: false,
            isFile: false,
            isDirectory: false,
            isSymbolicLink: false,
        };
    }

    function fileExists(pathname) {
        var result = stat(pathname);
        return !!result.exists && !!result.isFile;
    }

    function directoryExists(pathname) {
        var result = stat(pathname);
        return !!result.exists && !!result.isDirectory;
    }

    function realpath(pathname) {
        var result = __moduleRealpath(pathname);
        if (result && result.value) return result.value;
        return pathname;
    }

    function readTextFile(pathname) {
        var result = __moduleReadFile(pathname, 'utf8');
        if (result && result.error) {
            throw new Error(result.error);
        }
        return result ? result.value : '';
    }

    function directoryForLookup(fromPath) {
        var pathLike = pathFromLookupInput(fromPath);
        if (typeof pathLike === 'string' && pathLike.length > 0) {
            var absolutePath = normalizeAsAbsolute(pathLike, currentWorkingDirectory());
            if (directoryExists(absolutePath)) {
                return realpath(absolutePath);
            }
            return path.dirname(absolutePath);
        }
        var mainFilename = currentMainFilename();
        if (mainFilename) return path.dirname(mainFilename);
        return normalizeAsAbsolute(currentWorkingDirectory(), '/');
    }

    function buildNodeModuleSearchPaths(startDirectory) {
        var paths = [];
        var currentDirectory = startDirectory;
        while (true) {
            paths.push(path.join(currentDirectory, 'node_modules'));
            if (currentDirectory === '/') break;
            var parentDirectory = path.dirname(currentDirectory);
            if (parentDirectory === currentDirectory) break;
            currentDirectory = parentDirectory;
        }
        return paths;
    }

    function splitBareSpecifier(id) {
        var parts = id.split('/');
        if (id.charAt(0) === '@' && parts.length > 1) {
            return {
                packageName: parts[0] + '/' + parts[1],
                subpath: parts.slice(2).join('/'),
            };
        }
        return {
            packageName: parts[0],
            subpath: parts.slice(1).join('/'),
        };
    }

    function resolveAsFile(pathname) {
        var candidates = [pathname, pathname + '.js', pathname + '.json'];
        for (var index = 0; index < candidates.length; index++) {
            var candidate = candidates[index];
            if (fileExists(candidate)) {
                return realpath(candidate);
            }
        }
        return null;
    }

    function resolvePackageDirectory(packageDirectory, request) {
        var packageJSONPath = path.join(packageDirectory, 'package.json');
        if (fileExists(packageJSONPath)) {
            var packageJSON = JSON.parse(stripBOM(readTextFile(packageJSONPath)));
            if (typeof packageJSON.main === 'string' && packageJSON.main.length > 0) {
                var mainTarget = normalizeAsAbsolute(packageJSON.main, packageDirectory);
                if (path.normalize(mainTarget) !== path.normalize(packageDirectory)) {
                    var resolvedMain = resolveAsFileOrDirectory(mainTarget, request);
                    if (resolvedMain) return resolvedMain;
                }
            }
        }

        return resolveAsFile(path.join(packageDirectory, 'index')) ||
            resolveAsDirectory(path.join(packageDirectory, 'index'), request) ||
            null;
    }

    function resolveAsDirectory(pathname, request) {
        if (!directoryExists(pathname)) return null;
        return resolvePackageDirectory(realpath(pathname), request);
    }

    function resolveAsFileOrDirectory(pathname, request) {
        return resolveAsFile(pathname) || resolveAsDirectory(pathname, request);
    }

    function resolveBareSpecifier(id, startDirectory) {
        var specifier = splitBareSpecifier(id);
        var searchPaths = buildNodeModuleSearchPaths(startDirectory);

        for (var index = 0; index < searchPaths.length; index++) {
            var packageDirectory = path.join(searchPaths[index], specifier.packageName);
            if (!directoryExists(packageDirectory)) continue;

            var canonicalPackageDirectory = realpath(packageDirectory);
            if (specifier.subpath) {
                var subpathTarget = normalizeAsAbsolute(specifier.subpath, canonicalPackageDirectory);
                var resolvedSubpath = resolveAsFileOrDirectory(subpathTarget, id);
                if (resolvedSubpath) return resolvedSubpath;
            } else {
                var resolvedPackage = resolvePackageDirectory(canonicalPackageDirectory, id);
                if (resolvedPackage) return resolvedPackage;
            }
        }

        return null;
    }

    function resolveFrom(id, fromPath) {
        if (isBuiltin(id)) return id;

        var baseDirectory = directoryForLookup(fromPath);
        var resolved;
        if (id.charAt(0) === '/' || id.slice(0, 2) === './' || id.slice(0, 3) === '../') {
            resolved = resolveAsFileOrDirectory(normalizeAsAbsolute(id, baseDirectory), id);
        } else {
            resolved = resolveBareSpecifier(id, baseDirectory);
        }

        if (!resolved) {
            var parentPath = pathFromLookupInput(fromPath);
            throw makeModuleNotFoundError(
                id,
                typeof parentPath === 'string' && parentPath.length > 0
                    ? normalizeAsAbsolute(parentPath, currentWorkingDirectory())
                    : currentMainFilename()
            );
        }
        return resolved;
    }

    function makeModule(filename, parentModule) {
        var module = {
            id: filename,
            filename: filename,
            path: path.dirname(filename),
            exports: {},
            loaded: false,
            children: [],
            parent: parentModule || null,
            paths: buildNodeModuleSearchPaths(path.dirname(filename)),
        };
        if (parentModule) {
            parentModule.children.push(module);
        }
        return module;
    }

    function createMainModuleRecord(mainFilename) {
        var record = {
            id: '.',
            filename: mainFilename,
            path: path.dirname(mainFilename),
            exports: {},
            loaded: false,
            children: [],
            parent: null,
            paths: buildNodeModuleSearchPaths(path.dirname(mainFilename)),
        };
        fileModuleCache[mainFilename] = record;
        return record;
    }

    function getMainModule() {
        var mainFilename = currentMainFilename();
        if (!mainFilename) return null;
        if (fileModuleCache[mainFilename]) return fileModuleCache[mainFilename];
        if (mainModuleRecord && mainModuleRecord.filename === mainFilename) return mainModuleRecord;

        mainModuleRecord = createMainModuleRecord(mainFilename);
        return mainModuleRecord;
    }

    function executeSourceInModule(source, filename, module) {
        var localRequire = loader.createRequire(filename, module);
        module.require = localRequire;
        return (function(exports, require, module, __filename, __dirname, __source) {
            return eval(__source + '\n//# sourceURL=' + __filename);
        })(
            module.exports,
            localRequire,
            module,
            filename,
            path.dirname(filename),
            source
        );
    }

    function loadResolvedModule(filename, parentModule) {
        if (fileModuleCache[filename]) {
            return fileModuleCache[filename].exports;
        }

        var module = makeModule(filename, parentModule || getMainModule());
        fileModuleCache[filename] = module;

        try {
            if (path.extname(filename) === '.json') {
                module.exports = JSON.parse(stripBOM(readTextFile(filename)));
                module.loaded = true;
                return module.exports;
            }

            var source = stripShebang(stripBOM(readTextFile(filename)));
            executeSourceInModule(source, filename, module);
            module.loaded = true;
            return module.exports;
        } catch (error) {
            delete fileModuleCache[filename];
            throw annotateModuleError(error, filename);
        }
    }

    var loader = {
        cache: fileModuleCache,
        getMainModule: getMainModule,
        resolveFrom: function(id, fromPath) {
            return resolveFrom(id, fromPath);
        },
        requireFrom: function(id, fromPath, parentModule) {
            if (isBuiltin(id)) {
                return builtinModules[id];
            }
            return loadResolvedModule(resolveFrom(id, fromPath), parentModule || null);
        },
        executeMainSource: function(filename, source) {
            var mainFilename = normalizeAsAbsolute(filename, currentWorkingDirectory());
            var module = fileModuleCache[mainFilename];
            if (!module || (mainModuleRecord && module !== mainModuleRecord)) {
                module = createMainModuleRecord(mainFilename);
            }
            mainModuleRecord = module;

            try {
                var completion = executeSourceInModule(source, mainFilename, module);
                module.loaded = true;
                return completion;
            } catch (error) {
                delete fileModuleCache[mainFilename];
                if (mainModuleRecord === module) {
                    mainModuleRecord = null;
                }
                throw annotateModuleError(error, mainFilename);
            }
        },
        createRequire: function(fromPath, parentModule) {
            var required = function(id) {
                var effectiveParent = parentModule || (fromPath == null ? getMainModule() : null);
                return loader.requireFrom(id, fromPath, effectiveParent);
            };
            required.resolve = function(id) {
                return loader.resolveFrom(id, fromPath);
            };
            required.cache = fileModuleCache;
            required.extensions = Object.create(null);
            Object.defineProperty(required, 'main', {
                configurable: true,
                enumerable: true,
                get: function() {
                    return getMainModule();
                },
            });
            return required;
        },
    };

    globalThis.__swiftBunModuleLoader = loader;
    globalThis.require = loader.createRequire(null, null);
})();
