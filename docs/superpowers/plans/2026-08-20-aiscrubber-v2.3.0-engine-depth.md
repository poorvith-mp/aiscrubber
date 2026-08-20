# AIScrubber v2.3.0 Engine Depth Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make AIScrubber's detector claim verifiable across web, CLI, and MCP; close the measured secret/PII gaps; and reorganize navigation around text versus image/file tasks.

**Architecture:** Keep one browser-and-Node-compatible detector runtime in `src/lib/scrubCore.js`, with an adjacent declaration file for strict TypeScript consumers. `src/lib/scrub.ts` remains the typed web adapter for custom rules and diff segments, while both Node binaries import the same runtime rather than carrying regex copies. Navigation data moves into a pure typed model so grouping, hashes, and shortcuts can be unit-tested without adding a component-test stack.

**Tech Stack:** React 19, TypeScript 5.7, Vite 6, Tailwind CSS 4, Node 18+ ESM, Vitest 3.2.7, `@vitest/coverage-v8` 3.2.7, GitHub Actions, Cloudflare Workers static assets.

**Spec:** `spec.md`

## Global Constraints

- Work directly on the existing `main` branch. Do not create a branch or worktree; this overrides Document 3 and Document 6 branch instructions in `spec.md`.
- Follow RED → GREEN → REFACTOR for every production behavior change. A failing test must demonstrate the intended defect before its fix.
- Pin the two new dev dependencies exactly: `vitest@3.2.7` and `@vitest/coverage-v8@3.2.7`. Vitest v3 officially supports Node 18+ and Vite 5+, and both 3.2.7 packages exist in the npm registry.
- Add no runtime dependency. Luhn, Verhoeff, IPv6 validation, and detector matching stay local and deterministic.
- Use synthetic credentials and identifiers only. Never place a real key, token, Aadhaar number, PAN, or card number in fixtures.
- Preserve all public web hashes: `#home`, `#scrub`, `#prompt`, `#watermark`, `#metadata`, `#media`, `#docs`, `#legal`, `#about`.
- Preserve shortcut mapping: `1`–`5`, `H`, `D`, `L`, `A`; ignore shortcuts while focus is in an input, textarea, select, or editable element.
- Keep `@vercel/analytics`; state precisely that user content stays local while anonymous pageview counts are recorded.
- Coverage gate: at least 85% statements across `src/lib/**/*.{ts,js}`.
- Performance gate: 100 KB scrub completes in under 500 ms on the verification machine.
- P1-1, P1-2, P1-4, and all P2 items remain deferred. Only P1-3 is included because the spec's v2.3.0 release phase explicitly requires it.
- Release authorization was granted after plan approval: push main, deploy the verified build, and cut the v2.3.0 GitHub release.

## Approval Prerequisite: Aadhaar Fixture Correction

`spec.md` §2 says `1234 5678 9012` should be detected as Aadhaar, while P0-2 requires Verhoeff validation. That number fails Verhoeff, and the `1` prefix is invalid for Aadhaar. Use the synthetic Verhoeff-valid number `2345 6789 0124` as the positive case and keep `2345 6789 0125` as a negative checksum case.

The spec also asks Node 18 binaries to import `src/lib/scrub.ts` directly. Node 18 cannot execute TypeScript without an additional loader/runtime dependency, which the spec forbids. The plan resolves this by putting the one executable detector definition in `src/lib/scrubCore.js`, shipping it with the package, and retaining `src/lib/scrub.ts` as the strict typed web adapter. Approval of this plan approves that compatibility bridge.

## File Structure

- Create `vitest.config.ts` — Node test environment and 85% V8 coverage gate.
- Create `src/lib/scrubCore.js` — single runtime definition of detectors, validators, matching, and tokenization for browser + Node.
- Create `src/lib/scrubCore.d.ts` — strict contracts for the JavaScript runtime.
- Modify `src/lib/scrub.ts` — typed web adapter; custom-rule matching; exported web result shape.
- Create `src/lib/navigation.ts` — pure navigation groups, hashes, and shortcut resolution.
- Modify `src/App.tsx` — semantic grouped dock/drawer and keyboard handling.
- Modify `src/components/HomeWorkspace.tsx` — task-first text/image entry cards and honest telemetry copy.
- Modify `src/components/ScrubberWorkspace.tsx` — ninth independently toggleable detector and format descriptions.
- Modify `src/components/LegalWorkspace.tsx`, `README.md`, and `index.html` — accurate pageview/content-processing disclosure.
- Modify `bin/aiscrubber.js` and `bin/aiscrubber-mcp.js` — adapters over `scrubCore.js`, no detector copies.
- Create `src/lib/*.test.ts` and `tests/fixtures/metadataFixtures.ts` — deterministic logic and fixture coverage.
- Create `src/lib/scrub.performance.test.ts` — deterministic 100 KB latency gate.
- Modify `tests/brand-assets.test.mjs` — run the existing identity contract inside Vitest.
- Create `.github/workflows/ci.yml` — tests, coverage artifact, and production build on pushes.
- Create `CHANGELOG.md`; update package and surfaced version strings to 2.3.0.

