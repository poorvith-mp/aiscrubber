export interface SessionVariableV2 { placeholder: string; original: string; detectorId: string; }
export interface SessionKeyV2 { format: 'aiscrubber-session'; version: 2; variables: SessionVariableV2[]; }
export function parseSessionKey(raw: unknown): SessionKeyV2;
export function restoreSessionText(text: string, key: unknown): { text: string; restoredCount: number; unresolvedPlaceholders: string[] };
