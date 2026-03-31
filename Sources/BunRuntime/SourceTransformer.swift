import Foundation

/// Pre-processes JavaScript source for JavaScriptCore compatibility.
///
/// `evaluateScript()` runs code as a plain script, not as an ESM module.
/// This transformer converts ESM syntax (static imports, import.meta, import assertions)
/// into CJS equivalents that work with the polyfilled `require()`.
enum SourceTransformer {

    // MARK: - Public API

    /// Apply all JSC compatibility transformations in a single pass.
    ///
    /// Handles:
    /// - `import { a as b } from "mod"` → `var { a: b } = require("mod")`
    /// - `import x from "mod"` → `var x = require("mod")`
    /// - `import * as x from "mod"` → `var x = require("mod")`
    /// - `import "mod"` → `require("mod")`
    /// - `import.meta.url` → `"<bundleURL>"`
    /// - `import.meta` → `({url:"<bundleURL>"})`
    /// - `import(expr, { with: ... })` → `import(expr)`
    /// - `export { ... }` → removed
    /// - `export default expr` → `var __esModule_default = expr`
    /// - `export function/var/let/const/class ...` → strip `export` keyword
    static func transformForJSC(_ source: String, bundleURL: URL) -> String {
        guard source.contains("import") || source.contains("export") else { return source }

        let chars = Array(source)
        let count = chars.count
        var result: [Character] = []
        result.reserveCapacity(count)
        var i = 0
        let urlString = escapeForJS(bundleURL.absoluteString)

        while i < count {
            if let end = skipString(chars, at: i) {
                result.append(contentsOf: chars[i..<end])
                i = end
            } else if let end = skipComment(chars, at: i) {
                result.append(contentsOf: chars[i..<end])
                i = end
            } else if isImportKeyword(chars, at: i) {
                if let (transformed, end) = handleImport(chars, at: i, urlString: urlString) {
                    result.append(contentsOf: transformed)
                    i = end
                } else {
                    result.append(chars[i])
                    i += 1
                }
            } else if isExportKeyword(chars, at: i) {
                if let (transformed, end) = handleExport(chars, at: i) {
                    result.append(contentsOf: transformed)
                    i = end
                } else {
                    result.append(chars[i])
                    i += 1
                }
            } else {
                result.append(chars[i])
                i += 1
            }
        }

        return String(result)
    }

    /// Strip only dynamic import assertion/attribute syntax.
    ///
    /// Transforms `import(expr, { with: { ... } })` → `import(expr)`
    /// and `import(expr, { assert: { ... } })` → `import(expr)`.
    static func stripImportAssertions(_ source: String) -> String {
        guard source.contains("import") else { return source }

        let chars = Array(source)
        let count = chars.count
        var result: [Character] = []
        result.reserveCapacity(count)
        var i = 0

        while i < count {
            if let end = skipString(chars, at: i) {
                result.append(contentsOf: chars[i..<end])
                i = end
            } else if let end = skipComment(chars, at: i) {
                result.append(contentsOf: chars[i..<end])
                i = end
            } else if let (transformed, end) = transformDynamicImport(chars, at: i) {
                result.append(contentsOf: transformed)
                i = end
            } else {
                result.append(chars[i])
                i += 1
            }
        }

        return String(result)
    }

    // MARK: - Import dispatcher

    private static func handleImport(
        _ chars: [Character], at i: Int, urlString: String
    ) -> ([Character], Int)? {
        let count = chars.count
        var j = i + 6
        while j < count && chars[j].isWhitespace { j += 1 }
        guard j < count else { return nil }

        switch chars[j] {
        case ".":
            return transformImportMeta(chars, at: i, urlString: urlString)
        case "(":
            return transformDynamicImport(chars, at: i)
        case "{":
            return transformNamedImport(chars, at: i)
        case "*":
            return transformNamespaceImport(chars, at: i)
        case "\"", "'":
            return transformSideEffectImport(chars, at: i)
        default:
            if chars[j].isLetter || chars[j] == "_" || chars[j] == "$" {
                return transformDefaultImport(chars, at: i)
            }
            return nil
        }
    }

    // MARK: - import.meta

