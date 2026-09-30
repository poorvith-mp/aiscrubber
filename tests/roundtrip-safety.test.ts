import { describe, expect, test } from 'vitest';
import { scrubBuiltIns } from '../src/lib/scrubCore.js';
import { parseSessionKey, restoreSessionText } from '../src/lib/sessionCore.js';

const emails = new Set(['email'] as const);

describe('canonical round trips', () => {
  test('preserves case-distinct values and literal token spellings', () => {
    const source = 'Alpha@example.com alpha@example.com {{EMAIL_1}} [EMAIL_1]';
    const result = scrubBuiltIns(source, emails, { tokenStyle: 'brace' });
    const key = parseSessionKey({
      format: 'aiscrubber-session',
      version: 2,
      variables: result.mappings.map((mapping) => ({
        placeholder: mapping.token,
        original: mapping.original,
        detectorId: mapping.detectorId,
      })),
    });

    expect(result.mappings).toHaveLength(2);
    expect(result.mappings.map(({ token }) => token)).toEqual(['{{EMAIL_2}}', '{{EMAIL_3}}']);
    expect(result.totalRedactions).toBe(2);
    expect(restoreSessionText(result.text, key).text).toBe(source);
  });

  test('restores replacements once without expanding token-looking originals', () => {
    const key = parseSessionKey({
      format: 'aiscrubber-session',
      version: 2,
      variables: [
        { placeholder: '{{SECRET_1}}', original: 'value$&\\{{SECRET_2}}', detectorId: 'secret' },
        { placeholder: '{{SECRET_2}}', original: 'must-not-expand', detectorId: 'secret' },
      ],
    });
    expect(restoreSessionText('{{SECRET_1}} {{SECRET_2}}', key)).toEqual({
      text: 'value$&\\{{SECRET_2}} must-not-expand',
      restoredCount: 2,
      unresolvedPlaceholders: ['{{SECRET_2}}'],
    });
  });

  test('normalizes documented legacy session shapes and rejects ambiguity', () => {
    expect(parseSessionKey({ variables: { '{{EMAIL_1}}': 'a@example.com' } }).variables).toEqual([
      { placeholder: '{{EMAIL_1}}', original: 'a@example.com', detectorId: 'legacy' },
    ]);
    expect(parseSessionKey([{ placeholder: '{{EMAIL_1}}', original: 'a@example.com', category: 'email' }]).variables[0])
      .toEqual({ placeholder: '{{EMAIL_1}}', original: 'a@example.com', detectorId: 'email' });
    expect(parseSessionKey([{ placeholder: '{{KNOWN}}', original: 'value', category: 'custom' }]).variables[0])
      .toEqual({ placeholder: '{{KNOWN}}', original: 'value', detectorId: 'custom' });
    expect(() => parseSessionKey({
      format: 'aiscrubber-session', version: 2,
      variables: [
        { placeholder: '{{EMAIL_1}}', original: 'a@example.com', detectorId: 'email' },
        { placeholder: '{{EMAIL_1}}', original: 'b@example.com', detectorId: 'email' },
      ],
    })).toThrow(/conflicting/i);
    expect(() => parseSessionKey({ format: 'aiscrubber-session', version: 2, variables: [], extra: true })).toThrow(/unknown/i);
  });

  test('applies per-occurrence keep and manual-hide decisions', () => {
    const source = 'a@example.com and a@example.com plus private name';
    const secondStart = source.lastIndexOf('a@example.com');
    const manualStart = source.indexOf('private name');
    const result = scrubBuiltIns(source, emails, {
      decisions: [
        { start: secondStart, end: secondStart + 'a@example.com'.length, action: 'keep' },
        { start: manualStart, end: manualStart + 'private name'.length, action: 'hide' },
      ],
    });
    expect(result.text).toBe('[EMAIL_1] and a@example.com plus [MANUAL_1]');
    expect(result.acceptedMatches).toHaveLength(2);
  });

  test('redacts complete private-key blocks and ignores truncated blocks', () => {
    const complete = '-----BEGIN PRIVATE KEY-----\nsynthetic-body\n-----END PRIVATE KEY-----';
    const result = scrubBuiltIns(complete, new Set(['secret']));
    expect(result.text).toBe('[SECRET_1]');
    expect(result.mappings[0].original).toBe(complete);
    expect(scrubBuiltIns('-----BEGIN PRIVATE KEY-----\ntruncated', new Set(['secret'])).totalRedactions).toBe(0);
  });
});
