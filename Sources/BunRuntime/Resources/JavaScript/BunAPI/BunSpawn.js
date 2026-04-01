(function() {
    Bun.spawn = function(cmd, options) {
        if (typeof __bunSpawnDelegate === 'function') {
            return __bunSpawnDelegate(cmd, options || {});
        }
        throw new Error(
            'Bun.spawn() is not supported in swift-bun. ' +
            'Command: ' + (Array.isArray(cmd) ? cmd.join(' ') : String(cmd))
        );
    };

    Bun.spawnSync = function(cmd, options) {
        if (typeof __bunSpawnSyncDelegate === 'function') {
            return __bunSpawnSyncDelegate(cmd, options || {});
        }
        throw new Error(
            'Bun.spawnSync() is not supported in swift-bun. ' +
            'Command: ' + (Array.isArray(cmd) ? cmd.join(' ') : String(cmd))
        );
    };
})();
