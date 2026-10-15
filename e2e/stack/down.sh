#!/usr/bin/env bash
set -euo pipefail

source "$(dirname "${BASH_SOURCE[0]}")/env.sh"

stop() {
  local name="$1" pid_file="$E2E_STATE_DIR/$1.pid"
  if [[ ! -f "$pid_file" ]]; then
    echo "[e2e stack] $name not started by this stack"
    return
  fi
  local pid
  pid="$(cat "$pid_file")"
  if kill -0 "$pid" 2>/dev/null; then
    kill -TERM -- "-$pid" 2>/dev/null || kill -TERM "$pid"
    for _ in $(seq 1 60); do
      kill -0 "$pid" 2>/dev/null || break
      sleep 1
    done
    kill -0 "$pid" 2>/dev/null && kill -KILL -- "-$pid" 2>/dev/null
    echo "[e2e stack] stopped $name (pid $pid)"
  fi
  rm -f "$pid_file"
}

stop client
stop backend