---

### Task 1: Install and Prove the Test Harness

**Files:**
- Modify: `package.json`
- Modify: `package-lock.json`
- Create: `vitest.config.ts`
- Modify: `tests/brand-assets.test.mjs`
- Create: `src/lib/scrub.test.ts`

**Interfaces:**
- Produces: `npm test`, `npm run test:watch`, `npm run test:coverage`.
- Produces: coverage threshold over `src/lib/**/*.{ts,js}` with V8.
- Consumes: current `scrubText`, `defaultDetectors`, and `DetectorId` from `src/lib/scrub.ts`.

- [ ] **Step 1: Confirm setup gates**

Run:

```powershell
git rev-parse --show-toplevel
git branch --show-current
Select-String -Path .gitignore -Pattern '^\.env|\.env\*\.local|\.env\.local|\.env\.production'
```

Expected: repository root is `C:/Users/poorv/projects/own/aiscrubber`, branch is `main`, and `.env*` coverage is present.

- [ ] **Step 2: Install the exact test packages**

Run:

```powershell
npm install --save-dev --save-exact vitest@3.2.7 @vitest/coverage-v8@3.2.7
```

Add scripts:

```json
{
  "test": "vitest run",
  "test:watch": "vitest",
  "test:coverage": "vitest run --coverage"
}
```

- [ ] **Step 3: Configure Vitest and coverage**

Create `vitest.config.ts`:

```ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    coverage: {
      provider: 'v8',
      include: ['src/lib/**/*.{ts,js}'],
      exclude: ['src/lib/**/*.test.ts'],
      reporter: ['text', 'html', 'json-summary'],
      thresholds: { statements: 85 },
    },
  },
});
```

- [ ] **Step 4: Bring the existing brand contract under Vitest**

Replace the `node:test` imports in `tests/brand-assets.test.mjs` with:

```js
import { expect, test } from 'vitest';
```

Replace `assert.equal(actual, expected)` with `expect(actual).toBe(expected)` so `npm test` owns every repository test.

- [ ] **Step 5: Write controls and all known failing scrub cases**

Create `src/lib/scrub.test.ts` with a helper and explicit tables:

```ts
import { describe, expect, it } from 'vitest';
import { defaultDetectors, scrubText, type DetectorId } from './scrub';

const all = () => new Set(defaultDetectors.map(({ id }) => id));
const scrub = (source: string) => scrubText(source, all());

const secretCases = [
  ['Google', `AIza${'A'.repeat(35)}`],
  ['GitHub fine-grained PAT', `github_pat_${'A'.repeat(22)}`],
  ['Stripe live', `sk_live_${'A'.repeat(24)}`],
  ['Stripe test', `pk_test_${'A'.repeat(24)}`],
  ['GitLab', `glpat-${'A'.repeat(20)}`],
  ['SendGrid', `SG.${'A'.repeat(16)}.${'B'.repeat(16)}`],
  ['npm', `npm_${'A'.repeat(36)}`],
  ['Slack app', `xapp-${'A'.repeat(20)}`],
  ['PEM', '-----BEGIN RSA PRIVATE KEY-----'],
  ['AWS contextual', `AWS_SECRET_ACCESS_KEY=${'A'.repeat(40)}`],
] as const;

describe('known detector gaps', () => {
  it.each(secretCases)('redacts %s', (_name, source) => {
    expect(scrub(source).counts.secret).toBe(1);
  });

  it.each(['::1', '2001:db8::1', 'fe80::1%eth0'])('redacts compressed IPv6 %s', (source) => {
    expect(scrub(source).counts.ip).toBe(1);
  });

  it.each(['+919876543210', '9876543210'])('redacts Indian phone %s', (source) => {
    expect(scrub(source).counts.phone).toBe(1);
  });

  it('redacts valid synthetic Aadhaar and PAN independently', () => {
    expect(scrub('2345 6789 0124 ABCDE1234F').totalRedactions).toBe(2);
  });

  it.each(['4111 1111 1111 1112', '4500 0000 1234 5678'])('keeps non-Luhn card-like input %s', (source) => {
    expect(scrub(source).counts.card).toBeUndefined();
  });
});
```

