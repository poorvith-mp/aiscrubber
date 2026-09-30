import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, test } from 'vitest';

const guides = [
  ['scrub-logs-before-sharing', 'Scrub logs before sharing'],
  ['mask-and-restore-ai-prompts', 'Mask and restore AI prompts'],
  ['hide-private-details-in-text', 'Hide private details in text'],
] as const;

describe('static guide pages', () => {
  test.each(guides)('%s has unique task content, canonical, limitations, and workspace link', (slug, title) => {
    const file = path.join(process.cwd(), 'public', 'guides', slug, 'index.html');
    const html = fs.readFileSync(file, 'utf8');
    expect(html).toContain(`<title>${title}`);
    expect(html).toContain(`https://aiscrubber.poorvithmp.com/guides/${slug}/`);
    expect(html).toContain('Limitations');
    expect(html).toMatch(/#(?:scrub|prompt)\?demo=/);
  });

  test('sitemap contains real guide URLs and no hash-only task URLs', () => {
    const sitemap = fs.readFileSync(path.join(process.cwd(), 'public', 'sitemap.xml'), 'utf8');
    for (const [slug] of guides) expect(sitemap).toContain(`/guides/${slug}/`);
    expect(sitemap).not.toMatch(/<loc>[^<]+#(?:scrub|prompt|watermark|metadata|media)/);
  });
});
