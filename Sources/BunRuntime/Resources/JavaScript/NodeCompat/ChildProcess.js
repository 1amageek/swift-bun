(function() {
    if (!globalThis.__nodeModules) globalThis.__nodeModules = {};
    __nodeModules.child_process = {
        spawn: function(file, args, opts) {
            if (!Array.isArray(args) && args && typeof args === 'object') {
                opts = args;
                args = [];
            }
            args = Array.isArray(args) ? args : [];
            opts = opts || {};

            var EE = require('events');
            var Stream = require('stream');
            var child = new EE();
            var stdinChunks = [];
            var started = false;

            child.stdout = new Stream.PassThrough();
            child.stderr = new Stream.PassThrough();
            child.killed = false;
            child.exitCode = null;
            child.signalCode = null;
            child.stdin = new Stream.Writable({
                write: function(chunk, encoding, callback) {
                    if (typeof chunk === 'string') stdinChunks.push(chunk);
                    else if (typeof Buffer !== 'undefined' && Buffer.isBuffer(chunk)) stdinChunks.push(chunk.toString(encoding && encoding !== 'buffer' ? encoding : 'utf8'));
                    else if (chunk instanceof Uint8Array) stdinChunks.push(Buffer.from(chunk).toString('utf8'));
                    else stdinChunks.push(String(chunk));
                    callback();
                },
                final: function(callback) {
                    start();
                    callback();
                }
            });

            function finishChild(result) {
                queueMicrotask(function() {
                    if (result.error) {
                        var err = new Error(result.error);
                        child.stdout.destroy(err);
                        child.stderr.destroy(err);
                        child.emit('error', err);
                        return;
                    }

                    child.exitCode = result.status || 0;
                    child.signalCode = result.signal || null;

                    if (result.stdout) child.stdout.write(Buffer.from(result.stdout, 'utf8'));
                    child.stdout.end();

                    if (result.stderr) child.stderr.write(Buffer.from(result.stderr, 'utf8'));
                    child.stderr.end();

                    child.emit('close', child.exitCode, child.signalCode);
                    child.emit('exit', child.exitCode, child.signalCode);
                });
            }

            function start() {
                if (started) return;
                started = true;

                var runOptions = Object.assign({}, opts);
                if (stdinChunks.length > 0) {
                    runOptions.input = stdinChunks.join('');
                }

                finishChild(__cpRunSync(file, JSON.stringify(args), JSON.stringify(runOptions)));
            }

            child.kill = function(signal) {
                child.killed = true;
                return true;
            };
            child.destroy = function(error) {
                child.killed = true;
                child.stdin.destroy(error);
                child.stdout.destroy(error);
                child.stderr.destroy(error);
            };

            queueMicrotask(start);
            return child;
        },
        exec: function(cmd, opts, cb) {
            if (typeof opts === 'function') cb = opts;
            return __nodeModules.child_process.execFile('/bin/sh', ['-lc', cmd], opts, cb);
        },
        execSync: function(cmd, opts) {
            var result = __cpRunSync('/bin/sh', JSON.stringify(['-lc', cmd]), JSON.stringify(opts || {}));
            if (result.error) throw new Error(result.error);
            if ((result.status || 0) !== 0) throw new Error(result.stderr || ('Command exited with code ' + result.status));
            return result.stdout || '';
        },
        execFile: function(file, args, opts, cb) {
            if (typeof opts === 'function') cb = opts;
            if (typeof args === 'function') cb = args;
            if (!Array.isArray(args)) args = [];
            opts = opts && typeof opts === 'object' ? opts : {};

            var child = __nodeModules.child_process.spawn(file, args, opts);
            var stdout = '';
            var stderr = '';

            child.stdout.on('data', function(chunk) { stdout += chunk.toString(); });
            child.stderr.on('data', function(chunk) { stderr += chunk.toString(); });

            child.on('close', function(code, signal) {
                if (!cb) return;
                if (code === 0 || code === 1) cb(null, stdout, stderr);
                else {
                    var err = new Error(stderr || ('Command exited with code ' + code));
                    err.code = code;
                    err.signal = signal;
                    cb(err, stdout, stderr);
                }
            });

            child.on('error', function(err) {
                if (cb) cb(err, stdout, stderr);
            });

            return child;
        },
        fork: function() {
            throw new Error('node:child_process fork is not supported in swift-bun');
        },
        spawnSync: function(file, args, opts) {
            if (!Array.isArray(args) && args && typeof args === 'object') {
                opts = args;
                args = [];
            }
            var result = __cpRunSync(file, JSON.stringify(Array.isArray(args) ? args : []), JSON.stringify(opts || {}));
            if (result.error) {
                return { error: new Error(result.error), status: null, stdout: '', stderr: '' };
            }
            return {
                pid: 0,
                status: result.status || 0,
                signal: result.signal || null,
                stdout: Buffer.from(result.stdout || '', 'utf8'),
                stderr: Buffer.from(result.stderr || '', 'utf8'),
            };
        },
    };
    __nodeModules.child_process.default = __nodeModules.child_process;
})();
