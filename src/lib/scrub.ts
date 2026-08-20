import { collectBuiltInMatches, detectorDefinitions, tokenizeMatches, type CoreMatch } from './scrubCore.js';

export type DetectorId = import('./scrubCore.js').DetectorId;
export interface Detector { id: DetectorId; label: string; token: string; description: string; pattern: RegExp; }
export interface CustomRule { id: string; label: string; token: string; patternString: string; isRegex: boolean; enabled: boolean; }
export interface TokenMapping { token: string; original: string; detectorId: string; count: number; }
export interface DiffSegment { type: 'unchanged' | 'redacted'; text: string; originalValue?: string; token?: string; detector?: string; }
export interface ScrubResult { text: string; counts: Record<string, number>; mappings: TokenMapping[]; diffSegments: DiffSegment[]; totalRedactions: number; }

export const defaultDetectors: Detector[] = detectorDefinitions.map((detector) => ({
  id: detector.id,
  label: detector.label,
  token: detector.token,
  description: detector.description,
  pattern: detector.patterns[0],
}));

export function scrubText(source: string, enabledDetectorIds: Set<DetectorId>, customRules: CustomRule[] = []): ScrubResult {
  if (!source) return { text: '', counts: {}, mappings: [], diffSegments: [], totalRedactions: 0 };
  const matches: CoreMatch[] = collectBuiltInMatches(source, enabledDetectorIds);
  for (const rule of customRules) {
    if (!rule.enabled || !rule.patternString.trim()) continue;
    try {
      if (rule.isRegex) {
        const regex = new RegExp(rule.patternString, 'gi');
        for (const match of source.matchAll(regex)) {
          if (match.index === undefined || !match[0]) continue;
          matches.push({ start: match.index, end: match.index + match[0].length, value: match[0], token: rule.token || 'CUSTOM', detectorId: `custom_${rule.id}` });
        }
      } else {
        const lowerSource = source.toLowerCase();
        const target = rule.patternString.toLowerCase();
        let position = 0;
        while ((position = lowerSource.indexOf(target, position)) !== -1) {
          matches.push({ start: position, end: position + target.length, value: source.slice(position, position + target.length), token: rule.token || 'CUSTOM', detectorId: `custom_${rule.id}` });
          position += target.length;
        }
      }
    } catch {
      // Invalid custom expressions are ignored while the user is editing them.
    }
  }
  return tokenizeMatches(source, matches);
}

export function restoreTextWithMapping(redactedText: string, mappings: { token: string; original: string }[]): string {
  return mappings.reduce((text, item) => item.token && item.original ? text.split(item.token).join(item.original) : text, redactedText);
}
