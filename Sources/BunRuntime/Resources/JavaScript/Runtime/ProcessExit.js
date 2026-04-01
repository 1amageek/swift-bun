globalThis.__PROCESS_EXIT_SENTINEL__ = Object.freeze({ __processExit: true });
process.exit = function(code) {
    __processExit(code === undefined ? 0 : (code | 0));
    throw globalThis.__PROCESS_EXIT_SENTINEL__;
};
