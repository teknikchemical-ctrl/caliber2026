# ======================================================= 4 BUSINESS IMPACT
def _npv(r, cfs): return sum(c / (1 + r) ** i for i, c in enumerate(cfs))
def _irr(cfs):
    lo, hi = -0.9, 5.0
    for _ in range(200):
        mid = (lo + hi) / 2
        if _npv(mid, cfs) > 0: lo = mid
        else: hi = mid
    return mid
CF = [-A["one_off"], .6 * BASE[3] - A["run"], BASE[3] - A["run"], BASE[3] - A["run"]]
IRR = _irr(CF); NPV10 = _npv(.10, CF)
print("irr", round(IRR * 100, 1), "npv10", round(NPV10))
s = blank(prs)
Y1 = .6 * BASE[3] - A["run"]; Y2 = BASE[3] - A["run"]; REM = A["one_off"] - Y1
frame(s, 4, f"Business Impact: Each Feature Moves a Measured KPI, Worth {{{{IDR {BASE[3]/1000:.1f} B}}}} a Year in the Base Case With a {PB:.0f}-Month Payback",
      None, "Impact", "Case data: 211 work orders, 31 breakdowns over 1.52 years, MTTR 14.0 h. Assumptions (grey): users, minutes saved, rates, 10% repair-time reduction; Company figures replace them in the pilot", "Impact Assessment and Projection")
CX = [(0.4, 2.15, "Platform capability"), (2.85, 2.7, "KPI and where the number comes from"), (5.85, 3.65, "Simple calculation"), (9.8, 0.95, "IDR M")]
for x_, w_, t_ in CX: gbanner(s, x_, 1.28, w_, t_, NAVY, "27517F", 0.28, 9)
gbanner(s, 11.05, 1.28, 1.9, "Result", GREEN, "6CC48D", 0.28, 9)
rows4 = [("AI assistant", "engineer finds the procedure, drawing and past case in minutes", BLUE,
          "Search and verify time per engineer: 40 to 20 min a day", ("Assumption", "pilot logs replace it"),
          f"{A['users']} users x 20 min x {A['days']} days / 60 = {A['users']*20*A['days']/60:,.0f} h saved; x IDR {A['rate']:,} per h = IDR {BASE[0]:,.0f} M", f"{BASE[0]:,.0f}"),
         ("Failure memory, predictive checks", "known causes and fixes shown at the fault; repeat jobs flagged", TEAL,
          f"MTTR {D['mttr']:.1f} h to {D['mttr']*.9:.1f} h (10% less)", ("Case data", "211 WO; 10% assumed"),
          f"{D['bd_yr']} breakdowns a year (31 in 1.52 yr) x {D['mttr']:.1f} h x 10% = {D['bd_yr']*D['mttr']*.1:.1f} h; x IDR {A['down_h']:.0f} M per downtime hour = IDR {BASE[1]:,.0f} M", f"{BASE[1]:,.0f}"),
         ("Knowledge Studio, OPL lessons", "new engineers learn from approved lessons and the simulator", PURPLE,
          "New engineers productive one month sooner", ("Assumption", "HR data replaces it"),
          f"One month of reduced output for new joiners, set at IDR {BASE[2]:,.0f} M a year", f"{BASE[2]:,.0f}")]
ys4 = [2.06, 3.04, 4.02]
for (cap, chg, c_, kpi, (stag, snote), calc, val), cy in zip(rows4, ys4):
    box(s, 0.4, cy - 0.44, 2.15, 0.88, TINT[c_], c_, [[(cap, {"bold": True, "size": 10.5, "color": NAVY})], [(chg, {"size": 8.5, "color": INK})]], 10, False, INK, "c", "m", radius=0.08, lw=1.1, margin=0.06)
    arrow(s, 2.57, cy, 2.83, cy, c_, 1.6)
    scol = GREEN if stag == "Case data" else GREY
    box(s, 2.85, cy - 0.44, 2.7, 0.88, WHITE, c_, [[(kpi, {"bold": True, "size": 9.5, "color": NAVY})], [(stag + ": ", {"bold": True, "size": 8.5, "color": scol}), (snote, {"size": 8.5, "color": INK})]], 9, False, INK, "c", "m", radius=0.08, lw=1.1, margin=0.06)
    arrow(s, 5.57, cy, 5.83, cy, c_, 1.6)
    box(s, 5.85, cy - 0.44, 3.65, 0.88, WHITE, c_, [[(calc, {"size": 9, "color": INK})]], 9, False, INK, "c", "m", radius=0.08, lw=1.1, margin=0.08)
    arrow(s, 9.52, cy, 9.78, cy, c_, 1.6)
    box(s, 9.8, cy - 0.3, 0.95, 0.6, c_, None, [[(val, {"bold": True, "size": 15, "color": WHITE})]], 15, True, WHITE, "c", "m", radius=0.08, margin=0.02)
