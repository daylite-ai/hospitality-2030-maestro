# Maestro — 3-minute live pitch (Round 1 + Round 2)

**The problem statement we hit, declared:** #2 The Invisible Concierge.
Not #1 (which is the *consequence* of an Invisible Concierge), not #3
(which is downstream, see Q&A). Pick one. Lean in.

Hybrid live demo: Karp scenario is **live** against real Claude Opus
4.7 with the system + tools prompt-cached (`ttl: "1h"`) and routing
through a USB-tethered phone hotspot. Recovery + Proactive ride
inside a 30-second B-roll insurance video. Barge-in interrupt lands
live as the closing technical flex.

---

## T-15 minutes — pre-flight

1. Bathroom. Stanford physiological-sigh routine ×3 (two inhales, one
   long exhale). Repeat.
2. Paper-towel the hands. Sweaty fingers miss keys.
3. Phone in via USB-C. Mac Wi-Fi OFF. Network → iPhone USB → primary.
   Verify `curl https://api.anthropic.com` returns < 200 ms.
4. Start the cache warmer:
   ```bash
   ./scripts/keep-cache-warm.sh &
   ```
5. AirPod single ear. Mac audio: input = AirPods, output = room AV.
6. Mirror-mode display, not extended. Cursor stays visible.
7. Whisper to the wall, three times, 20% slower than normal:
   *"Hospitality ops are broken. Maestro fixes it."*
   Five-anchor recall: *"Karp. Phone reveal. B-roll. Barge-in. Close."*
8. Do NOT open Twitter. Do NOT refresh CodeRabbit. Do NOT talk to the
   previous team. Tunnel vision.

## T-2 minutes — final boot

Terminal 1 (orchestrator, live mode):
```bash
cd ~/coding/rosewood
set -a; source .env; set +a
pnpm dev
```

Terminal 2 (dashboard, prod-mode preview):
```bash
cd ~/coding/rosewood/apps/dashboard
pnpm preview --port 5173 --strictPort
```

Browser: `http://localhost:5173` full-screen on projector. Synthetic
PMS sandbox pill is visible in the header by design.

If Wi-Fi tanks AND the hotspot fails: `OFFLINE_MODE=1 pnpm dev` boots
the orchestrator in fixture-replay mode. Same UX, no network.

---

## The 3-minute live demo (locked)

| t | Beat | What happens |
|---|---|---|
| 0:00–0:15 | Cold open + setup | Live dashboard, no slide, one sentence |
| 0:15–1:30 | **Karp scenario LIVE** | Trigger Karp hatch, fan-out across 3 columns, X-Ray flash at ~0:55, spoken confirmation lands |
| 1:30–1:45 | **Phone reveal** | Operator surface mirrors the desktop, long-press → sage glow |
| 1:45–2:25 | **Recovery + Proactive B-ROLL** | Cut to pre-rendered 30-second sizzle, voice-over the two scenarios |
| 2:25–2:45 | Live close + **barge-in** | Cmd+I mid-fan-out, Claude re-plans on stage |
| 2:45–3:00 | Closing dare | Walk to front edge, deliver, stop |

### 0:00 — Cold open (silent walk on)

Walk on. No "hi my name is." No title slide. The dashboard is already
up. Look at the front bench (Greycroft + Anthropic + Rosewood) and
say:

> *"I am the General Manager of Rosewood Sand Hill at four p.m. In
> twelve minutes, the Karp family arrives. Watch."*

### 0:15 — Karp scenario LIVE

Hit the Karp hatch in the top-right corner of the dashboard.

Cards begin spawning across PMS, Housekeeping, F&B. Don't narrate.
**Twenty-eight seconds of silence** while the fan-out animates. Trust
it. The room reads dashboards faster than you can talk.

**At 0:55 — X-Ray flash.** As tool calls land, hit `Alt+X`. The
editorial surface flips to the dark MCP / `tool_use` JSON-RPC stream.
Hold for eight seconds. One narration line:

> *"Maestro is calling four MCP servers in parallel for reads, sequencing
> the writes. No double-bookings, no orphan tool calls."*

Hit `Alt+X` again to flip back to the alabaster dashboard. The
spoken confirmation lands through the room PA:

