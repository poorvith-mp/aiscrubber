import {
  AlertTriangle,
  Camera,
  Check,
  Clipboard,
  Download,
  Edit3,
  Eye,
  FileCheck,
  FileSpreadsheet,
  FileText,
  HelpCircle,
  Lock,
  MapPin,
  Music,
  RefreshCw,
  Save,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Trash2,
  UploadCloud,
  Zap,
} from 'lucide-react';
import { useState } from 'react';
import {
  applyMetadataEdits,
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
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [copiedPrompt, setCopiedPrompt] = useState(false);

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
    setStatusMessage(null);

    try {
      const parsed = await parseFileMetadata(selectedFile);
      setMetadata(parsed);

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
    setStatusMessage(null);
    try {
      const cleanBlob = await stripFileMetadata(file);
      setStrippedBlob(cleanBlob);
      setStatusMessage('100% of metadata and C2PA manifests stripped successfully!');

      const url = URL.createObjectURL(cleanBlob);
      const a = document.createElement('a');
      a.href = url;
      const ext = file.name.split('.').pop();
      const base = file.name.replace(/\.[^/.]+$/, '');
      a.download = `${base}_sanitized.${ext}`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      alert('Error stripping file metadata');
      console.error(err);
    } finally {
      setIsStripping(false);
    }
  }

  async function handleSaveEdits() {
    if (!file) return;
    setIsSavingEdit(true);
    setStatusMessage(null);
    try {
      const modifiedBlob = await applyMetadataEdits(file, editFields);
      setStatusMessage('Metadata edits applied & saved into binary stream!');

      const url = URL.createObjectURL(modifiedBlob);
      const a = document.createElement('a');
      a.href = url;
      const ext = file.name.split('.').pop();
      const base = file.name.replace(/\.[^/.]+$/, '');
      a.download = `${base}_custom_metadata.${ext}`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      alert('Error applying metadata edits');
      console.error(err);
    } finally {
      setIsSavingEdit(false);
    }
  }

  const copyPromptToClipboard = async (text: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedPrompt(true);
    setTimeout(() => setCopiedPrompt(false), 2000);
  };

  return (
    <div className="workspace-panel space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-[var(--line)]">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="badge-emerald">Metadata Desk</span>
            <span className="text-xs text-[var(--muted)] font-mono">
              C2PA · EXIF · GPS · PDF · Media
            </span>
          </div>
          <h2 className="text-2xl md:text-3xl font-headline font-bold">
            Metadata & C2PA Provenance Desk
          </h2>
          <p className="text-sm text-[var(--muted)] mt-1">
            Inspect C2PA Content Credentials (ChatGPT, DALL·E 3, Nano Banana), edit author tags in-place, or strip 100% of metadata client-side.
          </p>
        </div>

        {file && (
          <div className="flex items-center gap-2 bg-[var(--surface-sunken)] p-1 rounded-xl border border-[var(--line)] self-start md:self-auto">
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
              Viewer & C2PA
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
          className="p-12 rounded-2xl border-2 border-dashed border-[var(--line)] bg-[var(--surface-sunken)] text-center hover:border-[var(--accent)] transition-all cursor-pointer group"
        >
          <label className="cursor-pointer flex flex-col items-center">
            <div className="w-16 h-16 rounded-full bg-[var(--accent-tint)] flex items-center justify-center text-[var(--accent)] mb-4 group-hover:scale-110 transition-transform">
              <UploadCloud size={32} />
            </div>
            <h3 className="text-lg font-bold mb-1">
              Drag and drop an Image, PDF, or Audio file
            </h3>
            <p className="text-xs text-[var(--muted)] max-w-md mb-4">
              Inspect C2PA Content Credentials, EXIF/GPS tags, PNG chunks, PDF author records, or MP3 tags. 100% processed in local browser RAM.
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
        <div className="space-y-6">
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

          {/* Status Alert */}
          {statusMessage && (
            <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs flex items-center gap-2 font-bold animate-fade-in">
              <Check size={16} />
              <span>{statusMessage}</span>
            </div>
          )}

          {/* Threats & Hazards */}
          {metadata && metadata.threats.length > 0 && (
            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300">
              <div className="flex items-center gap-2 font-bold text-xs uppercase tracking-wider mb-2">
                <AlertTriangle size={16} />
                Detected Privacy & Provenance Findings ({metadata.threats.length})
              </div>
              <ul className="text-xs space-y-1 list-disc pl-5 text-amber-200/90">
                {metadata.threats.map((threat, i) => (
                  <li key={i}>{threat}</li>
                ))}
              </ul>
            </div>
          )}

          {/* TAB 1: METADATA VIEWER & C2PA */}
          {activeTab === 'view' && metadata && (
            <div className="space-y-6">
              {/* C2PA CONTENT CREDENTIALS CARD (Like ChatGPT / Nano Banana) */}
              {metadata.c2pa && (
                <div className="p-5 rounded-2xl bg-[var(--surface-sunken)] border-2 border-emerald-500/30 shadow-lg space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[var(--line)]">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center font-mono font-bold text-emerald-400 text-sm">
                        CR
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-headline font-bold text-base text-[var(--text)]">
                            Content Credentials (C2PA)
                          </h3>
                          <span className="badge-emerald flex items-center gap-1">
                            <ShieldCheck size={12} />
                            Verified Manifest
                          </span>
                        </div>
                        <p className="text-xs text-[var(--muted)]">
                          Cryptographic provenance manifest and AI generation trail detected.
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleQuickStrip}
                      className="btn-secondary text-xs font-bold text-red-400 hover:border-red-500/40 hover:bg-red-500/10 flex items-center gap-1.5 self-start sm:self-auto"
                    >
                      <Trash2 size={13} />
                      Strip C2PA Manifest
                    </button>
                  </div>

                  {/* Provenance Details Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs font-mono">
                    <div className="p-3 rounded-xl bg-[var(--panel)] border border-[var(--line)] space-y-1">
                      <span className="text-[var(--muted)] text-[11px] block uppercase">Signer / Issuer</span>
                      <span className="font-bold text-[var(--accent)] block truncate">{metadata.c2pa.signer}</span>
                    </div>
                    <div className="p-3 rounded-xl bg-[var(--panel)] border border-[var(--line)] space-y-1">
                      <span className="text-[var(--muted)] text-[11px] block uppercase">Generator / Model</span>
                      <span className="font-bold text-[var(--text)] block truncate">{metadata.c2pa.generator}</span>
                    </div>
                    <div className="p-3 rounded-xl bg-[var(--panel)] border border-[var(--line)] space-y-1">
                      <span className="text-[var(--muted)] text-[11px] block uppercase">Claim Action</span>
                      <span className="font-bold text-[var(--text)] block truncate">{metadata.c2pa.actionSummary}</span>
                    </div>
                    <div className="p-3 rounded-xl bg-[var(--panel)] border border-[var(--line)] space-y-1">
                      <span className="text-[var(--muted)] text-[11px] block uppercase">Signature Timestamp</span>
                      <span className="font-bold text-[var(--text)] block truncate">{metadata.c2pa.timestamp}</span>
                    </div>
                  </div>

                  {/* Embedded Generation Prompt if present */}
                  {metadata.c2pa.promptUsed && (
                    <div className="p-3.5 rounded-xl bg-[var(--panel)] border border-[var(--line)] space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold flex items-center gap-1.5 text-[var(--accent)]">
                          <Sparkles size={14} />
                          Embedded AI Generation Prompt
                        </span>
                        <button
                          type="button"
                          onClick={() => copyPromptToClipboard(metadata.c2pa?.promptUsed || '')}
                          className="text-xs text-[var(--muted)] hover:text-[var(--text)] flex items-center gap-1 font-mono"
                        >
                          {copiedPrompt ? <Check size={12} className="text-emerald-400" /> : <Clipboard size={12} />}
                          {copiedPrompt ? 'Copied' : 'Copy Prompt'}
                        </button>
                      </div>
                      <p className="text-xs font-mono text-[var(--text)] bg-[var(--surface-sunken)] p-2.5 rounded-lg border border-[var(--line)] whitespace-pre-wrap">
                        {metadata.c2pa.promptUsed}
                      </p>
                    </div>
                  )}

                  {/* Cryptographic Digest Footnote */}
                  {metadata.c2pa.signatureDigest && (
                    <div className="flex items-center justify-between text-[11px] font-mono text-[var(--muted)] pt-1">
                      <span>Manifest Digest: <code className="text-[var(--accent)]">{metadata.c2pa.signatureDigest}</code></span>
                      <span className="flex items-center gap-1">
                        <Lock size={11} />
                        C2PA Standard Spec v1.3
                      </span>
                    </div>
                  )}
                </div>
              )}

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
                  <div className="p-8 text-center text-xs text-[var(--muted)]">
                    No embedded metadata tags detected in this file. It is clean or already sanitized.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: METADATA EDITOR */}
          {activeTab === 'edit' && (
            <div className="p-6 rounded-2xl bg-[var(--surface-sunken)] border border-[var(--line)] space-y-6">
              <div>
                <h3 className="font-headline font-bold text-lg mb-1">
                  In-Place Metadata Injection & Tag Editing
                </h3>
                <p className="text-xs text-[var(--muted)]">
                  Overwrites or injects custom fields into JPEG EXIF, PNG chunks, PDF trailers, or ID3 containers while stripping GPS coordinates and tracking hashes.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[var(--muted)]">
                    Creator / Author Name
                  </label>
                  <input
                    type="text"
                    value={editFields.Author}
                    onChange={(e) =>
                      setEditFields({ ...editFields, Author: e.target.value })
                    }
                    placeholder="e.g. Poorvith M P"
                    className="input-field text-xs font-mono"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[var(--muted)]">
                    Document / Image Title
                  </label>
                  <input
                    type="text"
                    value={editFields.Title}
                    onChange={(e) =>
                      setEditFields({ ...editFields, Title: e.target.value })
                    }
                    placeholder="e.g. Architecture Blueprint"
                    className="input-field text-xs font-mono"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[var(--muted)]">
                    Software Fingerprint
                  </label>
                  <input
                    type="text"
                    value={editFields.Software}
                    onChange={(e) =>
                      setEditFields({ ...editFields, Software: e.target.value })
                    }
                    placeholder="e.g. AIScrubber Suite v2.2.0"
                    className="input-field text-xs font-mono"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[var(--muted)]">
                    Copyright Notice
                  </label>
                  <input
                    type="text"
                    value={editFields.Copyright}
                    onChange={(e) =>
                      setEditFields({ ...editFields, Copyright: e.target.value })
                    }
                    placeholder="e.g. CC-BY 4.0 / Public Domain"
                    className="input-field text-xs font-mono"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-[var(--line)] flex items-center justify-between flex-wrap gap-4">
                <span className="text-xs text-[var(--muted)]">
                  Binary tag injection executes 100% in browser memory.
                </span>
                <button
                  type="button"
                  onClick={handleSaveEdits}
                  disabled={isSavingEdit}
                  className="btn-primary text-xs font-bold flex items-center gap-1.5"
                >
                  <Save size={14} />
                  {isSavingEdit ? 'Encoding & Saving...' : 'Apply & Download Edited File'}
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: 1-CLICK STRIPPER */}
          {activeTab === 'strip' && (
            <div className="p-8 rounded-2xl bg-[var(--surface-sunken)] border border-[var(--line)] text-center space-y-4">
              <div className="w-14 h-14 rounded-full bg-red-500/10 text-red-400 flex items-center justify-center mx-auto">
                <Trash2 size={28} />
              </div>
              <div className="max-w-md mx-auto space-y-1">
                <h3 className="font-headline font-bold text-lg">
                  1-Click Complete Metadata Sanitizer
                </h3>
                <p className="text-xs text-[var(--muted)]">
                  Wipes 100% of EXIF, GPS coordinates, camera serials, C2PA Content Credentials manifests, and PDF author logs.
                </p>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleQuickStrip}
                  disabled={isStripping}
                  className="btn-primary text-xs font-bold px-6 py-3 flex items-center gap-2 mx-auto"
                >
                  <Zap size={16} />
                  {isStripping ? 'Sanitizing File...' : 'Sanitize & Download Clean File'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
