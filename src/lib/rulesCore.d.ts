import type { AllowRule, CoreCustomRule, DetectorId } from './scrubCore.js';
export interface AiscrubConfig { version: 1; detectors?: { enable?: DetectorId[]; disable?: DetectorId[] }; customRules?: CoreCustomRule[]; allowlist?: AllowRule[]; extends?: string[]; }
export interface PackDefinition { name: string; version: number; description: string; customRules: CoreCustomRule[]; }
export const DETECTOR_IDS: DetectorId[];
export function validateConfig(raw: unknown): AiscrubConfig;
export function resolveMergedConfig(config: AiscrubConfig, packsMap?: Record<string, PackDefinition>): { enabledDetectorIds: Set<DetectorId>; customRules: CoreCustomRule[]; allowlist: AllowRule[]; extendedPacks: string[] };
