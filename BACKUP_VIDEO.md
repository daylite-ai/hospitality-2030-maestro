# Backup video — the Phantom Demo

If conference Wi-Fi hangs more than **4 seconds** in mid-demo, you must
switch to a pre-recorded screen capture. Judges in May 2026 specifically
hate "sorry, the Wi-Fi is bad". Half the room won't realise it's a
video if you handle it right.

## Capture session — record this BEFORE you leave for the venue

### Setup

1. Launch the full demo locally with API keys real:
   ```bash
   pnpm install
   ./scripts/start-demo.sh
   ```
   Open `http://localhost:5173` in a fresh Chrome window. Hide the
   bookmarks bar. Use the laptop's native resolution (no zoom).

2. Open QuickTime → New Screen Recording → Options → Microphone: **None**.
   No voiceover. You will narrate live over the video on stage.

3. Set the capture region tightly around the Chrome window. Don't
   capture the dock or menu bar.

### Take

1. Hit Record.
2. Wait 1 second on the idle dashboard (so the recording starts on
   the empty state — judges see the brand mark first).
3. Click the **invisible Karp button** (top-right 10×10 px corner).
4. Watch the full Karp scenario play through. Three radio messages
   transcribed at top, six tool-call cards fanning into four columns,
   final spoken confirmation chip lighting sage.
5. Wait 2 seconds after the spoken-response chip appears.
6. Stop recording.

### Polish (no editing software needed)

- Trim head and tail in QuickTime Player (Edit → Trim).
- Save as `demo.mov` in the repo root (gitignored — too large).
- Export a smaller MP4 for Twitter (File → Export As → 1080p) into
  `demo-twitter.mp4`. Aim ≤15MB so X doesn't downsample.

### Verify

- Open the .mov in QuickTime, hit spacebar. Cards animate smoothly. No
  stuttering. The "fan-out" reads visually in under 1 second per card.
- Length: 35–50 seconds is ideal. Under 30 looks rushed, over 60 loses
  the room.

## Stage protocol when Wi-Fi tanks

1. Mac has two macOS Desktops: **Desktop 1** = live demo (Chrome
   showing the live dashboard), **Desktop 2** = QuickTime full-screen
   with `demo.mov` loaded, paused on first frame.
2. Three-finger swipe right → arrive on Desktop 2 → spacebar plays the
   video.
3. Voice over it, calm and clear:
   > *"Conference Wi-Fi is fighting the voice stream — switching to
   > local fallback execution."*
4. Stay on Desktop 2 until the video ends. Then three-finger swipe
   back to Desktop 1 for the QR code in the empty state.
5. **Do not apologise. Do not try to recover the live demo.** You will
   lose the room.

## Failure modes to avoid

- **Recording with audio enabled** — your live voice + the recorded
  voice will overlap and sound like a glitch.
- **Recording at 4K** — the file is too large and won't render
  smoothly on the projector.
- **No spare Mirror Mode test** — if you record while on Extended
  display and demo on Mirror, the resolution will be wrong.
- **Saving as .mp4 with macOS H.265 default** — older projectors
  choke. Export H.264.
- **Recording at the venue minutes before the slot** — too risky.
  Capture before you leave home / hotel.
