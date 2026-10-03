# ======================================================= 1 COVER
from flow import *
s = blank(prs)
box(s, 0, 0, 13.333, 7.5, "F4F7FB", None, None, shape=MSO_SHAPE.RECTANGLE)
lp = box(s, 0, 0, 6.75, 7.5, NAVY, None, None, shape=MSO_SHAPE.RECTANGLE); grad(lp, "0B2A4A", "123F6B", 90)
box(s, 0, 0, 0.18, 7.5, TEAL, None, None, shape=MSO_SHAPE.RECTANGLE)
text(s, 0.7, 0.55, 6.0, 0.3, "CALIBER 2026  |  BUSINESS PROPOSAL  |  PRELIMINARY STAGE", 10, True, "8FD3CC")
text(s, 0.7, 1.05, 5.9, 1.7, ["Asset Knowledge", "Platform"], 46, True, WHITE, line=1.0)
text(s, 0.7, 2.75, 5.8, 0.9, "One governed knowledge base for the LLDPE unit that answers, predicts and plans from the same equipment tags.", 14, False, "DCE8F5", line=1.12)
for i, (a_, b_, c_) in enumerate([("CONNECT", "TAGLINK data operations", BLUE), ("ASK", "VERA verified answers", TEAL), ("ACT", "FORESIGHT, SAFEWORK", ORANGE)]):
    x = 0.7 + i * 1.95
    box(s, x, 3.85, 1.85, 0.34, c_, None, [[(a_, {"bold": True, "size": 11, "color": WHITE})]], 11, True, WHITE, "c", "m", radius=0.17)
    text(s, x, 4.22, 1.85, 0.3, b_, 8.8, False, "B9CBE0", "c")
