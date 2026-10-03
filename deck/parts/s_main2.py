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
frame(s, 4, f"Business Impact: Each Feature Moves a Measured KPI, Worth {{{{IDR {BASE[3]/1000:.1f} B}}}} a Year in the Base Case With a {PB:.0f}-Month Payback",
      None, "Impact", "Case baseline data (work orders, MTTR, breakdowns); hours and rates are assumptions to be replaced with Company figures (appendix A22, A29, A31)", "Impact Assessment and Projection")
cols_ = [("Platform capability", 0.4, 2.35), ("Change at the plant", 3.1, 2.95), ("KPI: baseline to target", 6.4, 2.75), ("IDR M a year", 9.5, 1.15)]
for t_, x_, w_ in cols_: gbanner(s, x_, 1.3, w_, t_, NAVY, "27517F", 0.3, 9.5)
gbanner(s, 11.0, 1.3, 1.95, "Result", GREEN, "6CC48D", 0.3, 9.5)
chains = [("AI assistant, verified answers", BLUE, "Engineer finds the procedure, drawing and past case in minutes", "Time to a verified answer: about 15 min to 3 min", f"{BASE[0]:,.0f}"),
          ("Failure memory, predictive checks", TEAL, "Known causes and fixes appear at the point of fault; repeat jobs flagged", f"MTTR {D['mttr']:.1f} h to {D['mttr']*.9:.1f} h; repeat failures {D['rep']} to {D['rep']*.7:.1f} of {D['cm_follow']}", f"{BASE[1]:,.0f}"),
          ("Knowledge Studio, OPL lessons", PURPLE, "New engineers learn from approved lessons and the simulator", "Time to productivity: one month sooner", f"{BASE[2]:,.0f}"),
          ("Interlock guard, readiness, hazard view", RED, "Unsafe actions blocked or flagged before execution", "Improper executions (counted, not valued)", "n/v"),
          ("Quality register, approvals", ORANGE, "Every conflict gets an owner and a close date", f"{D['issues']} conflicts owned; 90% closed in the pilot", "n/v")]
ys = [2.02 + i * 0.72 for i in range(5)]
for (f_, c_, ch_, kp_, v_), cy in zip(chains, ys):
    cell(s, 0.4, cy, f_, None, c_, 10.5, 8.8, 2.2, 2.35, w=2.35)
    arrow(s, 2.78, cy, 3.07, cy, c_, 1.6)
    cell(s, 3.1, cy, ch_, None, c_, 9.5, 8.8, 2.8, 2.95, w=2.95)
    arrow(s, 6.08, cy, 6.37, cy, c_, 1.6)
    box(s, 6.4, cy - 0.3, 2.75, 0.6, WHITE, c_, [[(kp_, {"size": 9.5, "color": INK})]], 9.5, False, INK, "c", "m", radius=0.08, lw=1.1, margin=0.06)
    arrow(s, 9.18, cy, 9.47, cy, c_, 1.6)
    box(s, 9.5, cy - 0.27, 1.15, 0.54, c_ if v_ != "n/v" else GREY, None, [[(v_ if v_ != "n/v" else "not valued", {"bold": True, "size": 14 if v_ != "n/v" else 9, "color": WHITE})]], 14, True, WHITE, "c", "m", radius=0.08, margin=0.02)
    if v_ != "n/v": arrow(s, 10.68, cy, 10.95, cy + (3.6 - cy) * 0.0, c_, 1.6, False)
