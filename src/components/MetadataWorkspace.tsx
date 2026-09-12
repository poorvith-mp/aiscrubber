import JSZip from 'jszip';
import {
  AlertTriangle,
  Archive,
  ArrowRight,
  Camera,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Clipboard,
  Download,
  Edit3,
  Eye,
  FileCheck,
  FileSpreadsheet,
  FileText,
  HelpCircle,
  Layers,
  Lock,
  MapPin,
  Music,
  Plus,
  RefreshCw,
  Save,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Trash2,
  Upload,
  UploadCloud,
  X,
  Zap,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import {
  applyMetadataEdits,
  parseFileMetadata,
  stripMetadataUniversal,
  type FileMetadataAnalysis,
  type MetadataField,
} from '../lib/metadata';

export interface BatchFileItem {
  id: string;
  file: File;
  analysis: FileMetadataAnalysis | null;
  status: 'analyzing' | 'ready' | 'processing' | 'done' | 'error';
  cleanBlob: Blob | null;
  editedBlob: Blob | null;
  error?: string;
}

export function MetadataWorkspace() {
  const [items, setItems] = useState<BatchFileItem[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isBatchProcessing, setIsBatchProcessing] = useState(false);
  const [progress, setProgress] = useState<{ current: number; total: number }>({ current: 0, total: 0 });
  const [activeTab, setActiveTab] = useState<'view' | 'edit' | 'strip'>('view');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [showBulkEditModal, setShowBulkEditModal] = useState(false);
  const [isZipping, setIsZipping] = useState(false);

  // Single Item Edit State
  const [editFields, setEditFields] = useState<Record<string, string>>({
    Author: '',
    Title: '',
    Copyright: '',
    Software: '',
  });
  // Bulk Edit State
  const [bulkFields, setBulkFields] = useState({
    Author: '',
    Title: '',
    Software: '',
    Copyright: '',
  });

  const activeItem = useMemo(() => {
    return items.find((it) => it.id === selectedId) || items[0] || null;
  }, [items, selectedId]);

  // Handle Bulk Files Selection / Drop
  async function handleFilesSelected(fileList: FileList | File[]) {
    const newFiles = Array.from(fileList).filter((file) => /^(image\/(png|jpeg|webp))$/.test(file.type) || /\.(png|jpe?g|webp)$/i.test(file.name));
    if (newFiles.length === 0) return;

    setStatusMessage(null);

    // Create placeholders
    const newItems: BatchFileItem[] = newFiles.map((f) => ({
      id: `${f.name}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      file: f,
      analysis: null,
      status: 'analyzing',
      cleanBlob: null,
      editedBlob: null,
    }));

    setItems((prev) => [...prev, ...newItems]);
    if (!selectedId && newItems.length > 0) {
      setSelectedId(newItems[0].id);
    }

    // Analyze each file in parallel
    for (const it of newItems) {
      try {
        const parsed = await parseFileMetadata(it.file);
        setItems((prev) =>
          prev.map((item) =>
            item.id === it.id ? { ...item, analysis: parsed, status: 'ready' } : item
          )
        );

        // Pre-fill if single item
        if (newItems.length === 1 && it.id === newItems[0].id) {
          syncSingleItemEditor(parsed);
        }
      } catch (err) {
        console.error('Failed to parse metadata for file:', it.file.name, err);
        setItems((prev) =>
          prev.map((item) =>
            item.id === it.id ? { ...item, status: 'error', error: 'Failed to parse' } : item
          )
        );
      }
    }
  }

  function syncSingleItemEditor(parsed: FileMetadataAnalysis) {
    const authorField = parsed.fields.find(
      (f) => f.category === 'author' || f.tag.includes('Artist') || f.tag.includes('Author')
    );
    const titleField = parsed.fields.find(
      (f) => f.tag.includes('Title') || f.tag.includes('ImageDescription')
    );
    const softwareField = parsed.fields.find(
      (f) => f.tag.includes('Software') || f.tag.includes('Creator')
    );
    const copyField = parsed.fields.find((f) => f.tag.includes('Copyright'));

    const initialAuthor = authorField?.value || '';
    const initialTitle = titleField?.value || '';
    const initialSoftware = softwareField?.value || '';
    const initialCopyright = copyField?.value || '';

    setEditFields({
      Author: initialAuthor,
      Title: initialTitle,
      Software: initialSoftware,
      Copyright: initialCopyright,
    });
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFilesSelected(e.dataTransfer.files);
    }
  }

  function selectSingleItem(item: BatchFileItem) {
    setSelectedId(item.id);
    if (item.analysis) {
      syncSingleItemEditor(item.analysis);
    }
  }

  function removeItem(id: string) {
    setItems((prev) => prev.filter((it) => it.id !== id));
    if (selectedId === id) {
      const remaining = items.filter((it) => it.id !== id);
      setSelectedId(remaining.length > 0 ? remaining[0].id : null);
    }
  }

  function clearAllItems() {
    setItems([]);
    setSelectedId(null);
    setStatusMessage(null);
  }

  // 1-Click Batch Sanitizer (Strip All C2PA & EXIF)
  async function handleBatchSanitizeAll() {
    if (items.length === 0) return;
    setIsBatchProcessing(true);
    setProgress({ current: 0, total: items.length });
    setStatusMessage(null);

    let completed = 0;
    const updatedItems = [...items];

    for (let i = 0; i < updatedItems.length; i++) {
      const item = updatedItems[i];
      try {
        setItems((prev) =>
          prev.map((it, idx) => (idx === i ? { ...it, status: 'processing' } : it))
        );

        const cleanBlob = await stripMetadataUniversal(item.file);
        if (cleanBlob === item.file) throw new Error('Image could not be sanitized');
        updatedItems[i].cleanBlob = cleanBlob;
        updatedItems[i].status = 'done';

        setItems((prev) =>
          prev.map((it, idx) =>
            idx === i ? { ...it, cleanBlob, status: 'done' } : it
          )
        );
      } catch (err) {
        console.error('Failed to sanitize file:', item.file.name, err);
        updatedItems[i].status = 'error';
        setItems((prev) =>
          prev.map((it, idx) =>
            idx === i ? { ...it, status: 'error', error: 'Sanitization error' } : it
          )
        );
      }
      completed++;
      setProgress({ current: completed, total: items.length });
    }

    setIsBatchProcessing(false);
    setStatusMessage(`Sanitized ${updatedItems.filter((item) => item.status === 'done').length} of ${items.length} image(s). Check failed items before exporting.`);
  }

  // Apply standard metadata edits to all supported images.
  async function handleApplyBulkEdits() {
    if (items.length === 0) return;
    setIsBatchProcessing(true);
    setShowBulkEditModal(false);
    setProgress({ current: 0, total: items.length });

    let completed = 0;
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      try {
        setItems((prev) =>
          prev.map((it, idx) => (idx === i ? { ...it, status: 'processing' } : it))
        );

        const editedBlob = await applyMetadataEdits(item.file, {
          Author: bulkFields.Author,
          Title: bulkFields.Title || item.file.name.replace(/\.[^/.]+$/, ''),
          Software: bulkFields.Software,
          Copyright: bulkFields.Copyright,
        });
        if (editedBlob === item.file) throw new Error('Metadata editing is supported for JPEG and PNG only');

        setItems((prev) =>
          prev.map((it, idx) =>
            idx === i ? { ...it, editedBlob, cleanBlob: null, status: 'done' } : it
          )
        );
      } catch (err) {
        console.error('Error applying bulk edits to:', item.file.name, err);
        setItems((prev) => prev.map((it) => it.id === item.id ? { ...it, status: 'error', error: 'Editing failed or unsupported format' } : it));
      }
      completed++;
      setProgress({ current: completed, total: items.length });
    }

    setIsBatchProcessing(false);
    setStatusMessage('Batch edit finished. JPEG and PNG support editing; check each file status before exporting.');
  }

  // Download All as ZIP archive
  async function handleDownloadAllZip() {
    if (items.length === 0) return;
    setIsZipping(true);

    try {
      const zip = new JSZip();

      for (const item of items) {
        const targetBlob = item.cleanBlob || item.editedBlob || null;
        if (targetBlob) {
          const ext = item.file.name.split('.').pop();
          const base = item.file.name.replace(/\.[^/.]+$/, '');
          const suffix = item.cleanBlob ? '_sanitized' : '_custom_metadata';
          zip.file(`${base}${suffix}.${ext}`, targetBlob);
        } else {
          // If not processed yet, strip on the fly for the zip
          const cleanBlob = await stripMetadataUniversal(item.file);
          if (cleanBlob === item.file) throw new Error('Image could not be sanitized');
          const ext = item.file.name.split('.').pop();
          const base = item.file.name.replace(/\.[^/.]+$/, '');
          zip.file(`${base}_sanitized.${ext}`, cleanBlob);
        }
      }

      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(zipBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `aiscrubber_batch_${Date.now()}.zip`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      alert('Error creating ZIP archive');
      console.error(err);
    } finally {
      setIsZipping(false);
    }
  }

  // Download single item clean
  async function handleDownloadSingleClean(item: BatchFileItem) {
    try {
    let targetBlob = item.cleanBlob;
    if (!targetBlob) {
      targetBlob = await stripMetadataUniversal(item.file);
    }
    if (targetBlob === item.file) throw new Error('Image could not be sanitized');
    const url = URL.createObjectURL(targetBlob);
    const a = document.createElement('a');
    a.href = url;
    const ext = item.file.name.split('.').pop();
    const base = item.file.name.replace(/\.[^/.]+$/, '');
    a.download = `${base}_sanitized.${ext}`;
    a.click();
    URL.revokeObjectURL(url);
    } catch {
      setStatusMessage('Unable to sanitize this image. No file was downloaded.');
    }
  }

  // Save single item edits
  async function handleSaveSingleEdits() {
    if (!activeItem) return;
    try {
      const modifiedBlob = await applyMetadataEdits(activeItem.file, {
        Author: editFields.Author,
        Title: editFields.Title,
        Software: editFields.Software,
        Copyright: editFields.Copyright,
      });
      if (modifiedBlob === activeItem.file) throw new Error('Metadata editing is supported for JPEG and PNG only');

      setItems((prev) =>
        prev.map((it) =>
          it.id === activeItem.id ? { ...it, editedBlob: modifiedBlob, cleanBlob: null, status: 'done' } : it
        )
      );

      setStatusMessage(
        `Updated standard metadata for ${activeItem.file.name}. Existing C2PA-compatible markers were removed.`
      );

      const url = URL.createObjectURL(modifiedBlob);
      const a = document.createElement('a');
      a.href = url;
      const ext = activeItem.file.name.split('.').pop();
      const base = activeItem.file.name.replace(/\.[^/.]+$/, '');
      a.download = `${base}_custom_metadata.${ext}`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      alert('Error applying metadata edits');
      console.error(err);
    }
  }

  const totalC2paDetected = items.filter((it) => it.analysis?.c2pa?.hasManifest).length;
  const totalGpsDetected = items.filter((it) => it.analysis?.gpsCoordinates).length;

  return (
    <div className="workspace-panel space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-[var(--line)]">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="badge-emerald">Local Metadata Desk</span>
            <span className="text-xs text-[var(--muted)] font-mono">
              Multi-Upload · Inspect · Strip · ZIP Export
            </span>
          </div>
          <h2 className="text-2xl md:text-3xl font-headline font-bold">
            Image Metadata Desk
          </h2>
          <p className="text-sm text-[var(--muted)] mt-1">
            Inspect and remove supported EXIF, GPS, PNG text, and C2PA-compatible metadata markers from images in browser memory. Marker presence is detected; cryptographic signature verification is not performed.
          </p>
        </div>

        {items.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap">
            <label className="btn-secondary text-xs flex items-center gap-1.5 cursor-pointer">
              <Plus size={14} className="text-[var(--accent)]" />
              Add More Files
              <input
                type="file"
                multiple
                onChange={(e) => e.target.files && handleFilesSelected(e.target.files)}
                accept="image/png,image/jpeg,image/webp"
                className="hidden"
              />
            </label>
            <button
              type="button"
              onClick={clearAllItems}
              className="btn-secondary text-xs text-red-400 hover:text-red-300 flex items-center gap-1.5"
            >
              <Trash2 size={13} />
              Clear
            </button>
          </div>
        )}
      </div>

      {/* Notification Strip */}
      {statusMessage && (
        <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs flex items-center justify-between shadow-sm animate-in fade-in duration-200">
          <span className="flex items-center gap-2">
            <CheckCircle2 size={15} />
            {statusMessage}
          </span>
          <button
            type="button"
            onClick={() => setStatusMessage(null)}
            className="text-[var(--muted)] hover:text-[var(--text)] font-mono text-[11px]"
          >
            Dismiss ✕
          </button>
        </div>
      )}

      {/* ZERO STATE: Multi-File Drag & Drop Zone */}
      {items.length === 0 ? (
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={onDrop}
          className="border-2 border-dashed border-[var(--line)] hover:border-[var(--accent)] rounded-3xl p-8 sm:p-14 text-center transition-all bg-[var(--surface-sunken)] space-y-4 group cursor-pointer"
        >
          <div className="w-16 h-16 rounded-2xl bg-[var(--panel)] border border-[var(--line)] text-[var(--accent)] flex items-center justify-center mx-auto group-hover:scale-110 transition-transform shadow-md">
            <UploadCloud size={32} />
          </div>
          <div className="space-y-1">
            <h3 className="font-headline font-bold text-lg sm:text-xl text-[var(--text)]">
              Drop Images for Local Metadata Inspection
            </h3>
            <p className="text-xs text-[var(--muted)] max-w-lg mx-auto">
              Select JPEG, PNG, or WebP images. Metadata inspection and supported cleanup stay in this browser tab.
            </p>
          </div>
          <div className="pt-2 flex items-center justify-center gap-3">
            <label className="btn-primary text-xs font-bold px-6 py-2.5 inline-flex items-center gap-2 cursor-pointer shadow-md hover:scale-105 transition-all">
              <Upload size={14} />
              Browse Multiple Files
              <input
                type="file"
                multiple
                onChange={(e) => e.target.files && handleFilesSelected(e.target.files)}
                accept="image/png,image/jpeg,image/webp"
                className="hidden"
              />
            </label>
          </div>
        </div>
      ) : (
        /* ACTIVE BATCH WORKSPACE */
        <div className="space-y-6">
          {/* BATCH ACTION TOOLBAR & SUMMARY CARDS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
            <div className="p-3.5 rounded-2xl bg-[var(--surface-sunken)] border border-[var(--line)] space-y-1">
              <span className="text-[10px] font-mono text-[var(--muted)] uppercase block">
                Total Files in Queue
              </span>
              <span className="text-xl font-bold font-mono text-[var(--text)]">
                {items.length} file{items.length > 1 ? 's' : ''}
              </span>
            </div>

            <div className="p-3.5 rounded-2xl bg-[var(--surface-sunken)] border border-[var(--line)] space-y-1">
              <span className="text-[10px] font-mono text-[var(--muted)] uppercase block">
                C2PA-compatible markers
              </span>
              <span className="text-xl font-bold font-mono text-emerald-400">
                {totalC2paDetected} detected
              </span>
            </div>

            <div className="p-3.5 rounded-2xl bg-[var(--surface-sunken)] border border-[var(--line)] space-y-1">
              <span className="text-[10px] font-mono text-[var(--muted)] uppercase block">
                Exposed GPS Coordinates
              </span>
              <span className={`text-xl font-bold font-mono ${totalGpsDetected > 0 ? 'text-red-400' : 'text-[var(--text)]'}`}>
                {totalGpsDetected} found
              </span>
            </div>

            <div className="p-3.5 rounded-2xl bg-[var(--surface-sunken)] border border-[var(--line)] flex flex-col justify-center">
              <span className="text-[10px] font-mono text-[var(--muted)] uppercase block mb-1">
                Execution Mode
              </span>
              <span className="text-xs font-bold text-[var(--accent)] flex items-center gap-1">
                <ShieldCheck size={14} />
                100% In-Browser Memory
              </span>
            </div>
          </div>

          {/* BATCH ACTION BAR (STICKY & RESPONSIVE) */}
          <div className="p-4 rounded-2xl bg-[var(--panel)] border-2 border-[var(--accent)]/30 shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-[var(--accent)] flex items-center justify-center font-bold">
                <Zap size={20} />
              </div>
              <div>
                <span className="font-bold text-sm text-[var(--text)] block">
                  Bulk Batch Actions ({items.length} items ready)
                </span>
                <span className="text-xs text-[var(--muted)] font-mono">
                  {isBatchProcessing
                    ? `Processing ${progress.current} / ${progress.total}...`
                    : 'Process all items simultaneously'}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2.5 flex-wrap">
              {/* 1-Click Strip All Button */}
              <button
                type="button"
                onClick={handleBatchSanitizeAll}
                disabled={isBatchProcessing}
                className="btn-primary text-xs font-bold flex items-center gap-1.5 shadow-md hover:scale-105 transition-all"
              >
                <Zap size={14} />
                {isBatchProcessing ? `Stripping (${progress.current}/${progress.total})...` : 'Strip Supported Metadata'}
              </button>

              {/* Bulk Edit Button */}
              <button
                type="button"
                onClick={() => setShowBulkEditModal(true)}
                disabled={isBatchProcessing}
                className="btn-secondary text-xs font-bold flex items-center gap-1.5"
              >
                <Edit3 size={14} />
                Bulk Edit Metadata
              </button>

              {/* Download All ZIP */}
              <button
                type="button"
                onClick={handleDownloadAllZip}
                disabled={isZipping || items.length === 0}
                className="btn-secondary text-xs font-bold flex items-center gap-1.5 text-[var(--accent)] hover:border-[var(--accent)]"
              >
                <Archive size={14} />
                {isZipping ? 'Archiving ZIP...' : 'Download All (.zip)'}
              </button>
            </div>
          </div>

          {/* TWO-COLUMN WORKSPACE: LEFT FILE QUEUE, RIGHT FILE INSPECTOR & EDITOR */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* LEFT COLUMN: FILE QUEUE (4 cols) */}
            <div className="lg:col-span-4 space-y-3">
              <div className="flex items-center justify-between pb-1 border-b border-[var(--line)]">
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-[var(--muted)]">
                  Queue ({items.length})
                </span>
                <label className="text-[11px] font-mono text-[var(--accent)] hover:underline cursor-pointer flex items-center gap-1 font-bold">
                  <Plus size={12} />
                  Add files
                  <input
                    type="file"
                    multiple
                    onChange={(e) => e.target.files && handleFilesSelected(e.target.files)}
                    accept="image/png,image/jpeg,image/webp"
                    className="hidden"
                  />
                </label>
              </div>

              <div className="space-y-2 max-h-[580px] overflow-y-auto pr-1">
                {items.map((it) => {
                  const isSelected = activeItem?.id === it.id;
                  const hasC2pa = it.analysis?.c2pa?.hasManifest;
                  const hasGps = it.analysis?.gpsCoordinates;

                  return (
                    <div
                      key={it.id}
                      onClick={() => selectSingleItem(it)}
                      className={`p-3 rounded-xl border transition-all cursor-pointer space-y-2 group ${
                        isSelected
                          ? 'bg-[var(--surface-sunken)] border-[var(--accent)] shadow-sm ring-1 ring-[var(--accent)]'
                          : 'bg-[var(--panel)] border-[var(--line)] hover:border-[var(--accent)]'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 truncate">
                          <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                            isSelected ? 'bg-[var(--accent)] text-[var(--accent-ink)] font-bold' : 'bg-[var(--surface-sunken)] text-[var(--muted)]'
                          }`}>
                            <FileCheck size={14} />
                          </div>
                          <div className="truncate">
                            <span className="text-xs font-bold text-[var(--text)] block truncate">
                              {it.file.name}
                            </span>
                            <span className="text-[10px] text-[var(--muted)] font-mono">
                              {(it.file.size / 1024).toFixed(1)} KB
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          {it.status === 'done' && (
                            <span className="badge-emerald py-0.5 text-[10px] flex items-center gap-1">
                              <Check size={10} /> Clean
                            </span>
                          )}
                          {it.status === 'processing' && (
                            <RefreshCw size={12} className="animate-spin text-[var(--accent)]" />
                          )}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              removeItem(it.id);
                            }}
                            className="p-1 rounded text-[var(--muted)] hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                            title="Remove file"
                          >
                            <X size={13} />
                          </button>
                        </div>
                      </div>

                      {/* Status Badges on Queue Card */}
                      <div className="flex items-center gap-1.5 flex-wrap text-[10px] font-mono">
                        {hasC2pa && (
                          <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold">
                            C2PA-compatible marker detected
                          </span>
                        )}
                        {hasGps && (
                          <span className="px-1.5 py-0.5 rounded bg-red-500/10 text-red-400 border border-red-500/20 font-bold flex items-center gap-0.5">
                            <MapPin size={9} /> GPS
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* RIGHT COLUMN: DETAILED INSPECTOR & SINGLE EDITOR (8 cols) */}
            <div className="lg:col-span-8">
              {activeItem ? (
                <div className="space-y-4 bg-[var(--panel)] p-5 sm:p-6 rounded-2xl border border-[var(--line)] shadow-sm">
                  {/* File Header & Mode Switcher */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[var(--line)]">
                    <div className="truncate">
                      <div className="flex items-center gap-2">
                        <h3 className="font-headline font-bold text-lg text-[var(--text)] truncate max-w-sm">
                          {activeItem.file.name}
                        </h3>
                        <span className="text-[11px] font-mono text-[var(--muted)]">
                          ({(activeItem.file.size / 1024).toFixed(1)} KB)
                        </span>
                      </div>
                      <span className="text-xs text-[var(--muted)] font-mono">
                        {activeItem.file.type || 'application/octet-stream'}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 bg-[var(--surface-sunken)] p-1 rounded-xl border border-[var(--line)] self-start sm:self-auto">
                      <button
                        type="button"
                        onClick={() => setActiveTab('view')}
                        className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg font-bold transition-all ${
                          activeTab === 'view'
                            ? 'bg-[var(--accent)] text-[var(--accent-ink)]'
                            : 'text-[var(--muted)] hover:text-[var(--text)]'
                        }`}
                      >
                        <Eye size={13} />
                        C2PA & EXIF
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveTab('edit')}
                        className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg font-bold transition-all ${
                          activeTab === 'edit'
                            ? 'bg-[var(--accent)] text-[var(--accent-ink)]'
                            : 'text-[var(--muted)] hover:text-[var(--text)]'
                        }`}
                      >
                        <Edit3 size={13} />
                        Edit Metadata
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDownloadSingleClean(activeItem)}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg font-bold text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all"
                      >
                        <Zap size={13} />
                        Strip & Download
                      </button>
                    </div>
                  </div>

                  {/* TAB 1: VIEWER & C2PA MANIFEST CARD */}
                  {activeTab === 'view' && activeItem.analysis && (
                    <div className="space-y-5">
                      {/* C2PA-compatible marker card */}
                      {activeItem.analysis.c2pa?.hasManifest ? (
                        <div className="p-4 sm:p-5 rounded-2xl bg-[var(--surface-sunken)] border border-amber-500/40 shadow-sm">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div className="flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center font-mono font-bold text-amber-400 text-sm">
                                CR
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <h4 className="font-headline font-bold text-base text-[var(--text)]">
                                    C2PA-compatible marker detected
                                  </h4>
                                </div>
                                <p className="text-xs text-[var(--muted)]">
                                  AIScrubber can remove this marker, but it does not verify signatures or identify the issuing vendor.
                                </p>
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={() => handleDownloadSingleClean(activeItem)}
                              className="btn-secondary text-xs text-red-400 font-bold flex items-center gap-1.5 self-start sm:self-auto"
                            >
                              <Trash2 size={13} />
                              Remove Marker
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="p-4 rounded-xl bg-[var(--surface-sunken)] border border-[var(--line)]">
                          <span className="text-xs text-[var(--muted)] flex items-center gap-2">
                            <ShieldCheck size={16} className="text-emerald-400" />
                            No C2PA-compatible marker detected on this file.
                          </span>
                        </div>
                      )}

                      {/* GPS Map Strip if present */}
                      {activeItem.analysis.gpsCoordinates && (
                        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-xs">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-bold text-red-400 flex items-center gap-1.5 uppercase">
                              <MapPin size={15} /> Exact GPS Coordinates Exposed
                            </span>
                            <a
                              href={activeItem.analysis.gpsCoordinates.googleMapsUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="text-[var(--accent)] hover:underline font-bold"
                            >
                              Open in Maps →
                            </a>
                          </div>
                          <div className="grid grid-cols-2 gap-2 font-mono">
                            <span className="p-2 rounded bg-[var(--panel)] border border-[var(--line)]">
                              Lat: {activeItem.analysis.gpsCoordinates.latitude}
                            </span>
                            <span className="p-2 rounded bg-[var(--panel)] border border-[var(--line)]">
                              Lon: {activeItem.analysis.gpsCoordinates.longitude}
                            </span>
                          </div>
                        </div>
                      )}

                      {/* Attributes Table */}
                      <div className="border border-[var(--line)] rounded-xl overflow-hidden bg-[var(--panel)]">
                        <div className="p-3 bg-[var(--surface-sunken)] border-b border-[var(--line)] flex items-center justify-between text-xs font-bold">
                          <span>Metadata Tags ({activeItem.analysis.fields.length})</span>
                          <span className="text-[var(--muted)] font-mono text-[11px]">Client-side</span>
                        </div>
                        <div className="divide-y divide-[var(--line)] max-h-64 overflow-y-auto">
                          {activeItem.analysis.fields.map((f, idx) => (
                            <div
                              key={idx}
                              className="p-2.5 flex items-center justify-between text-xs hover:bg-[var(--surface-sunken)] transition-colors"
                            >
                              <div className="flex items-center gap-2 truncate">
                                <span className={`px-1.5 py-0.5 rounded text-[10px] font-mono uppercase font-bold ${
                                  f.isSensitive ? 'bg-red-500/10 text-red-400' : 'bg-[var(--surface-sunken)] text-[var(--muted)]'
                                }`}>
                                  {f.category}
                                </span>
                                <span className="font-semibold truncate">{f.label}</span>
                              </div>
                              <code className="font-mono text-[var(--text)] bg-[var(--surface-sunken)] px-2 py-0.5 rounded text-[11px] max-w-xs truncate" title={f.value}>
                                {f.value}
                              </code>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* TAB 2: EDIT METADATA & C2PA */}
                  {activeTab === 'edit' && (
                    <div className="space-y-5">
                      <div className="space-y-3">
                        <span className="text-xs font-mono font-bold uppercase tracking-wider text-[var(--muted)] block">
                          Standard Attributes
                        </span>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                          <div className="space-y-1">
                            <label className="font-semibold text-[var(--muted)]">Creator / Author</label>
                            <input
                              type="text"
                              value={editFields.Author}
                              onChange={(e) => setEditFields({ ...editFields, Author: e.target.value })}
                              placeholder="e.g. Poorvith M P"
                              className="input-field text-xs font-mono"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="font-semibold text-[var(--muted)]">Document / Image Title</label>
                            <input
                              type="text"
                              value={editFields.Title}
                              onChange={(e) => setEditFields({ ...editFields, Title: e.target.value })}
                              placeholder="e.g. Blueprint"
                              className="input-field text-xs font-mono"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="font-semibold text-[var(--muted)]">Software Used</label>
                            <input
                              type="text"
                              value={editFields.Software}
                              onChange={(e) => setEditFields({ ...editFields, Software: e.target.value })}
                              placeholder="e.g. AIScrubber Suite"
                              className="input-field text-xs font-mono"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="font-semibold text-[var(--muted)]">Copyright Notice</label>
                            <input
                              type="text"
                              value={editFields.Copyright}
                              onChange={(e) => setEditFields({ ...editFields, Copyright: e.target.value })}
                              placeholder="e.g. CC-BY 4.0"
                              className="input-field text-xs font-mono"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="pt-2 flex items-center justify-between">
                        <span className="text-xs text-[var(--muted)] font-mono">
                          Editing supports JPEG and PNG. WebP supports stripping only.
                        </span>
                        <button
                          type="button"
                          onClick={handleSaveSingleEdits}
                          className="btn-primary text-xs font-bold flex items-center gap-1.5 shadow-md hover:scale-105 transition-all"
                        >
                          <Save size={14} />
                          Save & Download Custom File
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : null}
            </div>
          </div>
        </div>
      )}

      {/* MODAL: BULK STANDARD METADATA EDIT */}
      {showBulkEditModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[var(--panel)] border border-[var(--line)] rounded-3xl p-6 sm:p-8 max-w-xl w-full shadow-2xl space-y-6 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--line)]">
              <div>
                <h3 className="font-headline font-bold text-lg text-[var(--text)]">
                  Bulk Edit Metadata ({items.length} files)
                </h3>
                <p className="text-xs text-[var(--muted)]">
                  Applies standard author, title, software, and copyright fields to all images.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowBulkEditModal(false)}
                className="text-[var(--muted)] hover:text-[var(--text)] font-mono"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-[var(--muted)]">Author Name</label>
                <input
                  type="text"
                  value={bulkFields.Author}
                  onChange={(e) => setBulkFields({ ...bulkFields, Author: e.target.value })}
                  className="input-field text-xs font-mono"
                />
              </div>
              <div className="space-y-1">
                <label className="font-semibold text-[var(--muted)]">Software Tool</label>
                <input
                  type="text"
                  value={bulkFields.Software}
                  onChange={(e) => setBulkFields({ ...bulkFields, Software: e.target.value })}
                  className="input-field text-xs font-mono"
                />
              </div>
              <div className="space-y-1">
                <label className="font-semibold text-[var(--muted)]">Title</label>
                <input type="text" value={bulkFields.Title} onChange={(e) => setBulkFields({ ...bulkFields, Title: e.target.value })} className="input-field text-xs font-mono" />
              </div>
              <div className="space-y-1">
                <label className="font-semibold text-[var(--muted)]">Copyright</label>
                <input type="text" value={bulkFields.Copyright} onChange={(e) => setBulkFields({ ...bulkFields, Copyright: e.target.value })} className="input-field text-xs font-mono" />
              </div>
            </div>

            <div className="pt-3 border-t border-[var(--line)] flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowBulkEditModal(false)}
                className="btn-secondary text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleApplyBulkEdits}
                className="btn-primary text-xs font-bold flex items-center gap-1.5 shadow-md"
              >
                <Save size={14} />
                Apply to All {items.length} Files
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
