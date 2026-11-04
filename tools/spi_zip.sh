#!/usr/bin/env bash
# Builds the submission zip: complete source code and the SQLite databases (owner: Claude A). Output: submission/SPI_source_and_database.zip
# Usage: tools/spi_zip.sh [vercel-url]     Excludes node_modules, generated builds, old-case PDFs and secrets. Never include keys: they live only in Vercel environment variables.
set -euo pipefail; cd "$(dirname "$0")/.."
URL="${1:-<Vercel URL of the latest deployment>}"
OUT=submission; rm -rf "$OUT"; mkdir -p "$OUT/pkg"
git ls-files | grep -vE '^(node_modules/|dist/|netlify-drop/|AKP-netlify-drop\.zip|knowledge-hub-integrated_BAP5\.html|MERGEDOPL/|deck/video/|manual/|deck/manual/|pyspellchecker.*\.whl$|.*\.docx$|.*\.pptx$|Maintenance History .*\.xlsx$)' | grep -v -E '^(P&ID MErged|plotplanmerged|interlocklogic merged|equipmentdatasheet merged|EquipmentDrawingMerged)' > "$OUT/files.txt" || true
grep -E '^spi/data/raw/.*\.pdf$|^docs/spi/source/.*\.pdf$' <(git ls-files) >> "$OUT/files.txt" || true
ls spi/db/*.sqlite spi/fixtures/*.sqlite 2>/dev/null >> "$OUT/files.txt"
sort -u "$OUT/files.txt" | while IFS= read -r f; do [ -f "$f" ] && mkdir -p "$OUT/pkg/$(dirname "$f")" && cp "$f" "$OUT/pkg/$f"; done
cat > "$OUT/pkg/README_SUBMISSION.md" <<EOT
# Spare Part Intelligence and Inventory Optimization (CALIBER 2026 final case)

Deployed prototype (Vercel): $URL

## What is inside
- \`spi/db/spi.sqlite\`: the SQLite database built from the six baseline files (schema in \`spi/db/schema.sql\`). \`spi/db/results.sqlite\`: forecast and recommendation results (schema in \`spi/db/schema_results.sql\`).
- \`spi/etl\`: the import (python3.13, pandas, openpyxl). \`spi/engine\`: forecasting and optimisation (JavaScript). \`spi/ai\`: the AI reasoning layer. \`api\`: the server functions (Vercel). \`src\`: the application pages.
- \`docs/spi\`: brief analysis, data findings, architecture, AI reasoning design, forecasting methods, standards applied.

## Run it locally
1. Install Node 22 and Python 3. Run \`npm install\`.
2. \`python3 build.py spi\` builds the page into \`dist/\`.
3. \`node tools/spi_dev.mjs 8765 full\` and open http://localhost:8765 (uses spi/db/spi.sqlite).
4. AI: set \`AI_PROVIDER=gemini\`, \`AI_API_KEY=<your key>\` and \`AI_MODEL\` as environment variables. Without them the application runs with the rules based planner (\`AI_PROVIDER=mock\`).

## Rebuild the database from the raw files
\`spi/etl/run_all.sh\` (needs python3.13 with pandas and openpyxl). Raw files are in \`spi/data/raw\`.
All data in the baseline set is synthetic. Monetary values are IDR and Estimates.
EOT
(cd "$OUT/pkg" && zip -qr ../SPI_source_and_database.zip .)
echo "wrote $OUT/SPI_source_and_database.zip ($(du -h $OUT/SPI_source_and_database.zip | cut -f1), $(unzip -l $OUT/SPI_source_and_database.zip | tail -1 | awk '{print $2}') files)"
unzip -l "$OUT/SPI_source_and_database.zip" | grep -E 'sqlite|README_SUBMISSION' | head
