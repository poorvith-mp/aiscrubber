# spec.md — AIScrubber v2.3.0
> **Version:** 1.0.0 | **Created:** 2026-08-19 | **Author:** Poorvith M P
> **Stage:** 1 of 5 — Specification | **Target release:** v2.3.0 (current: v2.2.0)
> **Theme:** Engine depth, verified correctness, navigation clarity
> **Standards:** [AGENTS.md](file:///c:/Users/poorv/projects/AGENTS.md) · [WORKFLOW.md](file:///c:/Users/poorv/projects/WORKFLOW.md)

---

# Document 1 — PRD

## 1. Product Overview

**AIScrubber** — a zero-telemetry, browser-local privacy desk, developer CLI, and MCP server that scrubs secrets and PII out of text, prompts, and media before they reach an LLM, a public issue tracker, or an email thread.

- **Owner:** Poorvith M P
- **Surfaces:** Web (React SPA, Cloudflare) · CLI (`aiscrubber`) · MCP server (`aiscrubber-mcp`)
- **Current version:** 2.2.0 · **Target:** 2.3.0
- **Versioning:** SemVer. This is a MINOR release — new detector coverage and a test harness, no breaking API or CLI changes.
- **Live:** https://aiscrubber.poorvithmp.com

**What v2.3.0 is *not*:** a feature-count release. It adds no sixth engine. It makes the five existing engines demonstrably correct and easier to navigate.

## 2. Problem Statement

AIScrubber's entire value proposition is a negative claim: *"the thing you pasted did not leak."* A user cannot verify that claim. They paste text, see tokens appear, and trust the result.

Three problems follow:

**P1 — The detectors have measured, reproducible blind spots.** Direct probing of `src/lib/scrub.ts` regexes on 2026-08-19 produced:

| Detector | Input | Result |
|---|---|---|
| `secret` | Google API key `AIza…` | **MISSED** |
| `secret` | GitHub fine-grained PAT `github_pat_…` | **MISSED** |
| `secret` | Stripe live key `sk_live_…` | **MISSED** |
| `secret` | GitLab PAT `glpat-…` | **MISSED** |
| `secret` | SendGrid `SG.…` | **MISSED** |
| `secret` | npm token `npm_…` | **MISSED** |
| `secret` | PEM `-----BEGIN RSA PRIVATE KEY-----` | **MISSED** |
| `secret` | AWS secret access key (40-char) | **MISSED** |
| `secret` | OpenAI `sk-proj-…` *(control)* | caught ✓ |
| `ip` | IPv6 compressed `2001:db8::1` | **MISSED** |
| `ip` | IPv6 loopback `::1` | **MISSED** |
| `phone` | India mobile `+919876543210` | **MISSED** |
| `phone` | India 10-digit `9876543210` | **MISSED** |
| `ssn_dob` | India Aadhaar `1234 5678 9012` | **MISSED** |
| `ssn_dob` | India PAN `ABCDE1234F` | **MISSED** |
| `card` | Luhn-invalid `4111 1111 1111 1112` | **false positive** |
| `card` | Order number `4500 0000 1234 5678` | **false positive** |

Eight of nine tested secret formats are undetected. The `secret` detector catches AWS *access key IDs* (`AKIA…`) but not the *secret access key* that actually grants access. The `ssn_dob` detector is labelled "SSN & National IDs" and described as "US Social Security & **national ID formats**" — plural — but implements only the US SSN pattern. For a product built in India, Aadhaar and PAN are unhandled.

**P2 — Zero tests.** The repository contains no test runner and no test files. `src/lib/` holds ~1,862 lines of pure, deterministic, trivially testable logic — `metadata.ts` (839), `watermark.ts` (432), `scrub.ts` (274), `promptEnhancer.ts` (225), `mediaRedact.ts` (92). A regression here is silent and its consequence is a leaked credential.

**P3 — Navigation is organised around the implementation, not the user's problem.** `NAV_ITEMS` in `App.tsx` is a flat list of nine entries labelled `Engine 1`–`Engine 5`, interleaved with Home, Docs, Legal, and About. A user arrives with *"I have a screenshot with location data"* and must map that onto "Engine 4: Metadata & C2PA Desk." The ordinal numbers carry no information. Meanwhile a real structural fact goes unused: **three engines consume text** (Scrubber, Prompt Masker, Watermark) and **two consume images** (Metadata, Media Redactor).

## 3. Goals and Objectives

| # | Objective | Measured by |
|---|---|---|
| G1 | Close the measured detector gaps | Every row in the §2 table passes |
| G2 | Make correctness verifiable, not asserted | Test suite green in CI, coverage published |
| G3 | Cut time-to-correct-engine for a new visitor | Navigation restructured by input type |
| G4 | Eliminate false positives that erode trust | Luhn validation on cards |
| G5 | Keep the privacy claim honest | README wording matches actual behaviour |

## 4. Success Metrics

| Metric | Baseline | Target |
|---|---|---|
| Secret formats detected (of 9 probed) | 1 | **9** |
| `src/lib/` statement coverage | 0% | **≥ 85%** |
| Card false-positive rate on non-Luhn 16-digit input | 100% | **0%** |
| Detector classes covering India-specific PII | 0 | **3** (Aadhaar, PAN, India phone) |
| Clicks from landing to correct engine | 2–3 + reading 9 labels | **≤ 2**, grouped by input type |

## 5. Target Users & Personas

**Persona A — "The Careful Developer" (primary).** Pastes stack traces, config, and logs into ChatGPT/Claude daily. Knows secrets leak but won't hand-redact. Wants proof, not marketing. **Pain:** doesn't know what the tool misses. **Reached via:** CLI, MCP server.

**Persona B — "The Indian Student/Freelancer" (underserved).** Shares screenshots and documents containing Aadhaar, PAN, and Indian phone numbers. **Pain:** the tool's national-ID detector is US-only, so it silently passes their most sensitive identifiers through untouched.

**Persona C — "The Privacy-Curious Creator."** Strips EXIF/GPS from images and invisible watermarks from AI text. Non-technical. **Pain:** nine nav items with numeric engine labels; unclear which one to open.

## 6. Features & Requirements

### P0 — Must-Have (v2.3.0)

---

#### P0-1 · Test harness + `src/lib/` retrofit

**User story:** *As Poorvith, I want every detector covered by a test, so that a regression fails the build instead of leaking a credential.*

Vitest, configured for the existing Vite 6 + TS 5.7 setup. Retrofit before any behaviour change — the tests must first prove the §2 defects exist (RED), and each subsequent fix turns one red green.

**Acceptance criteria:**
- [ ] `vitest` installed; `npm test` and `npm run test:coverage` scripts exist
- [ ] `src/lib/scrub.ts` — every one of the 8 default detectors has positive **and** negative cases
- [ ] Every row in the §2 defect table has a test that **fails before** its fix and **passes after**
- [ ] `src/lib/watermark.ts` — all five zero-width codepoints (`\u200B \u200C \u200D \uFEFF \u2060`) plus Unicode Tag-Plane
- [ ] `src/lib/promptEnhancer.ts` — mask → export → reconstruct round-trip returns the original byte-for-byte
- [ ] `src/lib/metadata.ts` — EXIF and C2PA parse/strip on fixture images
- [ ] `src/lib/mediaRedact.ts` — redaction region math
- [ ] `src/lib/` statement coverage ≥ 85%
- [ ] Suite runs in CI on every push

**Note:** fixtures must use synthetic credentials only. No real key, ever, per `AGENTS.md` §2 — and the global pre-commit hook will block it anyway.

---

#### P0-2 · Detector coverage expansion

**User story:** *As a developer, I want my Google, GitHub, Stripe, GitLab, and AWS credentials caught, so that "scrubbed" means scrubbed.*

**Acceptance criteria — secrets:**
- [ ] Google API key — `AIza[0-9A-Za-z_-]{35}`
- [ ] GitHub fine-grained PAT — `github_pat_[0-9a-zA-Z_]{22,}`
- [ ] Stripe — `sk_live_`, `pk_live_`, `rk_live_`, and `_test_` variants
- [ ] GitLab PAT — `glpat-[0-9A-Za-z_-]{20,}`
- [ ] SendGrid — `SG\.[\w-]{16,}\.[\w-]{16,}`
- [ ] npm token — `npm_[A-Za-z0-9]{36}`
- [ ] Slack app token — `xapp-`
- [ ] PEM blocks — `-----BEGIN [A-Z ]*PRIVATE KEY-----`
- [ ] AWS secret access key — 40-char base64, **only when contextually adjacent** to an AWS key indicator, to avoid false positives on arbitrary base64
- [ ] Existing `sk-`, `ghp_`, `gho_`, `xox[baprs]-`, `bearer`, `AKIA`, JWT still caught (no regression)

**Acceptance criteria — network:**
- [ ] Compressed IPv6 (`::1`, `2001:db8::1`, `fe80::1%eth0`) detected
- [ ] Full-form IPv6 and IPv4 still detected (no regression)

**Acceptance criteria — India PII (new detector class `national_id_in`):**
- [ ] Aadhaar — 12 digits, optionally space/hyphen grouped `\d{4}[ -]?\d{4}[ -]?\d{4}`, **Verhoeff checksum validated** to avoid matching any 12-digit number
- [ ] PAN — `[A-Z]{5}[0-9]{4}[A-Z]`
- [ ] India mobile — `+91` prefixed and bare 10-digit starting `[6-9]`
- [ ] Detector is **independently toggleable** and its description states the formats it covers

**Acceptance criteria — false positives:**
- [ ] Card detector validates **Luhn**; `4111 1111 1111 1112` and `4500 0000 1234 5678` are **not** redacted
- [ ] `4111 1111 1111 1111` still redacted
- [ ] `ssn_dob` label/description updated so it no longer claims coverage it lacks

**Cross-surface:** every detector change lands in **web, CLI, and MCP**. Shared logic lives in `src/lib/scrub.ts`; `bin/` must import it, not re-implement it. If `bin/` currently duplicates patterns, deduplicate as part of this item.

---

#### P0-3 · Navigation restructure by input type

**User story:** *As a first-time visitor, I want to pick a tool by what I'm holding — text or an image — so that I don't have to decode five engine numbers.*

**Acceptance criteria:**
- [ ] `NAV_ITEMS` regrouped into three sections: **Text** (Scrubber, Prompt Masker, Watermark Remover) · **Images & Files** (Metadata & C2PA, Media Redactor) · **Site** (Home, Docs, Legal, About)
- [ ] `Engine 1`–`Engine 5` ordinals removed from labels; each item carries a short outcome-phrased description (e.g. *"Strip GPS and camera data from photos"*)
- [ ] Tools and site pages are visually distinct — site pages no longer sit in the same flat list as engines
- [ ] Existing hash routes (`#scrub`, `#prompt`, …) **unchanged** — no broken inbound links or bookmarks
- [ ] Keyboard shortcuts `1`–`5`, `H`, `D`, `L`, `A` still work
- [ ] Mobile drawer reflects the same grouping
- [ ] Landing page offers a two-choice entry: *"I have text"* / *"I have an image"*

---

### P1 — Should-Have

- **P1-1 · ReDoS guard on custom rules.** `scrubText` compiles user input via `new RegExp(pattern, 'gi')` with no complexity guard. A pattern like `(a+)+$` typed into the Custom Rules drawer can hang the tab. Mitigate with an execution timeout or a complexity heuristic, and surface a clear inline error.
- **P1-2 · Decompose `MetadataWorkspace.tsx` (1,121 lines).** Extract upload/queue, manifest editor, and export into separate components. Largest file in the codebase and the main obstacle to further UI work.
- **P1-3 · README telemetry wording.** `README.md:21` claims *"zero telemetry, zero server roundtrips"* while `App.tsx:479` renders `<Analytics />` from `@vercel/analytics`. Per decision, analytics **stays**; the wording changes to something accurate — *"Your content never leaves your browser. The site records anonymous pageview counts only."* Add the same disclosure to the Legal workspace.
- **P1-4 · Detector confidence tiers.** Mark high-certainty matches (prefixed keys, Luhn-valid cards) distinctly from heuristic ones (bare IDs) in the diff inspector.

### P2 — Nice-to-Have

- **P2-1 · Cross-engine handoff.** "Send scrubbed output to Prompt Masker" without a copy-paste round trip.
- **P2-2 · Detector coverage page.** A public page listing every format detected, generated from the test suite — turns the trust claim into a verifiable artifact.
- **P2-3 · EU/UK PII class.** IBAN, NI number, EU VAT.
- **P2-4 · Bulk text scrubbing** — multi-file drag-drop for the text engine, mirroring the metadata engine's batch mode.

## 7. Explicitly Out of Scope

- ❌ A sixth engine
- ❌ Any backend, database, user accounts, or auth — the product is browser-local by definition
- ❌ Monetization, paywalls, pricing
- ❌ Removing `@vercel/analytics` (explicitly decided: keep, reword)
- ❌ Rewriting the CLI or MCP server architecture
- ❌ Framework migration — React 19 + Vite 6 + Tailwind 4 stay
- ❌ Component-level UI tests (P0 covers `src/lib/` only)
- ❌ Visual redesign or new brand tokens — navigation **structure** only
- ❌ ML/AI-based detection — regex + checksums only, to preserve offline operation

## 8. User Scenarios

**S1 — Developer pastes a config with a Google key.**
Opens Text Scrubber → pastes `.env` contents → today `AIzaSy…` passes through **unredacted**; after v2.3.0 it becomes `[SECRET_1]`. *Edge:* key split across lines — confirm behaviour is defined and tested.

**S2 — Indian freelancer shares an invoice.**
Pastes text containing PAN `ABCDE1234F` and an Aadhaar number → today both pass through untouched → after v2.3.0 both are tokenised. *Edge:* a 12-digit order number that is not a valid Aadhaar must **not** be redacted — this is what the Verhoeff checksum is for.

**S3 — First-time visitor with a screenshot.**
Lands on Home → picks *"I have an image"* → sees two clearly described options → reaches Metadata desk without reading nine labels.

**S4 — Support engineer scrubs a ticket with a card number.**
Pastes a thread containing a valid card and an order number beginning `4500` → card redacted, order number left alone. Today both are redacted, and the engineer loses information they needed.

**S5 — Custom rule typo.** User types `(a+)+` into Custom Rules → tab must stay responsive and show an inline error (P1-1).

**Error handling:** invalid custom regex → inline message, never a crash. Oversized file → explicit size limit with a clear message. Unsupported image format → named, not silent. Offline → full functionality except the GitHub star count, which degrades silently.

## 9. Dependencies & Constraints

**Locked (unchanged):** react `^19.0.0` · react-dom `^19.0.0` · vite `^6.0.0` · typescript `^5.7.0` · tailwindcss `^4.0.0` · exifr `^7.1.3` · piexifjs `^1.0.6` · jszip `^3.10.1` · lucide-react `^1.27.0` · @vercel/analytics `^1.5.0`

**New (dev only):**
| Package | Version | Purpose |
|---|---|---|
| `vitest` | `^3.0.0` | Test runner — shares Vite 6 config, zero extra build setup |
| `@vitest/coverage-v8` | `^3.0.0` | Coverage reporting |

Verify both against official docs before pinning (`AGENTS.md` — anchor versions against real documentation).

**Constraints:**
- **No new runtime dependencies.** Ponytail ladder: Luhn and Verhoeff are ~15 lines each; a package for either is rung-5 waste.
- **100% client-side.** No detector may require a network call.
- **Three surfaces.** Every detector change ships to web + CLI + MCP or it is incomplete.
- **Node ≥ 18** per `engines`.
- **Bundle size** must not regress meaningfully — this release adds patterns, not libraries.

## 10. Timelines & Milestones

| Milestone | Contents | Gate |
|---|---|---|
| **M1 — Harness** | Vitest wired; failing tests written for every §2 defect | All §2 rows RED and reproducing |
| **M2 — Detectors** | P0-2 in full; each fix turns one RED green | All §2 rows GREEN; no regression |
| **M3 — Coverage** | Remaining `src/lib/` tests | ≥ 85% statements |
| **M4 — Navigation** | P0-3 | Hash routes and shortcuts verified intact |
| **M5 — Release** | CHANGELOG, README wording (P1-3), version bump | Stage 2 exit criteria pass → `gh release create v2.3.0` |

**v2.4.0 (next):** P1-1, P1-2, P1-4 · **v2.5.0:** P2 items

## 11. Non-Functional Requirements

**Performance:** scrub of a 100 KB document completes < 500 ms on mid-range hardware. Adding ~10 patterns must not cause a super-linear slowdown — benchmark before/after. No pattern may exhibit catastrophic backtracking.

**Security:** synthetic fixtures only, never a real credential. No detector performs I/O. Custom regex is user-supplied input and must be treated as untrusted (P1-1). Global pre-commit hook (`~/.githooks/pre-commit`) is active and must not be bypassed for this work.

**Accessibility:** WCAG 2.1 AA. Restructured navigation must retain full keyboard operability; section groupings need correct landmark/`aria` semantics; 4.5:1 contrast on all nav states; visible focus indicators; `prefers-reduced-motion` respected on the workspace-switch transition.

**Reliability:** the round-trip guarantee — mask → export key → reconstruct — must return the original **byte-for-byte**, including Unicode and emoji. This is the single highest-consequence invariant in the product and needs an explicit test.

**Scalability:** N/A — no backend, no shared state.

---

# Document 2 — App Flow

## Screen hierarchy (v2.3.0)

```
Home (#home)
├── "I have text" ──────────┐
│                            ├── Text Scrubber      (#scrub)     — remove secrets & PII from text
│                            ├── Prompt Masker      (#prompt)    — mask, ask an AI, reconstruct
│                            └── Watermark Remover  (#watermark) — strip invisible AI watermarks
├── "I have an image/file" ─┐
│                            ├── Metadata & C2PA    (#metadata)  — strip GPS, EXIF, AI credentials
│                            └── Media Redactor     (#media)     — black out regions of an image
└── Site
    ├── Documentation & CLI  (#docs)
    ├── Privacy & Terms      (#legal)
    └── About & Founder      (#about)
```

**Hash routes are unchanged.** Only grouping, labelling, and description change.

## Core flows

**F1 — Scrub text.** Home → *I have text* → Text Scrubber → paste → live detection → review diff inspector → toggle detectors / add custom rules → copy scrubbed output → optionally export mapping key.
*Decision point:* if a match looks wrong, the user disables that detector or edits the rule. The diff inspector must make **why** a token was redacted visible on hover.

**F2 — Zero-exposure prompt round trip.** Prompt Masker → paste raw prompt → mask → export `.aiscrub.json` → take masked prompt to an external AI → return → paste response + key → reconstruct.
*Critical invariant:* reconstruction is byte-exact. *Edge:* the AI alters a token (`{{API_SECRET_1}}` → `{{API_SECRET1}}`) — reconstruction must report which tokens failed to resolve rather than silently returning broken output.

**F3 — Strip image metadata.** *I have an image* → Metadata & C2PA → upload (single or batch) → inspect manifest → strip → export (file or ZIP).

**F4 — Remove watermarks.** *I have text* → Watermark Remover → paste → threat score + heatmap → strip → copy.

**F5 — Redact image regions.** *I have an image* → Media Redactor → upload → draw regions → flatten → export.

## Navigation map

Persistent left dock (desktop) / collapsible drawer (mobile), three sections: **Text** · **Images & Files** · **Site**. Active state reflects current hash. Shortcuts `1`–`5` map to engines in dock order; `H`/`D`/`L`/`A` to site pages.

## Error handling

| Condition | Behaviour |
|---|---|
| Invalid custom regex | Inline error under the field; other rules keep working; never crash |
| Runaway custom regex | Abort after timeout, inline warning (P1-1) |
| Unknown hash route | Fall back to `#home` — existing behaviour, keep |
| Unsupported file type | Named error stating accepted formats |
| File too large | Explicit limit stated before upload, not after failure |
| Reconstruction key mismatch | List unresolved tokens; never return partially-restored output silently |
| Offline | Everything works except GitHub star count, which fails silently |

## Responsive behaviour

**Desktop ≥ 1024px:** persistent left dock with section headers; workspace fills remaining width; diff inspector side-by-side.
**Tablet 768–1023px:** dock collapses to icons with tooltips; diff inspector stacks.
**Mobile < 768px:** drawer navigation preserving the three-section grouping; single-column workspaces; diff inspector becomes stacked before/after; batch upload retains the existing mobile treatment from v2.2.0.

---

# Document 3 — Tech Stack

## Stack overview

**Pattern:** client-only SPA + two Node CLI binaries sharing one logic core.
**Justification:** the product's core promise is that data never leaves the device. Any server component would contradict it. The CLI and MCP server exist so the same guarantee is available inside terminals and agent runtimes.

```
src/lib/*.ts   ← single source of detection logic
   ├── src/components/*  (web)
   ├── bin/aiscrubber.js (CLI)
   └── bin/aiscrubber-mcp.js (MCP server)
```

**Architectural requirement for this release:** if `bin/` re-implements any detector pattern, that duplication is removed as part of P0-2. One definition, three consumers — otherwise the surfaces drift and only one gets fixed.

## Frontend

| Concern | Choice | Version |
|---|---|---|
| Framework | React | `^19.0.0` |
| Build | Vite | `^6.0.0` |
| Language | TypeScript | `^5.7.0` |
| Styling | Tailwind CSS + `@tailwindcss/vite` | `^4.0.0` |
| Icons | lucide-react | `^1.27.0` |
| State | React `useState` / `useEffect` — **no state library** | — |
| Routing | `window.location.hash` — **no router library** | — |
| EXIF | exifr `^7.1.3`, piexifjs `^1.0.6` | — |
| Archive | jszip `^3.10.1` | — |
| Analytics | @vercel/analytics `^1.5.0` | — |

State and routing stay dependency-free — rung 4 of the Ponytail ladder. The app has nine views and no server state; a router and a state library would both be speculative.

## Testing (new)

| Concern | Choice | Version |
|---|---|---|
| Runner | vitest | `^3.0.0` |
| Coverage | @vitest/coverage-v8 | `^3.0.0` |
| Environment | `node` for `src/lib/`; `jsdom` only if component tests are added later | — |

Vitest chosen because it reuses the existing Vite 6 config directly — no parallel build pipeline, no extra transform layer. Jest would require its own toolchain for zero benefit here.

## DevOps & git strategy

- **Branch:** `feat/v2.3.0-engine-depth` off `main`
- **Worktree:** if Codex and Antigravity are ever active simultaneously, use `skills/using-git-worktrees/`
- **Commits:** per checklist item, explicit paths, `git add .` banned (`AGENTS.md` §2)
- **Hook:** global `~/.githooks/pre-commit` is active — do not bypass
- **CI:** GitHub Actions running `npm test` and `npm run build` on push
- **Hosting:** Cloudflare (`wrangler.jsonc`), unchanged
- **Release:** `gh release create v2.3.0`

## Development tooling

TypeScript strict via existing `tsconfig.app.json`. No ESLint/Prettier config currently exists — **not introduced in this release** (out of scope; adding a lint stack mid-feature is exactly the speculative tooling the Ponytail ladder warns about).

## Environment variables

**None.** The application requires zero environment variables — no `.env` file, no keys, no runtime configuration. This is a deliberate property of a browser-local tool and should be stated in the README as evidence for the privacy claim.

## Scripts

```jsonc
{
  "dev":           "vite",
  "build":         "tsc -p tsconfig.app.json && vite build",
  "preview":       "vite preview",
  "test":          "vitest run",           // new
  "test:watch":    "vitest",               // new
  "test:coverage": "vitest run --coverage" // new
}
```

## Security & upgrade policy

No auth, no sessions, no tokens, no rate limiting — there is no server. Security surface is limited to: (a) user-supplied regex as untrusted input, (b) file parsing of untrusted images, (c) the correctness of the detectors themselves, which is what P0-1 and P0-2 address. Dependency upgrades: patch freely, minor after tests pass, major only with a deliberate decision recorded here.

---

# Document 4 — Frontend Guidelines

## Design principles

1. **Clarity over cleverness** — a privacy tool that confuses its user has failed.
2. **Evidence over assertion** — show what was detected and why; the diff inspector is the product's proof surface.
3. **Task-first structure** — organise by what the user is holding, not by internal architecture.
4. **Accessible by default** — WCAG 2.1 AA is a floor.

## Platinum Product Theatre tokens

| Token | Hex |
|---|---|
| Carbon (dark bg) | `#08090b` |
| Porcelain (light bg) | `#eff0f1` |
| Graphite (surface) | `#131417` |
| Champagne Gold (accent) | `#cda03a` |
| Gold Highlight | `#ffe48b` |
| Gold Text | `#f4cf70` |

Existing CSS custom properties (`--surface-sunken`, `--line`, `--accent`, `--text`) already implement this and support light/dark. **No token changes in this release.**

## Typography

Instrument Serif — headlines and hero quotes · Geist — body, labels, UI · Geist Mono — stats, code, tokens, `@handles`.

Redaction tokens (`[SECRET_1]`) and detector patterns must render in **Geist Mono** — they are code-like and need unambiguous character shapes.

## Component standards for this release

**Navigation section header** — new. Uppercase, letter-spaced, muted, non-interactive. Groups: Text · Images & Files · Site.

**Nav item** — gains a one-line outcome description on desktop. States: default, hover, active, focus-visible, disabled. Active state must not rely on colour alone.

**Home entry cards** — two large choices ("I have text" / "I have an image"), each listing the engines beneath it.

**Detector toggle** — must show which formats it covers, so a user can tell whether their case is handled. This is the UI half of the trust fix.

**Inline error** — for invalid custom regex. Adjacent to the field, `aria-describedby`, never a modal.

## Accessibility

- 4.5:1 contrast minimum on all nav states in both themes
- Visible focus indicator on every interactive element
- Full keyboard operation; shortcuts `1`–`5`, `H`, `D`, `L`, `A` preserved
- Nav sections use correct landmark and heading semantics — not styled `div`s
- `prefers-reduced-motion` respected on workspace transitions
- Diff inspector redactions conveyed by more than colour (icon or underline)
- Batch upload progress announced via `aria-live`

---

# Document 5 — Backend Structure

**N/A — by design.**

AIScrubber has no backend, no database, no API, no authentication, and no server-side state. All processing is browser-local or local-Node (CLI/MCP). Introducing any server component would directly contradict the product's core guarantee.

The only outbound network calls in the entire application are:
1. `@vercel/analytics` — anonymous pageview beacons (disclosed per P1-3)
2. GitHub API — public star count, degrades silently offline

Neither touches user content. This must remain true.

---

# Document 6 — Implementation Plan

> For **Codex**. Work phases in order. Every code change follows RED → GREEN → REFACTOR. Show fresh test output before marking any item complete. Stop and ask if any acceptance criterion is ambiguous.

## Phase 0 — Setup
- [ ] 0.1 Branch `feat/v2.3.0-engine-depth` from `main`
- [ ] 0.2 Confirm `.gitignore` covers `.env*.local`; confirm global pre-commit hook active
- [ ] 0.3 Install `vitest@^3` and `@vitest/coverage-v8@^3` (dev). Verify versions against official docs first
- [ ] 0.4 Add `test`, `test:watch`, `test:coverage` scripts
- [ ] 0.5 `vitest.config.ts` — node environment, coverage over `src/lib/**`
- [ ] 0.6 Commit: `chore(test): add vitest harness`

## Phase 1 — RED: prove every defect
> Write only failing tests here. Do not fix anything yet. This phase produces the evidence base.

- [ ] 1.1 `src/lib/scrub.test.ts` — control cases that already pass (OpenAI `sk-`, IPv4, full IPv6, US SSN, US phone, valid Visa)
- [ ] 1.2 Failing: 8 secret formats — Google, GitHub PAT, Stripe, GitLab, SendGrid, npm, PEM, AWS secret key
- [ ] 1.3 Failing: compressed IPv6 — `::1`, `2001:db8::1`
- [ ] 1.4 Failing: India phone — `+919876543210`, `9876543210`
- [ ] 1.5 Failing: Aadhaar and PAN
- [ ] 1.6 Failing: Luhn — `4111 1111 1111 1112` and `4500 0000 1234 5678` must NOT redact
- [ ] 1.7 Run suite. **Show output.** Expect exactly the §2 table: controls green, defects red
- [ ] 1.8 Commit: `test(scrub): add failing cases for known detector gaps`

## Phase 2 — GREEN: close the gaps
> One fix per commit. Each turns specific reds green without breaking controls.

- [ ] 2.1 Secret patterns: Google, GitHub PAT, Stripe, GitLab, SendGrid, npm, Slack app, PEM
- [ ] 2.2 AWS secret access key with adjacency requirement — verify no false positives on ordinary base64
- [ ] 2.3 Compressed IPv6
- [ ] 2.4 Luhn helper (hand-written, ~15 lines) + wire into card detector
- [ ] 2.5 Verhoeff helper (hand-written) for Aadhaar
- [ ] 2.6 New `national_id_in` detector — Aadhaar + PAN, independently toggleable, honest description
- [ ] 2.7 India phone formats
- [ ] 2.8 Correct `ssn_dob` label/description to match actual coverage
- [ ] 2.9 Full suite green. **Show output**
- [ ] 2.10 Benchmark 100 KB scrub before/after; confirm < 500 ms and no super-linear regression

## Phase 3 — Cross-surface parity
- [ ] 3.1 Audit `bin/aiscrubber.js` and `bin/aiscrubber-mcp.js` for duplicated detector logic
- [ ] 3.2 If duplicated, refactor both to import from the shared core. **One definition, three consumers**
- [ ] 3.3 Tests proving CLI and MCP produce identical results to web for the full §2 table
- [ ] 3.4 Commit: `refactor(cli,mcp): share detector core with web`

## Phase 4 — Remaining lib coverage
- [ ] 4.1 `watermark.ts` — five zero-width codepoints, Tag-Plane, threat scoring
- [ ] 4.2 `promptEnhancer.ts` — **byte-exact** round trip incl. Unicode/emoji; unresolved-token reporting
- [ ] 4.3 `metadata.ts` — EXIF + C2PA parse/strip on synthetic fixtures
- [ ] 4.4 `mediaRedact.ts` — region math
- [ ] 4.5 Coverage ≥ 85% on `src/lib/`. **Show the coverage report**

## Phase 5 — Navigation
- [ ] 5.1 Restructure `NAV_ITEMS` into Text / Images & Files / Site
- [ ] 5.2 Drop `Engine N` ordinals; add outcome-phrased descriptions
- [ ] 5.3 Section headers with correct landmark semantics
- [ ] 5.4 Home: two-choice entry cards
- [ ] 5.5 Mobile drawer mirrors grouping
- [ ] 5.6 **Verify every existing hash route still resolves** and all shortcuts still fire
- [ ] 5.7 Contrast and focus-visible audit on new nav states, both themes

## Phase 6 — CI
- [ ] 6.1 GitHub Actions: `npm test` + `npm run build` on push
- [ ] 6.2 Confirm green on the branch

## Phase 7 — Release prep
- [ ] 7.1 README: update detector coverage list to reality
- [ ] 7.2 README + Legal: telemetry wording per P1-3
- [ ] 7.3 README: state "requires zero environment variables" as privacy evidence
- [ ] 7.4 CHANGELOG for v2.3.0
- [ ] 7.5 Bump `package.json` to `2.3.0`
- [ ] 7.6 Verify Stage 2 exit criteria (`AGENTS.md`)
- [ ] 7.7 Hand back to Claude Code for `test.md`

**Do not cut the release from this phase.** Stage 4 (Antigravity) cuts it after `test.md` triage is closed.

---

## Revision Log

| Version | Date | Change |
|---|---|---|
| 1.0.0 | 2026-08-19 | Initial spec. Defect table in §2 produced by direct probing of `src/lib/scrub.ts` regexes; controls confirm the patterns work and the gaps are genuine coverage gaps. |
