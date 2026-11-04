"""SPI learned price for parts without a purchase price (owner: Claude A). Only 1,229 of 7,481 parts carry a PO price, so every money
figure leaves most of the stock out. This model learns log unit price from the priced parts and estimates the rest; it never replaces a
PO price. Writes table ml_price and validation keys price_* in ml_model.

Features: item type, spec family (shrunk to its item type), equipment class in the spec family, unit, part number series (4100, 4200,
4300), drawing or OEM part (DWG, FOR <tag>), size (NPS), pressure rating, material grade present, MRP type, criticality, installed
quantity, and description words (shrunk means of log price per word). Ridge regression on log price, numpy only.
Validation: 5-fold cross-validation on the priced parts, against the median price of the item type. Reports median absolute error in
percent, the share of parts within a factor of 2, and the 10% to 90% band of the residual, which gives each estimate its low and high.
Usage: python3.13 spi/ml/train_price.py [spi/db/spi.sqlite]"""
import json, math, os, re, sqlite3, sys
from collections import defaultdict
import numpy as np

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
path = sys.argv[1] if len(sys.argv) > 1 else os.path.join(ROOT, "spi/db/spi.sqlite")
con = sqlite3.connect(path)
rows = con.execute("""select m.material_no, m.descr, coalesce(m.unit,''), coalesce(m.item_type,''), coalesce(m.spec_family,''), m.nps, m.rating, m.grade, coalesce(m.mrp_type,''),
  coalesce(p.unit_price_idr, m.last_unit_price_idr), coalesce(p.crit_rank,0), coalesce(p.installed_total,0) from material m left join part_profile p using(material_no)""").fetchall()
STOP = {"FOR", "AND", "WITH", "OF", "TYPE", "MODEL", "DWG", "SIZE", "IN", "MM", "X"}
def words(d):
    d = str(d or "").upper(); out = set()
    for seg in d.split(",")[1:4]:
        for w in re.findall(r"[A-Z]{3,}", seg):
            if w not in STOP: out.add(w)
    return out
def num(v):
    m = re.search(r"\d+(\.\d+)?(/\d+)?", str(v or ""))
    if not m: return 0.0
    s = m.group(0)
    if "/" in s:
        a, b = s.split("/"); return float(a) / float(b)
    return float(s)
R = []
for r in rows:
    mat, descr, unit, it, sf, nps, rating, grade, mrp, price, crit, inst = r
    cls = sf.split("|")[2] if sf.count("|") >= 2 else ""
    R.append(dict(mat=mat, it=it, sf=sf, cls=cls, unit=unit, series=str(mat)[:4], dwg=1.0 if re.search(r"DWG|FOR [A-Z]{1,5}-\d", str(descr or "").upper()) else 0.0,
                  nps=num(nps), rating=num(rating), grade=1.0 if grade else 0.0, mrp=mrp, crit=float(crit), inst=math.log1p(inst or 0), w=words(descr), price=price if price and price > 0 else None))
priced = [r for r in R if r["price"]]; y_all = np.array([math.log(r["price"]) for r in priced])
def encoders(train):
    mu = float(np.mean([math.log(r["price"]) for r in train]))
    def enc(key, k=5, prior=None):
        g = defaultdict(list)
        for r in train: g[r[key]].append(math.log(r["price"]))
        return {kk: (sum(v) + k * mu) / (len(v) + k) for kk, v in g.items()}
    it = enc("it"); cls = enc("cls"); unit = enc("unit"); series = enc("series"); mrp = enc("mrp")
    g = defaultdict(list)
    for r in train: g[r["sf"]].append(math.log(r["price"]))
    itp = {}
    for r in train: itp.setdefault(r["sf"], it.get(r["it"], mu))
    sf = {kk: (sum(v) + 5 * itp[kk]) / (len(v) + 5) for kk, v in g.items()}
    gw = defaultdict(list)
    for r in train:
        for w in r["w"]: gw[w].append(math.log(r["price"]))
    wd = {w: (sum(v) + 8 * mu) / (len(v) + 8) for w, v in gw.items() if len(v) >= 2}
    return dict(mu=mu, it=it, cls=cls, unit=unit, series=series, mrp=mrp, sf=sf, wd=wd)
def X(rs, E):
    mu = E["mu"]; out = []
    for r in rs:
        base_it = E["it"].get(r["it"], mu); ws = [E["wd"][w] for w in r["w"] if w in E["wd"]]
        out.append([base_it, E["sf"].get(r["sf"], base_it), E["cls"].get(r["cls"], mu), E["unit"].get(r["unit"], mu), E["series"].get(r["series"], mu), E["mrp"].get(r["mrp"], mu),
                    (np.mean(ws) if ws else base_it), (max(ws) if ws else base_it), r["dwg"], math.log1p(r["nps"]), math.log1p(r["rating"]), r["grade"], r["crit"], r["inst"]])
    return np.array(out, float)
