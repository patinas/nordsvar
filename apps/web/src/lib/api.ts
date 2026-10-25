// Typed client for the Nordsvar API. Tenant credentials are passed per
// call: in dev mode they are the static headers; in production the OIDC
// bearer token replaces them behind this same interface.

export interface TenantCredentials {
  tenantId: string;
  actorId: string;
  roles?: string[];
  /// Local-mode session token. When present it replaces the dev headers.
  token?: string;
}

export interface KbDocumentMeta {
  id: string;
  name: string;
  format: string;
  chunks_indexed: number;
  ingested_by: string;
  ingested_at_unix: number;
}

export interface SetupStatus {
  needs_setup: boolean;
  auth_mode: 'dev' | 'oidc' | 'local';
}

export interface LocalLogin {
  tenant: string;
  username: string;
  roles: string[];
  token: string;
  expires_at_unix: number;
}

export interface SessionInfo {
  id: string;
  room: string;
  status: 'active' | 'ended';
  created_by: string;
  created_at_unix: number;
}

export interface AuditEvent {
  id: string;
  tenant: string;
  actor: string;
  action: string;
  target: string;
  detail: unknown;
  at_unix: number;
}

export interface IngestReport {
  document_id: string;
  name: string;
  format: string;
  chunks_indexed: number;
}

export interface JoinTicket {
  token: string;
  livekit_url: string;
  room: string;
  identity: string;
  expires_in_secs: number;
  /** TURN relay for browser media when LiveKit's media ports are
   * unreachable from the client (tunnelled deployments). */
  turn?: { urls: string; username?: string; credential?: string };
}

/** Tenant AI settings as the API reports them: overrides only; a null
 * field means the deployment default applies. The provider key is
 * write-only - the API reports only whether one is stored. */
export interface TenantSettings {
  llm_model: string | null;
  embed_model: string | null;
  stt_language: string | null;
  llm_base_url: string | null;
  llm_api_key_set: boolean;
  embed_enabled: boolean | null;
  /** Public by design: identifies the tenant in page source. */
  embed_public_key: string | null;
  embed_allowed_domains: string | null;
  embed_theme_color: string | null;
  embed_position: string | null;
  embed_language: string | null;
  embed_voice_enabled: boolean | null;
  telephony_enabled: boolean | null;
  telephony_provider: string | null;
  telephony_inbound_number: string | null;
}

/** Draft for the embed settings section. Empty string clears a field on
 * the server; the server keeps any field the client omits. */
export interface EmbedSettingsUpdate {
  embedEnabled: boolean;
  embedAllowedDomains: string;
  embedThemeColor: string;
  embedPosition: string;
  embedLanguage: string;
  embedVoiceEnabled: boolean;
}

/** Draft for the telephony (SIP) section: saved intent only - nothing
 * goes live until an operator completes the SIP trunk setup. */
export interface TelephonySettingsUpdate {
  telephonyEnabled: boolean;
  telephonyProvider: string;
  telephonyInboundNumber: string;
}

export interface TestConnectionResult {
  ok: boolean;
  detail: string;
}

export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

function headers(creds: TenantCredentials, json: boolean): Record<string, string> {
  if (creds.token) {
    const h: Record<string, string> = { authorization: `Bearer ${creds.token}` };
    if (json) h['content-type'] = 'application/json';
    return h;
  }
  const h: Record<string, string> = {
    'x-tenant-id': creds.tenantId,
    'x-actor-id': creds.actorId,
  };
  if (creds.roles && creds.roles.length > 0) h['x-actor-roles'] = creds.roles.join(',');
  if (json) h['content-type'] = 'application/json';
  return h;
}

async function unwrap<T>(resp: Response): Promise<T> {
  if (!resp.ok) {
    let code = 'unknown';
    let message = `HTTP ${resp.status}`;
    try {
      const body = await resp.json();
      code = body?.error?.code ?? code;
      message = body?.error?.message ?? message;
    } catch {
      /* non-JSON error body */
    }
    throw new ApiError(resp.status, code, message);
  }
  return (await resp.json()) as T;
}

export class NordsvarApi {
  constructor(private baseUrl: string = '') {}

