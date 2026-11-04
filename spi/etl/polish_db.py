"""SPI database polish (owner: Claude A). Runs after build_db.py and is safe to run again.
- Normalises whitespace in every description (no wording is changed).
- Adds the indexes the assistant and the tabs query by (dates, orders, PO, PR, supplier).
- Writes data_dictionary: one plain-English line per table and column, so the assistant can read the whole database.
- Records the clean-up and the price outliers in dq_issue.
Usage: python3 spi/etl/polish_db.py [spi/db/spi.sqlite]"""
import os, re, sqlite3, sys

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
path = sys.argv[1] if len(sys.argv) > 1 else os.path.join(ROOT, "spi/db/spi.sqlite")
con = sqlite3.connect(path)
con.create_function("tidy", 1, lambda s: None if s is None else re.sub(r"\s*,\s*", ",", re.sub(r"\s+", " ", str(s))).strip())

fixed = 0
for table, col in [("material", "descr"), ("funcloc", "descr"), ("notification", "descr"), ("maint_item", "descr"), ("location_profile", "descr"), ("spec_family", "label")]:
    cur = con.execute(f"update {table} set {col}=tidy({col}) where {col} is not null and {col}<>tidy({col})")
    fixed += cur.rowcount

for sql in ["create index if not exists ix_mov_date on movement(posting_date)", "create index if not exists ix_mov_order on movement(order_no)",
            "create index if not exists ix_mov_fl on movement(funcloc)", "create index if not exists ix_notif_date on notification(notif_date)",
            "create index if not exists ix_notif_order on notification(order_no)", "create index if not exists ix_po_po on po_line(po_no)",
            "create index if not exists ix_po_pr on po_line(pr_no)", "create index if not exists ix_po_sup on po_line(supplier_code)",
            "create index if not exists ix_po_date on po_line(pr_date)", "create index if not exists ix_pe_fl on part_equipment(funcloc)",
            "create index if not exists ix_fl_tag on funcloc(tag)", "create index if not exists ix_fl_class on funcloc(eq_class)"]:
    con.execute(sql)

