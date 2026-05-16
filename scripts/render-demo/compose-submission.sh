#!/usr/bin/env bash
# Compose the 60-second cerebralvalley.ai submission video.
#
# Re-uses out/trace.webm (the 1:57 Playwright capture of the full three-
# scenario fan-out) by trimming + speeding up segments to fit 60s:
#
#   0:00–0:03  idle with title overlay
#   0:03–0:30  Karp fan-out (1.37x speed)
#   0:30–0:38  Recovery sizzle (1.75x speed, Madera red-shake + Mayfield)
#   0:38–0:50  Proactive + phone-reveal (2x speed)
#   0:50–0:60  Held final frame with repo URL burned in
#
# Audio: six TTS lines from gen-submission-tts.py, anchored to the
# visual cuts, ElevenLabs voice at 0:00–0:02. -14 LUFS (louder than
# the 1:57 hero — submission viewers will play at moderate gain on
# laptops, not a ballroom PA).
set -euo pipefail
HERE="$(cd "$(dirname "$0")" && pwd)"
cd "$HERE"
OUT="$HERE/out"
A="$HERE/audio/submission"
SRC="$OUT/trace.webm"
[[ -f "$SRC" ]] || { echo "missing $SRC — run record-trace first"; exit 1; }

echo "=== Step 1: extract final hold frame as still ==="
ffmpeg -y -loglevel error -ss 113 -i "$SRC" -frames:v 1 -update 1 "$OUT/final-frame.png"

echo "=== Step 2: compose video timeline (trim + speed + concat) ==="
# Six visual segments via filter_complex. The setpts coefficient is
# 1/speed (e.g. PTS/1.37 → 1.37x faster).
ffmpeg -y -loglevel warning \
  -i "$SRC" -loop 1 -t 11 -i "$OUT/final-frame.png" \
  -filter_complex "
    [0:v]trim=0:3,setpts=PTS-STARTPTS,scale=1920:1080:flags=lanczos[v1];
    [0:v]trim=13.4:49,setpts=(PTS-STARTPTS)/1.37,scale=1920:1080[v2];
    [0:v]trim=51:65,setpts=(PTS-STARTPTS)/1.75,scale=1920:1080[v3];
    [0:v]trim=80:104,setpts=(PTS-STARTPTS)/2.0,scale=1920:1080[v4];
    [1:v]scale=1920:1080,setsar=1[v5];
    [v1][v2][v3][v4][v5]concat=n=5:v=1:a=0[outv]
  " \
  -map "[outv]" -c:v libx264 -preset slow -crf 18 -pix_fmt yuv420p -r 30 \
  -an "$OUT/submission-video.mp4"

echo "=== Step 3: build the 60s audio mix ==="
# Audio timeline (seconds). Six TTS lines anchored to visual beats.
declare -A T=(
  [sub_hook]=0.4
  [sub_intro]=3.0
  [sub_karp_fanout]=15.5
  [sub_karp_voice]=28.5
  [sub_sizzle]=36.0
  [sub_close]=49.0
)

INPUTS=()
FILTER_PARTS=()
AMIX=""
i=0
for line in sub_hook sub_intro sub_karp_fanout sub_karp_voice sub_sizzle sub_close; do
  INPUTS+=(-i "$A/$line.wav")
  ms=$(awk "BEGIN { printf \"%d\", ${T[$line]} * 1000 }")
  FILTER_PARTS+=("[$i:a]adelay=${ms}|${ms},volume=1.0[a$i]")
  AMIX+="[a$i]"
  i=$((i+1))
done
filter="$(IFS=";"; echo "${FILTER_PARTS[*]}")"

ffmpeg -y -loglevel warning \
  -f lavfi -t 61 -i anullsrc=channel_layout=stereo:sample_rate=48000 \
  "${INPUTS[@]}" \
  -filter_complex "${filter};${AMIX}[0:a]amix=inputs=$((i+1)):duration=first:dropout_transition=0:normalize=0[m];[m]loudnorm=I=-14:TP=-1:LRA=11[mixed]" \
  -map "[mixed]" -ar 48000 -ac 2 -c:a pcm_s16le "$OUT/submission-audio.wav"

echo "=== Step 4: mux + finalize ==="
ffmpeg -y -loglevel warning \
  -i "$OUT/submission-video.mp4" -i "$OUT/submission-audio.wav" \
  -map 0:v:0 -map 1:a:0 \
  -c:v copy -c:a aac -b:a 192k -ar 48000 \
  -t 60 \
  "$OUT/maestro-submission-60s.mp4"

echo
echo "=== Result ==="
ffprobe -v error -show_entries format=duration,size -show_entries stream=codec_name,width,height -of default=noprint_wrappers=1 "$OUT/maestro-submission-60s.mp4"
echo
echo "✓ $OUT/maestro-submission-60s.mp4"
