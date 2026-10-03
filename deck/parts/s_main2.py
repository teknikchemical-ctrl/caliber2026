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
from flow import *
Y1 = .6 * BASE[3] - A["run"]; Y2 = BASE[3] - A["run"]; REM = A["one_off"] - Y1
frame(s, 4, f"Business Impact: From Today's Baseline to {{{{IDR {BASE[3]/1000:.1f} B}}}} a Year, With Every Input and Its Source Shown",
      None, "Impact", "Case data: 211 work orders, 31 breakdowns in 1.52 years, MTTR 14.0 h. Grey items are assumptions that Company figures replace in the pilot. IDR = Indonesian rupiah; IRR and NPV over 3 years at 10%", "Impact Assessment and Projection")
HX = [(0.4, 2.1, "Lever and screen"), (2.75, 2.2, "Baseline today"), (5.2, 2.0, "With the platform"), (7.45, 4.1, "Calculation: inputs multiplied"), (11.85, 1.1, "IDR M a year")]
for x_, w_, t_ in HX: gbanner(s, x_, 1.26, w_, t_, NAVY, "27517F", 0.27, 9)
def pill_tag(x_, y_, label, col): pill(s, x_, y_, 0.2 + 0.062 * len(label), label, WHITE, col, 0.2, 7.5, col)
levers = [("Search time", "AI assistant", "assistant", (0, 0.1, 1, 0.45), BLUE,
           ("40 min a day", "per engineer on searching and checking sources", "ASSUMPTION", GREY), ("20 min a day", "answers arrive with the source attached"),
           [(f"{A['users']}", "users", GREY), ("20 min", "saved a day", GREY), (f"{A['days']}", "working days", GREY), ("IDR 175k", "per hour", GREY)], f"{BASE[0]:,.0f}"),
          ("Repair time", "Failure memory", "fm", (0, 0, 1, 0.6), TEAL,
           (f"MTTR {D['mttr']:.1f} h", f"{D['bd_yr']} breakdowns a year, 434 h downtime", "CASE DATA", GREEN), (f"MTTR {D['mttr']*.9:.1f} h", "10% less, known causes and fixes at the fault"),
           [(f"{D['bd_yr']}", "breakdowns a year", GREEN), (f"{D['mttr']:.1f} h", "MTTR today", GREEN), ("10%", "less repair time", GREY), ("IDR 30 M", "per downtime hour", GREY)], f"{BASE[1]:,.0f}"),
          ("Ramp-up", "Knowledge Studio", "studio", (0, 0, 1, 0.6), PURPLE,
           ("Not measured", "no baseline for new-engineer ramp-up in the case data", "NO BASELINE", GREY), ("One month sooner", "new engineers learn from approved lessons"),
           None, f"{BASE[2]:,.0f}")]
