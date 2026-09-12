import { spawnSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, test } from 'vitest';
import { enhanceAndMaskPrompt, reconstructAiResponse } from '../src/lib/promptEnhancer';
import { defaultDetectors, scrubText } from '../src/lib/scrub';

const fixture = 'Email a@example.com card 4111 1111 1111 1111 Aadhaar 2345 6789 0124';

describe('shared scrub engine surfaces', () => {
  test('text inspection does not invent C2PA provenance from ordinary words', () => {
    const result = spawnSync(process.execPath, ['bin/aiscrubber.js', 'inspect', 'OpenAI c2pa caPI jumbo Adobe', '--json'], { encoding: 'utf8' });
    expect(result.status).toBe(0);
    expect(JSON.parse(result.stdout).details.c2pa).toBeUndefined();
  });

  test('CLI restoration preserves literal dollar replacement patterns', () => {
    const temp = mkdtempSync(join(tmpdir(), 'aiscrubber-'));
    try {
      const key = join(temp, 'key.json');
      const output = join(temp, 'restored.txt');
      writeFileSync(key, JSON.stringify({ variables: { '{{SECRET_1}}': 'value$&$$tail' } }));
      const result = spawnSync(process.execPath, ['bin/aiscrubber.js', 'unmask', '{{SECRET_1}}', '--key', key, '-o', output], { encoding: 'utf8' });
      expect(result.status).toBe(0);
      expect(readFileSync(output, 'utf8')).toBe('value$&$$tail');
    } finally {
      rmSync(temp, { recursive: true, force: true });
    }
  });

  test('CLI refuses unsafe PDF rewriting and reports invalid commands as errors', () => {
    const temp = mkdtempSync(join(tmpdir(), 'aiscrubber-'));
    try {
      const input = join(temp, 'draft.pdf');
      writeFileSync(input, '%PDF-1.4 /Author (Private)');
      const result = spawnSync(process.execPath, ['bin/aiscrubber.js', 'strip-metadata', input], { encoding: 'utf8' });
      expect(result.status).toBe(1);
      expect(existsSync(join(temp, 'draft_sanitized.pdf'))).toBe(false);
      expect(spawnSync(process.execPath, ['bin/aiscrubber.js', 'bad-command']).status).toBe(1);
    } finally {
      rmSync(temp, { recursive: true, force: true });
    }
  });
  test('browser adapter, CLI, and MCP emit the same scrubbed text', () => {
    const browser = scrubText(fixture, new Set(defaultDetectors.map(({ id }) => id))).text;
    const cli = spawnSync(process.execPath, ['bin/aiscrubber.js', 'scrub', fixture, '--json'], { cwd: process.cwd(), encoding: 'utf8' });
    expect(cli.status).toBe(0);
    expect(JSON.parse(cli.stdout).scrubbed).toBe(browser);

    const request = JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'tools/call', params: { name: 'scrub_text', arguments: { text: fixture } } });
    const mcp = spawnSync(process.execPath, ['bin/aiscrubber-mcp.js'], { cwd: process.cwd(), input: request, encoding: 'utf8' });
    expect(mcp.status).toBe(0);
    const response = JSON.parse(mcp.stdout.trim());
    expect(JSON.parse(response.result.content[0].text).scrubbed).toBe(browser);
  });

  test('prompt masking uses the shared detector vocabulary and reconstructs exactly', () => {
    const raw = `Email a@example.com and use ${['sk', '-proj-', 'abcdefghijklmnopqrstuvwxyz123456'].join('')}`;
    const enhanced = enhanceAndMaskPrompt(raw, 'general');
    expect(enhanced.sanitizedPrompt).toBe('Email {{EMAIL_1}} and use {{SECRET_1}}');
    expect(reconstructAiResponse(enhanced.sanitizedPrompt, enhanced.sessionKey)).toEqual({
      reconstructedText: raw,
      restoredCount: 2,
      unresolvedPlaceholders: [],
    });
  });

  test('formats each prompt goal while preserving placeholders and reports unresolved tokens', () => {
    const headings = {
      coding: '[TASK DIRECTIVE]',
      debugging: '[DEBUGGING DIRECTIVE]',
      analysis: '[ANALYTICAL DIRECTIVE]',
      writing: '[EDITORIAL DIRECTIVE]',
      general: '[OBJECTIVE]',
    } as const;
    for (const [goal, heading] of Object.entries(headings)) {
      const result = enhanceAndMaskPrompt('Contact a@example.com', goal as keyof typeof headings, [
        { placeholder: 'PROJECT', original: 'Contact' },
        { placeholder: '', original: 'ignored' },
      ]);
      expect(result.enhancedPrompt).toContain(heading);
      expect(result.enhancedPrompt).toContain('{{PROJECT}}');
      expect(result.enhancedPrompt).toContain('{{EMAIL_1}}');
    }
    expect(reconstructAiResponse('{{KNOWN}} {{UNKNOWN}}', [
      { placeholder: '{{KNOWN}}', original: 'value', category: 'custom' },
    ])).toEqual({
      reconstructedText: 'value {{UNKNOWN}}',
      restoredCount: 1,
      unresolvedPlaceholders: ['{{UNKNOWN}}'],
    });
  });

  test('scrubs 100 KB in less than 500 ms', () => {
    const source = 'a@example.com 2001:db8::1 4111 1111 1111 1111\n'.repeat(2_000).slice(0, 100_000);
    const started = performance.now();
    const result = scrubText(source, new Set(defaultDetectors.map(({ id }) => id)));
    expect(result.totalRedactions).toBeGreaterThan(1_000);
    expect(performance.now() - started).toBeLessThan(500);
  });

  test('CLI metadata stripping writes a sanitized PNG instead of reporting a no-op', () => {
    const temp = mkdtempSync(join(tmpdir(), 'aiscrubber-'));
    try {
      const input = join(temp, 'pixel.png');
      const output = join(temp, 'pixel_sanitized.png');
      const base = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=', 'base64');
      const iend = base.subarray(base.length - 12);
      const body = base.subarray(0, base.length - 12);
      const text = Buffer.from('Author\0Private');
      const chunk = Buffer.alloc(12 + text.length);
      chunk.writeUInt32BE(text.length, 0);
      chunk.write('tEXt', 4, 'ascii');
      text.copy(chunk, 8);
      writeFileSync(input, Buffer.concat([body, chunk, iend]));

      const cli = spawnSync(process.execPath, ['bin/aiscrubber.js', 'strip-metadata', input], {
        cwd: process.cwd(),
        encoding: 'utf8',
      });
      expect(cli.status).toBe(0);
      expect(readFileSync(output).includes(Buffer.from('tEXt'))).toBe(false);
      writeFileSync(output, 'existing output');
      const repeated = spawnSync(process.execPath, ['bin/aiscrubber.js', 'strip-metadata', input], { encoding: 'utf8' });
      expect(repeated.status).toBe(1);
      expect(readFileSync(output, 'utf8')).toBe('existing output');
    } finally {
      rmSync(temp, { recursive: true, force: true });
    }
  });
});
