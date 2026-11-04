#!/usr/bin/env python3.13
"""SPI ETL (owner: Claude A). Reads the six baseline Excel files and writes spi/db/spi.sqlite with the schema in spi/db/schema.sql.
Rules: never drop a record silently. Every problem becomes a dq_issue row (count and the rule used). Deterministic: same input, same output.
Usage: python3.13 spi/etl/build_db.py [--raw spi/data/raw] [--out spi/db/spi.sqlite]"""
import argparse, json, math, os, re, sqlite3, sys, warnings
from datetime import date, timedelta
import pandas as pd, numpy as np
warnings.filterwarnings("ignore")
ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
ap = argparse.ArgumentParser(); ap.add_argument("--raw", default=os.path.join(ROOT, "spi/data/raw")); ap.add_argument("--out", default=os.path.join(ROOT, "spi/db/spi.sqlite")); a = ap.parse_args()
ETL_VERSION = "1.0"
CRIT = {"S": 4, "A": 3, "B": 2, "C": 1}
DQ = []
def dq(table, key, issue, sev, detail, action): DQ.append((table, key, issue, sev, detail, action))
def rd(n): return pd.read_excel(os.path.join(a.raw, n + ".xlsx"), sheet_name=0)
def iso(s): return s.dt.strftime("%Y-%m-%d").where(s.notna(), None)

# ---------------- load ----------------
F, B, M, V, N, P = rd("FuncLoc list"), rd("BoM"), rd("Mitem & Mplan"), rd("Movement Material"), rd("Notif History"), rd("PR PO")
cutoff = max(V["Posting Date"].max(), N["Notification Date"].max()).normalize()
cut = cutoff.date()
EQ = json.load(open(os.path.join(ROOT, "spi/etl/eqclass_map.json")))

# ---------------- funcloc ----------------
f = F.rename(columns={"Functional Location": "funcloc", "FunctLocDescrip.": "descr", "FuncLoc Criticallity": "criticality"})
f["criticality"] = f["criticality"].where(f["criticality"].isin(CRIT), None)
miss = int(f.criticality.isna().sum())
dq("funcloc", "*", "criticality missing", "warn", f"{miss} locations without criticality", "treated as unknown; parts served only by these locations get criticality rank 0")
def eqc(x):
    m = re.match(r"^(?:PX|PY|UT)_([A-Z]{2,4})-", x)
    if m: return m.group(1)
    if x.startswith("SITE_"): return "SYSTEM"
    return "LINE"
f["eq_class"] = f.funcloc.map(eqc)
f["eq_class_name"] = f.eq_class.map(lambda c: EQ.get(c, {}).get("name") or {"SYSTEM": "process system", "LINE": "piping line"}.get(c))
f["tag"] = f.funcloc.str.replace(r"^(PX|PY|UT)_", "", regex=True).where(~f.funcloc.str.startswith("SITE_"), None)
f["system_code"] = f.funcloc.str.extract(r"^SITE_[A-Z]+_(S\d+)$")[0]
f["level"] = f.funcloc.str.count("-") + 1
f["parent"] = None
f["has_bom"] = f.funcloc.isin(B["Functional Loc."]).astype(int)
dups = int(f.funcloc.duplicated().sum()); f = f.drop_duplicates("funcloc")
if dups: dq("funcloc", "*", "duplicate location", "warn", f"{dups} duplicates", "kept first")
dq("funcloc", "criticality", "criticality code order is not verified by the case owner", "warn", "codes S, A, B, C are given without a definition; this solution reads S as the highest, then A, B, C (Assumption)", "service level and release rules use that order; confirm with the data owner")
dq("po_line", "po_delivery", "PO delivery date is not a goods-receipt date", "warn", "procurement lead time is the elapsed days from PR date to PO delivery date: a proxy, not a realised supplier lead time", "labelled proxy everywhere it is shown")
dq("bom", "stock", "inventory position is on-hand only", "warn", "open purchase orders and backorders are not supplied, so stock on order is unknown", "reorder recommendations say: confirm the purchase pipeline before release")
for t, n in [("BoM", B["Functional Loc."]), ("Notif History", N["Functional Location"]), ("Mitem & Mplan", M["Functional Location"])]:
    k = int((~n.isin(f.funcloc)).sum())
    if k: dq(t, "*", "location not in FuncLoc list", "error", f"{k} rows", "kept, location row missing")