RY4 = [2.08, 3.0, 3.92]
for (lv, ft, im_, crp, c_, (bt, bs, btag, bcol), (tt, ts), ins, val), cy in zip(levers, RY4):
    # lever cell with the screen
    box(s, 0.4, cy - 0.42, 2.1, 0.84, WHITE, c_, None, radius=0.08, lw=1.2)
    from PIL import Image as _I
    _p = os.path.join(HERE, "jpg", im_ + ".jpg"); _im = _I.open(_p); _w, _h = _im.size
    _c = _im.crop((int(crp[0] * _w), int(crp[1] * _h), int(crp[2] * _w), int(crp[3] * _h))); _cp = os.path.join(HERE, "jpg", "lv_" + im_ + ".jpg"); _c.convert("RGB").save(_cp, quality=85)
    ph_ = 1.0 * _c.size[1] / _c.size[0]
    pc = s.shapes.add_picture(_cp, Inches(0.46), Inches(cy - ph_ / 2), Inches(1.0), Inches(ph_)); pc.line.color.rgb = rgb(MID); pc.line.width = Pt(0.75)
    text(s, 1.52, cy - 0.38, 0.97, 0.76, [[(lv, {"bold": True, "size": 10.5, "color": NAVY})], [(ft, {"size": 8.5, "color": c_})]], 10, False, INK, anchor="m", line=1.0)
    arrow(s, 2.52, cy, 2.73, cy, c_, 1.6)
    box(s, 2.75, cy - 0.42, 2.2, 0.84, WHITE, bcol, [[(bt, {"bold": True, "size": 10.5, "color": NAVY})], [(bs, {"size": 8.5, "color": INK})]], 10, False, INK, "c", "m", radius=0.08, lw=1.4, margin=0.06)
    pill_tag(2.85, cy - 0.52, btag, bcol)
    arrow(s, 4.97, cy, 5.18, cy, c_, 1.6)
    box(s, 5.2, cy - 0.42, 2.0, 0.84, TINT[c_], c_, [[(tt, {"bold": True, "size": 10.5, "color": NAVY})], [(ts, {"size": 8.5, "color": INK})]], 10, False, INK, "c", "m", radius=0.08, lw=1.2, margin=0.06)
    arrow(s, 7.22, cy, 7.43, cy, c_, 1.6)
    if ins:
        xx = 7.45
        for j, (v_, l_, col) in enumerate(ins):
            box(s, xx, cy - 0.34, 0.92, 0.68, WHITE, col, [[(v_, {"bold": True, "size": 10.5, "color": NAVY})], [(l_, {"size": 8, "color": INK})]], 10, False, INK, "c", "m", radius=0.08, lw=1.3, margin=0.03)
            if j < 3: text(s, xx + 0.92, cy - 0.14, 0.2, 0.28, "x", 12, True, GREY, "c")
            xx += 1.06
    else:
        box(s, 7.45, cy - 0.34, 4.1, 0.68, WHITE, GREY, [[("IDR 60 M a year, assumed", {"bold": True, "size": 10.5, "color": NAVY})], [("kept small; the HR figure replaces it in the pilot", {"size": 8.5, "color": INK})]], 10, False, INK, "c", "m", radius=0.08, lw=1.3, margin=0.05)
    arrow(s, 11.58, cy, 11.83, cy, c_, 1.8)
    box(s, 11.85, cy - 0.3, 1.1, 0.6, c_, None, [[(val, {"bold": True, "size": 16, "color": WHITE})]], 16, True, WHITE, "c", "m", radius=0.08, margin=0.02)
