# Telephony (SIP) - preparation guide

Nordsvar telephony lets people call the AI assistant on an ordinary phone number. This document is the operator guide for activating it. **Nothing here has been purchased or activated**; the repository ships the configuration scaffolding only.

## Architecture

LiveKit SIP bridges the phone network and the AI session:

```
PSTN caller -> SIP provider trunk -> livekit/sip service -> LiveKit room -> ai-worker (STT -> LLM -> TTS)
```

The `livekit/sip` service runs alongside the existing LiveKit server (compose profile `telephony`). Inbound calls arrive on a SIP trunk from the provider; dispatch rules map the called number to a Nordsvar room; the worker joins and answers like a browser session. Phone-to-screen handoff uses guest share links (docs/EMBED.md): the caller opens the link on a computer and shares their screen while the call continues. Mobile browsers cannot share screens (no `getDisplayMedia`) - the handoff needs a desktop browser.

## What the operator must do (and buy)

1. **Choose a SIP provider and buy a number.** This is the only step that costs money and it is deliberately left to the operator. Options:
   - **Twilio** (self-serve, Danish numbers). Prices verified on twilio.com/en-us/voice/pricing/dk in September 2026 - re-check at activation: Danish mobile number $15/month; inbound calls $0.0107/min; SIP trunking termination (BYOC) $0.004/min; outbound to Danish landlines $0.024/min, to Danish mobiles $0.0564/min; call recording $0.0025/min.
   - **Danish SIP resellers** (Flexfone and similar) quote directly and may bundle number + minutes.
2. **Create an inbound trunk** pointing at the deployment's SIP service, and a **dispatch rule** mapping the number to the room pattern the worker answers. See LiveKit's SIP trunk setup guide (docs.livekit.io/telephony/start/sip-trunk-setup/).
3. **Start the service:** `docker compose --profile telephony up -d` with the trunk credentials in the environment (placeholders in docker-compose.yml; secrets come from the operator's secret store, never the repo).
4. **In the admin UI** (Indstillinger -> Telefoni): record the provider and the E.164 number. These fields are saved intent only - they activate nothing by themselves.

## Voice quality

The default TTS is Piper-class local synthesis; a Danish voice (`da_DK-talesyntese-medium`) exists in the Piper voices catalog. STT is the same whisper.cpp Danish pipeline as browser sessions.

## Honest boundaries

- Phone numbers and call minutes always cost money; there is no free tier for PSTN. The software side remains free and open source.
- Call recording, retention, and caller consent are the deploying organization's legal responsibility. Nordsvar makes no compliance claims.
