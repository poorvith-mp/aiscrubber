export type RedactionType = 'blur' | 'pixelate' | 'blackout';

export interface RedactionBox {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  type: RedactionType;
  intensity?: number;
}

export function applyRedaction(
  ctx: CanvasRenderingContext2D,
  box: RedactionBox
) {
  const x = Math.round(Math.min(box.x, box.x + box.width));
  const y = Math.round(Math.min(box.y, box.y + box.height));
  const w = Math.round(Math.abs(box.width));
  const h = Math.round(Math.abs(box.height));

  if (w <= 0 || h <= 0) return;

  ctx.save();

  if (box.type === 'blackout') {
    ctx.fillStyle = '#000000';
    ctx.fillRect(x, y, w, h);
  } else if (box.type === 'pixelate') {
    const pixelSize = Math.max(6, Math.round(w / 16));
    const offCanvas = document.createElement('canvas');
    offCanvas.width = Math.max(1, Math.floor(w / pixelSize));
    offCanvas.height = Math.max(1, Math.floor(h / pixelSize));
    const offCtx = offCanvas.getContext('2d');

    if (offCtx) {
      offCtx.imageSmoothingEnabled = false;
      offCtx.drawImage(ctx.canvas, x, y, w, h, 0, 0, offCanvas.width, offCanvas.height);

      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(offCanvas, 0, 0, offCanvas.width, offCanvas.height, x, y, w, h);
    }
  } else if (box.type === 'blur') {
    // Canvas filter or multi-pass box blur
    const offCanvas = document.createElement('canvas');
    offCanvas.width = w;
    offCanvas.height = h;
    const offCtx = offCanvas.getContext('2d');

    if (offCtx) {
      offCtx.drawImage(ctx.canvas, x, y, w, h, 0, 0, w, h);
      offCtx.filter = 'blur(12px)';
      offCtx.drawImage(offCanvas, 0, 0);

      ctx.drawImage(offCanvas, x, y, w, h);
    }
  }

  ctx.restore();
}

export async function exportRedactedImage(
  sourceImage: HTMLImageElement,
  boxes: RedactionBox[],
  mimeType: string = 'image/png'
): Promise<Blob> {
  const canvas = document.createElement('canvas');
  canvas.width = sourceImage.naturalWidth || sourceImage.width;
  canvas.height = sourceImage.naturalHeight || sourceImage.height;
  const ctx = canvas.getContext('2d');

  if (!ctx) throw new Error('Failed to get 2D rendering context for export');

  // Draw clean source image
  ctx.drawImage(sourceImage, 0, 0);

  // Apply all redaction layers
  for (const box of boxes) {
    applyRedaction(ctx, box);
  }

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error('Failed to export canvas blob'));
      },
      mimeType,
      0.95
    );
  });
}
