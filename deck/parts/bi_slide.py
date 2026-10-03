# ---------------------------------------------------------------- 5 business impact: financial model (finance/Business_Impact_Financial_Model.xlsx)
import importlib.util, json as _json
_fdir = os.path.join(HERE, "..", "finance")
sys.path.insert(0, _fdir)
import spec as FIN
_A = _json.load(open(os.path.join(_fdir, "analysis.json")))
RN = {N: FIN.run(2, N) for N in (1, 3, 6, 12)}
FR = RN[3]; F1 = RN[1]
MCV = _A["MC"]
def _mc(k, N): return MCV[f"{k}|{N}"]
POS3 = _mc("Probability that NPV is positive", 3)
SENSR = _A["SENS"]["rows"]
import openpyxl as _ox
_wbv = _ox.load_workbook(os.path.join(_fdir, "Business_Impact_Financial_Model.xlsx"), data_only=True)
def _nm(n):
    sh, cell = _wbv.defined_names[n].attr_text.split("!"); return _wbv[sh.strip("'")][cell.replace("$", "")].value
TAM_U, TAM_V, TAM_R = _nm("mk_tam_units"), _nm("mk_tam_value"), _nm("mk_tam_rev")
CSH = FR["cs"]; PILOT_ONE = CSH["shared"] + CSH["unit"]; PILOT_RUN = CSH["run_base"]
LSS = [x * FIN.active(2)["adopt"] for x in FR["lv"]["L"]]

s = blank(prs)
frame(s, 5, f"Business impact: at three units the platform could return about {{{{IDR {FR['steady']/1000:.1f} B}}}} a year, with a net present value of IDR {FR['npv']/1000:.1f} B and payback in about {FR['pb']:.0f} months",
      None, "Impact", "Financial model: Business_Impact_Financial_Model.xlsx and the Business Impact and Financial Modelling Report, linked in the submission. Case data from 211 work orders; other inputs are cited, estimated or assumed in the model", "Impact assessment and projection")
for i, (n_, l_, c_) in enumerate([(f"IDR {FR['steady']/1000:.1f} B", "Value a year at 3 units", GREEN), (f"IDR {FR['npv']/1000:.1f} B", f"NPV at 3 units, IRR {FR['irr']*100:.0f}%", BLUE), (f"{FR['pb']:.0f} months", "Payback at 3 units", ORANGE)]):
    box(s, 0.4 + i * 1.4, 1.26, 1.34, 0.8, TINT[c_], c_, [[(n_, {"bold": True, "size": 14, "color": c_})], [(l_, {"size": 8, "color": INK})]], 14, False, INK, "c", "m", radius=0.08, lw=1.2, margin=0.03)
rows5 = [["Base case", "1 unit", "3 units", "6 units", "12 units"],
         ["Value a year (IDR M)"] + [f"{RN[N]['steady']:,.0f}" for N in RN],
         ["One-off cost (IDR M)"] + [f"{sum(RN[N]['capex']):,.0f}" for N in RN],
         ["NPV before tax (IDR M)"] + [f"{RN[N]['npv']:,.0f}" for N in RN],
         ["IRR before tax"] + [f"{RN[N]['irr']*100:.0f}%" for N in RN],
         ["Payback (months)"] + [f"{RN[N]['pb']:.0f}" for N in RN],
         ["NPV positive in"] + [f"{_mc('Probability that NPV is positive', N)*100:.0f}%" for N in RN]]
table(s, 0.4, 2.12, 4.2, [1.5, 0.66, 0.66, 0.68, 0.7], rows5, 8.6, rowh=0.285, header_fill=NAVY, bold_first=True)
srcs5 = [("CASE DATA", GREEN, f"{FIN.CM['bd_year']:.1f} breakdowns a year, {FIN.CM['mttr']:.1f} h MTTR and {FIN.CM['rep_rate']*100:.0f}% repeat jobs, recomputed from the 211 work orders."),
         ("MARKET", TEAL, f"Indonesia: {TAM_U:.0f} process units and IDR {TAM_V/1000:.0f} B a year of customer value; a vendor pool of only USD {TAM_R/17900:.1f} M, so the case is internal. Margin, FX, tax and rates are cited."),
         ("ESTIMATE", BLUE, f"Cost rebuilt line by line: IDR {PILOT_ONE:,.0f} M one-off and IDR {PILOT_RUN:,.0f} M a year for the pilot (slide 6)."),
         ("ASSUMED", GREY, "20 min saved a day (60% productive); 10% shorter repairs (70% credited); 85% adoption; IDR 33 M per output-loss hour.")]
hs = [0.42, 0.56, 0.42, 0.52]; yy = 4.2
for (tg, c_, d_), h_ in zip(srcs5, hs):
    box(s, 0.4, yy, 4.2, h_, WHITE, MID, None, radius=0.05, lw=0.8)
    pill(s, 0.46, yy + (h_ - 0.22) / 2, 0.82, tg, TINT.get(c_, LIGHT), c_, 0.22, 7.5)
    text(s, 1.34, yy, 3.24, h_, d_, 8, False, INK, anchor="m", line=0.92)
    yy += h_ + 0.03