Add passing controls for: email, IPv4, full IPv6, URL, valid Visa `4111 1111 1111 1111`, OpenAI `sk-proj-`, GitHub `ghp_`, `gho_`, Slack `xoxb-`, bearer, `AKIA`, JWT, selected identifier, US SSN, US phone, empty input, repeated values, overlaps, custom literal/regex rules, invalid custom regex, and `restoreTextWithMapping`.

Add one negative per original detector: `user@localhost`, `12345`, `999.999.999.999`, `example.test/path`, `4111 1111 1111 1112`, `sk-short`, `ORDER-12`, and `123-45-678`. Define split-across-lines credentials as a negative: a Google key or PAT broken by `\n` is not a contiguous credential and must remain unchanged.

- [ ] **Step 6: Run RED and record the exact failures**

Run:

```powershell
npm test -- --run src/lib/scrub.test.ts
```

Expected: existing controls pass; the secret, compressed IPv6, India phone, India ID, and non-Luhn expectations fail for their stated behavior.

- [ ] **Step 7: Commit the harness and RED evidence**

```powershell
git add -A -- package.json package-lock.json vitest.config.ts tests/brand-assets.test.mjs src/lib/scrub.test.ts
git commit -m "test(scrub): add harness and known detector gaps"
```

---

### Task 2: Extract One Detector Runtime for Web, CLI, and MCP

**Files:**
- Create: `src/lib/scrubCore.js`
- Create: `src/lib/scrubCore.d.ts`
- Modify: `src/lib/scrub.ts`
- Modify: `src/lib/promptEnhancer.ts`
- Modify: `bin/aiscrubber.js`
- Modify: `bin/aiscrubber-mcp.js`
- Modify: `package.json`
- Create: `src/lib/crossSurface.test.ts`

**Interfaces:**
- Produces: `detectorDefinitions: readonly CoreDetector[]`.
- Produces: `collectBuiltInMatches(source: string, enabledIds?: ReadonlySet<DetectorId>): CoreMatch[]`.
- Produces: `tokenizeMatches(source: string, matches: CoreMatch[]): CoreScrubResult`.
- Produces: `scrubBuiltIns(source: string, enabledIds?: ReadonlySet<DetectorId>): CoreScrubResult`.
- Consumes: binaries adapt `CoreScrubResult.text`, `.mappings`, `.counts`, `.totalRedactions` to their unchanged public output shapes.

- [ ] **Step 1: Write cross-surface parity tests against current behavior**

Create `src/lib/crossSurface.test.ts`. Use the real processes, not imported private helpers:

```ts
import { spawnSync } from 'node:child_process';
import { describe, expect, it } from 'vitest';
import { defaultDetectors, scrubText } from './scrub';

const all = new Set(defaultDetectors.map(({ id }) => id));

function runCli(source: string) {
  const run = spawnSync(process.execPath, ['bin/aiscrubber.js', 'scrub', source, '--json'], { encoding: 'utf8' });
  expect(run.status).toBe(0);
  return JSON.parse(run.stdout);
}

function runMcp(source: string) {
  const request = JSON.stringify({
    jsonrpc: '2.0', id: 1, method: 'tools/call',
    params: { name: 'scrub_text', arguments: { text: source } },
  });
  const run = spawnSync(process.execPath, ['bin/aiscrubber-mcp.js'], { input: `${request}\n`, encoding: 'utf8' });
  expect(run.status).toBe(0);
  const response = JSON.parse(run.stdout.trim());
  return JSON.parse(response.result.content[0].text);
}

describe('surface parity', () => {
  it('redacts the same values in web, CLI, and MCP', () => {
    const source = 'Email dev@example.test from 192.168.1.10 with sk-proj-AAAAAAAAAAAA';
    const web = scrubText(source, all);
    expect(runCli(source).scrubbed).toBe(web.text);
    expect(runMcp(source).scrubbed).toBe(web.text);
  });
});
```

- [ ] **Step 2: Run parity RED**

Run:

```powershell
npm test -- --run src/lib/crossSurface.test.ts
```

Expected: FAIL because the three duplicated implementations produce different matching/token behavior.

- [ ] **Step 3: Define the shared runtime contract**

`scrubCore.d.ts` must declare:

