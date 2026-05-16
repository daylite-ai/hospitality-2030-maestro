# Maestro — 2-minute pitch (Hospitality 2030)

Read this once cold. Don't open slides. The demo is the slide.

---

## Pre-flight (T -15 min, bathroom)

- 30 seconds of physiological sighs: two quick inhales, one long exhale.
  Repeat. Heart rate drops from spike to baseline so your hands don't
  shake on the mic.
- Do **not** look at the laptop for the last 5 minutes. Staring at the
  dashboard now breeds phantom bugs in your head.

## Pre-flight (T -2 min, side of stage)

- Laptop on **Mirror Mode** (not Extended). System Settings → Displays →
  Use as: Mirror. Cursor stays visible to you and to the room.
- AirPod in **one ear only**. Mac audio:
  - **Input** = AirPods
  - **Output** = Room AV (HDMI / projector audio)
  This is the single most important pre-flight item. It prevents the
  feedback-loop-of-death where ElevenLabs hears its own TTS through the
  laptop mic and hallucinates.
- Backup video pre-loaded in a separate macOS Desktop (three-finger
  swipe to reach). QuickTime, 1080p, no voiceover. See [BACKUP_VIDEO.md](BACKUP_VIDEO.md).
- Tweet thread pre-drafted, scheduled to auto-publish exactly **5
  minutes after your slot ends**. See [TWEET.md](TWEET.md).

---

## 0:00 — Cold open (no introduction)

Walk up. Plug in. Don't say your name. Hit play on the **radio chaos
clip** (10-second pre-recorded audio of staff radio):

> *Maintenance, we have a burst pipe in 4B. Housekeeping, I need a rush
> on 12. Front desk, the VIP just pulled up.*

Mute it. Then, looking at the front row (Greycroft and Anthropic
benches), say:

> **"That is the sound of a luxury hotel losing five thousand dollars in
> lifetime value because three people are talking and nobody is typing.
> I built Maestro to turn radio chaos into instant database execution."**

Click the mic.

## 0:15 — Demo (90 seconds, mostly silent)

Speak the canned 3-radio sequence into the AirPod. Let the dashboard
speak.

> "Suite 12 needs a deep clean — the outgoing guests spilled red wine on
> the rug."
>
> "David Karp and his family — wife Rachel, two kids — just landed at
> SFO, about an hour out."
>
> "And Madera's main dining room is fully booked tonight, but the bar
> still has space."

Watch the fan-out graph light up. The cards spawn. The 15-word
confirmation lands. **Don't talk over it.**

Allow yourself **one** unscripted reaction line if the fan-out lands
crisp. Something like: *"Watch the fan-out here — four systems updated
in under a second."* One reaction beat. Not a narration track.

**If wifi tanks** (>4-second WS hang): three-finger swipe to backup
video, hit spacebar, voice over it:

> *"Conference Wi-Fi is fighting the voice stream — switching to local
> fallback execution."*

Half the room won't realise it's a video.

## 1:45 — Why now (15 seconds)

> Mews just raised three hundred million in January at a two and a half
> billion valuation — the largest funding round in hotel software ever.
> Otelier's January index says the average hotel runs more than seven
> platforms and spends eleven hours a week reconciling them. The thesis
> is funded. The plumbing isn't yet built.

## 2:00 — The ask + the QR

Step away from the podium. Walk to the front edge of the stage. Hands
out of your pockets. Eye contact with the Greycroft bench.

> **"I built this solo in eight hours on Claude Opus 4.7, the Model
> Context Protocol, and ElevenLabs. With one Mews or one Opera adapter,
> this is the GM operating layer Rosewood doesn't have."**

Then point at the dashboard, which now shows a clean QR code:

> **"QR is on screen — fifteen-minute tech deep-dive on the other side.
> Thank you."**

Pause. Smile. Yield the floor. Walk briskly back to your seat.

---

## What NOT to say

- **Do not** say "we're replacing Mews / Opera." You're the
  interoperability layer above them. VCs reward interoperability plays.
