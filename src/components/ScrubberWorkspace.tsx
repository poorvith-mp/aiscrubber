import React, { useState, useMemo } from 'react';
import {
  ShieldAlert,
  Copy,
  Check,
  Sparkles,
  Download,
  Settings2,
  Lock,
  FileText,
  Trash2,
  Cpu,
  FileSpreadsheet,
  Terminal,
  UserCheck,
} from 'lucide-react';
import {
  scrubText,
  DEFAULT_RULES,
  ScrubRuleOptions,
  ScrubResult,
} from '../utils/scrubEngine';

const SAMPLES = [
  {
    name: 'Developer API Log',
    icon: Terminal,
    text: `[2026-07-30 10:14:02] ERROR auth_service: Request failed for user john.doe@techcorp.io
IP: 192.168.1.105 | Region: us-east-1
API Key: sk-proj-892347923847928374928374928374
AWS Access Key: AKIAIOSFODNN7EXAMPLE
Phone: +1 (555) 234-5678`,
  },
  {
    name: 'Financial Billing Statement',
    icon: FileSpreadsheet,
    text: `Invoice #INV-2026-99
Customer: Sarah Connor (sarah.connor@cyberdyne.net)
Billing Address: Los Angeles, CA
Card Number: 4532-8921-1049-3321
Tax ID (SSN): 123-45-6789
Direct Contact: 555-019-2831`,
  },
  {
    name: 'HR Employee Record',
    icon: UserCheck,
    text: `Employee File: Alex Mercer
Corporate Email: alex.mercer@company.com
Emergency Contact: 415-555-0199
SSN: 987-65-4321
Internal Dev IP: 10.0.0.42`,
  },
];