```ts
export type DetectorId = 'email' | 'phone' | 'ip' | 'url' | 'card' | 'secret' | 'identifier' | 'ssn_dob' | 'national_id_in';
export interface CoreMatch { start: number; end: number; value: string; token: string; detectorId: DetectorId }
export interface CoreDetector { id: DetectorId; label: string; token: string; description: string }
export interface CoreMapping { token: string; original: string; detectorId: DetectorId; count: number }
export interface CoreScrubResult {
  text: string;
  counts: Partial<Record<DetectorId, number>>;
  mappings: CoreMapping[];
  matches: CoreMatch[];
  totalRedactions: number;
}
export const detectorDefinitions: readonly CoreDetector[];
export function collectBuiltInMatches(source: string, enabledIds?: ReadonlySet<DetectorId>): CoreMatch[];
export function tokenizeMatches(source: string, matches: CoreMatch[]): CoreScrubResult;
export function scrubBuiltIns(source: string, enabledIds?: ReadonlySet<DetectorId>): CoreScrubResult;
export function isLuhnValid(value: string): boolean;
export function isVerhoeffValid(value: string): boolean;
export function isValidIpv6(value: string): boolean;
```

In `scrubCore.js`, keep regex state local by cloning every global regex before `matchAll`, sort longer ties first, and remove overlaps once in `tokenizeMatches`. Do not expose mutable global `lastIndex` state.

- [ ] **Step 4: Convert the web module into a typed adapter**

`src/lib/scrub.ts` imports core matches, appends custom-rule matches, then calls `tokenizeMatches`. It remains responsible for `DiffSegment[]` and for custom detector IDs such as `custom_rule_x`; it no longer owns built-in patterns.

- [ ] **Step 5: Convert CLI, MCP, and Prompt Masker into adapters**

Both binaries import:

```js
import { collectBuiltInMatches, scrubBuiltIns } from '../src/lib/scrubCore.js';
```

Delete both `DETECTORS` objects and both local scrub loops. Preserve JSON fields and MCP tool schemas. `promptEnhancer.ts`, CLI `mask`, and MCP `mask_prompt` derive variables from `collectBuiltInMatches` so new formats do not drift.

Add these package files so published binaries can resolve the shared module:

```json
"files": [
  "bin",
  "src/lib/scrubCore.js",
  "src/lib/scrubCore.d.ts",
  "README.md",
  "LICENSE",
  "docs/assets/logo.svg"
]
```

- [ ] **Step 6: Run parity GREEN and package smoke test**

```powershell
npm test -- --run src/lib/crossSurface.test.ts src/lib/scrub.test.ts
npm pack --dry-run
```

Expected: parity passes and the dry-run package includes both shared-core files.

- [ ] **Step 7: Commit the shared runtime**

```powershell
git add -A -- src/lib/scrubCore.js src/lib/scrubCore.d.ts src/lib/scrub.ts src/lib/promptEnhancer.ts src/lib/crossSurface.test.ts bin/aiscrubber.js bin/aiscrubber-mcp.js package.json
git commit -m "refactor(cli,mcp): share detector core with web"
```

---

### Task 3: Close Secret and IPv6 Gaps

**Files:**
- Modify: `src/lib/scrubCore.js`
- Modify: `src/lib/scrub.test.ts`
- Modify: `src/lib/crossSurface.test.ts`

**Interfaces:**
- Consumes: the shared matcher contract from Task 2.
- Produces: contextual AWS capture, compressed IPv6 validation, and all prefixed secret formats across three surfaces.

- [ ] **Step 1: Confirm Task 1 secret/network cases are still RED**

```powershell
npm test -- --run src/lib/scrub.test.ts -t "redacts"
```

- [ ] **Step 2: Add bounded secret patterns**

Use a list of pattern descriptors for the single `secret` detector. The AWS descriptor captures group 1 so only the 40-character value is tokenized:

```js
const SECRET_PATTERNS = [
  { regex: /\bsk-[A-Za-z0-9_-]{12,}\b/gi },
  { regex: /\bghp_[A-Za-z0-9]{36}\b|\bgho_[A-Za-z0-9]{36}\b|\bgithub_pat_[0-9A-Za-z_]{22,}\b/g },
  { regex: /\b(?:sk|pk|rk)_(?:live|test)_[0-9A-Za-z]{16,}\b/g },
  { regex: /\bAIza[0-9A-Za-z_-]{35}\b/g },
  { regex: /\bglpat-[0-9A-Za-z_-]{20,}\b/g },
  { regex: /\bSG\.[\w-]{16,}\.[\w-]{16,}\b/g },
  { regex: /\bnpm_[A-Za-z0-9]{36}\b/g },
  { regex: /\bxapp-[0-9A-Za-z-]{10,}\b/g },
  { regex: /\bxox[baprs]-[A-Za-z0-9-]{10,}\b/g },
  { regex: /\bbearer\s+[A-Za-z0-9._~+/-]{12,}\b/gi },
  { regex: /\bAKIA[0-9A-Z]{16}\b/g },
  { regex: /\bey[A-Za-z0-9_-]{10,}\.[A-Za-z0-9._-]{10,}\.[A-Za-z0-9._-]{10,}\b/g },
  { regex: /-----BEGIN [A-Z ]*PRIVATE KEY-----/g },
  { regex: /\b(?:AWS_SECRET_ACCESS_KEY|aws[ _-]?secret(?:[ _-]?access)?[ _-]?key)\s*[:=]\s*["']?([A-Za-z0-9/+=]{40})["']?/gi, valueGroup: 1 },
];
```

