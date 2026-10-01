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
