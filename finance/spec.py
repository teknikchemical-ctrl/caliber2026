"""Business impact model: input table and a Python mirror of the workbook logic.
The mirror is used (a) as an independent check of the Excel formulas, (b) to produce sensitivity, scenario grids and the Monte Carlo run."""
import datetime as dt, collections, math, os, random
import openpyxl

HERE = os.path.dirname(os.path.abspath(__file__))
XLS = os.path.join(HERE, "..", "Maintenance History (All Equipment).xlsx")
HIST_END = dt.date(2025, 12, 10)

# ---------------------------------------------------------------- case data (from the maintenance history)
FM_RULES = [("Seal or gasket leak", ["seal", "gasket", "leak", "weep", "packing"]),
            ("Valve or actuator", ["valve", "actuator", "positioner", "stick"]),
            ("Bearing or lubrication", ["bearing", "lube", "oil", "grease"]),
            ("Vibration or misalignment", ["vibration", "misalign", "coupling", "imbalance"]),
            ("Blocked or fouled", ["foul", "block", "plug", "choke", "scale"]),
            ("Instrument or analyser", ["transmitter", "analy", "thermocouple", "instrument", "sensor", "calibrat", "reading", "indicat"])]

def _d(x):
    if isinstance(x, dt.datetime): return x.date()
    return dt.datetime.strptime(str(x)[:10], "%Y-%m-%d").date()

def load_wo():
    wb = openpyxl.load_workbook(XLS, data_only=True); ws = wb.worksheets[0]
    rows = list(ws.iter_rows(values_only=True)); H = rows[0]
    out = []
    for r in rows[1:]:
        o = dict(zip(H, r))
        o["rd"] = _d(o["Report_Date"]); o["cd"] = _d(o["Completion_Date"])
        o["dh"] = float(o["Downtime_Hours"]) if o["Downtime_Hours"] not in (None, "") else None
        o["lh"] = float(o["Labor_Hours"] or 0); o["cost"] = float(o["Total_Cost_IDR"] or 0)
        out.append(o)
    return out

def fmode(r):
    t = ((r["Problem_Description"] or "") + " " + (r["Root_Cause"] or "")).lower()
    for n, ks in FM_RULES:
        if any(k in t for k in ks): return n
    return "Other"

def case_metrics(W):
    cor = [r for r in W if r["Work_Type"] == "Corrective" or r["Breakdown"] == "Yes"]
    for r in W: r["flag"] = 1 if (r["Work_Type"] == "Corrective" or r["Breakdown"] == "Yes") else 0
    for r in W: r["mode"] = fmode(r) if r["flag"] else ""
    rep = 0
    for r in W:
        r["rep"] = 0
        if r["flag"] and any(p is not r and p["flag"] and p["Equipment_Tag"] == r["Equipment_Tag"] and p["mode"] == r["mode"] and r["rd"] - dt.timedelta(days=120) <= p["rd"] < r["rd"] for p in W):
            r["rep"] = 1; rep += 1
    start = min(r["rd"] for r in W); days = (HIST_END - start).days; yrs = days / 365
    bd = [r for r in W if r["Breakdown"] == "Yes"]; bdh = sum(r["dh"] for r in bd)
    m = dict(n_wo=len(W), start=start, days=days, years=yrs, n_bd=len(bd), bd_hours=bdh, mttr=bdh / len(bd), bd_year=len(bd) / yrs,
             n_corr=len(cor), rep=rep, rep_rate=rep / len(cor), cost_corr=sum(r["cost"] for r in cor), bd_cost=sum(r["cost"] for r in bd),
             avg_corr_cost=sum(r["cost"] for r in cor) / len(cor) / 1e6, avg_bd_cost=sum(r["cost"] for r in bd) / len(bd) / 1e6,
             corr_year=len(cor) / yrs, bd_share=len(bd) / len(cor), total_cost=sum(r["cost"] for r in W))
    return m

