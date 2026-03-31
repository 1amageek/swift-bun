@preconcurrency import JavaScriptCore

/// Bun global API shims: `Bun.version`, `Bun.nanoseconds()`, `Bun.sleepSync()`, etc.
enum BunShims {
    static func install(in context: JSContext) {
        context.evaluateScript("""
        (function() {
            globalThis.Bun = globalThis.Bun || {};

            Bun.version = 'swift-bun-shim';
            Bun.revision = '0000000';
            Bun.main = '';
            Bun.enableANSIColors = false;
            Bun.isMainThread = true;

            Bun.nanoseconds = function() {
                return Math.floor(performance.now() * 1e6);
            };

            Bun.sleepSync = function(ms) {
                var end = performance.now() + ms;
                while (performance.now() < end) {}
            };

            Bun.sleep = function(ms) {
                return new Promise(function(resolve) {
                    setTimeout(resolve, ms);
                });
            };

            Bun.concatArrayBuffers = function(buffers) {
                var totalLength = 0;
                for (var i = 0; i < buffers.length; i++) {
                    totalLength += buffers[i].byteLength;
                }
                var result = new Uint8Array(totalLength);
                var offset = 0;
                for (var i = 0; i < buffers.length; i++) {
                    result.set(new Uint8Array(buffers[i]), offset);
                    offset += buffers[i].byteLength;
                }
                return result.buffer;
            };

            Bun.ArrayBufferSink = function ArrayBufferSink() {
                this._chunks = [];
            };
            Bun.ArrayBufferSink.prototype.write = function(chunk) {
                this._chunks.push(chunk);
            };
            Bun.ArrayBufferSink.prototype.end = function() {
                return Bun.concatArrayBuffers(this._chunks);
            };

            Bun.fileURLToPath = function(url) {
                if (typeof url === 'string') {
                    if (url.startsWith('file://')) return decodeURIComponent(url.slice(7));
                    return url;
                }
                return decodeURIComponent(url.pathname);
            };

            Bun.pathToFileURL = function(path) {
                return new URL('file://' + encodeURI(path));
            };

            Bun.resolveSync = function(specifier, parent) {
                return specifier;
            };

            Bun.hash = function(data) {
                // Simple non-cryptographic hash (djb2)
                var str = typeof data === 'string' ? data : new TextDecoder().decode(data);
                var hash = 5381;
                for (var i = 0; i < str.length; i++) {
                    hash = ((hash << 5) + hash + str.charCodeAt(i)) >>> 0;
                }
                return hash;
            };

            Bun.inspect = function(value) {
                try { return JSON.stringify(value, null, 2); }
                catch(e) { return String(value); }
            };

            Bun.peek = function(promise) {
                return promise;
            };

            Bun.deepEquals = function(a, b) {
                return JSON.stringify(a) === JSON.stringify(b);
            };

            Bun.deepMatch = function(subset, obj) {
                if (typeof subset !== 'object' || subset === null) return subset === obj;
                for (var key in subset) {
                    if (!Bun.deepMatch(subset[key], obj[key])) return false;
                }
                return true;
            };

            Bun.escapeHTML = function(str) {
                return String(str)
                    .replace(/&/g, '&amp;')
                    .replace(/</g, '&lt;')
                    .replace(/>/g, '&gt;')
                    .replace(/"/g, '&quot;')
                    .replace(/'/g, '&#39;');
            };

            Bun.stringWidth = function(str) {
                return str.length;
            };

            function parseSemver(version) {
                var value = String(version || '').trim().replace(/^v/, '');
                var parts = value.split('-', 2);
                var core = parts[0].split('.').map(function(part) {
                    var number = parseInt(part, 10);
                    return Number.isFinite(number) ? number : 0;
                });
                while (core.length < 3) core.push(0);
                return {
                    core: core,
                    prerelease: parts.length > 1 ? parts[1] : null
                };
            }

            function compareSemver(a, b) {
                var left = parseSemver(a);
                var right = parseSemver(b);
                for (var i = 0; i < 3; i++) {
                    if (left.core[i] > right.core[i]) return 1;
                    if (left.core[i] < right.core[i]) return -1;
                }
                if (left.prerelease && !right.prerelease) return -1;
                if (!left.prerelease && right.prerelease) return 1;
                if (left.prerelease && right.prerelease) {
                    if (left.prerelease > right.prerelease) return 1;
                    if (left.prerelease < right.prerelease) return -1;
                }
                return 0;
            }

            function satisfiesComparator(version, comparator) {
                comparator = String(comparator || '').trim();
                if (!comparator || comparator === '*') return true;

                var match = comparator.match(/^(<=|>=|<|>|=|\\^|~)?\\s*(.+)$/);
                if (!match) return compareSemver(version, comparator) === 0;

                var op = match[1] || '=';
                var target = match[2];
                var cmp = compareSemver(version, target);

                if (op === '=') return cmp === 0;
                if (op === '>') return cmp > 0;
                if (op === '>=') return cmp >= 0;
                if (op === '<') return cmp < 0;
                if (op === '<=') return cmp <= 0;
                if (op === '^') {
                    var lower = parseSemver(target);
                    var upper = [lower.core[0] + 1, 0, 0].join('.');
                    return compareSemver(version, target) >= 0 && compareSemver(version, upper) < 0;
                }
                if (op === '~') {
                    var base = parseSemver(target);
                    var upperBound = [base.core[0], base.core[1] + 1, 0].join('.');
                    return compareSemver(version, target) >= 0 && compareSemver(version, upperBound) < 0;
                }
                return false;
            }

            Bun.semver = {
                order: function(a, b) {
                    return compareSemver(a, b);
                },
                satisfies: function(version, range) {
                    var disjunctions = String(range || '').split('||').map(function(part) { return part.trim(); }).filter(Boolean);
                    if (disjunctions.length === 0) return true;

                    return disjunctions.some(function(part) {
                        var comparators = part.split(/\\s+/).filter(Boolean);
                        return comparators.every(function(comparator) {
                            return satisfiesComparator(version, comparator);
                        });
                    });
                }
            };

            Bun.YAML = {
                parse: function(input) {
                    var text = String(input || '');
                    var result = {};
                    var currentKey = null;
                    for (var i = 0; i < text.split(/\\r?\\n/).length; i++) {
                        var rawLine = text.split(/\\r?\\n/)[i];
                        var line = rawLine.trim();
                        if (!line || line.startsWith('#')) continue;

                        var listMatch = rawLine.match(/^\\s*-\\s+(.*)$/);
                        if (listMatch && currentKey) {
                            if (!Array.isArray(result[currentKey])) result[currentKey] = [];
                            result[currentKey].push(listMatch[1].trim());
                            continue;
                        }

                        var separator = rawLine.indexOf(':');
                        if (separator === -1) continue;

                        var key = rawLine.slice(0, separator).trim();
                        var value = rawLine.slice(separator + 1).trim();
                        currentKey = key;

                        if (!value) {
                            result[key] = [];
                            continue;
                        }

                        if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
                            value = value.slice(1, -1);
                        } else if (value === 'true') {
                            value = true;
                        } else if (value === 'false') {
                            value = false;
                        } else if (/^-?\\d+$/.test(value)) {
                            value = parseInt(value, 10);
                        }

                        result[key] = value;
                    }
                    return result;
                }
            };

            Bun.Glob = function Glob(pattern) {
                this.pattern = pattern;
            };
            Bun.Glob.prototype.match = function(str) {
                // Simple glob matching (supports * and ?)
                var regex = '^' + this.pattern
                    .replace(/[.+^${}()|[\\]\\\\]/g, '\\\\$&')
                    .replace(/\\*/g, '.*')
                    .replace(/\\?/g, '.') + '$';
                return new RegExp(regex).test(str);
            };

            Bun.serve = function() {
                throw new Error('Bun.serve() is not supported in swift-bun. Use native HTTP server alternatives.');
            };

            Bun.build = function() {
                throw new Error('Bun.build() is not supported in swift-bun runtime.');
            };

            Bun.plugin = function(options) {
                console.warn('Bun.plugin() has no effect in swift-bun runtime. Plugin: ' + (options && options.name || 'unknown'));
                return { name: options && options.name || 'noop' };
            };

            Bun.which = function(cmd) {
                // Bun.which returns null when the command is not found — this is the standard API contract.
                // On iOS, no shell commands are available.
                return null;
            };

            Bun.color = function(input, format) {
                // Bun.color returns null for unrecognized inputs — this is the standard API contract.
                return null;
            };

            // Bun.$`command` (shell template literal) - not supported
            Bun.$ = function() {
                throw new Error('Bun.$ shell is not supported in swift-bun');
            };
        })();
        """)
    }
}
