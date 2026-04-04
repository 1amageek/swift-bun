#!/usr/bin/env bash
set -euo pipefail

if [[ $# -lt 2 ]]; then
  echo "usage: $0 <timeout-seconds> [--build] <swift-test-args...>" >&2
  exit 2
fi

timeout_seconds="$1"
shift
mode="test"

if [[ "${1:-}" == "--build" ]]; then
  mode="build"
  shift
fi

if [[ "$timeout_seconds" -le 0 ]]; then
  echo "timeout must be greater than 0" >&2
  exit 2
fi

swift_test_pid=""
swift_test_pgid=""
allow_repo_wide_kill="${SWIFT_BUN_TIMEOUT_REPO_WIDE_KILL:-0}"

cleanup() {
  local repo_wide="${1:-0}"

  if [[ -n "$swift_test_pid" ]] && kill -0 "$swift_test_pid" 2>/dev/null; then
    kill "$swift_test_pid" 2>/dev/null || true
  fi

  if [[ -n "$swift_test_pgid" ]]; then
    kill -TERM -- "-$swift_test_pgid" 2>/dev/null || true
    sleep 1
    kill -KILL -- "-$swift_test_pgid" 2>/dev/null || true
  fi

  if [[ "$repo_wide" == "1" && "$allow_repo_wide_kill" == "1" ]]; then
    pkill -TERM -f "swift-test.*$(pwd)" 2>/dev/null || true
    pkill -KILL -f "swift-test.*$(pwd)" 2>/dev/null || true
    pkill -TERM -f "swiftpm-testing-helper.*$(pwd)" 2>/dev/null || true
    pkill -KILL -f "swiftpm-testing-helper.*$(pwd)" 2>/dev/null || true
  fi
}

trap 'cleanup 1' INT TERM
trap 'status=$?; if [[ "$status" -ne 0 ]]; then cleanup 1; fi' EXIT

if [[ "$mode" == "build" ]]; then
  swift build "$@" &
else
  swift test "$@" &
fi
swift_test_pid=$!
swift_test_pgid="$(ps -o pgid= -p "$swift_test_pid" | tr -d ' ')"

elapsed=0
while kill -0 "$swift_test_pid" 2>/dev/null; do
  if [[ "$elapsed" -ge "$timeout_seconds" ]]; then
    echo "swift test timed out after ${timeout_seconds}s" >&2
    cleanup
    wait "$swift_test_pid" 2>/dev/null || true
    exit 124
  fi

  sleep 1
  elapsed=$((elapsed + 1))
done

wait "$swift_test_pid"
swift_test_pid=""
swift_test_pgid=""
trap - EXIT INT TERM
