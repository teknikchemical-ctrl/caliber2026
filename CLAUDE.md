# Project guide for Claude sessions

Single-file web app (Asset Knowledge Platform) built from `src/` and a **case pack** in `cases/<id>/` by `python3 build.py [case-id]`. Generated files (`dist/`, `knowledge-hub-integrated_BAP5.html`, the zip) are never committed: Netlify and CI build them.

## First minutes in a new session
1. `bash tools/setup_env.sh` (installs and checks everything; prints what is missing). If `python3` cannot import openpyxl, pillow or pptx, use `python3.13` for those tools.
2. `export CHROMIUM=/opt/pw-browsers/chromium` before running any test or screenshot script.
3. Read `docs/CASE_PACKS.md` (what a case is), `docs/CONTRACT.md` (how the parts connect) and, for a hackathon, `docs/NEW_CASE_RUNBOOK.md`.

## Commands
| Task | Command |
|---|---|
| Build the default case | `python3 build.py` |
| Build another case | `python3 build.py <id>` (add `BUILD_OUT=/tmp/x` to leave `dist/` alone) |
| Fast tests | `npm run test:quick` (build, static, regression) |
| Full tests | `npm test` (adds 3D stress, live two-user test against a fake AI) |
| Any-case smoke test | `node tests/smoke_case.js dist/index.html` |
| Layout audit | `node tests/layout.js --quick --strict` |
| Screenshots of every page | `node tools/case_shots.js dist/index.html /tmp/shots [--quick]` |
| Check a pack | `python3 tools/pack_validate.py <id>` |
| New case from the template | `tools/new_case.sh <id> "<title>" [CODE]` |
| Compile plant.json to a pack | `python3 tools/pack_build.py cases/<id>` |
| Import work orders from Excel | `python3.13 tools/pack_import_mh.py in.xlsx cases/<id>/mh.json` |
| Visible text audit | `node tools/text_audit.js /tmp/t.json dist/index.html` |
| Start-up and idle profiling | `node tools/profile_load.js`, `node tools/profile_idle.js` |

## Two people building in parallel
Split by stream, not by feature, and merge small changes often (see `docs/CONTRACT.md`).
- **Stream A, data and intelligence:** `dl.js`, `ai*.js`, `intent.js`, `ks.js`, `wiz.js`, `ingest.js`, `sync.js`, `eqclass.js`, `netlify/`, `cases/`, `tools/pack_*`.
- **Stream B, pages and visuals:** `pid*.js`, `g3d.js`, `g3r.js`, `plant3d.js`, `hse*.js`, `plan.js`, `pp.js`, `dash.js`, `eq2.js`, `mh*.js`, `pdm*.js`, `scn*.js`, `gov.js`, `rc.js`, `perf.js`, `auto.js`, `base.css`, `i18n.js`.
- **Shared hot files, one owner at a time (ask in the PR before editing):** `build.py`, `src/base.html`, `tests/regress.js`, `tests/smoke_case.js`.
- New page: add a module and register it in `build.py` (module list and the page dispatch patch). Keep the page function in its own file.
- Branch per person per stream, pull `main` before starting, open small PRs, never leave `main` red.

## Rules for text and output (the owner is strict about these)
- Visible text reads like a plant engineer wrote it: plain, specific, no marketing words. No em dashes or en dashes anywhere (`build.py` rewrites them, but do not write them). No emoji.
- Use the symbol `%` and not the word percent. Units after numbers with a space (`3.2 barg`, `80 degC`).
- Never write a placeholder, "TODO", "lorem" or invented person names into a delivered file.
- Do not invent plant data silently. Anything synthetic is labelled (`SYNTHETIC record`, "Assumption", "Estimate").
- Reports and documents: corporate English, bold the important figures in running text, page break after every section, under the page limit given.

## Performance budget (keep it)
First screen under about 1 s on a normal laptop; no work at start-up that can wait for an idle callback; 3D and canvas loops stop when the tab is hidden; page functions must not rebuild the search index (`DB.ensure()` only). Check with `node tools/profile_load.js` after any change to start-up code.

## Safety of the app's own content
The assistant never explains how to bypass a trip or interlock (`safety_guard` tool). Hazard results are screening estimates and say so. Do not weaken either.

## Where things are
`docs/ARCHITECTURE.md` (modules and data flow), `docs/CASE_PACKS.md`, `docs/CONTRACT.md`, `docs/NEW_CASE_RUNBOOK.md`, `docs/INTAKE_PROMPTS.md`, `docs/CAPABILITIES.md`, `LAUNCH_NETLIFY_GEMINI.txt`, `DEPLOY_AND_CONNECT_AI.txt`.
