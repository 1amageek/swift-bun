@preconcurrency import JavaScriptCore

/// `node:timers` and `node:timers/promises` polyfill.
///
/// JavaScriptCore has built-in `setTimeout`/`setInterval` support,
/// so this module wraps them in the Node.js module shape.
enum NodeTimers: JavaScriptResourceBackedInstaller {
    static let script: JavaScriptResource.Script = .nodeCompat(.timers)
}
