// GET /api/data/campaigns : detected shutdown campaigns in the history, uplift by item type, and the planned maintenance load for the next 12 months. (owner: Claude A)
import { openDb } from "../_lib/db.mjs";
import { json, guard, qs, num } from "../_lib/http.mjs";
import { campaignModel } from "../../spi/drivers/campaign.mjs";
export default guard((req, res) => { const q = qs(req); json(res, 200, campaignModel(openDb(), { index: num(q.index, 1.6, 1.2, 3) })); });
