require("./index.js");
const fs = require("fs");
const path = require("os").homedir() + "/Library/Caches/claude-code/package/cli.js";

if (!fs.existsSync(path)) {
  console.log("cli.js not found");
  process.exit(0);
}

setTimeout(() => {
  const source = fs.readFileSync(path, "utf8");
  console.log("Source size:", source.length);

  const t0 = Date.now();
  const result = __transformESM(source, "file://" + path);
  console.log("Transform time:", Date.now() - t0, "ms");
  console.log("Result size:", result.length);

  // Count remaining import patterns that look like static imports with "from"
  let remaining = 0;
  const re = /(?<![a-zA-Z0-9_$.])import\s*(?:\{[^}]*\}|\*|[a-zA-Z_$])/g;
  let m;
  while ((m = re.exec(result)) !== null) {
    const ctx = result.slice(m.index, Math.min(result.length, m.index + 120));
    if (/\bfrom\s*["']/.test(ctx)) {
      remaining++;
      if (remaining <= 5) {
        console.log("  [" + m.index + "] " + ctx.slice(0, 80));
      }
    }
  }
  console.log("In-code imports remaining:", remaining);
}, 200);
