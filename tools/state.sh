#!/usr/bin/env bash
# Snapshot of the whole project state, built from git, so a Claude that has just joined or taken over can catch up in one read.
#   tools/state.sh            prints to the screen
# Reads: branches, recent commits per branch, files each branch changed, the task board, both handoff notes.
set -uo pipefail
cd "$(dirname "$0")/.."
git fetch -q origin 2>/dev/null || echo "(could not fetch: out of date)"
echo "# Project state $(date -u '+%Y-%m-%d %H:%M UTC')"
echo; echo "## main"; git log -5 --format='%h %cr  %s' origin/main
for b in $(git for-each-ref --format='%(refname:short)' refs/remotes/origin | sed 's#^origin/##' | grep -E '^(claude|a|b|codex)/'); do
  echo; echo "## branch $b"
  echo "ahead of main: $(git rev-list --count origin/main..origin/$b), behind main: $(git rev-list --count origin/$b..origin/main), last push: $(git log -1 --format=%cr origin/$b)"
  git log -8 --format='%h %cr  %s' origin/main..origin/$b
  echo "files changed vs main:"; git diff --name-only origin/main...origin/$b | sed 's/^/   /' | head -40
  for r in a b; do git cat-file -e origin/$b:docs/handoff/$r.md 2>/dev/null && ! git diff --quiet origin/main origin/$b -- docs/handoff/$r.md 2>/dev/null && { echo "handoff note docs/handoff/$r.md on this branch:"; git show origin/$b:docs/handoff/$r.md | sed 's/^/   | /'; }; done
done
echo; echo "## task board (origin/main)"; git show origin/main:docs/TASKS.md
echo; echo "## handoff notes on main"; for r in a b; do echo "--- docs/handoff/$r.md"; git show origin/main:docs/handoff/$r.md 2>/dev/null; done
