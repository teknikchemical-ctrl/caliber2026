"""SPI learned models on the rest of the case data (owner: Claude A). Runs after spi/ml/train.py and writes into spi/db/spi.sqlite.

1. Equipment notification risk (FuncLoc list, Notif History, Mitem/Mplan, BoM, Movement):
   panel of functional location x month; target = at least one notification in the next 3 months. Features known at the origin:
   notifications in the last 3, 6 and 12 months, high or emergency ones in the last 12, months since the last one, criticality,
   equipment class (most common classes), maintenance items on the location and those due in the window, parts in the bill of
   materials, issue lines on the location in the last 6 months. Penalised logistic regression (numpy), trained on origins up to
   2026-03 and validated on the origins 2026-04 to 2026-06 (targets up to 2026-09). Output: ml_equip_risk.
2. Lead time (PR PO): ridge on log lead days per deduplicated PO line with supplier, purchasing group and item type effects
   (shrunk means), log price, log quantity and the request month. Validated on the latest 20% of lines against the part median and
   the overall median. Output: ml_leadtime per part (learned median and 90% lead time); parts with their own PO history keep it.
Usage: python3.13 spi/ml/train_more.py [spi/db/spi.sqlite]"""
import json, math, os, sqlite3, sys
from collections import defaultdict
import numpy as np

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
path = sys.argv[1] if len(sys.argv) > 1 else os.path.join(ROOT, "spi/db/spi.sqlite")
con = sqlite3.connect(path)
q = lambda s, a=(): con.execute(s, a).fetchall()

def logit_fit(X, y, l2=10.0, it=40):
    mu, sd = X.mean(0), X.std(0); sd[sd < 1e-9] = 1.0; Z = (X - mu) / sd
    Xb = np.column_stack([np.ones(len(Z)), Z]); w = np.zeros(Xb.shape[1]); w[0] = math.log((y.mean() + 1e-6) / (1 - y.mean() + 1e-6))
    pen = np.r_[0, np.ones(len(w) - 1)] * l2
    def obj(w):
        e = Xb @ w; return float(np.sum(np.logaddexp(0, e) - y * e) + 0.5 * np.sum(pen * w * w))
    f0 = obj(w)
    for _ in range(it):
        e = Xb @ w; p = 1 / (1 + np.exp(-e)); g = Xb.T @ (p - y) + pen * w
        H = (Xb * (p * (1 - p))[:, None]).T @ Xb + np.diag(pen + 1e-8); step = np.linalg.solve(H, g); a = 1.0
        while a > 1e-4:
            w1 = w - a * step; f1 = obj(w1)
            if f1 <= f0: break
            a /= 2
        if f0 - f1 < 1e-7 * max(1.0, abs(f0)): w, f0 = w1, f1; break
        w, f0 = w1, f1
    return (w, mu, sd)
def logit_pred(m, X):
    w, mu, sd = m; return 1 / (1 + np.exp(-np.clip(np.column_stack([np.ones(len(X)), (X - mu) / sd]) @ w, -30, 30)))
def auc(sc, yy):
    o = np.argsort(sc); r = np.empty(len(sc)); r[o] = np.arange(len(sc)); pos = yy.sum(); n = len(yy)
    return float((r[yy].sum() - pos * (pos - 1) / 2) / max(1, pos * (n - pos)))
def add(ym, k):
    y, m = map(int, ym.split("-")); m += k; y += (m - 1) // 12; m = (m - 1) % 12 + 1; return f"{y:04d}-{m:02d}"

MONTHS = [r[0] for r in q("select distinct substr(notif_date,1,7) from notification where notif_date is not null order by 1")]
MONTHS = [m for m in MONTHS if m >= "2025-05"]; T = len(MONTHS); IX = {m: i for i, m in enumerate(MONTHS)}
FUT = [add(MONTHS[-1], k) for k in range(1, 13)]
# --- 1. equipment notification risk
locs = q("select funcloc, coalesce(criticality,'C'), coalesce(eq_class,''), coalesce(eq_class_name,''), coalesce(tag,funcloc) from funcloc")
LI = {r[0]: i for i, r in enumerate(locs)}; L = len(locs)
nt = np.zeros((L, T)); hi = np.zeros((L, T))
for f, m, p in q("select funcloc, substr(notif_date,1,7), priority from notification"):
    if f in LI and m in IX: nt[LI[f], IX[m]] += 1; hi[LI[f], IX[m]] += 1 if p in ("High", "Emergency", "Very High") else 0