def ridge(Xm, y, l2=3.0):
    mu, sd = Xm.mean(0), Xm.std(0); sd[sd < 1e-9] = 1; Z = (Xm - mu) / sd; Xb = np.column_stack([np.ones(len(Z)), Z])
    w = np.linalg.solve(Xb.T @ Xb + l2 * np.diag(np.r_[0, np.ones(Z.shape[1])]), Xb.T @ y); return (w, mu, sd)
def pred(m, Xm):
    w, mu, sd = m; return np.column_stack([np.ones(len(Xm)), (Xm - mu) / sd]) @ w
# 5-fold cross-validation
rng = np.random.default_rng(7); fold = rng.integers(0, 5, len(priced)); res = np.zeros(len(priced)); base = np.zeros(len(priced))
for k in range(5):
    tr = [r for r, f in zip(priced, fold) if f != k]; te_i = np.where(fold == k)[0]; te = [priced[i] for i in te_i]
    E = encoders(tr); m = ridge(X(tr, E), np.array([math.log(r["price"]) for r in tr]))
    res[te_i] = pred(m, X(te, E)) - y_all[te_i]
    med = defaultdict(list)
    for r in tr: med[r["it"]].append(math.log(r["price"]))
    allmed = float(np.median([math.log(r["price"]) for r in tr]))
    base[te_i] = np.array([np.median(med[r["it"]]) if med[r["it"]] else allmed for r in te]) - y_all[te_i]
ape = lambda e: float(np.median(np.abs(np.exp(e) - 1)))
within2 = lambda e: float(np.mean(np.abs(e) <= math.log(2)))
q10, q90 = (float(x) for x in np.quantile(res, [0.1, 0.9]))
E = encoders(priced); m = ridge(X(priced, E), y_all)
unp = [r for r in R if not r["price"]]; pu = pred(m, X(unp, E))
con.executescript("drop table if exists ml_price; create table ml_price (material_no integer primary key, price_idr real, price_low_idr real, price_high_idr real, basis text)")
out = [(r["mat"], r["price"], r["price"], r["price"], "PO price (Data)") for r in priced] + [(r["mat"], round(math.exp(p), 0), round(math.exp(p + q10), 0), round(math.exp(p + q90), 0), "estimated from similar parts (Estimate)") for r, p in zip(unp, pu)]
con.executemany("insert into ml_price values (?,?,?,?,?)", out)
stock = dict(con.execute("select material_no, coalesce(stock,0) from part_profile").fetchall())
sv_po = sum(stock.get(r["mat"], 0) * r["price"] for r in priced); sv_est = sum(stock.get(r["mat"], 0) * math.exp(p) for r, p in zip(unp, pu))
meta = {"method": "ridge on log unit price: item type, spec family, equipment class, unit, part series, drawing part, size, rating, grade, MRP type, criticality, installed quantity, description words",
        "priced_parts": len(priced), "estimated_parts": len(unp), "cv_median_abs_error": round(ape(res), 3), "cv_within_2x": round(within2(res), 3),
        "baseline_median_abs_error": round(ape(base), 3), "baseline_within_2x": round(within2(base), 3), "band_low_factor": round(math.exp(q10), 3), "band_high_factor": round(math.exp(q90), 3),
        "stock_value_po_prices": round(sv_po), "stock_value_estimated_parts": round(sv_est), "baseline": "median price of the item type"}
con.execute("create table if not exists ml_model (key text primary key, value text)")
con.executemany("insert or replace into ml_model values (?,?)", [("price_" + k, json.dumps(v)) for k, v in meta.items()])
try:
    con.execute("delete from data_dictionary where table_name='ml_price'")
    con.executemany("insert or replace into data_dictionary values (?,?,?,?)", [("ml_price", "", "Unit price per part: the PO price where there is one, otherwise a learned estimate from similar parts with a 10% to 90% range", len(out)),
        ("ml_price", "price_idr", "Unit price in IDR: PO price (Data) or estimate (Estimate), see basis", None), ("ml_price", "basis", "PO price (Data) or estimated from similar parts (Estimate)", None)])
except sqlite3.OperationalError: pass
con.commit(); con.close()
print(json.dumps({k: meta[k] for k in ("priced_parts", "estimated_parts", "cv_median_abs_error", "cv_within_2x", "baseline_median_abs_error", "baseline_within_2x", "band_low_factor", "band_high_factor", "stock_value_po_prices", "stock_value_estimated_parts")}))
