import React, { useState, useEffect } from 'react';
import { Shield, Sparkles, Copy, Check, Lock, RefreshCw, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { getDailyTrialInfo, recordTrialUsage } from '../utils/dailyTrial';
import { TrialLimitModal } from './TrialLimitModal';

export const ScrubberWorkspace: React.FC = () => {
  const [inputPrompt, setInputPrompt] = useState(`Hi team, please review user john.doe@example.com (API Key: sk-proj-9988112233445566, Phone: +1-555-0199). Customer ID: CUST-88392.`);
  const [scrubbedOutput, setScrubbedOutput] = useState('');
  const [copied, setCopied] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [trialInfo, setTrialInfo] = useState(getDailyTrialInfo('aiscrubber'));
  const [showTrialModal, setShowTrialModal] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user || null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleScrub = () => {
    if (!user) {
      const currentTrial = getDailyTrialInfo('aiscrubber');
      if (currentTrial.isBlocked) {
        setShowTrialModal(true);
        return;
      }
      const updated = recordTrialUsage('aiscrubber');
      setTrialInfo(updated);
    }

    // Perform Scrubbing Redaction Rules
    let output = inputPrompt;

    // 1. Redact Emails
    output = output.replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '[REDACTED_EMAIL]');

    // 2. Redact API / Secret Keys (sk-..., bearer tokens)
    output = output.replace(/(sk-[a-zA-Z0-9-_]{16,})/g, '[REDACTED_API_KEY]');
    output = output.replace(/(bearer\s+[a-zA-Z0-9-_.]+)/gi, '[REDACTED_TOKEN]');

    // 3. Redact Phone Numbers
    output = output.replace(/(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g, '[REDACTED_PHONE]');

    // 4. Redact Customer / SSN IDs
    output = output.replace(/CUST-\d{4,}/gi, '[REDACTED_CUSTOMER_ID]');

    setScrubbedOutput(output);
  };

  const handleCopy = () => {
    if (!scrubbedOutput) return;
    navigator.clipboard.writeText(scrubbedOutput);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section id="scrubber-workspace" className="mx-auto max-w-7xl px-6 py-12 lg:px-8">
      <div className="rounded-[32px] border border-emerald-400/20 bg-slate-900/90 p-6 sm:p-8 lg:p-10 shadow-2xl space-y-6">
        
        {/* Header & Status Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-400/20 text-xs font-bold uppercase tracking-wider text-emerald-400">
              <Shield size={14} /> Interactive Privacy Workspace
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-white">
              AI Prompt & Metadata Redactor
            </h2>
          </div>

          {/* Trial / Auth Badge */}
          <div className="shrink-0">
            {user ? (
              <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-500/20 border border-emerald-400/30 text-xs font-bold text-emerald-300">
                <Sparkles size={14} /> Unlimited Access (Logged In)
              </span>
            ) : (
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs font-bold text-amber-400 font-mono">
                  ⚡ {trialInfo.remaining}/3 Free Uses Remaining Today
                </span>
                <a
                  href="https://poorvithmp.com/auth"
                  className="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold uppercase tracking-wider transition"
                >
                  Sign In
                </a>
              </div>
            )}
          </div>
        </div>

        {/* Input & Output Editor Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Raw Input Box */}
          <div className="space-y-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400">
              1. Raw Prompt / Confidential Input
            </label>
            <textarea
              value={inputPrompt}
              onChange={(e) => setInputPrompt(e.target.value)}
              rows={8}
              placeholder="Paste raw text, API keys, emails, or prompts here..."
              className="w-full rounded-2xl border border-slate-800 bg-slate-950 p-4 text-sm text-slate-100 placeholder-slate-500 focus:border-emerald-500 focus:outline-none font-mono leading-relaxed"
            />
          </div>

          {/* Scrubbed Output Box */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold uppercase tracking-wider text-emerald-400">
                2. AI-Safe Scrubbed Output
              </label>
              {scrubbedOutput && (
                <button
                  onClick={handleCopy}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-300 hover:text-emerald-400 transition"
                >
                  {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                  <span>{copied ? 'Copied!' : 'Copy Payload'}</span>
                </button>
              )}
            </div>
            <textarea
              readOnly
              value={scrubbedOutput}
              rows={8}
              placeholder="Scrubbed result will appear here safely..."
              className="w-full rounded-2xl border border-slate-800 bg-slate-950/80 p-4 text-sm text-emerald-300 placeholder-slate-600 focus:outline-none font-mono leading-relaxed"
            />
          </div>

        </div>

        {/* Action Controls */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
          <p className="text-xs text-slate-400">
            🔒 In-browser local scrubbing. No text or secrets leave your device.
          </p>

          <button
            onClick={handleScrub}
            className="w-full sm:w-auto px-8 py-3.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs uppercase tracking-wider rounded-xl transition flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20"
          >
            <Shield size={16} />
            <span>Scrub Prompt Now</span>
          </button>
        </div>

      </div>

      <TrialLimitModal
        isOpen={showTrialModal}
        onClose={() => setShowTrialModal(false)}
        toolName="AIScrubber"
      />
    </section>
  );
};
