// Media session abstraction. The real implementation drives a LiveKit room
// (livekit-client); tests and UI development use the scripted fake below.
// The UI never touches livekit-client directly.

export interface TranscriptEntry {
  speaker: 'user' | 'assistant';
  text: string;
  at: number;
}

export interface MediaSessionEvents {
  onTranscript?: (entry: TranscriptEntry) => void;
  onConnectionChange?: (connected: boolean) => void;
  onError?: (message: string) => void;
}

export interface MediaSession {
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  setMicrophoneEnabled(enabled: boolean): Promise<void>;
  /** Start screen sharing via getDisplayMedia. Never touches the camera. */
  setScreenShareEnabled(enabled: boolean): Promise<void>;
  readonly connected: boolean;
  readonly microphoneEnabled: boolean;
  readonly screenShareEnabled: boolean;
}

export interface JoinParams {
  livekitUrl: string;
  token: string;
  /** TURN relay from the join ticket. Set when the deployment puts LiveKit
   * media behind a tunnel the browser cannot reach directly; the session
   * then overrides ICE servers with this relay. */
  turn?: { urls: string; username?: string; credential?: string };
}

/** Scripted session for tests and offline UI development. */
export class FakeMediaSession implements MediaSession {
  connected = false;
  microphoneEnabled = false;
  screenShareEnabled = false;
  script: TranscriptEntry[] = [];

  constructor(
    public params: JoinParams,
    private events: MediaSessionEvents = {},
  ) {}

  async connect(): Promise<void> {
    this.connected = true;
    this.events.onConnectionChange?.(true);
    for (const entry of this.script) this.events.onTranscript?.(entry);
  }

  async disconnect(): Promise<void> {
    this.connected = false;
    this.events.onConnectionChange?.(false);
  }

  async setMicrophoneEnabled(enabled: boolean): Promise<void> {
    this.microphoneEnabled = enabled;
  }

  async setScreenShareEnabled(enabled: boolean): Promise<void> {
    this.screenShareEnabled = enabled;
  }
}

/** LiveKit-backed session. Constructed only in the browser build. */
export async function createLiveKitSession(
  params: JoinParams,
  events: MediaSessionEvents,
): Promise<MediaSession> {
  const { Room, RoomEvent } = await import('livekit-client');
  const room = new Room();

  class LiveKitMediaSession implements MediaSession {
    connected = false;
    microphoneEnabled = false;
    screenShareEnabled = false;

    async connect(): Promise<void> {
      room.on(RoomEvent.DataReceived, (payload: Uint8Array) => {
        try {
          const msg = JSON.parse(new TextDecoder().decode(payload));
          if (msg?.type === 'transcript' && typeof msg.text === 'string') {
            events.onTranscript?.({
              speaker: msg.speaker === 'user' ? 'user' : 'assistant',
              text: msg.text,
              at: Date.now(),
            });
          }
        } catch {
          /* ignore non-JSON data channel traffic */
        }
      });
      room.on(RoomEvent.Disconnected, () => {
        this.connected = false;
        events.onConnectionChange?.(false);
      });
      // A configured TURN relay replaces the server-advertised ICE servers
      // (livekit-client only applies server ICE servers when rtcConfig has
      // none), so tunnelled deployments never try unreachable direct ports.
      await room.connect(
        params.livekitUrl,
        params.token,
        params.turn
          ? {
              rtcConfig: {
                iceServers: [
                  {
                    urls: params.turn.urls,
                    username: params.turn.username,
                    credential: params.turn.credential,
                  },
                ],
              },
            }
          : undefined,
      );
      this.connected = true;
      events.onConnectionChange?.(true);
    }

    async disconnect(): Promise<void> {
      await room.disconnect();
      this.connected = false;
    }

    async setMicrophoneEnabled(enabled: boolean): Promise<void> {
      await room.localParticipant.setMicrophoneEnabled(enabled);
      this.microphoneEnabled = enabled;
    }

    async setScreenShareEnabled(enabled: boolean): Promise<void> {
      // getDisplayMedia under the hood; camera is never requested.
      await room.localParticipant.setScreenShareEnabled(enabled);
      this.screenShareEnabled = enabled;
    }
  }

  return new LiveKitMediaSession();
}
