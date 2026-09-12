import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { describe, expect, test } from 'vitest';
import { streamScrubFile } from '../bin/lib/streamScrub.js';
import { scrubText, defaultDetectors } from '../src/lib/scrub';

const all = new Set(defaultDetectors.map((d) => d.id));

describe('Streaming scrub', () => {
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

  test('100 MiB synthetic stream completes with peak RSS < 400 MiB', async () => {
    if (process.env.CI_FAST === '1') return;

    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'aiscrub-100m-'));
    const inputPath = path.join(tempDir, 'big.log');
    const outputPath = path.join(tempDir, 'big.clean.log');

    try {
      // Generate 100 MiB synthetic file in chunks
      const chunk = '2026-09-12 10:00:00 INFO [worker-1] Request processed user=alice@example.com ip=10.0.0.1 status=200\n'.repeat(500);
      const targetBytes = 100 * 1024 * 1024;
      let written = 0;
      const fd = fs.openSync(inputPath, 'w');
      while (written < targetBytes) {
        fs.writeSync(fd, chunk);
        written += Buffer.byteLength(chunk);
      }
      fs.closeSync(fd);

      let peakRss = 0;
      const timer = setInterval(() => {
        const rss = process.memoryUsage().rss;
        if (rss > peakRss) peakRss = rss;
      }, 50);

      const result = await streamScrubFile({ inputPath, outputPath, quiet: true });
      clearInterval(timer);

      expect(result.totalRedactions).toBeGreaterThan(0);
      const peakRssMb = peakRss / (1024 * 1024);
      expect(peakRssMb).toBeLessThan(400);
    } finally {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  }, 120000);
});