# ---------------- PO lines ----------------
p = P.rename(columns={"Purchase Requisition": "pr_no", "PR-Item": "pr_item", "PR-Type": "pr_type", "PR-Date": "pr_date", "PR-Material": "material_no", "PR-Quantity": "qty", "PR-UoM": "uom", "PR-Delivery Date": "pr_delivery", "PR-Plant": "plant", "PR-Purchasing Group": "purch_group", "Purchase Order": "po_no", "PO-Item": "po_item", "PO-Supplier Code": "supplier_code", "PO-Supplier Name": "supplier", "PO-Item Amount": "amount", "PO-Currency": "currency", "PO-Delivery Date": "po_delivery"})
p["lead_days"] = (p.po_delivery - p.pr_date).dt.days
# PO-Item Amount is a UNIT price, not a line total: within the same material the amount does not change with the ordered quantity
# (log-log slope 0.001, correlation 0.02 over 350 materials with 3 or more different quantities). So unit_price = amount.
p["unit_price"] = np.where(p.qty > 0, p.amount, np.nan)
def flags(r):
    fl = []
    if r.lead_days < 0: fl.append("NEG_LT")
    if r.lead_days > 365: fl.append("LT_GT_365")
    if not (r.amount > 0): fl.append("ZERO_PRICE")
    if r.currency != "IDR": fl.append("NONIDR")
    if r.po_delivery.year >= 2027: fl.append("PO_DELIV_FUTURE")
    return ",".join(fl) or None
p["dq_flag"] = p.apply(flags, axis=1)
for fl, sev, msg, act in [("NEG_LT", "error", "PO delivery before PR date", "excluded from lead time statistics"), ("LT_GT_365", "warn", "lead time above 365 days", "excluded from lead time statistics, counted"), ("ZERO_PRICE", "warn", "zero or missing PO amount", "excluded from unit price"), ("NONIDR", "info", "currency other than IDR", "not converted, excluded from IDR unit price"), ("PO_DELIV_FUTURE", "info", "PO delivery date in 2027 or later", "kept")]:
    k = int(p.dq_flag.fillna("").str.contains(fl).sum())
    if k: dq("po_line", "*", fl, sev, f"{k} lines: {msg}", act)
p = p.sort_values(["pr_date", "pr_no", "pr_item"]).reset_index(drop=True); p["id"] = p.index + 1
okp = p[(p.currency == "IDR") & (p.amount > 0) & (p.qty > 0)]
lastp = okp.groupby("material_no").unit_price.last()
for c in ["pr_date", "pr_delivery", "po_delivery"]: p[c] = iso(p[c])