# ---------------------------------------------------------------- inputs: (name, label, unit, base, pessimistic, optimistic, tag, source)
# tags: Case data | Market source | Estimate | Assumption
G = "#"
INPUTS = [
 (G, "General and finance"),
 ("fx", "Exchange rate", "IDR per USD", 17900, 17900, 17900, "Market source", "Databoks, 25 Sep 2026: IDR 17,913 per USD; 29 Sep 2026: IDR 17,953."),
 ("infl", "Annual cost and benefit escalation", "%", 0.04, 0.04, 0.04, "Assumption", "Salary and service price growth. Applied equally to benefits and costs."),
 ("tax", "Corporate income tax rate", "%", 0.22, 0.22, 0.22, "Market source", "Indonesian standard corporate income tax rate of 22 percent (PwC Tax Summaries; Deloitte Tax Highlights)."),
 ("dep_years", "Straight-line depreciation period for one-off costs", "years", 4, 4, 4, "Assumption", "Capitalised implementation cost over four years, a common software capitalisation period."),
 ("rf", "Risk-free rate (10-year government bond)", "%", 0.074, 0.074, 0.074, "Market source", "Indonesia 10-year yield 7.37 percent at 24 Jul 2026 (IDNFinancials, Trading Economics)."),
 ("erp", "Equity risk premium", "%", 0.065, 0.065, 0.065, "Assumption", "Mature market premium plus a country risk premium, rounded."),
 ("beta", "Equity beta", "x", 1.10, 1.10, 1.10, "Assumption", "Petrochemical producers are cyclical, so beta is set above 1.0."),
 ("cod", "Pre-tax cost of debt", "%", 0.085, 0.085, 0.085, "Estimate", "BI Rate 5.75 percent (Sep 2026) plus a corporate credit spread of about 2.75 points."),
 ("debt_share", "Debt share of capital", "%", 0.35, 0.35, 0.35, "Assumption", "Typical target gearing for a listed chemical producer."),
 ("wacc_adj", "Scenario adjustment to the discount rate", "points", 0.0, 0.01, -0.005, "Assumption", "Pessimistic adds 1.0 point for delivery risk. Optimistic subtracts 0.5 point."),
 (G, "People and labour cost per unit"),
 ("n_op", "Operators using the platform", "people", 15, 15, 15, "Assumption", "Shift operators and technicians of one process unit. Total of 45 users matches the platform pilot design."),
 ("n_eng", "Process and maintenance engineers", "people", 12, 12, 12, "Assumption", "Engineers across process, mechanical, instrument and electrical disciplines."),
 ("n_rel", "Reliability engineers", "people", 6, 6, 6, "Assumption", "Reliability and inspection engineers."),
 ("n_hse", "HSE engineers", "people", 5, 5, 5, "Assumption", "Process safety and HSE staff."),
 ("n_mgr", "Supervisors and managers", "people", 7, 7, 7, "Assumption", "Shift supervisors, section heads and unit managers."),
 ("sal_op", "Monthly gross salary, operator", "IDR M", 10, 10, 10, "Estimate", "Team estimate for a listed petrochemical producer. Paylab Indonesia (all employers) shows a lower range of IDR 2.4 M to 5.2 M for the chemical sector, so this is a company-level estimate."),
 ("sal_eng", "Monthly gross salary, engineer", "IDR M", 22, 22, 22, "Estimate", "Team estimate. To be replaced with Company payroll bands."),
 ("sal_rel", "Monthly gross salary, reliability engineer", "IDR M", 25, 25, 25, "Estimate", "Team estimate."),
 ("sal_hse", "Monthly gross salary, HSE engineer", "IDR M", 22, 22, 22, "Estimate", "Team estimate."),
 ("sal_mgr", "Monthly gross salary, supervisor or manager", "IDR M", 45, 45, 45, "Estimate", "Team estimate."),
 ("load", "Employer cost on top of gross salary", "%", 0.35, 0.35, 0.35, "Assumption", "Bonus, social security, allowances and overhead."),
 ("days", "Working days a year", "days", 230, 230, 230, "Assumption", "After leave, public holidays and shift rotation."),
 ("hpd", "Paid hours a day", "hours", 8, 8, 8, "Assumption", "Standard working day."),
 (G, "Value lever 1: time spent searching and checking sources"),
 ("s_base", "Minutes a day spent finding and checking trusted sources", "min per user", 40, 36, 44, "Assumption", "Plant-specific share of the 1.8 hours a day that McKinsey reports for searching and gathering information, and the 2.5 hours a day that IDC reports. 40 minutes is deliberately low."),
 ("s_red", "Reduction in search time with the platform", "%", 0.50, 0.45, 0.55, "Assumption", "Cited answers replace manual search across SOPs, P&IDs, datasheets and work orders. To be measured in the pilot."),
 ("conv", "Share of freed time that becomes productive work", "%", 0.60, 0.55, 0.65, "Assumption", "Not all saved minutes can be redeployed. Added to the earlier slide, which counted 100 percent."),
 ("adopt", "Steady-state share of users who use the platform regularly", "%", 0.85, 0.80, 0.90, "Assumption", "Typical enterprise tool adoption after change management."),
 ("ramp1", "Adoption in year 1 as a share of steady state", "%", 0.60, 0.60, 0.60, "Assumption", "First year after go-live."),
 ("ramp2", "Adoption in year 2 as a share of steady state", "%", 0.85, 0.85, 0.85, "Assumption", "Second year after go-live. Year 3 onwards is 100 percent."),
 (G, "Value lever 4: faster start for new and rotated staff"),
 ("joiners", "New joiners and role changes a year, per unit", "people", 6, 5, 7, "Assumption", "About 13 percent of 45 users. Context: about 40 percent of chemical workforces are aged 45 and over (Chemical Processing)."),
 ("d_saved", "Working days saved before a joiner is productive", "days", 10, 9, 11, "Assumption", "Access to lessons, procedures and failure history shortens the learning period."),
 (G, "Value levers 2 and 3: breakdown duration and repeat failures"),
 ("mttr_red", "Reduction in mean time to repair", "%", 0.10, 0.085, 0.115, "Assumption", "Faster diagnosis from failure memory. Published predictive maintenance studies report 30 to 40 percent lower unplanned downtime, so 10 percent is conservative."),
 ("attrib", "Share of the gain credited to the platform", "%", 0.70, 0.65, 0.75, "Assumption", "Other initiatives also affect repair time. Added to the earlier slide, which credited 100 percent."),
 ("rep_red", "Reduction in repeat failures within 120 days", "%", 0.30, 0.25, 0.35, "Assumption", "Failure memory shows past root causes before a job starts."),
 (G, "Value of one hour of unit downtime"),
 ("cap_kt", "Polyethylene unit capacity", "kt per year", 336, 336, 336, "Market source", "Chandra Asri's existing Cilegon polyethylene plant: 336 kt a year (Chandra Asri investor materials; Chemical Engineering). Used as a proxy for the LLDPE unit."),
 ("op_hours", "Operating hours a year", "hours", 8000, 8000, 8000, "Assumption", "About 91 percent on-stream time."),
 ("margin", "Contribution margin lost per tonne", "USD per t", 220, 190, 250, "Estimate", "Polyethylene price less naphtha-linked variable cost. Southeast Asia LLDPE traded between USD 920 and 1,500 per tonne CFR in 2026 (Polymer Update)."),
 ("loss", "Share of breakdown hours that reduce plant output", "%", 0.20, 0.17, 0.23, "Assumption", "Many equipment sets have spares or only degrade performance, so only part of the hours stop output."),
 (G, "Upside levers (reported separately, not in the headline)"),
 ("su_ev", "Start-up or restart delays a year, per unit", "events", 0.5, 0.4, 0.6, "Assumption", "Delays caused by missing permissive or document checks."),
 ("su_h", "Hours avoided per delay", "hours", 4, 3, 5, "Assumption", "Start-up readiness page removes late checks."),
 ("inc_f", "Procedure-related incidents a year, per unit", "events", 0.3, 0.25, 0.35, "Assumption", "Illustrative frequency of events linked to wrong or outdated knowledge."),
 ("inc_c", "Average cost of such an incident", "IDR M", 5000, 4500, 5500, "Assumption", "Direct cost only. No reputational or regulatory cost."),
 ("inc_r", "Reduction in such incidents", "%", 0.10, 0.08, 0.12, "Assumption", "Approved sources and the bypass guard."),
 ("docs", "Controlled documents per unit", "documents", 98, 98, 98, "Case data", "Platform document register of the eight equipment sets."),
 ("rw_h", "Hours a year spent resolving document conflicts, per document", "hours", 3, 2.5, 3.5, "Assumption", "Checking revisions and approval status by hand."),
 ("rw_red", "Reduction in document rework", "%", 0.50, 0.45, 0.55, "Assumption", "Approval status and conflict flags."),
 (G, "One-off cost, shared across all units (IDR M)"),
 ("pm", "Platform configuration and hardening", "person-months", 8, 9, 7.5, "Estimate", "Configuration, role model, audit trail, performance tuning."),
 ("pm_rate", "Blended cost of a person-month", "IDR M", 55, 55, 55, "Estimate", "Mix of internal engineers and implementation partner staff."),
 ("n_conn", "Source system connectors (EDMS, AIMS, CMMS, historian)", "connectors", 4, 4, 4, "Case data", "The four systems named in the Case Book."),
 ("conn", "Cost per connector", "IDR M", 100, 110, 95, "Estimate", "Interface build, mapping and test."),
 ("sec", "Security review and penetration test", "IDR M", 150, 170, 135, "Estimate", "Single sign-on, access review, cloud security review."),
 ("gov", "Governance setup and change design", "IDR M", 100, 100, 100, "Estimate", "Approval workflow, data owners, communication plan."),
 ("t_mat", "Training material and demo content", "IDR M", 60, 60, 60, "Estimate", "Manuals, videos and quick guides."),
 ("cont", "Contingency on one-off cost", "%", 0.15, 0.20, 0.12, "Assumption", "Applied to shared and per-unit one-off cost."),
 (G, "One-off cost for each unit (IDR M)"),
 ("ing_d", "Document ingestion, tagging and cleansing", "person-days", 49, 55, 45, "Estimate", "About 0.5 person-day for each of 98 documents."),
 ("d_rate", "Cost of a person-day", "IDR M", 3.0, 3.0, 3.0, "Estimate", "Data engineer or document controller."),
 ("w_sets", "Equipment sets per unit", "sets", 8, 8, 8, "Case data", "Eight equipment sets in the sample unit."),
 ("w_sess", "Knowledge capture sessions per equipment set", "sessions", 3, 3, 3, "Assumption", "Expert interviews for tacit knowledge and lessons."),
 ("w_cost", "Cost per knowledge capture session", "IDR M", 6, 6, 6, "Estimate", "Facilitator plus expert time."),
 ("t_h", "Training hours per user", "hours", 4, 4, 4, "Assumption", "Valued at the average loaded hourly cost."),
 ("uat", "Validation and acceptance testing", "IDR M", 60, 60, 60, "Estimate", "Test with unit staff before go-live."),
 (G, "Running cost (IDR M a year)"),
 ("cloud", "Cloud hosting and storage", "IDR M", 80, 80, 80, "Estimate", "Application hosting, database and backup."),
 ("ai_ea", "AI platform agreement and data residency", "IDR M", 90, 90, 90, "Estimate", "Enterprise terms for the AI service, if the Company chooses to connect one."),
 ("km_fte", "Knowledge manager (share of one person)", "FTE", 0.5, 0.5, 0.5, "Assumption", "Owns approval queue and quality gates."),
 ("km_cost", "Monthly loaded cost, knowledge manager", "IDR M", 40, 40, 40, "Estimate", "Team estimate."),
 ("eng_fte", "Platform engineer (share of one person)", "FTE", 0.2, 0.2, 0.2, "Assumption", "Releases, connectors, monitoring."),
 ("eng_cost", "Monthly loaded cost, platform engineer", "IDR M", 60, 60, 60, "Estimate", "Team estimate."),
 ("sec_a", "Annual security audit", "IDR M", 60, 60, 60, "Estimate", "Penetration test and access recertification."),
 ("mon", "Monitoring, licences and tools", "IDR M", 40, 40, 40, "Estimate", "Observability and software licences."),
 ("r_cont", "Contingency on running cost", "%", 0.10, 0.12, 0.08, "Assumption", "Applied to running cost."),
 ("q_day", "Questions per active user a day", "queries", 8, 8, 8, "Assumption", "Typical use during a shift."),
 ("tok_in", "Input tokens per question", "tokens", 3000, 3000, 3000, "Assumption", "Question plus retrieved sources."),
 ("tok_out", "Output tokens per answer", "tokens", 600, 600, 600, "Assumption", "Answer with citations."),
 ("p_in", "AI service price, input", "USD per M tokens", 0.30, 0.30, 0.30, "Market source", "Gemini 2.5 Flash list price, Aug 2026."),
 ("p_out", "AI service price, output", "USD per M tokens", 2.50, 2.50, 2.50, "Market source", "Gemini 2.5 Flash list price, Aug 2026."),
 ("q_mult", "Retries, tool rounds and safety buffer", "x", 3, 3, 3, "Assumption", "Multiplies token cost for multi-step answers."),
 ("i_cloud", "Added cloud cost per extra unit", "IDR M", 30, 30, 30, "Estimate", "Storage and compute for one more unit."),
 ("i_km", "Added knowledge manager time per extra unit", "FTE", 0.25, 0.25, 0.25, "Assumption", "Local content owner."),
 ("i_eng", "Added platform engineer time per extra unit", "FTE", 0.1, 0.1, 0.1, "Assumption", "Connector and release effort."),
]

