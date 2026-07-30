import React from 'react';
import { Header } from './components/Header';
import { ScrubberWorkspace } from './components/ScrubberWorkspace';

export function App() {
  return (
    <div className="min-h-screen bg-[var(--bg-canvas)] text-[var(--text-primary)] flex flex-col font-sans">
      <Header />
      <main className="flex-1">
        <ScrubberWorkspace />
      </main>
      <footer className="border-t border-slate-200 py-6 text-center text-xs text-slate-500 font-mono">
        AIscrubber — Cypher Ecosystem Local-First Utility
      </footer>
    </div>
  );
}

export default App;
