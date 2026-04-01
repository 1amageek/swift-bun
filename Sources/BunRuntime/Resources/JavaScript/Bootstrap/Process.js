globalThis.process = globalThis.process || {};
process.env = process.env || {};

(function() {
    var config = ((globalThis.__swiftBunConfig || {}).process) || {};
    process.platform = config.platform || 'darwin';
    process.arch = config.arch || 'arm64';
    process.version = 'v22.0.0';
    process.versions = { node: '22.0.0', bun: '1.0.0' };
    process.pid = config.pid || 0;
    process.ppid = config.ppid || 0;
    process.title = 'node';
    process.execPath = '/usr/local/bin/node';
    process.execArgv = [];
    process.argv0 = 'node';
    process.features = { inspector: false, debug: false, uv: false, ipv6: true, tls_alpn: true, tls_sni: true, tls_ocsp: false, tls: true };
    process.release = { name: 'node', sourceUrl: '', headersUrl: '' };
    process.config = { variables: {} };
    process.moduleLoadList = [];
    process.cwd = function() { return config.cwd || '/'; };
    process.chdir = function(dir) { throw new Error('process.chdir() is not supported in swift-bun. Working directory is fixed at startup.'); };
    process.umask = function() { return 0o22; };
    process.uptime = function() { return 0; };
    process.memoryUsage = function() { return { rss: 0, heapTotal: 0, heapUsed: 0, external: 0, arrayBuffers: 0 }; };
    process.cpuUsage = function() { return { user: 0, system: 0 }; };
    process.resourceUsage = function() { return {}; };
    process.getuid = function() { return config.uid || 0; };
    process.getgid = function() { return config.gid || 0; };
    process.geteuid = function() { return config.euid || 0; };
    process.getegid = function() { return config.egid || 0; };
    process.getgroups = function() { return [config.gid || 0]; };
    process.report = { getReport: function() { return {}; }, directory: '', filename: '' };
    process.exitCode = undefined;
    process.kill = function(pid, signal) { throw new Error('process.kill() is not supported in swift-bun'); };
    process.on = function() { return process; };
    process.once = function() { return process; };
    process.off = function() { return process; };
    process.emit = function() { return false; };
    process.removeListener = function() { return process; };
    process.removeAllListeners = function() { return process; };
    process.listeners = function() { return []; };
    process.listenerCount = function() { return 0; };
    process.exit = function(code) { throw new Error('process.exit(' + code + ') called'); };
    process.nextTick = function(fn) { Promise.resolve().then(fn); };
    process.hrtime = function(prev) {
        var now = performance.now();
        var sec = Math.floor(now / 1000);
        var nano = Math.floor((now % 1000) * 1e6);
        if (prev) {
            sec -= prev[0];
            nano -= prev[1];
            if (nano < 0) {
                sec--;
                nano += 1e9;
            }
        }
        return [sec, nano];
    };
    process.hrtime.bigint = function() { return BigInt(Math.floor(performance.now() * 1e6)); };
    process.emitWarning = function(msg) { console.warn('Warning:', msg); };
    process._rawDebug = function() {
        if (typeof __nativeStderrWrite === 'function') {
            __nativeStderrWrite(Array.prototype.slice.call(arguments).join(' ') + '\n');
            return;
        }
        console.error.apply(console, arguments);
    };
    process._getActiveHandles = function() {
        if (typeof __swiftBunActiveHandles === 'function') {
            return __swiftBunActiveHandles();
        }
        return [];
    };
    process.send = function() {
        return false;
    };
})();
