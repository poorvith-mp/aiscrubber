import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, test } from 'vitest';

const root = path.resolve(__dirname, '..');
const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));

describe('release integrity', () => {
  test('declares the approved v3 source version and packages shared runtime files', () => {
    expect(pkg.version).toBe('3.0.0');
    expect(pkg.files).toEqual(expect.arrayContaining([
      'src/lib/scrubCore.js',
      'src/lib/scrubCore.d.ts',
      'src/lib/sessionCore.js',
      'src/lib/sessionCore.d.ts',
      'src/lib/rulesCore.js',
      'src/lib/rulesCore.d.ts',
    ]));
  });

  test('CI verifies every declared Node compatibility target', () => {
    const ci = fs.readFileSync(path.join(root, '.github', 'workflows', 'ci.yml'), 'utf8');
    expect(ci).toContain('node-version: [18, 20, 22, 24]');
    expect(ci).toContain('node tests/package-smoke.mjs');
    expect(ci).toContain('name: coverage-node-${{ matrix.node-version }}');
  });

  test('migration notes describe the deliberate v3 contract changes', () => {
    const changelog = fs.readFileSync(path.join(root, 'CHANGELOG.md'), 'utf8');
    expect(changelog).toContain('## 3.0.0 - 2026-09-30');
    expect(changelog).toContain('includeSessionKey');
    expect(changelog).toContain('allowSensitiveOutput');
    expect(changelog).toContain('staged Git index');
  });
});
