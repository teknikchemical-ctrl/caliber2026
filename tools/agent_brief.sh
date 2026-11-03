#!/usr/bin/env bash
# Make one paste-able briefing for a blank Claude Code or Codex session.
#   tools/agent_brief.sh <a|b|codex|integrator> [case-id]      writes docs/briefs/<role>.md and prints its path
# Give the file to the agent as its first message ("read this file and follow it"), or paste its contents.
set -euo pipefail
cd "$(dirname "$0")/.."
r="${1:?role: a, b, codex or integrator}"; case_id="${2:-<case-id>}"
case "$r" in a) f=STREAM_A;; b) f=STREAM_B;; codex) f=CODEX;; integrator) f=INTEGRATOR;; *) echo "unknown role"; exit 1;; esac
mkdir -p docs/briefs; out="docs/briefs/$r.md"
{
 echo "# Your briefing ($r)"; echo
 echo "You are one of several AI agents building a web app prototype together with a human team, under time pressure. Read all of this before doing anything. Replace <id> and <case-id> below with: $case_id"; echo
 echo "---"; echo; cat docs/CONTEXT.md; echo; echo "---"; echo; cat docs/WORKFLOW.md; echo; echo "---"; echo; cat "docs/agents/$f.md"; echo; echo "---"; echo
 echo "# Text and output rules (from CLAUDE.md)"; sed -n '/^## Rules for text and output/,/^## Performance budget/p' CLAUDE.md | sed '$d'
 echo "# Current task board"; cat docs/TASKS.md
} | sed "s#<case-id>#$case_id#g" > "$out"
echo "$out ($(wc -w < "$out") words)"
