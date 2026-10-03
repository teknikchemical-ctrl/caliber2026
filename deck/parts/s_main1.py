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
         ("Tension", "211 work orders describe 63 failures, yet none points to the lesson or procedure that applies. Only 21% of faults were found before they turned corrective.", ORANGE)]
for i, (t, d, c_) in enumerate(finds):
    y = 4.78 + i * 0.68
    box(s, LX + 0.08, y, 0.82, 0.22, c_, None, [t], 7.5, True, WHITE, "c", "m", radius=0.11, margin=0.02)
    box(s, LX + 0.08, y + 0.2, LW - 0.16, 0.45, WHITE, MID, [d], 7.3, False, INK, "l", "m", radius=0.05, margin=0.07)
# top band: context -> core problem -> challenges
BX = 4.65
panel(s, BX, 1.3, 8.35, 2.28, "F4F7FB", MID)
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
chs = [("net", "Scattered sources", "SOP, datasheet, P&ID, EDMS, AIMS and logs in separate systems"), ("user", "Missing tacit knowledge", "Why a trip occurs stays with senior staff"), ("doc", "Conflicting documents", "Revision and approval not visible at use"), ("link", "Disconnected live data", "Work order, trip and drawing never read together")]
for i, (ic, t, d) in enumerate(chs):
    y = 1.65 + i * 0.47
    pic(s, ic, BX + 5.9, y + 0.02, 0.3, RED)
    text(s, BX + 6.27, y - 0.02, 2.05, 0.2, t, 7.8, True, NAVY); text(s, BX + 6.27, y + 0.15, 2.05, 0.32, d, 6.6, False, INK, line=0.95)
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

# ======================================================= 3 SOLUTION
s = blank(prs)
frame(s, 3, "Solution: {{Asset Knowledge Platform}} Joins Every Plant Source in One Governed Database, Then Answers, Predicts and Plans From It",
      None, "Solution", "Prototype architecture and counts from the running application; Gemini 2.5 Flash is reached through the serverless proxy (free tier)", "Proposed Solution")
# left objective column
LX, LW = 0.35, 2.3
gbanner(s, LX, 1.3, LW, "Main problem", NAVY, "27517F", 0.3, 9.5)
panel(s, LX, 1.62, LW, 0.95, TINT[RED], "F0C4C4"); text(s, LX + 0.08, 1.64, 0.8, 0.5, "48", 24, True, RED); text(s, LX + 0.85, 1.7, 1.4, 0.4, "conflicts across 98 documents", 8, True, NAVY, line=0.95)
text(s, LX + 0.08, 2.1, LW - 0.16, 0.45, "No source engineers can trust at the point of work.", 7.5, False, INK, line=0.98)
gbanner(s, LX, 2.65, LW, "Objective", NAVY, "27517F", 0.3, 9.5)
for i, (t, d, c_) in enumerate([("Connect", "all sources on the asset tag", BLUE), ("Verify", "every answer and number", TEAL), ("Act", "on history, risk and hazards", ORANGE)]):
    y = 3.0 + i * 0.5
    numdot(s, LX, y + 0.04, i + 1, c_, 0.3, 10); text(s, LX + 0.38, y, LW - 0.4, 0.45, [[(t + ": ", {"bold": True, "color": c_}), d]], 8.3, False, INK, anchor="m", line=0.98)
gbanner(s, LX, 4.55, LW, "Implications", NAVY, "27517F", 0.3, 9.5)
for i, (w_, items) in enumerate([("Engineers", [("Search time", "down"), ("Wrong steps", "down")]), ("Plant", [("Availability", "up"), ("Late start-up", "down")])]):
    y = 4.92 + i * 0.36
    text(s, LX, y, 0.72, 0.3, w_, 8.3, True, NAVY, anchor="m")
    for j, (t, dr) in enumerate(items):
        box(s, LX + 0.72 + j * 0.8, y + 0.02, 0.78, 0.26, TINT[GREEN], None, [[("▲ " if dr == "up" else "▼ ", {"color": GREEN, "size": 7, "bold": True}), (t, {"size": 6.8, "bold": True, "color": INK})]], 7, True, INK, "c", "m", radius=0.13, margin=0.01)