Add negatives for an arbitrary 40-character base64 string with no AWS label, a 34-character `AIza` suffix, a short PAT, and a public PEM certificate header.

- [ ] **Step 3: Add compressed IPv6 candidate validation**

Candidate regex:

```js
/(?<![0-9A-Fa-f:])(?:[0-9A-Fa-f]{0,4}:){2,7}[0-9A-Fa-f]{0,4}(?:%[0-9A-Za-z_.-]+)?(?![0-9A-Fa-f:])/g
```

`isValidIpv6` strips the optional zone, rejects multiple `::`, requires exactly eight hextets without compression or fewer than eight with compression, and requires each hextet to be 1–4 hexadecimal characters. Add negatives for `2001:::1`, `1:2:3`, and nine hextets.

- [ ] **Step 4: Run scrub and parity GREEN**

```powershell
npm test -- --run src/lib/scrub.test.ts src/lib/crossSurface.test.ts
```

- [ ] **Step 5: Commit the secret/network behavior**

```powershell
git add -A -- src/lib/scrubCore.js src/lib/scrub.test.ts src/lib/crossSurface.test.ts
git commit -m "feat(scrub): expand secret and IPv6 detection"
```

---

### Task 4: Add Luhn and India PII Correctness

**Files:**
- Modify: `src/lib/scrubCore.js`
- Modify: `src/lib/scrubCore.d.ts`
- Modify: `src/lib/scrub.test.ts`
- Modify: `src/lib/crossSurface.test.ts`
- Modify: `src/components/ScrubberWorkspace.tsx`
- Create: `src/lib/scrub.performance.test.ts`

**Interfaces:**
- Produces: `isLuhnValid`, `isVerhoeffValid`.
- Produces: independently toggleable `national_id_in` detector with token prefix `INDIA_ID`.

- [ ] **Step 1: Confirm card and India cases are RED**

```powershell
npm test -- --run src/lib/scrub.test.ts -t "Luhn|Indian|Aadhaar|PAN"
```

- [ ] **Step 2: Implement and test Luhn**

```js
export function isLuhnValid(value) {
  const digits = value.replace(/\D/g, '');
  if (digits.length < 13 || digits.length > 19) return false;
  let sum = 0;
  let double = false;
  for (let index = digits.length - 1; index >= 0; index -= 1) {
    let digit = Number(digits[index]);
    if (double) { digit *= 2; if (digit > 9) digit -= 9; }
    sum += digit;
    double = !double;
  }
  return sum % 10 === 0;
}
```

Run the card pattern first, then accept only matches for which `isLuhnValid(match[0])` is true.

- [ ] **Step 3: Implement and test Verhoeff**

Use the standard multiplication (`d`), permutation (`p`), and inverse (`inv`) tables as literal arrays in `scrubCore.js`. `isVerhoeffValid` removes spaces/hyphens, requires exactly 12 digits, folds reversed digits with `d[c][p[index % 8][digit]]`, and returns `c === 0`.

Positive: `2345 6789 0124`. Negatives: `2345 6789 0125`, `23456789012`, and `2345-ABCD-0124`.

- [ ] **Step 4: Add the ninth detector and India phone**

Add:

```js
{
  id: 'national_id_in',
  label: 'India IDs',
  token: 'INDIA_ID',
  description: 'Verhoeff-valid Aadhaar and PAN formats',
  patterns: [
    { regex: /(?<!\d)\d{4}[ -]?\d{4}[ -]?\d{4}(?!\d)/g, validate: isVerhoeffValid },
    { regex: /\b[A-Z]{5}[0-9]{4}[A-Z]\b/g },
  ],
}
```

Extend phone matching with `+91` and bare `[6-9]\d{9}` while retaining current international/regional formats. Change `ssn_dob` label to `US SSN` and description to `US Social Security number format`.

- [ ] **Step 5: Verify independent toggling and three-surface parity**