# ---------------- material and BoM ----------------
b = B.rename(columns={"Functional Loc.": "funcloc", "Material No": "material_no", "Material Desc.": "descr", "Installed Qty": "installed_qty", "Unit": "unit", "Min.Qty": "min_qty", "Max.Qty": "max_qty", "Stock": "stock", "MRP Type": "mrp_type"})
nd = int(b.duplicated(["funcloc", "material_no"]).sum())
if nd: dq("bom", "*", "duplicate BoM rows (same location and material)", "warn", f"{nd} rows", "merged: installed quantity of the largest row kept, dup_rows counts them")
bom = b.groupby(["funcloc", "material_no"]).agg(installed_qty=("installed_qty", "max"), dup_rows=("installed_qty", "size")).reset_index()
mat = b.drop_duplicates("material_no")[["material_no", "descr", "unit", "mrp_type", "stock", "min_qty", "max_qty"]].copy()
k = int(((mat.mrp_type == "Non Stock") & (mat.stock > 0)).sum())
if k: dq("material", "*", "Non Stock material with stock on hand", "warn", f"{k} materials", "kept, flagged in profile")
k = int(((mat.mrp_type == "Stock Item") & (mat.stock == 0)).sum()); dq("material", "*", "stock item with zero stock", "info", f"{k} materials", "counted in health lists")
d = mat.descr.str.upper()
mat["item_type"] = d.str.split(",").str[0].str.strip()
mat["nps"] = d.str.extract(r"\b(\d+(?:-\d+/\d+|/\d+)?)IN\b")[0]
mat["rating"] = d.str.extract(r"\b(\d{3,4})#")[0]
mat["grade"] = d.str.extract(r"\b(A\d{2,3}[A-Z0-9]*|P11|P22|CF8M?|CF3M?|SS3\d{2}L?|B8M?|B7|B16|WCB|WCC|LCC|316L?|304L?)\b")[0]
mat["end_conn"] = d.str.extract(r"\b(RF|FF|RTJ|SW|BW|NPT|THD|BE|FLG)\b")[0]
mat["schedule"] = d.str.extract(r"\bSCH\s?(\d+S?|XXS|XS|STD)\b")[0]
mat["dwg_no"] = d.str.extract(r"DWG\.\s*([\d\-]+)")[0]
mat["for_tag"] = d.str.extract(r",\s*FOR\s+([A-Z]{1,4}-[A-Z0-9\-]+)")[0]
mat["last_unit_price_idr"] = mat.material_no.map(lastp)
mat["price_basis"] = np.where(mat.last_unit_price_idr.notna(), "last PO item amount read as unit price, IDR lines only (estimate)", None)
k = int(mat.last_unit_price_idr.isna().sum()); dq("po_line", "amount", "PO-Item Amount treated as unit price", "warn", "within a material the amount does not change with the quantity (slope 0.001, correlation 0.02, 350 materials)", "unit price = amount; if the owner of the data says it is a line total, divide by PR quantity (one line in build_db.py)")
dq("material", "*", "no usable purchase price", "warn", f"{k} of {len(mat)} materials have no IDR PO line with a positive amount", "stock value left empty for these, never guessed")
# families: standard parts by specification, OEM parts by item type and equipment class (pooling for statistics only)
std = mat.nps.notna() & mat.dwg_no.isna()
mat["spec_family"] = None
mat.loc[std, "spec_family"] = ("S|" + mat.item_type + "|" + mat.nps.fillna("") + "|" + mat.rating.fillna("") + "|" + mat.grade.fillna("") + "|" + mat.end_conn.fillna("") + "|" + mat.schedule.fillna("")).where(std)
oem = mat.dwg_no.notna() & mat.for_tag.notna()
cls_of_tag = mat.for_tag.str.extract(r"^([A-Z]+)-")[0]
mat.loc[oem, "spec_family"] = ("T|" + mat.item_type + "|" + cls_of_tag).where(oem)
mat.loc[mat.spec_family.isna(), "spec_family"] = ("G|" + mat.item_type).where(mat.spec_family.isna())
fam = mat.groupby("spec_family").agg(members=("material_no", "size"), item_type=("item_type", "first")).reset_index().rename(columns={"spec_family": "family_id"})
def fam_meta(fid):
    t = fid[0]
    if t == "S": return ("specification: item type, size, class, grade, end connection, schedule", "ASME B16.5 / B16.9 / B16.11 / B36.10M, ASTM material grade")
    if t == "T": return ("OEM drawing parts of one equipment class: pooled for demand statistics only, NOT interchangeable", "equipment class standard (API 610 / 617 / 612 / 660 / 560)")
    return ("item type only (no size or class in description): weak family", "none")
fam["basis"] = fam.family_id.map(lambda x: fam_meta(x)[0]); fam["standard_ref"] = fam.family_id.map(lambda x: fam_meta(x)[1])
fam["label"] = fam.family_id.str.replace("|", " ", regex=False).str[2:]
k = int((fam.members > 1).sum()); dq("spec_family", "*", "families with more than one member", "info", f"{k} families, {int(fam[fam.members>1].members.sum())} parts: usable for pooling", "see FORECASTING.md")
mat["spec_family"] = mat.spec_family

