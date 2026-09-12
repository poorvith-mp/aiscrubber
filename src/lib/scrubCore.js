const LUHN_CANDIDATE = /(?<!\d)(?:\d[ -]?){12,18}\d(?!\d)/g;
const IPV4_CANDIDATE = /\b(?:\d{1,3}\.){3}\d{1,3}\b/g;
const IPV6_CANDIDATE = /(?<![\w:])(?:[0-9a-f]{0,4}:){2,7}[0-9a-f]{0,4}(?![\w:])/gi;

const VERHOEFF_D = [
  [0,1,2,3,4,5,6,7,8,9],[1,2,3,4,0,6,7,8,9,5],[2,3,4,0,1,7,8,9,5,6],
  [3,4,0,1,2,8,9,5,6,7],[4,0,1,2,3,9,5,6,7,8],[5,9,8,7,6,0,4,3,2,1],
  [6,5,9,8,7,1,0,4,3,2],[7,6,5,9,8,2,1,0,4,3],[8,7,6,5,9,3,2,1,0,4],
  [9,8,7,6,5,4,3,2,1,0],
];
const VERHOEFF_P = [
  [0,1,2,3,4,5,6,7,8,9],[1,5,7,6,2,8,3,0,9,4],[5,8,0,3,7,9,6,1,4,2],
  [8,9,1,6,0,4,3,5,2,7],[9,4,5,3,1,2,6,8,7,0],[4,2,8,6,5,7,3,9,0,1],
  [2,7,9,3,8,0,6,4,1,5],[7,0,4,6,9,1,3,2,5,8],
];

export const SECRET_PREFIXES = [
  'ghp_',
  'gho_',
  'github_pat_',
  'sk-',
  'sk_',
  'pk_',
  'rk_',
  'AIza',
  'glpat-',
  'SG.',
  'npm_',
  'xapp-',
  'xox',
  'AKIA',
];

const SECRET_CONTEXT_BEFORE = /(?:Bearer\s+|token\s*[:=]\s*|key\s*[:=]\s*|secret\s*[:=]\s*|passwd\s*[:=]\s*|password\s*[:=]\s*|auth_key\s*[:=]\s*|aws_secret_access_key\s*[:=]\s*|SESSION_TOKEN\s*[:=]\s*|DB_PASS\s*[:=]\s*)["']?$/i;

export function calculateShannonEntropy(str) {
  if (!str) return 0;
  const freq = new Map();
  for (let i = 0; i < str.length; i++) {
    const ch = str[i];
    freq.set(ch, (freq.get(ch) || 0) + 1);
  }
  let bits = 0;
  for (const count of freq.values()) {
    const p = count / str.length;
    bits -= p * Math.log2(p);
  }
  return bits;
}

export function applyEntropyFilters(candidate, context = { before: '', after: '' }, allowlist = []) {
  if (!candidate) return false;

  // E5_allowlist: user allowlist drops candidates
  if (Array.isArray(allowlist)) {
    for (const rule of allowlist) {
      if (!rule || !rule.value) continue;
      if (rule.isRegex) {
        try {
          if (new RegExp(rule.value, 'i').test(candidate)) return false;
        } catch {}
      } else if (candidate === rule.value) {
        return false;
      }
    }
  }

  // Prefix check: known secret prefixes always beat E1..E6
  if (SECRET_PREFIXES.some((prefix) => candidate.startsWith(prefix))) {
    return true;
  }

  const beforeSlice = (context && context.before) ? context.before.slice(-24) : '';
  const hasSecretContext = SECRET_CONTEXT_BEFORE.test(beforeSlice);

  // E6_repeat_char: one char class only
  if (/^(.)\1{3,}$/.test(candidate)) {
    return false;
  }

  // E3_base64_media: candidate length > 512 preceded by data:image/ or ;base64,
  if (candidate.length > 512 && context && context.before) {
    const prev40 = context.before.slice(-40);
    if (prev40.includes('data:image/') || prev40.includes(';base64,')) {
      return false;
    }
  }

  // E2_uuid: RFC 4122 UUID (any standard 8-4-4-4-12 hex representation)
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(candidate)) {
    return false;
  }

  // E1_hex_sha: 7 to 64 hex chars or digests / memory addresses
  if (/^(?:0x)?[0-9a-f]{7,64}$/i.test(candidate) || /^(?:sha\d{3}|md5|git)-[0-9a-f]+$/i.test(candidate)) {
    if (!hasSecretContext) {
      return false;
    }
    return true;
  }

  // Kebab/snake case word identifiers
  if (/^[a-z]+(?:[-_][a-z]+)+(?:-\d+)?$/i.test(candidate) && !hasSecretContext) {
    return false;
  }

  // E4_known_word_ratio: >= 40% of 4-gram windows are dictionary-like
  if (candidate.length >= 4 && !hasSecretContext) {
    const lower = candidate.toLowerCase();
    let totalWindows = 0;
    let wordWindows = 0;
    for (let i = 0; i <= lower.length - 4; i++) {
      const quad = lower.slice(i, i + 4);
      totalWindows++;
      if (/^[a-z]{4}$/.test(quad) && /[aeiou]/.test(quad)) {
        wordWindows++;
      }
    }
    if (totalWindows > 0 && (wordWindows / totalWindows) >= 0.4) {
      return false;
    }
  }

  return true;
}