Add a test that enables only `national_id_in`, redacts Aadhaar/PAN, and leaves the same India phone unchanged. Extend the parity table with valid Aadhaar, PAN, India phone, valid/invalid cards.

Run:

```powershell
npm test -- --run src/lib/scrub.test.ts src/lib/crossSurface.test.ts
```

- [ ] **Step 6: Add the 100 KB performance regression test**

Create a deterministic 100 KB input from repeated safe log lines plus one match of every detector, measure five iterations using `performance.now()`, and assert the median is below 500 ms. Record the current-main baseline in the commit message body and the post-change median in the test output.

- [ ] **Step 7: Run the performance gate and commit India PII/Luhn**

```powershell
npm test -- --run src/lib/scrub.test.ts src/lib/crossSurface.test.ts src/lib/scrub.performance.test.ts
git add -A -- src/lib/scrubCore.js src/lib/scrubCore.d.ts src/lib/scrub.test.ts src/lib/crossSurface.test.ts src/lib/scrub.performance.test.ts src/components/ScrubberWorkspace.tsx
git commit -m "feat(scrub): validate cards and add India PII"
```

---

### Task 5: Cover Watermark, Prompt, Metadata, and Media Logic

**Files:**
- Create: `src/lib/watermark.test.ts`
- Create: `src/lib/promptEnhancer.test.ts`
- Create: `src/lib/metadata.test.ts`
- Create: `src/lib/mediaRedact.test.ts`
- Create: `tests/fixtures/metadataFixtures.ts`
- Modify: `src/lib/metadata.ts`
- Modify: `src/lib/mediaRedact.ts`

**Interfaces:**
- Produces: `normalizeRedactionBox(box: RedactionBox): { x: number; y: number; width: number; height: number } | null`.
- Preserves: prompt `reconstructedText`, `restoredCount`, `unresolvedPlaceholders` contract.
- Preserves: metadata `detectC2paProvenance`, `parseFileMetadata`, `applyMetadataEdits`, `stripMetadataUniversal` contracts.

- [ ] **Step 1: Add watermark coverage**

Test each of `\u200B`, `\u200C`, `\u200D`, `\uFEFF`, `\u2060`, and `String.fromCodePoint(0xE0061)` individually. Also cover non-standard spaces, homoglyph replacement, cadence replacement, disabled options, threat score, entity offsets, and clean input.

- [ ] **Step 2: Add byte-exact prompt tests**

```ts
it('round-trips Unicode and emoji byte-for-byte', () => {
  const raw = 'Deploy 🔐 for café@example.test with sk-proj-AAAAAAAAAAAA — नमस्ते';
  const masked = enhanceAndMaskPrompt(raw, 'general');
  const exportedKey = JSON.parse(JSON.stringify(masked.sessionKey));
  const restored = reconstructAiResponse(masked.sanitizedPrompt, exportedKey);
  expect(Buffer.from(restored.reconstructedText)).toEqual(Buffer.from(raw));
  expect(restored.unresolvedPlaceholders).toEqual([]);
});
```

Cover all five enhancement goals, duplicate values, `{{TOKEN}}`/`{TOKEN}`/`[TOKEN]` reconstruction, malformed changed token reporting, and an empty variable list.

- [ ] **Step 3: Build synthetic metadata fixtures in code**

`tests/fixtures/metadataFixtures.ts` exports `makeSyntheticPng()` and `makeSyntheticJpeg()`. The PNG uses a 1×1 PNG byte constant. The JPEG starts from a 1×1 base64 JPEG and uses the already-installed `piexifjs` to insert only synthetic Artist, Software, GPS latitude, and GPS longitude tags. Return Blob-like objects with `name`, `type`, `size`, and `arrayBuffer`; no real photograph or personal metadata is stored.

- [ ] **Step 4: Test metadata parse/edit/strip paths**

For PNG: apply synthetic author + C2PA, detect signer/title, strip, then assert no `caPI`, `c2pa`, `tEXt`, or `eXIf` metadata remains. For JPEG: parse the synthetic EXIF/GPS fields, strip, then assert author/GPS and APP11 C2PA are absent. Also cover PDF dictionary edit/strip and unknown-file passthrough.

Refactor the PNG branch of `stripMetadataUniversal` to call the existing pure `stripPngMetadataChunks` directly before the generic canvas fallback. This makes the privacy transformation deterministic in Node tests and avoids re-encoding pixels unnecessarily.

- [ ] **Step 5: Extract and test redaction region math**

