"""Static sheets (mirror outputs) and documentation sheets. Called from build_xlsx."""
import random, math, json, os, statistics
import spec
from spec import run, active, INPUTS, G, CM, ROLLOUT, SCEN_NAMES
from openpyxl.chart import BarChart, Reference, Series, LineChart
from openpyxl.styles import Font, Alignment

BASE_N = 3

def npv_for(ov=None, N=BASE_N, sc=2, rollout=None):
    return run(sc, N, ov, rollout=rollout)["npv"]

def rollout_rule(N):
    out = []
    for t in range(1, 6):
        out.append(min(N, 1 + math.ceil((N - 1) * (t - 1) / 2)) if N > 1 else 1)
    return out

def drivers():
    d = []
    for x in INPUTS:
        if x[0] == G: continue
        n, lab, unit, b, lo, hi = x[:6]
        if lo != hi and n not in ("wacc_adj", "su_ev", "su_h", "inc_f", "inc_c", "inc_r", "rw_h", "rw_red", "docs"):
            d.append((n, lab, unit, b, lo, hi))
    return d

def tornado():
    base = npv_for()
    rows = []
    for n, lab, unit, b, lo, hi in drivers():
        a = npv_for({n: lo}); c = npv_for({n: hi})
        rows.append((lab, unit, lo, hi, a, c, abs(c - a)))
    # extra drivers beyond the scenario ranges
    extras = [("Salary level (all roles), 30% lower or higher", "x", 0.7, 1.3),
              ("Exchange rate, 10% stronger or weaker rupiah", "IDR per USD", 17900 * 0.9, 17900 * 1.1),
              ("Discount rate, 2 points higher or lower", "points", 0.02, -0.02),
              ("Inflation, 2 points higher or lower", "%", 0.06, 0.02)]
    sal = ["sal_op", "sal_eng", "sal_rel", "sal_hse", "sal_mgr"]; A2 = active(2)
    rows.append((extras[0][0], "x", 0.7, 1.3, npv_for({s: A2[s] * 0.7 for s in sal}), npv_for({s: A2[s] * 1.3 for s in sal}), 0))
    rows.append((extras[1][0], "IDR per USD", 17900 * 0.9, 17900 * 1.1, npv_for({"fx": 17900 * 0.9}), npv_for({"fx": 17900 * 1.1}), 0))
    rows.append((extras[2][0], "points", 0.02, -0.02, npv_for({"_r_add": 0.02}), npv_for({"_r_add": -0.02}), 0))
    rows.append((extras[3][0], "%", 0.06, 0.02, npv_for({"infl": 0.06}), npv_for({"infl": 0.02}), 0))
    rows = [(a, b, c, d, e, f, abs(f - e)) for a, b, c, d, e, f, _ in rows]
    rows.sort(key=lambda r: -r[6])
    return base, rows

def grid(nx, xs, ny, ys, fx=None, fy=None):
    return [[npv_for({nx: x, ny: y} if not fx else fx(x, y)) for x in xs] for y in ys]

def bisect(fn, lo, hi, it=60):
    flo, fhi = fn(lo), fn(hi)
    if flo * fhi > 0: return None
    for _ in range(it):
        mid = (lo + hi) / 2
        if fn(lo) * fn(mid) <= 0: hi = mid
        else: lo = mid
    return (lo + hi) / 2

def breakeven():
    out = []
    for n, lab, lo, hi in (("loss", "Share of breakdown hours that reduce output", 0.01, 0.6), ("margin", "Contribution margin lost per tonne (USD per t)", 20, 600),
                           ("adopt", "Steady-state adoption", 0.1, 1.0), ("mttr_red", "Reduction in mean time to repair", 0.005, 0.4),
                           ("s_red", "Reduction in search time", 0.02, 0.9), ("attrib", "Share of the gain credited to the platform", 0.05, 1.0)):
        for N in (1, 3):
            v = bisect(lambda x: npv_for({n: x}, N=N), lo, hi)
            out.append((lab, N, active(2)[n], v))
    # cost multiplier
    for N in (1, 3):
        v = bisect(lambda x: npv_for({"_oneoff_x": x, "_run_x": x}, N=N), -0.5, 3.0)
        out.append(("Multiple of one-off and running cost (1.0 = base)", N, 1.0, None if v is None else 1 + v))
    return out

def monte_carlo(n=5000, seed=2026):
    random.seed(seed)
    params = []
    base_act = active(2)
    for nme, (lo, hi) in spec.MC_RANGES.items():
        lab = next(x[1] for x in INPUTS if x[0] == nme); unit = next(x[2] for x in INPUTS if x[0] == nme); b0 = base_act[nme]
        a_ = b0 - 1.25 * (b0 - lo); c_ = b0 + 1.25 * (hi - b0)
        if unit == "%": a_ = max(a_, 0.0); c_ = min(c_, 1.0)
        params.append((nme, lab, unit, a_, b0, c_, lo, hi))
    res = {1: [], 3: [], 6: [], 12: []}
    for _ in range(n):
        ov = {nme: random.triangular(a_, c_, b0) for nme, lab, unit, a_, b0, c_, lo, hi in params}
        for N in res: res[N].append(run(2, N, ov)["npv"])
    return params, res

def pct(xs, p):
    xs = sorted(xs); k = (len(xs) - 1) * p; f = math.floor(k); c = math.ceil(k)
    return xs[int(k)] if f == c else xs[f] + (xs[c] - xs[f]) * (k - f)

def old_slide():
    BASE = [603.75, 856.8, 60.0]; out = {}
    for N in (1, 3, 6):
        val = [x * N for x in BASE]; tot = sum(val); one = 1050 + 350 * N; run_ = 370 + 120 * (N - 1)
        y1 = .6 * tot - run_; y2 = tot - run_; pb = one / y1 * 12 if one <= y1 else 12 + (one - y1) / y2 * 12
        out[N] = dict(val=val, tot=tot, one=one, run=run_, pb=pb, net3=-one + y1 + 2 * y2)
    return out

