import { describe, expect, test } from 'vitest';
import { DEMO_SCENARIOS, getDemoScenario } from '../src/lib/demoScenarios';

describe('real engine demo scenarios', () => {
  test('computes each output through the scrub engine', () => {
    for (const scenario of DEMO_SCENARIOS) {
      expect(scenario.output).not.toBe(scenario.input);
      expect(scenario.output).toMatch(/\[(?:EMAIL|IP|SECRET|CARD)_1\]|\{\{(?:EMAIL|SECRET)_1\}\}/);
    }
  });

  test('allows only fixed public demo IDs', () => {
    expect(getDemoScenario('incident-log')?.id).toBe('incident-log');
    expect(getDemoScenario('../../private')).toBeNull();
    expect(getDemoScenario(null)).toBeNull();
  });
});