# ---------------- movement, notification, maintenance ----------------
v = V.rename(columns={"Posting Date": "posting_date", "Material Number": "material_no", "Quantity": "qty", "Base Unit": "unit", "Order": "order_no"})
v["month"] = v.posting_date.dt.strftime("%Y-%m")
n = N.rename(columns={"Notification Date": "notif_date", "Notification": "notif_no", "Notification Type": "type", "Order": "order_no", "Priority": "priority", "Functional Location": "funcloc", "Description": "descr", "Created On": "created_on", "Required Start": "req_start", "Required End": "req_end", "Completion by Date": "completed_on", "Status": "status"})
nn = n.dropna(subset=["order_no"]).drop_duplicates("order_no").set_index("order_no")
v["notif_no"] = v.order_no.map(nn.notif_no); v["funcloc"] = v.order_no.map(nn.funcloc)
link = float(v.notif_no.notna().mean())
dq("movement", "*", "issues linked to a notification through Order", "info", f"{link*100:.1f}% of {len(v)} issue rows", "equipment attribution uses BoM and the 'FOR <tag>' text for the rest")
k = int((~v.material_no.isin(mat.material_no)).sum())
if k: dq("movement", "*", "material not in BoM", "error", f"{k} rows", "kept")
k = int((n.completed_on < n.notif_date).sum())
if k: dq("notification", "*", "completion before notification date", "warn", f"{k} rows", "kept")
v = v.sort_values(["posting_date", "material_no", "order_no"]).reset_index(drop=True); v["id"] = v.index + 1
dm = v.groupby(["material_no", "month"]).agg(qty=("qty", "sum"), n_issues=("qty", "size")).reset_index()

def cyc(t):
    t = str(t).strip().upper(); m = re.match(r"^(\d+)?\s*(YEARLY|MONTHLY|MONTH|WEEKLY|WEEK)$", t)
    if not m: return None
    k = int(m.group(1) or 1); u = m.group(2)
    return k * 12 if u == "YEARLY" else k if u in ("MONTHLY", "MONTH") else round(k * 7 / 30.4375, 2)
mi = M.rename(columns={"Functional Location": "funcloc", "FunctLocDescrip.": "fl_descr", "ABC Indicator": "abc", "Maintenance Plan": "plan_no", "Maintenance Item": "item_no", "Maint. item text": "descr", "Priority": "priority", "Cycle Descriptions": "cycle_text", "Start of cycle": "start_of_cycle"})
mi["cycle_months"] = mi.cycle_text.map(cyc)
k = int(mi.cycle_months.isna().sum())
if k: dq("maint_item", "*", "cycle text not understood", "warn", f"{k} items", "no next due date")
spell = int(mi.cycle_text.isin(["YEARLY", "Yearly", "Monthly", "Weekly"]).sum()); dq("maint_item", "*", "cycle text in several spellings ('YEARLY', 'Yearly', '1 YEARLY', 'MONTH' ...)", "info", f"{spell} items without a number", "parsed by rule: no number means 1")
def nextdue(r):
    if pd.isna(r.cycle_months) or r.cycle_months <= 0: return None
    s = r.start_of_cycle.date()
    if s >= cut: return s.isoformat()
    days = r.cycle_months * 30.4375; k = math.ceil(((cut - s).days) / days)
    return (s + timedelta(days=round(k * days))).isoformat()
mi["next_due"] = mi.apply(nextdue, axis=1)
k = int((mi.start_of_cycle.dt.year <= 2020).sum()); dq("maint_item", "*", "cycle start before 2021", "info", f"{k} items", "next due computed by repeating the cycle to the data cut-off date (estimate, not a scheduled date)")
dq("maint_item", "*", "maintenance items carry no spare parts", "info", "the Mitem and Mplan file has no material numbers", "planned demand is inferred through the location's BoM (indirect, as in the data diagram)")

# ---------------- write base tables ----------------
os.makedirs(os.path.dirname(a.out), exist_ok=True)
if os.path.exists(a.out): os.remove(a.out)
con = sqlite3.connect(a.out); con.executescript(open(os.path.join(ROOT, "spi/db/schema.sql")).read())
def put(table, df, cols):
    df = df[cols].astype(object).where(df[cols].notna(), None)
    con.executemany(f"insert into {table}({','.join(cols)}) values({','.join('?'*len(cols))})", df.values.tolist())