box(s, 10.95, 1.7, 0.03, 2.8, GREEN, None, None, shape=MSO_SHAPE.RECTANGLE)
arrow(s, 10.98, 3.1, 11.15, 3.1, GREEN, 2.0)
box(s, 11.15, 1.7, 1.8, 2.8, GREEN, None, [[("IDR 1.52 B", {"bold": True, "size": 17, "color": WHITE})], [("annual value, base case", {"size": 9, "color": "E4F4EA"})], [("", {"size": 6})], [("IRR 40%", {"bold": True, "size": 12, "color": WHITE})], [("NPV at 10%: IDR 0.91 B", {"size": 9, "color": WHITE})], [("Payback 21 months", {"bold": True, "size": 11, "color": WHITE})], [("Net over 3 years: IDR 1.44 B", {"size": 9, "color": WHITE})]], 10, False, WHITE, "c", "m", radius=0.08, margin=0.06)
# cost side and scenarios
box(s, 11.15, 4.6, 1.8, 0.75, TINT[RED], RED, [[("Cost", {"bold": True, "size": 10, "color": RED})], [(f"one-off IDR {A['one_off']:,.0f} M", {"size": 8.8, "color": INK})], [(f"running IDR {A['run']:,.0f} M a year", {"size": 8.8, "color": INK})]], 9, False, INK, "c", "m", radius=0.08, margin=0.04)
for i, (nm, sc, pbk, c_) in enumerate([("Low", LOW, PL, GREY), ("Base", BASE, PB, BLUE), ("High", HIGH, PH, GREEN)]):
    x = 0.4 + i * 3.45
    box(s, x, 5.42, 3.3, 0.56, TINT[c_] if c_ in TINT else LIGHT, c_, [[(nm + " case  ", {"bold": True, "size": 10.5, "color": c_}), (f"IDR {sc[3]/1000:.1f} B a year", {"bold": True, "size": 10.5, "color": NAVY})], [((f"payback {pbk:.0f} months" if pbk else "no payback within 3 years"), {"size": 9.5, "color": INK})]], 10, False, INK, "c", "m", radius=0.08, margin=0.05)
box(s, 0.4, 6.08, 12.55, 0.74, TINT[BLUE], None, None, radius=0.05)
text(s, 0.55, 6.1, 3.0, 0.25, "How the value is counted", 10, True, NAVY)
text(s, 0.55, 6.33, 12.3, 0.48, [[("Search time: ", {"bold": True, "color": BLUE}), "45 users x 20 min a day x 230 days x IDR 175,000 per hour.   ", ("Repair time: ", {"bold": True, "color": TEAL}), "20.4 breakdowns a year x 14 h MTTR x 10% x IDR 30 M per downtime hour.   ", ("Ramp-up: ", {"bold": True, "color": PURPLE}), "new engineers productive one month sooner.   All inputs are assumptions."]], 9, False, INK, line=1.05)
notes(s, "Business impact as a chain. Each platform capability changes something at the plant, moves a KPI that can be measured, and is valued in IDR. Search time saved gives IDR 604 M, faster fault finding gives 857 M and faster ramp-up 60 M, a base-case total of IDR 1.52 B a year. Interlock guard, readiness and the quality register are left unvalued on purpose. Against a one-off cost of IDR 1.4 B and 370 M a year of running cost, the base case pays back in about 21 months with an IRR near 40 percent. The low case does not pay back within three years, and we show it.")

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
    y = 1.88 + i * 0.46; fill = WHITE if i % 2 else LIGHT
    box(s, 0.35, y, 7.5, 0.43, fill, MID, None, radius=0.02)
    pic(s, ic, 0.4, y + 0.07, 0.3, NAVY); text(s, 0.75, y, 0.95, 0.43, t, 8, True, NAVY, anchor="m", line=0.95)
    pill(s, 1.72, y + 0.1, 0.8, st, TINT[c_], c_ if c_ != AMBER else ORANGE, 0.22, 6.8)
    text(s, 2.58, y, 2.6, 0.43, a1, 6.7, False, INK, anchor="m", line=0.95); text(s, 5.23, y, 2.6, 0.43, a2, 6.9, False, INK, anchor="m", line=0.95)
