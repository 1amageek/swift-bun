import Foundation
import Security

/// Intercepts `security` command invocations and handles them via native Keychain APIs.
///
/// When cli.js runs `execFile("security", ["find-generic-password", ...])`,
/// the `__cpRunSync` bridge normally spawns a `Process` (macOS only).
/// This bridge replaces that with `SecItemCopyMatching` / `SecItemAdd` / `SecItemDelete`,
/// which work on both macOS and iOS without subprocess spawning.
struct NativeKeychainBridge: Sendable {

    /// Attempts to handle a `security` command natively.
    ///
    /// - Parameters:
    ///   - args: The arguments to `security` (e.g. `["find-generic-password", "-a", "user", "-w", "-s", "svc"]`).
    /// - Returns: A result dictionary compatible with `__cpRunSync` output,
    ///   or `nil` if the subcommand is not supported.
    static func handleCommand(args: [String]) -> [String: Any]? {
        guard let subcommand = args.first else { return nil }

        let subArgs = Array(args.dropFirst())
        switch subcommand {
        case "find-generic-password":
            return handleFind(args: subArgs)
        case "add-generic-password":
            return handleAdd(args: subArgs)
        case "delete-generic-password":
            return handleDelete(args: subArgs)
        default:
            return nil
        }
    }

    /// Attempts to handle a shell-wrapped `security` command.
    ///
    /// Matches patterns like `/bin/sh -lc "security find-generic-password ..."`.
    /// - Parameter shellCommand: The shell command string.
    /// - Returns: A result dictionary, or `nil` if the command is not a `security` invocation.
    static func handleShellCommand(_ shellCommand: String) -> [String: Any]? {
        let trimmed = shellCommand.trimmingCharacters(in: .whitespaces)
        guard trimmed.hasPrefix("security ") else { return nil }

        let argString = String(trimmed.dropFirst("security ".count))
        let args = parseShellArguments(argString)
        return handleCommand(args: args)
    }

    // MARK: - Subcommand handlers

    private static func handleFind(args: [String]) -> [String: Any] {
        let parsed = parseSecurityFlags(args)
        let account = parsed["-a"]
        let service = parsed["-s"]
        let outputPassword = parsed.keys.contains("-w")

        var query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecReturnData as String: true,
            kSecMatchLimit as String: kSecMatchLimitOne,
        ]
        if let service { query[kSecAttrService as String] = service }
        if let account { query[kSecAttrAccount as String] = account }

        var result: AnyObject?
        let status = SecItemCopyMatching(query as CFDictionary, &result)

        guard status == errSecSuccess, let data = result as? Data else {
            return failure("security: SecItemCopyMatching failed (OSStatus: \(status))")
        }

