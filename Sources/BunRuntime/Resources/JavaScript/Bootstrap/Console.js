(function() {
    function formatArgs(args) {
        return Array.prototype.slice.call(args).map(function(value) {
            if (typeof value === 'object') {
                try { return JSON.stringify(value); }
                catch (e) { return String(value); }
            }
            return String(value);
        }).join(' ');
    }

    function repeatIndent(level) {
        return new Array(level + 1).join('  ');
    }

    function formatTable(value) {
        if (!Array.isArray(value)) {
            return formatArgs([value]);
        }
        return value.map(function(entry, index) {
            if (entry && typeof entry === 'object') {
                try {
                    return index + '\t' + JSON.stringify(entry);
                } catch (error) {
                    return index + '\t' + String(entry);
                }
            }
            return index + '\t' + String(entry);
        }).join('\n');
    }

    globalThis.console = {
        _groupDepth: 0,
        _counts: {},
        log: function() { __nativeLog('log', formatArgs(arguments)); },
        warn: function() { __nativeLog('warn', formatArgs(arguments)); },
        error: function() { __nativeLog('error', formatArgs(arguments)); },
        info: function() { __nativeLog('info', formatArgs(arguments)); },
        debug: function() { __nativeLog('debug', formatArgs(arguments)); },
        trace: function() { __nativeLog('trace', formatArgs(arguments)); },
        dir: function(obj) { __nativeLog('log', JSON.stringify(obj, null, 2)); },
        assert: function(cond) {
            if (!cond) {
                var msg = formatArgs(Array.prototype.slice.call(arguments, 1));
                __nativeLog('error', 'Assertion failed: ' + msg);
            }
        },
        _timers: {},
        time: function(label) {
            label = label || 'default';
            this._timers[label] = performance.now();
        },
        timeEnd: function(label) {
            label = label || 'default';
            if (this._timers[label] === undefined) {
                __nativeLog('warn', 'Timer \'' + label + '\' does not exist');
                return;
            }
            var elapsed = performance.now() - this._timers[label];
            delete this._timers[label];
            __nativeLog('log', label + ': ' + elapsed.toFixed(3) + 'ms');
        },
        timeLog: function(label) {
            label = label || 'default';
            if (this._timers[label] === undefined) {
                __nativeLog('warn', 'Timer \'' + label + '\' does not exist');
                return;
            }
            var elapsed = performance.now() - this._timers[label];
            var extra = Array.prototype.slice.call(arguments, 1);
            var msg = label + ': ' + elapsed.toFixed(3) + 'ms';
            if (extra.length > 0) msg += ' ' + formatArgs(extra);
            __nativeLog('log', msg);
        },
        group: function() {
            var message = formatArgs(arguments);
            if (message) {
                __nativeLog('log', repeatIndent(this._groupDepth) + message);
            }
            this._groupDepth += 1;
        },
        groupEnd: function() {
            this._groupDepth = Math.max(0, this._groupDepth - 1);
        },
        count: function(label) {
            label = label || 'default';
            this._counts[label] = (this._counts[label] || 0) + 1;
            __nativeLog('log', repeatIndent(this._groupDepth) + label + ': ' + this._counts[label]);
        },
        countReset: function(label) {
            label = label || 'default';
            this._counts[label] = 0;
        },
        table: function(value) {
            __nativeLog('log', repeatIndent(this._groupDepth) + formatTable(value));
        },
    };
})();
