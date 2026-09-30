const V2_ROOT_KEYS = new Set(['format', 'version', 'variables']);
const V2_VARIABLE_KEYS = new Set(['placeholder', 'original', 'detectorId']);
const LEGACY_ROOT_KEYS = new Set(['id', 'name', 'createdAt', 'goal', 'variables']);
const NEW_TOKEN = /^(?:\[[A-Z][A-Z0-9_]*_[0-9]+\]|\{\{[A-Z][A-Z0-9_]*_[0-9]+\}\})$/;
const LEGACY_TOKEN = /^(?:\[[A-Z][A-Z0-9_]*(?:_[0-9]+)?\]|\{\{[A-Z][A-Z0-9_]*(?:_[0-9]+)?\}\})$/;
const ANY_TOKEN = /\[[A-Z][A-Z0-9_]*(?:_[0-9]+)?\]|\{\{[A-Z][A-Z0-9_]*(?:_[0-9]+)?\}\}/g;
const MAX_SESSION_BYTES = 16 * 1024 * 1024;
const MAX_VARIABLES = 100_000;

function assertRecord(value, message) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error(message);
  return value;
}

function assertKnownKeys(value, allowed, label) {
  const unknown = Object.keys(value).filter((key) => !allowed.has(key));
  if (unknown.length) throw new Error(`${label} contains unknown field: ${unknown[0]}`);
}

function normalizeVariables(input, strictV2) {
  const entries = Array.isArray(input)
    ? input
    : Object.entries(assertRecord(input, 'Session variables must be an array or object')).map(([placeholder, original]) => ({
        placeholder,
        original,
        detectorId: 'legacy',
      }));
  if (entries.length > MAX_VARIABLES) throw new Error('Session key contains too many variables');

  const normalized = [];
  const seen = new Map();
  for (let index = 0; index < entries.length; index++) {
    const item = assertRecord(entries[index], `Session variable ${index} must be an object`);
    if (strictV2) assertKnownKeys(item, V2_VARIABLE_KEYS, `Session variable ${index}`);
    const placeholder = item.placeholder;
    const original = item.original;
    const detectorId = item.detectorId || item.category || 'legacy';
    if (typeof placeholder !== 'string' || !(strictV2 ? NEW_TOKEN : LEGACY_TOKEN).test(placeholder)) {
      throw new Error(`Session variable ${index} has invalid token syntax`);
    }
    if (typeof original !== 'string' || typeof detectorId !== 'string' || !detectorId) {
      throw new Error(`Session variable ${index} has invalid values`);
    }
    if (seen.has(placeholder)) {
      if (seen.get(placeholder).original !== original || seen.get(placeholder).detectorId !== detectorId) {
        throw new Error(`Session key has conflicting duplicate placeholder ${placeholder}`);
      }
      continue;
    }
    const variable = { placeholder, original, detectorId };
    seen.set(placeholder, variable);
    normalized.push(variable);
  }
  return normalized;
}

export function parseSessionKey(raw) {
  let value = raw;
  if (typeof raw === 'string') {
    if (new TextEncoder().encode(raw).byteLength > MAX_SESSION_BYTES) throw new Error('Session key exceeds 16 MiB');
    try { value = JSON.parse(raw); } catch { throw new Error('Session key is not valid JSON'); }
  } else {
    let serialized;
    try { serialized = JSON.stringify(raw); } catch { throw new Error('Session key is not serializable'); }
    if (new TextEncoder().encode(serialized || '').byteLength > MAX_SESSION_BYTES) throw new Error('Session key exceeds 16 MiB');
  }

  if (Array.isArray(value)) {
    return { format: 'aiscrubber-session', version: 2, variables: normalizeVariables(value, false) };
  }

  const root = assertRecord(value, 'Session key must be an object or array');
  if (root.format === 'aiscrubber-session' || root.version === 2) {
    assertKnownKeys(root, V2_ROOT_KEYS, 'Session key');
    if (root.format !== 'aiscrubber-session' || root.version !== 2 || !Array.isArray(root.variables)) {
      throw new Error('Session key has invalid v2 format');
    }
    return { format: 'aiscrubber-session', version: 2, variables: normalizeVariables(root.variables, true) };
  }

  assertKnownKeys(root, LEGACY_ROOT_KEYS, 'Legacy session key');
  if (!('variables' in root)) throw new Error('Legacy session key is missing variables');
  return { format: 'aiscrubber-session', version: 2, variables: normalizeVariables(root.variables, false) };
}

export function restoreSessionText(text, key) {
  if (typeof text !== 'string') throw new Error('Text to restore must be a string');
  const parsed = parseSessionKey(key);
  const replacements = new Map(parsed.variables.map((item) => [item.placeholder, item.original]));
  let restoredCount = 0;
  const restored = text.replace(ANY_TOKEN, (token) => {
    if (!replacements.has(token)) return token;
    restoredCount++;
    return replacements.get(token);
  });
  const unresolvedPlaceholders = Array.from(new Set(restored.match(ANY_TOKEN) || []));
  return { text: restored, restoredCount, unresolvedPlaceholders };
}
