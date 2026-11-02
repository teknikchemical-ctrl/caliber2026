#!/usr/bin/env bash
# Split case PDFs into per-page text and images so they can be read quickly.
#   tools/pdf_pages.sh <pdf> [out-dir]      -> out-dir/p001.txt, p001.png ... and out-dir/INDEX.txt (characters per page)
# Pages with almost no text are scanned drawings: read the PNG instead (no OCR is installed here).
set -euo pipefail
pdf="$1"; out="${2:-cases/_source/$(basename "${pdf%.*}")}"; mkdir -p "$out"
n=$(pdfinfo "$pdf" | awk '/^Pages:/{print $2}')
: > "$out/INDEX.txt"
for i in $(seq 1 "$n"); do
  f=$(printf "%03d" "$i")
  pdftotext -layout -f "$i" -l "$i" "$pdf" "$out/p$f.txt" 2>/dev/null || true
  echo "p$f $(wc -c < "$out/p$f.txt") chars" >> "$out/INDEX.txt"
done
pdftoppm -r 70 -png "$pdf" "$out/p" 2>/dev/null || true
echo "$n pages in $out (see INDEX.txt)"
