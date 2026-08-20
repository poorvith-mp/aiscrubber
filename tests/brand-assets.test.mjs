import { readFile } from 'node:fs/promises';
import { describe, expect, test } from 'vitest';

const asset = (name) => readFile(new URL(`../public/${name}`, import.meta.url));
const pngSize = (source) => ({ width: source.readUInt32BE(16), height: source.readUInt32BE(20) });

describe('brand assets', () => {
test('AIScrubber ships the approved redaction identity', async () => {
  const [logo, cover, favicon, apple, og] = await Promise.all([
    asset('logo-mark.svg'), asset('cover.svg'), asset('favicon.png'), asset('apple-touch-icon.png'), asset('og.png'),
  ]);
  expect(logo.toString()).toMatch(/<title[^>]*>AIScrubber logo<\/title>/);
  expect(cover.toString()).toMatch(/Scrub sensitive data before it reaches an AI\./);
  expect(pngSize(favicon)).toEqual({ width: 32, height: 32 });
  expect(pngSize(apple)).toEqual({ width: 180, height: 180 });
  expect(pngSize(og)).toEqual({ width: 1200, height: 630 });
});
});
