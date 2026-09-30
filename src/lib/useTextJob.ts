import { useEffect, useRef, useState } from 'react';
import { createTextJobClient, type TextJobRequest } from './textJob';

export type TextJobInput = Omit<TextJobRequest, 'jobId' | 'revision'>;

// Results belong to an exact input revision. A pending or failed job never exposes
// the previous revision's output, even during the render before effect cleanup.
export function useTextJob<T>(input: TextJobInput | null) {
  const jobs = useRef<ReturnType<typeof createTextJobClient> | null>(null);
  const revision = useRef(0);
  const timerRef = useRef<number | undefined>(undefined);
  const key = JSON.stringify(input);
  const [state, setState] = useState<{ key: string; result?: T; error?: string; cancelled?: boolean } | null>(null);
  useEffect(() => {
    const coordinator = createTextJobClient();
    jobs.current = coordinator;
    return () => { coordinator.cancel(); jobs.current = null; };
  }, []);
  useEffect(() => {
    const currentRevision = ++revision.current;
    let live = true;
    if (!input) return;
    const timer = window.setTimeout(() => {
      jobs.current?.run({ ...input, jobId: currentRevision, revision: currentRevision }).then((response) => {
        if (live && revision.current === currentRevision) setState({ key, result: response.result as T });
      }).catch((error: unknown) => {
        if (live && revision.current === currentRevision) setState({ key, error: error instanceof Error ? error.message : 'Text processing failed.' });
      });
    }, 150);
    timerRef.current = timer;
    return () => {
      live = false;
      window.clearTimeout(timer);
      jobs.current?.cancel();
    };
  }, [key]);
  const current = state?.key === key ? state : null;
  return {
    result: current?.result,
    error: current?.error,
    busy: !!input && !current,
    cancelled: current?.cancelled,
    cancel() {
      revision.current++;
      window.clearTimeout(timerRef.current);
      jobs.current?.cancel();
      setState({ key, cancelled: true });
    },
  };
}
