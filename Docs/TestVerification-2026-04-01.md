# Test Verification Report — 2026-04-01

## Summary

34 test suites verified individually. 24 suites fully passed, 4 suites contain hanging tests (process-mode lifecycle), 2 suites have pre-existing failures unrelated to recent changes, 1 suite unverified.

## Results

| # | Suite | Pass/Total | Status |
|---|-------|-----------|--------|
| 1 | AsyncLocalStorageTests | 2/2 | Pass |
| 2 | AsyncPrimitiveTests | 5/5 | Pass |
| 3 | BufferEdgeCaseTests | 7/7 | Pass |
| 4 | BunAPITests | 20/20 | Pass |
| 5 | BunBuildTests | 5/5 | Pass |
| 6 | BunProcessLifecycleTests | — | Hang (naturalExit) |
| 7 | BunProcessLibraryModeTests | 13/13 | Pass |
| 8 | BunProcessTimerTests | 9/9 | Pass |
| 9 | BunProcessAsyncTests | 9/12 | Hang (3 natural-exit tests) |
| 10 | BunProcessStdinTests | — | Hang (multiple stdin lifecycle tests) |
| 11 | BunProcessStdioTests | 16/17 | Fail: stdinWrite (pre-existing) |
| 12 | BunProcessEchoDelayTests | 2/2 | Pass |
| 13 | BunRuntimeTests | 5/5 | Pass |
| 14 | CLIJSTest | 5/5 | Pass |
| 15 | ClaudeBundleIntegrationTests | 12/12 | Pass |
| 16 | CryptoEdgeCaseTests | 14/14 | Pass |
| 17 | ESMTransformTests | 2/2 | Pass |
| 18 | EventEmitterEdgeCaseTests | 4/4 | Pass |
| 19 | FSEdgeCaseTests | 12/12 | Pass |
| 20 | FetchRoundtripTests | 15/15 | Pass |
| 21 | JavaScriptResourceTests | — | Not verified |
| 22 | JSResultEdgeCaseTests | 7/7 | Pass |
| 23 | JSTransformerDirectTests | 22/22 | Pass |
| 24 | LifecycleControllerTests | 6/6 | Pass |
| 25 | NodeCompatBasicTests | 12/12 | Pass |
| 26 | NodeCompatFSTests | 20/20 | Pass |
| 27 | NodeCompatModuleTests | 12/15 | Fail: child_process x3 (pre-existing, macOS) |
| 28 | NodeCompatProcessTests | 14/14 | Pass |
| 29 | NodeCompatStreamTests | — | Hang (streamPromisesPipeline) |
| 30 | NodePolyfillAdditionTests | 10/10 | Pass |
| 31 | PathEdgeCaseTests | 5/5 | Pass |
| 32 | TextCodecEdgeCaseTests | 7/7 | Pass |
| 33 | URLEdgeCaseTests | 5/5 | Pass |
| 34 | WebAPIPolyfillTests | 22/22 | Pass |

## Pre-existing failures

These failures exist before the changes in this session and are unrelated to the bug fixes.

### BunProcessStdioTests/stdinWrite

Tests that `process.stdin.write` is a function. stdin is a Readable stream — `write` is a Writable method. The test expectation is incorrect.

### NodeCompatModuleTests/childProcess* (x3)

`childProcessExecFileUnsupported`, `childProcessSpawnUnsupported`, `childProcessExecFileAbsolutePathUnsupported` — tests expect child_process to throw, but on macOS child_process is functional via `#if os(macOS)`.

## Hanging tests

All hanging tests use `process.run()` (process mode) and wait for natural exit via ref/unref lifecycle. They do not complete within the test timeout.

### BunProcessLifecycleTests
- `naturalExit` — `setTimeout(fn, 10)` then waits for natural exit

### BunProcessAsyncTests
- `naturalExitWaitsForPromiseContinuationAfterTimer` — stdout collection + natural exit
- `nextTickStormDoesNotStarveFetch` — 20k nextTick + fetch completion
- `nextTickStormDoesNotStarveTimer` — 20k nextTick + timer completion

