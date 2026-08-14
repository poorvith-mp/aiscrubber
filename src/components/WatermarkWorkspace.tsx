import {
  AlertCircle,
  AlertTriangle,
  Check,
  Clipboard,
  Code2,
  Download,
  Eye,
  FileCode2,
  FileText,
  HelpCircle,
  Layers,
  RefreshCw,
  Search,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Trash2,
  Upload,
  Zap,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import {
  cleanTextWatermarks,
  inspectWatermarks,
  type WatermarkCleaningOptions,
} from '../lib/watermark';

export function WatermarkWorkspace() {
  const [inputText, setInputText] = useState('');
  const [mode, setMode] = useState<WatermarkCleaningOptions['mode']>('all');
  const [copied, setCopied] = useState(false);
  const [stripZeroWidth, setStripZeroWidth] = useState(true);
  const [normalizeWhitespace, setNormalizeWhitespace] = useState(true);
  const [normalizeHomoglyphs, setNormalizeHomoglyphs] = useState(true);
  const [stripAiCadence, setStripAiCadence] = useState(true);

  // Sample with invisible zero-width spaces, Cyrillic homoglyph, and Claude-style markers
  const sampleWatermarkedText = `Here is the requested architecture summary for the project\u200B.\n\u200CThis section contains non-standard\u00A0spaces\u200D and Cyrillic homoglyph \u0430uthors.\n\nKey features include:\n- Deterministic parsing\u200B\n- Client-side execution\uFEFF\n\nI hope this helps! Feel free to ask if you have more questions.`;

  const cleaningResult = useMemo(() => {
    return cleanTextWatermarks(inputText, {
      mode,
      stripZeroWidth,
      normalizeWhitespace,
      normalizeHomoglyphs,
      stripAiCadence,
    });
  }, [inputText, mode, stripZeroWidth, normalizeWhitespace, normalizeHomoglyphs, stripAiCadence]);

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(cleaningResult.cleanedText);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setInputText(reader.result);
      }
    };
    reader.readAsText(file);
  };

  const downloadCleanedFile = () => {
    const blob = new Blob([cleaningResult.cleanedText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'cleaned_ai_text.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="workspace-panel space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-[var(--line)]">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="badge-emerald">AI Watermark Engine</span>
            <span className="text-xs text-[var(--muted)] font-mono">
              Claude · Zero-Width · Homoglyphs · Provenance
            </span>
          </div>
          <h2 className="text-2xl md:text-3xl font-headline font-bold">
            AI Text & Claude Watermark Remover
          </h2>
          <p className="text-sm text-[var(--muted)] mt-1">
            Strip invisible Unicode zero-width tokens, normalize synthetic whitespace, revert homoglyphs, and remove AI fingerprint markers in 100% local memory.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => setInputText(sampleWatermarkedText)}
            className="btn-secondary text-xs flex items-center gap-1.5"
          >
            <Sparkles size={14} className="text-[var(--accent)]" />
            Load Sample Claude Watermark
          </button>
          <label className="btn-secondary text-xs flex items-center gap-1.5 cursor-pointer">
            <Upload size={14} />
            Upload File
            <input type="file" onChange={handleFileUpload} accept=".txt,.md,.json,.py,.js,.ts" className="hidden" />
          </label>
        </div>
      </div>

      {/* Preset Mode Selector & Granular Toggles */}
      <div className="p-4 rounded-xl bg-[var(--surface-sunken)] border border-[var(--line)] space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <span className="text-xs font-mono font-bold uppercase tracking-wider text-[var(--muted)]">
            Cleaning Profile
          </span>
          <div className="flex items-center gap-2 flex-wrap">
            {(
              [
                { id: 'all', label: 'Aggressive (All Tiers)' },
                { id: 'claude_clean', label: 'Claude & LLM Output' },
                { id: 'code_safe', label: 'Code Safe (Preserve Indents)' },
                { id: 'invisible_only', label: 'Invisible Unicode Only' },
              ] as const
            ).map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setMode(p.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  mode === p.id
                    ? 'bg-[var(--accent)] text-[var(--accent-ink)] font-bold shadow-sm'
                    : 'bg-[var(--panel)] text-[var(--muted)] border border-[var(--line)] hover:text-[var(--text)]'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Feature Switches */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-[var(--line)] text-xs">
          <label className="flex items-center gap-2 cursor-pointer text-[var(--muted)] hover:text-[var(--text)]">
            <input
              type="checkbox"
              checked={stripZeroWidth}
              onChange={(e) => setStripZeroWidth(e.target.checked)}
              className="accent-[var(--accent)]"
            />
            <span>Zero-Width Tokens</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer text-[var(--muted)] hover:text-[var(--text)]">
            <input
              type="checkbox"
              checked={normalizeWhitespace}
              onChange={(e) => setNormalizeWhitespace(e.target.checked)}
              className="accent-[var(--accent)]"
            />
            <span>Synthetic Spaces</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer text-[var(--muted)] hover:text-[var(--text)]">
            <input
              type="checkbox"
              checked={normalizeHomoglyphs}
              onChange={(e) => setNormalizeHomoglyphs(e.target.checked)}
              className="accent-[var(--accent)]"
            />
            <span>Homoglyphs & Quotes</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer text-[var(--muted)] hover:text-[var(--text)]">
            <input
              type="checkbox"
              checked={stripAiCadence}
              onChange={(e) => setStripAiCadence(e.target.checked)}
              className="accent-[var(--accent)]"
            />
            <span>Claude AI Footers</span>
          </label>
        </div>
      </div>

      {/* Stats Counter Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-xl bg-[var(--surface-sunken)] border border-[var(--line)]">
          <span className="text-[11px] font-mono text-[var(--muted)] uppercase block">
            Zero-Width Stripped
          </span>
          <span className="text-xl font-bold font-mono text-[var(--accent)]">
            {cleaningResult.stats.zeroWidthRemoved}
          </span>
        </div>
        <div className="p-3.5 rounded-xl bg-[var(--surface-sunken)] border border-[var(--line)]">
          <span className="text-[11px] font-mono text-[var(--muted)] uppercase block">
            Spaces Normalized
          </span>
          <span className="text-xl font-bold font-mono text-[var(--accent)]">
            {cleaningResult.stats.spacesNormalized}
          </span>
        </div>
        <div className="p-3.5 rounded-xl bg-[var(--surface-sunken)] border border-[var(--line)]">
          <span className="text-[11px] font-mono text-[var(--muted)] uppercase block">
            Homoglyphs Restored
          </span>
          <span className="text-xl font-bold font-mono text-[var(--accent)]">
            {cleaningResult.stats.homoglyphsRestored}
          </span>
        </div>
        <div className="p-3.5 rounded-xl bg-[var(--surface-sunken)] border border-[var(--line)]">
          <span className="text-[11px] font-mono text-[var(--muted)] uppercase block">
            Total Anomalies
          </span>
          <span className="text-xl font-bold font-mono text-[var(--accent)]">
            {cleaningResult.stats.totalAnomalies}
          </span>
        </div>
      </div>

      {/* Side-by-Side Editor & Output */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Raw Input Box */}
        <div className="editor-card">
          <div className="editor-card-header">
            <div className="flex items-center gap-2">
              <FileText size={15} className="text-[var(--muted)]" />
              <span className="text-xs font-bold font-mono uppercase">Raw AI / Claude Input</span>
            </div>
            {inputText && (
              <button
                type="button"
                onClick={() => setInputText('')}
                className="text-xs text-[var(--muted)] hover:text-red-400 font-mono"
              >
                Clear
              </button>
            )}
          </div>
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Paste text generated by Claude, ChatGPT, or external models to inspect and strip hidden watermarks..."
            className="editor-textarea"
          />
        </div>

        {/* Cleaned Output Box */}
        <div className="editor-card">
          <div className="editor-card-header">
            <div className="flex items-center gap-2">
              <ShieldCheck size={15} className="text-[var(--accent)]" />
              <span className="text-xs font-bold font-mono uppercase text-[var(--accent)]">
                Sanitized & Cleaned Output
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={copyToClipboard}
                disabled={!cleaningResult.cleanedText}
                className="text-xs text-[var(--muted)] hover:text-[var(--text)] flex items-center gap-1 font-mono"
              >
                {copied ? <Check size={13} className="text-emerald-400" /> : <Clipboard size={13} />}
                {copied ? 'Copied' : 'Copy Clean'}
              </button>
              <button
                type="button"
                onClick={downloadCleanedFile}
                disabled={!cleaningResult.cleanedText}
                className="text-xs text-[var(--muted)] hover:text-[var(--text)] flex items-center gap-1 font-mono"
              >
                <Download size={13} />
                Export
              </button>
            </div>
          </div>
          <textarea
            value={cleaningResult.cleanedText}
            readOnly
            placeholder="Cleaned output with zero-width characters and AI watermark tokens removed will appear here..."
            className="editor-textarea bg-[var(--panel)]"
          />
        </div>
      </div>

      {/* Detected Anomalies Inspector Drawer */}
      {cleaningResult.detectedEntities.length > 0 && (
        <div className="p-4 rounded-xl bg-[var(--surface-sunken)] border border-amber-500/30 space-y-3">
          <div className="flex items-center gap-2 text-amber-300 font-bold text-xs uppercase tracking-wider">
            <AlertTriangle size={15} />
            Detected Invisible Unicode & Watermark Anomalies ({cleaningResult.detectedEntities.length})
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 max-h-48 overflow-y-auto font-mono text-xs">
            {cleaningResult.detectedEntities.map((ent, idx) => (
              <div
                key={idx}
                className="p-2 rounded-lg bg-[var(--panel)] border border-[var(--line)] flex items-center justify-between"
              >
                <span className="text-[var(--accent)] font-bold">{ent.codePoint}</span>
                <span className="text-[var(--muted)] truncate max-w-[160px]" title={ent.name}>
                  {ent.name}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
