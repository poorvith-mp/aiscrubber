import {
  ArrowUpRight,
  CheckCircle2,
  Code2,
  ExternalLink,
  Globe,
  Lock,
  MessageSquare,
  Share2,
  Shield,
  ShieldCheck,
  Zap,
} from 'lucide-react';

export function AboutWorkspace() {
  return (
    <div className="workspace-panel space-y-12 max-w-4xl mx-auto">
      {/* Hero Founder Card */}
      <div className="flex flex-col md:flex-row items-center gap-8 p-6 sm:p-8 rounded-2xl bg-[var(--surface-sunken)] border border-[var(--line)]">
        <div className="relative shrink-0">
          <div className="w-32 h-32 sm:w-40 sm:h-40 rounded-2xl overflow-hidden border-2 border-[var(--accent)] shadow-xl relative z-10 bg-[var(--panel)]">
            <img
              src="/poorvith_profile.jpg"
              alt="Poorvith M P — Founder of AIScrubber"
              className="w-full h-full object-cover object-top"
              onError={(e) => {
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
          </div>
          <div className="absolute -inset-2 rounded-2xl bg-[var(--accent-tint)] blur-lg -z-0 opacity-70" />
        </div>

        <div className="space-y-3 text-center md:text-left">
          <div className="flex items-center justify-center md:justify-start gap-2">
            <span className="badge-emerald">Founder & Builder</span>
            <span className="text-xs text-[var(--muted)] font-mono">
              Bengaluru, India
            </span>
          </div>

          <h2 className="text-2xl sm:text-4xl font-headline font-bold">
            Poorvith M P
          </h2>

          <p className="text-sm text-[var(--muted)] leading-relaxed max-w-xl">
            19-year-old developer building browser-local privacy tools, agent architectures, and high-taste web applications.
          </p>

          <div className="flex items-center justify-center md:justify-start gap-3 pt-2 flex-wrap">
            <a
              href="https://poorvithmp.com"
              target="_blank"
              rel="noreferrer"
              className="btn-primary text-xs font-bold flex items-center gap-1.5"
            >
              <Globe size={14} />
              poorvithmp.com
              <ArrowUpRight size={13} />
            </a>
            <a
              href="https://github.com/prvthmpcypher"
              target="_blank"
              rel="noreferrer"
              className="btn-secondary text-xs flex items-center gap-1.5"
            >
              <Code2 size={14} />
              GitHub (@prvthmpcypher)
            </a>
            <a
              href="https://x.com/poorvithmp"
              target="_blank"
              rel="noreferrer"
              className="btn-secondary text-xs flex items-center gap-1.5"
            >
              <Share2 size={14} />
              X (@poorvithmp)
            </a>
            <a
              href="https://linkedin.com/in/poorvithmp"
              target="_blank"
              rel="noreferrer"
              className="btn-secondary text-xs flex items-center gap-1.5"
            >
              <MessageSquare size={14} />
              LinkedIn
            </a>
          </div>
        </div>
      </div>

      {/* The Story & Why AIScrubber Exists */}
      <div className="space-y-6">
        <h3 className="text-xl sm:text-2xl font-headline font-bold flex items-center gap-2.5">
          <Shield className="text-[var(--accent)]" size={24} />
          Why I Built AIScrubber
        </h3>

        <div className="prose-text text-sm sm:text-base leading-relaxed space-y-4 text-[var(--muted)]">
          <p>
            I built AIScrubber for the exact moment before a draft, code snippet, screenshot, or document gets pasted into an AI service, shared in an issue, or sent over an email thread. The context is useful, but the private details inside it—API keys, bearer tokens, client IDs, email addresses, precise GPS coordinates, camera serial numbers—are not meant to travel with it.
          </p>
          <p>
            Most redaction tools require uploading your sensitive files to a backend server. That defeats the entire purpose of redacting in the first place. AIScrubber runs 100% locally in your browser memory via Web Workers, HTML5 Canvas, and client-side ArrayBuffer parsers. Nothing is ever uploaded to any application server.
          </p>
        </div>
      </div>

      {/* 4 Pillars of AIScrubber */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="p-5 rounded-xl bg-[var(--panel)] border border-[var(--line)] space-y-2">
          <div className="w-9 h-9 rounded-lg bg-[var(--accent-tint)] flex items-center justify-center text-[var(--accent)] mb-3">
            <Lock size={18} />
          </div>
          <h4 className="font-bold text-sm">100% In-Browser Execution</h4>
          <p className="text-xs text-[var(--muted)] leading-relaxed">
            All text pattern matching, metadata inspection, and canvas blurring execute strictly inside your local browser instance.
          </p>
        </div>

        <div className="p-5 rounded-xl bg-[var(--panel)] border border-[var(--line)] space-y-2">
          <div className="w-9 h-9 rounded-lg bg-[var(--accent-tint)] flex items-center justify-center text-[var(--accent)] mb-3">
            <Zap size={18} />
          </div>
          <h4 className="font-bold text-sm">Reversible AI Roundtrip</h4>
          <p className="text-xs text-[var(--muted)] leading-relaxed">
            Mask variables with constants before sending to LLMs, download your private key, and reconstruct the AI's response in 1 click.
          </p>
        </div>

        <div className="p-5 rounded-xl bg-[var(--panel)] border border-[var(--line)] space-y-2">
          <div className="w-9 h-9 rounded-lg bg-[var(--accent-tint)] flex items-center justify-center text-[var(--accent)] mb-3">
            <ShieldCheck size={18} />
          </div>
          <h4 className="font-bold text-sm">Multi-Format Metadata Desk</h4>
          <p className="text-xs text-[var(--muted)] leading-relaxed">
            Inspect and scrub hidden EXIF GPS tags, camera identifiers, and PDF/audio author streams without quality loss.
          </p>
        </div>

        <div className="p-5 rounded-xl bg-[var(--panel)] border border-[var(--line)] space-y-2">
          <div className="w-9 h-9 rounded-lg bg-[var(--accent-tint)] flex items-center justify-center text-[var(--accent)] mb-3">
            <Code2 size={18} />
          </div>
          <h4 className="font-bold text-sm">Open & Verifiable</h4>
          <p className="text-xs text-[var(--muted)] leading-relaxed">
            Built with React, TypeScript, and Tailwind CSS. Clean, inspectable source code available on GitHub.
          </p>
        </div>
      </div>

      {/* Guarantee Callout */}
      <div className="p-6 rounded-2xl bg-[var(--surface-sunken)] border border-[var(--line)] flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="space-y-1 text-center sm:text-left">
          <h4 className="font-bold text-sm">Have feedback or want to collaborate?</h4>
          <p className="text-xs text-[var(--muted)]">
            Explore my other projects and writings at poorvithmp.com.
          </p>
        </div>
        <a
          href="https://poorvithmp.com"
          target="_blank"
          rel="noreferrer"
          className="btn-primary text-xs font-bold shrink-0 flex items-center gap-1.5"
        >
          Visit Portfolio
          <ArrowUpRight size={14} />
        </a>
      </div>
    </div>
  );
}
