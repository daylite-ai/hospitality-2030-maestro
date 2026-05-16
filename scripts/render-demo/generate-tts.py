#!/usr/bin/env python3
"""
Generate every TTS line from script.json via the ElevenLabs REST API.

Output:  audio/<line_id>.wav  (44.1 kHz, mono, 16-bit PCM)
         audio/durations.json  (line_id → duration in seconds)

Per Reddit May-2026 advice:
  - Premade voices (no cloning, 90-minute budget)
  - eleven_v3_turbo for staff radio (faster, flatter), eleven_v3 for
    founder + maestro (cinematic prosody)
  - Stability / similarity_boost / style tuned per line in script.json
  - Trim 0.1s off the head of every clip to remove the TTS "inhale" tell
"""

import json, os, sys, time, urllib.request, subprocess
from pathlib import Path

HERE = Path(__file__).parent
ROOT = HERE.parent.parent
SCRIPT_PATH = HERE / "script.json"
OUT_DIR = HERE / "audio"
OUT_DIR.mkdir(exist_ok=True)

api_key = os.environ.get("ELEVENLABS_API_KEY")
if not api_key:
    print("ELEVENLABS_API_KEY missing in env (source .env)", file=sys.stderr)
    sys.exit(2)

with open(SCRIPT_PATH) as f:
    script = json.load(f)

voices = script["voices"]
lines = script["lines"]

# Premade-voice tier list. The staff-radio voices use the lighter "turbo"
# model since we'll bandpass-and-bit-crush them through ffmpeg anyway and
# extra prosody is wasted; the founder and Maestro use the full v3 model
# so cinematic emphasis lands.
MODEL_FOR_VOICE = {
    "founder": "eleven_multilingual_v2",
    "maestro": "eleven_multilingual_v2",
    "staff_hk":   "eleven_turbo_v2_5",
    "staff_desk": "eleven_turbo_v2_5",
    "staff_mtc":  "eleven_turbo_v2_5",
}

def synthesize(text: str, voice_id: str, stability: float, similarity: float, style: float, model: str) -> bytes:
    payload = {
        "text": text,
        "model_id": model,
        "voice_settings": {
            "stability": stability,
            "similarity_boost": similarity,
            "style": style,
            "use_speaker_boost": True,
        },
        # Lock seed for reproducibility across renders.
        "seed": 42,
    }
    # mp3_44100_128 is available on Starter tier and up.
    req = urllib.request.Request(
        f"https://api.elevenlabs.io/v1/text-to-speech/{voice_id}?output_format=mp3_44100_128",
        data=json.dumps(payload).encode("utf-8"),
        headers={
            "xi-api-key": api_key,
            "Content-Type": "application/json",
            "Accept": "audio/mpeg",
        },
        method="POST",
    )
    with urllib.request.urlopen(req, timeout=120) as r:
        return r.read()


def mp3_to_wav_trimmed(mp3_bytes: bytes, wav_path: Path):
    """Save MP3 → re-encode to 44.1 kHz mono WAV with 100ms head trim to
    kill the TTS inhale tell."""
    mp3_path = wav_path.with_suffix(".mp3")
    mp3_path.write_bytes(mp3_bytes)
    subprocess.run([
        "ffmpeg", "-y", "-loglevel", "error",
        "-ss", "0.1",          # skip first 100ms (the inhale tell)
        "-i", str(mp3_path),
        "-ac", "1", "-ar", "44100",
        "-c:a", "pcm_s16le",
        str(wav_path)
    ], check=True)
    mp3_path.unlink()


def duration_seconds(wav_path: Path) -> float:
    out = subprocess.run(
        ["ffprobe", "-v", "error", "-show_entries", "format=duration",
         "-of", "default=noprint_wrappers=1:nokey=1", str(wav_path)],
        check=True, capture_output=True, text=True
    )
    return float(out.stdout.strip())


durations = {}
total_lines = len(lines)
for i, line in enumerate(lines, 1):
    line_id = line["id"]
    out_path = OUT_DIR / f"{line_id}.wav"
    if out_path.exists():
        durations[line_id] = duration_seconds(out_path)
        print(f"  [{i}/{total_lines}] {line_id:24s} cached  ({durations[line_id]:.2f}s)")
        continue
    voice_role = line["voice"]
    voice_id = voices[voice_role]["id"]
    model = MODEL_FOR_VOICE[voice_role]
    print(f"  [{i}/{total_lines}] {line_id:24s} synth ({voices[voice_role]['name']}, {model})…", flush=True)
    mp3 = synthesize(
        text=line["text"],
        voice_id=voice_id,
        stability=line.get("stability", 0.55),
        similarity=line.get("similarity", 0.8),
        style=line.get("style", 0.4),
        model=model,
    )
    mp3_to_wav_trimmed(mp3, out_path)
    durations[line_id] = duration_seconds(out_path)
    print(f"          → {durations[line_id]:.2f}s, {out_path.stat().st_size} bytes")
    time.sleep(0.3)  # be polite

(OUT_DIR / "durations.json").write_text(json.dumps(durations, indent=2))
print(f"\nAll {total_lines} lines rendered. Durations → {OUT_DIR/'durations.json'}")
