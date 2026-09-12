import { describe, expect, test } from 'vitest';
import { handleMessage } from '../bin/aiscrubber-mcp.js';

describe('MCP Server with Rules & Reload', () => {
  test('initialize and tools/list include reload_rules', () => {
    const initRes = handleMessage({ jsonrpc: '2.0', id: 1, method: 'initialize', params: {} });
    expect(initRes.result.serverInfo.version).toBe('2.4.0');

    const toolsRes = handleMessage({ jsonrpc: '2.0', id: 2, method: 'tools/list', params: {} });
    const toolNames = toolsRes.result.tools.map((t) => t.name);
    expect(toolNames).toContain('reload_rules');
    expect(toolNames).toContain('scrub_text');
    expect(toolNames).toContain('mask_prompt');
    expect(toolNames).toContain('inspect_content');

    const scrubTool = toolsRes.result.tools.find((t) => t.name === 'scrub_text');
    expect(scrubTool.inputSchema.properties.allowlist).toBeDefined();
    expect(scrubTool.inputSchema.properties.customRules).toBeDefined();
  });

  test('reload_rules returns rulesSource, customRuleCount, allowlistCount', () => {
    const res = handleMessage({
      jsonrpc: '2.0',
      id: 3,
      method: 'tools/call',
      params: { name: 'reload_rules', arguments: {} },
    });
    expect(res.result.rulesSource).toBeDefined();
    const data = JSON.parse(res.result.content[0].text);
    expect(data.rulesSource).toBeDefined();
    expect(typeof data.customRuleCount).toBe('number');
    expect(typeof data.allowlistCount).toBe('number');
  });

  test('scrub_text applies per-call customRules and allowlist and includes rulesSource', () => {
    const res = handleMessage({
      jsonrpc: '2.0',
      id: 4,
      method: 'tools/call',
      params: {
        name: 'scrub_text',
        arguments: {
          text: 'AcmeProject secret is sk-proj-12345678901234567890123456 and internal flag FLAG_SECRET_99',
          allowlist: [{ value: 'FLAG_SECRET_99', isRegex: false }],
          customRules: [
            {
              id: 'proj',
              label: 'Project Name',
              patternString: 'AcmeProject',
              token: 'PROJECT',
              isRegex: false,
              enabled: true,
            },
          ],
        },
      },
    });

    expect(res.result.rulesSource).toBeDefined();
    const data = JSON.parse(res.result.content[0].text);
    expect(data.rulesSource).toBeDefined();
    expect(data.scrubbed).toContain('[PROJECT_1]');
    expect(data.scrubbed).toContain('[SECRET_1]');
    expect(data.scrubbed).toContain('FLAG_SECRET_99');
  });

  test('inspect_content applies customRules and includes rulesSource', () => {
    const res = handleMessage({
      jsonrpc: '2.0',
      id: 5,
      method: 'tools/call',
      params: {
        name: 'inspect_content',
        arguments: {
          text: 'Internal codename ProjectApollo should not be revealed',
          customRules: [
            {
              id: 'apollo',
              label: 'Apollo Codename',
              patternString: 'ProjectApollo',
              token: 'CODENAME',
              isRegex: false,
              enabled: true,
            },
          ],
        },
      },
    });

    expect(res.result.rulesSource).toBeDefined();
    const data = JSON.parse(res.result.content[0].text);
    expect(data.rulesSource).toBeDefined();
    expect(data.threats.some((t) => t.includes('Apollo Codename'))).toBe(true);
  });

  test('clean_ai_watermarks includes rulesSource', () => {
    const res = handleMessage({
      jsonrpc: '2.0',
      id: 6,
      method: 'tools/call',
      params: {
        name: 'clean_ai_watermarks',
        arguments: { text: 'Hello\u200B world' },
      },
    });
    expect(res.result.rulesSource).toBeDefined();
    const data = JSON.parse(res.result.content[0].text);
    expect(data.rulesSource).toBeDefined();
    expect(data.cleaned_text).toBe('Hello world');
  });
});