put("funcloc", f, ["funcloc", "descr", "criticality", "parent", "level", "tag", "eq_class", "eq_class_name", "system_code", "has_bom"])
put("spec_family", fam, ["family_id", "label", "item_type", "standard_ref", "members", "basis"])
put("material", mat, ["material_no", "descr", "unit", "mrp_type", "stock", "min_qty", "max_qty", "item_type", "spec_family", "nps", "rating", "grade", "end_conn", "schedule", "dwg_no", "for_tag", "last_unit_price_idr", "price_basis"])
put("bom", bom, ["funcloc", "material_no", "installed_qty", "dup_rows"])
vv = v.copy(); vv["posting_date"] = iso(vv.posting_date)
put("movement", vv, ["id", "posting_date", "month", "material_no", "qty", "unit", "order_no", "notif_no", "funcloc"])
nw = n.copy()
for c in ["notif_date", "created_on", "req_start", "req_end", "completed_on"]: nw[c] = iso(nw[c])
put("notification", nw, ["notif_no", "notif_date", "type", "order_no", "priority", "funcloc", "descr", "created_on", "req_start", "req_end", "completed_on", "status"])
mw = mi.copy(); mw["start_of_cycle"] = iso(mw.start_of_cycle)
put("maint_item", mw, ["item_no", "plan_no", "funcloc", "descr", "abc", "priority", "cycle_text", "cycle_months", "start_of_cycle", "next_due"])
put("po_line", p, ["id", "pr_no", "pr_item", "pr_type", "pr_date", "material_no", "qty", "uom", "pr_delivery", "plant", "purch_group", "po_no", "po_item", "supplier_code", "supplier", "amount", "currency", "po_delivery", "lead_days", "unit_price", "dq_flag"])
put("demand_month", dm, ["material_no", "month", "qty", "n_issues"])

# ---------------- part_equipment ----------------
pe = [bom.assign(source="bom")[["material_no", "funcloc", "installed_qty", "source"]]]
fset = set(f.funcloc)
tagmap = {("PX_" + t): t for t in mat.for_tag.dropna().unique()}
dw = mat[mat.for_tag.notna()][["material_no", "for_tag"]].copy()
dw["funcloc"] = dw.for_tag.map(lambda t: next((c + t for c in ("PX_", "PY_", "UT_") if c + t in fset), None))
dw = dw.dropna(subset=["funcloc"]); dw["installed_qty"] = None; dw["source"] = "dwg_text"
pe.append(dw[["material_no", "funcloc", "installed_qty", "source"]])
ol = v.dropna(subset=["funcloc"]).drop_duplicates(["material_no", "funcloc"]).assign(installed_qty=None, source="order_link")
pe.append(ol[["material_no", "funcloc", "installed_qty", "source"]])
pe = pd.concat(pe).drop_duplicates(["material_no", "funcloc", "source"])
k = int(mat.for_tag.notna().sum() - dw.shape[0])
if k: dq("material", "*", "'FOR <tag>' text names a tag that is not in the FuncLoc list (descriptions are cut at 40 characters, many tags are truncated)", "info", f"{k} materials", "no dwg_text link made")
put("part_equipment", pe, ["material_no", "funcloc", "installed_qty", "source"])

