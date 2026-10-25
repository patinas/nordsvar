import { describe, expect, it, vi, beforeEach } from 'vitest';
import { NordsvarApi, ApiError, type TenantCredentials } from '../api';

const creds: TenantCredentials = { tenantId: 't-1', actorId: 'user-1', roles: ['agent'] };

function mockFetch(status: number, body: unknown) {
  return vi.fn().mockResolvedValue(
    new Response(JSON.stringify(body), {
      status,
      headers: { 'content-type': 'application/json' },
    }),
  );
}

beforeEach(() => {
  vi.restoreAllMocks();
});

describe('NordsvarApi', () => {
  it('sends tenant headers on every call', async () => {
    const fetchMock = mockFetch(201, { id: 's1', room: 'session-s1', status: 'active', created_by: 'user-1', created_at_unix: 1 });
    vi.stubGlobal('fetch', fetchMock);
    const api = new NordsvarApi('http://api.test');
    await api.createSession(creds, 'Alice');
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('http://api.test/v1/sessions');
    expect(init.headers['x-tenant-id']).toBe('t-1');
    expect(init.headers['x-actor-id']).toBe('user-1');
    expect(init.headers['x-actor-roles']).toBe('agent');
    expect(JSON.parse(init.body)).toEqual({ display_name: 'Alice' });
  });

  it('unwraps error envelopes into ApiError', async () => {
    vi.stubGlobal(
      'fetch',
      mockFetch(404, { error: { code: 'not_found', message: 'session' } }),
    );
    const api = new NordsvarApi();
    await expect(api.listSessions(creds)).rejects.toMatchObject({
      name: 'ApiError',
      status: 404,
      code: 'not_found',
    });
    await expect(api.listSessions(creds)).rejects.toBeInstanceOf(ApiError);
  });

  it('handles non-JSON error bodies', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('boom', { status: 500 })));
    const api = new NordsvarApi();
    await expect(api.listSessions(creds)).rejects.toMatchObject({ status: 500, code: 'unknown' });
  });
});


describe('embed + telephony settings', () => {
  it('sends embed and telephony sections when present', async () => {
    const fetchMock = mockFetch(200, { llm_model: null });
    vi.stubGlobal('fetch', fetchMock);
    const api = new NordsvarApi('http://api.test');
    await api.putSettings(creds, {
      llmModel: '',
      embedModel: '',
      sttLanguage: '',
      llmBaseUrl: '',
      embed: {
        embedEnabled: true,
        embedAllowedDomains: 'example.dk',
        embedThemeColor: '#0f5f4b',
        embedPosition: 'right',
        embedLanguage: 'da',
        embedVoiceEnabled: false,
      },
      telephony: {
        telephonyEnabled: true,
        telephonyProvider: 'Twilio',
        telephonyInboundNumber: '+4512345678',
      },
    });
    const body = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(body.embed_enabled).toBe(true);
    expect(body.embed_allowed_domains).toBe('example.dk');
    expect(body.embed_position).toBe('right');
    expect(body.telephony_provider).toBe('Twilio');
    expect(body.telephony_inbound_number).toBe('+4512345678');
    expect(body.llm_api_key).toBeUndefined();
  });

  it('omits embed and telephony keys when sections are absent', async () => {
    const fetchMock = mockFetch(200, { llm_model: null });
    vi.stubGlobal('fetch', fetchMock);
    const api = new NordsvarApi('http://api.test');
    await api.putSettings(creds, {
      llmModel: 'llama3',
      embedModel: '',
      sttLanguage: '',
      llmBaseUrl: '',
    });
    const body = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect('embed_enabled' in body).toBe(false);
    expect('telephony_enabled' in body).toBe(false);
  });

  it('regenerateEmbedKey posts and returns the key', async () => {
    const fetchMock = mockFetch(200, { embed_public_key: 'pk_abc123' });
    vi.stubGlobal('fetch', fetchMock);
    const api = new NordsvarApi('http://api.test');
    const key = await api.regenerateEmbedKey(creds);
    expect(key).toBe('pk_abc123');
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('http://api.test/v1/settings/embed/key');
    expect(init.method).toBe('POST');
  });
});

describe('guest share links', () => {
  it('shareSession posts to the session share route', async () => {
    const fetchMock = mockFetch(200, {
      share_token: 'tok',
      path: '/s/s1?t=tok',
      expires_in_secs: 7200,
    });
    vi.stubGlobal('fetch', fetchMock);
    const api = new NordsvarApi('http://api.test');
    const r = await api.shareSession(creds, 's1');
    expect(r.path).toBe('/s/s1?t=tok');
    expect(fetchMock.mock.calls[0][0]).toBe('http://api.test/v1/sessions/s1/share');
  });

  it('guestJoin posts the token without tenant headers', async () => {
    const fetchMock = mockFetch(200, {
      token: 'jwt',
      livekit_url: 'ws://lk',
      room: 'r1',
      identity: 'guest-abc12345',
      expires_in_secs: 900,
    });
    vi.stubGlobal('fetch', fetchMock);
    const api = new NordsvarApi('http://api.test');
    await api.guestJoin('tok', 'Gæst');
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('http://api.test/v1/public/guest-join');
    expect(JSON.parse(init.body)).toEqual({ token: 'tok', display_name: 'Gæst' });
    expect(init.headers['x-tenant-id']).toBeUndefined();
  });
});
