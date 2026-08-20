export type DetectorId = 'email' | 'phone' | 'ip' | 'url' | 'card' | 'secret' | 'identifier' | 'ssn_dob' | 'national_id_in';
export interface CoreDetector { id: DetectorId; label: string; token: string; description: string; patterns: RegExp[]; }
export interface CoreMatch { start: number; end: number; value: string; token: string; detectorId: string; }
export interface CoreMapping { token: string; original: string; detectorId: string; count: number; }
export interface CoreScrubResult { text: string; counts: Record<string, number>; mappings: CoreMapping[]; diffSegments: Array<{ type: 'unchanged' | 'redacted'; text: string; originalValue?: string; token?: string; detector?: string }>; totalRedactions: number; }
export const detectorDefinitions: CoreDetector[];
export function isLuhnValid(value: string): boolean;
export function isVerhoeffValid(value: string): boolean;
export function isValidIpv6(value: string): boolean;
export function collectBuiltInMatches(source: string, enabledIds?: Set<DetectorId>): CoreMatch[];
export function tokenizeMatches(source: string, matches: CoreMatch[]): CoreScrubResult;
export function scrubBuiltIns(source: string, enabledIds?: Set<DetectorId>): CoreScrubResult;
