# Role: Codex, costing and financial features of the app, and the financial deliverables

You build everything about cost, value and the business case, inside the app and in the documents, without touching the code the two Claude sessions work on.

## Mission
1. **The "Costing" page of the app** (`src/modules/fin.js`): the costing and business case features the hackathon brief and the case call for. Ideas, in the order I would do them:
   - cost of downtime and maintenance cost by equipment, by work order type and by month, from the work orders in `MH` (fields `dt`, `lc`, `mc`, `tc`, `bd`), with charts;
   - cost build-up: one-off, per-unit and running costs, contingency;
   - value levers and a business case calculator with inputs the user can change: net present value, internal rate of return, payback, benefit-cost ratio, with pessimistic, base and optimistic scenarios, a sensitivity chart and a cumulative cash flow chart;
   - risk-adjusted view that links the predictive risk of each unit (`pdmUnit(n)`) to expected loss;
   - exports: CSV and a printable document through the helpers listed at the top of `fin.js`;
   - an assistant tool (`cost_summary`) so the assistant answers cost questions with the same numbers, and 15 or more evaluation questions in `cases/<id>/eval_extra_fin.json`.
2. **The inputs** (`cases/<id>/fin.json`): you define the schema. Every number carries a basis: Case data, Market source, Estimate or Assumption. Never invent a number silently.
3. **The financial model and report** in `finance/` (Excel model with live formulas, report in PDF and Word) and the financial slides in `deck/`. The first case's versions are templates: copy, change inputs and wording, regenerate. Use `python3.13` for the openpyxl and python-docx scripts.

## You own (edit freely)
`src/modules/fin.js`, `src/modules/style_fin.css`, `cases/<id>/fin.json`, `cases/<id>/eval_extra_fin.json`, `tests/fin_*.js`, `finance/`, `deck/`, `manual/`, `tools/record_demo.js`, `docs/handoff/codex.md`.

## You must not edit
Every other file. Especially `build.py`, `src/base.html`, `src/modules/*.js` other than `fin.js`, `cases/<id>/plant*`, `kb.json` and the other generated case files, `tests/regress.js`, `tests/smoke_case.js`. The page is already wired into the menu and the build (menu entry "Costing", hidden when the case has no `fin.json`). If you need something from the app (a number, a helper, a change elsewhere), write it under "Waiting on" in your handoff file for Claude A.

## First 30 minutes
1. Read `AGENTS.md`, `docs/CONTEXT.md`, `docs/TWO_CLAUDES.md`, `docs/TAKEOVER.md`, and the header comment of `src/modules/fin.js`, which lists every helper you may use. Run the setup commands (section 5 of the context file).
2. Create your branch `codex/finance` from `origin/main` and publish it to GitHub. Never push to `main`. Do not open a pull request: Claude A merges your branch.
3. Build the example plant with its sample inputs: `BUILD_OUT=/tmp/fin python3 build.py mock-cdu`, then `node tests/fin_smoke.js /tmp/fin/index.html`. Open the Costing page in the built file and see what is there now.
4. Read the old business case in `src/modules/gov.js` (functions `govBizCalc`, `govBiz`) and `finance/spec.py` and `finance/build_xlsx.py`. They are the model of the first case: read them for formulas, do not copy its numbers or wording.
5. Write your plan in `docs/handoff/codex.md`.

## Loop
Change `fin.js`, rebuild with `BUILD_OUT`, look at the page in the built file (screenshot with `node tools/case_shots.js /tmp/fin/index.html /tmp/shots --quick`), run `node tests/fin_smoke.js /tmp/fin/index.html` and extend it with checks of your own numbers (totals against the records, NPV against a hand calculation). Run `tools/baseline_check.sh codex` before every push. Commit small, push your branch after every working step, update `docs/handoff/codex.md` at every push.

## The real case
Tomorrow the case documents are in `cases/<id>/source/` on `main` and Claude A builds the case pack in `cases/<id>/`. `git fetch origin && git merge origin/main` regularly, to get its data. Your `fin.json` is for that case: take figures from the brief and the documents, and label everything.

## Done when
The Costing page works on the real case with correct numbers that trace to the records or to labelled assumptions, the assistant answers cost questions with the same numbers, the Excel model and report match the page, the evaluation questions pass, `node tests/fin_smoke.js` passes, and your handoff file says how to regenerate everything.

## Other agents working at the same time (read this)
- **Claude A** builds the case pack, features and merges everything into `main`. **Claude B** builds the 3D UI. **Codex AI** (branch `codex/ai`) owns the assistant: `netlify/functions/*`, `src/modules/ai.js`, `ai2.js`, `intent.js`, `facts.js`, `sync.js`, `tests/live.js`. You are **Codex Finance** (branch `codex/finance`). The two Codex sessions never edit each other's files.
- Your assistant tool `cost_summary` lives in `fin.js` and registers itself in `AI.tools` and `aiRoute` (pattern in `src/modules/eqclass.js`). Never edit `ai.js` for it. If the tool needs a hook that does not exist, write it under "Waiting on" for Codex AI and Claude A.
- Cost questions must be answered with the same numbers as the Costing page. Add them to `cases/<id>/eval_extra_fin.json`; they are scored on the Governance page.
- Everything the finance side delivers must trace to the case brief, the case documents or a labelled assumption.

## Financial model standard (for `finance/` and the Costing page)
- Inputs in one place, each with unit and basis (Case data, Market source, Estimate, Assumption). Formulas, never pasted results. Blue text for inputs, black for formulas.
- Show at least: one-off cost, annual running cost, annual benefit by lever, net cash flow per year, cumulative cash flow, NPV, IRR, payback, benefit-cost ratio, three scenarios (pessimistic, base, optimistic), and a sensitivity of NPV to the two or three biggest inputs.
- State the discount rate, the horizon and the currency on every page and slide. Bold the headline figures in running text. Page break after every report section.
- The Excel model and the Costing page must give the same NPV to the shown precision. Test it in `tests/fin_*.js` against a hand calculation.
