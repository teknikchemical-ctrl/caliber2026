#!/usr/bin/env python3.13
"""Golden questions with answers computed by SQL from spi/db/spi.sqlite (owner: Claude A). Writes spi/eval/golden.json and fills table eval_case.
The assistant is scored against expected.value (tolerance in %, or exact for text). Run after build_db.py (run_all.sh does)."""
import json, os, sqlite3
ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
DB = os.path.join(ROOT, "spi/db/spi.sqlite"); c = sqlite3.connect(DB); c.row_factory = sqlite3.Row
Q = []
def add(id, question, sql, kind="number", tol=0.0, unit="", fmt=None):
    r = c.execute(sql).fetchone(); v = r[0] if r else None
    Q.append({"id": id, "question": question, "sql": sql, "kind": kind, "unit": unit, "tolerance": tol, "expected": {"value": v, "text": (fmt(r) if fmt else None)}})
S = "p.stock_value_idr"
add("G01", "How many spare parts are in the baseline data?", "select count(*) from material", unit="parts")
add("G02", "How many spare parts were issued at least once?", "select count(*) from part_profile where months_active>0", unit="parts")
add("G03", "How many spare parts never had an issue in the history?", "select count(*) from part_profile where months_active=0", unit="parts")
add("G04", "How many issue transactions are in the history?", "select count(*) from movement", unit="transactions")
add("G05", "What is the first month and the last month of the consumption history?", "select min(month)||' to '||max(month) from movement", kind="text")
add("G06", "How many spare parts serve equipment of criticality S?", "select count(*) from part_profile where crit_max='S'", unit="parts")
add("G07", "How many spare parts serve equipment of criticality A?", "select count(*) from part_profile where crit_max='A'", unit="parts")
add("G08", "How many stock items are at zero stock?", "select count(*) from part_profile p join material m using(material_no) where m.mrp_type='Stock Item' and p.stock=0", unit="parts")
add("G09", "How many stock items are below their Min but above zero?", "select count(*) from part_profile p join material m using(material_no) where m.mrp_type='Stock Item' and p.min_qty>0 and p.stock<p.min_qty and p.stock>0", unit="parts")
add("G10", "How many parts have stock above their Max (with a Max set)?", "select count(*) from part_profile where max_qty>0 and stock>max_qty", unit="parts")
add("G11", "What is the total stock value of parts with a usable price, in IDR bn (Estimate)?", "select round(sum(stock_value_idr)/1e9,1) from part_profile", tol=0.5, unit="IDR bn")
add("G12", "What is the excess stock value above Max for parts with a Max set, in IDR bn (Estimate)?", "select round(sum(excess_value_idr)/1e9,1) from part_profile where max_qty>0", tol=0.5, unit="IDR bn")
add("G13", "Which part has the largest excess value (material number)?", "select material_no from part_profile order by excess_value_idr desc limit 1", kind="id")
add("G14", "Which part has the highest stock value (material number)?", "select material_no from part_profile order by stock_value_idr desc limit 1", kind="id")
add("G15", "Which part was issued in the most months (material number)?", "select material_no from part_profile order by months_active desc, total_qty desc limit 1", kind="id")
add("G16", "Which part has the largest total issued quantity (material number)?", "select material_no from part_profile order by total_qty desc limit 1", kind="id")
add("G17", "What is the median purchase lead time in days (PR date to PO delivery, valid lines only)?", "select cast(round(avg(lead_days)) as integer) from (select lead_days from po_line where lead_days>0 and lead_days<=365 order by lead_days limit 2 - (select count(*) from po_line where lead_days>0 and lead_days<=365) % 2 offset (select (count(*)-1)/2 from po_line where lead_days>0 and lead_days<=365))", tol=3, unit="days")
add("G18", "How many PO lines have a lead time above 365 days?", "select count(*) from po_line where lead_days>365", unit="lines")
add("G19", "How many different suppliers are in the purchase history?", "select count(distinct supplier_code) from po_line", unit="suppliers")
add("G20", "Which supplier has the most PO lines?", "select supplier from po_line group by supplier order by count(*) desc limit 1", kind="text")
add("G21", "How many maintenance notifications have priority Emergency?", "select count(*) from notification where priority='Emergency'", unit="notifications")
add("G22", "How many maintenance notifications are still In Progress?", "select count(*) from notification where status='In Progress'", unit="notifications")
add("G23", "How many planned maintenance items fall due in the 12 months after the data cut-off?", "select count(*) from maint_item where next_due between (select value from meta where key='data_cutoff') and date((select value from meta where key='data_cutoff'),'+12 months')", tol=1, unit="items")
add("G24", "How many parts have an intermittent demand pattern?", "select count(*) from part_profile where demand_class='intermittent'", unit="parts")
add("G25", "How many parts have a lumpy demand pattern?", "select count(*) from part_profile where demand_class='lumpy'", unit="parts")
add("G26", "How many parts were issued in only one month?", "select count(*) from part_profile where demand_class='single_event'", unit="parts")
add("G27", "How many parts are insurance spare candidates (no demand, S or A equipment, lead time above 90 days or unknown)?", "select count(*) from part_profile where months_active=0 and crit_max in ('S','A') and (lt_median is null or lt_median>90)", unit="parts")
add("G28", "How many stock items are non-moving (stock on hand, no issue in the history)?", "select count(*) from part_profile p join material m using(material_no) where m.mrp_type='Stock Item' and p.months_active=0 and p.stock>0", unit="parts")
add("G29", "How many Non Stock materials still hold stock?", "select count(*) from part_profile p join material m using(material_no) where m.mrp_type='Non Stock' and p.stock>0", unit="parts")
add("G30", "How many functional locations have no criticality?", "select count(*) from funcloc where criticality is null", unit="locations")
add("G31", "How many spare parts are installed on equipment KT-383A?", "select count(*) from bom where funcloc='PX_KT-383A'", unit="parts")
add("G32", "How many notifications are recorded on location PX_BF-110?", "select count(*) from notification where funcloc='PX_BF-110'", unit="notifications")
top = [r[0] for r in c.execute("select material_no from part_profile where months_active>=6 and unit_price_idr is not null and lt_n>=3 order by total_qty desc limit 4")]
for i, mno in enumerate(top, 1):
    add(f"G{32+i*2-1:02d}", f"What is the current stock of material {mno}?", f"select stock from part_profile where material_no={mno}", unit="units")
    add(f"G{32+i*2:02d}", f"What are the Min and Max of material {mno}?", f"select min_qty||' / '||max_qty from part_profile where material_no={mno}", kind="text")
