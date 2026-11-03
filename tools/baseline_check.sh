#!/usr/bin/env bash
# Run before starting work, before every push, and before merging. Tells you whether you are on the same baseline as main and
# whether you touched files that belong to the other Claude.
#   tools/baseline_check.sh a     (Claude A: features, data, AI, integrator)
#   tools/baseline_check.sh b     (Claude B: 3D UI)
#   tools/baseline_check.sh any   (takeover mode: no ownership check, see docs/TAKEOVER.md)
set -uo pipefail
cd "$(dirname "$0")/.."
role="${1:?role: a, b or any}"
git fetch -q origin 2>/dev/null || echo "(could not fetch: results may be out of date)"
B3D='^(src/modules/(g3d|g3r|g3neck|plant3d|hse3d|sim3d|auto3d)\.js|src/modules/style3d\.css|cases/[^/]+/geo/(g3m|p3|h3)\.js|tools/g3bridge\.js|tests/stress3d\.js)$'
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
  if [ "$role" = "any" ]; then :; elif [ "$role" = "b" ]; then echo "$f" | grep -Eq "$B3D" || bad="$bad\n  $f"
  else echo "$f" | grep -Eq "$B3D" && bad="$bad\n  $f"; fi
done <<< "$files"
if [ -n "$bad" ]; then
  case "$role" in b) echo "PROBLEM: you changed files that are not Claude B's:";; codex) echo "PROBLEM: you changed files that are not Codex's:";; *) echo "PROBLEM: you changed Claude B's files:";; esac
  printf "$bad\n"; echo "Move the request to docs/TASKS.md, or write 'taking <file>' there first."; exit 1
fi
echo "ownership: OK (no files outside your list)"
[ "$behind" -gt 0 ] && exit 2 || exit 0
