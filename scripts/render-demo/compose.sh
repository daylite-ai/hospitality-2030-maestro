#!/usr/bin/env bash
# Compose final 1:55 demo MP4 from:
#   - trace.webm (1920x1080 VP8, 1:57, silent)
#   - 12 TTS lines (founder + maestro + 3 radio-filtered staff)
#
# Audio anchors derived from out/events.json — the Playwright recorder logged
# every visual cue and we offset each TTS line relative to those wallclock
# timestamps so the spoken confirmations land on the corresponding dashboard
# chip / Madera shake / proactive wake event.
#
# Asymmetric silence (Madera shake → "switching to Mayfield" → 3s of dead
# digital air) is preserved by leaving an audio gap between recovery_voice
# end and recovery_narration start — no music bed underneath, no anullsrc
# needed (amix produces silence when no input is active).
#
# LUFS target: -16 (podcast/AV-room loudness, preserves the silent beat).
# Codec: H.264 yuv420p, AAC 192k 48kHz, 30fps. Plays on any venue projector.

set -euo pipefail
HERE="$(cd "$(dirname "$0")" && pwd)"
cd "$HERE"

OUT="$HERE/out"
AUDIO="$HERE/audio"
RADIO="$AUDIO/radio"

# ── Audio timeline (seconds, derived from events.json) ────────────────
# All offsets are start-times of each line. ffmpeg adelay expects ms.
declare -A T=(
  [staff_hk_chaos]=0.5
  [staff_desk_chaos]=3.2
  [staff_mtc_chaos]=6.5
  [reframe]=11.0
  [setup]=16.0
  [karp_confirmation]=44.0
  [recovery_setup]=50.5
  [recovery_voice]=56.3
  [recovery_narration]=61.6
  [proactive_setup]=78.0
  [proactive_voice]=100.0
  [close]=106.0
)
# Voices that get a -3dB lift relative to staff radios (which are bandpass-
# attenuated already). Staff stay at filter output level; founder + maestro
# at +0 dB.
declare -A GAIN=(
  [staff_hk_chaos]=1.05
  [staff_desk_chaos]=1.05
  [staff_mtc_chaos]=1.05
  [reframe]=1.0
  [setup]=1.0
  [karp_confirmation]=1.0
  [recovery_setup]=1.0
  [recovery_voice]=1.05
  [recovery_narration]=1.0
  [proactive_setup]=1.0
  [proactive_voice]=1.05
  [close]=1.0
)

# Build ffmpeg input arguments. Staff lines come from $RADIO; everything else from $AUDIO.
INPUTS=()
FILTER_PARTS=()
AMIX_IN=""
i=0
for line in staff_hk_chaos staff_desk_chaos staff_mtc_chaos \
            reframe setup karp_confirmation \
            recovery_setup recovery_voice recovery_narration \
            proactive_setup proactive_voice close; do
  case "$line" in
    staff_*) src="$RADIO/$line.wav" ;;
    *)       src="$AUDIO/$line.wav" ;;
  esac
  INPUTS+=(-i "$src")
  delay_ms=$(awk "BEGIN { printf \"%d\", ${T[$line]} * 1000 }")
  gain=${GAIN[$line]}
  FILTER_PARTS+=("[$i:a]adelay=${delay_ms}|${delay_ms},volume=${gain}[a$i]")
  AMIX_IN+="[a$i]"
  i=$((i+1))
done

# Mix all 12 inputs onto a 118s blank canvas (anullsrc) so the master audio
# track length is locked to the video length regardless of which line ends
# first. Then loudnorm to -16 LUFS for AV-room playback.
amix_filter="$(IFS=";"; echo "${FILTER_PARTS[*]}")"

echo "=== Step 1: build mastered audio (-16 LUFS) ==="
ffmpeg -y -loglevel warning \
  -f lavfi -t 119 -i anullsrc=channel_layout=stereo:sample_rate=48000 \
  "${INPUTS[@]}" \
  -filter_complex "${amix_filter};${AMIX_IN}[0:a]amix=inputs=$((i+1)):duration=first:dropout_transition=0:normalize=0[mix];[mix]loudnorm=I=-16:TP=-1:LRA=11:print_format=summary[mixed]" \
  -map "[mixed]" -ar 48000 -ac 2 -c:a pcm_s16le \
  "$OUT/master_audio.wav"

echo
echo "=== Step 2: transcode webm → mp4 (H.264 yuv420p, 30 fps) ==="
ffmpeg -y -loglevel warning \
  -i "$OUT/trace.webm" \
  -c:v libx264 -preset slow -crf 18 -pix_fmt yuv420p -r 30 \
  -an "$OUT/trace.mp4"

echo
echo "=== Step 3: mux audio + video → maestro_demo.mp4 ==="
ffmpeg -y -loglevel warning \
  -i "$OUT/trace.mp4" -i "$OUT/master_audio.wav" \
  -map 0:v:0 -map 1:a:0 \
  -c:v copy -c:a aac -b:a 192k -ar 48000 \
  -shortest \
  "$OUT/maestro_demo.mp4"

echo
echo "=== Step 4: report ==="
ffprobe -v error -show_entries format=duration,size -show_entries stream=codec_name,width,height,r_frame_rate -of default=noprint_wrappers=1 "$OUT/maestro_demo.mp4"
echo
echo "✓ Final video: $OUT/maestro_demo.mp4"