for (cap, kpi, calc), cy in zip([("Interlock guard, readiness, hazard view", "Improper executions: counted in the pilot", "Not valued: no case data on cost per incident"), ("Quality register, approvals", f"{D['issues']} conflicts owned, 90% closed", "Not valued: effect shows through the levers above")], [4.74, 5.28]):
    c_ = RED if "Interlock" in cap else ORANGE
    box(s, 0.4, cy - 0.22, 2.15, 0.44, TINT[c_], c_, [[(cap, {"bold": True, "size": 9, "color": NAVY})]], 9, False, INK, "c", "m", radius=0.08, lw=1.0, margin=0.05)
    arrow(s, 2.57, cy, 2.83, cy, c_, 1.4)
    box(s, 2.85, cy - 0.22, 2.7, 0.44, WHITE, c_, [[(kpi, {"size": 9, "color": INK})]], 9, False, INK, "c", "m", radius=0.08, lw=1.0, margin=0.05)
    arrow(s, 5.57, cy, 5.83, cy, c_, 1.4)
    box(s, 5.85, cy - 0.22, 3.65, 0.44, WHITE, c_, [[(calc, {"size": 9, "color": INK})]], 9, False, INK, "c", "m", radius=0.08, lw=1.0, margin=0.05)
    box(s, 9.8, cy - 0.22, 0.95, 0.44, GREY, None, [[("not valued", {"bold": True, "size": 9, "color": WHITE})]], 9, True, WHITE, "c", "m", radius=0.08, margin=0.02)
box(s, 10.77, 1.7, 0.03, 2.7, GREEN, None, None, shape=MSO_SHAPE.RECTANGLE)
for cy in ys4: arrow(s, 10.77, cy, 10.8, cy, GREEN, 1.6, False)
arrow(s, 10.8, 3.04, 11.05, 3.04, GREEN, 2.0)
box(s, 11.05, 1.7, 1.9, 3.35, GREEN, None, [[(f"IDR {BASE[3]:,.0f} M", {"bold": True, "size": 15, "color": WHITE})], [("a year in the base case: 604 + 857 + 60", {"size": 8.5, "color": "E4F4EA"})], [("", {"size": 5})], [(f"IRR {IRR*100:.0f}%", {"bold": True, "size": 12, "color": WHITE})], [(f"NPV at 10%: IDR {NPV10/1000:.2f} B", {"size": 9, "color": WHITE})], [(f"Net over 3 years: IDR {NB/1000:.2f} B", {"size": 9, "color": WHITE})], [("", {"size": 5})], [(f"Payback {PB:.0f} months", {"bold": True, "size": 12, "color": WHITE})], [(f"Low IDR {LOW[3]/1000:.1f} B, no payback", {"size": 8.5, "color": "E4F4EA"})], [(f"High IDR {HIGH[3]/1000:.1f} B, {PH:.0f} months", {"size": 8.5, "color": "E4F4EA"})]], 10, False, WHITE, "c", "m", radius=0.08, margin=0.06)
box(s, 0.4, 5.62, 12.55, 0.56, TINT[BLUE], None, None, radius=0.06)
text(s, 0.52, 5.63, 12.3, 0.55, [[("Payback: ", {"bold": True, "color": NAVY}), f"cost is IDR {A['one_off']:,.0f} M one-off and IDR {A['run']:,.0f} M a year. Year 1 net = 60% x {BASE[3]:,.0f} - {A['run']:,.0f} = {Y1:,.0f}; years 2 and 3 net = {BASE[3]:,.0f} - {A['run']:,.0f} = {Y2:,.0f} each. After year 1 the gap is {A['one_off']:,.0f} - {Y1:,.0f} = {REM:,.0f}, and {REM:,.0f} / {Y2:,.0f} x 12 = {REM/Y2*12:.0f} months, so payback is at month {12 + REM/Y2*12:.0f}."]], 9, False, INK, anchor="m", line=1.04)
ribbon(s, f"Value rests on two measurable levers, search time and repair time, and every input is shown so the Company can replace it with its own number. The base case pays back in {PB:.0f} months; the low case does not, and the pilot is designed to find out which case is real.")
notes(s, "Business impact. Each row runs from a platform capability to a KPI, then to a simple calculation and a value in IDR million. Search time: 45 users saving 20 minutes a day over 230 days is 3,450 hours at IDR 175,000 an hour, which is IDR 604 M. Repair time: 20.4 breakdowns a year at a 14.0 hour MTTR, cut by 10 percent, is 28.6 hours at IDR 30 M per downtime hour, which is IDR 857 M. Ramp-up is set at IDR 60 M. The breakdown rate and MTTR come from the 211 work orders; all other inputs are assumptions. Costs are IDR 1.4 B one-off and 370 M a year. The base case pays back in about 21 months with an IRR near 40 percent; the low case does not pay back in three years.")

