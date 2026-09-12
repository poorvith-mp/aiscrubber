import fs from 'fs';
import path from 'path';
import os from 'os';
import { describe, expect, test } from 'vitest';
import { loadConfig, findConfigFile, validateAndResolveConfig } from '../bin/lib/rulesLoader.js';

describe('Rules config resolution order and validation', () => {
  test('rejects unknown top-level key with specific message', () => {
    expect(() => {
      validateAndResolveConfig({ version: 1, unknownField: true });
    }).toThrow('Unknown key "unknownField" in .aiscrubrc.json');
  });

  test('rejects invalid version number', () => {
    expect(() => {
      validateAndResolveConfig({ version: 2 });
    }).toThrow('Unsupported version 2 in .aiscrubrc.json; expected 1');
  });

  test('rejects invalid regex in custom rule and names the rule id', () => {
    expect(() => {
      validateAndResolveConfig({
        version: 1,
        customRules: [{ id: 'broken-rule', label: 'Broken', patternString: '[a-z', isRegex: true, enabled: true }],
      });
    }).toThrow('Invalid regex in rule "broken-rule"');
  });

  test('extends india-ids and allows file rules to override pack rules by id', () => {
    const resolved = validateAndResolveConfig({
      version: 1,
      extends: ['india-ids'],
      customRules: [
        { id: 'pan', label: 'Custom PAN', token: 'CUSTOM_PAN', patternString: '^[A-Z]{5}\\d{4}[A-Z]$', isRegex: true, enabled: true },
        { id: 'my-rule', label: 'My Rule', token: 'MINE', patternString: 'FOO-\\d+', isRegex: true, enabled: true },
      ],
    });

    const panRule = resolved.customRules.find((r) => r.id === 'pan');
    expect(panRule).toBeDefined();
    expect(panRule.token).toBe('CUSTOM_PAN'); // Overridden!

    const ifscRule = resolved.customRules.find((r) => r.id === 'ifsc');
    expect(ifscRule).toBeDefined(); // From pack!

    const myRule = resolved.customRules.find((r) => r.id === 'my-rule');
    expect(myRule).toBeDefined();
  });

  test('hierarchical resolution: --config > AISCRUBRC > .aiscrubrc.json > ancestor up to git root', () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'aiscrub-test-'));
    try {
      const gitDir = path.join(tempDir, '.git');
      fs.mkdirSync(gitDir);

      const subDir = path.join(tempDir, 'nested', 'deep');
      fs.mkdirSync(subDir, { recursive: true });

      // Root config
      const rootConfig = path.join(tempDir, '.aiscrubrc.json');
      fs.writeFileSync(rootConfig, JSON.stringify({ version: 1, allowlist: [{ value: 'root', isRegex: false }] }));

      // Nested config
      const nestedConfig = path.join(subDir, '.aiscrubrc.json');
      fs.writeFileSync(nestedConfig, JSON.stringify({ version: 1, allowlist: [{ value: 'nested', isRegex: false }] }));

      // 1. In subDir, nested wins
      expect(findConfigFile(subDir)).toBe(nestedConfig);

      // 2. In parent of subDir without config, root wins
      const midDir = path.join(tempDir, 'nested');
      expect(findConfigFile(midDir)).toBe(rootConfig);

      // 3. AISCRUBRC overrides local config
      const customEnvConfig = path.join(tempDir, 'custom-env.json');
      fs.writeFileSync(customEnvConfig, JSON.stringify({ version: 1, allowlist: [{ value: 'env', isRegex: false }] }));
      process.env.AISCRUBRC = customEnvConfig;
      expect(findConfigFile(subDir)).toBe(customEnvConfig);
      delete process.env.AISCRUBRC;

      // 4. Explicit path overrides all
      const explicitConfig = path.join(tempDir, 'explicit.json');
      fs.writeFileSync(explicitConfig, JSON.stringify({ version: 1, allowlist: [{ value: 'explicit', isRegex: false }] }));
      expect(findConfigFile(subDir, explicitConfig)).toBe(explicitConfig);
    } finally {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });
});
