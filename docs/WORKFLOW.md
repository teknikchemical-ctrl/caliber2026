> With two Claude sessions (the usual case) use the simpler routine in `docs/TWO_CLAUDES.md`: `main` is the shared version and only Claude A writes to it. The longer scheme below is for three or more agents.

# Workflow for several agents on one repository

```
main             protected. Only the human merges to it, when a demo-ready version exists
 └─ integration  where all work meets and is tested together
     ├─ a/<topic>      Claude A (data and intelligence)
     ├─ b/<topic>      Claude B (pages and visuals)
     └─ codex/<topic>  Codex (deliverables, tests, docs)
```

## Rules
1. Each agent works on its own branches, named with its prefix, branched from `integration`.
2. Merge into `integration` every 1 to 2 hours, or whenever a piece works, never with red tests. Use merge commits, not rebase. Never rewrite pushed history.
3. The **integrator** (one session) does the merging with `tools/integrate.sh` and is the only one who resolves conflicts in shared files. It does little feature work.
4. Before starting a piece of work, pull `integration` and read `docs/TASKS.md`. Before pushing, pull again.
5. Two agents never edit the same file. Ownership is in the role files. If a task needs a file you do not own, write the request in `docs/TASKS.md` for its owner.
6. The human merges `integration` to `main`.

## Integration cycle (the integrator runs this)
```
tools/integrate.sh --report            # what each branch changed, and which files overlap
tools/integrate.sh a/topic b/topic codex/topic    # merge, build, test; stops and reports on a conflict
```
Then: read the report, screenshot the dashboard and two equipment pages (`node tools/case_shots.js dist/index.html /tmp/shots --quick`), tell the owners in `docs/TASKS.md` what to fix, and push `integration`.

## Message board
`docs/TASKS.md` is the only channel between sessions. Sessions cannot see each other's chat. One line per task: id, owner, status (`todo`, `doing`, `blocked`, `done`), files, and a note.

## When a merge conflicts
- In a file one agent owns: that agent's version wins; re-apply the other change by hand if it is still needed.
- In a shared hot file: the integrator merges both by hand, runs the tests, and notes it in `docs/TASKS.md`.
- Never resolve by deleting the other agent's work.
