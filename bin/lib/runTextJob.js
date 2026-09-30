import { Worker } from 'node:worker_threads';

const MAX_NODE_INPUT_BYTES = 64 * 1024 * 1024;
const MAX_NODE_OUTPUT_BYTES = 128 * 1024 * 1024;

function jobError(code, message) {
  return Object.assign(new Error(message), { code });
}

export function createTextJobWorker() {
  return new Worker(new URL('./textWorker.js', import.meta.url), { resourceLimits: { maxOldGenerationSizeMb: 512 } });
}

export function runTextJob(request, { timeoutMs = 5_000, signal, worker: sharedWorker } = {}) {
  if (!request || typeof request.source !== 'string') return Promise.reject(jobError('INVALID_REQUEST', 'Invalid text job request'));
  if (Buffer.byteLength(request.source, 'utf8') > MAX_NODE_INPUT_BYTES) {
    return Promise.reject(jobError('INPUT_TOO_LARGE', 'Text input exceeds 64 MiB'));
  }
  if (signal?.aborted) return Promise.reject(jobError('TEXT_CANCELLED', 'Text processing was cancelled'));
  return new Promise((resolve, reject) => {
    const worker = sharedWorker || createTextJobWorker();
    let settled = false;
    const finish = (callback, value) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      signal?.removeEventListener('abort', abort);
      worker.removeListener('message', receive);
      worker.removeListener('error', fail);
      worker.removeListener('exit', exit);
      if (!sharedWorker || callback === reject) void worker.terminate();
      callback(value);
    };
    const timer = setTimeout(() => finish(reject, jobError('TEXT_TIMEOUT', 'Text processing exceeded 5 seconds')), timeoutMs);
    const abort = () => finish(reject, jobError('TEXT_CANCELLED', 'Text processing was cancelled'));
    signal?.addEventListener('abort', abort, { once: true });
    const receive = (response) => {
      if (response?.jobId !== request.jobId || response?.revision !== request.revision) finish(reject, jobError('STALE_RESULT', 'Text processing returned a stale result'));
      else if (response?.error) finish(reject, jobError(response.error.code, response.error.message));
      else if (Buffer.byteLength(JSON.stringify(response.result ?? null), 'utf8') > MAX_NODE_OUTPUT_BYTES) finish(reject, jobError('OUTPUT_TOO_LARGE', 'Text output exceeds 128 MiB'));
      else finish(resolve, response);
    };
    const fail = () => finish(reject, jobError('TEXT_JOB_FAILED', 'Text processing worker failed'));
    const exit = () => {
      if (!settled) finish(reject, jobError('TEXT_JOB_FAILED', 'Text processing worker stopped before returning a result'));
    };
    worker.once('message', receive);
    worker.once('error', fail);
    worker.once('exit', exit);
    try { worker.postMessage(request); }
    catch { finish(reject, jobError('TEXT_JOB_FAILED', 'Text processing request could not be sent')); }
  });
}

export { MAX_NODE_INPUT_BYTES };
