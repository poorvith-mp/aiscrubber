import type { ReviewDecision } from './scrubCore.js';

export interface ReviewState {
  source: string;
  policyRevision: number;
  decisions: ReviewDecision[];
  output: string;
}

export function createReviewState(
  source: string,
  policyRevision: number,
  decisions: ReviewDecision[] = [],
  output = ''
): ReviewState {
  return { source, policyRevision, decisions, output };
}

export function updateReviewContext(state: ReviewState, source: string, policyRevision: number): ReviewState {
  if (state.source === source && state.policyRevision === policyRevision) return state;
  return createReviewState(source, policyRevision);
}
