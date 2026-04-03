import Foundation

/// Merges host environment variables with runtime overrides.
struct RuntimeEnvironment: Sendable {
    let values: [String: String]

    init(overrides: [String: String] = [:], removing removedKeys: Set<String> = []) {
        var merged = ProcessInfo.processInfo.environment
        for key in removedKeys {
            merged.removeValue(forKey: key)
        }
        for (key, value) in overrides {
            if removedKeys.contains(key) {
                continue
            }
            merged[key] = value
        }
        self.values = merged
    }

    subscript(key: String) -> String? {
        values[key]
    }

    var homeDirectory: String {
        if let configuredHome = values["HOME"], !configuredHome.isEmpty {
            return configuredHome
        }
        return NSHomeDirectory()
    }

    var temporaryDirectory: String {
        if let configuredTmp = values["TMPDIR"], !configuredTmp.isEmpty {
            return configuredTmp
        }
        return NSTemporaryDirectory()
    }
}
