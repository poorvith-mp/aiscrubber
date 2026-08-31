import { readFileSync } from 'node:fs';
import { describe, expect, test } from 'vitest';

describe('published setup instructions', () => {
  test('uses the package subcommand for MCP setup', () => {
    const docs = readFileSync(new URL('../src/components/DocsWorkspace.tsx', import.meta.url), 'utf8');
    expect(docs).toContain('"args": ["-y", "aiscrubber", "mcp"]');
    expect(docs).not.toContain('"args": ["-y", "aiscrubber-mcp"]');
  });
});