# deployment path
gbanner(s, 8.05, 1.3, 4.95, "Deployment path and budget", NAVY, "27517F", 0.3, 10)
dp = [("Prototype today", "Static page, Netlify functions, Blobs, Gemini 2.5 Flash free tier, local fallback", BLUE), ("Pilot (90 days)", "Same stack; read-only EDMS and AIMS adapters, single sign-on, 45 users", TEAL), ("Production", "PostgreSQL with pgvector, ingestion queue, Company-approved model, SIEM export", GREEN)]
for i, (t, d, c_) in enumerate(dp):
    y = 1.68 + i * 0.58
    box(s, 8.05, y, 1.3, 0.5, c_, None, [t], 8, True, WHITE, "c", "m", radius=0.06, margin=0.04); box(s, 9.4, y, 3.6, 0.5, WHITE, c_, [d], 7.2, False, INK, "l", "m", radius=0.06, margin=0.08, lw=1.1)
    if i < 2: arrow(s, 8.7, y + 0.5, 8.7, y + 0.58, GREY, 1.4)
text(s, 8.05, 3.46, 4.95, 0.2, f"One-off budget IDR {A['one_off']:,.0f} M; running cost IDR {A['run']:.0f} M a year", 8, True, NAVY)
bx = 8.05; tot = 1400
for nm, v, c_ in [("Integration", 650, BLUE), ("Data", 350, TEAL), ("Change", 250, ORANGE), ("Security", 150, RED)]:
    w_ = 4.95 * v / tot
    box(s, bx, 3.67, w_ - 0.02, 0.26, c_, None, [f"{nm} {v}"], 7.2, True, WHITE, "c", "m", radius=0.03, margin=0.01); bx += w_
