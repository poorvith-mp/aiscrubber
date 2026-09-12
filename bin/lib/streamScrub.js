import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { collectBuiltInMatches, tokenizeMatches, detectorDefinitions } from '../../src/lib/scrubCore.js';

const CHUNK_LINE_LIMIT = 4096;
const MAX_MAP_ENTRIES = 200000;
const PROGRESS_INTERVAL_BYTES = 50 * 1024 * 1024; // 50 MiB

export async function streamScrubFile({
  inputPath,
  outputPath = null,
  toStdout = false,
  quiet = false,
  customRules = [],
  allowlist = [],
  suppressEntropy = true,
  enabledDetectorIds = new Set(detectorDefinitions.map((d) => d.id)),
}) {
  if (outputPath && fs.existsSync(outputPath)) {
    const err = new Error(`Output file "${outputPath}" already exists; refusing to overwrite.`);
    err.exitCode = 2;
    throw err;
  }

  if (!outputPath && !toStdout) {
    const err = new Error('Large files require --output <path> or --stdout flag.');
    err.exitCode = 2;
    throw err;
  }

  const outStream = outputPath ? fs.createWriteStream(outputPath) : process.stdout;

  const assigned = new Map();
  const sequences = new Map();
  const counts = {};
  let totalRedactions = 0;
  let bytesProcessed = 0;
  let nextProgressAt = PROGRESS_INTERVAL_BYTES;

  // Custom tokenize logic that shares global token mapping
  function scrubChunkText(chunkText) {
    const options = { allowlist, suppressEntropy };
    const matches = collectBuiltInMatches(chunkText, enabledDetectorIds, options);

    // Also run custom rules
    for (const rule of customRules) {
      if (!rule.enabled || !rule.patternString.trim()) continue;
      try {
        if (rule.isRegex) {
          const regex = new RegExp(rule.patternString, 'gi');
          for (const match of chunkText.matchAll(regex)) {
            if (match.index === undefined || !match[0]) continue;
            matches.push({ start: match.index, end: match.index + match[0].length, value: match[0], token: rule.token || 'CUSTOM', detectorId: `custom_${rule.id}` });
          }
        } else {
          const lower = chunkText.toLowerCase();
          const target = rule.patternString.toLowerCase();
          let pos = 0;
          while ((pos = lower.indexOf(target, pos)) !== -1) {
            matches.push({ start: pos, end: pos + target.length, value: chunkText.slice(pos, pos + target.length), token: rule.token || 'CUSTOM', detectorId: `custom_${rule.id}` });
            pos += target.length;
          }
        }
      } catch {}
    }

    const sorted = [...matches].sort((a, b) => {
      if (a.start !== b.start) return a.start - b.start;
      if (a.end !== b.end) return (b.end - b.start) - (a.end - a.start);
      const aCustom = a.detectorId.startsWith('custom_');
      const bCustom = b.detectorId.startsWith('custom_');
      if (aCustom !== bCustom) return aCustom ? -1 : 1;
      return 0;
    });

    const accepted = [];
    for (const match of sorted) {
      if (!accepted.some((item) => match.start < item.end && match.end > item.start)) {
        accepted.push(match);
      }
    }

    let cursor = 0;
    let output = '';
    for (const match of accepted) {
      const key = `${match.token}:${match.value.toLowerCase()}`;
      let token = assigned.get(key);
      if (!token) {
        if (assigned.size < MAX_MAP_ENTRIES) {
          const next = (sequences.get(match.token) || 0) + 1;
          sequences.set(match.token, next);
          token = `[${match.token}_${next}]`;
        } else {
          const hashSuffix = crypto.createHash('sha256').update(match.value).digest('hex').slice(0, 6);
          token = `[${match.token}_h${hashSuffix}]`;
        }
        assigned.set(key, token);
      }

      if (match.start > cursor) {
        output += chunkText.slice(cursor, match.start);
      }
      output += token;
      cursor = match.end;
      counts[match.detectorId] = (counts[match.detectorId] || 0) + 1;
      totalRedactions++;
    }

    if (cursor < chunkText.length) {
      output += chunkText.slice(cursor);
    }

    return output;
  }

  return new Promise((resolve, reject) => {
    const inStream = fs.createReadStream(inputPath, { highWaterMark: 64 * 1024 });
    let carryover = '';
    let lineCount = 0;
    let linesBuffer = [];
    let insidePem = false;

    function flushChunk() {
      if (linesBuffer.length === 0) return;
      const text = linesBuffer.join('');
      const scrubbed = scrubChunkText(text);
      outStream.write(scrubbed);
      linesBuffer = [];
      lineCount = 0;
    }

    inStream.on('data', (chunk) => {
      bytesProcessed += chunk.length;
      if (!quiet && bytesProcessed >= nextProgressAt) {
        process.stderr.write(`scrubbed ${Math.round(bytesProcessed / (1024 * 1024))} MiB • ${totalRedactions} redactions\n`);
        nextProgressAt += PROGRESS_INTERVAL_BYTES;
      }

      const str = carryover + chunk.toString('utf8');
      carryover = '';

      // Find all line endings (\r\n or \n)
      let start = 0;
      for (let i = 0; i < str.length; i++) {
        if (str[i] === '\n') {
          const line = str.slice(start, i + 1);
          start = i + 1;

          if (line.includes('-----BEGIN') && !line.includes('-----END')) {
            insidePem = true;
          }
          if (line.includes('-----END')) {
            insidePem = false;
          }

          linesBuffer.push(line);
          lineCount++;

          if (lineCount >= CHUNK_LINE_LIMIT && !insidePem) {
            flushChunk();
          }
        }
      }

      if (start < str.length) {
        carryover = str.slice(start);
      }
    });

    inStream.on('end', () => {
      if (carryover.length > 0) {
        linesBuffer.push(carryover);
      }
      flushChunk();
      if (outputPath) {
        outStream.end(() => {
          resolve({ totalRedactions, counts, bytesProcessed });
        });
      } else {
        resolve({ totalRedactions, counts, bytesProcessed });
      }
    });

    inStream.on('error', reject);
    outStream.on('error', reject);
  });
}
