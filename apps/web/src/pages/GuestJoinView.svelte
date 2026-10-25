<script lang="ts">
  // Guest join page (/s/{session-id}?t=...): the phone-to-screen handoff.
  // A signed, expiring token in the URL is the credential - no login.
  // The guest joins the same LiveKit room as the ongoing call and shares
  // their screen; the assistant then sees the screen live.
  import { onMount } from 'svelte';
  import { NordsvarApi } from '../lib/api';
  import { createLiveKitSession, type MediaSession } from '../lib/media';
  import { t } from '../lib/i18n.svelte';

  let { token }: { token: string } = $props();

  const api = new NordsvarApi('');
  let phase = $state<'joining' | 'ready' | 'connected' | 'error'>('joining');
  let error = $state('');
  let session = $state<MediaSession | null>(null);
  let sharing = $state(false);
  // Mobile browsers (iOS and Android Chrome) have no getDisplayMedia: the
  // guest can listen/talk, but screen sharing needs a desktop browser. We
  // say so up front instead of failing mid-flow.
  const canShareScreen =
    typeof navigator !== 'undefined' &&
    typeof navigator.mediaDevices?.getDisplayMedia === 'function';

  onMount(async () => {
    try {
      const ticket = await api.guestJoin(token);
      const s = await createLiveKitSession(
        {
          livekitUrl: ticket.livekit_url,
          token: ticket.token,
          turn: ticket.turn ?? undefined,
        },
        {
          onConnectionChange: (connected) => {
            phase = connected ? 'connected' : 'error';
            if (!connected) error = t().guest.disconnected;
          },
          onError: (message) => {
            phase = 'error';
            error = message;
          },
        },
      );
      await s.connect();
      session = s;
      phase = 'connected';
    } catch (e) {
      phase = 'error';
      const msg = e instanceof Error ? e.message : '';
      error =
        msg.includes('401') || msg.includes('403')
          ? t().guest.expired
          : msg.includes('404') || msg.includes('409')
            ? t().guest.sessionEnded
            : t().guest.joinFailed;
    }
  });

  async function toggleShare() {
    if (!session) return;
    try {
      await session.setScreenShareEnabled(!sharing);
      sharing = !sharing;
    } catch {
      error = t().guest.shareFailed;
    }
  }
</script>

<main class="card" aria-labelledby="guest-heading">
  <h1 id="guest-heading">{t().guest.heading}</h1>
  {#if phase === 'joining'}
    <p role="status">{t().guest.joining}</p>
  {:else if phase === 'error'}
    <p role="alert" class="error">{error}</p>
  {:else}
    <p role="status" class="live">{t().guest.connected}</p>
    {#if canShareScreen}
      <p>{t().guest.shareText}</p>
      <button class="primary" onclick={toggleShare}>
        {sharing ? t().guest.shareStop : t().guest.shareStart}
      </button>
    {:else}
      <p>{t().guest.noShare}</p>
    {/if}
    <button class="danger" onclick={() => session?.disconnect()}>{t().guest.leave}</button>
  {/if}
</main>

<style>
  .card {
    background: white;
    border-radius: 12px;
    padding: 1.5rem;
    max-width: 34rem;
    margin: 2rem auto;
    display: grid;
    gap: 0.75rem;
    line-height: 1.5;
  }
  h1 {
    font-size: 1.25rem;
    margin: 0;
  }
  p {
    margin: 0;
  }
  .live {
    color: #0f5f4b;
    font-weight: 600;
  }
  .error {
    color: #b3261e;
  }
  button {
    padding: 0.6rem 1.2rem;
    border-radius: 8px;
    border: 1px solid #0f5f4b;
    background: #fff;
    color: #0f5f4b;
    cursor: pointer;
    min-height: 44px;
    font-size: 1rem;
  }
  button.primary {
    background: #0f5f4b;
    color: #fff;
  }
  button.danger {
    border-color: #b3261e;
    color: #b3261e;
  }
  button:focus-visible {
    outline: 3px solid #2fbd96;
    outline-offset: 2px;
  }
</style>
