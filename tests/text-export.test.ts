import JSZip from 'jszip';
import { describe, expect, test } from 'vitest';
import { buildTextArchive, buildTextExport } from '../src/lib/textExport';

describe('clean text exports', () => {
  test('preserves reviewed bytes without adding metadata', () => {
    expect(buildTextExport('reviewed\r\ntext', 'txt')).toEqual({
      contents: 'reviewed\r\ntext', mime: 'text/plain;charset=utf-8', filename: 'sanitized.txt',
    });
  });

  test('uses neutral collision-safe names for markdown', () => {
    expect(buildTextExport('body', 'md').filename).toBe('sanitized.md');
    expect(buildTextExport('body ``` code', 'md').contents).toBe('````text\nbody ``` code\n````\n');
  });

  test('builds an inspectable archive with collision-safe neutral entries', async () => {
    const blob = await buildTextArchive([
      { name: 'report.txt', contents: 'one' },
      { name: 'report.txt', contents: 'two' },
    ]);
    const zip = await JSZip.loadAsync(await blob.arrayBuffer());
    expect(Object.keys(zip.files).sort()).toEqual(['01.cleaned.txt', '02.cleaned.txt']);
    expect(await zip.file('01.cleaned.txt')?.async('text')).toBe('one');
    expect(await zip.file('02.cleaned.txt')?.async('text')).toBe('two');
  });
});
