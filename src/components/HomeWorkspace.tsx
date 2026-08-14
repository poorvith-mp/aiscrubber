import {
  ArrowRight,
  Bot,
  Check,
  CheckCircle2,
  ChevronRight,
  Copy,
  FileCode2,
  FileSpreadsheet,
  ImageIcon,
  Lock,
  RefreshCw,
  Shield,
  ShieldCheck,
  Sparkles,
  Zap,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import type { ToolView } from '../App';

interface HomeWorkspaceProps {
  onSelectTool: (tool: ToolView) => void;
}

const ROTATING_PHRASES = [
  'Stripping Anthropic Claude & AI Invisible Watermarks',
  'Masking API Keys & Secrets for LLMs',
  'Stripping C2PA Manifests & EXIF GPS Coordinates',
  'Scrubbing PII & Bearer Tokens in Incident Logs',
  'Sanitizing PDF Author & Editing Trails',
];

export function HomeWorkspace({ onSelectTool }: HomeWorkspaceProps) {
  const [phraseIndex, setPhraseIndex] = useState(0);
  const [isScrubbedDemo, setIsScrubbedDemo] = useState(true);
  const [copiedDemo, setCopiedDemo] = useState(false);

  // Cycle security statements every 3.5s
  useEffect(() => {
    const timer = setInterval(() => {
      setPhraseIndex((prev) => (prev + 1) % ROTATING_PHRASES.length);
    }, 3500);
    return () => clearInterval(timer);
  }, []);

  const demoRawText = `// Production Incident Crash Dump
Host: 192.168.1.144 | Environment: AWS_PROD
Database URL: postgresql://admin_user:P@ssw0rd9988@db.internal.acme.corp:5432/main_db
Auth Header: Bearer sk-live-998811223344556677889900aabbccdd
Contact Customer: alex.rivas@acme.corp (Card: 4532-8899-1122-3344)`;

  const demoScrubbedText = `// Production Incident Crash Dump
Host: [IP_1] | Environment: AWS_PROD
Database URL: postgresql://[SECRET_1]
Auth Header: Bearer [SECRET_2]
Contact Customer: [EMAIL_1] (Card: [CARD_1])`;

  return (
    <div className="space-y-16 py-4 sm:py-8">
      {/* HERO SECTION */}
      <section className="text-center space-y-8 max-w-4xl mx-auto px-4">
        {/* Dynamic AI Thinking Orb with Signature Bracket Logo */}
        <div className="relative flex items-center justify-center mx-auto mb-2 w-28 h-28 sm:w-36 sm:h-36">
          {/* Outer Pulsing Aura */}
          <div className="absolute inset-0 rounded-full bg-[var(--accent)] opacity-20 blur-2xl animate-pulse" />

          {/* Rotating Orbital Rings */}
          <div
            className="absolute inset-1 rounded-full border border-[var(--accent)] opacity-40 animate-spin-slow"
            style={{ animationDuration: '14s' }}
          />
          <div
            className="absolute inset-3 rounded-full border border-dashed border-[var(--accent)] opacity-30 animate-spin-slow"
            style={{ animationDuration: '22s', animationDirection: 'reverse' }}
          />

          {/* Center Logo Bubble */}
          <div className="relative z-10 w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-[var(--panel)] border-2 border-[var(--line)] flex items-center justify-center shadow-xl">
            <svg
              className="w-9 h-9 sm:w-11 sm:h-11"
              viewBox="0 0 64 64"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
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
            The browser-local privacy desk. Strip invisible AI watermarks, mask prompt secrets with reversible constants, remove C2PA/EXIF metadata, and redact screenshots entirely in memory.
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

      {/* 5 CORE ENGINES BENTO GRID */}
      <section className="space-y-6 max-w-5xl mx-auto">
        <div className="text-center space-y-2">
          <span className="badge-emerald">Five Dedicated Engines</span>
          <h2 className="text-2xl sm:text-4xl font-headline font-bold text-[var(--text)]">
            The Complete Browser-Local Privacy Suite
          </h2>
          <p className="text-sm text-[var(--muted)] max-w-xl mx-auto">
            Choose the exact engine required for your task. Zero configuration, zero cloud roundtrips.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 pt-4">
          {/* Card 1: Text Scrubber */}
          <div
            onClick={() => onSelectTool('scrub')}
            className="p-6 rounded-3xl bg-[var(--panel)] border border-[var(--line)] hover:border-[var(--accent)] cursor-pointer group transition-all duration-300 hover:-translate-y-1 shadow-lg space-y-4"
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
              <p className="text-xs text-[var(--muted)] leading-relaxed">
                Scan logs, emails, and source code against 8 built-in detectors + custom regex rules. Side-by-side diff inspector with token dictionary export.
              </p>
            </div>
          </div>

          {/* Card 2: Prompt Enhancer */}
          <div
            onClick={() => onSelectTool('prompt')}
            className="p-6 rounded-3xl bg-[var(--panel)] border border-[var(--line)] hover:border-[var(--accent)] cursor-pointer group transition-all duration-300 hover:-translate-y-1 shadow-lg space-y-4"
          >
            <div className="w-12 h-12 rounded-2xl bg-[var(--accent-tint)] text-[var(--accent)] flex items-center justify-center group-hover:scale-110 transition-transform">
              <Bot size={24} />
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold font-headline text-[var(--text)]">
                  2. Prompt Enhancer
                </h3>
                <ArrowRight size={16} className="text-[var(--muted)] group-hover:text-[var(--accent)] group-hover:translate-x-1 transition-all" />
              </div>
              <p className="text-xs text-[var(--muted)] leading-relaxed">
                Mask confidential variables with constants (`{'{{API_KEY_1}}'}`), download a session key, query ChatGPT/Claude safely, and restore AI responses in 1 click.
              </p>
            </div>
          </div>

          {/* Card 3: AI Watermark Remover (NEW) */}
          <div
            onClick={() => onSelectTool('watermark')}
            className="p-6 rounded-3xl bg-[var(--panel)] border-2 border-[var(--accent)] hover:scale-[1.02] cursor-pointer group transition-all duration-300 shadow-xl space-y-4 relative overflow-hidden"
          >
            <div className="absolute top-3 right-3">
              <span className="badge-emerald text-[10px]">NEW</span>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-[var(--accent)] text-[var(--accent-ink)] flex items-center justify-center group-hover:scale-110 transition-transform font-bold">
              <Sparkles size={24} />
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold font-headline text-[var(--text)]">
                  3. AI Watermark Remover
                </h3>
                <ArrowRight size={16} className="text-[var(--accent)] group-hover:translate-x-1 transition-all" />
              </div>
              <p className="text-xs text-[var(--muted)] leading-relaxed">
                Strip Anthropic Claude invisible zero-width watermarks (`\u200B`, `\uFEFF`), normalize synthetic spaces, revert homoglyphs, and remove AI signature cadences.
              </p>
            </div>
          </div>

          {/* Card 4: Metadata & C2PA Desk */}
          <div
            onClick={() => onSelectTool('metadata')}
            className="p-6 rounded-3xl bg-[var(--panel)] border border-[var(--line)] hover:border-[var(--accent)] cursor-pointer group transition-all duration-300 hover:-translate-y-1 shadow-lg space-y-4"
          >
            <div className="w-12 h-12 rounded-2xl bg-[var(--accent-tint)] text-[var(--accent)] flex items-center justify-center group-hover:scale-110 transition-transform">
              <FileSpreadsheet size={24} />
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold font-headline text-[var(--text)]">
                  4. Metadata & C2PA Desk
                </h3>
                <ArrowRight size={16} className="text-[var(--muted)] group-hover:text-[var(--accent)] group-hover:translate-x-1 transition-all" />
              </div>
              <p className="text-xs text-[var(--muted)] leading-relaxed">
                Inspect C2PA Content Credentials (ChatGPT, DALL·E 3, Nano Banana), edit author tags, or strip 100% of EXIF/GPS data client-side.
              </p>
            </div>
          </div>

          {/* Card 5: Visual Redactor */}
          <div
            onClick={() => onSelectTool('media')}
            className="p-6 rounded-3xl bg-[var(--panel)] border border-[var(--line)] hover:border-[var(--accent)] cursor-pointer group transition-all duration-300 hover:-translate-y-1 shadow-lg space-y-4 md:col-span-2 lg:col-span-2"
          >
            <div className="w-12 h-12 rounded-2xl bg-[var(--accent-tint)] text-[var(--accent)] flex items-center justify-center group-hover:scale-110 transition-transform">
              <ImageIcon size={24} />
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold font-headline text-[var(--text)]">
                  5. Visual Media Redactor
                </h3>
                <ArrowRight size={16} className="text-[var(--muted)] group-hover:text-[var(--accent)] group-hover:translate-x-1 transition-all" />
              </div>
              <p className="text-xs text-[var(--muted)] leading-relaxed">
                Interactive HTML5 Canvas tool to blur faces, pixelate sensitive credentials, and black out private numbers in screenshots before public sharing.
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
            5
          </span>
          <p className="text-xs text-[var(--muted)] font-mono">Dedicated Engines</p>
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
