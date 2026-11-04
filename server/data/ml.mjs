// GET /api/data/ml : the learned demand model (spi/ml/train.py): method, validation against the naive mean and Croston SBA, drivers and flaw counts. (owner: Claude A)
import { openDb } from "../_lib/db.mjs";
import { json, guard } from "../_lib/http.mjs";
export default guard((req, res) => {
  const db = openDb();
  const has = db.prepare("select 1 from sqlite_master where name='ml_model'").get();
  if (!has) return json(res, 200, { trained: false });
  const model = Object.fromEntries(db.prepare("select key, value from ml_model").all().map((r) => [r.key, JSON.parse(r.value)]));
  const evals = db.prepare("select * from ml_eval").all();
  const flags = db.prepare("select kind, count(*) n from ml_flag group by 1 order by n desc").all();
  const month = db.prepare("select month, round(sum(expected_qty)) qty, round(sum(p_issue)) parts from ml_forecast group by 1 order by 1").all();
  json(res, 200, { trained: true, model, evals, flags, projection: month, basis: "Estimate: learned from the 17 months of issues; validated on 5 held-out months" });
});
