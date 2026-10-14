#!/usr/bin/env bash
set -euo pipefail

source "$(dirname "${BASH_SOURCE[0]}")/env.sh"

UNREACHABLE_THIRD_PARTY_SERVICE="http://127.0.0.1:9"
THROWAWAY_SEB_KEYSTORE="$E2E_STATE_DIR/seb-gateway-throwaway.p12"
THROWAWAY_SEB_KEYSTORE_PASSWORD="changeit"

log() {
  echo "[e2e stack] $*"
}

fail() {
  echo "[e2e stack] $*" >&2
  exit 1
}

require_backend_dir() {
  [[ -n "$E2E_BACKEND_DIR" ]] || fail "Set E2E_BACKEND_DIR to an onboarding-service checkout"
  [[ -x "$E2E_BACKEND_DIR/gradlew" ]] || fail "No gradlew in E2E_BACKEND_DIR=$E2E_BACKEND_DIR"
}

backend_jar() {
  find "$E2E_BACKEND_DIR/build/libs" -maxdepth 1 -name '*.jar' ! -name '*-plain.jar' 2>/dev/null | head -n 1
}

build_backend_jar() {
  if [[ "$E2E_BACKEND_BUILD" == always || -z "$(backend_jar)" ]]; then
    log "Building the backend jar in $E2E_BACKEND_DIR"
    (cd "$E2E_BACKEND_DIR" && ./gradlew bootJar -x test --quiet)
  fi
  [[ -n "$(backend_jar)" ]] || fail "No backend jar in $E2E_BACKEND_DIR/build/libs"
}

ensure_database() {
  if [[ "$E2E_CREATE_DATABASE" != true ]]; then
    return
  fi
  if ! command -v psql >/dev/null; then
    log "psql not found, expecting database $E2E_DATABASE_NAME to exist"
    return
  fi
  local exists
  exists=$(PGPASSWORD="$E2E_DATABASE_PASSWORD" psql -h "$E2E_DATABASE_HOST" -p "$E2E_DATABASE_PORT" \
    -U "$E2E_DATABASE_USERNAME" -d postgres -tAc \
    "select 1 from pg_database where datname = '$E2E_DATABASE_NAME'")
  if [[ "$exists" != 1 ]]; then
    log "Creating database $E2E_DATABASE_NAME"
    PGPASSWORD="$E2E_DATABASE_PASSWORD" createdb -h "$E2E_DATABASE_HOST" -p "$E2E_DATABASE_PORT" \
      -U "$E2E_DATABASE_USERNAME" "$E2E_DATABASE_NAME"
  fi
}

ensure_throwaway_seb_keystore() {
  if [[ ! -f "$THROWAWAY_SEB_KEYSTORE" ]]; then
    keytool -genkeypair -alias e2e -keyalg RSA -keysize 2048 -validity 3650 \
      -dname "CN=e2e-throwaway" -storetype PKCS12 -keystore "$THROWAWAY_SEB_KEYSTORE" \
      -storepass "$THROWAWAY_SEB_KEYSTORE_PASSWORD" -keypass "$THROWAWAY_SEB_KEYSTORE_PASSWORD" \
      >/dev/null 2>&1
  fi
}

running() {
  local pid_file="$E2E_STATE_DIR/$1.pid"
  [[ -f "$pid_file" ]] && kill -0 "$(cat "$pid_file")" 2>/dev/null
}

port_taken() {
  (exec 3<>"/dev/tcp/127.0.0.1/$1") 2>/dev/null
}

wait_until_answers() {
  local name="$1" url="$2" deadline=$((SECONDS + E2E_STARTUP_TIMEOUT_SECONDS))
  until curl -ksf -o /dev/null "$url"; do
    if ! running "$name"; then
      tail -n 40 "$E2E_STATE_DIR/$name.log" >&2
      fail "$name exited before answering $url"
    fi
    if ((SECONDS > deadline)); then
      tail -n 40 "$E2E_STATE_DIR/$name.log" >&2
      fail "$name did not answer $url within ${E2E_STARTUP_TIMEOUT_SECONDS}s"
    fi
    sleep 2
  done
  log "$name answers at $url (pid $(cat "$E2E_STATE_DIR/$name.pid"))"
}

