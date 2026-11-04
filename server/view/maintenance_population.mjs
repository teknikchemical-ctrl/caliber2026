// GET /api/view/maintenance_population : view payload (see server/_lib/views.mjs). (owner: Claude A)
import { openDb } from "../_lib/db.mjs";
import { json, guard, qs } from "../_lib/http.mjs";
import { VIEWS } from "../_lib/views.mjs";
export default guard((req, res) => json(res, 200, VIEWS.maintenance_population(openDb(), qs(req))));
