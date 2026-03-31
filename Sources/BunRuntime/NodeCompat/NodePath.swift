@preconcurrency import JavaScriptCore

/// Pure JavaScript implementation of `node:path`.
enum NodePath {
    static func install(in context: JSContext) {
        context.evaluateScript("""
        (function() {
            var path = {
                sep: '/',
                delimiter: ':',
                posix: null,
                win32: null,

                join: function() {
                    var parts = Array.prototype.slice.call(arguments).filter(Boolean);
                    return path.normalize(parts.join('/'));
                },

                resolve: function() {
                    var parts = Array.prototype.slice.call(arguments);
                    var resolved = '';
                    for (var i = parts.length - 1; i >= 0; i--) {
                        if (!parts[i]) continue;
                        resolved = parts[i] + (resolved ? '/' + resolved : '');
                        if (parts[i].charAt(0) === '/') break;
                    }
                    if (resolved.charAt(0) !== '/') resolved = '/' + resolved;
                    return path.normalize(resolved);
                },

                normalize: function(p) {
                    if (!p) return '.';
                    var isAbsolute = p.charAt(0) === '/';
                    var parts = p.split('/').filter(Boolean);
                    var result = [];
                    for (var i = 0; i < parts.length; i++) {
                        if (parts[i] === '.') continue;
                        if (parts[i] === '..') { result.pop(); }
                        else { result.push(parts[i]); }
                    }
                    var normalized = result.join('/');
                    return (isAbsolute ? '/' : '') + (normalized || (isAbsolute ? '' : '.'));
                },

                basename: function(p, ext) {
                    var base = p.split('/').filter(Boolean).pop() || '';
                    if (ext && base.endsWith(ext)) {
                        base = base.slice(0, -ext.length);
                    }
                    return base;
                },

                dirname: function(p) {
                    var parts = p.split('/');
                    parts.pop();
                    var dir = parts.join('/');
                    return dir || (p.charAt(0) === '/' ? '/' : '.');
                },

                extname: function(p) {
                    var base = path.basename(p);
                    var idx = base.lastIndexOf('.');
                    if (idx <= 0) return '';
                    return base.slice(idx);
                },

                isAbsolute: function(p) {
                    return p.charAt(0) === '/';
                },

                relative: function(from, to) {
                    from = path.resolve(from).split('/').filter(Boolean);
                    to = path.resolve(to).split('/').filter(Boolean);
                    var common = 0;
                    while (common < from.length && common < to.length && from[common] === to[common]) {
                        common++;
                    }
                    var up = [];
                    for (var i = common; i < from.length; i++) up.push('..');
                    return up.concat(to.slice(common)).join('/') || '.';
                },

                parse: function(p) {
                    return {
                        root: path.isAbsolute(p) ? '/' : '',
                        dir: path.dirname(p),
                        base: path.basename(p),
                        ext: path.extname(p),
                        name: path.basename(p, path.extname(p)),
                    };
                },

                format: function(obj) {
                    var dir = obj.dir || obj.root || '';
                    var base = obj.base || ((obj.name || '') + (obj.ext || ''));
                    return dir ? (dir + '/' + base) : base;
                },

                toNamespacedPath: function(p) { return p; },
            };

            path.posix = path;
            path.win32 = path;
            path.default = path;

            if (!globalThis.__nodeModules) globalThis.__nodeModules = {};
            __nodeModules.path = path;
        })();
        """)
    }
}
