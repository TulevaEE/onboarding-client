#!/usr/bin/env bash
set -euo pipefail

IOS_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$IOS_DIR/../stack/env.sh"

export DEVELOPER_DIR="${DEVELOPER_DIR:-/Applications/Xcode.app/Contents/Developer}"
SIMULATOR_UDID="${SIMULATOR_UDID:-}"
SMART_ID_MOCK_URL="${SMART_ID_MOCK_URL:-https://sid.demo.sk.ee/mock}"
SMART_ID_DOCUMENT_NUMBER="${SMART_ID_DOCUMENT_NUMBER:-PNOEE-40404040009-MOCK-Q}"
E2E_IOS_BUILD_DIR="${E2E_IOS_BUILD_DIR:-$IOS_DIR/build}"
E2E_IOS_RESULTS_DIR="${E2E_IOS_RESULTS_DIR:-$IOS_DIR/results}"
E2E_IOS_RECORDER_PORT="${E2E_IOS_RECORDER_PORT:-3290}"
E2E_IOS_SITE_URL="http://localhost:$E2E_IOS_RECORDER_PORT"
PROJECT="$IOS_DIR/LoginE2E.xcodeproj"

log() {
  echo "[e2e ios] $*"
}

fail() {
  echo "[e2e ios] $*" >&2
  exit 1
}

[[ -n "$SIMULATOR_UDID" ]] ||
  fail "Set SIMULATOR_UDID to an iPhone simulator (xcrun simctl list devices available)"
command -v xcodegen >/dev/null || fail "xcodegen not found (brew install xcodegen)"
curl -ksf -o /dev/null "$E2E_BASE_URL/login" ||
  fail "Nothing answers $E2E_BASE_URL/login: start the stack with e2e/stack/up.sh"

write_keyboard_preference() {
  xcrun simctl spawn "$SIMULATOR_UDID" defaults write com.apple.Preferences "$1" -bool "$2"
}

keep_the_keyboard_still() {
  write_keyboard_preference DidShowContinuousPathIntroduction true
  write_keyboard_preference KeyboardContinuousPathEnabled false
  write_keyboard_preference KeyboardPrediction false
  write_keyboard_preference KeyboardAutocorrection false
}

log "Booting simulator $SIMULATOR_UDID"
xcrun simctl bootstatus "$SIMULATOR_UDID" -b >/dev/null
keep_the_keyboard_still

log "Generating $PROJECT"
xcodegen generate --quiet --spec "$IOS_DIR/project.yml" --project "$IOS_DIR"

log "Building for testing"
xcodebuild build-for-testing -quiet \
  -project "$PROJECT" -scheme LoginE2E \
  -destination "id=$SIMULATOR_UDID" \
  -derivedDataPath "$E2E_IOS_BUILD_DIR/DerivedData"

start_login_traffic_recorder() {
  E2E_BASE_URL="$E2E_BASE_URL" E2E_IOS_RECORDER_PORT="$E2E_IOS_RECORDER_PORT" \
    node "$IOS_DIR/loginTrafficRecorder.mjs" >"$E2E_IOS_RESULTS_DIR/login-traffic-recorder.log" 2>&1 &
  RECORDER_PID=$!
  trap 'kill "$RECORDER_PID" 2>/dev/null' EXIT
  until curl -sf -o /dev/null "$E2E_IOS_SITE_URL/__login-traffic"; do
    kill -0 "$RECORDER_PID" 2>/dev/null ||
      fail "Login traffic recorder did not start: $(cat "$E2E_IOS_RESULTS_DIR/login-traffic-recorder.log")"
    sleep 0.5
  done
}

rm -rf "$E2E_IOS_RESULTS_DIR/screenshots" "$E2E_IOS_RESULTS_DIR/LoginE2E.xcresult" \
  "$E2E_IOS_RESULTS_DIR/login-traffic-recorder.log"
mkdir -p "$E2E_IOS_RESULTS_DIR/screenshots"
log "Recording login traffic at $E2E_IOS_SITE_URL in front of $E2E_BASE_URL"
start_login_traffic_recorder

log "Testing against $E2E_IOS_SITE_URL, screenshots in $E2E_IOS_RESULTS_DIR/screenshots"
TEST_RUNNER_E2E_IOS_SITE_URL="$E2E_IOS_SITE_URL" \
  TEST_RUNNER_SMART_ID_MOCK_URL="$SMART_ID_MOCK_URL" \
  TEST_RUNNER_SMART_ID_DOCUMENT_NUMBER="$SMART_ID_DOCUMENT_NUMBER" \
  TEST_RUNNER_E2E_IOS_SCREENSHOT_DIR="$E2E_IOS_RESULTS_DIR/screenshots" \
  xcodebuild test-without-building \
  -project "$PROJECT" -scheme LoginE2E \
  -destination "id=$SIMULATOR_UDID" \
  -derivedDataPath "$E2E_IOS_BUILD_DIR/DerivedData" \
  -resultBundlePath "$E2E_IOS_RESULTS_DIR/LoginE2E.xcresult" \
  -parallel-testing-enabled NO \
  -collect-test-diagnostics never \
  -test-timeouts-enabled YES -maximum-test-execution-time-allowance 600 \
  "$@"
