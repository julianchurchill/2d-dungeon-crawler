#!/usr/bin/env bash
# init-claude-settings.sh
# Ensures the Claude Code settings file contains the required MCP server
# configuration. Runs on every container start so that settings survive
# volume recreation and container rebuilds.
#
# Strategy: if settings.json already exists we merge our MCP entry into the
# existing mcpServers object using Node.js (available in the container).
# If it does not exist we write a fresh file.

set -euo pipefail

SETTINGS_FILE="${CLAUDE_CONFIG_DIR:-/home/node/.claude}/settings.json"

# The MCP server entry we want to be present.
CONTEXT7_ENTRY='{
  "context7": {
    "type": "stdio",
    "command": "npx",
    "args": ["-y", "@upstash/context7-mcp"]
  }
}'

if [ -f "$SETTINGS_FILE" ]; then
  # Merge context7 into the existing mcpServers object, preserving all other settings.
  node -e "
    const fs = require('fs');
    const path = '$SETTINGS_FILE';
    let settings = {};
    try { settings = JSON.parse(fs.readFileSync(path, 'utf8')); } catch (_) {}
    settings.mcpServers = settings.mcpServers || {};
    settings.mcpServers.context7 = $CONTEXT7_ENTRY.context7;
    fs.writeFileSync(path, JSON.stringify(settings, null, 2) + '\n');
    console.log('init-claude-settings: context7 MCP entry merged into', path);
  "
else
  # Create the file from scratch.
  mkdir -p "$(dirname "$SETTINGS_FILE")"
  node -e "
    const fs = require('fs');
    const settings = { mcpServers: $CONTEXT7_ENTRY };
    fs.writeFileSync('$SETTINGS_FILE', JSON.stringify(settings, null, 2) + '\n');
    console.log('init-claude-settings: created', '$SETTINGS_FILE');
  "
fi
