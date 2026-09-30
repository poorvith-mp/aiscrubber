const DETECTOR_IDS = ['email', 'phone', 'ip', 'url', 'card', 'secret', 'identifier', 'ssn_dob', 'national_id_in', 'entropy'];
const DETECTOR_SET = new Set(DETECTOR_IDS);
const TOP_KEYS = new Set(['version', 'detectors', 'customRules', 'allowlist', 'extends']);
const DETECTOR_KEYS = new Set(['enable', 'disable']);
const RULE_KEYS = new Set(['id', 'label', 'token', 'patternString', 'isRegex', 'enabled']);
const ALLOW_KEYS = new Set(['value', 'isRegex']);
const RULE_ID = /^[A-Za-z0-9_-]{1,64}$/;
const TOKEN = /^[A-Z][A-Z0-9_]{0,39}$/;

function record(value, label) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error(`${label} must be an object`);
  return value;
}

function knownKeys(value, allowed, label) {
  const unknown = Object.keys(value).find((key) => !allowed.has(key));
  if (unknown) throw new Error(`${label} contains unknown field "${unknown}"`);
}

function detectorList(value, label) {
  if (!Array.isArray(value)) throw new Error(`${label} must be an array`);
  return value.map((id, index) => {
    if (typeof id !== 'string' || !DETECTOR_SET.has(id)) throw new Error(`${label}[${index}] is not a known detector`);
    return id;
  });
}

function customRules(value) {
  if (!Array.isArray(value)) throw new Error('customRules must be an array');
  if (value.length > 100) throw new Error('customRules exceeds 100 items');
  const ids = new Set();
  return value.map((input, index) => {
    const item = record(input, `customRules[${index}]`);
    knownKeys(item, RULE_KEYS, `customRules[${index}]`);
    if (typeof item.id !== 'string' || !RULE_ID.test(item.id)) throw new Error(`customRules[${index}].id is invalid`);
    if (ids.has(item.id)) throw new Error(`customRules contains duplicate id at index ${index}`);
    ids.add(item.id);
    const patternString = item.patternString;
    if (typeof patternString !== 'string' || patternString.length < 1 || patternString.length > 4096) {
      throw new Error(`customRules[${index}].patternString is invalid`);
    }
    const isRegex = item.isRegex === true;
    if (item.isRegex !== undefined && typeof item.isRegex !== 'boolean') throw new Error(`customRules[${index}].isRegex must be boolean`);
    if (item.enabled !== undefined && typeof item.enabled !== 'boolean') throw new Error(`customRules[${index}].enabled must be boolean`);
    const label = item.label === undefined ? item.id : item.label;
    const token = item.token === undefined ? 'CUSTOM' : item.token;
    if (typeof label !== 'string' || !label || label.length > 100) throw new Error(`customRules[${index}].label is invalid`);
    if (typeof token !== 'string' || !TOKEN.test(token)) throw new Error(`customRules[${index}].token is invalid`);
    if (isRegex) {
      try { new RegExp(patternString, 'giu'); } catch { throw new Error(`customRules[${index}] has invalid regex`); }
    }
    return { id: item.id, label, token, patternString, isRegex, enabled: item.enabled !== false };
  });
}

function allowlist(value) {
  if (!Array.isArray(value)) throw new Error('allowlist must be an array');
  if (value.length > 100) throw new Error('allowlist exceeds 100 items');
  const seen = new Set();
  const result = [];
  value.forEach((input, index) => {
    const item = record(input, `allowlist[${index}]`);
    knownKeys(item, ALLOW_KEYS, `allowlist[${index}]`);
    if (typeof item.value !== 'string' || item.value.length < 1 || item.value.length > 4096) throw new Error(`allowlist[${index}].value is invalid`);
    if (item.isRegex !== undefined && typeof item.isRegex !== 'boolean') throw new Error(`allowlist[${index}].isRegex must be boolean`);
    const normalized = { value: item.value, isRegex: item.isRegex === true };
    if (normalized.isRegex) {
      try { new RegExp(normalized.value, 'iu'); } catch { throw new Error(`allowlist[${index}] has invalid regex`); }
    }
    const key = `${normalized.isRegex}:${normalized.value}`;
    if (!seen.has(key)) { seen.add(key); result.push(normalized); }
  });
  return result;
}

export function validateConfig(raw) {
  const input = record(raw, 'Config root');
  knownKeys(input, TOP_KEYS, 'Config root');
  if (input.version !== 1) throw new Error(`Unsupported version ${String(input.version)} in .aiscrubrc.json; expected 1`);
  const config = { version: 1 };
  if (input.detectors !== undefined) {
    const value = record(input.detectors, 'detectors');
    knownKeys(value, DETECTOR_KEYS, 'detectors');
    config.detectors = {};
    if ('enable' in value) config.detectors.enable = detectorList(value.enable, 'detectors.enable');
    if ('disable' in value) config.detectors.disable = detectorList(value.disable, 'detectors.disable');
  }
  if (input.customRules !== undefined) config.customRules = customRules(input.customRules);
  if (input.allowlist !== undefined) config.allowlist = allowlist(input.allowlist);
  if (input.extends !== undefined) {
    if (!Array.isArray(input.extends) || input.extends.some((name) => typeof name !== 'string' || !name)) throw new Error('extends must be an array of pack names');
    config.extends = [...input.extends];
  }
  return config;
}

export function resolveMergedConfig(configInput, packsMap = {}) {
  const config = validateConfig(configInput);
  const enabled = new Set(config.detectors && Object.prototype.hasOwnProperty.call(config.detectors, 'enable')
    ? config.detectors.enable
    : DETECTOR_IDS);
  for (const id of config.detectors?.disable || []) enabled.delete(id);

  const merged = new Map();
  const extendedPacks = [];
  for (const name of config.extends || []) {
    const pack = packsMap[name];
    if (!pack) throw new Error(`Unknown pack "${name}" specified in extends`);
    extendedPacks.push(name);
    for (const rule of customRules(pack.customRules || [])) merged.set(rule.id, rule);
  }
  for (const rule of config.customRules || []) merged.set(rule.id, rule);
  if (merged.size > 100) throw new Error('Effective custom rules exceed 100 items');
  return {
    enabledDetectorIds: enabled,
    customRules: [...merged.values()],
    allowlist: config.allowlist || [],
    extendedPacks,
  };
}

export { DETECTOR_IDS };