    private static func transformImportMeta(
        _ chars: [Character], at i: Int, urlString: String
    ) -> ([Character], Int)? {
        let count = chars.count
        let j = i + 6

        guard j + 5 <= count,
              chars[j] == ".", chars[j + 1] == "m", chars[j + 2] == "e",
              chars[j + 3] == "t", chars[j + 4] == "a" else {
            return nil
        }
        let afterMeta = j + 5

        // Reject if "meta" is a prefix of a longer property (e.g. import.metaData)
        if afterMeta < count {
            let c = chars[afterMeta]
            if (c.isLetter || c.isNumber || c == "_") && c != "." {
                return nil
            }
        }

        // Check for ".url"
        if afterMeta + 4 <= count &&
           chars[afterMeta] == "." &&
           chars[afterMeta + 1] == "u" && chars[afterMeta + 2] == "r" && chars[afterMeta + 3] == "l" {
            let afterURL = afterMeta + 4
            if afterURL >= count ||
               !(chars[afterURL].isLetter || chars[afterURL].isNumber || chars[afterURL] == "_") {
                return (Array("\"\(urlString)\""), afterURL)
            }
        }

        return (Array("({url:\"\(urlString)\"})"), afterMeta)
    }

    // MARK: - Static imports

    private static func transformNamedImport(
        _ chars: [Character], at i: Int
    ) -> ([Character], Int)? {
        let count = chars.count
        var j = i + 6
        while j < count && chars[j].isWhitespace { j += 1 }
        guard j < count, chars[j] == "{" else { return nil }
        j += 1

        let specStart = j
        var braceDepth = 1
        while j < count && braceDepth > 0 {
            if chars[j] == "{" { braceDepth += 1 }
            else if chars[j] == "}" { braceDepth -= 1 }
            if braceDepth > 0 { j += 1 }
        }
        guard braceDepth == 0 else { return nil }

        let specifiers = String(chars[specStart..<j])
        j += 1

        let transformed = specifiers.replacingOccurrences(
            of: #"\s+as\s+"#, with: ":", options: .regularExpression
        )

        guard let afterFrom = matchFrom(chars, at: j) else { return nil }
        j = afterFrom

        guard let (moduleName, afterModule) = matchQuotedString(chars, at: j) else { return nil }
        j = afterModule
        if j < count && chars[j] == ";" { j += 1 }

        return (Array("var{\(transformed)}=require(\"\(moduleName)\")"), j)
    }

    private static func transformNamespaceImport(
        _ chars: [Character], at i: Int
    ) -> ([Character], Int)? {
        let count = chars.count
        var j = i + 6
        while j < count && chars[j].isWhitespace { j += 1 }
        guard j < count, chars[j] == "*" else { return nil }
        j += 1
        while j < count && chars[j].isWhitespace { j += 1 }

        guard j + 2 <= count, chars[j] == "a", chars[j + 1] == "s",
              j + 2 < count && !chars[j + 2].isLetter && !chars[j + 2].isNumber && chars[j + 2] != "_" else {
            return nil
        }
        j += 2
        while j < count && chars[j].isWhitespace { j += 1 }

        guard let (ident, afterIdent) = matchIdentifier(chars, at: j) else { return nil }
        j = afterIdent

        guard let afterFrom = matchFrom(chars, at: j) else { return nil }
        j = afterFrom

        guard let (moduleName, afterModule) = matchQuotedString(chars, at: j) else { return nil }
        j = afterModule
        if j < count && chars[j] == ";" { j += 1 }

        return (Array("var \(ident)=require(\"\(moduleName)\")"), j)
    }

    private static func transformDefaultImport(
        _ chars: [Character], at i: Int
    ) -> ([Character], Int)? {
        let count = chars.count
        var j = i + 6
        while j < count && chars[j].isWhitespace { j += 1 }

        guard let (ident, afterIdent) = matchIdentifier(chars, at: j) else { return nil }
        j = afterIdent

        guard let afterFrom = matchFrom(chars, at: j) else { return nil }
        j = afterFrom

        guard let (moduleName, afterModule) = matchQuotedString(chars, at: j) else { return nil }
        j = afterModule
        if j < count && chars[j] == ";" { j += 1 }

        return (Array("var \(ident)=require(\"\(moduleName)\")"), j)
    }

    private static func transformSideEffectImport(
        _ chars: [Character], at i: Int
    ) -> ([Character], Int)? {
        var j = i + 6
        while j < chars.count && chars[j].isWhitespace { j += 1 }

        guard let (moduleName, afterModule) = matchQuotedString(chars, at: j) else { return nil }
        j = afterModule
        if j < chars.count && chars[j] == ";" { j += 1 }

        return (Array("require(\"\(moduleName)\")"), j)
    }

    // MARK: - Dynamic import assertions

