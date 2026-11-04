// GET /api/view/parameters_shift : view payload (see server/_lib/views.mjs). (owner: Claude A)
import { openDb } from "../_lib/db.mjs";
import { json, guard, qs } from "../_lib/http.mjs";
import { VIEWS } from "../_lib/views.mjs";
export default guard((req, res) => json(res, 200, VIEWS.parameters_shift(openDb(), qs(req))));
