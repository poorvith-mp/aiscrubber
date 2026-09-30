# AIScrubber

AIScrubber is a browser-local privacy toolkit for cleaning sensitive text and images before they are shared with an AI service, issue tracker, or another person.

[Open the web app](https://aiscrubber.poorvithmp.com) · [Report a bug](https://github.com/poorvith-mp/aiscrubber/issues)

## What it does

- Text Scrubber replaces detected credentials, email addresses, IP addresses, payment cards, IDs, and other sensitive values with stable tokens.
- Prompt Masker exports a local session key so placeholders in an AI response can be restored later.
- Unicode Cleaner removes selected zero-width characters, Tag Plane tokens, unusual spaces, and confusables. Optional phrase rules clean common AI-style copy patterns.
- Metadata Desk inspects JPEG, PNG, and WebP images and removes supported EXIF, GPS, PNG text, and C2PA-compatible metadata markers.
- Media Redactor permanently burns blur, pixelation, or blackout regions into an exported image.

The browser tools process user content in local memory. The site loads Google Fonts and fetches the repository's public GitHub star count. Neither request includes pasted text, files, mappings, or session keys.

## Use the CLI

Run it without installing globally:

```bash
npx aiscrubber scrub ./incident.log --output ./incident.clean.log
npx aiscrubber mask ./prompt.txt --key ./session.aiscrub.json
npx aiscrubber unmask ./ai-response.txt --key ./session.aiscrub.json
npx aiscrubber clean-watermarks ./draft.md --output ./draft.clean.md
npx aiscrubber strip-metadata ./photo.jpg ./screenshot.png
npx aiscrubber inspect ./incident.log --json
```

`strip-metadata` writes sanitized copies for JPEG, PNG, and WebP files, preserving originals and refusing to overwrite existing outputs. PDF rewriting is unsupported. `inspect` scans UTF-8 text; use the browser Metadata Desk to inspect images. Metadata editing supports JPEG and PNG only. C2PA signatures are not verified.

Use `npx aiscrubber help <command>` for command-specific examples.

## Use as a pre-commit gate

Scan explicit text files or staged Git index blobs before pushing:

```bash
# Scan staged additions, changes, and rename destinations
npx aiscrubber check --staged

# Scan explicit files (directories are rejected)
npx aiscrubber check ./src/config.ts ./incident.log --json
```

Exit codes: `0` for a complete scan without findings, `1` for findings, `2` for incomplete scans or usage/configuration/IO errors. Binary staged files, symlinks, and submodules are visibly excluded; oversized or unreadable text makes the check incomplete.

### `lint-staged` configuration

```json
{
  "lint-staged": {
    "*": "npx aiscrubber check --staged"
  }
}
```

### `.pre-commit-config.yaml` (repo: local)

```yaml
repos:
  - repo: local
    hooks:
      - id: aiscrubber-check
        name: aiscrubber secret check
        entry: npx aiscrubber check --staged
        language: system
        pass_filenames: false
```

## Large files & streaming

Large file scrubbing uses bounded chunks. Files over 64 MiB require a distinct `--output` destination; streaming stdout is unsupported. Streaming accepts built-ins and single-line literal rules, not custom regex or regex allowlists. Mapping exhaustion, truncated private keys, invalid UTF-8, and late token collisions fail without publishing a partial file. Memory and speed depend on the workload.

```bash
# Automatically streams files >64 MiB
npx aiscrubber scrub ./production-dump.log --output ./production-clean.log

# Force streaming mode on any file size
npx aiscrubber scrub ./server.log --stream --output ./clean.log
```

## Rule packs & `.aiscrubrc.json`

Configure custom regex patterns, tokens, allowlists, and pre-built domain packs via `.aiscrubrc.json` in your project root:

```json
{
  "version": 1,
  "extends": ["devops", "india-ids"],
  "customRules": [
    {
      "id": "internal-token",
      "label": "Internal Service Token",
      "token": "SERVICE_TOKEN",
      "patternString": "srv_[a-zA-Z0-9]{32}",
      "isRegex": true,
      "enabled": true
    }
  ],
  "allowlist": [
    { "value": "public-sample-key", "isRegex": false }
  ]
}
```

Available built-in packs:
- `india-ids`: Aadhaar, PAN, Voter ID (EPIC), Passport, and Driving Licence rules.
- `devops`: Kubernetes secrets, Docker configs, Vault tokens, and Terraform state patterns.
- `healthcare`: US/EU medical identifier formats and patient record tags.

## Connect the MCP server

`mask_prompt` returns a private restoration file only with `includeSessionKey: true`. `unmask_response` requires `allowSensitiveOutput: true`. Restoration keys and restored responses contain original private values; don't send the key to an AI service.

AIScrubber exposes `reload_rules`, `scrub_text`, `mask_prompt`, `unmask_response`, `clean_ai_watermarks`, and `inspect_content` over stdio for Claude Desktop, Claude Code, and Cursor.

```json
{
  "mcpServers": {
    "aiscrubber": {
      "command": "npx",
      "args": ["-y", "aiscrubber", "mcp"]
    }
  }
}
```

Tools dynamically reflect your `.aiscrubrc.json` rules and allow runtime reload via `reload_rules` without restarting the server.

## Local web workflows

The website starts with an empty text editor. Choose Everyday text or Developer logs, add Words to hide, and review individual occurrences before copying or downloading. Regional and healthcare checks are opt-in. Allowlisting affects entropy suppression only, not other detectors.

Text batches accept up to 20 UTF-8 TXT/LOG/MD/JSON/CSV files, 5 MiB each and 20 MiB total. Exports use neutral filenames; JSON/CSV are cleaned as text, without a schema-preservation guarantee. Masked prompts and restoration keys stay in memory unless explicitly downloaded.

Successful changed-output handoffs show a sponsorship modal. Closing is available after three seconds; payment is voluntary. Sponsorship never appears in exported content, CLI, MCP, or CI output.

Task guides: [clean incident logs](https://aiscrubber.poorvithmp.com/guides/scrub-logs-before-sharing/), [mask and restore prompts](https://aiscrubber.poorvithmp.com/guides/mask-and-restore-ai-prompts/), [hide private text](https://aiscrubber.poorvithmp.com/guides/hide-private-details-in-text/).

## Accuracy and safety boundaries

- Detection is deterministic pattern matching, not semantic understanding. Review the output before sharing it.
- Entropy suppression can hide a real secret that looks like a hash; run `inspect --no-suppress` to see everything.
- Unicode findings do not prove which model created text or that a vendor watermark exists.
- The Metadata Desk detects supported binary markers but does not verify cryptographic provenance signatures.
- Keep `.aiscrub.json` session keys private. They contain the original values required for reconstruction.
- Work on a copy of important files and verify exported images before deleting originals.

## Develop locally

Requirements: Node.js 18 or newer.

```bash
npm ci
npm test
npm run build
npm run dev
```

Deploy the built static assets to Cloudflare Workers:

```bash
npm run build
npx wrangler deploy
```

## License

MIT. See [LICENSE](LICENSE).
