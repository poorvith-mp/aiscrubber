import React from 'react';
import { FounderStory } from './components/FounderStory';
import { LandingPage } from './components/LandingPage';
import { OnboardingFlow } from './components/OnboardingFlow';

export function App() {
  return (
    <div className="min-h-screen bg-slate-950 text-white antialiased">
      <LandingPage />
      <OnboardingFlow />
      <FounderStory />
    </div>
  );
}

export default App;
