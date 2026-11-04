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
| maintenance_population | Maintenance: Equipment and failures | none |
| maintenance_driven_demand | Maintenance: Maintenance-driven demand | none |
| turnaround_readiness | Maintenance: Turnaround readiness | none |
| open_work_exposure | Maintenance: Open work and spares | none |
| cost_balance | Costs: Cost-risk balance | `holding_rate`, `loss_scale` |
| savings_waterfall | Costs: Cost reduction | `realisation`, `sa_share`, `holding_rate` |
| cash_plan | Costs: Cash plan | `realisation`, `sa_share`, `pay_lag`, `release_months`, `release_start`, `budget_bn`, `holding_rate` |
| business_scorecard | Costs: Business impact | same as cash_plan, `loss_scale` |
Database: forecast results are read from `spi/db/views.sqlite` (validated plans only, built by `tools/spi_slim_results.py`; the 168 MB `results.sqlite` is never committed). Tests: `node tests/spi_views.js`.
