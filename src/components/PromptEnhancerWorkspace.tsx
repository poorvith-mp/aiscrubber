import {
  ArrowLeftRight,
  Bot,
  Check,
  Clipboard,
  Code2,
  Download,
  FileCheck2,
  FileText,
  Lock,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  Sparkles,
  Trash2,
  Unlock,
  Upload,
} from 'lucide-react';
import { useId, useMemo, useState } from 'react';
import {
  formatEnhancedPrompt,
  type EnhancementGoal,
  type PromptSessionKey,
  type PromptVariable,
} from '../lib/promptEnhancer';
import type { WorkflowSuccessKind } from '../lib/sponsorship';
import { useTextJob } from '../lib/useTextJob';
import type { CoreScrubResult } from '../lib/scrubCore.js';
import { parseSessionKey } from '../lib/sessionCore.js';
import { cleaningProfileConfig, CLEANING_PROFILES, type CleaningProfile } from '../lib/cleaningProfiles';
import { parseRulesPayload, type AiscrubConfig } from '../lib/rulesConfig';
import { getDemoScenario } from '../lib/demoScenarios';
import { downloadBlob } from '../lib/download';

const samplePrompt = `Write a TypeScript integration for our internal billing system.
Connect to https://billing.internal.acmepay.io/v2/charges using auth header Bearer sk-live-9988112233445566.
When an event comes for customer CUST-88392 (email: finance@acme.com), notify webhook https://hooks.acme.com/alerts/finance.`;

