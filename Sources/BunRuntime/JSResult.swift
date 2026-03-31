@preconcurrency import JavaScriptCore

/// A Sendable representation of a JavaScript value.
///
/// Since `JSValue` from JavaScriptCore is not `Sendable`,
/// this type captures the essential value for safe use across isolation boundaries.
public enum JSResult: Sendable, Equatable {
    case undefined
    case null
    case bool(Bool)
    case number(Double)
    case string(String)
    case json(String)

    init(from jsValue: JSValue?) {
        guard let jsValue, !jsValue.isUndefined else {
            self = .undefined
            return
        }
        if jsValue.isNull {
            self = .null
            return
        }
        if jsValue.isBoolean {
            self = .bool(jsValue.toBool())
            return
        }
        if jsValue.isNumber {
            self = .number(jsValue.toDouble())
            return
        }
        if jsValue.isString {
            self = .string(jsValue.toString())
            return
        }
        // Objects and arrays: serialize to JSON
        if jsValue.isObject || jsValue.isArray {
            if let ctx = jsValue.context,
               let jsonStringify = ctx.objectForKeyedSubscript("JSON")?.objectForKeyedSubscript("stringify"),
               let jsonStr = jsonStringify.call(withArguments: [jsValue]) {
                if jsonStr.isString {
                    self = .json(jsonStr.toString())
                    return
                }
            }
        }
        self = .string(jsValue.toString() ?? "")
    }

    // MARK: - Convenience Accessors

    /// Returns the value as `Int32`, converting if necessary.
    public var int32Value: Int32 {
        switch self {
        case .number(let d): return Int32(d)
        case .string(let s): return Int32(s) ?? 0
        case .bool(let b): return b ? 1 : 0
        default: return 0
        }
    }

    /// Returns the value as `Double`, converting if necessary.
    public var doubleValue: Double {
        switch self {
        case .number(let d): return d
        case .string(let s): return Double(s) ?? .nan
        case .bool(let b): return b ? 1.0 : 0.0
        default: return .nan
        }
    }

    /// Returns the value as `String`.
    public var stringValue: String {
        switch self {
        case .string(let s): return s
        case .number(let d):
            if d == d.rounded() && d < Double(Int64.max) && d > Double(Int64.min) {
                return String(Int64(d))
            }
            return String(d)
        case .bool(let b): return b ? "true" : "false"
        case .json(let j): return j
        case .null: return "null"
        case .undefined: return "undefined"
        }
    }

    /// Returns the value as `Bool`, converting if necessary.
    public var boolValue: Bool {
        switch self {
        case .bool(let b): return b
        case .number(let d): return d != 0
        case .string(let s): return !s.isEmpty
        case .null, .undefined: return false
        case .json: return true
        }
    }

    /// Returns `true` if the value is `undefined`.
    public var isUndefined: Bool {
        if case .undefined = self { return true }
        return false
    }

    /// Returns `true` if the value is `null`.
    public var isNull: Bool {
        if case .null = self { return true }
        return false
    }
}