T = {
 "material": ("Spare part master: one row per material number, with stock, Min, Max and the last purchase price", {
  "material_no": "Material number (10 digits)", "descr": "Material description as in the BoM file", "unit": "Unit of measure", "mrp_type": "Stock Item or Non Stock",
  "stock": "Stock on hand at the data cut-off", "min_qty": "Current Min (reorder point in the ERP)", "max_qty": "Current Max", "item_type": "Item type read from the description",
  "spec_family": "Specification family used to pool thin histories", "nps": "Nominal pipe size read from the description", "rating": "Pressure rating read from the description",
  "grade": "Material grade read from the description", "end_conn": "End connection read from the description", "schedule": "Pipe schedule read from the description",
  "dwg_no": "Drawing number read from the description", "for_tag": "Equipment tag named in the description", "last_unit_price_idr": "Last PO item amount read as a unit price, IDR (Estimate)",
  "price_basis": "How the price was derived"}),
 "funcloc": ("Functional locations (equipment and lines) with criticality", {
  "funcloc": "Functional location code", "descr": "Location description", "criticality": "Criticality S, A, B or C (S read as highest, Assumption)", "parent": "Parent location",
  "level": "Level in the hierarchy", "tag": "Equipment tag", "eq_class": "Equipment class code (PP pump, HE heat exchanger, KC compressor ...)", "eq_class_name": "Equipment class name",
  "system_code": "Process system code", "has_bom": "1 when the location has a bill of materials"}),
 "bom": ("Bills of materials: which part is installed on which location", {"funcloc": "Functional location", "material_no": "Material number", "installed_qty": "Installed quantity", "dup_rows": "Duplicate source rows merged"}),
 "part_equipment": ("Part to equipment links from the BoM", {"material_no": "Material number", "funcloc": "Functional location", "installed_qty": "Installed quantity", "source": "Link source"}),
 "movement": ("Material issues (goods issues) from May 2025 to September 2026", {"id": "Row id", "posting_date": "Posting date", "month": "Posting month", "material_no": "Material number",
  "qty": "Quantity issued", "unit": "Unit", "order_no": "Maintenance order the issue is booked on", "notif_no": "Notification of that order, when one exists", "funcloc": "Location of that notification"}),
 "notification": ("Maintenance notifications", {"notif_no": "Notification number", "notif_date": "Notification date", "type": "Notification type", "order_no": "Maintenance order",
  "priority": "Priority", "funcloc": "Functional location", "descr": "Description of the problem", "created_on": "Created on", "req_start": "Required start", "req_end": "Required end",
  "completed_on": "Completion date", "status": "Status at the data cut-off"}),
 "maint_item": ("Preventive maintenance items and plans", {"item_no": "Maintenance item", "plan_no": "Maintenance plan", "funcloc": "Functional location", "descr": "Task text",
  "abc": "ABC indicator", "priority": "Priority", "cycle_text": "Cycle as written in the plan", "cycle_months": "Cycle length in months", "start_of_cycle": "Start of cycle",
  "next_due": "Next due date (Estimate: start of cycle plus whole cycles)"}),
 "po_line": ("Purchase requisition and purchase order lines", {"pr_no": "Purchase requisition", "pr_item": "PR item", "pr_type": "PR type", "pr_date": "PR date", "material_no": "Material number",
  "qty": "Requested quantity", "uom": "Unit", "pr_delivery": "Requested delivery date", "plant": "Plant", "purch_group": "Purchasing group", "po_no": "Purchase order", "po_item": "PO item",
  "supplier_code": "Supplier code", "supplier": "Supplier name", "amount": "PO item amount", "currency": "Currency", "po_delivery": "PO delivery date",
  "lead_days": "Lead time proxy: PR date to PO delivery date, days", "unit_price": "Amount read as unit price", "dq_flag": "Data quality flags of the line"}),
 "part_profile": ("Derived per part: criticality, demand pattern, lead time, stock value and quality flags", {"crit_max": "Highest criticality of the equipment the part serves",
  "n_funcloc": "Locations the part is installed on", "n_issues": "Issue lines in 17 months", "months_active": "Months with an issue", "total_qty": "Quantity issued in 17 months",
  "adi": "Average demand interval, months", "cv2": "Squared coefficient of variation of demand size", "demand_class": "smooth, erratic, intermittent, lumpy, single event or none",
  "lt_median": "Median lead time proxy, days", "lt_p90": "Lead time of 9 in 10 orders, days", "stock_value_idr": "Stock value at the last price (Estimate)",
  "excess_value_idr": "Value above Max (Estimate)", "months_cover": "Months of average use covered by stock", "abc_class": "ABC class by issued value", "xyz_class": "XYZ class by demand variability"}),
 "location_profile": ("Derived per location: parts, stock, risk and maintenance load", {"n_parts": "Parts in the BoM", "n_critical_zero": "Critical parts at zero stock", "notif_open": "Open notifications", "pm_due_12m": "Planned tasks due in 12 months"}),
 "demand_month": ("Issued quantity per part and month", {"material_no": "Material number", "month": "Month", "qty": "Quantity issued", "n_issues": "Issue lines"}),
 "equipment_set": ("The eight equipment sets used by the 3D library", {}), "spec_family": ("Specification families for pooling", {}),
 "dq_issue": ("Data quality register: every finding with its handling", {}), "meta": ("Data cut-off and source information", {}), "eval_case": ("Golden questions for the assistant evaluation", {}),
}
con.execute("drop table if exists data_dictionary")
con.execute("create table data_dictionary (table_name text not null, column_name text, label text not null, rows integer, primary key (table_name, column_name))")
for t, (label, cols) in T.items():
    n = con.execute(f"select count(*) from {t}").fetchone()[0]
    con.execute("insert into data_dictionary values (?,?,?,?)", (t, "", label, n))
    for c, l in cols.items():
        con.execute("insert into data_dictionary values (?,?,?,null)", (t, c, l))

con.execute("delete from dq_issue where issue in ('description spacing normalised','unit price possibly a lot price','description cut short in the source')")
nid = (con.execute("select max(id) from dq_issue").fetchone()[0] or 0)
done = con.execute("select coalesce(max(cast(value as integer)),0) from meta where key='polish_whitespace_rows'").fetchone()[0]
total = fixed + (done or 0)
con.execute("insert or replace into meta(key,value) values ('polish_whitespace_rows',?)", (str(total),))
con.execute("insert into dq_issue(id,table_name,key,issue,severity,detail,action) values (?,?,?,?,?,?,?)", (nid + 1, "material", "descr", "description spacing normalised", "info",
            f"{total} descriptions had repeated or trailing spaces", "spaces collapsed; wording unchanged"))
hi = con.execute("select count(*) from material where last_unit_price_idr>100000000").fetchone()[0]
con.execute("insert into dq_issue(id,table_name,key,issue,severity,detail,action) values (?,?,?,?,?,?,?)", (nid + 2, "material", "last_unit_price_idr", "unit price possibly a lot price", "warn",
            f"{hi} parts have a last PO amount above IDR 100 mn per unit; the amount may be for the whole line", "values kept and labelled Estimate; the assistant warns when it quotes them"))
cut = con.execute("select count(*) from material where descr like '%,FOR' or length(descr)>=40").fetchone()[0]
con.execute("insert into dq_issue(id,table_name,key,issue,severity,detail,action) values (?,?,?,?,?,?,?)", (nid + 3, "material", "descr", "description cut short in the source", "info",
            f"{cut} descriptions reach the 40-character limit of the source, some ending in FOR without the tag", "shown as given; the BoM link supplies the equipment"))
con.commit()
con.execute("vacuum")
con.close()
print(f"polished {path}: {fixed} descriptions tidied this run, data_dictionary written, {hi} price outliers flagged")
