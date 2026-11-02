#!/usr/bin/env python3
"""Check a case pack before building it.   python3 tools/pack_validate.py <case-id or folder>
Exit code 1 if there are errors. Warnings do not stop the build but mean something will look empty. See docs/CASE_PACKS.md for the schema."""
import json, os, re, sys, datetime

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
arg = sys.argv[1] if len(sys.argv) > 1 else "lldpe"
CD = arg if os.path.isabs(arg) or os.path.isdir(arg) else os.path.join(ROOT, "cases", arg)
errs, warns = [], []
E = lambda m: errs.append(m)
W = lambda m: warns.append(m)

def load(name, required=True):
    p = os.path.join(CD, name)
    if not os.path.exists(p):
        (E if required else W)(f"{name}: file missing")
        return None
    try:
        return json.load(open(p, encoding="utf-8"))
    except Exception as e:
        E(f"{name}: not valid JSON ({e})"); return None

KB, DSIL, GA, MH, EV = load("kb.json"), load("dsil.json"), load("ga.json", False), load("mh.json"), load("eval_cases.json", False)
case = load("case.json", False)
if KB is None:
    print("\n".join("ERROR " + e for e in errs)); sys.exit(1)

def need(obj, keys, where):
    for k in keys:
        if k not in obj or obj[k] in (None, ""):
            E(f"{where}: field '{k}' missing or empty")

for k in ("sets", "assets", "docs", "chunks", "inst", "mnt", "opl", "nz", "bom", "issues"):
    if not isinstance(KB.get(k), list):
        E(f"kb.json: '{k}' must be a list (use [] if the case has none)")
sets = KB.get("sets", [])
if not sets: E("kb.json: no equipment sets")
if len(sets) > 12: W(f"{len(sets)} equipment sets: the plot plan and overview are laid out for up to 8 (4 x 2); more will be small")
ns = [s.get("n") for s in sets]
if ns != list(range(1, len(sets) + 1)): E("kb.json: sets must be numbered 1..N in order (n)")
tags = {}
for s in sets:
    w = f"set {s.get('n')} {s.get('tag')}"
    need(s, ["n", "tag", "asset", "name", "unit", "area", "pid", "ga", "pp", "fluid", "crit"], w)
    if s.get("tag") in tags: E(f"{w}: duplicate tag")
    tags[s.get("tag")] = s.get("n")
    need(s.get("pid") or {}, ["doc", "ref", "title", "sys"], w + " pid")
    need(s.get("ga") or {}, ["document_id", "dwg_no", "overall_length_mm", "height_mm"], w + " ga")
    need(s.get("pp") or {}, ["document_id", "footprint_text", "grid_ref"], w + " pp")
    fp = (s.get("pp") or {}).get("footprint_text", "")
    if fp and not re.search(r"[\d.]+\s*x\s*[\d.]+", fp): E(f"{w}: pp.footprint_text must look like '5.0 x 4.0 m'")
    if not isinstance(s.get("revs"), list): W(f"{w}: revs missing (revision table)")
doc_ids = {d.get("id") for d in KB.get("docs", [])}
asset_ids = {a.get("id") for a in KB.get("assets", [])}
if len(doc_ids) != len(KB.get("docs", [])): E("docs: duplicate id")
for s in sets:
    for k in ("pid", "ga", "pp"):
        did = (s.get(k) or {}).get("document_id") or (s.get(k) or {}).get("doc")
        if did and did not in doc_ids: W(f"set {s['n']}: {k} document {did} is not in docs")
    if s.get("asset") not in asset_ids: W(f"set {s['n']}: asset {s.get('asset')} is not in assets")
for d in KB.get("docs", []):
    need(d, ["id", "name", "type"], f"doc {d.get('id')}")
    if d.get("asset") and d["asset"] not in asset_ids: W(f"doc {d['id']}: asset {d['asset']} unknown")
cids = set()
for c in KB.get("chunks", []):
    need(c, ["id", "doc", "text"], f"chunk {c.get('id')}")
    if c.get("id") in cids: E(f"chunk {c['id']}: duplicate id")
    cids.add(c.get("id"))
    if c.get("doc") not in doc_ids and not str(c.get("doc", "")).startswith(("DS-", "IL-")): W(f"chunk {c['id']}: doc {c.get('doc')} is not in docs")
for s in sets:
    if not any(c.get("doc") == (s.get("pid") or {}).get("doc") and c.get("sec") == "Process Description" for c in KB["chunks"]):
        W(f"set {s['n']}: no 'Process Description' chunk on the P&ID document (the equipment page summary will fall back to the title)")
for i in KB.get("inst", []):
    need(i, ["id", "tag", "type", "set"], f"inst {i.get('id')}")
    if i.get("set") not in ns: E(f"inst {i.get('id')}: set {i.get('set')} does not exist")
for o in KB.get("opl", []):
    need(o, ["no", "set", "title", "steps"], f"opl {o.get('no')}")
    if o.get("set") not in ns: E(f"opl {o.get('no')}: set {o.get('set')} does not exist")
