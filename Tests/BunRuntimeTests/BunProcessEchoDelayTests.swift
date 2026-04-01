import Testing
import Foundation
import Synchronization
@testable import BunRuntime
import TestHeartbeat

@Suite("BunProcess Echo Delay", .serialized, .heartbeat)
struct BunProcessEchoDelayTests {

    @Test(.tags(.slow), .timeLimit(.minutes(1)))
    func echoDelayRoundTrip() async throws {
        guard let url = Bundle.module.url(forResource: "echo-delay", withExtension: "js") else {
            Issue.record("echo-delay.js not found in test bundle")
            return
        }

        let bp = BunProcess(bundle: url)
        let collected = LinesCollector()

        // Collect stdout
        let stdoutTask = Task {
            for await line in bp.stdout {
                collected.append(line)
            }
        }

        // Collect diagnostic output
        let diagTask = Task {
            for await line in bp.output {
                // Print for debugging
                print("[echo-test] \(line)")
            }
        }

        // Run in background
        let runTask = Task {
            try await bp.run()
        }

        // Wait for JS to initialize
        try await Task.sleep(for: .milliseconds(500))

        // Send input
        let message = "hello world"
        bp.sendInput(Data((message + "\n").utf8))

        // Wait for the 1.5s delay + margin
        try await Task.sleep(for: .seconds(3))

        // Check stdout received the echo
        let lines = collected.values
        print("[echo-test] collected stdout lines: \(lines)")
        #expect(lines.contains(where: { $0.contains("hello world") }),
                "Expected 'hello world' in stdout, got: \(lines)")

        // Send EOF and wait for exit
        bp.sendInput(nil)
        let exitCode = try await runTask.value
        #expect(exitCode == 0)

        stdoutTask.cancel()
        diagTask.cancel()
    }

    @Test(.tags(.slow), .timeLimit(.minutes(1)))
    func echoDelayMultipleLines() async throws {
        guard let url = Bundle.module.url(forResource: "echo-delay", withExtension: "js") else {
            return
        }

        let bp = BunProcess(bundle: url)
        let collected = LinesCollector()

        Task { for await line in bp.stdout { collected.append(line) } }

        let runTask = Task { try await bp.run() }

        try await Task.sleep(for: .milliseconds(500))

        // Send multiple lines
        bp.sendInput(Data("line1\nline2\nline3\n".utf8))

        // Wait for all echoes (1.5s delay)
        try await Task.sleep(for: .seconds(3))

        let lines = collected.values
        print("[echo-test] multi-line collected: \(lines)")
        #expect(lines.count >= 3, "Expected 3 lines, got \(lines.count): \(lines)")

        bp.sendInput(nil)
        let exitCode = try await runTask.value
        #expect(exitCode == 0)
    }
}
