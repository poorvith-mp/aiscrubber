import {
  AlertTriangle,
  Camera,
  Check,
  Download,
  Edit3,
  Eye,
  FileCheck,
  FileSpreadsheet,
  FileText,
  HelpCircle,
  MapPin,
  Music,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
  Trash2,
  UploadCloud,
  Zap,
} from 'lucide-react';
import { useState } from 'react';
import {
  parseFileMetadata,
  stripFileMetadata,
  type MetadataField,
  type ParsedMetadata,
} from '../lib/metadata';

export function MetadataWorkspace() {
  const [file, setFile] = useState<File | null>(null);
  const [metadata, setMetadata] = useState<ParsedMetadata | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'view' | 'edit' | 'strip'>('view');
  const [strippedBlob, setStrippedBlob] = useState<Blob | null>(null);
  const [isStripping, setIsStripping] = useState(false);
  const [strippedSuccess, setStrippedSuccess] = useState(false);

  // Editable metadata state
  const [editFields, setEditFields] = useState<Record<string, string>>({
    Author: '',
    Title: '',
    Copyright: '',
    Software: '',
  });

  async function handleFileSelect(selectedFile: File) {
    setFile(selectedFile);
    setLoading(true);
    setStrippedBlob(null);
    setStrippedSuccess(false);

    try {
      const parsed = await parseFileMetadata(selectedFile);
      setMetadata(parsed);

      // Prepopulate edit fields
      const authorField = parsed.fields.find((f) => f.category === 'author');
      const titleField = parsed.fields.find((f) => f.tag.includes('Title'));
      const softwareField = parsed.fields.find((f) => f.tag.includes('Software'));
      const copyField = parsed.fields.find((f) => f.tag.includes('Copyright'));

      setEditFields({
        Author: authorField?.value || '',
        Title: titleField?.value || '',
        Software: softwareField?.value || '',
        Copyright: copyField?.value || '',
      });
    } catch (err) {
      console.error('Failed to parse metadata', err);
    } finally {
      setLoading(false);
    }
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    const dropped = e.dataTransfer.files[0];
    if (dropped) handleFileSelect(dropped);
  }

  async function handleQuickStrip() {
    if (!file) return;
    setIsStripping(true);
    try {
      const cleanBlob = await stripFileMetadata(file);
      setStrippedBlob(cleanBlob);
      setStrippedSuccess(true);

      // Download clean file
      const url = URL.createObjectURL(cleanBlob);
      const a = document.createElement('a');
      a.href = url;
      const ext = file.name.split('.').pop();
      const base = file.name.replace(/\.[^/.]+$/, '');
      a.download = `${base}_clean.${ext}`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      alert('Error stripping metadata from file');
      console.error(err);
    } finally {
      setIsStripping(false);
    }
  }

  return (
    <div className="workspace-panel">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-[var(--line)]">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="badge-emerald">Metadata Desk</span>
            <span className="text-xs text-[var(--muted)] font-mono">
              EXIF · GPS · PDF · Media
            </span>
          </div>
          <h2 className="text-2xl md:text-3xl font-headline font-bold">
            Metadata Viewer, Editor & Stripper
          </h2>
          <p className="text-sm text-[var(--muted)] mt-1">
            Inspect hidden hardware signatures, edit author tags, or strip 100% of metadata client-side.
          </p>
        </div>

        {file && (
          <div className="flex items-center gap-2 bg-[var(--surface-sunken)] p-1 rounded-xl border border-[var(--line)]">
            <button
              type="button"
              onClick={() => setActiveTab('view')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg font-bold transition-all ${
                activeTab === 'view'
                  ? 'bg-[var(--accent)] text-[var(--accent-ink)]'
                  : 'text-[var(--muted)] hover:text-[var(--text)]'
              }`}
            >
              <Eye size={14} />
              Viewer
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
              <Edit3 size={14} />
              Editor
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('strip')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg font-bold transition-all ${
                activeTab === 'strip'
                  ? 'bg-[var(--accent)] text-[var(--accent-ink)]'
                  : 'text-[var(--muted)] hover:text-[var(--text)]'
              }`}
            >
              <Zap size={14} />
              1-Click Stripper
            </button>
          </div>
        )}
      </div>

      {/* File Dropzone */}
      {!file ? (
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={onDrop}
          className="mt-6 p-12 rounded-2xl border-2 border-dashed border-[var(--line)] bg-[var(--surface-sunken)] text-center hover:border-[var(--accent)] transition-all cursor-pointer group"
        >
          <label className="cursor-pointer flex flex-col items-center">
            <div className="w-16 h-16 rounded-full bg-[var(--accent-tint)] flex items-center justify-center text-[var(--accent)] mb-4 group-hover:scale-110 transition-transform">
              <UploadCloud size={32} />
            </div>
            <h3 className="text-lg font-bold mb-1">
              Drag and drop an Image, PDF, or Audio file
            </h3>
            <p className="text-xs text-[var(--muted)] max-w-md mb-4">
              Supports JPEG (EXIF/GPS), PNG (Chunks), WebP, PDF (Author & Info dict), MP3/WAV (ID3). Everything runs in memory.
            </p>
            <span className="btn-primary text-xs font-bold px-5 py-2.5">
              Browse Local File
            </span>
            <input
              type="file"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleFileSelect(f);
              }}
              className="hidden"
            />
          </label>
        </div>
      ) : (
        /* Loaded File Workbench */
        <div className="mt-6 space-y-6">
          {/* File Overview Strip */}
          <div className="p-4 rounded-xl bg-[var(--surface-sunken)] border border-[var(--line)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-[var(--accent-tint)] flex items-center justify-center text-[var(--accent)] font-bold font-mono text-xs">
                {file.name.split('.').pop()?.toUpperCase() || 'FILE'}
              </div>
              <div>
                <h4 className="font-bold text-sm truncate max-w-sm" title={file.name}>
                  {file.name}
                </h4>
                <div className="flex items-center gap-2 text-xs text-[var(--muted)]">
                  <span>{(file.size / 1024).toFixed(1)} KB</span>
                  <span>·</span>
                  <span>{file.type || 'Unknown MIME'}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => setFile(null)}
                className="btn-secondary text-xs"
              >
                Change File
              </button>
              <button
                type="button"
                onClick={handleQuickStrip}
                disabled={isStripping}
                className="btn-primary text-xs font-bold flex items-center gap-1.5"
              >
                <Zap size={14} />
                {isStripping ? 'Sanitizing...' : 'Strip & Download'}
              </button>
            </div>
          </div>

          {/* Threats & Hazards */}
          {metadata && metadata.threats.length > 0 && (
            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300">
              <div className="flex items-center gap-2 font-bold text-xs uppercase tracking-wider mb-2">
                <AlertTriangle size={16} />
                Detected Privacy Hazards ({metadata.threats.length})
              </div>
              <ul className="text-xs space-y-1 list-disc pl-5 text-amber-200/90">
                {metadata.threats.map((threat, i) => (
                  <li key={i}>{threat}</li>
                ))}
              </ul>
            </div>
          )}

          {/* TAB 1: METADATA VIEWER */}
          {activeTab === 'view' && metadata && (
            <div className="space-y-6">
              {/* GPS Map Block if present */}
              {metadata.hasGps && metadata.gpsCoordinates && (
                <div className="p-4 rounded-xl bg-[var(--surface-sunken)] border border-red-500/30">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2 text-red-400 font-bold text-xs uppercase tracking-wider">
                      <MapPin size={16} />
                      Embedded GPS Location Found
                    </div>
                    <a
                      href={metadata.gpsCoordinates.mapsUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-[var(--accent)] hover:underline flex items-center gap-1 font-bold"
                    >
                      Open in Google Maps →
                    </a>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-xs font-mono">
                    <div className="p-2.5 rounded bg-[var(--panel)] border border-[var(--line)]">
                      <span className="text-[var(--muted)] block">Latitude:</span>
                      <span className="font-bold">{metadata.gpsCoordinates.latitude}</span>
                    </div>
                    <div className="p-2.5 rounded bg-[var(--panel)] border border-[var(--line)]">
                      <span className="text-[var(--muted)] block">Longitude:</span>
                      <span className="font-bold">{metadata.gpsCoordinates.longitude}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* All Metadata Fields Table */}
              <div className="border border-[var(--line)] rounded-xl overflow-hidden bg-[var(--panel)]">
                <div className="p-3 bg-[var(--surface-sunken)] border-b border-[var(--line)] flex items-center justify-between text-xs font-bold">
                  <span>Metadata Tags & Attributes ({metadata.fields.length})</span>
                  <span className="text-[var(--muted)] font-normal">
                    {metadata.fields.length === 0 ? 'No tags found' : 'Client-side parse'}
                  </span>
                </div>

                {metadata.fields.length > 0 ? (
                  <div className="divide-y divide-[var(--line)] max-h-[400px] overflow-y-auto">
                    {metadata.fields.map((f, i) => (
                      <div
                        key={i}
                        className="p-3 flex items-center justify-between text-xs hover:bg-[var(--surface-sunken)] transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <span
                            className={`px-2 py-0.5 rounded font-mono text-[10px] uppercase font-bold ${
                              f.isSensitive
                                ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                                : 'bg-[var(--surface-sunken)] text-[var(--muted)]'
                            }`}
                          >
                            {f.category}
                          </span>
                          <span className="font-semibold">{f.label}</span>
                        </div>
                        <code className="font-mono text-[var(--text)] bg-[var(--surface-sunken)] px-2 py-1 rounded max-w-xs truncate" title={f.value}>
                          {f.value}
                        </code>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-8 text-center text-xs text-[var(--muted)] italic">
                    This file is clean or does not contain standard EXIF/IPTC/PDF metadata streams.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: METADATA EDITOR */}
          {activeTab === 'edit' && (
            <div className="p-6 rounded-xl bg-[var(--panel)] border border-[var(--line)] space-y-4">
              <div className="flex items-center justify-between border-b border-[var(--line)] pb-3">
                <h3 className="text-sm font-bold flex items-center gap-2">
                  <Edit3 size={16} className="text-[var(--accent)]" />
                  In-Place Metadata Field Sanitizer
                </h3>
                <span className="text-xs text-[var(--muted)]">
                  Override or wipe specific metadata headers
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block text-[var(--muted)] mb-1 font-semibold">
                    Author / Creator Name
                  </label>
                  <input
                    type="text"
                    value={editFields.Author}
                    onChange={(e) =>
                      setEditFields({ ...editFields, Author: e.target.value })
                    }
                    placeholder="Leave blank or set to 'Anonymous'"
                    className="input-field text-xs"
                  />
                </div>

                <div>
                  <label className="block text-[var(--muted)] mb-1 font-semibold">
                    Document / Image Title
                  </label>
                  <input
                    type="text"
                    value={editFields.Title}
                    onChange={(e) =>
                      setEditFields({ ...editFields, Title: e.target.value })
                    }
                    placeholder="Clean document title"
                    className="input-field text-xs"
                  />
                </div>

                <div>
                  <label className="block text-[var(--muted)] mb-1 font-semibold">
                    Software / Producer Tag
                  </label>
                  <input
                    type="text"
                    value={editFields.Software}
                    onChange={(e) =>
                      setEditFields({ ...editFields, Software: e.target.value })
                    }
                    placeholder="Wipe editing tool fingerprint"
                    className="input-field text-xs"
                  />
                </div>

                <div>
                  <label className="block text-[var(--muted)] mb-1 font-semibold">
                    Copyright Notice
                  </label>
                  <input
                    type="text"
                    value={editFields.Copyright}
                    onChange={(e) =>
                      setEditFields({ ...editFields, Copyright: e.target.value })
                    }
                    placeholder="Wipe or customize copyright"
                    className="input-field text-xs"
                  />
                </div>
              </div>

              <div className="pt-4 flex justify-end">
                <button
                  type="button"
                  onClick={handleQuickStrip}
                  className="btn-primary text-xs font-bold flex items-center gap-2"
                >
                  <Check size={14} />
                  Save & Download Cleaned File
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: 1-CLICK STRIPPER */}
          {activeTab === 'strip' && (
            <div className="p-8 rounded-2xl bg-[var(--surface-sunken)] border border-[var(--accent)] text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-[var(--accent-tint)] flex items-center justify-center text-[var(--accent)] mx-auto">
                <ShieldCheck size={32} />
              </div>
              <h3 className="text-xl font-bold font-headline">
                1-Click Complete Metadata Sanitization
              </h3>
              <p className="text-xs text-[var(--muted)] max-w-lg mx-auto">
                Renders and re-encodes pixel streams for images, zeros PDF tracking dictionaries, and wipes audio ID3 tags entirely in browser memory.
              </p>

              <button
                type="button"
                onClick={handleQuickStrip}
                disabled={isStripping}
                className="btn-primary text-sm font-bold px-8 py-3.5 inline-flex items-center gap-2 shadow-lg hover:scale-105 transition-all"
              >
                <Zap size={18} />
                {isStripping ? 'Sanitizing...' : 'Download 100% Clean File'}
              </button>

              {strippedSuccess && (
                <p className="text-xs text-[var(--accent)] font-bold flex items-center justify-center gap-1.5">
                  <Check size={14} />
                  File stripped successfully and downloaded!
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