gdocs = {(s.get("ga") or {}).get("document_id") for s in sets}
for z in KB.get("nz", []):
    if z.get("document_id") not in gdocs: W(f"nozzle {z.get('nozzle_mark')} of {z.get('tag')}: document {z.get('document_id')} is not a GA document of any set")
for s in sets:
    if not any(i.get("set") == s["n"] for i in KB.get("inst", [])): W(f"set {s['n']}: no instruments, the P&ID will have only the main equipment")
    if not any(o.get("set") == s["n"] for o in KB.get("opl", [])): W(f"set {s['n']}: no one point lessons")

# ---- datasheets and interlocks
if DSIL is None or not isinstance(DSIL, dict) or "DS" not in DSIL or "IL" not in DSIL:
    E("dsil.json: must be {\"DS\": {tag: datasheet}, \"IL\": {tag: interlock}}")
else:
    for s in sets:
        t = s["tag"]
        ds, il = DSIL["DS"].get(t), DSIL["IL"].get(t)
        if not ds: E(f"dsil.json: no datasheet (DS) for {t}")
        else:
            need(ds, ["no", "title", "secs"], f"DS {t}")
            if not all(isinstance(x, list) and len(x) == 2 and isinstance(x[1], list) for x in ds.get("secs", [])): E(f"DS {t}: secs must be [[section name, [[label, value], ...]], ...]")
        if not il: E(f"dsil.json: no interlock (IL) for {t}")
        else:
            need(il, ["no", "logic", "desc", "sil", "eff", "trig", "perm", "notes"], f"IL {t}")
            for tr in il.get("trig", []):
                need(tr, ["id", "c", "tag", "sp", "vote", "fx"], f"IL {t} trigger {tr.get('id')}")
                if len(tr.get("fx", [])) != len(il.get("eff", [])): E(f"IL {t} trigger {tr.get('id')}: fx has {len(tr.get('fx', []))} flags but there are {len(il.get('eff', []))} effects")
            if not il.get("trig"): W(f"IL {t}: no trip initiators (use a 'N/A' logic for a control loop)")
            if il.get("perm") and il["perm"][-1][0] != "=>": W(f"IL {t}: last permissive row should be ['=>', 'ALL permissives TRUE ...', 'RUN']")

# ---- maintenance history
iso = lambda x: bool(re.match(r"\d{4}-\d\d-\d\dT?\d{0,2}:?\d{0,2}", str(x or "")))
if MH is not None:
    if not isinstance(MH, list) or not MH: E("mh.json: must be a non-empty list of work orders")
    else:
        seen = set()
        for r in MH:
            w = f"work order {r.get('wo')}"
            need(r, ["wo", "tag", "rd", "type"], w)
            if r.get("wo") in seen: E(f"{w}: duplicate")
            seen.add(r.get("wo"))
            if r.get("tag") not in tags: W(f"{w}: tag {r.get('tag')} is not an equipment set tag")
            for k in ("rd", "sd", "cd"):
                if r.get(k) and not iso(r[k]): E(f"{w}: {k} must be an ISO date like 2025-03-01T08:00")
            if r.get("bd") not in ("Yes", "No", None): E(f"{w}: bd (breakdown) must be 'Yes', 'No' or null when unknown")
            if r.get("dt") is not None and not isinstance(r.get("dt"), (int, float)): E(f"{w}: dt (downtime hours) must be a number or null")
        per = {t: sum(1 for r in MH if r.get("tag") == t) for t in tags}
        for t, c in per.items():
            if c < 6: W(f"{t}: only {c} work orders, the predictive model needs about 6 or more to fit a trend")

# ---- evaluation questions
if EV is not None:
    if not isinstance(EV, list): E("eval_cases.json: must be a list")
    else:
        if len(EV) < 20: W(f"eval_cases.json: {len(EV)} questions; 40 or more makes the accuracy score meaningful")
        for q in EV:
            need(q, ["id", "q"], f"eval case {q.get('id')}")
            if not any(k in q for k in ("must", "any", "refuse", "not", "max_conf")): E(f"eval case {q.get('id')}: needs at least one of must, any, not, refuse, max_conf")
else:
    W("eval_cases.json missing: the answer accuracy page will have nothing to score")

if GA is not None:
    for s in sets:
        g = GA.get(str(s["n"]))
        if not g: W(f"ga.json: no parts list or nozzles for set {s['n']} (they will be generated from the nozzle and BOM tables)")
        elif not g.get("bom") or not g.get("nz"): W(f"ga.json set {s['n']}: bom and nz should both be lists")

for e in errs: print("ERROR  " + e)
for w in warns: print("warn   " + w)
print(f"\n{os.path.basename(CD)}: {len(sets)} sets, {len(KB.get('docs', []))} documents, {len(KB.get('chunks', []))} text chunks, {len(KB.get('inst', []))} instruments, "
      f"{len(KB.get('opl', []))} OPL, {len(MH or [])} work orders | {len(errs)} errors, {len(warns)} warnings")
sys.exit(1 if errs else 0)