# ---------------- part_profile ----------------
months = pd.period_range(v.posting_date.min().strftime("%Y-%m"), cutoff.strftime("%Y-%m"), freq="M"); T = len(months)
mlist = [str(m) for m in months]
ser = dm.pivot(index="material_no", columns="month", values="qty").reindex(columns=mlist).fillna(0.0)
critmap = f.set_index("funcloc").criticality
bb = bom.copy(); bb["crit_rank"] = bb.funcloc.map(critmap).map(CRIT).fillna(0).astype(int)
cr = bb.groupby("material_no").agg(crit_rank=("crit_rank", "max"), n_funcloc=("funcloc", "nunique"), installed_total=("installed_qty", "sum"))
rank2 = {4: "S", 3: "A", 2: "B", 1: "C", 0: None}
mi_due = mi.dropna(subset=["next_due"]).copy(); mi_due["due"] = pd.to_datetime(mi_due.next_due)
horizon = pd.Timestamp(cut) + pd.DateOffset(months=12)
pm12 = mi_due[(mi_due.due >= pd.Timestamp(cut)) & (mi_due.due <= horizon)]
pm_by_fl = pm12.groupby("funcloc").agg(n=("item_no", "size"), nxt=("next_due", "min"))
n12 = n[n.notif_date > pd.Timestamp(cut) - pd.DateOffset(months=12)].groupby("funcloc").size()
bfl = bom.assign(pm=bom.funcloc.map(pm_by_fl.n).fillna(0), nxt=bom.funcloc.map(pm_by_fl.nxt), nf=bom.funcloc.map(n12).fillna(0))
agg = bfl.groupby("material_no").agg(pm_due_12m=("pm", "sum"), pm_next_due=("nxt", "min"), notif_n=("nf", "sum"))
nl = v.dropna(subset=["notif_no"]).groupby("material_no").notif_no.nunique()
lt = p[(p.lead_days > 0) & (p.lead_days <= 365)].groupby("material_no").lead_days.agg(lt_n="size", lt_median="median", lt_mean="mean", lt_sd="std", lt_p90=lambda s: s.quantile(.9))
sup = p.groupby("material_no").supplier_code.nunique()
rows = []
for mno, r in mat.set_index("material_no").iterrows():
    s = ser.loc[mno].values if mno in ser.index else np.zeros(T)
    nz = s[s > 0]; ma = int(len(nz)); tq = float(s.sum())
    adi = (T / ma) if ma else None
    cv2 = float((nz.std(ddof=1) / nz.mean()) ** 2) if ma >= 2 else None   # sample variance, as in the engine and in the CALIBER calculation workbook
    cvall = float(s.std(ddof=0) / s.mean()) if ma else None
    if ma == 0: cls = "no_demand"
    elif ma == 1: cls = "single_event"
    else: cls = "intermittent" if (adi >= 1.32 and cv2 < 0.49) else "lumpy" if adi >= 1.32 else "erratic" if cv2 >= 0.49 else "smooth"
    last = None; msl = None
    if ma:
        li = max(i for i, x in enumerate(s) if x > 0); last = mlist[li]; msl = T - 1 - li; first = mlist[min(i for i, x in enumerate(s) if x > 0)]
    else: first = None
    pr = lastp.get(mno); sv = float(r.stock * pr) if pr is not None and not np.isnan(pr) else None
    ex = float(max(0.0, r.stock - r.max_qty) * pr) if pr is not None and not np.isnan(pr) else None
    mon_dem = tq / T
    cover = float(r.stock / mon_dem) if mon_dem > 0 else None
    turn = float(tq * 12 / T / r.stock) if r.stock > 0 and tq > 0 else None
    c = cr.loc[mno]; g = agg.loc[mno] if mno in agg.index else None
    l = lt.loc[mno] if mno in lt.index else None
    fl = []
    if pr is None or (isinstance(pr, float) and np.isnan(pr)): fl.append("NO_PRICE")
    if l is None: fl.append("NO_LEAD_TIME")
    elif l.lt_n < 3: fl.append("FEW_LEAD_TIMES")
    if r.mrp_type == "Non Stock" and r.stock > 0: fl.append("NONSTOCK_WITH_STOCK")
    if r.mrp_type == "Stock Item" and ma == 0: fl.append("STOCK_ITEM_NO_DEMAND")
    if ma and ma < 3: fl.append("SPARSE_HISTORY")
    rows.append(dict(material_no=mno, crit_max=rank2[int(c.crit_rank)], crit_rank=int(c.crit_rank), n_funcloc=int(c.n_funcloc), installed_total=float(c.installed_total),
        n_issues=int(((v.material_no == mno)).sum()) if False else None, months_active=ma, total_qty=tq, first_issue=first, last_issue=last, months_since_last=msl, adi=adi, cv2=cv2, demand_class=cls,
        n_notif_linked=int(nl.get(mno, 0)), notif_rate_12m=float(g.notif_n) if g is not None else 0.0, pm_due_12m=int(g.pm_due_12m) if g is not None else 0, pm_next_due=(g.pm_next_due if g is not None else None),
        lt_n=int(l.lt_n) if l is not None else 0, lt_median=float(l.lt_median) if l is not None else None, lt_mean=float(l.lt_mean) if l is not None else None, lt_sd=float(l.lt_sd) if l is not None and not np.isnan(l.lt_sd) else None, lt_p90=float(l.lt_p90) if l is not None else None,
        supplier_count=int(sup.get(mno, 0)), stock=float(r.stock), min_qty=float(r.min_qty), max_qty=float(r.max_qty), unit_price_idr=None if pr is None or np.isnan(pr) else float(pr), stock_value_idr=sv, excess_value_idr=ex,
        months_cover=cover, turnover=turn, cvall=cvall, family_id=r.spec_family, dq_flags=json.dumps(fl)))
