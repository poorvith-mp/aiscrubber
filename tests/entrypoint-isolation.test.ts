import { afterEach, describe, expect, test } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const directories: string[] = [];
afterEach(() => { for (const directory of directories.splice(0)) fs.rmSync(directory, { recursive: true, force: true }); });
const rule = { id: 'slow', label: 'Slow rule', token: 'CUSTOM', patternString: '(a+)+$', isRegex: true, enabled: true };

describe('actual text entrypoint deadlines', () => {
  test('CLI kills a pathological regex rather than blocking its parent forever', () => {
    const cwd = fs.mkdtempSync(path.join(os.tmpdir(), 'aiscrub-deadline-'));
    directories.push(cwd);
    fs.writeFileSync(path.join(cwd, 'rules.json'), JSON.stringify({ version: 1, customRules: [rule] }));
    const result = spawnSync(process.execPath, [path.resolve('bin/aiscrubber.js'), 'scrub', 'a'.repeat(50) + '!', '--config', 'rules.json'], { cwd, encoding: 'utf8', timeout: 8_000 });
    expect(result.error).toBeUndefined();
    expect(result.status).toBe(2);
    expect(result.stderr).toContain('5 seconds');
    expect(result.stdout).not.toContain('a'.repeat(50));
  }, 10_000);

  test('MCP reports a deadline error and stays responsive to another request', () => {
    const messages = [
      { jsonrpc: '2.0', id: 1, method: 'tools/call', params: { name: 'scrub_text', arguments: { text: 'a'.repeat(50) + '!', customRules: [rule] } } },
      { jsonrpc: '2.0', id: 2, method: 'tools/list' },
    ];
    const result = spawnSync(process.execPath, [path.resolve('bin/aiscrubber-mcp.js')], { input: messages.map((message) => JSON.stringify(message)).join('\n') + '\n', encoding: 'utf8', timeout: 8_000 });
    expect(result.error).toBeUndefined();
    const responses = result.stdout.trim().split('\n').map((line) => JSON.parse(line));
    expect(responses.find((response) => response.id === 2)?.result.tools.length).toBeGreaterThan(0);
    expect(responses.find((response) => response.id === 1)?.result.isError).toBe(true);
    expect(result.stdout).not.toContain('a'.repeat(50));
  }, 10_000);
});
