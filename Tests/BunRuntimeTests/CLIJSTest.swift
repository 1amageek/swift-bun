import Testing
import Foundation
@testable import BunRuntime

@Suite("CLI JS Transform")
struct CLIJSTest {

    private func loadCLI() throws -> String? {
        let path = NSHomeDirectory() + "/Library/Caches/claude-code/package/cli.js"
        guard FileManager.default.fileExists(atPath: path) else { return nil }
        return try String(contentsOfFile: path, encoding: .utf8)
    }

    private let url = URL(fileURLWithPath:
        NSHomeDirectory() + "/Library/Caches/claude-code/package/cli.js")

    @Test func firstImportTransformed() throws {
        guard let source = try loadCLI() else { return }
        let result = SourceTransformer.transformForJSC(source, bundleURL: url)
        let head = String(result.prefix(600))
        #expect(head.contains("var{createRequire"))
        #expect(!head.contains("import{createRequire"))
    }

    @Test func noRemainingStaticImports() throws {
        guard let source = try loadCLI() else { return }
        let result = SourceTransformer.transformForJSC(source, bundleURL: url)
        let chars = Array(result)
        var inCodeImports: [(Int, String)] = []

        for i in 0..<(chars.count - 7) {
            guard chars[i] == "i", chars[i+1] == "m", chars[i+2] == "p",
                  chars[i+3] == "o", chars[i+4] == "r", chars[i+5] == "t" else { continue }
            if i > 0 {
                let prev = chars[i-1]
                if prev.isLetter || prev.isNumber || prev == "_" || prev == "$" || prev == "." { continue }
            }
            let next = i + 6
            guard next < chars.count else { continue }
            let c = chars[next]
            guard c == "{" || c == "*" || (c == " " && next+1 < chars.count && (chars[next+1].isLetter || chars[next+1] == "_")) else { continue }

            let lookahead = String(chars[i..<min(chars.count, i + 200)])
            if lookahead.range(of: #"from\s*["']"#, options: .regularExpression) != nil {
                let ctx = String(chars[max(0,i-20)..<min(chars.count,i+60)])
                inCodeImports.append((i, ctx))
            }
        }

        print("In-code static imports remaining: \(inCodeImports.count)")
        for (pos, ctx) in inCodeImports.prefix(5) {
            print("  [\(pos)] \(ctx)")
        }
        #expect(inCodeImports.isEmpty, "Found \(inCodeImports.count) untransformed static imports in code")
    }
}
