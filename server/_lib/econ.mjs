// The one set of economic assumptions (spi/contracts/econ_assumptions.json), in the shape the endpoints use. (owner: Claude A)
import fs from "node:fs";
const raw = JSON.parse(fs.readFileSync(new URL("../../spi/contracts/econ_assumptions.json", import.meta.url), "utf8"));
const v = (k) => raw[k].value;
const day = v("downtime_idr_day");
export const ECON = Object.freeze({
  carrying_rate: v("carrying_rate"), cash_holding_rate: v("cash_holding_rate"), order_cost_idr: v("order_cost_idr"), emergency_premium: v("emergency_premium"),
  lead_default: v("lead_default_days"), service: { ...v("service") }, downtime_idr_day: { ...day },
  downtime_idr_h: Object.fromEntries(Object.entries(day).map(([k, x]) => [k, x / 24])), hours_per_stockout: { ...v("hours_per_stockout") }, downtime_share: { ...v("downtime_share") },
});
export const ECON_RAW = raw;
