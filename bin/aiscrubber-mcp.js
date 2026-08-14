#!/usr/bin/env node

/**
 * AIScrubber Model Context Protocol (MCP) Server
 * Built by Poorvith M P (https://poorvithmp.com)
 * Native stdio JSON-RPC 2.0 MCP server for Claude Desktop, Claude Code, and Cursor.
 */

import readline from 'node:readline';

const SERVER_NAME = 'aiscrubber-mcp';
const SERVER_VERSION = '2.2.0';

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

function cleanWatermarkContent(text) {
  let cleaned = text;
  let zeroWidthCount = 0;
  let spacesCount = 0;
  let homoglyphsCount = 0;

  // Zero-width & invisible Unicode
  const zwRegex = /[\u200B\u200C\u200D\uFEFF\u2060\u180E\u00AD\u034F\u061C\u17B4\u17B5\u200E\u200F\u202A-\u202E\u2066-\u2069]/g;
  const zwMatches = cleaned.match(zwRegex);
  if (zwMatches) {
    zeroWidthCount = zwMatches.length;
    cleaned = cleaned.replace(zwRegex, '');
  }

  // Non-standard spaces
  const spaceRegex = /[\u00A0\u2000-\u200A\u202F\u205F\u3000]/g;
  const spMatches = cleaned.match(spaceRegex);
  if (spMatches) {
    spacesCount = spMatches.length;
    cleaned = cleaned.replace(spaceRegex, ' ');
  }

  // Homoglyphs
  cleaned = cleaned.replace(/[а-яА-ЯёЁіІјЈѕЅ–—‘’“”]/g, (m) => {
    if (HOMOGLYPH_MAP[m]) {
      homoglyphsCount++;
      return HOMOGLYPH_MAP[m];
    }
    return m;
  });

  return {
    cleaned_text: cleaned,
    zero_width_stripped: zeroWidthCount,
    spaces_normalized: spacesCount,
    homoglyphs_reverted: homoglyphsCount,
    total_anomalies_cleaned: zeroWidthCount + spacesCount + homoglyphsCount,
  };
}

function scrubContent(text) {
  let scrubbed = text;
  const mappings = {};
  let totalReplaced = 0;

  for (const [key, detector] of Object.entries(DETECTORS)) {
    const matches = Array.from(text.matchAll(detector.regex));
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
      totalReplaced += count;
    }
  }

  return { scrubbed, mappings, totalReplaced };
}

function maskPromptContent(prompt) {
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
    variables: {},
  };

  for (const [raw, placeholder] of Object.entries(variables)) {
    const escaped = raw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    masked = masked.replace(new RegExp(escaped, 'g'), placeholder);
    sessionKey.variables[placeholder] = raw;
  }

  return { masked, sessionKey };
}

function unmaskContent(aiResponse, sessionKey) {
  let unmasked = aiResponse;
  const variables = (typeof sessionKey === 'string' ? JSON.parse(sessionKey).variables : sessionKey.variables) || {};
  let count = 0;

  for (const [placeholder, original] of Object.entries(variables)) {
    const escaped = placeholder.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(escaped, 'g');
    const matchCount = (unmasked.match(regex) || []).length;
    if (matchCount > 0) {
      unmasked = unmasked.replace(regex, original);
      count += matchCount;
    }
  }

  return { unmasked, restoredVariables: count };
}

const TOOLS = [
  {
    name: 'clean_ai_watermarks',
    description: 'Strip invisible Unicode zero-width watermarks (Anthropic Claude / ChatGPT markers), normalize non-standard spaces, and revert homoglyphs.',
    inputSchema: {
      type: 'object',
      properties: {
        text: { type: 'string', description: 'Raw AI-generated text to strip watermarks from' },
      },
      required: ['text'],
    },
  },
  {
    name: 'scrub_text',
    description: 'Scrub PII, emails, API keys, passwords, IPs, and sensitive credentials into numbered safe tokens.',
    inputSchema: {
      type: 'object',
      properties: {
        text: { type: 'string', description: 'Raw text or log file content to sanitize' },
      },
      required: ['text'],
    },
  },
  {
    name: 'mask_prompt',
    description: 'Mask confidential secrets with placeholder variables (e.g. {{API_KEY_1}}) and return a session key before querying an external LLM.',
    inputSchema: {
      type: 'object',
      properties: {
        prompt: { type: 'string', description: 'Raw user prompt to sanitize for LLMs' },
      },
      required: ['prompt'],
    },
  },
  {
    name: 'unmask_response',
    description: 'Reconstruct original confidential values back into returned AI generated code/text using a session key.',
    inputSchema: {
      type: 'object',
      properties: {
        ai_response: { type: 'string', description: 'The text or code returned by the AI' },
        session_key: { type: 'object', description: 'The session key object generated by mask_prompt' },
      },
      required: ['ai_response', 'session_key'],
    },
  },
];

function handleMessage(msg) {
  const { id, method, params } = msg;

  if (method === 'initialize') {
    return {
      jsonrpc: '2.0',
      id,
      result: {
        protocolVersion: '2024-11-05',
        capabilities: {
          tools: {},
        },
        serverInfo: {
          name: SERVER_NAME,
          version: SERVER_VERSION,
        },
      },
    };
  }

  if (method === 'tools/list') {
    return {
      jsonrpc: '2.0',
      id,
      result: {
        tools: TOOLS,
      },
    };
  }

  if (method === 'tools/call') {
    const { name, arguments: args } = params || {};

    if (name === 'clean_ai_watermarks') {
      const result = cleanWatermarkContent(args?.text || '');
      return {
        jsonrpc: '2.0',
        id,
        result: {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        },
      };
    }

    if (name === 'scrub_text') {
      const result = scrubContent(args?.text || '');
      return {
        jsonrpc: '2.0',
        id,
        result: {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        },
      };
    }

    if (name === 'mask_prompt') {
      const result = maskPromptContent(args?.prompt || '');
      return {
        jsonrpc: '2.0',
        id,
        result: {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        },
      };
    }

    if (name === 'unmask_response') {
      const result = unmaskContent(args?.ai_response || '', args?.session_key || {});
      return {
        jsonrpc: '2.0',
        id,
        result: {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        },
      };
    }

    return {
      jsonrpc: '2.0',
      id,
      error: { code: -32601, message: `Tool '${name}' not found` },
    };
  }

  if (method === 'ping') {
    return { jsonrpc: '2.0', id, result: {} };
  }

  return {
    jsonrpc: '2.0',
    id,
    error: { code: -32601, message: `Method '${method}' not supported` },
  };
}

// Readline JSON-RPC loop over stdio
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  terminal: false,
});

rl.on('line', (line) => {
  if (!line.trim()) return;
  try {
    const parsed = JSON.parse(line);
    const response = handleMessage(parsed);
    if (response) {
      process.stdout.write(JSON.stringify(response) + '\n');
    }
  } catch (err) {
    process.stdout.write(
      JSON.stringify({
        jsonrpc: '2.0',
        id: null,
        error: { code: -32700, message: 'Parse error' },
      }) + '\n'
    );
  }
});
