// GET /api/data/dq : data quality log and table counts for the Data and architecture page. (owner: Claude A)
import { openDb } from "../_lib/db.mjs";
import { json, guard } from "../_lib/http.mjs";
export default guard((req, res) => {
  const db = openDb(), all = (s) => db.prepare(s).all();
  const counts = Object.fromEntries(["funcloc", "material", "bom", "movement", "notification", "maint_item", "po_line", "demand_month", "part_equipment", "part_profile", "spec_family"].map(t => [t, db.prepare(`select count(*) c from ${t}`).get().c]));
  json(res, 200, { counts, issues: all("select table_name, issue, severity, detail, action from dq_issue order by case severity when 'error' then 1 when 'warn' then 2 else 3 end, table_name"), meta: Object.fromEntries(all("select key, value from meta").map(r => [r.key, r.value])) });
});
