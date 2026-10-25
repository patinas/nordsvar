// Session controller: pure UI-state logic for a support session, framework
// free and fully unit-testable. Svelte components bind to its state.

import type { NordsvarApi, SessionInfo, TenantCredentials } from './api';
import type { JoinParams, MediaSession, TranscriptEntry } from './media';

export type SessionPhase =
  | 'idle'
  | 'creating'
  | 'joining'
  | 'active'
  | 'ending'
  | 'ended'
  | 'error';

export interface ShareLinkState {
  /** Absolute URL once created; empty until then. */
  link: string;
  busy: boolean;
  copied: boolean;
  error: string | null;
}

export interface SessionState {
  phase: SessionPhase;
  session: SessionInfo | null;
  transcript: TranscriptEntry[];
  micOn: boolean;
  sharingScreen: boolean;
  error: string | null;
  share: ShareLinkState;
}

export const initialState: SessionState = {
  phase: 'idle',
  session: null,
  transcript: [],
  micOn: false,
  sharingScreen: false,
  error: null,
  share: { link: '', busy: false, copied: false, error: null },
};

export type MediaSessionFactory = (
  params: JoinParams,
  events: {
    onTranscript: (e: TranscriptEntry) => void;
    onConnectionChange: (connected: boolean) => void;
  },
) => Promise<MediaSession>;

export class SessionController {
  private state: SessionState = { ...initialState };
  private listeners: Array<(s: SessionState) => void> = [];
  private media: MediaSession | null = null;

  constructor(
    private api: NordsvarApi,
    private creds: TenantCredentials,
    private mediaFactory: MediaSessionFactory,
  ) {}

  subscribe(listener: (s: SessionState) => void): () => void {
    this.listeners.push(listener);
    listener(this.snapshot());
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private snapshot(): SessionState {
    return {
      ...this.state,
      transcript: [...this.state.transcript],
    };
  }

  private update(patch: Partial<SessionState>): void {
    this.state = { ...this.state, ...patch };
    for (const l of this.listeners) l(this.snapshot());
  }

  /** Create a guest share link for the active session: the
   * phone-to-screen handoff. The signed link expires after two hours and
   * opens the /s/ join page, where the guest shares their screen into
   * this same room. */
  async createShareLink(origin: string): Promise<void> {
    const session = this.state.session;
    if (!session) return;
    this.update({ share: { link: '', busy: true, copied: false, error: null } });
    try {
      const r = await this.api.shareSession(this.creds, session.id);
      this.update({
        share: { link: `${origin}${r.path}`, busy: false, copied: false, error: null },
      });
    } catch (e) {
      this.update({
        share: {
          link: '',
          busy: false,
          copied: false,
          error: e instanceof Error ? e.message : 'share-link-failed',
        },
      });
    }
  }

  /** Mark the share link copied (view owns the clipboard call; this just
   * drives the transient Copieret label). */
  markShareCopied(): void {
    if (!this.state.share.link) return;
    this.update({ share: { ...this.state.share, copied: true } });
    setTimeout(() => {
      this.update({ share: { ...this.state.share, copied: false } });
    }, 2000);
  }

  /** Create a session, join it, connect media. One button for the user. */
  async start(displayName?: string): Promise<void> {
    this.update({ phase: 'creating', error: null });
    try {
      const session = await this.api.createSession(this.creds, displayName);
      this.update({ phase: 'joining', session });
      const ticket = await this.api.joinSession(this.creds, session.id, displayName);
      const media = await this.mediaFactory(
        {
          livekitUrl: ticket.livekit_url,
          token: ticket.token,
          turn: ticket.turn,
        },
        {
          onTranscript: (entry) =>
            this.update({ transcript: [...this.state.transcript, entry] }),
          onConnectionChange: (connected) => {
            if (!connected && this.state.phase === 'active') {
              this.update({ phase: 'ended' });
            }
          },
        },
      );
      this.media = media;
      await media.connect();
      await media.setMicrophoneEnabled(true);
      this.update({ phase: 'active', micOn: true });
    } catch (e) {
      this.update({ phase: 'error', error: e instanceof Error ? e.message : String(e) });
    }
  }

  async toggleMicrophone(): Promise<void> {
    if (!this.media) return;
    const next = !this.state.micOn;
    await this.media.setMicrophoneEnabled(next);
    this.update({ micOn: next });
  }

  async toggleScreenShare(): Promise<void> {
    if (!this.media) return;
    const next = !this.state.sharingScreen;
    try {
      await this.media.setScreenShareEnabled(next);
      this.update({ sharingScreen: next });
    } catch (e) {
      // User cancelled the picker: not an error state.
      this.update({ error: null });
      void e;
    }
  }

  async end(): Promise<void> {
    const session = this.state.session;
    this.update({ phase: 'ending' });
    try {
      await this.media?.disconnect();
      if (session) await this.api.endSession(this.creds, session.id);
    } finally {
      this.update({ phase: 'ended', micOn: false, sharingScreen: false });
      this.media = null;
    }
  }
}

