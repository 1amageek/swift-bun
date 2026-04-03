import Foundation

/// Executes a very small set of host capabilities used by higher-level JS
/// bundles without exposing general subprocess execution.
final class BuiltinCommandBridge: Sendable {
    private struct CommandResult: Encodable {
        var status: Int32
        var signal: String?
        var stdout: String
        var stderr: String
        var error: String?
    }

    private struct CommandOptions {
        var cwd: String?
    }

    private enum Command {
        case security(args: [String])
        case shellSecurity(command: String)
        case ripgrepFiles(roots: [String], includeHidden: Bool, cwd: String?)
    }

    private let completeOnJSThread: @Sendable (Int32, String) -> Void
    private let onOperationStarted: @Sendable (Int32, String) -> Void

    init(
        completeOnJSThread: @escaping @Sendable (Int32, String) -> Void,
        onOperationStarted: @escaping @Sendable (Int32, String) -> Void = { _, _ in }
    ) {
        self.completeOnJSThread = completeOnJSThread
        self.onOperationStarted = onOperationStarted
    }

    @discardableResult
    func start(file: String, argsJSON: String, optionsJSON: String, requestID: Int32) -> Bool {
        do {
            guard let command = try Self.parseCommand(file: file, argsJSON: argsJSON, optionsJSON: optionsJSON) else {
                return false
            }
            guard case .ripgrepFiles = command else {
                return false
            }

            onOperationStarted(requestID, Self.visibleHandleKind(for: command))
            Task.detached(priority: .utility) { [completeOnJSThread] in
                let result = Self.run(command)
                completeOnJSThread(requestID, Self.encodeJSON(result))
            }
            return true
        } catch {
            let result = CommandResult(
                status: 1,
                signal: nil,
                stdout: "",
                stderr: "",
                error: "Invalid child_process arguments: \(error)"
            )
            onOperationStarted(requestID, "childProcess")
            completeOnJSThread(requestID, Self.encodeJSON(result))
            return true
        }
    }

    static func runSync(file: String, argsJSON: String, optionsJSON: String) -> [String: Any]? {
        do {
            guard let command = try parseCommand(file: file, argsJSON: argsJSON, optionsJSON: optionsJSON) else {
                return nil
            }
            return dictionary(from: run(command))
        } catch {
            return ["error": "Invalid child_process arguments: \(error)"]
        }
    }

    private static func parseCommand(file: String, argsJSON: String, optionsJSON: String) throws -> Command? {
        let args = try parseStringArray(json: argsJSON)
        let options = try parseOptions(json: optionsJSON)

        if file == "security" || file.hasSuffix("/security") {
            return .security(args: args)
        }

        if (file == "/bin/sh" || file == "/bin/bash" || file.hasSuffix("/sh") || file.hasSuffix("/bash")),
           args.count >= 2,
           args[0] == "-c" || args[0] == "-lc" {
            let shellCommand = args[1]
            if NativeKeychainBridge.handleShellCommand(shellCommand) != nil {
                return .shellSecurity(command: shellCommand)
            }
        }

        if URL(fileURLWithPath: file).lastPathComponent == "rg" || file == "rg" {
            return parseRipgrepCommand(arguments: args, options: options)
        }

        return nil
    }

    private static func parseRipgrepCommand(arguments: [String], options: CommandOptions) -> Command? {
        guard arguments.contains("--files") else { return nil }
        let includeHidden = arguments.contains("--hidden")
        let roots = arguments.filter { !$0.hasPrefix("-") }
        return .ripgrepFiles(roots: roots, includeHidden: includeHidden, cwd: options.cwd)
    }

    private static func run(_ command: Command) -> CommandResult {
        switch command {
        case .security(let args):
            return commandResult(from: NativeKeychainBridge.handleCommand(args: args) ?? unsupportedResult())

        case .shellSecurity(let command):
            return commandResult(from: NativeKeychainBridge.handleShellCommand(command) ?? unsupportedResult())

        case .ripgrepFiles(let roots, let includeHidden, let cwd):
            return runRipgrepFiles(roots: roots, includeHidden: includeHidden, cwd: cwd)
        }
    }

