// index.ts
import { join, basename, extname } from "node:path";
import { randomUUID } from "node:crypto";
var p = join("/usr", "local", "bin");
var b = basename("/foo/bar/baz.txt");
var e = extname("hello.world.js");
var id = randomUUID();
var version = typeof Bun !== "undefined" ? Bun.version : "unknown";
globalThis.__testResults = {
  path: { join: p, basename: b, extname: e },
  crypto: { uuid: id, uuidLength: id.length },
  bun: { version },
  ok: p === "/usr/local/bin" && b === "baz.txt" && e === ".js" && id.length === 36
};
globalThis.__emitEvent(JSON.stringify({ type: "ready", results: globalThis.__testResults }));
