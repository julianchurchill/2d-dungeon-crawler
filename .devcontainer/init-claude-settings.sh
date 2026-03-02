#!/usr/bin/env bash
# init-claude-settings.sh
# Ensures the Claude Code settings file contains the required MCP server
# configurations. Runs on every container start so that settings survive
# volume recreation and container rebuilds.
#
# Strategy: merge the required mcpServers entries into the existing
# settings.json using Node.js (always available in the container),
# preserving any other settings or MCP entries already present.

set -euo pipefail

SETTINGS_FILE="${CLAUDE_CONFIG_DIR:-/home/node/.claude}/settings.json"

# Ensure the directory exists (may not if volume is freshly created).
mkdir -p "$(dirname "$SETTINGS_FILE")"

# Define all required MCP server entries as a single JSON object.
# Add new servers here to have them automatically provisioned on rebuild.
REQUIRED_MCP_SERVERS='{
  "context7": {
    "type": "stdio",
    "command": "npx",
    "args": ["-y", "@upstash/context7-mcp"]
  },
  "serena": {
    "type": "stdio",
    "command": "uvx",
    "args": [
      "--from", "git+https://github.com/oraios/serena",
      "serena", "start-mcp-server",
      "--context", "ide-assistant",
      "--project", "/workspace"
    ]
  }
}'

node -e "
  const fs = require('fs');
  const settingsPath = '$SETTINGS_FILE';
  const required = $REQUIRED_MCP_SERVERS;

  let settings = {};
  if (fs.existsSync(settingsPath)) {
    try { settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8')); } catch (_) {}
  }

  // Merge required entries, preserving any existing entries not listed here.
  settings.mcpServers = Object.assign({}, settings.mcpServers, required);

  fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2) + '\n');
  console.log('init-claude-settings: MCP servers written to', settingsPath);
  console.log('  Servers:', Object.keys(settings.mcpServers).join(', '));
"
