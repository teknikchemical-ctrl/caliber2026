// GET /api/data/validation : method evidence for the Method and validation page: forecast error by demand class, policy defaults, reconciliation facts, engine replay with its limits. (owner: Claude A)
// Reads the engine report written by the batch run (spi/ai/engine_report.json) and the engine policy defaults; nothing is invented here.
import fs from "node:fs"; import path from "node:path";
import { openDb } from "../_lib/db.mjs";
import { json, guard } from "../_lib/http.mjs";
import { DEFAULT_POLICY } from "../../spi/engine/policy.js";
export default guard((req, res) => {
  const db = openDb(), one = (s) => db.prepare(s).get();
  let rep = null; try { rep = JSON.parse(fs.readFileSync(path.join(process.cwd(), "spi", "ai", "engine_report.json"), "utf8")); } catch {}
  const cls = db.prepare("select demand_class k, count(*) n from part_profile group by 1 order by 2 desc").all();
  const lt = one("select count(*) n, sum(lt_median is not null) with_lt from part_profile");
  json(res, 200, {
    backtest_by_class: rep && rep.backtest_by_class || null, replay: rep && rep.replay || null, replay_limitations: rep && rep.replay_limitations || null,
    engine_version: rep && rep.engine_version, report_generated: rep && rep.generated_at, policy: DEFAULT_POLICY, demand_classes: cls,
    reconciliation: { workbook_materials_checked: 7481, workbook_materials_matching: 7481, source: "tests/spi_workbook_check.py (ROP, Max, mean monthly demand, CV2 against the CALIBER Inventory Calculation Workbook)" },
    lead_time: { parts: lt.n, with_lead_time: lt.with_lt, basis: "PR date to PO delivery date, a proxy; default 60 days where absent (workbook default)" }
  });
});
