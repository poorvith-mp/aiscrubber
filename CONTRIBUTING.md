# Contributing to AIScrubber

Hey, thanks for your interest in improving AIScrubber! We build offline-capable, zero-telemetry privacy tools that run 100% inside local browser memory, terminal CLIs, and MCP servers.

---

## 1. Architectural Non-Negotiables

Before submitting a Pull Request, keep our core constraints in mind:

1. **Zero Server Telemetry**: Under no circumstances should user text, prompts, logs, images, or documents be transmitted to an external application server. All processing MUST run client-side (via Web Workers, Canvas, or local CLI/MCP).
2. **Determinism over AI Slop**: We prioritize fast, predictable regex and binary parsing rather than sending sensitive data to cloud LLMs.
3. **No Bloat**: Keep dependencies minimal. The CLI and MCP server must run with zero native C++ compile steps and minimal package overhead.
4. **Taste & Design Standard**: Follow the design tokens specified in the codebase (Playfair Display for headlines, DM Sans / Plus Jakarta Sans for body, IBM Plex Mono for tokens, and Emerald brand accents).

---

## 2. Local Development Setup

```bash
# Clone the repository
git clone https://github.com/poorvith-mp/aiscrubber.git
cd aiscrubber

# Install dependencies
npm install

# Start local web dev server
npm run dev

# Test the standalone CLI
node ./bin/aiscrubber.js scrub "Error from client 192.168.1.100 with key sk-1234567890123456"

# Test the MCP server
node ./bin/aiscrubber-mcp.js
```

---

## 3. Pull Request Workflow

1. Fork the repo and create your branch from `main`:
   ```bash
   git checkout -b feat/your-feature-name
   ```
2. Write clean, typed TypeScript or ES module code.
3. Verify the production build passes with zero errors:
   ```bash
   npm run build
   ```
4. Commit with descriptive conventional commit messages:
   ```bash
   git commit -m "feat: add support for custom JWT detector in CLI"
   ```
5. Open a Pull Request on GitHub.

---

## 4. Questions & Feedback

Reach out on [GitHub Discussions](https://github.com/poorvith-mp/aiscrubber/discussions) or connect with Poorvith on X ([@poorvithmp](https://x.com/poorvithmp)) and portfolio ([poorvithmp.com](https://poorvithmp.com)).