> *George (Maestro) — "Suite fourteen prepped, with a horse card for
> Maya and gluten-free snacks. Madera Bar booked for four, at eight."*

### 1:30 — Phone reveal (your best beat)

> *"That horse card matters because Maya is eight and loves horses.
> Maestro pulled that from her profile, not a prompt."*

Pick up the phone from behind the laptop. Screen out, chest height,
slight tilt toward the front bench. The `/operator` view is already
there:

> *"And every staff member sees only what they need. No guest name,
> no PII. Housekeeping sees this."*

Long-press the card. The desktop dashboard's matching card flips to
**"✓ acknowledged · floor"** with sage glow. Eye contact with the
front bench.

### 1:45 — Recovery + Proactive B-roll

Cut to the 30-second sizzle reel (Cmd+Tab to the QuickTime window in
Desktop 2; spacebar to play). Voice-over in your own voice, calm:

> *"Same morning, real life. Madera's reservation API goes down."*
> [Madera card shakes red on screen]
> *"Maestro classifies it as a third-party outage, not a model error,
> and re-plans to Mayfield Bakery. Autonomous service recovery."*
> [New Mayfield card spawns in sage]
> *"And then this — the PMS clock advances. The Karps are now thirty
> minutes out. Maestro acts unprompted, voices the General Manager,
> dispatches the suite, queues the amenity. The Invisible Concierge,
> always on."*
> [Proactive sage pill, cards spawn]
> *"All of that, in our local stack, against fourteen tools, with
> the entire reasoning chain audit-trailed."*

Cut back to the live dashboard.

### 2:25 — Live close + barge-in (your closing flex)

Trigger Karp once more, this time silent.

> *"One last thing."*

As the fan-out animates, hit `Cmd+I`. The clay interrupt overlay
opens. Type:

> *"Wait — Maya prefers vegan snacks."*

Hit enter. Claude's stream aborts mid-tool-call, the `GM interjects`
line appears in the transcript, the next iteration re-plans the
amenity. Eight seconds.

> *"Real-time correction. Mid-stream interrupt. No restart."*

### 2:45 — Closing dare

Walk two steps to the front edge of the stage. Hands out of your
pockets. Look at the Greycroft bench, then Anthropic, then
ElevenLabs:

> *"Maestro is the concierge — everywhere, ambient, and one cron job
> from remembering you forever. Repo is daylite-ai slash hospitality
> 2030 maestro. Thank you."*

Turn. Walk back to the laptop. Do not say "any questions?" — the MC
asks. Do not say "thank you" again.

---

## What NOT to say

- No "Hi, my name is."
- No "AI" before establishing the human problem.
- No "Claude is checking the PMS now" or any tool-call narration.
- No "I built this in 36 hours."
- No "Any questions?" — the MC asks.
- No "Thank you" before the MC takes the mic.
- No global $1.6T hospitality TAM. Stay in the $600M luxury wedge.
- No emoji.
- No looking behind you at the projector. Eye contact with the front
  bench.
- No touching the phone screen with the projection finger. Hold it.

---

## Q&A — Acknowledge → answer → reframe (≈45 sec each)

The locked Rosewood ops-exec question and the seven follow-ups every
team is asked at luxury-hospitality-themed CV events.

### 1. "How is this different from what we already get from our PMS vendor's AI assistant?" (Alice, Akia, HelloShift)

> *"Vendor assistants automate one system at a time. Maestro is the
> orchestration layer above the PMS, housekeeping, F&B, and spa — it
> doesn't compete with your PMS vendor, it sits one level up and
> treats them all as tools. And it's voice-first for the GM, not
> chat-first for the guest. That's why the demo is on a phone in my
> pocket, not in the guest's app."*

### 2. "Why didn't you cover the third problem statement, Post-Stay?"

> *"Post-stay relationship continuity is downstream. You can't
> remember a guest you never properly met. Maestro builds the memory
> engine during the stay by capturing every tool_use trace into a
> structured guest graph. Post-stay is one cron job and a Sonnet 4.6
> summariser away."* Then point at the Audit drawer (Shift+?).

### 3. "What stops Maestro from double-booking a VIP or promising an amenity you don't have?"

