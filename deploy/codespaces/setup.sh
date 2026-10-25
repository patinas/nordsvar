#!/usr/bin/env bash
# Nordsvar Codespaces demo bootstrap. Runs inside the codespace at create
# time. Generates throwaway demo secrets locally (never committed) and
# boots the standard self-host compose stack with synthetic data only.
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$REPO_ROOT"
COMPOSE="docker compose -f deploy/compose/selfhost.yml -f deploy/codespaces/compose.override.yml"

ENV_FILE="$REPO_ROOT/deploy/compose/.env"
if [ ! -f "$ENV_FILE" ]; then
  {
    echo "NORDSVAR_SRC=$REPO_ROOT"
    echo "WEB_PORT=8081"
    echo "AUTH_MODE=local"
    echo "POSTGRES_PASSWORD=$(openssl rand -hex 24)"
    echo "LIVEKIT_API_KEY=$(openssl rand -hex 16)"
    echo "LIVEKIT_API_SECRET=$(openssl rand -hex 32)"
    echo "INTERNAL_TOKEN=$(openssl rand -hex 32)"
    echo "SETTINGS_KEY=$(openssl rand -hex 32)"
    echo "TURN_USERNAME=nordsvar"
    echo "TURN_CREDENTIAL=$(openssl rand -hex 16)"
  } > "$ENV_FILE"
  chmod 600 "$ENV_FILE"
fi

# Browsers reach LiveKit through the forwarded-port tunnel, never through
# the compose network, so join tickets must carry the public tunnel URL.
# Idempotent: appends to a pre-existing .env when the line is missing.
if [ -n "${CODESPACE_NAME:-}" ]; then
  domain="${GITHUB_CODESPACES_PORT_FORWARDING_DOMAIN:-app.github.dev}"
  grep -q '^LIVEKIT_PUBLIC_URL=' "$ENV_FILE" || \
    echo "LIVEKIT_PUBLIC_URL=wss://${CODESPACE_NAME}-7880.${domain}" >> "$ENV_FILE"
  grep -q '^TURN_URL=' "$ENV_FILE" || \
    echo "TURN_URL=turns:${CODESPACE_NAME}-7882.${domain}:443?transport=tcp" >> "$ENV_FILE"
  grep -q '^TURN_USERNAME=' "$ENV_FILE" || echo "TURN_USERNAME=nordsvar" >> "$ENV_FILE"
  grep -q '^TURN_CREDENTIAL=' "$ENV_FILE" || \
    echo "TURN_CREDENTIAL=$(openssl rand -hex 16)" >> "$ENV_FILE"
fi

# --- Bridge-netfilter repair ----------------------------------------------
# GitHub Codespaces VMs install per-container netfilter drop rules (host
# agent, raw PREROUTING) that silently kill inter-container traffic on
# user-defined docker bridges whenever bridged packets traverse netfilter
# (net.bridge.bridge-nf-call-iptables=1). Observed symptom: api crash-loops
# with "postgres connect: PoolTimedOut" while pg_isready is green and
# published ports work. The repair stops bridged traffic from traversing
# netfilter at all. Port publishing and outbound NAT use the routed path
# and are unaffected. On ordinary docker hosts this is a no-op-equivalent
# (their default policy does not drop same-bridge traffic either way).
fix_bridge_netfilter() {
  docker run --rm --privileged --network host postgres:16-alpine sh -c \
    'for k in net.bridge.bridge-nf-call-iptables net.bridge.bridge-nf-call-ip6tables net.bridge.bridge-nf-call-arptables; do sysctl -w "$k=0" >/dev/null 2>&1 || true; done'
}

# Inter-container self-check: a throwaway container on the compose network
# must be able to open a TCP connection to postgres. Returns non-zero when
# the bridge drops inter-container traffic.
self_check_network() {
  local pg net
  pg="$($COMPOSE ps -q postgres 2>/dev/null || true)"
  [ -n "$pg" ] || return 1
  net="$(docker inspect "$pg" --format '{{range $k, $_ := .NetworkSettings.Networks}}{{$k}}{{end}}' 2>/dev/null || true)"
  [ -n "$net" ] || return 1
  docker run --rm --network "$net" postgres:16-alpine \
    sh -c 'nc -zvw3 postgres 5432' >/dev/null 2>&1
}

fix_bridge_netfilter
$COMPOSE up -d --build

if ! self_check_network; then
  echo "Inter-container check failed; re-applying netfilter repair and recreating the docker network..." >&2
  fix_bridge_netfilter
  $COMPOSE down
  net="$(docker network ls --format '{{.Name}}' | grep -E '^nordsvar' || true)"
  [ -n "$net" ] && docker network rm $net >/dev/null 2>&1 || true
  $COMPOSE up -d
  fix_bridge_netfilter
fi

if ! self_check_network; then
  echo >&2
  echo "FATAL: containers cannot reach each other on the docker bridge network." >&2
  echo "The Codespaces VM is blocking inter-container traffic. Try rebooting" >&2
  echo "the codespace (github.com/codespaces) and re-running this script; if it" >&2
  echo "still fails, recreate the codespace. The stack is NOT usable." >&2
  exit 1
fi

# Wait for the API to serve through the web proxy before declaring success.
echo "Waiting for the API to become healthy..."
healthy=""
for _ in $(seq 1 45); do
  if curl -fsS -m 3 http://localhost:8081/healthz >/dev/null 2>&1; then
    healthy=1
    break
  fi
  sleep 2
done
if [ -z "$healthy" ]; then
  echo "FATAL: the API did not become healthy on http://localhost:8081/healthz within 90s." >&2
  echo "Check 'docker compose -f deploy/compose/selfhost.yml logs api'." >&2
  exit 1
fi

echo
echo "Nordsvar demo is up. Open the forwarded 'Nordsvar web' port (8081)"
echo "from the Codespaces PORTS panel and complete the setup wizard."
echo "Use synthetic data only - this runs on GitHub infrastructure."
