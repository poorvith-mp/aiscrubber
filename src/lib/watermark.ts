/**
 * AIScrubber — AI Text & Claude Watermark Removal Engine
 * Inspired by guillaumemeyer/watermarks-remover & Anthropic provenance disclosures.
 * 100% Client-Side / Zero-Telemetry
 */

export interface WatermarkCleaningOptions {
  mode: 'all' | 'claude_clean' | 'code_safe' | 'invisible_only';
  stripZeroWidth: boolean;
  stripTagPlane: boolean;
  stripVariationSelectors: boolean;
  normalizeWhitespace: boolean;
  normalizeHomoglyphs: boolean;
  disruptAiCadence: boolean;
  trimAiFooters: boolean;
}

export interface DetectedWatermarkEntity {
  char: string;
  codePoint: string;
  name: string;
  index: number;
  length: number;
  category: 'zero_width' | 'tag_plane' | 'variation_selector' | 'space' | 'bidi' | 'homoglyph' | 'ai_cadence' | 'ai_footer';
  severity: 'high' | 'medium' | 'low';
}

export interface WatermarkCleaningResult {
  cleanedText: string;
  threatScore: number; // 0 to 100
  threatLevel: 'CLEAN' | 'LOW' | 'MEDIUM' | 'HIGH';
  stats: {
    zeroWidthRemoved: number;
    tagPlaneRemoved: number;
    variationSelectorsRemoved: number;
    spacesNormalized: number;
    homoglyphsRestored: number;
    bidiControlsStripped: number;
    aiCadenceDisrupted: number;
    aiFootersCleaned: number;
    totalAnomalies: number;
  };
  detectedEntities: DetectedWatermarkEntity[];
}

// 1. Zero-Width & Invisible Characters
const ZERO_WIDTH_MAP: Record<string, string> = {
  '\u200B': 'Zero Width Space (ZWSP)',
  '\u200C': 'Zero Width Non-Joiner (ZWNJ)',
  '\u200D': 'Zero Width Joiner (ZWJ)',
  '\uFEFF': 'Zero Width No-Break Space (BOM)',
  '\u2060': 'Word Joiner (WJ)',
  '\u180E': 'Mongolian Vowel Separator',
  '\u00AD': 'Soft Hyphen',
  '\u034F': 'Combining Grapheme Joiner',
  '\u061C': 'Arabic Letter Mark',
  '\u17B4': 'Khmer Vowel Inherent Aq',
  '\u17B5': 'Khmer Vowel Inherent Aa',
  '\u200B\u200C': 'Zero-Width Byte Sequence',
};

// 2. Bidirectional & Invisible Formatting Controls
const BIDI_MAP: Record<string, string> = {
  '\u200E': 'Left-to-Right Mark (LRM)',
  '\u200F': 'Right-to-Left Mark (RLM)',
  '\u202A': 'Left-to-Right Embedding (LRE)',
  '\u202B': 'Right-to-Left Embedding (RLE)',
  '\u202C': 'Pop Directional Formatting (PDF)',
  '\u202D': 'Left-to-Right Override (LRO)',
  '\u202E': 'Right-to-Left Override (RLO)',
  '\u2066': 'Left-to-Right Isolate (LRI)',
  '\u2067': 'Right-to-Left Isolate (RLI)',
  '\u2068': 'First Strong Isolate (FSI)',
  '\u2069': 'Pop Directional Isolate (PDI)',
};

// 3. Non-Standard Synthetic Whitespace
const SPACE_MAP: Record<string, string> = {
  '\u00A0': 'Non-Breaking Space (NBSP)',
  '\u2000': 'En Quad',
  '\u2001': 'Em Quad',
  '\u2002': 'En Space',
  '\u2003': 'Em Space',
  '\u2004': 'Three-Per-Em Space',
  '\u2005': 'Four-Per-Em Space',
  '\u2006': 'Six-Per-Em Space',
  '\u2007': 'Figure Space',
  '\u2008': 'Punctuation Space',
  '\u2009': 'Thin Space',
  '\u200A': 'Hair Space',
  '\u202F': 'Narrow No-Break Space',
  '\u205F': 'Medium Mathematical Space',
  '\u3000': 'Ideographic Space (Fullwidth)',
};