text(s, LX, 5.7, LW, 1.1, [[("Three key questions of the case", {"bold": True, "color": NAVY})], [("Q1  ", {"bold": True, "color": BLUE}), "Industrial Data Ops foundation"], [("Q2  ", {"bold": True, "color": TEAL}), "Trusted answers, less improper execution"], [("Q3  ", {"bold": True, "color": ORANGE}), "Active use in operations"]], 7.6, False, INK, line=1.02, space=3)
# diagram columns
DX = 2.8
cols = [("Sources", DX, 1.55, BLUE), ("TAGLINK  Data Ops", DX + 1.72, 1.7, BLUE), ("Knowledge database", DX + 3.57, 1.65, GREEN), ("Engines", DX + 5.37, 2.35, TEAL), ("Features and users", DX + 7.87, 2.33, ORANGE)]
for t, x, w_, c_ in cols: gbanner(s, x, 1.3, w_, t, c_, {BLUE: "4FA9CE", GREEN: "6CC48D", TEAL: "4DBBA9", ORANGE: "F0A15B"}[c_], 0.3, 9)
srcs = [("doc", "SOP, OPL, tacit notes"), ("list", "Datasheets (8)"), ("net", "P&ID, GA, plot plan"), ("shield", "Interlock C&E"), ("wrench", "Maintenance logs, RCA"), ("gear", "Instrument list (84)"), ("warn", "Incident reports"), ("chart", "Live data: DCS, historian")]
for i, (ic, t) in enumerate(srcs):
    y = 1.68 + i * 0.5
    box(s, DX, y, 1.55, 0.44, WHITE, MID, None, radius=0.06); pic(s, ic, DX + 0.05, y + 0.07, 0.3, BLUE); text(s, DX + 0.4, y, 1.12, 0.44, t, 7.4, True, NAVY, anchor="m", line=0.95)
box(s, DX, 5.72, 1.55, 0.55, "FFF6E5", "F0C27B", [[("EDMS  AIMS", {"bold": True, "size": 8, "color": ORANGE})], [("Digital twin  Historian", {"size": 7, "color": INK})]], 8, False, INK, "c", "m", radius=0.06, lw=1.0)
text(s, DX, 6.3, 1.55, 0.3, "systems of record (read-only)", 6.8, False, GREY, "c")
steps4 = [("Ingest", "parse, classify, extract with Gemini; quote check"), ("Structure", "typed facts and relations on the tag"), ("Check", "rules find conflicts; secrets masked"), ("Approve", "owner, revision, status, role access")]
for i, (t, d) in enumerate(steps4):
    y = 1.68 + i * 1.04
    node(s, DX + 1.72, y, 1.7, 0.92, t, d, TINT[BLUE], BLUE, NAVY, 9, 7)
    if i < 3: arrow(s, DX + 2.57, y + 0.92, DX + 2.57, y + 1.04, BLUE, 1.5)
for i in range(4): arrow(s, DX + 1.55, 1.9 + i * 1.3, DX + 1.72, 2.1 + i * 0.95, BLUE, 1.2)
cyl(s, DX + 3.57, 1.68, 1.65, 0.85, "Passages and index", "1,109 chunks, BM25F, vectors", GREEN)
cyl(s, DX + 3.57, 2.65, 1.65, 0.85, "Typed facts, relations", "447 facts, 624 links on tag", GREEN)
cyl(s, DX + 3.57, 3.62, 1.65, 0.85, "Operating records", "211 WO, 56 OPL, 8 interlocks", GREEN)
cyl(s, DX + 3.57, 4.59, 1.65, 0.85, "Knowledge items", "lessons, drafts, approvals", GREEN)
cyl(s, DX + 3.57, 5.56, 1.65, 0.85, "Audit, feedback, Q&A log", "shared via Blobs", GREEN)
arrow(s, DX + 3.42, 3.6, DX + 3.57, 3.6, GREEN, 2.2)
text(s, DX + 3.2, 6.4, 2.1, 0.3, "browser store + shared store + SQL target", 6.8, False, GREY, "c")
eng = [("VERA", "Verified answers", "Intent router, BM25F retrieval, Gemini 2.5 Flash drafting with function calling over 20 computed tools, number and quote checks, evidence-weighted confidence", TEAL, ["BM25F", "Gemini 2.5 Flash", "20 tools", "verifier"]),
       ("FORESIGHT", "Reliability", "Failure memory over work orders, OPL and lessons; failure-mode RPN; gamma-Poisson forecast with ranges; ridge-logistic score validated by rolling backtest", ORANGE, ["RPN", "gamma-Poisson", "ridge-logistic", "Laplace trend"]),
       ("SAFEWORK", "Hazard, planning", "Orifice release, Gaussian plume, jet and pool fire, blast; permissive-based start-up readiness; permit-aware four-week plan; plant replay", RED, ["Gaussian plume", "Kinney-Graham", "scheduler", "replay"])]
