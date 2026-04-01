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

    function AssertionError(options) {
        options = options || {};
        this.name = 'AssertionError';
        this.code = 'ERR_ASSERTION';
        this.actual = options.actual;
        this.expected = options.expected;
        this.operator = options.operator || '==';
        this.generatedMessage = options.message === undefined;
        this.message = assertionMessage(options.message, 'Assertion failed');
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, options.stackStartFn || AssertionError);
        } else {
            this.stack = new Error(this.message).stack;
        }
    }
    AssertionError.prototype = Object.create(Error.prototype);
    AssertionError.prototype.constructor = AssertionError;

    function createAssertionError(actual, expected, operator, message, stackStartFn) {
        return new AssertionError({
            actual: actual,
            expected: expected,
            operator: operator,
            message: message,
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
            throw createAssertionError(actual, expected, '===', message, assert.strictEqual);
        }
    };
    assert.notStrictEqual = function(actual, expected, message) {
        if (actual === expected) {
            throw createAssertionError(actual, expected, '!==', message, assert.notStrictEqual);
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
            for (var key in expected) {
                if (error[key] !== expected[key]) return false;
            }
            return true;
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
            throw createAssertionError(error, expected, 'doesNotThrow', message || ('Got unwanted exception: ' + error.message), assert.doesNotThrow);
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
            throw createAssertionError(error, expected, 'doesNotReject', message || ('Got unwanted rejection: ' + error.message), assert.doesNotReject);
        });
    };

    var swiftBunPackages = globalThis.__swiftBunPackages || {};
    __nodeModules.assert = swiftBunPackages.assert || assert;
    if (!__nodeModules.assert.strict) {
        __nodeModules.assert.strict = __nodeModules.assert;
    }
    if (__nodeModules.assert.default === undefined) {
        __nodeModules.assert.default = __nodeModules.assert;
    }
})();
