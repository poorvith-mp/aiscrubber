import { spawnSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import assert from 'node:assert/strict';

const root = new URL('..', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');
const temp = mkdtempSync(join(tmpdir(), 'aiscrubber-package-smoke-'));
const npm = process.platform === 'win32' ? (process.env.ComSpec || 'cmd.exe') : 'npm';
const npmPrefix = process.platform === 'win32' ? ['/d', '/s', '/c', 'npm'] : [];

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    cwd: root,
    encoding: 'utf8',
    maxBuffer: 20 * 1024 * 1024,
    ...options,
  });
  if (result.error) throw result.error;
  return result;
}

try {
  const packed = run(npm, [...npmPrefix, 'pack', '--pack-destination', temp, '--json']);
  assert.equal(packed.status, 0, packed.stderr || packed.stdout);
  const packResult = JSON.parse(packed.stdout);
  assert.equal(packResult.length, 1);

  const tarball = join(temp, packResult[0].filename);
  assert.ok(existsSync(tarball), 'npm pack did not produce the reported tarball');
  const extracted = run('tar', ['-xzf', packResult[0].filename], { cwd: temp });
  assert.equal(extracted.status, 0, extracted.stderr || extracted.stdout);

  const packageRoot = join(temp, 'package');
  const cli = join(packageRoot, 'bin', 'aiscrubber.js');
  const mcp = join(packageRoot, 'bin', 'aiscrubber-mcp.js');
  for (const required of [
    cli,
    mcp,
    join(packageRoot, 'src', 'lib', 'scrubCore.js'),
    join(packageRoot, 'src', 'lib', 'sessionCore.js'),
    join(packageRoot, 'src', 'lib', 'rulesCore.js'),
  ]) assert.ok(existsSync(required), `packed file missing: ${required}`);

  const version = run(process.execPath, [cli, '--version'], { cwd: temp });
  assert.equal(version.status, 0, version.stderr);
  assert.match(version.stdout, /3\.0\.0/);

  const help = run(process.execPath, [cli, '--help'], { cwd: temp });
  assert.equal(help.status, 0, help.stderr);
  assert.match(help.stdout, /scrub/);
  assert.match(help.stdout, /mask/);
  assert.match(help.stdout, /check/);

  const original = 'Contact pack-smoke@example.com with token sk-live-1234567890abcdef.';
  const input = join(temp, 'input.txt');
  const masked = join(temp, 'masked.txt');
  const key = join(temp, 'session.aiscrub.json');
  const restored = join(temp, 'restored.txt');
  writeFileSync(input, original, 'utf8');

  const scrub = run(process.execPath, [cli, 'scrub', input, '--json'], { cwd: temp });
  assert.equal(scrub.status, 0, scrub.stderr);
  const scrubJson = JSON.parse(scrub.stdout);
  assert.equal(typeof scrubJson.counts.email, 'number');
  assert.equal(Object.hasOwn(scrubJson, 'mappings'), false);
  assert.equal(scrub.stdout.includes('pack-smoke@example.com'), false);

  const mask = run(process.execPath, [cli, 'mask', input, '--key', key, '--output', masked], { cwd: temp });
  assert.equal(mask.status, 0, mask.stderr || mask.stdout);
  assert.ok(existsSync(key));
  assert.ok(existsSync(masked));
  assert.equal(readFileSync(masked, 'utf8').includes('pack-smoke@example.com'), false);

  const unmask = run(process.execPath, [cli, 'unmask', masked, '--key', key, '--output', restored], { cwd: temp });
  assert.equal(unmask.status, 0, unmask.stderr || unmask.stdout);
  assert.equal(readFileSync(restored, 'utf8'), original);

  const check = run(process.execPath, [cli, 'check', input, '--json'], { cwd: temp });
  assert.equal(check.status, 1, check.stderr || check.stdout);
  const checkJson = JSON.parse(check.stdout);
  assert.ok(checkJson.summary.findings > 0);
  assert.equal(check.stdout.includes('pack-smoke@example.com'), false);

  const mcpEof = run(process.execPath, [mcp], { cwd: temp, input: '' });
  assert.equal(mcpEof.status, 0, mcpEof.stderr || mcpEof.stdout);

  console.log(JSON.stringify({
    package: packResult[0].filename,
    files: packResult[0].files.length,
    version: '3.0.0',
    smokes: ['help', 'scrub', 'mask', 'unmask', 'check', 'mcp-eof'],
  }, null, 2));
} finally {
  rmSync(temp, { recursive: true, force: true });
}
