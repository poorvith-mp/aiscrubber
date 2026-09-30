import { useEffect, useRef, useState } from 'react';
import type { AiscrubConfig } from '../lib/rulesConfig';
import type { CoreScrubResult, ReviewDecision } from '../lib/scrubCore.js';
import type { WorkflowSuccessKind } from '../lib/sponsorship';
import { createTextJobClient } from '../lib/textJob';
import { validateBatchSelection } from '../lib/textBatch';
import { buildTextArchive } from '../lib/textExport';
import { downloadBlob } from '../lib/download';

type Row = { id: number; name: string; source?: string; result?: CoreScrubResult; decisions: ReviewDecision[]; status: string; error?: string };

export function TextBatchPanel({ config, onWorkflowSuccess }: {
  config: AiscrubConfig; onWorkflowSuccess: (kind: WorkflowSuccessKind) => void;
}) {
  const [rows, setRows] = useState<Row[]>([]);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const epoch = useRef(0);
  const jobId = useRef(0);
  const jobs = useRef(createTextJobClient());
  const policyKey = JSON.stringify(config);
  useEffect(() => {
    epoch.current++;
    jobs.current.cancel();
    setRows([]);
    setBusy(false);
    setError('');
    return () => { epoch.current++; jobs.current.cancel(); };
  }, [policyKey]);

  async function processFiles(files: File[]) {
    const revision = ++epoch.current;
    jobs.current.cancel();
    setRows([]);
    setError('');
    setBusy(false);
    try { validateBatchSelection(files); }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Invalid text batch.'); return; }
    const items: Row[] = files.map((file, id) => ({ id, name: file.name, decisions: [], status: 'queued' }));
    setRows(items);
    setBusy(true);
    let retainedBytes = 0;
    for (let index = 0; index < files.length && revision === epoch.current; index++) {
      const row = items[index];
      setRows((current) => current.map((item) => item.id === row.id ? { ...item, status: 'processing' } : item));
      try {
        const source = new TextDecoder('utf-8', { fatal: true }).decode(await files[index].arrayBuffer());
        if (source.includes('\0')) throw new Error('Only UTF-8 text without NUL bytes is supported.');
        if (revision !== epoch.current) break;
        const response = await jobs.current.run({ jobId: ++jobId.current, revision, operation: 'scrub', source, config });
        if (revision !== epoch.current) break;
        const bytes = new TextEncoder().encode(JSON.stringify(response.result)).byteLength;
        if (retainedBytes + bytes > 40 * 1024 * 1024) throw new Error('Retained batch output exceeds 40 MiB. Download completed files and use a smaller batch.');
        retainedBytes += bytes;
        setRows((current) => current.map((item) => item.id === row.id ? { ...item, source, result: response.result, status: 'complete' } : item));
      } catch (cause) {
        if (revision !== epoch.current) break;
        setRows((current) => current.map((item) => item.id === row.id ? { ...item, status: 'failed', error: cause instanceof Error ? cause.message : 'Text file failed.' } : item));
      }
    }
    if (revision === epoch.current) setBusy(false);
  }

  function cancel() {
    epoch.current++;
    jobs.current.cancel();
    setBusy(false);
    setRows((current) => current.map((row) => row.status === 'queued' || row.status === 'processing' ? { ...row, status: 'cancelled', result: undefined } : row));
  }

  async function review(row: Row, decision: ReviewDecision | null) {
    if (busy || row.source === undefined) return;
    const revision = epoch.current;
    const decisions = decision ? [...row.decisions.filter((item) => item.start !== decision.start || item.end !== decision.end), decision] : [];
    setBusy(true);
    setRows((current) => current.map((item) => item.id === row.id ? { ...item, result: undefined, status: 'processing' } : item));
    try {
      const response = await jobs.current.run({ jobId: ++jobId.current, revision, operation: 'scrub', source: row.source, config, decisions });
      const retainedBytes = rows.filter((item) => item.id !== row.id && item.result).reduce((sum, item) => sum + new TextEncoder().encode(JSON.stringify(item.result)).byteLength, 0);
      if (retainedBytes + new TextEncoder().encode(JSON.stringify(response.result)).byteLength > 40 * 1024 * 1024) throw new Error('Retained batch output exceeds 40 MiB. Use a smaller batch.');
      if (revision === epoch.current) setRows((current) => current.map((item) => item.id === row.id ? { ...item, result: response.result, decisions, status: 'complete' } : item));
    } catch (cause) {
      if (revision === epoch.current) setRows((current) => current.map((item) => item.id === row.id ? { ...item, status: 'failed', error: cause instanceof Error ? cause.message : 'Review failed.' } : item));
    } finally { if (revision === epoch.current) setBusy(false); }
  }

  async function download() {
    const revision = epoch.current;
    try {
      const complete = rows.filter((row) => row.status === 'complete' && row.result);
      if (complete.length !== rows.length && !window.confirm(`Only ${complete.length} of ${rows.length} files completed. Download a partial ZIP containing only those files?`)) return;
      const blob = await buildTextArchive(complete.map((row) => ({ name: row.name, contents: row.result!.text })));
      if (revision !== epoch.current) return;
      downloadBlob(blob, 'cleaned-text.zip');
      if (complete.some((row) => row.result!.totalRedactions > 0)) onWorkflowSuccess('batch-download');
    } catch { setError('Could not build the local ZIP archive.'); }
  }

  return <section aria-label="Local text batch" className="my-6 rounded-xl border border-[var(--line)] p-4"
    onDragOver={(event) => event.preventDefault()} onDrop={(event) => { event.preventDefault(); void processFiles(Array.from(event.dataTransfer.files)); }}>
    <h3 className="font-bold">Clean text files locally</h3>
    <p className="text-xs text-[var(--muted)] my-2">Choose or drop TXT, MD, LOG, JSON, or CSV files. Maximum 20 files, 5 MiB each, 20 MiB total. Files run one at a time; ZIP includes only completed reviewed output, never keys or original filenames.</p>
    <label className="text-sm">Text files <input aria-label="Text batch files" type="file" multiple accept=".txt,.md,.log,.json,.csv" onChange={(event) => {
      const files = Array.from(event.currentTarget.files || []); event.currentTarget.value = ''; void processFiles(files);
    }} /></label>
    <div role="status" aria-live="polite" className="text-sm my-2">{error || (busy ? 'Processing text batch…' : rows.length ? `${rows.filter((row) => row.status === 'complete').length} of ${rows.length} files completed.` : '')}</div>
    {busy && <button type="button" className="btn-secondary text-xs" onClick={cancel}>Cancel batch</button>}
    <ul className="space-y-2 my-3">{rows.map((row) => <li key={row.id} className="border border-[var(--line)] p-2 rounded">
      <span className="text-xs">File {row.id + 1}: {row.name} — {row.status}{row.error ? `: ${row.error}` : ''}</span>
      {row.result && <details className="text-xs my-2"><summary>Review cleaned file {row.id + 1}</summary>
        <textarea aria-label={`Cleaned file ${row.id + 1}`} className="editor-textarea" readOnly value={row.result.text} />
        <button type="button" disabled={busy} className="btn-secondary text-xs" onClick={() => {
          downloadBlob(new Blob([row.result!.text], { type: 'text/plain;charset=utf-8' }), `${String(row.id + 1).padStart(2, '0')}.cleaned.txt`);
          if (row.result!.totalRedactions > 0) onWorkflowSuccess('text-download');
        }}>Download cleaned file {row.id + 1}</button>
        {row.result.acceptedMatches.slice(0, 100).map((match) => <div key={`${match.start}-${match.end}`} className="flex gap-2 my-1">
          <code>{match.token} at {match.start + 1}</code>
          <button type="button" disabled={busy} className="btn-secondary text-xs" onClick={() => void review(row, { start: match.start, end: match.end, action: 'keep' })}>Keep original occurrence</button>
        </div>)}
        <label>Source selection (private)<textarea aria-label={`Private source file ${row.id + 1}`} className="editor-textarea" readOnly value={row.source} /></label>
        <button type="button" disabled={busy} className="btn-secondary text-xs" onClick={(event) => {
          const textarea = event.currentTarget.previousElementSibling?.querySelector('textarea');
          if (textarea && textarea.selectionEnd > textarea.selectionStart) void review(row, { start: textarea.selectionStart, end: textarea.selectionEnd, action: 'hide' });
        }}>Hide selected text in this file</button>
        {row.decisions.some(({ action }) => action === 'keep') && <p role="alert">Kept originals will be included in the ZIP.</p>}
        {!!row.decisions.length && <button type="button" disabled={busy} className="btn-secondary text-xs" onClick={() => void review(row, null)}>Reset file review</button>}
      </details>}
    </li>)}</ul>
    <button type="button" className="btn-secondary text-xs" disabled={busy || !rows.some((row) => row.status === 'complete')} onClick={() => void download()}>Download cleaned ZIP</button>
    <button type="button" className="btn-secondary text-xs ml-2" onClick={() => { cancel(); setRows([]); setError(''); }}>Clear batch</button>
  </section>;
}
