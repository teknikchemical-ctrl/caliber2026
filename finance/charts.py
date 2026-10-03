"""Report charts (matplotlib) from the Python replica of the model. Writes finance/img/*.png"""
import os, json, math, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import matplotlib; matplotlib.use("Agg")
import matplotlib.pyplot as plt
from matplotlib import rcParams
import spec
from spec import run
HERE = os.path.dirname(os.path.abspath(__file__)); IMG = os.path.join(HERE, "img"); os.makedirs(IMG, exist_ok=True)
NAVY, BLUE, TEAL, ORANGE, GREEN, PURPLE, GREY, RED = "#0B2A4A", "#1560BD", "#0E8A7D", "#E8793A", "#2E9E5B", "#6B4FBB", "#6B7A8C", "#D64545"
rcParams.update({"font.family": "Liberation Sans", "font.size": 9, "axes.edgecolor": "#B9C8DA", "axes.linewidth": 0.8, "axes.spines.top": False, "axes.spines.right": False,
                 "axes.titleweight": "bold", "axes.titlesize": 10.5, "axes.titlecolor": NAVY, "axes.labelcolor": "#3A4A5C", "xtick.color": "#3A4A5C", "ytick.color": "#3A4A5C",
                 "axes.grid": True, "grid.color": "#E3E9F0", "grid.linewidth": 0.7, "axes.axisbelow": True, "figure.dpi": 100})
A = json.load(open(os.path.join(HERE, "analysis.json")))
def save(fig, n):
    fig.savefig(os.path.join(IMG, n + ".png"), dpi=220, bbox_inches="tight", facecolor="white"); plt.close(fig)
def fm(x, d=0): return f"{x:,.{d}f}"
LEV = ["Search and checking time", "Repair time", "Repeat failures", "Faster start for new staff"]; COL = [BLUE, TEAL, ORANGE, PURPLE]

# 1 value by lever by programme size
fig, ax = plt.subplots(figsize=(6.6, 3.2))
Ns = [1, 3, 6, 12]; bottoms = [0] * 4
for i in range(4):
    vals = []
    for N in Ns:
        o = run(2, N); vals.append(o["ben"][i][5] / o["esc"][5] / 1000)
    ax.bar([str(n) for n in Ns], vals, bottom=bottoms, color=COL[i], width=0.58, label=LEV[i], edgecolor="white", linewidth=1.2)
    bottoms = [b + v for b, v in zip(bottoms, vals)]
for x, t in zip(range(4), bottoms): ax.text(x, t + 0.3, f"IDR {t:,.1f} B", ha="center", fontsize=9, fontweight="bold", color=NAVY)
ax.set_ylabel("IDR billion a year"); ax.set_xlabel("Units in the programme"); ax.set_title("Annual value at full rollout, by lever (year 0 prices)", loc="left")
ax.legend(frameon=False, fontsize=8, loc="upper left"); ax.grid(axis="x", visible=False); ax.set_ylim(0, bottoms[-1] * 1.12)
save(fig, "c_value_levers")

# 2 cumulative cash flow
fig, ax = plt.subplots(figsize=(6.6, 3.2))
cols = {1: GREY, 3: BLUE, 6: TEAL, 12: ORANGE}
for N in Ns:
    o = run(2, N); cum = []; c = 0
    for x in o["cf"]: c += x; cum.append(c / 1000)
    ax.plot(range(6), cum, color=cols[N], lw=2.2, marker="o", ms=4, label=f"{N} unit" + ("s" if N > 1 else ""))
    ax.text(5.08, cum[-1], f"{N} unit" + ("s" if N > 1 else "") + f": {cum[-1]:,.1f}", va="center", fontsize=8.5, color=cols[N], fontweight="bold")
ax.axhline(0, color=NAVY, lw=1); ax.set_xlim(0, 6.6); ax.set_xticks(range(6)); ax.set_xticklabels([f"Year {t}" for t in range(6)])
ax.set_ylabel("IDR billion"); ax.set_title("Cumulative net cash flow before tax, Base scenario", loc="left"); ax.legend(frameon=False, fontsize=8, loc="upper left")
save(fig, "c_cumulative")

