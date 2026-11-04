"""SPI learned demand model (owner: Claude A). Learns from the 17 months of issues in spi/db/spi.sqlite and writes the results back
into the same database, so the assistant and the pages read them at runtime (no Python on Vercel).

Model: a two-part (hurdle) model fitted with numpy only.
  1. Occurrence: logistic regression for "the part is issued in the target month".
  2. Size: ridge regression on log(quantity) for the months with an issue.
  Expected demand = P(issue) x E[quantity | issue]; the low and high case come from the size residuals (10% and 90%).
Features use only data before the forecast origin: recent use (1, 3, 6, 12 months), months since last issue, active months, installed
quantity and locations, criticality, item type, lead time, price, the planned maintenance due on the part's locations in the target
month, and whether the target month is a high-load (campaign) month of the plan.
Validation: rolling origins, trained on targets up to 2026-04 and tested on 2026-05 to 2026-09 (5 months held out), against a naive
12-month mean and Croston SBA. Results: tables ml_model, ml_eval, ml_forecast, ml_flag, and data_dictionary rows.
Usage: python3.13 spi/ml/train.py [spi/db/spi.sqlite]"""
import json, math, os, sqlite3, sys
from collections import defaultdict
import numpy as np

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
path = sys.argv[1] if len(sys.argv) > 1 else os.path.join(ROOT, "spi/db/spi.sqlite")
con = sqlite3.connect(path)
q = lambda s, a=(): con.execute(s, a).fetchall()

MONTHS = [r[0] for r in q("select distinct month from movement order by 1")]           # 17 history months
T = len(MONTHS)
def add(ym, k):
    y, m = map(int, ym.split("-")); m += k; y += (m - 1) // 12; m = (m - 1) % 12 + 1; return f"{y:04d}-{m:02d}"
FUT = [add(MONTHS[-1], k) for k in range(1, 13)]
ALL = MONTHS + FUT; IDX = {m: i for i, m in enumerate(ALL)}

parts = q("select p.material_no, coalesce(p.n_funcloc,0), coalesce(p.installed_total,0), coalesce(p.crit_rank,0), coalesce(m.item_type,''), p.lt_median, m.last_unit_price_idr, m.stock, m.min_qty, m.max_qty, m.mrp_type, p.crit_max, m.descr from part_profile p join material m using(material_no) order by 1")
P = len(parts); pid = {r[0]: i for i, r in enumerate(parts)}
qty = np.zeros((P, T))
for mat, month, qy in q("select material_no, month, qty from demand_month"):
    if mat in pid and month in IDX and IDX[month] < T: qty[pid[mat], IDX[month]] = qy

