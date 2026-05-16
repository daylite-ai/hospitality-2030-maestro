# Maestro — 2-minute pitch (Hospitality 2030)

Read this once cold the moment the timer starts. Don't open slides.
The demo is the slide.

---

## 0:00 — Hook (one sentence)

> **"Current hotel systems are read-only for the front-line staff who actually run the property. Maestro is the read-write intelligence layer that turns a chaotic 6-system, 15-minute radio dispatch into a 0-click, 5-second workflow."**

Wait one beat. Then click the mic.

## 0:10 — Demo (90 seconds, no narration)

Speak the canned 3-radio sequence. Let the dashboard speak.

> "Suite 12 needs a deep clean — the outgoing guests spilled red wine on the rug."
> "David Karp and his family — wife Rachel, two kids — just landed at SFO, about an hour out."
> "And Madera's main dining room is fully booked tonight, but the bar still has space."

Watch the fan-out graph light up. The cards spawn. The 15-word
confirmation lands. Don't talk over it.

If wifi tanks: hit the invisible Karp button (top-right corner of the
dashboard), look at the panel and say:

> *"Conference wifi is fighting the voice stream — triggering the
> same payload via the local fallback layer."*

Then carry on. Don't sweat it.

## 1:40 — Why now (20 seconds)

> Mews just raised $300 million in January at a $2.5 billion valuation,
> the largest funding round in hotel software ever. Canary closed $80
> million last June. Otelier's January index says the average hotel
> runs more than seven platforms and spends eleven hours a week
> reconciling them. The thesis is funded. The plumbing isn't yet built.

## 2:00 — The ask

> **"I built this solo in eight hours on Claude Opus 4.7, the
> Model Context Protocol, and ElevenLabs. With one Mews or one Opera
> adapter, this is the GM operating layer Rosewood doesn't have. I'd
> love a conversation."**

Pause. Smile. Sit back down.

---

## What NOT to say

- **Do not** say "we're replacing Mews / Opera." You're an
  interoperability layer above them. VCs reward interoperability plays;
  they punish "we're killing the entrenched database" pitches.
- **Do not** mention prompt engineering, MCP transports, or tool-use
  loops. Judges either already know or already don't care.
- **Do not** apologise for anything. If a tool errors on stage, the
  dashboard shows a clay-tinted result card and Claude says so out
  loud. Just move to the next message in the sequence.
- **Do not** say "demo god" or "fingers crossed" before clicking the
  mic. It signals you don't trust the build.

## Q&A — anticipated questions

**"How would Rosewood deploy this against their real PMS?"**
→ MCP adapters. The four tools we ship today (PMS, Housekeeping, F&B,
Spa) are MCP servers. The same shape adapts to Mews, Opera, Cloudbeds,
RoomRaccoon. Roadmap: one production adapter per quarter; first three
hotels on Mews-only takes about ten weeks.

**"What about data privacy?"**
→ Self-hosted by design. Maestro runs inside the property's network.
No guest record leaves the building. Claude handles only the reasoning
on Anthropic's API; the payloads are room IDs, not PII, when we route
production tools. Important for Rosewood — privacy is the brand.

**"What's the business model?"**
→ Per-property SaaS plus per-action metered usage on the voice channel.
Comparable unit economics to Mews and Canary. Rosewood-tier properties
willingness-to-pay is north of two thousand dollars per room per month
for staff productivity software they actually trust on the floor.

**"Aren't you just another AI concierge?"**
→ No. Concierges are guest-facing. Canary already shipped Concierge
Studio templates in March. Maestro is staff-facing. We are not in their
category. We are in Mews's category.

**"What if Claude is wrong?"**
→ Every action is reversible by the GM in one tap on the same
dashboard. The audit log is permanent. Tools that mutate state require
a structured input schema, so the model can't invent rooms or guests.
We treat Maestro the same way a hotel treats a brilliant new chief-of-
staff on their first month: trust but verify.
