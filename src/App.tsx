import React, { useEffect, useState } from 'react';
import { Analytics } from '@vercel/analytics/react';
import { FounderStory } from './components/FounderStory';
import { LandingPage } from './components/LandingPage';
import { OnboardingFlow } from './components/OnboardingFlow';
import { ScrubberWorkspace } from './components/ScrubberWorkspace';
import { syncEcosystemAuth } from './lib/ecosystemAuth';

export function App() {
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    syncEcosystemAuth((user) => {
      setCurrentUser(user);
    });
  }, []);

  return (
    <div className="min-h-screen bg-[#040b14] text-white antialiased selection:bg-emerald-400 selection:text-slate-950">
      {currentUser && (
        <div className="bg-emerald-950/80 border-b border-emerald-500/30 px-4 py-2 text-center text-xs font-bold text-emerald-300 flex items-center justify-center gap-2">
          <span>✨ Welcome back, <strong>{currentUser.user_metadata?.full_name || currentUser.email}</strong>! You have unlimited access.</span>
        </div>
      )}
      <LandingPage />
      <ScrubberWorkspace />
      <OnboardingFlow />
      <FounderStory />
      <Analytics />
    </div>
  );
}

export default App;
