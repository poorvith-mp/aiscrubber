import { spawnSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, test } from 'vitest';
import { handleMessage } from '../bin/lib/mcpServer.js';

const cli = join(process.cwd(), 'bin', 'aiscrubber.js');

function callTool(name: string, args: Record<string, unknown>) {
  return handleMessage({ jsonrpc: '2.0', id: 1, method: 'tools/call', params: { name, arguments: args } });
}

describe('safe output boundaries', () => {
  test('scrub JSON contains numeric counts and no restoration dictionary', () => {
    const original = 'a@example.com';
    const run = spawnSync(process.execPath, [cli, 'scrub', original, '--json'], { encoding: 'utf8' });
    expect(run.status).toBe(0);
    const data = JSON.parse(run.stdout);
    expect(data.scrubbed).toBe('[EMAIL_1]');
    expect(data.counts.email).toBe(1);
    expect(data.totalReplaced).toBe(1);
    expect(data.rulesSource).toBe('defaults');
    expect(JSON.stringify({ counts: data.counts, rulesSource: data.rulesSource })).not.toContain(original);
    expect(data).not.toHaveProperty('mappings');
  });

  test('mask requires an explicit new key path and preserves existing files', () => {
    const temp = mkdtempSync(join(tmpdir(), 'aiscrub-output-'));
    try {
      const missing = spawnSync(process.execPath, [cli, 'mask', 'a@example.com'], { cwd: temp, encoding: 'utf8' });
      expect(missing.status).toBe(2);
      expect(existsSync(join(temp, 'session.aiscrub.json'))).toBe(false);

      const key = join(temp, 'key.json');
      const output = join(temp, 'masked.txt');
      writeFileSync(key, 'existing-key');
      writeFileSync(output, 'existing-output');
      const conflict = spawnSync(process.execPath, [cli, 'mask', 'a@example.com', '--key', key, '--output', output], { cwd: temp, encoding: 'utf8' });
      expect(conflict.status).toBe(2);
      expect(readFileSync(key, 'utf8')).toBe('existing-key');
      expect(readFileSync(output, 'utf8')).toBe('existing-output');
    } finally {
      rmSync(temp, { recursive: true, force: true });
    }
  });

  test('mask writes a v2 private key only when explicitly requested', () => {
    const temp = mkdtempSync(join(tmpdir(), 'aiscrub-output-'));
    try {
      const key = join(temp, 'key.json');
      const output = join(temp, 'masked.txt');
      const run = spawnSync(process.execPath, [cli, 'mask', 'a@example.com', '--key', key, '--output', output], { cwd: temp, encoding: 'utf8' });
      expect(run.status).toBe(0);
      expect(readFileSync(output, 'utf8')).toBe('{{EMAIL_1}}');
      expect(JSON.parse(readFileSync(key, 'utf8'))).toEqual({
        format: 'aiscrubber-session', version: 2,
        variables: [{ placeholder: '{{EMAIL_1}}', original: 'a@example.com', detectorId: 'email' }],
      });
    } finally {
      rmSync(temp, { recursive: true, force: true });
    }
  });

  test('MCP requires explicit flags before returning or restoring originals', async () => {
    const hidden = await callTool('mask_prompt', { prompt: 'a@example.com' });
    const hiddenData = JSON.parse(hidden.result.content[0].text);
    expect(hiddenData.masked).toBe('{{EMAIL_1}}');
    expect(hiddenData).not.toHaveProperty('sessionKey');

    const included = await callTool('mask_prompt', { prompt: 'a@example.com', includeSessionKey: true });
    const includedData = JSON.parse(included.result.content[0].text);
    expect(includedData.sessionKey.variables[0].original).toBe('a@example.com');

    const denied = await callTool('unmask_response', {
      ai_response: '{{EMAIL_1}}',
      session_key: includedData.sessionKey,
    });
    expect(denied.result.isError).toBe(true);
    expect(JSON.stringify(denied)).not.toContain('a@example.com');

    const allowed = await callTool('unmask_response', {
      ai_response: '{{EMAIL_1}}',
      session_key: includedData.sessionKey,
      allowSensitiveOutput: true,
    });
    expect(JSON.parse(allowed.result.content[0].text).unmasked).toBe('a@example.com');
  });
});
