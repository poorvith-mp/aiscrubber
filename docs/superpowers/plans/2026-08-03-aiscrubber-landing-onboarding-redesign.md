# AIscrubber Landing + Onboarding Redesign

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the legacy utility/demo app with a clean React + TypeScript + Tailwind landing page and onboarding flow for AIscrubber, while removing unused files and switching the founder imagery to the asset from the separate Poorvith project.

**Architecture:** This app will become a single-page marketing website with a lightweight onboarding experience driven entirely by client-side React state. The design will use a modern SaaS landing-page structure: hero, proof points, feature sections, founder story, CTA, and onboarding steps. No authentication or server API will be added.

**Tech Stack:** React 19, TypeScript, Vite, Tailwind CSS v4, PostCSS, and lucide-react.

## Global Constraints

- No authentication.
- No backend services or API integration.
- Keep the app as a landing page + onboarding experience only.
- Use React, TypeScript, and Tailwind as the primary stack.
- Remove unused legacy static HTML and dead assets from the root/project.
- Use founder imagery from the Poorvith project folder rather than the existing placeholder assets.
- Prefer a clean, production-ready structure over preserving legacy demo code.

---

### Task 1: Audit the legacy app and define the clean app shell

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/main.tsx`
- Modify: `src/index.css`
- Modify: `vite.config.ts`
- Modify: `package.json`
- Remove: root HTML entries such as `index.html` only if they are no longer required for the SPA shell, and legacy static pages in the project root

**Interfaces:**
- Consumes: current Vite React + Tailwind baseline already present in the repo
- Produces: a minimal working app root with the new landing page entry point and Tailwind styling hooks

- [ ] **Step 1: Review the current app structure and identify all legacy files that are not part of the landing-page build**

  Confirm the current repo has a working Vite React app but contains static marketing pages and unused demo assets. Record the exact files to remove later in the cleanup pass.

- [ ] **Step 2: Replace the current utility app entry with a landing-page shell**

  Rewrite `src/App.tsx` so it renders a marketing layout rather than the current privacy scrubber workspace. Keep the app root minimal and future-ready for page sections and onboarding.

- [ ] **Step 3: Set up the global Tailwind theme and typography**

  Update `src/index.css` to define the tailwind import, base colors, fonts, spacing tokens, gradients, and reusable classes for the new design system.

- [ ] **Step 4: Validate the shell compiles**

  Run: `npm run build`
  Expected: successful Vite production build with no TypeScript errors.

### Task 2: Remove legacy static files and unused assets

**Files:**
- Remove: `about.html`
- Remove: `community-guidelines.html`
- Remove: `contact.html`
- Remove: `cookies.html`
- Remove: `documentation.html`
- Remove: `pricing.html`
- Remove: `privacy.html`
- Remove: `scrub.html`
- Remove: `terms.html`
- Remove or archive: `assets/` if no longer referenced
- Remove or retire: `src/components/ScrubberWorkspace.tsx`
- Remove or retire: `src/components/Header.tsx` if it conflicts with the new landing header
- Remove or retire: `src/utils/scrubEngine.ts` if no longer used

**Interfaces:**
- Consumes: the cleanup map from Task 1
- Produces: a lean project containing only the files required for the landing page and onboarding flow

- [ ] **Step 1: Delete file-level clutter that is unrelated to the new product direction**

  Remove the old standalone marketing pages and the utility-driven demo files once the app shell is stable.

- [ ] **Step 2: Keep only the app shell, landing UI components, and onboarding components**

  Preserve the minimal structure: app entry, landing page sections, onboarding flow, and static assets needed by the design.

- [ ] **Step 3: Validate the project still builds after cleanup**

  Run: `npm run build`
  Expected: build passes with the cleaned structure.

### Task 3: Build the landing page structure

**Files:**
- Create: `src/components/LandingPage.tsx`
- Create: `src/components/SectionHeader.tsx` (optional helper)
- Modify: `src/App.tsx`

**Interfaces:**
- Consumes: no backend; uses local static data for feature lists and metrics
- Produces: the main landing page content rendered by `App`

- [ ] **Step 1: Create the top nav and hero section**

  Add a clean navigation bar with brand name, product tagline, and CTA buttons. Include a primary headline that explains AIscrubber as a privacy-first, AI-ready workflow tool.

- [ ] **Step 2: Add trust and value sections**

  Create sections for key metrics, product differentiators, and a simple customer-proof area. Keep each item short and visual.

- [ ] **Step 3: Add founder and brand story content**

  Insert a founder profile section using the image copied from the Poorvith project folder. Use `poorvith_profile.jpg` as the main founder image in the public asset set.

- [ ] **Step 4: Add CTA and footer structure**

  End the landing page with a strong conversion section and a compact footer with product and legal links that are static and non-authenticated.

### Task 4: Add the onboarding flow

**Files:**
- Create: `src/components/OnboardingFlow.tsx`
- Create: `src/data/onboarding.ts` (optional, static data file)
- Modify: `src/App.tsx`

**Interfaces:**
- Consumes: static onboarding steps and local UI state
- Produces: a guided onboarding experience that users can complete without any backend dependency

- [ ] **Step 1: Define the onboarding steps**

  Create 3–5 steps such as “Choose workflow,” “Review sensitive content,” “Set privacy preferences,” and “Launch first scrub.” Each step should be represented by a card with progress state.

- [ ] **Step 2: Implement the local progress UI**

  Use React state to track the current onboarding step and advance when the user clicks “Next” or finishes a milestone. Render a progress bar and completion display.

- [ ] **Step 3: Add a completion state**

  After final step, show a success panel with a clear call to action to continue to the landing page experience or start using the product in the browser.

- [ ] **Step 4: Integrate onboarding into the app layout**

  Render the onboarding flow as a dedicated section or modal that aligns with the marketing journey without requiring auth or backend logic.

### Task 5: Import the founder image from the Poorvith workspace

**Files:**
- Copy from: `o:\My_Projects\poorvithmp\public\poorvith_profile.jpg`
- Copy to: `public/founder-profile.jpg` or a similar asset path in the AIscrubber project
- Modify: landing page founder section to reference the new asset

**Interfaces:**
- Consumes: the profile image from the external project folder
- Produces: founder visual in the landing page and onboarding experience

- [ ] **Step 1: Copy the founder profile image into the AIscrubber public assets**

  Ensure the original image is available in the app's static asset folder for direct browser use.

- [ ] **Step 2: Replace any outdated or generic founder placeholders**

  Update the photo markup to point to the new asset and ensure image sizing and contrast match the landing page design.

- [ ] **Step 3: Verify the asset loads correctly in the browser build**

  Run the app locally with Vite and confirm the founder card renders without broken image links.

### Task 6: Final verification and QA

**Files:**
- Validate: app entry, landing page, onboarding flow, image references, cleanup state

- [ ] **Step 1: Run production build**

  Run: `npm run build`
  Expected: success with no TypeScript or Vite errors.

- [ ] **Step 2: Run the local dev server**

  Run: `npm run dev -- --host 0.0.0.0`
  Expected: the landing page loads with the onboarding flow and founder image visible.

- [ ] **Step 3: Confirm no auth, no backend, and no unused clutter remain**

  Check that the project contains only the required React + Tailwind app shell and the marketing/onboarding experience.

---

## Implementation Notes

- Prefer simple, maintainable components over excessive abstraction.
- Reuse the existing Vite + React setup instead of introducing a new framework.
- Tailwind classes should be grouped into clear style tokens and not duplicated in ad hoc ways.
- The founder image from the Poorvith project is a strong replacement for the placeholder founder visuals currently used across the old product pages.
- Keep the first iteration intentionally clean and customer-facing; deeper product-specific refine passes should happen after the structure is stabilized.
