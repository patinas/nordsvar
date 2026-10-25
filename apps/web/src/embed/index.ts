/**
 * Nordsvar website widget (v1). Framework-free so any site can embed it:
 *
 *   <script src="https://<host>/embed/v1.js" data-nordsvar-key="pk_..." async></script>
 *
 * Privacy: no cookies, no localStorage, nothing on the visitor's device.
 * The chat session lives only in this page's memory; a reload starts a new
 * one. The public key identifies the tenant but grants nothing by itself -
 * the API authorizes by this page's Origin against the tenant's allowed
 * domains.
 */

interface WidgetConfig {
  theme_color: string | null;
  position: string | null;
  language: string | null;
  voice_enabled: boolean;
}

interface VoiceTicket {
  token: string;
  livekit_url: string;
  room: string;
  identity: string;
}

const STRINGS: Record<string, Record<string, string>> = {
  da: {
    open: 'Åbn chat',
    close: 'Luk chat',
    title: 'Spørg os',
    placeholder: 'Skriv din besked…',
    send: 'Send',
    thinking: 'Tænker…',
    unavailable: 'Chatten er ikke tilgængelig på denne side.',
    error: 'Noget gik galt. Prøv igen om lidt.',
    voice: 'Start tale',
    voiceStop: 'Stop tale',
    voiceConnecting: 'Forbinder tale…',
    empty: 'Stil et spørgsmål, så svarer assistenten ud fra virksomhedens egne dokumenter.',
  },
  en: {
    open: 'Open chat',
    close: 'Close chat',
    title: 'Ask us',
    placeholder: 'Type your message…',
    send: 'Send',
    thinking: 'Thinking…',
    unavailable: 'Chat is not available on this site.',
    error: 'Something went wrong. Please try again later.',
    voice: 'Start voice',
    voiceStop: 'Stop voice',
    voiceConnecting: 'Connecting voice…',
    empty: 'Ask a question and the assistant answers from the company documents.',
  },
};

const DEFAULT_COLOR = '#0f5f4b';

function currentScript(): HTMLScriptElement | null {
  // `document.currentScript` is null for async/deferred loads by the time
  // this runs, so fall back to finding our own tag by attribute.
  const own = document.currentScript as HTMLScriptElement | null;
  if (own?.dataset.nordsvarKey) return own;
  return document.querySelector<HTMLScriptElement>('script[data-nordsvar-key]');
}

