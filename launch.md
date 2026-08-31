> **SUPERSEDED — 2026-08-24.** This file described a cold launch on 2026-09-01 with no pre-launch phase.
> That has been replaced by a three-week pre-launch, launch, post-launch cycle. The current AIScrubber
> campaign lives at [`launch/aiscrubber.md`](../../launch/aiscrubber.md), and the portfolio-wide
> calendar at [`launch/launch.md`](../../launch/launch.md).
> Kept below for reference. The Show HN and Product Hunt copy here has been rewritten in the new file.

# launch.md — AIScrubber Go-To-Market

> **Version:** 1.1.0 | **Launch Date:** 2026-09-01 | **Author:** Poorvith M P
> **Product:** [aiscrubber.poorvithmp.com](https://aiscrubber.poorvithmp.com) | **npm:** `aiscrubber` v2.3.0 | **GitHub:** `poorvith-mp/aiscrubber`
> **Voice:** `skills/poorvith-voice/` — confident, sourced, zero AI tells, personal stake

---

## 0. Launch Overview

**North Star Metric:** GitHub stars + npm weekly installs (30-day target)

**Format:** 4-week post-launch content blitz. 2 posts per week per platform. Each post ships with a corresponding visual asset (image, GIF, video, or SVG). No pre-launch teasers — launch cold on Sep 1 and sustain.

**Platforms:**
- **X (Twitter)** — developer audience, privacy-conscious builders, AI practitioners
- **Hacker News** — technical audience, local-first and open-source appetite
- **Product Hunt** — product discovery, broader dev-adjacent audience

**Budget:** $0. Purely organic. No paid promotion.

**X Post Structure:** Every X post ships as a two-part thread. Tweet 1 is the info thread — the hook, the substance, the data. Tweet 2 is the CTA — the link, the ask, the install command. Never mix them. The info tweet earns the attention. The CTA tweet converts it.

**LinkedIn Post Structure:** The post body is theory and value — no links, no self-promotion in the main text. First comment (posted immediately after) carries the link, the install command, and an explicit repost ask. LinkedIn's algorithm deprioritizes posts with links in the body. The comment bypasses that.

**Content Pillars (one engine per week, plus launch and CLI/MCP):**

| Week | Dates | Focus | Posts per Platform |
|------|-------|-------|--------------------|
| 1 | Sep 1–7 | Launch + Text Scrubber | 2 |
| 2 | Sep 8–14 | Prompt Masker + AI Watermark Remover | 2 |
| 3 | Sep 15–21 | Metadata/C2PA Desk + Media Redactor | 2 |
| 4 | Sep 22–28 | CLI + MCP Server + Wrap / What's Next | 2 |

**Thesis line (anchor for all copy):** "I build tools that catch problems before they get expensive."

---

## 1. Product Hunt Launch Post

**Tagline:** Privacy desk for the AI age — scrub secrets, strip watermarks, kill metadata. All in your browser.

**Description:**
AIScrubber is a browser-local privacy desk, developer CLI, and MCP server. Five engines that sanitize your data before it touches ChatGPT, Claude, GitHub Issues, or email threads. Every byte stays in your browser's RAM — zero server uploads, zero telemetry on user content.

What it catches:
- API keys across 15+ provider formats (OpenAI, AWS, Stripe, GitHub, Slack, JWT, PEM)
- Emails, phones, payment cards (Luhn-validated), Aadhaar/PAN (Verhoeff-validated), SSNs, IPs, URLs
- Invisible AI watermarks — zero-width characters, Tag-Plane steganography, variation selectors, homoglyph swaps
- EXIF GPS coordinates, C2PA Content Credentials from ChatGPT/DALL-E/Firefly/Imagen
- Visual PII in screenshots via blur, pixelate, and blackout tools

Three surfaces, one logic core: web app, `npx aiscrubber` CLI, and an MCP server for Claude Desktop/Cursor.

Built by a 19-year-old student developer in India. MIT licensed. No accounts. No paywalls. Ships as one `npm install`.

**First Comment (by maker):**
I built AIScrubber because I kept pasting code with API keys into ChatGPT. The first time, I caught it. The second time, I didn't — and spent an evening rotating credentials. That was the trigger.

The constraint I gave myself: every operation runs in local memory. Your data never leaves your browser. The only outbound requests are anonymous pageview counts (Vercel Analytics) and a GitHub API call for the star badge. Neither touches anything you type.

The CLI and MCP server use the same scrub core as the web app — same detectors, same output. `npx aiscrubber scrub < file.txt` works offline.

If you work with LLMs and paste things into them, this is the pre-flight check before you hit send.

---

## 2. Hacker News Launch Post

**Title:** Show HN: AIScrubber – Browser-local privacy desk that scrubs secrets before they reach an LLM

**Body:**
I built a privacy desk that runs entirely in your browser. Five engines: text scrubbing (15+ secret formats, Luhn/Verhoeff-validated), prompt masking with reversible roundtrip, AI watermark removal (zero-width, Tag-Plane stego, homoglyphs), EXIF/C2PA metadata stripping with batch export, and visual redaction on screenshots.

No server. No accounts. No telemetry on user content. Everything processes in browser RAM or local Node.js.

Three surfaces share one logic core:
- Web app: aiscrubber.poorvithmp.com
- CLI: `npx aiscrubber scrub`, `clean-watermarks`, `strip-metadata`, `mask`/`unmask`
- MCP server: `npx aiscrubber mcp` for Claude Desktop and Cursor

Tech: React 19, Vite 6, TypeScript, Tailwind 4. Test coverage at 97% statements. MIT licensed.

The trigger was simple — I pasted an OpenAI key into ChatGPT and didn't notice until the bill spiked. Built the scrubber that evening. Five engines later, here we are.

npm: `aiscrubber` | GitHub: poorvith-mp/aiscrubber

---

## 3. X (Twitter) — 4 Weeks, 8 Posts

Each post = 2-tweet thread. Tweet 1 is info (hook + substance). Tweet 2 is CTA (link + ask).

### Week 1: Launch + Text Scrubber

#### Post 1 — Launch Day (Sep 1)

**Hook type:** Paradox

**Tweet 1 (Info):**
We paste API keys into ChatGPT to debug the code that protects API keys.

So I built a privacy desk that catches them first. Runs in your browser's RAM. Five engines:

→ Text scrubbing — 15+ secret formats (OpenAI, AWS, Stripe, GitHub, Slack, JWT, PEM). Luhn-validated cards. Verhoeff-validated Aadhaar.
→ Prompt masking — reversible roundtrip, LLM never sees real creds
→ AI watermark stripping — zero-width chars, steganography, homoglyphs
→ EXIF/C2PA metadata killing — GPS, Content Credentials, batch export
→ Visual redaction — blur, pixelate, blackout on screenshots

No server. No accounts. MIT licensed. Web app + CLI + MCP server, one logic core.

**Tweet 2 (CTA):**
Try it → aiscrubber.poorvithmp.com

Install it → `npm i aiscrubber`

Star it → github.com/poorvith-mp/aiscrubber

Built by a 19-year-old in India who learned the hard way that "I'll catch it before I paste" is never true.

**Visual Asset — Animated GIF:**

> **Prompt:** Screen capture GIF, 1200×675px, 16:9, dark theme background `#020617`. Open on AIScrubber's Text Scrubber view. Left input panel: a block of JavaScript containing a visible OpenAI API key (`sk-proj-Abc7x...`), an AWS secret access key (`AKIA...`), a Stripe secret key (`sk_live_...`), and an email address (`john@company.com`) — all in IBM Plex Mono, white `#f8fafc` text on dark surface `#0b0f19`. The user clicks "Scrub" — the right output panel populates with the same code, but secrets are replaced by colored pill badges: red `#dc2626` background pills for credentials reading `[CREDENTIAL_1]`, `[CREDENTIAL_2]`, `[CREDENTIAL_3]`, amber `#d97706` pill for the email reading `[EMAIL_1]`. A diff line connects each original to its replacement with a thin emerald `#10b981` connector line. Camera hovers over `[CREDENTIAL_1]` — a tooltip fades in showing the original `sk-proj-Abc7x...` value. Bottom stat bar in IBM Plex Mono, muted `#94a3b8`: "4 detections · 3 credentials · 1 PII · 0 false positives · 12ms". Top-left: AIScrubber bracket logo (white `#f8fafc` brackets on dark). Plus Jakarta Sans for all UI labels. Emerald green `#10b981` on the "Scrub" button and active nav tab. Duration: 8–10 seconds. Seamless loop — cut back to the input panel state at end.
>
> **Generate with:** Record the actual app at aiscrubber.poorvithmp.com using **ScreenToGif** (Windows, free) or **Kap** (Mac). Set browser to dark mode, viewport 1200×675. Type/paste the sample code, click Scrub, hover over a token. Trim in ScreenToGif, export as optimized GIF (<5MB for X upload). If you need a polished mockup instead of a screen recording, build it in **Figma** (free tier) using the exact hex values above, then export frames and assemble in ScreenToGif or **ezgif.com** (browser-based, free).

#### Post 2 — Text Scrubber Deep Dive (Sep 4)

**Hook type:** Stat

**Tweet 1 (Info):**
9 out of 9 secret formats went undetected before I rewrote the scrub engine.

OpenAI keys, GitHub PATs, Stripe secrets, AWS credentials, GitLab tokens, SendGrid keys, npm tokens, Slack webhooks, JWTs. The old regex caught 2. The other 7 walked straight into ChatGPT.

v2.3.0 catches all 9 plus emails, phones, Luhn-validated payment cards, Verhoeff-validated Aadhaar/PAN, SSNs, IPv4/IPv6, and URLs.

Custom rules drawer — add your own keywords or regex. The diff view shows exactly what got caught. One-click dictionary export for reversibility.

Your browser. Your RAM. Nothing leaves.

**Tweet 2 (CTA):**
Scrub before you paste → aiscrubber.poorvithmp.com

CLI version: `npx aiscrubber scrub < yourfile.txt`

Open source, MIT → github.com/poorvith-mp/aiscrubber

If this is useful, a star helps more than you think.

**Visual Asset — Static Image (Before/After Split):**

> **Prompt:** Static social graphic, 1200×675px, dark background `#020617`. Vertical split layout with a 2px emerald green `#059669` divider down the center. **Left half** — header "BEFORE" in IBM Plex Mono, 12px, uppercase, letter-spacing 0.15em, muted `#94a3b8`. Below: 6 lines of monospace code (IBM Plex Mono, 14px, white `#f8fafc`) on a dark surface `#0b0f19` with 16px padding, 4px border-radius. Line 1: `const key = "sk-proj-Abc7xR9..."` with the key value highlighted in a red `#dc2626` translucent background strip. Line 3: `// contact: john@acme.com` with the email in an amber `#d97706` strip. Line 5: `phone: "+91 98765 43210"` with the phone in amber. **Right half** — header "AFTER" in the same style. Same 6 lines but secrets replaced: `const key = "[CREDENTIAL_1]"` in an emerald green `#10b981` rounded pill (6px horizontal padding, 2px border-radius). Email becomes `[EMAIL_1]` pill. Phone becomes `[PHONE_1]` pill. Unchanged lines stay white, unchanged. **Bottom strip** spanning full width: dark surface `#0b0f19`, 40px height. Text in IBM Plex Mono, 11px, muted `#94a3b8`: "9 provider formats · Luhn validation · Verhoeff validation · <50ms · zero server uploads". **Top-left:** AIScrubber bracket logo, 28px. No gradients. No drop shadows. No rounded corners on the outer frame. Flat, clean, editorial.
>
> **Generate with:** **Figma** (free tier) — build the layout with two frames side by side, use the Inter or IBM Plex Mono Google Font, export at 2x as PNG. Alternatively, **Canva** (free tier) — use a custom-size canvas, dark background, manually place text blocks. For fastest turnaround with exact colors and fonts: build it as a simple HTML page (one `<div>` with CSS grid, the exact hex codes, Google Fonts `IBM Plex Mono` + `Plus Jakarta Sans`), screenshot at 1200×675 with browser DevTools device toolbar.

---

### Week 2: Prompt Masker + Watermark Remover

#### Post 3 — Prompt Masker (Sep 8)

**Hook type:** "Wait, what?"

**Tweet 1 (Info):**
You can send your entire codebase to Claude without leaking a single secret.

AIScrubber's Prompt Masker swaps every secret for a semantic constant — `{{API_SECRET_1}}`, `{{DB_PASSWORD_1}}` — before you paste.

The LLM responds using those constants. You paste the response back. One click restores real values. Working code, zero exposure.

I call it the zero-exposure roundtrip. The session key exports as `.aiscrub.json` — unmask from web, CLI, or MCP server. Same logic core everywhere.

The LLM debugs your code. It never touches your credentials.

**Tweet 2 (CTA):**
Try the roundtrip → aiscrubber.poorvithmp.com/#prompt

`npx aiscrubber mask < code.py` from your terminal.

Open source, MIT → github.com/poorvith-mp/aiscrubber

RT if you've ever pasted a .env into ChatGPT and immediately regretted it.

**Visual Asset — Animated GIF (3-Step Flow):**

> **Prompt:** Screen capture GIF, 1200×675px, dark theme `#020617`. Three-act sequence showing the Prompt Masker roundtrip. **Act 1 (0–3s):** Input panel on left, dark surface `#0b0f19`. User pastes 4 lines of Python: `OPENAI_API_KEY = "sk-proj-abc123..."` and `DATABASE_URL = "postgres://admin:s3cret@prod-db.internal:5432/app"` in IBM Plex Mono, white `#f8fafc`. Cursor blinks. **Act 2 (3–6s):** User clicks "Mask" button (emerald green `#10b981` background, white text, Plus Jakarta Sans semi-bold). Output panel on right populates: `OPENAI_API_KEY = "{{API_SECRET_1}}"` and `DATABASE_URL = "{{DB_CONNECTION_1}}"` — replacement tokens in emerald `#10b981` pill badges. A subtle sweep animation left-to-right as tokens appear. **Act 3 (6–10s):** Switch to the "Unmask" tab. User pastes an AI response containing `{{API_SECRET_1}}` in the left panel. Clicks "Unmask" — right panel shows restored real values with green checkmark `✓` animations next to each restored line. Bottom-right: the `.aiscrub.json` export button pulses once with an emerald glow to draw attention. AIScrubber bracket logo top-left. Duration: 10–12 seconds. Seamless loop back to Act 1.
>
> **Generate with:** Record the actual app using **ScreenToGif** (Windows) or **Kap** (Mac). Viewport 1200×675, dark mode. Paste the sample code, click through the mask/unmask flow. For a polished version: record in **OBS Studio** (free), crop to 1200×675, export as MP4, convert to GIF with **ezgif.com** (set optimization level 3, max 256 colors, <5MB). If the GIF exceeds X's 15MB limit, reduce to 8 fps or trim to 8 seconds.

#### Post 4 — AI Watermark Remover (Sep 11)

**Hook type:** Contrarian

**Tweet 1 (Info):**
AI companies embed invisible tracking in every word they generate. Most people don't know it's there.

Zero-width characters between letters. Tag-Plane steganography. Variation selectors. Homoglyph substitutions — Latin 'a' swapped for Cyrillic 'а'. Text looks identical. Carries a fingerprint.

AIScrubber's Watermark Remover strips all of it. Four modes:

→ Aggressive — kills everything invisible
→ Claude & LLM Clean — targets known LLM patterns
→ Code Safe — preserves legit whitespace in code
→ Invisible Unicode Only — surgical zero-width removal

Threat heatmap shows you where they sit. Threat score tells you how dirty the input is.

**Tweet 2 (CTA):**
Clean your AI-generated text → aiscrubber.poorvithmp.com/#watermark

CLI: `npx aiscrubber clean-watermarks < text.txt`

MIT licensed → github.com/poorvith-mp/aiscrubber

Copy-paste from any LLM. Get clean text out. Your browser, your RAM, nothing uploaded.

**Visual Asset — Static Image (Threat Heatmap):**

> **Prompt:** Static social graphic, 1200×675px, dark background `#020617`. **Main area:** A block of 10 lines of body text (Plus Jakarta Sans, 15px, white `#f8fafc`) on dark surface `#0b0f19`, 24px padding. Scattered through the text: 12–16 small glowing highlight zones where invisible watermarks were detected — irregular rectangles with rounded corners, using a gradient from red `#dc2626` (high threat) through amber `#d97706` (medium) to a faint amber glow. The highlights should look like they're underneath the text, bleeding through — not covering it. Some zones are single-character width (zero-width char insertions), others span 2–3 characters (homoglyph substitutions). **Below the text block:** A horizontal "Threat Score" meter, 100% width of the text block, 8px tall. Left third: emerald green `#10b981`. Middle third: amber `#d97706`. Right third: red `#dc2626`. A white triangle marker sits at the 73% mark (deep into the red zone). Label above the marker: "73 / 100" in IBM Plex Mono, 11px, white. **Below the meter:** Four pill-shaped mode buttons in a row, IBM Plex Mono, 11px, uppercase, letter-spacing 0.1em. "AGGRESSIVE" has an emerald `#10b981` 1.5px border (active state). "CLAUDE & LLM CLEAN", "CODE SAFE", "INVISIBLE UNICODE ONLY" have muted `#4f5259` borders (inactive). **Top-right corner:** Two-line stat in IBM Plex Mono, 11px, muted `#94a3b8`: "2,847 → 2,831 chars" on line 1, "16 invisible removed" on line 2. **Top-left:** AIScrubber bracket logo, 28px. No gradients on the outer frame. The only visual glow is on the threat highlights inside the text.
>
> **Generate with:** **Figma** — best tool for this. Create the text block, manually place colored rectangles behind specific characters to simulate the heatmap. Use Figma's blur effect (Layer → Gaussian Blur, 4px) on the highlight rectangles for the glow. Export at 2x PNG. Alternative: build as a single-file HTML page with CSS `background: linear-gradient()` on `<span>` elements wrapping "infected" characters, screenshot at 1200×675. For the meter bar, a simple CSS `div` with three-color gradient background.

---

### Week 3: Metadata Desk + Media Redactor

#### Post 5 — Metadata/C2PA Desk (Sep 15)

**Hook type:** Personal Stake

**Tweet 1 (Info):**
Every photo you upload carries your GPS coordinates and camera serial number. Every AI-generated image carries a C2PA Content Credential naming the exact model that made it.

I uploaded a screenshot to a GitHub issue and realized the EXIF data had my home coordinates baked in. That was the wake-up.

AIScrubber's Metadata Desk parses JPEG EXIF/GPS/IPTC/XMP, PNG chunks, PDF info, and audio ID3 tags. Detects C2PA Content Credentials from DALL-E 3, Adobe Firefly, and Google Imagen.

One click strips everything. Re-encodes the file. Bulk upload, batch strip, ZIP export.

1,121 lines of TypeScript doing metadata forensics in a browser tab. No upload. No server.

**Tweet 2 (CTA):**
Strip your metadata → aiscrubber.poorvithmp.com/#metadata

CLI: `npx aiscrubber strip-metadata photo.jpg`

Check what your images are leaking before you upload them anywhere.

MIT licensed → github.com/poorvith-mp/aiscrubber

Star if this should exist.

**Visual Asset — Video (15–20 sec):**

> **Prompt:** Screen recording, 1920×1080, 16:9, AIScrubber Metadata Desk, dark theme `#020617`. **Scene 1 (0–4s):** Empty Metadata Desk view. Drag-and-drop zone in center — dashed emerald `#059669` border, 2px, icon of a file with an arrow. User drags a JPEG file from desktop — the file icon enters the drop zone, a subtle bounce animation (scale 1.05→1.0, 200ms ease-out) plays on drop, the dashed border flashes solid emerald `#10b981` briefly. **Scene 2 (4–9s):** Metadata panel expands downward with a smooth slide animation. Parsed EXIF fields appear as key-value rows on dark surface `#0b0f19`: "Camera Make: Canon" (IBM Plex Mono, white `#f8fafc`), "Camera Model: EOS R5", "GPS Latitude: 12.9716° N" in red `#dc2626` text (danger highlight), "GPS Longitude: 77.5946° E" in red, "Date/Time: 2026-08-15 14:32", "Software: Adobe Photoshop". A C2PA alert badge appears below the EXIF fields — amber `#d97706` background pill reading "C2PA Content Credential Detected: DALL-E 3" with a small warning triangle icon. **Scene 3 (9–14s):** User clicks "Strip All Metadata" button (emerald `#10b981` bg, white text). A progress bar (emerald fill, left-to-right, 1.5s duration) sweeps across the top of the metadata panel. Fields fade out one by one (300ms stagger). End state: the panel reads "0 metadata fields · file re-encoded" in emerald green with a checkmark. **Scene 4 (14–18s):** Quick cut. Bulk upload zone now shows 4 file thumbnails in a grid. User clicks "Batch Strip" — all four get simultaneous emerald progress rings around their thumbnails. A "Download ZIP" button fades in at the bottom, emerald border, white text. Labels: Plus Jakarta Sans. Values: IBM Plex Mono. AIScrubber bracket logo top-left header. No background music. No voiceover. Duration: 15–18 seconds.
>
> **Generate with:** Record the actual app using **OBS Studio** (free, Windows/Mac/Linux). Set canvas to 1920×1080. Open aiscrubber.poorvithmp.com/#metadata in dark mode. Prepare a test JPEG with real EXIF data (take a photo with your phone, it'll have GPS). Record the drag-drop, inspection, and strip flow. Edit in **DaVinci Resolve** (free) or **CapCut** (free) — trim dead frames, add a 0.5s fade-in at the start. Export as MP4 (H.264, 1080p, 30fps). For X: upload as video directly (max 2:20, but 15–18s is ideal). For LinkedIn: same file. If you want a more polished version with zoom cuts and annotations, use **Remotion** (React-based video, free OSS) to build a templated recording with programmatic zoom-ins on the GPS fields and C2PA badge.

#### Post 6 — Media Redactor (Sep 18)

**Hook type:** Number

**Tweet 1 (Info):**
3 tools. 1 canvas. Every screenshot you need to redact before sharing.

Gaussian Blur for soft obscuring. Pixelate for hard anonymization. Solid Blackout for zero chance of recovery.

HTML5 Canvas with full undo/redo. Draw over any region. Export as high-res PNG.

Built this because I kept redacting in Preview, saving, missing a field, reopening the original, starting over. AIScrubber's redactor stays interactive until you're done.

No cloud processing. No server that "temporarily stores your image." Canvas ops in your browser.

**Tweet 2 (CTA):**
Redact before you share → aiscrubber.poorvithmp.com/#media

Open source, MIT → github.com/poorvith-mp/aiscrubber

Next time you screenshot a dashboard with customer data, run it through this first.

**Visual Asset — Animated GIF (Redaction Demo):**

> **Prompt:** Screen capture GIF, 1200×675px, dark theme `#020617`. AIScrubber Media Redactor view. **Frame 1 (0–2s):** A fake dashboard screenshot loaded into the canvas area — dark surface `#0b0f19`. The screenshot shows a user profile card: a circular avatar (generic person silhouette), name "Sarah Chen" in Plus Jakarta Sans, email "sarah.chen@company.io" in IBM Plex Mono, and a phone number "+1 (555) 234-5678". Left toolbar: three tool buttons stacked vertically — blur icon (concentric circles), pixelate icon (grid), blackout icon (filled square). "Blur" is active with emerald green `#10b981` left-border highlight. Undo/Redo arrows above the tools, muted `#64748b`. **Frame 2 (2–4s):** User draws a rectangle selection over the email — a dashed emerald outline appears during drag. On mouse-up, Gaussian blur fills the selection area, the email text becomes an unreadable soft smear. **Frame 3 (4–6s):** User clicks "Pixelate" tool — it gets the emerald active border, Blur loses it. Draws over the avatar — mosaic pixelation fills the circle, the silhouette becomes chunky colored blocks. **Frame 4 (6–8s):** User clicks "Blackout" tool (active). Draws over the name — a solid black `#000000` rectangle with crisp edges covers "Sarah Chen" completely. **Frame 5 (8–9s):** User clicks "Undo" — the blackout disappears, name visible again. Clicks "Redo" — blackout returns. **Frame 6 (9–10s):** User clicks "Export PNG" button (emerald bg, white text) — a brief download animation plays (small arrow-down icon bounces). Seamless loop back to Frame 1.
>
> **Generate with:** Record the actual app using **ScreenToGif** (Windows) or **Kap** (Mac). Load any screenshot into the Media Redactor (dark mode, viewport 1200×675). Perform the blur/pixelate/blackout sequence. ScreenToGif has built-in editing — trim frames, adjust delay (aim for 100ms/frame = 10fps for smooth motion under 5MB). Export as GIF with ScreenToGif's quantization (256 colors). If file size exceeds 5MB: reduce to 8fps, crop tighter, or split into two shorter GIFs. Alternative: record in OBS as MP4, convert via **ezgif.com** (Video to GIF, 10fps, optimization level 3).

---

### Week 4: CLI + MCP + What's Next

#### Post 7 — CLI + MCP Server (Sep 22)

**Hook type:** Paradox

**Tweet 1 (Info):**
The same scrub engine that runs in your browser tab runs in your terminal and inside Claude Desktop.

One logic core. Three surfaces:

```
npx aiscrubber scrub < file.txt
npx aiscrubber clean-watermarks
npx aiscrubber mask / unmask
npx aiscrubber strip-metadata image.jpg
npx aiscrubber mcp
```

5 MCP tools: `clean_ai_watermarks`, `scrub_text`, `mask_prompt`, `unmask_response`, `inspect_content`. JSON-RPC 2.0. Works with Claude Desktop, Claude Code, and Cursor.

One `npm install`. No config. No API keys. No daemon. 97% test coverage across all three surfaces.

**Tweet 2 (CTA):**
Install it → `npm i aiscrubber`

MCP config for Claude Desktop:
```json
{ "command": "npx", "args": ["aiscrubber", "mcp"] }
```

Star it → github.com/poorvith-mp/aiscrubber

If you're building with MCP, this is 5 privacy tools you get for free.

**Visual Asset — Terminal Recording (Animated SVG/GIF):**

> **Prompt:** Animated terminal recording, 1200×675px, dark terminal background `#0b0f19`. Monospace font IBM Plex Mono throughout, 14px. Subtle 1px border around terminal frame in muted `#1f2125`. Terminal title bar at top: three dot circles (close/minimize/maximize) in muted `#4f5259`, centered title "aiscrubber" in IBM Plex Mono, 12px, muted. **Sequence 1 (0–4s):** Prompt `$` in slate `#94a3b8`, then realistic typing animation (variable speed, 40-80ms/char) of `npx aiscrubber scrub`. Below appears a code snippet input (dimmed white `#94a3b8`): `const apiKey = "sk-proj-Abc7xR9..."`. Below that, output in emerald green `#10b981`: `→ const apiKey = "[CREDENTIAL_1]"`. A stat line in muted: `1 credential detected · 8ms`. Blank line. **Sequence 2 (4–8s):** New prompt, typing `npx aiscrubber clean-watermarks`. Input shows `Hello world` (but with invisible chars — represented by tiny red `#dc2626` dots between some characters in the "input visualization" line). Output in green: `→ Hello world`. Stat: `Cleaned: 12 invisible characters removed · 3ms`. **Sequence 3 (8–12s):** New prompt, typing `npx aiscrubber mcp`. Output block in green: `AIScrubber MCP Server v2.3.0`. Next line: `Listening on stdio · JSON-RPC 2.0`. Then a list of 5 tools, each prefixed with `·` in emerald: `clean_ai_watermarks`, `scrub_text`, `mask_prompt`, `unmask_response`, `inspect_content`. Cursor blinks on a new empty prompt line. Duration: 12–14 seconds. Seamless loop.
>
> **Generate with:** **asciinema** (free, terminal recorder) + **agg** (asciinema GIF generator) for authentic terminal recordings. Record the actual CLI commands in your terminal with a dark theme. Set terminal font to IBM Plex Mono or JetBrains Mono. `asciinema rec demo.cast`, run the commands, `agg demo.cast demo.gif --theme monokai --cols 80 --rows 24`. Alternative: **Terminalizer** (npm package, `npm i -g terminalizer`) — records terminal sessions and renders to GIF with configurable themes and fonts. For a hand-crafted look: **Carbon** (carbon.now.sh, free) for individual command screenshots, then stitch with ScreenToGif adding typing animation. For SVG animation: build a simple HTML page with CSS `@keyframes` typing the commands character by character, then record with ScreenToGif or convert to animated SVG with **svg-term-cli** (`npm i -g svg-term-cli`).

#### Post 8 — Wrap / What's Next (Sep 25)

**Hook type:** Personal Stake

**Tweet 1 (Info):**
I started building AIScrubber because I pasted an API key into an LLM and didn't catch it. Spent the evening rotating credentials. Don't want to repeat that.

Four weeks of shipping this to you. What AIScrubber does today:

→ Text Scrubber — 15+ secret formats, Luhn/Verhoeff validation, custom rules, interactive diff
→ Prompt Masker — zero-exposure roundtrip, session key export
→ AI Watermark Remover — 4 modes, threat heatmap, homoglyph detection
→ Metadata Desk — EXIF/C2PA/PNG/PDF/Audio, batch strip, ZIP export
→ Media Redactor — blur, pixelate, blackout, undo/redo

Three surfaces: web, CLI, MCP. One logic core. 97% test coverage. MIT.

What's next: browser extension (intercept before paste), VS Code integration, more detector formats.

**Tweet 2 (CTA):**
If you paste things into AI tools, this is the pre-flight check.

Star it → github.com/poorvith-mp/aiscrubber
Install it → `npm i aiscrubber`
Use it → aiscrubber.poorvithmp.com

19, incoming BTech CSE, building privacy tools from India. This stuff should be free and local.

RT if you agree.

**Visual Asset — Static Summary Card (Bento Grid):**

> **Prompt:** Static social graphic, 1200×675px, dark background `#020617`. **Top center:** AIScrubber bracket logo at 36px height, white `#f8fafc`. 8px below it: "AIScrubber" in Plus Jakarta Sans Semi-Bold, 20px, white. **Main area:** A 3×2 bento grid (3 columns, 2 rows) with 8px gap between cards. Each card: dark surface `#0b0f19`, 1px border in emerald `#059669` at 25% opacity (`rgba(5,150,105,0.25)`), 8px border-radius, 16px internal padding. **Card contents (top-left to bottom-right):** (1) Shield icon in emerald `#10b981`, 20px. "Text Scrubber" in Plus Jakarta Sans Semi-Bold, 14px, white. "15+ secret formats, custom rules" in DM Sans, 11px, muted `#94a3b8`. (2) Mask/theater icon. "Prompt Masker". "Zero-exposure LLM roundtrip". (3) Eye icon. "Watermark Remover". "4 modes, threat heatmap". This card has a small "NEW" pill badge — emerald `#10b981` bg, white text, IBM Plex Mono, 9px, uppercase, positioned top-right of the card with 8px inset. This card also has a slightly brighter border: emerald `#059669` at 50% opacity. (4) Camera icon. "Metadata Desk". "EXIF/C2PA, batch strip, ZIP". (5) Brush/paintbrush icon. "Media Redactor". "Blur, pixelate, blackout". (6) Rocket icon, muted `#94a3b8` (not emerald — this one is future). "What's Next". "Browser extension, VS Code" in italic DM Sans. All icons should be simple line-art style, 1.5px stroke, matching Lucide icon aesthetics. **Bottom strip:** Full-width, dark surface `#0b0f19`, 36px height. Text centered in IBM Plex Mono, 10px, muted `#94a3b8`, letter-spacing 0.08em: "MIT Licensed · 97% Coverage · Zero Server Uploads · npm i aiscrubber". No gradients. No drop shadows. No outer border-radius. Clean, flat, editorial.
>
> **Generate with:** **Figma** (free tier) — best for this kind of structured layout. Create a frame 1200×675, set background `#020617`. Build the grid with Auto Layout. Use Lucide icons (search "lucide figma" for the community plugin — free). Export at 2x as PNG (final file 2400×1350, will display crisp on retina). Alternative: **Canva** (free tier) — use "Custom size" 1200×675, dark background, add text and shapes manually. Canva doesn't support custom fonts on free tier, so substitute Inter for Plus Jakarta Sans (close match). For pixel-perfect control: build as HTML/CSS (CSS Grid, 3-column, Google Fonts, Lucide CDN icons), screenshot at exact dimensions with Chrome DevTools → "Capture screenshot" in responsive mode at 1200×675.

---

## 4. LinkedIn — 4 Weeks, 8 Posts

Post body = theory and value. No links in the post. First comment = link + install + repost ask. Post immediately after publishing.

### Week 1

#### LinkedIn Post 1 — Launch Day (Sep 1)

**Post body:**
We paste API keys into ChatGPT to debug the code that protects API keys.

That's not a hypothetical. I did it. And the credential rotation that followed is why AIScrubber exists.

I built a browser-local privacy desk that catches secrets before they reach any AI tool. Five engines, zero server uploads, everything runs in your browser's RAM.

What it catches:
→ API keys across 15+ provider formats (OpenAI, AWS, Stripe, GitHub, Slack, JWT, PEM)
→ Emails, phones, payment cards (Luhn-validated), Aadhaar/PAN (Verhoeff-validated)
→ Invisible AI watermarks — zero-width characters, steganography, homoglyph swaps
→ EXIF GPS coordinates and C2PA Content Credentials from AI image generators
→ Visual PII in screenshots via blur, pixelate, and blackout tools

Three surfaces, one logic core: web app, CLI, and an MCP server for Claude Desktop.

I'm 19, incoming BTech CSE, building this from India. MIT licensed. No accounts. No paywalls.

#AI #Privacy #OpenSource #DeveloperTools #CyberSecurity #BuildInPublic #AISecurity #LLM #DataPrivacy #StudentDeveloper

**First comment:**
Try it → aiscrubber.poorvithmp.com
Install it → `npm i aiscrubber`
Source → github.com/poorvith-mp/aiscrubber

If this is useful to your network, a repost helps it reach devs who need it. Appreciate it.

**Visual:** Same GIF as X Post 1.

#### LinkedIn Post 2 — Text Scrubber (Sep 4)

**Post body:**
9 out of 9 secret formats went undetected before I rewrote the scrub engine.

I tested every major API key format — OpenAI, GitHub PATs, Stripe secrets, AWS credentials, GitLab tokens, SendGrid, npm, Slack webhooks, JWTs.

The old regex caught 2. The other 7 walked straight through.

v2.3.0 catches all 9 provider formats plus emails, phones, Luhn-validated payment cards, Verhoeff-validated Aadhaar/PAN, US Social Security Numbers, IPv4/IPv6, and URLs.

The diff view shows exactly what got caught. Token tooltips reveal the original value. One-click dictionary export if you need reversibility.

Custom rules drawer lets you add your own keywords or regex patterns for anything I haven't covered yet.

Your browser. Your RAM. Nothing leaves your machine.

#AI #Privacy #DeveloperTools #APIKeys #Security #OpenSource #BuildInPublic #CyberSecurity #DataProtection #LLM

**First comment:**
Scrub before you paste → aiscrubber.poorvithmp.com

Open source, MIT → github.com/poorvith-mp/aiscrubber

If you know devs who paste code into LLMs daily, repost this their way.

**Visual:** Same static image as X Post 2.

### Week 2

#### LinkedIn Post 3 — Prompt Masker (Sep 8)

**Post body:**
You can send your entire codebase to an LLM without leaking a single secret.

The trick: swap every secret for a semantic constant — `{{API_SECRET_1}}`, `{{DB_PASSWORD_1}}` — before you paste into ChatGPT, Claude, or Gemini.

The AI responds using those constants. You paste the response back. One click restores real values.

Working code. Zero exposure. The LLM debugs your logic. It never touches your credentials.

The session key exports as `.aiscrub.json` — unmask from the web app, the CLI, or the MCP server. Same logic core, same output everywhere.

If you use LLMs for code review, debugging, or refactoring, this is the step between "copy" and "paste" that most people skip.

#AI #DeveloperTools #Privacy #LLM #CodeReview #OpenSource #BuildInPublic #Security #ChatGPT #Claude

**First comment:**
Try the roundtrip → aiscrubber.poorvithmp.com/#prompt

CLI: `npx aiscrubber mask < code.py`

MIT licensed → github.com/poorvith-mp/aiscrubber

Repost if your team pastes code into LLMs — they should know this exists.

**Visual:** Same GIF as X Post 3.

#### LinkedIn Post 4 — AI Watermark Remover (Sep 11)

**Post body:**
AI companies embed invisible tracking in every word they generate.

Zero-width characters between letters. Tag-Plane Unicode steganography. Variation selectors. Homoglyph substitutions — Latin 'a' swapped for Cyrillic 'а'. Text looks identical. Carries a fingerprint.

Copy-paste from ChatGPT or Claude and those invisible characters tag along.

I built a remover with four cleaning modes:

→ Aggressive — kills everything invisible
→ Claude & LLM Clean — targets known LLM watermark patterns
→ Code Safe — preserves legit whitespace in code blocks
→ Invisible Unicode Only — surgical zero-width removal

A threat heatmap shows where the watermarks sit. Threat score tells you how dirty the input is before and after.

Browser-only. Open source. MIT.

#AI #AIWatermarks #Privacy #LLM #Unicode #OpenSource #DeveloperTools #ChatGPT #Claude #BuildInPublic

**First comment:**
Clean your AI text → aiscrubber.poorvithmp.com/#watermark

CLI: `npx aiscrubber clean-watermarks < text.txt`

Source → github.com/poorvith-mp/aiscrubber

Repost for anyone who copy-pastes from ChatGPT regularly. They probably don't know these invisible chars exist.

**Visual:** Same static image as X Post 4.

### Week 3

#### LinkedIn Post 5 — Metadata/C2PA Desk (Sep 15)

**Post body:**
Every photo you upload carries your GPS coordinates, camera serial number, and editing history.

Every AI-generated image carries a C2PA Content Credential naming the exact model that made it — DALL-E 3, Adobe Firefly, Google Imagen.

I uploaded a screenshot to a GitHub issue and realized the EXIF data had my home coordinates embedded. That's the kind of thing you notice once and can't un-notice.

I built a metadata desk that parses JPEG EXIF/GPS/IPTC/XMP, PNG chunks, PDF info, audio ID3 tags, and C2PA Content Credentials.

One click strips everything and re-encodes the file. Bulk upload handles batches. ZIP export for the clean versions.

1,121 lines of TypeScript doing metadata forensics in a browser tab. No upload. No server. No cloud service that "temporarily stores your files."

#AI #Privacy #Metadata #EXIF #C2PA #ImagePrivacy #OpenSource #DeveloperTools #CyberSecurity #BuildInPublic

**First comment:**
Strip your metadata → aiscrubber.poorvithmp.com/#metadata

CLI: `npx aiscrubber strip-metadata photo.jpg`

Source → github.com/poorvith-mp/aiscrubber

Repost if you know people who upload images without checking what's embedded. That's most people.

**Visual:** Same video as X Post 5.

#### LinkedIn Post 6 — Media Redactor (Sep 18)

**Post body:**
3 tools. 1 canvas. Every screenshot you need to redact before sharing.

Gaussian Blur for soft obscuring. Pixelate for hard anonymization. Solid Blackout for zero recovery chance.

Full undo/redo. High-res PNG export. HTML5 Canvas in your browser.

Built this because I kept redacting in Preview, saving, missing a field, reopening the original, starting over. This stays interactive until you're done.

No cloud processing. No "AI-powered" redaction that uploads your screenshot to blur it. Canvas operations in your browser, period.

#Privacy #Screenshots #DeveloperTools #OpenSource #Redaction #Security #BuildInPublic #DataProtection #VisualPrivacy #AITools

**First comment:**
Redact before you share → aiscrubber.poorvithmp.com/#media

Source → github.com/poorvith-mp/aiscrubber

Repost for anyone who screenshots dashboards with customer data. They need this before the next Slack paste.

**Visual:** Same GIF as X Post 6.

### Week 4

#### LinkedIn Post 7 — CLI + MCP (Sep 22)

**Post body:**
Same scrub engine. Three surfaces.

Web app for quick paste-and-check. CLI for piping files in your terminal. MCP server for running inside Claude Desktop or Cursor.

All three run the same logic core. Same input, same output, every time.

CLI commands:
→ `npx aiscrubber scrub` — pipe any file through the text scrubber
→ `npx aiscrubber clean-watermarks` — strip AI watermarks from stdin
→ `npx aiscrubber mask` / `unmask` — zero-exposure roundtrip
→ `npx aiscrubber strip-metadata` — kill EXIF/C2PA
→ `npx aiscrubber mcp` — start the MCP server

5 MCP tools for Claude Desktop and Cursor. JSON-RPC 2.0.

One `npm install`. No config. No API keys. No daemon. 97% test coverage.

If you use an MCP-compatible client, AIScrubber runs alongside your LLM — scrubbing happens inside your workflow, not as a separate browser tab.

#MCP #CLI #DeveloperTools #OpenSource #Claude #Cursor #Privacy #AI #NodeJS #BuildInPublic

**First comment:**
Install it → `npm i aiscrubber`

MCP config for Claude Desktop:
```json
{ "command": "npx", "args": ["aiscrubber", "mcp"] }
```

Source → github.com/poorvith-mp/aiscrubber

Repost if your team uses Claude Desktop or Cursor — 5 privacy tools they can plug in with one line.

**Visual:** Same terminal recording as X Post 7.

#### LinkedIn Post 8 — Wrap / What's Next (Sep 25)

**Post body:**
I built AIScrubber because I pasted an API key into an LLM and didn't catch it.

That credential rotation evening is why five privacy engines exist today:

→ Text Scrubber — 15+ secret formats, custom rules, interactive diff
→ Prompt Masker — zero-exposure roundtrip, session key export
→ AI Watermark Remover — 4 modes, threat heatmap, homoglyph detection
→ Metadata Desk — EXIF/C2PA/PNG/PDF/Audio, batch strip, ZIP export
→ Media Redactor — blur, pixelate, blackout, undo/redo

Three surfaces. One logic core. 97% test coverage. MIT licensed. Free.

What's next: browser extension to intercept secrets before paste, VS Code integration, and more detector formats.

I'm 19, incoming BTech CSE, building privacy tools from India because this stuff should be free and local.

#AI #Privacy #OpenSource #DeveloperTools #BuildInPublic #AISecurity #LLM #CyberSecurity #StudentDeveloper #MIT

**First comment:**
Star it → github.com/poorvith-mp/aiscrubber
Install it → `npm i aiscrubber`
Use it → aiscrubber.poorvithmp.com

This is the last post in the 4-week series. If any of the five engines are useful to your network, a repost on this one helps it reach them. Appreciate everyone who shared the earlier posts.

**Visual:** Same summary card as X Post 8.

---

## 5. Personalized Outreach DMs

### Template A — Developer/Builder (X or LinkedIn)

Hey {name} — saw your work on {their project/post}. Built something adjacent you might find useful.

AIScrubber — browser-local privacy desk. Scrubs API keys, strips AI watermarks, kills EXIF/C2PA metadata before you paste things into LLMs. No server, everything in your browser.

CLI and MCP server too if you use Claude Desktop or Cursor.

Thought of you because {specific reason — e.g., "you mentioned leaking a key in that thread" or "your project handles sensitive data" or "you're building with MCP"}.

aiscrubber.poorvithmp.com — would genuinely appreciate a look. MIT, completely free.

### Template B — Privacy/Security Community Leader

Hey {name} — I follow your work on {their focus area}. Built something that aligns with what you advocate.

AIScrubber: 5 privacy engines that run entirely in browser RAM. Text scrubbing (15+ secret formats), prompt masking, AI watermark removal, metadata/C2PA stripping, visual redaction. Zero server uploads, zero telemetry on user content.

Only outbound requests are anonymous pageview counts and a GitHub star badge call. Neither touches anything the user types.

MIT licensed. Open source. No accounts, no paywalls.

Would mean a lot if you gave it a look — and even more if you had feedback. aiscrubber.poorvithmp.com

### Template C — Open-Source Maintainer

Hey {name} — I maintain AIScrubber, browser-local privacy desk that scrubs secrets before they reach LLMs. MIT licensed, React 19 / Vite 6 / TypeScript, 97% test coverage.

{Specific connection — e.g., "I noticed your project deals with similar EXIF parsing" or "Your MCP server work is what inspired the aiscrubber mcp command"}.

Would love any feedback if you get a chance to look: github.com/poorvith-mp/aiscrubber

No ask beyond that — just think it's in your wheelhouse.

---

## 6. Visual Asset Prompts — Supplementary

### Hero OG Image / Social Share Card

> **Prompt:** Static OG image, 1200×630px, dark background `#020617`. Center: AIScrubber bracket logo (code bracket `{ }` with shield motif) at 120px height. Behind the logo: a subtle emerald green `#10b981` radial glow, 200px radius, 15% opacity — not a solid circle, a soft atmospheric bloom. Below logo: "AIScrubber" in Plus Jakarta Sans Bold, 64px, white `#f8fafc`, letter-spacing -0.02em. Below that: "Sanitize sensitive data before it travels." in DM Sans Regular, 24px, muted `#94a3b8`. Bottom strip, 48px from bottom edge: five small line icons in a row (shield, mask, eye, camera, brush) representing the 5 engines. Each icon: 24px, emerald `#059669`, 1.5px stroke, Lucide style, 32px spacing between icons. Very bottom, 16px from edge: "aiscrubber.poorvithmp.com" in IBM Plex Mono, 13px, muted `#64748b`. No gradients except the logo glow. No outer borders. Flat, dark, minimal, technical.
>
> **Generate with:** **Figma** (free tier). Build at 2x (2400×1260) for retina sharpness, export as PNG. Use Figma's Lucide Icons community plugin for the engine icons. The radial glow: create a circle, fill emerald, set opacity to 15%, apply 100px Gaussian blur. Alternative: **Photopea** (browser-based Photoshop clone, free) — create canvas, place text with Google Fonts, add a soft brush stroke for the glow. This image is also your default `og:image` meta tag — replace the existing one in `index.html`.

### Product Hunt Gallery Images (5 images, one per engine)

All 5 follow the same frame: 1270×760px, dark background `#020617`, AIScrubber bracket logo top-left at 24px, engine name as headline top-center in Plus Jakarta Sans Semi-Bold 18px white.

> **Image 1 — Text Scrubber:**
> Screenshot-style mockup. Split-panel interface: left panel (dark surface `#0b0f19`, 1px border `#1f2125`) with raw code containing secrets — OpenAI key in red `#dc2626` highlight pill, email in amber `#d97706` pill, phone in amber pill. Right panel: same code with replacements in emerald `#10b981` pills: `[CREDENTIAL_1]`, `[EMAIL_1]`, `[PHONE_1]`. Thin emerald connector lines between original and replacement positions. Stats bar bottom: "15+ formats · Luhn · Verhoeff · <50ms" in IBM Plex Mono 11px muted.

> **Image 2 — Prompt Masker:**
> Three-column horizontal flow: "Your Code" → "Masked Prompt" → "Restored Response". Each column is a dark surface card `#0b0f19` with code inside. Arrows between columns: emerald `#10b981` chevrons (→). First card: code with highlighted secrets. Second card: secrets replaced with `{{API_SECRET_1}}` tokens. Third card: real values restored, green checkmarks. Small `.aiscrub.json` file icon in bottom-right corner, muted.

> **Image 3 — AI Watermark Remover:**
> Split view. Left: text block with 12+ red/amber heatmap glow zones on specific characters (irregular shapes, translucent, simulating detected watermark locations). Right: clean text, "0 threats detected" in emerald. Threat score meter bar at bottom spanning both halves. Four mode pill buttons below the meter.

> **Image 4 — Metadata Desk:**
> JPEG file thumbnail on left. Expanded metadata panel on right: key-value rows for Camera Make/Model, GPS Lat/Long (red text), Date/Time, Software. C2PA alert badge in amber: "DALL-E 3 Content Credential". "Strip All" button in emerald. Below: batch zone showing 3 file thumbnails queued with progress rings.

> **Image 5 — Media Redactor:**
> Screenshot on canvas with three applied redaction zones: blurred email (soft Gaussian smear), pixelated avatar (chunky mosaic blocks), blacked-out name (solid black rect). Left toolbar: Blur/Pixelate/Blackout icons with Blur active (emerald border). Undo/Redo at top. "Export PNG" button bottom-right in emerald.

> **Generate all 5 with:** **Figma** — create one master frame at 1270×760, duplicate per engine, swap contents. This gives you consistent padding, logo placement, and type sizing across all 5. Export each at 2x PNG. If you want actual product screenshots instead of mockups: open each engine in the live app, set viewport to 1270×760 in Chrome DevTools, take a "Capture screenshot" (Ctrl+Shift+P → "Capture screenshot"), then annotate in Figma (add the colored highlight pills, connector lines, and stat bars over the real screenshot). The hybrid approach — real UI with added annotations — is the most credible for Product Hunt.

### Animated Banner for GitHub README

> **Prompt:** Animated SVG, 800×200px, dark background `#020617`. **Left zone (0–200px):** AIScrubber bracket logo, 48px, white `#f8fafc`. Behind it: a pulsing emerald `#10b981` glow that breathes between 8% and 18% opacity on a 3-second cycle (CSS `@keyframes` with `ease-in-out`). **Center zone (200–600px):** Rotating text that cycles through 5 phrases with a smooth crossfade (opacity 0→1→0 over 2 seconds each): "Scrub Secrets", "Mask Prompts", "Strip Watermarks", "Kill Metadata", "Redact Screenshots". Each phrase in Plus Jakarta Sans Semi-Bold, 28px, white `#f8fafc`. Below the phrase: a row of 5 small dots (6px diameter, 12px spacing). The dot matching the current phrase is emerald `#10b981`; the rest are muted `#4f5259`. **Right zone (600–800px):** "aiscrubber.poorvithmp.com" in IBM Plex Mono, 11px, muted `#94a3b8`, vertically centered, static. Animation: 10 seconds total cycle (2s per phrase), infinite loop. No JavaScript — pure CSS animations with `@keyframes` and `animation-delay` staggering. Subtle: 8–12 floating particles (2px circles, emerald `#10b981` at 6% opacity) drifting upward at varying speeds in the background — CSS-animated, no JS.
>
> **Generate with:** Hand-code as SVG + embedded CSS `<style>` block. This is the most reliable approach for GitHub README banners — GitHub renders inline SVG with CSS animations. Use `<text>` elements for the phrases with `@keyframes fadeIn` and staggered `animation-delay`. The pulsing glow: an SVG `<circle>` with `fill="#10b981"`, `opacity` animated between 0.08 and 0.18. The floating particles: small `<circle>` elements with `@keyframes float` translating Y. Test by opening the SVG file directly in a browser. Embed in README with `<img src="banner.svg" width="800">`. Alternative: if hand-coding SVG feels heavy, build it as an HTML page, record with ScreenToGif at 800×200, export as GIF — but SVG is sharper and lighter for GitHub.

---

## 7. SEO & Documentation Strategy

**Primary Keywords (target in docs, landing page, and meta):**
- "scrub API keys before ChatGPT"
- "remove AI watermarks"
- "strip EXIF metadata browser"
- "C2PA content credential remover"
- "privacy tool for LLMs"
- "browser local PII scrubber"
- "MCP server privacy"

**Already in place (from repo audit):**
- OG tags, Twitter cards, canonical URL ✓
- Schema.org JSON-LD (WebApplication + FAQPage) ✓
- robots.txt, sitemap.xml ✓
- `llms.txt` for LLM context ✓

**Docs structure (aiscrubber.poorvithmp.com/#docs):**
Existing in-app docs workspace covers all 5 engines. No separate docs site needed for launch. The in-app docs double as SEO-crawlable content since it's an SPA with proper meta tags.

**Post-launch SEO moves:**
1. Write 2–3 blog-style entries on poorvithmp.com linking to AIScrubber for specific use cases ("How to strip C2PA credentials from AI-generated images", "How to safely paste code into ChatGPT")
2. Keep `llms.txt` current with v2.3.0 feature set
3. Monitor Google Search Console for query impressions and iterate title/description tags

---

## 8. Psychology Levers in Play

| Principle | Where Applied |
|-----------|---------------|
| **Loss Aversion** | Every hook frames what you lose by NOT scrubbing — leaked keys, exposed GPS, invisible tracking |
| **Endowment Effect** | Free tool, no signup — users "own" it immediately, no friction to try |
| **Zero-Price Effect** | MIT licensed, no paywalls, no freemium gates — free is psychologically different from cheap |
| **Authority / Social Proof** | 97% test coverage, 15+ formats, specific technical claims with numbers — credibility through specificity |
| **IKEA Effect** | Custom rules drawer — users build their own detection patterns, increasing investment |
| **Reciprocity** | Give a genuinely useful free tool, ask only for a GitHub star in return |
| **Identity Trigger** | "If you paste things into AI tools" — targets the behavior, not the demographic |
| **Mere Exposure** | 4-week cadence with 2 posts/week ensures repeated visibility across developer feeds |
| **Scarcity (genuine)** | "NEW" badge on AI Watermark Remover — newest engine, genuine novelty signal |
| **Commitment & Consistency** | Star → install → use → contribute. Each step builds on the last |

---

## 9. Post Schedule Summary

| Date | X (Thread) | LinkedIn (Post + Comment) | Other |
|------|-----------|--------------------------|-------|
| Sep 1 (Mon) | Launch announcement | Launch announcement | PH + HN |
| Sep 4 (Thu) | Text Scrubber deep dive | Text Scrubber deep dive | — |
| Sep 8 (Mon) | Prompt Masker | Prompt Masker | — |
| Sep 11 (Thu) | AI Watermark Remover | AI Watermark Remover | — |
| Sep 15 (Mon) | Metadata/C2PA Desk | Metadata/C2PA Desk | — |
| Sep 18 (Thu) | Media Redactor | Media Redactor | — |
| Sep 22 (Mon) | CLI + MCP Server | CLI + MCP Server | — |
| Sep 25 (Thu) | Wrap + What's Next | Wrap + What's Next | — |

**Visual Assets per Post:**

| Post | Asset Type | Generate With |
|------|-----------|---------------|
| Post 1 (Launch) | Animated GIF | ScreenToGif / Kap (screen recording of live app) |
| Post 2 (Text Scrubber) | Static image | Figma (mockup) or HTML screenshot |
| Post 3 (Prompt Masker) | Animated GIF | ScreenToGif / OBS + ezgif |
| Post 4 (Watermark) | Static image | Figma (heatmap mockup) |
| Post 5 (Metadata) | Video (15–18s) | OBS Studio → DaVinci Resolve / CapCut |
| Post 6 (Media Redactor) | Animated GIF | ScreenToGif (live app recording) |
| Post 7 (CLI/MCP) | Terminal GIF | asciinema + agg / Terminalizer |
| Post 8 (Wrap) | Static image | Figma (bento grid) |

**Posting times (IST):**
- X: 9:00 PM IST — Monday or Thursday
- LinkedIn: 9:30 PM IST — Tuesday or Wednesday (post body first, drop the first comment with link within 60 seconds)
- Product Hunt: 12:31 AM IST (Sep 1) — PH resets at midnight PT, post in the first minutes
- Hacker News: 9:00 PM IST (Sep 1)

---

## 10. Metrics to Track (30-Day)

| Metric | Source | What to Watch |
|--------|--------|---------------|
| GitHub stars | GitHub API | Weekly growth rate. Spike on launch day, then sustained adds |
| npm weekly downloads | npmjs.com/package/aiscrubber | Week-over-week trend. CLI posts (Week 4) should bump this |
| Web app pageviews | Vercel Analytics | Which posts drive the most traffic |
| X impressions | X Analytics | Per-thread performance. Which hooks landed |
| X follower growth | X Analytics | Net new from the campaign |
| LinkedIn impressions | LinkedIn Analytics | Per-post. Track repost count separately |
| HN upvotes | Hacker News | Front page = win |
| PH upvotes | Product Hunt | Top 5 of the day = win |
| Referral sources | Vercel Analytics (referrer) | Which platform sends the most converting traffic |

**Review cadence:** Every Monday morning. Check which posts drove the most stars/installs. Double down on that hook type and content angle the following week. If a post underperforms, note the hook type and avoid repeating it.
