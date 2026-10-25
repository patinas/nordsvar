#!/usr/bin/env bash
# Nordsvar self-hosted installer.
#
# What it does, in order (nothing else):
#   1. Checks that docker with the compose plugin is available.
#   2. Optionally downloads a release tarball and verifies its SHA-256
#      before unpacking (only when NORDSVAR_RELEASE_URL is set).
#   3. Creates the install directory with a .env full of locally generated
#      secrets (file permissions 600 - secrets are never typed or echoed).
#   4. Builds or pulls the container images and starts the stack.
#   5. Waits for the API health check, then tells you where to finish
#      setup in your browser.
#
# Re-running it is safe: your .env (secrets, settings) is kept as-is.
#
# Audit before you run it - it is short on purpose. If you fetched this
# file, verify it first:
#   echo "<expected-sha256>  install.sh" | sha256sum -c -
set -euo pipefail

INSTALL_DIR="${NORDSVAR_INSTALL_DIR:-$HOME/nordsvar}"
VERSION="${NORDSVAR_VERSION:-local}"
RELEASE_URL="${NORDSVAR_RELEASE_URL:-}"
RELEASE_SHA256="${NORDSVAR_RELEASE_SHA256:-}"
WEB_PORT="${WEB_PORT:-8081}"
HEALTH_TRIES="${NORDSVAR_HEALTH_TRIES:-60}"

say()  { printf '==> %s\n' "$*"; }
warn() { printf 'Advarsel: %s\n' "$*" >&2; }
die()  { printf 'Fejl: %s\n' "$*" >&2; exit 1; }

need() { command -v "$1" >/dev/null 2>&1 || die "$1 mangler. $2"; }

say "Nordsvar installation (version: $VERSION)"

# --- 1. Prerequisites -------------------------------------------------------
need docker "Installér Docker: https://docs.docker.com/engine/install/"
docker compose version >/dev/null 2>&1 \
  || die "docker compose-plugin mangler (prøv: docker compose version)."
need openssl "OpenSSL bruges til at generere adgangskoder."
need curl "curl bruges til sundhedstjek og downloads."

# --- 2. Optional release tarball (verified before it is trusted) ------------
SRC_DIR=""
if [ -n "$RELEASE_URL" ]; then
  [ -n "$RELEASE_SHA256" ] \
    || die "NORDSVAR_RELEASE_SHA256 skal være sat sammen med NORDSVAR_RELEASE_URL."
  mkdir -p "$INSTALL_DIR"
  tarball="$INSTALL_DIR/nordsvar-$VERSION.tar.gz"
  say "Henter $RELEASE_URL"
  curl -fsSL "$RELEASE_URL" -o "$tarball"
  say "Kontrollerer checksum"
  (cd "$INSTALL_DIR" && echo "$RELEASE_SHA256  $(basename "$tarball")" | sha256sum -c -) \
    || die "Checksum matcher IKKE - filen er slettet. Hent installationsguiden igen."
  say "Udpakker"
  mkdir -p "$INSTALL_DIR/src"
  tar -xzf "$tarball" -C "$INSTALL_DIR/src" --strip-components=1
  SRC_DIR="$INSTALL_DIR/src"
else
  # From a repo checkout: the compose file must sit next to this script.
  SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
  SRC_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
  [ -f "$SRC_DIR/deploy/compose/selfhost.yml" ] \
    || die "Kan ikke finde deploy/compose/selfhost.yml - kør scriptet fra et komplet repo."
fi

# --- 3. Install directory, .env with locally generated secrets --------------
mkdir -p "$INSTALL_DIR"
cp "$SRC_DIR/deploy/compose/selfhost.yml" "$INSTALL_DIR/docker-compose.yml"

if [ -f "$INSTALL_DIR/.env" ]; then
  say "Beholder eksisterende .env (adgangskoder og indstillinger uændret)"
else
  say "Genererer adgangskoder lokalt (gemmes i $INSTALL_DIR/.env)"
  umask 077
  {
    echo "# Nordsvar konfiguration - genereret $(date +%Y-%m-%d)"
    echo "# Del ikke denne fil. Den står kun på denne maskine."
    echo "NORDSVAR_VERSION=$VERSION"
    echo "NORDSVAR_SRC=$SRC_DIR"
    echo "WEB_PORT=$WEB_PORT"
    echo "AUTH_MODE=local"
    echo "POSTGRES_PASSWORD=$(openssl rand -hex 24)"
    echo "LIVEKIT_API_KEY=$(openssl rand -hex 16)"
    echo "LIVEKIT_API_SECRET=$(openssl rand -hex 32)"
    echo "INTERNAL_TOKEN=$(openssl rand -hex 32)"
    echo "SETTINGS_KEY=$(openssl rand -hex 32)"
  } > "$INSTALL_DIR/.env"
  chmod 600 "$INSTALL_DIR/.env"
fi

# --- 4. Build/pull images and start -----------------------------------------
cd "$INSTALL_DIR"
if [ -n "${NORDSVAR_REGISTRY:-}" ]; then
  say "Henter færdige images fra $NORDSVAR_REGISTRY"
  docker compose pull
else
  say "Bygger images fra kildekoden (første gang tager et stykke tid)"
  docker compose build
fi
say "Starter Nordsvar"
docker compose up -d

# --- 5. Health check ----------------------------------------------------------
say "Venter på at API'et svarer"
i=0
while ! curl -fsS "http://127.0.0.1:$WEB_PORT/healthz" >/dev/null 2>&1; do
  i=$((i + 1))
  [ "$i" -ge "$HEALTH_TRIES" ] && die "API'et svarede ikke i tid.
  Fejlsøgning:  cd $INSTALL_DIR && docker compose logs nordsvar-api
  Genstart:     cd $INSTALL_DIR && docker compose restart"
  sleep 2
done

cat <<MSG

Nordsvar kører.

Åbn http://localhost:$WEB_PORT i din browser og opret den første
administrator - guiden hjælper dig videre.

Nyttige kommandoer (kør dem i $INSTALL_DIR):
  docker compose logs -f        # se logs
  docker compose ps             # status
  docker compose down           # stop
  docker compose up -d          # start igen

Opgradering: kør dette script igen efter en ny version (din .env bevares).
Mere: docs/INSTALL.md i repositoriet.
MSG