iss = np.zeros((L, T))
for f, m, n in q("select funcloc, month, count(*) from movement where funcloc is not null group by 1, 2"):
    if f in LI and m in IX: iss[LI[f], IX[m]] += n
bom = defaultdict(int)
for f, n in q("select funcloc, count(*) from bom group by 1"): bom[f] = n
mi = defaultdict(int); due = np.zeros((L, T + 12))
ALLM = MONTHS + FUT; AX = {m: i for i, m in enumerate(ALLM)}
for f, s, c in q("select funcloc, start_of_cycle, cast(cycle_months as integer) from maint_item"):
    if f not in LI: continue
    mi[f] += 1
    if not s or not c or c < 1: continue
    y, m = map(int, s[:7].split("-")); k = 0
    while k < 200:
        ym = f"{y:04d}-{m:02d}"
        if ym > ALLM[-1]: break
        if ym in AX: due[LI[f], AX[ym]] += 1
        m += c
        while m > 12: m -= 12; y += 1
        k += 1
top_cls = [c for c, _ in sorted(defaultdict(int, {c: n for c, n in q("select eq_class, count(*) from funcloc f join notification n using(funcloc) group by 1")}).items(), key=lambda x: -x[1])[:12] if c]
CR = {"S": 3, "A": 2, "B": 1, "C": 0}
crit = np.array([CR.get(r[1], 0) for r in locs], float); cls1 = np.array([[1.0 if r[2] == c else 0.0 for c in top_cls] for r in locs])
nbom = np.log1p(np.array([bom[r[0]] for r in locs], float)); nmi = np.log1p(np.array([mi[r[0]] for r in locs], float))
NAMES = ["notifications last 3 months", "notifications last 6 months", "notifications last 12 months", "high or emergency last 12 months", "months since last notification",
         "criticality", "maintenance items", "maintenance due in the window", "parts in the bill of materials", "issue lines last 6 months"] + ["class " + c for c in top_cls]
def feats(t):  # origin t: data up to month t-1
    s = lambda a, k: a[:, max(0, t - k):t].sum(1)
    last = np.full(L, 24.0)
    for k in range(1, t + 1):
        hit = (nt[:, t - k] > 0) & (last == 24.0); last[hit] = k
    return np.column_stack([np.log1p(s(nt, 3)), np.log1p(s(nt, 6)), np.log1p(s(nt, 12)), np.log1p(s(hi, 12)), np.minimum(last, 24) / 12, crit, nmi,
                            np.log1p(due[:, t:t + 3].sum(1)), nbom, np.log1p(s(iss, 6)), cls1])
