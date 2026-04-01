// Simple echo server: reads stdin line by line, echoes each line to stdout after 1.5s delay.
// Uses only basic Node.js APIs: process.stdin, process.stdout, setTimeout.

process.stdin.setEncoding('utf8');

process.stdin.on('data', function(chunk) {
    var lines = chunk.split('\n');
    for (var i = 0; i < lines.length; i++) {
        if (lines[i].length > 0) {
            (function(line) {
                setTimeout(function() {
                    process.stdout.write(line + '\n');
                }, 1500);
            })(lines[i]);
        }
    }
});

process.stdin.on('end', function() {
    setTimeout(function() {
        process.exit(0);
    }, 2000);
});
