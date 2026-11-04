// GET /api/data/health : proves the function runs, the database file is deployed and readable. (owner: Claude A)
import { openDb, DB_PATH, hasRes, DRIVER } from "../_lib/db.mjs";
import { json } from "../_lib/http.mjs";
export default function handler(req, res) {
  const out = { ok: false, node: process.version, db_path: DB_PATH.replace(process.cwd(), "."), results_db: hasRes(), driver: DRIVER, commit: (process.env.VERCEL_GIT_COMMIT_SHA || "").slice(0, 7) || null };
  try {
    const db = openDb();
    out.tables = db.prepare("select count(*) c from sqlite_master where type='table'").get().c;
    out.meta = Object.fromEntries(db.prepare("select key, value from meta").all().map(r => [r.key, r.value]));
    out.parts = db.prepare("select count(*) c from material").get().c;
    out.ok = true;
    return json(res, 200, out);
  } catch (e) { out.error = String(e.message || e).slice(0, 200); res.statusCode = 500; res.setHeader("content-type", "application/json"); return res.end(JSON.stringify(out)); }
}
