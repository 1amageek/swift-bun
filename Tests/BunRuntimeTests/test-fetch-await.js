// Test: await a fetch call
(async function() {
    process.stdout.write("before-fetch\n");
    try {
        var res = await fetch("https://httpbin.org/get");
        process.stdout.write("fetch-status:" + res.status + "\n");
    } catch(e) {
        process.stdout.write("fetch-error:" + e.message + "\n");
    }
    process.stdout.write("after-fetch\n");
    process.exit(0);
})();
