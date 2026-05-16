# Maestro — 2-minute pitch (Hospitality 2030)

Read this cold. Don't open slides. The demo is the slide. Three escalation
beats: **Karp → Recovery → Proactive.** Phone reveal at 1:23. Close on a
dare from the front edge.

---

## T-5 min — pre-flight (bathroom)

- Three rounds of physiological sighs (Stanford Balban et al. 2023):
  two quick inhales, one long exhale. Repeat.
- Paper-towel the hands. Sweaty fingers miss keys.
- Unpair / re-pair AirPods. Mac System Settings → input = AirPods,
  output = Room AV (HDMI).
- Mirror mode on the laptop. Not Extended. Not auto-detect. Mirror.
- Phone face-down on the podium. Airplane-mode on until T-30 sec.
- Whisper to the wall, three times, 20% slower than normal cadence:
  *"That is the sound of a luxury hotel losing five thousand dollars
  of lifetime value."*
- Cue the 10-second radio audio file. Finger on the trigger key.
- Do NOT open Twitter. Do NOT refresh CodeRabbit. Do NOT talk to the
  previous team. Tunnel vision.

## The five anchors (one whisper-line)

> *Karp. Recovery. Phone reveal. Walk. Close.*

---

## 0:00 — Cold open (silent walk on)

Walk on. No "hi my name is." No title slide. Hit the radio audio key as
your foot hits center stage. Ten seconds of staff radio cacophony — *the
GM yells "Maintenance, burst pipe 4B," housekeeping rushes 12, front
desk says the VIP just pulled up.*

## 0:10 — Reframe + Karp trigger

Hit the Karp hatch (top-right corner). First cards spawn. Look at the
front bench (Greycroft and Anthropic) and say:

> **"That is the sound of a luxury hotel losing $5,000 of lifetime
> value because three people are talking and nobody is typing."**

## 0:14 — One setup sentence, then silent

> *"This is Maestro. I'm the GM. I just gave three voice orders. Watch."*

Then **shut up.** 28 seconds of fan-out animation. Don't narrate API
calls. Don't say "Claude is checking Mews." The room can read the
dashboard faster than you can describe it.

## 0:42 — The spoken confirmation lands

ElevenLabs plays Maestro's 18-word voice line through the room AV. You
stand still. Don't mouth-along. Don't nod approvingly. Let the audio
carry the room.

## 0:50 — Recovery trigger

Hit the Recovery hatch. One sentence as the dashboard re-fans:

> *"Same morning. Real life. Vendors fail."*

## 0:52–0:55 — THE ASYMMETRIC SECOND

The Madera card shakes red. ElevenLabs voices *"switching to Mayfield."*

**Stop speaking. Take your hands visibly off the laptop. Hold one beat
after Claude finishes.** This is the second the demo wins or loses. Every
team will fill silence. You won't.

## 0:55 — One narration beat

After the new green Mayfield card snaps into place:

> *"No human re-prompted. Claude re-planned from partial state."*

Then silent again. Let the rest of the cards complete.

## 1:20 — Proactive trigger

Half-turn toward the front bench. Hit the Proactive hatch.

> *"Now watch what happens when nobody's in the room."*

## 1:23 — Maestro wakes itself

PMS clock ticks. Sage "PMS · clock advance" pill appears in the
transcript. Cards begin spawning unprompted. No staff radio. No GM input.

## 1:25–1:35 — THE PHONE REVEAL

Pick up the phone from behind the laptop. Screen out, chest height. The
/operator card is already there — *"Suite 12 · Deep clean · Urgent · red
wine spill."* No guest name on the housekeeper view.

Long-press. The GM dashboard's matching card flips to **"✓ acknowledged
· floor"** with sage glow.

Eye contact with the front bench while the phone is doing its thing.
Trust the punchline.

## 1:35 — Maestro voices the GM unprompted

ElevenLabs plays the proactive briefing — *"Karp ETA 30 min. Suite 12
dispatched. Maya's horse card placed."* — without anyone speaking first.

## 1:50 — Walk to the front edge

Two slow steps to the front edge of the stage. Hands out of pockets.
Look at the Greycroft bench, then Anthropic, then ElevenLabs.

## 1:55 — Closing line (the dare)

> **"Every luxury hotel GM in this country runs on three radios and a
> clipboard. We just gave them an agent. Who in this room wants to spend
> the night here without one?"**

One beat of silence. Turn. Walk back to the laptop. Do NOT say "thank
you" — let the MC take the mic.

---

## What NOT to say

- No "Hi, my name is."
- No "AI" before establishing the human problem.
- No "Claude is now checking the PMS."
- No "I built this in 36 hours."
- No "Any questions?" — let the MC ask.
- No global $1.6T hospitality TAM. Stay in the $600M luxury wedge.
- No emoji. No "demo god." No "fingers crossed."
- No touching the phone screen. Hold it. Don't tap.
- No looking behind you at the projector. Eye contact stays with the
  front bench.

## Q&A — Acknowledge → answer → reframe to roadmap

Every answer follows that arc. No silent-stare parries. No Socratic
counter-questions. Total time per answer: ≈45 seconds.

### "Isn't this just a $20/mo SaaS that Canary will ship next quarter?"