# wider ranges used only for the Monte Carlo run: approximately the 10th and 90th percentile of each driver (independent draws)
MC_RANGES = {"s_base": (30, 50), "s_red": (0.30, 0.60), "conv": (0.45, 0.75), "adopt": (0.65, 0.92), "joiners": (4, 8), "d_saved": (5, 15),
             "mttr_red": (0.05, 0.15), "attrib": (0.50, 0.85), "rep_red": (0.15, 0.40), "margin": (140, 320), "loss": (0.12, 0.30),
             "pm": (7, 10), "conn": (90, 120), "sec": (120, 200), "cont": (0.10, 0.25), "ing_d": (40, 60), "r_cont": (0.08, 0.15)}

ROLLOUT = {1: [1, 1, 1, 1, 1], 3: [1, 2, 3, 3, 3], 6: [1, 3, 5, 6, 6], 12: [1, 4, 8, 12, 12]}
SCEN_NAMES = {1: "Pessimistic", 2: "Base", 3: "Optimistic"}

def input_table():
    return [x for x in INPUTS if x[0] != G]

def active(sc, ov=None):
    a = {}
    for x in input_table():
        n, _, _, b, lo, hi = x[:6]
        a[n] = {1: lo, 2: b, 3: hi}[sc]
    if ov: a.update(ov)
    return a

