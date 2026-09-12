/**
 * AIScrubber Model Context Protocol (MCP) Server Logic
 * Built by Poorvith M P (https://poorvithmp.com)
 * Handles JSON-RPC 2.0 requests for AIScrubber MCP.
 */

import { detectorDefinitions, scrubBuiltIns } from '../../src/lib/scrubCore.js';
import { loadConfig } from './rulesLoader.js';

const SERVER_NAME = 'aiscrubber-mcp';
const SERVER_VERSION = '2.4.0';

let currentConfig = loadConfig();

function resolveCallRules(perCallCustomRules, perCallAllowlist) {
  let customRules = currentConfig.customRules ? [...currentConfig.customRules] : [];
  let allowlist = currentConfig.allowlist ? [...currentConfig.allowlist] : [];

  if (Array.isArray(perCallCustomRules) && perCallCustomRules.length > 0) {
    const map = new Map(customRules.map((r) => [r.id, r]));
    for (const r of perCallCustomRules) {
      if (r && r.id) {
        map.set(r.id, { ...r });
      }
    }
    customRules = Array.from(map.values());
  }

  if (Array.isArray(perCallAllowlist) && perCallAllowlist.length > 0) {
    const existingVals = new Set(allowlist.map((a) => a.value));
    for (const a of perCallAllowlist) {
      if (a && typeof a.value === 'string' && !existingVals.has(a.value)) {
        allowlist.push(a);
        existingVals.add(a.value);
      }
    }
  }

  return { customRules, allowlist };
}

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

function cleanWatermarkContent(text) {
  let cleaned = text;
  let zeroWidthCount = 0;
  let tagPlaneCount = 0;
  let spacesCount = 0;
  let homoglyphsCount = 0;
  let cadenceCount = 0;

  // Zero-width & invisible Unicode
  const zwRegex = /[\u200B\u200C\u200D\uFEFF\u2060\u180E\u00AD\u034F\u061C\u17B4\u17B5\u200E\u200F\u202A-\u202E\u2066-\u2069\uFE00-\uFE0F]|\\u(?:200[b-fB-F]|feff|FEFF|206[0-9]|180[eE]|00[aA][dD]|034[fF]|202[a-eA-E])/g;
  const zwMatches = cleaned.match(zwRegex);
  if (zwMatches) {
    zeroWidthCount = zwMatches.length;
    cleaned = cleaned.replace(zwRegex, '');
  }

  // Tag plane tokens
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
      homoglyphsCount++;
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
    cleaned_text: cleaned,
    zero_width_stripped: zeroWidthCount + tagPlaneCount,
    spaces_normalized: spacesCount,
    homoglyphs_reverted: homoglyphsCount,
    ai_cliches_disrupted: cadenceCount,
    total_anomalies_cleaned: zeroWidthCount + tagPlaneCount + spacesCount + homoglyphsCount + cadenceCount,
  };
}

function scrubContent(text, options = {}) {
  const result = scrubBuiltIns(text, undefined, { ...options, suppressEntropy: true });
  return {
    scrubbed: result.text,
    mappings: Object.fromEntries(result.mappings.map(({ original, token }) => [original, token])),
    totalReplaced: result.totalRedactions,
  };
}

function maskPromptContent(prompt, options = {}) {
  const scrubbed = scrubBuiltIns(prompt, undefined, { ...options, suppressEntropy: true });
  let masked = scrubbed.text;
  const sessionKey = {
    id: `aiscrub_${Date.now()}`,
    variables: {},
  };
  for (const { token, original } of scrubbed.mappings) {
    const placeholder = token.replace('[', '{{').replace(']', '}}');
    masked = masked.split(token).join(placeholder);
    sessionKey.variables[placeholder] = original;
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
      unmasked = unmasked.replace(regex, () => original);
      count += matchCount;
    }
  }

  return { unmasked, restoredVariables: count };
}

function inspectContent(content, options = {}) {
  const threats = [];
  const details = {};

  const scrubbed = scrubBuiltIns(content, undefined, { ...options, suppressEntropy: true });
  for (const detector of detectorDefinitions) {
    const count = scrubbed.counts[detector.id] || 0;
    if (count) threats.push(`${detector.label} exposed (${count} instance${count > 1 ? 's' : ''})`);
  }

  if (options.customRules) {
    for (const rule of options.customRules) {
      const count = scrubbed.counts[`custom_${rule.id}`] || 0;
      if (count) threats.push(`${rule.label || rule.id} exposed (${count} instance${count > 1 ? 's' : ''})`);
    }
  }

  const zw = content.match(/[\u200B\u200C\u200D\uFEFF\u2060\uDB40\uFE00-\uFE0F]|\\u(?:200[bcd]|feff|2060)/g);
  if (zw) {
    threats.push(`Invisible zero-width / Tag Plane characters detected (${zw.length} instance${zw.length > 1 ? 's' : ''})`);
  }

  return {
    sizeBytes: Buffer.byteLength(content, 'utf8'),
    threatsFound: threats.length,
    threats,
    details,
  };
}

