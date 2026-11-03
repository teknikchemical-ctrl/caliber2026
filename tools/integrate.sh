#!/usr/bin/env bash
# Integrator helper.
#   tools/integrate.sh --report                         files changed by each agent branch since the base, and overlaps
#   tools/integrate.sh a/topic b/topic codex/topic       merge the branches into the integration branch, build and test
# Environment: INTEGRATION (default integration), BASE (default origin/main), CASES (default "lldpe mock-cdu" plus $CASE)
set -uo pipefail
cd "$(dirname "$0")/.."
INT="${INTEGRATION:-integration}"; BASE="${BASE:-origin/main}"
export CHROMIUM="${CHROMIUM:-/opt/pw-browsers/chromium}"
git fetch -q origin 2>/dev/null || echo "(fetch failed, using local refs)"
ref(){ git rev-parse --verify -q "origin/$1" >/dev/null && echo "origin/$1" || echo "$1"; }

if [ "${1:-}" = "--report" ]; then
  branches=$(git for-each-ref --format='%(refname:short)' refs/remotes/origin | sed 's#^origin/##' | grep -E '^(a|b|codex|claude)/' || true)
  [ -z "$branches" ] && { echo "no agent branches (a/*, b/*, codex/*, claude/*) found"; exit 0; }
  tmp=$(mktemp); : > "$tmp"
  for b in $branches; do
    base=$(git merge-base "$(ref $INT)" "$(ref $b)" 2>/dev/null || git merge-base "$BASE" "$(ref $b)")
    files=$(git diff --name-only "$base" "$(ref $b)")
    ahead=$(git rev-list --count "$(ref $INT)..$(ref $b)" 2>/dev/null || echo "?")
    echo "== $b: $ahead commits not in $INT, $(echo "$files" | grep -c .) files, last: $(git log -1 --format='%cr, %s' "$(ref $b)")"
    echo "$files" | sed "s#^#$b #" >> "$tmp"
  done
  echo; echo "== files changed on more than one agent branch (conflict risk)"
  awk '{f[$2]=f[$2]" "$1; n[$2]++} END{for(k in f) if(n[k]>1) print k":"f[k]}' "$tmp" | sort | grep . || echo "none"
  echo; echo "== shared hot files touched by a non-integrator branch"
  grep -E ' (build\.py|src/base\.html|tests/regress\.js|tests/smoke_case\.js|docs/CONTRACT\.md)$' "$tmp" || echo "none"
  rm -f "$tmp"; exit 0
fi

[ $# -eq 0 ] && { sed -n 2,6p "$0"; exit 1; }
[ -n "$(git status --porcelain)" ] && { echo "working tree not clean: commit or stash first"; exit 1; }
if git rev-parse --verify -q "$INT" >/dev/null; then git checkout -q "$INT"; git merge -q --ff-only "$(ref $INT)" 2>/dev/null || true
else git checkout -q -b "$INT" "$BASE" || { echo "cannot create $INT from $BASE"; exit 1; }; fi
merged=(); failed=()
for b in "$@"; do
  echo "== merging $b"
  if git merge --no-ff -q -m "Merge $b into $INT" "$(ref $b)"; then merged+=("$b")
  else echo "CONFLICT in:"; git diff --name-only --diff-filter=U | sed 's/^/   /'; git merge --abort; failed+=("$b"); fi
done
echo; echo "== build and tests"
rc=0
python3 build.py >/dev/null 2>&1 || { echo "BUILD FAILED"; rc=1; }
if [ $rc -eq 0 ]; then
  npm run -s test:quick 2>&1 | grep -E "FAIL|failed|passed|All checks" | head -5 || true
  for c in ${CASES:-lldpe mock-cdu} ${CASE:-}; do
    [ -d "cases/$c" ] || continue
    python3 tools/pack_validate.py "$c" | tail -1
    BUILD_OUT="/tmp/int-$c" python3 build.py "$c" >/dev/null 2>&1 && node tests/smoke_case.js "/tmp/int-$c/index.html" 2>&1 | grep -E "^FAIL|All smoke|FAILED" || echo "smoke test could not run for $c"
  done
fi
echo; echo "merged: ${merged[*]:-none}"; echo "conflicts: ${failed[*]:-none}"
echo "next: fix what failed, then  git push origin $INT   and note the result in docs/TASKS.md"
[ ${#failed[@]} -eq 0 ] && [ $rc -eq 0 ]