# ---------------------------------------------------------------- model
def labour(a):
    roles = [("n_op", "sal_op"), ("n_eng", "sal_eng"), ("n_rel", "sal_rel"), ("n_hse", "sal_hse"), ("n_mgr", "sal_mgr")]
    hrs = a["days"] * a["hpd"]
    users = sum(a[n] for n, _ in roles)
    hourly = {s: a[s] * 1e6 * 12 * (1 + a["load"]) / hrs for _, s in roles}
    avg = sum(a[n] * hourly[s] for n, s in roles) / users
    return users, avg, hrs

def levers(a, cm):
    users, avg, hrs = labour(a)
    dv_full = a["cap_kt"] * 1000 / a["op_hours"] * a["margin"] * a["fx"] / 1e6          # IDR M per hour of full stoppage
    dv = dv_full * a["loss"]
    L1 = users * (a["s_base"] * a["s_red"] / 60) * a["days"] * avg * a["conv"] / 1e6
    avoided_bd = cm["bd_year"] * cm["rep_rate"] * a["rep_red"]
    avoided_jobs = cm["corr_year"] * cm["rep_rate"] * a["rep_red"]
    residual = cm["bd_year"] - avoided_bd
    L2 = residual * cm["mttr"] * a["mttr_red"] * a["attrib"] * dv
    L3 = (avoided_bd * cm["mttr"] * dv + avoided_jobs * cm["avg_corr_cost"]) * a["attrib"]
    L4 = a["joiners"] * a["d_saved"] * avg * a["hpd"] * a["conv"] / 1e6
    U1 = a["su_ev"] * a["su_h"] * dv_full * a["attrib"]
    U2 = a["inc_f"] * a["inc_c"] * a["inc_r"]
    U3 = a["docs"] * a["rw_h"] * a["rw_red"] * avg / 1e6
    return dict(users=users, avg=avg, dv_full=dv_full, dv=dv, L=[L1, L2, L3, L4], U=[U1, U2, U3], avoided_bd=avoided_bd, avoided_jobs=avoided_jobs, residual=residual)