# 3 NPV by size with Monte Carlo band and scenarios
MC = A["MC"]
fig, ax = plt.subplots(figsize=(6.6, 3.2))
for k, N in enumerate(Ns):
    base = run(2, N)["npv"] / 1000; p10 = MC[f"10th percentile|{N}"] / 1000; p90 = MC[f"90th percentile|{N}"] / 1000
    ax.bar(k, base, color=BLUE, width=0.5); ax.plot([k, k], [p10, p90], color=NAVY, lw=2.2); ax.plot([k - .08, k + .08], [p10, p10], color=NAVY, lw=2.2); ax.plot([k - .08, k + .08], [p90, p90], color=NAVY, lw=2.2)
    ax.text(k + 0.3, base, f"{base:,.1f}", va="center", fontsize=9, fontweight="bold", color=BLUE)
    ax.text(k, p90 + 0.5, f"P(NPV>0) {MC[f'Probability that NPV is positive|{N}']*100:.0f}%", ha="center", fontsize=8, color=GREY)
ax.axhline(0, color=NAVY, lw=1); ax.set_xticks(range(4)); ax.set_xticklabels([f"{n} unit" + ("s" if n > 1 else "") for n in Ns]); ax.set_ylabel("IDR billion")
ax.set_title("NPV before tax: base value and Monte Carlo P10 to P90 range", loc="left"); ax.grid(axis="x", visible=False)
save(fig, "c_npv_size")

# 4 tornado
rows = A["SENS"]["rows"][:10]; base = run(2, 3)["npv"]
fig, ax = plt.subplots(figsize=(6.6, 3.7))
for i, (lab, unit, lo, hi, a, c, sw) in enumerate(rows[::-1]):
    ax.barh(i, (a - base) / 1000, color=ORANGE, height=0.6); ax.barh(i, (c - base) / 1000, color=BLUE, height=0.6)
ax.set_yticks(range(len(rows))); SHORT = {"Share of breakdown hours that reduce plant output": "Share of breakdown hours with output loss", "Steady-state share of users who use the platform regularly": "Steady-state adoption", "Salary level (all roles), 30 percent lower or higher": "Salary level, 30 percent lower or higher", "Exchange rate, 10 percent stronger or weaker rupiah": "Exchange rate, 10 percent either way"}
ax.set_yticklabels([SHORT.get(r[0], r[0]) for r in rows[::-1]], fontsize=8)
ax.axvline(0, color=NAVY, lw=1); ax.set_xlabel("Change in NPV versus base (IDR billion)"); ax.set_title("What moves the 3-unit NPV most (one driver at a time)", loc="left")
from matplotlib.patches import Patch
ax.legend(handles=[Patch(color=ORANGE, label="Pessimistic value"), Patch(color=BLUE, label="Optimistic value")], frameon=False, fontsize=8, loc="lower right"); ax.grid(axis="y", visible=False)
save(fig, "c_tornado")

# 5 Monte Carlo histogram (3 units)
h = A["hist"]; lo, w, cnt = h["lo"], h["w"], h["counts"]; tot = sum(cnt)
fig, ax = plt.subplots(figsize=(6.6, 3.1))
xs = [(lo + (k + .5) * w) / 1000 for k in range(len(cnt))]
ax.bar(xs, [c / tot * 100 for c in cnt], width=w / 1000 * 0.92, color=[(ORANGE if x < 0 else BLUE) for x in xs])
for key, lab, ypos in (("5th percentile|3", "P5", 0.92), ("Median|3", "Median", 0.92), ("95th percentile|3", "P95", 0.92)):
    v = MC[key] / 1000; ax.axvline(v, color=NAVY, lw=1.2, ls="--"); ax.text(v, ax.get_ylim()[1] * ypos, f" {lab} {v:,.1f}", fontsize=8, color=NAVY, fontweight="bold", va="top")
ax.axvline(0, color=RED, lw=1.4); ax.set_xlabel("NPV before tax, IDR billion"); ax.set_ylabel("Share of 5,000 trials (%)")
ax.set_title(f"Monte Carlo: NPV of the 3-unit programme (probability of loss {100 - MC['Probability that NPV is positive|3']*100:.0f}%)", loc="left"); ax.grid(axis="x", visible=False)
save(fig, "c_montecarlo")

# 6 market funnel
import openpyxl
wb = openpyxl.load_workbook(os.path.join(HERE, "Business_Impact_Financial_Model.xlsx"), data_only=True); ws = wb["Market"]
fr = None
for r in range(1, ws.max_row + 1):
    if ws.cell(r, 1).value == "Total addressable" and isinstance(ws.cell(r, 2).value, (int, float)): fr = r
