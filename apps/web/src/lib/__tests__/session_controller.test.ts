import { describe, expect, it, vi } from 'vitest';
import { SessionController, initialState, type SessionState } from '../session_controller';
import { FakeMediaSession, type JoinParams, type MediaSession, type MediaSessionEvents } from '../media';
import type { NordsvarApi, SessionInfo, JoinTicket, TenantCredentials } from '../api';

const creds: TenantCredentials = { tenantId: 't-1', actorId: 'u-1' };

const session: SessionInfo = {
  id: 's1',
  room: 'session-s1',
  status: 'active',
  created_by: 'u-1',
  created_at_unix: 1,
};

const ticket: JoinTicket = {
  token: 'jwt',
  livekit_url: 'ws://livekit.test',
  room: 'session-s1',
  identity: 'u-1-abc',
  expires_in_secs: 900,
};

function fakeApi(overrides: Partial<NordsvarApi> = {}): NordsvarApi {
  return {
    createSession: vi.fn().mockResolvedValue(session),
    joinSession: vi.fn().mockResolvedValue(ticket),
    endSession: vi.fn().mockResolvedValue({ ...session, status: 'ended' }),
    listSessions: vi.fn().mockResolvedValue([session]),
    health: vi.fn().mockResolvedValue({ status: 'ok', version: '0.1.0' }),
    ...overrides,
  } as unknown as NordsvarApi;
}

function fakeFactory(
  params: JoinParams,
  events: MediaSessionEvents,
): Promise<MediaSession> {
  const m = new FakeMediaSession(params, events);
  m.script = [{ speaker: 'assistant', text: 'Hej, hvad kan jeg hjælpe med?', at: 1 }];
  return Promise.resolve(m);
}

function collect(controller: SessionController): SessionState[] {
  const states: SessionState[] = [];
  controller.subscribe((s) => states.push(s));
  return states;
}

describe('SessionController', () => {
  it('runs the one-button flow to an active session with mic on', async () => {
    const controller = new SessionController(fakeApi(), creds, fakeFactory);
    const states = collect(controller);
    await controller.start('Alice');
    const last = states.at(-1)!;
    expect(last.phase).toBe('active');
    expect(last.micOn).toBe(true);
    expect(last.session?.id).toBe('s1');
    expect(last.transcript).toHaveLength(1);
    expect(last.transcript[0].text).toContain('Hej');
    // The phases moved through creating -> joining -> active.
    expect(states.map((s) => s.phase)).toEqual(
      expect.arrayContaining(['creating', 'joining', 'active']),
    );
  });

  it('toggles microphone and screen share through the media session', async () => {
    const controller = new SessionController(fakeApi(), creds, fakeFactory);
    const states = collect(controller);
    await controller.start();
    await controller.toggleScreenShare();
    expect(states.at(-1)!.sharingScreen).toBe(true);
    await controller.toggleMicrophone();
    expect(states.at(-1)!.micOn).toBe(false);
  });

  it('ends the session and releases media', async () => {
    const api = fakeApi();
    const controller = new SessionController(api, creds, fakeFactory);
    const states = collect(controller);
    await controller.start();
    await controller.end();
    const last = states.at(-1)!;
    expect(last.phase).toBe('ended');
    expect(last.micOn).toBe(false);
    expect(last.sharingScreen).toBe(false);
    expect(api.endSession).toHaveBeenCalledWith(creds, 's1');
  });

  it('surfaces API failures as an error state, not a crash', async () => {
    const api = fakeApi({
      createSession: vi.fn().mockRejectedValue(new Error('HTTP 401: unauthorized')),
    });
    const controller = new SessionController(api, creds, fakeFactory);
    const states = collect(controller);
    await controller.start();
    expect(states.at(-1)!.phase).toBe('error');
    expect(states.at(-1)!.error).toContain('401');
  });

  it('passes the ticket TURN relay through to the media session', async () => {
    // Tunnelled deployments (Codespaces) put a TURN relay in the join
    // ticket; the media session needs it to override ICE servers, or
    // browser media tries LiveKit's unreachable direct ports.
    const seen: JoinParams[] = [];
    const api = fakeApi({
      joinSession: vi.fn().mockResolvedValue({
        ...ticket,
        turn: {
          urls: 'turns:demo-7882.app.github.dev:443?transport=tcp',
          username: 'nordsvar',
          credential: 'turn-secret',
        },
      }),
    });
    const controller = new SessionController(api, creds, (params, events) => {
      seen.push(params);
      return fakeFactory(params, events);
    });
    await controller.start();
    expect(seen).toHaveLength(1);
    expect(seen[0].turn?.urls).toBe(
      'turns:demo-7882.app.github.dev:443?transport=tcp',
    );
    expect(seen[0].turn?.credential).toBe('turn-secret');
  });

  it('leaves turn unset when the ticket has none', async () => {
    const seen: JoinParams[] = [];
    const controller = new SessionController(
      fakeApi(),
      creds,
      (params, events) => {
        seen.push(params);
        return fakeFactory(params, events);
      },
    );
    await controller.start();
    expect(seen[0].turn).toBeUndefined();
  });

  it('starts from the documented initial state', () => {
    const controller = new SessionController(fakeApi(), creds, fakeFactory);
    const states = collect(controller);
    expect(states[0]).toEqual(initialState);
  });
});


describe('guest share link', () => {
  it('creates a link for the active session and marks it copied', async () => {
    vi.useFakeTimers();
    const shareSession = vi.fn().mockResolvedValue({
      share_token: 'tok',
      path: '/s/s1?t=tok',
      expires_in_secs: 7200,
    });
    const controller = new SessionController(fakeApi({ shareSession }), creds, fakeFactory);
    await controller.start();
    await controller.createShareLink('https://nordsvar.example');
    expect(shareSession).toHaveBeenCalledWith(creds, 's1');
    expect(controller['state'].share.link).toBe('https://nordsvar.example/s/s1?t=tok');
    controller.markShareCopied();
    expect(controller['state'].share.copied).toBe(true);
    vi.advanceTimersByTime(2100);
    expect(controller['state'].share.copied).toBe(false);
    vi.useRealTimers();
  });

  it('surfaces an error when the share call fails', async () => {
    const shareSession = vi.fn().mockRejectedValue(new Error('403 forbidden'));
    const controller = new SessionController(fakeApi({ shareSession }), creds, fakeFactory);
    await controller.start();
    await controller.createShareLink('https://nordsvar.example');
    expect(controller['state'].share.link).toBe('');
    expect(controller['state'].share.error).toBe('403 forbidden');
  });

  it('does nothing without an active session', async () => {
    const shareSession = vi.fn();
    const controller = new SessionController(fakeApi({ shareSession }), creds, fakeFactory);
    await controller.createShareLink('https://nordsvar.example');
    expect(shareSession).not.toHaveBeenCalled();
  });
});
