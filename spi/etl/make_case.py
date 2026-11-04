#!/usr/bin/env python3.13
"""Picks up to 8 equipment sets from spi/db/spi.sqlite and writes cases/spi/plant.json, then compiles the pack (owner: Claude A).
Everything on the pages comes from the baseline data. Drawings are generated schematics: the case text says so. No invented values.
Usage: python3.13 spi/etl/make_case.py"""
import json, os, re, sqlite3, subprocess, sys
ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
DB = os.path.join(ROOT, "spi/db/spi.sqlite"); OUT = os.path.join(ROOT, "cases/spi")
EQ = json.load(open(os.path.join(ROOT, "spi/etl/eqclass_map.json")))
c = sqlite3.connect(DB); c.row_factory = sqlite3.Row
PLAN = [("KT", 2), ("BF", 2), ("PP", 2), ("HE", 1), ("FCV", 1)]   # equipment class and how many; variety for the demo
rows = []
for cls, k in PLAN:
    q = c.execute("""select f.funcloc, f.tag, f.descr, f.criticality, f.eq_class, count(distinct b.material_no) parts,
        coalesce(sum(p.total_qty),0) used, sum(p.stock>0) instock from funcloc f join bom b using(funcloc) join part_profile p using(material_no)
        where f.eq_class=? and f.criticality in ('S','A') group by f.funcloc having parts>=8 order by (case f.criticality when 'S' then 1 else 2 end), parts desc, used desc limit ?""", (cls, k)).fetchall()
    rows += q
FLUIDS = [("ethylene", "ethylene"), ("propylene", "propylene"), ("methanol", "methanol"), ("hydrogen", "hydrogen"), ("fuel gas", "fuel gas"), ("methane", "methane"), ("quench oil", "fuel oil"), ("fuel oil", "fuel oil"), ("cracked gas", "cracked gas, hydrogen")]
def fluid(d):
    d = d.lower()
    for k, v in FLUIDS:
        if k in d: return v
    return ""
def nice(s):
    out = []
    for i, w in enumerate(re.split(r"(\s+)", str(s).strip())):
        if w.isspace() or not w: out.append(w); continue
        keep = bool(re.search(r"\d", w)) or bool(re.match(r"^[A-Z]{1,4}-[A-Z0-9]", w)) or w in ("TLE", "KO", "LP", "MP", "HP", "DCS")
        out.append(w if keep else (w.capitalize() if i == 0 else w.lower()))
    return "".join(out)
def nice_part(s):
    t = [x.strip() for x in str(s).split(",") if x.strip()]
    r = []
    for i, x in enumerate(t):
        if x.upper().startswith("FOR "): r.append("for " + x[4:])
        elif re.search(r"\d", x) or re.match(r"^[A-Z]{1,4}-[A-Z0-9]", x): r.append(x)
        else: r.append(x.lower().capitalize() if i == 0 else x.lower())
    return ", ".join(r)
SYS = {r["system_code"]: r["descr"] for r in c.execute("select system_code, descr from funcloc where funcloc like 'SITE_PX_S%'")}
sets = []; eqrows = []
for i, r in enumerate(rows, 1):
    cls = EQ.get(r["eq_class"], {}); kind = cls.get("kind", "vessel")
    parts = c.execute("""select m.material_no, m.descr, m.grade, m.unit, b.installed_qty, p.stock, p.min_qty, p.max_qty, p.demand_class, p.total_qty, p.crit_rank
        from bom b join material m using(material_no) join part_profile p using(material_no) where b.funcloc=? order by p.total_qty desc, p.stock desc, m.descr limit 40""", (r["funcloc"],)).fetchall()
    nparts = r["parts"]
    bom = [{"name": nice_part(p["descr"])[:70], "mat": ("Material " + str(p["material_no"]) + (" | " + p["grade"] if p["grade"] else "")), "qty": int(p["installed_qty"] or 1)} for p in parts]
    crit_text = {"S": "S (highest criticality)", "A": "A (high criticality)"}[r["criticality"]]
    proc = (f"{nice(r['descr'])} ({r['tag']}) is a {cls.get('name','equipment item')} in the baseline data set, criticality {crit_text}. It has {nparts} different spare parts in the bill of materials; the list on this page shows the {len(parts)} most consumed. "
            f"Parts, stock, Min and Max, issues, work notifications and lead times are records of the baseline data set (synthetic). The drawing and the data sheet are schematic and generated from these records: they are not vendor drawings. Reference standard for this equipment class: {cls.get('std','not assigned')}.")
    sets.append({"tag": r["tag"], "name": nice(r["descr"]), "kind": kind, "type": cls.get("name", "equipment"), "unit": "Baseline site PX", "area": "Not in baseline data", "fluid": fluid(r["descr"]) or "Not in baseline data", "crit": "HIGH CRITICAL" if r["criticality"] == "S" else "CRITICAL",
        "pid": {"ref": "SPI-" + r["tag"], "title": nice(r["descr"]) + " (schematic generated from data)", "sys": "Generated from the baseline data set", "process": proc},
        "bom": bom, "datasheet": {"no": "SPI-DS-" + r["tag"], "title": "EQUIPMENT RECORD (generated from baseline data)", "sections": [["Identification", [["Item / Tag No.", r["tag"]], ["Description", r["descr"]], ["Class", cls.get("name", "equipment")], ["Criticality", r["criticality"]], ["Reference standard", cls.get("std", "not assigned")], ["Spare parts in BoM", str(nparts)], ["Source", "FuncLoc list and BoM, baseline data set (synthetic)"]]]]}})
    eqrows.append((i, r["tag"], nice(r["descr"]), r["funcloc"], r["eq_class"], None, r["criticality"], nparts, "score: criticality, parts in BoM, consumption; one best per class"))
