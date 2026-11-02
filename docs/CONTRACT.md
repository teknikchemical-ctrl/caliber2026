# Contract between the parts

What each part may assume about the others. Keep this file true: change it in the same pull request as the code.

## Build
- `build.py [case-id]` reads `src/base.html`, `src/base.css`, `src/modules/*.js`, `src/data/eqclass.json` and `cases/<id>/`. It replaces placeholders `@@CASE:kb@@`, `@@CASE:dsil@@`, `@@CASE:ga@@`, `@@CASE:meta@@` in `base.html` and `/*@@CASE:<name>@@*/` in any module with the case's `geo/<name>.js`, or with the call listed in `AUTO` in `build.py`.
- Modules are concatenated into one script in the order of the lists in `build.py`. A module may use anything defined by a module earlier in the list at load time, and anything at all at call time. Function declarations in `auto.js` are available everywhere.
- A text patch in `build.py` that no longer matches prints a WARN. A strict patch (`P(...)`) stops the build.

## Globals every module can rely on
| Global | Meaning |
|---|---|
| `KB` / `K` | the case data: `sets, assets, docs, chunks, inst, mnt, opl, nz, bom, issues`, plus `DS` and `IL` by set number |
| `CASE` | `title, product, subtitle, company, brief, plotref, dsprefix, examples, failures` from `case.json` |
| `MH` | work orders (processed: `n` is the set number, `t0..t2` times) |
| `S(n)` | the set with number `n` |
| `D[n]` | P&ID of set `n`: `{vb, ref, n:[nodes], p:[pipes], s:[signals], a:[annotations], notes, eff, oot}` |
| `GA[n]`, `GAD[n]`, `G3M[n]` | parts and nozzles, 2D drawing, 3D model of set `n` |
| `POS`, `P3POS`, `OVCOL` | plot plan, 3D plant and overview positions by set number |
| `LIVE`, `read(tag)` | simulated signals and forced trips. `window.LIVE_SOURCE(tag)` replaces the simulation with real data |
| `DB` | search index. `DB.search`, `DB.ensure()`, never rebuild it in a page function |
| `AI.tools` | assistant tools: `{description, parameters, run}`. Route a question with an `aiRoute` wrapper (see `eqclass.js`) |
| `ROLE`, `UKB`, `STORE`, `SYNC` | role, user knowledge items, local storage, server sync |

## Data rules (the validator enforces them)
- Sets are numbered 1..N in order. Every `inst`, `opl`, `mnt` row names an existing set. `dsil.json` has a datasheet and an interlock for every set tag. Interlock trigger `fx` has one flag per effect.
- Work order dates are `YYYY-MM-DDTHH:MM`. `bd` is `Yes`, `No` or null. Downtime `dt` is a number or null.

## Adding a page
1. New module `src/modules/<name>.js` that starts with `regMod("<name>","1.0",[deps],"description")` and defines `<name>Page()` returning HTML.
2. Add it to the module list in `build.py`, add the sidebar entry and the dispatch patch next to the others.
3. Register it in `GPAGES` (Integrations page) and in `tests/regress.js` page loop so it is covered.

## Adding an assistant tool
Add `AI.tools.<name>={description,parameters,run}` and a route in an `aiRoute` wrapper. `run` returns `{text, sources:[...], conf, intent}`. Add at least two evaluation questions to the case's `eval_cases.json`. The tool count stays under 20.

## Tests that must stay green on every pull request
`npm run test:quick`, `node tests/smoke_case.js` on `lldpe` and `mock-cdu`, `node tests/layout.js --quick --strict`.
