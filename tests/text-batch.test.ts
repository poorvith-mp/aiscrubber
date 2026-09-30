import { describe, expect, test, vi } from 'vitest';
import { processTextBatch, validateBatchSelection } from '../src/lib/textBatch';

describe('text batch limits', () => {
  test('uses stable neutral IDs without a Web Crypto global', async () => {
    vi.stubGlobal('crypto', undefined);
    try {
      const result = await processTextBatch([{ name: 'private.txt', size: 1, text: 'a' }], async (item) => item.text!);
      expect(result[0].id).toBe('text-1');
      expect(result[0].output).toBe('a');
    } finally { vi.unstubAllGlobals(); }
  });
  test('accepts exactly 20 files and rejects 21 without dropping any', () => {
    expect(() => validateBatchSelection(Array.from({ length: 20 }, (_, index) => ({ name: `${index}.txt`, size: 1 })))).not.toThrow();
    expect(() => validateBatchSelection(Array.from({ length: 21 }, () => ({ name: 'same.txt', size: 1 })))).toThrow('20 files');
  });

  test('rejects oversized files, totals, and unsupported extensions', () => {
    expect(() => validateBatchSelection([{ name: 'big.txt', size: 5 * 1024 * 1024 + 1 }])).toThrow('5 MiB');
    expect(() => validateBatchSelection(Array.from({ length: 5 }, (_, index) => ({ name: `${index}.txt`, size: 5 * 1024 * 1024 })))).toThrow('20 MiB');
    expect(() => validateBatchSelection([{ name: 'image.png', size: 1 }])).toThrow('text files');
    expect(() => validateBatchSelection([{ name: 'code.ts', size: 1 }])).toThrow('text files');
    expect(() => validateBatchSelection(Array.from({ length: 4 }, () => ({ name: 'a.log', size: 5 * 1024 * 1024 })))).not.toThrow();
  });

  test('processes sequentially, keeps duplicate names distinct, and contains mixed failures', async () => {
    const order: string[] = [];
    const result = await processTextBatch([
      { name: 'same.txt', size: 1, text: 'a' },
      { name: 'same.txt', size: 1, text: 'b' },
      { name: 'bad.md', size: 1, text: 'bad' },
    ], async (item) => {
      order.push(item.text);
      if (item.text === 'bad') throw new Error('failure');
      return item.text.toUpperCase();
    });
    expect(order).toEqual(['a', 'b', 'bad']);
    expect(result.map((item) => item.status)).toEqual(['review', 'review', 'failed']);
    expect(new Set(result.map((item) => item.id)).size).toBe(3);
  });
});
