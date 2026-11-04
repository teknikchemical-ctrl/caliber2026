# Plan, milestones, usage budget, fallbacks

T0 = the moment the agents start. Work back from the deadline (Thu 5 Nov 06:00); aim to be submitted by 03:00. Times are targets, not promises. The human tells Claude A the real clock times.

## Who does what, and why (usage budget)
Claude A (this session) has about 75% of its usage left, so it takes the thin, critical-path work and the integration, and delegates the large volume work. **Claude B** (separate account, usage to be confirmed by the human, check before T0) takes the largest block, the UI. The two Codex agents have their own budgets: Codex AI takes the reasoning layer, Codex Fin takes the engine, the business case and the deck.
- Claude A reserves **15% of its usage for M5** (final integration, deploy, zip, screenshot). When A falls below 25% it stops feature work and only integrates, merges and deploys.
- If Claude B reports it is below 30% usage at M2: Codex Fin takes the Health, Recommendation and Scenario pages (it owns the numbers behind them anyway), B keeps Overview, Forecast, Ask AI, Data and drawings.
- If a Codex agent stops: the other Codex takes its inbox, in this order of value: engine before agent before deck.

## Order of work
| Milestone | Target | Deliverables | Gate |
|---|---|---|---|
| **M0** Ready to start | T0 + 1.5 h | Contracts in repo (done). A: `spi/fixtures/mini.sqlite` (300 parts, real schema) and the hello deploy on Vercel with one DB-reading endpoint. All: read role file, set up, first commit on own branch | Everyone can run against mini.sqlite; Vercel URL answers `/api/data/health` |
| **M1** Data and skeleton | T0 + 4 h | A: full `spi.sqlite` with part_profile, dq_issue, spec_family; `server/data/*`. Fin: classify, ses, croston, sba, tsb with unit tests; Codex AI: providers (gemini, mock), evidence pack, rules planner, validator, tests with the fake Gemini. B: app shell, nav, all `spi_*` pages as skeletons reading `server/data` | Merge to main, `npm run test:quick`, deploy |
| **M2** First end-to-end | T0 + 8 h | One part: pick in UI -> `/api/ai/plan` (mock) -> engine -> forecast chart with bands, parameters, recommendation, ledger. A: sets generated and case pack builds (`cases/spi`). Fin: optimiser, recommender, health lists. B: Forecast, Optimisation, Health pages live. Real Gemini key connected by the human and `/api/ai/health` green | Demo of one part end to end on the Vercel URL |
| **M3** Full features | T0 + 12 h | Batch precompute into `results.sqlite` (rules for all, AI for the key parts), portfolio views, recommendations page, Ask AI with Flow B (proposals, accept and reject), scenario simulator, backtest gate. Drawings with stock overlay for the sets | All six named outputs visible |
| **M4** Proof and money | T0 + 16 h | Backtest and baseline replay numbers, golden question evaluation, business case in IDR with labelled assumptions, deck draft, data architecture page, text audit, layout audit | Numbers in the app equal numbers in the deck and the workbook |
| **M5** Freeze and ship | T0 + 19 h | Feature freeze. Final merge, full tests, final Vercel deploy, screenshot with timestamp, zip (`tools/spi_zip.sh`), deck final with team table. A only | Submitted by 03:00 |
| Buffer | until 06:00 | Fixes only | |

## Spikes (do first, in this order, A unless noted; each at most 30 minutes)
1. **S1 Vercel builds our page**: can the build run `python3 build.py spi`? If not, commit the built page for the final deploy. Needs the human to import the repo in Vercel (step list for the human is in `agents/A.md`).
2. **S2 SQLite on Vercel**: `better-sqlite3` read-only with `includeFiles`. Else `sql.js`.
3. **S3 Gemini from Vercel**: `/api/ai/health` with the human's key as an environment variable (Codex AI). Else mock plus the honest note in the deck.
4. **S4 Function limits**: confirm `maxDuration` and streaming work on the plan the human has (Codex AI).
5. **S5 Database size and speed**: full DB under about 40 MB, a part query under 50 ms (A).

## Rules for working in parallel (all four)
1. Own folder only; ask through `docs/inbox` and your handoff "Waiting on". 2. Code against `spi/db/schema.sql`, `schema_results.sql` and `spi/contracts/*.json`, and against `mini.sqlite`, never against another agent's unfinished code: use a stub that returns the contract shape. 3. Push your branch after every working step. 4. `git fetch && git merge origin/main` at least every hour; read your inbox each time. 5. Before every push: `bash tools/baseline_check.sh <role>` and your tests. 6. Claude A merges to main, runs the shared tests, deploys. Nobody else pushes to main. 7. A contract change is a message in `docs/TASKS.md` and an inbox line to every affected agent, never a silent edit. 8. Text rules of `CLAUDE.md` apply everywhere: plain engineer English, no em or en dashes, `%` symbol, units after a space, label every assumption and every synthetic item.
