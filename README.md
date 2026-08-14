<div align="center">
  <img src="docs/assets/logo.svg" width="80" alt="AIScrubber Logo" />
  <h1>AIScrubber</h1>
  <p><b>Next-Gen Browser-Local Privacy Desk, Developer CLI & Model Context Protocol (MCP) Server</b></p>

  <p>
    <a href="https://aiscrubber.poorvithmp.com"><b>🌐 Live Web Suite</b></a> ·
    <a href="#cli-quickstart"><b>💻 CLI Reference</b></a> ·
    <a href="#mcp-server-setup"><b>🤖 MCP Server Setup</b></a> ·
    <a href="#core-features"><b>✨ Features</b></a> ·
    <a href="https://poorvithmp.com"><b>👨‍💻 Founder</b></a>
  </p>
</div>

---

## 🔒 What is AIScrubber?

**AIScrubber** is an offline-capable, browser-local privacy desk and developer toolkit engineered for the exact moment before sensitive data travels to AI frontier models (ChatGPT, Claude, Gemini), public GitHub issues, or email threads.

Everything runs **100% in local memory**—zero telemetry, zero server roundtrips, zero external database logging.

---

## ✨ 4 Privacy Engines

### 1. 📝 Text Scrubber
- Scans input text and incident logs against **8 built-in detector classes** (Emails, API Keys & Bearer Tokens, IPv4/IPv6, Phone Numbers, Payment Cards, Customer/System IDs, SSN).
- Supports **Custom Keyword & Regex Rules** drawer.
- Interactive side-by-side **Diff Inspector** with token tooltips.
- 1-Click **Dictionary Key Export** for reversible token tracking.

### 2. 🤖 Prompt Enhancer & Zero-Exposure Roundtrip
- **Step 1 (Mask & Structure):** Detects credentials and endpoints in raw prompts and replaces them with semantic constants (`{{API_SECRET_1}}`, `{{DATABASE_URL_1}}`).
- **Step 2 (Key Export):** Exports a downloadable `.aiscrub.json` session key.
- **Step 3 (Query AI):** Paste the masked prompt to ChatGPT or Claude.
- **Step 4 (1-Click Reconstruct):** Paste the AI's generated response and session key to unmask all original variables back into working code.

### 3. 🖼️ Metadata Desk (Viewer, Editor & Stripper)
- In-browser parsing of JPEG (EXIF/GPS/IPTC), PNG chunks, PDF `/Info` dictionaries, and Audio ID3 tags.
- GPS coordinates extractor with instant Google Maps preview links.
- In-place field editor (Title, Author, Software, Copyright).
- **1-Click Stripper:** Re-encodes clean pixel buffers and zeros binary tracking dictionaries.

### 4. 🎨 Visual Media Redactor
- HTML5 Canvas interactive tool to draw redaction boxes on screenshots and images.
- Tools: **Gaussian Blur**, **Pixelate (Mosaic)**, and **Solid Blackout**.
- Undo/redo history stack and clean high-resolution PNG export.

---

## 💻 CLI Quickstart

Run the standalone CLI with zero installation via `npx`:

```bash
# Scrub sensitive logs into safe numbered labels
npx aiscrubber scrub ./logs/production-crash.log --output ./logs/clean.log

# Mask prompt secrets for AI and save session key
npx aiscrubber mask "Connect postgres://admin:P@ssw0rd@db.internal:5432" --key session.aiscrub.json

# Unmask AI response with your session key
npx aiscrubber unmask ./ai-response.py --key session.aiscrub.json --output ./final-code.py

# Strip metadata from documents and images
npx aiscrubber strip-metadata ./photos/*.jpg ./reports/*.pdf
```

---

## 🤖 MCP Server Setup (Claude Desktop & Cursor)

Connect AIScrubber directly to **Claude Desktop**, **Claude Code CLI**, or **Cursor** as an official Model Context Protocol (MCP) server.

### Claude Desktop Configuration

Add the following to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "aiscrubber": {
      "command": "npx",
      "args": ["-y", "aiscrubber-mcp"]
    }
  }
}
```

### Exposed MCP Tools:
- `scrub_text`: Sanitizes raw logs and text into `[EMAIL_1]`, `[SECRET_1]`, `[IP_1]`.
- `mask_prompt`: Masks secrets into `{{KEY_1}}` constants and outputs session key JSON.
- `unmask_response`: Restores original variables back into returned AI output.

---

## 🛡️ Security & Threat Model

| Characteristic | Specification |
|---|---|
| **Execution Environment** | Client-Side Browser Memory / Local Node.js Process |
| **Server Roundtrips** | **0** (Verified in DevTools Network tab) |
| **Storage** | Ephemeral RAM only (LocalStorage used only for dark/light UI preference) |
| **License** | Open Source MIT License |

---

## 👨‍💻 Founder & Credits

Designed and built by **[Poorvith M P](https://poorvithmp.com)**, 19-year-old student developer & founder based in Bengaluru, India.

- **Portfolio**: [poorvithmp.com](https://poorvithmp.com)
- **GitHub**: [@prvthmpcypher](https://github.com/prvthmpcypher)
- **X (Twitter)**: [@poorvithmp](https://x.com/poorvithmp)
- **LinkedIn**: [linkedin.com/in/poorvithmp](https://linkedin.com/in/poorvithmp)

---

## 📄 License

Distributed under the **MIT License**. See [`LICENSE`](LICENSE) for details.
