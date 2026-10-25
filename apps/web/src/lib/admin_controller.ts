// Admin portal logic: session oversight, KB uploads, audit view.
// Framework-free; Svelte binds to its state.

import type {
  AuditEvent,
  EmbedSettingsUpdate,
  KbDocumentMeta,
  TelephonySettingsUpdate,
  NordsvarApi,
  SessionInfo,
  TenantCredentials,
  TenantSettings,
  TestConnectionResult,
} from './api';

export interface AdminState {
  sessions: SessionInfo[];
  audit: AuditEvent[];
  documents: KbDocumentMeta[];
  loading: boolean;
  error: string | null;
  upload: {
    running: boolean;
    lastResult: string | null;
    error: string | null;
  };
  userCreate: {
    running: boolean;
    lastResult: string | null;
    error: string | null;
  };
  kbDelete: {
    runningId: string | null;
    error: string | null;
  };
  settings: {
    loaded: boolean;
    values: TenantSettings | null;
    loadError: string | null;
    save: { running: boolean; lastResult: string | null; error: string | null };
    connTest: {
      running: boolean;
      result: TestConnectionResult | null;
      error: string | null;
    };
  };
}

export const initialAdminState: AdminState = {
  sessions: [],
  audit: [],
  documents: [],
  loading: false,
  error: null,
  upload: { running: false, lastResult: null, error: null },
  userCreate: { running: false, lastResult: null, error: null },
  kbDelete: { runningId: null, error: null },
  settings: {
    loaded: false,
    values: null,
    loadError: null,
    save: { running: false, lastResult: null, error: null },
    connTest: { running: false, result: null, error: null },
  },
};

export class AdminController {
  private state: AdminState = structuredClone(initialAdminState);
  private listeners: Array<(s: AdminState) => void> = [];

  constructor(
    private api: NordsvarApi,
    private creds: TenantCredentials,
  ) {}

