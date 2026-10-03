# ======================================================= 1 COVER
s = blank(prs)
box(s, 0, 0, 13.333, 7.5, "F4F7FB", None, None, shape=MSO_SHAPE.RECTANGLE)
box(s, 0, 0, 7.2, 7.5, NAVY, None, None, shape=MSO_SHAPE.RECTANGLE)
box(s, 0, 0, 0.18, 7.5, TEAL, None, None, shape=MSO_SHAPE.RECTANGLE)
text(s, 0.7, 0.65, 6.3, 0.3, "CALIBER 2026  |  BUSINESS PROPOSAL  |  PRELIMINARY STAGE", 10.5, True, "8FD3CC")
text(s, 0.7, 1.3, 6.4, 1.6, ["Asset Knowledge", "Platform"], 46, True, WHITE, line=1.0)
text(s, 0.7, 2.95, 6.1, 1.2, "An AI-enabled Manufacturing Knowledge Hub that unifies plant knowledge in one governed source, answers engineering questions with verifiable evidence, and turns maintenance history into operational decisions.", 15, False, "DCE8F5", line=1.15)
chip(s, 0.7, 4.3, 5.9, 0.5, "Chosen use case: Case 1, Manufacturing Knowledge Hub", "1E4C7A", WHITE, 11.5, True)
for i, (n_, l_) in enumerate([("98", "documents unified"), ("1,109", "searchable passages"), ("20", "computed AI tools"), ("128/128", "evaluation questions passed")]):
    x = 0.7 + i * 1.62
    text(s, x, 5.05, 1.55, 0.5, n_, 24, True, "8FD3CC")
    text(s, x, 5.55, 1.55, 0.4, l_, 9.5, False, "B9CBE0")
text(s, 0.7, 6.3, 6.3, 0.9, [[("Team: ", {"bold": True, "color": "8FD3CC"}), "[Team name]"], [("University: ", {"bold": True, "color": "8FD3CC"}), "[University]    ", ("Supervisor: ", {"bold": True, "color": "8FD3CC"}), "[Supervisor name]"]], 11.5, False, WHITE, space=4)
for nm, x, y, w in [("dashboard", 7.75, 0.75, 5.1), ("assistant", 7.45, 3.65, 5.1)]:
    h = w * 0.612
    box(s, x + 0.07, y + 0.07, w, h, "D5DEE9", None, None, shape=MSO_SHAPE.RECTANGLE)
    image(s, IMG(nm), x, y, w, h)
text(s, 7.45, 6.85, 5.5, 0.4, "Working prototype built on the case baseline data, with a 3-minute demonstration video", 9.5, False, GREY)
notes(s, "Cover. Team name, university and the chosen use case: Case 1, Manufacturing Knowledge Hub. The platform unifies plant knowledge, answers with verifiable evidence and turns maintenance history into operational decisions.")

# ======================================================= 2 BACKGROUND AND PROBLEM
s = blank(prs)
frame(s, 2, "Problem Analysis: {{Fragmented and Unverified Knowledge}} Is the Systemic Cause of Improper Execution Risk",
      "A petrochemical plant depends on correct procedures, current drawings and past lessons; today these cannot be found, trusted or connected quickly", "Background",
      "CALIBER 2026 case book (Case 1); baseline data analysed in the prototype (8 equipment sets, LLDPE unit, June 2024 to December 2025)", "Problem Identification")
LX, LW = 0.35, 3.6
banner(s, LX, 1.5, LW, "Evidence from the baseline data", NAVY)
tiles = [("98", "source documents in 8 formats, held in separate repositories", BLUE, "doc"), ("48", "conflicts and gaps between drawings, datasheets and interlock logic", RED, "warn"),
         ("211", f"work orders in {D['years']} years with no link to procedures or drawings", BLUE, "list"), (f"{D['bd']}", f"breakdowns, causing {D['dt']} h of downtime", ORANGE, "clock"),
         (f"IDR {D['cost']:.0f} M", f"maintenance cost, of which {D['corr_share']}% corrective", ORANGE, "chart"), (f"{D['found']*100//(D['found']+D['bad'])}%", "of faults detected before they became corrective work", RED, "search")]