fun = [(ws.cell(fr + i, 1).value, ws.cell(fr + i, 2).value, ws.cell(fr + i, 3).value, ws.cell(fr + i, 4).value) for i in range(3)]
fig, ax = plt.subplots(figsize=(6.6, 2.5))
mx = fun[0][2] / 1000
for i, (lab, u, v, rv) in enumerate(fun):
    ax.barh(2 - i, v / 1000, color=[NAVY, BLUE, TEAL][i], height=0.6)
    ax.text(v / 1000 + mx * 0.015, 2 - i, f"IDR {v/1000:,.0f} B  ({u:,.0f} units)", va="center", fontsize=8.6, color=NAVY, fontweight="bold")
ax.set_yticks([2, 1, 0]); ax.set_yticklabels([f[0] for f in fun]); ax.set_xlim(0, mx * 1.45); ax.set_xlabel("Annual value pool for customers, IDR billion"); ax.grid(axis="y", visible=False)
ax.set_title("Opportunity funnel: value created for plant owners, Indonesia", loc="left")
save(fig, "c_funnel")
json.dump([(a, b, c, d) for a, b, c, d in fun], open(os.path.join(HERE, "funnel.json"), "w"))

# 7 cost structure for 3 units over 5 years
o = run(2, 3)
fig, ax = plt.subplots(figsize=(6.6, 3.0))
yrs = list(range(6)); sh = o["cs"]["shared"]
shared = [sh if t == 0 else 0 for t in yrs]; onb = [o["capex"][t] - shared[t] for t in yrs]; runc = o["run"]
b1 = [s / 1000 for s in shared]; b2 = [x / 1000 for x in onb]; b3 = [x / 1000 for x in runc]
ax.bar(yrs, b1, color=NAVY, width=0.55, label="Shared one-off", edgecolor="white", linewidth=1.2)
ax.bar(yrs, b2, bottom=b1, color=BLUE, width=0.55, label="Unit onboarding (one-off)", edgecolor="white", linewidth=1.2)
ax.bar(yrs, b3, bottom=[a + b for a, b in zip(b1, b2)], color=TEAL, width=0.55, label="Running cost", edgecolor="white", linewidth=1.2)
ben = [x / 1000 for x in o["B"]]; ax.plot(yrs, ben, color=ORANGE, lw=2.4, marker="o", ms=5, label="Benefits")
ax.set_xticks(yrs); ax.set_xticklabels([f"Year {t}" for t in yrs]); ax.set_ylabel("IDR billion"); ax.set_title("Costs and benefits by year, 3 units, Base scenario", loc="left"); ax.legend(frameon=False, fontsize=8, ncol=2, loc="upper left"); ax.grid(axis="x", visible=False)
save(fig, "c_costs")

# 8 scenarios bracket 3 units
fig, ax = plt.subplots(figsize=(6.6, 2.7))
labs = ["1 unit", "3 units", "6 units", "12 units"]
for k, N in enumerate(Ns):
    vals = [run(sc, N)["npv"] / 1000 for sc in (1, 2, 3)]
    ax.plot([k, k], [vals[0], vals[2]], color=GREY, lw=6, solid_capstyle="round", alpha=0.35)
    ax.scatter([k], [vals[1]], color=BLUE, s=70, zorder=3); ax.scatter([k], [vals[0]], color=ORANGE, s=45, zorder=3); ax.scatter([k], [vals[2]], color=GREEN, s=45, zorder=3)
    ax.text(k + 0.12, vals[1], f"{vals[1]:,.1f}", fontsize=8.5, va="center", color=BLUE, fontweight="bold")
    ax.text(k + 0.12, vals[0], f"{vals[0]:,.1f}", fontsize=8, va="center", color=ORANGE); ax.text(k + 0.12, vals[2], f"{vals[2]:,.1f}", fontsize=8, va="center", color=GREEN)
ax.axhline(0, color=NAVY, lw=1); ax.set_xticks(range(4)); ax.set_xticklabels(labs); ax.set_ylabel("NPV before tax, IDR billion"); ax.set_xlim(-.4, 3.7)
ax.set_title("NPV by scenario: pessimistic (orange), base (blue), optimistic (green)", loc="left"); ax.grid(axis="x", visible=False)
save(fig, "c_scenarios")
print("charts ok")
