import { Analytics } from '@vercel/analytics/react';
import {
  ArrowRight,
  Bot,
  ExternalLink,
  Eye,
  FileCode2,
  FileSpreadsheet,
  Globe,
  ImageIcon,
  Lock,
  Moon,
  Shield,
  ShieldCheck,
  Sparkles,
  Sun,
  User,
  Zap,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { AboutWorkspace } from './components/AboutWorkspace';
import { MediaRedactorWorkspace } from './components/MediaRedactorWorkspace';
import { MetadataWorkspace } from './components/MetadataWorkspace';
import { PromptEnhancerWorkspace } from './components/PromptEnhancerWorkspace';
import { ScrubberWorkspace } from './components/ScrubberWorkspace';

export type ToolView = 'scrub' | 'prompt' | 'metadata' | 'media' | 'about';

function ApertureMark() {
  return (
    <span className="inline-flex items-center gap-1.5 font-mono font-bold text-sm tracking-tight text-[var(--accent)] select-none">
      <span className="w-2.5 h-2.5 rounded-full bg-[var(--accent)] inline-block shadow-[0_0_8px_var(--accent)]" />
      <span className="text-[var(--text)]">AI</span>
      <span className="text-[var(--accent)]">Scrubber</span>
    </span>
  );
}

export function App() {
  const [light, setLight] = useState(false);
  const [currentView, setCurrentView] = useState<ToolView>('scrub');

  // Sync with URL hash
  useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash.replace('#', '') as ToolView;
      if (['scrub', 'prompt', 'metadata', 'media', 'about'].includes(hash)) {
        setCurrentView(hash);
      }
    };
    handleHash();
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, []);

  const switchView = (view: ToolView) => {
    setCurrentView(view);
    window.location.hash = view;
  };

  useEffect(() => {
    document.documentElement.dataset.theme = light ? 'light' : 'dark';
  }, [light]);

  return (
    <div className="site-shell min-h-screen flex flex-col justify-between">
      {/* Top Navigation */}
      <header className="site-header">
        <div className="flex items-center gap-6">
          <button
            type="button"
            onClick={() => switchView('scrub')}
            className="flex items-center gap-2 text-left bg-transparent border-0 cursor-pointer p-0"
            aria-label="AIScrubber home"
          >
            <ApertureMark />
          </button>

          {/* Tool Navigation Switcher */}
          <nav className="hidden md:flex items-center gap-1 bg-[var(--surface-sunken)] p-1 rounded-xl border border-[var(--line)]">
            <button
              type="button"
              onClick={() => switchView('scrub')}
              className={`nav-pill ${currentView === 'scrub' ? 'active' : ''}`}
            >
              <FileCode2 size={14} />
              Text Scrubber
            </button>
            <button
              type="button"
              onClick={() => switchView('prompt')}
              className={`nav-pill ${currentView === 'prompt' ? 'active' : ''}`}
            >
              <Bot size={14} />
              Prompt Enhancer
            </button>
            <button
              type="button"
              onClick={() => switchView('metadata')}
              className={`nav-pill ${currentView === 'metadata' ? 'active' : ''}`}
            >
              <FileSpreadsheet size={14} />
              Metadata Desk
            </button>
            <button
              type="button"
              onClick={() => switchView('media')}
              className={`nav-pill ${currentView === 'media' ? 'active' : ''}`}
            >
              <ImageIcon size={14} />
              Visual Redactor
            </button>
            <button
              type="button"
              onClick={() => switchView('about')}
              className={`nav-pill ${currentView === 'about' ? 'active' : ''}`}
            >
              <User size={14} />
              About
            </button>
          </nav>
        </div>

        {/* Right Nav Utilities */}
        <div className="flex items-center gap-3">
          <button
            className="theme-toggle-button"
            type="button"
            onClick={() => setLight((val) => !val)}
            aria-label={`Switch to ${light ? 'dark' : 'light'} mode`}
          >
            {light ? <Moon size={17} /> : <Sun size={17} />}
          </button>

          <a
            href="https://github.com/prvthmpcypher/aiscrubber"
            target="_blank"
            rel="noreferrer"
            className="btn-secondary text-xs hidden sm:inline-flex items-center gap-1.5"
          >
            GitHub
          </a>

          <a
            href="https://poorvithmp.com"
            target="_blank"
            rel="noreferrer"
            className="btn-primary text-xs font-bold inline-flex items-center gap-1.5"
          >
            <span>Poorvith</span>
            <ArrowRight size={13} />
          </a>
        </div>
      </header>

      {/* Mobile Tool Selector */}
      <div className="md:hidden flex items-center gap-1 overflow-x-auto p-3 border-b border-[var(--line)] bg-[var(--surface-sunken)]">
        <button
          type="button"
          onClick={() => switchView('scrub')}
          className={`nav-pill whitespace-nowrap text-xs ${currentView === 'scrub' ? 'active' : ''}`}
        >
          Text Scrubber
        </button>
        <button
          type="button"
          onClick={() => switchView('prompt')}
          className={`nav-pill whitespace-nowrap text-xs ${currentView === 'prompt' ? 'active' : ''}`}
        >
          Prompt Enhancer
        </button>
        <button
          type="button"
          onClick={() => switchView('metadata')}
          className={`nav-pill whitespace-nowrap text-xs ${currentView === 'metadata' ? 'active' : ''}`}
        >
          Metadata Desk
        </button>
        <button
          type="button"
          onClick={() => switchView('media')}
          className={`nav-pill whitespace-nowrap text-xs ${currentView === 'media' ? 'active' : ''}`}
        >
          Visual Redactor
        </button>
        <button
          type="button"
          onClick={() => switchView('about')}
          className={`nav-pill whitespace-nowrap text-xs ${currentView === 'about' ? 'active' : ''}`}
        >
          About
        </button>
      </div>

      {/* Main App Container */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-10 flex-1 w-full space-y-12">
        {/* Dynamic Hero Section */}
        {currentView !== 'about' && (
          <section className="text-center max-w-3xl mx-auto space-y-4 pt-4 pb-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[var(--line)] bg-[var(--surface-sunken)] text-xs text-[var(--accent)] font-mono">
              <ShieldCheck size={14} />
              <span>100% In-Browser · Zero Telemetry on Sensitive Data</span>
            </div>

            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-headline font-bold tracking-tight text-[var(--text)]">
              Remove private details before you share.
            </h1>

            <p className="text-sm sm:text-base text-[var(--muted)] leading-relaxed max-w-2xl mx-auto">
              Sanitize text, redact prompts with reversible constants, strip EXIF metadata, and blur sensitive media in local memory.
            </p>

            {/* Quick-switch tool chips */}
            <div className="flex items-center justify-center gap-2 pt-2 flex-wrap">
              <button
                type="button"
                onClick={() => switchView('scrub')}
                className={`quick-chip ${currentView === 'scrub' ? 'active' : ''}`}
              >
                Text Scrubber
              </button>
              <button
                type="button"
                onClick={() => switchView('prompt')}
                className={`quick-chip ${currentView === 'prompt' ? 'active' : ''}`}
              >
                Prompt Enhancer & Unmasker
              </button>
              <button
                type="button"
                onClick={() => switchView('metadata')}
                className={`quick-chip ${currentView === 'metadata' ? 'active' : ''}`}
              >
                Metadata Desk
              </button>
              <button
                type="button"
                onClick={() => switchView('media')}
                className={`quick-chip ${currentView === 'media' ? 'active' : ''}`}
              >
                Visual Media Redactor
              </button>
            </div>
          </section>
        )}

        {/* Active Tool View */}
        <section id="workspace" className="transition-all duration-300">
          {currentView === 'scrub' && <ScrubberWorkspace />}
          {currentView === 'prompt' && <PromptEnhancerWorkspace />}
          {currentView === 'metadata' && <MetadataWorkspace />}
          {currentView === 'media' && <MediaRedactorWorkspace />}
          {currentView === 'about' && <AboutWorkspace />}
        </section>

        {/* Threat Model & Philosophy Section */}
        {currentView !== 'about' && (
          <section className="grid grid-cols-1 md:grid-cols-3 gap-6 p-6 rounded-2xl bg-[var(--panel)] border border-[var(--line)]">
            <div className="space-y-2">
              <div className="flex items-center gap-2 font-bold text-sm text-[var(--text)]">
                <Lock size={16} className="text-[var(--accent)]" />
                <span>Zero Server Roundtrips</span>
              </div>
              <p className="text-xs text-[var(--muted)] leading-relaxed">
                Processing runs on your machine's CPU in browser memory. Drafts, photos, and files are never transmitted anywhere.
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 font-bold text-sm text-[var(--text)]">
                <Sparkles size={16} className="text-[var(--accent)]" />
                <span>Deterministic Pattern Matching</span>
              </div>
              <p className="text-xs text-[var(--muted)] leading-relaxed">
                Rules match regexes and data structures predictably. Always review sanitized results before sharing critical drafts.
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 font-bold text-sm text-[var(--text)]">
                <Shield size={16} className="text-[var(--accent)]" />
                <span>Built by Poorvith M P</span>
              </div>
              <p className="text-xs text-[var(--muted)] leading-relaxed">
                Crafted for builders, developers, and researchers. Read the story and explore the source code on GitHub.
              </p>
            </div>
          </section>
        )}
      </main>

      {/* Global Footer */}
      <footer className="border-t border-[var(--line)] bg-[var(--surface-sunken)] py-8 px-6 mt-16">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6 text-xs text-[var(--muted)]">
          <div className="flex items-center gap-3">
            <ApertureMark />
            <span>·</span>
            <span>
              Designed & Built by{' '}
              <a
                href="https://poorvithmp.com"
                target="_blank"
                rel="noreferrer"
                className="text-[var(--text)] font-semibold hover:text-[var(--accent)]"
              >
                Poorvith M P
              </a>
            </span>
          </div>

          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => switchView('about')}
              className="hover:text-[var(--text)]"
            >
              About & Philosophy
            </button>
            <a
              href="https://github.com/prvthmpcypher/aiscrubber"
              target="_blank"
              rel="noreferrer"
              className="hover:text-[var(--text)]"
            >
              GitHub Repository
            </a>
            <a
              href="https://poorvithmp.com"
              target="_blank"
              rel="noreferrer"
              className="hover:text-[var(--text)]"
            >
              Portfolio
            </a>
          </div>
        </div>
      </footer>

      <Analytics />
    </div>
  );
}

export default App;
