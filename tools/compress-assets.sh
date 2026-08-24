#!/bin/sh
# art-production/p0 验收原图 → assets-gen webp（cwebp: 立绘含 alpha q82，场景 q80，封面 q84）
set -e
cd "$(dirname "$0")/.."
for p in dialogue choice execution recovery clear; do
  cwebp -q 82 -m 6 -alpha_q 90 "art-production/p0/tianming-$p-master.png" -o "assets-gen/pose-$p.webp"
done
cwebp -q 80 -m 6 art-production/p0/blackwind-dialogue-base.png -o assets-gen/bg-dialogue.webp
cwebp -q 80 -m 6 art-production/p0/blackwind-execution-base.png -o assets-gen/bg-execution.webp
cwebp -q 84 -m 6 art-production/p0/cover-tianming.png -o assets-gen/cover.webp
ls -la assets-gen/*.webp
