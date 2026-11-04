"""Enrich spi/db/spi.sqlite after the ETL and the models (owner: Claude A). Idempotent; run by spi/etl/run_all.sh.
1. Location hierarchy: funcloc.parent from the tag (PP-1807C-M -> PP-1807C, BF-108-QF21 -> BF-108); level is kept as loaded.
2. Views every reader can share instead of repeating the logic:
   po_line_unique  one row per PR, PR item, PO and PO item (the sheet repeats 5,420 rows as exact copies), with value_idr = qty x unit price
   notification_x  notification with days to complete, late against the required end, still open, and the May 2025 opening backlog flag
   part_price      unit price per part: the PO price, otherwise the learned estimate (ml_price), with the basis
3. Data quality register: the findings of 2026-11-04 (duplicates, unit price, backlog, late completion, unpriced stock, cycle spellings).
4. Data dictionary: every table and view has a row with its row count.
5. ANALYZE, so SQLite plans the joins with real statistics.
Usage: python3.13 spi/etl/enrich_db.py [spi/db/spi.sqlite]"""
import json, os, sqlite3, sys
ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
path = sys.argv[1] if len(sys.argv) > 1 else os.path.join(ROOT, "spi/db/spi.sqlite")
con = sqlite3.connect(path); q = lambda s, a=(): con.execute(s, a).fetchall()

# 1. hierarchy from the tag
fl = q("select funcloc from funcloc"); have = {f for (f,) in fl}; upd = []
for (f,) in fl:
    parts = f.split("-"); parent = None
    for k in range(len(parts) - 1, 0, -1):
        cand = "-".join(parts[:k])
        if cand in have and cand != f: parent = cand; break
    upd.append((parent, f))
con.executemany("update funcloc set parent=? where funcloc=?", upd)
# 2. shared views
con.executescript("""
drop view if exists po_line_unique;
create view po_line_unique as
  select min(id) id, pr_no, pr_item, pr_type, pr_date, material_no, qty, uom, pr_delivery, plant, purch_group, po_no, po_item, supplier_code, supplier, amount, currency, po_delivery, lead_days,
         coalesce(unit_price, amount) unit_price, qty * coalesce(unit_price, amount) value_idr, dq_flag, count(*) copies
  from po_line group by pr_no, pr_item, po_no, po_item, material_no, qty, pr_date, po_delivery;
drop view if exists notification_x;
create view notification_x as
  select n.*, case when completed_on is not null and notif_date is not null then julianday(completed_on) - julianday(notif_date) end days_to_complete,
         case when completed_on is not null and req_end is not null then completed_on > req_end end completed_late,
         case when completed_on is null then 1 else 0 end still_open,
         case when substr(notif_date,1,7) = (select min(substr(notif_date,1,7)) from notification) then 1 else 0 end opening_backlog
  from notification n;
drop view if exists part_price;
create view part_price as
  select m.material_no, coalesce(p.unit_price_idr, m.last_unit_price_idr, x.price_idr) price_idr, x.price_low_idr, x.price_high_idr,
         case when coalesce(p.unit_price_idr, m.last_unit_price_idr, 0) > 0 then 'PO price (Data)' when x.price_idr is not null then x.basis else 'no price' end basis
  from material m left join part_profile p using(material_no) left join ml_price x using(material_no);
""")

