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
import type { ReviewDecision } from '../lib/scrubCore.js';
import type { WorkflowSuccessKind } from '../lib/sponsorship';
import { useTextJob } from '../lib/useTextJob';
import { CLEANING_PROFILES, cleaningProfileConfig, type CleaningProfile } from '../lib/cleaningProfiles';
import { BUILTIN_PACKS, parseRulesPayload, resolveMergedConfig, validateConfig, type AiscrubConfig } from '../lib/rulesConfig';
import { buildTextExport, type TextExportFormat } from '../lib/textExport';
import { downloadBlob } from '../lib/download';
import { getDemoScenario } from '../lib/demoScenarios';
import { TextBatchPanel } from './TextBatchPanel';
import {
  defaultDetectors,
  type ScrubResult,
  type CustomRule,
  type DetectorId,

} from '../lib/scrub';

const sampleText = `Please email customer reports to mina.patel@acme-corp.com or reach out at +1 (415) 890-1244.
The internal API endpoint is https://api.internal.acme.com/v1/auth with token sk-live-9988112233445566.
Account ref: CUST-88392 (SSN: 123-45-6789) on server 192.168.1.105. Card on file: 4532 8912 3456 7890.`;

export function ScrubberWorkspace({ onWorkflowSuccess }: { onWorkflowSuccess: (kind: WorkflowSuccessKind) => void }) {
  const [raw, setRaw] = useState(() => getDemoScenario(new URLSearchParams(window.location.search).get('demo'))?.input || '');
  const [profile, setProfile] = useState<CleaningProfile['id']>('everyday');
  const [packs, setPacks] = useState<string[]>([]);
  const [allowlist, setAllowlist] = useState<AiscrubConfig['allowlist']>([]);
  const [error, setError] = useState('');
  const [enabled, setEnabled] = useState<Set<DetectorId>>(
    () => new Set(resolveMergedConfig(cleaningProfileConfig('everyday')).enabledDetectorIds)
  );
  const RULES_STORAGE_KEY = 'aiscrubber.rules.v1';

  const [customRules, setCustomRules] = useState<CustomRule[]>([]);
  const [decisions, setDecisions] = useState<ReviewDecision[]>([]);
  const [selection, setSelection] = useState({ start: 0, end: 0 });
  const [reviewLimit, setReviewLimit] = useState(100);
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

  const config = useMemo<AiscrubConfig>(() => ({
    version: 1, detectors: { disable: defaultDetectors.filter(({ id }) => !enabled.has(id)).map(({ id }) => id) },
    customRules, allowlist, extends: packs,
  }), [enabled, customRules, allowlist, packs]);
  const context = JSON.stringify({ raw, config });
  const [manualContext, setManualContext] = useState('');
  const [reviewContext, setReviewContext] = useState('');
  const currentDecisions = reviewContext === context ? decisions : [];
  const tooLarge = new TextEncoder().encode(raw).byteLength > 5 * 1024 * 1024;
  const job = useTextJob<ScrubResult>(raw && !tooLarge && (liveScrub || manualContext === context)
    ? { operation: 'scrub', source: raw, config, decisions: currentDecisions } : null);
  const cleaned = job.result?.text || '';
  const counts = job.result?.counts || {};
  const mappings = job.result?.mappings || [];
  const diffSegments = job.result?.diffSegments || [];
  const acceptedMatches = job.result?.acceptedMatches || [];
  const executeScrub = () => setManualContext(context);
  useEffect(() => { setCopied(false); setSelection({ start: 0, end: 0 }); setReviewLimit(100); }, [context]);

  function applyConfig(next: AiscrubConfig) {
    const resolved = resolveMergedConfig(validateConfig(next));
    setEnabled(new Set(resolved.enabledDetectorIds));
    setCustomRules((next.customRules || []) as CustomRule[]);
    setAllowlist(next.allowlist || []);
    setPacks(next.extends || []);
    setDecisions([]);
    setError('');
  }

  function downloadText(format: TextExportFormat) {
    if (!job.result) return;
    const file = buildTextExport(cleaned, format);
    downloadBlob(new Blob([file.contents], { type: file.mime }), file.filename);
    if ((job.result?.totalRedactions || 0) > 0) onWorkflowSuccess('text-download');
  }

  function addDecision(decision: ReviewDecision) {
    setReviewContext(context);
    setDecisions([...currentDecisions.filter((item) => item.start !== decision.start || item.end !== decision.end), decision]);
  }

  function hideSelection() {
    if (selection.end > selection.start) addDecision({ ...selection, action: 'hide' });
  }

  function decideAll(value: string, action: ReviewDecision['action']) {
    if (!value) return;
    const spans: ReviewDecision[] = [];
    let start = 0;
    while ((start = raw.indexOf(value, start)) !== -1) {
      spans.push({ start, end: start + value.length, action });
      if (spans.length > 1000) break;
      start += value.length;
    }
    if (spans.length > 1000) { setError('Review supports at most 1000 decisions. Narrow the selection.'); return; }
    setReviewContext(context);
    setDecisions([...currentDecisions.filter((decision) => !spans.some((span) => span.start === decision.start && span.end === decision.end)), ...spans]);
  }

  function toggleDetector(id: DetectorId) {
    setProfile('custom');
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

    try { validateConfig({ ...config, customRules: [...customRules, rule] }); }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Invalid custom rule.'); return; }
    setProfile('custom');
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
    try { await navigator.clipboard.writeText(cleaned); }
    catch { setError('Copy failed. Clipboard access was denied.'); return; }
    setCopied(true);
    if ((job.result?.totalRedactions || 0) > 0) onWorkflowSuccess('text-copy');
    setTimeout(() => setCopied(false), 1800);
  }

  function handleClear() {
    setRaw('');
    setDecisions([]);
    setCopied(false);
    setSelection({ start: 0, end: 0 });
  }

  function exportDictionary() {
    if (!window.confirm('This private session key contains original sensitive values. Save it locally and never send it to an AI service. Export?')) return;
    const payload = {
      format: 'aiscrubber-session', version: 2,
      variables: mappings.map(({ token, original, detectorId }) => ({ placeholder: token, original, detectorId })),
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: 'application/json',
    });
    downloadBlob(blob, 'session.aiscrub.json');
  }

  function exportRules() {
    const payload = validateConfig(config);
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `aiscrubber-rules-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function importRules(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';
    try {
      if (file.size > 1024 * 1024) throw new Error('Rules file exceeds 1 MiB.');
      applyConfig(parseRulesPayload(JSON.parse(await file.text())));
      setProfile('custom');
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Invalid rules file.'); }
  }

  function clearAllRules() {
    if (window.confirm('Clear all custom rules?')) {
      setCustomRules([]);
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.removeItem(RULES_STORAGE_KEY);
      }
    }
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

      <div className="my-4 flex flex-wrap items-center gap-3">
        <label className="text-sm">Cleaning profile
          <select aria-label="Cleaning profile" className="input-field ml-2" value={profile} onChange={(e) => {
            const id = e.target.value as CleaningProfile['id'];
            setProfile(id);
            if (id !== 'custom') applyConfig(cleaningProfileConfig(id));
          }}>
            {Object.values(CLEANING_PROFILES).map(({ id, label }) => <option key={id} value={id}>{label}</option>)}
          </select>
        </label>
        <button type="button" className="btn-secondary text-xs" onClick={() => { setRaw(sampleText); setDecisions([]); }}>Load example</button>
      </div>
      <p className="text-xs text-[var(--muted)]">{CLEANING_PROFILES[profile].description} Max pasted input: 5 MiB. Review before sharing; automatic detection cannot find every secret.</p>
      <div role="status" aria-live="polite" className="my-2 text-sm">
        {tooLarge ? 'Input exceeds 5 MiB. Reduce the input or use the local CLI.' : job.error || error || (job.busy ? 'Processing locally…' : job.cancelled ? 'Processing cancelled. Edit the input to retry.' : '')}
        {job.busy && <button type="button" className="btn-secondary ml-2" onClick={job.cancel}>Cancel processing</button>}
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
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div>
              <h4 className="text-sm font-bold flex items-center gap-2">
                <Settings2 size={16} className="text-[var(--accent)]" />
                Custom Keywords & Regex Rules
              </h4>
              <span className="text-xs text-[var(--muted)]">
                Rules stay in this tab unless you explicitly save them ({customRules.length})
              </span>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <button type="button" className="btn-secondary text-xs" onClick={() => {
                try { localStorage.setItem(RULES_STORAGE_KEY, JSON.stringify(validateConfig(config))); }
                catch { setError('Could not save rules in browser storage.'); }
              }}>Save rules on this device</button>
              <button type="button" className="btn-secondary text-xs" onClick={() => {
                try {
                  const saved = localStorage.getItem(RULES_STORAGE_KEY);
                  if (!saved) throw new Error('No saved rules on this device.');
                  applyConfig(parseRulesPayload(JSON.parse(saved)));
                  setProfile('custom');
                } catch (cause) { setError(cause instanceof Error ? cause.message : 'Invalid saved rules.'); }
              }}>Load saved rules</button>
              <label className="btn-secondary text-xs cursor-pointer inline-flex items-center gap-1.5">
                <Upload size={13} />
                <span>Import</span>
                <input
                  type="file"
                  accept=".json"
                  onChange={importRules}
                  className="hidden"
                />
              </label>
              <button
                type="button"
                onClick={exportRules}
                className="btn-secondary text-xs inline-flex items-center gap-1.5"
                title="Export custom rules to JSON"
              >
                <Download size={13} />
                <span>Export</span>
              </button>
              <button
                type="button"
                onClick={clearAllRules}
                disabled={customRules.length === 0}
                className="btn-secondary text-xs text-red-400 hover:text-red-300 inline-flex items-center gap-1.5"
                title="Clear all custom rules"
              >
                <Trash2 size={13} />
                <span>Clear</span>
              </button>
            </div>
          </div>

          <fieldset className="mb-4 flex flex-wrap gap-4">
            <legend className="text-sm mb-2">Rule packs</legend>
            {Object.keys(BUILTIN_PACKS).map((name) => <label key={name} className="text-xs flex gap-2 items-center">
              <input type="checkbox" checked={packs.includes(name)} onChange={() => {
                setProfile('custom');
                setPacks(packs.includes(name) ? packs.filter((pack) => pack !== name) : [...packs, name]);
              }} />{name}
            </label>)}
          </fieldset>
          <p className="text-xs text-[var(--muted)]">Allowlist rules can be imported and exported in the shared version 1 JSON policy.</p>
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
            aria-label="Source text"
            value={raw}
            onChange={(e) => { setRaw(e.target.value); setDecisions([]); }}
            onSelect={(e) => setSelection({ start: e.currentTarget.selectionStart, end: e.currentTarget.selectionEnd })}
            placeholder="Paste your source text, logs, or confidential draft here..."
            className="editor-textarea"
            spellCheck="false"
          />
          <button type="button" onClick={hideSelection} disabled={selection.end <= selection.start} className="btn-secondary text-xs m-3">
            Hide selected text
          </button>
          <button type="button" onClick={() => decideAll(raw.slice(selection.start, selection.end), 'hide')} disabled={selection.end <= selection.start} className="btn-secondary text-xs m-3">Hide all identical selected values</button>
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
              aria-label="Sanitized output"
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
                      title={`Hidden ${segment.detector || 'value'}`}
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
          {counts['entropy-suppressed'] && counts['entropy-suppressed'] > 0 ? (
            <div className="mt-2 text-xs text-[var(--muted)] flex items-center gap-1.5" data-testid="suppression-notice">
              <span>{counts['entropy-suppressed']} low-confidence {counts['entropy-suppressed'] === 1 ? 'match' : 'matches'} left unchanged</span>
            </div>
          ) : null}
          {acceptedMatches.length > 0 && (
            <details className="m-3 text-xs">
              <summary className="cursor-pointer font-semibold">Advanced occurrence review ({acceptedMatches.length})</summary>
              <ul className="mt-2 space-y-2" aria-label="Detected occurrences">
                {acceptedMatches.slice(0, reviewLimit).map((match) => (
                  <li key={`${match.start}-${match.end}`} className="flex items-center justify-between gap-3">
                    <code>{match.token} · {match.detectorId} · position {match.start + 1}</code>
                    <button type="button" className="btn-secondary text-xs" onClick={() => addDecision({ start: match.start, end: match.end, action: 'keep' })}>
                      Keep original
                    </button>
                    <button type="button" className="btn-secondary text-xs" onClick={() => decideAll(match.value, 'keep')}>Keep all identical occurrences</button>
                  </li>
                ))}
              </ul>
              {acceptedMatches.length > reviewLimit && <button type="button" className="btn-secondary text-xs mt-2" onClick={() => setReviewLimit((limit) => limit + 100)}>Show next 100 occurrences</button>}
            </details>
          )}
          {currentDecisions.some(({ action }) => action === 'keep') && <p role="alert" className="m-3 text-sm">Kept original values will be included in copied and downloaded output.</p>}
          {currentDecisions.filter(({ action }) => action === 'keep').map((decision) => <button key={`${decision.start}-${decision.end}`} type="button" className="btn-secondary text-xs m-1" onClick={() => addDecision({ ...decision, action: 'hide' })}>Hide kept occurrence at {decision.start + 1}</button>)}
          {currentDecisions.length > 0 && <button type="button" className="btn-secondary text-xs m-3" onClick={() => setDecisions([])}>Reset review decisions</button>}
        </div>
      </div>

      <TextBatchPanel key={JSON.stringify(config)} config={config} onWorkflowSuccess={onWorkflowSuccess} />
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
              onClick={executeScrub}
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
          <button type="button" className="btn-secondary text-xs" disabled={!cleaned} onClick={() => downloadText('txt')}>Download TXT</button>
          <button type="button" className="btn-secondary text-xs" disabled={!cleaned} onClick={() => downloadText('md')}>Download Markdown</button>
        </div>
      </div>
    </div>
  );
}
