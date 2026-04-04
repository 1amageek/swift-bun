#!/usr/bin/env bash
set -euo pipefail

repeats=1
timeout_seconds=30
build_timeout_seconds=120

while [[ $# -gt 0 ]]; do
  case "$1" in
    --repeats)
      repeats="$2"
      shift 2
      ;;
    --timeout)
      timeout_seconds="$2"
      shift 2
      ;;
    --build-timeout)
      build_timeout_seconds="$2"
      shift 2
      ;;
    --)
      shift
      break
      ;;
    *)
      echo "unexpected argument: $1" >&2
      exit 2
      ;;
  esac
done

if [[ $# -eq 0 ]]; then
  echo "usage: $0 [--repeats N] [--timeout SEC] [--build-timeout SEC] -- <swift-test-args...>" >&2
  exit 2
fi

lock_dir=".test-artifacts/hang-guard.lock"
artifact_root=".test-artifacts/hang-guard"
mkdir -p "$artifact_root"

if ! mkdir "$lock_dir" 2>/dev/null; then
  echo "another hang-guard run is already active" >&2
  exit 3
fi

cleanup() {
  rmdir "$lock_dir" 2>/dev/null || true
}
trap cleanup EXIT INT TERM

timestamp="$(date '+%Y%m%d-%H%M%S')"
run_dir="$artifact_root/$timestamp"
mkdir -p "$run_dir"

build_log="$run_dir/build.log"
if ! scripts/swift-test-timeout.sh "$build_timeout_seconds" --build >"$build_log" 2>&1; then
  echo "build failed; see $build_log" >&2
  exit 1
fi

for ((run = 1; run <= repeats; run++)); do
  log_path="$run_dir/run-$run.log"
  diag_path="$run_dir/run-$run.diag.txt"

  if ! scripts/swift-test-timeout.sh "$timeout_seconds" --skip-build "$@" >"$log_path" 2>&1; then
    {
      echo "pwd: $(pwd)"
      echo
      echo "ps:"
      ps -ef | grep swift | grep -v grep || true
      echo
      echo ".build/.lock:"
      ls -l .build/.lock 2>/dev/null || true
    } >"$diag_path"
    echo "hang-guard failed; see $log_path and $diag_path" >&2
    exit 1
  fi
done

echo "OK: completed $repeats run(s) without timeout or stale helper"
