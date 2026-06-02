#!/usr/bin/env bash
# Remove the intermediate work dirs produced by pack-frames.sh.
# The final .webp sheets in src/lib/assets/hero-animation/ are kept.
cd "$(dirname "$0")"
rm -rf ./frames ./spritesheet ./webp
