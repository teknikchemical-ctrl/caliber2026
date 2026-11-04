#!/usr/bin/env bash
# Run before starting work, before every push, and before merging. Tells you whether you are on the same baseline as main and
# whether you touched files that belong to another agent.
#   tools/baseline_check.sh a       Claude A: features, data, AI, integrator (everything except B's and Codex's files)
#   tools/baseline_check.sh b       Claude B: 3D UI
#   tools/baseline_check.sh codex   Codex: costing page, finance model, deck, manual
#   tools/baseline_check.sh ai      Codex on the AI assistant only (netlify functions, ai.js, sync.js, live test)
#   tools/baseline_check.sh any     takeover mode: no ownership check, see docs/TAKEOVER.md
set -uo pipefail
cd "$(dirname "$0")/.."
role="${1:?role: a, b, codex or any}"
git fetch -q origin 2>/dev/null || echo "(could not fetch: results may be out of date)"
B3D='^(src/modules/(g3d|g3r|g3neck|plant3d|hse3d|sim3d|auto3d)\.js|src/modules/style3d\.css|cases/[^/]+/geo/(g3m|p3|h3)\.js|tools/g3[a-z]*\.js|tests/stress3d\.js|cases/spi/geo/.*|src/modules/spi_(draw|zone|overlay|reco|health|opt|scn)[a-z0-9_]*\.js|tests/spi_ui_b[a-z0-9_]*\.js|docs/spi/DRAWINGS_BRIEF\.md|docs/spi/shots/b[^/]*/.*|server/ws/.*|docs/spi/WS_TOOLS\.md)$'
CODEX='^((deck|finance|manual)/.*|src/modules/(fin\.js|style_fin\.css)|cases/[^/]+/(fin|eval_extra_fin)\.json|docs/handoff/codex\.md|tests/fin_[a-z0-9_]+\.js|tools/record_demo\.js|spi/engine/.*|server/engine/.*|src/modules/spi_impact\.js|docs/spi/shots/.*|tests/spi_ui_fin[a-z0-9_]*\.js|tests/spi_engine[a-z0-9_]*\.js|docs/spi/(FORECASTING|BUSINESS_CASE)\.md)$'
AIF='^(netlify/functions/[a-z_0-9]+\.mjs|src/modules/(ai|ai2|sync|intent|facts)\.js|tests/live\.js|docs/(AI_ASSISTANT|AI_PROVIDER_CONTRACT|BACKEND_API)\.md|docs/handoff/codex-ai\.md|spi/ai/.*|server/ai/.*|src/modules/spi_(forecast|ask)\.js|tests/spi_ui_ai[a-z0-9_]*\.js|tests/spi_ai[a-z0-9_]*\.js|docs/spi/AI_REASONING\.md)$'
base=$(git merge-base HEAD origin/main)
behind=$(git rev-list --count HEAD..origin/main); ahead=$(git rev-list --count origin/main..HEAD)
echo "branch:        $(git rev-parse --abbrev-ref HEAD) at $(git rev-parse --short HEAD)"
echo "main:          $(git rev-parse --short origin/main)  ($(git log -1 --format=%s origin/main | cut -c1-60))"
echo "common base:   $(git rev-parse --short "$base")"
echo "you are $ahead commit(s) ahead of main and $behind behind it"
[ "$behind" -gt 0 ] && echo "ACTION: git merge origin/main   (main has $behind commit(s) you do not have)"
[ -n "$(git status --porcelain)" ] && echo "note: uncommitted changes in your working copy"
files=$( (git diff --name-only "$base" HEAD; git diff --name-only HEAD; git ls-files --others --exclude-standard) | sort -u)
bad=""
while IFS= read -r f; do [ -z "$f" ] && continue
  case "$f" in docs/inbox/*|docs/TASKS.md|docs/handoff/*) continue;; esac
  isb=0; isx=0; isa=0; echo "$f" | grep -Eq "$AIF" && isa=1; echo "$f" | grep -Eq "$B3D" && isb=1; echo "$f" | grep -Eq "$CODEX" && isx=1
  case "$role" in
    any) ;;
    a)     [ $isb -eq 1 ] || [ $isx -eq 1 ] || [ $isa -eq 1 ] && bad="$bad\n  $f" ;;
    b)     [ $isb -eq 1 ] || bad="$bad\n  $f" ;;
    codex) [ $isx -eq 1 ] || bad="$bad\n  $f" ;;
    ai)    [ $isa -eq 1 ] || bad="$bad\n  $f" ;;
  esac
done <<< "$files"
if [ -n "$bad" ]; then
  case "$role" in a) echo "PROBLEM: you changed files that belong to Claude B or Codex:";; b) echo "PROBLEM: you changed files that are not Claude B's:";; codex) echo "PROBLEM: you changed files that are not Codex's:";; esac
  printf "$bad\n"; echo "Put the request in your handoff file (Waiting on), or write 'taking <file>' in docs/TASKS.md first."; exit 1
fi
echo "ownership: OK (no files outside your list)"
[ "$behind" -gt 0 ] && exit 2 || exit 0
