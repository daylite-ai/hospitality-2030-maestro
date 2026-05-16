# Stage protocol — Round 1 (17:00) and Round 2 (19:00)

The official rules are clear: **judging is live demo, 45% of the score.**
No pre-recorded video on stage. Submission video is a separate, async
1-minute file uploaded by 17:00. This file is the on-stage operations
playbook.

## The ONE decision: USB cellular tethering

The `CVHack26` venue Wi-Fi will be saturated by 120 hackers + judges +
sponsors at exactly the moment your slot starts. The 2.4/5GHz band in
that ballroom is a coin flip. Do not gamble.

**Plug your phone into the Mac via USB-C. Disable Mac Wi-Fi. Tether
through 5G UWB.** Your Anthropic API calls now route through a clean,
single-user uplink. Latency drops, jitter drops, packet loss drops.

If you cannot tether (phone dead, no signal), you have two fallbacks:
- Run Round 1 on the venue Wi-Fi, accept the risk
- Hit `OFFLINE_MODE=1` before going on stage and demo the deterministic
  fixture replay. The dashboard still animates; the spoken responses
  still play through the room PA via voice-over from the founder.

## Pre-flight, T-15 minutes

1. Bathroom — Stanford physiological-sigh routine ×3
2. Paper-towel the hands. Sweaty fingers miss keys.
3. Plug phone in via USB-C. Mac System Settings → Wi-Fi off. Network
   → iPhone USB → "Use as primary." Verify `curl https://api.anthropic.com`
   returns < 200 ms.
4. Start the cache warmer:
   ```bash
   ./scripts/keep-cache-warm.sh &
   ```
   Leave it pinging every 4 minutes through both Round 1 and Round 2.
5. AirPod single ear. Mac audio: input = AirPods, output = room AV.
6. Test the full demo path once on the actual Mac that goes on stage,
   with the actual cable that will hit the projector, with the room
   PA at the gain it will be at:
   ```bash
   curl -X POST http://localhost:4000/api/scenarios/karp
   # wait for fan-out + spoken response, verify timing
   ```
7. If anything in #6 takes longer than 35 seconds, switch to
   OFFLINE_MODE for the live demo. Do not gamble on a 30-second cold
   call against Opus on stage.
8. Whisper, three times, 20% slower than normal: *"Hospitality ops
   are broken. Maestro fixes it."* Five-anchor recall: *"Karp.
   Proactive. Barge-in. Phone reveal. X-Ray."*

## Boot commands on the stage Mac

Terminal 1 (orchestrator):
```bash
cd ~/coding/rosewood
set -a; source .env; set +a
pnpm dev       # live mode (uses tethered internet for Anthropic)
# or
OFFLINE_MODE=1 pnpm dev   # fallback if Wi-Fi died and tether unavailable
```

Terminal 2 (dashboard):
```bash
cd ~/coding/rosewood/apps/dashboard
pnpm preview --port 5173 --strictPort
```

Terminal 3 (cache warmer — only in live mode):
```bash
cd ~/coding/rosewood
./scripts/keep-cache-warm.sh
```

Browser: `http://localhost:5173` full-screen on the projector. The
`/operator` mobile surface is iframe-injected automatically — no second
device needed for the phone reveal.

## The live demo (3 minutes, locked)

Locked second-by-second in [`PITCH.md`](PITCH.md). One-line summary:

| t | beat |
|---|---|
| 0:00–0:20 | Context + hook (no slides) |
| 0:20–1:30 | Karp scenario (live, pre-warmed) |
| 1:30–2:10 | Proactive scenario + live barge-in interrupt |
| 2:10–2:40 | Operator phone reveal + sage-glow ack |
| 2:40–3:00 | X-Ray flash (Alt+X) + close |

**Do not demo Recovery on stage.** Talk about it in Q&A if asked.

## The failure-frame script

If Opus hangs for 12 seconds on stage, **do not apologise**. Point to
the dashboard and say:

> *"While Maestro parallel-processes fourteen legacy subsystems over a
> saturated hackathon network, notice how our React 19 architecture
> holds state asynchronously without blocking the operator's view."*

Then wait, calmly. The fan-out arrives. The audience absorbs latency as
a UX flex, not a bug.

If the request never comes back, hit ⌘+R on the dashboard, set
`OFFLINE_MODE=1` in the orchestrator's environment, and rerun. Lose 8
seconds. Demo continues.

## Q&A discipline

90-second window. Memorised parries live in [`PITCH.md`](PITCH.md).
Structure every answer the same way: Acknowledge (3-5 sec) → Answer
(15-25 sec) → Forward-bridge to roadmap (10-15 sec). Total ~45 sec per
answer, two questions per window.

## Post-stage

The MC takes the mic. You do not say "thank you" — that signals
out-of-gas. You walk back. You sit. You do not check Twitter.

T+5 minutes the pre-scheduled tweet thread auto-publishes (see
[`TWEET.md`](TWEET.md)). T+20 the Greycroft partner has scanned the
QR and opened the README. T+45 you walk to their table at the next
break.

That is the protocol. Go.
