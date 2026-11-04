// Shared read-only database helper for every Vercel function (owner: Claude A).
// Opens spi/db/spi.sqlite read-only and attaches spi/db/results.sqlite as "res" when it exists. One connection per warm instance.
import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
export const DB_PATH = process.env.SPI_DB || path.join(ROOT, "spi", "db", "spi.sqlite");
export const RES_PATH = process.env.SPI_RES || path.join(ROOT, "spi", "db", "results.sqlite");
let db = null;

export function openDb() {
  if (db) return db;
  db = new Database(DB_PATH, { readonly: true, fileMustExist: true });
  if (fs.existsSync(RES_PATH)) db.exec(`ATTACH DATABASE '${RES_PATH.replace(/'/g, "''")}' AS res`);
  return db;
}
export const hasRes = () => fs.existsSync(RES_PATH);
