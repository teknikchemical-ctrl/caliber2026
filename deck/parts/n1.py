# ======================================================= 1 COVER, 2 PROBLEM, 3 SOLUTION
from flow import *

# ---------------------------------------------------------------- 1 cover
s = blank(prs)
box(s, 0, 0, 13.333, 7.5, "F4F7FB", None, None, shape=MSO_SHAPE.RECTANGLE)
lp = box(s, 0, 0, 6.75, 7.5, NAVY, None, None, shape=MSO_SHAPE.RECTANGLE); grad(lp, "0B2A4A", "123F6B", 90)
box(s, 0, 0, 0.18, 7.5, TEAL, None, None, shape=MSO_SHAPE.RECTANGLE)
text(s, 0.7, 0.55, 6.0, 0.3, "CALIBER 2026  |  Business proposal  |  Preliminary stage", 10, True, "8FD3CC")
text(s, 0.7, 1.05, 5.9, 1.7, ["Asset Knowledge", "Platform"], 46, True, WHITE, line=1.0)
text(s, 0.7, 2.75, 5.8, 1.0, "A knowledge hub for the LLDPE unit. It links plant documents, work orders and live P&IDs to each equipment tag, and it answers engineers' questions with cited sources.", 13.5, False, "DCE8F5", line=1.12)
for i, (a_, b_, c_) in enumerate([("Connect", "Data operations", BLUE), ("Ask", "Verified answers", TEAL), ("Act", "Reliability and safety", ORANGE)]):
    x = 0.7 + i * 1.95
    box(s, x, 3.9, 1.85, 0.34, c_, None, [[(a_, {"bold": True, "size": 11, "color": WHITE})]], 11, True, WHITE, "c", "m", radius=0.17)
    text(s, x, 4.27, 1.85, 0.3, b_, 9, False, "B9CBE0", "c")
