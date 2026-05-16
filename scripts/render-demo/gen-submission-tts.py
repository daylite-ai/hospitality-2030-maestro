#!/usr/bin/env python3
"""Generate the 6 NEW TTS lines for the 60-sec submission video.

Re-uses the same MP3 → WAV pipeline as generate-tts.py but only for the
submission-script.json lines. Output → audio/submission/<id>.wav.
"""
import json, os, sys, subprocess, urllib.request, time
from pathlib import Path

HERE = Path(__file__).parent
OUT = HERE / "audio" / "submission"
OUT.mkdir(parents=True, exist_ok=True)

with open(HERE / "submission-script.json") as f:
    sc = json.load(f)

api_key = os.environ["ELEVENLABS_API_KEY"]
voices = sc["voices"]

MODEL = {
    "founder": "eleven_multilingual_v2",
    "maestro": "eleven_multilingual_v2",
}

def gen(text, vid, st, si, sl, model):
    req = urllib.request.Request(
        f"https://api.elevenlabs.io/v1/text-to-speech/{vid}?output_format=mp3_44100_128",
        data=json.dumps({
            "text": text, "model_id": model,
            "voice_settings": {"stability": st, "similarity_boost": si, "style": sl, "use_speaker_boost": True},
            "seed": 42,
        }).encode(),
        headers={"xi-api-key": api_key, "Content-Type": "application/json", "Accept": "audio/mpeg"},
        method="POST",
    )
    with urllib.request.urlopen(req, timeout=120) as r:
        return r.read()

def mp3_to_wav(mp3, wav_path):
    p = wav_path.with_suffix(".mp3")
    p.write_bytes(mp3)
    subprocess.run([
        "ffmpeg","-y","-loglevel","error","-ss","0.08","-i",str(p),
        "-ac","1","-ar","44100","-c:a","pcm_s16le",str(wav_path)
    ], check=True)
    p.unlink()

def dur(p):
    out = subprocess.run(["ffprobe","-v","error","-show_entries","format=duration",
                          "-of","default=noprint_wrappers=1:nokey=1",str(p)],
                          check=True, capture_output=True, text=True)
    return float(out.stdout.strip())

durations = {}
for i, line in enumerate(sc["lines"], 1):
    wav = OUT / f'{line["id"]}.wav'
    if wav.exists():
        durations[line["id"]] = dur(wav)
        print(f'  [{i}/{len(sc["lines"])}] {line["id"]:20s} cached ({durations[line["id"]]:.2f}s)')
        continue
    role = line["voice"]
    print(f'  [{i}/{len(sc["lines"])}] {line["id"]:20s} synth ({voices[role]["name"]})…', flush=True)
    mp3 = gen(line["text"], voices[role]["id"],
              line.get("stability",0.55), line.get("similarity",0.85),
              line.get("style",0.4), MODEL[role])
    mp3_to_wav(mp3, wav)
    durations[line["id"]] = dur(wav)
    print(f'        → {durations[line["id"]]:.2f}s')
    time.sleep(0.3)

(OUT / "durations.json").write_text(json.dumps(durations, indent=2))
print(f"\n{len(durations)} lines → {OUT}")
print(f"total speech: {sum(durations.values()):.1f}s")
