// UI language for the whole web app. Danish is the product default; the
// choice persists per browser. The two dictionaries must carry identical
// keys - the unit test enforces parity, so a missing translation can never
// ship as a mixed-language state.

export type Locale = 'da' | 'en';

const STORAGE_KEY = 'nordsvar-locale';

const da = {
  common: {
    language: 'Sprog',
    tagline: 'Rolige svar, der bliver i huset.',
    copy: 'Kopiér',
    copied: 'Kopieret',
    save: 'Gem',
    saving: 'Gemmer…',
    cancel: 'Annullér',
  },
  app: {
    loading: 'Henter indstillinger…',
    setupHeading: 'Velkommen til Nordsvar',
    setupHint:
      'Opret den første administrator for at komme i gang. Du kan tilføje flere brugere under Administration bagefter.',
    username: 'Brugernavn',
    password: 'Adgangskode',
    passwordNew: 'Adgangskode (mindst 12 tegn)',
    passwordRepeat: 'Gentag adgangskode',
    passwordMismatch: 'Adgangskoderne er ikke ens.',
    setupFailed: 'Opsætning mislykkedes. Prøv igen.',
    setupButton: 'Opret administrator',
    setupBusy: 'Opretter…',
    loginHeading: 'Log ind',
    loginButton: 'Log ind',
    loginBusy: 'Logger ind…',
    loginWrong: 'Forkert brugernavn eller adgangskode.',
    loginFailed: 'Login mislykkedes. Prøv igen.',
    oidcHeading: 'Log ind med SSO',
    oidcHint:
      'Denne installation bruger virksomhedens login (SSO). Åbn din organisations portal for at fortsætte.',
    devHeading: 'Log ind (udviklingstilstand)',
    devHint: 'I produktion logger du ind med virksomhedens SSO. Her bruger vi test-headers.',
    devTenant: 'Tenant-ID',
    devActor: 'Bruger-ID',
    devName: 'Vist navn (valgfrit)',
    devRole: 'Rolle (test)',
    roleEndUser: 'Slutbruger',
    roleAgent: 'Agent / IT-ansvarlig',
    roleAdmin: 'Tenant-administrator',
    devContinue: 'Fortsæt',
    navSupport: 'Support',
    navAdmin: 'Administration',
    guestMissingHeading: 'Deltag i session',
    guestMissingKey: 'Linket mangler sin adgangsnøgle. Brug det fulde link, du har fået.',
  },
  session: {
    heading: 'Supportsession',
    idleText:
      'Start en session for at tale med Nordsvar. Du kan dele din skærm - kamera bruges aldrig.',
    start: 'Start session',
    creating: 'Opretter session…',
    connected: '● Forbundet',
    micOff: 'Slå mikrofon fra',
    micOn: 'Slå mikrofon til',
    shareScreenStart: 'Del skærm',
    shareScreenStop: 'Stop skærmdeling',
    shareLinkCreate: 'Link til skærmdeling',
    shareLinkBusy: 'Opretter link…',
    shareLinkFailed: 'Linket kunne ikke oprettes. Prøv igen.',
    shareLinkHint: 'Send linket til den person, der skal dele sin skærm (virker i 2 timer):',
    shareLinkLabel: 'Link til skærmdeling',
    shareViaDevice: 'Del link…',
    transcriptHeading: 'Transskription',
    transcriptEmpty: 'Sig noget - transskriptionen vises her.',
    you: 'Du',
    assistant: 'Nordsvar',
    ending: 'Afslutter…',
    ended: 'Sessionen er afsluttet.',
    startNew: 'Start ny session',
    failed: 'Noget gik galt:',
    retry: 'Prøv igen',
    end: 'Afslut session',
    noScreenShare:
      'Denne enhed kan ikke dele sin skærm (mobilbrowsere tillader ikke skærmdeling). Samtalen fungerer helt normalt med lyd her på telefonen.',
    noScreenShareHandoff:
      'Vil du vise din skærm, så åbn denne side på en computer og start sessionen der - eller send et link til en person ved en computer med knappen herunder.',
  },
  guest: {
    heading: 'Deltag i session',
    joining: 'Deltager i sessionen…',
    connected: '● Forbundet - du er med i sessionen',
    shareText: 'Del din skærm, så assistenten kan se den. Kamera bruges aldrig.',
    shareStart: 'Del skærm',
    shareStop: 'Stop skærmdeling',
    noShare:
      'Din browser understøtter ikke skærmdeling (mobilbrowsere kan ikke dele skærm). Du kan høre og tale med - åbn linket på en computer for at dele skærm.',
    leave: 'Forlad session',
    disconnected: 'Forbindelsen blev afbrudt.',
    expired: 'Linket er udløbet eller ugyldigt. Bed om et nyt.',
    sessionEnded: 'Sessionen er afsluttet.',
    joinFailed: 'Kunne ikke deltage i sessionen. Prøv igen eller bed om et nyt link.',
    shareFailed: 'Skærmdeling mislykkedes. Prøv igen.',
  },
  admin: {
    heading: 'Administration',
    tabsLabel: 'Administrationsvisninger',
    tabSessions: 'Sessioner',
    tabKb: 'Vidensbase',
    tabAudit: 'Auditlog',
    tabUsers: 'Brugere',
    tabSettings: 'Indstillinger',
    loading: 'Indlæser…',
    sessionsEmpty: 'Ingen sessioner endnu (eller manglende agent-rolle).',
    colCreated: 'Oprettet',
    colBy: 'Af',
    colStatus: 'Status',
    statusActive: 'Aktiv',
    statusEnded: 'Afsluttet',
    kbHint:
      'Upload PDF, Markdown, TXT eller DOCX. Indholdet forbliver i jeres egen infrastruktur.',
    kbPick: 'Vælg dokument',
    kbIndexing: 'Indekserer…',
    kbDocuments: 'Dokumenter',
    kbEmpty: 'Ingen dokumenter endnu (eller manglende agent-rolle).',
    colName: 'Navn',
    colChunks: 'Bidder',
    colUploaded: 'Uploadet',
    colAction: 'Handling',
    delete: 'Slet',
    deleting: 'Sletter…',
    deleteConfirm: 'Bekræft sletning',
    usersHint:
      'Opret flere brugere til denne installation. Roller: slutbruger (ringer ind), agent (svarer og ser sessioner), administrator (også vidensbase og auditlog).',
    passwordMin: 'Adgangskode (mindst 12 tegn)',
    role: 'Rolle',
    roleUserShort: 'Slutbruger',
    roleAgentShort: 'Agent',
    roleAdminShort: 'Administrator',
    createUser: 'Opret bruger',
    creatingUser: 'Opretter…',
    auditEmpty: 'Ingen hændelser (eller manglende tenant_admin-rolle).',
    colTime: 'Tidspunkt',
    colActor: 'Aktør',
    colActionName: 'Handling',
    keyRegenFailed: 'Kunne ikke generere en ny nøgle. Prøv igen.',
  },
  settings: {
    heading: 'Indstillinger',
    hint:
      'Disse indstillinger gælder kun jeres virksomhed. Tomme felter bruger standarden, som passer til de fleste.',
    save: 'Gem indstillinger',
    saving: 'Gemmer…',
    saved: 'Indstillinger gemt',
    testConnection: 'Test forbindelse',
    testing: 'Tester…',
    // Guided AI section
    aiHeading: 'Assistentens svar (AI)',
    aiHint:
      'Assistenten bruger en sprogmodel til at svare på spørgsmål. Vælg hvor den model kører - eller lad standarden stå.',
    provider: 'Hvor skal svarene laves?',
    providerNone: 'På denne server - intet forlader huset (anbefalet)',
    providerCustom: 'En anden udbyder (avanceret)',
    providerEndpointShown: 'Svarene laves hos: {url}',
    apiKey: 'Nøgle fra udbyderen',
    apiKeyPlaceholderSet: 'gemt - lad stå tom for at beholde',
    apiKeyPlaceholderUnset: 'indtast nøgle',
    apiKeyHint:
      'Nøglen finder du i udbyderens kontrolpanel. Den gemmes krypteret på serveren og vises aldrig i browseren igen.',
    apiKeyClear: 'Ryd den gemte nøgle',
    // Advanced section (progressive disclosure)
    advancedSummary: 'Avancerede indstillinger (modelnavne og tekniske detaljer)',
    advancedHint:
      'Disse felter er til den tekniske kontakt. De fleste skal ikke ændre noget her.',
    llmModel: 'Svarmodel (tekst-AI)',
    llmModelHint: 'Hvilken model assistenten bruger til at svare. Lad stå tom for standarden.',
    embedModel: 'Søgemodel (embeddings)',
    embedModelHint: 'Hvilken model der bruges til at finde de rigtige afsnit i vidensbasen.',
    sttLanguage: 'Talesprog (to bogstaver, fx da)',
    sttLanguageHint: 'Sproget assistenten lytter efter i opkald, fx da eller en.',
    endpointUrl: 'Endpoint-URL (OpenAI-kompatibel, https)',
    // Embed section
    embedHeading: 'Chat-widget på jeres hjemmeside',
    embedHint:
      'Lad besøgende chatte med assistenten direkte på jeres egen hjemmeside. Widgetten bruger kun jeres vidensbase og gemmer intet om de besøgende.',
    embedEnable: 'Aktivér widget',
    embedPublicKey: 'Offentlig nøgle',
    embedKeyPlaceholder: 'tryk Gem, og generér derefter en nøgle',
    embedKeyRegenArm: 'Sikker? Gamle nøgler stopper',
    embedKeyRegen: 'Generér ny nøgle',
    embedKeyGenerate: 'Generér nøgle',
    embedDomains: 'Tilladte domæner (kommasepareret)',
    embedDomainsHint: 'Widgetten virker kun på sider under disse domæner (inkl. underdomæner).',
    embedColor: 'Farve (valgfri, #rrggbb)',
    embedPosition: 'Placering',
    embedPositionRight: 'Højre',
    embedPositionLeft: 'Venstre',
    embedLanguage: 'Widget-sprog',
    embedVoice: 'Tillad tale (mikrofon hos den besøgende)',
    embedSnippet: 'Kode til hjemmesiden',
    embedSnippetCopy: 'Kopiér kode',
    embedSnippetHint: 'Sæt koden ind før </body> på jeres side. Se docs/EMBED.md for detaljer.',
    embedSnippetMissing: 'Gem indstillingerne og generér en nøgle for at få koden til hjemmesiden.',
    // Telephony section
    telHeading: 'Telefoni (opkald til assistenten)',
    telHint:
      'Ikke aktiveret. Opkald til assistenten kræver, at I køber et telefonnummer hos en teleudbyder (fx Twilio eller en dansk udbyder), og at den driftsansvarlige opsætter forbindelsen. Se docs/TELEPHONY.md for priser og fremgangsmåde. Felterne her gemmer kun jeres plan - der trækkes ingen penge, og intet går live.',
    telEnable: 'Planlæg telefoni (kræver opsætning af driftsansvarlig)',
    telProvider: 'Teleudbyder',
    telNumber: 'Telefonnummer (landekode først, fx +4512345678)',
    bootstrapHint:
      'Tekniske basisindstillinger (domæne, identitetsudbyder, databasenøgler mv.) sættes af den driftsansvarlige ved installationen.',
  },
};

