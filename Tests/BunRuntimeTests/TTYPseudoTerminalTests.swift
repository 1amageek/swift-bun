import Testing
import Foundation
@testable import BunRuntime
import TestHeartbeat

@Suite("TTY Pseudo Terminal", .serialized, .heartbeat)
struct TTYPseudoTerminalTests {
    @Test("tty detects pseudo terminal descriptors and reports window size")
    func ttyDetectsPseudoTerminal() async throws {
        let terminal = try PseudoTerminal(columns: 132, rows: 43)
        defer { terminal.close() }

        let result = try await TestProcessSupport.evaluate("""
            (function() {
                var tty = require('node:tty');
                var stream = new tty.WriteStream(\(terminal.slave));
                return JSON.stringify({
                    isTTY: tty.isatty(\(terminal.slave)),
                    streamTTY: stream.isTTY,
                    columns: stream.columns,
                    rows: stream.rows,
                    windowSize: stream.getWindowSize()
                });
            })()
        """)

        let data = try #require(result.stringValue.data(using: .utf8))
        let payload = try #require(JSONSerialization.jsonObject(with: data) as? [String: Any])
        #expect(payload["isTTY"] as? Bool == true)
        #expect(payload["streamTTY"] as? Bool == true)
        #expect(payload["columns"] as? Int == 132)
        #expect(payload["rows"] as? Int == 43)
        #expect((payload["windowSize"] as? [Int]) == [132, 43])
    }

    @Test("tty raw mode toggles pseudo terminal termios state")
    func ttyRawModeTogglesTermios() async throws {
        let terminal = try PseudoTerminal()
        defer { terminal.close() }

        let original = try terminal.termiosAttributes()

        let result = try await TestProcessSupport.evaluate("""
            (function() {
                var tty = require('node:tty');
                var input = new tty.ReadStream(\(terminal.slave));
                input.setRawMode(true);
                var rawEnabled = input.isRaw;
                input.setRawMode(false);
                return JSON.stringify({
                    rawEnabled: rawEnabled,
                    rawDisabled: input.isRaw,
                    streamTTY: input.isTTY
                });
            })()
        """)

        let restored = try terminal.termiosAttributes()
        let data = try #require(result.stringValue.data(using: .utf8))
        let payload = try #require(JSONSerialization.jsonObject(with: data) as? [String: Any])
        #expect(payload["streamTTY"] as? Bool == true)
        #expect(payload["rawEnabled"] as? Bool == true)
        #expect(payload["rawDisabled"] as? Bool == false)
        #expect(original.c_lflag == restored.c_lflag)
        #expect(original.c_iflag == restored.c_iflag)
        #expect(original.c_oflag == restored.c_oflag)
        #expect(original.c_cflag == restored.c_cflag)
    }
}
