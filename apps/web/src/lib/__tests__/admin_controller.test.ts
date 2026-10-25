import { describe, expect, it, vi } from 'vitest';
import { AdminController, initialAdminState } from '../admin_controller';
import type { NordsvarApi, TenantCredentials } from '../api';

const creds: TenantCredentials = { tenantId: 't-1', actorId: 'boss', roles: ['tenant_admin'] };

function fakeApi(overrides: Partial<NordsvarApi> = {}): NordsvarApi {
  return {
    listSessions: vi.fn().mockResolvedValue([
      { id: 's1', room: 'session-s1', status: 'active', created_by: 'u1', created_at_unix: 1 },
    ]),
    listAudit: vi.fn().mockResolvedValue([
      { id: 'e1', tenant: 't-1', actor: 'u1', action: 'session.created', target: 's1', detail: {}, at_unix: 1 },
    ]),
    uploadDocument: vi.fn().mockResolvedValue({ document_id: 'd1', name: 'a.md', format: 'markdown', chunks_indexed: 3 }),
    createLocalUser: vi.fn().mockResolvedValue(undefined),
    listKbDocuments: vi.fn().mockResolvedValue([
      {
        id: 'd1',
        name: 'ferie.md',
        format: 'markdown',
        chunks_indexed: 3,
        ingested_by: 'boss',
        ingested_at_unix: 1,
      },
    ]),
    deleteKbDocument: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  } as unknown as NordsvarApi;
}

describe('AdminController', () => {
  it('starts from the documented initial state', () => {
    const c = new AdminController(fakeApi(), creds);
    const seen: unknown[] = [];
    c.subscribe((s) => seen.push(s));
    expect(seen[0]).toEqual(initialAdminState);
  });

  it('refresh loads sessions and audit together', async () => {
    const c = new AdminController(fakeApi(), creds);
    let last = initialAdminState;
    c.subscribe((s) => (last = s));
    await c.refresh();
    expect(last.loading).toBe(false);
    expect(last.sessions).toHaveLength(1);
    expect(last.audit).toHaveLength(1);
    expect(last.audit[0].action).toBe('session.created');
    expect(last.documents).toHaveLength(1);
    expect(last.documents[0].name).toBe('ferie.md');
  });

  it('tolerates 403 on audit for agent-only viewers', async () => {
    const forbidden = Object.assign(new Error('forbidden'), { status: 403 });
    const api = fakeApi({ listAudit: vi.fn().mockRejectedValue(forbidden) });
    const c = new AdminController(api, { ...creds, roles: ['agent'] });
    let last = initialAdminState;
    c.subscribe((s) => (last = s));
    await c.refresh();
    expect(last.error).toBeNull();
    expect(last.sessions).toHaveLength(1);
    expect(last.audit).toHaveLength(0);
    expect(last.documents).toHaveLength(1);
  });

  it('reports refresh failures as error state', async () => {
    const api = fakeApi({ listSessions: vi.fn().mockRejectedValue(new Error('HTTP 500')) });
    const c = new AdminController(api, creds);
    let last = initialAdminState;
    c.subscribe((s) => (last = s));
    await c.refresh();
    expect(last.error).toContain('500');
    expect(last.loading).toBe(false);
  });

  it('upload success reports the chunk count', async () => {
    const api = fakeApi();
    const c = new AdminController(api, creds);
    let last = initialAdminState;
    c.subscribe((s) => (last = s));
    const ok = await c.uploadDocument('a.md', new Uint8Array([35, 32, 65]));
    expect(ok).toBe(true);
    expect(api.uploadDocument).toHaveBeenCalledWith(creds, 'a.md', expect.any(Uint8Array));
    expect(last.upload.lastResult).toContain('3 bidder');
    expect(last.upload.error).toBeNull();
  });

  it('upload failure is surfaced without crashing', async () => {
    const api = fakeApi({ uploadDocument: vi.fn().mockRejectedValue(new Error('HTTP 400: unsupported')) });
    const c = new AdminController(api, creds);
    let last = initialAdminState;
    c.subscribe((s) => (last = s));
    const ok = await c.uploadDocument('x.exe', new Uint8Array([1]));
    expect(ok).toBe(false);
    expect(last.upload.error).toContain('unsupported');
  });
it('createUser reports success and refreshes the audit log', async () => {
    const api = fakeApi();
    const c = new AdminController(api, creds);
    let last = initialAdminState;
    c.subscribe((s) => (last = s));
    const ok = await c.createUser('lise', 'lang-adgangskode-123', 'agent');
    expect(ok).toBe(true);
    expect(api.createLocalUser).toHaveBeenCalledWith(creds, 'lise', 'lang-adgangskode-123', 'agent');
    expect(last.userCreate.lastResult).toContain('lise');
    expect(last.userCreate.error).toBeNull();
    expect(api.listAudit).toHaveBeenCalledTimes(1); // audit refresh after create
  });

  it('createUser surfaces API errors', async () => {
    const api = fakeApi({
      createLocalUser: vi.fn().mockRejectedValue(new Error('brugeren findes allerede')),
    });
    const c = new AdminController(api, creds);
    let last = initialAdminState;
    c.subscribe((s) => (last = s));
    const ok = await c.createUser('lise', 'lang-adgangskode-123', 'agent');
    expect(ok).toBe(false);
    expect(last.userCreate.error).toContain('findes allerede');
    expect(last.userCreate.lastResult).toBeNull();
  });
it('upload success refreshes the document list', async () => {
    const api = fakeApi();
    const c = new AdminController(api, creds);
    let last = initialAdminState;
    c.subscribe((s) => (last = s));
    const ok = await c.uploadDocument('a.md', new Uint8Array([35, 32, 65]));
    expect(ok).toBe(true);
    expect(api.listKbDocuments).toHaveBeenCalledTimes(1);
    expect(last.documents).toHaveLength(1);
  });

  it('deleteDocument removes the row and refreshes documents and audit', async () => {
    const api = fakeApi({
      listKbDocuments: vi.fn().mockResolvedValue([]),
    });
    const c = new AdminController(api, creds);
    let last = initialAdminState;
    c.subscribe((s) => (last = s));
    const ok = await c.deleteDocument('d1');
    expect(ok).toBe(true);
    expect(api.deleteKbDocument).toHaveBeenCalledWith(creds, 'd1');
    expect(last.kbDelete.runningId).toBeNull();
    expect(last.kbDelete.error).toBeNull();
    expect(last.documents).toHaveLength(0);
    expect(api.listAudit).toHaveBeenCalledTimes(1);
  });

  it('deleteDocument surfaces API errors and clears the pending row', async () => {
    const api = fakeApi({
      deleteKbDocument: vi.fn().mockRejectedValue(new Error('HTTP 404')),
    });
    const c = new AdminController(api, creds);
    let last = initialAdminState;
    c.subscribe((s) => (last = s));
    const ok = await c.deleteDocument('d-mangler');
    expect(ok).toBe(false);
    expect(last.kbDelete.error).toContain('404');
    expect(last.kbDelete.runningId).toBeNull();
  });
});

