// External language-model provider presets for Administration > Indstillinger.
// Pure frontend convenience: picking a preset fills the OpenAI-compatible
// base URL (and a sensible default model) into the settings draft. The
// backend still only stores llm_base_url / llm_model / llm_api_key, and the
// API key keeps its write-only keep/clear/replace semantics.

export interface LlmProviderPreset {
  id: string; // 'none' | a provider id | 'custom'
  label: string; // Danish UI label
  baseUrl: string; // '' for 'none' and 'custom'
  defaultModel: string; // suggested model, '' when there is no suggestion
}

export const LLM_PROVIDERS: readonly LlmProviderPreset[] = [
  { id: 'none', label: 'Ingen (serverens standard)', baseUrl: '', defaultModel: '' },
  {
    id: 'groq',
    label: 'Groq',
    baseUrl: 'https://api.groq.com/openai/v1',
    defaultModel: 'llama-3.3-70b-versatile',
  },
  {
    id: 'openai',
    label: 'OpenAI',
    baseUrl: 'https://api.openai.com/v1',
    defaultModel: 'gpt-4o-mini',
  },
  {
    id: 'openrouter',
    label: 'OpenRouter',
    baseUrl: 'https://openrouter.ai/api/v1',
    defaultModel: 'openai/gpt-4o-mini',
  },
  {
    id: 'mistral',
    label: 'Mistral AI',
    baseUrl: 'https://api.mistral.ai/v1',
    defaultModel: 'mistral-small-latest',
  },
  {
    id: 'together',
    label: 'Together AI',
    baseUrl: 'https://api.together.xyz/v1',
    defaultModel: 'meta-llama/Llama-3.3-70B-Instruct-Turbo',
  },
  { id: 'custom', label: 'Brugerdefineret (OpenAI-kompatibel)', baseUrl: '', defaultModel: '' },
] as const;

export function presetById(id: string): LlmProviderPreset | undefined {
  return LLM_PROVIDERS.find((p) => p.id === id);
}

// Map a stored base URL back to the preset it came from. Anything we do not
// recognise is shown as 'custom' so a saved configuration is never silently
// rewritten to look like a preset.
export function providerForBaseUrl(baseUrl: string | null | undefined): string {
  const u = (baseUrl ?? '').trim().replace(/\/+$/, '');
  if (u === '') return 'none';
  for (const p of LLM_PROVIDERS) {
    if (p.baseUrl !== '' && p.baseUrl === u) return p.id;
  }
  return 'custom';
}

// When the admin switches preset, offer the preset's default model - but
// never clobber a model they typed themselves. A model that merely matches
// another preset's default follows the switch.
export function modelAfterPresetSwitch(currentModel: string, preset: LlmProviderPreset): string {
  if (preset.defaultModel === '') return currentModel;
  const cur = currentModel.trim();
  if (cur === '') return preset.defaultModel;
  const matchesOtherPreset = LLM_PROVIDERS.some(
    (p) => p.id !== preset.id && p.defaultModel !== '' && p.defaultModel === cur,
  );
  return matchesOtherPreset ? preset.defaultModel : currentModel;
}