    private static func transformDynamicImport(
        _ chars: [Character], at i: Int
    ) -> ([Character], Int)? {
        let count = chars.count

        guard i + 6 < count,
              chars[i] == "i", chars[i + 1] == "m", chars[i + 2] == "p",
              chars[i + 3] == "o", chars[i + 4] == "r", chars[i + 5] == "t" else {
            return nil
        }

        if i > 0 {
            let prev = chars[i - 1]
            if prev.isLetter || prev.isNumber || prev == "_" || prev == "$" || prev == "." {
                return nil
            }
        }

        var j = i + 6
        while j < count && chars[j].isWhitespace { j += 1 }
        guard j < count, chars[j] == "(" else { return nil }
        j += 1

        let argStart = j
        var parenDepth = 1
        var braceDepth = 0
        var bracketDepth = 0
        var topLevelComma: Int?
        var inStr: Character?
        var escaped = false

        while j < count, parenDepth > 0 {
            let c = chars[j]
            if escaped { escaped = false; j += 1; continue }
            if c == "\\" && inStr != nil { escaped = true; j += 1; continue }
            if let q = inStr {
                if c == q { inStr = nil }
                j += 1
                continue
            }

            switch c {
            case "'", "\"", "`": inStr = c
            case "(": parenDepth += 1
            case ")": parenDepth -= 1
            case "{": braceDepth += 1
            case "}": braceDepth -= 1
            case "[": bracketDepth += 1
            case "]": bracketDepth -= 1
            case ",":
                if parenDepth == 1 && braceDepth == 0 && bracketDepth == 0 && topLevelComma == nil {
                    topLevelComma = j
                }
            default: break
            }

            if parenDepth > 0 { j += 1 }
        }

        guard parenDepth == 0 else { return nil }
        let closeParenIndex = j
        j += 1

        guard let comma = topLevelComma else { return nil }

        let secondArg = String(chars[(comma + 1)..<closeParenIndex])
            .trimmingCharacters(in: .whitespacesAndNewlines)

        guard secondArg.hasPrefix("{"),
              secondArg.range(of: #"\b(?:with|assert)\b\s*:"#, options: .regularExpression) != nil else {
            return nil
        }

        var replacement: [Character] = Array("import(")
        var firstArgEnd = comma
        while firstArgEnd > argStart && chars[firstArgEnd - 1].isWhitespace {
            firstArgEnd -= 1
        }
        replacement.append(contentsOf: chars[argStart..<firstArgEnd])
        replacement.append(")")

        return (replacement, j)
    }

    // MARK: - Export handling

    private static func handleExport(
        _ chars: [Character], at i: Int
    ) -> ([Character], Int)? {
        let count = chars.count
        var j = i + 6
        while j < count && chars[j].isWhitespace { j += 1 }
        guard j < count else { return nil }

        if chars[j] == "{" {
            // export { a, b } or export { a } from "mod"
            j += 1
            var braceDepth = 1
            while j < count && braceDepth > 0 {
                if chars[j] == "{" { braceDepth += 1 }
                else if chars[j] == "}" { braceDepth -= 1 }
                if braceDepth > 0 { j += 1 }
            }
            guard braceDepth == 0 else { return nil }
            j += 1

            // Check for re-export: export { a } from "mod"
            var k = j
            while k < count && chars[k].isWhitespace { k += 1 }
            if let afterFrom = matchFrom(chars, at: k) {
                if let (_, afterModule) = matchQuotedString(chars, at: afterFrom) {
                    j = afterModule
                }
            }

            if j < count && chars[j] == ";" { j += 1 }
            return ([], j)
        }

        // export default ...
        if j + 7 <= count &&
           chars[j] == "d" && chars[j + 1] == "e" && chars[j + 2] == "f" &&
           chars[j + 3] == "a" && chars[j + 4] == "u" && chars[j + 5] == "l" && chars[j + 6] == "t" {
            let afterDefault = j + 7
            if afterDefault < count && (chars[afterDefault].isLetter || chars[afterDefault].isNumber || chars[afterDefault] == "_") {
                return nil
            }
            // Strip "export default" → keep the expression
            return ([], afterDefault)
        }

        // export function/var/let/const/class/async → strip "export "
        let declarationKeywords = ["function", "var", "let", "const", "class", "async"]
        for keyword in declarationKeywords {
            let kw = Array(keyword)
            if j + kw.count <= count {
                var matches = true
                for k in 0..<kw.count {
                    if chars[j + k] != kw[k] { matches = false; break }
                }
                if matches {
                    let afterKw = j + kw.count
                    if afterKw >= count || !chars[afterKw].isLetter {
                        // Strip "export " and keep the declaration
                        return ([], i + 6)
                    }
                }
            }
        }

        return nil
    }