def costs(a, users, avg):
    shared = (a["pm"] * a["pm_rate"] + a["n_conn"] * a["conn"] + a["sec"] + a["gov"] + a["t_mat"]) * (1 + a["cont"])
    unit = (a["ing_d"] * a["d_rate"] + a["w_sets"] * a["w_sess"] * a["w_cost"] + users * a["t_h"] * avg / 1e6 + a["uat"]) * (1 + a["cont"])
    ai = users * a["q_day"] * a["days"] * (a["tok_in"] * a["p_in"] + a["tok_out"] * a["p_out"]) / 1e6 * a["q_mult"] * a["fx"] / 1e6
    run_base = (a["cloud"] + a["ai_ea"] + a["km_fte"] * a["km_cost"] * 12 + a["eng_fte"] * a["eng_cost"] * 12 + a["sec_a"] + a["mon"] + ai) * (1 + a["r_cont"])
    run_inc = (a["i_cloud"] + a["i_km"] * a["km_cost"] * 12 + a["i_eng"] * a["eng_cost"] * 12 + ai) * (1 + a["r_cont"])
    return dict(shared=shared, unit=unit, ai=ai, run_base=run_base, run_inc=run_inc)

def wacc(a):
    ke = a["rf"] + a["beta"] * a["erp"]
    return (1 - a["debt_share"]) * ke + a["debt_share"] * a["cod"] * (1 - a["tax"])

