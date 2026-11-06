#!/usr/bin/env bash
# Regenerates the home screen app icons from public/icons/icon.svg (needs rsvg-convert).
# Run from the repo root: bash scripts/app-icons.sh
set -euo pipefail
cd public/icons
rsvg-convert -w 192 -h 192 icon.svg -o icon-192.png
rsvg-convert -w 512 -h 512 icon.svg -o icon-512.png
rsvg-convert -w 180 -h 180 icon.svg -o apple-touch-icon.png
ls -la *.png
