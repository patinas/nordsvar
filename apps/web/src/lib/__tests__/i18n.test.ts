// The no-mixed-language-state invariant: da and en must carry exactly the
// same keys, and every value must be a non-empty string. A missing
// translation fails here, never in the UI.
import { describe, it, expect } from 'vitest';
import { STRINGS, fill } from '../i18n.svelte';

function flatten(obj: Record<string, unknown>, prefix = ''): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(obj)) {
    const key = prefix ? `${prefix}.${k}` : k;
    if (typeof v === 'string') out[key] = v;
    else if (v && typeof v === 'object') Object.assign(out, flatten(v as Record<string, unknown>, key));
  }
  return out;
}

describe('i18n dictionaries', () => {
  it('da and en have identical key sets', () => {
    const daKeys = Object.keys(flatten(STRINGS.da as unknown as Record<string, unknown>)).sort();
    const enKeys = Object.keys(flatten(STRINGS.en as unknown as Record<string, unknown>)).sort();
    expect(enKeys).toEqual(daKeys);
  });

  it('every value is a non-empty string in both languages', () => {
    for (const locale of ['da', 'en'] as const) {
      for (const [key, value] of Object.entries(flatten(STRINGS[locale] as unknown as Record<string, unknown>))) {
        expect(value.trim().length, `${locale}:${key} must not be empty`).toBeGreaterThan(0);
      }
    }
  });

  it('fill() replaces placeholders and leaves none behind', () => {
    expect(fill('Svarene laves hos: {url}', { url: 'https://x.dk' })).toBe(
      'Svarene laves hos: https://x.dk',
    );
    expect(fill('a {missing} b', {})).toBe('a  b');
  });
});
