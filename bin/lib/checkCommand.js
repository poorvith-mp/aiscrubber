import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { detectorDefinitions } from '../../src/lib/scrubCore.js';
import { runTextJob } from './runTextJob.js';
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

function isBinaryBuffer(buffer) {
  return buffer.subarray(0, 8192).includes(0);
}

export function maskPreview() {
  return '[REDACTED]';
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
  const run = spawnSync('git', ['diff', '--cached', '--name-only', '--diff-filter=ACMRU', '-z'], {
    cwd,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  if (run.status !== 0 || run.error) {
    const error = new Error('not a git repository');
    error.exitCode = 2;
    throw error;
  }
  return run.stdout.split('\0').filter(Boolean);
}

function readStagedFile(cwd, relPath) {
  const staged = spawnSync('git', ['ls-files', '--stage', '-z', '--', relPath], { cwd, encoding: 'utf8' });
  const entries = (staged.stdout || '').split('\0').filter(Boolean).map((entry) => entry.slice(0, entry.indexOf('\t')).split(' '));
  if (staged.status !== 0 || entries.length !== 1 || entries[0][2] !== '0') return { reason: 'unmerged-or-unreadable-index', incomplete: true };
  const [mode, oid] = entries[0];
  if (mode === '120000' || mode === '160000') return { reason: mode === '120000' ? 'symlink' : 'submodule', incomplete: false };
  const size = spawnSync('git', ['cat-file', '-s', oid], { cwd, encoding: 'utf8' });
  if (size.status !== 0 || Number(size.stdout) > 5 * 1024 * 1024) return { reason: 'oversized-or-unreadable', incomplete: true };
  const run = spawnSync('git', ['cat-file', 'blob', oid], {
    cwd,
    encoding: null,
    stdio: ['ignore', 'pipe', 'pipe'],
    maxBuffer: 6 * 1024 * 1024,
  });
  if (run.status !== 0 || run.error) {
    return { reason: 'unreadable-index', incomplete: true };
  }
  return { content: run.stdout };
}

export async function runCheck({
  targets = [],
  staged = false,
  json = false,
  verbose = false,
  configPath = null,
  noConfig = false,
  cwd = process.cwd(),
  suppressEntropy = true,
  stdinContent = null,
}) {
  if (noConfig && configPath) throw Object.assign(new Error('--no-config conflicts with --config'), { exitCode: 2 });
  const loadedConfig = noConfig ? { customRules: [], allowlist: [], enabledDetectorIds: null } : loadConfig({ cwd, explicitPath: configPath });
  const customRules = loadedConfig.customRules || [];
  const allowlist = loadedConfig.allowlist || [];
  const enabledDetectorIds = loadedConfig.enabledDetectorIds || new Set(detectorDefinitions.map((d) => d.id));

  let fileEntries = [];
  if (staged) {
    const root = spawnSync('git', ['rev-parse', '--show-toplevel'], { cwd, encoding: 'utf8' });
    if (root.status !== 0) throw Object.assign(new Error('not a git repository'), { exitCode: 2 });
    cwd = root.stdout.trim();
    fileEntries = getStagedFiles(cwd).map((relPath) => ({ relPath, ...readStagedFile(cwd, relPath) }));
  } else if (targets.length > 0) {
    fileEntries = targets.map((target) => ({ filePath: path.resolve(cwd, target) }));
  }

  const findings = [];
  let filesScanned = 0;
  let filesSkipped = 0;
  let incomplete = 0;
  const exclusions = [];
  const exclude = (path, reason, failed) => {
    filesSkipped++;
    if (failed) incomplete++;
    exclusions.push({ path, reason });
    if (!json) process.stderr.write(`excluded ${JSON.stringify(path)}: ${reason}\n`);
  };

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
      const { result } = await runTextJob({ jobId: 1, revision: 1, operation: 'scrub', source: input,
        config: { version: 1, customRules, allowlist, detectors: { disable: detectorDefinitions.filter(({ id }) => !enabledDetectorIds.has(id)).map(({ id }) => id) } }, suppressEntropy });
      const accepted = result.acceptedMatches;

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

  for (const entry of fileEntries) {
    const filePath = entry.filePath;
    const relPath = entry.relPath || path.relative(cwd, filePath).replace(/\\/g, '/');
    if (entry.reason) { exclude(relPath, entry.reason, entry.incomplete); continue; }
    if (filePath && !fs.existsSync(filePath)) { exclude(relPath, 'missing', true); continue; }

    try {
      const stat = filePath ? fs.lstatSync(filePath) : null;
      if (stat?.isDirectory() || stat?.isSymbolicLink()) { exclude(relPath, 'unsupported-target', true); continue; }
      if (stat?.size > 5 * 1024 * 1024) { exclude(relPath, 'oversized', true); continue; }
      const buffer = entry.content || fs.readFileSync(filePath);

      if (buffer.length > 5 * 1024 * 1024) {
        exclude(relPath, 'oversized', true);
        continue;
      }

      if (isBinaryBuffer(buffer)) {
        exclude(relPath, 'binary', !staged);
        continue;
      }

      const content = new TextDecoder('utf-8', { fatal: true, ignoreBOM: true }).decode(buffer);
      filesScanned++;

      const { result } = await runTextJob({ jobId: filesScanned, revision: 1, operation: 'scrub', source: content,
        config: { version: 1, customRules, allowlist, detectors: { disable: detectorDefinitions.filter(({ id }) => !enabledDetectorIds.has(id)).map(({ id }) => id) } }, suppressEntropy });
      const accepted = result.acceptedMatches;

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
    } catch (cause) {
      exclude(relPath, 'read-or-processing-failed', true);
    }
  }

  const summary = {
    files: filesScanned,
    findings: findings.length,
    skipped: filesSkipped,
    incomplete,
  };

  if (json) {
    console.log(JSON.stringify({ findings, summary, exclusions }, null, 2));
  } else {
    for (const f of findings) {
      console.log(`${JSON.stringify(f.path).slice(1, -1)}:${f.line}:${f.col} ${f.detector} ${f.preview}`);
    }
    if (filesScanned === 0 || verbose) {
      console.log(`scanned=${filesScanned} findings=${findings.length} skipped=${filesSkipped} incomplete=${incomplete}`);
    }
  }

  return incomplete > 0 ? 2 : findings.length > 0 ? 1 : 0;
}
