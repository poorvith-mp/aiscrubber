import { detectorDefinitions, scrubBuiltIns, type AllowRule, type ReviewDecision } from './scrubCore.js';
import { restoreSessionText } from './sessionCore.js';

export type DetectorId = import('./scrubCore.js').DetectorId;
export type { AllowRule };
export interface Detector { id: DetectorId; label: string; token: string; description: string; pattern: RegExp; }
export interface CustomRule { id: string; label: string; token: string; patternString: string; isRegex: boolean; enabled: boolean; }
export interface TokenMapping { token: string; original: string; detectorId: string; count: number; }
export interface DiffSegment { type: 'unchanged' | 'redacted'; text: string; originalValue?: string; token?: string; detector?: string; }
export interface ScrubResult { text: string; counts: Record<string, number>; mappings: TokenMapping[]; diffSegments: DiffSegment[]; acceptedMatches: Array<{ start: number; end: number; value: string; token: string; detectorId: string }>; totalRedactions: number; }
export interface ScrubOptions { allowlist?: AllowRule[]; suppressEntropy?: boolean; decisions?: ReviewDecision[]; tokenStyle?: 'bracket' | 'brace'; }

export const defaultDetectors: Detector[] = detectorDefinitions.map((detector) => ({
  id: detector.id,
  label: detector.label,
  token: detector.token,
  description: detector.description,
  pattern: detector.patterns[0],
}));

export function scrubText(
  source: string,
  enabledDetectorIds: Set<DetectorId>,
  customRules: CustomRule[] = [],
  options: ScrubOptions = {}
): ScrubResult {
  return scrubBuiltIns(source, enabledDetectorIds, { ...options, customRules });
}

export function restoreTextWithMapping(redactedText: string, mappings: { token: string; original: string }[]): string {
  if (!mappings.some((item) => item.token && item.original)) return redactedText;
  return restoreSessionText(redactedText, mappings
    .filter((item) => item.token && item.original)
    .map((item) => ({ placeholder: item.token, original: item.original, category: 'legacy' }))).text;
}
