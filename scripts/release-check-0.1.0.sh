#!/usr/bin/env bash
set -euo pipefail

repo_root="$(cd "$(dirname "$0")/.." && pwd)"
cd "$repo_root"

scripts/check-sync-shutdown-in-deinit.sh Sources Tests
scripts/swift-test-timeout.sh 120 --build

run_filter() {
  local timeout_seconds="$1"
  local filter="$2"
  echo "== swift test --skip-build --filter $filter =="
  scripts/swift-test-timeout.sh "$timeout_seconds" --skip-build --filter "$filter"
}

runtime_suites=(
  BunProcessAsyncTests
  BunProcessTimerTests
  BunProcessStdioTests
  BunProcessLifecycleTests
  BunProcessLibraryModeTests
  BunProcessEchoDelayTests
  BunProcessStdinTests
  AsyncPrimitiveTests
  WebSocketE2ETests
  JavaScriptResourceTests
  FetchRoundtripTests
  NodeCompatFSTests
  NodeCompatProcessTests
  PackageLoadingTests
)

for suite in "${runtime_suites[@]}"; do
  run_filter 60 "$suite"
done

compat_suites=(
  WebAPIPolyfillTests
  NodeCompatModuleTests
  CryptoEdgeCaseTests
  CryptoZlibE2ETests
)

for suite in "${compat_suites[@]}"; do
  run_filter 300 "$suite"
done

cli_tests=(
  cliJSMinimalHomeReachesMessageLoop
  cliJSMinimalHomeWithEmptyChangelogCompletesSetup
  cliJSImmediateStdinPromptReachesStreamInit
  cliJSManagedClaudeStandHomeReturnsResponse
)

for test_name in "${cli_tests[@]}"; do
  run_filter 120 "$test_name"
done

echo "0.1.0 release checks passed"
