globalThis.__PROCESS_EXIT_SENTINEL__ = Object.freeze({ __processExit: true });
process.exit = function(code) {
    var exitCode = code === undefined ? 0 : (code | 0);
    if (exitCode !== 0) {
        var trace = new Error('process.exit(' + exitCode + ') called');
        if (typeof process.stderr !== 'undefined' && typeof process.stderr.write === 'function') {
            process.stderr.write('[process.exit] code=' + exitCode + ' stack=' + trace.stack + '\n');
        }
    }
    __processExit(exitCode);
    throw globalThis.__PROCESS_EXIT_SENTINEL__;
};
