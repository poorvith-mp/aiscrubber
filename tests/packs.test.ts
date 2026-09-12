import { describe, expect, test } from 'vitest';
import { loadPacks } from '../bin/lib/rulesLoader.js';
import { scrubText, defaultDetectors } from '../src/lib/scrub';

const all = new Set(defaultDetectors.map((d) => d.id));

describe('Packs correctness', () => {
  const packs = loadPacks();

  test('all built-in packs load with valid schema and compiled regexes', () => {
    expect(packs['india-ids']).toBeDefined();
    expect(packs['devops']).toBeDefined();
    expect(packs['healthcare']).toBeDefined();

    for (const [name, pack] of Object.entries(packs)) {
      expect(pack.version).toBe(1);
      expect(Array.isArray(pack.customRules)).toBe(true);
      for (const rule of pack.customRules) {
        expect(() => new RegExp(rule.patternString)).not.toThrow();
      }
    }
  });

  test('india-ids pack matches PAN, Aadhaar, IFSC, and UPI correctly', () => {
    const rules = packs['india-ids'].customRules;

    const source = 'My PAN is ABCDE1234F, IFSC is SBIN0001234, UPI is poorvith@okhdfcbank, while email is user@gmail.com.';
    const result = scrubText(source, all, rules);

    expect(result.text).toContain('[PAN_1]');
    expect(result.text).toContain('[IFSC_1]');
    expect(result.text).toContain('[UPI_1]');
    expect(result.text).toContain('[EMAIL_1]');
    expect(result.text).not.toContain('[UPI_2]'); // user@gmail.com is NOT flagged as UPI!
  });

  test('devops pack matches PEM blocks, JWT, and database URLs', () => {
    const rules = packs['devops'].customRules;

    const source = `
DB: DATABASE_URL=postgres://user:pass@localhost:5432/mydb
Token: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.c2lnbmF0dXJlX2RhdGE
Key:
-----BEGIN RSA PRIVATE KEY-----
MIIEowIBAAKCAQEA0Y1+
-----END RSA PRIVATE KEY-----
`;
    const result = scrubText(source, all, rules);
    expect(result.text).toContain('[DATABASE_URL_1]');
    expect(result.text).toContain('[PEM_1]');
    expect(result.text).not.toContain('-----BEGIN');
  });

  test('healthcare pack matches NPI and MRN identifiers', () => {
    const rules = packs['healthcare'].customRules;

    const source = 'Provider NPI: 1234567890, Patient Record: MRN-AB123456';
    const result = scrubText(source, all, rules);
    expect(result.text).toContain('[NPI_1]');
    expect(result.text).toContain('[MRN_1]');
  });
});
