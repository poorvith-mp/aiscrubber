import {
  AlertCircle,
  AlertTriangle,
  Check,
  CheckCircle2,
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
  Tag,
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
  const [viewTab, setViewTab] = useState<'editor' | 'heatmap'>('editor');
  const [copied, setCopied] = useState(false);

  // Granular Switches
  const [stripZeroWidth, setStripZeroWidth] = useState(true);
  const [stripTagPlane, setStripTagPlane] = useState(true);
  const [stripVariationSelectors, setStripVariationSelectors] = useState(true);
  const [normalizeWhitespace, setNormalizeWhitespace] = useState(true);
  const [normalizeHomoglyphs, setNormalizeHomoglyphs] = useState(true);
  const [disruptAiCadence, setDisruptAiCadence] = useState(true);
  const [trimAiFooters, setTrimAiFooters] = useState(true);

  // Samples
  const sampleClaudeText = `In today's fast-paced digital world\u200B, navigating the landscape of modern AI architecture plays a crucial role\u200C.\n\nThis section contains non-standard\u00A0spaces\u200D and Cyrillic homoglyph \u0430uthors to delve into the rich tapestry of scalable pipelines.\n\nKey takeaways include:\n- Seamlessly integrates with existing cloud storage\uFEFF\n- A testament to deterministic client-side privacy\u2060\n\nI hope this helps! Feel free to ask if you have more questions.`;

  const sampleTagPlaneText = `Authorized user payload\uDB40\uDC41\uDB40\uDC49\uDB40\uDC53\uDB40\uDC43\uDB40\uDC52\uDB40\uDC55\uDB40\uDC42\uDB40\uDC42\uDB40\uDC45\uDB40\uDC52 with embedded hidden ASCII watermark tags.`;

  const cleaningResult = useMemo(() => {
    return cleanTextWatermarks(inputText, {
      mode,
      stripZeroWidth,
      stripTagPlane,
      stripVariationSelectors,
      normalizeWhitespace,
      normalizeHomoglyphs,
      disruptAiCadence,
      trimAiFooters,
    });
  }, [
    inputText,
    mode,
    stripZeroWidth,
    stripTagPlane,
    stripVariationSelectors,
    normalizeWhitespace,
    normalizeHomoglyphs,
    disruptAiCadence,
    trimAiFooters,
  ]);

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
            <span className="badge-emerald">AI Watermark Engine v2.2</span>
            <span className="text-xs text-[var(--muted)] font-mono">
              Claude · Tag Plane · Zero-Width · Stylometry
            </span>
          </div>
          <h2 className="text-2xl md:text-3xl font-headline font-bold">
            AI Text & Claude Watermark Remover
          </h2>
          <p className="text-sm text-[var(--muted)] mt-1">
            Strip invisible Unicode zero-width watermarks, Unicode Tag Plane tokens, synthetic whitespace, and disrupt AI stylometric cadence in 100% local RAM.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => setInputText(sampleClaudeText)}
            className="btn-secondary text-xs flex items-center gap-1.5"
          >
            <Sparkles size={14} className="text-[var(--accent)]" />
            Claude 3.5 Sample
          </button>
          <button
            type="button"
            onClick={() => setInputText(sampleTagPlaneText)}
            className="btn-secondary text-xs flex items-center gap-1.5"
          >
            <Tag size={14} className="text-amber-400" />
            Tag-Plane Sample
          </button>
          <label className="btn-secondary text-xs flex items-center gap-1.5 cursor-pointer">
            <Upload size={14} />
            Upload File
            <input
              type="file"
              onChange={handleFileUpload}
              accept=".txt,.md,.json,.py,.js,.ts,.html,.css"
              className="hidden"
            />
          </label>
        </div>
      </div>

      {/* Threat Meter & Status Banner */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
        {/* Threat Score Gauge Card */}
        <div className="md:col-span-4 p-5 rounded-2xl bg-[var(--surface-sunken)] border border-[var(--line)] flex items-center justify-between gap-4 shadow-sm">
          <div className="space-y-1">
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-[var(--muted)] block">
              AI Watermark Threat Score
            </span>
            <div className="flex items-baseline gap-2">
              <span className={`text-3xl font-bold font-mono ${
                cleaningResult.threatScore > 50
                  ? 'text-red-400'
                  : cleaningResult.threatScore > 20
                  ? 'text-amber-400'
                  : 'text-emerald-400'
              }`}>
                {cleaningResult.threatScore}%
              </span>
              <span className="text-xs font-mono font-bold uppercase text-[var(--muted)]">
                {cleaningResult.threatLevel}
              </span>
            </div>
            <p className="text-[11px] text-[var(--muted)]">
              {cleaningResult.stats.totalAnomalies === 0
                ? 'No invisible markers detected.'
                : `${cleaningResult.stats.totalAnomalies} hidden anomaly marker(s) discovered.`}
            </p>
          </div>

          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold ${
            cleaningResult.threatScore > 50
              ? 'bg-red-500/20 text-red-400 border border-red-500/30'
              : cleaningResult.threatScore > 20
              ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
              : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
          }`}>
            {cleaningResult.threatScore > 50 ? (
              <ShieldAlert size={24} />
            ) : (
              <ShieldCheck size={24} />
            )}
          </div>
        </div>

        {/* Stats Grid */}
        <div className="md:col-span-8 grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3.5 rounded-2xl bg-[var(--surface-sunken)] border border-[var(--line)] space-y-0.5">
            <span className="text-[10px] font-mono text-[var(--muted)] uppercase block">
              Zero-Width & Tags
            </span>
            <span className="text-xl font-bold font-mono text-[var(--accent)]">
              {cleaningResult.stats.zeroWidthRemoved + cleaningResult.stats.tagPlaneRemoved + cleaningResult.stats.variationSelectorsRemoved}
            </span>
          </div>
          <div className="p-3.5 rounded-2xl bg-[var(--surface-sunken)] border border-[var(--line)] space-y-0.5">
            <span className="text-[10px] font-mono text-[var(--muted)] uppercase block">
              Synthetic Spaces
            </span>
            <span className="text-xl font-bold font-mono text-[var(--accent)]">
              {cleaningResult.stats.spacesNormalized}
            </span>
          </div>
          <div className="p-3.5 rounded-2xl bg-[var(--surface-sunken)] border border-[var(--line)] space-y-0.5">
            <span className="text-[10px] font-mono text-[var(--muted)] uppercase block">
              Homoglyphs
            </span>
            <span className="text-xl font-bold font-mono text-[var(--accent)]">
              {cleaningResult.stats.homoglyphsRestored}
            </span>
          </div>
          <div className="p-3.5 rounded-2xl bg-[var(--surface-sunken)] border border-[var(--line)] space-y-0.5">
            <span className="text-[10px] font-mono text-[var(--muted)] uppercase block">
              AI Cadence / Clichés
            </span>
            <span className="text-xl font-bold font-mono text-[var(--accent)]">
              {cleaningResult.stats.aiCadenceDisrupted + cleaningResult.stats.aiFootersCleaned}
            </span>
          </div>
        </div>
      </div>

      {/* Preset Mode Selector & Granular Toggles */}
      <div className="p-4 rounded-2xl bg-[var(--surface-sunken)] border border-[var(--line)] space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <span className="text-xs font-mono font-bold uppercase tracking-wider text-[var(--muted)]">
            Sanitization Profile
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
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3 pt-3 border-t border-[var(--line)] text-xs">
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
              checked={stripTagPlane}
              onChange={(e) => setStripTagPlane(e.target.checked)}
              className="accent-[var(--accent)]"
            />
            <span>Tag-Plane Unicode</span>
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
            <span>Homoglyphs</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer text-[var(--muted)] hover:text-[var(--text)]">
            <input
              type="checkbox"
              checked={disruptAiCadence}
              onChange={(e) => setDisruptAiCadence(e.target.checked)}
              className="accent-[var(--accent)]"
            />
            <span>AI Clichés</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer text-[var(--muted)] hover:text-[var(--text)]">
            <input
              type="checkbox"
              checked={trimAiFooters}
              onChange={(e) => setTrimAiFooters(e.target.checked)}
              className="accent-[var(--accent)]"
            />
            <span>AI Footers</span>
          </label>
        </div>
      </div>

      {/* Editor & Heatmap Tabs */}
      <div className="flex items-center justify-between border-b border-[var(--line)] pb-2">
        <div className="flex items-center gap-2 bg-[var(--surface-sunken)] p-1 rounded-xl border border-[var(--line)]">
          <button
            type="button"
            onClick={() => setViewTab('editor')}
            className={`px-3 py-1 text-xs rounded-lg font-bold transition-all flex items-center gap-1.5 ${
              viewTab === 'editor'
                ? 'bg-[var(--accent)] text-[var(--accent-ink)]'
                : 'text-[var(--muted)] hover:text-[var(--text)]'
            }`}
          >
            <FileText size={13} />
            Side-by-Side Editor
          </button>
          <button
            type="button"
            onClick={() => setViewTab('heatmap')}
            className={`px-3 py-1 text-xs rounded-lg font-bold transition-all flex items-center gap-1.5 ${
              viewTab === 'heatmap'
                ? 'bg-[var(--accent)] text-[var(--accent-ink)]'
                : 'text-[var(--muted)] hover:text-[var(--text)]'
            }`}
          >
            <Eye size={13} />
            Visual Anomaly Heatmap ({cleaningResult.detectedEntities.length})
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={copyToClipboard}
            disabled={!cleaningResult.cleanedText}
            className="btn-secondary text-xs flex items-center gap-1.5"
          >
            {copied ? <Check size={13} className="text-emerald-400" /> : <Clipboard size={13} />}
            {copied ? 'Copied' : 'Copy Sanitized'}
          </button>
          <button
            type="button"
            onClick={downloadCleanedFile}
            disabled={!cleaningResult.cleanedText}
            className="btn-secondary text-xs flex items-center gap-1.5"
          >
            <Download size={13} />
            Export File
          </button>
        </div>
      </div>

      {/* VIEW TAB 1: SIDE-BY-SIDE EDITOR */}
      {viewTab === 'editor' && (
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
                  Sanitized Clean Output
                </span>
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
      )}

      {/* VIEW TAB 2: VISUAL ANOMALY HEATMAP */}
      {viewTab === 'heatmap' && (
        <div className="p-6 rounded-2xl bg-[var(--surface-sunken)] border border-[var(--line)] space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[var(--line)]">
            <div>
              <h4 className="font-headline font-bold text-base">
                Visual Watermark Heatmap & Token Inspector
              </h4>
              <p className="text-xs text-[var(--muted)]">
                Highlighting detected invisible Unicode characters, Tag Plane tokens, and AI cadence phrases in-place.
              </p>
            </div>
          </div>

          {cleaningResult.detectedEntities.length > 0 ? (
            <div className="space-y-4">
              {/* Highlighted text preview box */}
              <div className="p-5 rounded-xl bg-[var(--panel)] border border-[var(--line)] font-mono text-xs leading-relaxed whitespace-pre-wrap">
                {inputText}
              </div>

              {/* Grid of detected items */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 max-h-64 overflow-y-auto font-mono text-xs">
                {cleaningResult.detectedEntities.map((ent, idx) => (
                  <div
                    key={idx}
                    className={`p-2.5 rounded-xl border flex items-center justify-between gap-2 ${
                      ent.severity === 'high'
                        ? 'bg-red-500/10 border-red-500/20 text-red-300'
                        : ent.severity === 'medium'
                        ? 'bg-amber-500/10 border-amber-500/20 text-amber-300'
                        : 'bg-blue-500/10 border-blue-500/20 text-blue-300'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <span className="font-bold shrink-0">{ent.codePoint}</span>
                      <span className="text-[11px] truncate opacity-90" title={ent.name}>
                        {ent.name}
                      </span>
                    </div>
                    <span className="text-[10px] uppercase font-bold shrink-0">
                      {ent.category}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="p-8 text-center text-xs text-[var(--muted)] space-y-1">
              <CheckCircle2 size={24} className="text-emerald-400 mx-auto" />
              <p className="font-bold text-[var(--text)]">No watermark anomalies found</p>
              <p>Paste Claude or AI text above to analyze invisible tokens.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
