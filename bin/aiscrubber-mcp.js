#!/usr/bin/env node

/**
 * AIScrubber Model Context Protocol (MCP) Server
 * Built by Poorvith M P (https://poorvithmp.com)
 * Native stdio JSON-RPC 2.0 MCP server for Claude Desktop, Claude Code, and Cursor.
 */

import readline from 'node:readline';
import { handleMessage, SERVER_NAME, SERVER_VERSION } from './lib/mcpServer.js';

export { handleMessage, SERVER_NAME, SERVER_VERSION };

if (process.stderr.isTTY) {
  process.stderr.write(`\x1b[32m[aiscrubber-mcp]\x1b[0m Server v${SERVER_VERSION} running on stdio.\n`);
}

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  terminal: false,
});

rl.on('line', (line) => {
  if (!line.trim()) return;
  try {
    const parsed = JSON.parse(line);
    const response = handleMessage(parsed);
    if (response && parsed.id !== undefined) {
      process.stdout.write(JSON.stringify(response) + '\n');
    }
  } catch (err) {
    process.stdout.write(
      JSON.stringify({
        jsonrpc: '2.0',
        id: null,
        error: { code: -32700, message: 'Parse error' },
      }) + '\n'
    );
  }
});
