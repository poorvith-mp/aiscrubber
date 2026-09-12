import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { collectBuiltInMatches, detectorDefinitions } from '../../src/lib/scrubCore.js';
import { loadConfig } from './rulesLoader.js';

export function isBinaryFile(filePath) {
  try {
    const fd = fs.openSync(filePath, 'r');
    const buffer = Buffer.alloc(8192);
    const bytesRead = fs.readSync(fd, buffer, 0, 8192, 0);
    fs.closeSync(fd);
    for (let i = 0; i < bytesRead; i++) {
      if (buffer[i] === 0) return true;
    }
    return false;
  } catch {
    return false;
  }
}

export function maskPreview(val) {
  if (!val) return '****';
  if (val.length <= 4) return '****';
  return val.slice(0, 2) + '****' + val.slice(-2);
}

export function getLineCol(content, index) {
  const slice = content.slice(0, index);
  let line = 1;
  let lastNewline = -1;
  for (let i = 0; i < slice.length; i++) {
    if (slice[i] === '\n') {
      line++;
      lastNewline = i;
    }
  }
  const col = index - lastNewline;
  return { line, col };
}

export function getStagedFiles(cwd = process.cwd()) {
  try {
    const output = execSync('git diff --cached --name-only --diff-filter=ACM', {
      cwd,
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'pipe'],
    });
    return output.split(/\r?\n/).map((s) => s.trim()).filter(Boolean);
  } catch (err) {
    const error = new Error('not a git repository');
    error.exitCode = 2;
    throw error;
  }
}

export async function runCheck({
  targets = [],
  staged = false,
  json = false,
  verbose = false,
  configPath = null,
  cwd = process.cwd(),
  suppressEntropy = true,
  stdinContent = null,
}) {
  const loadedConfig = loadConfig({ cwd, explicitPath: configPath });
  const customRules = loadedConfig.customRules || [];
  const allowlist = loadedConfig.allowlist || [];
  const enabledDetectorIds = new Set(detectorDefinitions.map((d) => d.id));

  let filePaths = [];
  if (staged) {
    filePaths = getStagedFiles(cwd).map((rel) => path.resolve(cwd, rel));
  } else if (targets.length > 0) {
    filePaths = targets.map((t) => path.resolve(cwd, t));
  }

  const findings = [];
  let filesScanned = 0;
  let filesSkipped = 0;

  // If no targets and not staged, check stdin
  if (!staged && targets.length === 0) {
    let input = stdinContent;
    if (input === null && !process.stdin.isTTY) {
      input = await new Promise((resolve) => {
        let buf = '';
        process.stdin.setEncoding('utf8');
        process.stdin.on('data', (d) => { buf += d; });
        process.stdin.on('end', () => resolve(buf));
        process.stdin.on('error', () => resolve(null));
      });
    }

    if (input !== null && input !== undefined) {
      filesScanned++;
      const matches = collectBuiltInMatches(input, enabledDetectorIds, {
        allowlist,
        suppressEntropy,
      });

      for (const rule of customRules) {
        if (!rule.enabled || !rule.patternString?.trim()) continue;
        try {
          if (rule.isRegex) {
            const regex = new RegExp(rule.patternString, 'gi');
            for (const match of input.matchAll(regex)) {
              if (match.index === undefined || !match[0]) continue;
              matches.push({ start: match.index, end: match.index + match[0].length, value: match[0], token: rule.token || 'CUSTOM', detectorId: rule.id });
            }
          } else {
            const lower = input.toLowerCase();
            const target = rule.patternString.toLowerCase();
            let pos = 0;
            while ((pos = lower.indexOf(target, pos)) !== -1) {
              matches.push({ start: pos, end: pos + target.length, value: input.slice(pos, pos + target.length), token: rule.token || 'CUSTOM', detectorId: rule.id });
              pos += target.length;
            }
          }
        } catch {}
      }

      const sorted = [...matches].sort((a, b) => a.start - b.start);
      const accepted = [];
      for (const match of sorted) {
        if (!accepted.some((item) => match.start < item.end && match.end > item.start)) {
          accepted.push(match);
        }
      }

      for (const match of accepted) {
        const { line, col } = getLineCol(input, match.start);
        findings.push({
          path: '<stdin>',
          line,
          col,
          detector: match.detectorId,
          preview: maskPreview(match.value),
        });
      }
    }
  }

  for (const filePath of filePaths) {
    if (!fs.existsSync(filePath)) continue;
    const relPath = path.relative(cwd, filePath).replace(/\\/g, '/');

    try {
      const stat = fs.statSync(filePath);
      if (stat.isDirectory()) continue;

      if (stat.size > 5 * 1024 * 1024) {
        process.stderr.write(`warning: skipping ${relPath} (> 5 MiB)\n`);
        filesSkipped++;
        continue;
      }

      if (isBinaryFile(filePath)) {
        if (verbose) {
          process.stderr.write(`skipping binary file ${relPath}\n`);
        }
        filesSkipped++;
        continue;
      }

      const content = fs.readFileSync(filePath, 'utf8');
      filesScanned++;

      // Collect built-in and custom matches
      const matches = collectBuiltInMatches(content, enabledDetectorIds, {
        allowlist,
        suppressEntropy,
      });

      for (const rule of customRules) {
        if (!rule.enabled || !rule.patternString?.trim()) continue;
        try {
          if (rule.isRegex) {
            const regex = new RegExp(rule.patternString, 'gi');
            for (const match of content.matchAll(regex)) {
              if (match.index === undefined || !match[0]) continue;
              matches.push({ start: match.index, end: match.index + match[0].length, value: match[0], token: rule.token || 'CUSTOM', detectorId: rule.id });
            }
          } else {
            const lower = content.toLowerCase();
            const target = rule.patternString.toLowerCase();
            let pos = 0;
            while ((pos = lower.indexOf(target, pos)) !== -1) {
              matches.push({ start: pos, end: pos + target.length, value: content.slice(pos, pos + target.length), token: rule.token || 'CUSTOM', detectorId: rule.id });
              pos += target.length;
            }
          }
        } catch {}
      }

      // Sort and deduplicate matches
      const sorted = [...matches].sort((a, b) => a.start - b.start);
      const accepted = [];
      for (const match of sorted) {
        if (!accepted.some((item) => match.start < item.end && match.end > item.start)) {
          accepted.push(match);
        }
      }

      for (const match of accepted) {
        const { line, col } = getLineCol(content, match.start);
        findings.push({
          path: relPath,
          line,
          col,
          detector: match.detectorId,
          preview: maskPreview(match.value),
        });
      }
    } catch {}
  }

  const summary = {
    files: filesScanned,
    findings: findings.length,
    skipped: filesSkipped,
  };

  if (json) {
    console.log(JSON.stringify({ findings, summary }, null, 2));
  } else {
    for (const f of findings) {
      console.log(`${f.path}:${f.line}:${f.col} ${f.detector} ${f.preview}`);
    }
    if (findings.length === 0 && verbose) {
      console.log('no findings');
    }
  }

  return findings.length > 0 ? 1 : 0;
}