# middle: value by lever and cumulative cash flow
ptitle(s, 4.8, 1.26, 4.1, "Annual value by lever at full rollout (IDR M)", NAVY)
_cols = [BLUE, TEAL, ORANGE, PURPLE]; _names = ["Search time", "Repair time", "Repeat failures", "Faster start"]
_vals = {N: [RN[N]["ben"][k][5] / RN[N]["esc"][5] for k in range(4)] for N in RN}
_max = max(sum(v) for v in _vals.values()); _base = 3.5; _hmax = 1.62
box(s, 4.8, 1.56, 4.1, 2.3, WHITE, MID, None, radius=0.03, lw=0.8)
for i, N in enumerate(RN):
    x = 5.0 + i * 0.97; y = _base
    for k in range(4):
        h_ = _vals[N][k] / _max * _hmax
        y -= h_
        box(s, x, y, 0.62, h_, _cols[k], None, [[(f"{_vals[N][k]:,.0f}", {"bold": True, "size": 8, "color": WHITE})]] if h_ >= 0.17 else None, 8, True, WHITE, "c", "m", radius=0.0, margin=0.0)
    text(s, x - 0.2, y - 0.22, 1.02, 0.2, f"IDR {sum(_vals[N])/1000:.1f} B", 8.5, True, NAVY, "c", "m")
    text(s, x - 0.2, _base + 0.02, 1.02, 0.2, f"{N} unit" + ("s" if N > 1 else ""), 8.5, False, INK, "c", "m")
