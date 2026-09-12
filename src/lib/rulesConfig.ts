import type { CustomRule } from './scrub';
import type { AllowRule, DetectorId } from './scrubCore';

import indiaIdsPack from '../../packs/india-ids.json';
import devopsPack from '../../packs/devops.json';
import healthcarePack from '../../packs/healthcare.json';

export interface AiscrubConfig {
  version: 1;
  detectors?: {
    enable?: DetectorId[];
    disable?: DetectorId[];
  };
  customRules?: CustomRule[];
  allowlist?: AllowRule[];
  extends?: string[];
}

export interface PackDefinition {
  name: string;
  version: number;
  description: string;
  customRules: CustomRule[];
}

export const BUILTIN_PACKS: Record<string, PackDefinition> = {
  'india-ids': indiaIdsPack as PackDefinition,
  'devops': devopsPack as PackDefinition,
  'healthcare': healthcarePack as PackDefinition,
};

const ALLOWED_TOP_KEYS = new Set(['version', 'detectors', 'customRules', 'allowlist', 'extends']);

export function validateConfig(rawJson: unknown): AiscrubConfig {
  if (!rawJson || typeof rawJson !== 'object' || Array.isArray(rawJson)) {
    throw new Error('Invalid .aiscrubrc.json: root must be an object');
  }

  const obj = rawJson as Record<string, unknown>;

  // Check unknown top-level keys
  for (const key of Object.keys(obj)) {
    if (!ALLOWED_TOP_KEYS.has(key)) {
      throw new Error(`Unknown key "${key}" in .aiscrubrc.json`);
    }
  }

  if (obj.version !== 1) {
    throw new Error(`Unsupported version ${obj.version} in .aiscrubrc.json; expected 1`);
  }

  // Validate customRules
  if (obj.customRules !== undefined) {
    if (!Array.isArray(obj.customRules)) {
      throw new Error('Invalid customRules: must be an array');
    }
    for (const rule of obj.customRules) {
      if (!rule || typeof rule !== 'object') {
        throw new Error('Invalid rule in customRules');
      }
      if (!rule.id || typeof rule.id !== 'string') {
        throw new Error('Rule missing required "id" string');
      }
      if (!rule.patternString || typeof rule.patternString !== 'string') {
        throw new Error(`Rule "${rule.id}" missing patternString`);
      }
      if (rule.isRegex) {
        try {
          new RegExp(rule.patternString);
        } catch (err: any) {
          throw new Error(`Invalid regex in rule "${rule.id}": ${err?.message || err}`);
        }
      }
    }
  }

  // Validate allowlist
  if (obj.allowlist !== undefined) {
    if (!Array.isArray(obj.allowlist)) {
      throw new Error('Invalid allowlist: must be an array');
    }
    for (const item of obj.allowlist) {
      if (!item || typeof item !== 'object' || typeof item.value !== 'string') {
        throw new Error('Allowlist entries must have a "value" string');
      }
      if (item.isRegex) {
        try {
          new RegExp(item.value);
        } catch (err: any) {
          throw new Error(`Invalid regex in allowlist rule "${item.value}": ${err?.message || err}`);
        }
      }
    }
  }

  // Validate extends
  if (obj.extends !== undefined) {
    if (!Array.isArray(obj.extends)) {
      throw new Error('Invalid extends: must be an array of pack names');
    }
  }

  return rawJson as AiscrubConfig;
}

export function resolveMergedConfig(
  config: AiscrubConfig,
  packsMap: Record<string, PackDefinition> = BUILTIN_PACKS
): {
  enabledDetectorIds?: Set<DetectorId>;
  customRules: CustomRule[];
  allowlist: AllowRule[];
  extendedPacks: string[];
} {
  const mergedRulesMap = new Map<string, CustomRule>();
  const extendedPacks: string[] = [];

  // 1. Load extended packs first
  if (Array.isArray(config.extends)) {
    for (const packName of config.extends) {
      const pack = packsMap[packName];
      if (!pack) {
        throw new Error(`Unknown pack "${packName}" specified in extends`);
      }
      extendedPacks.push(packName);
      for (const rule of pack.customRules) {
        mergedRulesMap.set(rule.id, { ...rule });
      }
    }
  }

  // 2. Overlay file rules (file rules win on id collision)
  if (Array.isArray(config.customRules)) {
    for (const rule of config.customRules) {
      mergedRulesMap.set(rule.id, { ...rule });
    }
  }

  const allowlist: AllowRule[] = Array.isArray(config.allowlist) ? [...config.allowlist] : [];

  return {
    customRules: Array.from(mergedRulesMap.values()),
    allowlist,
    extendedPacks,
  };
}
