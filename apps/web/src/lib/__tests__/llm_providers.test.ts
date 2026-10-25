import { describe, expect, it } from 'vitest';
import {
  LLM_PROVIDERS,
  modelAfterPresetSwitch,
  presetById,
  providerForBaseUrl,
} from '../llm_providers';

describe('llm_providers', () => {
  it('offers every preset plus none and custom', () => {
    const ids = LLM_PROVIDERS.map((p) => p.id);
    expect(ids).toContain('none');
    expect(ids).toContain('custom');
    expect(ids).toEqual(
      expect.arrayContaining(['groq', 'openai', 'openrouter', 'mistral', 'together']),
    );
    for (const p of LLM_PROVIDERS) {
      if (p.id !== 'none' && p.id !== 'custom') {
        expect(p.baseUrl).toMatch(/^https:\/\//);
        expect(p.defaultModel).not.toBe('');
      }
    }
  });

  it('maps a stored preset URL back to its preset', () => {
    expect(providerForBaseUrl('https://api.groq.com/openai/v1')).toBe('groq');
    expect(providerForBaseUrl('https://api.groq.com/openai/v1/')).toBe('groq');
    expect(providerForBaseUrl(' https://openrouter.ai/api/v1 ')).toBe('openrouter');
  });

  it('maps empty values to none', () => {
    expect(providerForBaseUrl('')).toBe('none');
    expect(providerForBaseUrl(null)).toBe('none');
    expect(providerForBaseUrl(undefined)).toBe('none');
    expect(providerForBaseUrl('   ')).toBe('none');
  });

  it('maps unknown URLs to custom so saved config survives', () => {
    expect(providerForBaseUrl('https://llm.eksempel.dk')).toBe('custom');
  });

  it('fills the preset default model into an empty field', () => {
    const groq = presetById('groq')!;
    expect(modelAfterPresetSwitch('', groq)).toBe('llama-3.3-70b-versatile');
    expect(modelAfterPresetSwitch('   ', groq)).toBe('llama-3.3-70b-versatile');
  });

  it('replaces another preset default but never a typed model', () => {
    const groq = presetById('groq')!;
    const openai = presetById('openai')!;
    expect(modelAfterPresetSwitch('gpt-4o-mini', groq)).toBe('llama-3.3-70b-versatile');
    expect(modelAfterPresetSwitch('min-egen-model', groq)).toBe('min-egen-model');
    expect(modelAfterPresetSwitch('llama-3.3-70b-versatile', openai)).toBe('gpt-4o-mini');
  });

  it('leaves the model alone for presets without a default', () => {
    const custom = presetById('custom')!;
    expect(modelAfterPresetSwitch('min-model', custom)).toBe('min-model');
  });
});
