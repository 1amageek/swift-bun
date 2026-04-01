import Foundation
import Testing
@testable import BunRuntime

@Suite("Native Keychain Bridge", .serialized)
struct NativeKeychainBridgeTests {
    #if os(macOS)
    @Test("add-generic-password preserves -w password value")
    func addGenericPasswordWithWValue() throws {
        let service = "swift-bun-keychain-\(UUID().uuidString)"
        let account = "user-\(UUID().uuidString)"
        let password = "secret value with spaces"
        defer {
            _ = NativeKeychainBridge.handleCommand(args: [
                "delete-generic-password",
                "-s", service,
                "-a", account,
            ])
        }

        let addResult = try #require(NativeKeychainBridge.handleCommand(args: [
            "add-generic-password",
            "-s", service,
            "-a", account,
            "-w", password,
            "-U",
        ]))
        #expect(addResult["status"] as? Int32 == 0)

        let findResult = try #require(NativeKeychainBridge.handleCommand(args: [
            "find-generic-password",
            "-s", service,
            "-a", account,
            "-w",
        ]))
        #expect(findResult["status"] as? Int32 == 0)
        #expect(findResult["stdout"] as? String == password)
    }

    @Test("find-generic-password without -w does not expose password")
    func findGenericPasswordWithoutWDoesNotLeak() throws {
        let service = "swift-bun-keychain-\(UUID().uuidString)"
        let account = "user-\(UUID().uuidString)"
        let password = "top-secret"
        defer {
            _ = NativeKeychainBridge.handleCommand(args: [
                "delete-generic-password",
                "-s", service,
                "-a", account,
            ])
        }

        _ = try #require(NativeKeychainBridge.handleCommand(args: [
            "add-generic-password",
            "-s", service,
            "-a", account,
            "-w", password,
            "-U",
        ]))

        let result = try #require(NativeKeychainBridge.handleCommand(args: [
            "find-generic-password",
            "-s", service,
            "-a", account,
        ]))
        #expect(result["status"] as? Int32 == 0)
        let stdout = result["stdout"] as? String ?? ""
        #expect(stdout.contains(password) == false)
        #expect(stdout.contains(service))
        #expect(stdout.contains(account))
    }

    @Test("shell parser supports single quoted values")
    func shellParserSupportsSingleQuotes() throws {
        let service = "swift bun svc \(UUID().uuidString)"
        let account = "swift bun account \(UUID().uuidString)"
        let password = "secret phrase"
        defer {
            _ = NativeKeychainBridge.handleCommand(args: [
                "delete-generic-password",
                "-s", service,
                "-a", account,
            ])
        }

        let addCommand = "security add-generic-password -s '\(service)' -a '\(account)' -w '\(password)' -U"
        let addResult = try #require(NativeKeychainBridge.handleShellCommand(addCommand))
        #expect(addResult["status"] as? Int32 == 0)

        let findCommand = "security find-generic-password -s '\(service)' -a '\(account)' -w"
        let findResult = try #require(NativeKeychainBridge.handleShellCommand(findCommand))
        #expect(findResult["status"] as? Int32 == 0)
        #expect(findResult["stdout"] as? String == password)
    }
    #endif
}
