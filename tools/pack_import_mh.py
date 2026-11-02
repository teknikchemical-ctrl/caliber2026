#!/usr/bin/env python3
"""Turn a maintenance history spreadsheet (xlsx or csv) into the mh.json of a case pack.

    python3 tools/pack_import_mh.py "Maintenance History.xlsx" cases/<id>/mh.json [--sheet NAME] [--map wo=Order_No,tag=Equip]

Column names are matched by synonyms (WO_Number, Work Order, Order No ... all become 'wo'), so most exports work without a map.
Use --map for a column the guess gets wrong. Prints what it matched and what is still missing.
If openpyxl is not importable with the default python3, run it with python3.13 (see docs/CASE_PACKS.md).
"""
import csv, json, re, sys, datetime

FIELDS = {  # key: synonyms (lower case, letters and digits only)
 "wo": ["wonumber", "workorder", "workorderno", "orderno", "order", "wo"], "nt": ["notificationno", "notification", "notif", "notificationnumber"],
 "rd": ["reportdate", "reported", "notificationdate", "created", "datereported"], "sd": ["startdate", "start", "actualstart", "datestarted"], "cd": ["completiondate", "completed", "finishdate", "enddate", "actualfinish", "dateclosed"],
 "st": ["status", "wostatus"], "tag": ["equipmenttag", "tag", "assettag", "equipment", "equipmentno", "asset"], "nm": ["equipmentname", "assetname", "description", "equipmentdescription"],
 "fl": ["functionallocation", "funcloc", "floc"], "ac": ["areacode", "area"], "an": ["areaname", "unitname", "unit"], "type": ["worktype", "ordertype", "type", "maintenancetype"],
 "disc": ["discipline", "craft", "trade"], "pri": ["priority"], "crit": ["criticality", "criticalityclass", "abcindicator"], "prob": ["problemdescription", "problem", "failure", "faultdescription", "shorttext", "description1", "symptom"],
 "root": ["rootcause", "cause", "failurecause"], "act": ["correctiveaction", "action", "workdone", "actiontaken", "workperformed"], "parts": ["sparepartsused", "spareparts", "parts", "materials"],
 "bd": ["breakdown", "breakdownyn", "isbreakdown"], "dt": ["downtimehours", "downtime", "downtimehrs"], "lh": ["laborhours", "labourhours", "manhours", "hours"], "lc": ["laborcostidr", "laborcost", "labourcost"],
 "mc": ["materialcostidr", "materialcost"], "tc": ["totalcostidr", "totalcost", "cost"], "rep": ["reportedby", "reporter"], "exe": ["executedby", "technician", "performedby"], "app": ["approvedby", "approver"],
 "ilk": ["relatedinterlock", "interlock", "sequence"], "rem": ["remarks", "comments", "notes"]}
NUM = {"dt", "lh", "lc", "mc", "tc", "ac"}
DATES = {"rd", "sd", "cd"}

def norm(h): return re.sub(r"[^a-z0-9]", "", str(h or "").lower())

def rows_of(path, sheet):
    if path.lower().endswith(".csv"):
        with open(path, newline="", encoding="utf-8-sig") as f: return list(csv.reader(f))
    import openpyxl
    wb = openpyxl.load_workbook(path, read_only=True, data_only=True)
    ws = wb[sheet] if sheet else wb.worksheets[0]
    return [list(r) for r in ws.iter_rows(values_only=True)]

def iso(v):
    if v in (None, ""): return None
    if isinstance(v, datetime.datetime): return v.strftime("%Y-%m-%dT%H:%M")
    if isinstance(v, datetime.date): return v.strftime("%Y-%m-%dT00:00")
    s = str(v).strip().replace(" ", "T")
    m = re.match(r"(\d{4}-\d\d-\d\d)(?:T(\d\d:\d\d))?", s)
    if m: return m.group(1) + "T" + (m.group(2) or "00:00")
    for f in ("%d/%m/%Y %H:%M", "%d/%m/%Y", "%m/%d/%Y", "%d-%m-%Y"):
        try:
            d = datetime.datetime.strptime(str(v).strip(), f); return d.strftime("%Y-%m-%dT%H:%M")
        except ValueError: pass
    return s

def main():
    a = [x for x in sys.argv[1:] if not x.startswith("--")]
    if len(a) < 2: sys.exit(__doc__)
    sheet = (sys.argv[sys.argv.index("--sheet") + 1] if "--sheet" in sys.argv else None)
    over = {}
    if "--map" in sys.argv:
        for kv in sys.argv[sys.argv.index("--map") + 1].split(","):
            k, v = kv.split("="); over[k.strip()] = v.strip()
    rows = rows_of(a[0], sheet)
    hi = next(i for i, r in enumerate(rows) if sum(1 for c in r if c not in (None, "")) >= 4)
    head = rows[hi]; idx = {}
    for k, syn in FIELDS.items():
        if k in over:
            idx[k] = next(i for i, h in enumerate(head) if str(h).strip() == over[k]); continue
        for s in syn:
            j = next((i for i, h in enumerate(head) if norm(h) == s), None)
            if j is not None and j not in idx.values(): idx[k] = j; break
    out = []
    for r in rows[hi + 1:]:
        if not any(c not in (None, "") for c in r): continue
        o = {}
        for k in FIELDS:
            v = r[idx[k]] if k in idx and idx[k] < len(r) else None
            if k in DATES: v = iso(v)
            elif k in NUM:
                try: v = float(v) if v not in (None, "") else None
                except (TypeError, ValueError): v = None
                if v is None and k in ("lc", "mc", "tc"): v = 0
                if v is not None and v == int(v) and k != "dt": v = int(v)
            elif k == "bd":
                v = {"yes": "Yes", "y": "Yes", "true": "Yes", "1": "Yes", "no": "No", "n": "No", "false": "No", "0": "No"}.get(str(v).strip().lower()) if v not in (None, "") else None
            else: v = None if v in (None, "") else str(v).strip()
            o[k] = v
        if o.get("wo") and o.get("tag"): out.append(o)
    json.dump(out, open(a[1], "w", encoding="utf-8"), ensure_ascii=False, separators=(",", ":"))
    miss = [k for k in FIELDS if k not in idx]
    print(f"{len(out)} work orders written to {a[1]}")
    print("matched:", ", ".join(f"{k}<-{head[i]}" for k, i in idx.items()))
    if miss: print("not found (will be empty):", ", ".join(miss))
    need = [k for k in ("wo", "tag", "rd", "type") if k not in idx]
    if need: sys.exit("ERROR missing required columns: " + ", ".join(need) + "  (use --map)")

if __name__ == "__main__":
    main()