def add(wb, g):
    put, header, widths, group, title = g["put"], g["header"], g["widths"], g["group"], g["title"]
    f_in, f_bold, f_note, f_norm, f_link, f_sub = g["f_in"], g["f_bold"], g["f_note"], g["f_norm"], g["f_link"], g["f_sub"]
    fill_static, fill_tot, fill_key, fill_grp = g["fill_static"], g["fill_tot"], g["fill_key"], g["fill_grp"]
    M0, M1, M2, P0, P1 = g["M0"], g["M1"], g["M2"], g["P0"], g["P1"]; CL = g["CL"]; CELLS = g["CELLS"]; name = g["name"]
    fmt_for = g["fmt_for"]
    base_run = run(2, 3)
    # ================================================================= Sensitivity
    ws = wb["Sensitivity"]; ws.sheet_view.showGridLines = False
    title(ws, "Sensitivity analysis (3 units, Base scenario)", "Static outputs of the Python replica of this workbook. Grey cells do not recalculate. The Checks sheet compares the replica with the live model.")
    widths(ws, [58, 14, 14, 14, 16, 16, 14, 16, 16])
    put(ws, 4, 1, "Base NPV before tax, 3 units (IDR M)", font=f_bold); put(ws, 4, 2, base_run["npv"], fmt=M0, fill=fill_static); CELLS["sens_base"] = "Sensitivity!$B$4"
    put(ws, 5, 1, "Live NPV before tax from CF_3U (IDR M)", font=f_bold); put(ws, 5, 2, "=CF_3U!B46", fmt=M0, font=f_link)
    put(ws, 6, 1, "Difference (zero when the scenario switch is Base)"); put(ws, 6, 2, "=IF(scn=2,B5-B4,\"n/a\")", fmt=M2)
    base, rows = tornado()
    group(ws, 8, "A. One-at-a-time sensitivity: NPV with each driver at its pessimistic and optimistic value", 9)
    header(ws, 9, ["Driver", "Unit", "Pessimistic value", "Optimistic value", "NPV at pessimistic", "NPV at optimistic", "Change (pess.)", "Change (opt.)", "Swing"])
    for i, (lab, unit, lo, hi, a, c, sw) in enumerate(rows[:24]):
        r = 10 + i; fm = fmt_for(unit) if unit in ("%", "points") else M2 if unit in ("x",) else M1
        put(ws, r, 1, lab); put(ws, r, 2, unit); put(ws, r, 3, lo, fmt=fm, fill=fill_static); put(ws, r, 4, hi, fmt=fm, fill=fill_static)
        put(ws, r, 5, a, fmt=M0, fill=fill_static); put(ws, r, 6, c, fmt=M0, fill=fill_static)
        put(ws, r, 7, f"=E{r}-$B$4", fmt=M0); put(ws, r, 8, f"=F{r}-$B$4", fmt=M0); put(ws, r, 9, f"=ABS(F{r}-E{r})", fmt=M0)
    nT = min(len(rows), 24); CELLS["torn_first"] = 10; CELLS["torn_n"] = nT
    ch = BarChart(); ch.type = "bar"; ch.grouping = "clustered"; ch.overlap = 100; ch.title = "Change in NPV versus base (IDR M), top drivers"; ch.height = 10; ch.width = 18
    topn = 12
    ch.add_data(Reference(ws, min_col=7, max_col=8, min_row=9, max_row=9 + topn), titles_from_data=True); ch.set_categories(Reference(ws, min_col=1, min_row=10, max_row=9 + topn))
    ch.y_axis.scaling.orientation = "minMax"; ch.x_axis.scaling.orientation = "maxMin"; ch.x_axis.tickLblPos = "low"; ws.add_chart(ch, "K8")
    r0 = 10 + nT + 2
    # two-way grids
    def put_grid(r, ttl, xl, yl, xs, ys, vals, fx, fy):
        group(ws, r, ttl, 9); put(ws, r + 1, 1, f"Rows: {yl}. Columns: {xl}. Cells: NPV before tax, 3 units (IDR M).", font=f_note)
        for j, x in enumerate(xs): put(ws, r + 2, 2 + j, x, fmt=fx, font=f_bold, fill=fill_grp, al="center")
        for i, y in enumerate(ys):
            put(ws, r + 3 + i, 1, y, fmt=fy, font=f_bold, fill=fill_grp, al="right")
            for j in range(len(xs)): put(ws, r + 3 + i, 2 + j, vals[i][j], fmt=M0, fill=fill_static)
        return r + 3 + len(ys) + 1
    margins = [150, 185, 220, 255, 290]; losses = [0.10, 0.15, 0.20, 0.25, 0.30]
    v = [[npv_for({"margin": m, "loss": l}) for m in margins] for l in losses]
    r1 = put_grid(r0, "B. Value of downtime: contribution margin and share of hours with output loss", "margin (USD per t)", "share of hours with output loss", margins, losses, v, M0, P0)
    adopts = [0.65, 0.75, 0.85, 0.90, 0.95]; convs = [0.40, 0.50, 0.60, 0.70, 0.80]
    v = [[npv_for({"adopt": a_, "conv": c_}) for a_ in adopts] for c_ in convs]
    r2 = put_grid(r1, "C. Behaviour: steady-state adoption and share of freed time that becomes productive", "steady-state adoption", "productive share of freed time", adopts, convs, v, P0, P0)
    mr = [0.05, 0.075, 0.10, 0.125, 0.15]; at = [0.5, 0.6, 0.7, 0.8, 0.9]
    v = [[npv_for({"mttr_red": m, "attrib": a_}) for m in mr] for a_ in at]
    r3 = put_grid(r2, "D. Reliability: reduction in repair time and share credited to the platform", "reduction in MTTR", "share credited to the platform", mr, at, v, P1, P0)
    group(ws, r3, "E. Break-even values: the input value at which NPV before tax equals zero", 9)
    header(ws, r3 + 1, ["Driver", "Units", "Base value", "Break-even value", "Headroom"])
    be = breakeven()
    for i, (lab, N, bv, v_) in enumerate(be):
        r = r3 + 2 + i; fm = P1 if bv < 1.5 and "Multiple" not in lab and "margin" not in lab.lower() else M2
        put(ws, r, 1, lab); put(ws, r, 2, N, fmt=M0); put(ws, r, 3, bv, fmt=fm, fill=fill_static)
        put(ws, r, 4, "none in range" if v_ is None else v_, fmt=fm, fill=fill_static)
        put(ws, r, 5, "" if v_ is None else f"=D{r}/C{r}-1", fmt=P0)
    r4 = r3 + 2 + len(be) + 1
    group(ws, r4, "F. Size of the programme: results by number of units (Base scenario; units reach full number in year 3)", 9)
    header(ws, r4 + 1, ["Units", "NPV before tax", "NPV after tax", "IRR before tax", "Payback (months)", "Steady-state value", "One-off cost", "BCR"])
    sweep = []
    for N in range(1, 13):
        o = run(2, N, rollout=rollout_rule(N)); sweep.append((N, o))
        r = r4 + 1 + N
        put(ws, r, 1, N, fmt=M0); put(ws, r, 2, o["npv"], fmt=M0, fill=fill_static); put(ws, r, 3, o["npv_at"], fmt=M0, fill=fill_static)
        put(ws, r, 4, o["irr"] if o["irr"] is not None else "n/a", fmt=P0, fill=fill_static); put(ws, r, 5, o["pb"] if o["pb"] is not None else "over 60", fmt=M1, fill=fill_static)
        put(ws, r, 6, o["steady"], fmt=M0, fill=fill_static); put(ws, r, 7, sum(o["capex"]), fmt=M0, fill=fill_static); put(ws, r, 8, o["bcr"], fmt=M2, fill=fill_static)
    CELLS["sweep_first"] = r4 + 2
    ch2 = BarChart(); ch2.type = "col"; ch2.title = "NPV before tax by programme size (IDR M)"; ch2.height = 8; ch2.width = 15
    ch2.add_data(Reference(ws, min_col=2, min_row=r4 + 1, max_row=r4 + 13), titles_from_data=True); ch2.set_categories(Reference(ws, min_col=1, min_row=r4 + 2, max_row=r4 + 13)); ws.add_chart(ch2, f"K{r4 - 2}")
    first_pos = next((N for N, o in sweep if o["npv"] > 0), None)
    put(ws, r4 + 14, 1, "Smallest programme with positive NPV before tax", font=f_bold); put(ws, r4 + 14, 2, first_pos, fmt=M0, fill=fill_static)
    SENS = dict(rows=rows, break_even=be, sweep=[(N, o["npv"], o["npv_at"], o["irr"], o["pb"], o["steady"], sum(o["capex"]), o["bcr"]) for N, o in sweep], first_pos=first_pos)
    # ================================================================= Monte Carlo
    ws = wb["MonteCarlo"]; ws.sheet_view.showGridLines = False
    title(ws, "Monte Carlo simulation", "5,000 trials. Drivers are drawn independently from triangular distributions with wider ranges than the scenario switch. Static output of the Python replica (seed 2026).")
    widths(ws, [56, 16, 14, 14, 14, 14, 14])
    params, res = monte_carlo()
    group(ws, 4, "A. Distribution of drivers: triangular, with the 10th and 90th percentile ranges below (wider than the scenario switch)", 7)
    header(ws, 5, ["Driver", "Unit", "Minimum", "Most likely", "Maximum", "About P10", "About P90"])
    for i, (nme, lab, unit, a_, b, c_, lo_p, hi_p) in enumerate(params):
        r = 6 + i; fm = fmt_for(unit) if unit in ("%", "points") else M2
        put(ws, r, 1, lab); put(ws, r, 2, unit); put(ws, r, 3, a_, fmt=fm, fill=fill_static); put(ws, r, 4, b, fmt=fm, fill=fill_static); put(ws, r, 5, c_, fmt=fm, fill=fill_static)
        put(ws, r, 6, lo_p, fmt=fm, fill=fill_static); put(ws, r, 7, hi_p, fmt=fm, fill=fill_static)
    r = 6 + len(params) + 1
    group(ws, r, "B. Results: NPV before tax (IDR M)", 7); r += 1
    header(ws, r, ["Statistic", "1 unit", "3 units", "6 units", "12 units"]); r += 1
    MC = {}
    stats = [("Mean", lambda x: sum(x) / len(x)), ("Standard deviation", lambda x: statistics.pstdev(x)), ("5th percentile", lambda x: pct(x, .05)), ("10th percentile", lambda x: pct(x, .10)), ("25th percentile", lambda x: pct(x, .25)),
             ("Median", lambda x: pct(x, .5)), ("75th percentile", lambda x: pct(x, .75)), ("90th percentile", lambda x: pct(x, .90)), ("95th percentile", lambda x: pct(x, .95)), ("Probability that NPV is positive", lambda x: sum(1 for v in x if v > 0) / len(x))]
    for lab, fn in stats:
        put(ws, r, 1, lab, font=f_bold if "Probability" in lab or lab == "Median" else f_norm)
        for j, N in enumerate((1, 3, 6, 12)):
            v = fn(res[N]); MC[(lab, N)] = v
            put(ws, r, 2 + j, v, fmt=P0 if "Probability" in lab else M0, fill=fill_static)
        r += 1
    put(ws, r, 1, "Value at risk: shortfall of the 5th percentile below zero (3 units)", font=f_note); put(ws, r, 3, min(0, MC[("5th percentile", 3)]), fmt=M0, fill=fill_static)
    r += 2
    group(ws, r, "C. Histogram of NPV before tax, 3 units", 7); r += 1
    header(ws, r, ["Bin from (IDR M)", "Bin to (IDR M)", "Trials", "Share"]); r += 1
    x3 = res[3]; lo_, hi_ = pct(x3, .005), pct(x3, .995); nb = 20; w = (hi_ - lo_) / nb; h0 = r
    counts = [0] * nb
    for v in x3:
        k = min(nb - 1, max(0, int((v - lo_) / w))); counts[k] += 1
    for k in range(nb):
        put(ws, r, 1, lo_ + k * w, fmt=M0, fill=fill_static); put(ws, r, 2, lo_ + (k + 1) * w, fmt=M0, fill=fill_static); put(ws, r, 3, counts[k], fmt=M0, fill=fill_static); put(ws, r, 4, f"=C{r}/SUM($C${h0}:$C${h0+nb-1})", fmt=P1); r += 1
    ch = BarChart(); ch.type = "col"; ch.title = "NPV before tax, 3 units: distribution of 5,000 trials"; ch.height = 8; ch.width = 18; ch.gapWidth = 20
    ch.add_data(Reference(ws, min_col=3, min_row=h0 - 1, max_row=h0 + nb - 1), titles_from_data=True)
    ch.set_categories(Reference(ws, min_col=1, min_row=h0, max_row=h0 + nb - 1)); ws.add_chart(ch, "G" + str(6 + len(params) + 3))
    CELLS["mc_hist_first"] = h0; CELLS["mc_hist_n"] = nb
    # ================================================================= Risks
    ws = wb["Risks"]; ws.sheet_view.showGridLines = False
    title(ws, "Risk register with financial impact (3 units, Base)", "NPV impact is computed by shocking the Base scenario in the Python replica. Grey cells are static.")
    widths(ws, [5, 40, 12, 17, 17, 46, 46, 50, 34])
    header(ws, 4, ["ID", "Risk", "Likelihood", "NPV after shock (IDR M)", "Change vs base (IDR M)", "Shock applied in the model", "Effect on value", "Mitigation", "Early warning KPI"])
    A2 = active(2)
    risks = [
        ("Low adoption by operators and engineers", "Steady-state adoption falls by 30%", "Medium", "Lower search and repair benefits", {"adopt": A2["adopt"] * 0.7}, None, "Role-based onboarding, champions on each shift, usage targets in unit KPIs", "Weekly active users below 60%"),
        ("Rollout delayed by one year", "Units 2 and 3 go live one year later", "Medium", "Benefits shift right, shared cost is unchanged", {}, [1, 1, 2, 3, 3], "Fixed pilot exit criteria, pre-approved budget for unit 2", "Pilot exit review missed by more than 3 months"),
        ("One-off cost overrun", "One-off cost 30% higher", "Medium", "Higher investment in year 0", {"_oneoff_x": 0.3}, None, "Fixed-scope pilot, contingency, milestone payments", "Spend above 110% of plan at any gate"),
        ("Data quality is worse than expected", "Ingestion effort doubles and benefits fall by 10%", "High", "Slower onboarding, less trusted answers", {"ing_d": A2["ing_d"] * 2, "_ben_x": -0.10}, None, "Quality gates, data owners, Data Quality page triage", "Open high-severity data issues above 20"),
        ("AI service unavailable or withdrawn", "Search time reduction falls by 30%", "Low", "Platform falls back to search-only answers", {"s_red": A2["s_red"] * 0.7}, None, "Local fallback, provider contract, no lock-in to one model", "Share of answers served by fallback above 20%"),
        ("Benefit attribution is challenged", "Share credited to the platform falls by 30%", "Medium", "Lower repair and repeat failure value", {"attrib": A2["attrib"] * 0.7}, None, "Baseline and control units, pilot measurement plan", "Repair time gain not visible after 6 months"),
        ("Polyethylene margin downturn", "Contribution margin falls to USD 140 per tonne", "Medium", "Each downtime hour is worth less", {"margin": 140}, None, "Report levers that do not depend on margin separately", "Polyethylene spread below USD 150 per tonne for 2 quarters"),
        ("Key person leaves the knowledge manager role", "Adoption falls by 15% and running cost rises by 10%", "Medium", "Approval backlog and slower content growth", {"adopt": A2["adopt"] * 0.85, "_run_x": 0.10}, None, "Two named owners, documented procedures", "Approval queue older than 7 days"),
        ("Cybersecurity incident or audit finding", "Extra one-off cost of IDR 300 M", "Low", "Remediation and delay", {"_shared_add": 300}, None, "Security review before go-live, single sign-on, audit trail", "Open critical findings"),
        ("Data protection or contract constraints", "Connector cost 50% higher and security cost doubled", "Low", "More integration and review work", {"conn": A2["conn"] * 1.5, "sec": A2["sec"] * 2}, None, "Early legal review, data classification, residency choice", "Legal sign-off not received before build"),
    ]
    RISKS = []
    for i, (rk, shock, lik, eff, ov, ro, mit, kpi) in enumerate(risks):
        r = 5 + i; o = run(2, 3, ov, rollout=ro) if ro else run(2, 3, ov); RISKS.append((rk, shock, lik, o["npv"], o["npv"] - base_run["npv"]))
        put(ws, r, 1, f"R{i+1}"); put(ws, r, 2, rk, wrap=True); put(ws, r, 3, lik, al="center"); put(ws, r, 4, o["npv"], fmt=M0, fill=fill_static); put(ws, r, 5, f"=D{r}-Sensitivity!$B$4", fmt=M0)
        put(ws, r, 6, shock, wrap=True); put(ws, r, 7, eff, wrap=True); put(ws, r, 8, mit, wrap=True, font=f_note); put(ws, r, 9, kpi, wrap=True, font=f_note)
        ws.row_dimensions[r].height = 30
    r = 5 + len(risks) + 1
    # combined stress
    o = run(2, 3, {"adopt": A2["adopt"] * 0.7, "_oneoff_x": 0.3, "attrib": A2["attrib"] * 0.7}, rollout=[1, 1, 2, 3, 3])
    put(ws, r, 2, "Combined stress: R1, R2, R3 and R6 together", font=f_bold); put(ws, r, 4, o["npv"], fmt=M0, fill=fill_static); put(ws, r, 5, f"=D{r}-Sensitivity!$B$4", fmt=M0)
    RISKS.append(("Combined stress: low adoption, delay, cost overrun and challenged attribution", "R1, R2, R3 and R6 together", "Low", o["npv"], o["npv"] - base_run["npv"]))
    # ================================================================= KPIs
    ws = wb["KPIs"]; ws.sheet_view.showGridLines = False
    title(ws, "KPIs and benefits realisation plan", "Baselines come from case data where possible. Targets follow the Base scenario inputs. The pilot measures each KPI before any benefit is claimed.")
    widths(ws, [44, 18, 18, 36, 30, 20, 16, 24])
    header(ws, 4, ["KPI", "Baseline", "Target", "How it is measured", "Data source", "Owner", "Review", "Value lever"])
    kp = [("Mean time to repair (hours)", "=cm_mttr", "=cm_mttr*(1-in_mttr_red)", M1, "Work order completion minus start date, breakdown jobs", "CMMS work orders", "Reliability engineer", "Monthly", "Lever 2"),
          ("Breakdowns a year, whole unit", "=cm_bd_year", "=cm_bd_year*(1-cm_rep_rate*in_rep_red)", M1, "Count of breakdown work orders", "CMMS work orders", "Reliability engineer", "Quarterly", "Levers 2 and 3"),
          ("Jobs repeating within 120 days (share)", "=cm_rep_rate", "=cm_rep_rate*(1-in_rep_red)", P1, "Same tag and failure mode within 120 days", "Failure memory report", "Reliability engineer", "Quarterly", "Lever 3"),
          ("Minutes a day spent finding and checking sources", "=in_s_base", "=in_s_base*(1-in_s_red)", M0, "User survey and timed tasks", "Pilot survey", "Unit manager", "Quarterly", "Lever 1"),
          ("Median time to a cited answer (minutes)", 15, 3, M0, "Timed pilot tasks with and without the platform", "Pilot test log", "Knowledge manager", "Pilot, then yearly", "Lever 1"),
          ("Answers with an approved source", "Not measured", 0.9, P0, "Answer audit log", "Question log", "Knowledge manager", "Monthly", "Quality"),
          ("Users who rate answers useful", "Not measured", 0.8, P0, "Feedback buttons in the app", "Question log", "Knowledge manager", "Monthly", "Adoption"),
          ("Weekly active users (share of 45)", 0, "=in_adopt", P0, "Usage log", "Audit trail", "Unit manager", "Weekly", "Adoption"),
          ("Documents without an approval status (share of 98)", "=in_docs_noappr/in_docs", "=0.1", P0, "Documents page and Data Quality page", "Platform data", "Document controller", "Monthly", "Governance"),
          ("Days for a new joiner to reach full productivity", "=60", "=60-in_d_saved", M0, "Supervisor sign-off date minus start date", "HR and unit records", "Unit manager", "Per joiner", "Lever 4"),
          ("Corrective work cost a year (IDR M)", "=cm_corr_year*cm_avg_corr", "=cm_corr_year*cm_avg_corr*(1-cm_rep_rate*in_rep_red)", M0, "Total cost of corrective and breakdown work orders", "CMMS work orders", "Maintenance manager", "Quarterly", "Lever 3")]
    for i, (k, b, t, fm, how, src, own, rev, lv) in enumerate(kp):
        r = 5 + i; put(ws, r, 1, k, wrap=True); put(ws, r, 2, b, fmt=fm, font=f_link if isinstance(b, str) and b.startswith("=") else f_in); put(ws, r, 3, t, fmt=fm, font=f_link if isinstance(t, str) and t.startswith("=") else f_in)
        put(ws, r, 4, how, wrap=True, font=f_note); put(ws, r, 5, src, wrap=True, font=f_note); put(ws, r, 6, own); put(ws, r, 7, rev); put(ws, r, 8, lv); ws.row_dimensions[r].height = 30
    r = 5 + len(kp) + 1
    put(ws, r, 1, "Benefits realisation gates", font=f_bold)
    gates = [("Gate 1: end of pilot (month 6)", "Measured MTTR, search time and adoption replace the assumptions. Continue to unit 2 only if the weighted benefit is at least 70% of the Base case."),
             ("Gate 2: month 12", "Repeat failure share and answer audit results reviewed. Rollout to unit 3 and beyond approved against the sensitivity table."),
             ("Gate 3: month 24", "Full benefit review against the Base case. Update the model, the cost anchor and the rollout plan.")]
    for i, (a, b) in enumerate(gates):
        put(ws, r + 1 + i, 1, a, font=f_bold, wrap=True); put(ws, r + 1 + i, 2, b, wrap=True); ws.merge_cells(start_row=r + 1 + i, start_column=2, end_row=r + 1 + i, end_column=8); ws.row_dimensions[r + 1 + i].height = 30
    # ================================================================= Reconciliation
    ws = wb["Reconciliation"]; ws.sheet_view.showGridLines = False
    title(ws, "Reconciliation to the earlier business impact slide", "Earlier values are the figures shown on the previous slide (static, blue). New values are live links. Values at steady-state adoption.")
    widths(ws, [52, 16, 16, 12, 80])
    header(ws, 4, ["Item", "Earlier slide", "New model", "Change", "What changed and why"])
    old = old_slide()
    rec = [("Users per unit", 45, "=lab_users", M0, "Unchanged: 45 users in five role groups."),
           ("Search time lever, 1 unit (IDR M a year)", old[1]["val"][0], "=lev_L1*in_adopt", M0, "Loaded cost now built from role salaries, only 60% of freed time counts, and adoption is 85%."),
           ("Repair time lever, 1 unit (IDR M a year)", old[1]["val"][1], "=lev_L2*in_adopt", M0, "Downtime value is now built bottom-up. Only 70% of the gain is credited and repeat failures are removed first."),
           ("Repeat failure lever, 1 unit (IDR M a year)", 0, "=lev_L3*in_adopt", M0, "New lever, based on the 120-day repeat rate in the work order data."),
           ("Ramp-up lever, 1 unit (IDR M a year)", old[1]["val"][2], "=lev_L4*in_adopt", M0, "Now built from joiners, days saved and loaded cost instead of a flat assumption."),
           ("Total value, 1 unit (IDR M a year)", old[1]["tot"], "=lev_total_adopt", M0, "Sum of the four headline levers at steady-state adoption."),
           ("Value of one breakdown hour (IDR M)", 30, "=dv", M1, "Capacity, margin, exchange rate and share of hours with output loss."),
           ("Share of freed search time that is productive", 1.0, "=in_conv", P0, "New haircut."),
           ("Share of repair gain credited to the platform", 1.0, "=in_attrib", P0, "New haircut."),
           ("Pilot one-off cost (IDR M)", old[1]["one"], "=cost_shared+cost_unit", M0, "Cost anchor rebuilt line by line on the Costs sheet."),
           ("Pilot running cost (IDR M a year)", old[1]["run"], "=cost_run_base", M0, "Cost anchor rebuilt line by line on the Costs sheet."),
           ("Payback, 1 unit (months)", old[1]["pb"], "=" + CELLS["cf1_pb"], M1, "Higher cost and ramp-up. A single unit does not repay quickly."),
           ("Value a year at 3 units (IDR M)", old[3]["tot"], "=" + CELLS["cf3_steady"], M0, "Year 0 prices at full rollout."),
           ("Payback at 3 units (months)", old[3]["pb"], "=" + CELLS["cf3_pb"], M1, "Phased rollout and adoption ramp are now modelled by cohort."),
           ("Net benefit over 3 years at 3 units (IDR M)", old[3]["net3"], "=SUM(CF_3U!C31:F31)", M0, "Earlier slide: net over three years. New: cumulative net cash flow to year 3."),
           ("Value a year at 6 units (IDR M)", old[6]["tot"], "=" + CELLS["cf6_steady"], M0, "Year 0 prices at full rollout."),
           ("NPV at 3 units (IDR M)", "not shown", "=" + CELLS["cf3_npv"], M0, "New: discounted at the weighted average cost of capital."),
           ("IRR at 3 units", "not shown", "=" + CELLS["cf3_irr"], P0, "New."),
           ("Repeat failures within 120 days", "8 of 55", "=cm_rep&\" of \"&cm_n_corr", None, "Rule restated: same equipment and same failure mode in the previous 120 days, on all 63 corrective or breakdown jobs.")]
    for i, (a, o, n, fm, why) in enumerate(rec):
        r = 5 + i; put(ws, r, 1, a); put(ws, r, 2, o, fmt=fm, font=f_in); put(ws, r, 3, n, fmt=fm, font=f_link)
        if isinstance(o, (int, float)) and fm: put(ws, r, 4, f"=IF(B{r}=0,\"new\",C{r}/B{r}-1)", fmt=P0)
        put(ws, r, 5, why, font=f_note, wrap=True); ws.row_dimensions[r].height = 28
    # ================================================================= Checks
    ws = wb["Checks"]; ws.sheet_view.showGridLines = False
    title(ws, "Model integrity checks", "Each check returns OK or CHECK. The status in C3 feeds the README.")
    widths(ws, [5, 70, 22, 16, 16, 16])
    put(ws, 3, 2, "Overall status", font=f_bold)
    header(ws, 5, ["#", "Check", "Result", "Live value", "Expected", "Difference"])
    mir = {N: run(2, N) for N in (1, 3, 6, 12)}
    checks = [
        ("Scenario switch is 1, 2 or 3", "=IF(OR(scn=1,scn=2,scn=3),\"OK\",\"CHECK\")", "=scn", "1 to 3"),
        ("Case data holds 211 work orders", "=IF(cm_n_wo=211,\"OK\",\"CHECK\")", "=cm_n_wo", 211),
        ("Case data holds 31 breakdowns", "=IF(cm_n_bd=31,\"OK\",\"CHECK\")", "=cm_n_bd", 31),
        ("Breakdown downtime is 434 hours", "=IF(ROUND(cm_bd_hours,0)=434,\"OK\",\"CHECK\")", "=cm_bd_hours", 434),
        ("Mean time to repair is 14.0 hours", "=IF(ROUND(cm_mttr,1)=14,\"OK\",\"CHECK\")", "=cm_mttr", 14.0),
        ("Breakdowns a year match the platform (20.4)", "=IF(ROUND(cm_bd_year,1)=20.4,\"OK\",\"CHECK\")", "=cm_bd_year", 20.4),
        ("Work orders by type add up to the total", f"=IF(Case_Metrics!C{CELLS['cm_type_total_row']}=cm_n_wo,\"OK\",\"CHECK\")", f"=Case_Metrics!C{CELLS['cm_type_total_row']}", "=cm_n_wo"),
        ("Breakdowns by equipment add up to the total", f"=IF(Case_Metrics!D{CELLS['cm_eq_total_row']}=cm_n_bd,\"OK\",\"CHECK\")", f"=Case_Metrics!D{CELLS['cm_eq_total_row']}", "=cm_n_bd"),
        ("Failure mode counts add up to corrective jobs", f"=IF(Case_Metrics!C{CELLS['cm_mode_total_row']}=cm_n_corr,\"OK\",\"CHECK\")", f"=Case_Metrics!C{CELLS['cm_mode_total_row']}", "=cm_n_corr"),
        ("Levers add up to the headline total", "=IF(ABS(lev_L1+lev_L2+lev_L3+lev_L4-lev_total)<0.001,\"OK\",\"CHECK\")", "=lev_L1+lev_L2+lev_L3+lev_L4", "=lev_total"),
        ("3-unit benefits equal the sum of the lever rows", "=IF(ABS(CF_3U!H20-SUM(CF_3U!H16:H19))<0.001,\"OK\",\"CHECK\")", "=CF_3U!H20", "=SUM(CF_3U!H16:H19)"),
        ("3-unit cumulative cash flow equals the sum of annual flows", "=IF(ABS(CF_3U!H32-SUM(CF_3U!C31:H31))<0.001,\"OK\",\"CHECK\")", "=CF_3U!H32", "=SUM(CF_3U!C31:H31)"),
        ("Units live never exceed the programme size", "=IF(AND(MAX(Rollout!B5:F5)<=1,MAX(Rollout!B6:F6)<=3,MAX(Rollout!B7:F7)<=6,MAX(Rollout!B8:F8)<=12),\"OK\",\"CHECK\")", "=MAX(Rollout!B6:F6)", "<= 3"),
        ("No negative cost or input values", "=IF(MIN(Costs!B6:B46)>=0,\"OK\",\"CHECK\")", "=MIN(Costs!B6:B46)", ">= 0"),
        ("Market funnel narrows: total >= serviceable >= obtainable", "=IF(AND(mk_tam_units>=mk_sam_units,mk_sam_units>=mk_som_units),\"OK\",\"CHECK\")", "=mk_sam_units", "between"),
        ("Internal programme is within Chandra Asri unit equivalents", "=IF(mk_internal<=mk_ca_units,\"OK\",\"CHECK\")", "=mk_internal", "=mk_ca_units"),
        ("Top-down and bottom-up serviceable pools within a factor of 10", "=IF(AND(mk_td_usd/mk_sam_usd>0.1,mk_td_usd/mk_sam_usd<10),\"OK\",\"CHECK\")", "=mk_td_usd/mk_sam_usd", "0.1 to 10"),
        ("Competitor weights add up to 100%", "=IF(ABS(Competitors!B13-1)<0.0001,\"OK\",\"CHECK\")", "=Competitors!B13", 1),
    ]
    for N in (1, 3, 6, 12):
        o = mir[N]
        checks.append((f"Replica NPV matches the workbook, {N} unit(s), Base only", f"=IF(scn<>2,\"n/a\",IF(ABS({CELLS['cf%d_npv' % N]}-{o['npv']:.4f})<1,\"OK\",\"CHECK\"))", "=" + CELLS['cf%d_npv' % N], round(o["npv"], 2)))
    o = mir[3]
    for i, nm in enumerate(["lev_L1", "lev_L2", "lev_L3", "lev_L4"]):
        checks.append((f"Replica value of lever {i+1} matches, Base only", f"=IF(scn<>2,\"n/a\",IF(ABS({nm}-{o['lv']['L'][i]:.6f})<0.01,\"OK\",\"CHECK\"))", "=" + nm, round(o["lv"]["L"][i], 3)))
    checks.append(("Replica after-tax NPV matches, 3 units, Base only", f"=IF(scn<>2,\"n/a\",IF(ABS({CELLS['cf3_npv_at']}-{o['npv_at']:.4f})<1,\"OK\",\"CHECK\"))", "=" + CELLS['cf3_npv_at'], round(o["npv_at"], 2)))
    checks.append(("Replica repeat count matches the case data rule", f"=IF(cm_rep={CM['rep']},\"OK\",\"CHECK\")", "=cm_rep", CM["rep"]))
    for i, (lab, f, live, exp) in enumerate(checks):
        r = 6 + i; put(ws, r, 1, i + 1); put(ws, r, 2, lab); put(ws, r, 3, f, font=f_bold, al="center"); put(ws, r, 4, live, fmt=M2, font=f_link)
        put(ws, r, 5, exp, fmt=M2, font=f_in if not str(exp).startswith("=") else f_link)
        if isinstance(exp, (int, float)) or str(exp).startswith("="): put(ws, r, 6, f'=IF(ISNUMBER(D{r}),IF(ISNUMBER(E{r}),D{r}-E{r},""),"")', fmt=M2)
    last = 6 + len(checks) - 1
    put(ws, 3, 3, f'=IF(COUNTIF(C6:C{last},"CHECK")=0,"ALL CHECKS PASS","REVIEW: "&COUNTIF(C6:C{last},"CHECK")&" CHECK(S) FAILED")', font=f_bold, fill=fill_key)
    # ================================================================= Sources
    ws = wb["Sources"]; ws.sheet_view.showGridLines = False
    title(ws, "Sources", "Published sources used for market facts and benchmarks. Accessed 3 October 2026 through public web search. Figures from secondary summaries are marked as indicative in the text.")
    widths(ws, [6, 56, 44, 80])
    header(ws, 4, ["ID", "Source", "Used for", "Link"])
    src = [("CALIBER 2026 Case Book and Booklet (Case 1: Manufacturing Knowledge Hub)", "Scope, key questions, evaluation criteria, deck structure", "Provided by the organiser"),
           ("Maintenance History (All Equipment).xlsx, Data Set Explanation for Case 1", "211 work orders, breakdown and downtime data, document register", "Provided by the organiser"),
           ("Chemical Engineering: Chandra Asri new polyethylene plant", "Polyethylene capacity 336 kt plus 400 kt", "https://chemengonline.com/chandra-asri-selects-unipol-pe-process-technology-for-new-polyethylene-plant"),
           ("Chandra Asri investor update, HSBC Asia Credit Conference, 12 Jun 2018", "Ethylene capacity, market share of olefins and polymers", "https://webdev.chandra-asri.com/files/attachments/downloads/Presentasi/2018/Investor Update - HSBC Asia Credit Conference, 12 Jun 2018.pdf"),
           ("IDNFinancials: TPIA net loss soars 105.9% in 2024", "Revenue and net loss FY2024", "https://idnfinancials.com/news/53214/tpias-net-loss-soars-105-9-in-2024"),
           ("PT Chandra Asri Pacific Tbk 2024 Sustainability Report", "Employee numbers", "https://www.sustainabilityreports.com/pt-chandra-asri-pacific/2024/sustainability-report"),
           ("German-Indonesian Chamber of Commerce and Industry (AHK): demand for plastics expected to increase by 50% by 2027", "Polyethylene and polypropylene demand and import share", "https://indonesien.ahk.de/en/infohub_news/demand-for-plastics-expected-to-increase-by-50-by-2027"),
           ("Argus Media: Indonesia introduces quota to tighten PE and PP imports", "Import quota from 10 March 2024", "https://www.argusmedia.com/en/news-and-insights/latest-market-news/2519542-indonesia-introduces-quota-to-tighten-pe-pp-imports"),
           ("Katadata Databoks: growth and contribution of Indonesia's manufacturing industry strengthened in 2025", "Chemical sector share of GDP; Ministry of Industry export and investment data", "https://databoks.katadata.co.id/en/economics-macro/statistics/6985b350be63f/growth-and-contribution-of-indonesias-manufacturing-industry-strengthened-in-2025"),
           ("Statista Market Insights: Artificial Intelligence, Indonesia", "Indonesia AI market size and growth", "https://es.statista.com/outlook/tmo/artificial-intelligence/indonesia"),
           ("Grand View Research via GII: Knowledge management software market", "Global market size and growth", "https://www.giikorea.co.kr/report/grvi1814134-knowledge-management-software-market-size-share.html"),
           ("IMARC Group: Asset performance management market", "Global APM market", "https://imarcgroup.com/asset-performance-management-market-statistics"),
           ("Asia Pacific predictive maintenance market report (DRI)", "Regional predictive maintenance market", "https://dri.co.jp/auto/report/bonafide/250402-asia-pacific-predictive-maintenance-market.html"),
           ("Siemens: The True Cost of Downtime 2024 (white paper)", "Industrial downtime cost benchmark", "https://www.automation.com/en-us/assets/white-papers/white-paper-true-costs-downtime-2024"),
           ("Reliability Magazine: Industrial downtime cost benchmarks", "Aberdeen Group downtime benchmark and caveats", "https://reliamag.com/maintenance-and-reliability/industrial-downtime-cost-benchmarks/"),
           ("Cottrill Research: survey statistics on time spent searching for information", "McKinsey and IDC search time statistics", "https://cottrillresearch.com/various-survey-statistics-workers-spend-too-much-time-searching-for-information/"),
           ("Sensemore: reducing unplanned downtime with predictive maintenance", "Reported 30 to 40% reduction in unplanned downtime", "https://sensemore.io/reducing-unplanned-downtime-with-predictive-maintenance/"),
           ("Chemical Processing: Retirement casts a long shadow", "Ageing workforce and knowledge loss", "https://www.chemicalprocessing.com/articles/2013/retirement-casts-a-long-shadow"),
           ("IDNFinancials: BI holds benchmark rate at 5.75% (September 2026)", "BI Rate", "https://www.idnfinancials.com/news/66412"),
           ("IDNFinancials: DBS, Indonesia's 10-year yield unlikely to fall below 7%", "10-year government bond yield", "https://www.idnfinancials.com/news/66794/dbs-indonesias-10-year-yield-unlikely-to-fall-below-7"),
           ("Katadata Databoks: rupiah exchange rate, 25 September 2026", "IDR per USD", "https://databoks.katadata.co.id/en/market/statistics/32ec67c22c32882/rupiah-exchange-rate-weakens-to-idr-179134-per-us-dollar-friday-25-september-2026"),
           ("PwC Worldwide Tax Summaries: Indonesia, taxes on corporate income", "22% corporate income tax", "https://taxsummaries.pwc.com/indonesia/corporate/taxes-on-corporate-income"),
           ("Legal Technology: Microsoft announces pricing for Copilot at USD 30 per user a month", "Generic assistant licence price", "https://legaltechnology.com/microsoft-announces-pricing-for-copilot-at-30-per-user-per-month-unveils-bing-chat-enterprise/"),
           ("Morph: Gemini API pricing (2026)", "AI service list price per million tokens", "https://www.morphllm.com/gemini-api-pricing"),
           ("Polymer Update: LLDPE film prices, Southeast Asia", "Polyethylene price range 2026", "https://www.polymerupdate.com/Prices/SEA/Polymers/LLDPE"),
           ("Paylab Indonesia: chemical engineer salary", "Lower-bound cross-check of salaries", "https://www.paylab.com/id/salaryinfo/chemical-industry/chemical-engineer?lang=en")]
    for i, (a, b, c) in enumerate(src):
        r = 5 + i; put(ws, r, 1, f"S{i+1}"); put(ws, r, 2, a, wrap=True); put(ws, r, 3, b, wrap=True); put(ws, r, 4, c, wrap=True, font=f_note); ws.row_dimensions[r].height = 30
    r = 5 + len(src) + 1
    put(ws, r, 1, "Failure mode keyword rule (first match wins)", font=f_bold);
    for i, (n, ks) in enumerate(spec.FM_RULES): put(ws, r + 1 + i, 2, n); put(ws, r + 1 + i, 3, ", ".join(ks), font=f_note)
    put(ws, r + 1 + len(spec.FM_RULES), 2, "Other"); put(ws, r + 1 + len(spec.FM_RULES), 3, "No keyword matched", font=f_note)
    json.dump(dict(SENS=SENS, RISKS=RISKS, MC={f"{k[0]}|{k[1]}": v for k, v in MC.items()}, hist=dict(lo=lo_, w=w, counts=counts), params=[list(p) for p in params],
                   old=old, base={N: dict(npv=mir[N]["npv"], npv_at=mir[N]["npv_at"], irr=mir[N]["irr"], pb=mir[N]["pb"], dpb=mir[N]["dpb"], steady=mir[N]["steady"], bcr=mir[N]["bcr"], roi=mir[N]["roi"], oneoff=sum(mir[N]["capex"]), pvb=mir[N]["pvb"], pvc=mir[N]["pvc"], run5=mir[N]["run"][5] / mir[N]["esc"][5], upside=mir[N]["steady"] and mir[N]["up"][0][5] / mir[N]["esc"][5]) for N in mir}),
              open(os.path.join(spec.HERE, "analysis.json"), "w"), indent=1, default=str)
