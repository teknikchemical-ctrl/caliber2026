// Writes the AI projection review into spi/db/spi.sqlite as table ml_review (owner: Claude A), so every tool that reads learned demand
// (Claude B's server/ws/* through portfolioParts) can read the reviewed demand: mu_reviewed and sd_reviewed per part, with the basis,
// factor, insurance decision and reason. Run after spi/ml/train.py and train_more.py: node tools/spi_review_bake.mjs
import Database from "better-sqlite3";
import path from "node:path";
const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const { openDb } = await import(path.join(ROOT, "server/_lib/db.mjs")), { golden, LAST_REVIEW } = await import(path.join(ROOT, "server/data/golden.mjs"));
const g = golden(openDb(), { runs: "20" }), db = new Database(process.env.SPI_DB || path.join(ROOT, "spi/db/spi.sqlite"));
const ml = new Map(db.prepare("select material_no, mu, sd from ml_part").all().map((r) => [r.material_no, r]));
db.exec("drop table if exists ml_review; create table ml_review (material_no integer primary key, basis text, factor real, insurance integer, mu_reviewed real, sd_reviewed real, flags text, reason text)");
const ins = db.prepare("insert into ml_review values (?,?,?,?,?,?,?,?)"); let n = 0;
db.transaction(() => { for (const [m, r] of LAST_REVIEW) { const x = ml.get(m) || { mu: 0, sd: 0 }, hb = r.basis === "history", mu = hb ? r.hist12 : (x.mu || 0) * r.factor, sd = hb ? Math.sqrt(r.hist12 || 0) : (x.sd || 0) * r.factor;
  ins.run(m, r.basis, r.factor, r.insurance ? 1 : 0, Math.round(mu * 1e4) / 1e4, Math.round(sd * 1e4) / 1e4, r.flags.map((f) => f.code).join(","), r.reason); n++; } })();
try { db.prepare("delete from data_dictionary where table_name='ml_review'").run(); db.prepare("insert into data_dictionary values (?,?,?,?)").run("ml_review", "", "AI projection review per part: demand basis, factor, insurance spare, reviewed monthly mean and spread (Estimate)", n); } catch { }
db.close(); console.log("ml_review rows", n, "| review:", g.review.text.slice(0, 160));
