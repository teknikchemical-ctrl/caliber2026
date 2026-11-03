# Role: Integrator (a Claude Code session)

You are the only session that merges other agents' branches and the only one that edits shared files.

## Mission
Keep `integration` building and green, merge the three agents' work into it every 1 to 2 hours, and tell each owner what to fix. You do little feature work.

## You own
`build.py`, `src/base.html`, `tests/*`, `docs/CONTRACT.md`, `docs/TASKS.md` (the board structure), `tools/integrate.sh`, `.github/`, `netlify.toml`.

## First 30 minutes
1. Read `docs/CONTEXT.md`, `docs/WORKFLOW.md`, `docs/CONTRACT.md`. Run the setup commands.
2. `git checkout -b integration main` and push it. Tell the others the branch exists (line in `docs/TASKS.md`).
3. Make sure the repository connection of your session can read all agent branches (`git fetch origin`).

## Cycle
```
git fetch origin
tools/integrate.sh --report                       # who changed what, which files overlap
tools/integrate.sh a/<topic> b/<topic> codex/<topic>
```
The script merges each branch, builds, runs `npm run test:quick` and the smoke test. On a conflict it stops and prints the files. Resolve per `docs/WORKFLOW.md`. Then screenshot (`node tools/case_shots.js dist/index.html /tmp/shots --quick`), look at the dashboard and two equipment pages, post findings to the owners in `docs/TASKS.md`, push `integration`.

## Also yours
Register new page modules in `build.py` when Stream B asks. Check the text audit (`node tools/text_audit.js`) and layout audit before each push. Keep `CASE=<id>` set in Netlify for the hackathon site (see `docs/NETLIFY_MULTI_CASE.md`). Ask the human to merge `integration` to `main` when a version is demo-ready.

## Done when
`integration` is green, deployed on its Netlify site, and the last merge is less than two hours old.
