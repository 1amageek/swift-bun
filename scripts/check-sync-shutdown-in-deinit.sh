#!/usr/bin/env bash
set -euo pipefail

if [[ $# -eq 0 ]]; then
  echo "usage: $0 <path> [<path> ...]" >&2
  exit 2
fi

pattern='deinit|syncShutdownGracefully'
matches="$(rg -n -U "$pattern" "$@" || true)"

if [[ -z "$matches" ]]; then
  exit 0
fi

if printf '%s\n' "$matches" | awk '
  /deinit/ { in_deinit = 1 }
  in_deinit && /syncShutdownGracefully/ { exit 1 }
  /^$/ { in_deinit = 0 }
  END { exit 0 }
' ; then
  exit 0
fi

printf '%s\n' "$matches" >&2
exit 1
