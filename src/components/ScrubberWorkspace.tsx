import { Check, Clipboard, Eraser, ShieldCheck } from 'lucide-react';
import { useMemo, useState } from 'react';
import { detectors, scrubText, type DetectorId } from '../lib/scrub';

const example = `Please send the draft to mina@example.com or call +91 98765 43210.\nReview https://example.com/private and account CUST-88392 before using sk-proj-9988112233445566.`;

export function ScrubberWorkspace() {
  const [raw, setRaw] = useState(example);
  const [cleaned, setCleaned] = useState('');
  const [enabled, setEnabled] = useState<Set<DetectorId>>(() => new Set(detectors.map(({ id }) => id)));
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [copied, setCopied] = useState(false);
  const activeCount = useMemo(() => enabled.size, [enabled]);

  function toggle(id: DetectorId) {
    setEnabled((current) => {
      const next = new Set(current);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function scrub() {
    const result = scrubText(raw, enabled);
    setCleaned(result.text);
    setCounts(result.counts);
    setCopied(false);
  }

  async function copy() {
    if (!cleaned) return;
    await navigator.clipboard.writeText(cleaned);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }

  function clear() {
    setRaw('');
    setCleaned('');
    setCounts({});
    setCopied(false);
  }

  const total = Object.values(counts).reduce((sum, count) => sum + count, 0);

  return (
    <section id="workspace" className="workspace" aria-labelledby="workspace-title">
      <div className="workspace-heading">
        <div><p className="eyebrow">Workspace</p><h2 id="workspace-title">Identity redaction desk</h2></div>
        <div className="local-note"><ShieldCheck size={18} /><span>Runs in your browser</span></div>
      </div>

      <fieldset className="detectors">
        <legend>Detectors</legend>
        <div className="detector-list">
          {detectors.map((detector) => (
            <label key={detector.id} className={enabled.has(detector.id) ? 'detector active' : 'detector'}>
              <input type="checkbox" checked={enabled.has(detector.id)} onChange={() => toggle(detector.id)} />
              <span>{detector.label}</span>
            </label>
          ))}
        </div>
        <p className="detector-status" aria-live="polite">{activeCount} of {detectors.length} detectors active</p>
      </fieldset>

      <div className="editor-grid">
        <div className="editor-panel">
          <label htmlFor="raw-text"><span>Raw text</span><small>{raw.length.toLocaleString()} characters</small></label>
          <textarea id="raw-text" value={raw} onChange={(event) => setRaw(event.target.value)} placeholder="Paste the text you want to check…" spellCheck="false" />
        </div>
        <div className="editor-panel output-panel">
          <label htmlFor="cleaned-text"><span>Cleaned text</span><small aria-live="polite">{total ? `${total} replacement${total === 1 ? '' : 's'}` : 'Waiting to scrub'}</small></label>
          <textarea id="cleaned-text" value={cleaned} readOnly placeholder="The cleaned result will appear here." spellCheck="false" />
        </div>
      </div>

      <div className="workspace-actions">
        <p><span className="status-dot" />Nothing is uploaded for processing.</p>
        <div>
          <button className="secondary-button" type="button" onClick={clear}><Eraser size={17} />Clear</button>
          <button className="secondary-button" type="button" onClick={copy} disabled={!cleaned}>{copied ? <Check size={17} /> : <Clipboard size={17} />}{copied ? 'Copied' : 'Copy'}</button>
          <button className="primary-button" type="button" onClick={scrub} disabled={!raw || !activeCount}>Scrub text</button>
        </div>
      </div>
    </section>
  );
}
