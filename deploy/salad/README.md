# Deploying a Nordsvar demo on SaladCloud (evaluation only)

Read this whole page before deploying. SaladCloud is a decentralized
marketplace of idle residential PCs. That shape has hard consequences for
Nordsvar, and we would rather you know them up front.

## What works and what does not

Verified against Salad's official documentation (September 2026):

| Nordsvar need | Salad reality | Source |
|---|---|---|
| Web app + API over HTTPS | Works: Container Gateway is an HTTPS load balancer with a `*.salad.cloud` URL | [networking](https://docs.salad.com/container-engine/explanation/infrastructure-platform/networking) |
| LiveKit media (voice/screen) | **Does not work**: the gateway carries HTTPS only - no UDP, no raw TCP, and TURN needs a non-HTTP port. WebSocket signalling passes, but with gateway authentication disabled and idle connections killed after 100 s | [networking](https://docs.salad.com/container-engine/explanation/infrastructure-platform/networking), [websockets](https://docs.salad.com/container-engine/explanation/gateway/websockets.md) |
| Postgres / Qdrant state | **Does not persist**: container storage is ephemeral and nodes are interruptible; there are no persistent volumes | [quickstart](https://docs.salad.com/container-engine/tutorials/quickstart), [container groups](https://docs.salad.com/container-engine/explanation/container-groups/container-groups) |
| Data sovereignty | **Conflicts**: workloads run on residential PCs in unknown locations. That is incompatible with the boundary Nordsvar promises for real data | [quickstart](https://docs.salad.com/container-engine/tutorials/quickstart) |
| Cost | Prepaid credits; purchases are final. There is no free tier to "just try it" | [billing](https://docs.salad.com/general/explanation/billing.md) |

So: **use Salad only for a throwaway demo of the setup wizard and the
knowledge-base admin UI, with synthetic data**. Calls need the LiveKit
media path, which Salad cannot carry; real data needs persistence and a
sovereign location, which Salad cannot offer. For anything real, follow
docs/INSTALL.md on a machine you control.

## Demo deployment (portal)

You need a SaladCloud account, an organization, and prepaid credits. We do
not create Salad resources for you; these steps are yours to run.

1. Build and push the web + API images to a registry Salad can pull
   (Docker Hub or similar; images up to 35 GB compressed are supported):

   ```bash
   docker build -f deploy/docker/api.Dockerfile -t <registry>/nordsvar-api:demo .
   docker build -f deploy/docker/web.Dockerfile -t <registry>/nordsvar-web:demo .
   docker push <registry>/nordsvar-api:demo
   docker push <registry>/nordsvar-web:demo
   ```

2. Deploy the API as a Container Group (Custom recipe):
   - Image: `<registry>/nordsvar-api:demo`, 1 replica, 1 vCPU / 1 GB RAM,
     no GPU
   - Environment: `AUTH_MODE=local`, a random `INTERNAL_TOKEN`, and leave
     `DATABASE_URL` unset (the API then uses in-memory stores - acceptable
     for a demo precisely because nothing persists)
   - Container Gateway on port 8080, authentication **enabled**
   - Health probes: startup/liveness/readiness all HTTP GET `/healthz`
3. Deploy the web app as a second Container Group: image
   `<registry>/nordsvar-web:demo`, Container Gateway on port 80. Point its
   nginx proxy at the API group's gateway URL (edit
   `deploy/docker/nginx.conf` before building, replacing `nordsvar-api:8080`
   with the API gateway host).
4. Open the web group's `*.salad.cloud` URL, create the demo administrator
   in the wizard, and try the KB admin with sample documents.

Expect the demo to forget everything when instances reallocate. That is
the platform working as documented, not a Nordsvar bug.

## Scripted variant

Salad offers an API for container-group management:
https://docs.salad.com/container-engine/tutorials/nodejs/deploy-via-api
We do not ship a ready-made script for it because a demo that forgets its
data still spends real, non-refundable credits - if you want one, the
portal steps above are the reference flow to automate.

## If you need GPU inference on Salad

The one shape that fits Salad's model is stateless batch/interactive
inference (their job-queue pattern). Running Nordsvar's LLM/STT/TTS workers
on Salad while the app, database, and media path live on your own
infrastructure is architecturally possible, but it ships your audio and
prompts to residential PCs - which breaks the sovereignty promise this
product exists to keep. We recommend local GPUs instead
(docs/ARCHITECTURE.md).