export type Strings = typeof da;

const en: Strings = {
  common: {
    language: 'Language',
    tagline: 'Calm answers that stay in-house.',
    copy: 'Copy',
    copied: 'Copied',
    save: 'Save',
    saving: 'Saving…',
    cancel: 'Cancel',
  },
  app: {
    loading: 'Loading settings…',
    setupHeading: 'Welcome to Nordsvar',
    setupHint:
      'Create the first administrator to get started. You can add more users under Administration later.',
    username: 'Username',
    password: 'Password',
    passwordNew: 'Password (at least 12 characters)',
    passwordRepeat: 'Repeat password',
    passwordMismatch: 'The passwords do not match.',
    setupFailed: 'Setup failed. Please try again.',
    setupButton: 'Create administrator',
    setupBusy: 'Creating…',
    loginHeading: 'Sign in',
    loginButton: 'Sign in',
    loginBusy: 'Signing in…',
    loginWrong: 'Wrong username or password.',
    loginFailed: 'Sign-in failed. Please try again.',
    oidcHeading: 'Sign in with SSO',
    oidcHint:
      'This installation uses your company sign-in (SSO). Open your organisation\'s portal to continue.',
    devHeading: 'Sign in (development mode)',
    devHint: 'In production you sign in with the company SSO. Here we use test headers.',
    devTenant: 'Tenant ID',
    devActor: 'User ID',
    devName: 'Display name (optional)',
    devRole: 'Role (test)',
    roleEndUser: 'End user',
    roleAgent: 'Agent / IT contact',
    roleAdmin: 'Tenant administrator',
    devContinue: 'Continue',
    navSupport: 'Support',
    navAdmin: 'Administration',
    guestMissingHeading: 'Join session',
    guestMissingKey: 'The link is missing its access key. Use the full link you were given.',
  },
  session: {
    heading: 'Support session',
    idleText: 'Start a session to talk with Nordsvar. You can share your screen - the camera is never used.',
    start: 'Start session',
    creating: 'Creating session…',
    connected: '● Connected',
    micOff: 'Turn microphone off',
    micOn: 'Turn microphone on',
    shareScreenStart: 'Share screen',
    shareScreenStop: 'Stop screen sharing',
    shareLinkCreate: 'Screen-share link',
    shareLinkBusy: 'Creating link…',
    shareLinkFailed: 'The link could not be created. Please try again.',
    shareLinkHint: 'Send the link to the person who should share their screen (valid for 2 hours):',
    shareLinkLabel: 'Screen-share link',
    shareViaDevice: 'Share link…',
    transcriptHeading: 'Transcript',
    transcriptEmpty: 'Say something - the transcript appears here.',
    you: 'You',
    assistant: 'Nordsvar',
    ending: 'Ending…',
    ended: 'The session has ended.',
    startNew: 'Start new session',
    failed: 'Something went wrong:',
    retry: 'Try again',
    end: 'End session',
    noScreenShare:
      'This device cannot share its screen (mobile browsers do not allow screen sharing). The call works normally with audio here on the phone.',
    noScreenShareHandoff:
      'To show your screen, open this page on a computer and start the session there - or send a link to a person at a computer with the button below.',
  },
  guest: {
    heading: 'Join session',
    joining: 'Joining the session…',
    connected: '● Connected - you are in the session',
    shareText: 'Share your screen so the assistant can see it. The camera is never used.',
    shareStart: 'Share screen',
    shareStop: 'Stop screen sharing',
    noShare:
      'Your browser does not support screen sharing (mobile browsers cannot share the screen). You can hear and talk - open the link on a computer to share your screen.',
    leave: 'Leave session',
    disconnected: 'The connection was lost.',
    expired: 'The link has expired or is invalid. Ask for a new one.',
    sessionEnded: 'The session has ended.',
    joinFailed: 'Could not join the session. Try again or ask for a new link.',
    shareFailed: 'Screen sharing failed. Please try again.',
  },
  admin: {
    heading: 'Administration',
    tabsLabel: 'Administration views',
    tabSessions: 'Sessions',
    tabKb: 'Knowledge base',
    tabAudit: 'Audit log',
    tabUsers: 'Users',
    tabSettings: 'Settings',
    loading: 'Loading…',
    sessionsEmpty: 'No sessions yet (or missing agent role).',
    colCreated: 'Created',
    colBy: 'By',
    colStatus: 'Status',
    statusActive: 'Active',
    statusEnded: 'Ended',
    kbHint: 'Upload PDF, Markdown, TXT or DOCX. The content stays in your own infrastructure.',
    kbPick: 'Choose document',
    kbIndexing: 'Indexing…',
    kbDocuments: 'Documents',
    kbEmpty: 'No documents yet (or missing agent role).',
    colName: 'Name',
    colChunks: 'Chunks',
    colUploaded: 'Uploaded',
    colAction: 'Action',
    delete: 'Delete',
    deleting: 'Deleting…',
    deleteConfirm: 'Confirm deletion',
    usersHint:
      'Create more users for this installation. Roles: end user (calls in), agent (answers and sees sessions), administrator (also knowledge base and audit log).',
    passwordMin: 'Password (at least 12 characters)',
    role: 'Role',
    roleUserShort: 'End user',
    roleAgentShort: 'Agent',
    roleAdminShort: 'Administrator',
    createUser: 'Create user',
    creatingUser: 'Creating…',
    auditEmpty: 'No events (or missing tenant_admin role).',
    colTime: 'Time',
    colActor: 'Actor',
    colActionName: 'Action',
    keyRegenFailed: 'Could not generate a new key. Please try again.',
  },
  settings: {
    heading: 'Settings',
    hint: 'These settings apply only to your company. Empty fields use the default, which works for most.',
    save: 'Save settings',
    saving: 'Saving…',
    saved: 'Settings saved',
    testConnection: 'Test connection',
    testing: 'Testing…',
    aiHeading: 'Assistant answers (AI)',
    aiHint:
      'The assistant uses a language model to answer questions. Choose where that model runs - or keep the default.',
    provider: 'Where should answers be made?',
    providerNone: 'On this server - nothing leaves the house (recommended)',
    providerCustom: 'Another provider (advanced)',
    providerEndpointShown: 'Answers are made at: {url}',
    apiKey: 'Key from the provider',
    apiKeyPlaceholderSet: 'saved - leave empty to keep',
    apiKeyPlaceholderUnset: 'enter key',
    apiKeyHint:
      'You find the key in the provider\'s control panel. It is stored encrypted on the server and is never shown in the browser again.',
    apiKeyClear: 'Clear the saved key',
    advancedSummary: 'Advanced settings (model names and technical details)',
    advancedHint: 'These fields are for the technical contact. Most people should change nothing here.',
    llmModel: 'Answer model (text AI)',
    llmModelHint: 'Which model the assistant answers with. Leave empty for the default.',
    embedModel: 'Search model (embeddings)',
    embedModelHint: 'Which model finds the right passages in the knowledge base.',
    sttLanguage: 'Speech language (two letters, e.g. en)',
    sttLanguageHint: 'The language the assistant listens for in calls, e.g. da or en.',
    endpointUrl: 'Endpoint URL (OpenAI-compatible, https)',
    embedHeading: 'Chat widget on your website',
    embedHint:
      'Let visitors chat with the assistant directly on your own website. The widget only uses your knowledge base and stores nothing about visitors.',
    embedEnable: 'Enable widget',
    embedPublicKey: 'Public key',
    embedKeyPlaceholder: 'press Save, then generate a key',
    embedKeyRegenArm: 'Sure? Old keys stop working',
    embedKeyRegen: 'Generate new key',
    embedKeyGenerate: 'Generate key',
    embedDomains: 'Allowed domains (comma-separated)',
    embedDomainsHint: 'The widget only works on pages under these domains (incl. subdomains).',
    embedColor: 'Colour (optional, #rrggbb)',
    embedPosition: 'Position',
    embedPositionRight: 'Right',
    embedPositionLeft: 'Left',
    embedLanguage: 'Widget language',
    embedVoice: 'Allow voice (visitor\'s microphone)',
    embedSnippet: 'Code for the website',
    embedSnippetCopy: 'Copy code',
    embedSnippetHint: 'Paste the code before </body> on your page. See docs/EMBED.md for details.',
    embedSnippetMissing: 'Save the settings and generate a key to get the website code.',
    telHeading: 'Telephony (calls to the assistant)',
    telHint:
      'Not activated. Calling the assistant requires buying a phone number from a telephony provider (e.g. Twilio or a Danish provider) and having the operator set up the connection. See docs/TELEPHONY.md for pricing and steps. These fields only store your plan - no money is charged and nothing goes live.',
    telEnable: 'Plan telephony (requires setup by the operator)',
    telProvider: 'Telephony provider',
    telNumber: 'Phone number (country code first, e.g. +4512345678)',
    bootstrapHint:
      'Technical base settings (domain, identity provider, database keys etc.) are set by the operator during installation.',
  },
};

