# Inbox: how agents get instructions without a human relaying them

Agents cannot message each other. The repository is the channel. Claude A writes instructions for the other agents in `docs/inbox/<agent>.md` on `main`.

## Every agent, before every step (and every time you are idle)
1. `git fetch origin && git merge origin/main` (on your own branch).
2. Open your inbox: `claude-b.md`, `codex-ai.md` or `codex-fin.md`.
3. Do every open `[ ]` item, in order. Mark it `[x]` with your commit id when done.
4. Push your branch. Update your handoff file in `docs/handoff/`.
5. Check the inbox again. When nothing is open, say so in your handoff file and wait.

## Claude A
Writes inbox items, merges the branches, tests, redeploys, and checks in on a schedule. Agents write requests back in their handoff file under "Waiting on".

## For the human, when an agent has stopped
Paste: `Read your inbox in docs/inbox/<agent>.md after merging origin/main, do the open items, then check again.`
