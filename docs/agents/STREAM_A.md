# Role: Claude A, site features, data and AI

You build everything in the prototype except the 3D views, and you are the integrator: you merge Claude B's work and update `main`.

## Mission
1. Turn the hackathon case documents into `cases/<id>/` so the app shows the new plant with correct data.
2. Build the features the brief asks for and make the AI assistant answer correctly on this plant.
3. Keep `main` working: merge Claude B's branch regularly, run the tests, update `main`.

## You own (edit freely)
Everything except the files in Claude B's list: `cases/<id>/` (all of it except `geo/g3m.js`, `geo/p3.js`, `geo/h3.js`), all other `src/modules/*.js`, `src/data/`, `netlify/`, `tools/` (except `tools/g3bridge.js`), `tests/` (except `tests/stress3d.js`), `build.py`, `src/base.html`, `docs/`, the deck, finance and manual folders.

Codex owns `src/modules/fin.js`, `src/modules/style_fin.css`, `cases/<id>/fin.json`, `cases/<id>/eval_extra_fin.json`, `tests/fin_*.js`, `finance/`, `deck/`, `manual/`: never edit them.

## You must not edit
Claude B's files: `src/modules/g3d.js g3r.js g3neck.js plant3d.js hse3d.js sim3d.js auto3d.js style3d.css`, `cases/<id>/geo/g3m.js p3.js h3.js`, `tools/g3bridge.js`, `tests/stress3d.js`. If you need a change there, write it in `docs/TASKS.md` for B.

## First 30 minutes
1. Read `docs/CONTEXT.md`, `docs/CASE_PACKS.md`, `docs/CONTRACT.md`, `docs/TWO_CLAUDES.md`. Run the five setup commands in section 5 of the context file.
2. Write your branch name and Claude B's branch name at the top of `docs/TASKS.md`.
3. `tools/new_case.sh <id> "<Plant title>" <CODE>`, then `python3 tools/pack_split.py cases/<id>`.
4. The case documents are in `cases/<id>/source/`. Run `tools/pdf_pages.sh` on each PDF (output goes to `cases/_source/`, ignored by git).
5. Follow `docs/INTAKE_PROMPTS.md` steps 1 to 8, one file per set in `cases/<id>/plant/sets/`.

## Handoff duty
At every push update `docs/handoff/a.md` (done, in progress, next, gotchas, how to check, waiting on) and your rows in `docs/TASKS.md`. Do not write notes at the bottom of `docs/TASKS.md`. If the other Claude stops, follow `docs/TAKEOVER.md`. Run `tools/state.sh` at the start of work to see the other's state.

## Loop
Start and end of every piece of work: `tools/baseline_check.sh a` (same baseline as `main`, only your own files).

Write sets, `python3 tools/pack_build.py cases/<id>`, fix every ERROR and read every warning, `BUILD_OUT=/tmp/x python3 build.py <id>`, `node tests/smoke_case.js /tmp/x/index.html`, commit, push. Every 1 to 2 hours: merge Claude B's branch (`docs/TWO_CLAUDES.md`), run the tests, update `main`.

## Done when
Validator 0 errors, smoke test passes with at least 90% on the evaluation questions, every set has instruments, an interlock (or an honest "control loop") and at least one OPL, the brief's features work, and `main` is green and deployed.
