// Tests for Claude A's data layer: schema, row counts against the raw files, API handlers against the fixture or the full database.
// Usage: node tests/spi_data.js [fixture|full]   (default fixture: handlers run on spi/fixtures/mini.sqlite)
const path = require("path"), fs = require("fs"), assert = require("assert");
const mode = process.argv[2] || "fixture", ROOT = path.resolve(__dirname, "..");
process.env.SPI_DB = path.join(ROOT, mode === "full" ? "spi/db/spi.sqlite" : "spi/fixtures/mini.sqlite"); process.env.SPI_RES = "/nonexistent";
const run = async (file, query = {}) => { const m = await import(path.join(ROOT, file)); return new Promise(r => { const res = { statusCode: 200, h: {}, setHeader(k, v) { this.h[k] = v; }, end(b) { r({ s: this.statusCode, j: JSON.parse(b) }); } }; m.default({ url: "/x?" + new URLSearchParams(query), query }, res); }); };
let n = 0; const ok = (c, m) => { assert.ok(c, m); n++; console.log("ok  ", m); };
(async () => {
  const D = require("better-sqlite3"), db = new D(process.env.SPI_DB, { readonly: true });
  const cnt = t => db.prepare(`select count(*) c from ${t}`).get().c;
  if (mode === "full") {
    ok(cnt("material") === 7481 && cnt("movement") === 17518 && cnt("notification") === 5795 && cnt("po_line") === 11609 && cnt("maint_item") === 10153 && cnt("funcloc") === 14484, "row counts equal the raw files");
    ok(cnt("bom") === 20423, "BoM: 20,653 rows minus 230 duplicates");
    ok(cnt("part_profile") === cnt("material"), "every part has a profile");
    ok(db.prepare("select count(*) c from movement where material_no not in (select material_no from material)").get().c === 0, "every issue joins to a part");
    ok(db.prepare("select sum(n_issues) s from demand_month").get().s === 17518, "demand_month holds every issue");
  }
  ok(db.prepare("pragma foreign_key_check").all().length === 0, "foreign keys resolve");
  ok(db.prepare("select count(*) c from dq_issue").get().c > 10, "data quality log is filled");
  let r = await run("server/data/health.mjs"); ok(r.s === 200 && r.j.ok && r.j.parts > 100, "health endpoint reads the database");
  r = await run("server/data/summary.mjs"); ok(r.s === 200 && r.j.parts.parts > 100 && r.j.by_criticality.length >= 3 && r.j.by_demand_class.length >= 4, "summary has KPIs, criticality and demand classes");
  r = await run("server/data/parts.mjs", { limit: "5", sort: "demand" }); ok(r.s === 200 && r.j.rows.length === 5 && r.j.total > 100, "parts list pages");
  const top = r.j.rows[0].material_no;
  r = await run("server/data/parts.mjs", { q: "BEARING", limit: "3" }); ok(r.j.rows.every(x => /BEARING/.test(x.descr)), "parts text search");
  r = await run("server/data/parts.mjs", { q: "'; drop table material;--" }); ok(r.s === 200 && r.j.total === 0, "search text is parameterised");
  r = await run("server/data/part/[id].mjs", { id: String(top) }); ok(r.s === 200 && r.j.series.length === 17 && r.j.part.material_no === top && Array.isArray(r.j.served_by_bom), "part detail has a 17-month series and equipment served");
  r = await run("server/data/part/[id].mjs", { id: "1" }); ok(r.s === 404 && r.j.error, "unknown part gives a readable 404");
  const tag = db.prepare("select funcloc from bom limit 1").get().funcloc;
  r = await run("server/data/equipment/[tag].mjs", { tag }); ok(r.s === 200 && r.j.parts.length > 0, "equipment endpoint lists its parts");
  r = await run("server/data/dq.mjs"); ok(r.s === 200 && r.j.issues.length > 10 && r.j.counts.material > 100, "dq endpoint");
  r = await run("server/data/architecture.mjs"); ok(r.s === 200 && r.j.sources.length === 6 && r.j.joins.length >= 4, "architecture endpoint lists six sources");
  r = await run("server/data/stock-health.mjs"); ok(r.s === 200 && r.j.summary.length === 9 && r.j.summary.every(c => c.parts >= 0), "stock health summary has nine categories");
  r = await run("server/data/stock-health.mjs", { cat: "excess", limit: "5" }); ok(r.s === 200 && r.j.rows.length > 0 && r.j.rows.every(x => x.stock > x.max_qty && x.max_qty > 0), "excess rows are above Max");
  r = await run("server/data/stock-health.mjs", { cat: "insurance", crit: "S", limit: "5" }); ok(r.s === 200 && r.j.rows.every(x => x.crit_max === "S" && x.months_active === 0), "insurance spares are S critical with no demand");
  r = await run("server/data/stock-health.mjs", { cat: "bogus" }); ok(r.s === 400 && r.j.error, "unknown category gives a readable 400");
  r = await run("server/data/campaigns.mjs"); ok(r.s === 200 && r.j.history.length === 17 && r.j.campaign_months.length >= 2 && r.j.outlook.length >= 12 && r.j.overall_uplift > 2, "campaign model finds the shutdown months and the planned load outlook");
  const cm = await import(path.join(ROOT, "spi/drivers/campaign.mjs")), dbm = new D(process.env.SPI_DB, { readonly: true }), pm = dbm.prepare("select material_no from part_profile where months_active>=3 limit 1").get().material_no, inp = cm.campaignInputs(dbm, pm);
  ok(Array.isArray(inp) && inp.every(i => i.source === "rule" && i.driver === "turnaround" && i.value >= 1 && i.value <= 3 && i.evidence.length), "campaign inputs are ledger rows with source rule, bounded value and evidence");
  r = await run("server/data/locations.mjs", { limit: "5", crit: "S", parts: "1" }); ok(r.s === 200 && r.j.rows.length === 5 && r.j.rows.every(x => x.criticality === "S" && x.n_parts > 0) && r.j.facets.by_criticality.length >= 4, "locations list filters by criticality and has facets");
  r = await run("server/data/locations.mjs", { q: "KT-383A", facets: "0" }); ok(r.s === 200 && r.j.rows.some(x => x.tag === "KT-383A" || mode === "fixture"), "location search by tag");
  r = await run("server/data/maintenance.mjs"); ok(r.s === 200 && r.j.kpis.total > 100 && r.j.by_month.length >= 10 && r.j.planned.by_month.length >= 6, "maintenance summary");
  r = await run("server/data/maintenance.mjs", { list: "1", status: "In Progress", limit: "5" }); ok(r.s === 200 && r.j.rows.every(x => x.status === "In Progress"), "notification list filters by status");
  r = await run("server/data/projection.mjs", { by: "crit" }); ok(r.s === 200 && r.j.groups.length >= 3 && r.j.groups[0].projection.length === 12 && r.j.groups[0].history.length === 17, "projection has 17 months of history and 12 projected months per group");
  r = await run("server/data/savings.mjs"); ok(r.s === 200 && r.j.categories.length === 6 && r.j.gross_release_candidates_idr > 0 && r.j.categories.filter(c => c.counted_in_total).every(c => c.by_criticality.every(b => b.crit !== "S" && b.crit !== "A")), "savings never count S and A parts as release");
  const rt = (await import(path.join(ROOT, "api/router.mjs"))).default, viaRouter = (url) => new Promise(r => { const res = { statusCode: 200, setHeader() {}, end(b) { r({ s: this.statusCode, j: JSON.parse(b) }); } }; rt({ url }, res); });
  r = await viaRouter("/api/router?path=data%2Fhealth"); ok(r.s === 200 && r.j.ok, "router: Vercel rewrite form /api/router?path=data/health");
  r = await viaRouter("/api/data/health"); ok(r.s === 200 && r.j.ok, "router: plain path form");
  r = await viaRouter("/api/router?path=data%2Fpart%2F" + top); ok(r.s === 200 && r.j.part.material_no === top, "router: dynamic segment (part id) through the rewrite");
  r = await viaRouter("/api/router?path=data%2Flocations&crit=S&limit=2"); ok(r.s === 200 && r.j.rows.length === 2, "router: query string is passed through the rewrite");
  r = await viaRouter("/api/router?path=nothing%2Fhere"); ok(r.s === 404 && r.j.error, "router: unknown endpoint gives a JSON 404");
  console.log(`\nAll ${n} data checks passed (${mode})`);
})().catch(e => { console.error("FAIL", e.message); process.exit(1); });