case = {"id": "spi", "title": "Spare Part Intelligence", "product": "Spare Part Intelligence and Inventory Optimization", "subtitle": "CALIBER 2026 final case | AI-powered forecasting and dynamic optimization", "company": "Baseline data set (synthetic)", "site": "Baseline site PX", "code": "SPI", "brief": "CALIBER 2026 final case brief",
        "examples": ["Which critical spare parts are at risk of stockout?", "Which parts are overstocked and by how much?", "What should we reorder first and how many?", "Which parts are slow-moving or dead stock?", "What are the Min and Max for a part?", "What if we cut stock by 20%?"]}
# work orders: the real notifications of the chosen equipment. No cost or downtime fields exist in the baseline data: they are 0 and the remark says so.
mh = []
for i, r in enumerate(rows, 1):
    for nrow in c.execute("select * from notification where funcloc like ? order by notif_date", (r["funcloc"] + "%",)):
        d = lambda s: (s + "T08:00") if s else ""
        mh.append({"wo": "WO-" + str(nrow["order_no"] or nrow["notif_no"]), "nt": "NT-" + str(nrow["notif_no"]), "rd": d(nrow["notif_date"]), "sd": d(nrow["req_start"]), "cd": d(nrow["completed_on"]), "st": "Completed" if nrow["status"] == "Complete" else "In progress", "tag": r["tag"], "nm": nice(r["descr"]), "fl": "", "ac": 0, "an": "",
            "type": "Notification " + (nrow["type"] or ""), "disc": "", "pri": nrow["priority"], "crit": "HIGH CRITICAL" if r["criticality"] == "S" else "CRITICAL", "prob": (nrow["descr"] or "")[:120], "root": "", "act": "", "parts": "-", "bd": "Yes" if nrow["priority"] == "Emergency" else "No", "dt": 0, "lh": 0, "lc": 0, "mc": 0, "tc": 0,
            "rep": "", "exe": "", "app": "", "ilk": "", "rem": "Notification record of the baseline data set (synthetic). Cost, labour and downtime are not in the baseline data and show as 0. Breakdown flag is set when priority is Emergency."})
json.dump(mh, open(os.path.join(OUT, "mh.json"), "w"), indent=1, ensure_ascii=False)
json.dump({"case": case, "sets": sets, "documents": [], "history": {"source": "mh.json"}}, open(os.path.join(OUT, "plant.json"), "w"), indent=1, ensure_ascii=False)
w = sqlite3.connect(DB); w.execute("delete from equipment_set"); w.executemany("insert into equipment_set values(?,?,?,?,?,?,?,?,?)", eqrows); w.commit(); w.close()
print("sets:", [(s["tag"], s["kind"], len(s["bom"])) for s in sets])
subprocess.run([sys.executable, os.path.join(ROOT, "tools/pack_build.py"), OUT], check=True)
# post-process: the compiler writes a revision history that says "issued for construction". Nothing was issued: say what it is.
kb = json.load(open(os.path.join(OUT, "kb.json")))
for s in kb["sets"]: s["revs"] = [{"rev": "0", "desc": "GENERATED FROM BASELINE DATA", "by": "-", "date": "-"}]
for d in kb["docs"]: d["status"] = "Generated from baseline data"
json.dump(kb, open(os.path.join(OUT, "kb.json"), "w"), ensure_ascii=False, indent=1)
