import {
  Check,
  Clipboard,
  Download,
  Eraser,
  Eye,
  Plus,
  RotateCcw,
  Settings2,
  ShieldCheck,
  Sparkles,
  Trash2,
  Upload,
} from 'lucide-react';
import { useEffect, useId, useMemo, useState } from 'react';
import {
  defaultDetectors,
  scrubText,
  type CustomRule,
  type DetectorId,
  type DiffSegment,
  type TokenMapping,
} from '../lib/scrub';

const sampleText = `Please email customer reports to mina.patel@acme-corp.com or reach out at +1 (415) 890-1244.
The internal API endpoint is https://api.internal.acme.com/v1/auth with token sk-live-9988112233445566.
Account ref: CUST-88392 (SSN: 123-45-6789) on server 192.168.1.105. Card on file: 4532 8912 3456 7890.`;

export function ScrubberWorkspace() {
  const [raw, setRaw] = useState(sampleText);
  const [cleaned, setCleaned] = useState('');
  const [enabled, setEnabled] = useState<Set<DetectorId>>(
    () => new Set(defaultDetectors.map(({ id }) => id))
  );
  const [customRules, setCustomRules] = useState<CustomRule[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [mappings, setMappings] = useState<TokenMapping[]>([]);
  const [diffSegments, setDiffSegments] = useState<DiffSegment[]>([]);
  const [copied, setCopied] = useState(false);
  const [liveScrub, setLiveScrub] = useState(true);
  const [viewMode, setViewMode] = useState<'plain' | 'diff'>('diff');
  const [showCustomDrawer, setShowCustomDrawer] = useState(false);

  // New rule form state
  const [newLabel, setNewLabel] = useState('');
  const [newPattern, setNewPattern] = useState('');
  const [newToken, setNewToken] = useState('');
  const [newIsRegex, setNewIsRegex] = useState(false);

  const customRuleId = useId();

  // Run scrubbing
  const executeScrub = (source: string) => {
    const result = scrubText(source, enabled, customRules);
    setCleaned(result.text);
    setCounts(result.counts);
    setMappings(result.mappings);
    setDiffSegments(result.diffSegments);
    setCopied(false);
  };

  useEffect(() => {
    if (liveScrub) {
      executeScrub(raw);
    }
  }, [raw, enabled, customRules, liveScrub]);

  function toggleDetector(id: DetectorId) {
    setEnabled((curr) => {
      const next = new Set(curr);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function addCustomRule(e: React.FormEvent) {
    e.preventDefault();
    if (!newPattern.trim()) return;

    const rule: CustomRule = {
      id: `rule_${Date.now().toString(36)}`,
      label: newLabel.trim() || 'Custom Rule',
      patternString: newPattern.trim(),
      token: (newToken.trim() || 'CUSTOM').toUpperCase().replace(/[^A-Z0-9_]/g, '_'),
      isRegex: newIsRegex,
      enabled: true,
    };

    setCustomRules((prev) => [...prev, rule]);
    setNewLabel('');
    setNewPattern('');
    setNewToken('');
  }

  function removeCustomRule(id: string) {
    setCustomRules((prev) => prev.filter((r) => r.id !== id));
  }

  function toggleCustomRule(id: string) {
    setCustomRules((prev) =>
      prev.map((r) => (r.id === id ? { ...r, enabled: !r.enabled } : r))
    );
  }

  async function handleCopy() {
    if (!cleaned) return;
    await navigator.clipboard.writeText(cleaned);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }

  function handleClear() {
    setRaw('');
    setCleaned('');
    setCounts({});
    setMappings([]);
    setDiffSegments([]);
    setCopied(false);
  }

  function exportDictionary() {
    const payload = {
      version: 1,
      createdAt: new Date().toISOString(),
      sourceHash: `len_${raw.length}`,
      mappings,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `aiscrubber_dictionary_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const totalReplacements = useMemo(
    () => Object.values(counts).reduce((a, b) => a + b, 0),
    [counts]
  );

  return (
    <div className="workspace-panel">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-[var(--line)]">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="badge-emerald">Text Scrubber</span>
            <span className="text-xs text-[var(--muted)] font-mono">
              Live & Reversible
            </span>
          </div>
          <h2 className="text-2xl md:text-3xl font-headline font-bold">
            Browser-Local Text Redaction
          </h2>
          <p className="text-sm text-[var(--muted)] mt-1">
            Replaces sensitive variables with consistent labels before text is shared.
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <button
            type="button"
            onClick={() => setLiveScrub(!liveScrub)}
            className={`btn-secondary text-xs ${
              liveScrub ? 'border-[var(--accent)] text-[var(--accent)]' : ''
            }`}
          >
            <Sparkles size={14} />
            Live Scrub: {liveScrub ? 'ON' : 'OFF'}
          </button>

          <button
            type="button"
            onClick={() => setShowCustomDrawer(!showCustomDrawer)}
            className="btn-secondary text-xs"
          >
            <Settings2 size={14} />
            Custom Rules ({customRules.length})
          </button>

          <div className="flex items-center gap-1 bg-[var(--surface-sunken)] p-1 rounded-lg border border-[var(--line)]">
            <button
              type="button"
              onClick={() => setViewMode('plain')}
              className={`px-3 py-1 text-xs rounded font-medium transition-all ${
                viewMode === 'plain'
                  ? 'bg-[var(--accent)] text-[var(--accent-ink)] font-bold'
                  : 'text-[var(--muted)] hover:text-[var(--text)]'
              }`}
            >
              Plain Text
            </button>
            <button
              type="button"
              onClick={() => setViewMode('diff')}
              className={`px-3 py-1 text-xs rounded font-medium transition-all ${
                viewMode === 'diff'
                  ? 'bg-[var(--accent)] text-[var(--accent-ink)] font-bold'
                  : 'text-[var(--muted)] hover:text-[var(--text)]'
              }`}
            >
              Inspect Diff
            </button>
          </div>
        </div>
      </div>

      {/* Built-in Detector Selector */}
      <div className="my-6">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-mono uppercase tracking-wider text-[var(--muted)]">
            Active Detectors ({enabled.size + customRules.filter((r) => r.enabled).length})
          </span>
          <div className="flex items-center gap-2 text-xs">
            <button
              type="button"
              onClick={() =>
                setEnabled(new Set(defaultDetectors.map(({ id }) => id)))
              }
              className="text-[var(--accent)] hover:underline"
            >
              Enable All
            </button>
            <span className="text-[var(--muted)]">·</span>
            <button
              type="button"
              onClick={() => setEnabled(new Set())}
              className="text-[var(--muted)] hover:text-[var(--text)]"
            >
              Clear All
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
          {defaultDetectors.map((detector) => {
            const isActive = enabled.has(detector.id);
            const count = counts[detector.id] || 0;
            return (
              <button
                key={detector.id}
                type="button"
                onClick={() => toggleDetector(detector.id)}
                className={`detector-chip ${isActive ? 'active' : ''}`}
              >
                <span className="font-semibold text-xs">{detector.label}</span>
                {count > 0 && <span className="count-pill">{count}</span>}
              </button>
            );
          })}
        </div>
      </div>

      {/* Custom Rules Drawer */}
      {showCustomDrawer && (
        <div className="mb-6 p-4 rounded-xl bg-[var(--surface-sunken)] border border-[var(--line)]">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-bold flex items-center gap-2">
              <Settings2 size={16} className="text-[var(--accent)]" />
              Custom Keywords & Regex Rules
            </h4>
            <span className="text-xs text-[var(--muted)]">
              Add proprietary terms or patterns
            </span>
          </div>

          <form
            onSubmit={addCustomRule}
            className="grid grid-cols-1 sm:grid-cols-12 gap-3 mb-4"
          >
            <div className="sm:col-span-3">
              <input
                type="text"
                placeholder="Rule name (e.g. Project Name)"
                value={newLabel}
                onChange={(e) => setNewLabel(e.target.value)}
                className="input-field text-xs"
              />
            </div>
            <div className="sm:col-span-4">
              <input
                type="text"
                placeholder="Keyword or Regex pattern"
                value={newPattern}
                onChange={(e) => setNewPattern(e.target.value)}
                className="input-field text-xs font-mono"
                required
              />
            </div>
            <div className="sm:col-span-2">
              <input
                type="text"
                placeholder="Token (e.g. ORG)"
                value={newToken}
                onChange={(e) => setNewToken(e.target.value)}
                className="input-field text-xs font-mono"
              />
            </div>
            <div className="sm:col-span-2 flex items-center gap-2 px-2">
              <label className="text-xs text-[var(--muted)] flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={newIsRegex}
                  onChange={(e) => setNewIsRegex(e.target.checked)}
                />
                Regex
              </label>
            </div>
            <div className="sm:col-span-1">
              <button
                type="submit"
                className="btn-primary w-full text-xs flex items-center justify-center p-2"
                title="Add Rule"
              >
                <Plus size={16} />
              </button>
            </div>
          </form>

          {customRules.length > 0 ? (
            <div className="space-y-2">
              {customRules.map((rule) => (
                <div
                  key={rule.id}
                  className="flex items-center justify-between p-2.5 rounded-lg bg-[var(--panel)] border border-[var(--line)] text-xs"
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={rule.enabled}
                      onChange={() => toggleCustomRule(rule.id)}
                    />
                    <span className="font-semibold">{rule.label}</span>
                    <code className="font-mono text-[var(--accent)] bg-[var(--surface-sunken)] px-1.5 py-0.5 rounded">
                      {rule.patternString}
                    </code>
                    <span className="text-[var(--muted)]">→ [{rule.token}_N]</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeCustomRule(rule.id)}
                    className="text-[var(--muted)] hover:text-red-500 transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-[var(--muted)] italic">
              No custom rules added yet.
            </p>
          )}
        </div>
      )}

      {/* Editor Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Raw Text Input */}
        <div className="editor-card">
          <div className="editor-card-header">
            <span className="font-bold text-xs uppercase tracking-wider">
              Source Text
            </span>
            <span className="text-xs font-mono text-[var(--muted)]">
              {raw.length.toLocaleString()} characters
            </span>
          </div>
          <textarea
            value={raw}
            onChange={(e) => setRaw(e.target.value)}
            placeholder="Paste your source text, logs, or confidential draft here..."
            className="editor-textarea"
            spellCheck="false"
          />
        </div>

        {/* Cleaned / Diff Output */}
        <div className="editor-card">
          <div className="editor-card-header">
            <span className="font-bold text-xs uppercase tracking-wider text-[var(--accent)]">
              Sanitized Output
            </span>
            <span className="text-xs font-mono text-[var(--muted)]">
              {totalReplacements} replacement
              {totalReplacements === 1 ? '' : 's'}
            </span>
          </div>

          {viewMode === 'plain' ? (
            <textarea
              value={cleaned}
              readOnly
              placeholder="Sanitized output will appear here..."
              className="editor-textarea text-[var(--accent)] font-mono"
              spellCheck="false"
            />
          ) : (
            <div className="editor-diff-viewer">
              {diffSegments.length > 0 ? (
                diffSegments.map((segment, idx) => {
                  if (segment.type === 'unchanged') {
                    return <span key={idx}>{segment.text}</span>;
                  }
                  return (
                    <mark
                      key={idx}
                      className="diff-mark"
                      title={`Original: ${segment.originalValue || ''} (${segment.detector})`}
                    >
                      {segment.text}
                    </mark>
                  );
                })
              ) : (
                <span className="text-[var(--muted)] italic">
                  Waiting for input to scrub...
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Action Strip */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 pt-4 border-t border-[var(--line)]">
        <div className="flex items-center gap-2 text-xs text-[var(--muted)]">
          <ShieldCheck size={16} className="text-[var(--accent)]" />
          <span>Processed locally in browser memory. Nothing sent to server.</span>
        </div>

        <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto justify-end">
          <button
            type="button"
            onClick={handleClear}
            className="btn-secondary text-xs"
          >
            <Eraser size={15} />
            Clear
          </button>

          {mappings.length > 0 && (
            <button
              type="button"
              onClick={exportDictionary}
              className="btn-secondary text-xs"
              title="Download replacement key for reversible un-scrubbing"
            >
              <Download size={15} />
              Export Key ({mappings.length})
            </button>
          )}

          {!liveScrub && (
            <button
              type="button"
              onClick={() => executeScrub(raw)}
              disabled={!raw}
              className="btn-primary text-xs"
            >
              <Sparkles size={15} />
              Scrub Now
            </button>
          )}

          <button
            type="button"
            onClick={handleCopy}
            disabled={!cleaned}
            className="btn-primary text-xs font-bold"
          >
            {copied ? <Check size={15} /> : <Clipboard size={15} />}
            {copied ? 'Copied Clean Text' : 'Copy Clean Text'}
          </button>
        </div>
      </div>
    </div>
  );
}
