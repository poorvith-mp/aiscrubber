import { describe, expect, test } from 'vitest';
import { canDismissSponsorship, nextSponsorshipEvent, type WorkflowSuccess } from '../src/lib/sponsorship';

describe('sponsorship timing and success events', () => {
  test('allows dismissal only after the required delay', () => {
    expect(canDismissSponsorship(100, 3_099)).toBe(false);
    expect(canDismissSponsorship(100, 3_100)).toBe(true);
  });

  test('deduplicates the same event id but accepts a later identical output', () => {
    const first: WorkflowSuccess = { eventId: 1, kind: 'text-copy' };
    expect(nextSponsorshipEvent(null, first)).toBe(first);
    expect(nextSponsorshipEvent(first, first)).toBeNull();
    expect(nextSponsorshipEvent(first, { eventId: 2, kind: 'text-copy' })?.eventId).toBe(2);
  });

  test('rejects preview, key export, failed, cancelled, and empty events', () => {
    expect(nextSponsorshipEvent(null, { eventId: 1, kind: 'preview' } as never)).toBeNull();
    expect(nextSponsorshipEvent(null, { eventId: 2, kind: 'key-export' } as never)).toBeNull();
    expect(nextSponsorshipEvent(null, null)).toBeNull();
  });
});
