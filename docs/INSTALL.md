# Installation (self-hosted)

This guide gets Nordsvar running on one machine you control. Everything
stays on your network: no cloud account, no external service, no data
leaving the machine at runtime.

## The short version

```bash
curl -fsSL <udgivelses-URL>/install.sh -o install.sh
echo "<sha256-fra-udgivelsen>  install.sh" | sha256sum -c -
bash install.sh
```

Then open http://localhost:8081 and create the first administrator in the
browser wizard. That is the whole install.

We deliberately do **not** offer `curl | bash`: download the script, read
it (it is short), verify its checksum against the release notes, then run
it. If the checksum does not match, do not run the file.

Already have the repository checked out? Skip the download and run:

```bash
./scripts/install.sh
```

## Prerequisites

Short version: 64-bit Linux with Docker Engine 24+ (Compose plugin), 2
vCPU / 4 GB RAM / 10 GB disk for the app itself, ports 8081 + 7880 + 7881
+ 50000-50100/UDP, a current browser for calls, and HTTPS in front for
anything beyond localhost (browsers refuse microphones on plain HTTP).
Local model serving adds a GPU sized to the model (8+ GB VRAM small,
24-48 GB large).

The full minimum-vs-recommended breakdown with the base, voice/screen,
small-model, and large-model profiles is in the README's Prerequisites
section.

## What the script does

1. Checks that Docker (with the compose plugin), curl, and OpenSSL exist.
2. (Only when `NORDSVAR_RELEASE_URL` is set) downloads the release tarball
   and verifies its SHA-256 **before** unpacking. A mismatch aborts the
   install and nothing is unpacked.
3. Creates `~/nordsvar` (override with `NORDSVAR_INSTALL_DIR`) containing:
   - `docker-compose.yml` - the stack definition (from `deploy/compose/selfhost.yml`)
   - `.env` - locally generated secrets, permissions 600. Secrets are
     created on your machine by `openssl rand`; you never type them, they
     never appear in your shell history, and they never leave the machine.
4. Builds the Nordsvar images from source (or pulls them when
   `NORDSVAR_REGISTRY` points at your registry mirror).
5. Starts the stack and waits for the API health check.

Re-running the script is safe. Your `.env` is kept untouched; the script
rebuilds/restarts the services. Use a re-run to upgrade:

```bash
cd ~/nordsvar
NORDSVAR_VERSION=<ny-version> ~/nordsvar/... # or rerun install.sh with the new version
```

## Upgrading

1. Get the new version (new checkout, or new verified tarball).
2. Run the installer again. It keeps your `.env`, rebuilds images, and
   restarts the services. Database migrations run automatically at API
   startup and are additive.

## Rolling back

- Registry installs: set `NORDSVAR_VERSION=<forrige-version>` in
  `~/nordsvar/.env`, then `docker compose up -d` in `~/nordsvar`.
- Source builds: check out the previous git tag and re-run the installer.

Migrations are designed to be backward compatible within a release line;
if a rollback ever needs more than this, the release notes will say so.

## If something goes wrong

```bash
cd ~/nordsvar
docker compose ps                 # which services are up
docker compose logs nordsvar-api  # API logs (most installs fail here)
docker compose restart            # try a clean restart first
```

Fresh start (deletes all data): `docker compose down -v` in `~/nordsvar`,
then run the installer again.

## The services

| Service | Role | Data |
|---|---|---|
| nordsvar-web | The web app (nginx) on port 8081 | none |
| nordsvar-api | Sessions, auth, KB admin | Postgres |
| nordsvar-ai-worker | The AI participant in calls | - |
| livekit | Voice/screen media transport | none |
| postgres | Sessions, audit log, user accounts | volume `pg-data` |
| qdrant | Knowledge-base vectors | volume `qdrant-data` |

Optional profile `local-models` adds Ollama (LLM + embeddings), the
whisper.cpp STT server, and the Piper TTS server:

```bash
cd ~/nordsvar
docker compose --profile local-models up -d
```

### Model weights (mirrored, never downloaded at runtime)

The STT/TTS containers expect weights under `./models` next to your
compose file (override with `NORDSVAR_MODELS_DIR` in `.env`):

| File | Used by | Where it comes from |
|---|---|---|
| `ggml-small.bin` | STT | whisper.cpp ggml weights; the Danish fine-tune is decision D-002 |
| `da_DK-default.onnx` (+ `.onnx.json`) | TTS | Piper Danish voice |

Download them on a connected machine, verify the publisher's checksums,
copy them into `~/nordsvar/models/`, then start the profile. Nothing in
the stack fetches models itself.

Ollama pulls its models on first use; for air-gapped installs, pre-pull on
a connected machine and copy the `ollama-models` volume, or run vLLM on a
GPU host and set `LLM_URL`/`EMBED_URL` in `.env` instead.

## Security notes

- `~/nordsvar/.env` is the only file with secrets. Keep it 600; it is
  excluded from backups you share.
- First-run setup is open exactly until the first administrator exists,
  then closes permanently.
- The deployment listens on localhost/LAN port 8081 (web) plus LiveKit's
  media ports (7880, 7881, 50000-50100/udp). Put your own TLS terminator
  in front for non-localhost access (see Prerequisites in README).
- Authentication defaults to local accounts (`AUTH_MODE=local`). Corporate
  SSO via OIDC is available; see docs/SECURITY.md.

## Salad.com (demo only)

Salad's Container Engine cannot carry the full stack: its gateway is
HTTPS-only (no UDP for WebRTC media) and container storage is ephemeral
(no persistent volumes for Postgres/Qdrant). We document a demo/evaluation
deployment in deploy/salad/README.md with those caveats called out.

Vast.ai (GPU proof-of-concept tier): unlike Salad, Vast can open UDP ports
and offers persistent (machine-local) volumes, so a Nordsvar demo with
working voice calls is expressible there. It remains rented capacity with
contract end dates, shared IPs, and no managed backups. The honest
assessment and a topology are in deploy/vast/README.md; we have not rented
an instance to validate LiveKit through Vast's NAT.

GitHub Codespaces (free demo): a codespace is a real VM and runs the
whole self-host stack unchanged. Create a codespace on main and the
devcontainer boots it for you - see deploy/codespaces/README.md. Free
monthly quota on personal GitHub accounts only; synthetic data only;
media rides TCP tunneling (unverified). Cloudflare cannot run the stack
(no UDP, no Postgres, isolate CPU limits) - Pages is a static-web mirror
option only.

For anything real, use a machine you control as described above.
