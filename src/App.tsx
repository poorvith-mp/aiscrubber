import { Analytics } from '@vercel/analytics/react';
import {
  ArrowRight,
  BookOpen,
  Bot,
  ExternalLink,
  FileCode2,
  FileSpreadsheet,
  Heart,
  ImageIcon,
  Lock,
  MessageSquarePlus,
  Moon,
  ShieldCheck,
  Sparkles,
  Star,
  Sun,
  User,
  Zap,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { AboutWorkspace } from './components/AboutWorkspace';
import { DocsWorkspace } from './components/DocsWorkspace';
import { FeedbackModal } from './components/FeedbackModal';
import { MediaRedactorWorkspace } from './components/MediaRedactorWorkspace';
import { MetadataWorkspace } from './components/MetadataWorkspace';
import { PageLoader } from './components/PageLoader';
import { PromptEnhancerWorkspace } from './components/PromptEnhancerWorkspace';
import { ScrubberWorkspace } from './components/ScrubberWorkspace';

export type ToolView = 'scrub' | 'prompt' | 'metadata' | 'media' | 'docs' | 'about';

// Original AIScrubber signature logo rendered with current color tokens
function OriginalLogo({ className = 'w-7 h-7' }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <rect
        width="64"
        height="64"
        rx="14"
        fill="var(--surface-sunken)"
        stroke="var(--line)"
        strokeWidth="2"
      />
      <path
        d="M18 15h-7v34h7M46 15h7v34h-7"
        fill="none"
        stroke="var(--accent)"
        strokeWidth="5"
        strokeLinecap="square"
      />
      <path
        d="M22 28h20v8H22z"
        fill="var(--text)"
        transform="skewX(-12)"
        style={{ transformOrigin: '32px 32px' }}
      />
    </svg>
  );
}

function GithubIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
      />
    </svg>
  );
}