n = len(Q)+1
mno = top[0]
add(f"G{n:02d}", f"What is the median lead time in days of material {mno}?", f"select lt_median from part_profile where material_no={mno}", tol=1, unit="days"); n += 1
add(f"G{n:02d}", f"In how many months did material {mno} have an issue?", f"select months_active from part_profile where material_no={mno}", unit="months"); n += 1
add(f"G{n:02d}", f"What demand pattern class does material {mno} have?", f"select demand_class from part_profile where material_no={mno}", kind="text"); n += 1
os.makedirs(os.path.join(ROOT, "spi/eval"), exist_ok=True)
json.dump({"note": "Answers computed by SQL on spi/db/spi.sqlite. Money is IDR and an Estimate. Score: numbers within tolerance (absolute units, 0 = exact), ids and text exact (case-insensitive).", "questions": Q}, open(os.path.join(ROOT, "spi/eval/golden.json"), "w"), indent=1, ensure_ascii=False)
w = sqlite3.connect(DB); w.execute("delete from eval_case"); w.executemany("insert into eval_case values(?,?,?,?,?)", [(q["id"], q["question"], json.dumps({"kind": q["kind"], "unit": q["unit"], **q["expected"]}), q["sql"], q["tolerance"]) for q in Q]); w.commit(); w.close()
print("golden questions:", len(Q)); [print(" ", q["id"], q["question"][:70], "=>", q["expected"]["value"]) for q in Q[:6]]
