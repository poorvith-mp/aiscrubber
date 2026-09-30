/// <reference lib="webworker" />
import { scrubBuiltIns } from '../lib/scrubCore.js';
import { restoreSessionText } from '../lib/sessionCore.js';
import { BUILTIN_PACKS } from '../lib/rulesConfig';
import { resolveMergedConfig, validateConfig } from '../lib/rulesCore.js';
import type { TextJobRequest, TextJobResponse } from '../lib/textJob';

function execute(request: TextJobRequest): TextJobResponse {
  if (request.operation === 'restore') {
    return { jobId: request.jobId, revision: request.revision, result: restoreSessionText(request.source, request.sessionKey) };
  }
  const resolved = resolveMergedConfig(validateConfig(request.config), BUILTIN_PACKS);
  return {
    jobId: request.jobId,
    revision: request.revision,
    result: scrubBuiltIns(request.source, resolved.enabledDetectorIds, {
      allowlist: resolved.allowlist,
      customRules: resolved.customRules,
      decisions: request.decisions,
      suppressEntropy: request.suppressEntropy,
      tokenStyle: request.operation === 'mask' ? 'brace' : 'bracket',
    }),
  };
}

self.onmessage = (event: MessageEvent<TextJobRequest>) => {
  try {
    if (new TextEncoder().encode(event.data.source).byteLength > 5 * 1024 * 1024) throw new Error('Text input exceeds 5 MiB.');
    const response = execute(event.data);
    if (new TextEncoder().encode(JSON.stringify(response.result)).byteLength > 10 * 1024 * 1024) throw new Error('Text output exceeds 10 MiB.');
    self.postMessage(response);
  } catch (cause) {
    self.postMessage({
      jobId: event.data?.jobId,
      revision: event.data?.revision,
      error: { code: 'TEXT_JOB_FAILED', message: cause instanceof Error ? cause.message : 'Text processing failed' },
    } satisfies TextJobResponse);
  }
};

export {};