export function PromptEnhancerWorkspace({ onWorkflowSuccess }: { onWorkflowSuccess: (kind: WorkflowSuccessKind) => void }) {
  const [activeTab, setActiveTab] = useState<'enhance' | 'reconstruct'>('enhance');

  // Tab 1: Enhance state
  const [rawPrompt, setRawPrompt] = useState(() => {
    const demo = getDemoScenario(new URLSearchParams(window.location.search).get('demo'));
    return demo?.workspace === 'prompt' ? demo.input : '';
  });
  const [goal, setGoal] = useState<EnhancementGoal>('coding');
  const [enhance, setEnhance] = useState(false);
  const [profile, setProfile] = useState<CleaningProfile['id']>('everyday');
  const [config, setConfig] = useState<AiscrubConfig>(() => cleaningProfileConfig('everyday'));
  const [error, setError] = useState('');
  const [keyOrigin, setKeyOrigin] = useState<string | null>(null);
  const [requestedRestore, setRequestedRestore] = useState('');
  const [customVars, setCustomVars] = useState<
    { placeholder: string; original: string }[]
  >([]);
  const [newVarPlaceholder, setNewVarPlaceholder] = useState('');
  const [newVarOriginal, setNewVarOriginal] = useState('');
  const [copiedPrompt, setCopiedPrompt] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);

  // Tab 2: Reconstruct state
  const [aiResponseInput, setAiResponseInput] = useState('');
  const [sessionKeyInput, setSessionKeyInput] = useState('');

  const [copiedReconstructed, setCopiedReconstructed] = useState(false);

  const maskingContext = JSON.stringify({ rawPrompt, config, goal, enhance });
  const promptTooLarge = new TextEncoder().encode(rawPrompt).byteLength > 5 * 1024 * 1024;
  const maskJob = useTextJob<CoreScrubResult>(rawPrompt && !promptTooLarge ? { operation: 'mask', source: rawPrompt, config } : null);
  const roundTripResult = {
    maskedText: maskJob.result ? (enhance ? formatEnhancedPrompt(maskJob.result.text, goal) : maskJob.result.text) : '',
    sessionKey: { format: 'aiscrubber-session' as const, version: 2 as const,
      variables: (maskJob.result?.mappings || []).map(({ token, original, detectorId }) => ({ placeholder: token, original, detectorId })) },
  };
  const staleKey = keyOrigin !== null && keyOrigin !== maskingContext;
  const session = useMemo(() => {
    if (!sessionKeyInput || staleKey) return { key: undefined, error: '' };
    if (new TextEncoder().encode(sessionKeyInput).byteLength > 16 * 1024 * 1024) return { key: undefined, error: 'Session key exceeds 16 MiB.' };
    try { return { key: parseSessionKey(sessionKeyInput), error: '' }; }
    catch { return { key: undefined, error: 'Invalid session key. Import a supported AIScrubber key.' }; }
  }, [sessionKeyInput, staleKey]);
  const responseTooLarge = new TextEncoder().encode(aiResponseInput).byteLength > 5 * 1024 * 1024;
  const restoreContext = JSON.stringify({ aiResponseInput, sessionKeyInput, maskingContext, staleKey });
  const restoreJob = useTextJob<{ text: string; restoredCount: number; unresolvedPlaceholders: string[] }>(
    session.key && aiResponseInput && !responseTooLarge && requestedRestore === restoreContext
      ? { operation: 'restore', source: aiResponseInput, config, sessionKey: session.key } : null);
  const reconstructedText = restoreJob.result?.text || '';
  const restoredCount = restoreJob.result?.restoredCount ?? null;
  const unresolved = restoreJob.result?.unresolvedPlaceholders || [];

  function addCustomVariable(e: React.FormEvent) {
    e.preventDefault();
    if (!newVarOriginal.trim() || !newVarPlaceholder.trim()) return;
    setCustomVars((prev) => [
      ...prev,
      {
        placeholder: newVarPlaceholder.trim(),
        original: newVarOriginal.trim(),
      },
    ]);
    setNewVarPlaceholder('');
    setNewVarOriginal('');
  }

  function removeCustomVariable(index: number) {
    setCustomVars((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleCopyPrompt() {
    if (!maskJob.result) return;
    try { await navigator.clipboard.writeText(roundTripResult.maskedText); }
    catch { setError('Copy failed. Clipboard access was denied.'); return; }
    setCopiedPrompt(true);
    if (roundTripResult.sessionKey.variables.length) onWorkflowSuccess('masked-copy');
    setTimeout(() => setCopiedPrompt(false), 1800);
  }

  function handleDownloadKey() {
    if (!maskJob.result || !window.confirm('This private session key contains original sensitive values. Save it locally and never send it to an AI service. Export?')) return;
    const keyData = roundTripResult.sessionKey;
    const blob = new Blob([JSON.stringify(keyData, null, 2)], {
      type: 'application/json',
    });
    downloadBlob(blob, 'session.aiscrub.json');
  }

  async function handleUploadKeyFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';
    setKeyOrigin(null);
    setSessionKeyInput('');
    try {
      if (file.size > 16 * 1024 * 1024) throw new Error('Session key exceeds 16 MiB.');
      const content = await file.text();
      parseSessionKey(content);
      setSessionKeyInput(content);
      setError('');
    } catch { setError('Invalid session key. Import a supported key smaller than 16 MiB.'); }
  }

  function executeReconstruction() {
    setRequestedRestore(restoreContext);
    setCopiedReconstructed(false);
  }

  async function handleCopyReconstructed() {
    if (!reconstructedText) return;
    try { await navigator.clipboard.writeText(reconstructedText); }
    catch { setError('Copy failed. Clipboard access was denied.'); return; }
    setCopiedReconstructed(true);
    if ((restoredCount ?? 0) > 0) onWorkflowSuccess('restored-copy');
    setTimeout(() => setCopiedReconstructed(false), 1800);
  }

  return (
    <div className="workspace-panel">
      {/* Header & Tabs */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-[var(--line)]">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="badge-emerald">Secure AI Roundtrip</span>
            <span className="text-xs text-[var(--muted)] font-mono">
              Browser-local processing
            </span>
          </div>
          <h2 className="text-2xl md:text-3xl font-headline font-bold">
            Prompt Enhancer & AI Roundtrip
          </h2>
          <p className="text-sm text-[var(--muted)] mt-1">
            Structure your prompt, mask confidential variables with constants, and safely reconstruct the AI's response.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-[var(--surface-sunken)] p-1 rounded-xl border border-[var(--line)]">
          <button
            type="button"
            onClick={() => setActiveTab('enhance')}
            className={`flex items-center gap-2 px-4 py-2 text-xs rounded-lg font-bold transition-all ${
              activeTab === 'enhance'
                ? 'bg-[var(--accent)] text-[var(--accent-ink)]'
                : 'text-[var(--muted)] hover:text-[var(--text)]'
            }`}
          >
            <Lock size={14} />
            1. Mask & Enhance Prompt
          </button>
          <button
            type="button"
            onClick={() => {
              if (maskJob.result) {
                setSessionKeyInput(JSON.stringify(roundTripResult.sessionKey, null, 2));
                setKeyOrigin(maskingContext);
              }
              setActiveTab('reconstruct');
            }}
            className={`flex items-center gap-2 px-4 py-2 text-xs rounded-lg font-bold transition-all ${
              activeTab === 'reconstruct'
                ? 'bg-[var(--accent)] text-[var(--accent-ink)]'
                : 'text-[var(--muted)] hover:text-[var(--text)]'
            }`}
          >
            <Unlock size={14} />
            2. Reconstruct AI Response
          </button>
        </div>
      </div>

      <p className="text-xs my-3 text-[var(--muted)]">Only share the masked prompt. Private keys and restored responses contain originals. Automatic detection is not a guarantee; review before sharing.</p>
      <div role="status" aria-live="polite" className="my-3 text-sm">
        {promptTooLarge || responseTooLarge ? 'Text input exceeds 5 MiB.' : staleKey ? 'The prompt or policy changed. Generate a new session key before restoring.' : session.error || maskJob.error || restoreJob.error || error || (maskJob.busy || restoreJob.busy ? 'Processing locally…' : '')}
        {(maskJob.busy || restoreJob.busy) && <button type="button" className="btn-secondary ml-2" onClick={() => { maskJob.cancel(); restoreJob.cancel(); }}>Cancel processing</button>}
      </div>
      {activeTab === 'enhance' ? (
        /* TAB 1: ENHANCE & MASK */
        <div className="mt-6 space-y-6">
          <div className="flex gap-3 flex-wrap">
            <label>Cleaning profile <select aria-label="Prompt cleaning profile" value={profile} className="input-field" onChange={(event) => {
              const id = event.target.value as CleaningProfile['id']; setProfile(id); setConfig(cleaningProfileConfig(id));
            }}>{Object.values(CLEANING_PROFILES).map(({ id, label }) => <option key={id} value={id}>{label}</option>)}</select></label>
            <button type="button" className="btn-secondary text-xs" onClick={() => setRawPrompt(samplePrompt)}>Load prompt example</button>
            <label className="flex gap-2 items-center text-sm"><input type="checkbox" checked={enhance} onChange={(event) => setEnhance(event.target.checked)} />Add prompt structure (optional)</label>
          </div>
          <details className="text-sm"><summary>Advanced shared policy (detectors, packs, custom rules, allowlist)</summary>
            <label>Import policy JSON <input aria-label="Prompt policy file" type="file" accept=".json" onChange={async (event) => {
              const file = event.currentTarget.files?.[0]; event.currentTarget.value = ''; if (!file) return;
              try {
                if (file.size > 1024 * 1024) throw new Error('Policy exceeds 1 MiB.');
                setConfig(parseRulesPayload(JSON.parse(await file.text()))); setProfile('custom'); setError('');
              } catch { setError('Invalid shared policy. Import a supported version 1 file smaller than 1 MiB.'); }
            }} /></label>
            <button type="button" className="btn-secondary text-xs" onClick={() => downloadBlob(new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' }), 'rules.json')}>Export policy JSON</button>
          </details>
          {/* Goal Selector */}
          <div className="flex items-center justify-between flex-wrap gap-3">
            <span className="text-xs font-mono uppercase tracking-wider text-[var(--muted)]">
              Select Enhancement Objective
            </span>
            <div className="flex items-center gap-2 flex-wrap">
              {(
                [
                  { id: 'coding', label: 'Code & Architecture', icon: Code2 },
                  { id: 'debugging', label: 'Debugging & Fixes', icon: RefreshCw },
                  { id: 'analysis', label: 'Data & Analysis', icon: Search },
                  { id: 'writing', label: 'Drafting & Voice', icon: FileText },
                  { id: 'general', label: 'General Task', icon: Bot },
                ] as const
              ).map((item) => {
                const Icon = item.icon;
                const isSelected = goal === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setGoal(item.id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${
                      isSelected
                        ? 'border-[var(--accent)] bg-[var(--accent-tint)] text-[var(--accent)] font-bold'
                        : 'border-[var(--line)] text-[var(--muted)] hover:text-[var(--text)]'
                    }`}
                  >
                    <Icon size={14} />
                    {item.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Editors Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Raw Prompt */}
            <div className="editor-card">
              <div className="editor-card-header">
                <span className="font-bold text-xs uppercase tracking-wider">
                  Raw Draft Prompt
                </span>
                <span className="text-xs font-mono text-[var(--muted)]">
                  {rawPrompt.length} chars
                </span>
              </div>
              <textarea
                aria-label="Raw prompt"
                value={rawPrompt}
                onChange={(e) => setRawPrompt(e.target.value)}
                placeholder="Type or paste your prompt with internal URLs, API keys, credentials, or customer names..."
                className="editor-textarea"
                spellCheck="false"
              />
            </div>

            {/* Enhanced & Masked Prompt */}
            <div className="editor-card">
              <div className="editor-card-header">
                <span className="font-bold text-xs uppercase tracking-wider text-[var(--accent)]">
                  Masked prompt (send only this to AI)
                </span>
                <span className="text-xs font-mono text-[var(--muted)]">
                  {roundTripResult.sessionKey.variables.length} variable
                  {roundTripResult.sessionKey.variables.length === 1 ? '' : 's'} masked
                </span>
              </div>
              <textarea
                aria-label="Masked prompt"
                value={roundTripResult.maskedText}
                readOnly
                placeholder="Optimized prompt will appear here..."
                className="editor-textarea text-[var(--text)] font-mono text-xs leading-relaxed"
                spellCheck="false"
              />
            </div>
          </div>

          {/* Detected Variables & Mapping Bar */}
          <div className="p-4 rounded-xl bg-[var(--surface-sunken)] border border-[var(--line)]">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck size={16} className="text-[var(--accent)]" />
                <h4 className="text-xs font-bold uppercase tracking-wider">
                  Masked Session Variables ({roundTripResult.sessionKey.variables.length})
                </h4>
              </div>
              <span className="text-xs text-[var(--muted)] font-mono">Private key stays in this tab until exported.</span>
            </div>

            <details><summary className="text-xs cursor-pointer">Show private originals (never send these to AI)</summary>
            {roundTripResult.sessionKey.variables.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {roundTripResult.sessionKey.variables.map((v, i) => (
                  <div
                    key={i}
                    className="p-2 rounded-lg bg-[var(--panel)] border border-[var(--line)] flex items-center justify-between text-xs"
                  >
                    <code className="text-[var(--accent)] font-bold font-mono">
                      {v.placeholder}
                    </code>
                    <span
                      className="text-[var(--muted)] font-mono truncate max-w-[140px]"
                      title={v.original}
                    >
                      {v.original}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-[var(--muted)] italic">
                No sensitive variables detected. Type API keys, endpoints, or emails in your prompt to mask them.
              </p>
            )}</details>
          </div>

          {/* Action Strip */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-[var(--line)]">
            <div className="flex items-center gap-2 text-xs text-[var(--muted)]">
              <Bot size={15} className="text-[var(--accent)]" />
              <span>
                1. Copy prompt to ChatGPT/Claude → 2. Download Key → 3. Restore output in Step 2.
              </span>
            </div>

            <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto justify-end">
              <button
                type="button"
                onClick={handleDownloadKey}
                disabled={!maskJob.result || !roundTripResult.sessionKey.variables.length}
                className="btn-secondary text-xs font-bold"
                title="Download key to reverse unmask the AI's response later"
              >
                <Download size={15} />
                Download Key (.aiscrub)
              </button>

              <button
                type="button"
                onClick={handleCopyPrompt}
                disabled={!maskJob.result || !roundTripResult.maskedText}
                className="btn-primary text-xs font-bold"
              >
                {copiedPrompt ? <Check size={15} /> : <Clipboard size={15} />}
                {copiedPrompt ? 'Copied Prompt' : 'Copy Masked Prompt'}
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* TAB 2: RECONSTRUCT AI RESPONSE */
        <div className="mt-6 space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* AI Response Input */}
            <div className="editor-card">
              <div className="editor-card-header">
                <span className="font-bold text-xs uppercase tracking-wider">
                  Raw AI Response (Paste here)
                </span>
                <span className="text-xs font-mono text-[var(--muted)]">
                  {aiResponseInput.length} chars
                </span>
              </div>
              <textarea
                aria-label="AI response"
                value={aiResponseInput}
                onChange={(e) => setAiResponseInput(e.target.value)}
                placeholder="Paste the response returned by ChatGPT, Claude, or Gemini containing placeholder tokens like {{API_SECRET_1}} or {{INTERNAL_URL_1}}..."
                className="editor-textarea font-mono text-xs"
                spellCheck="false"
              />
            </div>

            {/* Session Key Input / Upload */}
            <div className="editor-card">
              <div className="editor-card-header">
                <span className="font-bold text-xs uppercase tracking-wider">
                  Session Key / Variable Map (.aiscrub JSON)
                </span>
                <label className="text-xs text-[var(--accent)] hover:underline cursor-pointer flex items-center gap-1">
                  <Upload size={13} />
                  Upload Key File
                  <input
                    type="file"
                    accept=".json,.aiscrub"
                    onChange={handleUploadKeyFile}
                    className="hidden"
                  />
                </label>
              </div>
              <textarea
                aria-label="Private session key"
                value={sessionKeyInput}
                onChange={(e) => { setSessionKeyInput(e.target.value); setKeyOrigin(null); }}
                placeholder='Paste the JSON session key or click "Upload Key File"...'
                className="editor-textarea font-mono text-xs"
                spellCheck="false"
              />
            </div>
          </div>

          <div className="flex justify-center">
            <button
              type="button"
              onClick={executeReconstruction}
              disabled={!aiResponseInput || !session.key || responseTooLarge || restoreJob.busy}
              className="btn-primary text-sm font-bold px-8 py-3 flex items-center gap-2 shadow-lg"
            >
              <ArrowLeftRight size={18} />
              Reconstruct Full Unmasked Response
            </button>
          </div>

          {/* Reconstructed Output */}
          {reconstructedText && (
            <div className="editor-card border-[var(--accent)]">
              <div className="editor-card-header bg-[var(--accent-tint)]">
                <div className="flex items-center gap-2">
                  <FileCheck2 size={16} className="text-[var(--accent)]" />
                  <span className="font-bold text-xs uppercase tracking-wider text-[var(--accent)]">
                    Reconstructed Real-World Output
                  </span>
                </div>
                <span className="text-xs font-mono text-[var(--accent)] font-bold">
                  {restoredCount} placeholder
                  {restoredCount === 1 ? '' : 's'} restored
                </span>
              </div>
              <textarea
                aria-label="Restored response"
                value={reconstructedText}
                readOnly
                className="editor-textarea text-[var(--text)] font-mono text-xs leading-relaxed"
                spellCheck="false"
              />

              <div className="p-4 border-t border-[var(--line)] flex items-center justify-between">
                <span className="text-xs text-[var(--muted)]">
                  {unresolved.length ? `Unresolved placeholders remain unchanged: ${unresolved.join(', ')}. Review before using.` : restoredCount ? 'Known placeholders restored. Review the response before using it.' : 'No known placeholders restored. The response is unchanged.'}
                </span>
                <button
                  type="button"
                  onClick={handleCopyReconstructed}
                  className="btn-primary text-xs font-bold"
                >
                  {copiedReconstructed ? <Check size={15} /> : <Clipboard size={15} />}
                  {copiedReconstructed ? 'Copied Output' : 'Copy Unmasked Response'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