# ======================================================= 5 FEASIBILITY AND ROADMAP
s = blank(prs)
frame(s, 5, "Feasibility and Roadmap: {{Read-Only, Advisory}} Deployment in Four Phases With Explicit Decision Gates",
      None, "Roadmap", "Prototype and architecture notes; dates and budget are proposals for discussion with the Company", "Implementation Plan")
# readiness matrix
gbanner(s, 0.35, 1.3, 7.55, "Feasibility: six readiness dimensions", NAVY, "27517F", 0.3, 10)
hd = [("Dimension", 1.35), ("Status", 0.85), ("In place today", 2.65), ("Still needed", 2.7)]
hx = 0.35
for t, w_ in hd:
    box(s, hx, 1.62, w_ - 0.02, 0.24, "27517F", None, [t], 7.6, True, WHITE, "l", "m", radius=0.03, margin=0.06); hx += w_
rd = [("Technical", "Ready", GREEN, "gear", "Prototype end to end; SQL schema and API spec; replaceable model contract", "Production database, ingestion queue"),
      ("Operational", "Ready", GREEN, "factory", "Advisory only; local search if the model is offline; fits OPL and work-order routines", "Shift-team trial, champions per function"),
      ("Legal", "Decision needed", AMBER, "book", "Drawing and vendor IP respected; data held in region", "Enterprise AI terms with no training on Company data; PDP Law review"),
      ("Cybersecurity", "Planned", BLUE, "lock", "Roles, audit trail, secret masking, prompt-injection guards, rate limits", "SSO, key vault, hub outside the OT zone (IEC 62443), red-team test"),
      ("Data governance", "Ready", GREEN, "shield", "Owner, revision and status on every record; 48 conflicts in a managed register", "Named data stewards, refresh rules per source"),
      ("Organisation", "Planned", BLUE, "users", "Roles and approval workflow built in", "Two-hour role-based training, monthly KPI review, sponsor")]
for i, (t, st, c_, ic, a1, a2) in enumerate(rd):
    y = 1.88 + i * 0.36; fill = WHITE if i % 2 else LIGHT
    box(s, 0.35, y, 7.5, 0.34, fill, MID, None, radius=0.02)
    pic(s, ic, 0.4, y + 0.04, 0.26, NAVY); text(s, 0.7, y, 1.0, 0.34, t, 8, True, NAVY, anchor="m", line=0.9)
    pill(s, 1.72, y + 0.06, 0.8, st, TINT[c_], c_ if c_ != AMBER else ORANGE, 0.22, 8)
    text(s, 2.58, y, 2.6, 0.34, a1, 8, False, INK, anchor="m", line=0.88); text(s, 5.23, y, 2.6, 0.34, a2, 8, False, INK, anchor="m", line=0.88)