    // MARK: - Keyword detection

    private static func isImportKeyword(_ chars: [Character], at i: Int) -> Bool {
        let count = chars.count
        guard i + 5 < count,
              chars[i] == "i", chars[i + 1] == "m", chars[i + 2] == "p",
              chars[i + 3] == "o", chars[i + 4] == "r", chars[i + 5] == "t" else {
            return false
        }
        if i > 0 {
            let prev = chars[i - 1]
            if prev.isLetter || prev.isNumber || prev == "_" || prev == "$" || prev == "." {
                return false
            }
        }
        let next = i + 6
        if next < count {
            let c = chars[next]
            if c.isLetter || c.isNumber || c == "_" || c == "$" {
                // Allow import.meta (dot is not letter/number/_/$)
                return false
            }
        }
        return true
    }

    private static func isExportKeyword(_ chars: [Character], at i: Int) -> Bool {
        let count = chars.count
        guard i + 5 < count,
              chars[i] == "e", chars[i + 1] == "x", chars[i + 2] == "p",
              chars[i + 3] == "o", chars[i + 4] == "r", chars[i + 5] == "t" else {
            return false
        }
        if i > 0 {
            let prev = chars[i - 1]
            if prev.isLetter || prev.isNumber || prev == "_" || prev == "$" || prev == "." {
                return false
            }
        }
        let next = i + 6
        if next < count {
            let c = chars[next]
            if c.isLetter || c.isNumber || c == "_" || c == "$" {
                return false
            }
        }
        return true
    }

    // MARK: - Scanning helpers

    private static func skipString(_ chars: [Character], at i: Int) -> Int? {
        let c = chars[i]
        guard c == "'" || c == "\"" || c == "`" else { return nil }
        var j = i + 1
        while j < chars.count {
            if chars[j] == "\\" { j += 2; continue }
            if chars[j] == c { return j + 1 }
            j += 1
        }
        return j
    }

    private static func skipComment(_ chars: [Character], at i: Int) -> Int? {
        guard i + 1 < chars.count, chars[i] == "/" else { return nil }
        if chars[i + 1] == "/" {
            var j = i + 2
            while j < chars.count && chars[j] != "\n" { j += 1 }
            return j
        }
        if chars[i + 1] == "*" {
            var j = i + 2
            while j + 1 < chars.count {
                if chars[j] == "*" && chars[j + 1] == "/" { return j + 2 }
                j += 1
            }
            return chars.count
        }
        return nil
    }

    // MARK: - Token matchers

    private static func matchFrom(_ chars: [Character], at start: Int) -> Int? {
        var j = start
        while j < chars.count && chars[j].isWhitespace { j += 1 }
        guard j + 4 <= chars.count,
              chars[j] == "f", chars[j + 1] == "r", chars[j + 2] == "o", chars[j + 3] == "m" else {
            return nil
        }
        let afterFrom = j + 4
        // Ensure "from" is not a prefix of a longer identifier
        if afterFrom < chars.count &&
           (chars[afterFrom].isLetter || chars[afterFrom].isNumber || chars[afterFrom] == "_") {
            return nil
        }
        return afterFrom
    }

    private static func matchQuotedString(_ chars: [Character], at start: Int) -> (String, Int)? {
        var j = start
        while j < chars.count && chars[j].isWhitespace { j += 1 }
        guard j < chars.count, chars[j] == "\"" || chars[j] == "'" else { return nil }
        let quote = chars[j]
        j += 1
        let strStart = j
        while j < chars.count && chars[j] != quote {
            if chars[j] == "\\" { j += 1 }
            j += 1
        }
        guard j < chars.count else { return nil }
        let str = String(chars[strStart..<j])
        return (str, j + 1)
    }

    private static func matchIdentifier(_ chars: [Character], at start: Int) -> (String, Int)? {
        var j = start
        guard j < chars.count,
              chars[j].isLetter || chars[j] == "_" || chars[j] == "$" else {
            return nil
        }
        j += 1
        while j < chars.count && (chars[j].isLetter || chars[j].isNumber || chars[j] == "_" || chars[j] == "$") {
            j += 1
        }
        return (String(chars[start..<j]), j)
    }

    private static func escapeForJS(_ string: String) -> String {
        string
            .replacingOccurrences(of: "\\", with: "\\\\")
            .replacingOccurrences(of: "\"", with: "\\\"")
    }
}