def irr(cf):
    f = lambda r: sum(c / (1 + r) ** i for i, c in enumerate(cf))
    lo, hi = -0.99, 10.0
    if f(lo) * f(hi) > 0: return None
    for _ in range(200):
        mid = (lo + hi) / 2
        if f(lo) * f(mid) <= 0: hi = mid
        else: lo = mid
    return (lo + hi) / 2

def payback(cf):
    cum = 0.0
    for t, c in enumerate(cf):
        prev = cum; cum += c
        if t >= 1 and prev < 0 <= cum: return ((t - 1) + (-prev) / c) * 12
    return None

def run(sc=2, N=3, ov=None, cm=None, rollout=None):
    a = active(sc, ov); cm = cm or CM
    lv = levers(a, cm); cs = costs(a, lv["users"], lv["avg"])
    bx = 1 + a.get("_ben_x", 0.0)
    lv["L"] = [x * bx for x in lv["L"]]; lv["U"] = [x * bx for x in lv["U"]]
    for k in ("shared", "unit"): cs[k] *= 1 + a.get("_oneoff_x", 0.0)
    cs["shared"] += a.get("_shared_add", 0.0)
    for k in ("run_base", "run_inc"): cs[k] *= 1 + a.get("_run_x", 0.0)
    r = wacc(a) + a["wacc_adj"] + a.get("_r_add", 0.0)
    live = (rollout or ROLLOUT[N]); T = 5
    new = [0] + [live[0]] + [live[t] - live[t - 1] for t in range(1, T)]       # index 0..5; new[t] = units going live in year t
    adopt = lambda k: a["adopt"] * (a["ramp1"] if k == 1 else a["ramp2"] if k == 2 else 1.0)
    eff = [0.0] * (T + 1)
    for t in range(1, T + 1):
        eff[t] = sum(new[c] * adopt(t - c + 1) for c in range(1, t + 1))
    esc = [(1 + a["infl"]) ** t for t in range(T + 1)]
    ben = [[0.0] * (T + 1) for _ in range(4)]; up = [[0.0] * (T + 1) for _ in range(3)]
    for t in range(1, T + 1):
        for i in range(4): ben[i][t] = eff[t] * lv["L"][i] * esc[t]
        for i in range(3): up[i][t] = eff[t] * lv["U"][i] * esc[t]
    shared = [cs["shared"] if t == 0 else 0.0 for t in range(T + 1)]
    onb = [(new[t + 1] if t + 1 <= T else 0) * cs["unit"] * esc[t] for t in range(T + 1)]
    capex = [shared[t] + onb[t] for t in range(T + 1)]
    run_ = [0.0] + [(cs["run_base"] + (live[t - 1] - 1) * cs["run_inc"]) * esc[t] for t in range(1, T + 1)]
    B = [sum(ben[i][t] for i in range(4)) for t in range(T + 1)]
    cf = [B[t] - capex[t] - run_[t] for t in range(T + 1)]
    dep = [sum(capex[k] / a["dep_years"] for k in range(t) if t - k <= a["dep_years"]) for t in range(T + 1)]
    taxd = [(B[t] - run_[t] - dep[t]) * a["tax"] for t in range(T + 1)]
    cf_at = [cf[t] - taxd[t] for t in range(T + 1)]
    df = [1 / (1 + r) ** t for t in range(T + 1)]
    npv = sum(cf[t] * df[t] for t in range(T + 1)); npv_at = sum(cf_at[t] * df[t] for t in range(T + 1))
    pvb = sum(B[t] * df[t] for t in range(T + 1)); pvc = sum((capex[t] + run_[t]) * df[t] for t in range(T + 1))
    # discounted payback
    dcf = [cf[t] * df[t] for t in range(T + 1)]
    return dict(a=a, lv=lv, cs=cs, r=r, live=live, new=new, eff=eff, esc=esc, ben=ben, up=up, B=B, capex=capex, run=run_, cf=cf, cf_at=cf_at,
                npv=npv, npv_at=npv_at, irr=irr(cf), irr_at=irr(cf_at), pb=payback(cf), dpb=payback(dcf), bcr=pvb / pvc,
                roi=(sum(B) - sum(capex) - sum(run_)) / (sum(capex) + sum(run_)), steady=B[T] / esc[T], sum_cf=sum(cf), pvb=pvb, pvc=pvc,
                upside=[sum(up[i][t] for t in range(T + 1)) for i in range(3)])

W = load_wo()
CM = case_metrics(W)

if __name__ == "__main__":
    print({k: (round(v, 3) if isinstance(v, float) else v) for k, v in CM.items()})
    for sc in (1, 2, 3):
        for N in (1, 3, 6, 12):
            o = run(sc, N)
            print(SCEN_NAMES[sc], N, "NPV %.0f" % o["npv"], "NPVat %.0f" % o["npv_at"], "IRR", None if o["irr"] is None else round(o["irr"], 3), "PB", None if o["pb"] is None else round(o["pb"], 1), "steady %.0f" % o["steady"], "BCR %.2f" % o["bcr"])
    o = run(2, 3); print([round(x) for x in o["lv"]["L"]], [round(x) for x in o["lv"]["U"]], round(o["lv"]["dv"], 1), round(o["lv"]["avg"]), {k: round(v) for k, v in o["cs"].items()}, round(o["r"], 4))