prof = pd.DataFrame(rows)
cnt = v.groupby("material_no").size(); prof["n_issues"] = prof.material_no.map(cnt).fillna(0).astype(int)
# ABC by annual consumption value (parts with price and demand), XYZ by CV of the monthly series
val = (prof.total_qty * 12 / T * prof.unit_price_idr).where(prof.unit_price_idr.notna() & (prof.total_qty > 0))
o = val.sort_values(ascending=False).dropna(); cum = o.cumsum() / o.sum()
prof["abc_class"] = None
prof.loc[cum.index, "abc_class"] = np.where(cum <= 0.8, "A", np.where(cum <= 0.95, "B", "C"))
prof["xyz_class"] = np.where(prof.cvall.isna(), None, np.where(prof.cvall < 0.5, "X", np.where(prof.cvall < 1.0, "Y", "Z")))
cols = ["material_no", "crit_max", "crit_rank", "n_funcloc", "installed_total", "n_issues", "months_active", "total_qty", "first_issue", "last_issue", "months_since_last", "adi", "cv2", "demand_class", "n_notif_linked", "notif_rate_12m", "pm_due_12m", "pm_next_due", "lt_n", "lt_median", "lt_mean", "lt_sd", "lt_p90", "supplier_count", "stock", "min_qty", "max_qty", "unit_price_idr", "stock_value_idr", "excess_value_idr", "months_cover", "turnover", "abc_class", "xyz_class", "family_id", "dq_flags"]
put("part_profile", prof, cols)
for cl, k in prof.demand_class.value_counts().items(): dq("part_profile", "*", f"demand class {cl}", "info", f"{int(k)} parts", "ADI cut-off 1.32 and CV2 cut-off 0.49 over {T} months")

# ---------------- location_profile ----------------
CUT = "(select value from meta where key='data_cutoff')"
con.execute("insert or replace into meta values('data_cutoff', ?)", (cut.isoformat(),)); con.commit()
con.execute(f"""insert into location_profile
 select f.funcloc, f.tag, f.descr, f.criticality, f.eq_class, f.eq_class_name, f.system_code,
  coalesce(a.n_parts,0), coalesce(a.n_used,0), coalesce(a.sv,0), coalesce(a.ev,0), coalesce(a.nz,0), coalesce(a.nb,0), coalesce(a.ncz,0),
  coalesce(n.n_all,0), coalesce(n.n12,0), coalesce(n.h12,0), coalesce(n.op,0), coalesce(m.pm12,0), m.pmn
 from funcloc f
 left join (select b.funcloc, count(*) n_parts, sum(p.months_active>0) n_used, sum(coalesce(p.stock_value_idr,0)) sv, sum(coalesce(p.excess_value_idr,0)) ev,
    sum(mt.mrp_type='Stock Item' and p.stock=0 and p.max_qty>0) nz, sum(mt.mrp_type='Stock Item' and p.min_qty>0 and p.stock>0 and p.stock<p.min_qty) nb,
    sum(mt.mrp_type='Stock Item' and p.stock=0 and p.months_active>0) ncz
    from bom b join part_profile p using(material_no) join material mt using(material_no) group by b.funcloc) a on a.funcloc=f.funcloc
 left join (select funcloc, count(*) n_all, sum(notif_date>date({CUT},'-12 months')) n12, sum(notif_date>date({CUT},'-12 months') and priority in ('High','Emergency')) h12, sum(status='In Progress') op
    from notification group by funcloc) n on n.funcloc=f.funcloc
 left join (select funcloc, count(*) pm12, min(next_due) pmn from maint_item where next_due between {CUT} and date({CUT},'+12 months') group by funcloc) m on m.funcloc=f.funcloc""")
con.commit()

# ---------------- dq, meta ----------------
con.executemany("insert into dq_issue(table_name,key,issue,severity,detail,action) values(?,?,?,?,?,?)", DQ)
con.executemany("insert or replace into meta values(?,?)", [("data_cutoff", cut.isoformat()), ("history_months", str(T)), ("history_first_month", mlist[0]), ("etl_version", ETL_VERSION), ("source_files", "BoM, FuncLoc list, Mitem & Mplan, Movement Material, Notif History, PR PO (baseline dataset, synthetic)")])
con.commit(); con.execute("vacuum"); con.close()
print("wrote", a.out, round(os.path.getsize(a.out) / 1e6, 1), "MB;", len(mat), "materials,", len(f), "locations,", len(v), "issues,", len(DQ), "dq rows, months", T, "cutoff", cut)
