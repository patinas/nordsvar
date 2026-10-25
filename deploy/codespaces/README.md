# Running a Nordsvar demo in GitHub Codespaces (free demo tier)

A codespace is a real Linux VM, so it can run the **entire** Nordsvar
self-host stack unchanged - unlike Cloudflare (no UDP, 10 ms CPU limits,
no Postgres; the full stack cannot run there - Cloudflare Pages remains an
option for a static mirror of the web app only).

Ground rules, non-negotiable:

- **Synthetic data only.** Codespaces runs on GitHub (US) infrastructure.
  No real company data, no real knowledge bases, no real calls with
  production content.
- **Demo, not production.** Codespaces auto-stop when idle and their
  disks are ephemeral. When the codespace is deleted, everything is gone.
- **Free quota, personal accounts only.** GitHub personal accounts include
  a monthly free quota of compute core-hours plus storage; organization
  and enterprise accounts do not. See
  https://docs.github.com/en/billing/concepts/product-billing/github-codespaces
  and
  https://docs.github.com/en/codespaces/troubleshooting/troubleshooting-included-usage.
- **Keep forwarded ports private** unless you are actively demoing; the
  devcontainer marks them private by default. Do not commit
  deploy/compose/.env - setup.sh generates throwaway secrets locally with
  chmod 600.

## How to start

1. In the GitHub repo: Code -> Codespaces -> Create codespace on main.
   The .devcontainer boots automatically; postCreateCommand runs
   deploy/codespaces/setup.sh, which generates a local .env and starts
   the standard self-host compose stack.
2. When the build finishes, open the PORTS panel and open the
   "Nordsvar web" port (8081). Complete the setup wizard and try the demo
   with synthetic documents.

## Codespaces networking quirk (validated 2026-09-13)

Codespaces VMs install per-container netfilter drop rules that silently
kill inter-container traffic on user-defined docker bridges while
net.bridge.bridge-nf-call-iptables=1 (the default). Symptom: api
crash-loops with "postgres connect: PoolTimedOut" while pg_isready is
green and published ports work. deploy/codespaces/setup.sh repairs this
by setting the three bridge-nf-call sysctls to 0 via a throwaway
privileged container (bridged traffic then bypasses netfilter; port
publishing and outbound NAT use the routed path and are unaffected),
then runs an inter-container nc self-check after compose up and fails
loudly instead of leaving a broken stack. If the check still fails,
reboot the codespace and re-run setup.sh; recreate as the last resort.

## What is verified - and the one tunnel limit (validated 2026-09-13)

Verified live in a real codespace against this exact setup:

- The stack boots via setup.sh and all containers stay healthy (after the
  networking quirk repair above).
- Through the forwarded 8081 URL: setup wizard, login, Supportsession,
  Administration (Brugere, Vidensbase, Indstillinger, Auditlog) all work.
- Call signalling works through the tunnel: the API hands out join tickets
  with the public wss://<codespace>-7880.<domain> URL
  (LIVEKIT_PUBLIC_URL, auto-derived by setup.sh), and the browser
  completes the LiveKit WebSocket handshake.

The one limit - call media cannot cross the tunnel, and this is a GitHub
platform constraint, not a Nordsvar defect:

- The forwarded-port tunnel (app.github.dev) is an HTTP/HTTPS reverse
  proxy. WebSocket (HTTP Upgrade) passes; raw TCP and UDP do not.
  Verified: a browser RTCPeerConnection given a TURN relay behind the
  tunnel (turns:<codespace>-7882.<domain>:443?transport=tcp) gathers zero
  candidates and coturn logs zero connection attempts, while curl to the
  same URL negotiates HTTP/2 at the GitHub edge without anything reaching
  the listener.
- Browsers cannot use raw ICE/TCP, and LiveKit's UDP media is
  unreachable. So no TURN server behind the tunnel can rescue browser
  media.

To demo the actual live call, give the browser a raw-TCP path instead:

1. Open the codespace in **VS Code desktop** (not the browser editor).
   Its port forwarding creates real localhost TCP tunnels.
2. In deploy/compose/.env, point the client-facing URLs at localhost:
   LIVEKIT_PUBLIC_URL=ws://localhost:7880 and
   TURN_URL=turn:localhost:7882?transport=tcp (keep the generated
   TURN_USERNAME/TURN_CREDENTIAL), then restart the api:
   docker compose -f deploy/compose/selfhost.yml -f deploy/codespaces/compose.override.yml up -d --force-recreate nordsvar-api
3. Forward ports 8081, 7880, and 7882 in VS Code desktop, open
   http://localhost:8081, and start a session. Media then rides
   TURN-over-TCP to localhost:7882 (coturn) and UDP from coturn to
   LiveKit inside the codespace. This localhost path follows the same
   code as the tunnel path; it is documented, not yet re-validated
   from a desktop client.

AI voice answers additionally need STT/LLM/TTS model endpoints
(Ollama/Whisper/Piper or an OpenAI-compatible provider key configured in
Indstillinger); the codespaces stack does not run local models by
default, so the demo validates call transport, not AI answers.
