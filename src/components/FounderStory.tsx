import React from 'react';

export const FounderStory: React.FC = () => {
  return (
    <section id="founder" className="mx-auto max-w-7xl px-6 py-20 lg:px-8">
      <div className="grid gap-10 rounded-[30px] border border-white/10 bg-slate-900 p-6 shadow-2xl shadow-cyan-500/5 sm:p-8 lg:grid-cols-[0.85fr_1.15fr] lg:p-10">
        <div className="overflow-hidden rounded-[28px] border border-white/10 bg-slate-950">
          <img
            src="/founder-profile.jpg"
            alt="Poorvith M P, founder of AIscrubber"
            className="h-full w-full object-cover"
          />
        </div>

        <div className="flex flex-col justify-center">
          <div className="text-sm font-medium uppercase tracking-[0.24em] text-cyan-300">Founder story</div>
          <h2 className="mt-4 text-3xl font-bold tracking-tight text-white sm:text-4xl">Built by someone who needed safer AI workflows.</h2>
          <p className="mt-5 text-base leading-8 text-slate-300">
            AIscrubber was created to make privacy-conscious AI usage realistic for real teams. The goal is simple: keep data usable while preventing sensitive details from leaking into the wrong systems.
          </p>
          <p className="mt-4 text-base leading-8 text-slate-300">
            By working directly with modern product teams and operators, the product focuses on trust, clarity, and fast time-to-value without auth friction or hidden backend complexity.
          </p>
        </div>
      </div>
    </section>
  );
};
