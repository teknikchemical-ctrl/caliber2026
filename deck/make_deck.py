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
PARTS = [p for p in ["s_main1.py", "s_main2.py", "s_a1.py", "s_a2.py", "s_a3.py"] if os.path.exists(os.path.join(HERE, "parts", p))]
for part in PARTS:
    p = os.path.join(HERE, "parts", part)
    exec(compile(open(p).read(), p, "exec"), globals())
# AI layer slide (A3) moves into the main sequence as slide 4; ten feature slides stay in the appendix
import re as _re
KEEP_A = [2, 4, 5, 6, 7, 8, 9, 13, 15, 16]
lst = prs.slides._sldIdLst; ids = list(lst)
ai = ids[7 + 3 - 1]
for k, sid in enumerate(ids):
    if k < 7: continue
    if (k - 7 + 1) not in KEEP_A and sid is not ai:
        prs.part.drop_rel(sid.rId); lst.remove(sid)
lst.remove(ai); lst.insert(3, ai)
for k, sl in enumerate(prs.slides):
    new_no = k - 8 + 1
    for shp in sl.shapes:
        if not shp.has_text_frame: continue
        tf = shp.text_frame
        if tf.paragraphs and tf.paragraphs[0].runs:
            r0 = tf.paragraphs[0].runs[0]
            if k == 3 and _re.match(r"A\d+  ", r0.text): r0.text = _re.sub(r"^A\d+  ", "", r0.text)
            elif k >= 8 and _re.match(r"A\d+  ", r0.text): r0.text = _re.sub(r"^A\d+  ", f"A{new_no}  ", r0.text)
            elif k == 3 and r0.text == "Appendix": r0.text = "Proposed Solution"
        if k >= 8 or k == 3:
            if shp.left is not None and abs(shp.left - Inches(12.5)) < 5000 and tf.text.strip().isdigit(): tf.paragraphs[0].runs[0].text = str(k + 1)
    if k == 3:
        for shp in sl.shapes:
            if shp.has_text_frame and shp.text_frame.text.strip() == "Solution" and shp.top > Inches(7.0):
                shp.top = Inches(7.07); shp.height = Inches(0.38)
                shp.fill.solid(); shp.fill.fore_color.rgb = rgb(BLUE); shp.line.fill.background()
                for p_ in shp.text_frame.paragraphs:
                    for r_ in p_.runs: r_.font.size = Pt(11); r_.font.color.rgb = rgb(WHITE)
prs.save(OUT)
print("saved", OUT, os.path.getsize(OUT) // 1024, "KB", len(prs.slides), "slides")
