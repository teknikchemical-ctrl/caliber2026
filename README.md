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

All data is sample data provided for CALIBER purposes only.
