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

## Connect the MCP server

AIScrubber exposes `scrub_text`, `mask_prompt`, `unmask_response`, `clean_ai_watermarks`, and `inspect_content` over stdio.

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

## Accuracy and safety boundaries

- Detection is deterministic pattern matching, not semantic understanding. Review the output before sharing it.
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