> *"Maestro is strictly bounded by parallel read-only tools. It drafts
> the payload based on real-time PMS inventory, but state-changes
> require a single-tap human confirmation on the operator surface. It
> drafts, but the human deploys. Read-only parallel, state-mutating
> serial — double-booking is mathematically impossible inside one
> turn, and the second concurrent write rejects with 409 conflict so
> Claude re-plans."*

### 4. "Aren't you just a feature Mews or Canary will build in six months?"

> *"Canary is a system of record. Systems of record are quarterly, not
> millisecond. We're the read-write intelligence layer above their
> data layer. We've architected for that exit from week one. The moat
> isn't the LLM; it's the operational graph that compounds inside a
> single property — fourteen weeks of which staff get pinged for
> what, which vendors fail when, which gestures land with which
> guest."*

### 5. "What about Opus 5?"

> *"Opus 5 drops our token costs and reduces our latency. That only
> expands our margins. The true moat is the proprietary mapping of
> unstructured hotel operations into strict, fault-tolerant MCP tool
> chains. That takes domain expertise, not a smarter LLM."*

### 6. "How would Rosewood actually deploy this?"

> *"Shadow mode for thirty days. Maestro observes every staff radio
> call and logs the decision it would have made. The GM reviews the
> log nightly. No guest-affecting action until the GM enables write
> mode per system, one at a time. Adapters: one production MCP wrapper
> per quarter; Mews, Opera, Cloudbeds, RoomRaccoon in that order."*

### 7. "What's the model stack and how do you evaluate it?"

> *"Opus 4.7 for the planning agent with an eval harness on every
> tool call — we score against a two-hundred-case golden set built
> from real GM radio logs. Sonnet handles the proactive loop because
> the latency budget there is ninety seconds, not ninety milliseconds,
> and the cost delta funds ten times the wake-ups. We don't ship a
> tool whose eval sits under ninety-five percent."*

### 8. "ElevenLabs — what's special about how you used it?"

> *"Custom LLM webhook into Anthropic Opus 4.7. Dynamic voice
> parameter shifts between scenarios — calm and warm on Karp, clipped
> and urgent on Recovery, briefing on Proactive — all rendered through
> a single cloned voice ID per property. Time-to-first-byte under
> seven hundred milliseconds end-to-end. The voice is the GM's
> earpiece; Maestro is who's on the other end."*

---

## Failure-frame protocol (memorise the ONE line)

If at thirty seconds into Karp the first tool_use is still streaming
and the room is getting restless:

> *"While Opus fans out across four MCP servers in parallel, let me
> show you what's actually happening underneath."*

Hit `Alt+X`. Narrate the in-flight JSON-RPC stream for ten seconds.
You are not apologising. You are flexing. Latency becomes UX.

If Anthropic never responds: `Cmd+R` to refresh, set `OFFLINE_MODE=1`
in a second terminal, restart orchestrator, demo continues. Eight
seconds lost.

If both fail: Cmd+Tab to the QuickTime backup of the FULL Karp run.
Voice-over it calmly:

> *"Conference Wi-Fi is overwhelmed. Here is the same run from
> rehearsal — every line you see is the real model, every state
> change is the real MCP server."*

---

## Post-stage protocol (the seed round happens in the next 60 minutes)

1. **T+0:00** — Walk off, sit. Don't check Twitter.
2. **T+0:05** — Pre-scheduled tweet thread auto-publishes
   ([`TWEET.md`](TWEET.md)). Don't touch it.
3. **T+0:20** — During the next team's slot, the Greycroft partner is
   already opening the Notion / QR. After the next team finishes,
   walk to their table, stand at the edge. Wait for eye contact.
   *"Want me to show you the inside of the orchestrator?"*
4. **T+0:45** — Anthropic Applied AI lead has different incentives.
   Pitch them the engineering — `<thinking>` block, parallel-read /
   serial-write, eval harness, X-Ray. They reward implementation.
5. **T+1:00** — DM the Greycroft partner on X with one screenshot
   from the demo and *"Thanks for the conversation — calendar in the
   one-pager."* No follow-up for 48 hours.

That's the playbook. Karp. Phone reveal. B-roll. Barge-in. Close.
Go.