  /** Public: does this deployment still need its first admin? */
  async getSetupStatus(): Promise<SetupStatus> {
    const resp = await fetch(`${this.baseUrl}/v1/setup/status`);
    return unwrap<SetupStatus>(resp);
  }

  /** First-run setup: create the tenant administrator and sign in. */
  async setupAdmin(username: string, password: string): Promise<LocalLogin> {
    const resp = await fetch(`${this.baseUrl}/v1/setup/admin`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    return unwrap<LocalLogin>(resp);
  }

  /** Local-mode login. Tenant UUID optional for single-tenant setups. */
  async login(username: string, password: string, tenantId?: string): Promise<LocalLogin> {
    const resp = await fetch(`${this.baseUrl}/v1/auth/login`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ tenant_id: tenantId ?? null, username, password }),
    });
    return unwrap<LocalLogin>(resp);
  }

  async createSession(creds: TenantCredentials, displayName?: string): Promise<SessionInfo> {
    const resp = await fetch(`${this.baseUrl}/v1/sessions`, {
      method: 'POST',
      headers: headers(creds, true),
      body: JSON.stringify({ display_name: displayName ?? null }),
    });
    return unwrap<SessionInfo>(resp);
  }

  async joinSession(
    creds: TenantCredentials,
    sessionId: string,
    displayName?: string,
  ): Promise<JoinTicket> {
    const resp = await fetch(`${this.baseUrl}/v1/sessions/${sessionId}/join`, {
      method: 'POST',
      headers: headers(creds, true),
      body: JSON.stringify({ display_name: displayName ?? null }),
    });
    return unwrap<JoinTicket>(resp);
  }

  async endSession(creds: TenantCredentials, sessionId: string): Promise<SessionInfo> {
    const resp = await fetch(`${this.baseUrl}/v1/sessions/${sessionId}`, {
      method: 'DELETE',
      headers: headers(creds, false),
    });
    return unwrap<SessionInfo>(resp);
  }

  async listSessions(creds: TenantCredentials): Promise<SessionInfo[]> {
    const resp = await fetch(`${this.baseUrl}/v1/sessions`, {
      headers: headers(creds, false),
    });
    return unwrap<SessionInfo[]>(resp);
  }

  /** Upload a KB document: raw bytes, file name in x-file-name. */
  async uploadDocument(
    creds: TenantCredentials,
    name: string,
    bytes: Uint8Array,
  ): Promise<IngestReport> {
    const resp = await fetch(`${this.baseUrl}/v1/kb/documents`, {
      method: 'POST',
      headers: { ...headers(creds, false), 'x-file-name': name },
      body: bytes as unknown as BodyInit,
    });
    return unwrap<IngestReport>(resp);
  }

  /** KB registry entry as listed by GET /v1/kb/documents. */
  async listKbDocuments(creds: TenantCredentials): Promise<KbDocumentMeta[]> {
    const resp = await fetch(`${this.baseUrl}/v1/kb/documents`, {
      headers: headers(creds, false),
    });
    return unwrap<KbDocumentMeta[]>(resp);
  }

  /** Delete one KB document: registry row and its vectors (204 on success). */
  async deleteKbDocument(creds: TenantCredentials, id: string): Promise<void> {
    const resp = await fetch(`${this.baseUrl}/v1/kb/documents/${encodeURIComponent(id)}`, {
      method: 'DELETE',
      headers: headers(creds, false),
    });
    if (!resp.ok) {
      await unwrap<never>(resp); // always throws; keeps error parsing in one place
    }
  }

  /** Local-mode user administration (tenant admin; AUTH_MODE=local only). */
  async createLocalUser(
    creds: TenantCredentials,
    username: string,
    password: string,
    role: 'end_user' | 'agent' | 'tenant_admin',
  ): Promise<void> {
    const resp = await fetch(`${this.baseUrl}/v1/admin/users`, {
      method: 'POST',
      headers: headers(creds, true),
      body: JSON.stringify({ username, password, role }),
    });
    if (!resp.ok) {
      await unwrap<never>(resp); // always throws; keeps error parsing in one place
    }
  }

  /** Tenant AI settings (tenant-admin only server-side). */
  async getSettings(creds: TenantCredentials): Promise<TenantSettings> {
    const resp = await fetch(`${this.baseUrl}/v1/settings`, {
      headers: headers(creds, false),
    });
    return unwrap<TenantSettings>(resp);
  }

  /** Replace the tenant AI overrides. Empty string means "back to the
   * deployment default". llmApiKey: undefined keeps the stored key,
   * empty string clears it, any other value replaces it. Embed and
   * telephony fields are optional: omitted keys keep the stored value. */
  async putSettings(
    creds: TenantCredentials,
    update: {
      llmModel: string;
      embedModel: string;
      sttLanguage: string;
      llmBaseUrl: string;
      llmApiKey?: string;
      embed?: EmbedSettingsUpdate;
      telephony?: TelephonySettingsUpdate;
    },
  ): Promise<TenantSettings> {
    const body: Record<string, unknown> = {
      llm_model: update.llmModel,
      embed_model: update.embedModel,
      stt_language: update.sttLanguage,
      llm_base_url: update.llmBaseUrl,
    };
    if (update.llmApiKey !== undefined) body.llm_api_key = update.llmApiKey;
    if (update.embed) {
      body.embed_enabled = update.embed.embedEnabled;
      body.embed_allowed_domains = update.embed.embedAllowedDomains;
      body.embed_theme_color = update.embed.embedThemeColor;
      body.embed_position = update.embed.embedPosition;
      body.embed_language = update.embed.embedLanguage;
      body.embed_voice_enabled = update.embed.embedVoiceEnabled;
    }
    if (update.telephony) {
      body.telephony_enabled = update.telephony.telephonyEnabled;
      body.telephony_provider = update.telephony.telephonyProvider;
      body.telephony_inbound_number = update.telephony.telephonyInboundNumber;
    }
    const resp = await fetch(`${this.baseUrl}/v1/settings`, {
      method: 'PUT',
      headers: headers(creds, true),
      body: JSON.stringify(body),
    });
    return unwrap<TenantSettings>(resp);
  }

  /** Server-side connectivity check against the configured provider
   * endpoint. The stored key never reaches the browser. */
  async testLlmConnection(creds: TenantCredentials): Promise<TestConnectionResult> {
    const resp = await fetch(`${this.baseUrl}/v1/settings/llm/test`, {
      method: 'POST',
      headers: headers(creds, false),
    });
    return unwrap<TestConnectionResult>(resp);
  }

  /** Create a guest share link for an active session (agent/admin). The
   * recipient opens the path on any browser to join the same LiveKit room
   * and share their screen - the phone-to-screen handoff. */
  async shareSession(
    creds: TenantCredentials,
    sessionId: string,
  ): Promise<{ share_token: string; path: string; expires_in_secs: number }> {
    const resp = await fetch(
      `${this.baseUrl}/v1/sessions/${encodeURIComponent(sessionId)}/share`,
      { method: 'POST', headers: headers(creds, false) },
    );
    return unwrap(resp);
  }

  /** Exchange a guest share token for a LiveKit join ticket. Public: the
   * signed, expiring token is the credential. */
  async guestJoin(
    token: string,
    displayName?: string,
  ): Promise<{
    token: string;
    livekit_url: string;
    room: string;
    identity: string;
    expires_in_secs: number;
    turn?: { urls: string; username?: string; credential?: string } | null;
  }> {
    const resp = await fetch(`${this.baseUrl}/v1/public/guest-join`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ token, display_name: displayName ?? null }),
    });
    return unwrap(resp);
  }

  /** Issue a fresh public embed key; the old key stops working at once. */
  async regenerateEmbedKey(creds: TenantCredentials): Promise<string> {
    const resp = await fetch(`${this.baseUrl}/v1/settings/embed/key`, {
      method: 'POST',
      headers: headers(creds, false),
    });
    const body = await unwrap<{ embed_public_key: string }>(resp);
    return body.embed_public_key;
  }

  async listAudit(creds: TenantCredentials): Promise<AuditEvent[]> {
    const resp = await fetch(`${this.baseUrl}/v1/audit`, { headers: headers(creds, false) });
    return unwrap<AuditEvent[]>(resp);
  }

  async health(): Promise<{ status: string; version: string }> {
    const resp = await fetch(`${this.baseUrl}/healthz`);
    return unwrap(resp);
  }
}

