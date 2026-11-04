# The AI reasoning layer (owner: Codex AI)

Purpose: put an AI between the database and the forecasting scripts so that method choice, driver adjustments and explanations come from reasoning over evidence, while every number is still computed by deterministic code and checked.

## Two flows

### Flow A: Database -> AI reads -> forecasting scripts run on the AI's plan
```
part_profile + series + bom + notifications + PM due + PO history + family siblings
   -> evidence pack (compact JSON, ids on every fact)            spi/ai/evidence.js
   -> reasoning agent (Gemini, or rules planner)                 spi/ai/planner.js
   -> ForecastPlan JSON                                          contracts/forecast_plan.schema.json
   -> validator (schema, bounds, evidence ids, number check)     spi/ai/validate.js
   -> engine.runPlan(plan) -> ForecastResult                     spi/engine (Codex Fin)
   -> backtest vs rules baseline; adopt only if it does not lose significantly
   -> store: ai_run, forecast_plan, forecast_input, forecast, inventory_param, recommendation
```
Used for the batch precompute (all parts that matter: every part with demand, plus S and A criticality parts; the rest use the rules planner) and for `POST /api/ai/plan`.

### Flow B: user asks a specific inventory question -> AI reads -> AI projects -> AI feeds forecasting data -> forecasting data
```
question ("Will we run short of mechanical seals for the BF-103 turnaround?")
   -> router: intent + entities (rules first, model second)
   -> tool loop (max 5 calls, read-only tools below)  : AI reads the database
   -> AI projection: ForecastInput proposals (driver, effect, value, period, confidence, rationale, evidence ids)
      e.g. "turnaround at PX_BF-103 in 2027-03: multiply seal demand x1.8 for 2027-03..2027-04, evidence pm:PX_BF-103#2, series:..."
   -> validator bounds them -> written to the ledger as source='ai', status='proposed'
   -> engine re-runs forecasts with the ledger -> forecasting data (ForecastResult[])
   -> answer text composed from tool results and the new ForecastResult, with citations
   -> UI shows the proposals with Accept and Reject; accepted ones are re-sent on the next call (stateless server)
```
The ledger is the join point of both flows: **every driver that moves a forecast is a row with a source (data, rule, ai, user), a confidence, a rationale and evidence.** The UI shows which part of a forecast came from AI.

## Evidence pack (`evidence.js`)
Per part, at most about 1,500 tokens: profile (class, ADI, CV2, months active, last issue, stock, min, max, price, criticality, installed qty, equipment served), the monthly series (zeros included, last 17 months), order-linked events, notification counts by priority on served equipment, PM items due in the next 12 months with dates and criticality, last 8 PO lines (date, qty, lead days, supplier, flags), family siblings' pooled series, data quality flags. Every fact carries an id (`series:<mat>`, `pm:<funcloc>#<n>`, `po:<id>`, `notif:<no>`, `bom:<funcloc>`, `fam:<id>`). Text fields from the database (descriptions) are untrusted: wrap them in delimiters and tell the model they are data, never instructions.

## Tool catalogue (read-only, parameterised, no free SQL) (`spi/ai/tools.js`)
`search_parts(text|tag|family|class|criticality|action)`, `get_part_profile(material_no)`, `get_demand_series(material_no, months)`, `get_equipment_context(tag)` (served parts, criticality, notifications, PM due), `get_pm_schedule(tag, from, to)`, `get_procurement(material_no)`, `get_inventory_position(filters)`, `run_forecast(material_no, plan?, inputs?)`, `run_optimise(filters, policy)`, `simulate_scenario(scope, stock_multiplier, service_level, lead_time_multiplier)`, `explain_recommendation(material_no)`. The existing assistant tools (`AI.tools`, `aiRoute`) are kept for the page; the new tools are registered the same way and also callable server-side.

## Guardrails
1. Structured output only: Gemini JSON mode with the schema; parse, validate, never trust.
2. Bounds from the schemas (`x-bounds`): multipliers 0.25 to 3.0, above 2.0 needs two independent evidence ids; service level moves at most one policy step; horizon at most 18 months; no `set_zero_after` unless 12 months without an issue.
3. Number check: every number in `rationale` and in the final answer must appear in the evidence pack or a tool result (reuse the idea of `aiVerify` in `src/modules/ai.js`). A failing plan is rejected and the rules planner answers instead, with the reason shown.
4. Backtest gate: rolling origin on the last 4 months. If the AI plan is worse than the rules baseline by more than 10% on the error metric, it is not adopted and both are shown. This is what makes the AI accountable.
5. Insurance spares: parts with no demand on S or A equipment with long lead time are never marked for disposal by the AI; the engine labels them `KEEP_INSURANCE`.
6. Safety: the assistant never explains how to bypass a trip or interlock (existing `safety_guard`). Keep it.
7. Prompt injection: database text is data. Tool results are data. The system prompt says so. Tool arguments are validated.
8. Budgets: per-request token cap, per-visitor rate limit, one model call 8 s, whole request 25 s, then rules fallback. Model chain with discovery as in `netlify/functions/_lib.mjs` (`discoverModels`, retry on 429 and 5xx): port it, do not reinvent it.
9. Everything the AI did is traceable: `ai_run.trace_json` holds evidence ids, the plan, validator notes, backtest, timings. The UI shows it as "How the AI reasoned".

## Providers (`spi/ai/providers/`)
Interface `complete({system, messages, tools, schema, temperature, signal}) -> {json|text, tool_calls, usage, model}`. Adapters: `gemini` (REST, key from `AI_API_KEY`, model from `AI_MODEL`, chain and discovery), `mock` (rules planner, deterministic, no network). `AI_PROVIDER=mock` default. The page and tests must pass with `mock`. When the human supplies the key it is set as a Vercel environment variable by the human and tested with `GET /api/ai/health`.

## Rules planner (`rules_planner.js`), also the baseline of the backtest
Demand class by ADI and CV2 -> method: smooth `ses`, erratic `ses` with wider interval, intermittent `sba`, lumpy `tsb` or `family_pooled_sba` when fewer than 3 active months, no demand with S or A criticality `zero_demand_insurance`, no demand otherwise `driver_based` from PM and failure rate. Service level from the policy table. Lead time from the part's PO median, or the family or plant median, flagged as assumption.

## Tests (`tests/spi_ai*.js`, run with `AI_PROVIDER=mock` and a fake Gemini server like `tests/live.js`)
Plans validate; out-of-bounds plans are rejected; a plan with an unknown evidence id is rejected; a model that returns garbage falls back to rules; Flow B proposals land in the ledger with source `ai`; accepted inputs change the forecast; the golden questions in `spi/eval` give the same numbers as SQL; the safety refusal still works; start-up budget unchanged.
