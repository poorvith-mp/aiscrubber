import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ALLOWED_TOP_KEYS = new Set(['version', 'detectors', 'customRules', 'allowlist', 'extends']);

export function findConfigFile(cwd = process.cwd(), explicitPath = null) {
  if (explicitPath) {
    const resolved = path.resolve(cwd, explicitPath);
    if (!fs.existsSync(resolved)) {
      const err = new Error(`Config file not found: "${explicitPath}"`);
      err.exitCode = 2;
      throw err;
    }
    return resolved;
  }

  if (process.env.AISCRUBRC) {
    const resolved = path.resolve(cwd, process.env.AISCRUBRC);
    if (!fs.existsSync(resolved)) {
      const err = new Error(`Config file from AISCRUBRC not found: "${process.env.AISCRUBRC}"`);
      err.exitCode = 2;
      throw err;
    }
    return resolved;
  }

  // Walk up from cwd to git root
  let current = path.resolve(cwd);
  while (true) {
    const candidate = path.join(current, '.aiscrubrc.json');
    if (fs.existsSync(candidate)) {
      return candidate;
    }
    // Check if current is git root
    const gitDir = path.join(current, '.git');
    if (fs.existsSync(gitDir)) {
      break;
    }
    const parent = path.dirname(current);
    if (parent === current) {
      break;
    }
    current = parent;
  }

  return null;
}

export function loadPacks() {
  const packs = {};
  const packsDir = path.resolve(__dirname, '../../packs');
  if (fs.existsSync(packsDir)) {
    const files = fs.readdirSync(packsDir).filter((f) => f.endsWith('.json'));
    for (const file of files) {
      try {
        const content = fs.readFileSync(path.join(packsDir, file), 'utf8').replace(/^\uFEFF/, '');
        const parsed = JSON.parse(content);
        const packName = parsed.name || path.basename(file, '.json');
        packs[packName] = parsed;
      } catch {}
    }
  }
  return packs;
}

export function validateAndResolveConfig(configObj, sourcePath = 'config') {
  if (!configObj || typeof configObj !== 'object' || Array.isArray(configObj)) {
    const err = new Error(`Invalid ${path.basename(sourcePath)}: root must be an object`);
    err.exitCode = 2;
    throw err;
  }

  for (const key of Object.keys(configObj)) {
    if (!ALLOWED_TOP_KEYS.has(key)) {
      const err = new Error(`Unknown key "${key}" in .aiscrubrc.json`);
      err.exitCode = 2;
      throw err;
    }
  }

  if (configObj.version !== 1) {
    const err = new Error(`Unsupported version ${configObj.version} in .aiscrubrc.json; expected 1`);
    err.exitCode = 2;
    throw err;
  }

  // Validate customRules
  if (configObj.customRules !== undefined) {
    if (!Array.isArray(configObj.customRules)) {
      const err = new Error('Invalid customRules: must be an array');
      err.exitCode = 2;
      throw err;
    }
    for (const rule of configObj.customRules) {
      if (!rule || typeof rule !== 'object') {
        const err = new Error('Invalid rule in customRules');
        err.exitCode = 2;
        throw err;
      }
      if (!rule.id || typeof rule.id !== 'string') {
        const err = new Error('Rule missing required "id" string');
        err.exitCode = 2;
        throw err;
      }
      if (!rule.patternString || typeof rule.patternString !== 'string') {
        const err = new Error(`Rule "${rule.id}" missing patternString`);
        err.exitCode = 2;
        throw err;
      }
      if (rule.isRegex) {
        try {
          new RegExp(rule.patternString);
        } catch (e) {
          const err = new Error(`Invalid regex in rule "${rule.id}": ${e.message}`);
          err.exitCode = 2;
          throw err;
        }
      }
    }
  }

  // Validate allowlist
  if (configObj.allowlist !== undefined) {
    if (!Array.isArray(configObj.allowlist)) {
      const err = new Error('Invalid allowlist: must be an array');
      err.exitCode = 2;
      throw err;
    }
    for (const item of configObj.allowlist) {
      if (!item || typeof item !== 'object' || typeof item.value !== 'string') {
        const err = new Error('Allowlist entries must have a "value" string');
        err.exitCode = 2;
        throw err;
      }
      if (item.isRegex) {
        try {
          new RegExp(item.value);
        } catch (e) {
          const err = new Error(`Invalid regex in allowlist rule "${item.value}": ${e.message}`);
          err.exitCode = 2;
          throw err;
        }
      }
    }
  }

  const availablePacks = loadPacks();
  const mergedRulesMap = new Map();
  const extendedPacks = [];

  if (Array.isArray(configObj.extends)) {
    for (const packName of configObj.extends) {
      const pack = availablePacks[packName];
      if (!pack) {
        const err = new Error(`Unknown pack "${packName}" specified in extends`);
        err.exitCode = 2;
        throw err;
      }
      extendedPacks.push(packName);
      if (Array.isArray(pack.customRules)) {
        for (const rule of pack.customRules) {
          mergedRulesMap.set(rule.id, { ...rule });
        }
      }
    }
  }

  if (Array.isArray(configObj.customRules)) {
    for (const rule of configObj.customRules) {
      mergedRulesMap.set(rule.id, { ...rule });
    }
  }

  return {
    config: configObj,
    source: sourcePath,
    customRules: Array.from(mergedRulesMap.values()),
    allowlist: Array.isArray(configObj.allowlist) ? [...configObj.allowlist] : [],
    detectors: configObj.detectors || null,
    extendedPacks,
  };
}

export function loadConfig({ cwd = process.cwd(), explicitPath = null } = {}) {
  const configPath = findConfigFile(cwd, explicitPath);
  if (!configPath) {
    return {
      config: null,
      source: 'defaults',
      customRules: [],
      allowlist: [],
      detectors: null,
      extendedPacks: [],
    };
  }

  let rawContent;
  try {
    rawContent = fs.readFileSync(configPath, 'utf8').replace(/^\uFEFF/, '');
  } catch (e) {
    const err = new Error(`Cannot read config at ${configPath}: ${e.message}`);
    err.exitCode = 2;
    throw err;
  }

  let parsed;
  try {
    parsed = JSON.parse(rawContent);
  } catch (e) {
    const err = new Error(`Invalid JSON in ${configPath}: ${e.message}`);
    err.exitCode = 2;
    throw err;
  }

  return validateAndResolveConfig(parsed, configPath);
}
