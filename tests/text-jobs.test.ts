import { describe, expect, test } from 'vitest';
import { runTextJob } from '../bin/lib/runTextJob.js';
import { cleaningProfileConfig } from '../src/lib/cleaningProfiles';
import { resolveMergedConfig } from '../src/lib/rulesConfig';
import { createTextJobClient, MAX_BROWSER_INPUT_BYTES } from '../src/lib/textJob';

class FakeWorker {
  onmessage: ((event: MessageEvent) => void) | null = null;
  onerror: ((event: ErrorEvent) => void) | null = null;
  terminated = false;
  postMessage(request: any) {
    queueMicrotask(() => this.onmessage?.({ data: { jobId: request.jobId, revision: request.revision, result: { text: 'done' } } } as MessageEvent));
  }
  terminate() { this.terminated = true; }
}

describe('isolated text jobs', () => {
  test('built-in profiles keep regional and healthcare IDs opt-in', () => {
    const everyday = resolveMergedConfig(cleaningProfileConfig('everyday')).enabledDetectorIds;
    expect(everyday.has('national_id_in')).toBe(false);
    expect(everyday.has('ssn_dob')).toBe(false);
    expect(everyday.has('identifier')).toBe(false);
    expect(cleaningProfileConfig('developer').extends).toEqual(['devops']);
  });
  test('runs shared scrubbing in a Node worker', async () => {
    const response = await runTextJob({
      jobId: 1,
      revision: 2,
      operation: 'scrub',
      source: 'Email a@example.com',
      config: { version: 1, detectors: { enable: ['email'] } },
    });
    expect(response.jobId).toBe(1);
    expect(response.revision).toBe(2);
    expect(response.result.text).toBe('Email [EMAIL_1]');
  });

  test('supports brace masking and strict restoration', async () => {
    const masked = await runTextJob({
      jobId: 2, revision: 1, operation: 'mask', source: 'a@example.com',
      config: { version: 1, detectors: { enable: ['email'] } },
    });
    expect(masked.result.text).toBe('{{EMAIL_1}}');
    const restored = await runTextJob({
      jobId: 3, revision: 1, operation: 'restore', source: '{{EMAIL_1}}',
      config: { version: 1 },
      sessionKey: { format: 'aiscrubber-session', version: 2, variables: [
        { placeholder: '{{EMAIL_1}}', original: 'a@example.com', detectorId: 'email' },
      ] },
    });
    expect(restored.result.text).toBe('a@example.com');
  });

  test('terminates a pattern that exceeds the worker budget', async () => {
    await expect(runTextJob({
      jobId: 4, revision: 1, operation: 'scrub',
      source: `${'a'.repeat(100_000)}!`,
      config: { version: 1, detectors: { enable: [] }, customRules: [
        { id: 'slow', label: 'slow', token: 'SLOW', patternString: '(a+)+$', isRegex: true, enabled: true },
      ] },
    }, { timeoutMs: 50 })).rejects.toMatchObject({ code: 'TEXT_TIMEOUT' });
  }, 10_000);

  test('rejects oversized browser requests before creating a worker', async () => {
    let created = false;
    const client = createTextJobClient({ workerFactory: () => { created = true; return new FakeWorker() as any; } });
    await expect(client.run({
      jobId: 1, revision: 1, operation: 'scrub', source: 'x'.repeat(MAX_BROWSER_INPUT_BYTES + 1), config: { version: 1 },
    })).rejects.toMatchObject({ code: 'INPUT_TOO_LARGE' });
    expect(created).toBe(false);
  });

  test('cleans up browser workers after success and cancellation', async () => {
    const workers: FakeWorker[] = [];
    const client = createTextJobClient({ workerFactory: () => { const worker = new FakeWorker(); workers.push(worker); return worker as any; } });
    await expect(client.run({ jobId: 1, revision: 1, operation: 'scrub', source: 'ok', config: { version: 1 } }))
      .resolves.toMatchObject({ jobId: 1, revision: 1 });
    expect(workers[0].terminated).toBe(true);
    const pending = client.run({ jobId: 2, revision: 2, operation: 'scrub', source: 'ok', config: { version: 1 } });
    client.cancel();
    await expect(pending).rejects.toMatchObject({ code: 'TEXT_CANCELLED' });
    expect(workers[1].terminated).toBe(true);
  });

  test('rejects a response for a different revision', async () => {
    const worker = new FakeWorker();
    worker.postMessage = (request) => queueMicrotask(() => worker.onmessage?.({ data: { jobId: request.jobId, revision: request.revision - 1, result: { text: 'stale' } } } as MessageEvent));
    const client = createTextJobClient({ workerFactory: () => worker as any });
    await expect(client.run({ jobId: 1, revision: 2, operation: 'scrub', source: 'ok', config: { version: 1 } })).rejects.toMatchObject({ code: 'STALE_RESULT' });
    expect(worker.terminated).toBe(true);
  });

  test('cleans up synchronous message failures', async () => {
    const worker = new FakeWorker();
    worker.postMessage = () => { throw new Error('clone failed'); };
    const client = createTextJobClient({ workerFactory: () => worker as any });
    await expect(client.run({ jobId: 1, revision: 1, operation: 'scrub', source: 'ok', config: { version: 1 } })).rejects.toMatchObject({ code: 'TEXT_JOB_FAILED' });
    expect(worker.terminated).toBe(true);
  });
});
