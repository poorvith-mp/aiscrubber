import React from 'react';
import {
  ArrowRight,
  BarChart3,
  CheckCircle2,
  Layers3,
  Lock,
  ShieldCheck,
  Sparkles,
  Users,
} from 'lucide-react';

const proofPoints = [
  { value: '4x', label: 'faster privacy review' },
  { value: '99.9%', label: 'local-first protection' },
  { value: '0', label: 'auth required' },
  { value: '24/7', label: 'zero-trust workflow' },
];

const featureCards = [
  {
    icon: Lock,
    title: 'Private by design',
    description: 'Keep sensitive content in-browser and remove PII before any AI workflow touches it.',
  },
  {
    icon: Layers3,
    title: 'Simple rollout',
    description: 'Go from raw prompt to clean output with a guided onboarding experience in minutes.',
  },
  {
    icon: ShieldCheck,
    title: 'Trust-first workflows',
    description: 'Build safe AI usage patterns without exposing secrets, IDs, or confidential records.',
  },
];

const pillars = [
  'Selective redaction for email, phone, keys, IDs, and custom patterns',
  'Human-readable audit trail for every token replacement',
  'Fast workflows for founder-led teams, operators, and product teams',
];

export const LandingPage: React.FC = () => {
  return (
    <div className="bg-slate-950 text-white">
      <header className="sticky top-0 z-40 border-b border-white/10 bg-slate-950/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/20 ring-1 ring-emerald-400/40">
              <Sparkles className="h-5 w-5 text-emerald-300" />
            </div>
            <div>
              <div className="text-lg font-semibold tracking-tight">AIscrubber</div>
              <div className="text-[10px] uppercase tracking-[0.28em] text-slate-400">Privacy by default</div>
            </div>
          </div>

          <nav className="hidden items-center gap-8 text-sm text-slate-300 md:flex">
            <a href="#features" className="transition hover:text-white">Features</a>
            <a href="#onboarding" className="transition hover:text-white">Onboarding</a>
            <a href="#founder" className="transition hover:text-white">Founder</a>
          </nav>

          <a
            href="#onboarding"
            className="inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-500/15 px-4 py-2 text-sm font-medium text-emerald-200 transition hover:bg-emerald-500/25"
          >
            Get started
            <ArrowRight className="h-4 w-4" />
          </a>
        </div>
      </header>

      <main>
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.22),transparent_35%),radial-gradient(circle_at_bottom_right,_rgba(59,130,246,0.18),transparent_30%)]" />
          <div className="relative mx-auto grid max-w-7xl gap-12 px-6 py-20 lg:grid-cols-[1.2fr_0.8fr] lg:px-8 lg:py-24">
            <div>
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-200">
                <ShieldCheck className="h-3.5 w-3.5" />
                Zero-trust AI privacy workflow
              </div>

              <h1 className="max-w-xl text-5xl font-black tracking-tight text-white sm:text-6xl">
                Clean data before it ever reaches AI.
              </h1>

              <p className="mt-6 max-w-xl text-lg text-slate-300">
                AIscrubber helps teams scrub sensitive details from prompts, logs, and records before they are sent to LLMs.
                No auth, no backend, and no compromise on privacy.
              </p>

              <div className="mt-8 flex flex-wrap gap-4">
                <a
                  href="#onboarding"
                  className="inline-flex items-center gap-2 rounded-full bg-emerald-400 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-emerald-300"
                >
                  Start the onboarding
                  <ArrowRight className="h-4 w-4" />
                </a>
                <a
                  href="#features"
                  className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
                >
                  Explore features
                </a>
              </div>

              <div className="mt-10 flex flex-wrap gap-6 text-sm text-slate-300">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-300" />
                  Browser-only processing
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-300" />
                  Built for founders and teams
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/5 p-5 shadow-2xl shadow-emerald-500/10 backdrop-blur-sm">
              <div className="rounded-2xl border border-emerald-400/20 bg-slate-900/80 p-6">
                <div className="mb-6 flex items-center justify-between">
                  <div>
                    <div className="text-xs uppercase tracking-[0.25em] text-slate-400">Workflow</div>
                    <div className="mt-2 text-xl font-semibold text-white">AI-safe data check</div>
                  </div>
                  <div className="rounded-full border border-emerald-400/30 bg-emerald-500/10 px-2 py-1 text-[10px] font-medium uppercase tracking-[0.2em] text-emerald-200">
                    live
                  </div>
                </div>

                <div className="space-y-4 text-sm text-slate-200">
                  <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                    <div className="mb-1 text-xs uppercase tracking-[0.2em] text-slate-400">Input</div>
                    <p className="text-slate-100">john.doe@company.com • +1 (415) 555-0199 • sk-prod-xyz123</p>
                  </div>
                  <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3">
                    <div className="mb-1 text-xs uppercase tracking-[0.2em] text-emerald-200">Output</div>
                    <p className="text-emerald-100">[EMAIL] • [PHONE] • [API_KEY]</p>
                  </div>
                </div>

                <div className="mt-6 h-2 overflow-hidden rounded-full bg-slate-800">
                  <div className="h-full w-[84%] rounded-full bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400" />
                </div>
                <div className="mt-3 flex items-center justify-between text-[11px] uppercase tracking-[0.2em] text-slate-400">
                  <span>Detection</span>
                  <span>84%</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-6 py-16 lg:px-8">
          <div className="grid gap-4 md:grid-cols-4">
            {proofPoints.map((point) => (
              <div key={point.label} className="rounded-2xl border border-white/10 bg-white/5 p-5 text-center">
                <div className="text-3xl font-black text-white">{point.value}</div>
                <div className="mt-2 text-sm text-slate-300">{point.label}</div>
              </div>
            ))}
          </div>
        </section>

        <section id="features" className="mx-auto max-w-7xl px-6 py-20 lg:px-8">
          <div className="mb-12 max-w-2xl">
            <div className="text-sm font-medium uppercase tracking-[0.24em] text-emerald-300">Why teams choose it</div>
            <h2 className="mt-4 text-3xl font-bold tracking-tight text-white sm:text-4xl">Built for privacy-first AI work.</h2>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            {featureCards.map(({ icon: Icon, title, description }) => (
              <div key={title} className="rounded-3xl border border-white/10 bg-slate-900 p-6">
                <div className="mb-5 inline-flex rounded-2xl bg-emerald-500/10 p-3 text-emerald-300 ring-1 ring-emerald-400/30">
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-semibold text-white">{title}</h3>
                <p className="mt-3 text-sm leading-6 text-slate-300">{description}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="border-y border-white/10 bg-slate-900/70">
          <div className="mx-auto grid max-w-7xl gap-10 px-6 py-20 lg:grid-cols-[0.9fr_1.1fr] lg:px-8">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/30 bg-cyan-500/10 px-3 py-1 text-xs font-medium uppercase tracking-[0.2em] text-cyan-200">
                <BarChart3 className="h-3.5 w-3.5" />
                Built for clarity
              </div>
              <h2 className="mt-6 text-3xl font-bold tracking-tight text-white sm:text-4xl">A cleaner path to safe AI adoption.</h2>
            </div>

            <div className="space-y-4">
              {pillars.map((pillar) => (
                <div key={pillar} className="flex gap-3 rounded-2xl border border-white/10 bg-slate-950/70 p-4">
                  <div className="mt-0.5 flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-300">
                    <CheckCircle2 className="h-4 w-4" />
                  </div>
                  <p className="text-sm leading-6 text-slate-200">{pillar}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer className="mx-auto flex max-w-7xl flex-col gap-6 px-6 py-8 text-sm text-slate-400 sm:flex-row sm:items-center sm:justify-between lg:px-8">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-300 ring-1 ring-emerald-400/30">
            <Sparkles className="h-4 w-4" />
          </div>
          <span>AIscrubber</span>
        </div>
        <div className="flex items-center gap-6">
          <span>Privacy-first AI workflow</span>
          <span className="inline-flex items-center gap-2"><Users className="h-4 w-4" /> Founder-led product</span>
        </div>
      </footer>
    </div>
  );
};