- **Do not** mention prompt engineering, MCP transports, or tool-use
  loops. Judges either already know or already don't care.
- **Do not** apologise. If a tool errors on stage, the dashboard shows
  a clay-tinted result card and Claude says so. Just move on.
- **Do not** say "demo god" or "fingers crossed". Signals you don't
  trust the build.
- **Do not** offer business cards or "let's connect on LinkedIn". The
  QR is the ask.
- **Do not** look behind you at the projector mid-demo. The judges face
  the projector; you face the laptop, and you make eye contact with the
  front row.

## Q&A — three sentences each, memorised cold

**"How is this not just a feature Mews or Opera will build next
quarter?"**
→ *Mews is a system of record. They excel at database integrity, not
cross-platform orchestration. Incumbents move slowly to protect their
walled gardens; Maestro is the agnostic intelligence layer that reads
and writes across all of them through standard MCPs.*

**"What's the moat if Opus 5 comes out next month?"**
→ *Opus 5 will drop our token costs and reduce latency, which only
expands our margins. The true moat is the proprietary mapping of
unstructured hotel operations into strict, fault-tolerant MCP tool
chains — that takes deep domain expertise, not just a smarter LLM.*

**"Aren't you just another AI concierge?"**
→ *Concierges are guest-facing. Canary already shipped Concierge Studio
templates in March. Maestro is staff-facing. We are not in Canary's
category. We are in Mews's category.*

**"How would Rosewood deploy this against their real PMS?"**
→ *MCP adapters. The four tools we ship today are MCP servers. The same
shape adapts to Mews, Opera, Cloudbeds, RoomRaccoon. One production
adapter per quarter; first three hotels on Mews-only takes about ten
weeks.*

**"What about data privacy?"**
→ *Self-hosted by design. Maestro runs inside the property's network.
No guest record leaves the building. Claude handles only reasoning on
Anthropic's API; payloads are room IDs, not PII, when we route to
production tools.*

**"What's the business model?"**
→ *Per-property SaaS plus per-action metered usage on the voice channel.
Comparable unit economics to Mews and Canary. Rosewood-tier properties'
willingness-to-pay is north of two thousand dollars per room per month
for staff productivity software they actually trust on the floor.*

**"What if Claude is wrong?"**
→ *Every action is reversible by the GM in one tap on the same
dashboard. The audit log is permanent. Tools that mutate state require
a structured input schema, so the model cannot invent rooms or guests.*

## What NOT to rehearse

Script your **first 15 seconds** (the radio-clip cold open) and your
**last 15 seconds** (the ask + QR). Memorise those word-for-word.

**Let the middle 90 seconds breathe.** If you over-rehearse it you
sound like a text-to-speech engine. VCs fund authentic humans obsessed
with the problem, not robots reading a teleprompter. If the graph fans
out perfectly, react to it like a human would.

## Post-stage (the next 60 minutes is when the seed round happens)

1. **T +0:00** — Walk off, sit down. Do not check Twitter. Watch the
   next team's demo with attention — judges notice.
2. **T +0:05** — Pre-scheduled tweet thread auto-publishes. See
   [TWEET.md](TWEET.md). Don't touch it.
3. **T +0:20** — During the break, the Greycroft partner will already
   have your one-pager open from the QR. Walk over to their table, not
   to their face. Stand at the edge. Wait for eye contact. *"Want me to
   show you the inside of the orchestrator?"* If they say yes, sit
   down. If they say "I'll grab you later", smile and step away.
4. **T +0:45** — Anthropic Applied AI lead has different incentives.
   Pitch them the engineering: parallel MCP, sequential mutations,
   `<thinking>` block. They reward the *implementation*, not the
   business.
5. **T +1:00** — DM the Greycroft partner on X with one screenshot
   from the demo and the line *"Thanks for the conversation — calendar
   in the one-pager."* No follow-up for 48 hours.

That's the playbook. Now go control the room.