// 4. Cyrillic / Confusable Homoglyphs
const HOMOGLYPH_MAP: Record<string, string> = {
  'а': 'a', 'А': 'A',
  'с': 'c', 'С': 'C',
  'е': 'e', 'Е': 'E',
  'о': 'o', 'О': 'O',
  'р': 'p', 'Р': 'P',
  'ѕ': 's', 'Ѕ': 'S',
  'х': 'x', 'Х': 'X',
  'у': 'y', 'У': 'Y',
  'і': 'i', 'І': 'I',
  'ј': 'j', 'Ј': 'J',
  'В': 'B', 'Н': 'H', 'М': 'M', 'Т': 'T', 'К': 'K',
  'а́': 'a', 'е́': 'e', 'и́': 'i', 'о́': 'o',
  '–': '-', '—': '-', '‘': "'", '’': "'", '“': '"', '”': '"',
};

// 5. Statistical AI Clichés & Stylometric Tells
export const AI_CADENCE_REPLACEMENTS: [RegExp, string, string][] = [
  [/\bdelve(?:s)? into\b/gi, 'explore', 'AI Cliché: delve into'],
  [/\bdelving into\b/gi, 'exploring', 'AI Cliché: delving into'],
  [/\ba testament to\b/gi, 'proof of', 'AI Cliché: a testament to'],
  [/\brich tapestry of\b/gi, 'diverse mix of', 'AI Cliché: rich tapestry of'],
  [/\bplays a crucial role\b/gi, 'is essential', 'AI Cliché: plays a crucial role'],
  [/\bcrucial role\b/gi, 'key role', 'AI Cliché: crucial role'],
  [/\bbeacon of\b/gi, 'guide for', 'AI Cliché: beacon of'],
  [/\bnavigating the landscape of\b/gi, 'managing', 'AI Cliché: navigating the landscape of'],
  [/\bit is important to (?:note|remember) that\b/gi, 'note that', 'AI Cliché: it is important to note that'],
  [/\bunderscores the importance of\b/gi, 'highlights', 'AI Cliché: underscores the importance of'],
  [/\bin today's fast-paced digital world\b/gi, 'today', 'AI Cliché: in today\'s fast-paced digital world'],
  [/\bin summary,?\b/gi, 'overall,', 'AI Cliché: in summary'],
  [/\bseamlessly integrates\b/gi, 'integrates', 'AI Cliché: seamlessly integrates'],
];

export const DEFAULT_WATERMARK_OPTIONS: WatermarkCleaningOptions = {
  mode: 'all',
  stripZeroWidth: true,
  stripTagPlane: true,
  stripVariationSelectors: true,
  normalizeWhitespace: true,
  normalizeHomoglyphs: true,
  disruptAiCadence: true,
  trimAiFooters: true,
};

/**
 * Deep inspection of text for invisible Unicode, Tag Plane characters, Variation Selectors, homoglyphs, and AI cadence markers.
 */
