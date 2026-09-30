# Changelog

## 3.0.0 - 2026-09-30

- Added canonical match spans, occurrence-level keep/hide review, strict session-key parsing, and exact mask/restore round trips.
- Added bounded browser and Node workers, bounded streaming, local text batches, collision-safe exports, real-engine demos, and three static task guides.
- Hardened CLI/MCP boundaries: JSON scrub output omits originals, `mask` requires explicit local destinations, MCP keys require `includeSessionKey`, and unmasking requires `allowSensitiveOutput`.
- Fixed `check --staged` to inspect staged Git index blobs instead of mutable working-tree files.
- Added a sponsorship modal after successful changed-output website handoffs, dismissible after three seconds. Payment is voluntary. CLI, MCP, and CI remain non-promotional.

### Migration notes

- MCP `mask_prompt` returns a session key only when `includeSessionKey: true` is set. Treat that key as sensitive local data.
- MCP `unmask_response` rejects calls unless `allowSensitiveOutput: true` is set.
- CLI `mask` no longer writes a default key file. Pass `--key <new-path>` and optionally `--output <new-path>`; existing destinations are never overwritten.
- `aiscrubber check --staged` now scans staged Git index content, so unstaged working-tree edits do not affect its result.
- New keys use exact v2 bracket/brace placeholders; unknown tokens remain unchanged with warnings. Default scrub JSON contains numeric counts, not restoration mappings.
- Streaming requires a distinct `--output` and refuses stdout, unsupported regex policies, token collisions, or mapping exhaustion without publishing partial output.
- Check metadata uses `[REDACTED]`; incomplete scans take exit-code precedence over findings.

## 2.4.0 - 2026-09-12

- **Streaming scrub engine (PMP-12, #4)**: Memory-bounded chunked stream scrubber processing large log and dump files (>64 MiB or via `--stream`) with peak RSS < 400 MiB across 100+ MiB streams, preserving PEM blocks and deterministic token continuity.
- **Entropy suppression filters (PMP-13, #5)**: Six-stage heuristic filter pipeline (E1 English dictionary, E2 hex/UUID/object ID, E3 base64 padding, E4 low-entropy repetition, E5 allowlist, E6 secret prefix bypass) eliminating false-positive churn while preserving true secrets. Configurable via `--no-suppress`.
- **Hierarchical rule packs and configuration (PMP-14, #6)**: Walk-up `.aiscrubrc.json` schema supporting custom regex/keyword rules, allowlists, detector overrides, and built-in rule packs (`india-ids`, `devops`, `healthcare`). Exposes `reload_rules` on MCP server with dynamic rules source tracking.
- **Pre-commit `check` command**: High-throughput file and git staged scanner (`aiscrubber check [--staged] [--json]`) with line/column discovery, binary sniffing, and masked previews for pre-commit hooks and CI gates.
- **Web Scrubber Desk updates**: Added rules panel with import/export/clear operations persisted in local storage (`aiscrubber.rules.v1`) and low-confidence match suppression counter.

## 2.3.0 - 2026-08-20

- Unified browser, CLI, MCP, and prompt masking on one shared scrub engine.
- Added provider credential formats, compressed IPv6, Indian phone numbers, Verhoeff-valid Aadhaar/PAN detection, and Luhn validation for payment cards.
- Added Vitest regression, cross-surface, performance, and engine tests with enforced coverage thresholds in CI.
- Grouped navigation by task, enabled keyboard shortcuts, and clarified local content processing versus non-content website analytics.
- Preserved PNG pixels while removing metadata chunks and hardened repeated AI-footer cleanup.
