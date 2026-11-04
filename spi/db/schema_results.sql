-- SPI results schema (contract). Owner: Codex AI (ai_run, forecast_input, forecast_plan) and Codex Fin (forecast, inventory_param, recommendation); the batch script writes the file spi/db/results.sqlite.
-- Separate file so that Claude A's spi.sqlite commits never collide with batch result commits. The API attaches it: ATTACH DATABASE 'spi/db/results.sqlite' AS res. Interactive results are never written here (Vercel is read-only): they travel in the response and live in the browser.
-- material_no refers to spi.sqlite material(material_no) (no foreign key across files).
PRAGMA foreign_keys=ON;
CREATE TABLE ai_run(                     -- one row per AI reasoning run (batch per part, or one interactive question)
  run_id TEXT PRIMARY KEY, created_at TEXT, mode TEXT CHECK(mode IN('batch','interactive','rules')), provider TEXT, model TEXT,
  question TEXT, scope_json TEXT, status TEXT, prompt_hash TEXT, tokens_in INTEGER, tokens_out INTEGER, trace_json TEXT
);
CREATE TABLE forecast_input(             -- the ledger: every driver that moves a forecast, with its source. AI proposals land here as source='ai'.
  input_id TEXT PRIMARY KEY, run_id TEXT, material_no INTEGER, scope TEXT, target TEXT,       -- scope: 'part' | 'family' | 'funcloc' | 'plant'
  driver TEXT CHECK(driver IN('pm_due','turnaround','failure_rate','lead_time','demand_uplift','demand_cut','one_off','obsolescence','price','criticality_override')),
  effect TEXT CHECK(effect IN('add_qty','multiply','set_lead_days','set_service_level','set_zero_after')), value REAL, unit TEXT,
  period_start TEXT, period_end TEXT, source TEXT CHECK(source IN('data','rule','ai','user')), confidence REAL, rationale TEXT, evidence_json TEXT,
  status TEXT CHECK(status IN('proposed','accepted','rejected')) DEFAULT 'proposed'
);
CREATE TABLE forecast_plan(              -- what the reasoning agent decided for a part (validated JSON, see spi/contracts/forecast_plan.schema.json)
  plan_id TEXT PRIMARY KEY, run_id TEXT, material_no INTEGER, method TEXT, params_json TEXT, horizon_months INTEGER,
  service_level REAL, lead_time_days REAL, rationale TEXT, confidence REAL, validated INTEGER, validator_notes TEXT,
  backtest_json TEXT, adopted INTEGER       -- adopted=0 when the plan lost to the rules baseline in the backtest
);
CREATE TABLE forecast(                   -- monthly forecast per plan (p10 p50 p90)
  plan_id TEXT, material_no INTEGER, month TEXT, p10 REAL, p50 REAL, p90 REAL, PRIMARY KEY(plan_id, month)
);
CREATE TABLE inventory_param(            -- dynamic stock parameters computed by the engine from a plan
  plan_id TEXT PRIMARY KEY, material_no INTEGER, safety_stock REAL, reorder_point REAL, min_qty REAL, max_qty REAL, order_qty REAL,
  service_level REAL, lt_demand_mean REAL, lt_demand_sd REAL, cur_min REAL, cur_max REAL, cur_stock REAL, basis_json TEXT
);
CREATE TABLE recommendation(
  plan_id TEXT PRIMARY KEY, material_no INTEGER,
  action TEXT CHECK(action IN('REORDER','REDUCE','MAINTAIN','MONITOR','REVIEW_OBSOLETE','KEEP_INSURANCE')), urgency INTEGER,   -- 1 high .. 3 low
  stockout_risk REAL, overstock_risk REAL, slow_flag INTEGER, dead_flag INTEGER, insurance_spare INTEGER,
  order_qty REAL, order_by TEXT, exposure_idr REAL, holding_cost_idr_yr REAL, release_idr REAL, rationale TEXT, source TEXT   -- source: 'rules' | 'ai'
);

CREATE INDEX ix_fi_mat ON forecast_input(material_no); CREATE INDEX ix_rec_act ON recommendation(action);
