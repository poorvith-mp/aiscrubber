export type DetectorId = 'email' | 'phone' | 'ip' | 'url' | 'card' | 'secret' | 'identifier';

type Detector = { id: DetectorId; label: string; token: string; pattern: RegExp };

export const detectors: Detector[] = [
  { id: 'email', label: 'Email', token: 'EMAIL', pattern: /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi },
  { id: 'phone', label: 'Phone', token: 'PHONE', pattern: /(?<!\w)(?:\+?\d{1,3}[ .-]?)?(?:\(?\d{2,4}\)?[ .-]?)?\d{3,4}[ .-]\d{4}(?!\w)/g },
  { id: 'ip', label: 'IP address', token: 'IP', pattern: /\b(?:(?:25[0-5]|2[0-4]\d|1?\d?\d)\.){3}(?:25[0-5]|2[0-4]\d|1?\d?\d)\b/g },
  { id: 'url', label: 'URL', token: 'URL', pattern: /\bhttps?:\/\/[^\s<>()]+/gi },
  { id: 'card', label: 'Card-like number', token: 'CARD', pattern: /(?<!\d)(?:\d[ -]?){12,18}\d(?!\d)/g },
  { id: 'secret', label: 'API key / token', token: 'SECRET', pattern: /\b(?:sk-[A-Z0-9_-]{12,}|bearer\s+[A-Z0-9._-]{12,})\b/gi },
  { id: 'identifier', label: 'Selected IDs', token: 'ID', pattern: /\b(?:CUST|USER|ACCOUNT|ORDER|CLIENT)[-_][A-Z0-9]{4,}\b/gi },
];

type Match = { start: number; end: number; value: string; token: string; detector: DetectorId };

export function scrubText(source: string, enabled: Set<DetectorId>) {
  const matches: Match[] = [];
  for (const detector of detectors) {
    if (!enabled.has(detector.id)) continue;
    detector.pattern.lastIndex = 0;
    for (const match of source.matchAll(detector.pattern)) {
      if (match.index === undefined) continue;
      matches.push({ start: match.index, end: match.index + match[0].length, value: match[0], token: detector.token, detector: detector.id });
    }
  }

  matches.sort((a, b) => a.start - b.start || b.end - b.start - (a.end - a.start));
  const accepted: Match[] = [];
  for (const match of matches) {
    if (!accepted.some((item) => match.start < item.end && match.end > item.start)) accepted.push(match);
  }

  const labels = new Map<string, string>();
  const sequence = new Map<string, number>();
  const counts: Record<string, number> = {};
  let cursor = 0;
  let text = '';
  for (const match of accepted) {
    const key = `${match.detector}:${match.value.toLowerCase()}`;
    if (!labels.has(key)) {
      const next = (sequence.get(match.token) ?? 0) + 1;
      sequence.set(match.token, next);
      labels.set(key, `[${match.token}_${next}]`);
    }
    text += source.slice(cursor, match.start) + labels.get(key);
    cursor = match.end;
    counts[match.detector] = (counts[match.detector] ?? 0) + 1;
  }
  text += source.slice(cursor);
  return { text, counts };
}