for i, (r, m) in enumerate([("Wrong answer", "evidence-only drafting, verification, refusals"), ("Poor data quality", "conflict register, named owners"), ("Low adoption", "champions, tools used in daily work"), ("Model cost or outage", "replaceable model, offline fallback")]):
    x = 8.05 + (i % 2) * 2.5; y = 3.99 + (i // 2) * 0.4
    box(s, x, y, 2.45, 0.36, TINT[RED], None, [[(r + ": ", {"bold": True, "color": RED}), m]], 6.8, False, INK, "l", "m", radius=0.06, margin=0.06)
# roadmap
RY = 4.83
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
    y += 0.245
for gq, g, lab in [(2, "G1", "Pilot gates met"), (4, "G2", "Security and integration sign-off"), (7, "G3", "Value review"), (9, "G4", "Scale decision")]:
    gxp = gx0 + gq * qw - 0.03
    box(s, gxp - 0.09, RY + 1.79, 0.18, 0.18, ORANGE, None, None, shape=MSO_SHAPE.DIAMOND)
    if gq >= 7: text(s, gxp - 2.3, RY + 1.75, 2.18, 0.26, [[(g + " ", {"bold": True, "color": ORANGE}), lab]], 7.6, False, INK, "r", "m")
    else: text(s, gxp + 0.14, RY + 1.75, 2.4, 0.26, [[(g + " ", {"bold": True, "color": ORANGE}), lab]], 7.6, False, INK, "l", "m")
text(s, 0.4, RY + 1.75, 2.5, 0.26, "Decision gates", 8.3, True, NAVY, anchor="m")
notes(s, "Feasibility. The matrix covers the readiness areas the booklet asks for. Legal needs a decision from the Company on the enterprise AI terms. The deployment path starts from the prototype stack, moves to a read-only pilot and ends on a production database. The one-off budget of IDR 1.4 billion is split across integration, data work, change management and security. The roadmap runs from the finals in November 2026 to plant-wide roll-out at the end of 2028 with four decision gates.")

# ======================================================= 6 CONCLUSION
s = blank(prs)
frame(s, 6, "Conclusion: A {{Trusted, Traceable}} Knowledge Hub Turns Scattered Plant Knowledge Into Faster, Safer and More Reliable Decisions",
      "Summary of the proposal, how it answers the three key questions of the case, and the decision requested", "Conclusion",
      "Prototype test results (appendix A23) and business case (slide 4, appendix A22)", "Objectives, Key Results and Conclusion")
pillars = [("CONNECT", "TAGLINK: one governed base", BLUE, [f"{D['docs']} documents and {D['wo']} work orders unified on the equipment tag", f"{D['issues']} conflicts detected and assigned to owners", "Ingestion, quality gates and approval for every record"], "98 to 1", "documents into one governed base"),
           ("ASK", "VERA: answers with evidence", TEAL, ["Source, revision, approval status and confidence on every answer", "Numbers and quotes verified against the cited text", "Safety bypass requests refused with the reason"], f"{D['evals']}/{D['evals']}", "evaluation questions passed"),
           ("ACT", "FORESIGHT, SAFEWORK", ORANGE, ["Failure memory with RCA and lessons at the point of fault", "Risk ranking, readiness, hazard screening and permit-aware planning", "Read-only links to EDMS, AIMS and the digital twin"], f"{D['tools']} tools", "computed from plant records")]
for i, (a, b, c_, bl, big, cap) in enumerate(pillars):
    x = 0.35 + i * 4.25
    panel(s, x, 1.5, 4.15, 2.05)
    box(s, x, 1.5, 4.15, 0.48, c_, None, None, shape=MSO_SHAPE.RECTANGLE)
    text(s, x + 0.15, 1.5, 4.0, 0.48, [[(a + "   ", {"bold": True, "size": 14, "color": WHITE}), (b, {"size": 10.5, "color": "EAF2FB"})]], 12, True, WHITE, "l", "m")
    bullet(s, x + 0.15, 2.04, 3.85, 0.95, bl, 9.3, c_, 2)
    text(s, x + 0.15, 3.0, 1.7, 0.5, big, 22, True, c_)
    text(s, x + 1.9, 3.04, 2.2, 0.45, cap, 9, False, GREY, anchor="m", line=1.0)
banner(s, 0.35, 3.67, 12.65, "How the proposal answers the three key questions of the case", NAVY, 0.3, 10.5, "l")
kq = [("Q1", "Build a structured Industrial Data Ops foundation", "Tag-keyed data model over seven source types; AI-assisted ingestion, quality gates and approval with named owners; conflicts surfaced on day one", "98 documents, 1,109 passages, 48 conflicts registered"),
      ("Q2", "Help engineers find trusted answers faster and reduce improper execution", "Hybrid retrieval, evidence-weighted confidence score, verification of numbers and quotes, refusal of unsafe requests", f"{D['evals']}/{D['evals']} questions passed; 3 minute target versus about 15 minutes today"),
      ("Q3", "Integrate with operational systems for reliability and improvement", "Read-only EDMS, AIMS, historian and twin links; failure memory, backtested reliability analytics, readiness, hazard screening and site planning", f"{D['bt']}-forecast backtest; {D['tools']} computed tools")]
for i, (q, a, b, c_) in enumerate(kq):
    y = 4.03 + i * 0.68
    panel(s, 0.35, y, 12.65, 0.62, WHITE if i % 2 else LIGHT, MID)
    numdot(s, 0.45, y + 0.13, q, [BLUE, TEAL, ORANGE][i], 0.36, 9)
    text(s, 0.95, y, 3.3, 0.62, a, 9.3, True, NAVY, anchor="m", line=1.0)
    text(s, 4.35, y, 5.5, 0.62, b, 8.8, False, INK, anchor="m", line=1.0)
    text(s, 10.0, y, 2.95, 0.62, [[("Evidence: ", {"bold": True, "color": GREEN}), c_]], 8.5, False, INK, anchor="m", line=1.0)
banner(s, 0.35, 6.12, 2.9, "Decision requested: a 90-day pilot", GREEN, 0.7, 10.5, "c")
steps = [("Weeks 1 to 2", "Agree data access, owners and AI terms"), ("Weeks 3 to 6", "Load the LLDPE unit and train 45 users"), ("Weeks 7 to 12", "Measure against the success gates, then decide on scale")]
for i, (w_, d) in enumerate(steps):
    x = 3.4 + i * 3.2
    panel(s, x, 6.12, 3.12, 0.7, TINT[GREEN], "BFE3CB")
    text(s, x + 0.1, 6.14, 2.9, 0.24, w_, 9.3, True, GREEN); text(s, x + 0.1, 6.38, 2.9, 0.44, d, 8.8, False, INK, line=1.0)
    if i < 2: arrow(s, x + 3.12, 6.47, x + 3.2, 6.47, GREEN, 1.6)
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
