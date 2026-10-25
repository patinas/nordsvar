<script lang="ts">
  import {
    AdminController,
    initialAdminState,
    type AdminState,
  } from '../lib/admin_controller';
  import { NordsvarApi, type TenantCredentials } from '../lib/api';
  import {
    LLM_PROVIDERS,
    modelAfterPresetSwitch,
    presetById,
    providerForBaseUrl,
  } from '../lib/llm_providers';
  import { t, getLocale, formatTime, fill } from '../lib/i18n.svelte';

  let {
    credentials,
    authMode,
  }: { credentials: TenantCredentials; authMode: 'dev' | 'oidc' | 'local' } = $props();

  let view_state: AdminState = $state(JSON.parse(JSON.stringify(initialAdminState)));

  const api = new NordsvarApi('');
  // Read through a closure: credentials are fixed for this view's lifetime.
  const controller = new AdminController(
    api,
    (() => ({
      tenantId: credentials.tenantId,
      actorId: credentials.actorId,
      roles: credentials.roles,
      token: credentials.token,
    }))(),
  );
  controller.subscribe((s) => (view_state = s));
  controller.refresh();

  let tab = $state<'sessions' | 'kb' | 'audit' | 'users' | 'settings'>('sessions');

  // Settings tab is tenant-admin only; the API enforces it too (403), the
  // gate here just avoids showing a tab that cannot work.
  const isTenantAdmin = $derived(credentials.roles?.includes('tenant_admin') ?? false);

  // Settings draft. Local until Gem; the provider key is write-only and
  // never read back, so its field stays empty on load.
  let sLlmModel = $state('');
  let sEmbedModel = $state('');
  let sSttLanguage = $state('');
  let sLlmBaseUrl = $state('');
  let sApiKey = $state('');
  let sApiKeyClear = $state(false);
  let settingsDirty = $state(false);

  // Embed (website-widget) draft. The public key is not a secret: it
  // appears in the customer's page source and only identifies the tenant.
  let sEmbedEnabled = $state(false);
  let sEmbedDomains = $state('');
  let sEmbedColor = $state('');
  let sEmbedPosition = $state('right');
  let sEmbedLanguage = $state('da');
  let sEmbedVoice = $state(false);
  // Regenerating the key breaks every live snippet, so it needs two taps.
  let armKeyRegen = $state(false);
  let keyCopied = $state(false);
  let snippetCopied = $state(false);

  // Telephony draft: saved intent only. Nothing goes live until an
  // operator completes the SIP trunk setup (docs/TELEPHONY.md).
  let sTelEnabled = $state(false);
  let sTelProvider = $state('');
  let sTelNumber = $state('');
  // Provider dropdown: derived from the stored base URL on load, so a saved
  // configuration maps back to its preset (or Custom) without being touched.
  let sProvider = $state('none');
  const selectedPreset = $derived(presetById(sProvider));

  // Localized provider labels: brand names stay, the two structural
  // choices get plain-language text.
  function providerLabel(id: string, fallback: string): string {
    if (id === 'none') return t().settings.providerNone;
    if (id === 'custom') return t().settings.providerCustom;
    return fallback;
  }

  function openSettings() {
    tab = 'settings';
    if (!view_state.settings.loaded) void controller.loadSettings();
  }

  // Populate the draft from the loaded values, until the admin edits.
  $effect(() => {
    const v = view_state.settings.values;
    if (tab === 'settings' && v && !settingsDirty) {
      sLlmModel = v.llm_model ?? '';
      sEmbedModel = v.embed_model ?? '';
      sSttLanguage = v.stt_language ?? '';
      sLlmBaseUrl = v.llm_base_url ?? '';
      sProvider = providerForBaseUrl(v.llm_base_url);
      sEmbedEnabled = v.embed_enabled ?? false;
      sEmbedDomains = v.embed_allowed_domains ?? '';
      sEmbedColor = v.embed_theme_color ?? '';
      sEmbedPosition = v.embed_position ?? 'right';
      sEmbedLanguage = v.embed_language ?? 'da';
      sEmbedVoice = v.embed_voice_enabled ?? false;
      sTelEnabled = v.telephony_enabled ?? false;
      sTelProvider = v.telephony_provider ?? '';
      sTelNumber = v.telephony_inbound_number ?? '';
    }
  });

  // The embed snippet customers paste into their site. Uses this
  // deployment's own origin so it works behind any reverse proxy.
  const embedSnippet = $derived(
    view_state.settings.values?.embed_public_key
      ? `<script src="${window.location.origin}/embed/v1.js" charset="utf-8" data-nordsvar-key="${view_state.settings.values.embed_public_key}" async></` +
        'script>'
      : '',
  );

  async function copyText(text: string, which: 'key' | 'snippet') {
    try {
      await navigator.clipboard.writeText(text);
      if (which === 'key') {
        keyCopied = true;
        setTimeout(() => (keyCopied = false), 2000);
      } else {
        snippetCopied = true;
        setTimeout(() => (snippetCopied = false), 2000);
      }
    } catch {
      // Clipboard needs a secure context; the text is selectable anyway.
    }
  }

  async function onRegenerateKey() {
    if (!armKeyRegen) {
      armKeyRegen = true;
      return;
    }
    armKeyRegen = false;
    const key = await controller.regenerateEmbedKey();
    if (!key) {
      view_state.settings.save.error = t().admin.keyRegenFailed;
    }
  }

  // Switching provider only edits the local draft: presets fill base URL and
  // a default model, Custom keeps whatever URL is already there, and the
  // stored API key is left alone in every case.
  function onProviderChange() {
    settingsDirty = true;
    const p = presetById(sProvider);
    if (!p) return;
    if (p.id === 'none') {
      sLlmBaseUrl = '';
    } else if (p.id !== 'custom') {
      sLlmBaseUrl = p.baseUrl;
      sLlmModel = modelAfterPresetSwitch(sLlmModel, p);
    }
  }

  async function onSaveSettings() {
    settingsDirty = false;
    await controller.saveSettings({
      llmModel: sLlmModel,
      embedModel: sEmbedModel,
      sttLanguage: sSttLanguage,
      llmBaseUrl: sLlmBaseUrl,
      llmApiKey: sApiKeyClear ? '' : sApiKey.trim() === '' ? undefined : sApiKey,
      embed: {
        embedEnabled: sEmbedEnabled,
        embedAllowedDomains: sEmbedDomains.trim(),
        embedThemeColor: sEmbedColor.trim(),
        embedPosition: sEmbedPosition,
        embedLanguage: sEmbedLanguage,
        embedVoiceEnabled: sEmbedVoice,
      },
      telephony: {
        telephonyEnabled: sTelEnabled,
        telephonyProvider: sTelProvider.trim(),
        telephonyInboundNumber: sTelNumber.trim(),
      },
    });
    sApiKey = '';
    sApiKeyClear = false;
  }

  async function onFilePicked(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    const bytes = new Uint8Array(await file.arrayBuffer());
    await controller.uploadDocument(file.name, bytes);
    input.value = '';
  }

  // Per-row delete confirmation: first tap arms, second tap executes.
  let confirmDeleteId = $state<string | null>(null);

  async function onDeleteDocument(id: string) {
    if (confirmDeleteId !== id) {
      confirmDeleteId = id;
      return;
    }
    confirmDeleteId = null;
    await controller.deleteDocument(id);
  }

  // User form (local mode only).
  let newUsername = $state('');
  let newPassword = $state('');
  let newRole = $state<'end_user' | 'agent' | 'tenant_admin'>('end_user');

  async function onCreateUser() {
    const ok = await controller.createUser(newUsername, newPassword, newRole);
    if (ok) {
      newUsername = '';
      newPassword = '';
      newRole = 'end_user';
    }
  }
