import { describe, expect, test } from 'vitest';
import { defaultDetectors, scrubText } from '../src/lib/scrub';
import { createReviewState, updateReviewContext } from '../src/lib/review';

const all = new Set(defaultDetectors.map((detector) => detector.id));

describe('occurrence review decisions', () => {
  test('keeps only the selected repeated occurrence', () => {
    const source = 'a@example.com then a@example.com';
    const second = source.lastIndexOf('a@example.com');
    const result = scrubText(source, all, [], { decisions: [{ start: second, end: second + 13, action: 'keep' }] });
    expect(result.text).toBe('[EMAIL_1] then a@example.com');
  });

  test('manual hide merges overlapping spans and hides unrecognized text', () => {
    const source = 'ordinary words';
    const result = scrubText(source, new Set(), [], { decisions: [
      { start: 0, end: 8, action: 'hide' },
      { start: 5, end: 14, action: 'hide' },
    ] });
    expect(result.text).toBe('[MANUAL_1]');
  });

  test('rejects invalid and surrogate-splitting spans', () => {
    expect(() => scrubText('abc', all, [], { decisions: [{ start: 2, end: 1, action: 'hide' }] })).toThrow('Invalid review decision');
    expect(() => scrubText('a🙂b', all, [], { decisions: [{ start: 1, end: 2, action: 'hide' }] })).toThrow('surrogate pair');
  });

  test('clears decisions and stale output when source or policy revision changes', () => {
    const initial = createReviewState('source-a', 1, [{ start: 0, end: 1, action: 'hide' }], 'output');
    expect(updateReviewContext(initial, 'source-a', 1)).toBe(initial);
    expect(updateReviewContext(initial, 'source-b', 1)).toMatchObject({ decisions: [], output: '' });
    expect(updateReviewContext(initial, 'source-a', 2)).toMatchObject({ decisions: [], output: '' });
  });
});
