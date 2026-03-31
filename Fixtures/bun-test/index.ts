import { join, basename, extname } from "node:path";
import { randomUUID } from "node:crypto";

// Test path operations
const p = join("/usr", "local", "bin");
const b = basename("/foo/bar/baz.txt");
const e = extname("hello.world.js");

// Test crypto
const id = randomUUID();

// Test Bun globals
const version = typeof Bun !== "undefined" ? Bun.version : "unknown";

// Export results for verification
globalThis.__testResults = {
  path: { join: p, basename: b, extname: e },
  crypto: { uuid: id, uuidLength: id.length },
  bun: { version },
  ok: p === "/usr/local/bin" && b === "baz.txt" && e === ".js" && id.length === 36,
};

console.log(JSON.stringify({ type: "ready", results: globalThis.__testResults }));
