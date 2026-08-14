import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Bot,
  Check,
  CheckCircle2,
  ChevronRight,
  Clipboard,
  Code2,
  ExternalLink,
  FileCode2,
  FileSpreadsheet,
  FileText,
  HelpCircle,
  ImageIcon,
  Key,
  Layers,
  Lock,
  RefreshCw,
  Search,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Terminal,
  Zap,
} from 'lucide-react';
import { useMemo, useState } from 'react';

interface DocArticle {
  id: string;
  category: 'getting-started' | 'features' | 'best-practices' | 'use-cases' | 'reference';
  categoryLabel: string;
  title: string;
  description: string;
  headings: { id: string; title: string }[];
  content: React.ReactNode;
}

export function DocsWorkspace() {
  const [activeArticleId, setActiveArticleId] = useState<string>('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedSnippet, setCopiedSnippet] = useState<string | null>(null);

  const copyToClipboard = async (text: string, snippetId: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedSnippet(snippetId);
    setTimeout(() => setCopiedSnippet(null), 1800);
  };

  // Mock data snippets for interactive recipes
  const mockNginxLog = `2026-08-14 10:23:41 [ERROR] 1420#0: *88329 upstream timed out while reading response header from upstream, client: 192.168.1.144, server: api.acme-corp.com, request: "POST /v1/auth/token HTTP/1.1", sub: "CUST-99214", auth_header: "Bearer sk-live-99881122334455667788", user_email: "alex.rivas@acme.com", host: "internal-db.acme.cloud:5432"`;

  const mockDbPrompt = `Help me write a Python SQLAlchemy migration for our billing database.
Database connection: postgresql://admin_user:P@ssw0rd9988@db.prod.internal.acme.com:5432/billing_prod
When user CUST-44912 (email: billing@partner.org) charges over $500, trigger webhook https://hooks.acme.com/alerts/fraud with token ghp_998811223344556677889900aabbccddeeff.`;

  const mockExifDump = `Make: Sony
Camera Model: ILCE-7M4
Software: Adobe Lightroom 13.2 (Macintosh)
DateTimeOriginal: 2026:08:14 14:12:09
Artist: Poorvith M P
GPSLatitude: 12.9716 N
GPSLongitude: 77.5946 E
GPSAltitude: 920m (Bengaluru, India)`;

  const articles: DocArticle[] = useMemo(
    () => [
      {
        id: 'overview',
        category: 'getting-started',
        categoryLabel: 'Getting Started',
        title: 'AIScrubber Overview',
        description:
          'A browser-local identity redaction desk designed for the moment before sensitive text or media travels to AI services or public channels.',
        headings: [
          { id: 'why-aiscrubber', title: 'Why AIScrubber Exists' },
          { id: 'core-architecture', title: 'Client-Side Architecture' },
          { id: 'privacy-guarantee', title: 'Zero Server Telemetry' },
        ],
        content: (
          <div className="space-y-6 text-sm text-[var(--muted)] leading-relaxed">
            <p id="why-aiscrubber">
              AIScrubber is an offline-capable privacy desk engineered to solve a fundamental dilemma: sharing enough context with AI models, collaborators, or issue trackers to solve problems without leaking sensitive secrets, credentials, or personal identifiers.
            </p>

            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 space-y-1">
              <strong className="block text-sm font-bold flex items-center gap-1.5">
                <ShieldCheck size={16} />
                Core Security Guarantee
              </strong>
              <p className="text-xs text-emerald-200/90">
                100% of data processing occurs in local browser memory. Text pattern matching, HTML5 canvas redactions, and binary EXIF stripping never make network requests.
              </p>
            </div>

            <h4 id="core-architecture" className="text-base font-bold text-[var(--text)] pt-2">
              Four Specialized Privacy Engines
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3.5 rounded-xl bg-[var(--surface-sunken)] border border-[var(--line)] space-y-1.5">
                <span className="font-bold text-xs text-[var(--accent)] flex items-center gap-1.5">
                  <FileCode2 size={14} />
                  1. Text Scrubber
                </span>
                <p className="text-xs">
                  Deterministic regex and custom keyword replacement with numbered labels (`[EMAIL_1]`).
                </p>
              </div>
              <div className="p-3.5 rounded-xl bg-[var(--surface-sunken)] border border-[var(--line)] space-y-1.5">
                <span className="font-bold text-xs text-[var(--accent)] flex items-center gap-1.5">
                  <Bot size={14} />
                  2. Prompt Enhancer & Unmasker
                </span>
                <p className="text-xs">
                  Replaces confidential variables with constants (`{'{{API_SECRET_1}}'}`), generates session keys, and restores AI responses in 1 click.
                </p>
              </div>
              <div className="p-3.5 rounded-xl bg-[var(--surface-sunken)] border border-[var(--line)] space-y-1.5">
                <span className="font-bold text-xs text-[var(--accent)] flex items-center gap-1.5">
                  <FileSpreadsheet size={14} />
                  3. Metadata Desk
                </span>
                <p className="text-xs">
                  Client-side EXIF/GPS viewer, in-place tag editor, and 1-click binary stripper for JPEG, PNG, PDF, and MP3 files.
                </p>
              </div>
              <div className="p-3.5 rounded-xl bg-[var(--surface-sunken)] border border-[var(--line)] space-y-1.5">
                <span className="font-bold text-xs text-[var(--accent)] flex items-center gap-1.5">
                  <ImageIcon size={14} />
                  4. Visual Media Redactor
                </span>
                <p className="text-xs">
                  Canvas-based blurring, pixelation, and blackouts for screenshots and images before sharing.
                </p>
              </div>
            </div>

            <h4 id="privacy-guarantee" className="text-base font-bold text-[var(--text)] pt-2">
              Verification in DevTools
            </h4>
            <p>
              Open DevTools (<kbd className="font-mono bg-[var(--panel)] px-1 rounded">F12</kbd>), switch to the <strong>Network</strong> tab, and test any feature. You will see zero outbound telemetry or payload transmissions.
            </p>
          </div>
        ),
      },
      {
        id: 'text-scrubber',
        category: 'features',
        categoryLabel: 'Core Features',
        title: 'Text Scrubber Engine',
        description:
          'Scan and replace sensitive emails, phone numbers, IP addresses, secrets, and custom identifiers with consistent numbered labels.',
        headings: [
          { id: 'built-in-detectors', title: 'Built-in Detectors' },
          { id: 'custom-rules', title: 'Custom Regex & Keyword Rules' },
          { id: 'diff-inspection', title: 'Diff & Inspection Mode' },
          { id: 'dictionary-export', title: 'Dictionary Key Export' },
        ],
        content: (
          <div className="space-y-6 text-sm text-[var(--muted)] leading-relaxed">
            <h4 id="built-in-detectors" className="text-base font-bold text-[var(--text)]">
              Built-in Detection Classes
            </h4>
            <p>
              AIScrubber matches 8 core sensitive categories using high-precision regular expressions:
            </p>
            <div className="border border-[var(--line)] rounded-xl overflow-hidden text-xs font-mono">
              <div className="grid grid-cols-12 bg-[var(--surface-sunken)] p-2.5 font-bold text-[var(--text)] border-b border-[var(--line)]">
                <div className="col-span-3">Category</div>
                <div className="col-span-3">Assigned Token</div>
                <div className="col-span-6">Pattern Definition</div>
              </div>
              <div className="divide-y divide-[var(--line)] bg-[var(--panel)]">
                <div className="grid grid-cols-12 p-2.5 items-center">
                  <div className="col-span-3 font-semibold text-[var(--text)]">Email Addresses</div>
                  <div className="col-span-3 text-[var(--accent)]">[EMAIL_N]</div>
                  <div className="col-span-6 text-[var(--muted)] truncate">RFC-5322 Standard Email Pattern</div>
                </div>
                <div className="grid grid-cols-12 p-2.5 items-center">
                  <div className="col-span-3 font-semibold text-[var(--text)]">API Secrets / Tokens</div>
                  <div className="col-span-3 text-[var(--accent)]">[SECRET_N]</div>
                  <div className="col-span-6 text-[var(--muted)] truncate">sk-*, ghp_*, bearer tokens, JWTs, AWS keys</div>
                </div>
                <div className="grid grid-cols-12 p-2.5 items-center">
                  <div className="col-span-3 font-semibold text-[var(--text)]">IP Addresses</div>
                  <div className="col-span-3 text-[var(--accent)]">[IP_N]</div>
                  <div className="col-span-6 text-[var(--muted)] truncate">IPv4 (0-255.0-255.0-255.0-255) & IPv6</div>
                </div>
                <div className="grid grid-cols-12 p-2.5 items-center">
                  <div className="col-span-3 font-semibold text-[var(--text)]">Payment Cards</div>
                  <div className="col-span-3 text-[var(--accent)]">[CARD_N]</div>
                  <div className="col-span-6 text-[var(--muted)] truncate">Visa, Mastercard, Amex (13-19 digits)</div>
                </div>
                <div className="grid grid-cols-12 p-2.5 items-center">
                  <div className="col-span-3 font-semibold text-[var(--text)]">System & Customer IDs</div>
                  <div className="col-span-3 text-[var(--accent)]">[ID_N]</div>
                  <div className="col-span-6 text-[var(--muted)] truncate">CUST-*, USER-*, ORDER-*, ACCOUNT-*</div>
                </div>
              </div>
            </div>

            <h4 id="custom-rules" className="text-base font-bold text-[var(--text)] pt-2">
              Custom Keyword & Regex Rules
            </h4>
            <p>
              Click <strong>Custom Rules</strong> to add proprietary terms (e.g. project code-names, internal server hosts) or write custom regex patterns. Custom tokens take format `[TOKEN_N]`.
            </p>

            <h4 id="diff-inspection" className="text-base font-bold text-[var(--text)] pt-2">
              Diff Inspector
            </h4>
            <p>
              Toggle <strong>Inspect Diff</strong> to view inline highlighted badges over replaced tokens with hover tooltips showing original values and detector provenance.
            </p>
          </div>
        ),
      },
      {
        id: 'prompt-enhancer',
        category: 'features',
        categoryLabel: 'Core Features',
        title: 'Prompt Enhancer & Roundtrip Anonymizer',
        description:
          'Zero-Exposure Prompting: Mask secrets with constants before querying AI, download a session key, and reconstruct the AI response in 1 click.',
        headings: [
          { id: 'the-roundtrip-flow', title: 'The 4-Step Roundtrip' },
          { id: 'enhancement-profiles', title: 'Enhancement Profiles' },
          { id: 'unmasking-reconstruction', title: '1-Click Reconstruction' },
        ],
        content: (
          <div className="space-y-6 text-sm text-[var(--muted)] leading-relaxed">
            <h4 id="the-roundtrip-flow" className="text-base font-bold text-[var(--text)]">
              The 4-Step Zero-Exposure Workflow
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-[var(--surface-sunken)] border border-[var(--line)] space-y-1">
                <span className="font-bold text-[var(--text)] block">Step 1: Paste & Mask</span>
                <span>Type your raw prompt. Secrets and endpoints are replaced with `{'{{API_SECRET_1}}'}`.</span>
              </div>
              <div className="p-3 rounded-xl bg-[var(--surface-sunken)] border border-[var(--line)] space-y-1">
                <span className="font-bold text-[var(--text)] block">Step 2: Download Key</span>
                <span>Click "Download Key (.aiscrub)" to save your local mapping key.</span>
              </div>
              <div className="p-3 rounded-xl bg-[var(--surface-sunken)] border border-[var(--line)] space-y-1">
                <span className="font-bold text-[var(--text)] block">Step 3: Query AI</span>
                <span>Send the masked prompt to ChatGPT or Claude. The AI solves the task using placeholder constants.</span>
              </div>
              <div className="p-3 rounded-xl bg-[var(--surface-sunken)] border border-[var(--line)] space-y-1">
                <span className="font-bold text-[var(--text)] block">Step 4: Restore</span>
                <span>Paste the AI's response in Tab 2 + your key. Original values are reconstructed automatically.</span>
              </div>
            </div>

            <h4 id="enhancement-profiles" className="text-base font-bold text-[var(--text)] pt-2">
              Available Enhancement Directives
            </h4>
            <ul className="list-disc pl-5 space-y-1 text-xs">
              <li><strong>Coding & Architecture:</strong> Adds constraints to preserve placeholder variables, include error handling, and output complete code.</li>
              <li><strong>Debugging & Fixes:</strong> Directs AI to provide root cause analysis and minimal code patches.</li>
              <li><strong>Data & Analysis:</strong> Requests structured executive summaries and risk ratings.</li>
              <li><strong>Drafting & Voice:</strong> Directs authentic, direct prose without AI filler buzzwords.</li>
            </ul>
          </div>
        ),
      },
      {
        id: 'metadata-desk',
        category: 'features',
        categoryLabel: 'Core Features',
        title: 'Metadata Desk: Viewer, Editor & Stripper',
        description:
          'Deep client-side inspection and 1-click sanitization of EXIF, GPS coordinates, PDF author streams, and audio ID3 tags.',
        headings: [
          { id: 'supported-formats', title: 'Supported Formats' },
          { id: 'gps-threat-model', title: 'GPS Location Risks' },
          { id: '1-click-stripper', title: '1-Click Stripper Mechanics' },
        ],
        content: (
          <div className="space-y-6 text-sm text-[var(--muted)] leading-relaxed">
            <h4 id="supported-formats" className="text-base font-bold text-[var(--text)]">
              Supported File Types
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
              <div className="p-3 rounded-lg bg-[var(--surface-sunken)] border border-[var(--line)]">
                <strong className="block text-[var(--text)] font-semibold mb-1">Images</strong>
                <span>JPEG (EXIF/GPS/IPTC), PNG (chunks), WebP, SVG</span>
              </div>
              <div className="p-3 rounded-lg bg-[var(--surface-sunken)] border border-[var(--line)]">
                <strong className="block text-[var(--text)] font-semibold mb-1">Documents</strong>
                <span>PDF (/Info dictionaries & /Metadata streams)</span>
              </div>
              <div className="p-3 rounded-lg bg-[var(--surface-sunken)] border border-[var(--line)]">
                <strong className="block text-[var(--text)] font-semibold mb-1">Audio & Media</strong>
                <span>MP3 & WAV (ID3v1 & ID3v2 containers)</span>
              </div>
            </div>

            <h4 id="gps-threat-model" className="text-base font-bold text-[var(--text)] pt-2">
              GPS Location Vulnerability
            </h4>
            <p>
              Smartphones embed exact latitude, longitude, and altitude in image EXIF tags. AIScrubber detects these coordinates and warns you with direct Google Maps preview links before you share photos.
            </p>

            <h4 id="1-click-stripper" className="text-base font-bold text-[var(--text)] pt-2">
              How 1-Click Stripping Works
            </h4>
            <p>
              For images, the stripper draws pixel buffers onto an offscreen canvas and emits a clean, re-encoded binary without APP1/EXIF segments. For PDFs and audio, binary dictionaries and ID3 headers are zeroed in memory.
            </p>
          </div>
        ),
      },
      {
        id: 'use-case-recipes',
        category: 'use-cases',
        categoryLabel: 'Use Cases & Recipes',
        title: 'Real-World Recipes (with Live Mock Data)',
        description:
          'Practical step-by-step guides with live mock datasets for log scrubbing, AI prompt masking, and EXIF sanitization.',
        headings: [
          { id: 'recipe-nginx', title: 'Recipe 1: Public Issue Log Scrubbing' },
          { id: 'recipe-ai-db', title: 'Recipe 2: AI Database Migration Prompt' },
          { id: 'recipe-photo-exif', title: 'Recipe 3: Photo GPS & Camera Stripping' },
        ],
        content: (
          <div className="space-y-8 text-sm text-[var(--muted)] leading-relaxed">
            {/* RECIPE 1 */}
            <div id="recipe-nginx" className="p-5 rounded-2xl bg-[var(--panel)] border border-[var(--line)] space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <span className="badge-emerald">Recipe 1</span>
                <span className="text-xs font-mono text-[var(--muted)]">Log Sanitization</span>
              </div>
              <h4 className="text-base font-bold text-[var(--text)] font-headline">
                Scrubbing Production Nginx Logs for Public GitHub Issues
              </h4>
              <p className="text-xs">
                When filing an issue for an open-source library, logs often contain internal IP addresses, Bearer tokens, and user emails.
              </p>

              {/* Mock Code Block */}
              <div className="relative rounded-xl bg-[var(--surface-sunken)] border border-[var(--line)] p-4 font-mono text-xs overflow-x-auto">
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-[var(--line)] text-[var(--muted)]">
                  <span>Mock Raw Log Input</span>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(mockNginxLog, 'nginx')}
                    className="text-xs text-[var(--accent)] hover:underline flex items-center gap-1 font-sans font-bold"
                  >
                    {copiedSnippet === 'nginx' ? <Check size={13} /> : <Clipboard size={13} />}
                    {copiedSnippet === 'nginx' ? 'Copied' : 'Copy Mock Log'}
                  </button>
                </div>
                <pre className="text-[var(--text)] whitespace-pre-wrap">{mockNginxLog}</pre>
              </div>

              <div className="p-3 rounded-lg bg-[var(--accent-tint)] border border-[var(--accent)] text-xs space-y-1">
                <strong className="text-[var(--text)] block font-bold">Scrubbed Result in AIScrubber:</strong>
                <p className="font-mono text-[var(--accent)]">
                  ... client: [IP_1], server: api.acme-corp.com, ... sub: [ID_1], auth_header: [SECRET_1], user_email: [EMAIL_1] ...
                </p>
              </div>
            </div>

            {/* RECIPE 2 */}
            <div id="recipe-ai-db" className="p-5 rounded-2xl bg-[var(--panel)] border border-[var(--line)] space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <span className="badge-emerald">Recipe 2</span>
                <span className="text-xs font-mono text-[var(--muted)]">Zero-Exposure Prompting</span>
              </div>
              <h4 className="text-base font-bold text-[var(--text)] font-headline">
                Safely Generating Database Migrations with AI
              </h4>
              <p className="text-xs">
                Ask ChatGPT or Claude to write complex SQL/Python migrations without giving away your database host or passwords.
              </p>

              <div className="relative rounded-xl bg-[var(--surface-sunken)] border border-[var(--line)] p-4 font-mono text-xs overflow-x-auto">
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-[var(--line)] text-[var(--muted)]">
                  <span>Mock Database Prompt</span>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(mockDbPrompt, 'db')}
                    className="text-xs text-[var(--accent)] hover:underline flex items-center gap-1 font-sans font-bold"
                  >
                    {copiedSnippet === 'db' ? <Check size={13} /> : <Clipboard size={13} />}
                    {copiedSnippet === 'db' ? 'Copied' : 'Copy Mock Prompt'}
                  </button>
                </div>
                <pre className="text-[var(--text)] whitespace-pre-wrap">{mockDbPrompt}</pre>
              </div>

              <div className="p-3 rounded-lg bg-[var(--surface-sunken)] border border-[var(--line)] text-xs space-y-1">
                <strong className="text-[var(--text)] block font-bold">Workflow:</strong>
                <p>1. Paste mock prompt in <strong>Prompt Enhancer</strong> → 2. Download <code className="text-[var(--accent)]">.aiscrub.json</code> key → 3. Query LLM → 4. Paste response in Tab 2 to unmask!</p>
              </div>
            </div>

            {/* RECIPE 3 */}
            <div id="recipe-photo-exif" className="p-5 rounded-2xl bg-[var(--panel)] border border-[var(--line)] space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <span className="badge-emerald">Recipe 3</span>
                <span className="text-xs font-mono text-[var(--muted)]">EXIF Sanitization</span>
              </div>
              <h4 className="text-base font-bold text-[var(--text)] font-headline">
                Wiping GPS Telemetry Before Uploading Photos
              </h4>
              <p className="text-xs">
                Smartphone and DSLR photos contain precise GPS coordinates and serial numbers that expose where and when a photo was captured.
              </p>

              <div className="relative rounded-xl bg-[var(--surface-sunken)] border border-[var(--line)] p-4 font-mono text-xs overflow-x-auto">
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-[var(--line)] text-[var(--muted)]">
                  <span>Simulated EXIF Header Dump</span>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(mockExifDump, 'exif')}
                    className="text-xs text-[var(--accent)] hover:underline flex items-center gap-1 font-sans font-bold"
                  >
                    {copiedSnippet === 'exif' ? <Check size={13} /> : <Clipboard size={13} />}
                    {copiedSnippet === 'exif' ? 'Copied' : 'Copy EXIF Spec'}
                  </button>
                </div>
                <pre className="text-[var(--text)] whitespace-pre-wrap">{mockExifDump}</pre>
              </div>

              <p className="text-xs">
                Drop the file into <strong>Metadata Desk</strong> and select <strong>1-Click Stripper</strong> to produce a 100% sanitized copy with zero location data.
              </p>
            </div>
          </div>
        ),
      },
      {
        id: 'best-practices',
        category: 'best-practices',
        categoryLabel: 'Best Practices',
        title: 'Security Best Practices & Threat Model',
        description:
          'Guidelines for high-security environments, pre-publishing verification checklists, and handling false positives.',
        headings: [
          { id: 'pre-publish-checklist', title: 'Pre-Publishing Checklist' },
          { id: 'pattern-limits', title: 'Understanding Pattern Limits' },
          { id: 'custom-regex-tips', title: 'Optimizing Custom Regex' },
        ],
        content: (
          <div className="space-y-6 text-sm text-[var(--muted)] leading-relaxed">
            <h4 id="pre-publish-checklist" className="text-base font-bold text-[var(--text)]">
              Pre-Publishing Verification Checklist
            </h4>
            <div className="space-y-2 text-xs">
              <label className="flex items-start gap-2.5 p-2.5 rounded-lg bg-[var(--surface-sunken)] border border-[var(--line)]">
                <input type="checkbox" defaultChecked className="mt-0.5" />
                <span>Verify that all API keys, Bearer tokens, and passwords have been replaced by assigned tokens.</span>
              </label>
              <label className="flex items-start gap-2.5 p-2.5 rounded-lg bg-[var(--surface-sunken)] border border-[var(--line)]">
                <input type="checkbox" defaultChecked className="mt-0.5" />
                <span>Check for proprietary project code-names and add them as custom keyword rules if missed.</span>
              </label>
              <label className="flex items-start gap-2.5 p-2.5 rounded-lg bg-[var(--surface-sunken)] border border-[var(--line)]">
                <input type="checkbox" defaultChecked className="mt-0.5" />
                <span>For images and screenshots, ensure faces and private browser tabs are blurred or blacked out.</span>
              </label>
              <label className="flex items-start gap-2.5 p-2.5 rounded-lg bg-[var(--surface-sunken)] border border-[var(--line)]">
                <input type="checkbox" defaultChecked className="mt-0.5" />
                <span>Save your <code className="text-[var(--accent)]">.aiscrub.json</code> session key in a secure local folder if you plan to unmask an AI response.</span>
              </label>
            </div>

            <h4 id="pattern-limits" className="text-base font-bold text-[var(--text)] pt-2">
              Understanding Pattern-Matching Limits
            </h4>
            <p>
              AIScrubber utilizes deterministic pattern matching, not generative AI contextual understanding. This guarantees zero latency and 100% offline privacy, but means human visual review remains essential for nuanced sensitive contexts.
            </p>
          </div>
        ),
      },
    ],
    [copiedSnippet]
  );

  const activeArticle = useMemo(
    () => articles.find((a) => a.id === activeArticleId) || articles[0],
    [articles, activeArticleId]
  );

  const filteredArticles = useMemo(() => {
    if (!searchQuery.trim()) return articles;
    const q = searchQuery.toLowerCase();
    return articles.filter(
      (a) =>
        a.title.toLowerCase().includes(q) ||
        a.description.toLowerCase().includes(q) ||
        a.categoryLabel.toLowerCase().includes(q)
    );
  }, [articles, searchQuery]);

  const currentIndex = articles.findIndex((a) => a.id === activeArticle.id);
  const prevArticle = currentIndex > 0 ? articles[currentIndex - 1] : null;
  const nextArticle = currentIndex < articles.length - 1 ? articles[currentIndex + 1] : null;

  return (
    <div className="workspace-panel p-0 overflow-hidden border border-[var(--line)]">
      {/* Top Docs Sub-Header & Search Bar (Claude Code Style) */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 sm:px-6 bg-[var(--surface-sunken)] border-b border-[var(--line)]">
        <div className="flex items-center gap-2 text-xs text-[var(--muted)] font-mono">
          <span>Docs</span>
          <ChevronRight size={13} />
          <span className="text-[var(--text)] font-bold">{activeArticle.categoryLabel}</span>
          <ChevronRight size={13} />
          <span className="text-[var(--accent)]">{activeArticle.title}</span>
        </div>

        {/* Live Filter Search Bar */}
        <div className="relative w-full sm:w-72">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]" />
          <input
            type="text"
            placeholder="Search docs & recipes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-[var(--panel)] border border-[var(--line)] text-xs text-[var(--text)] outline-none focus:border-[var(--accent)] transition-colors font-mono"
          />
        </div>
      </div>

      {/* 3-Column Docs Layout: Left Nav, Center Article, Right TOC */}
      <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[650px]">
        {/* LEFT SIDEBAR: Topic Tree */}
        <nav className="lg:col-span-3 border-r border-[var(--line)] bg-[var(--surface-sunken)] p-4 space-y-6">
          <div className="space-y-4">
            {(
              [
                { cat: 'getting-started', label: 'Getting Started' },
                { cat: 'features', label: 'Core Engines' },
                { cat: 'use-cases', label: 'Use Cases & Recipes' },
                { cat: 'best-practices', label: 'Best Practices' },
              ] as const
            ).map((group) => {
              const groupArticles = filteredArticles.filter((a) => a.category === group.cat);
              if (groupArticles.length === 0) return null;
              return (
                <div key={group.cat} className="space-y-1.5">
                  <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-[var(--muted)] block px-2">
                    {group.label}
                  </span>
                  <div className="space-y-0.5">
                    {groupArticles.map((art) => {
                      const isActive = activeArticle.id === art.id;
                      return (
                        <button
                          key={art.id}
                          type="button"
                          onClick={() => setActiveArticleId(art.id)}
                          className={`w-full text-left px-3 py-2 rounded-lg text-xs font-semibold transition-all flex items-center justify-between ${
                            isActive
                              ? 'bg-[var(--accent)] text-[var(--accent-ink)] font-bold shadow-sm'
                              : 'text-[var(--muted)] hover:text-[var(--text)] hover:bg-[var(--panel)]'
                          }`}
                        >
                          <span className="truncate">{art.title}</span>
                          {isActive && <ChevronRight size={13} />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </nav>

        {/* CENTER COLUMN: Article Content */}
        <main className="lg:col-span-6 p-6 sm:p-8 space-y-8 bg-[var(--panel)]">
          {/* Article Header */}
          <div className="space-y-2 border-b border-[var(--line)] pb-6">
            <span className="badge-emerald">{activeArticle.categoryLabel}</span>
            <h1 className="text-2xl sm:text-3xl font-headline font-bold text-[var(--text)] tracking-tight">
              {activeArticle.title}
            </h1>
            <p className="text-sm text-[var(--muted)] leading-relaxed">
              {activeArticle.description}
            </p>
          </div>

          {/* Article Body */}
          <div className="prose-content">{activeArticle.content}</div>

          {/* Prev / Next Page Navigation Cards */}
          <div className="pt-8 border-t border-[var(--line)] grid grid-cols-1 sm:grid-cols-2 gap-4">
            {prevArticle ? (
              <button
                type="button"
                onClick={() => setActiveArticleId(prevArticle.id)}
                className="p-3.5 rounded-xl bg-[var(--surface-sunken)] border border-[var(--line)] text-left hover:border-[var(--accent)] transition-all group"
              >
                <span className="text-[10px] font-mono text-[var(--muted)] flex items-center gap-1 mb-1">
                  <ArrowLeft size={11} className="group-hover:-translate-x-0.5 transition-transform" />
                  Previous
                </span>
                <span className="text-xs font-bold text-[var(--text)] block truncate">
                  {prevArticle.title}
                </span>
              </button>
            ) : (
              <div />
            )}

            {nextArticle && (
              <button
                type="button"
                onClick={() => setActiveArticleId(nextArticle.id)}
                className="p-3.5 rounded-xl bg-[var(--surface-sunken)] border border-[var(--line)] text-right hover:border-[var(--accent)] transition-all group sm:col-start-2"
              >
                <span className="text-[10px] font-mono text-[var(--muted)] flex items-center justify-end gap-1 mb-1">
                  Next
                  <ArrowRight size={11} className="group-hover:translate-x-0.5 transition-transform" />
                </span>
                <span className="text-xs font-bold text-[var(--text)] block truncate">
                  {nextArticle.title}
                </span>
              </button>
            )}
          </div>
        </main>

        {/* RIGHT SIDEBAR: Table of Contents ("On this page") */}
        <aside className="hidden lg:block lg:col-span-3 border-l border-[var(--line)] bg-[var(--surface-sunken)] p-6 space-y-4">
          <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-[var(--muted)] block">
            On this page
          </span>

          <nav className="space-y-2">
            {activeArticle.headings.map((h) => (
              <a
                key={h.id}
                href={`#${h.id}`}
                className="block text-xs text-[var(--muted)] hover:text-[var(--accent)] transition-colors leading-snug truncate"
              >
                {h.title}
              </a>
            ))}
          </nav>

          <div className="pt-6 border-t border-[var(--line)] space-y-2">
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-[var(--muted)] block">
              Quick Resources
            </span>
            <a
              href="https://github.com/prvthmpcypher/aiscrubber"
              target="_blank"
              rel="noreferrer"
              className="text-xs text-[var(--muted)] hover:text-[var(--text)] flex items-center gap-1.5"
            >
              <Code2 size={13} />
              GitHub Source Code
            </a>
            <a
              href="https://poorvithmp.com"
              target="_blank"
              rel="noreferrer"
              className="text-xs text-[var(--muted)] hover:text-[var(--text)] flex items-center gap-1.5"
            >
              <ExternalLink size={13} />
              Poorvith's Portfolio
            </a>
          </div>
        </aside>
      </div>
    </div>
  );
}
