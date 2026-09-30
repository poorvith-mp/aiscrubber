import { detectorDefinitions, type DetectorId } from './scrubCore.js';
import type { AiscrubConfig } from './rulesCore.js';

export interface CleaningProfile {
  id: 'everyday' | 'developer' | 'custom';
  label: string;
  description: string;
  enabledDetectorIds: DetectorId[];
  extends: string[];
}

export const CLEANING_PROFILES: Record<CleaningProfile['id'], CleaningProfile> = {
  everyday: {
    id: 'everyday',
    label: 'Everyday text',
    description: 'Emails, phone numbers, network details, cards, links, and common secrets.',
    enabledDetectorIds: ['email', 'phone', 'ip', 'url', 'card', 'secret', 'entropy'],
    extends: [],
  },
  developer: {
    id: 'developer',
    label: 'Developer logs',
    description: 'Everyday checks plus identifiers and the DevOps rule pack.',
    enabledDetectorIds: ['email', 'phone', 'ip', 'url', 'card', 'secret', 'identifier', 'entropy'],
    extends: ['devops'],
  },
  custom: {
    id: 'custom',
    label: 'Custom',
    description: 'Start empty and choose the checks and words to hide.',
    enabledDetectorIds: [],
    extends: [],
  },
};

export function cleaningProfileConfig(id: CleaningProfile['id']): AiscrubConfig {
  const profile = CLEANING_PROFILES[id];
  return { version: 1, detectors: { disable: detectorDefinitions.filter(({ id }) => !profile.enabledDetectorIds.includes(id)).map(({ id }) => id) }, extends: [...profile.extends] };
}