```ts
export function normalizeRedactionBox(box: RedactionBox) {
  const x = Math.round(Math.min(box.x, box.x + box.width));
  const y = Math.round(Math.min(box.y, box.y + box.height));
  const width = Math.round(Math.abs(box.width));
  const height = Math.round(Math.abs(box.height));
  return width > 0 && height > 0 ? { x, y, width, height } : null;
}
```

Test positive and reverse-drag boxes, rounding, zero-area rejection, blackout calls, pixelate scaling, blur filter, missing canvas context, export success, and `toBlob(null)` rejection with minimal canvas mocks in Node.

- [ ] **Step 6: Run coverage and close concrete uncovered branches**

```powershell
npm run test:coverage
```

Expected: statements ≥85%. Add only tests for specific uncovered public behavior reported by `coverage/index.html`; do not exclude production files to manufacture the percentage.

- [ ] **Step 7: Commit the remaining library coverage**

```powershell
git add -A -- src/lib/watermark.test.ts src/lib/promptEnhancer.test.ts src/lib/metadata.test.ts src/lib/mediaRedact.test.ts tests/fixtures/metadataFixtures.ts src/lib/metadata.ts src/lib/mediaRedact.ts
git commit -m "test(lib): verify privacy transformations"
```

---

### Task 6: Restructure Navigation by Input Type

**Files:**
- Create: `src/lib/navigation.ts`
- Create: `src/lib/navigation.test.ts`
- Modify: `src/App.tsx`
- Modify: `src/components/HomeWorkspace.tsx`

**Interfaces:**
- Produces: `ToolView`, `NAV_SECTIONS`, `viewFromHash(hash)`, `viewForShortcut(key, target)`.
- Consumes: `App.switchView(view: ToolView)` and `HomeWorkspace.onSelectTool(tool: ToolView)`.

- [ ] **Step 1: Write navigation-model RED tests**

Assert exact groups and order:

```ts
expect(NAV_SECTIONS.map(({ label, items }) => [label, items.map(({ id }) => id)])).toEqual([
  ['Text', ['scrub', 'prompt', 'watermark']],
  ['Images & Files', ['metadata', 'media']],
  ['Site', ['home', 'docs', 'legal', 'about']],
]);
```

Assert exact descriptions, no label contains `Engine` or an ordinal prefix, all nine hashes resolve, unknown hashes return `home`, shortcuts map exactly, and shortcuts return `null` for `INPUT`, `TEXTAREA`, `SELECT`, or `isContentEditable` targets.

- [ ] **Step 2: Implement the pure navigation model**

Each item has `{ id, label, description, shortcut }`. Required descriptions:

- Scrubber — `Remove secrets and PII from text`
- Prompt Masker — `Mask a prompt, ask an AI, then reconstruct`
- Watermark Remover — `Strip invisible AI watermark characters`
- Metadata & C2PA — `Strip GPS, camera data, and content credentials`
- Media Redactor — `Black out sensitive regions in an image`
- Home — `Choose a privacy task`
- Docs — `Use AIScrubber from the CLI or an agent`
- Legal — `Read privacy and usage terms`
- About — `Meet the builder and project`

- [ ] **Step 3: Render semantic grouped navigation**

In `App.tsx`, map section data for both dock and mobile drawer. Each group is a `<section aria-labelledby="nav-{section.id}">` with an actual heading element. Desktop `lg` shows label + one-line description; tablet `md` keeps icons with labelled tooltips; mobile renders the same three groups and descriptions.

Map icons separately in `App.tsx` by `ToolView` so `navigation.ts` stays free of React imports.

- [ ] **Step 4: Add keyboard handling without hijacking typing**

Add one `keydown` effect. Call `viewForShortcut(event.key, event.target)`; if it returns a view, `preventDefault()` and call `switchView(view)`. Keep `prefers-reduced-motion` behavior by using instant scroll/transition when the media query matches.

- [ ] **Step 5: Add the two-choice home entry**

Before the five engine cards, add two real buttons:

- `I have text` lists Scrubber, Prompt Masker, Watermark Remover and opens `scrub`.
- `I have an image` lists Metadata & C2PA, Media Redactor and opens `metadata`.

Remove numeric prefixes from the five existing card headings. Do not change brand tokens or redesign the workspaces.

- [ ] **Step 6: Run model tests and manual responsive checks**

```powershell
npm test -- --run src/lib/navigation.test.ts
npm run dev
```

At 1440, 900, and 390 px widths verify: correct section order, descriptions at desktop, tooltip-only tablet dock, grouped mobile drawer, visible focus rings, active state not color-only, every hash, every shortcut, input-field shortcut suppression, and no horizontal overflow.

