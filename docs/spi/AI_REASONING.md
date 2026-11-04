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

## M1 implementation notes (Codex AI)
- Modules in `spi/ai` use ES modules via their own package.json; the root package remains unchanged. Entry points are `evidence(db, material_no)`, `rulesPlan(pack)`, `validatePlan(plan, pack, {ai})`, and async `planPart(pack, {adapter, signal})`. Provider interface remains as above.
- Evidence is bounded to 6,000 JSON characters (an approximate token budget), with whole optional facts removed and `truncated=true` when needed. Profiles, the zero-filled series, policy and lead-time basis are retained. Prompts delimit and escape untrusted evidence. The baseline is labelled synthetic.
- Historical lead-time evidence excludes negative values, values above the contract bound, and delivery dates after the data cutoff. Delivery dates are not represented as confirmed goods receipt. Family or plant fallback is labelled Assumption. The database is not changed.
- Weak `G|` families and OEM-specific `T|` families are not automatic pooling or substitution evidence. Critical no-demand parts remain protected even when the available lead time is short. Large multipliers require different evidence origins; multiple IDs from one origin and derived profile statistics do not satisfy independence.
- No engine or backtest is implemented in this layer. Pending integration must not claim that a stub forecast or backtest is a measured result. Model, parser or validation trouble returns the validated rules plan and a visible reason in trace.

## Interactive plan and chart integration
`executePlan({db,material_no,adapter?,engine?,inputs_accepted?})` is the single orchestration boundary. Production loads `spi/engine/index.js` using a literal import so Vercel can trace its dependencies. It calls `contextFor(db,id)` when available, `backtest(plan,context)` and `runPlan(plan,context)`. The rules and candidate plans are evaluated with the same backtest function; candidate error must be within 10% of the actual rules-plan error over four origins. Missing or unscorable backtests do not count as passing. The orchestration owns adoption and passes `enforce_backtest:false` to avoid a second, differently parameterised engine baseline silently replacing the selected method. Engine output is schema-checked and must match the material, selected method, horizon, future months and ordered nonnegative quantiles.

AI inputs remain proposed in the returned ledger. They do not change the executed forecast until the browser explicitly accepts and resends them; every accepted input is revalidated server-side. Rejected inputs are not executed. Data/rule campaign drivers from `spi/drivers/campaign.mjs` enter the evidence pack with `campaign:<month>` and `itemtype:<TYPE>` ids, and appear in the rules ledger with their estimated basis. Future-driver scenarios are not claimed to be validated by a method-only historical backtest.

The Forecast page calls `/api/ai/plan` and plots `result.forecast` directly. Chart bands, line and table share exactly the same response values; the page calculates no forecasts. A missing engine returns `status:engine_pending,result:null` with the validated plan and trace. It never substitutes zeros or a synthetic production prediction. Tests may inject a clearly labelled synthetic engine, or a separately archived published engine candidate, without changing production files.

## Ask implementation
`ask({db,question,history,inputs_accepted,adapter,signal,onEvent})` calls validated read-only tools, at most five times. A fixed SQL metric catalogue answers baseline totals without accepting SQL from a model or user. The catalogue also supports independent golden evaluation; production never imports golden answers. Additional tools wrap the data and engine handlers in-process against their shared read-only connection. Interactive optimisation is limited to fifty selected materials. Tool outputs are untrusted structured JSON; budgeting retains valid JSON, rather than cutting serialized text. Model answers require retrieved citations and supported numbers. Provider, malformed-output, citation and numeric failures use the available SQL/tool answer and record the reason.

`server/ai/ask.mjs` streams NDJSON trace, delta, inputs, result and done events. The Ask page and the existing assistant in SPI mode share this transport. Proposed adjustments stay source ai, status proposed. Accept sends them to the plan endpoint, which validates them again and reruns the engine. Vercel is read-only, so interactive ledgers remain in the response/browser. The Forecast base page is preserved; SPI_FORECAST_HOOKS adds a labelled selected-plan chart and reasoning panel alongside the rules forecast.

