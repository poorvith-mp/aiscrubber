import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { resolveMergedConfig, validateConfig } from '../../src/lib/rulesCore.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


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
  try {
    const config = validateConfig(configObj);
    const resolved = resolveMergedConfig(config, loadPacks());
    return {
      config,
      source: sourcePath,
      customRules: resolved.customRules,
      allowlist: resolved.allowlist,
      detectors: config.detectors || null,
      enabledDetectorIds: resolved.enabledDetectorIds,
      extendedPacks: resolved.extendedPacks,
    };
  } catch (cause) {
    const err = new Error(cause instanceof Error ? cause.message : `Invalid ${path.basename(sourcePath)}`);
    err.exitCode = 2;
    throw err;
  }
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
      enabledDetectorIds: null,
      extendedPacks: [],
    };
  }

  let rawContent;
  try {
    if (fs.statSync(configPath).size > 1024 * 1024) throw new Error('Config exceeds 1 MiB');
    rawContent = fs.readFileSync(configPath, 'utf8').replace(/^\uFEFF/, '');
  } catch (e) {
    const err = new Error('Cannot read config. Use a supported file smaller than 1 MiB.');
    err.exitCode = 2;
    throw err;
  }

  let parsed;
  try {
    parsed = JSON.parse(rawContent);
  } catch (e) {
    const err = new Error('Config is not valid JSON');
    err.exitCode = 2;
    throw err;
  }

  return validateAndResolveConfig(parsed, configPath);
}
