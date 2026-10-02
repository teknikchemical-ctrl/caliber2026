# Asset Knowledge Platform (CALIBER 2026, Case 1)

AI-ready Manufacturing Knowledge Hub for an LLDPE unit: P&ID digital twin, equipment drawings, plot plan, interlocks, maintenance history with predictive maintenance and plant replay, failure memory, a governed knowledge base with an approval workflow, traceable AI answers, reports and integrations.

Open `knowledge-hub-integrated_BAP5.html` in a browser. No server is needed.

## Develop

```
npm install        # playwright, for the tests
npm run build      # python3 build.py
npm test           # build, then headless regression suite and answer audit
```

Edit `src/modules/*.js`, not the generated HTML. See `docs/ARCHITECTURE.md` and `docs/AI_PROVIDER_CONTRACT.md`.

## Pages

Dashboard (plant P&ID overview), Equipment Sets (with Asset 360), Plot Plan, Maintenance (overview, work orders, timeline, predictive, plant replay), Interlock Library, AI Assistant, Knowledge Studio, Failure Memory, Report Center, Case 1 Coverage, Integrations, Documents, OPL Library, Data Quality. Press Ctrl+K for global search.

## Backend and LLM

The assistant is provider-ready: see `docs/AI_PROVIDER_CONTRACT.md` (request, response, streaming, citations), `docs/BACKEND_API.md` (endpoints and server rules), `docs/DATA_MODEL.sql` (PostgreSQL with pgvector) and `docs/PROMPT_TEMPLATE.md`. The Integrations page exports the live chunks, typed facts, relations, tool schemas and evaluation cases in that shape. `npm test` runs a curated evaluation of 54 questions and fails below 90 percent.

All data is sample data provided for CALIBER purposes only.

## Ingestion wizard and chain reaction scenarios

- Knowledge Studio ingestion is a wizard (source, detected kind, metadata, structure and column mapping, quality gates, result). Kinds: SOP, OPL, datasheet, instrument list, maintenance work orders (CSV imported into history), trip and interlock lists, incident reports, notes. xlsx, docx and pdf readers load lazily from a CDN.
- Scenarios page and equipment tab "Scenarios" replay OPL troubleshooting cases and work orders on the P&ID, and simulate plant wide chain reactions (unit trip, nitrogen or steam loss). Stream links, delays and interlock effects are engineering assumptions, not plant data. Outage estimates are averages of historical breakdowns.
- Predictive Maintenance can weight priority by chain reaction size (toggle) and links to the plant P&ID view.
- Assistant tool `cascade_analysis` answers plant impact questions with cited OPL guidance.

## Live deployment (Netlify)

The page works as a plain file and as a Netlify site with a shared database and a server side AI. See `docs/DEPLOY_NETLIFY.md` for the 10 minute setup, the environment variables and the limits of open access. Tests: `npm test` (regression) and `node tests/live.js` (shared database between two users, AI adapters, rate limits and offline fallback).

## Interface quality checks

`node tests/layout.js [--strict]` opens every page, tab and key dialog at 1440, 1100 and 820 px and reports overlapping text, clipped text, content spilling out of its card, labels overlapping inside SVG figures and horizontal page overflow. Run it after any change to markup or styles (`npm run test:layout`).

`src/modules/fx.js` holds two shared helpers. `svgFix` moves small labels inside any SVG figure away from labels they would overlap, and caches the offsets per figure so figures that repaint every animation frame are corrected without measuring again. The motion layer adds ripples around equipment in alarm or trip, a state-aware frame and readings flash in the OPL simulator, and count-up on KPI tiles. Motion is disabled for users who request reduced motion. When adding a CSS class, check that the name is not already used elsewhere (`grep -rn "\.name{" src`), because a duplicate name silently restyles the older component.

## Tests

| Command | What it covers |
|---|---|
| `npm test` | build, static checks (duplicate CSS class names and functions), page regression and answer evaluation, simulator smoke test, then the live test (two users, AI adapters, limits, access codes, conflicts, backup, embeddings, offline fallback) |
| `npm run test:quick` | build, static checks and regression only |
| `npm run test:layout` | overlap, clipping, spill, SVG label and accessibility audit at 1440, 1100, 820 and 390 px (runs the viewports in parallel) |
| `npm run test:layout:quick` | the same at 1440 px only |

GitHub Actions runs `npm test` and the quick layout audit on every push (`.github/workflows/ci.yml`).

## Shared database controls

- Optional access codes (`EDIT_CODE`, `APPROVE_CODE`, `ADMIN_CODE`), backup and restore, conflict copies when two people edit the same item, a usage and quality page (Integrations, Usage and quality), diagnostics in Settings, an assumptions register for the chain reaction rules (Scenarios), answer language (English or Bahasa Indonesia), a guided tour and a mobile layout. See `docs/DEPLOY_NETLIFY.md`.

## Known limits

- The plant data (P&IDs, OPLs, datasheets, interlocks, maintenance history) is a snapshot embedded in the page. There is no live connection to the document, maintenance or historian systems.
- Meaning-based search uses the provider's embeddings; the similarity threshold (`DB.EMB_MIN`) has not been tuned on real questions.
- Failure forecasts are limited by the data: unit level history does not predict the next breakdown better than the plant average.
- Access codes are shared secrets, not individual logins.
- Alerts by email or chat are not included (they need a messaging service).
