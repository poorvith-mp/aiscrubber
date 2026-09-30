import { scrubBuiltIns } from './scrubCore.js';
import { maskPromptForRoundTrip } from './promptEnhancer';

export interface DemoScenario {
  id: 'incident-log' | 'everyday-message' | 'mask-restore';
  workspace: 'scrub' | 'prompt';
  title: string;
  input: string;
  output: string;
}

const incidentInput = 'Incident host 192.168.1.44, contact ops@example.com, token «redacted:sk-…»';
const everydayInput = 'Please reply to mina@example.com about card 4111 1111 1111 1111.';
const maskInput = 'Email a@example.com and use «redacted:sk-…».';

export const DEMO_SCENARIOS: DemoScenario[] = [
  { id: 'incident-log', workspace: 'scrub', title: 'Scrub an incident log', input: incidentInput, output: scrubBuiltIns(incidentInput).text },
  { id: 'everyday-message', workspace: 'scrub', title: 'Hide private details in a message', input: everydayInput, output: scrubBuiltIns(everydayInput).text },
  { id: 'mask-restore', workspace: 'prompt', title: 'Mask an AI prompt', input: maskInput, output: maskPromptForRoundTrip(maskInput).maskedText },
];

export function getDemoScenario(id: string | null | undefined): DemoScenario | null {
  return DEMO_SCENARIOS.find((scenario) => scenario.id === id) || null;
}
