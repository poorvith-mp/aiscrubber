export type WorkflowSuccessKind =
  | 'text-copy'
  | 'text-download'
  | 'batch-download'
  | 'masked-copy'
  | 'restored-copy'
  | 'unicode-copy'
  | 'unicode-download'
  | 'metadata-download'
  | 'image-download';

export interface WorkflowSuccess {
  eventId: number;
  kind: WorkflowSuccessKind;
}

const VALID_KINDS = new Set<WorkflowSuccessKind>([
  'text-copy', 'text-download', 'batch-download', 'masked-copy', 'restored-copy',
  'unicode-copy', 'unicode-download', 'metadata-download', 'image-download',
]);

export function canDismissSponsorship(openedAtMs: number, nowMs: number): boolean {
  return nowMs - openedAtMs >= 3_000;
}

export function nextSponsorshipEvent(
  previous: WorkflowSuccess | null,
  candidate: WorkflowSuccess | null
): WorkflowSuccess | null {
  if (!candidate || !VALID_KINDS.has(candidate.kind) || candidate.eventId <= 0) return null;
  if (previous?.eventId === candidate.eventId) return null;
  return candidate;
}
