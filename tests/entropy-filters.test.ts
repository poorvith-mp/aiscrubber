import fs from 'fs';
import path from 'path';
import { describe, expect, test } from 'vitest';
import { defaultDetectors, scrubText } from '../src/lib/scrub';
import { applyEntropyFilters, isLuhnValid } from '../src/lib/scrubCore.js';

const all = new Set(defaultDetectors.map((detector) => detector.id));

describe('applyEntropyFilters', () => {
  test('E1: drops hex SHAs unless preceded by secret context or prefixed', () => {
    // 7-char short commit sha
    expect(applyEntropyFilters('63c4c4d', { before: 'commit ', after: '' })).toBe(false);
    // 40-char full sha
    expect(applyEntropyFilters('4b825dc642cb6eb9a060e54bf8d69288fbee4904', { before: '', after: '' })).toBe(false);
    // 64-char hex after Bearer
    expect(applyEntropyFilters('0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef', { before: 'Authorization: Bearer ', after: '' })).toBe(true);
    // 32-char hex after token=
    expect(applyEntropyFilters('8f7e6d5c4b3a20198f7e6d5c4b3a2019', { before: 'token="', after: '"' })).toBe(true);
  });

  test('E2: drops RFC 4122 UUIDs', () => {
    expect(applyEntropyFilters('123e4567-e89b-12d3-a456-426614174000', { before: '', after: '' })).toBe(false);
    expect(applyEntropyFilters('c260bf75-a313-1c3a-4803-2551224a48f6', { before: '', after: '' })).toBe(false);
  });

  test('E3: drops long base64 media blocks', () => {
    const longBase64 = 'A'.repeat(600);
    expect(applyEntropyFilters(longBase64, { before: 'data:image/png;base64,', after: '' })).toBe(false);
    expect(applyEntropyFilters(longBase64, { before: 'logo;base64,', after: '' })).toBe(false);
  });

  test('E4: drops dictionary-like prose words', () => {
    expect(applyEntropyFilters('internationalization', { before: '', after: '' })).toBe(false);
    expect(applyEntropyFilters('supercalifragilistic', { before: '', after: '' })).toBe(false);
  });

  test('E5: honors user allowlist for exact and regex matches', () => {
    const allowlist = [
      { value: 'safe_api_endpoint_token', isRegex: false },
      { value: '^dev_[a-z0-9]+$', isRegex: true },
    ];
    expect(applyEntropyFilters('safe_api_endpoint_token', { before: '', after: '' }, allowlist)).toBe(false);
    expect(applyEntropyFilters('dev_123456', { before: '', after: '' }, allowlist)).toBe(false);
    expect(applyEntropyFilters('prod_123456', { before: '', after: '' }, allowlist)).toBe(true);
  });

  test('E6: drops single repeated character padding', () => {
    expect(applyEntropyFilters('00000000000000000000000000000000', { before: '', after: '' })).toBe(false);
    expect(applyEntropyFilters('aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa', { before: '', after: '' })).toBe(false);
  });

  test('Preserves vendor-prefixed tokens even if hex or matching filter patterns', () => {
    expect(applyEntropyFilters('ghp_0123456789abcdef0123456789abcdef', { before: '', after: '' })).toBe(true);
    expect(applyEntropyFilters('sk-proj-0123456789abcdef0123456789abcdef', { before: '', after: '' })).toBe(true);
    expect(applyEntropyFilters('AKIA0123456789ABCDEF', { before: '', after: '' })).toBe(true);
  });
});

describe('Entropy corpus benchmark', () => {
  const corpusPath = path.join(__dirname, 'fixtures', 'entropy-corpus.txt');
  const lines = fs.readFileSync(corpusPath, 'utf8').split(/\r?\n/).filter(Boolean);
  const trueSecrets = lines.slice(0, 40);
  const falsePositives = lines.slice(40, 100);

  test('redacts 40/40 true secrets and <= 2/60 false positives', () => {
    let trueSecretsRedacted = 0;
    for (const secret of trueSecrets) {
      const result = scrubText(secret, all);
      if (result.totalRedactions > 0) trueSecretsRedacted++;
    }
    expect(trueSecretsRedacted).toBe(40);

    let falsePositivesRedacted = 0;
    for (const fp of falsePositives) {
      const result = scrubText(fp, all);
      if (result.totalRedactions > 0) falsePositivesRedacted++;
    }
    expect(falsePositivesRedacted).toBeLessThanOrEqual(2);
  });

  test('counts dropped candidates in ScrubResult.counts["entropy-suppressed"]', () => {
    const combined = falsePositives.join('\n');
    const result = scrubText(combined, all);
    expect(result.counts['entropy-suppressed']).toBeGreaterThanOrEqual(50);
  });

  test('suppression never touches non-entropy detectors (cards, phones, etc.)', () => {
    const cardInput = 'Payment card: 4111 1111 1111 1111';
    const result = scrubText(cardInput, all);
    expect(result.counts.card).toBe(1);
    expect(result.text).toContain('[CARD_1]');
  });

  test('--no-suppress restores unsuppressed behavior', () => {
    const combined = falsePositives.slice(0, 10).join('\n');
    const suppressed = scrubText(combined, all, [], { suppressEntropy: true });
    const unsuppressed = scrubText(combined, all, [], { suppressEntropy: false });
    expect(suppressed.totalRedactions).toBeLessThanOrEqual(unsuppressed.totalRedactions);
  });
});
