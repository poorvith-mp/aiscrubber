import { parentPort } from 'node:worker_threads';
import { scrubBuiltIns } from '../../src/lib/scrubCore.js';
import { restoreSessionText } from '../../src/lib/sessionCore.js';
import { resolveMergedConfig, validateConfig } from '../../src/lib/rulesCore.js';
import { loadPacks } from './rulesLoader.js';

function execute(request) {
  const { jobId, revision, operation, source, sessionKey, decisions } = request;
  if (!Number.isInteger(jobId) || !Number.isInteger(revision) || typeof source !== 'string') {
    throw Object.assign(new Error('Invalid text job request'), { code: 'INVALID_REQUEST' });
  }
  if (operation === 'restore') {
    return { jobId, revision, result: restoreSessionText(source, sessionKey) };
  }
  if (operation !== 'scrub' && operation !== 'mask') {
    throw Object.assign(new Error('Unsupported text operation'), { code: 'INVALID_OPERATION' });
  }
  const resolved = resolveMergedConfig(validateConfig(request.config || { version: 1 }), loadPacks());
  const result = scrubBuiltIns(source, resolved.enabledDetectorIds, {
    allowlist: resolved.allowlist,
    customRules: resolved.customRules,
    decisions,
    suppressEntropy: request.suppressEntropy,
    tokenStyle: operation === 'mask' ? 'brace' : 'bracket',
  });
  return { jobId, revision, result };
}

parentPort?.on('message', (request) => {
  try {
    if (typeof request?.source !== 'string' || Buffer.byteLength(request.source, 'utf8') > 64 * 1024 * 1024) {
      throw Object.assign(new Error('Text input exceeds the supported limit'), { code: 'INPUT_TOO_LARGE' });
    }
    const response = execute(request);
    if (Buffer.byteLength(JSON.stringify(response.result), 'utf8') > 128 * 1024 * 1024) {
      throw Object.assign(new Error('Text output exceeds 128 MiB'), { code: 'OUTPUT_TOO_LARGE' });
    }
    parentPort.postMessage(response);
  } catch (cause) {
    parentPort.postMessage({
      jobId: request?.jobId,
      revision: request?.revision,
      error: {
        code: cause?.code || 'TEXT_JOB_FAILED',
        message: cause instanceof Error ? cause.message : 'Text processing failed',
      },
    });
  }
});