def target(t): return (nt[:, t:t + 3].sum(1) > 0).astype(float)
active = (nt.sum(1) > 0) | (np.array([mi[r[0]] for r in locs]) > 0) | (nbom > 0)
idx = np.where(active)[0]
train_o = list(range(6, T - 5)); test_o = list(range(T - 5, T - 2))
X = np.vstack([feats(t)[idx] for t in train_o]); y = np.concatenate([target(t)[idx] for t in train_o])
m = logit_fit(X, y)
Xt = np.vstack([feats(t)[idx] for t in test_o]); yt = np.concatenate([target(t)[idx] for t in test_o]); pt = logit_pred(m, Xt)
base = np.concatenate([(feats(t)[idx][:, 2] > 0).astype(float) for t in test_o])  # baseline: any notification in the last 12 months
auc_m, auc_b = auc(pt, yt > 0), auc(base + 1e-6 * np.random.default_rng(1).random(len(base)), yt > 0)
brier, brier0 = float(((pt - yt) ** 2).mean()), float(((yt.mean() - yt) ** 2).mean())
k10 = max(1, len(pt) // 10); cap = float(yt[np.argsort(-pt)[:k10]].sum() / max(1, yt.sum()))
calib = float(yt.sum() / max(pt.sum(), 1e-9))
# calibration as an intercept shift on the validation origins (keeps chances below 1), and the mean count when there is one
lg = lambda p: np.log(np.clip(p, 1e-6, 1 - 1e-6) / (1 - np.clip(p, 1e-6, 1 - 1e-6)))
lo_, hi_ = -5.0, 5.0
for _ in range(60):
    mid = (lo_ + hi_) / 2
    if (1 / (1 + np.exp(-(lg(pt) + mid)))).mean() > yt.mean(): hi_ = mid
    else: lo_ = mid
shift = (lo_ + hi_) / 2
cnt = np.concatenate([nt[idx, t:t + 3].sum(1) for t in train_o]); ytr = np.concatenate([target(t)[idx] for t in train_o]); cbar = float(cnt[ytr > 0].mean()) if (ytr > 0).any() else 1.0
m = logit_fit(np.vstack([feats(t)[idx] for t in range(6, T - 2)]), np.concatenate([target(t)[idx] for t in range(6, T - 2)]))
Xn = feats(T)[idx]; pn = np.clip(1 / (1 + np.exp(-(lg(logit_pred(m, Xn)) + shift))), 0, 0.99)
rate = nt[idx, max(0, T - 12):T].sum(1) / 12.0  # observed monthly rate, last 12 months
exp12 = np.where(rate * 12 >= 6, rate * 12, 0.5 * (pn * cbar * 4) + 0.5 * (rate * 12))   # blend: model chance x mean count when there is one x 4 quarters, and the observed rate (Estimate)
w0 = m[0][1:]; drv = []
Zs = (Xn - m[1]) / m[2]
for j in range(len(idx)):
    c = Zs[j] * w0; o = np.argsort(-c)[:2]; drv.append("; ".join(NAMES[k] for k in o if c[k] > 0.05))
con.executescript("drop table if exists ml_equip_risk; create table ml_equip_risk (funcloc text primary key, tag text, eq_class text, criticality text, p_notif_3m real, expected_notifs_12m real, notifs_last_12m integer, high_last_12m integer, maint_items integer, bom_parts integer, drivers text)")
rows = []
for j, i in enumerate(idx):
    r = locs[i]; rows.append((r[0], r[4], r[2], r[1], round(float(pn[j]), 4), round(float(exp12[j]), 2), int(nt[i, max(0, T - 12):T].sum()), int(hi[i, max(0, T - 12):T].sum()), int(mi[r[0]]), int(bom[r[0]]), drv[j]))
con.executemany("insert into ml_equip_risk values (?,?,?,?,?,?,?,?,?,?,?)", rows)
coef = sorted(zip(NAMES, w0.tolist()), key=lambda x: -abs(x[1]))
meta_e = {"method": "penalised logistic regression on functional location x month, target: a notification in the next 3 months", "locations": int(len(idx)), "train_rows": int(len(y)),
          "validation_origins": "3-month windows starting " + MONTHS[test_o[0]] + " to " + MONTHS[test_o[-1]], "auc_model": round(auc_m, 3), "auc_baseline": round(auc_b, 3), "brier_model": round(brier, 4), "brier_base_rate": round(brier0, 4),
          "top10_capture": round(cap, 3), "calibration_factor": round(calib, 3), "calibration_shift": round(shift, 3), "mean_count_when_any": round(cbar, 2), "drivers": [[n, round(v, 3)] for n, v in coef[:8]], "baseline": "any notification on the location in the last 12 months"}
# --- 2. lead time
po = q("select distinct pr_no, pr_item, po_no, po_item, l.material_no, l.qty, coalesce(l.unit_price, l.amount), l.lead_days, coalesce(l.supplier_code,0), coalesce(l.purch_group,''), coalesce(m.item_type,''), l.pr_date from po_line l left join material m using(material_no) where l.lead_days > 0 and l.lead_days <= 730 and l.pr_date is not null")
po.sort(key=lambda r: r[11]); n = len(po); cut = int(n * 0.8); tr, te = po[:cut], po[cut:]
def enc(rows, col, k=8):
    g = defaultdict(list)
    for r in rows: g[r[col]].append(math.log(r[7]))
    mu = float(np.mean([math.log(r[7]) for r in rows]))
    return {key: (sum(v) + k * mu) / (len(v) + k) for key, v in g.items()}, mu
def design(rows, E):
    (es, mu), (eg, _), (et, _), (ep, _) = E
    return np.array([[es.get(r[8], mu), eg.get(r[9], mu), et.get(r[10], mu), ep.get(r[4], mu), math.log1p(r[6] or 0), math.log1p(r[5] or 0), int(r[11][5:7]) in (11, 12, 1)] for r in rows], float)
def ridge(X, y, l2=1.0):
    Xb = np.column_stack([np.ones(len(X)), X]); A = Xb.T @ Xb + l2 * np.diag(np.r_[0, np.ones(X.shape[1])]); return np.linalg.solve(A, Xb.T @ y)
E = [enc(tr, 8), enc(tr, 9), enc(tr, 10), enc(tr, 4, 3)]
w = ridge(design(tr, E), np.log([r[7] for r in tr]))
pred = np.exp(np.column_stack([np.ones(len(te)), design(te, E)]) @ w); act = np.array([r[7] for r in te], float)
pmed = defaultdict(list)
for r in tr: pmed[r[4]].append(r[7])
med_all = float(np.median([r[7] for r in tr]))
b_part = np.array([np.median(pmed[r[4]]) if pmed[r[4]] else med_all for r in te]); b_all = np.full(len(te), med_all)
mae = lambda f: float(np.mean(np.abs(f - act)))
# unseen parts only: the case the model is for
uns = np.array([not pmed[r[4]] for r in te])
mae_uns = float(np.mean(np.abs(pred[uns] - act[uns]))) if uns.any() else None; mae_uns_b = float(np.mean(np.abs(b_all[uns] - act[uns]))) if uns.any() else None
E = [enc(po, 8), enc(po, 9), enc(po, 10), enc(po, 4, 3)]
w = ridge(design(po, E), np.log([r[7] for r in po])); res = np.log([r[7] for r in po]) - np.column_stack([np.ones(n), design(po, E)]) @ w
q90 = float(np.quantile(res, 0.9))
# per part: main supplier and group of the part if any, otherwise the item type alone; typical price and quantity
mats = q("select m.material_no, coalesce(m.item_type,''), coalesce(p.unit_price_idr, m.last_unit_price_idr, 0), p.lt_median, p.lt_p90 from material m left join part_profile p using(material_no)")
sup = {}
for r in po: sup.setdefault(r[4], (r[8], r[9]))
(es, mu), (eg, _), (et, _), (ep, _) = E
out = []
for mat, typ, price, ltm, lt90 in mats:
    s, g = sup.get(mat, (None, None))
    x = np.array([1, es.get(s, mu), eg.get(g, mu), et.get(typ, mu), ep.get(mat, mu), math.log1p(price or 0), math.log1p(1), 0.0])
    lp = float(np.exp(x @ w)); lp90 = float(np.exp(x @ w + q90))
    out.append((mat, round(lp, 1), round(lp90, 1), ltm, lt90, "part PO history" if ltm else "learned from supplier, group and item type"))
con.executescript("drop table if exists ml_leadtime; create table ml_leadtime (material_no integer primary key, lead_pred_days real, lead_pred_p90_days real, lead_hist_days real, lead_hist_p90_days real, basis text)")
con.executemany("insert into ml_leadtime values (?,?,?,?,?,?)", out)
meta_l = {"method": "ridge on log lead days with shrunk supplier, purchasing group, item type and part effects, log price, log quantity, year-end month", "po_lines": n, "validation": "latest 20% of PO lines by request date",
          "mae_days_model": round(mae(pred), 1), "mae_days_part_median": round(mae(b_part), 1), "mae_days_overall_median": round(mae(b_all), 1),
          "mae_days_model_unseen_parts": None if mae_uns is None else round(mae_uns, 1), "mae_days_overall_median_unseen_parts": None if mae_uns_b is None else round(mae_uns_b, 1), "unseen_parts_in_validation": int(uns.sum()),
          "parts_without_history": int(sum(1 for r in out if not r[3])), "default_replaced": 60}
con.execute("create table if not exists ml_model (key text primary key, value text)")
con.executemany("insert or replace into ml_model values (?,?)", [("equip_" + k, json.dumps(v)) for k, v in meta_e.items()] + [("lead_" + k, json.dumps(v)) for k, v in meta_l.items()])
try:
    con.execute("delete from data_dictionary where table_name in ('ml_equip_risk','ml_leadtime')")
    con.executemany("insert or replace into data_dictionary values (?,?,?,?)", [("ml_equip_risk", "", "Learned chance of a notification in the next 3 months per functional location, with the main drivers (Estimate)", len(rows)),
        ("ml_equip_risk", "p_notif_3m", "Chance of at least one notification in the next 3 months", None), ("ml_equip_risk", "expected_notifs_12m", "Expected notifications in the next 12 months (model and observed rate)", None),
        ("ml_leadtime", "", "Learned lead time per part from supplier, purchasing group and item type; parts with PO history keep their own", len(out)), ("ml_leadtime", "lead_pred_days", "Learned median lead time in days (Estimate)", None)])
except sqlite3.OperationalError: pass
con.commit(); con.close()
print(json.dumps({"equip": {k: meta_e[k] for k in ("locations", "auc_model", "auc_baseline", "brier_model", "brier_base_rate", "top10_capture", "calibration_factor")}, "lead": {k: meta_l[k] for k in ("po_lines", "mae_days_model", "mae_days_part_median", "mae_days_overall_median", "mae_days_model_unseen_parts", "mae_days_overall_median_unseen_parts", "unseen_parts_in_validation", "parts_without_history")}}))
