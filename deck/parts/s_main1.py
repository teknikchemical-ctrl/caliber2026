# ======================================================= 1 COVER
s = blank(prs)
box(s, 0, 0, 13.333, 7.5, "F4F7FB", None, None, shape=MSO_SHAPE.RECTANGLE)
box(s, 0, 0, 7.2, 7.5, NAVY, None, None, shape=MSO_SHAPE.RECTANGLE)
box(s, 0, 0, 0.18, 7.5, TEAL, None, None, shape=MSO_SHAPE.RECTANGLE)
text(s, 0.7, 0.65, 6.3, 0.3, "CALIBER 2026  |  BUSINESS PROPOSAL  |  PRELIMINARY STAGE", 10.5, True, "8FD3CC")
text(s, 0.7, 1.35, 6.4, 1.6, ["Asset Knowledge", "Platform"], 46, True, WHITE, line=1.0)
text(s, 0.7, 3.05, 6.1, 1.0, "One trusted, traceable knowledge hub for the plant, with an AI assistant that shows its sources, and knowledge that is put to work in daily decisions.", 16, False, "DCE8F5", line=1.15)
chip(s, 0.7, 4.25, 5.9, 0.5, "Chosen use case: Case 1, Manufacturing Knowledge Hub", "1E4C7A", WHITE, 11.5, True)
for i, (n_, l_) in enumerate([("98", "documents joined"), ("211", "work orders read"), ("20", "computed AI tools"), ("128/128", "test questions passed")]):
    x = 0.7 + i * 1.62
    text(s, x, 5.0, 1.55, 0.5, n_, 24, True, "8FD3CC")
    text(s, x, 5.5, 1.55, 0.4, l_, 9.5, False, "B9CBE0")
text(s, 0.7, 6.25, 6.3, 0.9, [[("Team: ", {"bold": True, "color": "8FD3CC"}), "[Team name]"], [("University: ", {"bold": True, "color": "8FD3CC"}), "[University]    ", ("Supervisor: ", {"bold": True, "color": "8FD3CC"}), "[Supervisor name]"]], 11.5, False, WHITE, space=4)
# right: product shots
for nm, x, y, w in [("dashboard", 7.75, 0.75, 5.1), ("assistant", 7.45, 3.65, 5.1)]:
    h = w * 0.612
    box(s, x + 0.07, y + 0.07, w, h, "D5DEE9", None, None, shape=MSO_SHAPE.RECTANGLE)
    image(s, IMG(nm), x, y, w, h)
text(s, 7.45, 6.85, 5.5, 0.4, "Working prototype with the case data loaded, a 3-minute demo video and this deck", 9.5, False, GREY)
notes(s, "Cover. Name the team, the university and the chosen use case: Case 1, Manufacturing Knowledge Hub. One sentence: we built a working knowledge hub for the LLDPE unit that answers engineers' questions with sources, versions and a confidence level, and puts failure memory, prediction and hazard tools in the same place.")

# ======================================================= 2 BACKGROUND AND PROBLEM
s = blank(prs)
frame(s, 2, "Engineers cannot find one verified, current answer fast, so routine work turns into execution risk",
      "Background and problem statement: the case describes it, and the baseline data confirms it", "Background",
      "CALIBER 2026 case book (Case 1); baseline data analysed in the prototype (8 equipment sets, LLDPE unit, Jun 2024 to Dec 2025)")
# left: numbers
LX, LW = 0.35, 3.62
banner(s, LX, 1.45, LW, "The problem in the case data", NAVY)
tiles = [("98", "source documents in 8 formats, none linked to each other", BLUE, "doc"), ("48", "conflicts and gaps between drawings, sheets and logic", RED, "warn"),
         ("211", f"work orders in {D['years']} years, kept as separate records", BLUE, "list"), (f"{D['bd']}", f"breakdowns, {D['dt']} h of downtime", ORANGE, "clock"),
         (f"IDR {D['cost']:.0f} M", f"maintenance cost, {D['corr_share']}% of it corrective", ORANGE, "money" if False else "chart"), (f"{D['found']*100//(D['found']+D['bad'])}%", "of faults found early, before they became a corrective job", RED, "search")]
