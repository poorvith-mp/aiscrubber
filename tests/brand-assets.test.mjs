import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const asset = (name) => readFile(new URL(`../public/${name}`, import.meta.url));
const pngSize = (source) => ({ width: source.readUInt32BE(16), height: source.readUInt32BE(20) });

test('AIScrubber ships the approved redaction identity', async () => {
  const [logo, cover, favicon, apple, og] = await Promise.all([
    asset('logo-mark.svg'), asset('cover.svg'), asset('favicon.png'), asset('apple-touch-icon.png'), asset('og.png'),
  ]);
  assert.match(logo.toString(), /<title[^>]*>AIScrubber logo<\/title>/);
  assert.match(cover.toString(), /Scrub sensitive data before it reaches an AI\./);
  assert.deepEqual(pngSize(favicon), { width: 32, height: 32 });
  assert.deepEqual(pngSize(apple), { width: 180, height: 180 });
  assert.deepEqual(pngSize(og), { width: 1200, height: 630 });
});
