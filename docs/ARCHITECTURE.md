# Architecture

One HTML file, assembled from the files in `src/` by `build.py`. Edit the sources, never the generated file. `build.py` also writes `dist/index.html` for Netlify. Generated files are not committed: Netlify and CI run the build.

## Layout

| Path | Contents |
|---|---|
| `src/base.html` | The shell and the OPL simulator. The plant data it used to hold is now in the case pack |
| `cases/<id>/` | One plant: data (`kb.json`, `dsil.json`, `ga.json`, `mh.json`, `eval_cases.json`, `case.json`) and optional hand-drawn geometry in `geo/`. See `docs/CASE_PACKS.md` |
| `src/modules/*.js` | Feature modules, joined in the order listed in `build.py` |
| `src/modules/style*.css` | Styles |
| `src/data/` | Equipment class library (`eqclass.json`), SQL schema, prompt template |
| `netlify/functions/` | The server side: `ai`, `kb`, `embed`, `health`, `selftest` |
| `tools/` | Theme and wording clean-up, local dev server, case pack tools (`pack_validate.py`, `pack_build.py`, `pack_import_mh.py`, `pdf_pages.sh`), crawlers and profilers |
| `tests/` | Static checks, regression, live test, layout audit |
| `docs/` | These notes and the backend specs |

## Page side

**Data layer** (`dl.js`, `facts.js`). Every record becomes a chunk with a unique `chunk_id`, a status code, an ISO date, a hash, a token count, role access and a slot for an embedding. Facts such as set points, permissives, bill of material and nozzles are extracted separately. Search is BM25 with synonyms, equipment tags, approval-status weighting and role weighting. When embeddings are available, a record with no shared words can still be found by meaning.

User knowledge goes through Draft, In review, Approved, Superseded, Rejected. Everything is saved in IndexedDB (localStorage as a fallback), and `sync.js` mirrors it to the server when there is one.

**Assistant** (`ai.js`, `intent.js`). `intent.js` works out what is being asked (bypass request, consequence, comparison, ranking, history, procedure, chain reaction and so on). Counts, rankings, forecasts and similar are calculated in the browser, not by the model. With an AI connected, the calculated result and the retrieved records go to `/api/ai`, and the model writes the answer. The page then checks every number and citation against the records. A request to bypass a protection is always answered by the built-in rule, never by the model.

**Views.** P&ID engine (`pid2.js`; automatic sheets in `auto.js`), drawings (`ga.js`), plot plan (`pp.js`), maintenance (`mh1-4.js`, `pdm.js`, `rp.js`), scenarios (`scn.js`, `scnui.js`), Knowledge Studio (`ks.js`, `wiz.js`), reports (`rc.js`), coverage (`cov.js`), integrations (`int.js`).

**Helpers** (`fx.js`, `help.js`, `ui.js`). Label de-collision for SVG figures, motion, the guided tour, shared UI patterns and accessibility fixes.

Modules register with `regMod(name, version, deps, description)`. The list is on the Integrations page.

## Server side

All on Netlify Functions, storage in Netlify Blobs.

- `ai.mjs` hides the key, applies the per-visitor and daily limits, builds the prompt and calls Gemini (or any OpenAI-compatible API). It tries the fallback models if the first one is not available to the key, and can hand tool calls back to the page.
- `kb.mjs` stores knowledge items, imported work orders, feedback, the audit trail and the answer log. Last write wins unless the page sends the version it started from, in which case a newer server copy is reported as a conflict. Deleted items leave a marker so other browsers drop them. Optional codes protect edits, approvals and admin routes.
- `embed.mjs` creates embeddings and caches them by content hash.
- `health.mjs` and `selftest.mjs` report status and run the diagnostics shown in Settings.

The page polls the server every 15 seconds. Without a server it simply keeps working from browser storage.

## Adding things

- A data source: add a block to `DB.build()` that pushes chunks, an entry in `SCHEMA`, and a connector in `CONNS` (`int.js`).
- An assistant tool: add it to `AI.tools` with a JSON-schema `parameters` object and a `run` function that returns `{text, sources}`, then add a route for it in `aiRoute`. Tools are sent to the provider automatically.
- A report: add a builder to `rc.js` and an entry in `RCK`.
- A page: write a module, register it, add the nav item and the route in `build.py`.
