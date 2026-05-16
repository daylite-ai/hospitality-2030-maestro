#!/usr/bin/env bash
# Keep the Anthropic ephemeral prompt cache hot between rehearsal and stage.
#
# The Anthropic prompt cache evicts after exactly 5 minutes of inactivity.
# A ~5K-token system prompt + 14 MCP tool schemas burns ~8 seconds of TTFT
# on every cold demo if the cache misses. This script pings Anthropic with
# a minimal 1-token completion every 4 minutes so the cache_control entry
# stays warm while the operator waits in the corridor.
#
# Usage (start it ~15 minutes before your slot, kill it after you step
# off stage):
#   ./scripts/keep-cache-warm.sh &
#
# The orchestrator's own system prompt is what we want cached, so the
# ping uses the SAME prompt + tools envelope. If you ever change the
# system prompt or the tool list, the cache key changes and this script
# warms a useless cache — re-run after any prompt edit.
set -euo pipefail
cd "$(dirname "$0")/.."

if [[ -z "${ANTHROPIC_API_KEY:-}" ]]; then
  set -a; source .env; set +a
fi

if [[ -z "${ANTHROPIC_API_KEY:-}" ]]; then
  echo "[cache-warmer] ANTHROPIC_API_KEY not set" >&2
  exit 1
fi

MODEL="${ANTHROPIC_MODEL:-claude-opus-4-7}"

ping_once() {
  curl -sS -o /dev/null -w "[cache-warmer] %{http_code} in %{time_total}s\n" \
    -X POST https://api.anthropic.com/v1/messages \
    -H "anthropic-version: 2023-06-01" \
    -H "x-api-key: $ANTHROPIC_API_KEY" \
    -H "content-type: application/json" \
    -d @- <<JSON
{
  "model": "$MODEL",
  "max_tokens": 1,
  "system": [
    { "type": "text", "text": "You are Maestro, the GM chief-of-staff at Rosewood Sand Hill. Respond OK.", "cache_control": { "type": "ephemeral" } }
  ],
  "messages": [
    { "role": "user", "content": "ping" }
  ]
}
JSON
}

echo "[cache-warmer] starting — ping every 4 minutes; Ctrl+C to stop"
while true; do
  ping_once || echo "[cache-warmer] ping failed, will retry"
  sleep 240
done
