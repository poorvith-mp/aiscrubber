import {
  ArrowRight,
  ArrowUpRight,
  Bot,
  Check,
  CheckCircle2,
  ChevronRight,
  Code2,
  Copy,
  ExternalLink,
  Eye,
  FileCode2,
  FileSpreadsheet,
  FileText,
  ImageIcon,
  Key,
  Layers,
  Lock,
  Play,
  RefreshCw,
  Scale,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Zap,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import type { ToolView } from '../App';

const ROTATING_PHRASES = [
  'Masking API Keys & Secrets for LLMs',
  'Stripping EXIF GPS Location Telemetry',
  'Scrubbing PII in Production Incident Logs',
  'Blurring Confidential UI Screenshots',
  'Sanitizing PDF Author & Creation Traces',
  'Restoring Masked AI Responses in 1-Click',
];

export function HomeWorkspace({
  onSelectTool,
}: {
  onSelectTool: (view: ToolView) => void;
}) {
  const [phraseIndex, setPhraseIndex] = useState(0);
  const [isScrubbedDemo, setIsScrubbedDemo] = useState(false);
  const [copiedDemo, setCopiedDemo] = useState(false);

  // Rotate hero thinking phrases
  useEffect(() => {
    const interval = setInterval(() => {
      setPhraseIndex((prev) => (prev + 1) % ROTATING_PHRASES.length);
    }, 2800);
    return () => clearInterval(interval);
  }, []);

  const demoRawText = `User CUST-99214 reported timeout on api.acme.cloud.
Auth header: Bearer sk-live-99881122334455667788
Contact user at alex.rivas@acme.corp or call +1 (555) 019-2834.
Client IPv4: 192.168.1.144 | GPS Lat: 12.9716, Lon: 77.5946`;

  const demoScrubbedText = `User [ID_1] reported timeout on api.acme.cloud.
Auth header: Bearer [SECRET_1]
Contact user at [EMAIL_1] or call [PHONE_1].
Client IPv4: [IP_1] | GPS Lat: [LOCATION_1]`;

  return (
    <div className="space-y-16 pb-12 animate-fade-in">
      {/* HERO SECTION WITH AI THINKING ORBS */}
      <section className="relative text-center max-w-4xl mx-auto pt-6 pb-4 space-y-8">
        {/* Animated AI Thinking Orbs in Center-Top */}
        <div className="relative w-36 h-36 mx-auto flex items-center justify-center">
          {/* Orbital glowing pulse ring 1 */}
          <div className="absolute inset-0 rounded-full bg-[var(--accent)] opacity-20 blur-2xl animate-pulse" />
          {/* Orbital glowing pulse ring 2 */}
          <div className="absolute -inset-3 rounded-full border border-[var(--accent)] opacity-30 animate-spin-slow" />
          {/* Orbital ring 3 */}
          <div className="absolute -inset-6 rounded-full border border-dashed border-[var(--line)] opacity-50" />

          {/* Central AI Thinking Core */}
          <div className="relative w-20 h-20 rounded-2xl bg-gradient-to-tr from-[var(--surface-sunken)] to-[var(--panel)] border-2 border-[var(--accent)] flex items-center justify-center shadow-2xl group hover:scale-105 transition-transform">
            <svg
              className="w-10 h-10 animate-bounce-subtle"
              viewBox="0 0 64 64"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <rect width="64" height="64" rx="14" fill="var(--surface-sunken)" />
              <path
                d="M18 15h-7v34h7M46 15h7v34h-7"
                fill="none"
                stroke="var(--accent)"
                strokeWidth="5"
                strokeLinecap="square"
              />
              <path
                d="M22 28h20v8H22z"
                fill="var(--text)"
                transform="skewX(-12)"
                style={{ transformOrigin: '32px 32px' }}
              />
            </svg>
          </div>
        </div>

        {/* Dynamic Rotating Security Badge */}
        <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full border border-[var(--line)] bg-[var(--surface-sunken)] shadow-sm">
          <span className="w-2 h-2 rounded-full bg-[var(--accent)] animate-ping" />
          <span className="text-xs font-mono font-bold text-[var(--accent)] tracking-wide transition-all duration-300">
            {ROTATING_PHRASES[phraseIndex]}
          </span>
        </div>

        {/* Headline */}
        <div className="space-y-4">
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-headline font-bold tracking-tight text-[var(--text)] leading-[1.08]">
            Sanitize sensitive data <br className="hidden sm:inline" />
            <span className="italic font-normal text-[var(--accent)]">before</span> it travels.
          </h1>

          <p className="text-base sm:text-lg text-[var(--muted)] leading-relaxed max-w-2xl mx-auto">
            The browser-local privacy desk. Scrub text, replace prompt secrets with reversible constants, strip EXIF metadata, and redact screenshots entirely in memory.
          </p>
        </div>

        {/* Main CTAs */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <button
            type="button"
            onClick={() => onSelectTool('scrub')}
            className="btn-primary text-sm sm:text-base font-bold px-8 py-3.5 rounded-xl shadow-lg hover:scale-105 transition-all flex items-center gap-2 w-full sm:w-auto justify-center"
          >
            <span>Launch Privacy Suite</span>
            <ArrowRight size={18} />
          </button>

          <button
            type="button"
            onClick={() => onSelectTool('docs')}
            className="btn-secondary text-sm sm:text-base font-semibold px-6 py-3.5 rounded-xl flex items-center gap-2 w-full sm:w-auto justify-center hover:border-[var(--accent)] transition-all"
          >
            <span>Explore Documentation</span>
            <ChevronRight size={16} />
          </button>
        </div>

        {/* Guarantees Tagline */}
        <div className="flex items-center justify-center gap-6 text-xs text-[var(--muted)] pt-2 flex-wrap font-mono">
          <span className="flex items-center gap-1.5">
            <CheckCircle2 size={14} className="text-[var(--accent)]" />
            0 Network Uploads
          </span>
          <span className="flex items-center gap-1.5">
            <CheckCircle2 size={14} className="text-[var(--accent)]" />
            100% In-Browser Memory
          </span>
          <span className="flex items-center gap-1.5">
            <CheckCircle2 size={14} className="text-[var(--accent)]" />
            Open Source MIT
          </span>
        </div>
      </section>

      {/* LIVE INTERACTIVE DEMO PREVIEW WIDGET */}
      <section className="max-w-4xl mx-auto p-6 sm:p-8 rounded-3xl bg-[var(--panel)] border border-[var(--line)] shadow-2xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--line)] pb-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[var(--accent-tint)] flex items-center justify-center text-[var(--accent)]">
              <Sparkles size={18} />
            </div>
            <div>
              <h3 className="font-headline font-bold text-base sm:text-lg text-[var(--text)]">
                Live Interactive Demonstration
              </h3>
              <p className="text-xs text-[var(--muted)]">
                Toggle below to see deterministic tokenization in real time.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsScrubbedDemo((val) => !val)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                isScrubbedDemo
                  ? 'bg-[var(--accent)] text-[var(--accent-ink)]'
                  : 'bg-[var(--surface-sunken)] text-[var(--text)] border border-[var(--line)]'
              }`}
            >
              <Zap size={14} />
              {isScrubbedDemo ? 'Showing Sanitized State' : 'Click to Sanitize'}
            </button>
          </div>
        </div>

        {/* Interactive Code / Text Window */}
        <div className="relative rounded-2xl bg-[var(--surface-sunken)] border border-[var(--line)] p-5 font-mono text-xs leading-relaxed overflow-hidden">
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-[var(--line)] text-[var(--muted)]">
            <span className="text-[11px] font-bold text-[var(--text)] flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-red-400/80 inline-block" />
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400/80 inline-block" />
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400/80 inline-block" />
              <span className="ml-2 font-mono text-[10px] text-[var(--muted)]">
                {isScrubbedDemo ? 'STATUS: PROTECTED & TOKENIZED' : 'STATUS: SENSITIVE RAW DRAFT'}
              </span>
            </span>

            <button
              type="button"
              onClick={async () => {
                await navigator.clipboard.writeText(isScrubbedDemo ? demoScrubbedText : demoRawText);
                setCopiedDemo(true);
                setTimeout(() => setCopiedDemo(false), 1800);
              }}
              className="text-[11px] text-[var(--accent)] hover:underline flex items-center gap-1 font-bold"
            >
              {copiedDemo ? <Check size={13} /> : <Copy size={13} />}
              {copiedDemo ? 'Copied' : 'Copy'}
            </button>
          </div>

          <pre className="text-[var(--text)] whitespace-pre-wrap transition-all duration-300">
            {isScrubbedDemo ? demoScrubbedText : demoRawText}
          </pre>
        </div>
      </section>

      {/* 4 CORE ENGINES BENTO GRID */}
      <section className="space-y-6 max-w-5xl mx-auto">
        <div className="text-center space-y-2">
          <span className="badge-emerald">Four Dedicated Engines</span>
          <h2 className="text-2xl sm:text-4xl font-headline font-bold text-[var(--text)]">
            The Complete Browser-Local Privacy Desk
          </h2>
          <p className="text-sm text-[var(--muted)] max-w-xl mx-auto">
            Choose the exact engine required for your task. Zero configuration, zero cloud roundtrips.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-4">
          {/* Card 1: Text Scrubber */}
          <div
            onClick={() => onSelectTool('scrub')}
            className="p-6 sm:p-8 rounded-3xl bg-[var(--panel)] border border-[var(--line)] hover:border-[var(--accent)] cursor-pointer group transition-all duration-300 hover:-translate-y-1 shadow-lg space-y-4"
          >
            <div className="w-12 h-12 rounded-2xl bg-[var(--accent-tint)] text-[var(--accent)] flex items-center justify-center group-hover:scale-110 transition-transform">
              <FileCode2 size={24} />
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold font-headline text-[var(--text)]">
                  1. Text Scrubber
                </h3>
                <ArrowRight size={16} className="text-[var(--muted)] group-hover:text-[var(--accent)] group-hover:translate-x-1 transition-all" />
              </div>
              <p className="text-xs sm:text-sm text-[var(--muted)] leading-relaxed">
                Scan logs, emails, and source code against 8 built-in detectors + custom regex rules. Side-by-side diff inspector with token dictionary export.
              </p>
            </div>
          </div>

          {/* Card 2: Prompt Enhancer */}
          <div
            onClick={() => onSelectTool('prompt')}
            className="p-6 sm:p-8 rounded-3xl bg-[var(--panel)] border border-[var(--line)] hover:border-[var(--accent)] cursor-pointer group transition-all duration-300 hover:-translate-y-1 shadow-lg space-y-4"
          >
            <div className="w-12 h-12 rounded-2xl bg-[var(--accent-tint)] text-[var(--accent)] flex items-center justify-center group-hover:scale-110 transition-transform">
              <Bot size={24} />
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold font-headline text-[var(--text)]">
                  2. Prompt Enhancer & Unmasker
                </h3>
                <ArrowRight size={16} className="text-[var(--muted)] group-hover:text-[var(--accent)] group-hover:translate-x-1 transition-all" />
              </div>
              <p className="text-xs sm:text-sm text-[var(--muted)] leading-relaxed">
                Mask confidential variables with constants (`{'{{API_KEY_1}}'}`), download a session key, query ChatGPT/Claude safely, and restore AI responses in 1 click.
              </p>
            </div>
          </div>

          {/* Card 3: Metadata Desk */}
          <div
            onClick={() => onSelectTool('metadata')}
            className="p-6 sm:p-8 rounded-3xl bg-[var(--panel)] border border-[var(--line)] hover:border-[var(--accent)] cursor-pointer group transition-all duration-300 hover:-translate-y-1 shadow-lg space-y-4"
          >
            <div className="w-12 h-12 rounded-2xl bg-[var(--accent-tint)] text-[var(--accent)] flex items-center justify-center group-hover:scale-110 transition-transform">
              <FileSpreadsheet size={24} />
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold font-headline text-[var(--text)]">
                  3. Metadata Desk
                </h3>
                <ArrowRight size={16} className="text-[var(--muted)] group-hover:text-[var(--accent)] group-hover:translate-x-1 transition-all" />
              </div>
              <p className="text-xs sm:text-sm text-[var(--muted)] leading-relaxed">
                Deep EXIF/GPS viewer, in-place tag editor, and 1-click total binary stripper for JPEG, PNG, PDF documents, and MP3 audio containers.
              </p>
            </div>
          </div>

          {/* Card 4: Visual Redactor */}
          <div
            onClick={() => onSelectTool('media')}
            className="p-6 sm:p-8 rounded-3xl bg-[var(--panel)] border border-[var(--line)] hover:border-[var(--accent)] cursor-pointer group transition-all duration-300 hover:-translate-y-1 shadow-lg space-y-4"
          >
            <div className="w-12 h-12 rounded-2xl bg-[var(--accent-tint)] text-[var(--accent)] flex items-center justify-center group-hover:scale-110 transition-transform">
              <ImageIcon size={24} />
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold font-headline text-[var(--text)]">
                  4. Visual Media Redactor
                </h3>
                <ArrowRight size={16} className="text-[var(--muted)] group-hover:text-[var(--accent)] group-hover:translate-x-1 transition-all" />
              </div>
              <p className="text-xs sm:text-sm text-[var(--muted)] leading-relaxed">
                Interactive HTML5 Canvas tool to blur faces, pixelate sensitive numbers, and black out private credentials in screenshots before public sharing.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* PRIVACY STATS COUNTER STRIP */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4 max-w-5xl mx-auto">
        <div className="p-5 rounded-2xl bg-[var(--surface-sunken)] border border-[var(--line)] text-center space-y-1">
          <span className="text-2xl sm:text-3xl font-headline font-bold text-[var(--accent)]">
            0 Bytes
          </span>
          <p className="text-xs text-[var(--muted)] font-mono">Server Telemetry</p>
        </div>
        <div className="p-5 rounded-2xl bg-[var(--surface-sunken)] border border-[var(--line)] text-center space-y-1">
          <span className="text-2xl sm:text-3xl font-headline font-bold text-[var(--text)]">
            100%
          </span>
          <p className="text-xs text-[var(--muted)] font-mono">In-Browser Memory</p>
        </div>
        <div className="p-5 rounded-2xl bg-[var(--surface-sunken)] border border-[var(--line)] text-center space-y-1">
          <span className="text-2xl sm:text-3xl font-headline font-bold text-[var(--text)]">
            8+
          </span>
          <p className="text-xs text-[var(--muted)] font-mono">Detector Classes</p>
        </div>
        <div className="p-5 rounded-2xl bg-[var(--surface-sunken)] border border-[var(--line)] text-center space-y-1">
          <span className="text-2xl sm:text-3xl font-headline font-bold text-[var(--accent)]">
            &lt; 1 ms
          </span>
          <p className="text-xs text-[var(--muted)] font-mono">Execution Latency</p>
        </div>
      </section>
    </div>
  );
}
