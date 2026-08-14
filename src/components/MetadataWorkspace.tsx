import {
  AlertTriangle,
  Camera,
  Check,
  CheckCircle2,
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
  stripMetadataUniversal,
  type FileMetadataAnalysis,
  type MetadataField,
} from '../lib/metadata';

export function MetadataWorkspace() {
  const [file, setFile] = useState<File | null>(null);
  const [metadata, setMetadata] = useState<FileMetadataAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'view' | 'edit' | 'strip'>('view');
  const [strippedBlob, setStrippedBlob] = useState<Blob | null>(null);
  const [isStripping, setIsStripping] = useState(false);
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [copiedPrompt, setCopiedPrompt] = useState(false);
  const [signWithC2pa, setSignWithC2pa] = useState(true);

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

      const authorField = parsed.fields.find((f) => f.category === 'author' || f.tag.includes('Artist') || f.tag.includes('Author'));
      const titleField = parsed.fields.find((f) => f.tag.includes('Title') || f.tag.includes('ImageDescription') || f.tag.includes('Prompt'));
      const softwareField = parsed.fields.find((f) => f.tag.includes('Software') || f.tag.includes('Creator'));
      const copyField = parsed.fields.find((f) => f.tag.includes('Copyright'));

      setEditFields({
        Author: authorField?.value || parsed.c2pa?.signer || '',
        Title: titleField?.value || parsed.c2pa?.aiPrompt || '',
        Software: softwareField?.value || parsed.c2pa?.generator || 'AIScrubber Suite v2.2.0',
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
      const cleanBlob = await stripMetadataUniversal(file);
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
      const modifiedBlob = await applyMetadataEdits(file, {
        Author: editFields.Author,
        Title: editFields.Title,
        Software: editFields.Software,
        Copyright: editFields.Copyright,
        signWithC2pa,
      });

      setStatusMessage('Custom Metadata & C2PA Manifest successfully encoded! Re-upload this downloaded file anytime to inspect the verified [CR] card and metadata attributes.');

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
            <span className="badge-emerald">Metadata & C2PA Desk</span>
            <span className="text-xs text-[var(--muted)] font-mono">
              C2PA [CR] · EXIF · GPS · PNG · PDF · Media
            </span>
          </div>
          <h2 className="text-2xl md:text-3xl font-headline font-bold">
            Metadata & C2PA Provenance Desk
          </h2>
          <p className="text-sm text-[var(--muted)] mt-1">
            Inspect C2PA Content Credentials (ChatGPT, DALL·E 3, Nano Banana), edit custom author tags in-place, or strip 100% of metadata client-side.
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
              Edit / Inject Metadata
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('strip')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg font-bold transition-all ${
                activeTab === 'strip'
                  ? 'bg-red-500 text-white'
                  : 'text-red-400 hover:text-red-300'
              }`}
            >
              <Trash2 size={14} />
              1-Click Stripper
            </button>
          </div>
        )}
      </div>

      {/* Notification Strip */}
      {statusMessage && (
        <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs flex items-center justify-between">
          <span className="flex items-center gap-2">
            <CheckCircle2 size={15} />
            {statusMessage}
          </span>
          <button
            type="button"
            onClick={() => setStatusMessage(null)}
            className="text-[var(--muted)] hover:text-[var(--text)] font-mono"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Upload Drop Zone */}
      {!file ? (
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={onDrop}
          className="border-2 border-dashed border-[var(--line)] hover:border-[var(--accent)] rounded-3xl p-12 text-center transition-all bg-[var(--surface-sunken)] space-y-4 group cursor-pointer"
        >
          <div className="w-16 h-16 rounded-2xl bg-[var(--panel)] border border-[var(--line)] text-[var(--accent)] flex items-center justify-center mx-auto group-hover:scale-110 transition-transform">
            <UploadCloud size={32} />
          </div>
          <div>
            <h3 className="font-headline font-bold text-lg">
              Drag & Drop file to inspect C2PA & Metadata
            </h3>
            <p className="text-xs text-[var(--muted)] mt-1">
              Supports JPEG, PNG (tEXt/caPI chunks), WebP, PDF documents, and MP3 audio. 100% In-Browser Memory.
            </p>
          </div>
          <label className="btn-primary text-xs font-bold px-6 py-2.5 inline-flex items-center gap-2 cursor-pointer">
            Browse File
            <input
              type="file"
              onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
              accept="image/*,application/pdf,audio/*"
              className="hidden"
            />
          </label>
        </div>
      ) : loading ? (
        <div className="p-12 text-center space-y-3 font-mono text-xs text-[var(--muted)]">
          <RefreshCw size={24} className="animate-spin text-[var(--accent)] mx-auto" />
          <span>Extracting EXIF, IPTC, XMP, and C2PA manifests in local RAM...</span>
        </div>
      ) : (
        /* Metadata Content Area */
        <div className="space-y-6">
          {/* File Overview Summary Strip */}
          <div className="p-4 rounded-2xl bg-[var(--surface-sunken)] border border-[var(--line)] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[var(--panel)] border border-[var(--line)] flex items-center justify-center text-[var(--accent)]">
                <FileCheck size={20} />
              </div>
              <div>
                <span className="font-bold text-sm text-[var(--text)] block truncate max-w-sm">
                  {metadata?.fileName}
                </span>
                <span className="text-xs text-[var(--muted)] font-mono">
                  {(metadata?.fileSize || 0) > 1024 * 1024
                    ? `${((metadata?.fileSize || 0) / (1024 * 1024)).toFixed(2)} MB`
                    : `${Math.round((metadata?.fileSize || 0) / 1024)} KB`}{' '}
                  · {metadata?.mimeType}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <label className="btn-secondary text-xs flex items-center gap-1.5 cursor-pointer">
                <RefreshCw size={13} />
                Change File
                <input
                  type="file"
                  onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
                  accept="image/*,application/pdf,audio/*"
                  className="hidden"
                />
              </label>
            </div>
          </div>

          {/* TAB 1: VIEWER & C2PA */}
          {activeTab === 'view' && metadata && (
            <div className="space-y-6">
              {/* C2PA CONTENT CREDENTIALS CARD (Like ChatGPT / Nano Banana / Adobe) */}
              {metadata.c2pa?.hasManifest ? (
                <div className="p-5 rounded-2xl bg-[var(--surface-sunken)] border-2 border-emerald-500/40 shadow-lg space-y-4">
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
                      <span className="font-bold text-[var(--text)] block truncate">{metadata.c2pa.claimAction}</span>
                    </div>
                    <div className="p-3 rounded-xl bg-[var(--panel)] border border-[var(--line)] space-y-1">
                      <span className="text-[var(--muted)] text-[11px] block uppercase">Signature Timestamp</span>
                      <span className="font-bold text-[var(--text)] block truncate">{metadata.c2pa.timestamp}</span>
                    </div>
                  </div>

                  {/* Embedded Generation Prompt if present */}
                  {metadata.c2pa.aiPrompt && (
                    <div className="p-3.5 rounded-xl bg-[var(--panel)] border border-[var(--line)] space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold flex items-center gap-1.5 text-[var(--accent)]">
                          <Sparkles size={14} />
                          Embedded AI Generation Prompt / Title
                        </span>
                        <button
                          type="button"
                          onClick={() => copyPromptToClipboard(metadata.c2pa?.aiPrompt || '')}
                          className="text-xs text-[var(--muted)] hover:text-[var(--text)] flex items-center gap-1 font-mono"
                        >
                          {copiedPrompt ? <Check size={12} className="text-emerald-400" /> : <Clipboard size={12} />}
                          {copiedPrompt ? 'Copied' : 'Copy Prompt'}
                        </button>
                      </div>
                      <p className="text-xs font-mono text-[var(--text)] bg-[var(--surface-sunken)] p-2.5 rounded-lg border border-[var(--line)] whitespace-pre-wrap">
                        {metadata.c2pa.aiPrompt}
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
              ) : null}

              {/* GPS Map Block if present */}
              {metadata.gpsCoordinates && (
                <div className="p-4 rounded-xl bg-[var(--surface-sunken)] border border-red-500/30">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2 text-red-400 font-bold text-xs uppercase tracking-wider">
                      <MapPin size={16} />
                      Embedded GPS Location Found
                    </div>
                    <a
                      href={metadata.gpsCoordinates.googleMapsUrl}
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
                  <div className="p-8 text-center space-y-3">
                    <p className="text-xs text-[var(--muted)]">
                      No embedded metadata tags detected in this file. It is clean or already sanitized.
                    </p>
                    <button
                      type="button"
                      onClick={() => setActiveTab('edit')}
                      className="btn-secondary text-xs inline-flex items-center gap-1.5"
                    >
                      <Edit3 size={13} />
                      Inject Custom Metadata & C2PA
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: METADATA EDITOR & C2PA INJECTOR */}
          {activeTab === 'edit' && (
            <div className="p-6 rounded-2xl bg-[var(--surface-sunken)] border border-[var(--line)] space-y-6">
              <div>
                <h3 className="font-headline font-bold text-lg mb-1">
                  In-Place Metadata Injection & C2PA Signer
                </h3>
                <p className="text-xs text-[var(--muted)]">
                  Overwrites or injects custom fields into JPEG EXIF/APP11, PNG tEXt/caPI chunks, PDF trailers, or ID3 containers while stripping GPS coordinates.
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
                    Document / Image Title / Prompt
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
                    Software / Generator Fingerprint
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

              {/* Sign with C2PA Toggle */}
              <div className="p-3.5 rounded-xl bg-[var(--panel)] border border-[var(--line)] flex items-center justify-between">
                <div className="space-y-0.5">
                  <span className="text-xs font-bold flex items-center gap-1.5 text-emerald-400">
                    <ShieldCheck size={14} />
                    Sign with C2PA Content Credentials [CR] Manifest
                  </span>
                  <p className="text-[11px] text-[var(--muted)]">
                    Embeds verifiable cryptographic provenance box (APP11 JUMBF in JPEG, caPI chunk in PNG) so detectors immediately verify your authorship.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={signWithC2pa}
                  onChange={(e) => setSignWithC2pa(e.target.checked)}
                  className="accent-[var(--accent)] w-4 h-4 cursor-pointer"
                />
              </div>

              <div className="pt-4 border-t border-[var(--line)] flex items-center justify-between flex-wrap gap-4">
                <span className="text-xs text-[var(--muted)] font-mono">
                  100% Client-Side Binary Stream Encoding
                </span>
                <button
                  type="button"
                  onClick={handleSaveEdits}
                  disabled={isSavingEdit}
                  className="btn-primary text-xs font-bold flex items-center gap-1.5 shadow-md hover:scale-105 transition-all"
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
