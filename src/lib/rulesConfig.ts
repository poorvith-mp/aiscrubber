import indiaIdsPack from '../../packs/india-ids.json';
import devopsPack from '../../packs/devops.json';
import healthcarePack from '../../packs/healthcare.json';
import { resolveMergedConfig as resolveCore, validateConfig as validateCore } from './rulesCore.js';
import type { AiscrubConfig, PackDefinition } from './rulesCore.js';

export type { AiscrubConfig, PackDefinition };

export const BUILTIN_PACKS: Record<string, PackDefinition> = {
  'india-ids': indiaIdsPack as PackDefinition,
  'devops': devopsPack as PackDefinition,
  'healthcare': healthcarePack as PackDefinition,
};

export function validateConfig(rawJson: unknown): AiscrubConfig {
  return validateCore(rawJson);
}

export function resolveMergedConfig(
  config: AiscrubConfig,
  packsMap: Record<string, PackDefinition> = BUILTIN_PACKS
) {
  return resolveCore(config, packsMap);
}

export function parseRulesPayload(raw: unknown): AiscrubConfig {
  if (Array.isArray(raw)) return validateConfig({ version: 1, customRules: raw });
  return validateConfig(raw);
}
