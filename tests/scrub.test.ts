import { describe, expect, test } from 'vitest';
import { defaultDetectors, restoreTextWithMapping, scrubText } from '../src/lib/scrub';
import { isLuhnValid, isValidIpv6, isVerhoeffValid, scrubBuiltIns } from '../src/lib/scrubCore.js';

const all = new Set(defaultDetectors.map((detector) => detector.id));

describe('scrubText', () => {
  test('redacts representative secrets without crossing line boundaries', () => {
    const synthetic = {
      openai: ['sk', '-proj-', 'abcdefghijklmnopqrstuvwxyz123456'].join(''),
      github: ['github', '_pat_', '11AA22BB33CC44DD55EE66FF77GG88HH99II00JJ'].join(''),
      stripe: ['sk', '_live_', '51Nabcdefghijklmnopqrstuv'].join(''),
      google: ['AI', 'za', 'SyA123456789012345678901234567890'].join(''),
      gitlab: ['gl', 'pat-', 'abcdefghijklmnopqrst'].join(''),
      sendgrid: ['S', 'G.', 'abcdefghijklmnopqrstuv', '.', 'abcdefghijklmnopqrstuvwxyz1234567890'].join(''),
      npm: ['npm', '_', 'abcdefghijklmnopqrstuvwxyz1234567890'].join(''),
      slack: ['xox', 'b-', '123456789012-123456789012-abcdefghijklmnopqrstuvwx'].join(''),
      awsId: ['AK', 'IA', 'IOSFODNN7EXAMPLE'].join(''),
      jwt: ['ey', 'JhbGciOiJIUzI1NiJ9.', 'eyJzdWIiOiIxMjM0NTY3ODkwIn0.', 'abcdefghijklmnopqrstuv'].join(''),
      privateKey: ['-----BEGIN ', 'PRIVATE KEY-----'].join(''),
    };
    const source = [
      `OpenAI ${synthetic.openai}`,
      `GitHub ${synthetic.github}`,
      `Stripe ${synthetic.stripe}`,
      `Google ${synthetic.google}`,
      `GitLab ${synthetic.gitlab}`,
      `SendGrid ${synthetic.sendgrid}`,
      `npm ${synthetic.npm}`,
      `Slack ${synthetic.slack}`,
      `AWS ${synthetic.awsId} secret: ${'A'.repeat(40)}`,
      `JWT ${synthetic.jwt}`,
      synthetic.privateKey,
    ].join('\n');
    const result = scrubText(source, all);
    expect(result.counts.secret).toBe(11);
    expect(result.text).not.toContain(synthetic.openai);
    expect(result.text).toContain('[SECRET_11]');

    const split = scrubText(['sk', '-proj-abc\ndefghijklmnopqrstuvwxyz123456'].join(''), all);
    expect(split.totalRedactions).toBe(0);
  });

  test('validates cards, IPv6, Indian phone numbers, Aadhaar and PAN', () => {
    const source = 'Card 4111 1111 1111 1111, IPv6 2001:db8::8a2e:370:7334, phone +91 98765 43210, Aadhaar 2345 6789 0124, PAN ABCDE1234F.';
    const result = scrubText(source, all);
    expect(result.counts.card).toBe(1);
    expect(result.counts.ip).toBe(1);
    expect(result.counts.phone).toBe(1);
    expect(result.counts.national_id_in).toBe(2);

    const invalid = scrubText('Invalid card 4111 1111 1111 1112, IPv6 2001:::1, Aadhaar 2345 6789 0125.', all);
    expect(invalid.totalRedactions).toBe(0);
  });

  test('deduplicates repeated values and restores the exact source', () => {
    const source = 'a@example.com then a@example.com';
    const result = scrubText(source, all);
    expect(result.text).toBe('[EMAIL_1] then [EMAIL_1]');
    expect(result.mappings[0].count).toBe(2);
    expect(restoreTextWithMapping(result.text, result.mappings)).toBe(source);
  });

  test('keeps disabled detectors and malformed custom expressions unchanged', () => {
    const result = scrubText('a@example.com ticket ALPHA-42', new Set(), [
      { id: 'bad', label: 'Bad', token: 'BAD', patternString: '[', isRegex: true, enabled: true },
      { id: 'ticket', label: 'Ticket', token: 'TICKET', patternString: 'ALPHA-42', isRegex: false, enabled: true },
    ]);
    expect(result.text).toBe('a@example.com ticket [TICKET_1]');
    expect(result.totalRedactions).toBe(1);
  });

  test('rejects malformed checksums and network candidates at their boundaries', () => {
    expect(isLuhnValid('0000000000000')).toBe(false);
    expect(isLuhnValid('123')).toBe(false);
    expect(isVerhoeffValid('034567890124')).toBe(false);
    expect(isValidIpv6('1:2:3:4:5:6:7:8')).toBe(true);
    expect(isValidIpv6('1:2:3:4:5:6:7')).toBe(false);
    expect(isValidIpv6('1::2::3')).toBe(false);
    expect(scrubBuiltIns('')).toEqual({ text: '', counts: {}, mappings: [], diffSegments: [], totalRedactions: 0 });
  });

  test('supports regex custom rules and ignores empty definitions', () => {
    const result = scrubText('Ticket AB-12.', new Set(), [
      { id: 'regex', label: 'Ticket', token: 'TICKET', patternString: 'AB-\\d+', isRegex: true, enabled: true },
      { id: 'empty', label: 'Empty', token: 'EMPTY', patternString: ' ', isRegex: false, enabled: true },
      { id: 'off', label: 'Off', token: 'OFF', patternString: 'Ticket', isRegex: false, enabled: false },
    ]);
    expect(result.text).toBe('Ticket [TICKET_1].');
    expect(restoreTextWithMapping('unchanged', [{ token: '', original: '' }])).toBe('unchanged');
  });
});
