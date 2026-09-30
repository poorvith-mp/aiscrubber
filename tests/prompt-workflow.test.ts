import { describe, expect, test } from 'vitest';
import { maskPromptForRoundTrip, reconstructAiResponse } from '../src/lib/promptEnhancer';

describe('guided prompt round trip', () => {
  test('masks with a canonical v2 key and defaults to masked text only', () => {
    const result = maskPromptForRoundTrip('Email a@example.com');
    expect(result.maskedText).toBe('Email {{EMAIL_1}}');
    expect(result.sessionKey).toEqual({
      format: 'aiscrubber-session', version: 2,
      variables: [{ placeholder: '{{EMAIL_1}}', original: 'a@example.com', detectorId: 'email' }],
    });
  });

  test('restores legacy imports and reports altered or missing placeholders', () => {
    const legacy = { variables: { '{{EMAIL_1}}': 'a@example.com' } };
    expect(reconstructAiResponse('Use {{EMAIL_1}} and {{EMAIL_2}}', legacy as never)).toEqual({
      reconstructedText: 'Use a@example.com and {{EMAIL_2}}',
      restoredCount: 1,
      unresolvedPlaceholders: ['{{EMAIL_2}}'],
    });
    expect(reconstructAiResponse('No tokens remain', legacy as never).restoredCount).toBe(0);
  });

  test('marks a result stale when the source changed', () => {
    const result = maskPromptForRoundTrip('Email a@example.com');
    expect(result.isCurrent('Email a@example.com')).toBe(true);
    expect(result.isCurrent('Changed')).toBe(false);
  });
});
