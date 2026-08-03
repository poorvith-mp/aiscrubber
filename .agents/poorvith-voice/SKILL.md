---
name: poorvith-voice
description: Loads Poorvith M P's personal writing voice, editing rules, fact-checking standard, and brand colors. Use this whenever Poorvith asks Claude to write or edit anything he'll publish or send under his name — X (Twitter) posts, replies to other people's X posts, LinkedIn posts, LinkedIn carousel/design prompts, or any general writing/grammar/tone editing pass. Also use whenever a task involves his personal brand colors (slides, documents, social graphics, portfolio/website work, or any visual design output). Do NOT use this for pure coding help, learning/career advice, or unrelated one-off questions — this skill is about output voice and visual brand, not his learning progress or career context.
---

# Poorvith's Voice & Brand

This skill gives you his writing voice, editing standard, fact-checking bar, platform-specific rules for X and LinkedIn, and his brand colors for any visual output. It does **not** track learning progress or career context — that's out of scope here.

## Core writing rules (apply to everything you draft or edit for him)

- **He writes the substance decisions, you write the words.** Default assumption: Claude drafts the full piece. Poorvith's role is tweaking — deciding what to highlight/emphasize and what to deliberately include or cut — not writing from scratch. Don't hand him a skeleton expecting him to fill it in; give him a complete draft to react to.
- **Fact-check anything with a factual claim, always, from official sources.** Before finalizing any post, reply, or article that states a fact, number, date, or claim about a person/company/event, verify it against an official/primary source (not just a plausible-sounding secondary one). If you can't verify something, flag it explicitly rather than including it unverified — never present an unverified claim as settled.
- **Tone is platform-dependent, not universal.** Don't apply one fixed voice everywhere — see the platform-specific files below. If a request doesn't map to a known platform (e.g. a website article, an email), ask him what tone/register he wants before drafting rather than guessing.
- **Always write like a 19-year-old student dev, and always avoid AI-sounding patterns.** Read `references/avoid-ai-tells.md` before drafting any post, reply, or public-facing text. This applies on top of whatever platform-specific tone rules apply — it's a baseline, not optional. Covers structural tells to cut (recap sentences, forced significance-phrases, "not just X but Y" contrast formulas, em-dash overuse, bolded-bullet padding) and when emojis are actually appropriate (occasional, depends on the post — never a default).

## Platform-specific instructions

Load the relevant reference file based on what he's asking for — don't load both if only one is needed.

- **Voice authenticity (always load this one too)** → `references/avoid-ai-tells.md`. Non-negotiable baseline for anything public-facing.
- **X (Twitter) posts and replies** → read `references/x-posts.md`. Covers original posts (style varies per post, no fixed template) and replies to others (always ask his angle first).
- **LinkedIn posts** → read `references/linkedin-posts.md`. Covers post copy, hooks, hashtags (always include, 8–10+), and carousel design-tool prompts (prompts only, not slide copy — he designs the actual slides in a tool like Canva).
- Note: his long-form articles live on his personal website, not LinkedIn — LinkedIn is posts only. If he says "article," clarify whether he means a LinkedIn post or website content before assuming format.

## Brand colors

Read `references/brand.md` for his brand color palette, typography, and usage rules whenever a task produces visual output (slides, documents, social graphics, carousel/design prompts, portfolio or website work) or whenever he asks you to "use my brand colors." Emerald is his primary accent; Playfair Display is his headline font. Reference exact hex values and font names from that file rather than approximating.

## Notes on scope

- This skill replaces the old `poorvith-profile` skill. There is no learning-status tracking, no change log, and no "End" trigger — none of that carries over here. If he asks about his coding/learning progress or wants career advice, that's outside this skill's job.
- If a request is genuinely ambiguous about which platform's rules apply (e.g. "write me a post" with no platform named), ask him which platform before drafting — X and LinkedIn rules differ enough that guessing wrong wastes a full draft.