  subscribe(listener: (s: AdminState) => void): () => void {
    this.listeners.push(listener);
    listener(this.snapshot());
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private snapshot(): AdminState {
    return structuredClone(this.state);
  }

  private update(patch: Partial<AdminState>): void {
    this.state = { ...this.state, ...patch };
    for (const l of this.listeners) l(this.snapshot());
  }

  async refresh(): Promise<void> {
    this.update({ loading: true, error: null });
    try {
      const [sessions, audit, documents] = await Promise.all([
        this.api.listSessions(this.creds).catch((e) => {
          if (e?.status === 403) return [] as SessionInfo[];
          throw e;
        }),
        this.api.listAudit(this.creds).catch((e) => {
          if (e?.status === 403) return [] as AuditEvent[];
          throw e;
        }),
        this.api.listKbDocuments(this.creds).catch((e) => {
          if (e?.status === 403) return [] as KbDocumentMeta[];
          throw e;
        }),
      ]);
      this.update({ sessions, audit, documents, loading: false });
    } catch (e) {
      this.update({ loading: false, error: e instanceof Error ? e.message : String(e) });
    }
  }

  /** Create a local user (AUTH_MODE=local). Refreshes the audit log on
   * success: the creation itself is an audited event. */
  async createUser(username: string, password: string, role: 'end_user' | 'agent' | 'tenant_admin'): Promise<boolean> {
    this.update({ userCreate: { running: true, lastResult: null, error: null } });
    try {
      await this.api.createLocalUser(this.creds, username, password, role);
      this.update({
        userCreate: { running: false, lastResult: `Bruger ${username} oprettet`, error: null },
      });
      const audit = await this.api.listAudit(this.creds).catch(() => null);
      if (audit) this.update({ audit });
      return true;
    } catch (e) {
      this.update({
        userCreate: {
          running: false,
          lastResult: null,
          error: e instanceof Error ? e.message : String(e),
        },
      });
      return false;
    }
  }

  /** Delete a KB document (registry row + vectors). Deletion is audited
   * server-side, so a successful delete refreshes both lists. */
  async deleteDocument(id: string): Promise<boolean> {
    this.update({ kbDelete: { runningId: id, error: null } });
    try {
      await this.api.deleteKbDocument(this.creds, id);
      const [documents, audit] = await Promise.all([
        this.api.listKbDocuments(this.creds).catch(() => null),
        this.api.listAudit(this.creds).catch(() => null),
      ]);
      const patch: Partial<AdminState> = { kbDelete: { runningId: null, error: null } };
      if (documents) patch.documents = documents;
      if (audit) patch.audit = audit;
      this.update(patch);
      return true;
    } catch (e) {
      this.update({
        kbDelete: {
          runningId: null,
          error: e instanceof Error ? e.message : String(e),
        },
      });
      return false;
    }
  }

  /** Load tenant AI settings (tenant-admin only; a 403 becomes a load
   * error the view renders, never a crash). */
  async loadSettings(): Promise<void> {
    try {
      const values = await this.api.getSettings(this.creds);
      this.update({
        settings: {
          ...this.state.settings,
          loaded: true,
          values,
          loadError: null,
        },
      });
    } catch (e) {
      this.update({
        settings: {
          ...this.state.settings,
          loaded: true,
          loadError: e instanceof Error ? e.message : String(e),
        },
      });
    }
  }

  /** Save tenant AI overrides. llmApiKey undefined keeps the stored key,
   * '' clears it, a value replaces it. A successful save also refreshes
   * the audit list (the update is an audited event). */
  async saveSettings(draft: {
    llmModel: string;
    embedModel: string;
    sttLanguage: string;
    llmBaseUrl: string;
    llmApiKey?: string;
    embed?: EmbedSettingsUpdate;
    telephony?: TelephonySettingsUpdate;
  }): Promise<boolean> {
    this.update({
      settings: {
        ...this.state.settings,
        save: { running: true, lastResult: null, error: null },
      },
    });
    try {
      const values = await this.api.putSettings(this.creds, draft);
      this.update({
        settings: {
          ...this.state.settings,
          values,
          save: { running: false, lastResult: 'Indstillinger gemt', error: null },
        },
      });
      const audit = await this.api.listAudit(this.creds).catch(() => null);
      if (audit) this.update({ audit });
      return true;
    } catch (e) {
      this.update({
        settings: {
          ...this.state.settings,
          save: {
            running: false,
            lastResult: null,
            error: e instanceof Error ? e.message : String(e),
          },
        },
      });
      return false;
    }
  }

  /** Regenerate the public embed key. The old key stops working
   * immediately, so the view confirms before calling this. */
  async regenerateEmbedKey(): Promise<string | null> {
    try {
      const key = await this.api.regenerateEmbedKey(this.creds);
      const current = this.state.settings.values;
      if (current) {
        this.update({
          settings: {
            ...this.state.settings,
            values: { ...current, embed_public_key: key },
          },
        });
      }
      return key;
    } catch {
      return null;
    }
  }

  /** Server-side connectivity check against the configured provider
   * endpoint. The stored key never reaches the browser. */
  async testLlmConnection(): Promise<void> {
    this.update({
      settings: {
        ...this.state.settings,
        connTest: { running: true, result: null, error: null },
      },
    });
    try {
      const result = await this.api.testLlmConnection(this.creds);
      this.update({
        settings: {
          ...this.state.settings,
          connTest: { running: false, result, error: null },
        },
      });
    } catch (e) {
      this.update({
        settings: {
          ...this.state.settings,
          connTest: {
            running: false,
            result: null,
            error: e instanceof Error ? e.message : String(e),
          },
        },
      });
    }
  }

  async uploadDocument(name: string, bytes: Uint8Array): Promise<boolean> {
    this.update({ upload: { running: true, lastResult: null, error: null } });
    try {
      const report = await this.api.uploadDocument(this.creds, name, bytes);
      this.update({
        upload: {
          running: false,
          lastResult: `${report.name}: ${report.chunks_indexed} bidder indekseret`,
          error: null,
        },
      });
      // The registry now holds one more row; refresh so the list shows it.
      const documents = await this.api.listKbDocuments(this.creds).catch(() => null);
      if (documents) this.update({ documents });
      return true;
    } catch (e) {
      this.update({
        upload: {
          running: false,
          lastResult: null,
          error: e instanceof Error ? e.message : String(e),
        },
      });
      return false;
    }
  }
}

