import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { ScrubberWorkspace } from './components/ScrubberWorkspace';

export function App() {
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans">
      <Header theme={theme} onToggleTheme={toggleTheme} />
      <main className="flex-1">
        <ScrubberWorkspace />
      </main>
      <footer className="border-t border-slate-200 dark:border-slate-800 py-6 text-center text-xs text-slate-500 font-mono">
        AIscrubber — Cypher Ecosystem Local-First Utility
      </footer>
    </div>
  );
}

export default App;