EX = DX + 5.37
for i, (n_, t, d, c_, chips) in enumerate(eng):
    y = 1.68 + i * 1.66
    panel(s, EX, y, 2.35, 1.56, WHITE, c_, radius=0.08)
    box(s, EX, y, 2.35, 0.3, c_, None, [[(n_, {"bold": True, "size": 9.5, "color": WHITE}), ("   " + t, {"size": 7.5, "color": "F0F4F8"})]], 9, True, WHITE, "l", "m", radius=0.08, margin=0.1)
    text(s, EX + 0.08, y + 0.34, 2.2, 0.8, d, 7.2, False, INK, line=1.0)
    cx_ = EX + 0.08
    for ch_ in chips:
        w_ = 0.16 + 0.056 * len(ch_)
        if cx_ + w_ > EX + 2.3: break
        pill(s, cx_, y + 1.3, w_, ch_, TINT[c_], c_, 0.19, 6.5); cx_ += w_ + 0.04
# bus from the database to the three engines
box(s, DX + 5.27, 2.3, 0.025, 3.3, GREEN, None, None, shape=MSO_SHAPE.RECTANGLE)
arrow(s, DX + 5.22, 3.8, DX + 5.27, 3.8, GREEN, 2.0, False)
for i in range(3): arrow(s, DX + 5.27, 2.46 + i * 1.66, EX, 2.46 + i * 1.66, GREEN, 1.4)
arrow(s, DX + 5.5, 6.68, DX + 4.4, 6.68, GREY, 1.0, True, True)
text(s, DX + 3.2, 6.69, 3.0, 0.2, "approved lessons, feedback and answers flow back", 6.6, False, GREY, "c")
FX0 = DX + 7.87
fe = [("Q2", TEAL, ["AI assistant, source panel", "Hybrid and global search", "Equipment 360, datasheets", "Interlock library, documents"]),
      ("Q3", ORANGE, ["Failure memory, predictive", "OPL and scenario simulators", "Live P&ID, plant chain reaction", "Reports and KPI pages"]),
      ("Q3", RED, ["Start-up readiness, hazard", "Site plan and plant replay", "3D plant, equipment drawings", "Notifications, My work"])]
for i, (q, c_, items) in enumerate(fe):
    y = 1.68 + i * 1.66
    panel(s, FX0, y, 2.33, 1.56, WHITE, c_)
    box(s, FX0, y, 0.34, 1.56, c_, None, [q], 8, True, WHITE, "c", "m", radius=0.06)
    text(s, FX0 + 0.4, y + 0.08, 1.9, 1.45, [[("■ ", {"color": c_, "size": 6}), t] for t in items], 7.4, False, INK, line=1.0, space=4)
    arrow(s, EX + 2.35, y + 0.78, FX0, y + 0.78, c_, 1.6)
# Q1 features sit under the data ops column, roles under the features
box(s, DX + 1.72, 5.9, 1.7, 0.7, TINT[BLUE], BLUE, [[("Q1", {"bold": True, "color": BLUE, "size": 8}), ("  Ingestion wizard, Knowledge Studio, quality register, approval, audit", {"size": 6.8, "color": INK})]], 7, False, INK, "l", "m", radius=0.07, margin=0.07)
text(s, FX0, 6.4, 2.33, 0.2, "Roles served", 7, True, NAVY)
for i, (t, ic) in enumerate([("Operator", "user"), ("Maint.", "wrench"), ("Reliab.", "chart"), ("Eng.", "gear"), ("HSE", "shield"), ("Mgmt", "users")]):
    pic(s, ic, FX0 + i * 0.39 + 0.05, 6.6, 0.24, NAVY)
notes(s, "Solution. Left: the main problem, the objective in three verbs and the three key questions. Centre: the system as one connected figure. Sources on the left feed TAGLINK, which ingests with Gemini, structures facts on the equipment tag, checks for conflicts and routes everything through approval. The knowledge database holds passages with a search index, typed facts and relations, operating records, knowledge items and the audit log. Three engines read from it: VERA for verified answers with Gemini 2.5 Flash and 20 computed tools, FORESIGHT for failure memory and reliability, SAFEWORK for hazards, readiness and planning. The features on the right map to Q1, Q2 and Q3. Approved lessons, feedback and answers flow back into the database.")
