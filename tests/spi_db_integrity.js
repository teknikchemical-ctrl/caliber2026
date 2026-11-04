// Database integrity and enrichment (owner: Claude A). Usage: node tests/spi_db_integrity.js
// SQLite integrity and foreign keys, no orphan records across the six sheets, the shared views (po_line_unique, notification_x,
// part_price), the price model against its baseline, the location hierarchy, the data quality register and the data dictionary.
const path = require("path"), ROOT = path.resolve(__dirname, "..");
process.env.SPI_DB = path.join(ROOT, "spi/db/spi.sqlite");
let n = 0, bad = []; const ok = (c, m) => { if (c) { n++; console.log("ok  ", m); } else { bad.push(m); console.log("FAIL", m); } };
(async () => {
  const { openDb } = await import(path.join(ROOT, "server/_lib/db.mjs")), db = openDb(), c = (s) => db.prepare(s).get().n;
  ok(db.pragma("integrity_check", { simple: true }) === "ok", "SQLite integrity check passes");
  ok(db.pragma("foreign_key_check").length === 0, "no foreign key violations");
  for (const [t, col, ref, rc] of [["movement", "material_no", "material", "material_no"], ["bom", "material_no", "material", "material_no"], ["bom", "funcloc", "funcloc", "funcloc"], ["notification", "funcloc", "funcloc", "funcloc"], ["maint_item", "funcloc", "funcloc", "funcloc"], ["po_line", "material_no", "material", "material_no"], ["part_equipment", "funcloc", "funcloc", "funcloc"]])
    ok(c(`select count(*) n from ${t} where ${col} is not null and ${col} not in (select ${rc} from ${ref})`) === 0, `no orphan ${t}.${col}`);
  ok(c("select count(*) n from movement where qty <= 0") === 0 && c("select count(*) n from material where stock < 0") === 0, "no non-positive issue quantities, no negative stock");
  // shared views
  const pu = db.prepare("select count(*) n, sum(copies) c, sum(value_idr) v from po_line_unique").get(), raw = c("select count(*) n from po_line");
  ok(pu.c === raw && pu.n === 6189, `po_line_unique: ${pu.n} lines, copies add back to the ${raw} rows of the sheet`);
  ok(Math.abs(pu.v / 1e9 - 1634.2) < 1, `po_line_unique: purchase value IDR ${Math.round(pu.v / 1e9)} bn (quantity x unit price)`);
  const nx = db.prepare("select count(*) n, sum(opening_backlog) b, sum(still_open) o from notification_x").get();
  ok(nx.n === c("select count(*) n from notification") && nx.b === 1463, `notification_x: every notification, ${nx.b} flagged as the opening backlog, ${nx.o} open`);
  const pp = db.prepare("select count(*) n, sum(price_idr > 0) p, sum(basis like 'PO%') po from part_price").get();
  ok(pp.n === c("select count(*) n from material") && pp.p === pp.n && pp.po === 1229, `part_price: a price for all ${pp.n} parts, ${pp.po} from PO lines`);
  // price model
  const M = Object.fromEntries(db.prepare("select key, value from ml_model").all().map((r) => [r.key, JSON.parse(r.value)]));
  ok(M.price_cv_median_abs_error < M.price_baseline_median_abs_error && M.price_cv_within_2x > M.price_baseline_within_2x, `price model beats the item-type median on held-out parts (${M.price_cv_median_abs_error} against ${M.price_baseline_median_abs_error})`);
  ok(c("select count(*) n from ml_price where basis like 'PO%' and price_idr <> price_low_idr") === 0 && c("select count(*) n from ml_price where basis like 'est%' and not (price_low_idr < price_idr and price_idr < price_high_idr)") === 0, "PO prices are kept as they are; every estimate has a low and high around it");
  // hierarchy
  ok(c("select count(*) n from funcloc where parent is not null") > 1000 && c("select count(*) n from funcloc f where parent is not null and parent not in (select funcloc from funcloc)") === 0 && c("select count(*) n from funcloc where parent = funcloc") === 0, "funcloc.parent links to an existing location and never to itself");
  // register and dictionary
  ok(c("select count(*) n from dq_issue") >= 35 && c("select count(*) n from (select issue from dq_issue group by issue having count(*) > 1)") === 0, "data quality register holds the findings once each");
  const tv = db.prepare("select name from sqlite_master where type in ('table','view') and name not like 'sqlite_%'").all().map((r) => r.name), dd = new Set(db.prepare("select distinct table_name t from data_dictionary").all().map((r) => r.t));
  ok(tv.every((t) => dd.has(t)), "every table and view is in the data dictionary " + tv.filter((t) => !dd.has(t)).join(" "));
  ok(!!db.prepare("select 1 from sqlite_master where name='sqlite_stat1'").get(), "planner statistics present (ANALYZE)");
  // engine reads the same data both ways
  const { golden } = await import(path.join(ROOT, "server/data/golden.mjs")), g = golden(db, {}), ge = golden(db, { prices: "estimated" });
  ok(g.inputs.prices === "po" && ge.inputs.prices === "estimated" && ge.totals.current.working_capital > g.totals.current.working_capital, "engine: PO prices by default, prices=estimated adds the learned estimates");
  console.log(bad.length ? bad.length + " failed" : n + " database checks passed"); if (bad.length) process.exitCode = 1;
})();
