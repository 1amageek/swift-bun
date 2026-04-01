(function() {
    var osConfig = ((globalThis.__swiftBunConfig || {}).os) || {};
    var os = {
        hostname: function() { return __osHostname(); },
        homedir: function() { return __osHomedir(); },
        tmpdir: function() { return __osTmpdir(); },
        totalmem: function() { return __osTotalmem(); },
        freemem: function() { return __osTotalmem() * 0.5; },
        cpus: function() {
            var count = __osCpuCount();
            var result = [];
            for (var i = 0; i < count; i++) {
                result.push({ model: 'Apple Silicon', speed: 0, times: {} });
            }
            return result;
        },
        type: function() { return 'Darwin'; },
        platform: function() { return process.platform; },
        arch: function() { return process.arch; },
        release: function() { return osConfig.release || ''; },
        version: function() { return osConfig.version || osConfig.release || ''; },
        uptime: function() { return Math.floor(performance.now() / 1000); },
        loadavg: function() { return [0, 0, 0]; },
        networkInterfaces: function() { return {}; },
        userInfo: function() {
            return {
                username: osConfig.username || 'mobile',
                uid: osConfig.uid || 0,
                gid: osConfig.gid || 0,
                shell: osConfig.shell || '/bin/zsh',
                homedir: __osHomedir(),
            };
        },
        endianness: function() { return 'LE'; },
        EOL: '\n',
        constants: {
            signals: {},
            errno: {},
        },
    };

    if (!globalThis.__nodeModules) globalThis.__nodeModules = {};
    __nodeModules.os = os;
})();
