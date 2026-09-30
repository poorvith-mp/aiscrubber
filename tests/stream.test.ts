import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { describe, expect, test } from 'vitest';
import { streamScrubFile } from '../bin/lib/streamScrub.js';
import { scrubText, defaultDetectors } from '../src/lib/scrub';

const all = new Set(defaultDetectors.map((d) => d.id));

describe('Streaming scrub', () => {
  test.each([
    { customRules: [{ id: 'regex', token: 'RULE', patternString: 'a+', isRegex: true, enabled: true }] },
    { customRules: [{ id: 'lines', token: 'RULE', patternString: 'a\nb', isRegex: false, enabled: true }] },
    { allowlist: [{ value: 'a+', isRegex: true }] },
  ])('rejects unsupported policy before opening output: %j', async (policy) => {
    const temp = fs.mkdtempSync(path.join(process.env.TMPDIR || os.tmpdir(), 'aiscrub-stream-'));
    try {
      const inputPath = path.join(temp, 'in.txt');
      const outputPath = path.join(temp, 'out.txt');
      fs.writeFileSync(inputPath, 'aaa');
      await expect(streamScrubFile({ inputPath, outputPath, quiet: true, ...policy })).rejects.toThrow('whole-file');
      expect(fs.readdirSync(temp)).toEqual(['in.txt']);
    } finally { fs.rmSync(temp, { recursive: true, force: true }); }
  });

  test.each([
    ['truncated PEM', '-----BEGIN PRIVATE KEY-----\nYWJj\n', {}],
    ['mapping exhaustion', 'a@example.com\nb@example.com', { maxMapEntries: 1 }],
    ['later token collision', 'a@example.com\n[EMAIL_1]\n', { maxLines: 1 }],
  ])('fails without publishing partial output on %s', async (_label, source, limits) => {
    const temp = fs.mkdtempSync(path.join(process.env.TMPDIR || os.tmpdir(), 'aiscrub-stream-'));
    try {
      const inputPath = path.join(temp, 'in.txt');
      const outputPath = path.join(temp, 'out.txt');
      fs.writeFileSync(inputPath, source as string);
      await expect(streamScrubFile({ inputPath, outputPath, quiet: true, limits })).rejects.toThrow();
      expect(fs.readdirSync(temp)).toEqual(['in.txt']);
    } finally { fs.rmSync(temp, { recursive: true, force: true }); }
  });

  test('reserves token-looking source and preserves a UTF-8 BOM', async () => {
    const temp = fs.mkdtempSync(path.join(process.env.TMPDIR || os.tmpdir(), 'aiscrub-stream-'));
    try {
      const inputPath = path.join(temp, 'in.txt');
      const outputPath = path.join(temp, 'out.txt');
      fs.writeFileSync(inputPath, '\uFEFF[EMAIL_1]\na@example.com');
      await streamScrubFile({ inputPath, outputPath, quiet: true });
      expect(fs.readFileSync(outputPath, 'utf8')).toBe('\uFEFF[EMAIL_1]\n[EMAIL_2]');
    } finally { fs.rmSync(temp, { recursive: true, force: true }); }
  });
  test('entropy-only allowlists do not exempt custom-rule findings', async () => {
    const tempDir = fs.mkdtempSync(path.join(process.env.TMPDIR || os.tmpdir(), 'aiscrub-stream-'));
    try {
      const inputPath = path.join(tempDir, 'input.txt');
      const outputPath = path.join(tempDir, 'output.txt');
      fs.writeFileSync(inputPath, 'ProjectApollo');
      await streamScrubFile({ inputPath, outputPath, quiet: true,
        customRules: [{ id: 'project', label: 'Project', token: 'PROJECT', patternString: 'ProjectApollo', isRegex: false, enabled: true }],
        allowlist: [{ value: 'ProjectApollo', isRegex: false }] });
      expect(fs.readFileSync(outputPath, 'utf8')).toBe('[PROJECT_1]');
    } finally { fs.rmSync(tempDir, { recursive: true, force: true }); }
  });
  test('preserves CRLF line endings and trailing lines without newline', async () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'aiscrub-stream-'));
    const inputPath = path.join(tempDir, 'crlf.log');
    const outputPath = path.join(tempDir, 'crlf.clean.log');

    try {
      const content = 'Line 1: user@example.com\r\nLine 2: 192.168.1.1\r\nLine 3: trailing line without newline';
      fs.writeFileSync(inputPath, content, 'utf8');

      await streamScrubFile({ inputPath, outputPath, quiet: true });

      const output = fs.readFileSync(outputPath, 'utf8');
      expect(output).toContain('\r\n');
      expect(output.endsWith('Line 3: trailing line without newline')).toBe(true);
      expect(output).not.toContain('user@example.com');
      expect(output).toContain('[EMAIL_1]');
      expect(output).toContain('[IP_1]');
    } finally {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  test('small file byte-identity between streaming and whole-file scrub', async () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'aiscrub-stream-'));
    const inputPath = path.join(tempDir, 'small.log');
    const outputPath = path.join(tempDir, 'small.clean.log');

    try {
      const content = 'Test line with secret sk-proj-1234567890abcdef123456 and email contact@domain.org\nSecond line with IP 10.0.0.1';
      fs.writeFileSync(inputPath, content, 'utf8');

      await streamScrubFile({ inputPath, outputPath, quiet: true });

      const streamOutput = fs.readFileSync(outputPath, 'utf8');
      const wholeFileOutput = scrubText(content, all).text;

      expect(streamOutput).toBe(wholeFileOutput);
    } finally {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  test('token numbering is stable across distant chunks', async () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'aiscrub-stream-'));
    const inputPath = path.join(tempDir, 'distance.log');
    const outputPath = path.join(tempDir, 'distance.clean.log');

    try {
      // 5000 lines of filler so it crosses the 4096-line chunk limit
      const lines = ['First occurrence: alice@example.com\n'];
      for (let i = 0; i < 5000; i++) {
        lines.push(`Log entry ${i} debug info\n`);
      }
      lines.push('Second occurrence: alice@example.com\n');

      fs.writeFileSync(inputPath, lines.join(''), 'utf8');

      await streamScrubFile({ inputPath, outputPath, quiet: true });

      const output = fs.readFileSync(outputPath, 'utf8');
      const occurrences = (output.match(/\[EMAIL_1\]/g) || []).length;
      expect(occurrences).toBe(2);
      expect(output).not.toContain('[EMAIL_2]');
    } finally {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  test('refuses to overwrite existing output file', async () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'aiscrub-stream-'));
    const inputPath = path.join(tempDir, 'in.log');
    const outputPath = path.join(tempDir, 'out.log');

    try {
      fs.writeFileSync(inputPath, 'data', 'utf8');
      fs.writeFileSync(outputPath, 'existing', 'utf8');

      await expect(streamScrubFile({ inputPath, outputPath, quiet: true })).rejects.toThrow(
        'Output file'
      );
    } finally {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  test('preserves UTF-8 characters split at the read boundary', async () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'aiscrub-stream-'));
    const inputPath = path.join(tempDir, 'unicode.txt');
    const outputPath = path.join(tempDir, 'unicode.out.txt');
    try {
      const content = `${'x'.repeat(64 * 1024 - 1)}🙂
\nfinal`;
      fs.writeFileSync(inputPath, content, 'utf8');
      await streamScrubFile({ inputPath, outputPath, quiet: true, enabledDetectorIds: new Set() });
      expect(fs.readFileSync(outputPath)).toEqual(Buffer.from(content, 'utf8'));
    } finally {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  test('rejects stdout streaming so sensitive output has an owned destination', async () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'aiscrub-stream-'));
    const inputPath = path.join(tempDir, 'input.txt');
    try {
      fs.writeFileSync(inputPath, 'safe', 'utf8');
      await expect(streamScrubFile({ inputPath, toStdout: true, quiet: true })).rejects.toThrow('does not support stdout');
    } finally {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  test('removes partial output when a configured block limit fails', async () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'aiscrub-stream-'));
    const inputPath = path.join(tempDir, 'input.txt');
    const outputPath = path.join(tempDir, 'output.txt');
    try {
      fs.writeFileSync(inputPath, 'line longer than limit', 'utf8');
      await expect(streamScrubFile({ inputPath, outputPath, quiet: true, limits: { maxBlockBytes: 4 } })).rejects.toThrow('block limit');
      expect(fs.existsSync(outputPath)).toBe(false);
    } finally {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });
});
