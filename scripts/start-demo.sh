#!/usr/bin/env bash
# Full demo boot sequence — one-command Maestro.
set -euo pipefail
cd "$(dirname "$0")/.."

# Kill any stragglers from previous runs.
pkill -f 'apps/orchestrator|mcp-servers' 2>/dev/null || true
sleep 1

# Build the dashboard fresh — production mode, not dev (audit point #10).
echo "[start] building dashboard for production..."
pnpm --filter @maestro/dashboard build

# Start orchestrator in the background; capture logs.
echo "[start] starting orchestrator..."
node_modules/.bin/tsx apps/orchestrator/src/index.ts > /tmp/orch.stdout 2> /tmp/orch.stderr &
ORCH_PID=$!
echo "[start] orchestrator pid: $ORCH_PID"

# Serve the built dashboard. vite preview is production-bundle-only.
echo "[start] starting dashboard preview on :5173..."
node_modules/.bin/vite preview --root apps/dashboard --port 5173 --strictPort > /tmp/dash.stdout 2> /tmp/dash.stderr &
DASH_PID=$!
echo "[start] dashboard pid: $DASH_PID"

echo ""
echo "[start] orchestrator → http://localhost:4000   logs: tail -f /tmp/orch.stderr"
echo "[start] dashboard    → http://localhost:5173   logs: tail -f /tmp/dash.stderr"
echo "[start] tunnel       → run: ./scripts/start-tunnel.sh"
echo ""
echo "Stop with: kill $ORCH_PID $DASH_PID  (or  pkill -f 'apps/orchestrator|mcp-servers|vite')"
