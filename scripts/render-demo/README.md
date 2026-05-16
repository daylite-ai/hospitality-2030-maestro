# Demo video render pipeline

Produces `out/maestro_demo.mp4` — the 1:57 AI-voiced demo we play from
the stage Mac instead of risking a live demo over ballroom Wi-Fi.

## Cast

| Role | Voice | Model |
|---|---|---|
| Founder (the GM, gravitas) | Brian (`nPczCjzI2devNBz1zQrb`) | `eleven_multilingual_v2` |
| Maestro (the chief-of-staff AI) | George (`JBFqnCBsd6RMkjVDRZzb`) | `eleven_multilingual_v2` |
| Housekeeping radio | Sarah | `eleven_turbo_v2_5` + walkie filter |
| Front-desk radio | Roger | `eleven_turbo_v2_5` + walkie filter |
| Maintenance radio | Adam | `eleven_turbo_v2_5` + walkie filter |

Every voice is a premade ElevenLabs library voice. No cloning, no
custom training. Locked `seed=42` per call for reproducibility. First
100ms of every clip trimmed to kill the TTS "inhale" tell.

## Pipeline

```bash
cd scripts/render-demo
npm install                      # playwright
python3 list-voices.py           # optional — A/B voices first
python3 generate-tts.py          # 12 ElevenLabs calls → audio/*.wav (~60s)
# walkie-talkie filter on the 3 staff radio voices
for s in staff_hk_chaos staff_desk_chaos staff_mtc_chaos; do
  ffmpeg -y -i audio/$s.wav \
    -af "highpass=f=300,lowpass=f=3000,acompressor=threshold=0.04:ratio=12:attack=5:release=50:makeup=4,acrusher=bits=10:mode=lin:level_in=1:level_out=0.85" \
    audio/radio/$s.wav
done
node record-trace.mjs            # Playwright records the 1:57 trace.webm
bash compose.sh                  # ffmpeg mux → maestro_demo.mp4
```

Prerequisites (all already met in this environment):
- `ANTHROPIC_API_KEY` + `ELEVENLABS_API_KEY` in `.env` at repo root
- orchestrator running on `:4000`, dashboard preview on `:5173`
- ffmpeg, node 24, python3, playwright chromium

## How it stays deterministic

- `record-trace.mjs` logs every visual cue's wallclock time in
  `out/events.json`. Each TTS line is anchored to one of those cues in
  `compose.sh` (e.g. recovery_voice fires `madera_shake + 0.4s`, no
  matter how long Claude actually took).
- ElevenLabs API call locks `seed=42` for every render.
- Playwright runs in headless chromium at fixed 1920×1080×1.0 dsr.
- The `/operator` mobile surface is iframe-injected into the desktop
  page before recording starts, so a single Playwright video capture
  contains both surfaces — no compositing CLI guesswork.

## How to play on stage

1. Drop `out/maestro_demo.mp4` onto the stage Mac via USB stick
   (not Google Drive — venue Wi-Fi).
2. QuickTime full-screen on the Mac, HDMI to projector.
3. Mac audio output → room AV. Test gain at -16 LUFS target before
   doors open.
4. Frame the video in your opening two sentences:
   > "Hospitality operations cannot tolerate downtime or jitter, and
   > neither can we. To bypass the Wi-Fi DDoS roulette, you are about
   > to see a one-fifty-seven deterministic execution trace of our
   > live build. The codebase is running locally for Q&A."

Then hit spacebar. Don't apologise. The video runs itself.

## What it shows, beat by beat

| t | Beat | Voice / visual |
|---|---|---|
| 0:00–0:10 | Radio chaos cold-open | 3 walkie-filtered staff voices overlapping |
| 0:11 | Reframe | Brian: "That is the sound of a luxury hotel losing five thousand dollars of lifetime value." |
| 0:13.4 | Karp triggered | Cards fan out across 3 columns |
| 0:16 | Setup | Brian: "This is Maestro. I am the GM. Watch." |
| 0:16–0:44 | Silent fan-out | 8 tool calls across PMS / HK / F&B |
| 0:44 | Spoken confirmation | George: "Suite fourteen prepped with a horse card for Maya and gluten-free snacks. Madera Bar booked for four, at eight." |
| 0:50.5 | Recovery setup | Brian: "Same morning. Real life. Vendors fail." |
| 0:51 | Recovery triggered | Cards re-fan |
| 0:55.9 | Madera shake | F&B card flashes clay-red with "503" |
| 0:56.3 | Recovery voice | George: "Madera is offline. Switching to Mayfield." |
| 0:58.5–1:01.6 | **3 seconds of total silence** | (the asymmetric beat) |
| 1:01.6 | Recovery narration | Brian: "No human re-prompted. Claude re-planned from partial state." |
| 1:18 | Proactive setup | Brian: "Now watch what happens when nobody is in the room." |
| 1:20 | Proactive triggered | "PMS · clock advance" pill appears, cards spawn |
| 1:23 | Phone reveal | `/operator` iframe slides into bottom-right corner |
| 1:32 | Staff ack | Long-press → main dashboard card flips sage-glow |
| 1:40 | Proactive voice | George: "The Karps are thirty minutes out. Suite twelve is dispatched. Maya's horse card is placed." |
| 1:46 | Closing dare | Brian: "Every luxury hotel General Manager runs on three radios and a clipboard. We just gave them an agent." |
| 1:55 | Hold the frame | (3 seconds of QR-visible final state) |
| 1:57 | End | (cut to next slide / Q&A) |

If anything in the pipeline misbehaves, see `out/events.json` for the
actual recorded timestamps and adjust `T[...]` offsets in
`compose.sh` accordingly.
