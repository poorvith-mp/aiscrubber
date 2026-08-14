import {
  ArrowRight,
  BookOpen,
  Bot,
  CheckCircle2,
  Code2,
  ExternalLink,
  FileCode2,
  FileSpreadsheet,
  FileText,
  HelpCircle,
  ImageIcon,
  Lock,
  RefreshCw,
  Search,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Terminal,
  Zap,
} from 'lucide-react';
import { useState } from 'react';

export function DocsWorkspace() {
  const [activeSection, setActiveSection] = useState<'overview' | 'text' | 'prompt' | 'metadata' | 'media' | 'security'>('overview');

  return (
    <div className="workspace-panel max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-[var(--line)]">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="badge-emerald">Documentation</span>
            <span className="text-xs text-[var(--muted)] font-mono">
              Guides & Threat Model
            </span>
          </div>
          <h2 className="text-2xl md:text-4xl font-headline font-bold">
            AIScrubber Documentation
          </h2>
          <p className="text-sm text-[var(--muted)] mt-1">
            Learn how each privacy engine operates, how to configure custom rules, and verify client-side guarantees.
          </p>
        </div>
      </div>

      {/* Docs Sub-Nav */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-[var(--line)]">
        {[
          { id: 'overview', label: 'Overview & Architecture', icon: BookOpen },
          { id: 'text', label: 'Text Scrubber', icon: FileCode2 },
          { id: 'prompt', label: 'Prompt Enhancer', icon: Bot },
          { id: 'metadata', label: 'Metadata Desk', icon: FileSpreadsheet },
          { id: 'media', label: 'Visual Redactor', icon: ImageIcon },
          { id: 'security', label: 'Security & Threat Model', icon: ShieldCheck },
        ].map((item) => {
          const Icon = item.icon;
          const active = activeSection === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setActiveSection(item.id as any)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                active
                  ? 'bg-[var(--accent)] text-[var(--accent-ink)] font-bold'
                  : 'bg-[var(--surface-sunken)] text-[var(--muted)] hover:text-[var(--text)] border border-[var(--line)]'
              }`}
            >
              <Icon size={14} />
              {item.label}
            </button>
          );
        })}
      </div>

      {/* SECTION CONTENT */}
      {activeSection === 'overview' && (
        <div className="space-y-6 text-sm text-[var(--muted)] leading-relaxed">
          <h3 className="text-xl font-headline font-bold text-[var(--text)]">
            Privacy Desk Overview
          </h3>
          <p>
            AIScrubber is an offline-capable, browser-local privacy desk. It is engineered to sit between your confidential data (logs, emails, API keys, documents, photos) and third-party AI services, issue trackers, or public channels.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <div className="p-4 rounded-xl bg-[var(--surface-sunken)] border border-[var(--line)] space-y-2">
              <h4 className="font-bold text-sm text-[var(--text)] flex items-center gap-2">
                <Lock size={16} className="text-[var(--accent)]" />
                100% Client-Side Engine
              </h4>
              <p className="text-xs">
                Zero API servers, zero cloud processing. Regex parsing, HTML5 Canvas re-rendering, and binary stream zeroing execute strictly inside your local browser tab.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-[var(--surface-sunken)] border border-[var(--line)] space-y-2">
              <h4 className="font-bold text-sm text-[var(--text)] flex items-center gap-2">
                <Zap size={16} className="text-[var(--accent)]" />
                Reversible Token Mappings
              </h4>
              <p className="text-xs">
                Substitutes repeated identifiers with consistent labels ([EMAIL_1], {'{{API_KEY_1}}'}) and allows exporting encrypted session keys to restore them later.
              </p>
            </div>
          </div>
        </div>
      )}

      {activeSection === 'text' && (
        <div className="space-y-6 text-sm text-[var(--muted)] leading-relaxed">
          <h3 className="text-xl font-headline font-bold text-[var(--text)]">
            Text Scrubber Engine
          </h3>
          <p>
            The Text Scrubber scans input text across 8 built-in detector classes and custom regex/keyword rules. Matches are sorted, deduplicated, and replaced with stable labels.
          </p>

          <div className="p-4 rounded-xl bg-[var(--surface-sunken)] border border-[var(--line)] space-y-3">
            <h4 className="font-bold text-sm text-[var(--text)]">
              Built-In Detector Patterns
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono">
              <div className="p-2 rounded bg-[var(--panel)] border border-[var(--line)]">
                <span className="text-[var(--accent)] font-bold block">Emails</span>
                <span>[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]</span>
              </div>
              <div className="p-2 rounded bg-[var(--panel)] border border-[var(--line)]">
                <span className="text-[var(--accent)] font-bold block">API Secrets</span>
                <span>sk-[A-Za-z0-9_-] | ghp_[A-Za-z0-9]</span>
              </div>
              <div className="p-2 rounded bg-[var(--panel)] border border-[var(--line)]">
                <span className="text-[var(--accent)] font-bold block">IP Addresses</span>
                <span>IPv4 (0-255.0-255...) & IPv6 standard formats</span>
              </div>
              <div className="p-2 rounded bg-[var(--panel)] border border-[var(--line)]">
                <span className="text-[var(--accent)] font-bold block">Payment Cards</span>
                <span>Luhn-length card number patterns (13-19 digits)</span>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="font-bold text-sm text-[var(--text)]">
              Custom Keywords & Regex Rules
            </h4>
            <p className="text-xs">
              Click <strong>Custom Rules</strong> in the Text Scrubber to define proprietary keywords (e.g. internal project names, client names) or specialized regex expressions.
            </p>
          </div>
        </div>
      )}

      {activeSection === 'prompt' && (
        <div className="space-y-6 text-sm text-[var(--muted)] leading-relaxed">
          <h3 className="text-xl font-headline font-bold text-[var(--text)]">
            Prompt Enhancer & Roundtrip Anonymizer
          </h3>
          <p>
            When asking ChatGPT, Claude, or Gemini to write code or debug issues, you often need to share real configuration details. The Prompt Enhancer enables <strong>Zero-Exposure Prompting</strong>:
          </p>

          <ol className="space-y-3 list-decimal pl-5 text-xs text-[var(--muted)]">
            <li>
              <strong className="text-[var(--text)]">Step 1 — Mask & Enhance:</strong> Paste your prompt. AIScrubber detects secrets, endpoints, and customer IDs, replaces them with constants (e.g. <code className="text-[var(--accent)]">{'{{API_SECRET_1}}'}</code>), and applies prompt engineering directives (Coding, Debugging, Analysis).
            </li>
            <li>
              <strong className="text-[var(--text)]">Step 2 — Download Key:</strong> Download the <code className="text-[var(--accent)]">.aiscrub.json</code> session key to your local drive.
            </li>
            <li>
              <strong className="text-[var(--text)]">Step 3 — Query AI:</strong> Copy the masked prompt to ChatGPT or Claude. The AI solves your problem using the placeholder constants.
            </li>
            <li>
              <strong className="text-[var(--text)]">Step 4 — 1-Click Restore:</strong> In Tab 2, paste the AI's response and your session key. AIScrubber reconstructs the original values back into the text instantly.
            </li>
          </ol>
        </div>
      )}

      {activeSection === 'metadata' && (
        <div className="space-y-6 text-sm text-[var(--muted)] leading-relaxed">
          <h3 className="text-xl font-headline font-bold text-[var(--text)]">
            Metadata Desk (Viewer, Editor, Stripper)
          </h3>
          <p>
            Digital files carry hidden telemetry that exposes your hardware serial number, exact latitude/longitude coordinates, software version, and real name.
          </p>

          <div className="space-y-3 text-xs">
            <div className="p-3 rounded-lg bg-[var(--surface-sunken)] border border-[var(--line)]">
              <strong className="text-[var(--text)] block mb-1">JPEG & WebP Images</strong>
              <span>Parses TIFF headers, EXIF sub-IFDs, and GPS IFDs. Stripping re-renders raw pixel buffers on an offscreen canvas and emits a clean, metadata-free JPEG/PNG.</span>
            </div>
            <div className="p-3 rounded-lg bg-[var(--surface-sunken)] border border-[var(--line)]">
              <strong className="text-[var(--text)] block mb-1">PNG Images</strong>
              <span>Detects and strips textual chunks (<code className="text-[var(--accent)]">tEXt</code>, <code className="text-[var(--accent)]">zTXt</code>, <code className="text-[var(--accent)]">iTXt</code>, <code className="text-[var(--accent)]">eXIf</code>).</span>
            </div>
            <div className="p-3 rounded-lg bg-[var(--surface-sunken)] border border-[var(--line)]">
              <strong className="text-[var(--text)] block mb-1">PDF Documents</strong>
              <span>Zeros binary <code className="text-[var(--accent)]">/Info</code> dictionaries (<code className="text-[var(--accent)]">/Author</code>, <code className="text-[var(--accent)]">/Creator</code>, <code className="text-[var(--accent)]">/Producer</code>, <code className="text-[var(--accent)]">/CreationDate</code>).</span>
            </div>
            <div className="p-3 rounded-lg bg-[var(--surface-sunken)] border border-[var(--line)]">
              <strong className="text-[var(--text)] block mb-1">Audio Files</strong>
              <span>Detects and strips ID3v1 and ID3v2 header and footer tags from MP3 and WAV containers.</span>
            </div>
          </div>
        </div>
      )}

      {activeSection === 'media' && (
        <div className="space-y-6 text-sm text-[var(--muted)] leading-relaxed">
          <h3 className="text-xl font-headline font-bold text-[var(--text)]">
            Visual Media Redactor
          </h3>
          <p>
            The Visual Redactor is a canvas-based tool to obscure sensitive regions in screenshots and photos before sharing them publicly.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="p-3 rounded-lg bg-[var(--panel)] border border-[var(--line)]">
              <strong className="text-[var(--text)] block mb-1">Gaussian Blur</strong>
              <span>Smooth optical blur for faces, private chat avatars, and background elements.</span>
            </div>
            <div className="p-3 rounded-lg bg-[var(--panel)] border border-[var(--line)]">
              <strong className="text-[var(--text)] block mb-1">Pixelate (Mosaic)</strong>
              <span>Sub-samples pixel blocks to irreversibly destroy fine details in numbers and text.</span>
            </div>
            <div className="p-3 rounded-lg bg-[var(--panel)] border border-[var(--line)]">
              <strong className="text-[var(--text)] block mb-1">Solid Blackout</strong>
              <span>Fills an opaque #000000 rectangle over credit cards, passwords, or document lines.</span>
            </div>
          </div>
        </div>
      )}

      {activeSection === 'security' && (
        <div className="space-y-6 text-sm text-[var(--muted)] leading-relaxed">
          <h3 className="text-xl font-headline font-bold text-[var(--text)] flex items-center gap-2">
            <ShieldCheck className="text-[var(--accent)]" size={22} />
            Security Model & Privacy Verification
          </h3>
          <p>
            You do not have to trust our word. You can independently verify that your data never leaves your machine:
          </p>

          <div className="p-4 rounded-xl bg-[var(--surface-sunken)] border border-[var(--line)] space-y-3">
            <h4 className="font-bold text-sm text-[var(--text)]">
              How to verify in your browser:
            </h4>
            <ol className="list-decimal pl-5 space-y-1 text-xs">
              <li>Open Chrome / Firefox / Safari Developer Tools (press <kbd className="font-mono bg-[var(--panel)] px-1 rounded">F12</kbd> or <kbd className="font-mono bg-[var(--panel)] px-1 rounded">Cmd+Option+I</kbd>).</li>
              <li>Switch to the <strong>Network</strong> tab.</li>
              <li>Type text, upload an image, or strip a PDF in AIScrubber.</li>
              <li>Observe that zero POST / PUT requests carrying your text or files are initiated.</li>
            </ol>
          </div>

          <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs leading-relaxed space-y-1">
            <strong className="block font-bold">Important Limitation:</strong>
            <p>
              AIScrubber uses deterministic pattern matching. It does not understand conversational context. Always visually review the cleaned output before publishing or sending confidential drafts.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
