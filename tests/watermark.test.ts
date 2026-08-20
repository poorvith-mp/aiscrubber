import { describe, expect, test } from 'vitest';
import { cleanTextWatermarks, DEFAULT_WATERMARK_OPTIONS, inspectWatermarks } from '../src/lib/watermark';

describe('watermark cleaning', () => {
  const contaminated = 'Today\u200B\uFEFF\u2060\u202E uses\u00A0spaces and Cyrillic а plus a rich tapestry of detail.\n\nI hope this helps! Feel free to ask if you have more questions.';

  test('reports concrete hidden entities with code points and severity', () => {
    const entities = inspectWatermarks(contaminated + '\u{E0061}\uFE0F');
    expect(entities.some(({ category }) => category === 'zero_width')).toBe(true);
    expect(entities.some(({ category }) => category === 'bidi')).toBe(true);
    expect(entities.some(({ category }) => category === 'homoglyph')).toBe(true);
    expect(entities.every(({ codePoint }) => codePoint.startsWith('U+') || codePoint === 'AI-CLICHE')).toBe(true);
  });

  test('cleans all anomaly classes and returns a bounded threat score', () => {
    const result = cleanTextWatermarks(contaminated + '\u{E0061}\uFE0F', DEFAULT_WATERMARK_OPTIONS);
    expect(result.cleanedText).not.toMatch(/[\u200B\uFEFF\u2060\u202E\uFE0F]/);
    expect(result.cleanedText).toContain('diverse mix of');
    expect(result.cleanedText).not.toContain('I hope this helps');
    expect(result.stats.totalAnomalies).toBeGreaterThan(6);
    expect(result.threatScore).toBeGreaterThan(0);
    expect(result.threatScore).toBeLessThanOrEqual(100);
  });

  test('respects code-safe and invisible-only modes', () => {
    const codeSafe = cleanTextWatermarks('const x = "а";\u200B', { ...DEFAULT_WATERMARK_OPTIONS, mode: 'code_safe' });
    expect(codeSafe.cleanedText).toContain('const x');
    expect(codeSafe.cleanedText).not.toContain('\u200B');

    const invisibleOnly = cleanTextWatermarks('rich tapestry of а\u200B', { ...DEFAULT_WATERMARK_OPTIONS, mode: 'invisible_only' });
    expect(invisibleOnly.cleanedText).toContain('rich tapestry of а');
    expect(invisibleOnly.cleanedText).not.toContain('\u200B');
  });

  test('returns clean input unchanged', () => {
    const result = cleanTextWatermarks('Plain human text.', DEFAULT_WATERMARK_OPTIONS);
    expect(result.cleanedText).toBe('Plain human text.');
    expect(result.threatLevel).toBe('CLEAN');
  });

  test('honors every disabled switch and classifies lower threat levels', () => {
    const unchanged = cleanTextWatermarks('а\u200B\u00A0rich tapestry of', {
      ...DEFAULT_WATERMARK_OPTIONS,
      stripZeroWidth: false,
      stripTagPlane: false,
      stripVariationSelectors: false,
      normalizeWhitespace: false,
      normalizeHomoglyphs: false,
      disruptAiCadence: false,
      trimAiFooters: false,
      mode: 'invisible_only',
    });
    expect(unchanged.cleanedText).toBe('а\u200B\u00A0rich tapestry of');
    expect(cleanTextWatermarks('а', DEFAULT_WATERMARK_OPTIONS).threatLevel).toBe('LOW');
    expect(cleanTextWatermarks('\u200B', DEFAULT_WATERMARK_OPTIONS).threatLevel).toBe('MEDIUM');
    expect(cleanTextWatermarks('\u200B\u200C\u200D', DEFAULT_WATERMARK_OPTIONS).threatLevel).toBe('HIGH');
  });
});