for i, (n_, l_, c_, ic) in enumerate(tiles):
    stat(s, LX + (i % 2) * 1.83, 1.92 + (i // 2) * 1.52, 1.79, 1.46, n_, l_, c_, ic, 20 if len(n_) < 6 else 15)
# problem tree
TX = 4.15
cols = [("Problem statement", TX, 2.2, NAVY), ("Sub-problems", TX + 2.35, 2.2, "27517F"), ("Root causes", TX + 4.7, 2.6, BLUE), ("Engines", TX + 7.45, 1.4, TEAL)]
for t, x, w_, c_ in cols: banner(s, x, 1.5, w_, t, c_, 0.34, 10.5)
box(s, TX, 1.92, 2.2, 3.6, WHITE, NAVY, [[("How can the plant connect scattered knowledge into one trusted, traceable source that engineers can use to execute, troubleshoot and improve operations without improper execution?", {"bold": True, "size": 10.5, "color": NAVY})]], 10.5, True, NAVY, "c", "m", radius=0.04, lw=1.75, margin=0.12)
subs = [("Knowledge is scattered and unstructured", ["SOPs, datasheets, P&IDs, EDMS, AIMS and logs sit in separate systems", "No common asset key links a drawing, a procedure and a work order"], ("TAGLINK", "Industrial Data Ops", BLUE)),
        ("Answers are slow to find and cannot be verified", ["Revision and approval status are not visible at the point of use", "Conflicting documents go unnoticed (48 found)", "Tacit expertise is held by a few senior engineers"], ("VERA", "Verified answers", TEAL)),
        ("History is not used to guide action", ["Work orders, RCA and lessons are not matched to new faults", "Hazard, permit and readiness checks are separate from the asset context"], ("FORESIGHT SAFEWORK", "Decision support", ORANGE))]
y = 1.92; heights = [1.08, 1.4, 1.08]
for (t, rc, (en, ed, ec)), hgt in zip(subs, heights):
    box(s, TX + 2.35, y, 2.2, hgt, WHITE, "27517F", [t], 10, True, NAVY, "c", "m", radius=0.04, lw=1.25, margin=0.1)
    n = len(rc); rh = (hgt - 0.06 * (n - 1)) / n
    for j, r_ in enumerate(rc):
        ry = y + j * (rh + 0.06)
        box(s, TX + 4.7, ry, 2.6, rh, TINT[BLUE], BLUE, [r_], 8.5, False, INK, "c", "m", radius=0.04, lw=0.75, margin=0.08)
        arrow(s, TX + 4.55, y + hgt / 2, TX + 4.7, ry + rh / 2, GREY, 1.0, False)
    arrow(s, TX + 2.2, 3.72, TX + 2.35, y + hgt / 2, GREY, 1.0, False)
    arrow(s, TX + 7.3, y + hgt / 2, TX + 7.45, y + hgt / 2, GREY, 1.5)
    box(s, TX + 7.45, y, 1.4, hgt, ec, None, [[(en.split()[0], {"bold": True, "size": 10.5, "color": WHITE})]] + ([[(en.split()[1], {"bold": True, "size": 10.5, "color": WHITE})]] if len(en.split()) > 1 else []) + [[(ed, {"size": 8.5, "color": WHITE})]], 9, True, WHITE, "c", "m", radius=0.06, margin=0.05)
    y += hgt + 0.06
# stakeholders and example
banner(s, TX, 5.62, 8.85, "Stakeholders affected", NAVY, 0.28, 9.5, "l")
who = [("Operations", "step and set point mid-shift", "user"), ("Maintenance", "past failures, right part", "wrench"), ("Reliability", "repeat failures, root cause", "chart"), ("Process eng.", "limits, design basis", "gear"), ("HSE", "hazards and permits per asset", "shield"), ("Management", "one consistent answer", "users")]
for i, (t, d, ic) in enumerate(who):
    x = TX + i * 1.48
    panel(s, x, 5.93, 1.43, 0.52, LIGHT, MID); pic(s, ic, x + 0.05, 6.02, 0.32, TEAL)
    text(s, x + 0.4, 5.93, 1.02, 0.25, t, 7.8, True, NAVY, anchor="m", line=0.95); text(s, x + 0.4, 6.15, 1.02, 0.3, d, 6.8, False, GREY, line=0.95)
box(s, TX, 6.5, 8.85, 0.34, "FFF6E5", "F0C27B", [[("Illustrative conflict:  ", {"bold": True, "color": ORANGE}), "valve FV-2302 is labelled both \"trips OPEN\" and \"trips CLOSED\"; one sheet is titled KA-4501 while its body states KC-4501."]], 8.5, False, INK, "l", "m", radius=0.06, margin=0.1)
notes(s, "Problem analysis. The case book describes scattered sources, missing tacit knowledge and disconnected data. We loaded the baseline data and measured it: 98 documents in 8 formats, 48 conflicts between them, 211 work orders, 31 breakdowns with 434 hours of downtime, IDR 538 million of maintenance cost of which 82 percent corrective, and only 21 percent of faults found before they became corrective work. The problem tree maps one problem statement to three sub-problems, their root causes and the four engines of the platform that address them.")

# ======================================================= 3 SOLUTION
s = blank(prs)
frame(s, 3, "Solution: {{Asset Knowledge Platform}} Connects Plant Knowledge, Verifies Every Answer and Puts Lessons to Work",
      "Three layers answer the three key questions of the case (Q1, Q2, Q3); four engines run on one tag-keyed knowledge core", "Solution",
      "Prototype built on the case baseline data; counts and parameters are taken from the running application", "Proposed Solution")
LX, LW = 0.35, 2.85
banner(s, LX, 1.5, LW, "Main problem", NAVY)
panel(s, LX, 1.87, LW, 1.1, TINT[RED], "F0C4C4")
text(s, LX + 0.1, 1.88, 1.0, 0.6, "48", 28, True, RED); text(s, LX + 1.0, 1.93, 1.8, 0.5, "conflicts across 98 plant documents", 9.5, True, NAVY, line=1.0)
text(s, LX + 0.1, 2.45, LW - 0.2, 0.5, "No single source that engineers can trust, so they search, ask colleagues or guess.", 8.8, False, INK, line=1.02)
banner(s, LX, 3.06, LW, "Objective", NAVY)
obj = [("Connect", "scattered knowledge in one governed, tag-keyed base", BLUE), ("Verify", "every answer with source, revision, status and confidence", TEAL), ("Act", "on failure memory, risk and hazards in daily work", ORANGE)]
for i, (t, d, c_) in enumerate(obj):
    y = 3.44 + i * 0.74
    numdot(s, LX, y + 0.08, i + 1, c_, 0.34, 11)
    text(s, LX + 0.42, y, LW - 0.45, 0.7, [[(t + ": ", {"bold": True, "color": c_}), d]], 9.3, False, INK, line=1.02)
banner(s, LX, 5.72, LW, "Implications", NAVY)
imp = [("Engineers", [("Search time", "down"), ("Wrong steps", "down")]), ("Plant", [("Reliability", "up"), ("Late start-up", "down")])]
for i, (who_, it) in enumerate(imp):
    y = 6.1 + i * 0.4
    text(s, LX, y, 0.85, 0.34, who_, 9.5, True, NAVY, anchor="m")
    for j, (t, dr) in enumerate(it):
        box(s, LX + 0.85 + j * 1.0, y + 0.02, 0.98, 0.3, TINT[GREEN], None, [[("▲ " if dr == "up" else "▼ ", {"color": GREEN, "size": 8, "bold": True}), (t, {"size": 7.5, "bold": True, "color": INK})]], 8, True, INK, "c", "m", radius=0.15, margin=0.02)
CX = 3.4; CW = 3.1; CG = 0.12
cols = [("CONNECT", "Industrial Data Ops", BLUE, "Q1"), ("ASK", "Verified answers", TEAL, "Q2"), ("ACT", "Decision support", ORANGE, "Q3")]
for i, (a, b, c_, q) in enumerate(cols):
    x = CX + i * (CW + CG)
    chev(s, x, 1.5, CW + 0.05, 0.46, a, b, c_)
    pill(s, x + CW - 0.5, 1.55, 0.4, q, WHITE, c_, 0.22, 8.5)
engines = ["TAGLINK engine", "VERA engine", "FORESIGHT and SAFEWORK engines"]
for i, t in enumerate(engines):
    text(s, CX + i * (CW + CG), 1.98, CW, 0.22, t, 9, True, [BLUE, TEAL, ORANGE][i], "c")
SY = 2.28; PHT = 0.98
def sec(x, k, n, label, c_, fill=WHITE, line=MID):
    y = SY + k * 1.3
    section_head(s, x, y, CW, n, label, c_); panel(s, x, y + 0.3, CW, PHT, fill, line); return y + 0.3
def algo(x, p0, t, c_):
    text(s, x + 0.08, p0 + 0.6, CW - 0.16, 0.38, [[("Algorithm: ", {"bold": True, "color": c_}), t]], 7.1, False, INK, line=0.98)
# column 1
x = CX; p0 = sec(x, 0, 1, "AI-assisted ingestion", BLUE)
kinds = ["SOP", "Datasheet", "P&ID", "Interlock C&E", "Maint. log", "Incident / RCA", "OPL"]
cx_, cy_ = x + 0.08, p0 + 0.05
for k in kinds:
    w_ = 0.2 + 0.062 * len(k)
    if cx_ + w_ > x + CW - 0.05: cx_ = x + 0.08; cy_ += 0.24
    pill(s, cx_, cy_, w_, k, TINT[BLUE], BLUE, 0.21, 7.5); cx_ += w_ + 0.05
algo(x, p0, "schema-constrained LLM extraction; each value must quote its source or it is dropped; secrets masked", BLUE)
p0 = sec(x, 1, 2, "Tag-keyed data model", BLUE)
cym = p0 + 0.28
box(s, x + 0.1, cym - 0.17, 0.95, 0.34, BLUE, None, ["GA-1201A"], 8.5, True, WHITE, "c", "m", radius=0.17)
for sx, dy, lab, sw in [(1.3, -0.12, "SOP rev 3", 0.74), (1.3, 0.14, "P&ID", 0.74), (2.12, -0.12, "6 work orders", 0.9), (2.12, 0.14, "OPL lesson", 0.9)]:
    arrow(s, x + 1.05, cym, x + sx - 0.02, cym + dy, GREY, 0.9, False)
    pill(s, x + sx, cym + dy - 0.09, sw, lab, TINT[BLUE], NAVY, 0.18, 6.8)
algo(x, p0, "1,109 passages, typed facts and relations joined on the equipment tag; chunk hash and canonical status", BLUE)
p0 = sec(x, 2, 3, "Quality gates and approval", BLUE)
for j, (t, c_) in enumerate([("Draft", GREY), ("In review", AMBER), ("Approved", GREEN)]):
    pill(s, x + 0.1 + j * 0.98, p0 + 0.06, 0.88, t, TINT.get(c_, LIGHT), c_ if c_ != AMBER else ORANGE, 0.22, 8)
    if j < 2: arrow(s, x + 0.1 + j * 0.98 + 0.88, p0 + 0.17, x + 0.1 + (j + 1) * 0.98, p0 + 0.17, GREY, 1.0)
algo(x, p0, "rule-based conflict detection (48 found); status trust weights from 1.00 (approved) to 0.35 (superseded)", BLUE)
# column 2
x = CX + CW + CG; p0 = sec(x, 0, 1, "Intent routing", TEAL)
box(s, x + 0.1, p0 + 0.05, CW - 0.2, 0.46, TINT[TEAL], None, ["\"What must be healthy before pump GA-1201A can start?\""], 8.3, False, INK, "l", "m", radius=0.12, margin=0.1)
algo(x, p0, "intent classifier sends the question to one of 20 computed tools or to evidence retrieval", TEAL)
p0 = sec(x, 1, 2, "Hybrid retrieval", TEAL)
for j, (t, ic) in enumerate([("Keyword", "search"), ("Meaning", "ai"), ("Trust, scope", "shield")]):
    xx = x + 0.1 + j * 1.0
    pic(s, ic, xx + 0.33, p0 + 0.03, 0.3, TEAL)
    text(s, xx, p0 + 0.34, 0.98, 0.2, t, 7, True, NAVY, "c", line=0.95)
algo(x, p0, "k1 1.4, b 0.75; tag, status, equipment and role weighting; embedding fusion when connected", TEAL)
p0 = sec(x, 2, 3, "Verified answer", TEAL, WHITE, TEAL)
text(s, x + 0.1, p0 + 0.02, CW - 0.2, 0.3, "4 permissives: suction valve open, seal flush dP above 1.5 bar, min-flow valve open, no active trip [1]", 7.3, False, INK, line=0.98)
for j, (t, c_) in enumerate([("SEQ-1201 Rev 3", NAVY), ("Issued for Operation", GREEN), ("Confidence 85%", TEAL)]):
    pill(s, x + 0.08 + [0, 0.93, 2.0][j], p0 + 0.41, [0.9, 1.05, 0.88][j], t, TINT[c_], c_, 0.18, 6.6)
algo(x, p0 + 0.0, "weighted evidence score; numbers and quotes checked against sources; bypass requests refused", TEAL)
# column 3
x = CX + 2 * (CW + CG); p0 = sec(x, 0, 1, "Failure memory", ORANGE)
for j, (a_, b_) in enumerate([("WO-240088", "Crosshead vibration, KC-4501"), ("Cause", "Pin clearance excessive"), ("Action", "Renewed pin and bush, set clearance")]):
    pill(s, x + 0.1, p0 + 0.04 + j * 0.2, 0.8, a_, TINT[ORANGE], ORANGE, 0.17, 6.8); text(s, x + 0.95, p0 + 0.03 + j * 0.2, CW - 1.05, 0.19, b_, 7.6, False, INK, anchor="m")
algo(x, p0, "similar failures retrieved by symptom and cause overlap; recurrence within 90 days counted", ORANGE)
p0 = sec(x, 1, 2, "Reliability and readiness", ORANGE)
for j, (t, v, c_) in enumerate([("Seal or gasket leak", 0.9, RED), ("Valve or actuator", 0.62, ORANGE), ("Bearing, lubrication", 0.45, AMBER)]):
    text(s, x + 0.1, p0 + 0.02 + j * 0.17, 1.25, 0.17, t, 7, False, INK, anchor="m")
    box(s, x + 1.4, p0 + 0.06 + j * 0.17, 1.3 * v, 0.08, c_, None, None, radius=0.04)
algo(x, p0, "failure-mode RPN; gamma-Poisson 90-day forecast with ranges; backtested score; GO / NO-GO", ORANGE)
p0 = sec(x, 2, 3, "Planning and integration", ORANGE)
for j, t in enumerate(["EDMS", "AIMS", "Digital twin", "Historian"]):
    pill(s, x + 0.1 + j * 0.74, p0 + 0.05, 0.7, t, TINT[AMBER], ORANGE, 0.2, 7.5)
algo(x, p0, "permit-aware four-week plan with clash rules; hazard screening models; read-only system links", ORANGE)
panel(s, CX, 6.24, 3 * CW + 2 * CG, 0.6, LIGHT, MID)
text(s, CX + 0.1, 6.25, 2.0, 0.18, "CORE TECHNOLOGIES", 7.5, True, GREY)
techs = [("search", "BM25F + embeddings"), ("ai", "LLM with tool calling"), ("net", "Typed fact graph"), ("chart", "Bayesian forecasting"), ("flame", "Hazard screening models"), ("cloud", "Serverless, Postgres next")]
for j, (ic, t) in enumerate(techs):
    xx = CX + 0.1 + j * 1.58
    pic(s, ic, xx, 6.44, 0.32, NAVY)
    text(s, xx + 0.38, 6.43, 1.15, 0.34, t, 8, True, NAVY, anchor="m", line=0.95)
notes(s, "Solution. Left: the main problem, the objective in three verbs and the implications. Right: three layers that map to the three key questions. Connect is the Industrial Data Ops foundation (TAGLINK): schema-constrained AI ingestion, a tag-keyed data model and approval with quality gates. Ask (VERA): intent routing, hybrid retrieval and a verified answer with source, revision, status and a confidence score. Act (FORESIGHT and SAFEWORK): failure memory, reliability analytics with a backtested score, readiness checks, hazard screening and permit-aware planning. Each section states the algorithm used. Details are in appendix A3 to A10.")
