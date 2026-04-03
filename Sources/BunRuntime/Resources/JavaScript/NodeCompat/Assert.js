(function() {
    if (!globalThis.__nodeModules) globalThis.__nodeModules = {};

    function assertionMessage(message, fallback) {
        return message === undefined ? fallback : String(message);
    }

    function isBufferLike(value) {
        return value instanceof ArrayBuffer || ArrayBuffer.isView(value);
    }

    function cloneBufferLike(value) {
        if (value instanceof ArrayBuffer) {
            return value.slice(0);
        }
        return value.buffer.slice(value.byteOffset, value.byteOffset + value.byteLength);
    }

    function createInvalidArgValueError(name, value, message) {
        var error = new TypeError('The argument \'' + name + '\' ' + String(message || 'is invalid') + '. Received ' + String(value));
        error.code = 'ERR_INVALID_ARG_VALUE';
        return error;
    }

    function createOutOfRangeError(name, range, value) {
        var error = new RangeError('The value of "' + name + '" is out of range. It must be ' + range + '. Received ' + String(value));
        error.code = 'ERR_OUT_OF_RANGE';
        return error;
    }

    function isMap(value) {
        return value instanceof Map;
    }

    function isSet(value) {
        return value instanceof Set;
    }

    function deepEqual(left, right, strict, seen) {
        if (left === right) return true;
        if (!strict && left == right) return true;
        if (left === null || right === null || typeof left !== 'object' || typeof right !== 'object') {
            return false;
        }

        for (var i = 0; i < seen.length; i++) {
            if (seen[i][0] === left && seen[i][1] === right) {
                return true;
            }
        }
        seen.push([left, right]);

        try {
            if (left instanceof Date && right instanceof Date) {
                return left.getTime() === right.getTime();
            }
            if (left instanceof RegExp && right instanceof RegExp) {
                return left.source === right.source && left.flags === right.flags;
            }
            if (isBufferLike(left) && isBufferLike(right)) {
                var leftBytes = new Uint8Array(cloneBufferLike(left));
                var rightBytes = new Uint8Array(cloneBufferLike(right));
                if (leftBytes.byteLength !== rightBytes.byteLength) return false;
                for (var j = 0; j < leftBytes.byteLength; j++) {
                    if (leftBytes[j] !== rightBytes[j]) return false;
                }
                return true;
            }
            if (isMap(left) || isMap(right)) {
                if (!isMap(left) || !isMap(right) || left.size !== right.size) return false;
                var leftEntries = Array.from(left.entries());
                var rightEntries = Array.from(right.entries());
                for (var lm = 0; lm < leftEntries.length; lm++) {
                    var matchedMapEntry = false;
                    for (var rm = 0; rm < rightEntries.length; rm++) {
                        if (deepEqual(leftEntries[lm][0], rightEntries[rm][0], strict, seen) &&
                            deepEqual(leftEntries[lm][1], rightEntries[rm][1], strict, seen)) {
                            matchedMapEntry = true;
                            break;
                        }
                    }
                    if (!matchedMapEntry) return false;
                }
                return true;
            }
            if (isSet(left) || isSet(right)) {
                if (!isSet(left) || !isSet(right) || left.size !== right.size) return false;
                var leftValues = Array.from(left.values());
                var rightValues = Array.from(right.values());
                var used = new Array(rightValues.length);
                for (var ls = 0; ls < leftValues.length; ls++) {
                    var matchedSetEntry = false;
                    for (var rs = 0; rs < rightValues.length; rs++) {
                        if (!used[rs] && deepEqual(leftValues[ls], rightValues[rs], strict, seen)) {
                            used[rs] = true;
                            matchedSetEntry = true;
                            break;
                        }
                    }
                    if (!matchedSetEntry) return false;
                }
                return true;
            }
            if (Array.isArray(left) !== Array.isArray(right)) return false;
            if (Array.isArray(left)) {
                if (left.length !== right.length) return false;
                for (var k = 0; k < left.length; k++) {
                    if (!deepEqual(left[k], right[k], strict, seen)) return false;
                }
                return true;
            }

            var leftKeys = Object.keys(left);
            var rightKeys = Object.keys(right);
            if (leftKeys.length !== rightKeys.length) return false;
            for (var m = 0; m < leftKeys.length; m++) {
                var key = leftKeys[m];
                if (!Object.prototype.hasOwnProperty.call(right, key)) return false;
                if (!deepEqual(left[key], right[key], strict, seen)) return false;
            }
            return true;
        } finally {
            seen.pop();
        }
    }

    function partialDeepStrictEqual(actual, expected, seen) {
        if (actual === expected) return true;
        if (expected === null || typeof expected !== 'object') {
            return actual === expected;
        }
        if (actual === null || typeof actual !== 'object') {
            return false;
        }

        for (var i = 0; i < seen.length; i++) {
            if (seen[i][0] === actual && seen[i][1] === expected) {
                return true;
            }
        }
        seen.push([actual, expected]);

        try {
            if (expected instanceof Date || actual instanceof Date) {
                return actual instanceof Date && expected instanceof Date && actual.getTime() === expected.getTime();
            }
            if (expected instanceof RegExp || actual instanceof RegExp) {
                return actual instanceof RegExp && expected instanceof RegExp &&
                    actual.source === expected.source && actual.flags === expected.flags;
            }
            if (isBufferLike(actual) && isBufferLike(expected)) {
                var actualBytes = new Uint8Array(cloneBufferLike(actual));
                var expectedBytes = new Uint8Array(cloneBufferLike(expected));
                if (actualBytes.byteLength < expectedBytes.byteLength) return false;
                for (var j = 0; j < expectedBytes.byteLength; j++) {
                    if (actualBytes[j] !== expectedBytes[j]) return false;
                }
                return true;
            }
            if (isMap(expected) || isMap(actual)) {
                if (!isMap(actual) || !isMap(expected) || actual.size < expected.size) return false;
                var actualEntries = Array.from(actual.entries());
                var expectedEntries = Array.from(expected.entries());
                for (var mapIndex = 0; mapIndex < expectedEntries.length; mapIndex++) {
                    var expectedEntry = expectedEntries[mapIndex];
                    var matchedEntry = false;
                    for (var actualIndex = 0; actualIndex < actualEntries.length; actualIndex++) {
                        var actualEntry = actualEntries[actualIndex];
                        if (partialDeepStrictEqual(actualEntry[0], expectedEntry[0], seen) &&
                            partialDeepStrictEqual(actualEntry[1], expectedEntry[1], seen)) {
                            matchedEntry = true;
                            break;
                        }
                    }
                    if (!matchedEntry) return false;
                }
                return true;
            }
            if (isSet(expected) || isSet(actual)) {
                if (!isSet(actual) || !isSet(expected) || actual.size < expected.size) return false;
                var actualValues = Array.from(actual.values());
                var expectedValues = Array.from(expected.values());
                var matchedValues = new Array(actualValues.length);
                for (var setIndex = 0; setIndex < expectedValues.length; setIndex++) {
                    var matchedValue = false;
                    for (var valueIndex = 0; valueIndex < actualValues.length; valueIndex++) {
                        if (!matchedValues[valueIndex] &&
                            partialDeepStrictEqual(actualValues[valueIndex], expectedValues[setIndex], seen)) {
                            matchedValues[valueIndex] = true;
                            matchedValue = true;
                            break;
                        }
                    }
                    if (!matchedValue) return false;
                }
                return true;
            }
            if (Array.isArray(expected)) {
                if (!Array.isArray(actual) || actual.length < expected.length) return false;
                for (var k = 0; k < expected.length; k++) {
                    if (!partialDeepStrictEqual(actual[k], expected[k], seen)) return false;
                }
                return true;
            }

            var expectedKeys = Object.keys(expected);
            for (var m = 0; m < expectedKeys.length; m++) {
                var key = expectedKeys[m];
                if (!Object.prototype.hasOwnProperty.call(actual, key)) return false;
                if (!partialDeepStrictEqual(actual[key], expected[key], seen)) return false;
            }
            return true;
        } finally {
            seen.pop();
        }
    }

    function AssertionError(options) {
        options = options || {};
        this.name = 'AssertionError';
        this.code = 'ERR_ASSERTION';
        this.actual = options.actual;
        this.expected = options.expected;
        this.operator = options.operator || '==';
        this.generatedMessage = options.generatedMessage !== undefined ? options.generatedMessage : options.message === undefined;
        this.message = assertionMessage(options.message, 'Assertion failed');
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, options.stackStartFn || AssertionError);
        } else {
            this.stack = new Error(this.message).stack;
        }
    }
    AssertionError.prototype = Object.create(Error.prototype);
    AssertionError.prototype.constructor = AssertionError;

    function defaultAssertionMessage(actual, expected, operator) {
        if (operator === 'strictEqual') {
            return 'Expected values to be strictly equal:\n\n' + String(actual) + ' !== ' + String(expected) + '\n';
        }
        if (operator === 'deepEqual') {
            return 'Expected values to be loosely deep-equal:';
        }
        if (operator === 'deepStrictEqual') {
            return 'Expected values to be strictly deep-equal:';
        }
        if (operator === 'notStrictEqual') {
            return 'Expected "actual" to be strictly unequal to: ' + String(actual);
        }
        if (operator === 'notDeepEqual') {
            return 'Expected "actual" not to be loosely deep-equal to:';
        }
        if (operator === 'notDeepStrictEqual') {
            return 'Expected "actual" not to be strictly deep-equal to:';
        }
        return 'Assertion failed';
    }

    function createAssertionError(actual, expected, operator, message, stackStartFn) {
        var generatedMessage = message === undefined;
        return new AssertionError({
            actual: actual,
            expected: expected,
            operator: operator,
            generatedMessage: generatedMessage,
            message: generatedMessage ? defaultAssertionMessage(actual, expected, operator) : message,
            stackStartFn: stackStartFn
        });
    }

    function assert(value, message) {
        if (!value) {
            throw createAssertionError(value, true, '==', message, assert);
        }
    }
    assert.AssertionError = AssertionError;
    assert.fail = function(message) {
        throw createAssertionError(undefined, undefined, 'fail', message || 'Assertion failed', assert.fail);
    };
    assert.ok = assert;
    assert.equal = function(actual, expected, message) {
        if (actual != expected) {
            throw createAssertionError(actual, expected, '==', message, assert.equal);
        }
    };
    assert.notEqual = function(actual, expected, message) {
        if (actual == expected) {
            throw createAssertionError(actual, expected, '!=', message, assert.notEqual);
        }
    };
    assert.strictEqual = function(actual, expected, message) {
        if (actual !== expected) {
            throw createAssertionError(actual, expected, 'strictEqual', message, assert.strictEqual);
        }
    };
    assert.notStrictEqual = function(actual, expected, message) {
        if (actual === expected) {
            throw createAssertionError(actual, expected, 'notStrictEqual', message, assert.notStrictEqual);
        }
    };
    assert.deepEqual = function(actual, expected, message) {
        if (!deepEqual(actual, expected, false, [])) {
            throw createAssertionError(actual, expected, 'deepEqual', message, assert.deepEqual);
        }
    };
    assert.deepStrictEqual = function(actual, expected, message) {
        if (!deepEqual(actual, expected, true, [])) {
            throw createAssertionError(actual, expected, 'deepStrictEqual', message, assert.deepStrictEqual);
        }
    };
    assert.partialDeepStrictEqual = function(actual, expected, message) {
        if (!partialDeepStrictEqual(actual, expected, [])) {
            throw createAssertionError(actual, expected, 'partialDeepStrictEqual', message, assert.partialDeepStrictEqual);
        }
    };
    assert.notDeepEqual = function(actual, expected, message) {
        if (deepEqual(actual, expected, false, [])) {
            throw createAssertionError(actual, expected, 'notDeepEqual', message, assert.notDeepEqual);
        }
    };
    assert.notDeepStrictEqual = function(actual, expected, message) {
        if (deepEqual(actual, expected, true, [])) {
            throw createAssertionError(actual, expected, 'notDeepStrictEqual', message, assert.notDeepStrictEqual);
        }
    };
    assert.ifError = function(error) {
        if (error !== null && error !== undefined) {
            throw error;
        }
    };

    function matchesExpectedError(error, expected) {
        if (!expected) return true;
        if (expected instanceof RegExp) {
            return expected.test(String(error && error.message ? error.message : error));
        }
        if (typeof expected === 'function') {
            if (expected.prototype instanceof Error || expected === Error) {
                return error instanceof expected;
            }
            return expected(error) === true;
        }
        if (typeof expected === 'object') {
            return partialDeepStrictEqual(error, expected, []);
        }
        return true;
    }

    assert.throws = function(fn, expected, message) {
        try {
            fn();
        } catch (error) {
            if (!matchesExpectedError(error, expected)) {
                throw createAssertionError(error, expected, 'throws', message || 'Unexpected error thrown', assert.throws);
            }
            return;
        }
        throw createAssertionError(undefined, expected, 'throws', message || 'Expected function to throw', assert.throws);
    };
    assert.doesNotThrow = function(fn, expected, message) {
        try {
            fn();
        } catch (error) {
            if (expected && !matchesExpectedError(error, expected)) {
                throw error;
            }
            throw createAssertionError(error, expected, 'doesNotThrow', message || ('Got unwanted exception.\nActual message: "' + error.message + '"'), assert.doesNotThrow);
        }
    };
    assert.rejects = function(fn, expected, message) {
        return Promise.resolve().then(function() {
            return typeof fn === 'function' ? fn() : fn;
        }).then(function() {
            throw createAssertionError(undefined, expected, 'rejects', message || 'Expected promise to reject', assert.rejects);
        }, function(error) {
            if (!matchesExpectedError(error, expected)) {
                throw createAssertionError(error, expected, 'rejects', message || 'Promise rejected with unexpected error', assert.rejects);
            }
        });
    };
    assert.doesNotReject = function(fn, expected, message) {
        return Promise.resolve().then(function() {
            return typeof fn === 'function' ? fn() : fn;
        }).catch(function(error) {
            if (expected && !matchesExpectedError(error, expected)) {
                throw error;
            }
            throw createAssertionError(error, expected, 'doesNotReject', message || ('Got unwanted rejection.\nActual message: "' + error.message + '"'), assert.doesNotReject);
        });
    };
    assert.match = function(actual, expected, message) {
        if (!(expected instanceof RegExp)) {
            throw new TypeError('The "expected" argument must be a RegExp');
        }
        if (!expected.test(String(actual))) {
            throw createAssertionError(actual, expected, 'match', message || 'Expected value to match regular expression', assert.match);
        }
    };
    assert.doesNotMatch = function(actual, expected, message) {
        if (!(expected instanceof RegExp)) {
            throw new TypeError('The "expected" argument must be a RegExp');
        }
        if (expected.test(String(actual))) {
            throw createAssertionError(actual, expected, 'doesNotMatch', message || 'Expected value not to match regular expression', assert.doesNotMatch);
        }
    };
    assert.fail = function(actual, expected, message, operator, stackStartFn) {
        if (arguments.length <= 1) {
            throw createAssertionError(undefined, undefined, 'fail', actual || 'Assertion failed', assert.fail);
        }
        throw new AssertionError({
            actual: actual,
            expected: expected,
            message: message,
            operator: operator || 'fail',
            stackStartFn: stackStartFn || assert.fail
        });
    };

    function CallTracker() {
        this._tracked = [];
    }
    CallTracker.prototype.calls = function(fn, exact) {
        if (typeof fn !== 'function') {
            exact = fn;
            fn = function() {};
        }
        var expected = exact === undefined ? 1 : Number(exact);
        if (!isFinite(expected) || Math.floor(expected) !== expected) {
            throw createOutOfRangeError('expected', 'an integer', exact);
        }
        if (expected < 1 || expected > 4294967295) {
            throw createOutOfRangeError('expected', '>= 1 && <= 4294967295', exact);
        }

        var state = {
            fn: fn,
            exact: expected,
            actual: 0,
            calls: [],
            tracked: null,
            stack: new Error(),
        };
        var self = this;
        state.tracked = function() {
            state.actual += 1;
            state.calls.push({
                arguments: Array.prototype.slice.call(arguments),
                thisArg: this
            });
            return fn.apply(this, arguments);
        };
        self._tracked.push(state);
        return state.tracked;
    };
    CallTracker.prototype._stateFor = function(tracked) {
        for (var i = 0; i < this._tracked.length; i++) {
            if (this._tracked[i].tracked === tracked) {
                return this._tracked[i];
            }
        }
        throw createInvalidArgValueError('tracked', tracked, 'is not a tracked function');
    };
    CallTracker.prototype._pendingFor = function(state) {
        if (state.actual === state.exact) return null;
        return {
            message: 'Expected the calls function to be executed ' + state.exact + ' time(s) but was executed ' + state.actual + ' time(s).',
            actual: state.actual,
            expected: state.exact,
            operator: 'calls',
            stack: state.stack
        };
    };
    CallTracker.prototype.getCalls = function(tracked) {
        return this._stateFor(tracked).calls.slice();
    };
    CallTracker.prototype.report = function(tracked) {
        if (tracked !== undefined) {
            var pending = this._pendingFor(this._stateFor(tracked));
            return pending ? [pending] : [];
        }
        var results = [];
        for (var i = 0; i < this._tracked.length; i++) {
            var item = this._pendingFor(this._tracked[i]);
            if (item) results.push(item);
        }
        return results;
    };
    CallTracker.prototype.reset = function(tracked) {
        var states;
        if (tracked !== undefined) {
            states = [this._stateFor(tracked)];
        } else {
            states = this._tracked.slice();
        }
        for (var i = 0; i < states.length; i++) {
            states[i].actual = 0;
            states[i].calls = [];
        }
    };
    CallTracker.prototype.verify = function(tracked) {
        var report = this.report(tracked);
        if (report.length === 0) return;
        if (tracked === undefined) {
            throw new AssertionError({
                message: 'Functions were not called the expected number of times',
                stackStartFn: this.verify
            });
        }
        var first = report[0];
        throw new AssertionError({
            operator: first.operator,
            message: first.message,
            stackStartFn: this.verify
        });
    };

    function strictAssert(value, message) {
        if (!value) {
            throw createAssertionError(value, true, '==', message, strictAssert);
        }
    }
    strictAssert.AssertionError = AssertionError;
    strictAssert.fail = assert.fail;
    strictAssert.ok = strictAssert;
    strictAssert.equal = assert.strictEqual;
    strictAssert.notEqual = assert.notStrictEqual;
    strictAssert.strictEqual = assert.strictEqual;
    strictAssert.notStrictEqual = assert.notStrictEqual;
    strictAssert.deepEqual = assert.deepStrictEqual;
    strictAssert.deepStrictEqual = assert.deepStrictEqual;
    strictAssert.partialDeepStrictEqual = assert.partialDeepStrictEqual;
    strictAssert.notDeepEqual = assert.notDeepStrictEqual;
    strictAssert.notDeepStrictEqual = assert.notDeepStrictEqual;
    strictAssert.ifError = assert.ifError;
    strictAssert.throws = assert.throws;
    strictAssert.doesNotThrow = assert.doesNotThrow;
    strictAssert.rejects = assert.rejects;
    strictAssert.doesNotReject = assert.doesNotReject;
    strictAssert.match = assert.match;
    strictAssert.doesNotMatch = assert.doesNotMatch;
    strictAssert.strict = strictAssert;
    strictAssert.CallTracker = CallTracker;

    var swiftBunPackages = globalThis.__swiftBunPackages || {};
    __nodeModules.assert = swiftBunPackages.assert || assert;
    if (!__nodeModules.assert.CallTracker) {
        __nodeModules.assert.CallTracker = CallTracker;
    }
    if (!__nodeModules.assert.strict) {
        __nodeModules.assert.strict = strictAssert;
    }
    if (__nodeModules.assert.default === undefined) {
        __nodeModules.assert.default = __nodeModules.assert;
    }
    if (__nodeModules.assert.strict.default === undefined) {
        __nodeModules.assert.strict.default = __nodeModules.assert.strict;
    }
})();
