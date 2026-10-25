# Deploying Nordsvar on Vast.ai (proof-of-concept tier)

Read this whole page before deploying. Vast.ai is a marketplace that rents
Docker containers on other people's machines, priced per second against a
prepaid credit balance. It is fundamentally more capable than Salad for
Nordsvar - UDP ports and persistent volumes both exist - but it is still
rented capacity with contract end dates, not a home for a production
deployment.

Verified against Vast.ai's official documentation (September 2026); every
claim in the table links its source.

## What works and what does not

| Nordsvar need | Vast.ai reality | Source |
|---|---|---|
| GPU for local AI (faster-whisper, Ollama/vLLM, Piper) | **This is Vast's strength**: per-second RTX-class instances, any Docker image, full SSH access | [instances](https://docs.vast.ai/guides/instances), [pricing](https://docs.vast.ai/guides/instances/pricing) |
| LiveKit media over UDP | **Possible, unverified**: custom TCP *and* UDP ports can be opened (`-p 7882:7882/udp`), but internal ports map to random external ports on a shared public IP. Identity mapping (`-p 70000:70000`) only works for ports above 70000. LiveKit's ICE layer must advertise that shared IP + mapped port; we have not run this end to end | [networking](https://docs.vast.ai/guides/instances/connect/networking), [docker environment](https://docs.vast.ai/guides/instances/docker-environment) |
| Postgres / Qdrant state | **Persists, machine-local only**: container storage dies with the instance; volumes survive instance destruction but are physically tied to one host machine and cannot move. There is no managed backup or replication. Storage is billed even while the instance is stopped | [storage types](https://docs.vast.ai/guides/instances/storage/types), [volumes](https://docs.vast.ai/guides/instances/storage/volumes), [billing](https://docs.vast.ai/guides/reference/faq/billing) |
| Compose stack | **Does not fit**: one container per instance; Docker-in-Docker is disabled. Multi-service needs a supervisord all-in-one image, or one instance per service | [technical FAQ](https://docs.vast.ai/guides/reference/faq/technical), [instances FAQ](https://docs.vast.ai/guides/reference/faq/instances) |
| Always-on hosting | **No guaranteed term**: every offer has a maximum rental duration; the rental end date is locked when you rent and the instance stops at expiry unless the host extends it. Interruptible instances are cheaper but can be paused by a higher bidder | [instances FAQ](https://docs.vast.ai/guides/reference/faq/instances), [rental types](https://docs.vast.ai/guides/reference/faq/rental-types) |
| Host quality | **Varies**: marketplace hosts range from residential PCs to certified datacenters; filter on `verified=true`, `reliability`, and `datacenter=true`. Datacenter compliance certifications (GDPR, ISO 27001, ...) are planned for highlighting, not generally attestable per machine today - do not make compliance claims from a Vast deployment | [search offers](https://docs.vast.ai/cli/reference/search-offers), [datacenter status](https://docs.vast.ai/host/datacenter-status) |
| Cost | Prepaid credits, per-second billing, market-driven prices that fluctuate with supply and demand. Instances stop automatically at zero balance | [pricing](https://docs.vast.ai/guides/instances/pricing), [billing](https://docs.vast.ai/guides/reference/faq/billing) |

## Honest conclusion

Compared with Salad (deploy/salad/README.md), Vast.ai removes the two
hard blockers: UDP ports exist, so the LiveKit media path is at least
expressible, and volumes exist, so Postgres/Qdrant state can survive an
instance restart. That makes Vast the better answer when the goal is *a
live GPU-backed Nordsvar demo where calls actually work*.

It is still not production hosting:

- A rental contract has an end date. Even on-demand instances stop when
  the offer's maximum duration expires; renewal depends on the host.
- Persistent volumes die with the physical host machine they live on.
- The instance's public IP is shared and port-mapped; the standard HTTPS
  port 443 cannot be identity-mapped (identity mapping requires ports
  above 70000), so the deployment lives on a non-standard port unless you
  put a reverse proxy you control in front of it.
- Host reliability, network quality, and physical location are
  marketplace variables, not guarantees.

For anything real, follow docs/INSTALL.md on a machine you control. Vast
is the right tier for evaluating the full stack - including voice - on
real GPUs without buying hardware.

## Proof-of-concept topology

One instance per service is the documented model; the cheapest topology
that exercises everything is a single GPU instance running an all-in-one
supervisord image:

1. Rent one **verified, datacenter, on-demand** instance with an RTX-class
   GPU (16 GB VRAM covers faster-whisper + a small Ollama model + Piper),
   4+ vCPU, 32 GB RAM, and a volume for Postgres/Qdrant data.
2. Build an all-in-one image based on the services in deploy/docker/ with
   supervisord starting postgres, qdrant, livekit-server, nordsvar-api,
   nordsvar-ai-worker (with STT/TTS/LLM pointing at localhost), and nginx.
3. Port configuration (set in the instance's docker options):
   - `-p 70001:70001` for the web app (identity-mapped; terminate TLS
     with Caddy inside the container, or front it with a proxy you own)
   - `-p 70002:7881` for LiveKit TCP (signalling/WebSocket)
   - `-p 70003:7882/udp` for LiveKit RTC media
4. Configure LiveKit with `rtc.udp_port: 70003`, `rtc.use_external_ip:
   true`, and the instance's shared public IP. This is the step we have
   not validated on Vast's NAT; expect ICE debugging on first contact.
5. Expect to debug the ICE path. If media fails, the fallback that keeps
   everything else honest is a TURN server on a cheap VPS you control -
   at which point evaluate whether the VPS should just run Nordsvar.

## What we have not done

We have not rented an instance, deployed Nordsvar on it, or measured
call quality through Vast's NAT. Renting costs prepaid credits, so the
live smoke test waits for explicit approval. Until it runs, treat the
LiveKit-over-Vast row above as "documented as possible", not "works".

There is no scripted one-line installer for this tier: renting a specific
machine is a judgment call (price, reliability score, datacenter status,
location), and we will not hide that behind a curl pipe.
