// Shared read-only database helper for every handler (owner: Claude A).
// Driver: better-sqlite3 when its native binding loads (fast), otherwise Node's built-in node:sqlite (Node 22.13 or later, no install step). Both give the same prepare().get/all API.
// Opens spi/db/spi.sqlite read-only and attaches spi/db/results.sqlite as "res" when it exists. One connection per warm instance.
import fs from "node:fs";
import path from "node:path";

let BS = null, NS = null;
if (process.env.SPI_FORCE_NODE_SQLITE !== "1") { try { BS = (await import("better-sqlite3")).default; new BS(":memory:").close(); } catch { BS = null; } }
if (!BS) { try { NS = (await import("node:sqlite")).DatabaseSync; } catch { NS = null; } }
export const DRIVER = BS ? "better-sqlite3" : NS ? "node:sqlite" : "none";

const ROOT = process.cwd();
export const DB_PATH = process.env.SPI_DB || path.join(ROOT, "spi", "db", "spi.sqlite");
const RES_FULL = path.join(ROOT, "spi", "db", "results.sqlite"), RES_SLIM = path.join(ROOT, "spi", "db", "views.sqlite");
// results.sqlite (168 MB, restored from the committed .gz) is used when present; otherwise the slim views.sqlite (validated plans only, built by tools/spi_slim_results.py) is attached as "res".
export const RES_PATH = process.env.SPI_RES || (fs.existsSync(RES_FULL) ? RES_FULL : RES_SLIM);
let db = null;

export function openDb() {
  if (db) return db;
  if (!fs.existsSync(DB_PATH)) throw new Error("SQLITE_CANTOPEN: database file missing: " + path.basename(DB_PATH));
  if (BS) db = new BS(DB_PATH, { readonly: true, fileMustExist: true });
  else if (NS) db = new NS(DB_PATH, { readOnly: true });
  else throw new Error("no SQLite driver available (install better-sqlite3 or use Node 22.13 or later)");
  if (fs.existsSync(RES_PATH)) db.exec(`ATTACH DATABASE '${RES_PATH.replace(/'/g, "''")}' AS res`);
  return db;
}
export const hasRes = () => fs.existsSync(RES_PATH);