# planned maintenance occurrences per part and month (through the BoM locations)
occ = defaultdict(lambda: np.zeros(len(ALL)))
for fl, start, cyc in q("select funcloc, start_of_cycle, cast(cycle_months as integer) from maint_item where cycle_months>=1 and start_of_cycle is not null"):
    s = start[:7]; v = occ[fl]
    # first occurrence on or after the first month, then every cycle
    k = 0
    if s < ALL[0]:
        y0, m0 = map(int, s.split("-")); y1, m1 = map(int, ALL[0].split("-")); gap = (y1 - y0) * 12 + (m1 - m0); k = -(-gap // cyc) * cyc
    m = add(s, k)
    while m <= ALL[-1]:
        if m in IDX: v[IDX[m]] += 1
        k += cyc; m = add(s, k)
plan = np.zeros((P, len(ALL)))
for mat, fl in q("select material_no, funcloc from part_equipment"):
    if mat in pid and fl in occ: plan[pid[mat]] += occ[fl]
# failure signal: notifications per month on the part's locations (history only)
nloc = defaultdict(lambda: np.zeros(T))
for fl, m in q("select funcloc, substr(notif_date,1,7) from notification"):
    if m in IDX and IDX[m] < T: nloc[fl][IDX[m]] += 1
notif = np.zeros((P, T))
for mat, fl in q("select material_no, funcloc from part_equipment"):
    if mat in pid and fl in nloc: notif[pid[mat]] += nloc[fl]
site_load = sum(occ.values()) if occ else np.zeros(len(ALL))
base_load = np.median(site_load[T:]) if len(site_load) > T else np.median(site_load)
hist_iss = np.array([r[0] for r in q("select count(*) from movement group by month order by month")], float)
camp_hist = hist_iss >= 1.5 * np.median(hist_iss)
camp = np.concatenate([camp_hist, site_load[T:] >= 1.5 * base_load]).astype(float)

types = [t for t, _ in sorted(defaultdict(int, {}).items())]
tcount = defaultdict(int)
for r in parts: tcount[r[4]] += 1
TOP = [t for t, n in sorted(tcount.items(), key=lambda x: -x[1]) if t][:15]
static = np.array([[math.log1p(r[1]), math.log1p(r[2]), r[3] / 4, 1.0 if r[5] is None else 0.0, math.log1p(r[5] or 0) / 6, math.log1p(r[6] or 0) / 20] + [1.0 if r[4] == t else 0.0 for t in TOP] for r in parts])
SNAMES = ["log installed locations", "log installed quantity", "criticality rank", "no lead time history", "log lead time", "log price"] + ["type " + t.lower() for t in TOP]

def feats(t, h):
    """features for origin t (months 0..t-1 known) and target month t+h-1"""
    past = qty[:, :t]
    f = []
    for w in (1, 3, 6, 12):
        seg = past[:, max(0, t - w):t]; f += [np.log1p(seg.sum(1)) / 5, (seg > 0).mean(1)]
    act = (past > 0)
    since = np.where(act.any(1), np.argmax(act[:, ::-1], 1), 24)  # months since the last issue (24 = never)
    f += [np.minimum(since, 24) / 24, act.sum(1) / max(t, 1), np.log1p(past.sum(1)) / 6]
    tgt = t + h - 1
    f += [np.log1p(plan[:, tgt]) / 3, np.full(P, camp[tgt]), np.full(P, h / 12), np.log1p(notif[:, max(0, t - 3):t].sum(1)) / 3, np.log1p(notif[:, :t].sum(1)) / 5]
    out = np.column_stack(f + [static]); return np.nan_to_num(out, nan=0.0, posinf=0.0, neginf=0.0)
DNAMES = ["log use last 1 m", "active share last 1 m", "log use last 3 m", "active share last 3 m", "log use last 6 m", "active share last 6 m", "log use last 12 m", "active share last 12 m", "months since last issue", "active share to date", "log use to date", "log planned tasks in target month", "campaign month", "horizon", "failure notifications last 3 m", "failure notifications to date"] + SNAMES

def dataset(origins, hs, last_target):
    X, y, z = [], [], []
    for t in origins:
        for h in hs:
            tgt = t + h - 1
            if tgt > last_target or tgt >= T: continue
            X.append(feats(t, h)); y.append(qty[:, tgt] > 0); z.append(qty[:, tgt])
    return np.vstack(X), np.concatenate(y).astype(float), np.concatenate(z)

def logit_fit(X, y, l2=10.0, it=60):
    """penalised logistic regression, Newton steps with step halving on standardised features"""
    mu, sd = X.mean(0), X.std(0); sd[sd < 1e-9] = 1.0; Z = (X - mu) / sd
    Xb = np.column_stack([np.ones(len(Z)), Z]); w = np.zeros(Xb.shape[1]); w[0] = math.log((y.mean() + 1e-6) / (1 - y.mean() + 1e-6))
    pen = np.r_[0, np.ones(len(w) - 1)] * l2
    def obj(w):
        e = Xb @ w; return float(np.sum(np.logaddexp(0, e) - y * e) + 0.5 * np.sum(pen * w * w))
    f0 = obj(w)
    for _ in range(it):
        e = Xb @ w; p = 1 / (1 + np.exp(-e)); g = Xb.T @ (p - y) + pen * w
        Hm = (Xb * (p * (1 - p))[:, None]).T @ Xb + np.diag(pen + 1e-8)
        step = np.linalg.solve(Hm, g); a = 1.0
        while a > 1e-4:
            w1 = w - a * step; f1 = obj(w1)
            if f1 <= f0: break
            a /= 2
        if f0 - f1 < 1e-7 * max(1.0, abs(f0)): w, f0 = w1, f1; break
        w, f0 = w1, f1
    return (w, mu, sd)
def logit_pred(m, X):
    w, mu, sd = m; return 1 / (1 + np.exp(-np.clip(np.column_stack([np.ones(len(X)), (X - mu) / sd]) @ w, -30, 30)))
def ridge_fit(X, y, l2=1.0):
    Xb = np.column_stack([np.ones(len(X)), X]); A = Xb.T @ Xb + l2 * np.diag(np.r_[0, np.ones(Xb.shape[1] - 1)]); return np.linalg.solve(A, Xb.T @ y)
def ridge_pred(w, X): return np.column_stack([np.ones(len(X)), X]) @ w

H = list(range(1, 7)); HOLD = 5; train_last = T - HOLD - 1
def fit(origins, last_target):
    X, y, z = dataset(origins, H, last_target)
    wc = logit_fit(X, y)
    pos = z > 0; ws = ridge_fit(X[pos], np.log(z[pos]))
    res = np.log(z[pos]) - ridge_pred(ws, X[pos]); sig2 = float(res.var())
    return wc, ws, sig2, np.quantile(res, [0.1, 0.9]), len(y), int(pos.sum())
def expected(wc, ws, sig2, X): return logit_pred(wc, X) * np.exp(ridge_pred(ws, X) + sig2 / 2)

# --- backtest: origin = first held-out month, horizons 1..5 cover 2026-05..2026-09
wc, ws, sig2, rq, nrow, npos = fit(range(6, train_last + 1), train_last)
t0 = T - HOLD
pred = np.column_stack([expected(wc, ws, sig2, feats(t0, h)) for h in range(1, HOLD + 1)])
prob = np.column_stack([logit_pred(wc, feats(t0, h)) for h in range(1, HOLD + 1)])
act = qty[:, t0:T]
naive = np.repeat(qty[:, max(0, t0 - 12):t0].mean(1, keepdims=True), HOLD, 1)
def sba(series, a=0.1):
    z = p = None; k = 1
    for v in series:
        if v > 0:
            z = v if z is None else z + a * (v - z); p = k if p is None else p + a * (k - p); k = 1
        else: k += 1
    return 0.0 if z is None else (1 - a / 2) * z / p
sbaf = np.repeat(np.array([sba(qty[i, :t0]) for i in range(P)])[:, None], HOLD, 1)
issued = qty[:, :t0].sum(1) > 0
scale = np.where(qty[:, :t0].mean(1) > 0, qty[:, :t0].mean(1), 1)
def mae(f, m): return float((np.abs(f - act)[m].sum(1) / HOLD / scale[m]).mean())
def tot(f, m): a = act[m].sum(); return None if a < 50 else float(abs(f[m].sum() - a) / a)
occ_act = (act > 0).astype(float)
brier = float(((prob - occ_act) ** 2).mean()); brier0 = float(((occ_act.mean() - occ_act) ** 2).mean())
# ranking skill: share of next-5-month issuers found in the top 10% by predicted probability
top = np.argsort(-prob.sum(1))[: max(1, P // 10)]; issuers = occ_act.sum(1) > 0
def auc(sc, yy):
    o = np.argsort(sc); r = np.empty(len(sc)); r[o] = np.arange(len(sc)); pos = yy.sum(); return float((r[yy].sum() - pos * (pos - 1) / 2) / (pos * (len(yy) - pos)))
auc_model = auc(prob.sum(1), issuers)
capture = float(issuers[top].sum() / max(issuers.sum(), 1))
crit = np.array([r[3] for r in parts]); dclass = {r[0]: c for r, c in zip(q("select material_no from part_profile order by 1"), [x[0] for x in q("select demand_class from part_profile order by material_no")])}
segs = {"all issued parts": issued, "S and A parts": issued & (crit >= 3)}
for c in ("smooth", "erratic", "intermittent", "lumpy", "single_event"):
    segs[c.replace("_", " ") + " parts"] = issued & np.array([dclass.get(r[0]) == c for r in parts])
evals = []
for name, m in segs.items():
    if m.sum() < 5: continue
    evals.append((name, int(m.sum()), mae(pred, m), mae(naive, m), mae(sbaf, m), tot(pred, m), tot(naive, m), tot(sbaf, m)))

# calibration: the hurdle model under-predicts totals on held-out months; scale the projection by actual / predicted on them (clipped)
calib = float(np.clip(act[issued].sum() / max(pred[issued].sum(), 1e-9), 0.7, 1.5))
# --- final model on all months, projection for the next 12 months
wc, ws, sig2, rq, nrow, npos = fit(range(6, T), T - 1)
proj = []
for h in range(1, 13):
    X = feats(T, h); pr = logit_pred(wc, X); mu = ridge_pred(ws, X)
    proj.append((pr, calib * pr * np.exp(mu + sig2 / 2), calib * np.exp(mu + rq[0]), calib * np.exp(mu + rq[1])))

coef = sorted(zip(DNAMES, wc[0][1:].tolist()), key=lambda x: -abs(x[1]))  # standardised coefficients
con.executescript("""
drop table if exists ml_model; create table ml_model (key text primary key, value text);
drop table if exists ml_eval; create table ml_eval (segment text primary key, parts integer, model_error real, naive_error real, sba_error real, model_total_error real, naive_total_error real, sba_total_error real);
drop table if exists ml_forecast; create table ml_forecast (material_no integer, month text, p_issue real, expected_qty real, qty_if_issued_low real, qty_if_issued_high real, primary key (material_no, month));
drop table if exists ml_flag; create table ml_flag (material_no integer, kind text, severity text, detail text, value real, primary key (material_no, kind));
""")
meta = {"method": "hurdle model: penalised logistic regression for occurrence (standardised features), ridge on log quantity for size, numpy",
        "trained_rows": nrow, "rows_with_issue": npos, "features": len(DNAMES), "history": MONTHS[0] + " to " + MONTHS[-1],
        "holdout": MONTHS[t0] + " to " + MONTHS[-1], "brier_model": round(brier, 4), "brier_base_rate": round(brier0, 4),
        "top10_capture": round(capture, 3), "auc_model": round(auc_model, 3), "occurrence_drivers": [[n, round(v, 3)] for n, v in coef[:8]],
        "campaign_months_ahead": [ALL[i] for i in range(T, len(ALL)) if camp[i]], "calibration_factor": round(calib, 3)}
con.executemany("insert into ml_model values (?,?)", [(k, json.dumps(v)) for k, v in meta.items()])
con.executemany("insert into ml_eval values (?,?,?,?,?,?,?,?)", evals)
rows = []
for h, (pr, ex, lo, hi) in enumerate(proj):
    for i, r in enumerate(parts):
        if ex[i] >= 0.005 or pr[i] >= 0.01: rows.append((r[0], FUT[h], round(float(pr[i]), 4), round(float(ex[i]), 3), round(float(lo[i]), 2), round(float(hi[i]), 2)))
con.executemany("insert into ml_forecast values (?,?,?,?,?,?)", rows)

# --- flaws: where the learned demand and today's settings disagree
y12 = np.sum([p[1] for p in proj], 0); flags = []
for i, r in enumerate(parts):
    mat, nloc, inst, cr, typ, lt, price, stock, mn, mx, mrp, cmax, descr = r
    lt_m = (lt or 60) / 30.4; ltd = y12[i] / 12 * lt_m
    if mx is not None and mn is not None and mn > mx > 0: flags.append((mat, "min_above_max", "error", f"Min {mn:,.0f} is above Max {mx:,.0f}", mn - mx))
    if mrp == "Stock Item" and (mx or 0) == 0 and y12[i] >= 2: flags.append((mat, "no_max_with_demand", "warn", f"no Max set although the model expects {y12[i]:,.0f} a year", y12[i]))
    if cr >= 3 and (stock or 0) < ltd and y12[i] >= 1: flags.append((mat, "critical_below_lead_demand", "warn", f"stock {stock:,.0f} against {ltd:,.0f} expected during the lead time", (ltd - (stock or 0)) * (price or 0)))
    if (stock or 0) > 0 and y12[i] > 0 and stock > 10 * max(y12[i], 1) and (stock - (mx or 0)) > 0 and price: flags.append((mat, "stock_far_above_learned_need", "info", f"stock covers about {stock / max(y12[i], 1e-9):,.0f} years of learned demand", (stock - y12[i]) * price))
    if mx and y12[i] > 3 * mx and y12[i] >= 6: flags.append((mat, "max_below_learned_demand", "warn", f"Max {mx:,.0f} against {y12[i]:,.0f} a year expected", y12[i] - mx))
con.executemany("insert or replace into ml_flag values (?,?,?,?,?)", flags)

dd = [("ml_model", "", "Learned demand model: method, training size, validation scores and the strongest drivers", None),
      ("ml_eval", "", "Learned model against the naive mean and Croston SBA on the 5 held-out months, by segment", None),
      ("ml_eval", "model_error", "Mean absolute error per month, scaled by the part's average use (lower is better)", None),
      ("ml_eval", "model_total_error", "Error of the total quantity of the segment over the held-out months, as a share", None),
      ("ml_forecast", "", "Learned 12-month projection per part and month (Estimate)", None),
      ("ml_forecast", "p_issue", "Chance the part is issued in the month", None), ("ml_forecast", "expected_qty", "Expected quantity in the month", None),
      ("ml_forecast", "qty_if_issued_low", "Quantity if issued, low case (10%)", None), ("ml_forecast", "qty_if_issued_high", "Quantity if issued, high case (90%)", None),
      ("ml_flag", "", "Flaws found by comparing the learned demand with today's Min, Max and stock", None), ("ml_flag", "value", "Size of the flaw: IDR to cover the gap for critical parts and for excess stock, units otherwise", None)]
try:
    con.execute("delete from data_dictionary where table_name like 'ml_%'")
    con.executemany("insert or replace into data_dictionary values (?,?,?,?)", dd)
    for t in ("ml_model", "ml_eval", "ml_forecast", "ml_flag"):
        con.execute("update data_dictionary set rows=(select count(*) from " + t + ") where table_name=? and column_name=''", (t,))
except sqlite3.OperationalError: pass
# per-part summary used by every planner endpoint (Claude B's ws tools read it through portfolioParts)
con.executescript("drop table if exists ml_part; create table ml_part (material_no integer primary key, mu real, sd real, p_any real, expected_12m real)")
agg = {}
for mat, p, e, lo, hi in con.execute("select material_no, p_issue, expected_qty, qty_if_issued_low, qty_if_issued_high from ml_forecast"):
    m = (lo + hi) / 2; sdq = (hi - lo) / 2.56; a = agg.setdefault(mat, [0.0, 0.0, 1.0])
    a[0] += e; a[1] += p * (1 - p) * m * m + p * sdq * sdq; a[2] *= (1 - p)
con.executemany("insert into ml_part values (?,?,?,?,?)", [(k, v[0] / 12, (v[1] / 12) ** 0.5, 1 - v[2], v[0]) for k, v in agg.items()])
try:
    con.execute("delete from data_dictionary where table_name='ml_part'")
    con.executemany("insert or replace into data_dictionary values (?,?,?,?)", [("ml_part", "", "Learned demand per part: monthly mean, monthly spread, chance of any issue in 12 months", len(agg)), ("ml_part", "mu", "Learned mean demand per month (Estimate)", None), ("ml_part", "sd", "Learned spread of monthly demand (Estimate)", None), ("ml_part", "p_any", "Chance of at least one issue in the next 12 months", None)])
except sqlite3.OperationalError: pass
con.commit(); con.execute("vacuum"); con.close()
print(json.dumps({k: meta[k] for k in ("trained_rows", "brier_model", "brier_base_rate", "top10_capture", "auc_model", "calibration_factor")}), "| eval:", [(e[0], round(e[2], 3), round(e[3], 3), round(e[4], 3)) for e in evals], "| forecast rows", len(rows), "| flags", len(flags))
