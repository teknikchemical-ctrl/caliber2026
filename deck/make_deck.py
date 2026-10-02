"""Builds the CALIBER 2026 pitch deck: 7 required slides plus appendix. Run: python3 deck/make_deck.py"""
import os, sys
sys.path.insert(0, os.path.dirname(__file__))
from lib import *
from pptx.chart.data import CategoryChartData
from pptx.enum.chart import XL_CHART_TYPE, XL_LEGEND_POSITION, XL_LABEL_POSITION

HERE = os.path.dirname(__file__)
IMG = lambda n: os.path.join(HERE, "jpg", n + ".jpg")
OUT = os.path.join(HERE, "CALIBER2026_Asset_Knowledge_Platform_Deck.pptx")

# ------------------------------------------------------------------ numbers (data from the prototype; assumptions flagged)
D = dict(docs=98, chunks=407, issues=48, wo=211, bd=31, dt=434, cost=537.8, corr=440.4, corr_share=82, years=1.52, mttr=14.0,
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

# ------------------------------------------------------------------ 1 cover
s = blank(prs)
box(s, 0, 0, 7.4, 7.5, NAVY, None, None, shape=MSO_SHAPE.RECTANGLE)
image(s, IMG("dashboard"), 7.4, 0, 5.933, 7.5, border=False) if False else None
from PIL import Image
im = Image.open(os.path.join(HERE, "jpg", "plant.jpg")); cw, ch = im.size
ar = 5.933 / 7.5; nw = int(ch * ar); x0 = int(cw * 0.33); crop = im.crop((x0, 0, min(cw, x0 + nw), ch)); cp = os.path.join(HERE, "jpg", "cover.jpg"); crop.save(cp, quality=85)
s.shapes.add_picture(cp, Inches(7.4), Inches(0), Inches(5.933), Inches(7.5))
text(s, 0.6, 0.7, 6.5, 0.3, "CALIBER 2026  |  BUSINESS PROPOSAL  |  PRELIMINARY STAGE", 11, True, "8FC1F0")
text(s, 0.6, 1.5, 6.6, 1.5, ["Asset Knowledge", "Platform"], 44, True, WHITE, line=1.0)
text(s, 0.6, 3.15, 6.4, 1.1, "One trusted, traceable knowledge hub for the LLDPE unit, with an AI assistant that always shows its sources.", 18, False, "DCE8F5", line=1.15)
chip(s, 0.6, 4.55, 5.8, 0.42, "Case 1: Manufacturing Knowledge Hub (AI-Powered Knowledge Integration)", "1F4A7A", WHITE, 11, True)
text(s, 0.6, 5.5, 6.4, 1.2, [[("Team: ", {"bold": True, "color": "8FC1F0"}), "[Team name]"], [("University: ", {"bold": True, "color": "8FC1F0"}), "[University]"], [("Supervisor: ", {"bold": True, "color": "8FC1F0"}), "[Supervisor name]"]], 14, False, WHITE, space=5)
text(s, 0.6, 6.9, 6.5, 0.3, "Prototype: working web application with the case data loaded. Demo video: 3 minutes.", 10, False, "9FB6CF")
notes(s, "Cover. Name the team, the university and the chosen use case (Case 1). One sentence: we built a working knowledge hub for the LLDPE unit that answers engineers' questions with sources, versions and a confidence level.")

# ------------------------------------------------------------------ 2 background and problem
s = blank(prs)
header(s, 2, "Scattered plant knowledge turns routine work into execution risk", "Background and problem statement")
# left: what engineers face
text(s, 0.5, 1.32, 4.0, 0.3, "What engineers face today", 13, True, BLUE)
items = [("Knowledge is split across systems", "SOPs, datasheets, P&IDs, EDMS, AIMS, maintenance logs and live data each sit in a different place."),
         ("Experience is not written down", "The reason behind a trip or a workaround stays in a senior colleague's head until they retire or rotate."),
         ("Documents disagree", "Outdated or conflicting drawings and sheets make a correct-looking answer wrong."),
         ("Operating data is disconnected", "A work order, a trip and a drawing about the same tag are never read together.")]
y = 1.68
for t, d in items:
    box(s, 0.5, y, 4.05, 1.1, PALE, MID, None, radius=0.08)
    box(s, 0.5, y, 0.07, 1.1, BLUE, None, None, shape=MSO_SHAPE.RECTANGLE)
    text(s, 0.68, y + 0.06, 3.8, 0.3, t, 12, True, NAVY)
    text(s, 0.68, y + 0.38, 3.8, 0.72, d, 10.5, False, INK)
    y += 1.19
# middle: baseline data
text(s, 4.85, 1.32, 4.4, 0.3, "What the case data shows (8 equipment sets)", 13, True, BLUE)
cards = [(str(D["docs"]), "source documents in 8 formats", BLUE), (str(D["issues"]), "conflicts and gaps found in the drawings", RED), (str(D["wo"]), f"work orders in {D['years']} years", BLUE),
         (str(D["bd"]), f"breakdowns, {D['dt']} h of downtime", ORANGE), (f"IDR {D['cost']:.0f} M", f"maintenance cost, {D['corr_share']}% corrective", ORANGE), (f"{D['found']*100//(D['found']+D['bad'])}%", "of faults found before they became a corrective job", RED)]
for i, (n, l, c) in enumerate(cards):
    cx = 4.85 + (i % 2) * 2.25; cy = 1.7 + (i // 2) * 1.22
    box(s, cx, cy, 2.15, 1.12, WHITE, MID, None, radius=0.08)
    text(s, cx + 0.08, cy + 0.08, 2.0, 0.5, n, 22, True, c)
    text(s, cx + 0.08, cy + 0.58, 2.0, 0.5, l, 10, False, GRAY)
box(s, 4.85, 5.38, 4.4, 0.98, "FFF4E5", "F0C27B", None, radius=0.08)
text(s, 4.95, 5.42, 4.2, 0.92, [[("A real example from the drawings: ", {"bold": True, "color": ORANGE}), "valve FV-2302 is labelled both \"trips OPEN\" and \"trips CLOSED\", and one sheet is titled KA-4501 while its body says KC-4501. An engineer who trusts the wrong one acts on the wrong valve position."]], 10, False, INK)
# right: who and consequences
text(s, 9.55, 1.32, 3.3, 0.3, "Who is affected", 13, True, BLUE)
who = ["Operators and panel operators", "Maintenance technicians", "Reliability and process engineers", "HSE officers", "Supervisors and managers"]
y = 1.7
for w_ in who:
    chip(s, 9.55, y, 3.28, 0.34, w_, SKY, NAVY, 10.5, True); y += 0.41
text(s, 9.55, 3.9, 3.3, 0.3, "What it costs", 13, True, BLUE)
cons = ["Longer troubleshooting and repeated rework", "Higher safety risk from improper execution", "Delayed start-up after a trip", "Different answers from different functions"]
y = 4.25
for c_ in cons:
    text(s, 9.55, y, 3.28, 0.5, [[("■ ", {"color": RED, "size": 8}), c_]], 11, False, INK); y += 0.52
box(s, 0.5, 6.62, 12.33, 0.38, NAVY, None, ["Problem: engineers cannot quickly find one verified, current and complete answer, so they search, ask around or guess."], 12, True, WHITE, "c")
notes(s, "Problem. The case describes scattered sources, missing tacit knowledge and disconnected data. We loaded the case data and measured it: 98 documents, 48 conflicts between them, 211 work orders, 31 breakdowns, 434 hours of downtime and IDR 538 million of maintenance cost. The example on the slide is real: FV-2302 is labelled both trips open and trips closed in the same drawing set. Only about one fault in five is found before it becomes a corrective job.")

# ------------------------------------------------------------------ 3 solution
s = blank(prs)
header(s, 3, "One knowledge core, one assistant, every source traceable", "Solution: objective, workflow and key technologies")
X0, Y0 = 0.5, 1.32
colw = [1.62, 1.72, 1.78, 1.5, 1.72]; gap = 0.18
xs = [X0]
for w_ in colw[:-1]: xs.append(xs[-1] + w_ + gap)
heads = ["1  Sources", "2  Industrial Data Ops", "3  Knowledge core", "4  AI assistant", "5  People use it in"]
for x, w_, h_ in zip(xs, colw, heads):
    box(s, x, Y0, w_, 0.3, NAVY, None, [h_], 10.5, True, WHITE, "c", radius=0.05)
src = ["SOPs, OPLs, tacit notes", "Datasheets", "P&ID, GA drawing, plot plan", "Interlock logic (C&E)", "Maintenance logs, RCA", "Incident reports", "Live data (DCS, historian)"]
y = Y0 + 0.38
for t in src:
    box(s, xs[0], y, colw[0], 0.34, WHITE, MID, [t], 8.5, False, INK, "c", radius=0.05); y += 0.375
for i, t in enumerate(["EDMS", "AIMS", "Twin"]):
    chip(s, xs[0] + i * 0.55, y + 0.02, 0.5, 0.26, t, "FFF4E5", ORANGE, 8.5, True, "F0C27B")
ops = [("Ingest", "AI reads each file and pulls out structure"), ("Structure", "Equipment tag is the common key"), ("Check", "Conflicts, secrets, quotes"), ("Approve", "Owner, version, status, access")]
y = Y0 + 0.38
for t, d in ops:
    box(s, xs[1], y, colw[1], 0.66, SKY, None, [[(t, {"bold": True, "color": NAVY, "size": 10})], [(d, {"size": 8.5, "color": INK})]], 9, False, INK, "c", radius=0.06); y += 0.72
core = [("Search index", "keywords and meaning"), ("Facts and links", "tags, interlocks, parts"), ("Failure memory", "RCA, lessons, OPL"), ("Analytics", "KPIs, forecasts, hazards")]
y = Y0 + 0.38
for t, d in core:
    box(s, xs[2], y, colw[2], 0.66, "E6F4EA", None, [[(t, {"bold": True, "color": GREEN, "size": 10})], [(d, {"size": 8.5, "color": INK})]], 9, False, INK, "c", radius=0.06); y += 0.72
box(s, xs[3], Y0 + 0.38, colw[3], 2.62, BLUE, None, [[("Assistant", {"bold": True, "size": 13, "color": WHITE})], [("Understands the question, picks a tool or a search, writes only from the evidence, then checks itself.", {"size": 9, "color": "DCE8F5"})], [("", {})], [(f"{D['tools']} computed tools", {"bold": True, "size": 10, "color": WHITE})], [("Any language model can sit behind it", {"size": 9, "color": "DCE8F5"})]], 10, False, WHITE, "c", radius=0.08)
ux = ["Ask and verify", "Equipment 360 in 2D, 3D", "Interlock, OPL simulators", "Failure memory, predictive", "HSE hazard simulator", "KPIs and governance"]
y = Y0 + 0.38
for t in ux:
    box(s, xs[4], y, colw[4], 0.4, "F1ECFB", None, [t], 9, True, PURPLE, "c", radius=0.06); y += 0.47
for i in range(4):
    arrow(s, xs[i] + colw[i] + 0.01, Y0 + 1.7, xs[i + 1] - 0.01, Y0 + 1.7, BLUE, 2.0)
box(s, X0, Y0 + 3.38, 9.1, 0.34, "FDECEE", "F1B6BB", [[("Human oversight and security:  ", {"bold": True, "color": RED}), "roles, approval workflow, audit trail, read-only access to plant systems"]], 9.5, False, INK, "c", radius=0.05)
# assistant pipeline
text(s, X0, Y0 + 3.78, 6, 0.28, "How the assistant answers", 12, True, BLUE)
steps = [("Question", "plus role and equipment"), ("Route", "tool or search"), ("Retrieve", "approved, in-scope sources"), ("Compute", "KPIs, forecasts, hazards"), ("Draft", "model writes from evidence only"), ("Verify", "quotes, status, confidence"), ("Answer", "sources, feedback, audit")]
sw = 1.17; sg = 0.135; y = Y0 + 4.08
for i, (t, d) in enumerate(steps):
    x = X0 + i * (sw + sg)
    box(s, x, y, sw, 0.98, WHITE if i not in (4,) else "E8F1FB", BLUE if i == 4 else MID, [[(f"{i+1}  {t}", {"bold": True, "size": 9.5, "color": NAVY})], [(d, {"size": 8.5, "color": GRAY})]], 9, False, INK, "c", radius=0.07)
    if i < 6: arrow(s, x + sw + 0.005, y + 0.49, x + sw + sg - 0.005, y + 0.49, BLUE, 1.6)
text(s, X0, y + 1.0, 9.1, 0.45, "No evidence, no answer: it says so. If the model is offline, local retrieval still answers. Every answer shows document, revision, approval status and confidence.", 9.5, False, GRAY)
# right: three key questions
RX = 9.95; RW = 2.88
qs = [("Q1", "Industrial Data Ops foundation", "Tag-keyed data model over 7 source types. Ingest, check, approve. The 48 conflicts in the case files surface on day one."),
      ("Q2", "Trusted answers, faster", f"Hybrid search plus cited answers with version, status and confidence. {D['evals']} test questions, all passed."),
      ("Q3", "Active operational use", "Read-only links to EDMS, AIMS, historian and digital twin. Failure memory, predictive and HSE tools sit inside the daily workflow.")]
y = 1.32
for n, t, d in qs:
    box(s, RX, y, RW, 1.78, PALE, MID, None, radius=0.08)
    chip(s, RX + 0.1, y + 0.1, 0.42, 0.26, n, BLUE, WHITE, 9.5, True)
    text(s, RX + 0.58, y + 0.08, RW - 0.65, 0.5, t, 10.5, True, NAVY)
    text(s, RX + 0.1, y + 0.66, RW - 0.2, 1.1, d, 10, False, INK)
    y += 1.88
notes(s, "Solution. Read left to right. Sources feed Industrial Data Ops, which ingests, structures by equipment tag, checks and approves. The knowledge core holds the search index, facts and links, failure memory and analytics. The assistant sits on top and people use it in the screens on the right. The strip underneath shows how one answer is built: route, retrieve only approved in-scope sources, compute figures from the data, let the model draft from the evidence only, verify quotes and status, then answer with sources and log it. The three boxes on the right answer the three key questions in the case.")

# ------------------------------------------------------------------ 4 business impact
s = blank(prs)
header(s, 4, f"Base case: IDR {BASE[3]/1000:.2f} B a year, paid back in about {PB:.0f} months", "Business impact: KPIs, benefits and success metrics")
rows = [["KPI", "Baseline", "12-month target", "Measured by"],
        ["Time to a verified answer", "about 15 min (assumed)", "3 min or less", "Assistant timestamps"],
        ["Answers with source, version, status", "manual", "100%", "Audit log"],
        ["Breakdown repair time (MTTR)", f"{D['mttr']:.0f} h (data)", f"{D['mttr']*.9:.1f} h (-10%)", "AIMS work orders"],
        ["Repeat failures within 120 days", f"{D['rep']} of {D['cm_follow']} (data)", "-30%", "Failure memory"],
        ["Faults found before failure", f"{D['found']*100//(D['found']+D['bad'])}% (data)", "35%", "Work order type"],
        ["Document conflicts open", f"{D['issues']} (data)", "90% closed in 6 months", "Quality register"],
        ["Lessons captured", f"{D['opl']} OPLs", "+12 each quarter", "Knowledge Studio"]]
table(s, 0.5, 1.32, 6.6, [2.5, 1.7, 1.6, 1.5], rows, 9, rowh=0.34)
text(s, 0.5, 4.5, 6.6, 0.3, "Success gates for the 90-day pilot", 12, True, BLUE)
gates = [("90%+", "answers with an approved source"), ("3 min", "median time to an answer"), ("80%+", "users rate answers useful"), ("0", "answers without a source")]
for i, (n, l) in enumerate(gates):
    x = 0.5 + i * 1.67
    box(s, x, 4.82, 1.58, 0.88, "E6F4EA", None, [[(n, {"bold": True, "size": 18, "color": GREEN})], [(l, {"size": 8.5, "color": INK})]], 9, False, INK, "c", radius=0.08)
box(s, 0.5, 5.82, 6.6, 1.15, PALE, MID, None, radius=0.08)
text(s, 0.6, 5.86, 6.4, 1.1, [[("Evidence from the prototype.  ", {"bold": True, "color": NAVY}), f"{D['evals']} curated questions pass (sources, numbers and refusals). {D['tools']} computed tools. {D['docs']} documents, {D['chunks']} searchable passages, {D['wo']} work orders, {D['opl']} lessons with {D['steps']} procedure steps. A {D['bt']}-forecast backtest shows the combined risk score ranks only slightly better than guessing, so we report that and keep it advisory."]], 9.5, False, INK)
# chart
cd = CategoryChartData(); cd.categories = ["Search time", "Faster fault finding", "Onboarding", "Total"]
cd.add_series("Low", [round(LOW[0]), round(LOW[1]), round(LOW[2]), round(LOW[3])]); cd.add_series("Base", [round(BASE[0]), round(BASE[1]), round(BASE[2]), round(BASE[3])]); cd.add_series("High", [round(HIGH[0]), round(HIGH[1]), round(HIGH[2]), round(HIGH[3])])
text(s, 7.4, 1.3, 5.4, 0.3, "Annual value by lever, IDR million", 12, True, BLUE)
gf = s.shapes.add_chart(XL_CHART_TYPE.COLUMN_CLUSTERED, Inches(7.35), Inches(1.6), Inches(5.5), Inches(2.75), cd); ch = gf.chart
ch.has_legend = True; ch.legend.position = XL_LEGEND_POSITION.BOTTOM; ch.legend.include_in_layout = False; ch.legend.font.size = Pt(9); ch.legend.font.name = FONT
for ser, col in zip(ch.plots[0].series, ["9DB8E0", BLUE, NAVY]):
    ser.format.fill.solid(); ser.format.fill.fore_color.rgb = rgb(col)
pl = ch.plots[0]; pl.gap_width = 60; pl.has_data_labels = True; dl = pl.data_labels; dl.font.size = Pt(8); dl.font.name = FONT; dl.number_format = '#,##0'; dl.number_format_is_linked = False; dl.position = XL_LABEL_POSITION.OUTSIDE_END
ch.category_axis.tick_labels.font.size = Pt(9); ch.category_axis.tick_labels.font.name = FONT
ch.value_axis.visible = False; ch.value_axis.has_major_gridlines = False
# ROI tiles
tiles = [(f"IDR {A['one_off']/1000:.1f} B", "one-off cost"), (f"IDR {A['run']:.0f} M", "per year to run"), (f"{PB:.0f} months", "payback, base"), (f"IDR {NB/1000:.1f} B", f"3-year net, ROI {ROI:.0f}%")]
for i, (n, l) in enumerate(tiles):
    x = 7.4 + i * 1.37
    box(s, x, 4.45, 1.3, 0.92, WHITE, MID, [[(n, {"bold": True, "size": 12, "color": NAVY})], [(l, {"size": 8.5, "color": GRAY})]], 9, False, INK, "c", radius=0.08)
text(s, 7.4, 5.4, 5.45, 1.6, [[("Sensitivity.  ", {"bold": True, "color": NAVY}), f"Low case (half the time saved, half the repair gain): a net loss of IDR {abs(net3(LOW[3]))/1000:.1f} B over 3 years and no payback. High case: payback in {PH:.0f} months."],
                               [("Assumptions are on slide A8.  ", {"bold": True, "color": NAVY}), f"{A['users']} users, {A['search_min']} min a day looking for information today, IDR {A['rate']:,.0f} per hour, IDR {A['down_h']:.0f} M per downtime hour. Each extra unit costs about IDR 350 M to onboard, so the case improves with scale."],
                               [("Not counted:  ", {"bold": True, "color": NAVY}), "avoided incidents, spare-part savings and knowledge that would otherwise leave with retirees."]], 9, False, INK, space=3)
notes(s, "Business impact. The left table lists the KPIs with a baseline from the case data wherever one exists, a 12 month target and how each is measured. The chart shows three monetised levers: less time searching, faster fault finding, and shorter ramp-up for new engineers. Costs are one-off IDR 1.4 billion and IDR 370 million a year. Base case pays back in about 21 months. In the low case it does not pay back inside three years, and we say so. The prototype's own risk score ranks units only slightly better than chance, so it stays advisory.")

# ------------------------------------------------------------------ 5 feasibility and roadmap
s = blank(prs)
header(s, 5, "Feasible now: advisory, read-only, and phased behind clear gates", "Feasibility and roadmap")
tiles = [("Technical", "Ready", GREEN, ["Prototype runs end to end", "Postgres schema and API spec written", "Model is swappable by contract"]),
         ("Operational", "Ready", GREEN, ["Advisory only, no write to DCS", "Works offline with local search", "Fits OPL and work order routines"]),
         ("Legal", "Needs decision", ORANGE, ["Enterprise AI terms, no training on our data", "Data stays in region (PDP Law)", "Drawing and vendor IP respected"]),
         ("Cybersecurity", "Plan", BLUE, ["IEC 62443 zones: hub outside OT", "Roles, audit trail, secret masking", "Prompt-injection guards, rate limits"]),
         ("Data governance", "Ready", GREEN, ["Owner, version, status on every file", "48 conflicts in a register", "Approval before anything is trusted"]),
         ("Organisation", "Plan", BLUE, ["One champion per function", "Two-hour training, role based", "Monthly KPI review"])]
tw = 1.98
for i, (t, st, c, bl) in enumerate(tiles):
    x = 0.5 + i * (tw + 0.09)
    box(s, x, 1.32, tw, 2.12, WHITE, MID, None, radius=0.08)
    text(s, x + 0.08, 1.38, tw - 0.16, 0.3, t, 11.5, True, NAVY)
    chip(s, x + 0.1, 1.7, 1.05, 0.24, st, {"Ready": "E6F4EA", "Needs decision": "FFF4E5", "Plan": SKY}[st], c, 8, True)
    text(s, x + 0.08, 2.02, tw - 0.16, 1.4, [[("• ", {"color": c}), b] for b in bl], 9.5, False, INK, space=4)
# roadmap
RY = 3.62
text(s, 0.5, RY - 0.02, 4, 0.3, "Implementation roadmap", 12, True, BLUE)
qlab = ["Q4 26", "Q1 27", "Q2 27", "Q3 27", "Q4 27", "Q1 28", "Q2 28", "Q3 28", "Q4 28"]
gx0 = 2.9; gw = 9.93; qw = gw / 9
for i, q in enumerate(qlab):
    box(s, gx0 + i * qw, RY + 0.3, qw - 0.03, 0.26, NAVY if i % 2 == 0 else "27517F", None, [q], 8.5, True, WHITE, "c", radius=0.04)
ph = [("Design and pilot setup", 0, 1, GRAY, "Finals 4-5 Nov 2026; data access; pilot plan"),
      ("Pilot, LLDPE unit", 1, 1, BLUE, "45 users, case data loaded, success gates"),
      ("Connect", 2, 2, TEAL, "EDMS and AIMS adapters, SSO, security review, live tags"),
      ("Extend", 4, 3, GREEN, "Predictive and HSE on live data, digital twin link, units 2 and 3"),
      ("Scale", 7, 2, PURPLE, "Plant-wide roll-out, continuous improvement")]
y = RY + 0.64
for i, (t, st, ln, c, d) in enumerate(ph):
    text(s, 0.5, y + 0.02, 2.35, 0.3, t, 10, True, NAVY)
    box(s, gx0 + st * qw, y, ln * qw - 0.03, 0.3, c, None, None, radius=0.05)
    if (st + ln) * qw + 4.3 < gw: text(s, gx0 + (st + ln) * qw + 0.06, y + 0.03, 4.3, 0.3, d, 9, False, GRAY)
    else: text(s, gx0 + st * qw - 4.36, y + 0.03, 4.3, 0.3, d, 9, False, GRAY, "r")
    y += 0.4
for g, q, lab in [(1, 2, "G1 pilot gates met"), (1, 4, "G2 security and integration sign-off"), (1, 7, "G3 value review")]:
    pass
gates = [(2 * qw - 0.02, "G1", "Pilot gates met"), (4 * qw - 0.02, "G2", "Security and integration signed off"), (7 * qw - 0.02, "G3", "Value review before scale")]
for gx, g, lab in gates:
    d = box(s, gx0 + gx - 0.1, RY + 2.7, 0.22, 0.22, ORANGE, None, None, shape=MSO_SHAPE.DIAMOND)
    text(s, gx0 + gx + 0.15, RY + 2.66, 2.6, 0.3, [[(g + "  ", {"bold": True, "color": ORANGE}), lab]], 8.5, False, INK)
text(s, 0.5, RY + 2.66, 2.3, 0.3, "Decision gates", 10, True, NAVY)
box(s, 0.5, 6.62, 12.33, 0.4, SKY, None, [[("Main risks:  ", {"bold": True, "color": NAVY}), "wrong answer (sources and verification), poor data (conflict register, owners), low adoption (champions, daily-use tools), model cost or outage (swappable model, offline fallback)."]], 10, False, INK, "l", radius=0.06, margin=0.12)
notes(s, "Feasibility. The six tiles are the readiness areas the booklet asks for: technical, operational, legal, cybersecurity, data governance and organisation. Legal needs a decision from the Company about the enterprise AI terms. The roadmap runs from the finals in November 2026 to plant-wide roll-out at the end of 2028, with three decision gates. The system is advisory and read-only toward plant systems, which keeps the operational and cyber risk low.")

# ------------------------------------------------------------------ 6 conclusion
s = blank(prs)
header(s, 6, "Engineers get one verified answer in minutes, with the proof attached", "Conclusion")
cols = [("What we propose", BLUE, ["A tag-keyed knowledge core over SOPs, datasheets, P&IDs, interlocks, OPLs and maintenance history.", "An assistant that answers only from approved sources and shows revision, status and confidence.", "Failure memory, predictive maintenance and a hazard simulator in the same place."]),
        ("What the Company gets", GREEN, [f"IDR {BASE[3]/1000:.2f} B a year at full use (base case), payback in about {PB:.0f} months.", f"Repair time down 10%, repeat failures down 30%, {D['issues']} document conflicts closed.", "Lessons from senior engineers kept, searchable and approved."]),
        ("What happens next", ORANGE, ["Approve a 90-day pilot on the LLDPE unit with 45 users.", "Agree data access, owners and the enterprise AI terms.", "Review the success gates, then connect EDMS and AIMS."])]
for i, (t, c, bl) in enumerate(cols):
    x = 0.5 + i * 4.16
    box(s, x, 1.4, 4.0, 4.25, WHITE, MID, None, radius=0.08)
    box(s, x, 1.4, 4.0, 0.48, c, None, [t], 14, True, WHITE, "l", radius=0.08, margin=0.15)
    text(s, x + 0.15, 2.05, 3.7, 3.5, [[("■  ", {"color": c, "size": 9}), b] for b in bl], 12.5, False, INK, space=14, line=1.15)
for i, (n_, l_, c_) in enumerate([(f"{D['evals']}/{D['evals']}", "test questions passed", BLUE), (f"{PB:.0f} months", "payback, base case", GREEN), ("90 days", "pilot, then decide", ORANGE)]):
    x = 0.5 + i * 4.16
    text(s, x + 0.15, 4.5, 3.7, 0.55, n_, 28, True, c_)
    text(s, x + 0.15, 5.1, 3.7, 0.4, l_, 11, False, GRAY)
box(s, 0.5, 5.9, 12.33, 0.95, NAVY, None, [[("A knowledge hub is only useful if people can trust it.", {"bold": True, "size": 17, "color": WHITE})], [("So every answer carries its source, every document its owner and status, and every forecast its limits.", {"size": 12, "color": "DCE8F5"})]], 12, False, WHITE, "c", radius=0.08)
notes(s, "Conclusion. Restate the three things: the proposal, the value and the ask. Close on trust: sources on every answer, owners and status on every document, limits stated on every forecast.")

# ------------------------------------------------------------------ 7 team
s = blank(prs)
header(s, 7, "Team profile", "Team")
text(s, 0.5, 1.38, 12, 0.4, [[("Team name: ", {"bold": True, "color": NAVY}), "[Team name]      ", ("University: ", {"bold": True, "color": NAVY}), "[University]      ", ("Supervisor: ", {"bold": True, "color": NAVY}), "[Supervisor name]"]], 13)
trows = [["No.", "Name", "Major", "Semester", "Area of expertise", "Contribution"],
         ["1", "[Name]", "[Computer Science]", "[6]", "[AI and software]", "[Formulate the idea, build the prototype and assistant]"],
         ["2", "[Name]", "[Chemical Engineering]", "[7]", "[Process and reliability]", "[Background and problem, process content, hazard models]"],
         ["3", "[Name]", "[Industrial Engineering]", "[7]", "[Maintenance and business case]", "[Business impact, KPIs, roadmap]"],
         ["4", "[Name]", "[Major]", "[Semester]", "[Area]", "[Contribution]"]]
table(s, 0.5, 1.95, 12.33, [0.5, 1.8, 2.3, 1.0, 2.5, 4.2], trows, 11, rowh=0.62)
text(s, 0.5, 5.3, 12, 0.5, "Replace the bracketed fields with the real team details before submitting.", 10.5, False, GRAY)
notes(s, "Team. Fill in names, majors, semesters, expertise and contributions as required by the booklet table.")

# ================================================================== appendix
def app_slide(n, title, kicker="Appendix"):
    s = blank(prs); header(s, n, title, kicker); return s

# A1 assistant detail
s = app_slide(8, "A1  How the AI assistant works, step by step")
lanes = [("Browser (the app)", 0.5, 4.0, SKY), ("Serverless function", 4.7, 3.0, "E6F4EA"), ("Language model", 7.9, 2.2, "F1ECFB"), ("Data and logs", 10.3, 2.53, "FFF4E5")]
for t, x, w_, c in lanes:
    box(s, x, 1.35, w_, 0.32, NAVY, None, [t], 10.5, True, WHITE, "c", radius=0.05)
    box(s, x, 1.7, w_, 4.15, c, None, None, radius=0.06)
def node(x, y, w_, h_, t, d=None, fill=WHITE, c=NAVY):
    box(s, x, y, w_, h_, fill, MID, [[(t, {"bold": True, "size": 10, "color": c})]] + ([[(d, {"size": 8.5, "color": GRAY})]] if d else []), 9, False, INK, "c", radius=0.06)
node(0.62, 1.78, 3.76, 0.68, "1  Question, role, equipment in view", "Context comes from the page the user is on")
node(0.62, 2.55, 3.76, 0.68, "2  Router", "Picks a computed tool (KPI, forecast, hazard, interlock) or search")
node(0.62, 3.32, 3.76, 0.68, "3  Retrieve", "Keyword + meaning search; approved sources and role only")
node(0.62, 4.09, 3.76, 0.68, "4  Compute", "Tools calculate figures from the work orders and records")
node(0.62, 4.86, 3.76, 0.9, "7  Verify and show", "Every number and quote is checked against the source text; confidence is scored; sources, status and revision are listed", "E8F1FB", BLUE)
node(4.82, 1.78, 2.76, 0.68, "5  Proxy", "Rate limits; the key stays on the server")
node(4.82, 2.55, 2.76, 0.68, "Prompt", "Question, numbered passages, tool results, rules")
node(4.82, 3.32, 2.76, 0.68, "Stream back", "Tokens reach the page as they arrive")
node(4.82, 4.09, 2.76, 0.68, "Fallback", "If the model fails, local retrieval answers")
node(8.02, 1.78, 1.96, 0.9, "6  Draft", "Writes only from the passages given, with [n] markers")
node(8.02, 2.95, 1.96, 0.9, "Tool calls", "May ask for a tool by name; the page runs it")
node(8.02, 4.12, 1.96, 0.9, "Any provider", "Gemini free tier today; the contract allows others")
node(10.42, 1.78, 2.28, 0.68, "Knowledge store", "Documents, versions, approvals")
node(10.42, 2.55, 2.28, 0.68, "Answer log", "Question, sources, confidence")
node(10.42, 3.32, 2.28, 0.68, "Feedback queue", "Useful, incomplete, wrong")
node(10.42, 4.09, 2.28, 0.68, "Audit trail", "Who, what, when")
node(10.42, 4.86, 2.28, 0.9, "Evaluation set", f"{D['evals']} questions run on every build")
for yy in (2.46, 3.23, 4.0, 4.77): arrow(s, 2.5, yy, 2.5, yy + 0.09, BLUE, 1.6)
arrow(s, 4.38, 4.43, 4.82, 2.12, BLUE, 1.6)
arrow(s, 7.58, 2.12, 8.02, 2.2, BLUE, 1.6)
arrow(s, 4.82, 3.66, 4.38, 5.0, BLUE, 1.6, True, True)
text(s, 0.5, 6.0, 12.3, 0.9, [[("Guardrails.  ", {"bold": True, "color": NAVY}), "Retrieved text is treated as data, never as instructions. The model can only call tools on a fixed list. Requests to bypass an interlock are refused. A question outside the plant data is declined. Users can mark an answer wrong and it goes to a reviewer."],
                          [("Human in the loop.  ", {"bold": True, "color": NAVY}), "New knowledge from users or AI extraction is held for approval by an engineer or manager before the assistant may cite it."]], 10.5, False, INK, space=5)

# A2 data sources
s = app_slide(9, "A2  Data sources, purpose and why each one is worth connecting")
rows = [["Source", "What it gives", "Business justification", "Status"],
        ["SOPs and OPLs (56)", "Steps, safety notes, tacit lessons", "Fewer wrong steps; keeps SME experience", "Loaded"],
        ["Datasheets (8)", "Design limits, materials, ratings", "One place for trusted specifications", "Loaded"],
        ["P&IDs, GA drawings, plot plans (24)", "Equipment, tags, layout, hazards", "Ties every tag to its drawing and location", "Loaded"],
        ["Interlock logic (8, 84 instruments)", "Causes, effects, permissives", "Answers 'what trips and why' with the exact set point", "Loaded"],
        ["Maintenance history (211 WOs)", "Failures, root causes, cost, downtime", "Failure memory, KPIs, prediction", "Loaded"],
        ["Incident and RCA reports", "Lessons learned", "Prevents repeat events", "Add in pilot"],
        ["EDMS", "Controlled document revisions", "Single source of truth for versions", "Adapter ready"],
        ["AIMS", "Work orders and asset hierarchy", "Live history; draft work orders back", "Adapter ready"],
        ["Historian or DCS values", "Live tag values", "Context for troubleshooting and prediction", "Hook in place"],
        ["Digital twin", "Asset model and 3D", "Navigate by equipment and place", "Planned"]]
table(s, 0.5, 1.4, 12.33, [3.0, 3.0, 4.6, 1.3], rows, 10.5, rowh=0.44)
text(s, 0.5, 6.35, 12.3, 0.6, "Every added source needs an owner, a refresh rule and a reason. We prefer a few trusted sources that are connected well over many that are connected badly.", 11, False, GRAY)

# A3 integrations
s = app_slide(10, "A3  How the hub connects to EDMS, AIMS, digital twin and plant data")
box(s, 5.05, 2.4, 3.2, 2.5, NAVY, None, [[("Asset Knowledge Platform", {"bold": True, "size": 14, "color": WHITE})], [("Knowledge core + assistant", {"size": 10, "color": "DCE8F5"})], [("", {})], [("Equipment tag is the key that joins every record", {"size": 10, "color": "DCE8F5"})]], 12, False, WHITE, "c", radius=0.1)
ints = [("EDMS", "Documents and revisions", "Pull on a schedule, keep revision and status", 0.6, 1.55), ("AIMS", "Work orders, asset tree", "Pull history; push approved draft work orders", 0.6, 3.5), ("Historian or DCS", "Live tag values", "Read only through one hook: value, unit, status", 9.7, 1.55), ("Digital twin", "Asset model and 3D", "Link by tag; open the model from any answer", 9.7, 3.5)]
for t, d, m, x, y in ints:
    box(s, x, y, 3.0, 1.3, WHITE, "F0C27B", [[(t, {"bold": True, "size": 12, "color": ORANGE})], [(d, {"size": 10, "color": INK})], [(m, {"size": 9, "color": GRAY})]], 10, False, INK, "c", radius=0.08)
arrow(s, 3.6, 2.2, 5.05, 3.0, ORANGE, 2); arrow(s, 3.6, 4.15, 5.05, 4.0, ORANGE, 2); arrow(s, 9.7, 2.2, 8.25, 3.0, ORANGE, 2); arrow(s, 9.7, 4.15, 8.25, 4.0, ORANGE, 2)
for i, (t, d) in enumerate([("Single sign-on", "Roles come from the company directory"), ("Read first, write later", "Writes are drafts that a person approves"), ("Same contract for every source", "New source = one adapter, no change to the core"), ("Data stays in the tenant", "Region and retention set by the Company")]):
    x = 0.5 + i * 3.1
    box(s, x, 5.35, 2.95, 1.1, SKY, None, [[(t, {"bold": True, "size": 11, "color": NAVY})], [(d, {"size": 9.5, "color": INK})]], 10, False, INK, "c", radius=0.08)

# A4, A5 prototype tour
def tour(n, title, items):
    s = app_slide(n, title, "Appendix: prototype")
    w_ = 6.05; h_ = w_ * 900 / 1240
    for i, (img, cap) in enumerate(items):
        x = 0.5 + i * (w_ + 0.23)
        image(s, IMG(img), x, 1.38, w_, h_)
        text(s, x, 1.38 + h_ + 0.08, w_, 0.8, cap, 10.5, False, INK)
    return s
tour(11, "A4  Ask and verify, then see the plant", [("assistant", "Assistant: the exact interlock logic, with revision, approval status and confidence, and the source it came from."), ("dashboard", "Plant in 3D: every unit shows its state. Select one to fly to it and open its equipment set.")])
tour(12, "A5  Equipment in 3D and operator simulators", [("equipment3d", "Equipment drawing in 3D: select a part and see what the 2D drawing says, with its work orders."), ("opl3d", "OPL scenario simulator: the 3D machine reacts to the operator's actions and shows the fault.")])
tour(13, "A6  P&ID, lessons and ingestion", [("pid", "P&ID: valves open and close. Closing one stops the flow after it and trips the permissive that depends on it."), ("studio", "Knowledge Studio: ingest a document, check it, approve it, and capture tacit knowledge.")])
tour(14, "A7  Reliability, hazards and indicators", [("predict", "Failure modes ranked by risk, chance of each in 90 days, and the lessons that apply."), ("hazard3d", "HSE hazard simulator: gas cloud, fires and blast on the true-scale site, with detectors and walking routes.")])

# A7 assumptions
s = app_slide(15, "A8  Business case assumptions and calculation")
rows = [["Item", "Low", "Base", "High", "Source"],
        ["Users", str(A["users"]), str(A["users"]), str(A["users"]), "Assumed: operators, technicians, engineers, HSE"],
        ["Minutes saved per user per day", "10", "20", "24", f"Assumed {A['search_min']} min spent today"],
        ["Working days a year", "230", "230", "230", "Assumed"],
        ["Loaded cost per hour (IDR)", f"{A['rate']:,}", f"{A['rate']:,}", f"{A['rate']:,}", "Assumed"],
        ["Breakdowns per year", f"{D['bd_yr']:.1f}", f"{D['bd_yr']:.1f}", f"{D['bd_yr']:.1f}", f"Data: {D['bd']} in {D['years']} years"],
        ["MTTR today (h) and cut", f"{D['mttr']:.0f}, 5%", f"{D['mttr']:.0f}, 10%", f"{D['mttr']:.0f}, 15%", "Data for MTTR; cut assumed"],
        ["Value of one downtime hour (IDR M)", f"{A['down_h']:.0f}", f"{A['down_h']:.0f}", f"{A['down_h']:.0f}", "Assumed; replace with plant finance figure"],
        ["Onboarding gain (IDR M)", f"{LOW[2]:.0f}", f"{BASE[2]:.0f}", f"{HIGH[2]:.0f}", "4 hires a year, 1 month faster, half productive"],
        ["Annual benefit (IDR M)", f"{LOW[3]:,.0f}", f"{BASE[3]:,.0f}", f"{HIGH[3]:,.0f}", "Sum of the three levers"],
        ["One-off cost / yearly run (IDR M)", f"{A['one_off']:,.0f} / {A['run']:.0f}", f"{A['one_off']:,.0f} / {A['run']:.0f}", f"{A['one_off']:,.0f} / {A['run']:.0f}", "Integration 650, data 350, change 250, security 150"],
        ["Payback (months) / 3-year net (IDR B)", (f"{PL:.0f}" if PL else "over 36") + f" / {net3(LOW[3])/1000:.1f}", f"{PB:.0f} / {NB/1000:.1f}", f"{PH:.0f} / {net3(HIGH[3])/1000:.1f}", "Benefits ramp: 60% in year 1, 100% after"]]
table(s, 0.5, 1.4, 12.33, [3.4, 1.4, 1.4, 1.4, 4.7], rows, 10, rowh=0.4)
text(s, 0.5, 6.3, 12.3, 0.7, "Items marked 'Assumed' are estimates to be replaced by Company figures during the pilot. 'Data' items come from the provided baseline data. The yearly run cost covers hosting, model use, monitoring and half a support role.", 10.5, False, GRAY)

# A8 evaluation
s = app_slide(16, "A9  Test evidence: what has been checked")
rows = [["Check", "Result"],
        [f"{D['evals']} curated questions (interlocks, procedures, statistics, safety, hazards, failure modes, Bahasa Indonesia)", "All pass: right facts, sources shown, refusals where required"],
        ["Safety requests (bypass an interlock, defeat a trip)", "All refused with the reason and the safe route"],
        ["Out-of-scope questions", "Declined and pointed to the right source"],
        ["Generated audit of answers against records", "98 of 98 correct"],
        ["Two browsers on one shared database", "Edits sync, conflicts are detected, offline mode falls back"],
        ["Fake language model server", "Streaming, tool calls, saved key and failure fallback all work"],
        ["3D models and layout stress", "Random use of all 8 models and all pages without errors"],
        [f"Predictive backtest ({D['bt']} forecasts)", "Combined risk score only slightly better than guessing; reported as advisory"]]
table(s, 0.5, 1.4, 12.33, [6.6, 5.7], rows, 11, rowh=0.52)
text(s, 0.5, 6.3, 12.3, 0.6, "Not yet tested: a live connection to the Company's EDMS, AIMS or historian, and the real language-model service under load. Both are in the pilot plan.", 11, False, GRAY)

# A9 security
s = app_slide(17, "A10  Security and governance controls")
rows = [["Area", "Control in the prototype", "Production step"],
        ["Access", "Role-based views (operator, engineer, manager, admin)", "Single sign-on and directory groups"],
        ["Secrets", "Language-model key kept on the server; secrets masked when documents are ingested", "Key vault, rotation"],
        ["Prompt injection", "Retrieved text treated as data; fixed tool list; refusal rules", "Red-team test before go-live"],
        ["Traceability", "Every answer logs question, sources, confidence; audit trail of changes", "Export to the Company's SIEM"],
        ["Document trust", "Approval workflow; status and revision always shown", "Link to EDMS revision control"],
        ["Data location", "Held in the Company's own storage", "Region fixed, retention set, PDP Law review"],
        ["Plant safety", "Advisory only; no write to control systems; interlock bypass refused", "Keep the hub outside the OT zone (IEC 62443)"]]
table(s, 0.5, 1.4, 12.33, [1.8, 5.8, 4.4], rows, 11, rowh=0.55)

# A10 data conflicts
s = app_slide(18, "A11  Conflicts our ingestion found in the provided drawings (examples of 48)")
rows = [["Finding", "Why it matters in the field"],
        ["Title 'KA-4501' vs body tag 'KC-4501'", "Searching by tag misses the sheet"],
        ["FV-2302 labelled 'Trips OPEN' and 'trips CLOSED'", "The failure position of a valve is unclear"],
        ["TSHH-2301 trip box text describes flow low-low 9 m3/h", "Wrong trip description for a temperature trip"],
        ["FV-3403 used for both H2 injection and trim-gas valves", "Two valves share one tag"],
        ["Drawing reference is a placeholder 'XXXX' or missing", "Cannot trace the drawing in EDMS"],
        ["Revision shown as '02' with no full date", "Cannot tell whether it is current"],
        ["Footprint 4.0 x 9.5 m vs 4.0 x 8.5 m vs 9000 mm length", "Layout and access decisions use different numbers"],
        ["GA drawing shows a rotary steam-tube dryer; P&ID shows a fluid bed dryer", "Two different machines under one tag"]]
table(s, 0.5, 1.4, 12.33, [6.6, 5.7], rows, 11, rowh=0.52)
text(s, 0.5, 6.2, 12.3, 0.7, "Each finding is kept in a register with an owner. The assistant tells the user when an answer touches a document with an open conflict.", 11, False, GRAY)

prs.save(OUT)
print("saved", OUT, os.path.getsize(OUT) // 1024, "KB")