### BunProcessStdinTests
- `stdinRead`, `stdinRefUnref`, `stdinKeepsProcessAlive`, `stdinBufferedBeforeAsyncIteratorAttaches`, `stdinResumeKeepsProcessAlive`, `stdinPauseReleasesKeepAlive`, `stdinUnrefOnEndWithListener`, `stdinUnrefOnEndWithoutListener`, `stdinUnrefOnRemoveListener`

### NodeCompatStreamTests
- `streamPromisesPipelineWithFSWriteStream` — hangs during stream pipeline execution

## Changes verified

The following bug fixes were verified by both new and existing tests:

| Change | New tests | Existing tests |
|--------|----------|---------------|
| Binary hash (Uint8Array) | hashBinaryUpdate, hashMixedUpdate | sha256Empty, hashChaining, hashBase64 |
| crypto.randomInt (SecRandom) | randomIntRange, randomIntSingleArg, randomIntInvalidRange | — |
| crypto.getRandomValues (SecRandom) | cryptoGetRandomValuesUint32 | cryptoGetRandomValues |
| crypto.subtle (throw) | cryptoSubtleRejects | — |
| HMAC binary + error | hmacBinaryKeyData, hmacUnsupportedAlgorithm | hmacSHA256 |
| stat/lstat separation | statLstatSymlink, asyncStatSymlink, asyncLstatSymlink | statSyncIsDirectory, statSyncIsFile |
| stat().mode posixPermissions | statModeActual | — |
| chmod implementation | chmodSync, asyncChmod | — |
| deepEquals structural | deepEqualsNaN, deepEqualsDate, deepEqualsSharedRef, deepEqualsCircular | deepEquals |
| process.chdir throws | processChdirThrows | — |
| process.kill throws | processKillThrows | — |
| console.time/timeEnd | consoleTimeEnd, consoleTimeEndUnknown | — |
| performance.mark/measure | performanceMarkMeasure | — |
| process.pid dynamic | processPidDynamic | processGetuid |
| process.getuid dynamic | processGetuidDynamic | — |
| os.release dynamic | osReleaseDynamic | osPlatform |
| os.userInfo uid | osUserInfoUidConsistency | runtimeEnvironmentOverrides |
| realpath fix (stat) | statSyncIsDirectory (was failing, now passes) | — |

## Test suite split

BunProcessTests (79 tests, 1 suite) was split into 6 suites to prevent hang propagation:

| New Suite | Tests | Content |
|-----------|-------|---------|
| BunProcessLifecycleTests | 10 | exit, naturalExit, terminate, env, errors |
| BunProcessLibraryModeTests | 13 | evaluate, evaluateAsync, callAsync, shutdown |
| BunProcessTimerTests | 9 | setTimeout, setInterval, setImmediate, timers/promises |
| BunProcessAsyncTests | 12 | promise, nextTick, microtask, scheduler ordering |
| BunProcessStdinTests | 17 | stdin data, EOF, pipe, async iterator, ref/unref |
| BunProcessStdioTests | 17 | stdout/stderr, process API, argv, cwd |
| BunProcessEchoDelayTests | 2 | echo-delay round-trip (slow) |

NodeCompatTests (67 tests, 1 suite) was split into 5 suites:

| New Suite | Tests | Content |
|-----------|-------|---------|
| NodeCompatBasicTests | 12 | path, buffer, crypto, url, util, textEncoder |
| NodeCompatProcessTests | 14 | process.*, os.*, console.time, performance |
| NodeCompatFSTests | 20 | fs sync + fs promises + stream consumers |
| NodeCompatModuleTests | 15 | require, events, readline, tty, assert, child_process, diagnostics, perf_hooks |
| NodeCompatStreamTests | 6 | stream/http/fetch integration, Layer 0 identity |
