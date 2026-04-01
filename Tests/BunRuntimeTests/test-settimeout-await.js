// Test: await a setTimeout-based Promise (async IIFE)
(async function() {
    process.stdout.write("before-await\n");
    await new Promise(function(resolve) {
        setTimeout(function() {
            process.stdout.write("timer-fired\n");
            resolve();
        }, 100);
    });
    process.stdout.write("after-await\n");
    process.exit(0);
})();