# money flow
box(s, 0.4, 4.52, 2.1, 0.62, NAVY, None, [[("Money flow", {"bold": True, "size": 10.5, "color": WHITE})], [(f"{BASE[0]:,.0f} + {BASE[1]:,.0f} + {BASE[2]:,.0f} = {BASE[3]:,.0f} a year", {"size": 8.5, "color": "DCE8F5"})]], 10, False, WHITE, "c", "m", radius=0.08, margin=0.05)
arrow(s, 2.52, 4.83, 2.73, 4.83, NAVY, 1.6)
row(s, 4.83, 2.75, 12.95, [("Invest", f"IDR {A['one_off']:,.0f} M one-off"), ("Year 1", f"60% of value less {A['run']:,.0f} running = {Y1:,.0f}"), ("Year 2", f"{BASE[3]:,.0f} less {A['run']:,.0f} = {Y2:,.0f}"), ("Year 3", f"{BASE[3]:,.0f} less {A['run']:,.0f} = {Y2:,.0f}"), ("Result", f"payback month {12 + REM/Y2*12:.0f}, IRR {IRR*100:.0f}%, NPV IDR {NPV10/1000:.2f} B")], NAVY, tsize=10.5, ssize=8.5, maxw=2.2, solid_last=True)
text(s, 2.75, 5.2, 10.2, 0.22, f"Payback: after year 1 the gap is {A['one_off']:,.0f} - {Y1:,.0f} = {REM:,.0f}; {REM:,.0f} / {Y2:,.0f} x 12 = {REM/Y2*12:.0f} months into year 2, so month {12 + REM/Y2*12:.0f}.", 8.5, False, GREY)
# scenarios
box(s, 0.4, 5.55, 2.1, 0.62, GREY, None, [[("Scenarios", {"bold": True, "size": 10.5, "color": WHITE})], [("same method, other inputs", {"size": 8.5, "color": "EEF1F4"})]], 10, False, WHITE, "c", "m", radius=0.08, margin=0.05)
row(s, 5.86, 2.75, 12.95, [("Low case", f"IDR {LOW[3]/1000:.1f} B a year, no payback in 3 years"), ("Base case", f"IDR {BASE[3]/1000:.1f} B a year, payback {PB:.0f} months"), ("High case", f"IDR {HIGH[3]/1000:.1f} B a year, payback {PH:.0f} months"), ("Not valued", "improper executions avoided and conflicts closed")], GREY, tsize=10.5, ssize=8.5, maxw=2.6, arrows=False)
ribbon(s, f"Value rests on two measurable levers, search time and repair time, and every input is shown so the Company can replace it with its own number. The base case pays back in {PB:.0f} months; the low case does not, and the pilot is designed to find out which case is real.")
notes(s, "Business impact as a flow. Each row starts from today's baseline, shows what the platform changes, and multiplies the inputs into IDR million. Search time: 45 users saving 20 minutes a day over 230 days is 3,450 hours at IDR 175,000 an hour, which is IDR 604 M; the 40 minute baseline is an assumption. Repair time: 20.4 breakdowns a year at a 14.0 hour MTTR, cut by 10 percent, is 28.6 hours at IDR 30 M per downtime hour, which is IDR 857 M; the breakdown rate and MTTR come from the 211 work orders. Ramp-up is set at IDR 60 M and has no baseline in the case data. Costs are IDR 1.4 B one-off and 370 M a year. The base case pays back in about 21 months with an IRR near 40 percent; the low case does not pay back in three years.")

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
BL2 = [["98 documents and 211 work orders joined on the equipment tag", "48 conflicts found and given owners"], ["Source, revision, confidence on every answer", "Numbers checked; unsafe bypass refused"], ["Failure memory and risk at the fault", "Read-only links to EDMS, AIMS, twin"]]
SC2 = [("wizard", (0, 0, 1, 0.9)), ("assistant", (0, 0.05, 1, 0.8)), ("predict", (0, 0, 1, 0.8))]
for i, (a, b, c_, bl, big, cap) in enumerate(pillars):
    x = 0.35 + i * 4.25
    panel(s, x, 1.5, 4.15, 1.95)
    box(s, x, 1.5, 4.15, 0.48, c_, None, None, shape=MSO_SHAPE.RECTANGLE)
    text(s, x + 0.15, 1.5, 4.0, 0.48, [[(a + "   ", {"bold": True, "size": 14, "color": WHITE}), (b, {"size": 10.5, "color": "EAF2FB"})]], 12, True, WHITE, "l", "m")
    bullet(s, x + 0.12, 2.03, 2.3, 0.8, BL2[i], 9, c_, 2)
    win(s, SC2[i][0], x + 2.5, 2.06, 1.55, SC2[i][1], "")
    text(s, x + 0.15, 2.82, 2.3, 0.4, big, 20, True, c_)
    text(s, x + 0.15, 3.15, 2.3, 0.25, cap, 8.5, False, GREY)
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
table(s, 0.55, 2.2, 12.2, [0.5, 1.8, 2.3, 1.0, 2.5, 4.1], trows, 11, rowh=0.52, header_fill=NAVY)
text(s, 0.55, 4.4, 12.2, 0.3, "The booklet allows two to three members from the same university. Delete unused rows.", 10.5, False, GREY)
text(s, 0.55, 4.8, 12.2, 0.3, "Screens of the working prototype", 11, True, NAVY)
for i, (nm, cr, tt) in enumerate([("dash2", (0, 0.1, 1, 0.7), "Dashboard"), ("scn", (0, 0, 1, 0.58), "Scenario on the P&ID"), ("predict", (0, 0, 1, 0.58), "Predictive maintenance"), ("hazard3d", (0, 0, 1, 0.58), "Hazard simulator")]):
    win(s, nm, 0.55 + i * 3.08, 5.15, 2.95, cr, tt)
notes(s, "Team. Complete the table as required by the booklet.")
