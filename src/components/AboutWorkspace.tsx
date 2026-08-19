import {
  ArrowUpRight,
  CheckCircle2,
  Code2,
  ExternalLink,
  Globe,
  Lock,
  Mail,
  MessageSquare,
  Shield,
  ShieldCheck,
  Zap,
} from 'lucide-react';

// Exact PM Aperture logo mark from poorvithmp website
function PoorvithApertureLogo({ className = 'w-12 h-12' }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 64 64"
      role="img"
      aria-label="Poorvith M P Aperture Mark"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect
        x="1"
        y="1"
        width="62"
        height="62"
        rx="17"
        fill="#080809"
        stroke="#C8CBD0"
        strokeWidth="1.5"
      />
      <g fill="#F4F2ED">
        <path d="M15 14.5h25.5C49.61 14.5 57 21.89 57 31c0 8.15-5.9 14.95-13.65 16.25V28.6L32 35.5 15 21.2Z" />
        <path d="M15 28.75h10.75v17.9L15 53.5Z" />
      </g>
      <path
        d="M28.6 32.25 36.25 36v10.3l-7.65 4.1Z"
        fill="#C9A227"
      />
    </svg>
  );
}

// Social SVG Icons
function GithubSocialIcon() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
      />
    </svg>
  );
}

function TwitterSocialIcon() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

function LinkedinSocialIcon() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
      <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z" />
    </svg>
  );
}

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
          <div className="flex items-center justify-center md:justify-start gap-3">
            <PoorvithApertureLogo className="w-8 h-8 shrink-0" />
            <div className="flex items-center gap-2">
              <span className="badge-emerald">Founder & Builder</span>
              <span className="text-xs text-[var(--muted)] font-mono">
                Bengaluru, India
              </span>
            </div>
          </div>

          <h2 className="text-2xl sm:text-4xl font-headline font-bold text-[var(--text)]">
            Poorvith M P
          </h2>

          <p className="text-sm text-[var(--muted)] leading-relaxed max-w-xl">
            19-year-old developer building browser-local privacy tools, agent systems, and high-taste web experiences.
          </p>

          {/* Social Icons Bar */}
          <div className="flex items-center justify-center md:justify-start gap-2.5 pt-2 flex-wrap">
            <a
              href="https://poorvithmp.com"
              target="_blank"
              rel="noreferrer"
              className="btn-primary text-xs font-bold flex items-center gap-1.5"
            >
              <Globe size={14} />
              <span>poorvithmp.com</span>
              <ArrowUpRight size={13} />
            </a>

            <a
              href="https://github.com/poorvith-mp"
              target="_blank"
              rel="noreferrer"
              className="btn-secondary text-xs flex items-center gap-1.5"
              title="GitHub Profile"
            >
              <GithubSocialIcon />
              <span>GitHub</span>
            </a>

            <a
              href="https://x.com/poorvithmp"
              target="_blank"
              rel="noreferrer"
              className="btn-secondary text-xs flex items-center gap-1.5"
              title="X (Twitter) Profile"
            >
              <TwitterSocialIcon />
              <span>@poorvithmp</span>
            </a>

            <a
              href="https://linkedin.com/in/poorvithmp"
              target="_blank"
              rel="noreferrer"
              className="btn-secondary text-xs flex items-center gap-1.5"
              title="LinkedIn Profile"
            >
              <LinkedinSocialIcon />
              <span>LinkedIn</span>
            </a>
          </div>
        </div>
      </div>

      {/* The Story & Why AIScrubber Exists */}
      <div className="space-y-6">
        <h3 className="text-xl sm:text-2xl font-headline font-bold flex items-center gap-2.5 text-[var(--text)]">
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
          <h4 className="font-bold text-sm text-[var(--text)]">100% In-Browser Execution</h4>
          <p className="text-xs text-[var(--muted)] leading-relaxed">
            All text pattern matching, metadata inspection, and canvas blurring execute strictly inside your local browser instance.
          </p>
        </div>

        <div className="p-5 rounded-xl bg-[var(--panel)] border border-[var(--line)] space-y-2">
          <div className="w-9 h-9 rounded-lg bg-[var(--accent-tint)] flex items-center justify-center text-[var(--accent)] mb-3">
            <Zap size={18} />
          </div>
          <h4 className="font-bold text-sm text-[var(--text)]">Reversible AI Roundtrip</h4>
          <p className="text-xs text-[var(--muted)] leading-relaxed">
            Mask variables with constants before sending to LLMs, download your private key, and reconstruct the AI's response in 1 click.
          </p>
        </div>

        <div className="p-5 rounded-xl bg-[var(--panel)] border border-[var(--line)] space-y-2">
          <div className="w-9 h-9 rounded-lg bg-[var(--accent-tint)] flex items-center justify-center text-[var(--accent)] mb-3">
            <ShieldCheck size={18} />
          </div>
          <h4 className="font-bold text-sm text-[var(--text)]">Multi-Format Metadata Desk</h4>
          <p className="text-xs text-[var(--muted)] leading-relaxed">
            Inspect and scrub hidden EXIF GPS tags, camera identifiers, and PDF/audio author streams without quality loss.
          </p>
        </div>

        <div className="p-5 rounded-xl bg-[var(--panel)] border border-[var(--line)] space-y-2">
          <div className="w-9 h-9 rounded-lg bg-[var(--accent-tint)] flex items-center justify-center text-[var(--accent)] mb-3">
            <Code2 size={18} />
          </div>
          <h4 className="font-bold text-sm text-[var(--text)]">Open & Verifiable</h4>
          <p className="text-xs text-[var(--muted)] leading-relaxed">
            Built with React, TypeScript, and Tailwind CSS. Clean, inspectable source code available on GitHub.
          </p>
        </div>
      </div>

      {/* Brand Identity Note */}
      <div className="p-6 rounded-2xl bg-[var(--surface-sunken)] border border-[var(--line)] flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <PoorvithApertureLogo className="w-12 h-12 shrink-0" />
          <div className="space-y-1">
            <h4 className="font-bold text-sm text-[var(--text)]">PM Aperture Design Mark</h4>
            <p className="text-xs text-[var(--muted)]">
              Crafted as the signature design identity across all Poorvith M P projects.
            </p>
          </div>
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
