import {
  Check,
  Download,
  Eye,
  EyeOff,
  Grid,
  Image as ImageIcon,
  Layers,
  MousePointer,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  Square,
  Trash2,
  Undo2,
  UploadCloud,
  ZoomIn,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import {
  applyRedaction,
  exportRedactedImage,
  type RedactionBox,
  type RedactionType,
} from '../lib/mediaRedact';

export function MediaRedactorWorkspace() {
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [fileName, setFileName] = useState<string>('');
  const [boxes, setBoxes] = useState<RedactionBox[]>([]);
  const [history, setHistory] = useState<RedactionBox[][]>([]);
  const [tool, setTool] = useState<RedactionType>('blur');
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPoint, setStartPoint] = useState<{ x: number; y: number } | null>(
    null
  );
  const [currentBox, setCurrentBox] = useState<RedactionBox | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);

  function handleFile(file: File) {
    if (!file.type.startsWith('image/')) return;
    setFileName(file.name);
    const img = new Image();
    img.onload = () => {
      setImage(img);
      setBoxes([]);
      setHistory([]);
    };
    img.src = URL.createObjectURL(file);
  }

  // Render canvas whenever image or boxes change
  useEffect(() => {
    if (!canvasRef.current || !image) return;
    const canvas = canvasRef.current;
    canvas.width = image.naturalWidth || image.width;
    canvas.height = image.naturalHeight || image.height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Draw base image
    ctx.drawImage(image, 0, 0);

    // Draw confirmed redactions
    for (const b of boxes) {
      applyRedaction(ctx, b);
    }

    // Draw in-progress box preview
    if (currentBox) {
      applyRedaction(ctx, currentBox);
      // Draw dashed selection outline
      ctx.strokeStyle = '#10b981';
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 4]);
      ctx.strokeRect(
        currentBox.x,
        currentBox.y,
        currentBox.width,
        currentBox.height
      );
      ctx.setLineDash([]);
    }
  }, [image, boxes, currentBox]);

  function getCanvasCoordinates(e: React.MouseEvent<HTMLCanvasElement>) {
    if (!canvasRef.current) return { x: 0, y: 0 };
    const rect = canvasRef.current.getBoundingClientRect();
    const scaleX = canvasRef.current.width / rect.width;
    const scaleY = canvasRef.current.height / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  }

  function handleMouseDown(e: React.MouseEvent<HTMLCanvasElement>) {
    if (!image) return;
    const coords = getCanvasCoordinates(e);
    setIsDrawing(true);
    setStartPoint(coords);
    setCurrentBox({
      id: `box_${Date.now().toString(36)}`,
      x: coords.x,
      y: coords.y,
      width: 0,
      height: 0,
      type: tool,
    });
  }

  function handleMouseMove(e: React.MouseEvent<HTMLCanvasElement>) {
    if (!isDrawing || !startPoint) return;
    const coords = getCanvasCoordinates(e);
    setCurrentBox({
      id: currentBox?.id || `box_${Date.now().toString(36)}`,
      x: Math.min(startPoint.x, coords.x),
      y: Math.min(startPoint.y, coords.y),
      width: Math.abs(coords.x - startPoint.x),
      height: Math.abs(coords.y - startPoint.y),
      type: tool,
    });
  }

  function handleMouseUp() {
    if (isDrawing && currentBox && currentBox.width > 5 && currentBox.height > 5) {
      setHistory((prev) => [...prev, boxes]);
      setBoxes((prev) => [...prev, currentBox]);
    }
    setIsDrawing(false);
    setStartPoint(null);
    setCurrentBox(null);
  }

  function handleUndo() {
    if (history.length === 0) return;
    const prev = history[history.length - 1];
    setBoxes(prev);
    setHistory((h) => h.slice(0, -1));
  }

  function handleClearAll() {
    if (boxes.length === 0) return;
    setHistory((prev) => [...prev, boxes]);
    setBoxes([]);
  }

  async function handleExport() {
    if (!image) return;
    setIsExporting(true);
    try {
      const blob = await exportRedactedImage(image, boxes);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const base = fileName.replace(/\.[^/.]+$/, '');
      a.download = `${base}_redacted.png`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Export failed', err);
    } finally {
      setIsExporting(false);
    }
  }

  return (
    <div className="workspace-panel">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-[var(--line)]">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="badge-emerald">Visual Redactor</span>
            <span className="text-xs text-[var(--muted)] font-mono">
              Blur · Pixelate · Blackout
            </span>
          </div>
          <h2 className="text-2xl md:text-3xl font-headline font-bold">
            Image & Screenshot Redactor
          </h2>
          <p className="text-sm text-[var(--muted)] mt-1">
            Drag to mask sensitive faces, license plates, private chats, or credentials before sharing images.
          </p>
        </div>

        {image && (
          <div className="flex items-center gap-2 flex-wrap">
            {/* Tool picker */}
            <div className="flex items-center gap-1 bg-[var(--surface-sunken)] p-1 rounded-xl border border-[var(--line)]">
              {(
                [
                  { id: 'blur', label: 'Blur', icon: EyeOff },
                  { id: 'pixelate', label: 'Pixelate', icon: Grid },
                  { id: 'blackout', label: 'Blackout', icon: Square },
                ] as const
              ).map((t) => {
                const Icon = t.icon;
                const active = tool === t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setTool(t.id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg font-bold transition-all ${
                      active
                        ? 'bg-[var(--accent)] text-[var(--accent-ink)]'
                        : 'text-[var(--muted)] hover:text-[var(--text)]'
                    }`}
                  >
                    <Icon size={14} />
                    {t.label}
                  </button>
                );
              })}
            </div>

            {/* Undo & Clear */}
            <button
              type="button"
              onClick={handleUndo}
              disabled={history.length === 0}
              className="btn-secondary text-xs"
              title="Undo last redaction"
            >
              <Undo2 size={14} />
              Undo
            </button>
            <button
              type="button"
              onClick={handleClearAll}
              disabled={boxes.length === 0}
              className="btn-secondary text-xs"
              title="Clear all redactions"
            >
              <Trash2 size={14} />
              Clear
            </button>
          </div>
        )}
      </div>

      {/* Main Canvas / Dropzone Area */}
      {!image ? (
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            const f = e.dataTransfer.files[0];
            if (f) handleFile(f);
          }}
          className="mt-6 p-12 rounded-2xl border-2 border-dashed border-[var(--line)] bg-[var(--surface-sunken)] text-center hover:border-[var(--accent)] transition-all cursor-pointer group"
        >
          <label className="cursor-pointer flex flex-col items-center">
            <div className="w-16 h-16 rounded-full bg-[var(--accent-tint)] flex items-center justify-center text-[var(--accent)] mb-4 group-hover:scale-110 transition-transform">
              <ImageIcon size={32} />
            </div>
            <h3 className="text-lg font-bold mb-1">
              Drag & Drop an Image or Screenshot
            </h3>
            <p className="text-xs text-[var(--muted)] max-w-md mb-4">
              Supports PNG, JPEG, WebP. Click and drag over faces, ID cards, or secret tokens to obscure them.
            </p>
            <span className="btn-primary text-xs font-bold px-5 py-2.5">
              Select Image
            </span>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleFile(f);
              }}
              className="hidden"
            />
          </label>
        </div>
      ) : (
        <div className="mt-6 space-y-4">
          {/* Canvas Wrapper */}
          <div className="relative rounded-xl border border-[var(--line)] bg-[var(--surface-sunken)] overflow-hidden flex items-center justify-center min-h-[450px] max-h-[70vh] p-2">
            <canvas
              ref={canvasRef}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              className="max-w-full max-h-[68vh] object-contain cursor-crosshair rounded shadow-lg"
            />
          </div>

          {/* Action Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-xl bg-[var(--panel)] border border-[var(--line)]">
            <div className="flex items-center gap-3 text-xs text-[var(--muted)]">
              <ShieldCheck size={16} className="text-[var(--accent)]" />
              <span>
                {boxes.length} redaction box{boxes.length === 1 ? '' : 'es'} active. Canvas re-rendered in memory.
              </span>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <button
                type="button"
                onClick={() => setImage(null)}
                className="btn-secondary text-xs"
              >
                Change Image
              </button>

              <button
                type="button"
                onClick={handleExport}
                disabled={isExporting}
                className="btn-primary text-xs font-bold flex items-center gap-2"
              >
                <Download size={14} />
                {isExporting ? 'Exporting...' : 'Export Redacted Image'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
