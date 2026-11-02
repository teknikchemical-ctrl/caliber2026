# What the app already does, and what a new brief may still need

Use this in the first 30 minutes of a new case: tick what the brief asks for, then decide what to build. Effort is a rough guess for one person with Claude, once the case data is in.

## Already built (works on any case pack)

| A brief may ask for | Where | Notes |
|---|---|---|
| Cited answers from plant documents | AI Assistant | Sources, revision and approval status, confidence, number check, refusal when out of scope. Works offline; Gemini through the server improves wording |
| Safe handling of bypass requests | `safety_guard` | Refuses to explain how to defeat a trip |
| Getting documents and know-how in | Knowledge Studio, wizard, `/api/extract` | Paste or upload, AI extraction with quotes, review and approval before it counts as trusted |
| Failure memory, root cause history | Failure Memory, assistant | Finds similar past failures, causes and fixes |
| Reliability analytics | Maintenance, Performance | MTBF, MTTR, availability, downtime and cost, Pareto, repeat failures |
| Predictive maintenance | Maintenance, Predictive | Weibull model per unit and component, risk ranking, 90-day forecast with a backtest and data confidence |
| Process view of every unit | Equipment, P&ID | Live-style values, valves, trips and effects. Replace the simulation with `window.LIVE_SOURCE(tag)` |
| Plant overview and 3D plant | Dashboard | Units on the plot plan joined by streams, states, drill down |
| Drawings and 3D parts | Equipment, Drawing and 3D | Clickable parts and nozzles tied to the parts list and history |
| What-if and chain reaction | Scenarios | Trip a unit or a utility and follow the effect, from an OPL case or a work order |
| Interlock and safety functions | Interlock Library, Interlock logic tab | Cause and effect, voting, permissives, simulator |
| Start-up readiness | Equipment, Start-up readiness | Go or no-go from permissives, open conflicts and overdue work |
| Hazard screening | Plot Plan, Hazard simulator | Release, plume, jet and pool fire, blast, detection and muster, in 2D and 3D |
| Equipment class reference | Equipment, Class reference; assistant | Typical failure modes, inspection, spares, standards for 13 classes |
| Operator and engineer training | OPL Library, OPL simulator | One point lessons with a simulator |
| Spares, KPIs, targets | Performance | Spare parts risk, indicator targets |
| Data quality and conflicts | Data Quality | Register of document conflicts with suggested actions |
| Governance, roles, audit | Governance, Settings | Roles enforced in the page, audit trail, evaluation score, assumptions register |
| Reports and exports | Report Center | Equipment dossier, solution brief, Word export, JSON and JSONL bundles |
| Shared database, AI proxy, access codes | Netlify functions | Free tier, Gemini, rate limits, backup and restore |
| Indonesian interface | Settings | Menus and main labels; Bahasa questions understood |
| Installable, works offline | PWA | Shared database and AI need a network |

## Not built (ask: does the brief need it?)

| Possible ask | What exists | Effort |
|---|---|---|
| Shift handover or log book | nothing | 2 to 3 h: new page, records in Knowledge Studio style, assistant tool to summarise |
| Permit to work, LOTO, management of change | start-up readiness has permissives only | 3 to 4 h per workflow, plus approval states (reuse the Studio approval flow) |
| HAZOP or LOPA register and calculator | cause and effect and SIL labels only | 3 h register, 2 h LOPA calculator |
| Energy, emissions, utilities dashboard | KPI page structure | 3 h with synthetic or supplied tag data, plus a time-series simulator |
| Anomaly detection on process tags | simulated signals only | 3 to 4 h: tag generator with fault injection, detector with explanation |
| Real historian or CMMS connection | `LIVE_SOURCE` hook, Integrations page describes connectors | depends on access; mock connector 1 h |
| Image or video defect detection | nothing | 4 h or more; needs images and a model call through the server |
| Quality or lab (LIMS) analysis | nothing | 3 h if data is a table |
| Planning and scheduling of maintenance | Maintenance site planner | 2 h to adapt |
| Cost and business case page | Governance, Business case | 1 h to change inputs; the full model is in `finance/` |
| Mobile field app | PWA, responsive | 2 h for a field checklist view |

## Reusable deliverable builders (outside the app)
`finance/` (Excel model, report in PDF and Word), `deck/` (PowerPoint), `manual/` (user manual in PDF and Word), `tools/record_demo.js` (demo video). They contain the first case's content and numbers: change the inputs and text before reusing them.