for k in range(4):
    lx = 4.9 + (k % 2) * 2.0; ly = 3.62 + (k // 2) * 0.0
for k in range(4):
    box(s, 4.9 + k * 1.0, 3.67, 0.1, 0.1, _cols[k], None, None, radius=0.0)
    text(s, 5.02 + k * 1.0, 3.6, 0.92, 0.24, _names[k], 7.5, False, INK, "l", "m", margin=0.0)
ptitle(s, 4.8, 3.94, 4.1, "Cumulative net cash flow, years 0 to 5 (IDR M)", NAVY)
def _cum(o):
    c = 0; out = []
    for x in o["cf"]: c += x; out.append(c)
    return out
_px0, _pw, _pt, _ph = 5.45, 2.75, 4.34, 1.5            # plot area
_ymin, _ymax = -4000, 26000; _k = _ph / (_ymax - _ymin)
_Y = lambda v: _pt + (_ymax - v) * _k
box(s, 4.8, 4.22, 4.1, 2.0, WHITE, MID, None, radius=0.03, lw=0.8)
for gv in (0, 10000, 20000):
    box(s, _px0, _Y(gv), _pw, 0.008, "C9D4E2" if gv else NAVY, None, None, radius=0.0)
    text(s, 4.84, _Y(gv) - 0.1, 0.58, 0.2, f"{gv:,.0f}", 8, False, GREY, "r", "m", margin=0.0)
for t in range(6):
    text(s, _px0 + t * _pw / 5 - 0.2, _pt + _ph + 0.01, 0.4, 0.18, f"Y{t}", 8, False, GREY, "c", "m", margin=0.0)
for N, col, w_ in ((1, GREY, 1.75), (3, BLUE, 2.5), (6, TEAL, 2.0), (12, ORANGE, 2.0)):
    cu = _cum(RN[N])
    for t in range(5): arrow(s, _px0 + t * _pw / 5, _Y(cu[t]), _px0 + (t + 1) * _pw / 5, _Y(cu[t + 1]), col, w_, head=False)
    text(s, _px0 + _pw + 0.02, _Y(cu[5]) - 0.1, 0.62, 0.2, f"{cu[5]:,.0f}", 8, True, col, "l", "m", margin=0.0)
for k_, (nm_, col) in enumerate([("1 unit", GREY), ("3 units", BLUE), ("6 units", TEAL), ("12 units", ORANGE)]):
    box(s, 5.0 + k_ * 0.95, 6.02, 0.22, 0.04, col, None, None, radius=0.0); text(s, 5.26 + k_ * 0.95, 5.93, 0.7, 0.22, nm_, 8, False, INK, "l", "m", margin=0.0)
# right: KPIs and what moves the NPV
ptitle(s, 9.1, 1.26, 3.85, "KPIs and success metrics", NAVY)
rows5b = [["KPI", "Baseline", "Target", "Measured by"],
          ["Repair time (MTTR)", f"{FIN.CM['mttr']:.1f} h", f"{FIN.CM['mttr']*0.9:.1f} h", "Work orders"],
          ["Repeat jobs, 120 days", f"{FIN.CM['rep_rate']*100:.0f}%", f"{FIN.CM['rep_rate']*0.7*100:.0f}%", "Failure memory"],
          ["Search time a day", "40 min", "20 min", "Usage log"],
          ["Answers with source", "n/a", "90%+", "Answer audit"],
          ["Time to cited answer", "15 min", "3 min", "Timed tasks"],
          ["Answers rated useful", "n/a", "80%+", "App feedback"]]
table(s, 9.1, 1.58, 3.85, [1.35, 0.72, 0.68, 1.1], rows5b, 8, rowh=0.3, header_fill=NAVY, bold_first=True)
ptitle(s, 9.1, 4.1, 3.85, "What moves the 3-unit NPV (IDR M)", NAVY)
top = SENSR[:5]; base3 = FR["npv"]
SHORT = {"Share of breakdown hours that reduce plant output": "Output-loss share", "Contribution margin lost per tonne": "Margin per tonne", "Salary level (all roles), 30 percent lower or higher": "Salary level",
         "Exchange rate, 10 percent stronger or weaker rupiah": "Exchange rate", "Reduction in mean time to repair": "Repair time cut", "Steady-state share of users who use the platform regularly": "Adoption"}
_mx = max(max(abs(r[4] - base3), abs(r[5] - base3)) for r in top); _x0 = 9.1 + 1.2 + 1.3; _sc = 1.12 / _mx
box(s, 9.1, 4.38, 3.85, 1.84, WHITE, MID, None, radius=0.03, lw=0.8)
for i, r_ in enumerate(top):
    y = 4.46 + i * 0.28
    text(s, 9.14, y, 1.2, 0.24, SHORT.get(r_[0], r_[0][:20]), 8, False, INK, "l", "m", margin=0.02)
    d1 = (r_[4] - base3) * _sc; d2 = (r_[5] - base3) * _sc
    box(s, _x0 + min(d1, 0), y + 0.03, abs(d1), 0.18, ORANGE, None, None, radius=0.0)
    box(s, _x0, y + 0.03, abs(d2), 0.18, BLUE, None, None, radius=0.0)
    text(s, _x0 + d1 - 0.5, y, 0.48, 0.24, f"{r_[4]-base3:,.0f}", 7.5, False, INK, "r", "m", margin=0.0)
    text(s, _x0 + d2 + 0.02, y, 0.5, 0.24, f"+{r_[5]-base3:,.0f}", 7.5, False, INK, "l", "m", margin=0.0)
box(s, _x0 - 0.005, 4.44, 0.01, 1.42, NAVY, None, None, radius=0.0)
box(s, 9.9, 5.98, 0.1, 0.1, ORANGE, None, None, radius=0.0); text(s, 10.03, 5.92, 1.3, 0.22, "Pessimistic value", 7.5, False, INK, "l", "m", margin=0.0)
box(s, 11.5, 5.98, 0.1, 0.1, BLUE, None, None, radius=0.0); text(s, 11.63, 5.92, 1.3, 0.22, "Optimistic value", 7.5, False, INK, "l", "m", margin=0.0)
ribbon(s, f"A three-unit programme repays its cost in about {FR['pb']:.0f} months and is positive in {POS3*100:.0f}% of 5,000 simulated outcomes, but the pilot unit alone does not repay (NPV IDR {F1['npv']/1000:.1f} B), so the pilot is the first gate of a staged rollout. Every input is in the Excel model, and the pilot replaces them with measured Company data.")
notes(s, f"Business impact, rebuilt as a financial model (Business_Impact_Financial_Model.xlsx, with the Business Impact and Financial Modelling Report). Base case, IDR million. One unit at 85% adoption: search time {LSS[0]:,.0f}, repair time {LSS[1]:,.0f}, repeat failures {LSS[2]:,.0f}, faster start for new staff {LSS[3]:,.0f}, total {sum(LSS):,.0f} a year. The value of a breakdown hour is IDR {FR['lv']['dv']:.1f} M (336 kt a year, USD 220 per tonne, 20% of breakdown hours reduce output). Costs are rebuilt line by line: one-off IDR {CSH['shared']:,.0f} M shared plus IDR {CSH['unit']:,.0f} M per unit, running IDR {PILOT_RUN:,.0f} M a year plus IDR {CSH['run_inc']:,.0f} M per extra unit. Three units: value IDR {FR['steady']:,.0f} M a year, NPV before tax IDR {FR['npv']:,.0f} M, after tax IDR {FR['npv_at']:,.0f} M, IRR {FR['irr']*100:.0f}%, payback {FR['pb']:.0f} months, discount rate {FR['r']*100:.1f}%. Monte Carlo (5,000 trials): 5th percentile IDR {_mc('5th percentile', 3):,.0f} M, 95th percentile IDR {_mc('95th percentile', 3):,.0f} M, positive in {POS3*100:.0f}% of trials. The pilot unit alone has an NPV of IDR {F1['npv']:,.0f} M, so the case rests on a staged rollout with gates. Market: {TAM_U:.0f} process units in Indonesia and a customer value pool of IDR {TAM_V/1000:.0f} B a year; the external revenue pool is small, so the investment case is internal value.")
