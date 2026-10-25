const y = {
  da: {
    open: "Åbn chat",
    close: "Luk chat",
    title: "Spørg os",
    placeholder: "Skriv din besked…",
    send: "Send",
    thinking: "Tænker…",
    unavailable: "Chatten er ikke tilgængelig på denne side.",
    error: "Noget gik galt. Prøv igen om lidt.",
    voice: "Start tale",
    voiceStop: "Stop tale",
    voiceConnecting: "Forbinder tale…",
    empty: "Stil et spørgsmål, så svarer assistenten ud fra virksomhedens egne dokumenter."
  },
  en: {
    open: "Open chat",
    close: "Close chat",
    title: "Ask us",
    placeholder: "Type your message…",
    send: "Send",
    thinking: "Thinking…",
    unavailable: "Chat is not available on this site.",
    error: "Something went wrong. Please try again later.",
    voice: "Start voice",
    voiceStop: "Stop voice",
    voiceConnecting: "Connecting voice…",
    empty: "Ask a question and the assistant answers from the company documents."
  }
}, I = "#0f5f4b";
function U() {
  const s = document.currentScript;
  return s != null && s.dataset.nordsvarKey ? s : document.querySelector("script[data-nordsvar-key]");
}
function _() {
  var T;
  const s = U(), w = (T = s == null ? void 0 : s.dataset.nordsvarKey) == null ? void 0 : T.trim();
  if (!s || !w) {
    console.warn("[nordsvar] mangler data-nordsvar-key på script-tagget");
    return;
  }
  const B = new URL(s.src).origin;
  if (document.querySelector("nordsvar-widget")) return;
  const L = document.createElement("nordsvar-widget");
  document.body.appendChild(L);
  const C = L.attachShadow({ mode: "open" });
  let N = y.da, h = null, k = null, S = !1, f = null, x = null;
  const z = document.createElement("style");
  C.appendChild(z);
  const a = document.createElement("button");
  a.type = "button", a.className = "bubble", a.setAttribute("aria-label", y.da.open), a.setAttribute("aria-expanded", "false"), a.innerHTML = '<svg viewBox="0 0 24 24" width="26" height="26" aria-hidden="true"><path fill="currentColor" d="M4 4h16a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H8l-4 4V6a2 2 0 0 1 2-2z"/></svg>';
  const i = document.createElement("section");
  i.className = "panel", i.hidden = !0, i.setAttribute("role", "dialog"), i.setAttribute("aria-modal", "false"), C.appendChild(a), C.appendChild(i);
  function n(e) {
    return N[e] ?? y.da[e] ?? e;
  }
  function O(e) {
    const o = e.theme_color && /^#[0-9a-fA-F]{6}$/.test(e.theme_color) ? e.theme_color : I, t = e.position === "left" ? "left" : "right";
    N = y[e.language === "en" ? "en" : "da"], a.setAttribute("aria-label", n("open")), i.setAttribute("aria-label", n("title")), z.textContent = `
      :host { all: initial; }
      * { box-sizing: border-box; font-family: system-ui, -apple-system, "Segoe UI", sans-serif; }
      .bubble {
        position: fixed; bottom: 20px; ${t}: 20px; z-index: 2147483000;
        width: 56px; height: 56px; border-radius: 50%; border: 0; cursor: pointer;
        background: ${o}; color: #fff; display: flex; align-items: center; justify-content: center;
        box-shadow: 0 4px 14px rgba(0,0,0,.3);
      }
      .bubble:focus-visible { outline: 3px solid #fff; outline-offset: 2px; }
      .panel[hidden] { display: none; }
      .panel {
        position: fixed; bottom: 88px; ${t}: 20px; z-index: 2147483000;
        width: 380px; max-width: calc(100vw - 40px); height: 520px; max-height: calc(100dvh - 120px);
        background: #fff; color: #17252b; border-radius: 14px; overflow: hidden;
        display: flex; flex-direction: column; box-shadow: 0 12px 40px rgba(0,0,0,.35);
      }
      .head { background: ${o}; color: #fff; padding: 12px 14px; display: flex; align-items: center; justify-content: space-between; }
      .head h2 { margin: 0; font-size: 16px; font-weight: 600; }
      .head button { background: none; border: 0; color: #fff; font-size: 20px; cursor: pointer; padding: 4px 8px; }
      .log { flex: 1; overflow-y: auto; padding: 12px; display: flex; flex-direction: column; gap: 8px; }
      .msg { max-width: 85%; padding: 8px 12px; border-radius: 12px; white-space: pre-wrap; word-break: break-word; font-size: 14px; line-height: 1.4; }
      .msg.user { align-self: flex-end; background: ${o}; color: #fff; }
      .msg.bot { align-self: flex-start; background: #f0f3f4; }
      .msg.note { align-self: center; background: none; color: #5b6b72; font-size: 13px; }
      .cite { font-size: 12px; color: #5b6b72; margin-top: 4px; }
      .composer { display: flex; gap: 8px; padding: 10px; border-top: 1px solid #e2e8ea; }
      .composer input { flex: 1; border: 1px solid #c9d4d8; border-radius: 8px; padding: 10px; font-size: 14px; }
      .composer button { border: 0; border-radius: 8px; background: ${o}; color: #fff; padding: 0 16px; cursor: pointer; font-size: 14px; }
      .composer button:disabled { opacity: .55; cursor: default; }
      .voice { border-top: 1px solid #e2e8ea; padding: 8px 10px; }
      .voice button { width: 100%; border: 1px solid ${o}; background: #fff; color: ${o}; border-radius: 8px; padding: 8px; cursor: pointer; font-size: 14px; }
      .voice button.on { background: ${o}; color: #fff; }
      @media (max-width: 480px) {
        .panel { inset: 0; max-width: none; width: auto; height: auto; max-height: none; bottom: 0; ${t}: 0; border-radius: 0; }
        .bubble { bottom: 16px; ${t}: 16px; }
      }
    `;
  }
  async function g(e, o) {
    const t = await fetch(`${B}${e}`, o);
    if (!t.ok) throw new Error(`nordsvar ${e}: ${t.status}`);
    return await t.json();
  }
  function P() {
    return h ? Promise.resolve(h) : (k || (k = g("/v1/public/embed/session", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ key: w })
    }).then((e) => (h = e.session_id, h))), k);
  }
  const c = document.createElement("div");
  c.className = "log", c.setAttribute("aria-live", "polite");
  function u(e, o, t) {
    const l = document.createElement("div");
    if (l.className = `msg ${e}`, l.textContent = o, t && t.length > 0) {
      const r = document.createElement("div");
      r.className = "cite", r.textContent = t.filter(Boolean).join(" · "), l.appendChild(r);
    }
    return c.appendChild(l), c.scrollTop = c.scrollHeight, l;
  }
  const v = document.createElement("header");
  v.className = "head";
  const E = document.createElement("h2"), b = document.createElement("button");
  b.type = "button", b.setAttribute("aria-label", n("close")), b.textContent = "×", v.appendChild(E), v.appendChild(b);
  const m = document.createElement("form");
  m.className = "composer";
  const d = document.createElement("input");
  d.maxLength = 2e3;
  const p = document.createElement("button");
  p.type = "submit", m.appendChild(d), m.appendChild(p), i.appendChild(v), i.appendChild(c), i.appendChild(m);
  let $ = !1;
  m.addEventListener("submit", async (e) => {
    e.preventDefault();
    const o = d.value.trim();
    if (!o || $ || S) return;
    $ = !0, p.disabled = !0, d.value = "", u("user", o);
    const t = u("note", n("thinking"));
    try {
      const l = await P(), r = await g(
        "/v1/public/embed/message",
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ session_id: l, text: o })
        }
      );
      t.remove(), u(
        "bot",
        r.answer,
        (r.citations ?? []).map((M) => M.source ?? "").filter(Boolean)
      );
    } catch {
      t.textContent = n("error");
    } finally {
      $ = !1, p.disabled = !1, d.focus();
    }
  });
  async function j(e) {
    if (f) {
      f.disconnect(), f = null, e.classList.remove("on"), e.textContent = n("voice");
      return;
    }
    e.disabled = !0, e.textContent = n("voiceConnecting");
    try {
      const o = await P(), t = await g("/v1/public/embed/voice", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ session_id: o })
      }), l = await import("./livekit-client.esm-C49lQmXt.js"), r = new l.Room();
      await r.connect(t.livekit_url, t.token), await r.localParticipant.setMicrophoneEnabled(!0), f = r, r.on("disconnected", () => {
        f = null, e.classList.remove("on"), e.textContent = n("voice");
      }), e.classList.add("on"), e.textContent = n("voiceStop");
    } catch {
      u("note", n("error")), e.textContent = n("voice");
    } finally {
      e.disabled = !1;
    }
  }
  function R() {
    x = document.activeElement, i.hidden = !1, a.setAttribute("aria-expanded", "true"), a.setAttribute("aria-label", n("close")), S ? c.childElementCount || u("note", n("unavailable")) : c.childElementCount || u("note", n("empty")), d.focus();
  }
  function A() {
    i.hidden = !0, a.setAttribute("aria-expanded", "false"), a.setAttribute("aria-label", n("open")), x == null || x.focus();
  }
  a.addEventListener("click", () => i.hidden ? R() : A()), b.addEventListener("click", A), document.addEventListener("keydown", (e) => {
    e.key === "Escape" && !i.hidden && A();
  }), g(`/v1/public/embed/config?key=${encodeURIComponent(w)}`).then((e) => {
    if (O(e), E.textContent = n("title"), d.placeholder = n("placeholder"), p.textContent = n("send"), e.voice_enabled) {
      const o = document.createElement("div");
      o.className = "voice";
      const t = document.createElement("button");
      t.type = "button", t.textContent = n("voice"), t.addEventListener("click", () => void j(t)), o.appendChild(t), i.insertBefore(o, m);
    }
  }).catch(() => {
    S = !0, O({ theme_color: null, position: null, language: null }), E.textContent = n("title"), d.placeholder = n("placeholder"), p.textContent = n("send"), d.disabled = !0, p.disabled = !0;
  });
}
document.readyState === "loading" ? document.addEventListener("DOMContentLoaded", _) : _();
