import type { AiscrubConfig } from './rulesCore.js';
import type { ReviewDecision } from './scrubCore.js';
import type { SessionKeyV2 } from './sessionCore.js';

export const MAX_BROWSER_INPUT_BYTES = 5 * 1024 * 1024;
export const MAX_BROWSER_OUTPUT_BYTES = 10 * 1024 * 1024;
const DEFAULT_TIMEOUT_MS = 5_000;

export interface TextJobRequest {
  jobId: number;
  revision: number;
  operation: 'scrub' | 'mask' | 'restore';
  source: string;
  config: AiscrubConfig;
  decisions?: ReviewDecision[];
  suppressEntropy?: boolean;
  sessionKey?: SessionKeyV2 | unknown;
}

export interface TextJobResponse {
  jobId: number;
  revision: number;
  result?: any;
  error?: { code: string; message: string };
}

interface WorkerLike {
  onmessage: ((event: MessageEvent<TextJobResponse>) => void) | null;
  onerror: ((event: ErrorEvent) => void) | null;
  postMessage(message: TextJobRequest): void;
  terminate(): void;
}

function textError(code: string, message: string) {
  return Object.assign(new Error(message), { code });
}

export function createTextJobClient(options: {
  workerFactory?: () => WorkerLike;
  timeoutMs?: number;
} = {}) {
  const workerFactory = options.workerFactory || (() => new Worker(new URL('../workers/text.worker.ts', import.meta.url), { type: 'module' }));
  let active: { worker: WorkerLike; reject: (reason: unknown) => void; timer: ReturnType<typeof setTimeout> } | null = null;

  const cancel = () => {
    if (!active) return;
    const current = active;
    active = null;
    clearTimeout(current.timer);
    current.worker.terminate();
    current.reject(textError('TEXT_CANCELLED', 'Text processing was cancelled'));
  };

  const run = (request: TextJobRequest): Promise<TextJobResponse> => {
    cancel();
    if (new TextEncoder().encode(request.source).byteLength > MAX_BROWSER_INPUT_BYTES) {
      return Promise.reject(textError('INPUT_TOO_LARGE', 'Text input exceeds 5 MiB'));
    }
    return new Promise((resolve, reject) => {
      const worker = workerFactory();
      const timer = setTimeout(() => {
        if (!active || active.worker !== worker) return;
        active = null;
        worker.terminate();
        reject(textError('TEXT_TIMEOUT', 'Text processing exceeded 5 seconds'));
      }, options.timeoutMs ?? DEFAULT_TIMEOUT_MS);
      active = { worker, reject, timer };
      worker.onmessage = (event) => {
        if (!active || active.worker !== worker) return;
        active = null;
        clearTimeout(timer);
        worker.terminate();
        const response = event.data;
        if (response.jobId !== request.jobId || response.revision !== request.revision) reject(textError('STALE_RESULT', 'Text processing returned a stale result'));
        else if (response.error) reject(textError(response.error.code, response.error.message));
        else if (new TextEncoder().encode(JSON.stringify(response.result ?? null)).byteLength > MAX_BROWSER_OUTPUT_BYTES) {
          reject(textError('OUTPUT_TOO_LARGE', 'Text output exceeds 10 MiB'));
        } else resolve(response);
      };
      worker.onerror = () => {
        if (!active || active.worker !== worker) return;
        active = null;
        clearTimeout(timer);
        worker.terminate();
        reject(textError('TEXT_JOB_FAILED', 'Text processing worker failed'));
      };
      try { worker.postMessage(request); }
      catch {
        active = null;
        clearTimeout(timer);
        worker.terminate();
        reject(textError('TEXT_JOB_FAILED', 'Text processing request could not be sent'));
      }
    });
  };

  return { run, cancel };
}
