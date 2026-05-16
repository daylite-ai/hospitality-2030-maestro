# Maestro — Hospitality 2030

> Voice-driven operations copilot for luxury-hotel General Managers.
> Built solo at **Hospitality 2030 — Rosewood Sand Hill** (2026-05-16),
> partnered by Greycroft, Anthropic, and ElevenLabs.

## The pain we solve

Otelier's *2026 Hotel Operations Index* (Jan 28, 2026): hotels run **7+
tech platforms** on average, spend **11+ hours/week reconciling data**
between them, only **11%** have a fully integrated stack. Mews just
raised **$300M** at a $2.5B valuation to fix this. We make it a single
voice command.

## The "money moment"

Three back-to-back staff voice messages →
Maestro reasons across PMS, housekeeping, F&B, spa →
**6+ tool calls across 4 systems in <45 seconds**, voiced back to the GM:

> *"Suite 12 needs a deep clean — red wine on the rug."*
> *"David Karp and his family — wife Rachel, two kids — just landed at SFO."*
> *"Madera Bar is fully booked tonight."*

Maestro recognises Karp is a Rosewood-Elite repeat guest, notices his
party includes 8-year-old Maya, reassigns the family from suite 12 to the
already-clean suite 14, books a 6:30 family-friendly table at Madera Bar,
reroutes the cleaning team to suite 12 for morning prep, and queues a
hand-illustrated welcome card with Maya's name on it.

## Architecture

Four real MCP servers, not one with prefixes. Anthropic-judges-grade.

```
                    ┌─── stdio ──── mcp-servers/pms
ElevenLabs          │
Conversational AI ──┤── Custom LLM webhook
(VAD + STT + TTS)   │
                    │              ┌─── stdio ──── mcp-servers/housekeeping
                    │              │
                    └──── Node 24 ─┼─── stdio ──── mcp-servers/fnb
                       orchestrator │
                                    └─── stdio ──── mcp-servers/spa
                                    │
                                    └─── WebSocket ──── apps/dashboard (Vite + React)
                                    │
                                    └─── Anthropic Claude Opus 4.7 (tool_use)
```

The orchestrator manages an MCP client per server, exposes their tools to
Claude as one flat tool array, intercepts each `tool_use` block, routes
it to the right MCP client, and streams every reasoning + tool-call event
over WebSocket to the dashboard for the live fan-out graph.

## Run

```bash
cp .env.example .env  # fill ANTHROPIC_API_KEY and ELEVENLABS_API_KEY
pnpm install
pnpm dev          # orchestrator + spawns all 4 MCP servers
pnpm dev:dashboard
```

Dashboard: http://localhost:5173

## Stack

| Layer | Choice | Why |
|---|---|---|
| MCP servers | Node 24 + `@modelcontextprotocol/sdk` over stdio | Idiomatic MCP, no public-URL overhead |
| Orchestrator | Node 24 + `tsx` + Anthropic SDK | Stable stdio IPC for 4 concurrent MCP clients |
| Dashboard | Vite + React + shadcn/ui (monochrome) | Deterministic WS updates on stage; no RSC dev-mode buffering |
| Voice | ElevenLabs Conversational AI (Custom LLM webhook) | Built-in VAD/turn-taking; we just answer with text |
| Tunnel | cloudflared / ngrok | Expose orchestrator publicly so ElevenLabs can reach it |

## License

MIT — see [LICENSE](LICENSE).
