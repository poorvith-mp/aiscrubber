import { useEffect, useRef, useState } from 'react';
import { canDismissSponsorship, type WorkflowSuccess } from '../lib/sponsorship';

interface SponsorshipModalProps {
  event: WorkflowSuccess | null;
  onClose: () => void;
}

export function SponsorshipModal({ event, onClose }: SponsorshipModalProps) {
  const [canClose, setCanClose] = useState(false);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const openedAtRef = useRef(0);

  useEffect(() => {
    if (!event) return;
    const previousFocus = document.activeElement as HTMLElement | null;
    const dialog = dialogRef.current;
    dialog?.showModal();
    openedAtRef.current = performance.now();
    setCanClose(false);
    headingRef.current?.focus();
    const timer = window.setTimeout(() => setCanClose(true), 3_000);
    return () => {
      window.clearTimeout(timer);
      dialog?.close();
      if (previousFocus?.isConnected) previousFocus.focus();
    };
  }, [event?.eventId]);

  useEffect(() => {
    if (!event) return;
    const onKeyDown = (keyboardEvent: KeyboardEvent) => {
      if (keyboardEvent.key !== 'Escape') return;
      keyboardEvent.preventDefault();
      if (canDismissSponsorship(openedAtRef.current, performance.now())) onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [event, onClose]);

  if (!event) return null;
  return (
      <dialog ref={dialogRef} aria-labelledby="sponsorship-title" onCancel={(event) => {
        event.preventDefault();
        if (canDismissSponsorship(openedAtRef.current, performance.now())) onClose();
      }} className="fixed m-auto w-[calc(100%-2rem)] max-w-md rounded-2xl border border-[var(--line)] bg-[var(--panel)] text-[var(--text)] p-6 shadow-2xl backdrop:bg-black/60">
        <h2 id="sponsorship-title" ref={headingRef} tabIndex={-1} className="text-2xl font-headline font-bold">Was this useful? Sponsor my work.</h2>
        <p className="mt-3 text-sm text-[var(--muted)]">AIScrubber stays open source. Sponsorship is optional. Close becomes available after 3 seconds.</p>
        <div className="mt-6 flex items-center justify-end gap-3">
          <a href="https://razorpay.me/@poorvithmp" target="_blank" rel="noopener noreferrer" className="btn-primary text-sm">Sponsor Poorvith</a>
          <button type="button" disabled={!canClose} onClick={onClose} className="btn-secondary text-sm" aria-describedby={!canClose ? 'sponsor-wait' : undefined}>Close</button>
        </div>
        <p id="sponsor-wait" aria-live="polite" className="mt-3 text-xs text-[var(--muted)]">{canClose ? 'Close is now available.' : 'Close will be available shortly.'}</p>
      </dialog>
  );
}
