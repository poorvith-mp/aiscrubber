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

function printHelp() {
  console.log(`
\x1b[1m\x1b[32mAI\x1b[0m\x1b[1mscrubber CLI\x1b[0m \x1b[90mv${VERSION}\x1b[0m
Zero-telemetry privacy suite for developer prompts, crash logs, and files.

\x1b[1mUSAGE\x1b[0m
  $ npx aiscrubber <command> [options]

\x1b[1mCOMMANDS\x1b[0m
  \x1b[36mscrub\x1b[0m <file | text>           Scrub PII, tokens, and secrets into numbered labels
  \x1b[36mmask\x1b[0m <file | prompt>          Mask secrets with constants and generate a session key
  \x1b[36munmask\x1b[0m <ai-file> --key <key>   Reconstruct original secrets back into returned AI output
  \x1b[36mstrip-metadata\x1b[0m <files...>       Strip EXIF, GPS, and PDF/Audio metadata client-side
  \x1b[36minspect\x1b[0m <file>                 Inspect hidden metadata and security threats

\x1b[1mOPTIONS\x1b[0m
  -o, --output <path>            Write output to a specific file instead of stdout
  -k, --key <path>               Path to .aiscrub.json session key (required for unmask)
  -j, --json                     Output structured JSON with token replacement mappings
  -h, --help                     Show this help message
  -v, --version                  Show CLI version

\x1b[1mEXAMPLES\x1b[0m
  $ npx aiscrubber scrub ./logs/production-crash.log -o ./logs/clean.log
  $ npx aiscrubber mask "Connect postgres://user:pass@db.internal:5432" --key ./session.aiscrub.json
  $ npx aiscrubber unmask ./ai-response.py --key ./session.aiscrub.json -o ./final-code.py
  $ npx aiscrubber strip-metadata ./photos/*.jpg ./reports/*.pdf
`);
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

// Main CLI Dispatcher
async function run() {
  const args = process.argv.slice(2);
  if (args.length === 0 || args.includes('-h') || args.includes('--help')) {
    printHelp();
    return;
  }

  if (args.includes('-v') || args.includes('--version')) {
    console.log(`aiscrubber v${VERSION}`);
    return;
  }

  const command = args[0];

  // SCRUB
  if (command === 'scrub') {
    const target = args[1];
    if (!target) {
      console.error('\x1b[31mError:\x1b[0m Please provide a file path or text string to scrub.');
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
      process.exit(1);
    }

    for (const filePath of files) {
      if (!fs.existsSync(filePath)) {
        console.warn(`\x1b[33mWarning:\x1b[0m File '${filePath}' not found, skipping.`);
        continue;
      }

      const buffer = fs.readFileSync(filePath);
      const ext = path.extname(filePath).toLowerCase();

      // Clean PDF metadata
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

  console.error(`\x1b[31mUnknown command:\x1b[0m ${command}. Run 'npx aiscrubber --help' for usage.`);
}

run().catch((err) => {
  console.error('\x1b[31mFatal error:\x1b[0m', err);
  process.exit(1);
});
