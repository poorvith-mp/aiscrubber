import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { execSync, spawnSync } from 'node:child_process';
import { describe, expect, test } from 'vitest';
import { runCheck } from '../bin/lib/checkCommand.js';

describe('check command', () => {
  test('refuses --staged when not in a git repo with exit code 2', async () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'aiscrub-nongit-'));
    try {
      await expect(runCheck({ staged: true, cwd: tempDir })).rejects.toThrow('not a git repository');
    } finally {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  test('reports findings in staged file with exit 1 and masked preview', async () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'aiscrub-git-'));
    try {
      execSync('git init', { cwd: tempDir, stdio: 'ignore' });
      const testFile = path.join(tempDir, 'file.ts');
      fs.writeFileSync(testFile, 'const key = "sk-live-0123456789abcdef012345";\n', 'utf8');
      execSync('git add file.ts', { cwd: tempDir, stdio: 'ignore' });

      let logged = '';
      const origLog = console.log;
      console.log = (msg) => { logged += msg + '\n'; };

      const code = await runCheck({ staged: true, cwd: tempDir });
      console.log = origLog;

      expect(code).toBe(1);
      expect(logged).toContain('file.ts:1:14');
      expect(logged).toContain('sk****45');
      expect(logged).not.toContain('0123456789abcdef'); // Original value never printed!
    } finally {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  test('clean staged set exits 0', async () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'aiscrub-git-clean-'));
    try {
      execSync('git init', { cwd: tempDir, stdio: 'ignore' });
      const testFile = path.join(tempDir, 'clean.ts');
      fs.writeFileSync(testFile, 'export function add(a: number, b: number) { return a + b; }\n', 'utf8');
      execSync('git add clean.ts', { cwd: tempDir, stdio: 'ignore' });

      const code = await runCheck({ staged: true, cwd: tempDir });
      expect(code).toBe(0);
    } finally {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  test('skips binary files and warns on > 5 MiB files', async () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'aiscrub-git-skip-'));
    try {
      execSync('git init', { cwd: tempDir, stdio: 'ignore' });

      // Binary file
      const binFile = path.join(tempDir, 'image.png');
      const binBuffer = Buffer.alloc(100);
      binBuffer[10] = 0; // Null byte
      fs.writeFileSync(binFile, binBuffer);

      // Large file > 5 MiB
      const largeFile = path.join(tempDir, 'large.txt');
      const chunk = 'hello world\n'.repeat(1000);
      const fd = fs.openSync(largeFile, 'w');
      while (fs.statSync(largeFile).size < 5.1 * 1024 * 1024) {
        fs.writeSync(fd, chunk);
      }
      fs.closeSync(fd);

      execSync('git add image.png large.txt', { cwd: tempDir, stdio: 'ignore' });

      let errOutput = '';
      const origErr = process.stderr.write;
      process.stderr.write = (chunk) => {
        errOutput += chunk;
        return true;
      };

      const code = await runCheck({ staged: true, cwd: tempDir });
      process.stderr.write = origErr;

      expect(code).toBe(0);
      expect(errOutput).toContain('warning: skipping large.txt (> 5 MiB)');
    } finally {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  test('--json outputs expected schema', async () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'aiscrub-git-json-'));
    try {
      execSync('git init', { cwd: tempDir, stdio: 'ignore' });
      const testFile = path.join(tempDir, 'secret.js');
      fs.writeFileSync(testFile, 'const token = "ghp_0123456789abcdefghijklmnopqrstuv";\n', 'utf8');
      execSync('git add secret.js', { cwd: tempDir, stdio: 'ignore' });

      let captured = '';
      const origLog = console.log;
      console.log = (str) => { captured += str; };

      const code = await runCheck({ staged: true, json: true, cwd: tempDir });
      console.log = origLog;

      expect(code).toBe(1);
      const parsed = JSON.parse(captured);
      expect(parsed.summary).toBeDefined();
      expect(parsed.summary.files).toBe(1);
      expect(parsed.summary.findings).toBe(1);
      expect(parsed.findings[0].path).toBe('secret.js');
      expect(parsed.findings[0].preview).toContain('gh****uv');
    } finally {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });
});