</script>

<main class="card" aria-labelledby="admin-heading">
  <h1 id="admin-heading">{t().admin.heading}</h1>

  <nav class="tabs" aria-label={t().admin.tabsLabel}>
    <button class:active={tab === 'sessions'} onclick={() => (tab = 'sessions')}>
      {t().admin.tabSessions}
    </button>
    <button class:active={tab === 'kb'} onclick={() => (tab = 'kb')}>
      {t().admin.tabKb}
    </button>
    <button class:active={tab === 'audit'} onclick={() => (tab = 'audit')}>
      {t().admin.tabAudit}
    </button>
    {#if authMode === 'local'}
      <button class:active={tab === 'users'} onclick={() => (tab = 'users')}>
        {t().admin.tabUsers}
      </button>
    {/if}
    {#if isTenantAdmin}
      <button class:active={tab === 'settings'} onclick={openSettings}>
        {t().admin.tabSettings}
      </button>
    {/if}
  </nav>

  {#if view_state.error}
    <p role="alert" class="error">{view_state.error}</p>
  {/if}

  {#if tab === 'sessions'}
    <section aria-labelledby="sessions-heading">
      <h2 id="sessions-heading">{t().admin.tabSessions}</h2>
      {#if view_state.loading}
        <p role="status">{t().admin.loading}</p>
      {:else if view_state.sessions.length === 0}
        <p class="hint">{t().admin.sessionsEmpty}</p>
      {:else}
        <table>
          <thead>
            <tr>
              <th>{t().admin.colCreated}</th><th>{t().admin.colBy}</th><th>{t().admin.colStatus}</th>
            </tr>
          </thead>
          <tbody>
            {#each view_state.sessions as s (s.id)}
              <tr>
                <td>{formatTime(s.created_at_unix, getLocale())}</td>
                <td>{s.created_by}</td>
                <td>{s.status === 'active' ? t().admin.statusActive : t().admin.statusEnded}</td>
              </tr>
            {/each}
          </tbody>
        </table>
      {/if}
    </section>
  {:else if tab === 'kb'}
    <section aria-labelledby="kb-heading">
      <h2 id="kb-heading">{t().admin.tabKb}</h2>
      <p class="hint">{t().admin.kbHint}</p>
      <label class="upload">
        {t().admin.kbPick}
        <input
          type="file"
          accept=".pdf,.md,.markdown,.txt,.docx"
          onchange={onFilePicked}
          disabled={view_state.upload.running}
        />
      </label>
      {#if view_state.upload.running}
        <p role="status">{t().admin.kbIndexing}</p>
      {/if}
      {#if view_state.upload.lastResult}
        <p class="ok">{view_state.upload.lastResult}</p>
      {/if}
      {#if view_state.upload.error}
        <p role="alert" class="error">{view_state.upload.error}</p>
      {/if}

      <h3>{t().admin.kbDocuments}</h3>
      {#if view_state.documents.length === 0}
        <p class="hint">{t().admin.kbEmpty}</p>
      {:else}
        <table>
          <thead>
            <tr>
              <th>{t().admin.colName}</th><th>{t().admin.colChunks}</th>
              <th>{t().admin.colUploaded}</th><th>{t().admin.colBy}</th>
              <th><span class="visually-hidden">{t().admin.colAction}</span></th>
            </tr>
          </thead>
          <tbody>
            {#each view_state.documents as d (d.id)}
              <tr>
                <td>{d.name}</td>
                <td>{d.chunks_indexed}</td>
                <td>{formatTime(d.ingested_at_unix, getLocale())}</td>
                <td>{d.ingested_by}</td>
                <td>
                  <button
                    class:danger={confirmDeleteId === d.id}
                    disabled={view_state.kbDelete.runningId !== null}
                    onclick={() => onDeleteDocument(d.id)}
                  >
                    {confirmDeleteId === d.id
                      ? view_state.kbDelete.runningId === d.id
                        ? t().admin.deleting
                        : t().admin.deleteConfirm
                      : t().admin.delete}
                  </button>
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      {/if}
      {#if view_state.kbDelete.error}
        <p role="alert" class="error">{view_state.kbDelete.error}</p>
      {/if}
    </section>
  {:else if tab === 'users'}
    <section aria-labelledby="users-heading">
      <h2 id="users-heading">{t().admin.tabUsers}</h2>
      <p class="hint">{t().admin.usersHint}</p>
      <form
        class="userform"
        onsubmit={(e) => {
          e.preventDefault();
          onCreateUser();
        }}
      >
        <label>
          {t().app.username}
          <input bind:value={newUsername} required minlength="1" maxlength="64" autocomplete="off" />
        </label>
        <label>
          {t().admin.passwordMin}
          <input type="password" bind:value={newPassword} required minlength="12" autocomplete="new-password" />
        </label>
        <label>
          {t().admin.role}
          <select bind:value={newRole}>
            <option value="end_user">{t().admin.roleUserShort}</option>
            <option value="agent">{t().admin.roleAgentShort}</option>
            <option value="tenant_admin">{t().admin.roleAdminShort}</option>
          </select>
        </label>
        <button type="submit" disabled={view_state.userCreate.running}>
          {view_state.userCreate.running ? t().admin.creatingUser : t().admin.createUser}
        </button>
      </form>
      {#if view_state.userCreate.lastResult}
        <p class="ok">{view_state.userCreate.lastResult}</p>
      {/if}
      {#if view_state.userCreate.error}
        <p role="alert" class="error">{view_state.userCreate.error}</p>
      {/if}
    </section>
  {:else if tab === 'settings'}
    <section aria-labelledby="settings-heading">
      <h2 id="settings-heading">{t().settings.heading}</h2>
      <p class="hint">{t().settings.hint}</p>
      {#if !view_state.settings.loaded}
        <p role="status">{t().admin.loading}</p>
      {:else if view_state.settings.loadError}
        <p role="alert" class="error">{view_state.settings.loadError}</p>
      {:else}
        <form
          class="userform"
          onsubmit={(e) => {
            e.preventDefault();
            onSaveSettings();
          }}
        >
          <h3>{t().settings.aiHeading}</h3>
          <p class="hint">{t().settings.aiHint}</p>
          <label>
            {t().settings.provider}
            <select bind:value={sProvider} onchange={onProviderChange}>
              {#each LLM_PROVIDERS as p (p.id)}
                <option value={p.id}>{providerLabel(p.id, p.label)}</option>
              {/each}
            </select>
          </label>
          {#if sProvider === 'custom'}
            <label>
              {t().settings.endpointUrl}
              <input
                bind:value={sLlmBaseUrl}
                oninput={() => (settingsDirty = true)}
                placeholder="https://…"
                autocomplete="off"
              />
            </label>
          {:else if selectedPreset && selectedPreset.baseUrl}
            <p class="hint">{fill(t().settings.providerEndpointShown, { url: selectedPreset.baseUrl })}</p>
          {/if}
          {#if sProvider !== 'none'}
            <label>
              {t().settings.apiKey}
              <input
                type="password"
                bind:value={sApiKey}
                oninput={() => (settingsDirty = true)}
                autocomplete="off"
                placeholder={view_state.settings.values?.llm_api_key_set
                  ? t().settings.apiKeyPlaceholderSet
                  : t().settings.apiKeyPlaceholderUnset}
              />
            </label>
            {#if view_state.settings.values?.llm_api_key_set}
              <label class="checkbox">
                <input
                  type="checkbox"
                  bind:checked={sApiKeyClear}
                  onchange={() => (settingsDirty = true)}
                />
                {t().settings.apiKeyClear}
              </label>
            {/if}
            <p class="hint">{t().settings.apiKeyHint}</p>
          {/if}

          <details class="advanced">
            <summary>{t().settings.advancedSummary}</summary>
            <p class="hint">{t().settings.advancedHint}</p>
            <label>
              {t().settings.llmModel}
              <input
                bind:value={sLlmModel}
                oninput={() => (settingsDirty = true)}
                placeholder=""
                maxlength="128"
                autocomplete="off"
              />
            </label>
            <p class="hint">{t().settings.llmModelHint}</p>
            <label>
              {t().settings.embedModel}
              <input
                bind:value={sEmbedModel}
                oninput={() => (settingsDirty = true)}
                placeholder=""
                maxlength="128"
                autocomplete="off"
              />
            </label>
            <p class="hint">{t().settings.embedModelHint}</p>
            <label>
              {t().settings.sttLanguage}
              <input
                bind:value={sSttLanguage}
                oninput={() => (settingsDirty = true)}
                placeholder={getLocale()}
                maxlength="2"
                autocomplete="off"
              />
            </label>
            <p class="hint">{t().settings.sttLanguageHint}</p>
          </details>

          <div class="button-row">
            <button type="submit" disabled={view_state.settings.save.running}>
              {view_state.settings.save.running ? t().settings.saving : t().settings.save}
            </button>
            <button
              type="button"
              disabled={view_state.settings.connTest.running}
              onclick={() => controller.testLlmConnection()}
            >
              {view_state.settings.connTest.running ? t().settings.testing : t().settings.testConnection}
            </button>
          </div>
        </form>
        {#if view_state.settings.save.lastResult}
          <p class="ok">{view_state.settings.save.lastResult}</p>
        {/if}
        {#if view_state.settings.save.error}
          <p role="alert" class="error">{view_state.settings.save.error}</p>
        {/if}
        {#if view_state.settings.connTest.result}
          {#if view_state.settings.connTest.result.ok}
            <p class="ok">{view_state.settings.connTest.result.detail}</p>
          {:else}
            <p role="alert" class="error">{view_state.settings.connTest.result.detail}</p>
          {/if}
        {/if}
        {#if view_state.settings.connTest.error}
          <p role="alert" class="error">{view_state.settings.connTest.error}</p>
        {/if}

        <h3>{t().settings.embedHeading}</h3>
        <p class="hint">{t().settings.embedHint}</p>
        <label class="checkbox">
          <input
            type="checkbox"
            bind:checked={sEmbedEnabled}
            onchange={() => (settingsDirty = true)}
          />
          {t().settings.embedEnable}
        </label>
        {#if sEmbedEnabled}
          <label>
            {t().settings.embedPublicKey}
            <span class="button-row">
              <input
                readonly
                value={view_state.settings.values?.embed_public_key ?? ''}
                placeholder={t().settings.embedKeyPlaceholder}
                aria-label={t().settings.embedPublicKey}
              />
              <button
                type="button"
                disabled={!view_state.settings.values?.embed_public_key}
                onclick={() => copyText(view_state.settings.values?.embed_public_key ?? '', 'key')}
              >
                {keyCopied ? t().common.copied : t().common.copy}
              </button>
              <button type="button" onclick={onRegenerateKey}>
                {armKeyRegen
                  ? t().settings.embedKeyRegenArm
                  : view_state.settings.values?.embed_public_key
                    ? t().settings.embedKeyRegen
                    : t().settings.embedKeyGenerate}
              </button>
            </span>
          </label>
          <label>
            {t().settings.embedDomains}
            <input
              bind:value={sEmbedDomains}
              oninput={() => (settingsDirty = true)}
              placeholder="example.dk, www.example.dk"
              autocomplete="off"
            />
          </label>
          <p class="hint">{t().settings.embedDomainsHint}</p>
          <label>
            {t().settings.embedColor}
            <input
              bind:value={sEmbedColor}
              oninput={() => (settingsDirty = true)}
              placeholder="#0f5f4b"
              maxlength="7"
              autocomplete="off"
            />
          </label>
          <label>
            {t().settings.embedPosition}
            <select bind:value={sEmbedPosition} onchange={() => (settingsDirty = true)}>
              <option value="right">{t().settings.embedPositionRight}</option>
              <option value="left">{t().settings.embedPositionLeft}</option>
            </select>
          </label>
          <label>
            {t().settings.embedLanguage}
            <select bind:value={sEmbedLanguage} onchange={() => (settingsDirty = true)}>
              <option value="da">Dansk</option>
              <option value="en">English</option>
            </select>
          </label>
          <label class="checkbox">
            <input
              type="checkbox"
              bind:checked={sEmbedVoice}
              onchange={() => (settingsDirty = true)}
            />
            {t().settings.embedVoice}
          </label>
          {#if embedSnippet}
            <label>
              {t().settings.embedSnippet}
              <textarea readonly rows="3" aria-label={t().settings.embedSnippet}>{embedSnippet}</textarea>
            </label>
            <div class="button-row">
              <button type="button" onclick={() => copyText(embedSnippet, 'snippet')}>
                {snippetCopied ? t().common.copied : t().settings.embedSnippetCopy}
              </button>
            </div>
            <p class="hint">{t().settings.embedSnippetHint}</p>
          {:else}
            <p class="hint">{t().settings.embedSnippetMissing}</p>
          {/if}
        {/if}

        <h3>{t().settings.telHeading}</h3>
        <p class="hint">{t().settings.telHint}</p>
        <label class="checkbox">
          <input
            type="checkbox"
            bind:checked={sTelEnabled}
            onchange={() => (settingsDirty = true)}
          />
          {t().settings.telEnable}
        </label>
        {#if sTelEnabled}
          <label>
            {t().settings.telProvider}
            <input
              bind:value={sTelProvider}
              oninput={() => (settingsDirty = true)}
              placeholder=""
              maxlength="64"
              autocomplete="off"
            />
          </label>
          <label>
            {t().settings.telNumber}
            <input
              bind:value={sTelNumber}
              oninput={() => (settingsDirty = true)}
              placeholder="+45…"
              maxlength="16"
              autocomplete="off"
            />
          </label>
        {/if}
        <p class="hint">{t().settings.bootstrapHint}</p>
      {/if}
    </section>
  {:else}
    <section aria-labelledby="audit-heading">
      <h2 id="audit-heading">{t().admin.tabAudit}</h2>
      {#if view_state.audit.length === 0}
        <p class="hint">{t().admin.auditEmpty}</p>
      {:else}
        <table>
          <thead>
            <tr><th>{t().admin.colTime}</th><th>{t().admin.colActor}</th><th>{t().admin.colActionName}</th></tr>
          </thead>
          <tbody>
            {#each view_state.audit as e (e.id)}
              <tr>
                <td>{formatTime(e.at_unix, getLocale())}</td>
                <td>{e.actor}</td>
                <td><code>{e.action}</code></td>
              </tr>
            {/each}
          </tbody>
        </table>
      {/if}
    </section>
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
    min-width: 0;
    overflow-wrap: break-word;
  }
  /* Grid children default to min-width:auto, which lets the tab row and
     tables force the whole page wider than a phone viewport. Let them
     shrink instead; sections scroll their own overflow. */
  .card > * {
    min-width: 0;
  }
  section {
    min-width: 0;
    overflow-x: auto;
  }
  h1 {
    font-size: 1.25rem;
    margin: 0;
  }
  h2 {
    font-size: 1.1rem;
    margin: 0;
  }
  h3 {
    font-size: 1rem;
    margin: 0.5rem 0 0;
    padding-top: 0.75rem;
    border-top: 1px solid #e3ecea;
  }
  .tabs {
    display: flex;
    gap: 0.5rem;
    flex-wrap: wrap;
  }
  .tabs button {
    background: #e6f0ee;
    color: #10262e;
    min-height: 44px;
  }
  .tabs button.active {
    background: #10262e;
    color: white;
  }
  table {
    border-collapse: collapse;
    width: 100%;
    font-size: 0.9rem;
  }
  th,
  td {
    text-align: left;
    padding: 0.4rem 0.5rem;
    border-bottom: 1px solid #e3ecea;
  }
  .hint {
    color: #4a646d;
    font-size: 0.9rem;
    margin: 0;
    line-height: 1.5;
  }
  .ok {
    color: #1f8f6e;
    margin: 0;
  }
  .error {
    color: #a33b32;
    margin: 0;
  }
  form.userform {
    display: grid;
    gap: 1rem;
  }
  label {
    display: grid;
    gap: 0.25rem;
    font-size: 0.9rem;
    font-weight: 600;
  }
  label.checkbox {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-weight: 400;
    min-height: 44px;
  }
  label.checkbox input {
    width: 1.25rem;
    height: 1.25rem;
  }
  input,
  select,
  textarea {
    padding: 0.6rem 0.75rem;
    border: 1px solid #cfdedd;
    border-radius: 8px;
    font-size: 1rem;
    font-weight: 400;
    min-width: 0;
    min-height: 44px;
  }
  textarea {
    font-family: monospace;
    font-size: 0.85rem;
    min-height: 0;
  }
  .button-row {
    display: flex;
    gap: 0.5rem;
    flex-wrap: wrap;
  }
  .button-row input {
    flex: 1;
    min-width: 0;
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
  button:disabled {
    opacity: 0.5;
    cursor: default;
  }
  button.danger {
    background: #b3324b;
  }
  button:focus-visible,
  input:focus-visible,
  select:focus-visible,
  summary:focus-visible {
    outline: 3px solid #2fbd96;
    outline-offset: 2px;
  }
  details.advanced {
    border: 1px solid #e3ecea;
    border-radius: 8px;
    padding: 0.75rem 1rem;
    display: grid;
    gap: 0.75rem;
  }
  details.advanced summary {
    cursor: pointer;
    font-weight: 600;
    font-size: 0.95rem;
    min-height: 44px;
    align-content: center;
  }
  details.advanced label {
    margin-top: 0.25rem;
  }
  .visually-hidden {
    position: absolute;
    width: 1px;
    height: 1px;
    margin: -1px;
    padding: 0;
    overflow: hidden;
    clip: rect(0 0 0 0);
    white-space: nowrap;
    border: 0;
  }
</style>