describe('AdminController settings', () => {
  const settingsValues = {
    llm_model: 'llama3.1:8b',
    embed_model: null,
    stt_language: 'da',
    llm_base_url: 'https://llm.eksempel.dk',
    llm_api_key_set: true,
  };

  it('loadSettings stores the tenant overrides', async () => {
    const api = fakeApi({ getSettings: vi.fn().mockResolvedValue(settingsValues) });
    const c = new AdminController(api, creds);
    let latest = initialAdminState;
    c.subscribe((s) => (latest = s));
    await c.loadSettings();
    expect(latest.settings.loaded).toBe(true);
    expect(latest.settings.values).toEqual(settingsValues);
    expect(latest.settings.loadError).toBeNull();
  });

  it('loadSettings turns a 403 into a load error, not a crash', async () => {
    const api = fakeApi({
      getSettings: vi.fn().mockRejectedValue(Object.assign(new Error('forbudt'), { status: 403 })),
    });
    const c = new AdminController(api, creds);
    let latest = initialAdminState;
    c.subscribe((s) => (latest = s));
    await c.loadSettings();
    expect(latest.settings.loaded).toBe(true);
    expect(latest.settings.loadError).toBe('forbudt');
  });

  it('saveSettings keeps the stored key when llmApiKey is undefined', async () => {
    const put = vi.fn().mockResolvedValue(settingsValues);
    const api = fakeApi({ putSettings: put });
    const c = new AdminController(api, creds);
    let latest = initialAdminState;
    c.subscribe((s) => (latest = s));
    const ok = await c.saveSettings({
      llmModel: 'llama3.1:8b',
      embedModel: '',
      sttLanguage: 'da',
      llmBaseUrl: 'https://llm.eksempel.dk',
      llmApiKey: undefined,
    });
    expect(ok).toBe(true);
    expect(put).toHaveBeenCalledWith(creds, expect.objectContaining({ llmApiKey: undefined }));
    expect(latest.settings.save.lastResult).toBe('Indstillinger gemt');
    expect(latest.settings.values).toEqual(settingsValues);
  });

  it('saveSettings surfaces the server error and keeps state intact', async () => {
    const api = fakeApi({
      putSettings: vi.fn().mockRejectedValue(new Error('ugyldigt modelnavn')),
    });
    const c = new AdminController(api, creds);
    let latest = initialAdminState;
    c.subscribe((s) => (latest = s));
    const ok = await c.saveSettings({
      llmModel: 'dårlig model!',
      embedModel: '',
      sttLanguage: 'da',
      llmBaseUrl: '',
    });
    expect(ok).toBe(false);
    expect(latest.settings.save.error).toBe('ugyldigt modelnavn');
  });

  it('testLlmConnection reports the server verdict', async () => {
    const api = fakeApi({
      testLlmConnection: vi.fn().mockResolvedValue({ ok: true, detail: 'forbundet (HTTP 200)' }),
    });
    const c = new AdminController(api, creds);
    let latest = initialAdminState;
    c.subscribe((s) => (latest = s));
    await c.testLlmConnection();
    expect(latest.settings.connTest.result).toEqual({ ok: true, detail: 'forbundet (HTTP 200)' });
  });

  it('testLlmConnection failure becomes a connTest error', async () => {
    const api = fakeApi({
      testLlmConnection: vi.fn().mockRejectedValue(new Error('netværksfejl')),
    });
    const c = new AdminController(api, creds);
    let latest = initialAdminState;
    c.subscribe((s) => (latest = s));
    await c.testLlmConnection();
    expect(latest.settings.connTest.error).toBe('netværksfejl');
  });
});
