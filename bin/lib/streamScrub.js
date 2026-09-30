import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { once } from 'node:events';
import { detectorDefinitions } from '../../src/lib/scrubCore.js';
import { createTextJobWorker, runTextJob } from './runTextJob.js';
import { validateConfig } from '../../src/lib/rulesCore.js';

const DEFAULT_LIMITS = Object.freeze({
  maxLines: 4096,
  maxLineBytes: 1024 * 1024,
  maxBlockBytes: 4 * 1024 * 1024,
  maxMapEntries: 200_000,
  maxMapBytes: 16 * 1024 * 1024,
});
const PROGRESS_INTERVAL_BYTES = 50 * 1024 * 1024;

function jobError(message) {
  const error = new Error(message);
  error.exitCode = 2;
  return error;
}

export async function streamScrubFile({
  inputPath,
  outputPath = null,
  toStdout = false,
  quiet = false,
  customRules = [],
  allowlist = [],
  suppressEntropy = true,
  enabledDetectorIds = new Set(detectorDefinitions.map((detector) => detector.id)),
  limits = {},
}) {
  if (toStdout) throw jobError('Streaming mode does not support stdout; use --output <path>.');
  if (!outputPath) throw jobError('Large files require --output <path>.');
  if (fs.existsSync(outputPath)) throw jobError(`Output file "${outputPath}" already exists; refusing to overwrite.`);
  const policy = validateConfig({ version: 1, customRules, allowlist });
  if (policy.customRules.some((rule) => rule.enabled && (rule.isRegex || /[\r\n]/.test(rule.patternString))) || policy.allowlist.some((rule) => rule.isRegex)) {
    throw jobError('Streaming supports only single-line literal rules and literal entropy allowlists. Use whole-file mode.');
  }

  const activeLimits = { ...DEFAULT_LIMITS, ...limits };
  const tempPath = path.join(path.dirname(outputPath), `.${path.basename(outputPath)}.${crypto.randomUUID()}.tmp`);
  const input = fs.createReadStream(inputPath, { highWaterMark: 64 * 1024 });
  const output = fs.createWriteStream(tempPath, { flags: 'wx' });
  let ownedTemp = false;
  let published = false;
  output.once('open', () => { ownedTemp = true; });
  let outputError;
  output.on('error', (error) => { outputError = error; });
  const decoder = new TextDecoder('utf-8', { fatal: true, ignoreBOM: true });
  const reserved = new Set();
  const allocated = new Set();
  let worker;
  let workerError;
  let jobId = 0;
  const assigned = new Map();
  const sequences = new Map();
  const counts = {};
  let mapBytes = 0;
  let totalRedactions = 0;
  let bytesProcessed = 0;
  let nextProgressAt = PROGRESS_INTERVAL_BYTES;

  async function scrubBlock(text) {
    for (const token of text.match(/\[[A-Z][A-Z0-9_]*_[0-9]+\]|\{\{[A-Z][A-Z0-9_]*_[0-9]+\}\}/g) || []) {
      if (allocated.has(token)) throw jobError('A later source token collides with an allocated replacement. Use whole-file mode.');
      reserved.add(token);
      if (reserved.size > activeLimits.maxMapEntries) throw jobError('Streaming token reservation limit exceeded.');
    }
    if (!worker) {
      worker = createTextJobWorker();
      worker.on('error', () => { workerError = jobError('Streaming worker failed. Reduce the input or change the policy.'); });
    }
    if (workerError) throw workerError;
    const { result: scrubbed } = await runTextJob({ jobId: ++jobId, revision: 1, operation: 'scrub', source: text,
      config: { ...policy, detectors: { disable: detectorDefinitions.filter(({ id }) => enabledDetectorIds && !enabledDetectorIds.has(id)).map(({ id }) => id) } }, suppressEntropy }, { worker });
    const accepted = scrubbed.acceptedMatches.map((match) => ({ ...match, token: match.token.slice(1, -1).replace(/_\d+$/, '') }));

    let cursor = 0;
    let result = '';
    for (const match of accepted) {
      const key = `${match.token}:${match.value}`;
      let token = assigned.get(key);
      if (!token) {
        let next = sequences.get(match.token) || 0;
        do { token = `[${match.token}_${++next}]`; } while (reserved.has(token));
        const entryBytes = Buffer.byteLength(key) + Buffer.byteLength(token);
        if (assigned.size < activeLimits.maxMapEntries && mapBytes + entryBytes <= activeLimits.maxMapBytes) {
          sequences.set(match.token, next);
          assigned.set(key, token);
          allocated.add(token);
          mapBytes += entryBytes;
        } else {
          throw jobError('Streaming mapping limit exceeded. Use smaller files; no partial result was published.');
        }
      }
      result += text.slice(cursor, match.start) + token;
      cursor = match.end;
      counts[match.detectorId] = (counts[match.detectorId] || 0) + 1;
      totalRedactions++;
    }
    return result + text.slice(cursor);
  }

  async function write(text) {
    if (outputError) throw outputError;
    if (!output.write(text, 'utf8')) await once(output, 'drain');
  }

  let carry = '';
  let block = [];
  let blockBytes = 0;
  let insidePem = null;

  async function flush() {
    if (!block.length) return;
    await write(await scrubBlock(block.join('')));
    block = [];
    blockBytes = 0;
  }

  async function appendLine(line) {
    const lineBytes = Buffer.byteLength(line);
    if (lineBytes > activeLimits.maxLineBytes || lineBytes > activeLimits.maxBlockBytes) {
      throw jobError('Streaming block limit exceeded.');
    }
    const begin = /-----BEGIN ([A-Z ]*PRIVATE KEY)-----/.exec(line);
    if (begin && insidePem) throw jobError('Nested private-key block is not supported.');
    if (!insidePem && (begin || blockBytes + lineBytes > activeLimits.maxBlockBytes)) await flush();
    if (begin) insidePem = begin[1];
    if (blockBytes + lineBytes > activeLimits.maxBlockBytes) throw jobError('Streaming private-key block limit exceeded.');
    block.push(line);
    blockBytes += lineBytes;
    const end = /-----END ([A-Z ]*PRIVATE KEY)-----/.exec(line);
    if (end) {
      if (!insidePem || end[1] !== insidePem) throw jobError('Mismatched private-key block delimiter.');
      insidePem = null;
    }
    if (block.length >= activeLimits.maxLines && !insidePem) await flush();
  }

  try {
    await once(output, 'open');
    for await (const chunk of input) {
      bytesProcessed += chunk.length;
      if (!quiet && bytesProcessed >= nextProgressAt) {
        process.stderr.write(`scrubbed ${Math.round(bytesProcessed / (1024 * 1024))} MiB • ${totalRedactions} redactions\n`);
        nextProgressAt += PROGRESS_INTERVAL_BYTES;
      }
      const decoded = carry + decoder.decode(chunk, { stream: true });
      let start = 0;
      for (let index = 0; index < decoded.length; index++) {
        if (decoded[index] !== '\n') continue;
        await appendLine(decoded.slice(start, index + 1));
        start = index + 1;
      }
      carry = decoded.slice(start);
      if (Buffer.byteLength(carry) > activeLimits.maxLineBytes) throw jobError('Streaming block limit exceeded.');
    }
    carry += decoder.decode();
    if (carry) await appendLine(carry);
    if (insidePem) throw jobError('Truncated private-key block. No partial result was published.');
    await flush();
    output.end();
    await once(output, 'close');
    fs.linkSync(tempPath, outputPath);
    published = true;
    fs.rmSync(tempPath, { force: true });
    return { totalRedactions, counts, bytesProcessed };
  } catch (error) {
    input.destroy();
    output.destroy();
    if (!output.closed) await once(output, 'close').catch(() => {});
    if (ownedTemp) fs.rmSync(tempPath, { force: true });
    if (published) fs.rmSync(outputPath, { force: true });
    throw error;
  } finally {
    if (worker) await worker.terminate();
  }
}