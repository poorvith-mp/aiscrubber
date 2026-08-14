export type DetectorId =
  | 'email'
  | 'phone'
  | 'ip'
  | 'url'
  | 'card'
  | 'secret'
  | 'identifier'
  | 'ssn_dob';

export interface Detector {
  id: DetectorId;
  label: string;
  token: string;
  description: string;
  pattern: RegExp;
}

export interface CustomRule {
  id: string;
  label: string;
  token: string;
  patternString: string;
  isRegex: boolean;
  enabled: boolean;
}

export interface TokenMapping {
  token: string;
  original: string;
  detectorId: string;
  count: number;
}

export interface DiffSegment {
  type: 'unchanged' | 'redacted';
  text: string;
  originalValue?: string;
  token?: string;
  detector?: string;
}

export interface ScrubResult {
  text: string;
  counts: Record<string, number>;
  mappings: TokenMapping[];
  diffSegments: DiffSegment[];
  totalRedactions: number;
}

export const defaultDetectors: Detector[] = [
  {
    id: 'email',
    label: 'Email addresses',
    token: 'EMAIL',
    description: 'Personal & work email addresses',
    pattern: /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi,
  },
  {
    id: 'phone',
    label: 'Phone numbers',
    token: 'PHONE',
    description: 'International & regional telephone numbers',
    pattern: /(?<!\w)(?:\+?\d{1,3}[ .-]?)?(?:\(?\d{2,4}\)?[ .-]?)?\d{3,4}[ .-]\d{4}(?!\w)/g,
  },
  {
    id: 'ip',
    label: 'IP addresses',
    token: 'IP',
    description: 'IPv4 & IPv6 network addresses',
    pattern: /\b(?:(?:25[0-5]|2[0-4]\d|1?\d?\d)\.){3}(?:25[0-5]|2[0-4]\d|1?\d?\d)\b|(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}\b/g,
  },
  {
    id: 'url',
    label: 'Private URLs',
    token: 'URL',
    description: 'Web links, webhooks, and private API endpoints',
    pattern: /\bhttps?:\/\/[^\s<>()"']+/gi,
  },
  {
    id: 'card',
    label: 'Card numbers',
    token: 'CARD',
    description: 'Credit/Debit card number patterns',
    pattern: /(?<!\d)(?:4\d{3}|5[1-5]\d{2}|6011|3[47]\d{2})[ -]?\d{4}[ -]?\d{4}[ -]?\d{1,4}(?!\d)/g,
  },
  {
    id: 'secret',
    label: 'API keys & tokens',
    token: 'SECRET',
    description: 'API keys, JWT, Bearer tokens, OpenAI/AWS/GitHub keys',
    pattern: /\b(?:sk-[A-Za-z0-9_-]{12,}|ghp_[A-Za-z0-9]{36}|gho_[A-Za-z0-9]{36}|xox[baprs]-[A-Za-z0-9-]{10,}|bearer\s+[A-Za-z0-9._~+/-]{12,}|AKIA[0-9A-Z]{16}|ey[A-Za-z0-9_-]{10,}\.[A-Za-z0-9._-]{10,}\.[A-Za-z0-9._-]{10,})\b/gi,
  },
  {
    id: 'identifier',
    label: 'Selected IDs',
    token: 'ID',
    description: 'Account, customer, client, and order identifiers',
    pattern: /\b(?:CUST|USER|ACCOUNT|ORDER|CLIENT|INVOICE|EMP|ORG)[-_][A-Z0-9]{4,}\b/gi,
  },
  {
    id: 'ssn_dob',
    label: 'SSN & National IDs',
    token: 'GOV_ID',
    description: 'US Social Security & national ID formats',
    pattern: /\b\d{3}-\d{2}-\d{4}\b/g,
  },
];

interface InternalMatch {
  start: number;
  end: number;
  value: string;
  token: string;
  detectorId: string;
}

export function scrubText(
  source: string,
  enabledDetectorIds: Set<DetectorId>,
  customRules: CustomRule[] = []
): ScrubResult {
  if (!source) {
    return {
      text: '',
      counts: {},
      mappings: [],
      diffSegments: [],
      totalRedactions: 0,
    };
  }

  const matches: InternalMatch[] = [];

  // Built-in detectors
  for (const detector of defaultDetectors) {
    if (!enabledDetectorIds.has(detector.id)) continue;
    detector.pattern.lastIndex = 0;
    for (const m of source.matchAll(detector.pattern)) {
      if (m.index === undefined) continue;
      matches.push({
        start: m.index,
        end: m.index + m[0].length,
        value: m[0],
        token: detector.token,
        detectorId: detector.id,
      });
    }
  }

  // Custom user rules
  for (const rule of customRules) {
    if (!rule.enabled || !rule.patternString.trim()) continue;
    try {
      if (rule.isRegex) {
        const regex = new RegExp(rule.patternString, 'gi');
        for (const m of source.matchAll(regex)) {
          if (m.index === undefined || !m[0]) continue;
          matches.push({
            start: m.index,
            end: m.index + m[0].length,
            value: m[0],
            token: rule.token || 'CUSTOM',
            detectorId: `custom_${rule.id}`,
          });
        }
      } else {
        // Literal keyword search (case-insensitive)
        const lowerSource = source.toLowerCase();
        const lowerTarget = rule.patternString.toLowerCase();
        let pos = 0;
        while ((pos = lowerSource.indexOf(lowerTarget, pos)) !== -1) {
          matches.push({
            start: pos,
            end: pos + rule.patternString.length,
            value: source.slice(pos, pos + rule.patternString.length),
            token: rule.token || 'CUSTOM',
            detectorId: `custom_${rule.id}`,
          });
          pos += rule.patternString.length;
        }
      }
    } catch {
      // Ignore invalid custom regex during typing
    }
  }

  // Sort by start index ascending, longer match wins ties
  matches.sort((a, b) => a.start - b.start || (b.end - b.start) - (a.end - a.start));

  // Remove overlapping matches
  const accepted: InternalMatch[] = [];
  for (const match of matches) {
    if (!accepted.some((item) => match.start < item.end && match.end > item.start)) {
      accepted.push(match);
    }
  }

  const labelMap = new Map<string, string>();
  const sequenceMap = new Map<string, number>();
  const counts: Record<string, number> = {};
  const mappingItems: TokenMapping[] = [];
  const diffSegments: DiffSegment[] = [];

  let cursor = 0;
  let text = '';
  let totalRedactions = 0;

  for (const match of accepted) {
    const key = `${match.token}:${match.value.toLowerCase()}`;
    let assignedToken = labelMap.get(key);

    if (!assignedToken) {
      const nextSeq = (sequenceMap.get(match.token) ?? 0) + 1;
      sequenceMap.set(match.token, nextSeq);
      assignedToken = `[${match.token}_${nextSeq}]`;
      labelMap.set(key, assignedToken);
      mappingItems.push({
        token: assignedToken,
        original: match.value,
        detectorId: match.detectorId,
        count: 1,
      });
    } else {
      const existing = mappingItems.find((m) => m.token === assignedToken);
      if (existing) existing.count++;
    }

    if (match.start > cursor) {
      const unchangedText = source.slice(cursor, match.start);
      text += unchangedText;
      diffSegments.push({ type: 'unchanged', text: unchangedText });
    }

    text += assignedToken;
    diffSegments.push({
      type: 'redacted',
      text: assignedToken,
      originalValue: match.value,
      token: assignedToken,
      detector: match.detectorId,
    });

    cursor = match.end;
    counts[match.detectorId] = (counts[match.detectorId] ?? 0) + 1;
    totalRedactions++;
  }

  if (cursor < source.length) {
    const trailingText = source.slice(cursor);
    text += trailingText;
    diffSegments.push({ type: 'unchanged', text: trailingText });
  }

  return {
    text,
    counts,
    mappings: mappingItems,
    diffSegments,
    totalRedactions,
  };
}

export function restoreTextWithMapping(
  redactedText: string,
  mappings: { token: string; original: string }[]
): string {
  let result = redactedText;
  for (const item of mappings) {
    if (!item.token || !item.original) continue;
    result = result.split(item.token).join(item.original);
  }
  return result;
}
