import React from 'react';
import { FounderStory } from './components/FounderStory';
import { LandingPage } from './components/LandingPage';
import { OnboardingFlow } from './components/OnboardingFlow';
import { ScrubberWorkspace } from './components/ScrubberWorkspace';

export function App() {
  return (
    <div className="min-h-screen bg-[#040b14] text-white antialiased selection:bg-emerald-400 selection:text-slate-950">
      <LandingPage />
      <ScrubberWorkspace />
      <OnboardingFlow />
      <FounderStory />
    </div>
  );
}

export default App;