- [ ] **Step 7: Commit navigation**

```powershell
git add -A -- src/lib/navigation.ts src/lib/navigation.test.ts src/App.tsx src/components/HomeWorkspace.tsx
git commit -m "feat(navigation): group tools by input type"
```

---

### Task 7: CI, Honest Privacy Copy, and v2.3.0 Handoff

**Files:**
- Create: `.github/workflows/ci.yml`
- Create: `CHANGELOG.md`
- Modify: `README.md`
- Modify: `index.html`
- Modify: `src/components/LegalWorkspace.tsx`
- Modify: `src/components/HomeWorkspace.tsx`
- Modify: `src/components/MetadataWorkspace.tsx`
- Modify: `src/lib/metadata.ts`
- Modify: `bin/aiscrubber.js`
- Modify: `bin/aiscrubber-mcp.js`
- Modify: `package.json`
- Modify: `package-lock.json`

**Interfaces:**
- Produces: push CI running tests, coverage, and build on Node 18.
- Produces: package and surfaced version `2.3.0`.
- Preserves: analytics installed and active; user content never leaves the browser/local process.

- [ ] **Step 1: Add CI with a coverage artifact**

Create `.github/workflows/ci.yml`:

```yaml
name: CI
on:
  push:
  pull_request:
jobs:
  verify:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 18
          cache: npm
      - run: npm ci
      - run: npm test
      - run: npm run test:coverage
      - run: npm run build
      - uses: actions/upload-artifact@v4
        with:
          name: coverage-report
          path: coverage/
```

- [ ] **Step 2: Correct privacy and telemetry wording everywhere public**

Use this exact disclosure in README and Legal:

> Your content never leaves your browser or local Node process. The hosted site records anonymous pageview counts only; those analytics never receive pasted text, prompts, or files.

Update the home stat from `0 Bytes / Server Telemetry` to `0 Bytes / User Content Sent`. Update index metadata/FAQ text so `zero server roundtrips` describes content processing, not all network traffic. State explicitly that AIScrubber requires zero environment variables.

- [ ] **Step 3: Update detector documentation and versions**

README lists nine detector toggles and names every new secret/India format. Bump `package.json`, `package-lock.json`, CLI `VERSION`, MCP `SERVER_VERSION`, Metadata workspace defaults, and metadata generator defaults from 2.2.0 to 2.3.0.

Create `CHANGELOG.md` with a `## 2.3.0 - 2026-08-20` entry covering: shared web/CLI/MCP detector core, secret formats, IPv6, India PII, Luhn, Vitest/coverage CI, navigation grouping, and accurate analytics disclosure.

- [ ] **Step 4: Run the complete local verification gate**

```powershell
npm test
npm run test:coverage
npm run build
npm pack --dry-run
git diff --check
```

Expected: all tests green, statements ≥85%, production build succeeds, package contains both binaries plus `src/lib/scrubCore.js` and `.d.ts`, and no whitespace errors.

- [ ] **Step 5: Run secret hygiene before the final implementation commit**

```powershell
git add -A -- .github/workflows/ci.yml CHANGELOG.md README.md index.html src/components/LegalWorkspace.tsx src/components/HomeWorkspace.tsx src/components/MetadataWorkspace.tsx src/lib/metadata.ts bin/aiscrubber.js bin/aiscrubber-mcp.js package.json package-lock.json
git diff --cached --name-only | rg -i "\.env($|\.)|secret|credential|\.pem$|id_rsa"
```

Expected: no prohibited filename hit. Synthetic strings stay only in test files and must remain obviously non-live.

- [ ] **Step 6: Commit release preparation**

```powershell
git commit -m "chore(release): prepare AIScrubber 2.3.0"
```

- [ ] **Step 7: Verify remote CI, then stop for Stage 3**

Push `main`, inspect the GitHub Actions run, and record the run URL plus test/build/coverage results. Do not create a GitHub release and do not deploy in this phase. Hand the verified build back for `test.md`.

---

## Self-Review Record

- Spec coverage: P0-1 is Tasks 1 and 5; P0-2 is Tasks 2–4; P0-3 is Task 6; CI and coverage publication are Tasks 1 and 7; P1-3 and release preparation are Task 7.
- Deferred scope: P1-1, P1-2, P1-4, and P2 are explicitly excluded from execution.
- Type consistency: all surfaces consume `collectBuiltInMatches`/`scrubBuiltIns`; the web-only adapter retains custom rules and diff segments; `ToolView` has one definition in `navigation.ts`.
- Blocking contradiction: the Aadhaar positive fixture requires the spec correction described under Approval Prerequisite.
