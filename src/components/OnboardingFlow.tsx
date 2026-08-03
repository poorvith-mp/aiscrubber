import React, { useMemo, useRef, useState } from 'react';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { ArrowRight, CheckCircle2, ChevronLeft, ShieldCheck, Sparkles } from 'lucide-react';

const onboardingSteps = [
  {
    title: 'Set up your workflow',
    description: 'Choose how your team handles confidential prompts and internal records before AI processing.',
    checklist: ['Personal workspace', 'Privacy-first defaults', 'Fast AI-safe setup'],
  },
  {
    title: 'Review sensitive inputs',
    description: 'Identify where emails, phone numbers, keys, and custom identifiers may appear in your prompt payloads.',
    checklist: ['Email detection', 'ID and phone checks', 'Custom regex rules'],
  },
  {
    title: 'Apply safe redaction',
    description: 'Trigger scrub rules and generate an AI-ready output while preserving the structure of your content.',
    checklist: ['Redact critical fields', 'Keep readable context', 'Ready for export'],
  },
  {
    title: 'Launch your first AI-safe run',
    description: 'Use the scrubbed payload in your next AI workflow with better trust and less operational risk.',
    checklist: ['No auth required', 'Local-first workflow', 'Ready to share safely'],
  },
];

export const OnboardingFlow: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const rootRef = useRef<HTMLElement>(null);

  const current = onboardingSteps[currentStep];
  const progress = useMemo(() => ((currentStep + 1) / onboardingSteps.length) * 100, [currentStep]);
  const isLastStep = currentStep === onboardingSteps.length - 1;

  useGSAP(() => {
    const ctx = gsap.context(() => {
      gsap.from('.onboarding-panel', {
        opacity: 0,
        y: 30,
        duration: 0.7,
        ease: 'power3.out',
      });

      gsap.to('.progress-bar', {
        width: `${progress}%`,
        duration: 0.5,
        ease: 'power2.out',
      });
    }, rootRef);

    return () => ctx.revert();
  }, [progress]);

  const nextStep = () => {
    if (isLastStep) {
      setCurrentStep(onboardingSteps.length);
      return;
    }

    setCurrentStep((step) => step + 1);
  };

  const previousStep = () => {
    setCurrentStep((step) => Math.max(step - 1, 0));
  };

  const completed = currentStep >= onboardingSteps.length;

  return (
    <section id="onboarding" ref={rootRef} className="mx-auto max-w-7xl px-6 py-20 lg:px-8">
      <div className="onboarding-panel rounded-[32px] border border-emerald-400/20 bg-slate-900 p-6 shadow-[0_30px_80px_rgba(16,185,129,0.08)] sm:p-8 lg:p-10">
        <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="text-sm font-medium uppercase tracking-[0.24em] text-emerald-300">Onboarding</div>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-white sm:text-4xl">Launch with a safe and simple setup.</h2>
          </div>
          <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs uppercase tracking-[0.2em] text-slate-300">
            {completed ? 'Complete' : `${currentStep + 1}/${onboardingSteps.length}`}
          </div>
        </div>

        {!completed ? (
          <>
            <div className="mb-8 h-2 overflow-hidden rounded-full bg-slate-800">
              <div className="progress-bar h-full rounded-full bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400" style={{ width: '0%' }} />
            </div>

            <div className="grid gap-8 lg:grid-cols-[1fr_0.9fr]">
              <div className="rounded-3xl border border-white/10 bg-slate-950/70 p-6">
                <div className="mb-4 flex items-center gap-3 text-emerald-300">
                  <div className="rounded-xl bg-emerald-500/10 p-2 ring-1 ring-emerald-400/30">
                    <ShieldCheck className="h-5 w-5" />
                  </div>
                  <span className="text-xs font-medium uppercase tracking-[0.24em]">Step {currentStep + 1}</span>
                </div>

                <h3 className="text-2xl font-semibold text-white">{current.title}</h3>
                <p className="mt-4 max-w-lg text-sm leading-7 text-slate-300">{current.description}</p>

                <ul className="mt-6 space-y-3">
                  {current.checklist.map((item) => (
                    <li key={item} className="flex items-center gap-3 text-sm text-slate-200">
                      <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-300">
                        <CheckCircle2 className="h-4 w-4" />
                      </span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="rounded-3xl border border-white/10 bg-slate-950/70 p-6">
                <div className="mb-4 flex items-center gap-3 text-cyan-300">
                  <div className="rounded-xl bg-cyan-500/10 p-2 ring-1 ring-cyan-400/30">
                    <Sparkles className="h-5 w-5" />
                  </div>
                  <span className="text-xs font-medium uppercase tracking-[0.24em]">Guided flow</span>
                </div>

                <div className="space-y-3">
                  {onboardingSteps.map((step, index) => {
                    const isActive = index === currentStep;
                    const isDone = index < currentStep;

                    return (
                      <div
                        key={step.title}
                        className={`rounded-2xl border p-3 transition ${
                          isActive
                            ? 'border-emerald-400/40 bg-emerald-500/5'
                            : isDone
                              ? 'border-emerald-500/20 bg-emerald-500/5'
                              : 'border-white/10 bg-slate-900'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <span className="text-sm font-medium text-white">{step.title}</span>
                          {isDone && <CheckCircle2 className="h-4 w-4 text-emerald-300" />}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-between">
              <button
                type="button"
                onClick={previousStep}
                disabled={currentStep === 0}
                className="inline-flex items-center justify-center gap-2 rounded-full border border-white/10 bg-white/5 px-5 py-3 text-sm font-medium text-slate-200 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronLeft className="h-4 w-4" />
                Back
              </button>

              <button
                type="button"
                onClick={nextStep}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-emerald-400 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-emerald-300"
              >
                {isLastStep ? 'Finish setup' : 'Next step'}
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </>
        ) : (
          <div className="rounded-3xl border border-emerald-400/20 bg-emerald-500/5 p-8 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-400/30">
              <CheckCircle2 className="h-8 w-8" />
            </div>
            <h3 className="mt-5 text-3xl font-bold text-white">You’re ready to go.</h3>
            <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-slate-300">
              Your privacy-first AI workflow is set. Move into the product experience and start reviewing content with safer defaults.
            </p>
            <a
              href="#features"
              className="mt-6 inline-flex items-center gap-2 rounded-full bg-emerald-400 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-emerald-300"
            >
              View the features
              <ArrowRight className="h-4 w-4" />
            </a>
          </div>
        )}
      </div>
    </section>
  );
};
