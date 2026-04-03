(function() {
    if (!globalThis.__nodeModules) globalThis.__nodeModules = {};
    function getEventEmitter() {
        if (__nodeModules.events) return __nodeModules.events.EventEmitter || __nodeModules.events;
        if (typeof require === 'function') return require('events').EventEmitter;
        throw new Error('events module is not available');
    }
    function getStream() {
        if (__nodeModules.stream) return __nodeModules.stream;
        if (typeof require === 'function') return require('stream');
        throw new Error('stream module is not available');
    }

    function ChildProcess() {
        var EE = getEventEmitter();
        var Stream = getStream();
        EE.call(this);
        this.killed = false;
        this.exitCode = null;
        this.signalCode = null;
        this.pid = 0;
        this.stdin = new Stream.PassThrough();
        this.stdout = new Stream.PassThrough();
        this.stderr = new Stream.PassThrough();
    }
    ChildProcess.prototype = Object.create(getEventEmitter().prototype);
    ChildProcess.prototype.constructor = ChildProcess;
    ChildProcess.prototype.kill = function() {
        this.killed = true;
        return true;
    };
    ChildProcess.prototype.destroy = function(error) {
        this.killed = true;
        this.stdin.destroy(error);
        this.stdout.destroy(error);
        this.stderr.destroy(error);
    };

    function runCommandSync(file, args, opts) {
        return __cpRunSync(file, JSON.stringify(args || []), JSON.stringify(opts || {}));
    }

    var nextBuiltinRequestId = 1;
    var pendingBuiltinChildren = Object.create(null);

    globalThis.__swiftBunChildProcessComplete = function(requestId, resultJSON) {
        var entry = pendingBuiltinChildren[requestId];
        if (!entry) return;
        delete pendingBuiltinChildren[requestId];

        var result;
        try {
            result = JSON.parse(resultJSON);
        } catch (error) {
            result = { error: String(error), status: 1, stdout: '', stderr: '' };
        }

        entry.finish(result);
    };

    function startBuiltinCommand(file, args, opts, finish) {
        if (typeof __cpBuiltinStart !== 'function') return false;
        var requestId = nextBuiltinRequestId++;
        pendingBuiltinChildren[requestId] = { finish: finish };
        var started = __cpBuiltinStart(file, JSON.stringify(args || []), JSON.stringify(opts || {}), requestId);
        if (!started) {
            delete pendingBuiltinChildren[requestId];
        }
        return started;
    }

    function decodeOutput(value, opts) {
        var encoding = opts && typeof opts.encoding === 'string' ? opts.encoding : null;
        if (encoding && encoding !== 'buffer') return value || '';
        return Buffer.from(value || '', 'utf8');
    }

    function commandDescription(file, args) {
        return [file].concat(Array.isArray(args) ? args : []).join(' ');
    }

    __nodeModules.child_process = {
        ChildProcess: ChildProcess,
        spawn: function(file, args, opts) {
            if (!Array.isArray(args) && args && typeof args === 'object') {
                opts = args;
                args = [];
            }
            args = Array.isArray(args) ? args : [];
            opts = opts || {};

            var child = new ChildProcess();
            var Stream = getStream();
            var stdinChunks = [];
            var started = false;

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

                    child.emit('exit', child.exitCode, child.signalCode);
                    child.emit('close', child.exitCode, child.signalCode);
                });
            }

            function start() {
                if (started) return;
                started = true;

                var runOptions = Object.assign({}, opts);
                if (stdinChunks.length > 0) {
                    runOptions.input = stdinChunks.join('');
                }

                if (startBuiltinCommand(file, args, runOptions, finishChild)) {
                    return;
                }

                finishChild(runCommandSync(file, args, runOptions));
            }

            queueMicrotask(start);
            return child;
        },
        exec: function(cmd, opts, cb) {
            if (typeof opts === 'function') cb = opts;
            return __nodeModules.child_process.execFile('/bin/sh', ['-lc', cmd], opts, cb);
        },
        execSync: function(cmd, opts) {
            var result = runCommandSync('/bin/sh', ['-lc', cmd], opts || {});
            if (result.error) throw new Error(result.error);
            if ((result.status || 0) !== 0) throw new Error(result.stderr || ('Command failed: ' + cmd));
            return decodeOutput(result.stdout, opts || {});
        },
        execFileSync: function(file, args, opts) {
            if (!Array.isArray(args) && args && typeof args === 'object') {
                opts = args;
                args = [];
            }
            opts = opts || {};
            var result = runCommandSync(file, Array.isArray(args) ? args : [], opts);
            if (result.error) throw new Error(result.error);
            if ((result.status || 0) !== 0) {
                var error = new Error(result.stderr || ('Command failed: ' + commandDescription(file, args)));
                error.status = result.status;
                error.signal = result.signal || null;
                error.stdout = decodeOutput(result.stdout, opts);
                error.stderr = decodeOutput(result.stderr, opts);
                throw error;
            }
            return decodeOutput(result.stdout, opts);
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
                if (code === 0) cb(null, stdout, stderr);
                else {
                    var err = new Error(stderr || ('Command exited with code ' + code));
                    err.code = code;
                    err.killed = child.killed;
                    err.signal = signal;
                    err.cmd = [file].concat(args).join(' ');
                    err.stdout = stdout;
                    err.stderr = stderr;
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
            opts = opts || {};
            return {
                pid: 0,
                status: result.status || 0,
                signal: result.signal || null,
                stdout: decodeOutput(result.stdout, opts),
                stderr: decodeOutput(result.stderr, opts),
            };
        },
    };
    __nodeModules.child_process.default = __nodeModules.child_process;
})();
