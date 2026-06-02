#!/usr/bin/env bash
#
# Pack ready-made frames (already sitting in ./frames/) into webp sprite sheets.
# Use this when you have a ready-made PNG frame sequence.
#
# Pipeline:  ./frames/*.png → packed PNG sheets (spright) → webp sheets (ffmpeg)
#            → copied into src/lib/assets/hero-animation/
#
# Usage:   ./pack-frames.sh            # 4x4 grid, webp quality 75
#          ./pack-frames.sh [columns] [rows] [quality]
#
# The frame size is auto-detected from the first frame and a matching spright
# grid is generated, so frames of any (uniform) size just work.
#
# Requires: ffmpeg in PATH and the bundled ./spright binary.
set -euo pipefail
cd "$(dirname "$0")"

COLUMNS="${1:-4}"
ROWS="${2:-4}"
QUALITY="${3:-75}"
ASSET_DIR="../../../assets/hero-animation"   # → src/lib/assets/hero-animation

shopt -s nullglob
FRAMES=(./frames/*.png)
if [ ${#FRAMES[@]} -eq 0 ]; then
  echo "✗ No PNG frames in ./frames/"
  echo "  Put your numbered frames there first, e.g. frame-0001.png, frame-0002.png …"
  echo "  (zero-pad the numbers so they sort in the right order!)"
  exit 1
fi
FRAME_COUNT=${#FRAMES[@]}

# Auto-detect frame size from the first frame (one value per call, then strip
# any stray whitespace — robust against odd ffprobe output).
probe_dim() {
  ffprobe -v error -select_streams v:0 -show_entries "stream=$1" \
    -of default=noprint_wrappers=1:nokey=1 "$2" | tr -dc '0-9'
}
FW=$(probe_dim width "${FRAMES[0]}")
FH=$(probe_dim height "${FRAMES[0]}")
if [ -z "$FW" ] || [ -z "$FH" ]; then
  echo "✗ Could not read the frame size from ${FRAMES[0]} (is it a valid image?)"
  exit 1
fi
echo "▶ ${FRAME_COUNT} frames, ${FW}x${FH}px each → ${COLUMNS}x${ROWS} grid ($((COLUMNS * ROWS)) frames/sheet)"

MAX_W=$((COLUMNS * FW))
MAX_H=$((ROWS * FH))
# libwebp can't encode dimensions over 16383px.
if [ "$MAX_W" -gt 16383 ] || [ "$MAX_H" -gt 16383 ]; then
  echo "✗ A ${COLUMNS}x${ROWS} sheet of these frames would be ${MAX_W}x${MAX_H}px,"
  echo "  but webp's limit is 16383px. Use a smaller grid (e.g. ./pack-frames.sh 2 2)"
  echo "  or downscale your frames first."
  exit 1
fi

mkdir -p ./spritesheet ./webp "$ASSET_DIR"
rm -f ./spritesheet/*.png ./webp/*.webp

# Generate a spright config whose limits match the detected frame size,
# so the sheets come out as an exact COLUMNS x ROWS grid.
cat > ./frames.conf <<EOF
max-width ${MAX_W}
max-height ${MAX_H}
padding 0
trim none
pack rows
output "./spritesheet/spritesheet-{0-}.png"
glob "./frames/*.png"
EOF

echo "▶ Packing sprite sheets with spright"
./spright -i ./frames.conf

echo "▶ Converting sheets to webp (quality ${QUALITY})"
for png in ./spritesheet/spritesheet-*.png; do
  name=$(basename "${png%.png}")
  ffmpeg -hide_banner -loglevel error -y -i "$png" \
    -c:v libwebp -quality "$QUALITY" "./webp/${name}.webp"
done

echo "▶ Copying webp sheets into $ASSET_DIR"
rm -f "$ASSET_DIR"/spritesheet-*.webp
cp ./webp/spritesheet-*.webp "$ASSET_DIR/"

SHEETS=$(find ./webp -name '*.webp' | wc -l | tr -d ' ')
echo
echo "✅ Done: ${SHEETS} sheet(s), ${FRAME_COUNT} frames."
echo "   Set this in HeroSection.svelte:"
echo "      <ScrollSpriteAnimation frameCount={${FRAME_COUNT}} columns={${COLUMNS}} rows={${ROWS}} … />"
