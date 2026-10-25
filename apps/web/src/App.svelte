<script lang="ts">
  import { onMount } from 'svelte';
  import SessionView from './pages/SessionView.svelte';
  import AdminView from './pages/AdminView.svelte';
  import GuestJoinView from './pages/GuestJoinView.svelte';
  import { NordsvarApi, type TenantCredentials, ApiError } from './lib/api';
  import { t, getLocale, setLocale, type Locale } from './lib/i18n.svelte';
  import lockupUrl from './lib/brand-lockup-light.svg?url';

  const api = new NordsvarApi();

  // Screen flow: ask the API how this deployment authenticates, then show
  // the matching entry - first-run wizard, local login, dev headers, or an
  // SSO note.
  // Guest share links land on /s/{session-id}?t={token}: render the join
  // page directly, with no login - the signed token is the credential.
  const guestMatch = window.location.pathname.match(/^\/s\/[^/?]+/);
  const guestToken = guestMatch
    ? (new URLSearchParams(window.location.search).get('t') ?? '')
    : '';

  let screen = $state<'loading' | 'setup' | 'login' | 'dev' | 'oidc'>('loading');
  let authMode = $state<'dev' | 'oidc' | 'local'>('dev');
  let creds = $state<TenantCredentials | null>(null);
  let displayName = $state('');
  let view = $state<'support' | 'admin'>('support');
  let error = $state('');
  let busy = $state(false);

  // Dev-mode fields (kept for local development).
  let devTenant = $state('');
  let devActor = $state('');
  let devRoles = $state('agent');

  // Wizard/login fields.
  let username = $state('');
  let password = $state('');
  let password2 = $state('');

  onMount(async () => {
    // Keep <html lang> honest for screen readers from the first paint.
    document.documentElement.lang = getLocale();
    try {
      const status = await api.getSetupStatus();
      authMode = status.auth_mode;
      if (status.auth_mode === 'local') {
        screen = status.needs_setup ? 'setup' : 'login';
      } else if (status.auth_mode === 'oidc') {
        screen = 'oidc';
      } else {
        screen = 'dev';
      }
    } catch {
      // The API is unreachable or older than the setup endpoint: fall back
      // to the dev sign-in so development never locks out.
      screen = 'dev';
    }
  });

  function signedInAs(c: TenantCredentials, name: string) {
    creds = c;
    displayName = name;
    error = '';
  }

  async function runSetup() {
    error = '';
    if (password !== password2) {
      error = t().app.passwordMismatch;
      return;
    }
    busy = true;
    try {
      const r = await api.setupAdmin(username.trim(), password);
      signedInAs(
        { tenantId: r.tenant, actorId: r.username, roles: r.roles, token: r.token },
        r.username,
      );
    } catch (e) {
      error = e instanceof ApiError ? e.message : t().app.setupFailed;
    } finally {
      busy = false;
    }
  }

  async function runLogin() {
    error = '';
    busy = true;
    try {
      const r = await api.login(username.trim(), password);
      signedInAs(
        { tenantId: r.tenant, actorId: r.username, roles: r.roles, token: r.token },
        r.username,
      );
    } catch (e) {
      error =
        e instanceof ApiError && e.status === 401 ? t().app.loginWrong : t().app.loginFailed;
    } finally {
      busy = false;
    }
  }

  function devSignIn() {
    if (devTenant.trim() && devActor.trim()) {
      signedInAs(
        { tenantId: devTenant.trim(), actorId: devActor.trim(), roles: devRoles.split(',') },
        displayName || devActor.trim(),
      );
    }
  }

  function onLanguageChange(event: Event) {
    setLocale((event.target as HTMLSelectElement).value as Locale);
  }
</script>