# 3. data quality register
one = lambda s, a=(): con.execute(s, a).fetchone()[0]
dup = one("select count(*) - (select count(*) from po_line_unique) from po_line")
backlog = one("select count(*) from notification where substr(notif_date,1,7) = (select min(substr(notif_date,1,7)) from notification)")
late = one("select round(100.0 * avg(completed_late)) from notification_x where completed_late is not null")
openold = one("select count(*) from notification_x where still_open = 1 and julianday((select max(notif_date) from notification)) - julianday(notif_date) > 180")
unp_stock = one("select count(*) from part_profile p join material m using(material_no) where coalesce(p.stock,0) > 0 and coalesce(p.unit_price_idr, m.last_unit_price_idr, 0) = 0")
cyc = one("select count(distinct cycle_text) from maint_item"); cycm = one("select count(distinct cycle_months) from maint_item where cycle_months is not null")
never = one("select count(distinct material_no) from movement where material_no not in (select material_no from po_line)")
est = None
try: est = json.loads(one("select value from ml_model where key='price_stock_value_estimated_parts'"))
except Exception: pass
findings = [
  ("po_line", "*", "exact copies of PR PO lines", "warn", f"{dup:,} rows repeat another row (same PR, PR item, PO, PO item, quantity and dates)", "every figure reads view po_line_unique, which counts each line once"),
  ("po_line", "amount", "PO-Item Amount is a unit price", "info", "the amount stays the same on lines of very different quantity", "purchase value = quantity x unit price (po_line_unique.value_idr)"),
  ("notification", "notif_date", "opening backlog in the first month", "info", f"{backlog:,} notifications in the first month of the extract, against about 300 a month later", "flagged in notification_x.opening_backlog; trends start from the second month"),
  ("notification", "completed_on", "completion after the required end", "warn", f"{late:.0f}% of completed notifications finish after the required end; {openold:,} open ones are older than 180 days", "notification_x.completed_late and still_open; shown on the maintenance pages"),
  ("material", "last_unit_price_idr", "stock without a price", "warn", f"{unp_stock:,} parts hold stock without any PO price" + (f"; their learned estimate is IDR {est/1e9:,.0f} bn, half of it in 50 OEM drawing parts" if est else ""), "view part_price gives the learned estimate with a range, labelled Estimate; buy prices for the top parts first"),
  ("maint_item", "cycle_text", "cycle spellings", "info", f"{cyc} cycle spellings for {cycm} intervals", "cycle_months is used for every calculation"),
  ("movement", "material_no", "issued but never bought in the period", "info", f"{never:,} issued parts have no PR PO line in the 17 months", "lead time comes from the learned model (ml_leadtime) for them"),
]
con.execute("delete from dq_issue where issue in (%s)" % ",".join("?" * len(findings)), [f[2] for f in findings])
nid = (one("select coalesce(max(id),0) from dq_issue") or 0)
con.executemany("insert into dq_issue(id, table_name, key, issue, severity, detail, action) values (?,?,?,?,?,?,?)", [(nid + i + 1, *f) for i, f in enumerate(findings)])

# 4. dictionary rows for every table and view, with row counts
names = q("select name, type from sqlite_master where type in ('table','view') and name not like 'sqlite_%'")
DESC = {"data_dictionary": "What every table and field means", "po_line_unique": "PR PO lines counted once, with value_idr = quantity x unit price and the number of copies in the sheet",
        "notification_x": "Notifications with days to complete, late flag, still open and the opening-backlog flag", "part_price": "Unit price per part: PO price, otherwise the learned estimate, with the basis"}
for n, t in names:
    rows = one(f'select count(*) from "{n}"')
    if one("select count(*) from data_dictionary where table_name=? and column_name=''", (n,)):
        con.execute("update data_dictionary set rows=? where table_name=? and column_name=''", (rows, n))
    else:
        con.execute("insert into data_dictionary values (?,?,?,?)", (n, "", DESC.get(n, n.replace("_", " ")), rows))
con.execute("insert or replace into data_dictionary values ('funcloc','parent','Parent location from the tag (PP-1807C-M belongs to PP-1807C)',NULL)")
# 5. statistics for the planner
con.execute("analyze"); con.commit()
print(json.dumps({"parents_set": sum(1 for p, _ in upd if p), "po_copies": dup, "opening_backlog": backlog, "late_share": late, "unpriced_stock_parts": unp_stock, "dq_issues": one("select count(*) from dq_issue"), "dictionary_tables": one("select count(distinct table_name) from data_dictionary")}))
con.close()