for i, (n_, l_) in enumerate([("564", "Linked records"), ("1,109", "Searchable passages"), ("20", "Computed AI tools"), ("128/128", "Test questions passed")]):
    x = 0.7 + (i % 2) * 2.9; y = 4.8 + (i // 2) * 0.82
    box(s, x, y, 2.75, 0.72, "1A4676", None, None, radius=0.08)
    text(s, x + 0.12, y + 0.04, 1.3, 0.64, n_, 22, True, "8FD3CC", anchor="m")
    text(s, x + 1.4, y + 0.04, 1.3, 0.64, l_, 9.5, False, "DCE8F5", anchor="m", line=1.0)
text(s, 0.7, 6.5, 5.8, 0.25, "Chosen use case: Case 1, Manufacturing Knowledge Hub", 10.5, True, WHITE)
text(s, 0.7, 6.82, 5.9, 0.4, [[("Team: ", {"bold": True, "color": "8FD3CC"}), "[Team name]    ", ("University: ", {"bold": True, "color": "8FD3CC"}), "[University]    ", ("Supervisor: ", {"bold": True, "color": "8FD3CC"}), "[Name]"]], 9.5, False, WHITE)
win(s, "dash2", 7.05, 0.45, 5.85, (0, 0.1, 1, 0.98), "Dashboard: the LLDPE plant in 3D")
win(s, "pid", 7.05, 4.6, 2.85, (0, 0, 1, 0.9), "Live P&ID")
win(s, "assistant", 10.05, 4.6, 2.85, (0, 0.04, 1, 0.9), "AI assistant")
text(s, 7.05, 7.12, 5.9, 0.25, "Screens of the working prototype, built on the case data.", 9, False, GREY)
notes(s, "Cover. Chosen use case: Case 1, Manufacturing Knowledge Hub. The windows show the working prototype: the 3D plant dashboard, a live P&ID and the AI assistant.")

# ---------------------------------------------------------------- 2 problem
s = blank(prs)
frame(s, 2, "Problem: engineers cannot reliably find the {{right knowledge}} at the point of work, and this leads to improper execution",
      None, "Background", "CALIBER 2026 case book (Case 1). Baseline data from 8 equipment sets of the LLDPE unit, June 2024 to December 2025. Chandra Asri context: public releases on its Industry 4.0 programme and Cilegon digital twin", "Problem identification")
ptitle(s, 0.4, 1.26, 4.35, "Root causes", NAVY)
causes = [("Scattered sources", "SOPs, P&IDs, datasheets, EDMS and AIMS records sit in separate systems."),
          ("Knowledge held by people", "The reasons behind trips and repairs are not written down."),
          ("Conflicting documents", "Revision and approval status are not visible where a document is used."),
          ("No link to the equipment tag", "Work orders, drawings and interlocks cannot be searched together.")]
for i, (t_, d_) in enumerate(causes):
    cy = 1.88 + i * 0.55
    box(s, 0.4, cy - 0.25, 4.35, 0.5, WHITE, BLUE, [[(t_ + ". ", {"bold": True, "size": 9.5, "color": NAVY}), (d_, {"size": 9, "color": INK})]], 9, False, INK, "l", "m", radius=0.08, lw=1.1, margin=0.1)
arrow(s, 4.78, 2.65, 5.07, 2.65, RED, 2.0)
ptitle(s, 5.1, 1.26, 3.05, "Core problem", RED)
box(s, 5.1, 1.62, 3.05, 2.06, TINT[RED], RED, [[("Improper execution", {"bold": True, "size": 15, "color": RED})], [("", {"size": 4})], [("Engineers start up, troubleshoot or repair equipment using a wrong step or an outdated drawing, without knowing a relevant past lesson.", {"size": 9.5, "color": INK})]], 12, False, INK, "c", "m", radius=0.1, lw=1.6, margin=0.12)
arrow(s, 8.18, 2.65, 8.47, 2.65, RED, 2.0)
ptitle(s, 8.5, 1.26, 4.45, "Effects in the baseline data", ORANGE)
effs = [(f"{D['rep']} of {D['cm_follow']}", "Corrective jobs were repeated within 120 days."), (f"{D['dt']} h", f"Downtime in {D['bd']} breakdowns, with IDR {D['cost']:.0f} M of maintenance cost, of which 82% was corrective."), ("21%", "Only this share of faults was found before it became a corrective job.")]
for i, (n_, d_) in enumerate(effs):
    cy = 1.95 + i * 0.72
    box(s, 8.5, cy - 0.3, 1.3, 0.6, ORANGE, None, [[(n_, {"bold": True, "size": 15, "color": WHITE})]], 15, True, WHITE, "c", "m", radius=0.08, margin=0.02)
    box(s, 9.8, cy - 0.3, 3.15, 0.6, WHITE, ORANGE, [[(d_, {"size": 9, "color": INK})]], 9, False, INK, "l", "m", radius=0.08, lw=1.1, margin=0.1)
# who is affected, evidence, downtime
ptitle(s, 0.4, 3.85, 4.35, "Who is affected, and how", NAVY)
users = [("Operators", "Need the exact step and set point during start-up and trips."), ("Maintenance engineers", "Need past repairs and spare parts for the same equipment."), ("Reliability engineers", "Need a clean failure history to find repeat failures."), ("HSE and process engineers", "Need current interlock logic and hazard limits."), ("Plant managers", "Need to see which units are at risk and ready to start.")]
for i, (r_, n_) in enumerate(users):
    y = 4.18 + i * 0.4
    box(s, 0.4, y, 4.35, 0.37, WHITE if i % 2 else LIGHT, MID, None, radius=0.04, lw=0.8)
    text(s, 0.48, y, 1.45, 0.37, r_, 8.5, True, NAVY, anchor="m", line=0.92); text(s, 1.95, y, 2.78, 0.37, n_, 8.3, False, INK, anchor="m", line=0.92)
ptitle(s, 4.95, 3.85, 3.7, "What the case data shows", NAVY)
tiles = [("564", "Records of 7 types, linked only through the equipment tag.", BLUE), ("48", "Document conflicts, for example FV-2302 is labelled both trips OPEN and trips CLOSED.", RED), (f"{D['bad']}", f"Failures in {D['wo']} work orders, none linked to a lesson learned.", ORANGE), ("624", "Relations between records that the platform has to build.", TEAL)]
for i, (n_, l_, c_) in enumerate(tiles):
    x = 4.95 + (i % 2) * 1.88; y = 4.18 + (i // 2) * 1.0
    box(s, x, y, 1.82, 0.95, TINT[c_], c_, [[(n_, {"bold": True, "size": 17, "color": c_})], [(l_, {"size": 8, "color": INK})]], 17, False, INK, "c", "m", radius=0.08, lw=1.2, margin=0.05)
ptitle(s, 8.85, 3.85, 4.1, "Breakdown downtime by unit (hours)", ORANGE)
cdp = CategoryChartData(); cdp.categories = ["GA", "YD", "DC", "KC", "EA", "LV", "CT", "FA"]; cdp.add_series("Downtime (h)", [7, 69, 60, 38, 124, 21, 46, 70])
gf = s.shapes.add_chart(XL_CHART_TYPE.COLUMN_CLUSTERED, Inches(8.85), Inches(4.15), Inches(4.1), Inches(2.03), cdp); ch = gf.chart
ch.has_legend = False; ch.plots[0].gap_width = 35; ch.value_axis.visible = False; ch.value_axis.has_major_gridlines = False
ch.category_axis.tick_labels.font.size = Pt(9); ch.category_axis.tick_labels.font.name = FONT
ser = ch.plots[0].series[0]
for i in range(8):
    pt = ser.points[i]; pt.format.fill.solid(); pt.format.fill.fore_color.rgb = rgb(RED if i == 4 else ORANGE)
ser.data_labels.show_value = True; ser.data_labels.font.size = Pt(10); ser.data_labels.font.bold = True; ser.data_labels.font.name = FONT; ser.data_labels.position = XL_LABEL_POSITION.OUTSIDE_END
ribbon(s, "Engineers lose time and make errors because plant knowledge is not linked to the equipment they are working on. In the LLDPE unit this shows up as 434 hours of breakdown downtime and repeated failures, so better access to existing knowledge has a measurable payoff.")
notes(s, "Problem. Four root causes lead to one core problem, improper execution, which appears in the baseline data as repeat failures (8 of 55 corrective jobs), 434 hours of breakdown downtime and only 21 percent of faults found early. Five groups of users are affected. EA-5601 alone lost 124 hours. Chandra Asri already runs an Industry 4.0 programme and a digital twin of the Cilegon complex according to public releases; this proposal adds the knowledge layer around it.")

# ---------------------------------------------------------------- 3 solution
s = blank(prs)
frame(s, 3, "Solution: one checked knowledge base, linked by {{equipment tag}}, feeds an AI assistant that answers, predicts and plans",
      None, "Solution", "Prototype architecture and counts from the running application. Gemini 2.5 Flash is reached through a serverless proxy on the free tier", "Proposed solution")
box(s, 0.4, 1.26, 12.55, 0.4, TINT[BLUE], BLUE, [[("Objective: ", {"bold": True, "size": 10, "color": NAVY}), ("give every engineer one searchable, source-checked view of plant knowledge, linked to the equipment tag, and use it to answer questions, predict failures and plan work.", {"size": 10, "color": INK})]], 10, False, INK, "l", "m", radius=0.06, lw=1.0, margin=0.12)
text(s, 0.4, 1.72, 1.6, 0.26, "Key technologies:", 9, True, NAVY, anchor="m")
cx_ = 1.85
for lb, c_ in [("Gemini 2.5 Flash", PURPLE), ("BM25F and vector search", TEAL), ("IndexedDB browser app", BLUE), ("Netlify Functions and Blobs", BLUE), ("PostgreSQL, pgvector (target)", GREY)]:
    w_ = fchip(s, cx_ + (len(lb) * 8.5 * 0.0083 + 0.26) / 2, 1.85, lb, c_, 8.5, 0.26); cx_ += w_ + 0.1
# panel A: plant inputs and data operations
ptitle(s, 0.4, 2.1, 6.05, "Q1  Industrial Data Ops foundation: connect scattered plant knowledge", BLUE)
box(s, 0.4, 2.4, 6.05, 3.12, "F4F8FD", None, None, radius=0.04)
ins = ["SOPs and OPLs", "P&IDs and plot plan", "Datasheets, instrument list", "Interlock cause and effect", "Work orders and RCA", "Live data (read-only)"]
for i, lb in enumerate(ins):
    cy = 2.65 + i * 0.5
    fbox(s, 1.4, cy, 1.8, 0.42, lb, None, GREY if i == 5 else BLUE, tsize=8.8)
    arrow(s, 2.3, cy, 2.46, cy, BLUE, 1.2, False)
arrow(s, 2.46, 2.65, 2.46, 5.15, BLUE, 1.2, False); arrow(s, 2.46, 2.72, 2.66, 2.72, BLUE, 1.6)
steps = [("1  Ingest", "Parse, extract, mask secrets"), ("2  Structure", "Tags, facts and relations"), ("3  Check", "Conflicts go to a register"), ("4  Approve", "Named owner and revision")]
for i, (t_, d_) in enumerate(steps):
    cy = 2.72 + i * 0.78
    fbox(s, 3.52, cy, 1.72, 0.58, t_, d_, BLUE, tsize=9.3, ssize=8)
    if i < 3: arrow(s, 3.52, cy + 0.29, 3.52, cy + 0.49, BLUE, 1.5)
arrow(s, 4.38, 5.06, 4.58, 5.06, BLUE, 1.2, False); arrow(s, 4.58, 5.06, 4.58, 2.95, BLUE, 1.2, False)
for i, (t_, d_) in enumerate([("Passages and index", "1,109 passages"), ("Facts and relations", "447 facts, 624 links"), ("Records and lessons", "211 WO, 56 OPL, 8 interlocks")]):
    cy = 2.95 + i * 1.0
    box(s, 4.82, cy - 0.4, 1.55, 0.8, TINT[GREEN], GREEN, [[(t_, {"bold": True, "size": 9, "color": NAVY})], [(d_, {"size": 8, "color": INK})]], 9, False, INK, "c", "m", shape=MSO_SHAPE.CAN, lw=1.2, margin=0.03)
    arrow(s, 4.58, cy, 4.8, cy, GREEN, 1.5)
# panel B: AI algorithm
ptitle(s, 6.6, 2.1, 6.35, "Q2  AI finds trusted information faster and reduces improper execution", TEAL)
box(s, 6.6, 2.4, 6.35, 3.12, "F2FAF8", None, None, radius=0.04)
R1, R2 = 2.92, 4.1
x_r = 12.85
# row 1, left to right
w1 = [0.95, 1.05, 1.1, 1.05, 1.1]; g1 = (x_r - 6.7 - sum(w1)) / 4; xs = []; xx = 6.7
for w_ in w1: xs.append(xx + w_ / 2); xx += w_ + g1
fbox(s, xs[0], R1, w1[0], 0.62, "User question", None, BLUE, tsize=9)
fdia(s, xs[1], R1, w1[1], 0.84, "Unsafe request?", RED, 8)
fbox(s, xs[2], R1, w1[2], 0.62, "Retrieve and rank", "BM25F, vectors", TEAL, tsize=8.8, ssize=8)
fdia(s, xs[3], R1, w1[3], 0.84, "Enough evidence?", AMBER, 8)
fbox(s, xs[4], R1, w1[4], 0.62, "Compute", "20 tools", TEAL, tsize=9, ssize=8)
for i in range(4): arrow(s, xs[i] + w1[i] / 2 + 0.02, R1, xs[i + 1] - w1[i + 1] / 2 - 0.02, R1, GREY, 1.4)
flab(s, xs[1] + w1[1] / 2 + 0.0, R1 - 0.24, "No", GREEN, 0.3); flab(s, xs[3] + w1[3] / 2 + 0.0, R1 - 0.24, "Yes", GREEN, 0.3)
arrow(s, xs[1], R1 + 0.42, xs[1], R1 + 0.58, RED, 1.3, False); fchip(s, xs[1], R1 + 0.7, "Yes: refuse and explain", RED, 8)
arrow(s, xs[3], R1 + 0.42, xs[3], R1 + 0.58, AMBER, 1.3, False); fchip(s, xs[3], R1 + 0.7, "No: say no source found", AMBER, 8)
# row 2, right to left
w2 = [1.05, 1.3, 0.95, 1.05, 1.0]; g2 = (x_r - 6.7 - sum(w2)) / 4; xs2 = []; xx = x_r
for w_ in w2: xs2.append(xx - w_ / 2); xx -= w_ + g2
fdia(s, xs2[0], R2, w2[0], 0.84, "Model available?", PURPLE, 8)
fbox(s, xs2[1], R2, w2[1], 0.62, "Gemini drafts", "2.5 Flash, wording only", PURPLE, tsize=8.8, ssize=7.8)
fbox(s, xs2[2], R2, w2[2], 0.62, "Verify", "Figures and quotes", TEAL, tsize=9, ssize=8)
fdia(s, xs2[3], R2, w2[3], 0.84, "Figures found?", AMBER, 8)
fbox(s, xs2[4], R2, w2[4], 0.62, "Answer", "Sources, score", GREEN, solid=True, tsize=9.3, ssize=8)
for i in range(4): arrow(s, xs2[i] - w2[i] / 2 - 0.02, R2, xs2[i + 1] + w2[i + 1] / 2 + 0.02, R2, GREY, 1.4)
flab(s, xs2[0] - w2[0] / 2 - 0.3, R2 - 0.24, "Yes", GREEN, 0.3); flab(s, xs2[3] - w2[3] / 2 - 0.3, R2 - 0.24, "Yes", GREEN, 0.3)
arrow(s, xs[4], R1 + 0.31, xs2[0], R2 - 0.42, GREY, 1.4)
arrow(s, xs2[0], R2 + 0.42, xs2[0], R2 + 0.58, PURPLE, 1.3, False); fchip(s, xs2[0] - 0.1, R2 + 0.7, "No: show local draft", PURPLE, 8)
arrow(s, xs2[3], R2 + 0.42, xs2[3], R2 + 0.58, AMBER, 1.3, False); fchip(s, xs2[3], R2 + 0.7, "No: flag, lower score", AMBER, 8)
text(s, 6.7, 4.9, 6.15, 0.2, "Confidence score (0 to 100) is a weighted sum of five signals:", 8.8, True, NAVY)
bx_ = 6.7
for pct, nm, c_ in [(45, "Question words found", TEAL), (22, "Best match", BLUE), (15, "Approval status", GREEN), (10, "Agreement", PURPLE), (8, "Sources", ORANGE)]:
    w_ = 6.15 * pct / 100
    box(s, bx_, 5.1, w_ - 0.03, 0.22, c_, None, [[(str(pct), {"bold": True, "size": 8.5, "color": WHITE})]], 8.5, True, WHITE, "c", "m", radius=0.03, margin=0.0)
    bx_ += w_
text(s, 6.7, 5.33, 6.15, 0.2, "Question words found 45, best match 22, approval status 15, source agreement 10, number of sources 8", 8, False, GREY)
# bottom strip: active use
box(s, 0.4, 5.64, 1.9, 0.54, ORANGE, None, [[("Q3  Active use", {"bold": True, "size": 10, "color": WHITE})], [("Reliability, troubleshooting", {"size": 8, "color": "FFF3E6"})]], 10, False, WHITE, "c", "m", radius=0.08, margin=0.04)
feat = [("Failure memory", "Similar cases and fixes"), ("Predictive maintenance", "Risk, forecast, plan"), ("OPL simulator", "Practise the lessons"), ("Live P&ID, interlocks", "Trips and permissives"), ("Start-up readiness", "Go or no-go check"), ("Hazard and site plan", "Release, permits, replay")]
fw = (12.95 - 2.5 - 5 * 0.12) / 6
for i, (t_, d_) in enumerate(feat):
    x0 = 2.5 + i * (fw + 0.12)
    box(s, x0, 5.64, fw, 0.54, WHITE, ORANGE, [[(t_, {"bold": True, "size": 9, "color": NAVY})], [(d_, {"size": 8, "color": INK})]], 9, False, INK, "c", "m", radius=0.08, lw=1.2, margin=0.03)
arrow(s, 2.32, 5.91, 2.48, 5.91, ORANGE, 1.6)
ribbon(s, "Site data enters through one checked pipeline and is linked to the equipment tag before anyone can search it. The assistant ranks the evidence first and uses the language model only to word the answer, and every figure is checked against its source.")
notes(s, "Solution. Panel A shows how plant inputs enter: documents, drawings, datasheets, interlock matrices, work orders and read-only live data go through ingestion, structuring, a conflict check and approval before they reach the knowledge database. Panel B shows the AI algorithm with four decision points: unsafe requests are refused, weak evidence returns no source found, a local verified draft is shown if the model is unavailable, and an answer whose figures are not found in the cited sources is flagged with a lower score. The confidence score is a weighted sum of five signals. The bottom row lists the six features that use the same database for key question 3.")