export function inspectWatermarks(text: string): DetectedWatermarkEntity[] {
  const entities: DetectedWatermarkEntity[] = [];

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    const code = ch.charCodeAt(0);

    // 1. Zero-Width Characters
    if (ZERO_WIDTH_MAP[ch]) {
      entities.push({
        char: ch,
        codePoint: `U+${code.toString(16).toUpperCase().padStart(4, '0')}`,
        name: ZERO_WIDTH_MAP[ch],
        index: i,
        length: 1,
        category: 'zero_width',
        severity: 'high',
      });
      continue;
    }

    // 2. Bidirectional & Invisible Formatting Controls
    if (BIDI_MAP[ch]) {
      entities.push({
        char: ch,
        codePoint: `U+${code.toString(16).toUpperCase().padStart(4, '0')}`,
        name: BIDI_MAP[ch],
        index: i,
        length: 1,
        category: 'bidi',
        severity: 'high',
      });
      continue;
    }

    // 3. Variation Selectors (U+FE00 - U+FE0F)
    if (code >= 0xfe00 && code <= 0xfe0f) {
      entities.push({
        char: ch,
        codePoint: `U+${code.toString(16).toUpperCase().padStart(4, '0')}`,
        name: `Variation Selector ${code - 0xfe00 + 1}`,
        index: i,
        length: 1,
        category: 'variation_selector',
        severity: 'high',
      });
      continue;
    }

    // 4. Tag Plane Surrogate Pairs (U+E0000 - U+E007F) - Invisible ASCII watermarking
    if (code >= 0xd800 && code <= 0xdbff && i + 1 < text.length) {
      const nextCode = text.charCodeAt(i + 1);
      if (code === 0xdb40 && nextCode >= 0xdc00 && nextCode <= 0xdc7f) {
        const tagChar = String.fromCharCode(nextCode - 0xdc00);
        entities.push({
          char: text.substring(i, i + 2),
          codePoint: `U+E00${(nextCode - 0xdc00).toString(16).toUpperCase().padStart(2, '0')}`,
          name: `Invisible Tag Plane Token ('${tagChar === ' ' ? 'SPACE' : tagChar}')`,
          index: i,
          length: 2,
          category: 'tag_plane',
          severity: 'high',
        });
        i++; // Skip second surrogate
        continue;
      }
    }

    // 5. Non-Standard Whitespace
    if (SPACE_MAP[ch]) {
      entities.push({
        char: ch,
        codePoint: `U+${code.toString(16).toUpperCase().padStart(4, '0')}`,
        name: SPACE_MAP[ch],
        index: i,
        length: 1,
        category: 'space',
        severity: 'medium',
      });
      continue;
    }

    // 6. Homoglyphs
    if (HOMOGLYPH_MAP[ch] && /[а-яА-ЯёЁіІјЈѕЅ]/.test(ch)) {
      entities.push({
        char: ch,
        codePoint: `U+${code.toString(16).toUpperCase().padStart(4, '0')}`,
        name: `Cyrillic Homoglyph ('${ch}' -> '${HOMOGLYPH_MAP[ch]}')`,
        index: i,
        length: 1,
        category: 'homoglyph',
        severity: 'medium',
      });
    }
  }

  // 7. Literal escaped sequences like \u200b
  const literalMatches = Array.from(text.matchAll(/\\u(?:200[bcdBCD]|feff|FEFF|2060|180[eE]|00[aA][dD]|034[fF])/g));
  for (const m of literalMatches) {
    if (m.index !== undefined) {
      entities.push({
        char: m[0],
        codePoint: m[0].toUpperCase(),
        name: `Escaped Zero-Width Sequence (${m[0]})`,
        index: m.index,
        length: m[0].length,
        category: 'zero_width',
        severity: 'high',
      });
    }
  }

  // 8. AI Cadence / Cliché scanning
  for (const [regex, _rep, desc] of AI_CADENCE_REPLACEMENTS) {
    const matches = Array.from(text.matchAll(regex));
    for (const m of matches) {
      if (m.index !== undefined) {
        entities.push({
          char: m[0],
          codePoint: 'AI-CLICHE',
          name: desc,
          index: m.index,
          length: m[0].length,
          category: 'ai_cadence',
          severity: 'low',
        });
      }
    }
  }

  return entities;
}

/**
 * Universal AI Watermark & Provenance Sanitizer
 */