# deployment path
gbanner(s, 8.05, 1.3, 4.95, "Deployment path and budget", NAVY, "27517F", 0.3, 10)
dp = [("Prototype today", "Static page, Netlify functions, Blobs, Gemini 2.5 Flash free tier, local fallback", BLUE), ("Pilot (90 days)", "Same stack; read-only EDMS and AIMS adapters, single sign-on, 45 users", TEAL), ("Production", "PostgreSQL with pgvector, ingestion queue, Company-approved model, SIEM export", GREEN)]
for i, (t, d, c_) in enumerate(dp):
    y = 1.64 + i * 0.44
    box(s, 8.05, y, 1.3, 0.4, c_, None, [t], 8, True, WHITE, "c", "m", radius=0.06, margin=0.04); box(s, 9.4, y, 3.6, 0.4, WHITE, c_, [d], 8, False, INK, "l", "m", radius=0.06, margin=0.06, lw=1.1)
    if i < 2: arrow(s, 8.7, y + 0.4, 8.7, y + 0.44, GREY, 1.4)
text(s, 8.05, 2.98, 4.95, 0.2, f"One-off budget IDR {A['one_off']:,.0f} M; running cost IDR {A['run']:.0f} M a year", 8, True, NAVY)
bx = 8.05; tot = 1400
for nm, v, c_ in [("Integration", 650, BLUE), ("Data", 350, TEAL), ("Change", 250, ORANGE), ("Sec.", 150, RED)]:
    w_ = 4.95 * v / tot
    box(s, bx, 3.2, w_ - 0.02, 0.24, c_, None, [f"{nm} {v}"], 7.2, True, WHITE, "c", "m", radius=0.03, margin=0.01); bx += w_
