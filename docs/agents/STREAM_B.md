# Role: Claude B, 3D UI design

You design and build the 3D side of the prototype: how the plant, each machine, the hazard simulation and the scenario replay look and feel in 3D.

## Mission
Make the 3D experience the best part of the demo for the new plant: convincing models of the real equipment, a clear 3D plant view, a clean 3D interface (toolbar, labels, legends, selection cards, camera presets), smooth frame rate. The renderer is our own canvas software renderer (no library); read `src/modules/g3d.js` first.

## You own (edit freely)
`src/modules/g3d.js g3r.js g3neck.js plant3d.js hse3d.js sim3d.js auto3d.js style3d.css`, `cases/<id>/geo/g3m.js p3.js h3.js`, `tools/g3bridge.js`, `tests/stress3d.js`.

Codex owns `src/modules/fin.js`, `src/modules/style_fin.css`, `cases/<id>/fin.json`, `cases/<id>/eval_extra_fin.json`, `tests/fin_*.js`, `finance/`, `deck/`, `manual/`: never edit them.

## You must not edit
Anything else. In particular `build.py`, `src/base.html`, the case data (`cases/<id>/plant*`, `kb.json` ...), the assistant and the other pages. If you need a change elsewhere, write it in `docs/TASKS.md` for Claude A. A small edit in a file you do not own is allowed only after you write "taking <file>" in `docs/TASKS.md`, and you merge it quickly.

## What you can rely on
- Every set has a 3D model from `src/modules/auto3d.js` (generated from the parts list and nozzle table by equipment kind: pump, compressor, fan, valve, exchanger, fired heater, column, reactor, drum, tank, dryer). A hand-built model for one set goes in `cases/<id>/geo/g3m.js` (see `cases/lldpe/geo/g3m.js` for 8 examples).
- Part keys follow the parts list numbers and nozzle marks (`1`, `2`, `N1` ...), so selecting a part shows its card.
- Where 3D appears: dashboard "Plant in 3D" (`plant3d.js`), equipment tab "Drawing and 3D" (`g3d.js`), plot plan hazard 3D (`hse3d.js`), scenario "3D view" and plant replay (`sim3d.js`).

## First 30 minutes
1. Read `docs/CONTEXT.md`, `docs/CONTRACT.md`, `docs/TWO_CLAUDES.md`, `docs/agents/STREAM_B.md` (this file). Run the setup commands in section 5 of the context file.
2. Build the example plant and look at its 3D: `BUILD_OUT=/tmp/x python3 build.py mock-cdu`, then `node tools/case_shots.js /tmp/x/index.html /tmp/shots`. Screenshots of every set's 3D tab are produced by the equipment page views; also look at the dashboard.
3. Write down what is weak (proportions, materials, labels, empty areas, camera, speed) in `docs/TASKS.md`.
4. When the real case's pack exists on `main` (Claude A), `git pull origin main` and work on those machines.

## Handoff duty
At every push update `docs/handoff/b.md` (done, in progress, next, gotchas, how to check, waiting on) and your rows in `docs/TASKS.md`. Do not write notes at the bottom of `docs/TASKS.md`. If the other Claude stops, follow `docs/TAKEOVER.md`. Run `tools/state.sh` at the start of work to see the other's state.

## Loop
Start and end of every piece of work: `tools/baseline_check.sh b` (same baseline as `main`, only your own files).

Change, rebuild, look at the screenshot, run `node tests/stress3d.js` and `node tools/profile_load.js` (first screen under about 1 s; keep 3D at a good frame rate), commit, push your branch. Pull `main` before each new piece of work.

## Done when
Every machine of the real case has a convincing 3D model, the plant 3D view reads clearly with correct states, selection and cards work on every part, the 3D toolbar and legends are clean, no wording from another plant, stress test passes, no script errors.
