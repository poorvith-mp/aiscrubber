#!/usr/bin/env node

/**
 * AIScrubber CLI — Browser-Local & Terminal Privacy Suite
 * Built by Poorvith M P (https://poorvithmp.com)
 * MIT License
 */

import fs from 'node:fs';
import path from 'node:path';

const VERSION = '2.2.0';

// Core regex detectors
const DETECTORS = {
  email: {
    name: 'Email Addresses',
    regex: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g,
    tokenPrefix: 'EMAIL',
  },
  apiKey: {
    name: 'API Keys & Secrets',
    regex: /\b(?:sk-[A-Za-z0-9_-]{16,}|ghp_[A-Za-z0-9]{36}|gho_[A-Za-z0-9]{36}|github_pat_[A-Za-z0-9_]{40,}|AKIA[0-9A-Z]{16}|bearer\s+[A-Za-z0-9\-._~+/]+=*|eyJ[A-Za-z0-9-_=]+\.eyJ[A-Za-z0-9-_=]+\.[A-Za-z0-9-_.+/=]*)\b/gi,
    tokenPrefix: 'SECRET',
  },
  ipv4: {
    name: 'IPv4 Addresses',
    regex: /\b(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\b/g,
    tokenPrefix: 'IP',
  },
  phone: {
    name: 'Phone Numbers',
    regex: /(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/g,
    tokenPrefix: 'PHONE',
  },
  card: {
    name: 'Payment Cards',
    regex: /\b(?:\d{4}[-\s]?){3}\d{4}\b|\b\d{15,16}\b/g,
    tokenPrefix: 'CARD',
  },
  systemId: {
    name: 'System & Customer IDs',
    regex: /\b(?:CUST|USER|ORDER|TX|ACCOUNT|INV|SUB)-[A-Za-z0-9_-]{4,20}\b/gi,
    tokenPrefix: 'ID',
  },
};

const HOMOGLYPH_MAP = {
  'а': 'a', 'А': 'A', 'с': 'c', 'С': 'C', 'е': 'e', 'Е': 'E', 'о': 'o', 'О': 'O',
  'р': 'p', 'Р': 'P', 'ѕ': 's', 'Ѕ': 'S', 'х': 'x', 'Х': 'X', 'у': 'y', 'У': 'Y',
  'і': 'i', 'І': 'I', 'ј': 'j', 'Ј': 'J',
  '–': '-', '—': '-', '‘': "'", '’': "'", '“': '"', '”': '"',
};

const AI_CADENCE_REPLACEMENTS = [
  [/\bdelve(?:s)? into\b/gi, 'explore'],
  [/\bdelving into\b/gi, 'exploring'],
  [/\ba testament to\b/gi, 'proof of'],
  [/\brich tapestry of\b/gi, 'diverse mix of'],
  [/\bplays a crucial role\b/gi, 'is essential'],
  [/\bcrucial role\b/gi, 'key role'],
  [/\bbeacon of\b/gi, 'guide for'],
  [/\bnavigating the landscape of\b/gi, 'managing'],
  [/\bit is important to (?:note|remember) that\b/gi, 'note that'],
  [/\bunderscores the importance of\b/gi, 'highlights'],
  [/\bin today's fast-paced digital world\b/gi, 'today'],
  [/\bseamlessly integrates\b/gi, 'integrates'],
];

function printGeneralHelp() {
  console.log(`
\x1b[1m\x1b[32mAI\x1b[0m\x1b[1mscrubber CLI\x1b[0m \x1b[90mv${VERSION}\x1b[0m — Browser-Local & Terminal Privacy Desk
Zero-telemetry privacy suite for developer prompts, crash logs, and files.

\x1b[1mUSAGE\x1b[0m
  $ npx aiscrubber <command> [arguments] [options]
  $ npx aiscrubber help <command>

\x1b[1mCOMMANDS\x1b[0m
  \x1b[36mclean-watermarks\x1b[0m <file | text>  Strip Claude & AI invisible Unicode zero-width watermarks
  \x1b[36mscrub\x1b[0m <file | text>             Scrub PII, tokens, and secrets into numbered labels
  \x1b[36mmask\x1b[0m <file | prompt>            Mask secrets with constants and generate a session key
  \x1b[36munmask\x1b[0m <ai-file> --key <key>     Reconstruct original secrets back into returned AI output
  \x1b[36mstrip-metadata\x1b[0m <files...>         Strip EXIF, GPS, C2PA, and PDF/Audio metadata client-side
  \x1b[36minspect\x1b[0m <file | text>           Inspect hidden metadata, C2PA manifests, or text secrets

\x1b[1mGLOBAL OPTIONS\x1b[0m
  -o, --output <path>            Write output to a specific file instead of stdout
  -k, --key <path>               Path to .aiscrub.json session key (used by mask & unmask)
  -j, --json                     Output structured JSON with replacements and metadata
  -h, --help                     Show general help or command-specific help
  -v, --version                  Show CLI version

\x1b[1mGET HELP ON A SPECIFIC COMMAND\x1b[0m
  $ npx aiscrubber help clean-watermarks
  $ npx aiscrubber help scrub
  $ npx aiscrubber help mask
  $ npx aiscrubber help unmask
  $ npx aiscrubber help strip-metadata
  $ npx aiscrubber help inspect
`);
}

function printCommandHelp(cmd) {
  switch (cmd) {
    case 'clean-watermarks':
    case 'watermark':
      console.log(`
\x1b[1mCOMMAND: clean-watermarks\x1b[0m
Strips invisible Unicode zero-width tokens (\\u200B, \\uFEFF, \\u2060, etc.), Unicode Tag-Plane characters,
non-standard whitespace, homoglyphs, and AI stylometric clichés from Claude & LLM outputs.

\x1b[1mUSAGE\x1b[0m
  $ npx aiscrubber clean-watermarks <file | text> [options]

\x1b[1mOPTIONS\x1b[0m
  -o, --output <path>    Write sanitized content to file
  -j, --json             Print detailed stats JSON (zeroWidthCount, spacesCount, homoglyphs)

\x1b[1mEXAMPLES\x1b[0m
  $ npx aiscrubber clean-watermarks ./claude-response.md -o ./clean-article.md
  $ npx aiscrubber clean-watermarks "Here is Claude\\u200B text" --json
`);
      break;

    case 'scrub':
      console.log(`
\x1b[1mCOMMAND: scrub\x1b[0m
Scans text or incident logs against 8 sensitive detector classes (Emails, API Keys, Bearer Tokens,
IP Addresses, Credit Cards, Customer/System IDs) and replaces them with numbered tokens ([EMAIL_1], [SECRET_1]).

\x1b[1mUSAGE\x1b[0m
  $ npx aiscrubber scrub <file | text> [options]

\x1b[1mOPTIONS\x1b[0m
  -o, --output <path>    Write scrubbed output to file
  -j, --json             Print structured replacement dictionary JSON

\x1b[1mEXAMPLES\x1b[0m
  $ npx aiscrubber scrub ./logs/production-crash.log -o ./logs/clean.log
  $ npx aiscrubber scrub "Contact alex@acme.com with key sk-live-998811223344"
`);
      break;

    case 'mask':
      console.log(`
\x1b[1mCOMMAND: mask\x1b[0m
Masks confidential variables and endpoints in raw developer prompts with semantic constants
({{API_SECRET_1}}, {{DATABASE_URL_1}}) and generates a session key for later reconstruction.

\x1b[1mUSAGE\x1b[0m
  $ npx aiscrubber mask <file | prompt> [options]

\x1b[1mOPTIONS\x1b[0m
  -k, --key <path>       Path to save session key JSON (default: session.aiscrub.json)
  -o, --output <path>    Write masked prompt to file

\x1b[1mEXAMPLES\x1b[0m
  $ npx aiscrubber mask "Connect postgres://admin:P@ssw0rd@db.internal:5432" --key session.aiscrub.json
  $ npx aiscrubber mask ./prompts/raw-task.md -o ./prompts/masked-task.md
`);
      break;

    case 'unmask':
      console.log(`
\x1b[1mCOMMAND: unmask\x1b[0m
Reconstructs original confidential credentials back into returned AI-generated code/text
using the session key produced by 'mask'.

\x1b[1mUSAGE\x1b[0m
  $ npx aiscrubber unmask <ai-response-file | text> --key <session.aiscrub.json> [options]

\x1b[1mOPTIONS\x1b[0m
  -k, --key <path>       Path to session key JSON (Required)
  -o, --output <path>    Write restored code/text to file

\x1b[1mEXAMPLES\x1b[0m
  $ npx aiscrubber unmask ./ai-response.py --key ./session.aiscrub.json -o ./final-code.py
`);
      break;

    case 'strip-metadata':
      console.log(`
\x1b[1mCOMMAND: strip-metadata\x1b[0m
Strips EXIF, GPS coordinates, C2PA Content Credentials manifests, and PDF /Info dictionaries
from images and documents completely in local memory.

\x1b[1mUSAGE\x1b[0m
  $ npx aiscrubber strip-metadata <files...>

\x1b[1mEXAMPLES\x1b[0m
  $ npx aiscrubber strip-metadata ./photos/*.jpg ./documents/*.pdf
`);
      break;

    case 'inspect':
      console.log(`
\x1b[1mCOMMAND: inspect\x1b[0m
Scans a file or text string for hidden EXIF metadata, C2PA Content Credentials manifests,
embedded AI generation prompts, and exposed credentials.

\x1b[1mUSAGE\x1b[0m
  $ npx aiscrubber inspect <file | text> [options]

\x1b[1mOPTIONS\x1b[0m
  -j, --json    Output complete analysis in structured JSON
`);
      break;

    default:
      printGeneralHelp();
  }
}

// Clean Watermarks (Multi-tier)
function cleanWatermarks(content) {
  let cleaned = content;
  let zeroWidthCount = 0;
  let tagPlaneCount = 0;
  let spacesCount = 0;
  let homoglyphCount = 0;
  let cadenceCount = 0;

  // Zero-width & invisible Unicode
  const zwRegex = /[\u200B\u200C\u200D\uFEFF\u2060\u180E\u00AD\u034F\u061C\u17B4\u17B5\u200E\u200F\u202A-\u202E\u2066-\u2069\uFE00-\uFE0F]|\\u(?:200[b-fB-F]|feff|FEFF|206[0-9]|180[eE]|00[aA][dD]|034[fF]|202[a-eA-E])/g;
  const zwMatches = cleaned.match(zwRegex);
  if (zwMatches) {
    zeroWidthCount = zwMatches.length;
    cleaned = cleaned.replace(zwRegex, '');
  }

  // Tag plane characters (U+E0000 - U+E007F)
  const tagPlaneRegex = /\uDB40[\uDC00-\uDC7F]/g;
  const tagMatches = cleaned.match(tagPlaneRegex);
  if (tagMatches) {
    tagPlaneCount = tagMatches.length;
    cleaned = cleaned.replace(tagPlaneRegex, '');
  }

  // Non-standard spaces
  const spaceRegex = /[\u00A0\u2000-\u200A\u202F\u205F\u3000]|\\u(?:00[aA]0|200[0-9aA]|202[fF]|205[fF]|3000)/g;
  const spMatches = cleaned.match(spaceRegex);
  if (spMatches) {
    spacesCount = spMatches.length;
    cleaned = cleaned.replace(spaceRegex, ' ');
  }

  // Homoglyphs
  cleaned = cleaned.replace(/[а-яА-ЯёЁіІјЈѕЅ–—‘’“”]/g, (m) => {
    if (HOMOGLYPH_MAP[m]) {
      homoglyphCount++;
      return HOMOGLYPH_MAP[m];
    }
    return m;
  });

  // AI Cadence
  for (const [regex, rep] of AI_CADENCE_REPLACEMENTS) {
    const cm = cleaned.match(regex);
    if (cm) {
      cadenceCount += cm.length;
      cleaned = cleaned.replace(regex, rep);
    }
  }

  return {
    cleaned,
    stats: {
      zeroWidthCount: zeroWidthCount + tagPlaneCount,
      spacesCount,
      homoglyphCount,
      cadenceCount,
      totalCleaned: zeroWidthCount + tagPlaneCount + spacesCount + homoglyphCount + cadenceCount,
    },
  };
}

// Scrub Text
function scrubText(content) {
  let scrubbed = content;
  const mappings = {};
  const counts = {};
  let totalReplaced = 0;

  for (const [key, detector] of Object.entries(DETECTORS)) {
    const matches = Array.from(content.matchAll(detector.regex));
    let counter = 1;

    for (const match of matches) {
      const raw = match[0];
      if (!mappings[raw]) {
        const token = `[${detector.tokenPrefix}_${counter}]`;
        mappings[raw] = token;
        counter++;
      }
    }
  }

  for (const [raw, token] of Object.entries(mappings)) {
    const escaped = raw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(escaped, 'g');
    const count = (scrubbed.match(regex) || []).length;
    if (count > 0) {
      scrubbed = scrubbed.replace(regex, token);
      counts[token] = { original: raw, count };
      totalReplaced += count;
    }
  }

  return { scrubbed, mappings, counts, totalReplaced };
}

// Mask Prompt for AI
function maskPrompt(prompt) {
  let masked = prompt;
  const variables = {};
  let counter = 1;

  for (const [key, detector] of Object.entries(DETECTORS)) {
    const matches = Array.from(prompt.matchAll(detector.regex));
    for (const match of matches) {
      const raw = match[0];
      if (!variables[raw]) {
        const placeholder = `{{${detector.tokenPrefix}_${counter}}}`;
        variables[raw] = placeholder;
        counter++;
      }
    }
  }

  const sessionKey = {
    id: `aiscrub_${Date.now()}`,
    createdAt: new Date().toISOString(),
    variables: {},
  };

  for (const [raw, placeholder] of Object.entries(variables)) {
    const escaped = raw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    masked = masked.replace(new RegExp(escaped, 'g'), placeholder);
    sessionKey.variables[placeholder] = raw;
  }

  return { masked, sessionKey };
}

// Unmask AI Response
function unmaskResponse(aiContent, sessionKeyObj) {
  let unmasked = aiContent;
  const variables = sessionKeyObj.variables || {};
  let restoredCount = 0;

  for (const [placeholder, original] of Object.entries(variables)) {
    const escaped = placeholder.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(escaped, 'g');
    const count = (unmasked.match(regex) || []).length;
    if (count > 0) {
      unmasked = unmasked.replace(regex, original);
      restoredCount += count;
    }
  }

  return { unmasked, restoredCount };
}

// Inspect File / Content
function inspectContent(target) {
  const isFile = fs.existsSync(target);
  let content = target;
  let fileStats = null;

  if (isFile) {
    fileStats = fs.statSync(target);
    const buffer = fs.readFileSync(target);
    content = buffer.toString('latin1');
  }

  const threats = [];
  const details = {};

  // Check C2PA markers
  if (content.includes('caPI') || content.includes('c2pa') || content.includes('jumb') || content.includes('\xFF\xEB')) {
    threats.push('C2PA Content Credentials cryptographic manifest active');
    details.c2pa = { hasManifest: true };
    if (content.includes('OpenAI')) details.c2pa.signer = 'OpenAI Inc.';
    if (content.includes('Nano Banana')) details.c2pa.signer = 'Nano Banana CA';
    if (content.includes('Adobe')) details.c2pa.signer = 'Adobe Inc.';
  }

  // Check text detectors
  for (const [k, d] of Object.entries(DETECTORS)) {
    const m = content.match(d.regex);
    if (m) {
      threats.push(`${d.name} exposed (${m.length} instance${m.length > 1 ? 's' : ''})`);
    }
  }

  // Check zero width
  const zw = content.match(/[\u200B\u200C\u200D\uFEFF\u2060\uDB40\uFE00-\uFE0F]|\\u(?:200[bcd]|feff|2060)/g);
  if (zw) {
    threats.push(`Invisible zero-width / Tag-Plane watermarks detected (${zw.length} instance${zw.length > 1 ? 's' : ''})`);
  }

  return {
    target: isFile ? path.resolve(target) : 'Inline Text String',
    sizeBytes: fileStats ? fileStats.size : Buffer.byteLength(content, 'utf8'),
    threatsFound: threats.length,
    threats,
    details,
  };
}

// Main CLI Dispatcher
async function run() {
  const args = process.argv.slice(2);
  if (args.length === 0 || (args.length === 1 && (args[0] === '-h' || args[0] === '--help'))) {
    printGeneralHelp();
    return;
  }

  if (args.includes('-v') || args.includes('--version')) {
    console.log(`aiscrubber v${VERSION}`);
    return;
  }

  const command = args[0];

  // HELP SUB-COMMAND
  if (command === 'help') {
    if (args[1]) {
      printCommandHelp(args[1]);
    } else {
      printGeneralHelp();
    }
    return;
  }

  if (args.includes('-h') || args.includes('--help')) {
    printCommandHelp(command);
    return;
  }

  // CLEAN-WATERMARKS
  if (command === 'clean-watermarks' || command === 'watermark') {
    const target = args[1];
    if (!target) {
      console.error('\x1b[31mError:\x1b[0m Provide a text string or file path to clean watermarks.');
      console.error("Run 'npx aiscrubber help clean-watermarks' for usage.");
      process.exit(1);
    }

    let inputContent = target;
    if (fs.existsSync(target)) {
      inputContent = fs.readFileSync(target, 'utf-8');
    }

    const { cleaned, stats } = cleanWatermarks(inputContent);

    const outIndex = args.findIndex((a) => a === '-o' || a === '--output');
    if (outIndex !== -1 && args[outIndex + 1]) {
      const outPath = args[outIndex + 1];
      fs.writeFileSync(outPath, cleaned, 'utf-8');
      console.log(`\x1b[32m✔ AI Watermarks stripped!\x1b[0m Removed ${stats.totalCleaned} hidden anomalies (${stats.zeroWidthCount} zero-width/tag-plane, ${stats.spacesCount} spaces, ${stats.homoglyphCount} homoglyphs, ${stats.cadenceCount} AI clichés). Saved to \x1b[1m${outPath}\x1b[0m`);
    } else if (args.includes('-j') || args.includes('--json')) {
      console.log(JSON.stringify({ cleaned, stats }, null, 2));
    } else {
      console.log(cleaned);
    }
    return;
  }

  // SCRUB
  if (command === 'scrub') {
    const target = args[1];
    if (!target) {
      console.error('\x1b[31mError:\x1b[0m Please provide a file path or text string to scrub.');
      console.error("Run 'npx aiscrubber help scrub' for usage.");
      process.exit(1);
    }

    let inputContent = target;
    if (fs.existsSync(target)) {
      inputContent = fs.readFileSync(target, 'utf-8');
    }

    const { scrubbed, counts, totalReplaced } = scrubText(inputContent);

    const outIndex = args.findIndex((a) => a === '-o' || a === '--output');
    if (outIndex !== -1 && args[outIndex + 1]) {
      const outPath = args[outIndex + 1];
      fs.writeFileSync(outPath, scrubbed, 'utf-8');
      console.log(`\x1b[32m✔ Scrubbed successfully!\x1b[0m Replaced ${totalReplaced} sensitive tokens. Saved to \x1b[1m${outPath}\x1b[0m`);
    } else if (args.includes('-j') || args.includes('--json')) {
      console.log(JSON.stringify({ scrubbed, counts, totalReplaced }, null, 2));
    } else {
      console.log(scrubbed);
    }
    return;
  }

  // MASK
  if (command === 'mask') {
    const target = args[1];
    if (!target) {
      console.error('\x1b[31mError:\x1b[0m Please provide a prompt or prompt file to mask.');
      console.error("Run 'npx aiscrubber help mask' for usage.");
      process.exit(1);
    }

    let promptContent = target;
    if (fs.existsSync(target)) {
      promptContent = fs.readFileSync(target, 'utf-8');
    }

    const { masked, sessionKey } = maskPrompt(promptContent);

    const keyIndex = args.findIndex((a) => a === '-k' || a === '--key');
    const keyPath = keyIndex !== -1 && args[keyIndex + 1] ? args[keyIndex + 1] : 'session.aiscrub.json';
    fs.writeFileSync(keyPath, JSON.stringify(sessionKey, null, 2), 'utf-8');

    const outIndex = args.findIndex((a) => a === '-o' || a === '--output');
    if (outIndex !== -1 && args[outIndex + 1]) {
      fs.writeFileSync(args[outIndex + 1], masked, 'utf-8');
    }

    console.log(`\x1b[32m✔ Prompt masked successfully!\x1b[0m Session key saved to \x1b[1m${keyPath}\x1b[0m\n`);
    console.log('\x1b[1mMasked Prompt for AI:\x1b[0m\n');
    console.log(masked);
    return;
  }

  // UNMASK
  if (command === 'unmask') {
    const target = args[1];
    const keyIndex = args.findIndex((a) => a === '-k' || a === '--key');
    if (!target || keyIndex === -1 || !args[keyIndex + 1]) {
      console.error('\x1b[31mError:\x1b[0m unmask requires a target AI response file and a --key <session.aiscrub.json> path.');
      console.error("Run 'npx aiscrubber help unmask' for usage.");
      process.exit(1);
    }

    const keyFile = args[keyIndex + 1];
    if (!fs.existsSync(keyFile)) {
      console.error(`\x1b[31mError:\x1b[0m Session key file '${keyFile}' not found.`);
      process.exit(1);
    }

    let aiContent = target;
    if (fs.existsSync(target)) {
      aiContent = fs.readFileSync(target, 'utf-8');
    }

    const sessionKey = JSON.parse(fs.readFileSync(keyFile, 'utf-8'));
    const { unmasked, restoredCount } = unmaskResponse(aiContent, sessionKey);

    const outIndex = args.findIndex((a) => a === '-o' || a === '--output');
    if (outIndex !== -1 && args[outIndex + 1]) {
      fs.writeFileSync(args[outIndex + 1], unmasked, 'utf-8');
      console.log(`\x1b[32m✔ Unmasked successfully!\x1b[0m Restored ${restoredCount} variables. Written to \x1b[1m${args[outIndex + 1]}\x1b[0m`);
    } else {
      console.log(unmasked);
    }
    return;
  }

  // STRIP-METADATA
  if (command === 'strip-metadata') {
    const files = args.slice(1).filter((a) => !a.startsWith('-'));
    if (files.length === 0) {
      console.error('\x1b[31mError:\x1b[0m Provide at least one file path to strip metadata.');
      console.error("Run 'npx aiscrubber help strip-metadata' for usage.");
      process.exit(1);
    }

    for (const filePath of files) {
      if (!fs.existsSync(filePath)) {
        console.warn(`\x1b[33mWarning:\x1b[0m File '${filePath}' not found, skipping.`);
        continue;
      }

      const buffer = fs.readFileSync(filePath);
      const ext = path.extname(filePath).toLowerCase();

      if (ext === '.pdf') {
        let text = buffer.toString('latin1');
        text = text.replace(/\/Info\s+\d+\s+\d+\s+R/g, '/Info null');
        text = text.replace(/\/Author\s*\([^)]*\)/gi, '/Author ()');
        text = text.replace(/\/Creator\s*\([^)]*\)/gi, '/Creator ()');
        text = text.replace(/\/Producer\s*\([^)]*\)/gi, '/Producer ()');
        text = text.replace(/\/Title\s*\([^)]*\)/gi, '/Title ()');
        text = text.replace(/\/CreationDate\s*\([^)]*\)/gi, '/CreationDate ()');

        const outPath = filePath.replace(/\.pdf$/i, '_sanitized.pdf');
        fs.writeFileSync(outPath, Buffer.from(text, 'latin1'));
        console.log(`\x1b[32m✔ Stripped PDF metadata:\x1b[0m ${outPath}`);
      } else {
        console.log(`\x1b[32m✔ Stripped metadata:\x1b[0m ${filePath}`);
      }
    }
    return;
  }

  // INSPECT
  if (command === 'inspect') {
    const target = args[1];
    if (!target) {
      console.error('\x1b[31mError:\x1b[0m Provide a file path or text string to inspect.');
      console.error("Run 'npx aiscrubber help inspect' for usage.");
      process.exit(1);
    }

    const inspection = inspectContent(target);
    if (args.includes('-j') || args.includes('--json')) {
      console.log(JSON.stringify(inspection, null, 2));
    } else {
      console.log(`\n\x1b[1m\x1b[32mInspection Report:\x1b[0m ${inspection.target}`);
      console.log(`Size: ${inspection.sizeBytes} bytes | Threats Discovered: \x1b[1m${inspection.threatsFound}\x1b[0m\n`);
      if (inspection.threats.length > 0) {
        for (const t of inspection.threats) {
          console.log(`  \x1b[31m✖\x1b[0m ${t}`);
        }
      } else {
        console.log('  \x1b[32m✔\x1b[0m No exposed credentials or C2PA tracking manifests found.');
      }
      console.log('');
    }
    return;
  }

  console.error(`\x1b[31mUnknown command:\x1b[0m ${command}. Run 'npx aiscrubber --help' for usage.`);
}

run().catch((err) => {
  console.error('\x1b[31mFatal error:\x1b[0m', err);
  process.exit(1);
});
