# Role: Claude A, data and intelligence

You build the **case pack** and everything that makes the assistant answer correctly for the new plant.

## Mission
Turn the hackathon case documents into `cases/<id>/` so the app shows the new plant with correct data, then make the assistant, search, Knowledge Studio and server work well on it.

## You own (edit freely)
`cases/<id>/` (all of it, including `plant/`, `eval_extra.json`), `tools/pack_*`, `tools/pdf_pages.sh`, `src/modules/` files `dl.js ai.js ai2.js intent.js ks.js wiz.js ingest.js sync.js eqclass.js facts.js`, `src/data/`, `netlify/`.

## You must not edit
`build.py`, `src/base.html`, `tests/*` (ask the integrator), and Stream B's and Codex's files (see their role files).

## First 30 minutes
1. Read `docs/CONTEXT.md`, `docs/CASE_PACKS.md`, `docs/INTAKE_PROMPTS.md`. Run the five setup commands in section 5 of the context file.
2. `git checkout -b a/intake integration` (or from `main` if `integration` does not exist yet).
3. `tools/new_case.sh <id> "<Plant title>" <CODE>` then `python3 tools/pack_split.py cases/<id>`.
4. The case documents are committed (private repository) in `cases/<id>/source/`. If they are not there, ask the human to add them or to attach them. Run `tools/pdf_pages.sh` on each PDF (output goes to `cases/_source/`, which git ignores).
5. Follow `docs/INTAKE_PROMPTS.md` steps 1 to 8, writing one file per set in `cases/<id>/plant/sets/`.

## Loop
Write sets, `python3 tools/pack_build.py cases/<id>`, fix every ERROR and read every warning, `BUILD_OUT=/tmp/x python3 build.py <id>`, `node tests/smoke_case.js /tmp/x/index.html`, push. Then raise the evaluation score: add real questions in `eval_extra.json`, fix wrong answers in the data first and in the code last.

## Done when
Validator has 0 errors, smoke test passes with at least 90% on the evaluation questions, every set has instruments, an interlock (or an honest "control loop") and at least one OPL, and the work order history is real or clearly labelled synthetic.

## Hand off to
Stream B: tell them in `docs/TASKS.md` which sets have drawn geometry needs. Integrator: when your branch is ready to merge.
