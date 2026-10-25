# Website embed (widget v1)

Nordsvar can be embedded on a customer's own website as a chat bubble with an optional voice call. The visitor chats against the tenant's knowledge base; the whole AI pipeline stays on the Nordsvar deployment.

## For the website administrator

Administration -> Indstillinger -> Integrering (widget):

1. Enable the widget and press Gem.
2. Generate a public key (`pk_...`). The key identifies the tenant in page source; it is **not** a secret and grants nothing by itself.
3. List the allowed domains (comma-separated; subdomains are included automatically).
4. Optionally pick color, position (left/right), language (da/en), and voice.
5. Paste the shown snippet before `</body>`:

```html
<script src="https://<your-nordsvar-host>/embed/v1.js" charset="utf-8" data-nordsvar-key="pk_..." async></script>
```

`charset="utf-8"` matters on pages that do not already declare UTF-8: without it, Danish characters in the widget render as mojibake.

## Security model

- **Authorization is by Origin, not by key.** Every browser request must come from a page whose Origin/Referer host matches the tenant's allowed-domain list. The API answers with a dynamic CORS allowance for exactly that origin; anything else gets 403.
- **No API secrets leave the server.** A tenant's external-provider key (when configured) is decrypted in-process only.
- **Rate limits:** fixed-window limits per visitor IP (10 session creations/min), per key (60/min), and per chat session (20 messages/min). Excess gets 429.
- **Ephemeral sessions:** widget sessions live in API memory with a 30-minute sliding expiry. No cookies, no localStorage, nothing on the visitor's device; a page reload starts a fresh session. Text exchanges are written to the tenant's own audit log like any other query.
- **Voice:** when enabled, the widget lazy-loads the LiveKit client (a separate ~200 kB chunk fetched only when the visitor presses the voice button) and joins a real session the AI worker answers, exactly like the support app.
- **CSP:** the snippet needs `script-src` for the Nordsvar host and `connect-src` for the API + LiveKit WebSocket (voice). The widget renders inside a shadow root and ships no global CSS.

## Public endpoints

| Endpoint | Purpose |
|---|---|
| `GET /v1/public/embed/config?key=` | theme/position/language/voice for the widget |
| `POST /v1/public/embed/session` | create an ephemeral chat session |
| `POST /v1/public/embed/message` | RAG-grounded text answer with citations |
| `POST /v1/public/embed/voice` | upgrade to a real voice session (when enabled) |
| `POST /v1/public/guest-join` | exchange a signed share link token for a join ticket |

## Guest share links (phone-to-screen handoff)

An agent on a call can press "Link til skærmdeling" in the support view. The API returns a signed link (`/s/{session}?t=...`, HMAC-signed with the LiveKit secret, 2-hour expiry, single purpose). The other person opens it in any browser - no login - and joins the same LiveKit room to share their screen while the call continues. This is the flow a phone caller follows when the AI or agent asks them to continue on a screen.

**Platform limitation:** mobile browsers (iOS Safari, Android Chrome) do not support `getDisplayMedia`. The guest page detects this and says so honestly: the guest can listen and talk, but sharing a screen requires a desktop browser.