export function cleanTextWatermarks(
  text: string,
  options: Partial<WatermarkCleaningOptions> = {}
): WatermarkCleaningResult {
  const opts: WatermarkCleaningOptions = { ...DEFAULT_WATERMARK_OPTIONS, ...options };
  const detectedEntities = inspectWatermarks(text);

  let cleaned = text;
  let zeroWidthRemoved = 0;
  let tagPlaneRemoved = 0;
  let variationSelectorsRemoved = 0;
  let spacesNormalized = 0;
  let homoglyphsRestored = 0;
  let bidiControlsStripped = 0;
  let aiCadenceDisrupted = 0;
  let aiFootersCleaned = 0;

  // 1. Strip Zero-Width Characters
  if (opts.stripZeroWidth) {
    const zeroWidthRegex = /[\u200B\u200C\u200D\uFEFF\u2060\u180E\u00AD\u034F\u061C\u17B4\u17B5]|\\u(?:200[bcdBCD]|feff|FEFF|2060|180[eE]|00[aA][dD]|034[fF])/g;
    const matches = cleaned.match(zeroWidthRegex);
    if (matches) {
      zeroWidthRemoved = matches.length;
      cleaned = cleaned.replace(zeroWidthRegex, '');
    }
  }

  // 2. Strip Tag Plane Characters (U+E0000 - U+E007F) & Variation Selectors
  if (opts.stripTagPlane || opts.mode === 'all') {
    const tagPlaneRegex = /\uDB40[\uDC00-\uDC7F]/g;
    const matches = cleaned.match(tagPlaneRegex);
    if (matches) {
      tagPlaneRemoved = matches.length;
      cleaned = cleaned.replace(tagPlaneRegex, '');
    }
  }

  if (opts.stripVariationSelectors || opts.mode === 'all') {
    const vsRegex = /[\uFE00-\uFE0F]/g;
    const matches = cleaned.match(vsRegex);
    if (matches) {
      variationSelectorsRemoved = matches.length;
      cleaned = cleaned.replace(vsRegex, '');
    }
  }

  // 3. Strip Bidirectional / Invisible Formatting Controls
  if (opts.stripZeroWidth || opts.mode === 'all') {
    const bidiRegex = /[\u200E\u200F\u202A-\u202E\u2066-\u2069]|\\u(?:200[efEF]|202[a-eA-E]|206[6-9])/g;
    const matches = cleaned.match(bidiRegex);
    if (matches) {
      bidiControlsStripped = matches.length;
      cleaned = cleaned.replace(bidiRegex, '');
    }
  }

  // 4. Normalize Whitespace (Unless in Code Safe mode where indentation must be preserved)
  if (opts.normalizeWhitespace) {
    const nonStdSpaceRegex = /[\u00A0\u2000-\u200A\u202F\u205F\u3000]|\\u(?:00[aA]0|200[0-9aA]|202[fF]|205[fF]|3000)/g;
    const matches = cleaned.match(nonStdSpaceRegex);
    if (matches) {
      spacesNormalized = matches.length;
      cleaned = cleaned.replace(nonStdSpaceRegex, ' ');
    }

    if (opts.mode !== 'code_safe') {
      cleaned = cleaned.replace(/[ \t]{2,}/g, ' ');
    }
  }

  // 5. Normalize Homoglyphs & Typographic Quotes/Dashes
  if (opts.normalizeHomoglyphs && opts.mode !== 'invisible_only') {
    let homoglyphCount = 0;
    cleaned = cleaned.replace(/[а-яА-ЯёЁіІјЈѕЅ–—‘’“”]/g, (match) => {
      if (HOMOGLYPH_MAP[match]) {
        homoglyphCount++;
        return HOMOGLYPH_MAP[match];
      }
      return match;
    });
    homoglyphsRestored = homoglyphCount;
  }

  // 6. AI Cadence & Stylometric Disruption
  if (opts.disruptAiCadence && (opts.mode === 'all' || opts.mode === 'claude_clean')) {
    for (const [regex, replacement] of AI_CADENCE_REPLACEMENTS) {
      const matches = cleaned.match(regex);
      if (matches) {
        aiCadenceDisrupted += matches.length;
        cleaned = cleaned.replace(regex, replacement);
      }
    }

    // Clean artificial markdown spaces before punctuation
    cleaned = cleaned.replace(/ ([.,!?:;])/g, '$1');
  }

  // 7. Trim AI Disclaimers & Claude Footers
  if (opts.trimAiFooters && (opts.mode === 'all' || opts.mode === 'claude_clean')) {
    const aiFooters = [
      /\n*(?:I hope this helps|Let me know if you need anything else|Feel free to ask if you have more questions|Hope this helps)[.!?]*\s*$/i,
      /\n*(?:As an AI (?:language model|assistant)[^.\n]*\.?)\s*$/i,
      /\n*(?:Note: Generated by Claude|Anthropic AI|Generated with AI).*$/i,
    ];

    for (const footerRegex of aiFooters) {
      while (footerRegex.test(cleaned)) {
        cleaned = cleaned.replace(footerRegex, '');
        aiFootersCleaned++;
      }
    }
  }

  const totalAnomalies =
    zeroWidthRemoved +
    tagPlaneRemoved +
    variationSelectorsRemoved +
    spacesNormalized +
    homoglyphsRestored +
    bidiControlsStripped +
    aiCadenceDisrupted +
    aiFootersCleaned;

  // Calculate Threat Score (0 to 100%)
  let score = 0;
  score += (zeroWidthRemoved + tagPlaneRemoved + variationSelectorsRemoved + bidiControlsStripped) * 25;
  score += (spacesNormalized + homoglyphsRestored) * 10;
  score += (aiCadenceDisrupted + aiFootersCleaned) * 8;
  const threatScore = Math.min(100, score);

  let threatLevel: WatermarkCleaningResult['threatLevel'] = 'CLEAN';
  if (threatScore >= 60) threatLevel = 'HIGH';
  else if (threatScore >= 25) threatLevel = 'MEDIUM';
  else if (threatScore > 0) threatLevel = 'LOW';

  return {
    cleanedText: cleaned,
    threatScore,
    threatLevel,
    stats: {
      zeroWidthRemoved,
      tagPlaneRemoved,
      variationSelectorsRemoved,
      spacesNormalized,
      homoglyphsRestored,
      bidiControlsStripped,
      aiCadenceDisrupted,
      aiFootersCleaned,
      totalAnomalies,
    },
    detectedEntities,
  };
}
