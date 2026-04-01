// Test: process.nextTick only (no async, no await, no fetch, no setTimeout)
var count = 0;
process.nextTick(function() {
    count++;
    process.stdout.write("tick1\n");
    process.nextTick(function() {
        count++;
        process.stdout.write("tick2\n");
        process.nextTick(function() {
            count++;
            process.stdout.write("done:" + count + "\n");
            process.exit(0);
        });
    });
});
