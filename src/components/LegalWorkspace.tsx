import {
  AlertTriangle,
  BookOpen,
  CheckCircle2,
  FileCheck,
  FileText,
  Lock,
  Scale,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { useState } from 'react';

export function LegalWorkspace() {
  const [tab, setTab] = useState<'privacy' | 'terms'>('privacy');

  return (
    <div className="workspace-panel max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[var(--line)]">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="badge-emerald">Legal & Transparency</span>
            <span className="text-xs text-[var(--muted)] font-mono">
              MIT License · Zero Data Storage
            </span>
          </div>
          <h2 className="text-2xl md:text-3xl font-headline font-bold">
            Privacy Policy & Terms of Service
          </h2>
          <p className="text-sm text-[var(--muted)] mt-1">
            Plain-English privacy commitments, browser-memory safety disclosures, and open-source terms.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1 bg-[var(--surface-sunken)] p-1 rounded-xl border border-[var(--line)] self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setTab('privacy')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg font-bold transition-all ${
              tab === 'privacy'
                ? 'bg-[var(--accent)] text-[var(--accent-ink)]'
                : 'text-[var(--muted)] hover:text-[var(--text)]'
            }`}
          >
            <ShieldCheck size={14} />
            Privacy Policy
          </button>
          <button
            type="button"
            onClick={() => setTab('terms')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg font-bold transition-all ${
              tab === 'terms'
                ? 'bg-[var(--accent)] text-[var(--accent-ink)]'
                : 'text-[var(--muted)] hover:text-[var(--text)]'
            }`}
          >
            <Scale size={14} />
            Terms of Service
          </button>
        </div>
      </div>

      {/* PRIVACY POLICY */}
      {tab === 'privacy' && (
        <div className="space-y-6 text-sm text-[var(--muted)] leading-relaxed">
          <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 space-y-1">
            <h3 className="font-bold text-sm flex items-center gap-2">
              <Lock size={16} />
              The Local Content Processing Guarantee
            </h3>
            <p className="text-xs text-emerald-200/90">
              AIScrubber does not upload your input text, logs, photos, documents, redaction boxes, or token mappings. Those stay in your browser window.
            </p>
          </div>

          <section className="space-y-3">
            <h4 className="font-bold text-base text-[var(--text)]">1. Local In-Memory Processing</h4>
            <p>
              When you paste text into the Text Scrubber, enhance prompts in the Prompt Enhancer, upload images into the Metadata Desk, or draw redactions in the Visual Redactor, all computation executes strictly inside your device's CPU and browser memory using client-side JavaScript, Web Workers, HTML5 Canvas APIs, and ArrayBuffers.
            </p>
          </section>

          <section className="space-y-3">
            <h4 className="font-bold text-base text-[var(--text)]">2. Sensitive Content and External Requests</h4>
            <p>
              We do not track, log, intercept, or transmit user-provided content, and we do not store sensitive drafts in cookies or external databases. The site does not run a page-analytics service. It requests the repository's public GitHub star count, and that request does not include pasted text, uploaded files, redaction data, or session keys.
            </p>
          </section>

          <section className="space-y-3">
            <h4 className="font-bold text-base text-[var(--text)]">3. Local Storage Usage</h4>
            <p>
              We only use browser <code className="font-mono text-[var(--text)] bg-[var(--surface-sunken)] px-1.5 py-0.5 rounded">localStorage</code> for non-sensitive UI preferences:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-xs">
              <li>Dark/light mode theme selection.</li>
              <li>Custom keyword and regex rules that you explicitly create and save.</li>
              <li>Feedback messages submitted through the founder feedback modal.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h4 className="font-bold text-base text-[var(--text)]">4. Third-Party AI Considerations</h4>
            <p>
              When you copy masked prompts from the Prompt Enhancer to third-party services (e.g. OpenAI, Anthropic, Google), those third parties operate under their respective privacy policies. AIScrubber enables you to mask confidential variables with synthetic constants (`{'{{API_SECRET_1}}'}`) before you send prompts to those services.
            </p>
          </section>
        </div>
      )}

      {/* TERMS OF SERVICE */}
      {tab === 'terms' && (
        <div className="space-y-6 text-sm text-[var(--muted)] leading-relaxed">
          <section className="space-y-3">
            <h4 className="font-bold text-base text-[var(--text)]">1. Open Source MIT License</h4>
            <p>
              AIScrubber is free and open-source software distributed under the MIT License. You are granted permission to use, inspect, copy, modify, merge, and distribute the application for personal and commercial purposes.
            </p>
          </section>

          <section className="space-y-3">
            <h4 className="font-bold text-base text-[var(--text)]">2. Human Review & User Responsibility</h4>
            <p>
              AIScrubber utilizes deterministic pattern matching and canvas rendering routines. It does not possess human contextual judgment. <strong>You are solely responsible for reviewing and verifying all scrubbed text, documents, and images before publishing or sending them over public networks.</strong>
            </p>
          </section>

          <section className="space-y-3">
            <h4 className="font-bold text-base text-[var(--text)]">3. Disclaimer of Warranty</h4>
            <p className="text-xs font-mono p-4 rounded-xl bg-[var(--surface-sunken)] border border-[var(--line)]">
              THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY.
            </p>
          </section>

          <section className="space-y-3">
            <h4 className="font-bold text-base text-[var(--text)]">4. Permitted Use</h4>
            <p>
              You agree to use AIScrubber in compliance with all applicable local, national, and international privacy laws and security regulations (including GDPR, HIPAA, and CCPA).
            </p>
          </section>
        </div>
      )}
    </div>
  );
}
