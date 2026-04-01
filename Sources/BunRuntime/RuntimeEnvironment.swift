import Foundation

/// Merges host environment variables with runtime overrides.
struct RuntimeEnvironment: Sendable {
    let values: [String: String]

    init(overrides: [String: String] = [:]) {
        var merged = ProcessInfo.processInfo.environment
        for (key, value) in overrides {
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
