import { Analytics } from '@vercel/analytics/react';
import {
  ArrowRight,
  BookOpen,
  Bot,
  Check,
  ChevronRight,
  ExternalLink,
  FileCode2,
  FileSpreadsheet,
  Heart,
  Home,
  ImageIcon,
  Lock,
  Menu,
  MessageSquarePlus,
  Moon,
  Scale,
  Shield,
  ShieldCheck,
  Sparkles,
  Star,
  Sun,
  User,
  X,
  Zap,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { AboutWorkspace } from './components/AboutWorkspace';
import { DocsWorkspace } from './components/DocsWorkspace';
import { FeedbackModal } from './components/FeedbackModal';
import { HomeWorkspace } from './components/HomeWorkspace';
import { LegalWorkspace } from './components/LegalWorkspace';
import { MediaRedactorWorkspace } from './components/MediaRedactorWorkspace';
import { MetadataWorkspace } from './components/MetadataWorkspace';
import { PageLoader } from './components/PageLoader';
import { PromptEnhancerWorkspace } from './components/PromptEnhancerWorkspace';
import { ScrubberWorkspace } from './components/ScrubberWorkspace';
import { WatermarkWorkspace } from './components/WatermarkWorkspace';

export type ToolView =
  | 'home'
  | 'scrub'
  | 'prompt'
  | 'watermark'
  | 'metadata'
  | 'media'
  | 'docs'
  | 'legal'
  | 'about';

interface NavItem {
  id: ToolView;
  label: string;
  category?: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  shortcut?: string;
}

const NAV_ITEMS: NavItem[] = [
  { id: 'home', label: 'Home Landing', icon: Home, shortcut: 'H' },
  { id: 'scrub', label: 'Text Scrubber', category: 'Engine 1', icon: FileCode2, shortcut: '1' },
  { id: 'prompt', label: 'Prompt Masker', category: 'Engine 2', icon: Bot, shortcut: '2' },
  { id: 'watermark', label: 'AI Watermark Remover', category: 'Engine 3', icon: Sparkles, shortcut: '3' },
  { id: 'metadata', label: 'Metadata & C2PA Desk', category: 'Engine 4', icon: FileSpreadsheet, shortcut: '4' },
  { id: 'media', label: 'Visual Media Redactor', category: 'Engine 5', icon: ImageIcon, shortcut: '5' },
  { id: 'docs', label: 'Documentation & CLI', icon: BookOpen, shortcut: 'D' },
  { id: 'legal', label: 'Privacy & Terms', icon: Scale, shortcut: 'L' },
  { id: 'about', label: 'About & Founder', icon: User, shortcut: 'A' },
];

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
  // Light mode default
  const [light, setLight] = useState<boolean>(() => {
    const saved = localStorage.getItem('theme');
    if (saved) return saved === 'light';
    return true;
  });

  const [currentView, setCurrentView] = useState<ToolView>('home');
  const [isSwitching, setIsSwitching] = useState<boolean>(false);
  const [starCount, setStarCount] = useState<number | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Sync theme
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', light ? 'light' : 'dark');
    localStorage.setItem('theme', light ? 'light' : 'dark');
  }, [light]);

  // Fetch live GitHub Stars
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
      } catch (err) {
        console.warn('Could not fetch live stars', err);
      }
    }
    fetchStars();
  }, []);

  // Sync hash routing
  useEffect(() => {
    function handleHashChange() {
      const hash = window.location.hash.replace('#', '') as ToolView;
      if (
        [
          'home',
          'scrub',
          'prompt',
          'watermark',
          'metadata',
          'media',
          'docs',
          'legal',
          'about',
        ].includes(hash)
      ) {
        setCurrentView(hash);
      }
    }

    if (window.location.hash) {
      handleHashChange();
    }
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  function switchView(view: ToolView) {
    if (view === currentView) return;
    setIsSwitching(true);
    setCurrentView(view);
    setMobileMenuOpen(false);
    window.location.hash = view;
    window.scrollTo({ top: 0, behavior: 'smooth' });

    setTimeout(() => {
      setIsSwitching(false);
    }, 150);
  }

  return (
    <div className="min-h-screen flex flex-col bg-[var(--bg)] text-[var(--text)] transition-colors duration-200 selection:bg-[var(--accent)] selection:text-[var(--accent-ink)]">
      {/* LEFT FLOATING VERTICAL NAVIGATION DOCK (Desktop & Tablet md+) */}
      <aside
        aria-label="Workspace Navigation"
        className="hidden md:flex fixed left-4 top-1/2 -translate-y-1/2 z-40 flex-col items-center gap-1.5 p-2 rounded-2xl bg-[var(--panel)] border border-[var(--line)] shadow-2xl backdrop-blur-xl transition-all duration-300"
      >
        {NAV_ITEMS.map((item, idx) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;
          const isDivider = idx === 6; // Divider before Docs/Legal/About

          return (
            <div key={item.id} className="w-full flex flex-col items-center">
              {isDivider && (
                <div className="w-6 h-px bg-[var(--line)] my-1.5" />
              )}
              <div className="group relative flex items-center justify-center">
                <button
                  type="button"
                  onClick={() => switchView(item.id)}
                  aria-label={item.label}
                  className={`w-11 h-11 rounded-xl flex items-center justify-center transition-all duration-200 relative ${
                    isActive
                      ? 'bg-[var(--accent)] text-[var(--accent-ink)] shadow-md font-bold scale-105'
                      : 'text-[var(--muted)] hover:text-[var(--text)] hover:bg-[var(--surface-sunken)]'
                  }`}
                >
                  <Icon size={19} />
                  {isActive && (
                    <span className="absolute -left-1 top-1/2 -translate-y-1/2 w-1 h-4 bg-[var(--accent)] rounded-r-full" />
                  )}
                </button>

                {/* Floating Tooltip to the Right */}
                <div className="absolute left-14 px-3 py-1.5 rounded-xl bg-[var(--text)] text-[var(--bg)] text-xs font-bold whitespace-nowrap opacity-0 pointer-events-none translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200 shadow-xl z-50 flex items-center gap-2">
                  <span>{item.label}</span>
                  {item.category && (
                    <span className="text-[10px] opacity-75 font-mono">
                      · {item.category}
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </aside>

      {/* Top Header */}
      <header className="site-header">
        <div className="flex items-center gap-4">
          {/* Logo & Product Identity */}
          <button
            type="button"
            onClick={() => switchView('home')}
            className="flex items-center gap-3 bg-transparent border-0 cursor-pointer p-0 text-left group"
          >
            <OriginalLogo className="w-8 h-8 group-hover:scale-105 transition-transform" />
            <div className="flex flex-col">
              <span className="font-headline font-bold text-lg tracking-tight leading-none text-[var(--text)]">
                AIScrubber
              </span>
              <span className="font-mono text-[10px] text-[var(--accent)] font-semibold tracking-wider uppercase">
                Privacy & Redaction Suite
              </span>
            </div>
          </button>
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

          {/* Mobile Hamburger Menu Toggle (md:hidden) */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen((val) => !val)}
            className="md:hidden p-2 rounded-xl bg-[var(--surface-sunken)] border border-[var(--line)] text-[var(--text)] hover:border-[var(--accent)] transition-all"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </header>

      {/* MOBILE COLLAPSIBLE DRAWER (md:hidden) */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 top-[68px] z-50 bg-black/60 backdrop-blur-md flex flex-col justify-start">
          <div className="bg-[var(--panel)] border-b border-[var(--line)] p-5 space-y-4 shadow-2xl max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--line)]">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-[var(--muted)]">
                Select Workspace
              </span>
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                className="text-xs text-[var(--muted)] hover:text-[var(--text)] font-mono"
              >
                Close ✕
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                const isActive = currentView === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => switchView(item.id)}
                    className={`p-3 rounded-xl flex items-center gap-3 transition-all text-left ${
                      isActive
                        ? 'bg-[var(--accent)] text-[var(--accent-ink)] font-bold shadow-md'
                        : 'bg-[var(--surface-sunken)] text-[var(--text)] hover:border-[var(--accent)] border border-[var(--line)]'
                    }`}
                  >
                    <div className={`p-2 rounded-lg ${isActive ? 'bg-black/10' : 'bg-[var(--panel)] text-[var(--accent)]'}`}>
                      <Icon size={18} />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-xs font-bold">{item.label}</span>
                      {item.category && (
                        <span className={`text-[10px] font-mono ${isActive ? 'opacity-80' : 'text-[var(--muted)]'}`}>
                          {item.category}
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Main App Container (Optimized with left padding for desktop vertical dock) */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 md:pl-24 lg:pl-28 py-8 flex-1 w-full space-y-12">
        <section id="workspace" className="transition-all duration-300">
          {isSwitching ? (
            <PageLoader text={`Opening ${currentView.toUpperCase()} Workspace...`} />
          ) : (
            <>
              {currentView === 'home' && <HomeWorkspace onSelectTool={switchView} />}
              {currentView === 'scrub' && <ScrubberWorkspace />}
              {currentView === 'prompt' && <PromptEnhancerWorkspace />}
              {currentView === 'watermark' && <WatermarkWorkspace />}
              {currentView === 'metadata' && <MetadataWorkspace />}
              {currentView === 'media' && <MediaRedactorWorkspace />}
              {currentView === 'docs' && <DocsWorkspace />}
              {currentView === 'legal' && <LegalWorkspace />}
              {currentView === 'about' && <AboutWorkspace />}
            </>
          )}
        </section>
      </main>

      {/* Global Footer */}
      <footer className="border-t border-[var(--line)] bg-[var(--surface-sunken)] py-8 px-6 md:pl-24 lg:pl-28 mt-16">
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

          <div className="flex items-center gap-4 flex-wrap justify-center sm:justify-end">
            <button
              type="button"
              onClick={() => switchView('home')}
              className="hover:text-[var(--text)] cursor-pointer"
            >
              Home
            </button>
            <button
              type="button"
              onClick={() => switchView('watermark')}
              className="hover:text-[var(--text)] cursor-pointer"
            >
              AI Watermarks
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
              onClick={() => switchView('legal')}
              className="hover:text-[var(--text)] cursor-pointer"
            >
              Privacy & Terms
            </button>
            <button
              type="button"
              onClick={() => switchView('about')}
              className="hover:text-[var(--text)] cursor-pointer"
            >
              About
            </button>
            <button
              type="button"
              onClick={() => setShowFeedback(true)}
              className="hover:text-[var(--text)] cursor-pointer text-[var(--accent)] font-semibold"
            >
              Feedback
            </button>
            <a
              href="https://github.com/prvthmpcypher/aiscrubber"
              target="_blank"
              rel="noreferrer"
              className="hover:text-[var(--text)]"
            >
              GitHub
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
