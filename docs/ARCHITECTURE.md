# Architecture

The platform ships as one HTML file (`knowledge-hub-integrated_BAP5.html`) so it can be opened without a server. It is assembled from modules by `build.py`. Edit the modules, not the generated file.

## Repository layout

| Path | Purpose |
|---|---|
| `build.py` | Assembles the single file from `src/` and applies the light theme, wording and syntax checks |
| `src/base.html` | Original application shell and the baseline data (documents, chunks, instruments, interlocks, OPL) |
| `src/modules/*.js` | Feature modules, concatenated in the order listed in `build.py` |
| `src/modules/style*.css` | Styles |
| `src/data/mh.json` | Maintenance history (from `Maintenance History (All Equipment).xlsx`) |
| `tools/theme.py` | Colour mapping, emoji and dash clean-up |
| `tests/regress.js` | Headless regression suite (`npm test`) |
| `docs/` | This file and the AI provider contract |

## Layers

1. **Data layer** (`dl.js`). Typed entity registry (`SCHEMA`), chunk builder over every source, BM25 index with synonyms and tag awareness, approval-aware trust weighting, user knowledge store (`UKB`) with a Draft, In review, Approved, Superseded, Rejected workflow, audit trail, answer feedback and persistence (`STORE`, IndexedDB with local storage fallback). Events: `BUS` (`kb:changed`, `audit`, `role`).
2. **Services**. `ai.js` (retrieval call, tools, provider contract, confidence, number verification), `fm.js` (failure memory), `pdm.js` (predictive model), `rc.js` (reports and exports), `int.js` (connectors, graph, search), `cov.js` (coverage and answer audit).
3. **Presentation**. Page modules (`ks.js`, `il.js`, `pid2.js`, `mh1-4.js`, `rp.js`, `ga.js`, `pp.js`, `dash.js`) and the original shell.

Every module registers itself with `regMod(name, version, deps, description)`. The registry is shown on the Integrations page.

## Retrieval

`DB.build()` converts each record into a chunk: `{id, k, title, sec, text, set, tags, ver, status, trust, sys}`. `DB.search(query, {set, kinds, k})`:

- tokenises with light stemming, keeps equipment tags whole and as parts, expands with a synonym table at 0.55 weight;
- scores with BM25 over title (x2), section (x1.5), text and tags (x2.5);
- multiplies by status trust (approved 1.0, not stated 0.8, in review 0.7, draft 0.55, superseded 0.35), a kind prior, a boost for the detected equipment set and a role weighting;
- returns each hit with `rel` (relative to the best), `cov` (share of query terms found) and the matched terms, which feed the confidence estimate and the "Why this answer" panel.

The index is rebuilt lazily after any change (`DB.dirty()`).

## Answer pipeline

question, `aiRoute` (tool routing for computed answers), `aiRetrieve`, provider or local composition, `aiConf` (match strength, independent sources, approval status, agreement), `aiVerify` (numbers in the answer must appear in a source), citations, feedback. See `AI_PROVIDER_CONTRACT.md` for the provider interface.

## Extending

- **New data source**: add a block to `DB.build()` that pushes chunks, add an entry to `SCHEMA`, and a connector description in `CONNS` (`int.js`).
- **New tool for the assistant**: add to `AI.tools` with a JSON-schema `parameters` object and a `run` function that returns `{text, sources}`; add a route in `aiRoute` for the offline mode. Tools are published to a remote provider automatically.
- **New report**: add a builder to `rc.js` and an entry in `RCK`.
- **New page**: create a module, register it, add the nav item and route in `build.py`.

## Limits of the single file build

No network access and no server. EDMS, AIMS, CMMS and historian connectors are simulated. User knowledge is stored in the browser. PDF ingestion needs the PDF text layer and loads pdf.js once from a CDN. Scanned documents need OCR on the server side.
