"""Builds the CALIBER 2026 pitch deck: 7 required slides plus appendix. Run: python3 deck/make_deck.py"""
import os, sys, re
sys.path.insert(0, os.path.dirname(__file__))
from lib import *
from lib2 import *
from pptx.chart.data import CategoryChartData
from pptx.enum.chart import XL_CHART_TYPE, XL_LEGEND_POSITION, XL_LABEL_POSITION

HERE = os.path.dirname(__file__)
IMG = lambda n: os.path.join(HERE, "jpg", n + ".jpg")
OUT = os.path.join(HERE, "CALIBER2026_Asset_Knowledge_Platform_Deck.pptx")

# ------------------------------------------------------------------ numbers (data from the prototype; assumptions flagged)
D = dict(docs=98, chunks=1109, issues=48, wo=211, bd=31, dt=434, cost=537.8, corr=440.4, corr_share=82, years=1.52, mttr=14.0,
         bd_yr=20.4, corr_yr=290.2, found=17, bad=63, rep=8, cm_follow=55, opl=56, steps=280, ts=168, inst=84, il=8, tools=20, evals=128, faces=20916, bt=64)
A = dict(users=45, search_min=40, days=230, rate=175000, down_h=30.0, onboard=60.0, one_off=1400.0, run=370.0)
def case(save, mttr_cut, onboard):
    h = A["users"] * save / 60 * A["days"]
    a = h * A["rate"] / 1e6
    b = D["bd_yr"] * D["mttr"] * mttr_cut * A["down_h"]
    return a, b, onboard, a + b + onboard
LOW, BASE, HIGH = case(10, .05, 30), case(20, .10, 60), case(24, .15, 90)
def payback(total):
    y1 = .6 * total - A["run"]; y2 = total - A["run"]; cum0 = -A["one_off"]
    if cum0 + y1 >= 0: return A["one_off"] / (.6 * total - A["run"]) * 12 if .6 * total - A["run"] > 0 else None
    c1 = cum0 + y1
    if c1 + y2 >= 0: return 12 + (-c1) / y2 * 12
    c2 = c1 + y2
    if c2 + y2 >= 0: return 24 + (-c2) / y2 * 12
    return None
def net3(total): return -A["one_off"] + (.6 * total - A["run"]) + 2 * (total - A["run"])
PB, NB, PH, PL = payback(BASE[3]), net3(BASE[3]), payback(HIGH[3]), payback(LOW[3])
COST3 = A["one_off"] + 3 * A["run"]
ROI = NB / COST3 * 100
print("base", [round(x) for x in BASE], "payback", PB, "net3", round(NB), "roi", round(ROI), "low pb", PL, "net low", round(net3(LOW[3])), "high pb", PH)


prs = new_prs()
for part in ["s_main1.py", "s_main2.py", "s_app1.py", "s_app2.py"]:
    p = os.path.join(HERE, "parts", part)
    exec(compile(open(p).read(), p, "exec"), globals())
prs.save(OUT)
print("saved", OUT, os.path.getsize(OUT) // 1024, "KB", len(prs.slides), "slides")