        let password = String(data: data, encoding: .utf8) ?? ""
        if outputPassword {
            return success(stdout: password)
        }
        // Without -w, return minimal info (actual `security` outputs multi-line detail)
        return success(stdout: password)
    }

    private static func handleAdd(args: [String]) -> [String: Any] {
        let parsed = parseSecurityFlags(args)
        let account = parsed["-a"]
        let service = parsed["-s"]
        let update = parsed.keys.contains("-U")

        // Determine password data: -X takes hex, -w takes string
        let passwordData: Data?
        if let hex = parsed["-X"] {
            passwordData = dataFromHex(hex)
        } else if let pw = parsed["-w"] {
            passwordData = pw.data(using: .utf8)
        } else {
            return failure("security: add-generic-password requires -X or -w")
        }

        guard let passwordData else {
            return failure("security: failed to decode password data")
        }

        var attributes: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecValueData as String: passwordData,
        ]
        if let service { attributes[kSecAttrService as String] = service }
        if let account { attributes[kSecAttrAccount as String] = account }

        if update {
            // Try to update existing item first
            var searchQuery: [String: Any] = [
                kSecClass as String: kSecClassGenericPassword,
            ]
            if let service { searchQuery[kSecAttrService as String] = service }
            if let account { searchQuery[kSecAttrAccount as String] = account }

            let updateAttributes: [String: Any] = [kSecValueData as String: passwordData]
            let updateStatus = SecItemUpdate(searchQuery as CFDictionary, updateAttributes as CFDictionary)

            if updateStatus == errSecSuccess {
                return success(stdout: "")
            }
            if updateStatus != errSecItemNotFound {
                return failure("security: SecItemUpdate failed (OSStatus: \(updateStatus))")
            }
            // Item not found — fall through to add
        }

        let addStatus = SecItemAdd(attributes as CFDictionary, nil)
        guard addStatus == errSecSuccess else {
            return failure("security: SecItemAdd failed (OSStatus: \(addStatus))")
        }
        return success(stdout: "")
    }

    private static func handleDelete(args: [String]) -> [String: Any] {
        let parsed = parseSecurityFlags(args)
        let account = parsed["-a"]
        let service = parsed["-s"]

        var query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
        ]
        if let service { query[kSecAttrService as String] = service }
        if let account { query[kSecAttrAccount as String] = account }

        let status = SecItemDelete(query as CFDictionary)
        guard status == errSecSuccess || status == errSecItemNotFound else {
            return failure("security: SecItemDelete failed (OSStatus: \(status))")
        }
        return success(stdout: "")
    }

    // MARK: - Helpers

    private static func success(stdout: String) -> [String: Any] {
        ["status": Int32(0), "signal": NSNull(), "stdout": stdout, "stderr": ""]
    }

    private static func failure(_ message: String) -> [String: Any] {
        ["status": Int32(1), "signal": NSNull(), "stdout": "", "stderr": message]
    }

    /// Parses `security` command flags into a dictionary.
    ///
    /// Flags like `-a value`, `-s value`, `-X value`, `-w value` produce `["-a": "value", ...]`.
    /// Standalone flags like `-w` (no value) or `-U` produce `["-w": "", "-U": ""]`.
    private static func parseSecurityFlags(_ args: [String]) -> [String: String] {
        var result: [String: String] = [:]
        var i = 0
        while i < args.count {
            let arg = args[i]
            guard arg.hasPrefix("-") else { i += 1; continue }

            // Flags that take a value argument
            let valuedFlags: Set<String> = ["-a", "-s", "-X", "-l", "-D", "-j"]
            if valuedFlags.contains(arg) {
                if i + 1 < args.count {
                    result[arg] = args[i + 1]
                    i += 2
                } else {
                    // Flag at end without value — treat as standalone
                    result[arg] = ""
                    i += 1
                }
            } else {
                // Standalone flags (-U, etc.)
                result[arg] = ""
                i += 1
            }
        }
        return result
    }

    /// Parses a shell argument string, respecting double quotes.
    private static func parseShellArguments(_ command: String) -> [String] {
        var args: [String] = []
        var current = ""
        var inQuotes = false
        var escaped = false

        for char in command {
            if escaped {
                current.append(char)
                escaped = false
            } else if char == "\\" {
                escaped = true
            } else if char == "\"" {
                inQuotes.toggle()
            } else if char == " " && !inQuotes {
                if !current.isEmpty {
                    args.append(current)
                    current = ""
                }
            } else {
                current.append(char)
            }
        }
        if !current.isEmpty { args.append(current) }
        return args
    }

    /// Decodes a hex string into `Data`.
    private static func dataFromHex(_ hex: String) -> Data? {
        let chars = Array(hex)
        guard chars.count.isMultiple(of: 2) else { return nil }
        var data = Data(capacity: chars.count / 2)
        for i in stride(from: 0, to: chars.count, by: 2) {
            guard let byte = UInt8(String(chars[i ... i + 1]), radix: 16) else { return nil }
            data.append(byte)
        }
        return data
    }
}
