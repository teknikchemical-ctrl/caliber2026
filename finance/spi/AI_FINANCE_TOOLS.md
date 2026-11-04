# Deterministic finance tools for Codex AI

Status: implemented on codex/finance. Finance owns the calculators and endpoint. Codex AI owns registration, routing, assistant wording and its evaluation. No AI-owned files were edited by Finance.

## Interface
- `GET /api/engine/finance-tools`: function declarations with strict parameter schemas.
- `POST /api/engine/finance-tools`: `{ "tool": "assess_cleanup_case", "args": { "release_realisation": 0.3 } }`.
- Pure injected API: `createFinanceTools({impact,source})` from `spi/engine/financeTools.js`; returns `{definitions,run(name,args)}`.
- Server-only ready context: `getFinanceContext()` from `server/engine/finance-tools.mjs`. It loads the same immutable batch snapshots as the app. No database mutation, SQL or external model calls.

Suggested registry integration, in AI-owned files:

```js
import {createFinanceTools} from '../engine/financeTools.js';
import {getFinanceContext} from '../../server/engine/finance-tools.mjs';
const finance = createFinanceTools(getFinanceContext());
// Append finance.definitions to existing declarations.
// After the existing argument guard, dispatch matching names through:
const result = finance.run(name, args);
```

Load the context lazily for finance calls, so unrelated assistant questions do not require finance snapshots. For an HTTP adapter, use POST for finance execution, unlike GET-only data endpoints. Do not place these handlers under api/. No router change is required.

## Tools and suggested questions
| Tool | Inputs | Example question |
|---|---|---|
| get_financial_summary | none | What is the cleanup NPV and is the annual operating balance positive? |
| forecast_inventory_budget | policy, criticality, demand_factor, price_factor, lead_factor | How much dynamic inventory funding is needed for A parts if demand rises 20%? |
| assess_cleanup_case | release_realisation, scope, annual_solution_cost_idr, oneoff_solution_cost_idr, horizon_years, discount | What share of B/C candidates must be realised for NPV break-even and recurring cash break-even? |
| assess_availability_funding | execution_share, annual_operational_benefit_idr OR contribution_margin_idr_hour plus avoided_downtime_hours_year | What annual operational benefit must justify funding half the current replenishment proposals? |

Every optional number is an explicit Assumption. `annual_solution_cost_idr` replaces the combined annual software, owner and evaluation budget. `oneoff_solution_cost_idr` replaces the complete one-off budget including contingency; it does not add another cost layer. Cleanup always excludes critical-review release, full availability orders and unverified operational benefits.

## Evidence and answer rules
Results contain a stable scenario/config-specific root `id`, a deterministic `answer`, compact `highlights` and `facts`. Each fact has its own `id`, `metric`, raw `value`, safe rounded `display`, `unit`, `basis`, `source`, `data_cutoff` and `missing_reason`. Root answer and display strings are compatible with the existing unsupported-number check. Use supplied displays rather than asking the model to divide, round or convert to billions. Cite the root ID or its fact IDs. Include IDs in the allowed citation set as for other tools.

Keep `highlights`, `answer`, `inputs` and limits when trimming the result for model context. Truncate lists as whole values; never cut serialized JSON. A null value is not zero. Read `missing_reason` to distinguish absent margin from a break-even threshold that is infeasible. Facts above the feasible realisation range must not be presented as attainable savings.

The existing assistant can dispatch the deterministic `answer` for a no-provider fallback. Add natural-language routing for NPV, cash balance, financial break-even, availability funding and inventory budget to these tools. Tool schemas and Finance tests do not establish that the deployed assistant is already wired. Finance requests that Codex AI adds end-to-end routing/citation tests and reports the integration commit.

## Financial interpretation
The base cleanup NPV break-even is about 14.96% realisation, but recurring cash break-even requires about 69.23%. These are different tests. The base uses 30% realisation, so positive project NPV does not imply a positive steady operating balance.

Availability funding is a standalone case: selected share of the current replenishment backlog, full solution costs, incremental cash holding, no cleanup release offset. The full case requires about IDR 81.09 bn of verified annual operational benefit for NPV break-even over the configured horizon. That amount is a threshold, not an estimated benefit. Do not compare it to whole-site forward repeat purchases as though both were the same scope.

No plant contribution margin is supplied. Avoided-hour thresholds are returned only if the caller explicitly supplies a hypothetical IDR/hour margin. Inputs cannot combine a generic annual benefit with a separate hours-times-margin benefit. Critical insurance remains protected; S/A are never auto-released. No rush-order premium, PO-spend saving or price-standardisation benefit is counted. Economic carrying costs are not added to cash savings.

## Validation and refresh
`node tests/spi_engine_finance_tools.js` tests exact NPV and recurring thresholds, unavailable and infeasible cases, availability break-even, double-count guards, stable citations, missing prices, argument rejection, source immutability and current AI numeric validation compatibility.

Refresh sources through the full rules batch and `node finance/spi/build_impact.mjs`. Finance tools read the generated runtime copies under spi/engine. Do not hand-edit JSON or modify shared results.sqlite from a tool call.
