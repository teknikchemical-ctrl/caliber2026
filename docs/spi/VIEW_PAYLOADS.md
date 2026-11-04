# View payloads (`GET /api/view/<name>`)
One payload per view. The page draws from it and the AI assistant reads the same payload, so words and charts agree. Shape: `{view, title, data_cutoff, insight, figures:[{id,label,value,unit,basis}], <series>, notes[], assumptions[], source_ids[]}`. `basis` is Data (counted), Estimate (calculated from the baseline) or Assumption (a default not in the data). Built in `server/_lib/views.mjs`; forecast results come from `res.*` (batch plans whose id starts `ai-batch:`).
| name | tab view | query |
|---|---|---|
| demand_predictability | Forecasting and Simulation: Demand predictability | none |
| portfolio_forecast | Portfolio forecast | none |
| decision_board | Decision board | none |
| parameters_shift | Parameters | none |
| cost_risk | Cost-risk optimiser | `budget_bn`, `mode=value|critical` |
| part_forecast | Part forecast | `material_no` |
Maintenance and Costs payloads are added below as they are built.