for i, (n_, l_) in enumerate([("564", "linked records"), ("1,109", "searchable passages"), ("20", "computed AI tools"), ("128/128", "questions passed")]):
    x = 0.7 + (i % 2) * 2.9; y = 4.75 + (i // 2) * 0.82
    box(s, x, y, 2.75, 0.72, "1A4676", None, None, radius=0.08)
    text(s, x + 0.12, y + 0.04, 1.3, 0.64, n_, 22, True, "8FD3CC", anchor="m")
    text(s, x + 1.4, y + 0.04, 1.3, 0.64, l_, 9.5, False, "DCE8F5", anchor="m", line=1.0)
text(s, 0.7, 6.5, 5.8, 0.25, "Chosen use case: Case 1, Manufacturing Knowledge Hub", 10.5, True, WHITE)
text(s, 0.7, 6.8, 5.9, 0.5, [[("Team: ", {"bold": True, "color": "8FD3CC"}), "[Team name]   ", ("University: ", {"bold": True, "color": "8FD3CC"}), "[University]   ", ("Supervisor: ", {"bold": True, "color": "8FD3CC"}), "[Supervisor]"]], 9.5, False, WHITE)
h1 = win(s, "dash2", 7.05, 0.45, 5.85, (0, 0.1, 1, 0.98), "Dashboard: the LLDPE plant in 3D, every unit selectable")
h2 = win(s, "pid", 7.05, 4.6, 2.85, (0, 0, 1, 0.9), "Live P&ID: valves, flow and trips")
h3 = win(s, "assistant", 10.05, 4.6, 2.85, (0, 0.04, 1, 0.9), "AI assistant: sources and confidence")
text(s, 7.05, 7.12, 5.9, 0.25, "Working prototype on the case baseline data, with a 3-minute demonstration video", 9, False, GREY)
notes(s, "Cover. Chosen use case: Case 1. The three windows are screens of the working prototype: the 3D plant dashboard, the live P&ID and the AI assistant with sources and confidence.")

# ======================================================= 2 BACKGROUND AND PROBLEM
s = blank(prs)
frame(s, 2, "Problem Analysis: the {{Knowledge Gap}} Between What the Plant Records and What Engineers Can Use at the Point of Work",
      None, "Background", "CALIBER 2026 case book (Case 1); baseline data analysed in the prototype: 8 equipment sets, LLDPE unit, June 2024 to December 2025. Chandra Asri context: public Industry 4.0 and digital-twin releases", "Problem Identification")
# row 1: problem tree, causes -> core problem -> effects
gbanner(s, 0.4, 1.26, 4.55, "Root causes", NAVY, "27517F", 0.27, 9.5)
causes = [("Scattered sources", "SOP, P&ID, EDMS, AIMS, logs in separate systems"), ("Missing tacit knowledge", "why a trip occurs stays with senior staff"), ("Conflicting documents", "revision and approval not visible at use"), ("Disconnected live data", "work orders, trips and drawings are unlinked")]
for i, (t_, d_) in enumerate(causes):
    cy = 1.82 + i * 0.5
    box(s, 0.4, cy - 0.22, 4.55, 0.44, WHITE, BLUE, [[(t_ + "  ", {"bold": True, "size": 9.5, "color": NAVY}), (d_, {"size": 8.5, "color": INK})]], 9, False, INK, "l", "m", radius=0.08, lw=1.1, margin=0.1)
arrow(s, 4.97, 2.57, 5.3, 2.57, RED, 2.0)
gbanner(s, 5.32, 1.26, 3.0, "Core problem", RED, "E88B8B", 0.27, 9.5)
box(s, 5.32, 1.62, 3.0, 1.9, TINT[RED], RED, [[("Improper execution", {"bold": True, "size": 15, "color": RED})], [("", {"size": 4})], [("a wrong step, an outdated drawing or a missed lesson at the point of work", {"size": 10, "color": INK})]], 12, False, INK, "c", "m", radius=0.1, lw=1.6, margin=0.12)
pic(s, "warn", 6.6, 1.68, 0.4, RED)
arrow(s, 8.34, 2.57, 8.67, 2.57, RED, 2.0)
gbanner(s, 8.7, 1.26, 4.25, "Effects in the baseline data", ORANGE, "F0A15B", 0.27, 9.5)
effs = [(f"{D['rep']} of {D['cm_follow']}", "corrective jobs repeat within 120 days"), (f"{D['dt']} h", f"downtime in {D['bd']} breakdowns, IDR {D['cost']:.0f} M maintenance cost"), ("21%", "of faults found before they turned corrective")]
for i, (n_, d_) in enumerate(effs):
    cy = 1.92 + i * 0.64
    box(s, 8.7, cy - 0.27, 1.3, 0.54, ORANGE, None, [[(n_, {"bold": True, "size": 15, "color": WHITE})]], 15, True, WHITE, "c", "m", radius=0.08, margin=0.02)
    box(s, 10.0, cy - 0.27, 2.95, 0.54, WHITE, ORANGE, [[(d_, {"size": 9.5, "color": INK})]], 9.5, False, INK, "l", "m", radius=0.08, lw=1.1, margin=0.1)
# row 2: evidence from the data
gbanner(s, 0.4, 3.72, 3.0, "The knowledge network", NAVY, "27517F", 0.27, 9.5)
image(s, os.path.join(HERE, "jpg", "net.jpg"), 0.45, 4.05, 2.9, 2.08, border=False)
gbanner(s, 3.6, 3.72, 3.9, "What the data shows", NAVY, "27517F", 0.27, 9.5)
tiles = [("564", "records of 7 types joined only by the equipment tag", BLUE), ("624", "relations the platform has to build; no source stores them", TEAL), (f"{D['issues']}", "document conflicts, e.g. FV-2302 trips OPEN and CLOSED", RED), (f"{D['bad']}", f"failures in {D['wo']} work orders, none linked to a lesson", ORANGE)]
for i, (n_, l_, c_) in enumerate(tiles):
    x = 3.6 + (i % 2) * 1.98; y = 4.05 + (i // 2) * 1.05
    box(s, x, y, 1.92, 0.98, TINT[c_], c_, [[(n_, {"bold": True, "size": 20, "color": c_})], [(l_, {"size": 8.5, "color": INK})]], 20, False, INK, "c", "m", radius=0.08, lw=1.2, margin=0.05)
gbanner(s, 7.7, 3.72, 5.25, "Breakdown downtime by unit, hours", ORANGE, "F0A15B", 0.27, 9.5)
cdp = CategoryChartData(); cdp.categories = ["GA-1201A", "YD-2301", "DC-3401A", "KC-4501", "EA-5601", "LV-6701", "CT-7801", "FA-8901"]; cdp.add_series("Downtime h", [7, 69, 60, 38, 124, 21, 46, 70])
gf = s.shapes.add_chart(XL_CHART_TYPE.COLUMN_CLUSTERED, Inches(7.7), Inches(4.02), Inches(5.25), Inches(2.15), cdp); ch = gf.chart
ch.has_legend = False; ch.plots[0].gap_width = 35; ch.value_axis.visible = False; ch.value_axis.has_major_gridlines = False
ch.category_axis.tick_labels.font.size = Pt(8.5); ch.category_axis.tick_labels.font.name = FONT
ser = ch.plots[0].series[0]
for i in range(8):
    pt = ser.points[i]; pt.format.fill.solid(); pt.format.fill.fore_color.rgb = rgb(RED if i == 4 else ORANGE)
ser.data_labels.show_value = True; ser.data_labels.font.size = Pt(10); ser.data_labels.font.bold = True; ser.data_labels.font.name = FONT; ser.data_labels.position = XL_LABEL_POSITION.OUTSIDE_END
ribbon(s, "The plant already records what engineers need, but no system joins it to the asset at the point of work. That gap, not missing data, is what causes improper execution and repeat failures.")
notes(s, "Problem analysis as a tree. Four root causes lead to one core problem, improper execution, which shows up in the baseline data as repeat failures (8 of 55 corrective jobs), 434 hours of breakdown downtime and only 21 percent of faults found early. The lower row is the evidence: the real knowledge network of the case data, the four numbers that describe it, and downtime by unit, where EA-5601 alone lost 124 hours. Context: Chandra Asri is already running an Industry 4.0 programme and a digital twin of the Cilegon complex, according to public releases; this proposal adds the knowledge layer around it.")

# ======================================================= 3 SOLUTION (data flow and decision flow)
from flow import *
def mixrow(s, cy, x0, x1, items, color, dw=0.98, dh=0.92, maxw=1.15):
    """items: ("c", title, sub[, solid]) or ("d", label, color, exit_text); returns list of (x, y, w, h, kind)"""
    ms = []
    for it in items:
        if it[0] == "c": w, h = measure(it[1], it[2], 10, 8.4, maxw, 0.8); ms.append((w, h))
        else: ms.append((dw, dh))
    gap = (x1 - x0 - sum(m[0] for m in ms)) / (len(ms) - 1)
    x = x0; out = []
    for it, m in zip(items, ms):
        if it[0] == "c":
            cell(s, x, cy, it[1], it[2], color, 10, 8.4, maxw, 0.8, solid=(len(it) > 3 and it[3]))
        else:
            diamond(s, x + m[0] / 2, cy, m[0], m[1], it[1], it[2], 8.5)
            if it[3]:
                ew = tw(it[3], 8.5, True) + 0.2
                box(s, x + m[0] / 2 - ew / 2, cy + m[1] / 2 + 0.07, ew, 0.26, TINT.get(it[2], LIGHT), it[2], [it[3]], 8.5, True, NAVY, "c", "m", radius=0.1, margin=0.02, lw=1.0)
                arrow(s, x + m[0] / 2, cy + m[1] / 2 - 0.0, x + m[0] / 2, cy + m[1] / 2 + 0.07, it[2], 1.2, False)
        out.append((x, cy - m[1] / 2, m[0], m[1], it[0])); x += m[0] + gap
    for a_, b_ in zip(out[:-1], out[1:]): arrow(s, a_[0] + a_[2] + 0.02, cy, b_[0] - 0.02, cy, color, 1.5)
    return out
s = blank(prs)
frame(s, 3, "Solution: One {{Governed Knowledge Database}} Fed by Data Operations, Read by Three Engines That Answer, Predict and Plan",
      None, "Solution", "Prototype architecture and counts from the running application; Gemini 2.5 Flash is reached through the serverless proxy (free tier)", "Proposed Solution")
X0, X1 = 2.15, 12.9
def lane(y, h, c_): box(s, 0.4, y, 12.55, h, TINT[c_], None, None, radius=0.05)
# Q1 lane: data foundation
lane(1.28, 1.0, BLUE); tag(s, 0.48, 1.34, 1.5, 0.88, "Q1", "Data foundation", BLUE)
r1 = row(s, 1.78, X0, X1, [("Sources", "SOP, OPL, datasheets, P&ID, interlocks, WO"), ("Ingest", "parse, classify, Gemini extract, quote check"), ("Structure", "facts and relations on the equipment tag"), ("Check", "rules find conflicts; secrets masked"), ("Approve", "owner, revision, status, access")], BLUE, tsize=10, ssize=8.4, maxw=1.8)
# database band
box(s, 0.4, 2.38, 12.55, 0.8, "E4F4EA", None, None, radius=0.05)
tag(s, 0.48, 2.42, 1.5, 0.72, "DB", "Knowledge database", GREEN)
dbs = [("Passages", "1,109 chunks, BM25F"), ("Typed facts", "447 facts"), ("Relations", "624 links"), ("Records", "211 WO, 56 OPL, 8 interlocks"), ("Knowledge items", "lessons, drafts"), ("Audit and Q&A log", "shared store")]
ws = [measure(t_, sb, 10, 8.6, 1.5, 1.0)[0] + 0.1 for t_, sb in dbs]
gp = (X1 - X0 - sum(ws)) / (len(dbs) - 1); dx = X0
for (t_, sb), w_ in zip(dbs, ws):
    box(s, dx, 2.43, w_, 0.7, TINT[GREEN], GREEN, [[(t_, {'bold': True, 'size': 10, 'color': NAVY})], [(sb, {'size': 8.6, 'color': INK})]], 10, False, INK, 'c', 'm', shape=MSO_SHAPE.CAN, lw=1.1, margin=0.03); dx += w_ + gp
a_ = r1[-1]; arrow(s, a_[0] + a_[2] / 2, a_[1] + a_[3] + 0.03, a_[0] + a_[2] / 2, 2.46, BLUE, 2.0)
text(s, a_[0] + a_[2] / 2 - 1.3, 2.24, 1.2, 0.2, "approved only", 8.5, True, BLUE, "r")
# Q2 lane: answer with four decision points
lane(3.28, 1.44, TEAL); tag(s, 0.48, 3.36, 1.5, 1.28, "Q2", "Trusted answers (VERA)", TEAL)
r2 = mixrow(s, 3.8, X0, 12.7, [("c", "Question", None, False), ("d", "Unsafe bypass?", RED, "yes: refuse, explain"), ("c", "Retrieve", "BM25F, vectors", False), ("d", "Enough evidence?", AMBER, "no: say no source"), ("c", "Compute, draft", "20 tools, Gemini", False), ("d", "Model available?", PURPLE, "no: local draft"), ("c", "Verify", None, False), ("d", "Figures found?", AMBER, "no: flag, lower score"), ("c", "Answer", "with sources", True)], TEAL)
b_ = r2[2]; arrow(s, b_[0] + b_[2] / 2, 3.2, b_[0] + b_[2] / 2, b_[1] - 0.03, GREEN, 2.0)
text(s, b_[0] + b_[2] / 2 + 0.1, 3.19, 0.8, 0.2, "reads", 8.5, True, GREEN)
# Q3 lane: events to lessons and plans
lane(4.82, 1.36, ORANGE); tag(s, 0.48, 4.9, 1.5, 1.2, "Q3", "Active use (FORESIGHT, SAFEWORK)", ORANGE)
r3 = mixrow(s, 5.38, X0, 12.7, [("c", "Plant event", "work order, alarm, plan", False), ("c", "Failure memory", "similar cases, causes, fixes", False), ("d", "Repeat failure?", ORANGE, "yes: raise priority"), ("c", "Predict", "RPN, gamma-Poisson, ridge", False), ("c", "Simulate, plan", "OPL, live P&ID, hazard, site plan", False), ("c", "Lesson approved", "owner signs off", False), ("c", "Act and learn", "feedback returns", True)], ORANGE)
arrow(s, 2.04, 3.2, 2.04, 5.38, GREEN, 1.8, False); arrow(s, 2.04, 5.38, 2.12, 5.38, GREEN, 1.8, True)
l_ = r3[-1]
arrow(s, l_[0] + l_[2] + 0.02, 5.38, 12.86, 5.38, GREY, 1.3, False, True)
arrow(s, 12.86, 5.38, 12.86, 2.78, GREY, 1.3, False, True); arrow(s, 12.86, 2.78, X1 + 0.02, 2.78, GREY, 1.3, True, True)
text(s, 9.4, 6.0, 3.4, 0.2, "approved lessons and feedback return to the database", 8.5, False, GREY, "r")
ribbon(s, "Every answer and plan is read from one governed database, so a source is checked before it is used and a lesson is approved before it is reused. The free-tier model only words the answer; the numbers, quotes and safety refusals come from the platform.")
notes(s, "Solution as one flow. Lane Q1 builds the foundation: sources are ingested, structured on the equipment tag, checked for conflicts and approved before they enter the knowledge database. Lane Q2 answers a question with four decision points: unsafe bypass requests are refused, weak evidence returns no source found, the local verified draft is shown if the model is unavailable, and an answer whose figures are not found in the sources is flagged. Lane Q3 turns plant events into action: failure memory, a repeat-failure check, prediction, simulation and planning, and an approved lesson that returns to the database.")
