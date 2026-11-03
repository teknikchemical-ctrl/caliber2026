# Takeover: when one Claude stops (usage limit, crash, closed session)

Everything a Claude knows must live in git. A Claude that stops loses its chat but not its pushed work, its handoff note or the task board. Nothing is lost if each Claude pushes after every working step and keeps `docs/handoff/<a|b>.md` current. Uncommitted work in a cloud session is lost when the container resets, so commit and push often.

## Before it happens (both Claudes, all day)
1. Push after every working step.
2. Update your handoff file (`docs/handoff/a.md` or `b.md`) at every push: done, in progress, next, gotchas, how to check, waiting on.
3. Keep your rows in `docs/TASKS.md` current.
4. Each Claude can see the other's state at any time with `tools/state.sh` (branches, recent commits, changed files, handoff notes, task board).

## The human: watch the usage meter
Check each Claude's usage a few times a day. At about 80% used, paste this into that Claude:

> Your usage limit is nearly reached. Stop starting new work. Commit and push everything now. Update your handoff file with exactly where you stopped and what to do next. Reply with the commit hash when the push is done.

If a Claude already stopped without warning, its last push and its handoff file are all that remain. Start the takeover below anyway.

## Takeover procedure (the Claude that is still working)
The human pastes this to the working Claude (replace the role letters):

> Claude <B> has stopped. You take over its work as well as your own until I say otherwise. Run `git fetch origin && tools/state.sh`. Read `docs/handoff/<b>.md`, its branch's recent commits and `docs/TASKS.md`. Merge its branch (`git merge origin/<its branch>`), build, run the tests, and continue its unfinished tasks in the order in its handoff file. Use `tools/baseline_check.sh any` because you may now edit its files. Write in `docs/TASKS.md` that you own its files, and keep your own handoff file current. Tell me what you found and what you will do first.

What the taking-over Claude does:
1. `git fetch origin`, then `tools/state.sh`.
2. Read the stopped Claude's handoff file and the commits after its last merge to `main`.
3. Merge its branch into your own and run `python3 build.py`, `npm run test:quick`, and the smoke test.
4. Take over its files: add a line to `docs/TASKS.md`, "Claude A owns the 3D files until further notice", or the reverse.
5. Continue from its "Next, in order" list. Do not redo finished work: read its commits first.
6. When the other Claude is back, write the state in your handoff file and hand ownership back in `docs/TASKS.md`.

## If Claude A (the integrator) stops
Claude B becomes integrator: it merges `main` into its branch, merges A's branch, runs the tests, and pushes to `main` (the only time B may push to `main`; write it in `docs/TASKS.md` first). B then owns the case data and the assistant as well.

## Other ways to recover
- **Fresh session, same role:** open a new session on the repository, give it `docs/start/<a|b>.md` and then say "you are continuing the role of Claude <A|B>; read `docs/handoff/<a|b>.md` and run `tools/state.sh`".
- **Spare account, or Codex:** same procedure: start file, handoff file, state script.
- **Limits reset:** the stopped Claude can resume later. It runs `tools/state.sh` and `git merge origin/main` first, then reads what the other Claude changed in its files.
