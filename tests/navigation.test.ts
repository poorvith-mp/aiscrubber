import { describe, expect, test } from 'vitest';
import { NAV_GROUPS, viewForShortcut, viewFromHash } from '../src/lib/navigation';

describe('navigation model', () => {
  test('organizes every route into task-based groups', () => {
    expect(NAV_GROUPS.map(({ label }) => label)).toEqual(['Text', 'Images & Files', 'Site']);
    expect(NAV_GROUPS.flatMap(({ items }) => items.map(({ id }) => id))).toEqual([
      'scrub', 'prompt', 'watermark', 'metadata', 'media', 'home', 'docs', 'legal', 'about',
    ]);
  });

  test('parses known hashes and defaults unknown routes to home', () => {
    expect(viewFromHash('#metadata')).toBe('metadata');
    expect(viewFromHash('#nope')).toBe('home');
    expect(viewFromHash('')).toBe('home');
  });

  test('resolves shortcuts unless focus is in an editable control', () => {
    expect(viewForShortcut('2', false)).toBe('prompt');
    expect(viewForShortcut('D', false)).toBe('docs');
    expect(viewForShortcut('2', true)).toBeNull();
    expect(viewForShortcut('?', false)).toBeNull();
  });
});