export const detectorDefinitions = [
  { id: 'email', label: 'Email addresses', token: 'EMAIL', description: 'Personal and work email addresses', patterns: [/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi] },
  { id: 'phone', label: 'Phone numbers', token: 'PHONE', description: 'Indian and international telephone numbers', patterns: [/(?<!\d)(?:\+91[ .-]?)?[6-9]\d{4}[ .-]?\d{5}(?!\d)/g, /(?<!\w)\+?\d{1,3}[ .-]\(?\d{2,4}\)?[ .-]\d{3,4}[ .-]\d{4}(?!\w)/g] },
  { id: 'ip', label: 'IP addresses', token: 'IP', description: 'Validated IPv4 and IPv6 network addresses', patterns: [IPV4_CANDIDATE, IPV6_CANDIDATE], validate: (value) => value.includes(':') ? isValidIpv6(value) : isValidIpv4(value) },
  { id: 'url', label: 'Private URLs', token: 'URL', description: 'Web links, webhooks, and private API endpoints', patterns: [/\bhttps?:\/\/[^\s<>()"']+/gi] },
  { id: 'card', label: 'Card numbers', token: 'CARD', description: 'Payment-card numbers that pass the Luhn checksum', patterns: [LUHN_CANDIDATE], validate: isLuhnValid },
  { id: 'secret', label: 'API keys and tokens', token: 'SECRET', description: 'Provider credentials, bearer tokens, JWTs, and private-key headers', patterns: [
    /\bsk-(?:proj-)?[A-Za-z0-9_-]{20,}\b/g,
    /\b(?:ghp_|gho_)[A-Za-z0-9]{30,}\b/g,
    /\bgithub_pat_[A-Za-z0-9_]{40,}\b/g,
    /\b(?:sk|pk|rk)_(?:live|test)_[A-Za-z0-9]{20,}\b/g,
    /\bAIza[A-Za-z0-9_-]{35}\b/g,
    /\bglpat-[A-Za-z0-9_-]{20,}\b/g,
    /\bSG\.[A-Za-z0-9_-]{16,}\.[A-Za-z0-9_-]{20,}\b/g,
    /\bnpm_[A-Za-z0-9]{36}\b/g,
    /\bxapp-[A-Za-z0-9-]{20,}\b/g,
    /\bxox[baprs]-[A-Za-z0-9-]{20,}\b/g,
    /\bbearer\s+[A-Za-z0-9._~+\/-]{12,}={0,2}\b/gi,
    /\bAKIA[0-9A-Z]{16}\b/g,
    /\beyJ[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\b/g,
    /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/g,
    /\b(?:aws_secret_access_key|secret)\s*[:=]\s*["']?([A-Za-z0-9/+=]{40})["']?/gi,
    /\b(?:password|passwd|pwd|api_key|token|auth_key|secret|pass|db_pass)\s*[:=]\s*["']?([^\s"';,\r\n]+)["']?/gi,
  ], capture: (match) => match[1] || match[0] },
  { id: 'identifier', label: 'Selected IDs', token: 'ID', description: 'Account, customer, client, and order identifiers', patterns: [/\b(?:CUST|USER|ACCOUNT|ORDER|CLIENT|INVOICE|EMP|ORG)[-_][A-Z0-9]{4,}\b/gi] },
  { id: 'ssn_dob', label: 'US Social Security numbers', token: 'GOV_ID', description: 'US Social Security number format', patterns: [/\b\d{3}-\d{2}-\d{4}\b/g] },
  { id: 'national_id_in', label: 'India IDs', token: 'INDIA_ID', description: 'Verhoeff-valid Aadhaar and PAN formats', patterns: [/(?<![\w-])(?:\d{4}[ -]?){2}\d{4}(?![\w-])/g, /\b[A-Z]{5}\d{4}[A-Z]\b/g], validate: (value) => /[A-Z]/i.test(value) || isVerhoeffValid(value) },
  { id: 'entropy', label: 'High-entropy strings', token: 'SECRET', description: 'High-entropy strings, tokens, and candidate secrets', patterns: [/(?<![A-Za-z0-9_-])[A-Za-z0-9_-]{7,}(?![A-Za-z0-9_-])/g], validate: (value) => {
    if (value.length < 7) return false;
    if (/^[0-9a-f]{7,64}$/i.test(value)) return true;
    if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)) return true;
    if (/^(.)\1{3,}$/.test(value)) return true;
    if (value.length >= 16) return true;
    return false;
  }},
];

export function isLuhnValid(value) {
  const digits = value.replace(/\D/g, '');
  if (digits.length < 13 || digits.length > 19 || /^(\d)\1+$/.test(digits)) return false;
  let sum = 0;
  let double = false;
  for (let index = digits.length - 1; index >= 0; index--) {
    let digit = Number(digits[index]);
    if (double) { digit *= 2; if (digit > 9) digit -= 9; }
    sum += digit;
    double = !double;
  }
  return sum % 10 === 0;
}

export function isVerhoeffValid(value) {
  const digits = value.replace(/\D/g, '');
  if (digits.length !== 12 || digits[0] === '0' || digits[0] === '1') return false;
  let checksum = 0;
  [...digits].reverse().forEach((digit, index) => {
    checksum = VERHOEFF_D[checksum][VERHOEFF_P[index % 8][Number(digit)]];
  });
  return checksum === 0;
}

function isValidIpv4(value) {
  const parts = value.split('.');
  return parts.length === 4 && parts.every((part) => /^\d{1,3}$/.test(part) && Number(part) <= 255);
}

export function isValidIpv6(value) {
  if (!value.includes(':') || /[^0-9a-f:]/i.test(value) || value.includes(':::')) return false;
  const halves = value.split('::');
  if (halves.length > 2) return false;
  const left = halves[0] ? halves[0].split(':') : [];
  const right = halves[1] ? halves[1].split(':') : [];
  if (![...left, ...right].every((part) => /^[0-9a-f]{1,4}$/i.test(part))) return false;
  return halves.length === 2 ? left.length + right.length < 8 : left.length === 8;
}

export function collectBuiltInMatches(source, enabledIds = new Set(detectorDefinitions.map(({ id }) => id)), options = {}) {
  const matches = [];
  let entropySuppressed = 0;
  for (const detector of detectorDefinitions) {
    if (!enabledIds.has(detector.id)) continue;
    for (const pattern of detector.patterns) {
      pattern.lastIndex = 0;
      for (const match of source.matchAll(pattern)) {
        if (match.index === undefined) continue;
        const value = detector.capture ? detector.capture(match) : match[0];
        if (!value || (detector.validate && !detector.validate(value))) continue;
        const relative = match[0].indexOf(value);
        const start = match.index + relative;
        const end = start + value.length;

        if (detector.id === 'entropy') {
          if (options.suppressEntropy !== false) {
            const context = {
              before: source.slice(Math.max(0, start - 40), start),
              after: source.slice(end, Math.min(source.length, end + 40)),
            };
            if (!applyEntropyFilters(value, context, options.allowlist || [])) {
              entropySuppressed++;
              continue;
            }
          }
        }

        matches.push({ start, end, value, token: detector.token, detectorId: detector.id });
      }
    }
  }
  matches.entropySuppressed = entropySuppressed;
  return matches;
}

export function tokenizeMatches(source, inputMatches, options = {}) {
  const sorted = [...inputMatches].sort((a, b) => {
    if (a.start !== b.start) return a.start - b.start;
    if (a.end !== b.end) return (b.end - b.start) - (a.end - a.start);
    const aCustom = a.detectorId.startsWith('custom_');
    const bCustom = b.detectorId.startsWith('custom_');
    if (aCustom !== bCustom) return aCustom ? -1 : 1;
    return 0;
  });
  const accepted = [];
  for (const match of sorted) {
    if (!accepted.some((item) => match.start < item.end && match.end > item.start)) accepted.push(match);
  }
  const assigned = new Map();
  const sequences = new Map();
  const mappings = [];
  const counts = {};
  const diffSegments = [];
  let cursor = 0;
  let text = '';
  for (const match of accepted) {
    const key = `${match.token}:${match.value.toLowerCase()}`;
    let token = assigned.get(key);
    if (!token) {
      const next = (sequences.get(match.token) || 0) + 1;
      sequences.set(match.token, next);
      token = `[${match.token}_${next}]`;
      assigned.set(key, token);
      mappings.push({ token, original: match.value, detectorId: match.detectorId, count: 1 });
    } else {
      mappings.find((item) => item.token === token).count++;
    }
    if (match.start > cursor) {
      const unchanged = source.slice(cursor, match.start);
      text += unchanged;
      diffSegments.push({ type: 'unchanged', text: unchanged });
    }
    text += token;
    diffSegments.push({ type: 'redacted', text: token, originalValue: match.value, token, detector: match.detectorId });
    cursor = match.end;
    counts[match.detectorId] = (counts[match.detectorId] || 0) + 1;
  }
  if (cursor < source.length) {
    const trailing = source.slice(cursor);
    text += trailing;
    diffSegments.push({ type: 'unchanged', text: trailing });
  }

  const suppressed = options.entropySuppressed ?? inputMatches.entropySuppressed ?? 0;
  if (suppressed > 0 || options.suppressEntropy !== false) {
    counts['entropy-suppressed'] = suppressed;
  }

  return { text, counts, mappings, diffSegments, totalRedactions: accepted.length };
}

export function collectCustomMatches(source, customRules = []) {
  const matches = [];
  for (const rule of customRules) {
    if (!rule.enabled || !rule.patternString?.trim()) continue;
    try {
      if (rule.isRegex) {
        const regex = new RegExp(rule.patternString, 'gi');
        for (const match of source.matchAll(regex)) {
          if (match.index === undefined || !match[0]) continue;
          matches.push({ start: match.index, end: match.index + match[0].length, value: match[0], token: rule.token || 'CUSTOM', detectorId: `custom_${rule.id}` });
        }
      } else {
        const lower = source.toLowerCase();
        const target = rule.patternString.toLowerCase();
        let pos = 0;
        while ((pos = lower.indexOf(target, pos)) !== -1) {
          matches.push({ start: pos, end: pos + target.length, value: source.slice(pos, pos + target.length), token: rule.token || 'CUSTOM', detectorId: `custom_${rule.id}` });
          pos += target.length;
        }
      }
    } catch {}
  }
  return matches;
}

export function scrubBuiltIns(source, enabledIds, options = {}) {
  if (!source) return { text: '', counts: {}, mappings: [], diffSegments: [], totalRedactions: 0 };
  const matches = collectBuiltInMatches(source, enabledIds, options);
  if (options.customRules && options.customRules.length > 0) {
    const customMatches = collectCustomMatches(source, options.customRules);
    matches.push(...customMatches);
  }
  return tokenizeMatches(source, matches, { ...options, entropySuppressed: matches.entropySuppressed });
}