function boot() {
  const scriptTag = currentScript();
  const key = scriptTag?.dataset.nordsvarKey?.trim();
  if (!scriptTag || !key) {
    console.warn('[nordsvar] mangler data-nordsvar-key på script-tagget');
    return;
  }
  const apiBase = new URL(scriptTag.src).origin;

  // One widget per page.
  if (document.querySelector('nordsvar-widget')) return;
  const host = document.createElement('nordsvar-widget');
  document.body.appendChild(host);
  const root = host.attachShadow({ mode: 'open' });

  let lang = STRINGS.da;
  let sessionId: string | null = null;
  let sessionPromise: Promise<string> | null = null;
  let configFailed = false;
  let voiceRoom: { disconnect(): void } | null = null;
  let lastFocus: HTMLElement | null = null;

  const style = document.createElement('style');
  root.appendChild(style);
  const bubble = document.createElement('button');
  bubble.type = 'button';
  bubble.className = 'bubble';
  bubble.setAttribute('aria-label', STRINGS.da.open);
  bubble.setAttribute('aria-expanded', 'false');
  bubble.innerHTML =
    '<svg viewBox="0 0 24 24" width="26" height="26" aria-hidden="true"><path fill="currentColor" d="M4 4h16a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H8l-4 4V6a2 2 0 0 1 2-2z"/></svg>';
  const panel = document.createElement('section');
  panel.className = 'panel';
  panel.hidden = true;
  panel.setAttribute('role', 'dialog');
  panel.setAttribute('aria-modal', 'false');
  root.appendChild(bubble);
  root.appendChild(panel);

  function t(id: string): string {
    return lang[id] ?? STRINGS.da[id] ?? id;
  }

  function applyTheme(config: WidgetConfig) {
    const color =
      config.theme_color && /^#[0-9a-fA-F]{6}$/.test(config.theme_color)
        ? config.theme_color
        : DEFAULT_COLOR;
    const side = config.position === 'left' ? 'left' : 'right';
    lang = STRINGS[config.language === 'en' ? 'en' : 'da'];
    bubble.setAttribute('aria-label', t('open'));
    panel.setAttribute('aria-label', t('title'));
    style.textContent = `
      :host { all: initial; }
      * { box-sizing: border-box; font-family: system-ui, -apple-system, "Segoe UI", sans-serif; }
      .bubble {
        position: fixed; bottom: 20px; ${side}: 20px; z-index: 2147483000;
        width: 56px; height: 56px; border-radius: 50%; border: 0; cursor: pointer;
        background: ${color}; color: #fff; display: flex; align-items: center; justify-content: center;
        box-shadow: 0 4px 14px rgba(0,0,0,.3);
      }
      .bubble:focus-visible { outline: 3px solid #fff; outline-offset: 2px; }
      .panel[hidden] { display: none; }
      .panel {
        position: fixed; bottom: 88px; ${side}: 20px; z-index: 2147483000;
        width: 380px; max-width: calc(100vw - 40px); height: 520px; max-height: calc(100dvh - 120px);
        background: #fff; color: #17252b; border-radius: 14px; overflow: hidden;
        display: flex; flex-direction: column; box-shadow: 0 12px 40px rgba(0,0,0,.35);
      }
      .head { background: ${color}; color: #fff; padding: 12px 14px; display: flex; align-items: center; justify-content: space-between; }
      .head h2 { margin: 0; font-size: 16px; font-weight: 600; }
      .head button { background: none; border: 0; color: #fff; font-size: 20px; cursor: pointer; padding: 4px 8px; }
      .log { flex: 1; overflow-y: auto; padding: 12px; display: flex; flex-direction: column; gap: 8px; }
      .msg { max-width: 85%; padding: 8px 12px; border-radius: 12px; white-space: pre-wrap; word-break: break-word; font-size: 14px; line-height: 1.4; }
      .msg.user { align-self: flex-end; background: ${color}; color: #fff; }
      .msg.bot { align-self: flex-start; background: #f0f3f4; }
      .msg.note { align-self: center; background: none; color: #5b6b72; font-size: 13px; }
      .cite { font-size: 12px; color: #5b6b72; margin-top: 4px; }
      .composer { display: flex; gap: 8px; padding: 10px; border-top: 1px solid #e2e8ea; }
      .composer input { flex: 1; border: 1px solid #c9d4d8; border-radius: 8px; padding: 10px; font-size: 14px; }
      .composer button { border: 0; border-radius: 8px; background: ${color}; color: #fff; padding: 0 16px; cursor: pointer; font-size: 14px; }
      .composer button:disabled { opacity: .55; cursor: default; }
      .voice { border-top: 1px solid #e2e8ea; padding: 8px 10px; }
      .voice button { width: 100%; border: 1px solid ${color}; background: #fff; color: ${color}; border-radius: 8px; padding: 8px; cursor: pointer; font-size: 14px; }
      .voice button.on { background: ${color}; color: #fff; }
      @media (max-width: 480px) {
        .panel { inset: 0; max-width: none; width: auto; height: auto; max-height: none; bottom: 0; ${side}: 0; border-radius: 0; }
        .bubble { bottom: 16px; ${side}: 16px; }
      }
    `;
  }

  async function api<T>(path: string, init?: RequestInit): Promise<T> {
    const resp = await fetch(`${apiBase}${path}`, init);
    if (!resp.ok) throw new Error(`nordsvar ${path}: ${resp.status}`);
    return (await resp.json()) as T;
  }

  function ensureSession(): Promise<string> {
    if (sessionId) return Promise.resolve(sessionId);
    if (!sessionPromise) {
      sessionPromise = api<{ session_id: string }>('/v1/public/embed/session', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ key }),
      }).then((r) => {
        sessionId = r.session_id;
        return sessionId!;
      });
    }
    return sessionPromise;
  }

  const log = document.createElement('div');
  log.className = 'log';
  log.setAttribute('aria-live', 'polite');

  function addMsg(kind: 'user' | 'bot' | 'note', text: string, sources?: string[]): HTMLElement {
    const el = document.createElement('div');
    el.className = `msg ${kind}`;
    el.textContent = text;
    if (sources && sources.length > 0) {
      const cite = document.createElement('div');
      cite.className = 'cite';
      cite.textContent = sources.filter(Boolean).join(' · ');
      el.appendChild(cite);
    }
    log.appendChild(el);
    log.scrollTop = log.scrollHeight;
    return el;
  }

  const head = document.createElement('header');
  head.className = 'head';
  const title = document.createElement('h2');
  const closeBtn = document.createElement('button');
  closeBtn.type = 'button';
  closeBtn.setAttribute('aria-label', t('close'));
  closeBtn.textContent = '×';
  head.appendChild(title);
  head.appendChild(closeBtn);

  const composer = document.createElement('form');
  composer.className = 'composer';
  const input = document.createElement('input');
  input.maxLength = 2000;
  const sendBtn = document.createElement('button');
  sendBtn.type = 'submit';
  composer.appendChild(input);
  composer.appendChild(sendBtn);

  panel.appendChild(head);
  panel.appendChild(log);
  panel.appendChild(composer);

  let busy = false;
  composer.addEventListener('submit', async (e) => {
    e.preventDefault();
    const text = input.value.trim();
    if (!text || busy || configFailed) return;
    busy = true;
    sendBtn.disabled = true;
    input.value = '';
    addMsg('user', text);
    const note = addMsg('note', t('thinking'));
    try {
      const sid = await ensureSession();
      const r = await api<{ answer: string; citations?: { source?: string }[] }>(
        '/v1/public/embed/message',
        {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ session_id: sid, text }),
        },
      );
      note.remove();
      addMsg(
        'bot',
        r.answer,
        (r.citations ?? []).map((c) => c.source ?? '').filter(Boolean),
      );
    } catch {
      note.textContent = t('error');
    } finally {
      busy = false;
      sendBtn.disabled = false;
      input.focus();
    }
  });

  async function toggleVoice(btn: HTMLButtonElement) {
    if (voiceRoom) {
      voiceRoom.disconnect();
      voiceRoom = null;
      btn.classList.remove('on');
      btn.textContent = t('voice');
      return;
    }
    btn.disabled = true;
    btn.textContent = t('voiceConnecting');
    try {
      const sid = await ensureSession();
      const ticket = await api<VoiceTicket>('/v1/public/embed/voice', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ session_id: sid }),
      });
      // Lazy-load the voice stack only when the visitor actually uses it.
      const livekit = await import('livekit-client');
      const room = new livekit.Room();
      await room.connect(ticket.livekit_url, ticket.token);
      await room.localParticipant.setMicrophoneEnabled(true);
      voiceRoom = room;
      room.on('disconnected', () => {
        voiceRoom = null;
        btn.classList.remove('on');
        btn.textContent = t('voice');
      });
      btn.classList.add('on');
      btn.textContent = t('voiceStop');
    } catch {
      addMsg('note', t('error'));
      btn.textContent = t('voice');
    } finally {
      btn.disabled = false;
    }
  }

  function openPanel() {
    lastFocus = document.activeElement as HTMLElement | null;
    panel.hidden = false;
    bubble.setAttribute('aria-expanded', 'true');
    bubble.setAttribute('aria-label', t('close'));
    if (configFailed) {
      if (!log.childElementCount) addMsg('note', t('unavailable'));
    } else if (!log.childElementCount) {
      addMsg('note', t('empty'));
    }
    input.focus();
  }

  function closePanel() {
    panel.hidden = true;
    bubble.setAttribute('aria-expanded', 'false');
    bubble.setAttribute('aria-label', t('open'));
    lastFocus?.focus();
  }

  bubble.addEventListener('click', () => (panel.hidden ? openPanel() : closePanel()));
  closeBtn.addEventListener('click', closePanel);
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !panel.hidden) closePanel();
  });

  // Boot: theme + strings from the tenant's public config.
  api<WidgetConfig>(`/v1/public/embed/config?key=${encodeURIComponent(key)}`)
    .then((config) => {
      applyTheme(config);
      title.textContent = t('title');
      input.placeholder = t('placeholder');
      sendBtn.textContent = t('send');
      if (config.voice_enabled) {
        const voiceBar = document.createElement('div');
        voiceBar.className = 'voice';
        const voiceBtn = document.createElement('button');
        voiceBtn.type = 'button';
        voiceBtn.textContent = t('voice');
        voiceBtn.addEventListener('click', () => void toggleVoice(voiceBtn));
        voiceBar.appendChild(voiceBtn);
        panel.insertBefore(voiceBar, composer);
      }
    })
    .catch(() => {
      // Wrong key or this site's host is not on the tenant's domain list:
      // the bubble still opens but explains itself instead of failing mute.
      configFailed = true;
      applyTheme({ theme_color: null, position: null, language: null, voice_enabled: false });
      title.textContent = t('title');
      input.placeholder = t('placeholder');
      sendBtn.textContent = t('send');
      input.disabled = true;
      sendBtn.disabled = true;
    });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot);
} else {
  boot();
}

export {};
