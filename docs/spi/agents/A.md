# Role: Claude A (great-tesla), data, contracts, integration, deploy

Branch `claude/great-tesla-l0uw33`. Only you write to `main`. Thin and critical: usage is limited, so keep sessions short, delegate volume, reserve 15% for M5.

## Your files
`spi/data`, `spi/etl`, `spi/db/schema*.sql` and `spi/db/spi.sqlite`, `spi/fixtures`, `spi/contracts`, `spi/eval`, `api/_lib`, `api/data`, `vercel.json`, `package.json`, `build.py`, `cases/spi/*` except `geo/`, `tools/spi_*`, `tools/baseline_check.sh`, `docs/spi/*.md` except the files owned by Codex, `docs/TASKS.md`, `docs/inbox/*`, `docs/handoff/a.md`.

## Tasks in order
1. **A1 (M0) Vercel hello.** Add `better-sqlite3` to `package.json`, write `vercel.json` (build `python3 build.py spi`, output `dist`, functions `api/**` Node 22, `includeFiles` `spi/db/*.sqlite`, `maxDuration` 60), `api/_lib/db.mjs` (open spi.sqlite read-only, attach `res` if present), `api/data/health.mjs`. Ask the human to import the repo in Vercel (Add New Project, choose `teknikchemical-ctrl/caliber2026`, production branch `main`, framework preset Other, no env vars yet) and send the URL. Spikes S1, S2, S5.
2. **A2 (M0) ETL v1 and `mini.sqlite`.** `spi/etl/build_db.py` (python3.13, pandas): read `spi/data/raw` (or `integrated`), write every clean table of `schema.sql`, zero-fill logic is NOT stored (`demand_month` holds only active months). Rules: never drop records silently; each problem becomes a `dq_issue` row with a count and the rule used; keep the raw Material numbers as keys. Then `spi/etl/make_fixture.py`: 300 parts chosen to cover every demand class, every criticality, one family with 5 members, S and A insurance candidates, a part with a bad lead time, a part with a zero price. Push the fixture in the first hour: every other agent waits for it.
3. **A3 (M1) Derived layer.** `part_profile` (classification ADI and CV2 with the cut-offs of `FORECASTING.md`, criticality over served locations, PM due 12 months, lead-time statistics, price from last PO line, stock value, excess value, ABC and XYZ), `part_equipment` (BoM, `FOR <tag>` text, order link), spec parser and `spec_family` (`STANDARDS.md`), `meta` (data cut-off, version). Commit `spi/db/spi.sqlite` at M1 and M3.
4. **A4 (M1) `api/data/*`** per `ARCHITECTURE.md`. Parameterised queries only, `limit` on every list, caching headers.
5. **A5 (M2) Equipment sets and case pack.** `spi/etl/pick_sets.py`, `make_case.py`, `eqclass_map.json`, `part_zone_map.json` per `EQUIPMENT_SETS.md`; `python3 tools/pack_build.py cases/spi`, `python3 tools/pack_validate.py spi`, `python3 build.py spi`, smoke test. Register the `spi_*` modules and navigation in `build.py` (glob `src/modules/spi_*.js`, `style_spi.css`, hide pages not used).
6. **A6 (M3) Golden questions** `spi/eval/*.json` and the `eval_case` table: 40 questions with answers computed by SQL (counts, top items, stock value, lead time of a part, which parts are zero stock on S equipment ...) for Codex AI to test the assistant, plus the Governance page entries.
7. **A7 (continuous) Integrate.** Every 1 to 2 hours: fetch the three branches, merge into your branch, build, `tests/static.js`, the SPI tests, `node tests/smoke_case.js` on `spi` and on `lldpe`, push your branch and `main`, write replies into the inboxes. The `lldpe` evaluation must stay 131/131 (the old pages must not break).
8. **A8 (M5) Ship.** `tools/spi_zip.sh` (source, `spi/db/*.sqlite`, README with run steps, no secrets, no node_modules), final Vercel deploy, tell the human how to take the screenshot that shows the deploy timestamp, final text audit (`node tools/text_audit.js`), check the deck numbers against the app.

9. **A9 (M1) Shell and two pages (reassigned from Claude B).** `src/modules/spi_core.js` (`spiApi(path, body)` the only fetch, `spiCss(id, css)` to add page CSS, small chart helpers: line with band, bars, table view, KPI tile, empty and error states, all following the dataviz rules), `spi_dash.js` (Overview), `spi_arch.js` (Data and architecture) and the navigation group "Spare parts" in `build.py`. Keep them simple. Push `spi_core.js` early: the other agents build their pages on it.
10. **A10 (done first) Vercel.** Vercel build ran Python and `build.py`; it failed only on the output folder. Fixed with `vercel.json` (`outputDirectory: dist`). Spikes S1 done. S2 (SQLite read) is the first thing to confirm on the new deploy: open `/api/data/health` and expect `{"ok":true,...}`.

## Tests you own
`tests/spi_data*.js`: row counts against the raw files, every join key resolves, no part without profile, dq counts match, the fixture opens with the schema, API responses match the contract shapes.

## Done when
Full DB committed, all `api/data` endpoints live on Vercel, case pack builds, merged main is green, zip and screenshot delivered.

## Instructions for the human (Vercel), give in plain words when needed
1. vercel.com, sign in with GitHub. 2. Add New Project, import `caliber2026`. 3. Production branch `main`, root directory `./`, framework preset Other. 4. Settings, Environment Variables: later `AI_PROVIDER=gemini`, `AI_API_KEY=<key>`, `AI_MODEL=gemini-flash-latest` (the human types the key there, never in chat). 5. Send the URL.
