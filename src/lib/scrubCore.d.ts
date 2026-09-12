export type DetectorId = 'email' | 'phone' | 'ip' | 'url' | 'card' | 'secret' | 'identifier' | 'ssn_dob' | 'national_id_in' | 'entropy';
export interface CoreDetector { id: DetectorId; label: string; token: string; description: string; patterns: RegExp[]; }
export interface CoreMatch { start: number; end: number; value: string; token: string; detectorId: string; }
export interface CoreMapping { token: string; original: string; detectorId: string; count: number; }
export interface CoreScrubResult { text: string; counts: Record<string, number>; mappings: CoreMapping[]; diffSegments: Array<{ type: 'unchanged' | 'redacted'; text: string; originalValue?: string; token?: string; detector?: string }>; totalRedactions: number; }
export interface AllowRule { value: string; isRegex: boolean; }
export interface CoreCustomRule { id: string; label?: string; token?: string; patternString: string; isRegex: boolean; enabled: boolean; }
export interface CoreScrubOptions { allowlist?: AllowRule[]; suppressEntropy?: boolean; entropySuppressed?: number; customRules?: CoreCustomRule[]; }
export const detectorDefinitions: CoreDetector[];
export const SECRET_PREFIXES: string[];
export function calculateShannonEntropy(str: string): number;
export function applyEntropyFilters(candidate: string, context?: { before: string; after: string }, allowlist?: AllowRule[]): boolean;
export function isLuhnValid(value: string): boolean;
export function isVerhoeffValid(value: string): boolean;
export function isValidIpv6(value: string): boolean;
export function collectBuiltInMatches(source: string, enabledIds?: Set<DetectorId>, options?: CoreScrubOptions): CoreMatch[] & { entropySuppressed?: number };
export function collectCustomMatches(source: string, customRules?: CoreCustomRule[]): CoreMatch[];
export function tokenizeMatches(source: string, matches: CoreMatch[], options?: CoreScrubOptions): CoreScrubResult;
export function scrubBuiltIns(source: string, enabledIds?: Set<DetectorId>, options?: CoreScrubOptions): CoreScrubResult;
