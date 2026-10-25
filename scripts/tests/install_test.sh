#!/usr/bin/env bash
# Hermetic tests for scripts/install.sh. Docker and curl are stubbed on a
# fake PATH; nothing here needs containers, network, or root.
set -uo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO="$(cd "$HERE/../.." && pwd)"
INSTALL_SH="$REPO/scripts/install.sh"

pass=0; fail=0
ok()   { pass=$((pass+1)); printf 'ok %d - %s\n' $((pass+fail)) "$1"; }
bad()  { fail=$((fail+1)); printf 'IKKE OK %d - %s\n' $((pass+fail)) "$1" >&2; }
check(){ if eval "$2"; then ok "$1"; else bad "$1"; fi; }

WORK="$(mktemp -d)"
trap 'rm -rf "$WORK"' EXIT

# --- Stub bin dir -----------------------------------------------------------
STUBS="$WORK/stubs"; mkdir -p "$STUBS"
cat > "$STUBS/docker" <<'SH'
#!/usr/bin/env bash
echo "docker $*" >> "$STUB_LOG"
case "$*" in
  "compose version") exit 0;;
  compose\ build|compose\ pull|compose\ up\ -d) exit 0;;
esac
exit 0
SH
cat > "$STUBS/curl" <<'SH'
#!/usr/bin/env bash
echo "curl $*" >> "$STUB_LOG"
# Health checks succeed unless the test asks otherwise.
[ "${STUB_CURL_FAIL:-}" = "1" ] && exit 1
# Release downloads: honour -o and copy the prepared file.
out=""
src=""
while [ $# -gt 0 ]; do
  case "$1" in
    -o) out="$2"; shift 2;;
    file://*) src="${1#file://}"; shift;;
    *) shift;;
  esac
done
[ -n "$src" ] && [ -n "$out" ] && cp "$src" "$out"
exit 0
SH
cat > "$STUBS/openssl" <<'SH'
#!/usr/bin/env bash
# Deterministic but unique-ish secrets per call.
if [ "$1 $2" = "rand -hex" ]; then
  head -c "$3" /dev/urandom | od -An -tx1 | tr -d ' \n'
  echo
  exit 0
fi
exit 1
SH
chmod +x "$STUBS/"*
export STUB_LOG="$WORK/stub.log"

BASE_ENV="STUB_LOG=$STUB_LOG"
run_install() {
  env -i PATH="$STUBS:/usr/bin:/bin" HOME="$WORK/home" $BASE_ENV "$@" bash "$INSTALL_SH"
}
mkdir -p "$WORK/home"

# --- 1. Missing docker fails with a clear message ---------------------------
out="$(env -i PATH="/usr/bin:/bin" HOME="$WORK/home" bash "$INSTALL_SH" 2>&1)"
code=$?
check "uden docker fejler scriptet" '[ $code -ne 0 ]'
check "fejlen nævner docker" 'echo "$out" | grep -qi docker'

# --- 2. First run creates .env with fresh, distinct secrets (600) -----------
unset STUB_CURL_FAIL
out="$(run_install NORDSVAR_INSTALL_DIR="$WORK/inst1" NORDSVAR_HEALTH_TRIES=3 2>&1)"
code=$?
check "første kørsel lykkes" '[ $code -eq 0 ]'
check ".env oprettes" '[ -f "$WORK/inst1/.env" ]'
check ".env har tilladelser 600" '[ "$(stat -c %a "$WORK/inst1/.env")" = 600 ]'
check "compose-fil kopieres" '[ -f "$WORK/inst1/docker-compose.yml" ]'
secrets="$(grep -cE '^(POSTGRES_PASSWORD|LIVEKIT_API_KEY|LIVEKIT_API_SECRET|INTERNAL_TOKEN)=[0-9a-f]{32,64}$' "$WORK/inst1/.env")"
check "fire hemmeligheder genereres som hex" '[ "$secrets" -eq 4 ]'
check "hemmeligheder er forskellige" '[ "$(grep -oE "=[0-9a-f]+$" "$WORK/inst1/.env" | sort -u | wc -l)" -ge 4 ]'
check "compose startes" 'grep -q "docker compose up -d" "$STUB_LOG"'
check "scriptet peger på browserguiden" 'echo "$out" | grep -qi "opret den første"'

# --- 3. Re-run keeps secrets (idempotent) -----------------------------------
before="$(cat "$WORK/inst1/.env")"
out="$(run_install NORDSVAR_INSTALL_DIR="$WORK/inst1" NORDSVAR_HEALTH_TRIES=3 2>&1)"
code=$?
check "anden kørsel lykkes" '[ $code -eq 0 ]'
check "hemmeligheder bevares ved genkørsel" '[ "$(cat "$WORK/inst1/.env")" = "$before" ]'
check "genkørsel siger at .env bevares" 'echo "$out" | grep -q "Beholder eksisterende"'

# --- 4. Tarball mode: bad checksum aborts, good checksum proceeds -----------
mkdir -p "$WORK/pkg/nordsvar-1.0.0/deploy/compose"
cp "$REPO/deploy/compose/selfhost.yml" "$WORK/pkg/nordsvar-1.0.0/deploy/compose/"
tar -czf "$WORK/rel.tar.gz" -C "$WORK/pkg" nordsvar-1.0.0
good_sha="$(sha256sum "$WORK/rel.tar.gz" | cut -d" " -f1)"

# checksum failure must abort before unpack
out="$(run_install NORDSVAR_INSTALL_DIR="$WORK/inst2" NORDSVAR_VERSION=1.0.0 \
  NORDSVAR_RELEASE_URL="file://$WORK/rel.tar.gz" NORDSVAR_RELEASE_SHA256=deadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeef 2>&1)"
code=$?
check "forkert checksum afbryder" '[ $code -ne 0 ]'
check "checksum-fejl nævner mismatch" 'echo "$out" | grep -q "Checksum matcher IKKE"'
check "der pakkes ikke ud ved mismatch" '[ ! -d "$WORK/inst2/src" ]'

out="$(run_install NORDSVAR_INSTALL_DIR="$WORK/inst3" NORDSVAR_VERSION=1.0.0 \
  NORDSVAR_RELEASE_URL="file://$WORK/rel.tar.gz" NORDSVAR_RELEASE_SHA256="$good_sha" 2>&1)"
code=$?
check "korrekt checksum installerer" '[ $code -eq 0 ]'
check "tarball udpakkes" '[ -f "$WORK/inst3/src/deploy/compose/selfhost.yml" ]'
check ".env refererer udpakket kilde" 'grep -q "NORDSVAR_SRC=$WORK/inst3/src" "$WORK/inst3/.env"'

# --- 5. Health-wait timeout fails with recovery hints -----------------------
out="$(run_install NORDSVAR_INSTALL_DIR="$WORK/inst4" NORDSVAR_HEALTH_TRIES=2 STUB_CURL_FAIL=1 2>&1)"
code=$?
check "sundhedstjek-timeout fejler" '[ $code -ne 0 ]'
check "timeout peger på logs og genstart" 'echo "$out" | grep -q "docker compose logs" && echo "$out" | grep -q "docker compose restart"'

echo
echo "$pass bestået, $fail fejlet"
[ "$fail" -eq 0 ]
