// GET /api/data/location?funcloc=<funcloc or tag> : same answer as /api/data/equipment/<tag>, with the key in the query so locations containing slashes work. (owner: Claude A)
import { openDb } from "../_lib/db.mjs";
import { json, fail, guard, qs } from "../_lib/http.mjs";
import { equipmentAnswer } from "../_lib/equip.mjs";
export default guard((req, res) => { const t = String(qs(req).funcloc || "").slice(0, 160); if (!t) return fail(res, 400, "funcloc required"); const a = equipmentAnswer(openDb(), t); return a ? json(res, 200, a) : fail(res, 404, "location not found in the baseline data"); });