## Offline persistence
`spi/ai/batch.js` uses the real orchestration and engine for every material, with AI eligibility limited to demand-bearing or S/A parts. It writes all six result-contract tables in one transaction per part, without modifying the baseline database or deleting other writers' rows. Namespaced run/plan/input IDs avoid portfolio collisions. Resume requires a complete selected plan, forecast horizon, inventory and recommendation. Baseline content, AI/engine/contracts/driver code and provider/model settings are fingerprinted; changed inputs receive a new batch identity. Trace retains the complete validated plan, candidate, ledger with original input IDs and engine identity. Failed writes roll back before recording failure; retries repair incomplete runs. Token usage is logged and labelled incomplete when provider trouble prevents reliable accounting.

## Typed data boundary (brief 2)
`dataFor(db)` in spi/ai/data.js provides bounded per-connection caching over parameterised read-only queries. `createData(db,{cacheSize})` supports both SQLite drivers using prepare/get/all only. Material stock and classification come from part_profile; locations use location_profile and explicitly mark stock values non-additive. Numeric missing values remain null with a Not in baseline data display value. Quality flags reference part_profile.dq_flags and dq_issue; every logical record carries cut-off, source IDs, units and assumptions. Unit price is the last usable IDR PO item amount interpreted as a unit price (Estimate). Inventory position is on-hand only, criticality order is assumed and no record authorises disposal. Non Stock holdings, Max 0 and no-demand S/A reserves are protected from release-candidate arithmetic.

The evidence pack projects these typed objects into its existing compact contract. Tools use the same layer for profiles, searches, demand, procurement, maintenance schedules and scalar metrics. Baseline profile procurement statistics remain explicitly labelled proxies. Planning uses only completed-by-cutoff proxy intervals in 1 to 365 days, reports own/pool sample counts, and labels family/plant fallbacks Assumption. Descriptions remain untrusted data even after professional formatting. Tests reconcile all material values and prices, all golden metrics and the independent workbook; the native node:sqlite path is exercised.

## Typed aggregate and engine tools
Locations, one location, maintenance, projection, savings, stock health and campaigns wrap the existing read endpoints and pass through the typed result boundary. Engine forecast uses the validated orchestration; optimise and simulate use documented engine handlers with at most fifty selected parts. The engine report is generated by the Fin batch and published in spi/ai/engine_report.json. Generated reports are excluded from runtime code fingerprints. Tool records carry evidence, units, quality, cut-off and assumptions; lists are capped and marked when truncated. Material rows retain baseline on-hand context and explicitly deny automatic disposal permission.

The procurement findings tool computes IDR PO spend, issued value, stock value and within-material relative unit-price bands by fixed SQL. It exposes the lack of a supported rush-price saving as a policy conclusion, not achieved cash. Spend is not consumption or a savings basis. Answers append relevant procurement-proxy, assumed-criticality, on-hand-only and synthetic-estimate cautions. Comma-separated numbers are normalised before the number check, so formatting cannot bypass it or reject a supported thousands value. Unsafe model answers are rejected even when the user question itself is safe.

## Context and chart response contract
`resolveContext(question,history,context)` accepts only material_no, funcloc and page selectors. Explicit entities override the selected page; bounded previous user turns resolve pronouns and follow-ups. It does not infer selectors from database instructions or assistant text. Unknown context fields receive a readable 400 before streaming. The existing assistant's u/a roles are normalised to user/assistant. Its abort signal cancels the shared NDJSON transport.

`chartsFromTools` projects only retrieved tool values into bounded line, bar or rules-value-projection specifications. Every chart has units, source IDs and cut-off. History and future projection phases are distinct. Mixed-unit plant quantities are not plotted as material demand: campaign charts use distinct issue orders and planned-item counts separately. Savings categories are mutually exclusive; stock-health categories and location indicators are labelled overlapping/non-additive. Material prediction and uncertainty remain the validated engine result. Gemini output cannot introduce chart specifications; model-supplied chart fields are rejected by the answer schema. Ask and the legacy panel render these sourced charts through spiCore.

Prompt-injection regression tests poison actual copied material descriptions and notification text. They verify delimiter escaping, rejected free-SQL calls, no database mutation, rejected fake citations, unsafe plans/answers/rationales, and rejection of model-invented charts. Protective-function safety checks apply to generated text as well as the user question. These are executable boundary tests, not a claim that every future prompt is known in advance.