    private static func runRipgrepFiles(roots: [String], includeHidden: Bool, cwd: String?) -> CommandResult {
        let baseDirectory = cwd ?? FileManager.default.currentDirectoryPath
        let searchRoots = roots.isEmpty ? [baseDirectory] : roots

        do {
            var files: [String] = []
            for root in searchRoots {
                let resolvedRoot = resolve(root, relativeTo: baseDirectory)
                files.append(contentsOf: try enumerateFiles(at: resolvedRoot, includeHidden: includeHidden))
            }
            files.sort()
            let stdout = files.isEmpty ? "" : files.joined(separator: "\n") + "\n"
            return CommandResult(status: 0, signal: nil, stdout: stdout, stderr: "", error: nil)
        } catch {
            return CommandResult(
                status: 1,
                signal: nil,
                stdout: "",
                stderr: "",
                error: "rg bridge failed: \(error.localizedDescription)"
            )
        }
    }

    private static func enumerateFiles(at rootPath: String, includeHidden: Bool) throws -> [String] {
        let rootURL = URL(fileURLWithPath: rootPath)
        let values = try rootURL.resourceValues(forKeys: [.isDirectoryKey, .isRegularFileKey, .isSymbolicLinkKey, .isHiddenKey])
        if values.isDirectory != true {
            return [rootURL.path]
        }

        var results: [String] = []
        let keys: [URLResourceKey] = [.isDirectoryKey, .isRegularFileKey, .isSymbolicLinkKey, .isHiddenKey, .nameKey]
        let options: FileManager.DirectoryEnumerationOptions = includeHidden ? [] : [.skipsHiddenFiles]
        guard let enumerator = FileManager.default.enumerator(
            at: rootURL,
            includingPropertiesForKeys: keys,
            options: options,
            errorHandler: { _, _ in true }
        ) else {
            return results
        }

        for case let url as URL in enumerator {
            let resourceValues = try url.resourceValues(forKeys: Set(keys))
            if resourceValues.name == ".git", resourceValues.isDirectory == true {
                enumerator.skipDescendants()
                continue
            }
            if resourceValues.isRegularFile == true || resourceValues.isSymbolicLink == true {
                results.append(url.path)
            }
        }

        return results
    }

    private static func resolve(_ path: String, relativeTo baseDirectory: String) -> String {
        if path.hasPrefix("/") {
            return URL(fileURLWithPath: path).standardizedFileURL.path
        }
        return URL(fileURLWithPath: baseDirectory)
            .appendingPathComponent(path)
            .standardizedFileURL
            .path
    }

    private static func visibleHandleKind(for command: Command) -> String {
        switch command {
        case .security, .shellSecurity:
            return "childProcess.security"
        case .ripgrepFiles:
            return "childProcess.rg"
        }
    }

    private static func parseStringArray(json: String) throws -> [String] {
        guard let data = json.data(using: .utf8), !json.isEmpty else { return [] }
        let object = try JSONSerialization.jsonObject(with: data)
        guard let array = object as? [Any] else { return [] }
        return array.map { "\($0)" }
    }

    private static func parseOptions(json: String) throws -> CommandOptions {
        guard let data = json.data(using: .utf8), !json.isEmpty else { return CommandOptions() }
        let object = try JSONSerialization.jsonObject(with: data)
        let dictionary = object as? [String: Any] ?? [:]
        return CommandOptions(cwd: dictionary["cwd"] as? String)
    }

    private static func unsupportedResult() -> [String: Any] {
        ["error": "node:child_process command is not supported in swift-bun"]
    }

    private static func commandResult(from dictionary: [String: Any]) -> CommandResult {
        CommandResult(
            status: dictionary["status"] as? Int32 ?? Int32(dictionary["status"] as? Int ?? 0),
            signal: dictionary["signal"] as? String,
            stdout: dictionary["stdout"] as? String ?? "",
            stderr: dictionary["stderr"] as? String ?? "",
            error: dictionary["error"] as? String
        )
    }

    private static func dictionary(from result: CommandResult) -> [String: Any] {
        var dictionary: [String: Any] = [
            "status": result.status,
            "signal": result.signal as Any,
            "stdout": result.stdout,
            "stderr": result.stderr,
        ]
        if let error = result.error {
            dictionary["error"] = error
        }
        return dictionary
    }

    private static func encodeJSON(_ result: CommandResult) -> String {
        let encoder = JSONEncoder()
        guard let data = try? encoder.encode(result),
              let string = String(data: data, encoding: .utf8) else {
            return #"{"status":1,"signal":null,"stdout":"","stderr":"","error":"Failed to encode builtin command result"}"#
        }
        return string
    }
}
