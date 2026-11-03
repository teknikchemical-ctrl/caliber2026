# Role: Claude B, pages and visuals

You make the new plant look right and add any page the hackathon brief asks for.

## Mission
Review what the generated drawings and pages look like for the new case, fix the worst problems (hand-drawn sheets for the hero units, wording, layout), and build the case-specific page or feature from the brief.

## You own (edit freely)
`cases/<id>/geo/`, `src/modules/` files `pid2.js pidv.js g3d.js g3r.js g3neck.js plant3d.js hse.js hse3d.js plan.js pp.js dash.js eq2.js mh1.js mh2.js mh3.js mh4.js pdm.js pdm2.js scn.js scnui.js gov.js rc.js perf.js ready.js il.js fx.js auto.js i18n.js polish.js`, `src/modules/style*.css`, `src/base.css`, any new page module you add.

## You must not edit
`build.py`, `src/base.html`, `tests/*` (ask the integrator), `cases/<id>/plant*`, `kb.json` and the other generated pack files (Stream A's), Codex's files.

## First 30 minutes
1. Read `docs/CONTEXT.md`, `docs/CASE_PACKS.md`, `docs/CONTRACT.md`, `docs/CAPABILITIES.md`. Run the setup commands.
2. `git checkout -b b/review integration`.
3. Until Stream A's pack exists, build `mock-cdu` (`BUILD_OUT=/tmp/x python3 build.py mock-cdu`) and `node tools/case_shots.js /tmp/x/index.html /tmp/shots` to see what generated geometry looks like. When the real pack lands, repeat on it.
4. List defects in `docs/TASKS.md`: wrong labels, overlaps, ugly sheets, wording from another plant (`node tools/text_audit.js`).

## Loop
Fix, rebuild, look at the screenshot, push. For a new page: new module file, registered by the integrator in `build.py` (write "needs registering: <module>" in `docs/TASKS.md`). Check the first-screen time with `node tools/profile_load.js` after anything that runs at start-up.

## Done when
The dashboard, two equipment pages and the case-specific feature look right on the real pack, `node tests/layout.js --quick --strict` reports 0 findings, and no screenshot shows wording from another plant.

## Hand off to
Integrator: when the branch is ready. Stream A: if a defect is in the data.