export function App() {
  const [light, setLight] = useState(false);
  const [currentView, setCurrentView] = useState<ToolView>('scrub');
  const [starCount, setStarCount] = useState<number | null>(null);
  const [isSwitching, setIsSwitching] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);

  // Sync with URL hash
  useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash.replace('#', '') as ToolView;
      if (['scrub', 'prompt', 'metadata', 'media', 'docs', 'about'].includes(hash)) {
        setCurrentView(hash);
      }
    };
    handleHash();
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, []);

  // Fetch live GitHub stars for aiscrubber repo
  useEffect(() => {
    async function fetchStars() {
      try {
        const res = await fetch('https://api.github.com/repos/prvthmpcypher/aiscrubber');
        if (res.ok) {
          const data = await res.json();
          if (typeof data.stargazers_count === 'number') {
            setStarCount(data.stargazers_count);
            return;
          }
        }
        const fallbackRes = await fetch('https://api.github.com/repos/Poorvith-M/aiscrubber');
        if (fallbackRes.ok) {
          const fbData = await fallbackRes.json();
          if (typeof fbData.stargazers_count === 'number') {
            setStarCount(fbData.stargazers_count);
          }
        }
      } catch {
        // Silently fallback
      }
    }
    fetchStars();
  }, []);

  const switchView = (view: ToolView) => {
    if (view === currentView) return;
    setIsSwitching(true);
    setCurrentView(view);
    window.location.hash = view;
    setTimeout(() => setIsSwitching(false), 280);
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
            className="flex items-center gap-2.5 text-left bg-transparent border-0 cursor-pointer p-0"
            aria-label="AIScrubber home"
          >
            <OriginalLogo className="w-8 h-8 shrink-0" />
            <span className="font-headline font-bold text-lg tracking-tight text-[var(--text)]">
              AI<span className="text-[var(--accent)]">scrubber</span>
            </span>
          </button>

          {/* Desktop Navigation Switcher */}
          <nav className="hidden lg:flex items-center gap-1 bg-[var(--surface-sunken)] p-1 rounded-xl border border-[var(--line)]">
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
              onClick={() => switchView('docs')}
              className={`nav-pill ${currentView === 'docs' ? 'active' : ''}`}
            >
              <BookOpen size={14} />
              Docs
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

        {/* Right Navigation Actions */}
        <div className="flex items-center gap-2.5">
          {/* Feedback Button */}
          <button
            type="button"
            onClick={() => setShowFeedback(true)}
            className="btn-secondary text-xs flex items-center gap-1.5"
            title="Give feedback to founder"
          >
            <MessageSquarePlus size={14} className="text-[var(--accent)]" />
            <span className="hidden sm:inline">Feedback</span>
          </button>

          {/* GitHub Star Live Count Badge */}
          <a
            href="https://github.com/prvthmpcypher/aiscrubber"
            target="_blank"
            rel="noreferrer"
            className="github-star-pill"
            title="Star AIScrubber on GitHub"
          >
            <GithubIcon className="w-4 h-4" />
            <span className="hidden sm:inline">Star</span>
            <span className="star-separator hidden sm:inline" />
            <Star size={12} className="fill-[var(--accent)] text-[var(--accent)]" />
            <span className="star-count font-mono font-bold">
              {starCount !== null ? starCount.toLocaleString() : '★'}
            </span>
          </a>

          {/* Theme Toggle Button */}
          <button
            className="theme-toggle-button"
            type="button"
            onClick={() => setLight((val) => !val)}
            aria-label={`Switch to ${light ? 'dark' : 'light'} mode`}
          >
            {light ? <Moon size={17} /> : <Sun size={17} />}
          </button>
        </div>
      </header>

      {/* Mobile/Tablet Horizontal Tool Selector */}
      <div className="lg:hidden flex items-center gap-1 overflow-x-auto p-2.5 border-b border-[var(--line)] bg-[var(--surface-sunken)]">
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
          onClick={() => switchView('docs')}
          className={`nav-pill whitespace-nowrap text-xs ${currentView === 'docs' ? 'active' : ''}`}
        >
          Docs
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
        {currentView !== 'about' && currentView !== 'docs' && (
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
                Prompt Enhancer
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
                Visual Redactor
              </button>
            </div>
          </section>
        )}

        {/* Active Tool View with Animated Loader Transition */}
        <section id="workspace" className="transition-all duration-300">
          {isSwitching ? (
            <PageLoader text={`Loading ${currentView.toUpperCase()} Desk...`} />
          ) : (
            <>
              {currentView === 'scrub' && <ScrubberWorkspace />}
              {currentView === 'prompt' && <PromptEnhancerWorkspace />}
              {currentView === 'metadata' && <MetadataWorkspace />}
              {currentView === 'media' && <MediaRedactorWorkspace />}
              {currentView === 'docs' && <DocsWorkspace />}
              {currentView === 'about' && <AboutWorkspace />}
            </>
          )}
        </section>

        {/* Threat Model & Philosophy Section */}
        {currentView !== 'about' && currentView !== 'docs' && (
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
                <ShieldCheck size={16} className="text-[var(--accent)]" />
                <span>Client-Side Guarantees</span>
              </div>
              <p className="text-xs text-[var(--muted)] leading-relaxed">
                Open source and verifiable in DevTools Network tab. Built with React, TypeScript, and Web Workers.
              </p>
            </div>
          </section>
        )}
      </main>

      {/* Global Footer */}
      <footer className="border-t border-[var(--line)] bg-[var(--surface-sunken)] py-8 px-6 mt-16">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6 text-xs text-[var(--muted)]">
          <div className="flex items-center gap-3">
            <OriginalLogo className="w-5 h-5 shrink-0" />
            <span className="font-bold text-[var(--text)]">AIScrubber</span>
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
              onClick={() => setShowFeedback(true)}
              className="hover:text-[var(--text)] cursor-pointer text-[var(--accent)] font-semibold"
            >
              Feedback
            </button>
            <button
              type="button"
              onClick={() => switchView('docs')}
              className="hover:text-[var(--text)] cursor-pointer"
            >
              Docs
            </button>
            <button
              type="button"
              onClick={() => switchView('about')}
              className="hover:text-[var(--text)] cursor-pointer"
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

      {/* Feedback Modal */}
      <FeedbackModal
        isOpen={showFeedback}
        onClose={() => setShowFeedback(false)}
      />

      <Analytics />
    </div>
  );
}

export default App;
