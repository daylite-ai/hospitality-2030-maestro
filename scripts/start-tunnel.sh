#!/usr/bin/env bash
# Start a quick public tunnel to the orchestrator (port 4000) so ElevenLabs
# can reach the Custom LLM webhook. Prints the public URL to stdout.
#
# After this prints the trycloudflare URL:
#   1. Open the ElevenLabs Agent settings (Conversational AI → your agent)
#   2. Set LLM = "Custom LLM"
#   3. URL: <tunnel-url>/webhook/elevenlabs
#   4. Test by talking to the agent — Maestro's reasoning trace should light up
#      the dashboard at http://localhost:5173 in real time.
set -euo pipefail
PORT="${PORT_ORCHESTRATOR:-4000}"
echo "[tunnel] exposing http://localhost:${PORT} via trycloudflare..."
exec ~/.local/bin/cloudflared tunnel --url "http://localhost:${PORT}" --no-autoupdate
