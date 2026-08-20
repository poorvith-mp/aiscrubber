import { afterEach, describe, expect, test, vi } from 'vitest';
import { applyRedaction, exportRedactedImage, type RedactionBox } from '../src/lib/mediaRedact';

function context() {
  return {
    canvas: {},
    save: vi.fn(),
    restore: vi.fn(),
    fillRect: vi.fn(),
    drawImage: vi.fn(),
    fillStyle: '',
    imageSmoothingEnabled: true,
    filter: '',
  } as unknown as CanvasRenderingContext2D;
}

afterEach(() => vi.unstubAllGlobals());

describe('media redaction', () => {
  test('normalizes reverse-drag boxes and paints blackouts', () => {
    const ctx = context();
    applyRedaction(ctx, { id: '1', x: 30, y: 20, width: -10, height: -5, type: 'blackout' });
    expect(ctx.fillRect).toHaveBeenCalledWith(20, 15, 10, 5);
    expect(ctx.restore).toHaveBeenCalledOnce();
  });

  test('renders pixelate and blur layers through offscreen canvases', () => {
    const offCtx = context();
    vi.stubGlobal('document', { createElement: vi.fn(() => ({ width: 0, height: 0, getContext: () => offCtx })) });
    const ctx = context();
    const boxes: RedactionBox[] = [
      { id: 'p', x: 0, y: 0, width: 64, height: 32, type: 'pixelate' },
      { id: 'b', x: 0, y: 0, width: 20, height: 20, type: 'blur' },
      { id: 'z', x: 0, y: 0, width: 0, height: 20, type: 'blackout' },
    ];
    boxes.forEach((box) => applyRedaction(ctx, box));
    expect(offCtx.drawImage).toHaveBeenCalled();
    expect(ctx.drawImage).toHaveBeenCalled();
  });

  test('exports the source with every permanent redaction applied', async () => {
    const ctx = context();
    const output = new Blob(['redacted'], { type: 'image/png' });
    const canvas = { width: 0, height: 0, getContext: () => ctx, toBlob: (callback: (blob: Blob) => void) => callback(output) };
    vi.stubGlobal('document', { createElement: vi.fn(() => canvas) });
    const blob = await exportRedactedImage({ naturalWidth: 100, naturalHeight: 80 } as HTMLImageElement, [
      { id: '1', x: 1, y: 2, width: 3, height: 4, type: 'blackout' },
    ]);
    expect(blob).toBe(output);
    expect(canvas.width).toBe(100);
    expect(canvas.height).toBe(80);
  });

  test('reports canvas setup and encoding failures', async () => {
    vi.stubGlobal('document', { createElement: vi.fn(() => ({ getContext: () => null })) });
    await expect(exportRedactedImage({ width: 5, height: 6 } as HTMLImageElement, [])).rejects.toThrow('2D rendering context');

    const ctx = context();
    vi.stubGlobal('document', { createElement: vi.fn(() => ({ getContext: () => ctx, toBlob: (callback: (blob: null) => void) => callback(null) })) });
    await expect(exportRedactedImage({ width: 5, height: 6 } as HTMLImageElement, [])).rejects.toThrow('Failed to export');
  });

  test('restores state when an offscreen context is unavailable', () => {
    vi.stubGlobal('document', { createElement: vi.fn(() => ({ width: 0, height: 0, getContext: () => null })) });
    const ctx = context();
    applyRedaction(ctx, { id: 'p', x: 0, y: 0, width: 10, height: 10, type: 'pixelate' });
    applyRedaction(ctx, { id: 'b', x: 0, y: 0, width: 10, height: 10, type: 'blur' });
    expect(ctx.restore).toHaveBeenCalledTimes(2);
  });
});
