import { scrubBuiltIns } from './scrubCore.js';

export type EnhancementGoal = 'coding' | 'debugging' | 'analysis' | 'writing' | 'general';

export interface PromptVariable {
  placeholder: string;
  original: string;
  category: 'secret' | 'email' | 'url' | 'ip' | 'id' | 'credential' | 'custom';
  description?: string;
}

export interface PromptSessionKey {
  id: string;
  name: string;
  createdAt: string;
  goal: EnhancementGoal;
  variables: PromptVariable[];
}

export interface PromptEnhanceResult {
  rawPrompt: string;
  sanitizedPrompt: string;
  enhancedPrompt: string;
  sessionKey: PromptSessionKey;
  variablesFound: number;
}

export interface ReconstructResult {
  reconstructedText: string;
  restoredCount: number;
  unresolvedPlaceholders: string[];
}

export function enhanceAndMaskPrompt(
  rawPrompt: string,
  goal: EnhancementGoal = 'coding',
  customVariables: { placeholder: string; original: string }[] = []
): PromptEnhanceResult {
  let maskedText = rawPrompt;
  const variables: PromptVariable[] = [];

  // Custom user variables first
  for (const item of customVariables) {
    if (!item.original.trim() || !item.placeholder.trim()) continue;
    const ph = item.placeholder.startsWith('{{') ? item.placeholder : `{{${item.placeholder}}}`;
    maskedText = maskedText.split(item.original).join(ph);
    variables.push({
      placeholder: ph,
      original: item.original,
      category: 'custom',
    });
  }

  // Built-in replacements share the browser, CLI, and MCP engine.
  const scrubbed = scrubBuiltIns(maskedText);
  for (const mapping of scrubbed.mappings) {
    const placeholder = mapping.token.replace('[', '{{').replace(']', '}}');
    maskedText = maskedText.split(mapping.original).join(placeholder);
    variables.push({
      placeholder,
      original: mapping.original,
      category: categoryForDetector(mapping.detectorId),
    });
  }

  // Apply prompt engineering enhancements based on selected goal
  const enhancedPrompt = formatEnhancedPrompt(maskedText, goal);

  const sessionKey: PromptSessionKey = {
    id: `scrub_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`,
    name: `AIScrub_${new Date().toISOString().slice(0, 10)}_${goal}`,
    createdAt: new Date().toISOString(),
    goal,
    variables,
  };

  return {
    rawPrompt,
    sanitizedPrompt: maskedText,
    enhancedPrompt,
    sessionKey,
    variablesFound: variables.length,
  };
}

function categoryForDetector(detectorId: string): PromptVariable['category'] {
  if (detectorId === 'email') return 'email';
  if (detectorId === 'url') return 'url';
  if (detectorId === 'ip') return 'ip';
  if (detectorId === 'identifier' || detectorId === 'ssn_dob' || detectorId === 'national_id_in') return 'id';
  return 'secret';
}

function formatEnhancedPrompt(body: string, goal: EnhancementGoal): string {
  switch (goal) {
    case 'coding':
      return `[TASK DIRECTIVE]
Please solve the following technical objective cleanly, reliably, and with full production quality.

[CONSTRAINTS & RULES]
1. Preserve all placeholder tokens (e.g. {{API_SECRET_1}}, {{INTERNAL_URL_1}}) exactly as named.
2. Provide complete, working code without omitting sections or using mock shortcuts.
3. Include clear error handling and type definitions.
4. Keep explanations concise and focused directly on the implementation.

[INPUT SPECIFICATION]
${body.trim()}

[DELIVERABLES]
- Full implementation code
- Brief explanation of architectural choices
- Verification / test instructions`;

    case 'debugging':
      return `[DEBUGGING DIRECTIVE]
Analyze and resolve the bug described below. Identify the exact root cause and provide a verified fix.

[RULES]
1. Preserve any placeholder variable names (e.g. {{HOST_IP_1}}, {{ENTITY_ID_1}}).
2. Trace the issue systematically from symptom to failure point.
3. Provide the minimal, correct patch and explain why the bug occurred.

[INCIDENT DETAILS]
${body.trim()}

[DELIVERABLES]
- Root Cause Analysis
- Corrective Code Diff / Fix
- Regression Prevention Steps`;

    case 'analysis':
      return `[ANALYTICAL DIRECTIVE]
Perform a thorough, objective analysis based on the data and query below.

[CONSTRAINTS]
1. Do not alter placeholder variables (e.g. {{EMAIL_ADDR_1}}, {{ENTITY_ID_1}}).
2. Distinguish clearly between verified facts and reasonable inferences.
3. Structure findings logically with key takeaways first.

[INQUIRY & CONTEXT]
${body.trim()}

[OUTPUT FORMAT]
1. Executive Summary
2. Detailed Findings & Evidence
3. Actionable Recommendations & Risks`;

    case 'writing':
      return `[EDITORIAL DIRECTIVE]
Draft/edit the requested content according to the details below.

[STYLE GUIDELINES]
1. Write clearly, directly, and naturally. Avoid generic AI buzzwords or cliché contrast formulas.
2. Maintain all {{PLACEHOLDERS}} intact.
3. Match the requested tone and audience precisely.

[DRAFT CONTEXT]
${body.trim()}`;

    case 'general':
    default:
      return `[OBJECTIVE]
${body.trim()}

[GUIDELINES]
- Keep all {{PLACEHOLDER_VARS}} unchanged.
- Provide a clear, structured, and actionable response.`;
  }
}

export function reconstructAiResponse(
  aiResponseText: string,
  sessionKey: PromptSessionKey | PromptVariable[]
): ReconstructResult {
  let reconstructed = aiResponseText;
  let restoredCount = 0;
  const vars: PromptVariable[] = Array.isArray(sessionKey)
    ? sessionKey
    : sessionKey.variables || [];

  for (const v of vars) {
    if (!v.placeholder || !v.original) continue;

    // Support {{TOKEN}}, {TOKEN}, and [TOKEN] matching in AI response
    const variations = [
      v.placeholder,
      v.placeholder.replace(/^\{\{/, '{').replace(/\}\}$/, '}'),
      v.placeholder.replace(/^\{\{/, '[').replace(/\}\}$/, ']'),
    ];

    for (const variant of variations) {
      if (reconstructed.includes(variant)) {
        const occurrences = reconstructed.split(variant).length - 1;
        reconstructed = reconstructed.split(variant).join(v.original);
        restoredCount += occurrences;
      }
    }
  }

  // Check if any leftover placeholders remain
  const leftoverMatch = reconstructed.match(/\{\{[A-Z0-9_]+\}\}/g) || [];
  const unresolvedPlaceholders = Array.from(new Set(leftoverMatch));

  return {
    reconstructedText: reconstructed,
    restoredCount,
    unresolvedPlaceholders,
  };
}
