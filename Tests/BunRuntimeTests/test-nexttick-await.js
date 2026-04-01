// Test: await a nextTick-based Promise
(async function() {
    process.stdout.write("before-nexttick-await\n");
    await new Promise(function(resolve) {
        process.nextTick(function() {
            process.stdout.write("nexttick-fired\n");
            resolve();
        });
    });
    process.stdout.write("after-nexttick-await\n");
    process.exit(0);
})();