export const STRINGS: Record<Locale, Strings> = { da, en };

function detectInitialLocale(): Locale {
  if (typeof localStorage !== 'undefined') {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'da' || stored === 'en') return stored;
  }
  if (typeof navigator !== 'undefined' && navigator.language) {
    return navigator.language.toLowerCase().startsWith('da') ? 'da' : 'en';
  }
  return 'da';
}

// Module-level reactive locale (Svelte 5 runes work in .svelte.ts files).
let current = $state<Locale>(detectInitialLocale());

export function getLocale(): Locale {
  return current;
}

export function setLocale(next: Locale): void {
  current = next;
  try {
    localStorage.setItem(STORAGE_KEY, next);
  } catch {
    // Private mode: the choice just lives for this page load.
  }
  if (typeof document !== 'undefined') {
    document.documentElement.lang = next;
  }
}

/** Current dictionary. Called from templates, so the read is tracked and
 * the UI re-renders when the locale changes. */
export function t(): Strings {
  return STRINGS[current];
}

/** Locale-aware timestamp for tables. */
export function formatTime(unix: number, locale: Locale = current): string {
  return new Date(unix * 1000).toLocaleString(locale === 'da' ? 'da-DK' : 'en-GB');
}

/** Fill a {placeholder} in a dictionary string. */
export function fill(template: string, vars: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (_, name: string) => vars[name] ?? '');
}
