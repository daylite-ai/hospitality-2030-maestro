# Submission text — cerebralvalley.ai upload form

Paste this into the project description field on cerebralvalley.ai/e/rosewood-hospitality-2030/hackathon/submit. Word count: ~250.

---

## Project name

**Maestro** — The Invisible Concierge

## Tagline

A voice-driven operations copilot for the General Manager of a luxury hotel.

## Problem statement addressed

**#2 The Invisible Concierge.** Maestro is an ambient orchestration layer that listens to every staff radio call, reads the guest's full profile, and acts across the Property Management System, the housekeeping queue, the F&B reservation grid, and the Asaya spa schedule — proactively, in five seconds. Hyper-personalised arrival (problem #1) is the *consequence* of an Invisible Concierge that works.

## What we built today (Saturday, May 16, 2026)

A live, working agent that:

- Runs Anthropic **Opus 4.7** with streaming `tool_use`, a mandatory `<thinking>` scratchpad, parallel reads / serial writes, AbortController-driven barge-in, and an explicit `tool_use ↔ tool_result` pairing discipline.
- Connects to **four stdio MCP servers** (PMS, Housekeeping, F&B, Asaya Spa) exposing **14 tools**.
- Voices the GM through **ElevenLabs Conversational AI 2.0** via Custom LLM webhook with dynamic voice parameter shifts per scenario (calm Karp, clipped Recovery, briefing Proactive). Sub-700 ms end-to-end TTFB; no synthetic SSE heartbeat.
- Renders an editorial-luxury dashboard (Vite 6 + React 19 + Tailwind 4, alabaster surface, Cormorant Garamond) plus a `/operator` staff-mobile surface that long-press-acknowledges into a sage-glow ack loop on the GM dashboard.
- Demoes three scenarios: Karp (happy path, six tool calls, personalised horse-card amenity), Recovery (Madera 503 → autonomous fail-over to Mayfield), Proactive (PMS clock advance → Maestro acts unprompted).
- Includes X-Ray (Alt+X) raw MCP / `tool_use` stream overlay and a "Why?" audit drawer (Shift+?) showing the reasoning chain.

All data is synthetic, disclosed inline in the dashboard header ("Synthetic PMS sandbox" pill).

## Repository

https://github.com/daylite-ai/hospitality-2030-maestro (public, MIT, 16 merged PRs reviewed by CodeRabbit + cubic-dev-ai + claude-design-import)

## Team

Dmitrii Karataev — solo build · [@kwit75](https://github.com/kwit75) · dmitry.karataev@gmail.com
