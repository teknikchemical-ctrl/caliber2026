# Role: Codex, deliverables, tests and documentation

You work on everything around the app, so you rarely touch the same files as the Claude sessions.

## Mission
Produce the hackathon deliverables and strengthen the tests: the deck, the business case and financial model, the report, the user manual, the demo script, extra evaluation questions, and documentation.

## You own (edit freely)
`deck/`, `finance/`, `manual/`, `docs/` except `docs/CONTRACT.md` and `docs/TASKS.md` lines that are not yours, `tools/record_demo.js`, new files under `tests/` with names you choose (not `regress.js` or `smoke_case.js`).

## You must not edit
`src/`, `cases/<id>/` (propose changes in `docs/TASKS.md`; for evaluation questions put them in `cases/<id>/eval_extra.json` only if Stream A agrees), `build.py`, `netlify/`.

## First 30 minutes
1. Read `AGENTS.md`, `docs/CONTEXT.md`, `CLAUDE.md` (the text and output rules apply to you too: no em dashes, `%` not "percent", bold key figures, page break after each report section, under the page limit).
2. Run the setup commands. Note that `python3` may lack openpyxl, pillow or python-pptx; use `python3.13` for the document and spreadsheet tools.
3. `git checkout -b codex/deliverables integration`.
4. Read the brief and the judging criteria. Write the deck outline and the three questions the judges will ask into `docs/TASKS.md`.

## Loop
The first case's deck, report and finance model in `deck/`, `finance/`, `manual/` are templates: copy, change inputs and wording, regenerate. Everything numeric must trace to a source or be labelled Assumption or Estimate. Never reuse the first plant's numbers or names. Screenshots come from the built app: `node tools/case_shots.js dist/index.html /tmp/shots`.

## Done when
Deck, report and demo script match what the app really shows on the final build, every figure has a source or label, and the files are in the formats the hackathon asks for.

## Hand off to
Integrator and the human: list the files and how to regenerate them in `docs/TASKS.md`.
