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
  enhanceAndMaskPrompt,
  reconstructAiResponse,
  type EnhancementGoal,
  type PromptSessionKey,
  type PromptVariable,
} from '../lib/promptEnhancer';

const samplePrompt = `Write a TypeScript integration for our internal billing system.
Connect to https://billing.internal.acmepay.io/v2/charges using auth header Bearer sk-live-9988112233445566.
When an event comes for customer CUST-88392 (email: finance@acme.com), notify webhook https://hooks.acme.com/alerts/finance.`;

export function PromptEnhancerWorkspace() {
  const [activeTab, setActiveTab] = useState<'enhance' | 'reconstruct'>('enhance');

  // Tab 1: Enhance state
  const [rawPrompt, setRawPrompt] = useState(samplePrompt);
  const [goal, setGoal] = useState<EnhancementGoal>('coding');
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
  const [reconstructedText, setReconstructedText] = useState('');
  const [restoredCount, setRestoredCount] = useState<number | null>(null);
  const [unresolved, setUnresolved] = useState<string[]>([]);
  const [copiedReconstructed, setCopiedReconstructed] = useState(false);

  // Run enhancement
  const enhancementResult = useMemo(() => {
    return enhanceAndMaskPrompt(rawPrompt, goal, customVars);
  }, [rawPrompt, goal, customVars]);

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
    await navigator.clipboard.writeText(enhancementResult.enhancedPrompt);
    setCopiedPrompt(true);
    setTimeout(() => setCopiedPrompt(false), 1800);
  }

  function handleDownloadKey() {
    const keyData = enhancementResult.sessionKey;
    const blob = new Blob([JSON.stringify(keyData, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${keyData.name}.aiscrub.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleUploadKeyFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setSessionKeyInput(content);
    };
    reader.readAsText(file);
  }

  function executeReconstruction() {
    if (!aiResponseInput.trim() || !sessionKeyInput.trim()) return;

    try {
      const parsed = JSON.parse(sessionKeyInput);
      const res = reconstructAiResponse(aiResponseInput, parsed);
      setReconstructedText(res.reconstructedText);
      setRestoredCount(res.restoredCount);
      setUnresolved(res.unresolvedPlaceholders);
      setCopiedReconstructed(false);
    } catch {
      alert('Invalid session key format. Please provide valid JSON session key.');
    }
  }

  async function handleCopyReconstructed() {
    if (!reconstructedText) return;
    await navigator.clipboard.writeText(reconstructedText);
    setCopiedReconstructed(true);
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
              Zero-Exposure Prompting
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
            onClick={() => setActiveTab('reconstruct')}
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

      {activeTab === 'enhance' ? (
        /* TAB 1: ENHANCE & MASK */
        <div className="mt-6 space-y-6">
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
                  Optimized & Masked (Send this to AI)
                </span>
                <span className="text-xs font-mono text-[var(--muted)]">
                  {enhancementResult.variablesFound} variable
                  {enhancementResult.variablesFound === 1 ? '' : 's'} masked
                </span>
              </div>
              <textarea
                value={enhancementResult.enhancedPrompt}
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
                  Masked Session Variables ({enhancementResult.sessionKey.variables.length})
                </h4>
              </div>
              <span className="text-xs text-[var(--muted)] font-mono">
                Session ID: {enhancementResult.sessionKey.id}
              </span>
            </div>

            {enhancementResult.sessionKey.variables.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {enhancementResult.sessionKey.variables.map((v, i) => (
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
            )}
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
                className="btn-secondary text-xs font-bold"
                title="Download key to reverse unmask the AI's response later"
              >
                <Download size={15} />
                Download Key (.aiscrub)
              </button>

              <button
                type="button"
                onClick={handleCopyPrompt}
                className="btn-primary text-xs font-bold"
              >
                {copiedPrompt ? <Check size={15} /> : <Clipboard size={15} />}
                {copiedPrompt ? 'Copied Prompt' : 'Copy Enhanced Prompt'}
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
                value={sessionKeyInput}
                onChange={(e) => setSessionKeyInput(e.target.value)}
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
              disabled={!aiResponseInput || !sessionKeyInput}
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
                value={reconstructedText}
                readOnly
                className="editor-textarea text-[var(--text)] font-mono text-xs leading-relaxed"
                spellCheck="false"
              />

              <div className="p-4 border-t border-[var(--line)] flex items-center justify-between">
                <span className="text-xs text-[var(--muted)]">
                  All placeholders resolved to original values. Ready to execute or integrate.
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