start_backend() {
  if running backend; then
    log "backend already running (pid $(cat "$E2E_STATE_DIR/backend.pid"))"
    return
  fi
  ! port_taken "$E2E_BACKEND_PORT" || fail "Port $E2E_BACKEND_PORT is taken by another process"
  build_backend_jar
  local jar
  jar="$(backend_jar)"
  log "Starting backend from $jar (built $(date -r "$jar" '+%Y-%m-%d %H:%M'), checkout $(git -C "$E2E_BACKEND_DIR" describe --always --dirty)) on port $E2E_BACKEND_PORT"
  (cd "$E2E_BACKEND_DIR" && exec nohup env -i PATH="$PATH" HOME="$HOME" TMPDIR="${TMPDIR:-/tmp}" \
    LANG="${LANG:-en_US.UTF-8}" ${JAVA_HOME:+JAVA_HOME="$JAVA_HOME"} \
    AWS_ACCESS_KEY_ID=e2e-throwaway AWS_SECRET_ACCESS_KEY=e2e-throwaway AWS_REGION=eu-central-1 \
    SPRING_PROFILES_ACTIVE=dev,mock \
    FRONTEND_URL="$E2E_SMART_ID_CALLBACK_ORIGIN" \
    java -jar "$jar" \
    --server.port="$E2E_BACKEND_PORT" \
    --spring.datasource.url="jdbc:postgresql://$E2E_DATABASE_HOST:$E2E_DATABASE_PORT/$E2E_DATABASE_NAME" \
    --spring.datasource.username="$E2E_DATABASE_USERNAME" \
    --spring.datasource.password="$E2E_DATABASE_PASSWORD" \
    --frontend.url="$E2E_SMART_ID_CALLBACK_ORIGIN" \
    --api.url="$E2E_BACKEND_URL/v1" \
    --seb-gateway.keystore.path="$THROWAWAY_SEB_KEYSTORE" \
    --seb-gateway.keystore.password="$THROWAWAY_SEB_KEYSTORE_PASSWORD" \
    --opensanctions.url="$UNREACHABLE_THIRD_PARTY_SERVICE" \
    --mandrill.url="$UNREACHABLE_THIRD_PARTY_SERVICE" \
    --mailchimp.url="$UNREACHABLE_THIRD_PARTY_SERVICE" \
    --ariregister.url="$UNREACHABLE_THIRD_PARTY_SERVICE" \
    --directo.url="$UNREACHABLE_THIRD_PARTY_SERVICE") \
    </dev/null >"$E2E_STATE_DIR/backend.log" 2>&1 &
  echo $! >"$E2E_STATE_DIR/backend.pid"
  wait_until_answers backend "$E2E_BACKEND_URL/actuator/health"
}

start_client() {
  if running client; then
    log "client already running (pid $(cat "$E2E_STATE_DIR/client.pid"))"
    return
  fi
  ! port_taken "$E2E_CLIENT_PORT" || fail "Port $E2E_CLIENT_PORT is taken by another process"
  [[ -d "$E2E_CLIENT_DIR/node_modules" ]] || fail "Run npm ci in $E2E_CLIENT_DIR first"
  log "Starting client dev server on $E2E_BASE_URL"
  (cd "$E2E_CLIENT_DIR" && exec nohup env CI=true BROWSER=none PORT="$E2E_CLIENT_PORT" \
    HTTPS="$E2E_CLIENT_HTTPS" PROXY_TARGET="$E2E_BACKEND_URL" npm run develop) \
    </dev/null >"$E2E_STATE_DIR/client.log" 2>&1 &
  echo $! >"$E2E_STATE_DIR/client.pid"
  wait_until_answers client "$E2E_BASE_URL/login"
}

set -m
mkdir -p "$E2E_STATE_DIR"
require_backend_dir
ensure_database
ensure_throwaway_seb_keystore
start_backend
start_client
log "Stack is up: client $E2E_BASE_URL, backend $E2E_BACKEND_URL, logs in $E2E_STATE_DIR"
