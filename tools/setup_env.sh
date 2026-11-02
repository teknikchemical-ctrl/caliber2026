#!/usr/bin/env bash
# One-time setup for a fresh cloud session or a new machine. Safe to run again.
#   bash tools/setup_env.sh
# Installs: Node packages and Playwright's Chromium (tests, screenshots, PDF), Python libraries (documents, spreadsheets, charts),
# and checks LibreOffice and poppler (PDF to text and images). Prints what is missing instead of failing half way.
set -u
cd "$(dirname "$0")/.."
say(){ printf '\n== %s\n' "$*"; }
say "Node packages"; (npm ci --no-audit --no-fund >/dev/null 2>&1 || npm install --no-audit --no-fund >/dev/null 2>&1) && echo ok || echo "npm install failed"
say "Chromium for Playwright"
if [ -x /opt/pw-browsers/chromium ]; then echo "found /opt/pw-browsers/chromium (set CHROMIUM=/opt/pw-browsers/chromium for the tests)"; else npx playwright install chromium >/dev/null 2>&1 && echo ok || echo "could not install Chromium"; fi
say "Python libraries"
PY=python3
$PY -c "import PIL" >/dev/null 2>&1 || $PY -m pip install -q --ignore-installed pillow >/dev/null 2>&1
$PY -m pip install -q openpyxl python-docx python-pptx matplotlib pypdf pyspellchecker >/dev/null 2>&1
if ! $PY -c "import openpyxl, PIL, docx, pptx, matplotlib, pypdf" >/dev/null 2>&1; then
  if python3.13 -c "import openpyxl, PIL, docx, pptx, matplotlib, pypdf" >/dev/null 2>&1; then echo "default python3 cannot import some libraries; use python3.13 for the spreadsheet, document and deck tools (build.py and the pack tools only need the standard library)";
  else echo "some Python libraries are missing: openpyxl python-docx python-pptx matplotlib pypdf pillow"; fi
else echo ok; fi
say "Other tools"
for t in soffice pdftotext pdftoppm node python3; do command -v $t >/dev/null 2>&1 && echo "  $t: yes" || echo "  $t: MISSING"; done
say "Build and test"
python3 build.py >/dev/null 2>&1 && echo "build ok" || echo "build FAILED, run: python3 build.py"
echo; echo "Next: read CLAUDE.md, then docs/NEW_CASE_RUNBOOK.md"