*"Canary is the right comparison — they won HotelTechReport's first
Best Voice Bot award in January. So the question is real. But Canary
lives in the guest-comms layer. Maestro lives one layer up, in the GM's
operational graph. Canary sends the upsell email. Maestro decides which
staff member, which suite, which vendor, at which moment. They'll
integrate with us before they compete with us. What this unlocks next is
the GM trust-graph — fourteen weeks of which staff get pinged for what,
which vendors fail when. Mews can't ship that. They don't have the data."*

### "Aren't you a feature Mews will build in six months?"

*"Mews is the obvious acquirer. They're a system of record — fundamentally
quarterly, not millisecond. We're the read-write intelligence layer above
their data layer. We've architected for that exit from week one. The
moat isn't the LLM; it's the operational graph that compounds inside a
single property."*

### "What about Opus 5?"

*"Opus 5 drops our token costs and reduces our latency — that only
expands our margins. The true moat is the proprietary mapping of
unstructured hotel operations into strict, fault-tolerant MCP tool chains.
That takes domain expertise, not a smarter LLM."*

### "What happens when it double-books a VIP?"

*"State-mutating tools require strict input schemas. The MCP server
rejects writes that contradict local state. Read-only tools execute in
parallel; state-mutating tools execute serially. Double-booking is
mathematically impossible inside one turn. Across two concurrent
sessions, the second write rejects with a 409 — Claude re-plans on the
next turn."*

### "How would Rosewood actually deploy this against your real PMS?"

*"Shadow mode for thirty days. Maestro observes every staff radio call
and logs the decision it would have made. The GM reviews the log nightly.
No guest-affecting action until the GM enables write mode per system,
one at a time. Adapters: one production MCP wrapper per quarter; Mews,
Opera, Cloudbeds, RoomRaccoon in that order."*

### "Which model? How do you know it's not hallucinating?"

*"Opus 4.7 for the planning agent with an eval harness on every tool
call — we score against a two-hundred-case golden set built from real
GM radio logs. Sonnet handles the proactive loop because the latency
budget there is ninety seconds, not ninety milliseconds, and the cost
delta funds ten times the wake-ups. We don't ship a tool whose eval
sits under 95%."*

### "Latency?"

*"Sub-seven-hundred-millisecond end-to-end from radio key-up to spoken
confirmation. ElevenLabs Flash v2.5 for the eighteen-word confirms,
Conversational AI 2.0 for barge-in. One cloned voice ID per property —
Rosewood Sand Hill has its own. Voice is the right surface here because
the GM's hands are on a radio, not a keyboard."*

### "Show me what mid-stream interruption looks like."

This is when you demo barge-in. Hit Cmd+I. Type *"Wait — Maya wants
vegan snacks."* Claude re-plans. Total: 15 seconds. Don't talk over it.

### "Privacy?"

*"Self-hosted by design. Maestro runs inside the property's network. No
guest record leaves the building. Claude handles reasoning on Anthropic's
API; the payloads are room IDs and preference tags, not PII. The
housekeeper's mobile view strips guest names — they see room number,
clean type, constraint flag. That's the Rosewood discretion calculus
made explicit."*

---

## Failure modes & recoveries

- **WiFi tanks mid-Karp** → three-finger swipe to Desktop 2, spacebar
  plays the pre-recorded fallback video (see BACKUP_VIDEO.md). Voice
  over it calmly: *"Conference wifi is fighting the voice stream.
  Switching to local fallback execution."* Don't apologise. Don't try
  to recover live.
- **Madera card doesn't shake on Recovery** → keep going. The next
  tool call still resolves to Mayfield. The narration ("Claude
  re-planned from partial state") still lands.
- **Proactive voice doesn't fire** → the dashboard still spawns cards
  unprompted, which is the load-bearing visual. Verbalise the
  voice-line yourself in a level voice if it's silent.
- **Hostile question on stage** → Acknowledge ("That's exactly the
  question I'd ask"), answer with the memorised parry, forward-bridge
  to roadmap. Never Socratic. Never silent-stare.
- **Phone reveal fails** → drop the phone to your side, point at the
  GM dashboard's incoming `staff_ack` event (the sage-glow card),
  verbalise: *"That's the housekeeper acknowledging from her phone right
  now."*

---

## Post-stage (the seed round happens in the next 60 minutes)

1. **T+0:00** — walk off, sit. Don't check Twitter.
2. **T+0:05** — pre-scheduled tweet thread (TWEET.md) auto-publishes.
   Don't touch it.
3. **T+0:20** — during the next team's slot, the Greycroft partner is
   already opening your Notion one-pager from the QR. After the next
   team, walk to their table, stand at the edge. Wait for eye contact.
   *"Want me to show you the inside of the orchestrator?"* If yes, sit
   down. If "later," smile and step away.
4. **T+0:45** — the Anthropic Applied AI lead has different
   incentives. Pitch them the engineering: parallel MCP, sequential
   mutations, `<thinking>` block, eval harness. They reward the
   *implementation*.
5. **T+1:00** — DM the Greycroft partner on X with one screenshot from
   the demo and *"Thanks for the conversation — calendar in the
   one-pager."* No follow-up for 48 hours.

That's the playbook. Karp. Recovery. Phone reveal. Walk. Close. Go.
