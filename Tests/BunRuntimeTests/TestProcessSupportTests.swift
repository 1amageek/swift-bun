import Testing
@testable import BunRuntime
import TestHeartbeat

@Suite("TestProcessSupport", .serialized, .heartbeat)
struct TestProcessSupportTests {
    @Test func withLoadedProcessAllowsOptionalNone() async throws {
        let result: Int? = try await TestProcessSupport.withLoadedProcess { _ in
            Optional<Int>.none
        }

        #expect(result == nil)
    }

    @Test func withLoadedProcessAllowsOptionalSome() async throws {
        let result: Int? = try await TestProcessSupport.withLoadedProcess { _ in
            Optional(42)
        }

        #expect(result == 42)
    }
}
