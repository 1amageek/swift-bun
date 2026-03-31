const esm = require("es-module-lexer");
esm.initSync();

globalThis.__transformESM = function (source, bundleURL) {
  const parse = esm.parse;
  {
    const [imports, exports] = parse(source);

    // Collect replacement operations: { start, end, replacement }
    const ops = [];

    // --- Imports ---
    for (const imp of imports) {
      if (imp.d === -2) {
        // import.meta
        const afterMeta = source.slice(imp.e, imp.e + 4);
        if (afterMeta === ".url") {
          const afterUrl = imp.e + 4;
          const nextChar = afterUrl < source.length ? source[afterUrl] : "";
          if (!/[a-zA-Z0-9_$]/.test(nextChar)) {
            ops.push({
              start: imp.s,
              end: afterUrl,
              replacement: '"' + bundleURL + '"',
            });
            continue;
          }
        }
        ops.push({
          start: imp.s,
          end: imp.e,
          replacement: '({url:"' + bundleURL + '"})',
        });
      } else if (imp.d === -1) {
        // Static import (or re-export that appears in imports array)
        const fullStmt = source.slice(imp.ss, imp.se);
        const moduleName = imp.n;

        // Detect re-export: starts with "export"
        if (fullStmt.trimStart().startsWith("export")) {
          // export{a}from"mod" or export*from"mod"
          if (fullStmt.includes("*")) {
            // export * from "mod"
            let replacement = 'require("' + moduleName + '")';
            if (fullStmt.trimEnd().endsWith(";")) replacement += ";";
            ops.push({ start: imp.ss, end: imp.se, replacement });
          } else {
            // export { a, b as c } from "mod"
            const braceOpen = fullStmt.indexOf("{");
            const braceClose = fullStmt.lastIndexOf("}");
            if (braceOpen >= 0 && braceClose > braceOpen) {
              const specs = fullStmt
                .slice(braceOpen + 1, braceClose)
                .replace(/\s+as\s+/g, ":");
              let replacement =
                "var{" + specs + '}=require("' + moduleName + '")';
              if (fullStmt.trimEnd().endsWith(";")) replacement += ";";
              ops.push({ start: imp.ss, end: imp.se, replacement });
            }
          }
          continue;
        }

        // Regular import
        const fromMatch = fullStmt.match(/\bfrom\s*["']/);
        const importClause = fromMatch
          ? fullStmt.slice(6, fullStmt.indexOf(fromMatch[0])).trim()
          : "";

        let replacement;
        if (!importClause) {
          // Side-effect: import "mod"
          replacement = 'require("' + moduleName + '")';
        } else if (importClause.startsWith("{")) {
          // Named: import { a as b } from "mod"
          const specs = importClause
            .slice(1, importClause.lastIndexOf("}"))
            .replace(/\s+as\s+/g, ":");
          replacement = "var{" + specs + '}=require("' + moduleName + '")';
        } else if (importClause.startsWith("*")) {
          // Namespace: import * as x from "mod"
          const name = importClause.replace(/\*\s*as\s+/, "").trim();
          replacement = "var " + name + '=require("' + moduleName + '")';
        } else if (importClause.includes(",")) {
          // Combined: import x, { a as b } from "mod"
          const commaIdx = importClause.indexOf(",");
          const defaultName = importClause.slice(0, commaIdx).trim();
          const rest = importClause.slice(commaIdx + 1).trim();
          const braceOpen = rest.indexOf("{");
          const braceClose = rest.lastIndexOf("}");
          if (braceOpen >= 0 && braceClose > braceOpen) {
            const specs = rest
              .slice(braceOpen + 1, braceClose)
              .replace(/\s+as\s+/g, ":");
            replacement =
              "var " +
              defaultName +
              '=require("' +
              moduleName +
              '"),{' +
              specs +
              "}=" +
              defaultName;
          } else {
            replacement =
              "var " + defaultName + '=require("' + moduleName + '")';
          }
        } else {
          // Default: import x from "mod"
          replacement =
            "var " + importClause + '=require("' + moduleName + '")';
        }

        if (fullStmt.trimEnd().endsWith(";")) replacement += ";";
        ops.push({ start: imp.ss, end: imp.se, replacement });
      } else if (imp.d >= 0 && imp.a >= 0) {
        // Dynamic import with assertion: import(expr, { with: ... })
        // Strip the assertion (second argument)
        const callStart = imp.d; // position of "("
        const assertionStart = imp.a;

        // Find the comma before the assertion
        let commaPos = assertionStart - 1;
        while (commaPos > callStart && source[commaPos] !== ",") commaPos--;
        if (source[commaPos] === ",") {
          // Trim trailing whitespace before comma
          let firstArgEnd = commaPos;
          while (
            firstArgEnd > callStart + 1 &&
            /\s/.test(source[firstArgEnd - 1])
          )
            firstArgEnd--;

          // Find closing paren of import()
          let closeParen = imp.se - 1;
          while (closeParen > assertionStart && source[closeParen] !== ")")
            closeParen--;

          ops.push({
            start: firstArgEnd,
            end: closeParen,
            replacement: "",
          });
        }
      }
    }

    // --- Exports ---
    // Build set of positions already handled (re-exports are in imports array)
    const isHandled = (pos) => ops.some((op) => pos >= op.start && pos < op.end);

    for (const exp of exports) {
      if (isHandled(exp.s)) continue;

      // exp.s is the start of the exported NAME (e.g., "default", "bar", "X")
      // Scan backwards from exp.s to find "export" keyword
      let scanPos = exp.s - 1;
      while (scanPos >= 0 && /\s/.test(source[scanPos])) scanPos--;

      // Check what keyword is before the name
      const textBefore = source.slice(Math.max(0, scanPos - 40), scanPos + 1);

      if (exp.n === "default") {
        // export default EXPR
        // exp.s points to "default" keyword, not the value.
        // Find "export" before "default", strip "export default "
        // "export default " occupies from export_start to (exp.e + trailing_space)
        const m = textBefore.match(/(export)\s*$/);
        if (m) {
          const exportStart = scanPos + 1 - m[0].length;
          // Strip from "export" start to after "default" + any whitespace
          let valueStart = exp.e;
          while (valueStart < source.length && /\s/.test(source[valueStart])) valueStart++;
          ops.push({ start: exportStart, end: valueStart, replacement: "" });
        }
      } else if (textBefore.match(/(export)\s+(async\s+function|function|class|var|let|const)\s*$/)) {
        // export function/var/let/const/class/async function — strip "export "
        const m = textBefore.match(/(export)\s+((?:async\s+)?function|class|var|let|const)\s*$/);
        if (m) {
          const fullMatch = m[0];
          const exportKeyword = m[1]; // "export"
          const start = scanPos + 1 - fullMatch.length;
          // Replace "export function" with "function" (strip "export ")
          ops.push({ start, end: start + exportKeyword.length + 1, replacement: "" });
        }
      }
    }

    // Handle plain "export { names };" (without from) — not re-exports
    // These appear in exports array but not in imports array
    // Use es-module-lexer's knowledge: if an export name's ls (local start)
    // equals its s, and the export has braces, it's a plain named export
    // Scan for them directly
    const exportBraceRe = /(?<![a-zA-Z0-9_$])export\s*\{[^}]*\}\s*;?/g;
    let match;
    while ((match = exportBraceRe.exec(source)) !== null) {
      const start = match.index;
      const end = start + match[0].length;
      if (isHandled(start)) continue;
      // Verify no "from" after (re-exports are already handled)
      const afterMatch = source.slice(end).trimStart();
      if (afterMatch.startsWith("from")) continue;
      ops.push({ start, end, replacement: "" });
    }

    // --- Apply replacements in reverse position order ---
    ops.sort((a, b) => b.start - a.start);

    // Deduplicate overlapping ranges (keep the one that starts first)
    const deduped = [];
    let lastStart = Infinity;
    for (const op of ops) {
      if (op.end <= lastStart) {
        deduped.push(op);
        lastStart = op.start;
      }
    }

    let result = source;
    for (const op of deduped) {
      result = result.slice(0, op.start) + op.replacement + result.slice(op.end);
    }

    return result;
  }
};
