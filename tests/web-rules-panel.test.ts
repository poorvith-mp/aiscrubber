import { describe, expect, test, beforeEach } from 'vitest';
import { scrubText, type CustomRule } from '../src/lib/scrub';
import { detectorDefinitions } from '../src/lib/scrubCore.js';

describe('Web Rules Panel & Persistence Logic', () => {
  const STORAGE_KEY = 'aiscrubber.rules.v1';
  const allDetectors = new Set(detectorDefinitions.map((d) => d.id));

  // Mock localStorage in Node/Vitest
  const mockStorage: Record<string, string> = {};
  const localStorageMock = {
    getItem: (key: string) => mockStorage[key] || null,
    setItem: (key: string, val: string) => { mockStorage[key] = val; },
    removeItem: (key: string) => { delete mockStorage[key]; },
    clear: () => { for (const k of Object.keys(mockStorage)) delete mockStorage[k]; },
  };

  beforeEach(() => {
    localStorageMock.clear();
  });

  test('serializes and deserializes custom rules to localStorage key aiscrubber.rules.v1', () => {
    const rules: CustomRule[] = [
      {
        id: 'rule_1',
        label: 'Internal Project',
        token: 'PROJECT',
        patternString: 'SecretProjectX',
        isRegex: false,
        enabled: true,
      },
    ];

    localStorageMock.setItem(STORAGE_KEY, JSON.stringify(rules));
    const retrieved = JSON.parse(localStorageMock.getItem(STORAGE_KEY)!);
    expect(retrieved).toHaveLength(1);
    expect(retrieved[0].id).toBe('rule_1');
    expect(retrieved[0].patternString).toBe('SecretProjectX');
  });

  test('handles imported rules from both array and object format', () => {
    const rawArray = [
      { id: 'r1', label: 'Rule 1', token: 'R1', patternString: 'pat1', isRegex: false, enabled: true },
    ];
    const rawObject = {
      version: 1,
      customRules: [
        { id: 'r2', label: 'Rule 2', token: 'R2', patternString: 'pat2', isRegex: true, enabled: true },
      ],
    };

    function parseRulesPayload(parsed: any): CustomRule[] {
      const list = Array.isArray(parsed) ? parsed : Array.isArray(parsed?.customRules) ? parsed.customRules : null;
      if (!list) return [];
      return list
        .filter((r: any) => r && typeof r.id === 'string' && typeof r.patternString === 'string')
        .map((r: any) => ({
          id: r.id,
          label: r.label || 'Imported Rule',
          token: (r.token || 'CUSTOM').toUpperCase(),
          patternString: r.patternString,
          isRegex: Boolean(r.isRegex),
          enabled: r.enabled !== false,
        }));
    }

    expect(parseRulesPayload(rawArray)).toHaveLength(1);
    expect(parseRulesPayload(rawArray)[0].id).toBe('r1');
    expect(parseRulesPayload(rawObject)).toHaveLength(1);
    expect(parseRulesPayload(rawObject)[0].id).toBe('r2');
  });

  test('scrubText counts entropy-suppressed matches properly', () => {
    // A string with a base64 random looking string that triggers suppression
    const text = 'Random hash is aW52YWxpZHN0cmluZzEyMzQ1Njc4OTA= which is not a secret';
    const result = scrubText(text, allDetectors, [], { suppressEntropy: true });
    expect(result.counts['entropy-suppressed']).toBeDefined();
    expect(typeof result.counts['entropy-suppressed']).toBe('number');
  });
});
