#!/usr/bin/env bash
set -euo pipefail

E2E_ANDROID_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$(dirname "${BASH_SOURCE[0]}")/../stack/env.sh"

E2E_ANDROID_OUT="${E2E_ANDROID_OUT:-$E2E_ANDROID_DIR/out}"
E2E_ANDROID_ATTENDED="${E2E_ANDROID_ATTENDED:-false}"
export E2E_ANDROID_OUT E2E_ANDROID_ATTENDED

log() {
  echo "[e2e android] $*"
}

fail() {
  echo "[e2e android] $*" >&2
  exit 1
}

resolve_adb() {
  if [[ -n "${ADB:-}" ]]; then
    echo "$ADB"
  elif command -v adb >/dev/null; then
    command -v adb
  elif [[ -n "${ANDROID_HOME:-}" ]]; then
    echo "$ANDROID_HOME/platform-tools/adb"
  fi
}

ADB="$(resolve_adb)"
[[ -n "$ADB" && -x "$ADB" ]] || fail "No adb: put it on PATH, set ANDROID_HOME, or set ADB=/path/to/adb"
export ADB

[[ "$("$ADB" get-state 2>/dev/null)" == device ]] ||
  fail "No phone: connect one Android phone with USB debugging allowed, or pick one with ANDROID_SERIAL"
log "Phone: $("$ADB" get-serialno) ($("$ADB" shell getprop ro.product.model | tr -d '\r'), Android $("$ADB" shell getprop ro.build.version.release | tr -d '\r'))"

curl -fsS -o /dev/null "$E2E_BASE_URL/login" ||
  fail "The client does not answer at $E2E_BASE_URL: start the stack with e2e/stack/up.sh"

phone_port="${E2E_BASE_URL##*:}"
phone_port="${phone_port%%/*}"
remove_phone_port_reverse() {
  "$ADB" reverse --remove "tcp:$phone_port" >/dev/null 2>&1 || true
}
trap remove_phone_port_reverse EXIT

if [[ "$E2E_ANDROID_ATTENDED" == true ]]; then
  log "Attended: when asked, open $E2E_BASE_URL/3rd-pillar-payment?utm_source=e2e&fbclid=abc from a Messenger chat on the phone"
fi

rm -rf "$E2E_ANDROID_OUT/screens" "$E2E_ANDROID_OUT/login-traffic.jsonl"
mkdir -p "$E2E_ANDROID_OUT"
cd "$E2E_CLIENT_DIR"
npx playwright test --config e2e/android/playwright.config.ts "$@"
