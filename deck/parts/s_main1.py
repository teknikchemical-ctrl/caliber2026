# ======================================================= 1 COVER
s = blank(prs)
box(s, 0, 0, 13.333, 7.5, "F4F7FB", None, None, shape=MSO_SHAPE.RECTANGLE)
lp = box(s, 0, 0, 7.2, 7.5, NAVY, None, None, shape=MSO_SHAPE.RECTANGLE); grad(lp, "0B2A4A", "123F6B", 90)
box(s, 0, 0, 0.18, 7.5, TEAL, None, None, shape=MSO_SHAPE.RECTANGLE)
text(s, 0.7, 0.65, 6.3, 0.3, "CALIBER 2026  |  BUSINESS PROPOSAL  |  PRELIMINARY STAGE", 10.5, True, "8FD3CC")
text(s, 0.7, 1.3, 6.4, 1.6, ["Asset Knowledge", "Platform"], 46, True, WHITE, line=1.0)
text(s, 0.7, 2.95, 6.1, 1.2, "A manufacturing knowledge hub for the LLDPE unit: one governed database behind a Gemini-powered assistant, with live P&ID, OPL simulation, failure memory and predictive maintenance on the same asset tags.", 14, False, "DCE8F5", line=1.15)
chip(s, 0.7, 4.3, 5.9, 0.5, "Chosen use case: Case 1, Manufacturing Knowledge Hub", "1E4C7A", WHITE, 11.5, True)
for i, (n_, l_) in enumerate([("564", "linked records"), ("1,109", "searchable passages"), ("20", "computed AI tools"), ("128/128", "evaluation questions passed")]):
    x = 0.7 + i * 1.62
    text(s, x, 5.05, 1.55, 0.5, n_, 24, True, "8FD3CC")
    text(s, x, 5.55, 1.55, 0.4, l_, 9.5, False, "B9CBE0")
text(s, 0.7, 6.3, 6.3, 0.9, [[("Team: ", {"bold": True, "color": "8FD3CC"}), "[Team name]"], [("University: ", {"bold": True, "color": "8FD3CC"}), "[University]    ", ("Supervisor: ", {"bold": True, "color": "8FD3CC"}), "[Supervisor name]"]], 11.5, False, WHITE, space=4)
box(s, 7.75, 0.7, 5.15, 3.3, WHITE, MID, None, shape=MSO_SHAPE.RECTANGLE)
image(s, os.path.join(HERE, "jpg", "net.jpg"), 7.8, 0.75, 5.05, 3.2)
text(s, 7.75, 4.02, 5.15, 0.3, "Knowledge network of the case data: 8 equipment tags and the 556 records that hang on them", 8.5, False, GREY, "c")
for nm, x, y, w in [("assistant", 7.45, 4.4, 3.2), ("scn", 9.75, 4.9, 3.2)]:
    h = w * 0.612
    box(s, x + 0.05, y + 0.05, w, h, "D5DEE9", None, None, shape=MSO_SHAPE.RECTANGLE)
    image(s, IMG(nm), x, y, w, h)
text(s, 7.45, 7.0, 5.5, 0.3, "Working prototype on the case baseline data, with a 3-minute demonstration video", 9, False, GREY)
notes(s, "Cover. Chosen use case: Case 1. The figure is the real knowledge network of the baseline data: eight equipment tags and every document, work order, instrument, lesson, interlock and component linked to them.")

# ======================================================= 2 BACKGROUND AND PROBLEM
s = blank(prs)
frame(s, 2, "Problem Analysis: the {{Knowledge Gap}} Between What the Plant Records and What Engineers Can Use at the Point of Work",
      None, "Background", "CALIBER 2026 case book (Case 1); baseline data analysed in the prototype: 8 equipment sets, LLDPE unit, June 2024 to December 2025", "Problem Identification")
