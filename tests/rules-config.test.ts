import fs from 'fs';
import path from 'path';
import os from 'os';
import { describe, expect, test } from 'vitest';
import { loadConfig, findConfigFile, validateAndResolveConfig } from '../bin/lib/rulesLoader.js';
import { resolveMergedConfig, validateConfig } from '../src/lib/rulesCore.js';
import { CLEANING_PROFILES } from '../src/lib/cleaningProfiles';

describe('Rules config resolution order and validation', () => {
  test('disable wins over an explicit enabled set and empty enable means none', () => {
    const config = validateConfig({ version: 1, detectors: { enable: ['email', 'ip'], disable: ['email'] } });
    expect([...resolveMergedConfig(config, {}).enabledDetectorIds]).toEqual(['ip']);
    expect([...resolveMergedConfig(validateConfig({ version: 1, detectors: { enable: [] } }), {}).enabledDetectorIds]).toEqual([]);
  });

  test('validates nested fields, limits, duplicates, and sanitized regex errors', () => {
    expect(() => validateConfig({ version: 1, detectors: { enable: ['unknown'] } })).toThrow(/detectors\.enable\[0\]/);
    expect(() => validateConfig({ version: 1, detectors: { enable: ['email'], extra: true } })).toThrow(/unknown field/i);
    expect(() => validateConfig({ version: 1, customRules: [
      { id: 'same', patternString: 'a', isRegex: false, enabled: true },
      { id: 'same', patternString: 'b', isRegex: false, enabled: true },
    ] })).toThrow(/duplicate/i);
    expect(() => validateConfig({ version: 1, customRules: [
      { id: 'private', patternString: '[secret-value', isRegex: true, enabled: true },
    ] })).toThrow('customRules[0] has invalid regex');
  });

  test('later packs and explicit rules win while allowlists deduplicate', () => {
    const packs = {
      first: { name: 'first', version: 1, description: '', customRules: [{ id: 'x', patternString: 'first', isRegex: false, enabled: true }] },
      second: { name: 'second', version: 1, description: '', customRules: [{ id: 'x', patternString: 'second', isRegex: false, enabled: true }] },
    };
    const resolved = resolveMergedConfig(validateConfig({
      version: 1,
      extends: ['first', 'second'],
      customRules: [{ id: 'x', patternString: 'explicit', isRegex: false, enabled: true }],
      allowlist: [{ value: 'safe', isRegex: false }, { value: 'safe', isRegex: false }],
    }), packs);
    expect(resolved.customRules[0].patternString).toBe('explicit');
    expect(resolved.allowlist).toEqual([{ value: 'safe', isRegex: false }]);
  });

  test('defines the approved everyday, developer, and custom profiles', () => {
    expect(CLEANING_PROFILES.everyday.enabledDetectorIds).toEqual(['email', 'phone', 'ip', 'url', 'card', 'secret', 'entropy']);
    expect(CLEANING_PROFILES.developer.extends).toEqual(['devops']);
    expect(CLEANING_PROFILES.custom.enabledDetectorIds).toEqual([]);
  });
  test('rejects unknown top-level key without echoing private values', () => {
    expect(() => {
      validateAndResolveConfig({ version: 1, unknownField: true });
    }).toThrow('Config root contains unknown field "unknownField"');
  });

  test('rejects invalid version number', () => {
    expect(() => {
      validateAndResolveConfig({ version: 2 });
    }).toThrow('Unsupported version 2 in .aiscrubrc.json; expected 1');
  });

  test('rejects invalid regex by item index without echoing the private rule', () => {
    expect(() => {
      validateAndResolveConfig({
        version: 1,
        customRules: [{ id: 'broken-rule', label: 'Broken', patternString: '[a-z', isRegex: true, enabled: true }],
      });
    }).toThrow('customRules[0] has invalid regex');
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
