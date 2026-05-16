#!/usr/bin/env bash
# Compose 30-second Recovery + Proactive B-roll for the live stage demo.
# Trims + concatenates the Recovery and Proactive segments from the
# existing trace.webm, speeds them up to fit 30s, anchors voice-over to
# the Madera shake and Proactive wake-up events.
#
# Stage usage: cmd+tab to QuickTime full-screen on Desktop 2 at 1:45 of
# the live demo. Voice-over by the founder LIVE — these TTS lines are
# the safety voiceover if the founder's mic cuts.
set -euo pipefail
HERE="$(cd "$(dirname "$0")" && pwd)"
cd "$HERE"
OUT="$HERE/out"
A="$HERE/audio/broll"
SRC="$OUT/trace.webm"

echo "=== Step 1: visual segments — Recovery (51-78) + Proactive (80-105) ==="
ffmpeg -y -loglevel warning \
  -i "$SRC" \
  -filter_complex "
    [0:v]trim=51:78,setpts=(PTS-STARTPTS)/1.85,scale=1920:1080:flags=lanczos[v1];
    [0:v]trim=80:105,setpts=(PTS-STARTPTS)/1.85,scale=1920:1080[v2];
    [v1][v2]concat=n=2:v=1:a=0[outv]
  " \
  -map "[outv]" -c:v libx264 -preset slow -crf 18 -pix_fmt yuv420p -r 30 \
  -an "$OUT/broll-video.mp4"

echo "=== Step 2: 30s audio mix ==="
# Audio timing inside the 30s window. Recovery first 14.5s, Proactive 15-30.
declare -A T=(
  [broll_recovery_setup]=0.5
  [broll_recovery_voice]=5.5
  [broll_recovery_narration]=8.5
  [broll_proactive_setup]=15.0
  [broll_proactive_voice]=21.0
)

INPUTS=()
PARTS=()
AMIX=""
i=0
for l in broll_recovery_setup broll_recovery_voice broll_recovery_narration broll_proactive_setup broll_proactive_voice; do
  INPUTS+=(-i "$A/$l.wav")
  ms=$(awk "BEGIN { printf \"%d\", ${T[$l]} * 1000 }")
  PARTS+=("[$i:a]adelay=${ms}|${ms},volume=1.0[a$i]")
  AMIX+="[a$i]"
  i=$((i+1))
done
flt="$(IFS=";"; echo "${PARTS[*]}")"

ffmpeg -y -loglevel warning \
  -f lavfi -t 31 -i anullsrc=channel_layout=stereo:sample_rate=48000 \
  "${INPUTS[@]}" \
  -filter_complex "${flt};${AMIX}[0:a]amix=inputs=$((i+1)):duration=first:dropout_transition=0:normalize=0[m];[m]loudnorm=I=-14:TP=-1:LRA=11[mixed]" \
  -map "[mixed]" -ar 48000 -ac 2 -c:a pcm_s16le "$OUT/broll-audio.wav"

echo "=== Step 3: mux ==="
ffmpeg -y -loglevel warning \
  -i "$OUT/broll-video.mp4" -i "$OUT/broll-audio.wav" \
  -map 0:v:0 -map 1:a:0 \
  -c:v copy -c:a aac -b:a 192k -ar 48000 \
  -t 30 \
  "$OUT/maestro-broll-30s.mp4"

echo
ffprobe -v error -show_entries format=duration,size -of default=noprint_wrappers=1 "$OUT/maestro-broll-30s.mp4"
echo "✓ $OUT/maestro-broll-30s.mp4"