# left panel: network + findings
LX, LW = 0.35, 4.15
hb = gbanner(s, LX, 1.3, LW, "Knowledge landscape of the baseline data", NAVY, "27517F", 0.34, 10.5)
panel(s, LX, 1.66, LW, 5.18, "EAF3FA", "BFD6EA")
image(s, os.path.join(HERE, "jpg", "net.jpg"), LX + 0.05, 1.7, LW - 0.1, 2.62, border=False)
for i, (nm, c_) in enumerate([("Equipment 8", BLUE), ("Documents 96", GREEN), ("Work orders 211", ORANGE), ("Instruments 84", PURPLE), ("OPL 56", AMBER), ("Components 19", TEAL), ("Interlocks 8", RED)]):
    xx = LX + 0.08 + (i % 4) * 1.0; yy = 4.33 + (i // 4) * 0.2
    box(s, xx, yy + 0.04, 0.1, 0.1, c_, None, None, shape=MSO_SHAPE.OVAL); text(s, xx + 0.12, yy, 0.95, 0.18, nm, 6.8, False, INK)
finds = [("Analysis", "564 records of 7 types are joined only by the equipment tag. No source system stores those links; the platform builds 624 of them.", BLUE),
         ("Key finding", "Reading the sources together exposes 48 conflicts, for example valve FV-2302 labelled both trips OPEN and trips CLOSED.", RED),
         ("Tension", "211 work orders and 63 failures, none linked to the lesson that applies. Only 21% of faults found before turning corrective.", ORANGE)]
for i, (t, d, c_) in enumerate(finds):
    y = 4.7 + i * 0.7
    box(s, LX + 0.08, y, 0.82, 0.22, c_, None, [t], 7.5, True, WHITE, "c", "m", radius=0.11, margin=0.02)
    box(s, LX + 0.08, y + 0.2, LW - 0.16, 0.5, WHITE, MID, [d], 8, False, INK, "l", "m", radius=0.05, margin=0.07)
# top band: context -> core problem -> challenges
BX = 4.65
panel(s, BX, 1.3, 8.35, 2.34, "F4F7FB", MID)
gbanner(s, BX + 0.1, 1.36, 2.1, "Operating context", BLUE, "4FA9CE", 0.24, 8.5)
ctx = [("net", "Digital agenda", "Data, analytics and AI being built into manufacturing"), ("flame", "Safety-critical", "Continuous, asset-intensive petrochemical operation"), ("users", "Seven functions", "Production, Maintenance, Reliability, Warehouse, Procurement, Energy, HSE")]
for i, (ic, t, d) in enumerate(ctx):
    y = 1.66 + i * 0.6
    pic(s, ic, BX + 0.1, y + 0.04, 0.38, TEAL)
    text(s, BX + 0.55, y, 1.7, 0.2, t, 8, True, NAVY); text(s, BX + 0.55, y + 0.19, 1.7, 0.4, d, 6.9, False, INK, line=0.98)
box(s, BX + 2.3, 1.55, 0.3, 1.8, "B8D3EA", None, None, shape=MSO_SHAPE.RIGHT_ARROW)
cp = box(s, BX + 2.7, 1.38, 2.7, 2.1, WHITE, RED, None, radius=0.1, lw=1.5)
pic(s, "warn", BX + 3.88, 1.42, 0.34, RED)
text(s, BX + 2.78, 1.78, 2.54, 0.3, "Core problem: improper execution", 10, True, RED, "c")
text(s, BX + 2.78, 2.08, 2.54, 1.35, "Engineers need a correct step, a current drawing or a past lesson during start-up, troubleshooting and maintenance. The answer exists somewhere, but cannot be found fast, cannot be verified, and is not tied to the asset in front of them.", 8, False, INK, "c", line=1.02)
box(s, BX + 5.5, 1.55, 0.3, 1.8, "B8D3EA", None, None, shape=MSO_SHAPE.RIGHT_ARROW)
gbanner(s, BX + 5.9, 1.36, 2.35, "Key challenges", RED, "E88B8B", 0.24, 8.5)
chs = [("net", "Scattered sources", "Separate systems, no shared tag"), ("user", "Missing tacit knowledge", "Why a trip occurs stays with senior staff"), ("doc", "Conflicting documents", "Revision and approval not visible at use"), ("link", "Disconnected live data", "Work orders, trips, drawings unlinked")]
for i, (ic, t, d) in enumerate(chs):
    y = 1.64 + i * 0.5
    pic(s, ic, BX + 5.9, y + 0.02, 0.3, RED)
    text(s, BX + 6.27, y - 0.03, 2.05, 0.2, t, 8.5, True, NAVY); text(s, BX + 6.27, y + 0.15, 2.05, 0.32, d, 8, False, INK, line=0.95)
# bottom band: stakeholders venn + baseline impact
gbanner(s, BX, 3.7, 4.2, "Stakeholder alignment", NAVY, "27517F", 0.3, 9.5)
panel(s, BX, 4.0, 4.2, 2.84, WHITE, MID)
for cx, cy, c_ in [(BX + 1.0, 4.82, BLUE), (BX + 1.95, 4.82, TEAL), (BX + 1.48, 5.5, ORANGE)]:
    ov = box(s, cx - 0.62, cy - 0.62, 1.24, 1.24, c_, None, None, shape=MSO_SHAPE.OVAL)
    sp = ov._element.spPr; sf = sp.find(qn("a:solidFill")); clr = sf[0]; al = etree.SubElement(clr, qn("a:alpha")); al.set("val", "32000")
text(s, BX + 0.25, 4.42, 0.85, 0.4, ["Operations", "Production"], 7, True, NAVY, "c", line=0.95); text(s, BX + 1.75, 4.42, 0.9, 0.4, ["Maintenance", "Reliability"], 7, True, NAVY, "c", line=0.95); text(s, BX + 1.05, 6.1, 0.9, 0.4, ["Process eng.", "and HSE"], 7, True, NAVY, "c", line=0.95)
box(s, BX + 1.0, 5.1, 0.96, 0.42, "0B2A4A", None, ["One trusted source"], 6.8, True, WHITE, "c", "m", radius=0.2, margin=0.03)
text(s, BX + 3.0, 4.1, 1.15, 2.6, [[("Needs", {"bold": True, "color": NAVY})], "The exact step and set point at the valve", [("", {})], "History, lessons, spares", [("", {})], "Limits, hazards, permits", [("", {})], "Audit and revision trail"], 7, False, INK, line=1.0)
gbanner(s, BX + 4.35, 3.7, 4.0, "Baseline impact", ORANGE, "F0A15B", 0.3, 9.5)
panel(s, BX + 4.35, 4.0, 4.0, 2.84, WHITE, MID)
cdp = CategoryChartData(); cdp.categories = ["GA", "YD", "DC", "KC", "EA", "LV", "CT", "FA"]; cdp.add_series("Downtime h", [7, 69, 60, 38, 124, 21, 46, 70])
gf = s.shapes.add_chart(XL_CHART_TYPE.COLUMN_CLUSTERED, Inches(BX + 4.4), Inches(4.3), Inches(2.45), Inches(1.75), cdp); ch = gf.chart
ch.has_legend = False; ch.plots[0].gap_width = 40; ch.value_axis.visible = False; ch.value_axis.has_major_gridlines = False
ch.category_axis.tick_labels.font.size = Pt(7); ch.category_axis.tick_labels.font.name = FONT
ser = ch.plots[0].series[0]; ser.format.fill.solid(); ser.format.fill.fore_color.rgb = rgb(ORANGE)
ser.data_labels.show_value = True; ser.data_labels.font.size = Pt(7); ser.data_labels.font.name = FONT; ser.data_labels.position = XL_LABEL_POSITION.OUTSIDE_END
text(s, BX + 4.4, 4.03, 2.45, 0.25, "Breakdown downtime by unit, hours", 7.5, True, NAVY)
for i, (n_, l_, c_) in enumerate([("31", "breakdowns", RED), ("434 h", "downtime", RED), ("IDR 538 M", "maintenance, 82% corrective", ORANGE)]):
    y = 4.08 + i * 0.62
    text(s, BX + 6.9, y, 1.4, 0.3, n_, 14 if len(n_) < 7 else 11, True, c_); text(s, BX + 6.9, y + 0.28, 1.4, 0.3, l_, 7, False, GREY, line=0.95)
text(s, BX + 4.4, 6.1, 3.9, 0.7, [[("Reading: ", {"bold": True, "color": NAVY}), "EA-5601 alone lost 124 h. Where the history is richer than the procedures, the same fault is investigated again."]], 7.4, False, INK, line=1.02)
notes(s, "Problem analysis. The left figure is the real knowledge network of the baseline data: 8 equipment tags and the documents, work orders, instruments, lessons, interlocks and components connected to them. The links exist only because we built them; no source system stores them. The top band shows the context, the core problem of improper execution and the four challenges named in the case. The bottom band shows who is affected and what the baseline data says: 31 breakdowns, 434 hours of downtime and IDR 538 million of maintenance cost, 82 percent of it corrective.")
# ======================================================= 3 SOLUTION (flowchart)
from flow import *
s = blank(prs)
frame(s, 3, "Solution: One {{Governed Knowledge Database}} Fed by Data Operations, Read by Three Engines That Answer, Predict and Plan",
      None, "Solution", "Prototype architecture and counts from the running application; Gemini 2.5 Flash is reached through the serverless proxy (free tier)", "Proposed Solution")
X0, X1 = 2.15, 12.95
def lane(y, h, c_): box(s, 0.4, y, 12.55, h, TINT[c_], None, None, radius=0.05)
# Q1 lane
lane(1.3, 1.25, BLUE); tag(s, 0.48, 1.38, 1.5, 1.09, "Q1", "Data foundation (TAGLINK)", BLUE)
r1 = row(s, 1.925, X0, X1, [("Sources", "SOP, OPL, datasheets, P&ID, interlocks, work orders"), ("Ingest", "parse, classify, Gemini extraction, quote check"), ("Structure", "facts and relations on the equipment tag"), ("Check", "rules find conflicts; secrets masked"), ("Approve", "owner, revision, status, role access")], BLUE, maxw=1.75)
# database band
box(s, 0.4, 2.8, 12.55, 0.98, "E4F4EA", None, None, radius=0.05)
tag(s, 0.48, 2.86, 1.5, 0.86, "DB", "Knowledge database", GREEN)
dbs = [("Passages", "1,109 chunks, BM25F"), ("Typed facts", "447 facts"), ("Relations", "624 links"), ("Records", "211 WO, 56 OPL, 8 interlocks"), ("Knowledge items", "lessons, drafts, approvals"), ("Audit and Q&A log", "shared store")]
dx = X0
for t, sb in dbs:
    mw, mh = measure(t, sb, 10, 8.6, 1.5, 1.0); mh = 0.8
    box(s, dx, 2.88, mw + 0.1, 0.82, TINT[GREEN], GREEN, [[(t, {'bold': True, 'size': 10, 'color': NAVY})], [(sb, {'size': 8.6, 'color': INK})]], 10, False, INK, 'c', 'm', shape=MSO_SHAPE.CAN, lw=1.1, margin=0.04); dx += mw + 0.1 + (X1 - X0 - sum(measure(a, b, 10, 8.6, 1.5, 1.0)[0] + 0.1 for a, b in dbs)) / (len(dbs) - 1)
a_ = r1[-1]; vline(s, a_[0] + a_[2] / 2, a_[1] + a_[3] + 0.03, 2.86, BLUE, 2.0)
text(s, a_[0] + a_[2] / 2 + 0.08, 2.58, 1.2, 0.2, "approved only", 8, True, BLUE)
# Q2 lane
lane(4.05, 1.25, TEAL); tag(s, 0.48, 4.13, 1.5, 1.09, "Q2", "Trusted answers (VERA)", TEAL)
r2 = row(s, 4.675, X0, X1, [("Question", "engineer, role, equipment"), ("Route", "intent classifier; unsafe bypass refused"), ("Retrieve", "BM25F plus vectors, tag scoped"), ("Compute and draft", "20 tools, Gemini 2.5 Flash"), ("Verify", "numbers and quotes checked"), ("Answer", "sources, confidence 0 to 100")], TEAL, maxw=1.6, solid_last=True)
b_ = r2[2]; vline(s, b_[0] + b_[2] / 2, 3.74, b_[1] - 0.03, GREEN, 2.0)
text(s, b_[0] + b_[2] / 2 + 0.06, 3.8, 0.8, 0.2, "reads", 8, True, GREEN)
# Q3 lane
lane(5.55, 1.25, ORANGE); tag(s, 0.48, 5.63, 1.5, 1.09, "Q3", "Active use (FORESIGHT, SAFEWORK)", ORANGE)
r3 = row(s, 6.175, X0, X1 - 0.35, [("Plant event", "work order, alarm, plan"), ("Failure memory", "similar cases, causes, fixes"), ("Predict", "RPN, gamma-Poisson, ridge model"), ("Simulate", "OPL, live P&ID, hazard"), ("Plan", "readiness, site plan, replay"), ("Act and learn", "lesson and feedback")], ORANGE, maxw=1.6, solid_last=True)
arrow(s, 2.04, 3.78, 2.04, 6.175, GREEN, 1.8, False); arrow(s, 2.04, 6.175, 2.14, 6.175, GREEN, 1.8, True)
l_ = r3[-1]
arrow(s, l_[0] + l_[2] + 0.03, 6.175, 12.9, 6.175, GREY, 1.3, False, True)
arrow(s, 12.9, 6.175, 12.9, 3.3, GREY, 1.3, False, True); arrow(s, 12.9, 3.3, X1 + 0.02, 3.3, GREY, 1.3, True, True)
text(s, 10.2, 5.33, 2.6, 0.2, "approved lessons and feedback return", 8, False, GREY, "r")
notes(s, "Solution as one flow. Lane Q1 builds the foundation: sources are ingested, structured on the equipment tag, checked for conflicts and approved before they enter the knowledge database. Lane Q2 answers a question: the intent is routed, passages are retrieved, computed tools and Gemini 2.5 Flash draft the answer, numbers and quotes are verified, and the engineer sees sources and a confidence score. Lane Q3 turns plant events into action: failure memory, prediction, simulation and planning, and every outcome returns to the database as a lesson or feedback.")