for i, (n_, l_, c_, ic) in enumerate(tiles):
    stat(s, LX + (i % 2) * 1.83, 1.88 + (i // 2) * 1.5, 1.79, 1.44, n_, l_, c_, ic, 20 if len(n_) < 6 else 15)
# middle: causal chain
MX = 4.15
banner(s, MX, 1.45, 5.55, "How scattered knowledge becomes execution risk", NAVY)
text(s, MX, 1.84, 2.5, 0.25, "ROOT CAUSES", 9, True, GREY)
text(s, MX + 3.05, 1.84, 2.5, 0.25, "WHAT HAPPENS IN THE PLANT", 9, True, GREY)
causes = [("Scattered sources", "SOPs, datasheets, P&IDs, EDMS, AIMS and logs sit in different systems", "net"),
          ("Missing tacit knowledge", "Why a trip happens or a workaround works stays with senior people", "user"),
          ("Conflicting documents", "A correct-looking answer can be the wrong revision", "doc"),
          ("Disconnected data", "A work order, a trip and a drawing for one tag are never read together", "link")]
effects = [("Longer troubleshooting", "time lost searching and asking", "clock"), ("Repeated engineering rework", "same fault, same investigation", "refresh"),
           ("Higher safety risk", "wrong step, valve position or set point", "warn"), ("Delayed start-up", "Process, Maintenance and HSE read different truths", "flame")]
for i in range(4):
    y = 2.12 + i * 0.86
    t, d, ic = causes[i]
    panel(s, MX, y, 2.62, 0.78, LIGHT, MID); pic(s, ic, MX + 0.08, y + 0.18, 0.42, BLUE)
    text(s, MX + 0.55, y + 0.03, 2.05, 0.25, t, 9.5, True, NAVY, line=1.0); text(s, MX + 0.55, y + 0.29, 2.05, 0.5, d, 8, False, INK, line=1.0)
    t, d, ic = effects[i]
    panel(s, MX + 2.93, y, 2.62, 0.78, TINT[RED], "F0C4C4"); pic(s, ic, MX + 3.0, y + 0.18, 0.42, RED)
    text(s, MX + 3.47, y + 0.03, 2.05, 0.25, t, 9.5, True, NAVY, line=1.0); text(s, MX + 3.47, y + 0.29, 2.05, 0.5, d, 8, False, INK, line=1.0)
box(s, MX + 2.64, 3.3, 0.28, 0.9, AMBER, None, None, shape=MSO_SHAPE.RIGHT_ARROW)
box(s, MX, 5.62, 5.55, 0.86, "FFF6E5", "F0C27B", [[("Real example from the case drawings.  ", {"bold": True, "color": ORANGE}), "Valve FV-2302 is labelled both \"trips OPEN\" and \"trips CLOSED\", and one sheet is titled KA-4501 while its body says KC-4501. An engineer who trusts the wrong one acts on the wrong valve position."]], 9.5, False, INK, "l", "m", radius=0.08, margin=0.12)
# right: who
RX = 9.9
banner(s, RX, 1.45, 3.1, "Who is affected", NAVY)
who = [("Operators", "need the exact step and set point mid-shift", "user"), ("Maintenance technicians", "need past failures and the right part first time", "wrench"), ("Reliability engineers", "need repeat failures and root causes in one place", "chart"),
       ("Process engineers", "need trusted limits and design basis", "gear"), ("HSE officers", "need hazards and permits tied to the asset", "shield"), ("Supervisors, managers", "need one answer, not three reports", "users")]
for i, (t, d, ic) in enumerate(who):
    y = 1.88 + i * 0.76
    panel(s, RX, y, 3.1, 0.7); pic(s, ic, RX + 0.09, y + 0.15, 0.4, TEAL)
    text(s, RX + 0.58, y + 0.04, 2.5, 0.24, t, 9.5, True, NAVY); text(s, RX + 0.58, y + 0.29, 2.5, 0.4, d, 8.3, False, INK, line=1.0)
box(s, 0.35, 6.54, 12.65, 0.34, NAVY, None, ["Problem statement:  scattered, partly conflicting plant knowledge makes engineers search, ask around or guess, which is how improper execution happens."], 10.5, True, WHITE, "c", "m", radius=0.06)
notes(s, "Problem. The case describes scattered sources, missing tacit knowledge and disconnected data. We loaded the case data and measured it: 98 documents, 48 conflicts between them, 211 work orders, 31 breakdowns with 434 hours of downtime and IDR 538 million of maintenance cost, of which 82 percent was corrective. Only 21 percent of faults (17 of 80) were found before they became a corrective job. The example on the slide is real: FV-2302 is labelled both trips open and trips closed. Six user groups feel it. The consequence chain on the right of the arrow is exactly what the case book lists.")

# ======================================================= 3 SOLUTION
s = blank(prs)
frame(s, 3, "Asset Knowledge Platform: connect the sources, answer with proof, and put the knowledge to work",
      "Solution: objective, workflow and key technologies. It answers the three key questions of the case (Q1, Q2, Q3)", "Solution",
      "Prototype built on the case baseline data; counts from the running application")
# left column: main problem, objective, implications
LX, LW = 0.35, 2.85
banner(s, LX, 1.45, LW, "Main problem", NAVY)
panel(s, LX, 1.82, LW, 1.12, TINT[RED], "F0C4C4")
text(s, LX + 0.1, 1.85, 1.0, 0.6, "48", 28, True, RED); text(s, LX + 1.0, 1.9, 1.8, 0.5, "conflicts across 98 plant documents", 9.5, True, NAVY, line=1.0)
text(s, LX + 0.1, 2.45, LW - 0.2, 0.5, "No single place engineers can trust, so they search, ask or guess.", 9, False, INK, line=1.02)
banner(s, LX, 3.04, LW, "Objective", NAVY)
obj = [("Connect", "scattered knowledge into one tag-keyed, governed base", BLUE), ("Answer", "with source, version, status and confidence", TEAL), ("Act", "use failure memory, prediction and hazards in daily work", ORANGE)]
for i, (t, d, c_) in enumerate(obj):
    y = 3.42 + i * 0.76
    numdot(s, LX, y + 0.08, i + 1, c_, 0.34, 11)
    text(s, LX + 0.42, y, LW - 0.45, 0.72, [[(t + " ", {"bold": True, "color": c_}), d]], 9.5, False, INK, line=1.02)
banner(s, LX, 5.72, LW, "Implications", NAVY)
imp = [("Engineers", [("Search time", "down"), ("Wrong steps", "down")]), ("Plant", [("Reliability", "up"), ("Late start-up", "down")])]
for i, (who_, it) in enumerate(imp):
    y = 6.1 + i * 0.4
    text(s, LX, y, 0.85, 0.34, who_, 9.5, True, NAVY, anchor="m")
    for j, (t, dr) in enumerate(it):
        c_ = GREEN if (dr == "up" and t == "Reliability") or dr == "down" else RED
        box(s, LX + 0.85 + j * 1.0, y + 0.02, 0.98, 0.3, TINT[GREEN], None, [[("▲ " if dr == "up" else "▼ ", {"color": GREEN, "size": 8, "bold": True}), (t, {"size": 8, "bold": True, "color": INK})]], 8, True, INK, "c", "m", radius=0.15, margin=0.02)
# three programme columns
CX = 3.4; CW = 3.1; CG = 0.12
cols = [("CONNECT", "Industrial Data Ops", BLUE, "Q1"), ("ASK", "Trusted answers", TEAL, "Q2"), ("ACT", "Active knowledge", ORANGE, "Q3")]
for i, (a, b, c_, q) in enumerate(cols):
    x = CX + i * (CW + CG)
    chev(s, x, 1.45, CW + 0.05, 0.46, a, b, c_)
    pill(s, x + CW - 0.5, 1.5, 0.4, q, WHITE, c_, 0.22, 8.5)
subs = ["Build one structured, connected knowledge base from every plant source", "Help engineers find trusted answers fast and avoid improper execution", "Give reliability, troubleshooting and improvement active decision support"]
for i, t in enumerate(subs):
    x = CX + i * (CW + CG)
    dash_box(s, x, 1.98, CW, 0.5, [t], 8.8, "c")
SY = 2.55; PHT = 0.86
def sec(x, k, n, label, c_, fill=WHITE, line=MID):
    y = SY + k * 1.2
    section_head(s, x, y, CW, n, label, c_); panel(s, x, y + 0.3, CW, PHT, fill, line); return y + 0.3
# column 1 ---------------------------------------------------------------
x = CX; p0 = sec(x, 0, 1, "Ingest every source", BLUE)
kinds = ["SOP", "Datasheet", "P&ID", "Interlock C&E", "Maint. log", "Incident / RCA", "OPL"]
cx_, cy_ = x + 0.08, p0 + 0.07
for k in kinds:
    w_ = 0.2 + 0.062 * len(k)
    if cx_ + w_ > x + CW - 0.05: cx_ = x + 0.08; cy_ += 0.27
    pill(s, cx_, cy_, w_, k, TINT[BLUE], BLUE, 0.23, 8); cx_ += w_ + 0.05
text(s, x + 0.08, p0 + 0.6, CW - 0.16, 0.24, "AI reads each file and pulls out tags, steps and limits", 8.3, False, GREY)
p0 = sec(x, 1, 2, "Join them on the equipment tag", BLUE)
cym = p0 + PHT / 2
box(s, x + 0.1, cym - 0.2, 1.0, 0.4, BLUE, None, ["GA-1201A"], 9, True, WHITE, "c", "m", radius=0.2)
for sx, dy, lab, sw in [(1.35, -0.2, "SOP rev 3", 0.78), (1.35, 0.2, "P&ID", 0.78), (2.2, -0.2, "6 work orders", 0.8), (2.2, 0.2, "OPL lesson", 0.8)]:
    arrow(s, x + 1.1, cym, x + sx - 0.02, cym + dy, GREY, 1.0, False)
    pill(s, x + sx, cym + dy - 0.11, sw, lab, TINT[BLUE], NAVY, 0.22, 7.2)
p0 = sec(x, 2, 3, "Check, approve, govern", BLUE)
for j, (t, c_) in enumerate([("Draft", GREY), ("In review", AMBER), ("Approved", GREEN)]):
    pill(s, x + 0.1 + j * 0.98, p0 + 0.08, 0.88, t, TINT.get(c_, LIGHT), c_ if c_ != AMBER else ORANGE, 0.24, 8.5)
    if j < 2: arrow(s, x + 0.1 + j * 0.98 + 0.88, p0 + 0.2, x + 0.1 + (j + 1) * 0.98, p0 + 0.2, GREY, 1.0)
text(s, x + 0.1, p0 + 0.37, CW - 0.2, 0.46, [[("48 conflicts ", {"bold": True, "color": RED}), "found on day one, each with an owner. Secrets masked, access by role."]], 8.3, False, INK, line=1.0)
# column 2 ---------------------------------------------------------------
x = CX + CW + CG; p0 = sec(x, 0, 1, "Ask in plain language", TEAL)
box(s, x + 0.1, p0 + 0.06, CW - 0.2, 0.5, TINT[TEAL], None, ["\"What must be healthy before the hexane feed pump GA-1201A can start?\""], 8.5, False, INK, "l", "m", radius=0.12, margin=0.1)
text(s, x + 0.1, p0 + 0.6, CW - 0.2, 0.24, "Role and equipment in view set the scope", 8.3, False, GREY)
p0 = sec(x, 1, 2, "Find and compute", TEAL)
for j, (t, ic) in enumerate([("Keyword + meaning search", "search"), ("20 computed tools", "gear"), ("Approved sources only", "shield")]):
    xx = x + 0.1 + j * 1.0
    pic(s, ic, xx + 0.32, p0 + 0.05, 0.34, TEAL)
    text(s, xx, p0 + 0.42, 0.98, 0.42, t, 7.8, True, NAVY, "c", line=0.98)
p0 = sec(x, 2, 3, "Answer with proof", TEAL, WHITE, TEAL)
text(s, x + 0.1, p0 + 0.03, CW - 0.2, 0.4, "4 permissives: suction valve open, seal flush dP above 1.5 bar, min-flow valve open, no active trip [1]", 8, False, INK, line=1.0)
for j, (t, c_) in enumerate([("SEQ-1201 Rev 3", NAVY), ("Issued for Operation", GREEN), ("Confidence 85%", TEAL)]):
    pill(s, x + 0.08 + [0, 0.93, 2.0][j], p0 + 0.45, [0.9, 1.05, 0.88][j], t, TINT[c_], c_, 0.2, 7)
text(s, x + 0.1, p0 + 0.67, CW - 0.2, 0.18, "No evidence, no answer. Interlock bypass refused.", 7.8, True, RED)
# column 3 ---------------------------------------------------------------
x = CX + 2 * (CW + CG); p0 = sec(x, 0, 1, "Learn from past failures", ORANGE)
for j, (a_, b_) in enumerate([("WO-240088", "Crosshead vibration"), ("RCA", "Pin clearance too wide"), ("Lesson", "OPL: check clearance at 6 months")]):
    pill(s, x + 0.1, p0 + 0.07 + j * 0.26, 0.8, a_, TINT[ORANGE], ORANGE, 0.21, 7.5); text(s, x + 0.95, p0 + 0.06 + j * 0.26, CW - 1.05, 0.23, b_, 8.2, False, INK, anchor="m")
p0 = sec(x, 1, 2, "Predict and prepare", ORANGE)
for j, (t, v, c_) in enumerate([("Seal or gasket leak", 0.9, RED), ("Valve or actuator", 0.62, ORANGE), ("Bearing, lubrication", 0.45, AMBER)]):
    text(s, x + 0.1, p0 + 0.04 + j * 0.2, 1.25, 0.2, t, 7.8, False, INK, anchor="m")
    box(s, x + 1.4, p0 + 0.09 + j * 0.2, 1.3 * v, 0.1, c_, None, None, radius=0.05)
text(s, x + 0.1, p0 + 0.65, CW - 0.2, 0.2, "Risk ranked; start-up readiness GO / NO-GO", 8, False, GREY)
p0 = sec(x, 2, 3, "Plug into plant systems", ORANGE)
for j, t in enumerate(["EDMS", "AIMS", "Digital twin", "Historian"]):
    pill(s, x + 0.1 + j * 0.74, p0 + 0.08, 0.7, t, TINT[AMBER], ORANGE, 0.24, 8)
text(s, x + 0.1, p0 + 0.38, CW - 0.2, 0.46, "Read-only links. Site planner, replay and hazard simulator use the same tag-keyed base.", 8.3, False, INK, line=1.0)
# technology strip
panel(s, CX, 6.2, 3 * CW + 2 * CG, 0.68, LIGHT, MID)
text(s, CX + 0.1, 6.21, 1.5, 0.2, "KEY TECHNOLOGIES", 8, True, GREY)
techs = [("search", "Hybrid retrieval", "keyword + meaning"), ("ai", "LLM + tool calls", "any provider"), ("net", "Tag-keyed facts", "typed links"), ("chart", "Reliability maths", "Weibull, Poisson"), ("cloud", "Serverless store", "Netlify, Postgres"), ("lock", "Governance", "roles, audit")]
for j, (ic, t, d) in enumerate(techs):
    xx = CX + 0.1 + j * 1.58
    pic(s, ic, xx, 6.43, 0.36, NAVY)
    text(s, xx + 0.4, 6.42, 1.15, 0.22, t, 8.3, True, NAVY); text(s, xx + 0.4, 6.63, 1.15, 0.22, d, 7.5, False, GREY)
notes(s, "Solution. Left: the problem, the objective in three verbs and what changes for engineers and the plant. Right: three columns that map to the three key questions of the case. Connect is the Industrial Data Ops foundation: ingest every source, join them on the equipment tag, check and approve. Ask is the assistant: plain-language question, hybrid search and 20 computed tools, an answer that always carries source, revision, approval status and confidence, and refuses to advise bypassing an interlock. Act is how the knowledge is used: failure memory with RCA and lessons, risk-ranked prediction and start-up readiness, and read-only links to EDMS, AIMS, the digital twin and the historian. The strip at the bottom lists the technologies.")
