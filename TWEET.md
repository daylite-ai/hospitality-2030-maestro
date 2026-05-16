# Tweet thread — schedule for T +5 min after demo slot ends

> The hackathon winner is decided on stage.
> The seed round is decided on X (Twitter).

Schedule this thread via X's "Schedule" button to publish **exactly 5
minutes after your scheduled demo ends**. When judges pull out their
phones during the next team's demo, your thread is at the top of their
feed. Tag the sponsors so they retweet.

---

## Tweet 1 — the money slide GIF

Attach the 30-second screen recording of the Maestro dashboard doing
the Karp fan-out (use `BACKUP_VIDEO.md` for capture instructions).
Compress to under 15MB so X doesn't downsample it to mush.

```
Just shipped Maestro at the @AnthropicAI × @ElevenLabsIO × @Greycroft
"Hospitality 2030" hackathon at Rosewood Sand Hill.

Three radio messages → six tool calls across four MCP servers →
forty-three seconds → one voice-back confirmation to the GM.

Opus 4.7 + MCP + ElevenLabs Custom LLM. Watch the fan-out 👇

[ATTACH demo.mp4 — 1080p, ≤30s, ≤15MB]
```

## Tweet 2 — the implementation flex (for the Anthropic crowd)

Attach a clean terminal screenshot of the orchestrator stderr during
the Karp turn (the `[orchestrator] connected pms (5 tools)` lines plus
the parallel `tool_call_completed` events).

```
The trick was forcing sequential execution for state-mutating MCP tools
while keeping read-only lookups parallel. Opus 4.7 emits both kinds in
one turn — naïve Promise.all would race two writes against the same
record. Split lanes solve it.

[ATTACH terminal.png — dark mode, ≥2x retina]
```

## Tweet 3 — the GitHub link + ask

Pin this one to your profile until the seed conversation closes.

```
Repo (MIT, four MCP servers, Vite dashboard, full agent loop):

https://github.com/daylite-ai/hospitality-2030-maestro

Open to chat with any luxury-hotel operator or VC looking at the
agentic-orchestration thesis. Calendar is in the QR on the final
dashboard frame.
```

---

## Pre-publish checklist

- [ ] All three tweets drafted in X compose
- [ ] Media attached to tweet 1 and 2 (≤15MB each)
- [ ] Sponsors tagged: @AnthropicAI, @ElevenLabsIO, @Greycroft
- [ ] Hackathon hashtag if announced (check @cerebralvalley feed)
- [ ] Repo README is presentable (check it's not the half-finished version)
- [ ] Calendly link in the Notion one-pager works
- [ ] Scheduled publish time = demo start + 7 minutes (5 min into next
      team's presentation)

## What NOT to tweet

- Don't tweet during the event. Phones-out during other teams' demos
  is a tell.
- Don't tag judges by name unless they followed you first.
- Don't quote-tweet competitors' threads even if they're worse.
- Don't beg for retweets.