for i, (r, m) in enumerate([("Wrong answer", "evidence-only drafting, verification, refusals"), ("Poor data quality", "conflict register, named owners"), ("Low adoption", "champions, tools used in daily work"), ("Model cost or outage", "replaceable model, offline fallback")]):
    x = 8.05 + (i % 2) * 2.5; y = 3.5 + (i // 2) * 0.35
    box(s, x, y, 2.45, 0.33, TINT[RED], None, [[(r + ": ", {"bold": True, "color": RED}), m]], 6.8, False, INK, "l", "m", radius=0.06, margin=0.06)
# roadmap
RY = 4.27
gbanner(s, 0.35, RY, 12.65, "Implementation roadmap", NAVY, "27517F", 0.26, 9.5, "l")
qs = ["Q4 26", "Q1 27", "Q2 27", "Q3 27", "Q4 27", "Q1 28", "Q2 28", "Q3 28", "Q4 28"]
gx0 = 3.0; gw = 10.0; qw = gw / 9
for i, q in enumerate(qs): box(s, gx0 + i * qw, RY + 0.29, qw - 0.03, 0.2, "27517F" if i % 2 else NAVY, None, [q], 7.5, True, WHITE, "c", "m", radius=0.04)
ph = [("0  Mobilise", 0, 1, GREY, "Finals 4-5 Nov 2026: data access, owners, enterprise AI terms", "Start"),
      ("1  Pilot, LLDPE unit", 1, 1, BLUE, "90-day pilot: 45 users, case data live, success gates", "Pilot"),
      ("2  Connect", 2, 2, TEAL, "EDMS and AIMS adapters, single sign-on, security review, live tag values", "Integrate"),
      ("3  Extend", 4, 3, GREEN, "Predictive and HSE on live data, digital-twin link, units 2 and 3", "Extend"),
      ("4  Scale", 7, 2, PURPLE, "Plant-wide roll-out and continuous improvement", "Scale")]
y = RY + 0.53
for t, st, ln, c_, d, tag in ph:
    text(s, 0.4, y, 2.55, 0.24, t, 8.3, True, NAVY, anchor="m")
    box(s, gx0 + st * qw, y, ln * qw - 0.03, 0.24, c_, None, [tag], 7.8, True, WHITE, "c", "m", radius=0.05, margin=0.03)
    if st + ln >= 7: text(s, gx0 + st * qw - 6.1, y, 6.0, 0.24, d, 7.6, False, GREY, "r", "m")
    else: text(s, gx0 + (st + ln) * qw + 0.06, y, 6.2, 0.24, d, 7.6, False, GREY, "l", "m")
    y += 0.22
for gq, g, lab in [(2, "G1", "Pilot gates met"), (4, "G2", "Security and integration sign-off"), (7, "G3", "Value review"), (9, "G4", "Scale decision")]:
    gxp = gx0 + gq * qw - 0.03
    box(s, gxp - 0.09, RY + 1.68, 0.18, 0.18, ORANGE, None, None, shape=MSO_SHAPE.DIAMOND)
    if gq >= 7: text(s, gxp - 2.3, RY + 1.64, 2.18, 0.26, [[(g + " ", {"bold": True, "color": ORANGE}), lab]], 7.6, False, INK, "r", "m")
    else: text(s, gxp + 0.14, RY + 1.64, 2.4, 0.26, [[(g + " ", {"bold": True, "color": ORANGE}), lab]], 7.6, False, INK, "l", "m")
text(s, 0.4, RY + 1.64, 2.5, 0.26, "Decision gates", 8.3, True, NAVY, anchor="m")
ribbon(s, "The pilot is feasible today because the prototype already runs end to end, reads from Company systems only, and keeps a person in every approval. Four phases with decision gates keep spend at IDR 1.4 B one-off and let the Company stop at any gate.")
notes(s, "Feasibility. The matrix covers the readiness areas the booklet asks for. Legal needs a decision from the Company on the enterprise AI terms. The deployment path starts from the prototype stack, moves to a read-only pilot and ends on a production database. The one-off budget of IDR 1.4 billion is split across integration, data work, change management and security. The roadmap runs from the finals in November 2026 to plant-wide roll-out at the end of 2028 with four decision gates.")

# ======================================================= 6 CONCLUSION
s = blank(prs)
frame(s, 6, "Conclusion: A {{Trusted, Traceable}} Knowledge Hub Turns Scattered Plant Knowledge Into Faster, Safer and More Reliable Decisions",
      "Summary of the proposal, how it answers the three key questions of the case, and the decision requested", "Conclusion",
      "Prototype test results (128 of 128 evaluation questions, static, regression and layout checks) and the business case on slide 4", "Objectives, Key Results and Conclusion")
pillars = [("CONNECT", "TAGLINK: one governed base", BLUE, [f"{D['docs']} documents and {D['wo']} work orders unified on the equipment tag", f"{D['issues']} conflicts detected and assigned to owners", "Ingestion, quality gates and approval for every record"], "98 to 1", "documents into one governed base"),
           ("ASK", "VERA: answers with evidence", TEAL, ["Source, revision, approval status and confidence on every answer", "Numbers and quotes verified against the cited text", "Safety bypass requests refused with the reason"], f"{D['evals']}/{D['evals']}", "evaluation questions passed"),
           ("ACT", "FORESIGHT, SAFEWORK", ORANGE, ["Failure memory with RCA and lessons at the point of fault", "Risk ranking, readiness, hazard screening and permit-aware planning", "Read-only links to EDMS, AIMS and the digital twin"], f"{D['tools']} tools", "computed from plant records")]
for i, (a, b, c_, bl, big, cap) in enumerate(pillars):
    x = 0.35 + i * 4.25
    panel(s, x, 1.5, 4.15, 1.95)
    box(s, x, 1.5, 4.15, 0.48, c_, None, None, shape=MSO_SHAPE.RECTANGLE)
    text(s, x + 0.15, 1.5, 4.0, 0.48, [[(a + "   ", {"bold": True, "size": 14, "color": WHITE}), (b, {"size": 10.5, "color": "EAF2FB"})]], 12, True, WHITE, "l", "m")
    bullet(s, x + 0.15, 2.04, 3.85, 0.95, bl, 9.3, c_, 2)
    text(s, x + 0.15, 2.93, 1.7, 0.5, big, 22, True, c_)
    text(s, x + 1.9, 2.97, 2.2, 0.45, cap, 9, False, GREY, anchor="m", line=1.0)
banner(s, 0.35, 3.52, 12.65, "How the proposal answers the three key questions of the case", NAVY, 0.3, 10.5, "l")
kq = [("Q1", "Build a structured Industrial Data Ops foundation", "Tag-keyed data model over seven source types; AI-assisted ingestion, quality gates and approval with named owners; conflicts surfaced on day one", "98 documents, 1,109 passages, 48 conflicts registered"),
      ("Q2", "Help engineers find trusted answers faster and reduce improper execution", "Hybrid retrieval, evidence-weighted confidence score, verification of numbers and quotes, refusal of unsafe requests", f"{D['evals']}/{D['evals']} questions passed; 20 min a day saved per engineer (assumption, slide 4)"),
      ("Q3", "Integrate with operational systems for reliability and improvement", "Read-only EDMS, AIMS, historian and twin links; failure memory, backtested reliability analytics, readiness, hazard screening and site planning", f"{D['bt']}-forecast backtest; {D['tools']} computed tools")]
for i, (q, a, b, c_) in enumerate(kq):
    y = 3.88 + i * 0.6
    panel(s, 0.35, y, 12.65, 0.56, WHITE if i % 2 else LIGHT, MID)
    numdot(s, 0.45, y + 0.13, q, [BLUE, TEAL, ORANGE][i], 0.36, 9)
    text(s, 0.95, y, 3.3, 0.62, a, 9.3, True, NAVY, anchor="m", line=1.0)
    text(s, 4.35, y, 5.5, 0.62, b, 8.8, False, INK, anchor="m", line=1.0)
    text(s, 10.0, y, 2.95, 0.62, [[("Evidence: ", {"bold": True, "color": GREEN}), c_]], 8.5, False, INK, anchor="m", line=1.0)
banner(s, 0.35, 5.72, 2.9, "Decision requested: a 90-day pilot", GREEN, 0.5, 10.5, "c")
steps = [("Weeks 1 to 2", "Agree data access, owners and AI terms"), ("Weeks 3 to 6", "Load the LLDPE unit and train 45 users"), ("Weeks 7 to 12", "Measure against the success gates, then decide on scale")]
for i, (w_, d) in enumerate(steps):
    x = 3.4 + i * 3.2
    panel(s, x, 5.72, 3.12, 0.5, TINT[GREEN], "BFE3CB")
    text(s, x + 0.1, 5.72, 2.9, 0.22, w_, 9, True, GREEN); text(s, x + 0.1, 5.92, 2.9, 0.3, d, 8, False, INK, line=1.0)
    if i < 2: arrow(s, x + 3.12, 5.97, x + 3.2, 5.97, GREEN, 1.6)
ribbon(s, "The proposal gives engineers one trusted place to ask, with sources they can check, and turns each repair into a lesson the next shift can use. We ask for a 90-day pilot so the Company can measure the value before it commits to scale.")
notes(s, "Conclusion. Three pillars map to the three key questions. The ask is a 90-day pilot on the LLDPE unit with 45 users and success gates agreed in advance.")

# ======================================================= 7 TEAM
s = blank(prs)
frame(s, 7, "Team Profile", "Team name, university, supervisor and members (replace the bracketed fields before submission)", None, None)
text(s, 0.55, 1.6, 12.2, 0.4, [[("Team name: ", {"bold": True, "color": NAVY}), "[Team name]        ", ("University: ", {"bold": True, "color": NAVY}), "[University]        ", ("Supervisor: ", {"bold": True, "color": NAVY}), "[Supervisor name]"]], 13)
trows = [["No.", "Name", "Major", "Semester", "Area of expertise", "Contribution to the proposal"],
         ["1", "[Name]", "[Computer Science]", "[6]", "[AI and software]", "[Formulated the idea; built the prototype and the AI assistant]"],
         ["2", "[Name]", "[Chemical Engineering]", "[7]", "[Process and reliability]", "[Problem analysis, process content and hazard models]"],
         ["3", "[Name]", "[Industrial Engineering]", "[7]", "[Maintenance and business case]", "[Business impact, KPIs and roadmap]"]]
table(s, 0.55, 2.2, 12.2, [0.5, 1.8, 2.3, 1.0, 2.5, 4.1], trows, 11, rowh=0.7, header_fill=NAVY)
text(s, 0.55, 5.3, 12.2, 0.5, "The booklet allows two to three members from the same university. Delete unused rows.", 10.5, False, GREY)
notes(s, "Team. Complete the table as required by the booklet.")
