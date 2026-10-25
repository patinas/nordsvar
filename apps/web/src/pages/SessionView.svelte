<script lang="ts">
  import { SessionController, initialState, type SessionState } from '../lib/session_controller';
  import { NordsvarApi, type TenantCredentials } from '../lib/api';
  import { createLiveKitSession, type JoinParams } from '../lib/media';
  import type { MediaSessionEvents } from '../lib/media';
  import { t } from '../lib/i18n.svelte';

  let { credentials, displayName }: { credentials: TenantCredentials; displayName: string } =
    $props();

  let state = $state<SessionState>({ ...initialState });

  const api = new NordsvarApi('');
  const factory = (params: JoinParams, events: MediaSessionEvents) =>
    createLiveKitSession(params, events);
  // Read through a closure: credentials are fixed for this view's lifetime.
  const controller = new SessionController(
    api,
    (() => ({
      tenantId: credentials.tenantId,
      actorId: credentials.actorId,
      roles: credentials.roles,
      token: credentials.token,
    }))(),
    factory,
  );
  controller.subscribe((s) => (state = s));

  // Mobile browsers (iOS and Android Chrome) have no getDisplayMedia: the
  // call itself works fine, but this device cannot share its screen. We
  // say so plainly and offer the handoff instead of a dead button.
  const canShareScreen =
    typeof navigator !== 'undefined' &&
    typeof navigator.mediaDevices?.getDisplayMedia === 'function';
  // Web Share API (mostly phones): hand the link to any app/contact
  // natively instead of copy-paste.
  const canNativeShare = typeof navigator !== 'undefined' && 'share' in navigator;

  // Clipboard must be called from the view (browser gesture); the
  // controller owns the state machine around it.
  async function copyShareLink() {
    try {
      await navigator.clipboard.writeText(state.share.link);
      controller.markShareCopied();
    } catch {
      // Clipboard needs a secure context; the link is selectable anyway.
    }
  }

  async function nativeShareLink() {
    try {
      await navigator.share({ url: state.share.link });
    } catch {
      // User cancelled the share sheet: nothing to do.
    }
  }
</script>

<main class="card" aria-labelledby="session-heading">
  <h1 id="session-heading">{t().session.heading}</h1>

  {#if state.phase === 'idle'}
    <p class="lede">{t().session.idleText}</p>
    <button class="primary big" onclick={() => controller.start(displayName || undefined)}>
      {t().session.start}
    </button>
  {:else if state.phase === 'creating' || state.phase === 'joining'}
    <p role="status">{t().session.creating}</p>
  {:else if state.phase === 'active'}
    <p role="status" class="live">{t().session.connected}</p>
    <div class="controls">
      <button onclick={() => controller.toggleMicrophone()}>
        {state.micOn ? t().session.micOff : t().session.micOn}
      </button>
      {#if canShareScreen}
        <button onclick={() => controller.toggleScreenShare()}>
          {state.sharingScreen ? t().session.shareScreenStop : t().session.shareScreenStart}
        </button>
      {/if}
      <button
        onclick={() => controller.createShareLink(window.location.origin)}
        disabled={state.share.busy}
      >
        {state.share.busy ? t().session.shareLinkBusy : t().session.shareLinkCreate}
      </button>
      <button class="danger" onclick={() => controller.end()}>{t().session.end}</button>
    </div>
    {#if !canShareScreen}
      <div class="note" role="note">
        <p>{t().session.noScreenShare}</p>
        <p>{t().session.noScreenShareHandoff}</p>
      </div>
    {/if}
    {#if state.share.error}
      <p role="alert" class="error">{t().session.shareLinkFailed}</p>
    {/if}
    {#if state.share.link}
      <p class="hint">{t().session.shareLinkHint}</p>
      <div class="share-row">
        <input readonly value={state.share.link} aria-label={t().session.shareLinkLabel} />
        {#if canNativeShare}
          <button onclick={nativeShareLink}>{t().session.shareViaDevice}</button>
        {/if}
        <button onclick={copyShareLink}>
          {state.share.copied ? t().common.copied : t().common.copy}
        </button>
      </div>
    {/if}
    <section aria-labelledby="transcript-heading">
      <h2 id="transcript-heading">{t().session.transcriptHeading}</h2>
      {#if state.transcript.length === 0}
        <p class="hint">{t().session.transcriptEmpty}</p>
      {:else}
        <ol class="transcript">
          {#each state.transcript as entry}
            <li class={entry.speaker}>
              <strong>{entry.speaker === 'user' ? t().session.you : t().session.assistant}:</strong>
              {entry.text}
            </li>
          {/each}
        </ol>
      {/if}
    </section>
  {:else if state.phase === 'ending'}
    <p role="status">{t().session.ending}</p>
  {:else if state.phase === 'ended'}
    <p>{t().session.ended}</p>
    <button class="primary" onclick={() => controller.start(displayName || undefined)}>
      {t().session.startNew}
    </button>
  {:else if state.phase === 'error'}
    <p role="alert" class="error">{t().session.failed} {state.error}</p>
    <button onclick={() => controller.start(displayName || undefined)}>{t().session.retry}</button>
  {/if}
</main>

<style>
  .card {
    background: white;
    border-radius: 12px;
    padding: 1.5rem;
    box-shadow: 0 1px 4px rgb(16 38 46 / 0.08);
    display: grid;
    gap: 1rem;
  }
  h1 {
    font-size: 1.25rem;
    margin: 0;
  }
  h2 {
    font-size: 1rem;
    margin: 0;
  }
  .lede {
    margin: 0;
    line-height: 1.5;
  }
  .live {
    color: #1f8f6e;
    font-weight: 600;
  }
  .controls {
    display: flex;
    gap: 0.75rem;
    flex-wrap: wrap;
  }
  .controls button {
    flex: 1 1 auto;
  }
  button {
    background: #10262e;
    color: white;
    border: none;
    border-radius: 8px;
    padding: 0.7rem 1.2rem;
    font-size: 1rem;
    cursor: pointer;
    min-height: 44px;
  }
  button.big {
    font-size: 1.1rem;
    padding: 0.9rem 1.4rem;
  }
  .share-row {
    display: flex;
    gap: 0.5rem;
    margin-top: 0.5rem;
    flex-wrap: wrap;
  }
  .share-row input {
    flex: 1;
    min-width: 0;
    padding: 0.5rem;
    border: 1px solid #c9d4d8;
    border-radius: 8px;
    font-size: 0.85rem;
  }
  .hint {
    font-size: 0.9rem;
    color: #4a646d;
    margin: 0;
  }
  .note {
    background: #f6f8f7;
    border-left: 3px solid #2fbd96;
    border-radius: 0 8px 8px 0;
    padding: 0.75rem 1rem;
    font-size: 0.9rem;
    color: #33474f;
    display: grid;
    gap: 0.5rem;
  }
  .note p {
    margin: 0;
    line-height: 1.5;
  }
  button.danger {
    background: #b3324b;
  }
  button:focus-visible {
    outline: 3px solid #2fbd96;
    outline-offset: 2px;
  }
  .transcript {
    list-style: none;
    padding: 0;
    margin: 0;
    display: grid;
    gap: 0.5rem;
    max-height: 40vh;
    overflow-y: auto;
  }
  .transcript li {
    padding: 0.5rem 0.75rem;
    border-radius: 8px;
    background: #f6f8f7;
    line-height: 1.5;
  }
  .transcript li.assistant {
    background: #e6f6f0;
  }
  .error {
    color: #b3324b;
    font-weight: 600;
    margin: 0;
  }
</style>