export const ScrubberWorkspace: React.FC = () => {
  const [inputText, setInputText] = useState<string>(SAMPLES[0].text);
  const [rules, setRules] = useState<ScrubRuleOptions>(DEFAULT_RULES);
  const [copied, setCopied] = useState(false);
  const [showTokenMap, setShowTokenMap] = useState(true);
  const [showSettings, setShowSettings] = useState(false);

  // Compute scrubbed result dynamically
  const result: ScrubResult = useMemo(() => {
    return scrubText(inputText, rules);
  }, [inputText, rules]);

  const handleCopy = () => {
    if (!result.scrubbedText) return;
    navigator.clipboard.writeText(result.scrubbedText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadTxt = () => {
    if (!result.scrubbedText) return;
    const blob = new Blob([result.scrubbedText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'anonymized-llm-input.txt';
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadMap = () => {
    if (result.tokenMap.length === 0) return;
    const json = JSON.stringify(result.tokenMap, null, 2);
    const blob = new Blob([json], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'anonymization-token-map.json';
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      {/* Top Banner / Privacy Guarantee */}
      <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-emerald-600 text-white rounded-lg shadow-xs">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <h2 className="font-semibold text-slate-900 text-base font-sans flex items-center gap-2">
              <span>Zero-Trust Local PII Anonymizer</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-bold uppercase">
                100% Client-Side
              </span>
            </h2>
            <p className="text-xs text-slate-600 mt-0.5 font-sans">
              All scrubbing happens in local browser memory before data reaches ChatGPT, Claude, or LLM APIs.
            </p>
          </div>
        </div>
        <button
          onClick={() => setShowSettings(!showSettings)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-white text-slate-700 border border-slate-200 hover:border-emerald-500 transition-colors cursor-pointer"
        >
          <Settings2 className="w-4 h-4 text-emerald-600" />
          <span>Rules Config ({Object.values(rules).filter(Boolean).length} Active)</span>
        </button>
      </div>

      {/* Preset Quick Load Bar */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-mono text-slate-500 uppercase tracking-wider">
          Quick Load Presets:
        </span>
        {SAMPLES.map((sample, idx) => {
          const Icon = sample.icon;
          return (
            <button
              key={idx}
              onClick={() => setInputText(sample.text)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 text-xs font-medium transition-colors cursor-pointer"
            >
              <Icon className="w-3.5 h-3.5 text-emerald-600" />
              <span>{sample.name}</span>
            </button>
          );
        })}
      </div>

      {/* Settings Drawer */}
      {showSettings && (
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
          <h3 className="font-semibold text-sm text-slate-900 font-sans">
            Active Anonymization Rules
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
            {[
              { key: 'emails', label: 'Email Addresses' },
              { key: 'phones', label: 'Phone Numbers' },
              { key: 'apiKeys', label: 'API Keys & Secrets' },
              { key: 'creditCards', label: 'Credit Cards' },
              { key: 'ipAddresses', label: 'IP Addresses' },
              { key: 'ssn', label: 'SSN / Tax IDs' },
            ].map(({ key, label }) => (
              <label
                key={key}
                className="flex items-center gap-2 p-2.5 rounded-lg border border-slate-200 bg-slate-50 text-xs font-medium cursor-pointer hover:border-emerald-500 transition-colors"
              >
                <input
                  type="checkbox"
                  checked={Boolean(rules[key as keyof ScrubRuleOptions])}
                  onChange={(e) =>
                    setRules({ ...rules, [key]: e.target.checked })
                  }
                  className="accent-emerald-600 rounded"
                />
                <span className="text-slate-800">{label}</span>
              </label>
            ))}
          </div>

          <div className="pt-2 border-t border-slate-200">
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Custom RegEx Pattern (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. \\bCONFIDENTIAL-\\d+\\b"
              value={rules.customRegex || ''}
              onChange={(e) => setRules({ ...rules, customRegex: e.target.value })}
              className="w-full text-xs font-mono px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>
        </div>
      )}

      {/* Main Dual Workspace Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left: Input Editor */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col space-y-3 shadow-xs">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 font-mono flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5 text-emerald-600" />
              <span>1. Raw Input Text</span>
            </label>
            <button
              onClick={() => setInputText('')}
              className="text-xs text-slate-400 hover:text-red-500 transition-colors p-1 flex items-center gap-1"
              title="Clear Text"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear</span>
            </button>
          </div>

          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Paste raw log data, customer chats, or API payloads containing sensitive data..."
            rows={14}
            className="w-full flex-1 p-3.5 text-xs sm:text-sm font-mono rounded-lg border border-slate-200 bg-slate-50 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 resize-y leading-relaxed"
          />

          <div className="text-[11px] font-mono text-slate-500 flex justify-between items-center pt-1">
            <span>{inputText.length} characters</span>
            <span>{inputText.split(/\s+/).filter(Boolean).length} words</span>
          </div>
        </div>

        {/* Right: Anonymized LLM-Ready Output */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col space-y-3 shadow-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-600" />
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 font-mono">
                2. LLM-Ready Output
              </label>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-semibold border border-emerald-200">
              {result.stats.totalReplacements} Redactions Made
            </span>
          </div>

          <textarea
            readOnly
            value={result.scrubbedText}
            placeholder="Anonymized text will appear here automatically..."
            rows={14}
            className="w-full flex-1 p-3.5 text-xs sm:text-sm font-mono rounded-lg border border-slate-200 bg-slate-50 text-slate-900 focus:outline-none resize-y leading-relaxed selection:bg-emerald-500/30"
          />

          {/* Action Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
            <div className="flex items-center gap-2">
              <button
                onClick={handleCopy}
                disabled={!result.scrubbedText}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white disabled:opacity-50 transition-colors shadow-xs cursor-pointer"
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                <span>{copied ? 'Copied!' : 'Copy Anonymized Text'}</span>
              </button>

              <button
                onClick={handleDownloadTxt}
                disabled={!result.scrubbedText}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 disabled:opacity-50 transition-colors cursor-pointer"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Export TXT</span>
              </button>
            </div>

            <button
              onClick={handleDownloadMap}
              disabled={result.tokenMap.length === 0}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-600 hover:text-slate-900 disabled:opacity-40 transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Token Map (.json)</span>
            </button>
          </div>
        </div>
      </div>

      {/* Token Mapping Audit Table */}
      {result.tokenMap.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4 shadow-xs">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-sm text-slate-900 font-sans flex items-center gap-2">
              <Lock className="w-4 h-4 text-emerald-600" />
              <span>Redaction Audit Log ({result.tokenMap.length} Sealed Tokens)</span>
            </h3>
            <button
              onClick={() => setShowTokenMap(!showTokenMap)}
              className="text-xs text-emerald-600 hover:underline font-mono"
            >
              {showTokenMap ? 'Hide Audit Log' : 'Show Audit Log'}
            </button>
          </div>

          {showTokenMap && (
            <div className="overflow-x-auto border border-slate-200 rounded-lg">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-slate-100 text-slate-700 border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-4">Anonymized Token</th>
                    <th className="py-2.5 px-4">Category</th>
                    <th className="py-2.5 px-4">Original Value</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {result.tokenMap.map((item, i) => (
                    <tr
                      key={i}
                      className="hover:bg-slate-50 transition-colors"
                    >
                      <td className="py-2 px-4 font-semibold text-emerald-600">
                        {item.token}
                      </td>
                      <td className="py-2 px-4 text-slate-500 uppercase tracking-wider text-[10px]">
                        {item.category}
                      </td>
                      <td className="py-2 px-4 text-slate-800 font-medium">
                        {item.original}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
