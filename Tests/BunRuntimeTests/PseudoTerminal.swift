import Foundation
#if canImport(Darwin)
import Darwin
#endif

struct PseudoTerminal {
    let master: Int32
    let slave: Int32

    init(columns: UInt16 = 100, rows: UInt16 = 40) throws {
        #if canImport(Darwin)
        var master: Int32 = -1
        var slave: Int32 = -1
        var windowSize = winsize(ws_row: rows, ws_col: columns, ws_xpixel: 0, ws_ypixel: 0)
        let result = openpty(&master, &slave, nil, nil, &windowSize)
        guard result == 0 else {
            throw POSIXError(POSIXErrorCode(rawValue: errno) ?? .EIO)
        }
        self.master = master
        self.slave = slave
        #else
        throw CocoaError(.featureUnsupported)
        #endif
    }

    func close() {
        #if canImport(Darwin)
        Darwin.close(master)
        Darwin.close(slave)
        #endif
    }

    func currentWindowSize() throws -> (columns: Int, rows: Int) {
        #if canImport(Darwin)
        var size = winsize()
        guard ioctl(slave, TIOCGWINSZ, &size) == 0 else {
            throw POSIXError(POSIXErrorCode(rawValue: errno) ?? .EIO)
        }
        return (Int(size.ws_col), Int(size.ws_row))
        #else
        throw CocoaError(.featureUnsupported)
        #endif
    }

    func termiosAttributes() throws -> termios {
        #if canImport(Darwin)
        var attributes = termios()
        guard tcgetattr(slave, &attributes) == 0 else {
            throw POSIXError(POSIXErrorCode(rawValue: errno) ?? .EIO)
        }
        return attributes
        #else
        throw CocoaError(.featureUnsupported)
        #endif
    }
}
