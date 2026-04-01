(function() {
    if (!globalThis.__nodeModules) globalThis.__nodeModules = {};
    var workerThreads = {
        isMainThread: true,
        parentPort: null,
        workerData: null,
        Worker: function() {
            throw new Error('node:worker_threads is not supported in swift-bun');
        },
        threadId: 0,
    };
    workerThreads.default = workerThreads;
    __nodeModules.worker_threads = workerThreads;
})();
