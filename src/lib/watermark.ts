/**
 * AIScrubber — AI Text & Claude Watermark Removal Engine
 * Inspired by guillaumemeyer/watermarks-remover & Anthropic provenance disclosures.
 * 100% Client-Side / Zero-Telemetry
 */

export interface WatermarkCleaningOptions {
  mode: 'all' | 'invisible_only' | 'code_safe' | 'claude_clean';
  stripZeroWidth: boolean;
  normalizeWhitespace: boolean;
  normalizeHomoglyphs: boolean;
  stripAiCadence: boolean;
  trimMarkdownArtifacts: boolean;
}

export interface DetectedWatermarkEntity {
  char: string;
  codePoint: string;
  name: string;
  index: number;
  category: 'zero_width' | 'space' | 'bidi' | 'homoglyph' | 'ai_marker';
}

export interface WatermarkCleaningResult {
  cleanedText: string;
  stats: {
    zeroWidthRemoved: number;
    spacesNormalized: number;
    homoglyphsRestored: number;
    bidiControlsStripped: number;
    aiArtifactsCleaned: number;
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

// 3. Non-Standard Whitespace
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

// 4. Common AI & Confusable Homoglyphs (Cyrillic/Greek/Math to Latin)
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

export const DEFAULT_WATERMARK_OPTIONS: WatermarkCleaningOptions = {
  mode: 'all',
  stripZeroWidth: true,
  normalizeWhitespace: true,
  normalizeHomoglyphs: true,
  stripAiCadence: true,
  trimMarkdownArtifacts: true,
};

/**
 * Scan and inspect text for all hidden Unicode and watermark anomalies.
 */
export function inspectWatermarks(text: string): DetectedWatermarkEntity[] {
  const entities: DetectedWatermarkEntity[] = [];

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    const codePoint = `U+${ch.charCodeAt(0).toString(16).toUpperCase().padStart(4, '0')}`;

    if (ZERO_WIDTH_MAP[ch]) {
      entities.push({
        char: ch,
        codePoint,
        name: ZERO_WIDTH_MAP[ch],
        index: i,
        category: 'zero_width',
      });
    } else if (BIDI_MAP[ch]) {
      entities.push({
        char: ch,
        codePoint,
        name: BIDI_MAP[ch],
        index: i,
        category: 'bidi',
      });
    } else if (SPACE_MAP[ch]) {
      entities.push({
        char: ch,
        codePoint,
        name: SPACE_MAP[ch],
        index: i,
        category: 'space',
      });
    } else if (HOMOGLYPH_MAP[ch] && /[а-яА-ЯёЁіІјЈѕЅ]/.test(ch)) {
      entities.push({
        char: ch,
        codePoint,
        name: `Cyrillic/Confusable Homoglyph ('${ch}' -> '${HOMOGLYPH_MAP[ch]}')`,
        index: i,
        category: 'homoglyph',
      });
    }
  }

  // Also check for literal escape sequences like \u200b
  const literalMatches = Array.from(text.matchAll(/\\u(?:200[bcdBCD]|feff|FEFF|2060|180[eE]|00[aA][dD]|034[fF])/g));
  for (const m of literalMatches) {
    if (m.index !== undefined) {
      entities.push({
        char: m[0],
        codePoint: m[0].toUpperCase(),
        name: `Escaped Zero-Width Sequence (${m[0]})`,
        index: m.index,
        category: 'zero_width',
      });
    }
  }

  return entities;
}

/**
 * Clean and sanitize AI text, Claude responses, and invisible watermarks.
 */
export function cleanTextWatermarks(
  text: string,
  options: Partial<WatermarkCleaningOptions> = {}
): WatermarkCleaningResult {
  const opts: WatermarkCleaningOptions = { ...DEFAULT_WATERMARK_OPTIONS, ...options };
  const detectedEntities = inspectWatermarks(text);

  let cleaned = text;
  let zeroWidthRemoved = 0;
  let spacesNormalized = 0;
  let homoglyphsRestored = 0;
  let bidiControlsStripped = 0;
  let aiArtifactsCleaned = 0;

  // 1. Strip Zero-Width Characters (both raw Unicode and escaped string literals)
  if (opts.stripZeroWidth) {
    const zeroWidthRegex = /[\u200B\u200C\u200D\uFEFF\u2060\u180E\u00AD\u034F\u061C\u17B4\u17B5]|\\u(?:200[bcdBCD]|feff|FEFF|2060|180[eE]|00[aA][dD]|034[fF])/g;
    const matches = cleaned.match(zeroWidthRegex);
    if (matches) {
      zeroWidthRemoved = matches.length;
      cleaned = cleaned.replace(zeroWidthRegex, '');
    }
  }

  // 2. Strip Bidirectional / Invisible Formatting
  if (opts.stripZeroWidth || opts.mode === 'all') {
    const bidiRegex = /[\u200E\u200F\u202A-\u202E\u2066-\u2069]|\\u(?:200[efEF]|202[a-eA-E]|206[6-9])/g;
    const matches = cleaned.match(bidiRegex);
    if (matches) {
      bidiControlsStripped = matches.length;
      cleaned = cleaned.replace(bidiRegex, '');
    }
  }

  // 3. Normalize Whitespace (Unless in Code Safe mode where indentation must be strictly maintained)
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

  // 4. Normalize Homoglyphs
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

  // 5. Claude / AI Cadence & Markdown Watermark Artifacts
  if (opts.stripAiCadence || opts.mode === 'claude_clean' || opts.mode === 'all') {
    const aiFooters = [
      /\n*(?:I hope this helps|Let me know if you need anything else|Feel free to ask if you have more questions)!?\s*$/i,
      /\n*(?:As an AI (?:language model|assistant)[^.\n]*\.?)\s*$/i,
      /\n*(?:Note: Generated by Claude|Anthropic AI).*$/i,
    ];

    for (const footerRegex of aiFooters) {
      if (footerRegex.test(cleaned)) {
        cleaned = cleaned.replace(footerRegex, '');
        aiArtifactsCleaned++;
      }
    }

    cleaned = cleaned.replace(/ ([.,!?:;])/g, '$1');
  }

  return {
    cleanedText: cleaned,
    stats: {
      zeroWidthRemoved,
      spacesNormalized,
      homoglyphsRestored,
      bidiControlsStripped,
      aiArtifactsCleaned,
      totalAnomalies:
        zeroWidthRemoved +
        spacesNormalized +
        homoglyphsRestored +
        bidiControlsStripped +
        aiArtifactsCleaned,
    },
    detectedEntities,
  };
}
