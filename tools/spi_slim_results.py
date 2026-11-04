#!/usr/bin/env python3
"""Builds spi/db/views.sqlite: the part of the batch results (results.sqlite) that the view payloads read, for the validated plans only (plan id starts 'ai-batch:').
Run after node spi/ai/restore_results.js. The slim file is committed; results.sqlite (168 MB) is not. (owner: Claude A)"""
import sqlite3, os, sys
root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
src, dst = os.path.join(root, 'spi/db/results.sqlite'), os.path.join(root, 'spi/db/views.sqlite')
if not os.path.exists(src): sys.exit('run node spi/ai/restore_results.js first')
if os.path.exists(dst): os.remove(dst)
c = sqlite3.connect(dst); c.execute("attach database ? as s", (src,))
c.executescript("""
create table forecast_plan as select plan_id, material_no, method, horizon_months, service_level, lead_time_days, rationale, confidence, validated, validator_notes, backtest_json, adopted from s.forecast_plan where plan_id like 'ai-batch:%';
create table forecast as select plan_id, material_no, month, round(p10,2) p10, round(p50,2) p50, round(p90,2) p90 from s.forecast where plan_id like 'ai-batch:%';
create table inventory_param as select plan_id, material_no, safety_stock, reorder_point, min_qty, max_qty, order_qty, service_level, lt_demand_mean, lt_demand_sd, cur_min, cur_max, cur_stock from s.inventory_param where plan_id like 'ai-batch:%';
create table recommendation as select plan_id, material_no, action, urgency, stockout_risk, overstock_risk, slow_flag, dead_flag, insurance_spare, order_qty, order_by, exposure_idr, holding_cost_idr_yr, release_idr, rationale, source from s.recommendation where plan_id like 'ai-batch:%';
create table forecast_input as select input_id, material_no, scope, target, driver, effect, value, unit, period_start, period_end, source, confidence, rationale, status from s.forecast_input;
create index ix_f_m on forecast(material_no); create index ix_p_m on forecast_plan(material_no); create index ix_i_m on inventory_param(material_no); create index ix_r_m on recommendation(material_no); create index ix_fi_m on forecast_input(material_no);
""")
c.commit(); c.execute("attach database ? as s2", (src,)); c.execute("vacuum"); c.close()
print('written', dst, round(os.path.getsize(dst)/1e6,1), 'MB')
