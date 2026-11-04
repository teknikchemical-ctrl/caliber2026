// GET /api/data/architecture : the six sources, the joins and which table each feeds (static facts plus live counts). (owner: Claude A)
import { openDb } from "../_lib/db.mjs";
import { json, guard } from "../_lib/http.mjs";
export default guard((req, res) => {
  const db = openDb(), c = (t) => db.prepare(`select count(*) c from ${t}`).get().c;
  json(res, 200, {
    sources: [
      { file: "FuncLoc list.xlsx", table: "funcloc", rows: c("funcloc"), role: "Equipment criticality and failure history: the equipment tree with criticality S, A, B, C" },
      { file: "BoM.xlsx", table: "material + bom", rows: c("bom"), role: "Spare part master data and current inventory position: parts, installed quantity, Min, Max, stock, MRP type" },
      { file: "Movement Material.xlsx", table: "movement + demand_month", rows: c("movement"), role: "Consumption history: every issue, used for demand classification and forecasting" },
      { file: "Notif History.xlsx", table: "notification", rows: c("notification"), role: "Failure and maintenance requests per location: failure frequency and the order link to issues" },
      { file: "PR PO.xlsx", table: "po_line", rows: c("po_line"), role: "Procurement and lead time: dates, quantity, supplier, amount, used for lead-time statistics and unit price" },
      { file: "Mitem & Mplan.xlsx", table: "maint_item", rows: c("maint_item"), role: "Maintenance plan: known future work per location (next due dates) as a planned-demand driver" }],
    joins: [
      { from: "funcloc", to: "bom / notification / maint_item", on: "Functional Location", cardinality: "1:N" },
      { from: "bom", to: "movement / po_line", on: "Material No", cardinality: "1:N" },
      { from: "notification", to: "movement", on: "Order", cardinality: "1:N (about 16% of issues link)" },
      { from: "maint_item", to: "bom", on: "Functional Location (indirect: maintenance items carry no parts)", cardinality: "N:M through the location" }],
    derived: [{ table: "part_profile", what: "one row per part: demand class (ADI, CV2), criticality served, lead-time statistics, planned work due, stock value, excess" }, { table: "spec_family", what: "interchangeable parts by specification, or OEM parts pooled by item type and equipment class" }, { table: "dq_issue", what: "every data quality problem found, with the rule applied" }],
    principle: "No external data added: the six baseline files carry every driver the brief lists (consumption, failures, planned maintenance, lead time, criticality). Every added table is derived from them." });
});
