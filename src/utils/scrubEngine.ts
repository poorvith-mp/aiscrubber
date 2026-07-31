export interface ScrubRuleOptions {
  emails: boolean;
  phones: boolean;
  apiKeys: boolean;
  creditCards: boolean;
  ipAddresses: boolean;
  ssn: boolean;
  customRegex?: string;
}

export interface ReplacementToken {
  token: string;
  original: string;
  category: string;
}

export interface ScrubResult {
  scrubbedText: string;
  tokenMap: ReplacementToken[];
  stats: {
    totalReplacements: number;
    categoryCounts: Record<string, number>;
  };
}

export const DEFAULT_RULES: ScrubRuleOptions = {
  emails: true,
  phones: true,
  apiKeys: true,
  creditCards: true,
  ipAddresses: true,
  ssn: true,
  customRegex: '',
};

export function scrubText(text: string, rules: ScrubRuleOptions = DEFAULT_RULES): ScrubResult {
  if (!text) {
    return {
      scrubbedText: '',
      tokenMap: [],
      stats: { totalReplacements: 0, categoryCounts: {} },
    };
  }

  let scrubbed = text;
  const tokenMap: ReplacementToken[] = [];
  const categoryCounts: Record<string, number> = {};
  const valueToTokenMap = new Map<string, string>();

  function replaceMatch(match: string, category: string): string {
    if (valueToTokenMap.has(match)) {
      return valueToTokenMap.get(match)!;
    }

    const count = (categoryCounts[category] || 0) + 1;
    categoryCounts[category] = count;

    const paddedCount = count < 10 ? `0${count}` : `${count}`;
    const token = `[${category.toUpperCase()}_${paddedCount}]`;

    valueToTokenMap.set(match, token);
    tokenMap.push({ token, original: match, category });
    return token;
  }

  // 1. Emails
  if (rules.emails) {
    const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g;
    scrubbed = scrubbed.replace(emailRegex, (m) => replaceMatch(m, 'EMAIL'));
  }

  // 2. API Keys & Secrets
  if (rules.apiKeys) {
    // OpenAI API keys
    const openAiRegex = /\bsk-[A-Za-z0-9_-]{20,}\b/g;
    scrubbed = scrubbed.replace(openAiRegex, (m) => replaceMatch(m, 'API_KEY'));

    // AWS Access Key ID
    const awsKeyRegex = /\b(AKIA|ASIA)[0-9A-Z]{16}\b/g;
    scrubbed = scrubbed.replace(awsKeyRegex, (m) => replaceMatch(m, 'AWS_KEY'));

    // Generic Bearer / Secret Tokens
    const bearerRegex = /\bBearer\s+[A-Za-z0-9_.-]{20,}\b/gi;
    scrubbed = scrubbed.replace(bearerRegex, (m) => replaceMatch(m, 'TOKEN'));
  }

  // 3. Credit Cards
  if (rules.creditCards) {
    const cardRegex = /\b(?:\d[ -]*?){13,16}\b/g;
    scrubbed = scrubbed.replace(cardRegex, (m) => replaceMatch(m, 'CREDIT_CARD'));
  }

  // 4. Phone Numbers (US & International)
  if (rules.phones) {
    const phoneRegex = /(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/g;
    scrubbed = scrubbed.replace(phoneRegex, (m) => replaceMatch(m, 'PHONE'));
  }

  // 5. IP Addresses
  if (rules.ipAddresses) {
    const ipv4Regex = /\b(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\b/g;
    scrubbed = scrubbed.replace(ipv4Regex, (m) => replaceMatch(m, 'IP_ADDRESS'));
  }

  // 6. SSN / National IDs
  if (rules.ssn) {
    const ssnRegex = /\b\d{3}-\d{2}-\d{4}\b/g;
    scrubbed = scrubbed.replace(ssnRegex, (m) => replaceMatch(m, 'SSN'));
  }

  // 7. Custom Regex
  if (rules.customRegex && rules.customRegex.trim()) {
    try {
      const customReg = new RegExp(rules.customRegex.trim(), 'g');
      scrubbed = scrubbed.replace(customReg, (m) => replaceMatch(m, 'CUSTOM'));
    } catch (_err) {
      // Ignore invalid regex silently
    }
  }

  return {
    scrubbedText: scrubbed,
    tokenMap,
    stats: {
      totalReplacements: tokenMap.length,
      categoryCounts,
    },
  };
}

export function restoreText(scrubbedText: string, tokenMap: ReplacementToken[]): string {
  let restored = scrubbedText;
  tokenMap.forEach(({ token, original }) => {
    restored = restored.replaceAll(token, original);
  });
  return restored;
}