<div class="app">
  <header>
    <img src={lockupUrl} alt="Nordsvar" height="36" />
    <p class="tagline">{t().common.tagline}</p>
    <label class="langpick">
      <span class="visually-hidden">{t().common.language}</span>
      <select
        aria-label={t().common.language}
        value={getLocale()}
        onchange={onLanguageChange}
      >
        <option value="da">Dansk</option>
        <option value="en">English</option>
      </select>
    </label>
  </header>

  {#if guestMatch}
    {#if guestToken}
      <GuestJoinView token={guestToken} />
    {:else}
      <main class="card" aria-labelledby="guest-missing-heading">
        <h1 id="guest-missing-heading">{t().app.guestMissingHeading}</h1>
        <p role="alert" class="error">{t().app.guestMissingKey}</p>
      </main>
    {/if}
  {:else if screen === 'loading'}
    <main class="card" aria-busy="true">
      <p class="hint">{t().app.loading}</p>
    </main>
  {:else if !creds && screen === 'setup'}
    <main class="card" aria-labelledby="setup-heading">
      <h1 id="setup-heading">{t().app.setupHeading}</h1>
      <p class="hint">{t().app.setupHint}</p>
      <label>
        {t().app.username}
        <input bind:value={username} autocomplete="username" />
      </label>
      <label>
        {t().app.passwordNew}
        <input type="password" bind:value={password} autocomplete="new-password" />
      </label>
      <label>
        {t().app.passwordRepeat}
        <input type="password" bind:value={password2} autocomplete="new-password" />
      </label>
      {#if error}<p class="error" role="alert">{error}</p>{/if}
      <button
        class="primary"
        onclick={runSetup}
        disabled={busy || !username.trim() || password.length < 12 || !password2}
      >
        {busy ? t().app.setupBusy : t().app.setupButton}
      </button>
    </main>
  {:else if !creds && screen === 'login'}
    <main class="card" aria-labelledby="login-heading">
      <h1 id="login-heading">{t().app.loginHeading}</h1>
      <label>
        {t().app.username}
        <input bind:value={username} autocomplete="username" />
      </label>
      <label>
        {t().app.password}
        <input type="password" bind:value={password} autocomplete="current-password" />
      </label>
      {#if error}<p class="error" role="alert">{error}</p>{/if}
      <button class="primary" onclick={runLogin} disabled={busy || !username.trim() || !password}>
        {busy ? t().app.loginBusy : t().app.loginButton}
      </button>
    </main>
  {:else if !creds && screen === 'oidc'}
    <main class="card" aria-labelledby="oidc-heading">
      <h1 id="oidc-heading">{t().app.oidcHeading}</h1>
      <p class="hint">{t().app.oidcHint}</p>
    </main>
  {:else if !creds}
    <main class="card" aria-labelledby="signin-heading">
      <h1 id="signin-heading">{t().app.devHeading}</h1>
      <p class="hint">{t().app.devHint}</p>
      <label>
        {t().app.devTenant}
        <input bind:value={devTenant} placeholder="xxxxxxxx-xxxx-..." autocomplete="off" />
      </label>
      <label>
        {t().app.devActor}
        <input bind:value={devActor} placeholder="f.eks. andreas" autocomplete="off" />
      </label>
      <label>
        {t().app.devName}
        <input bind:value={displayName} placeholder="Andreas" autocomplete="off" />
      </label>
      <label>
        {t().app.devRole}
        <select bind:value={devRoles}>
          <option value="end_user">{t().app.roleEndUser}</option>
          <option value="agent">{t().app.roleAgent}</option>
          <option value="tenant_admin">{t().app.roleAdmin}</option>
        </select>
      </label>
      <button class="primary" onclick={devSignIn} disabled={!devTenant.trim() || !devActor.trim()}>
        {t().app.devContinue}
      </button>
    </main>
  {:else if creds}
    <nav class="viewnav" aria-label={t().app.navSupport + ' / ' + t().app.navAdmin}>
      <button class:active={view === 'support'} onclick={() => (view = 'support')}>
        {t().app.navSupport}
      </button>
      <button class:active={view === 'admin'} onclick={() => (view = 'admin')}>
        {t().app.navAdmin}
      </button>
    </nav>
    {#if view === 'support'}
      <SessionView credentials={creds} {displayName} />
    {:else}
      <AdminView credentials={creds} {authMode} />
    {/if}
  {/if}
</div>

<style>
  :global(*, *::before, *::after) {
    box-sizing: border-box;
  }
  :global(body) {
    margin: 0;
    font-family: 'Noto Sans', system-ui, sans-serif;
    background: #f6f8f7; /* Mist */
    color: #10262e; /* Nord Ink */
    /* Guard: no view may ever push the page wider than the viewport. */
    overflow-x: clip;
  }
  .app {
    max-width: 720px;
    margin: 0 auto;
    padding: 2rem 1rem;
  }
  header {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.5rem 1rem;
    margin-bottom: 2rem;
  }
  .tagline {
    color: #4a646d;
    margin: 0;
    flex: 1;
    min-width: 0;
  }
  .langpick select {
    padding: 0.45rem 0.6rem;
    border: 1px solid #cfdedd;
    border-radius: 8px;
    font-size: 0.95rem;
    background: white;
    min-height: 44px;
  }
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
  .hint {
    margin: 0;
    color: #4a646d;
    font-size: 0.95rem;
    line-height: 1.5;
  }
  label {
    display: grid;
    gap: 0.25rem;
    font-size: 0.9rem;
    font-weight: 600;
  }
  input {
    padding: 0.6rem 0.75rem;
    border: 1px solid #cfdedd;
    border-radius: 8px;
    font-size: 1rem;
    min-width: 0;
    min-height: 44px;
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
  select {
    padding: 0.6rem 0.75rem;
    border: 1px solid #cfdedd;
    border-radius: 8px;
    font-size: 1rem;
    min-height: 44px;
  }
  .viewnav {
    display: flex;
    gap: 0.5rem;
    margin-bottom: 1rem;
  }
  .viewnav button {
    background: #e6f0ee;
    color: #10262e;
    flex: 1;
  }
  .viewnav button.active {
    background: #10262e;
    color: white;
  }
  button:focus-visible,
  input:focus-visible,
  select:focus-visible {
    outline: 3px solid #2fbd96; /* Aurora */
    outline-offset: 2px;
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
  @media (max-width: 520px) {
    .app {
      padding: 1rem 0.75rem;
    }
    .card {
      padding: 1rem;
    }
  }
  .error {
    margin: 0;
    color: #a33b32;
    font-size: 0.95rem;
    line-height: 1.5;
  }
</style>
