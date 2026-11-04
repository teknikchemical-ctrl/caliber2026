// GET /api/data/equipment/<tag or funcloc> : one location with its parts, recent notifications and planned maintenance. (owner: Claude A)
import { openDb } from "../../_lib/db.mjs";
import { json, fail, guard, qs } from "../../_lib/http.mjs";
import { equipmentAnswer } from "../../_lib/equip.mjs";
export default guard((req, res) => { const t = String(qs(req).tag || "").slice(0, 120); if (!t) return fail(res, 400, "tag required"); const a = equipmentAnswer(openDb(), t); return a ? json(res, 200, a) : fail(res, 404, "location not found in the baseline data"); });