const TOOLS = [
  {
    name: 'reload_rules',
    description: 'Reload rules and active rule packs from .aiscrubrc.json without server restart.',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'clean_ai_watermarks',
    description: 'Strip invisible Unicode zero-width watermarks, Tag-Plane surrogate characters, normalize non-standard spaces, revert homoglyphs, and disrupt AI cadence clichés.',
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
    description: 'Scrub PII, emails, API keys, passwords, IPs, and sensitive credentials into numbered safe tokens, applying entropy suppression and active rules source.',
    inputSchema: {
      type: 'object',
      properties: {
        text: { type: 'string', description: 'Raw text or log file content to sanitize' },
        allowlist: {
          type: 'array',
          description: 'Optional per-call allowlist rules ({ value, isRegex })',
          items: {
            type: 'object',
            properties: {
              value: { type: 'string' },
              isRegex: { type: 'boolean' },
            },
            required: ['value'],
          },
        },
        customRules: {
          type: 'array',
          description: 'Optional per-call custom rules ({ id, label, token, patternString, isRegex, enabled })',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              label: { type: 'string' },
              token: { type: 'string' },
              patternString: { type: 'string' },
              isRegex: { type: 'boolean' },
              enabled: { type: 'boolean' },
            },
            required: ['id', 'patternString'],
          },
        },
      },
      required: ['text'],
    },
  },
  {
    name: 'mask_prompt',
    description: 'Mask confidential secrets with placeholder variables (e.g. {{API_KEY_1}}) and return a session key before querying an external LLM, applying active rules source.',
    inputSchema: {
      type: 'object',
      properties: {
        prompt: { type: 'string', description: 'Raw user prompt to sanitize for LLMs' },
        allowlist: {
          type: 'array',
          description: 'Optional per-call allowlist rules ({ value, isRegex })',
          items: { type: 'object' },
        },
        customRules: {
          type: 'array',
          description: 'Optional per-call custom rules',
          items: { type: 'object' },
        },
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
  {
    name: 'inspect_content',
    description: 'Inspect text or code for leaked API keys, tokens, PII, invisible Unicode characters, and entropy candidates using active rules source.',
    inputSchema: {
      type: 'object',
      properties: {
        text: { type: 'string', description: 'Raw text or code snippet to inspect' },
        allowlist: {
          type: 'array',
          description: 'Optional per-call allowlist rules ({ value, isRegex })',
          items: { type: 'object' },
        },
        customRules: {
          type: 'array',
          description: 'Optional per-call custom rules',
          items: { type: 'object' },
        },
      },
      required: ['text'],
    },
  },
];

function handleMessage(msg) {
  const { id, method, params } = msg;

  // Handle notifications (no response should ever be sent)
  if (id === undefined || (method && method.startsWith('notifications/')) || method === '$/cancelRequest') {
    return null;
  }

  if (method === 'initialize') {
    return {
      jsonrpc: '2.0',
      id,
      result: {
        protocolVersion: '2024-11-05',
        capabilities: {
          tools: {},
          resources: {},
          prompts: {},
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

  if (method === 'resources/list') {
    return {
      jsonrpc: '2.0',
      id,
      result: {
        resources: [],
      },
    };
  }

  if (method === 'prompts/list') {
    return {
      jsonrpc: '2.0',
      id,
      result: {
        prompts: [],
      },
    };
  }

  if (method === 'logging/setLevel') {
    return {
      jsonrpc: '2.0',
      id,
      result: {},
    };
  }

  if (method === 'tools/call') {
    const { name, arguments: args } = params || {};

    if (name === 'reload_rules') {
      try {
        currentConfig = loadConfig();
      } catch (err) {
        return {
          jsonrpc: '2.0',
          id,
          error: { code: -32603, message: `Failed to reload rules: ${err.message}` },
        };
      }
      const result = {
        rulesSource: currentConfig.source,
        customRuleCount: currentConfig.customRules.length,
        allowlistCount: currentConfig.allowlist.length,
      };
      return {
        jsonrpc: '2.0',
        id,
        result: {
          rulesSource: currentConfig.source,
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        },
      };
    }

    if (name === 'clean_ai_watermarks') {
      const result = cleanWatermarkContent(args?.text || '');
      result.rulesSource = currentConfig.source;
      return {
        jsonrpc: '2.0',
        id,
        result: {
          rulesSource: currentConfig.source,
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
      const { customRules, allowlist } = resolveCallRules(args?.customRules, args?.allowlist);
      const result = scrubContent(args?.text || '', { customRules, allowlist });
      result.rulesSource = currentConfig.source;
      return {
        jsonrpc: '2.0',
        id,
        result: {
          rulesSource: currentConfig.source,
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
      const { customRules, allowlist } = resolveCallRules(args?.customRules, args?.allowlist);
      const result = maskPromptContent(args?.prompt || '', { customRules, allowlist });
      result.rulesSource = currentConfig.source;
      return {
        jsonrpc: '2.0',
        id,
        result: {
          rulesSource: currentConfig.source,
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
      result.rulesSource = currentConfig.source;
      return {
        jsonrpc: '2.0',
        id,
        result: {
          rulesSource: currentConfig.source,
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        },
      };
    }

    if (name === 'inspect_content') {
      const { customRules, allowlist } = resolveCallRules(args?.customRules, args?.allowlist);
      const result = inspectContent(args?.text || '', { customRules, allowlist });
      result.rulesSource = currentConfig.source;
      return {
        jsonrpc: '2.0',
        id,
        result: {
          rulesSource: currentConfig.source,
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

export { handleMessage, SERVER_NAME, SERVER_VERSION };
