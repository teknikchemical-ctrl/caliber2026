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
frame(s, 4, f"Business Impact: {{{{IDR {BASE[3]/1000:.1f} B}}}} Annual Value in the Base Case, Payback in About {PB:.0f} Months, With the Downside Disclosed",
      "Financial, operational and people benefits with measurable KPIs; hours and rates are assumptions to be replaced by Company figures during the pilot", "Impact",
      "Case baseline data (work orders, MTTR, breakdowns); assumptions in appendix A16. IDR = Indonesian rupiah; IRR and NPV over 3 years, 10% discount rate", "Impact Assessment and Projection")
LX, LW = 0.35, 4.2
banner(s, LX, 1.5, LW, "Financial assessment", NAVY)
rows = [["Parameter", "Baseline", "With platform"],
        ["Time to a verified answer", "about 15 min*", "3 min"],
        ["Mean time to repair (MTTR)", f"{D['mttr']:.1f} h", f"{D['mttr']*.9:.1f} h"],
        ["Repeat failures within 120 days", f"{D['rep']} of {D['cm_follow']}", f"{D['rep']*.7:.1f} of {D['cm_follow']}"],
        ["Annual benefit (IDR M)", "0", f"{BASE[3]:,.0f}"],
        ["One-off investment (IDR M)", "0", f"{A['one_off']:,.0f}"],
        ["Annual running cost (IDR M)", "0", f"{A['run']:,.0f}"]]
table(s, LX, 1.88, LW, [2.2, 1.0, 1.1], rows, 8.5, rowh=0.3, header_fill=BLUE)
for i, (n_, l_, c_) in enumerate([(f"IDR {NB/1000:.2f} B", "net benefit over 3 years", GREEN), (f"{IRR*100:.0f}%", "internal rate of return", BLUE), (f"IDR {NPV10/1000:.2f} B", "net present value at 10%", BLUE), (f"{PB:.0f} months", "payback period", ORANGE)]):
    x = LX + (i % 2) * 2.12; y = 4.08 + (i // 2) * 0.82
    panel(s, x, y, 2.08, 0.76, TINT[c_] if c_ in TINT else WHITE, MID)
    text(s, x + 0.05, y + 0.05, 1.98, 0.4, n_, 15, True, c_, "c"); text(s, x + 0.05, y + 0.45, 1.98, 0.28, l_, 8.3, False, GREY, "c")
for i, (nm, sc, pbk, c_) in enumerate([("Low", LOW, PL, GREY), ("Base", BASE, PB, BLUE), ("High", HIGH, PH, GREEN)]):
    x = LX + i * 1.42
    panel(s, x, 5.76, 1.36, 0.96, TINT[BLUE] if nm == "Base" else WHITE, c_)
    text(s, x + 0.04, 5.78, 1.28, 0.22, nm + " case", 8.5, True, c_, "c")
    text(s, x + 0.04, 5.98, 1.28, 0.3, f"IDR {sc[3]/1000:.1f} B a year", 9.5, True, NAVY, "c")
    text(s, x + 0.04, 6.3, 1.28, 0.4, (f"payback {pbk:.0f} months" if pbk else "no payback in 3 years"), 8, False, INK, "c")
text(s, LX, 6.72, LW, 0.18, "* assumed; all other baseline values come from the 211 work orders", 7, False, GREY)
# middle charts
MX, MW = 4.7, 4.3
banner(s, MX, 1.5, MW, "Annual value by lever, base case (IDR M)", NAVY)
cd = CategoryChartData(); cd.categories = ["Search time saved", "Faster fault finding", "Faster ramp-up", "Annual value"]
a_, b_, c3 = BASE[0], BASE[1], BASE[2]
cd.add_series("base", [0, round(a_), round(a_ + b_), 0]); cd.add_series("value", [round(a_), round(b_), round(c3), round(BASE[3])])
gf = s.shapes.add_chart(XL_CHART_TYPE.COLUMN_STACKED, Inches(MX), Inches(1.88), Inches(MW), Inches(2.45), cd); ch = gf.chart
ch.has_legend = False; pl = ch.plots[0]; pl.gap_width = 45; pl.overlap = 100
ch.value_axis.visible = False; ch.value_axis.has_major_gridlines = False; ch.value_axis.maximum_scale = BASE[3] * 1.15
ch.category_axis.tick_labels.font.size = Pt(8.5); ch.category_axis.tick_labels.font.name = FONT; ch.category_axis.format.line.color.rgb = rgb(MID)
sb, sv = pl.series
sb.format.fill.background(); sb.format.line.fill.background()
for i, c_ in enumerate([BLUE, TEAL, PURPLE, NAVY]):
    pt = sv.points[i]; pt.format.fill.solid(); pt.format.fill.fore_color.rgb = rgb(c_)
sv.data_labels.show_value = True; sv.data_labels.font.size = Pt(10); sv.data_labels.font.bold = True; sv.data_labels.font.name = FONT; sv.data_labels.number_format = '#,##0'; sv.data_labels.number_format_is_linked = False
sv.data_labels.font.color.rgb = rgb(WHITE); sv.data_labels.position = XL_LABEL_POSITION.CENTER
banner(s, MX, 4.42, MW, "Cumulative net benefit (IDR B)", NAVY)
def cum(total):
    pts = [-A["one_off"] / 1000]
    for m in range(1, 37):
        b = (.6 if m <= 12 else 1.0) * total / 12 - A["run"] / 12
        pts.append(pts[-1] + b / 1000)
    return pts
cd2 = CategoryChartData(); cd2.categories = [str(m) for m in range(0, 37)]
for nm, sc in [("Low", LOW), ("Base", BASE), ("High", HIGH)]: cd2.add_series(nm, [round(v, 2) for v in cum(sc[3])])
gf2 = s.shapes.add_chart(XL_CHART_TYPE.LINE, Inches(MX), Inches(4.78), Inches(MW), Inches(2.0), cd2); c2 = gf2.chart
c2.has_legend = True; c2.legend.position = XL_LEGEND_POSITION.BOTTOM; c2.legend.include_in_layout = False; c2.legend.font.size = Pt(8.5); c2.legend.font.name = FONT
from pptx.enum.chart import XL_MARKER_STYLE
for ser, col, w_ in zip(c2.plots[0].series, [GREY, BLUE, GREEN], [1.5, 3.0, 1.5]):
    ser.format.line.color.rgb = rgb(col); ser.format.line.width = Pt(w_); ser.smooth = False; ser.marker.style = XL_MARKER_STYLE.NONE
c2.value_axis.tick_labels.font.size = Pt(8); c2.value_axis.tick_labels.font.name = FONT; c2.value_axis.major_gridlines.format.line.color.rgb = rgb("E3E9F0"); c2.value_axis.format.line.fill.background()
c2.category_axis.tick_labels.font.size = Pt(8); c2.category_axis.tick_labels.font.name = FONT
_ax = c2.category_axis._element
_nm = _ax.find(qn("c:noMultiLvlLbl"))
for tag in ("c:tickLblSkip", "c:tickMarkSkip"):
    e = etree.Element(qn(tag)); e.set("val", "12")
    if _nm is not None: _nm.addprevious(e)
    else: _ax.append(e)
# right: operational, safety, people
RX, RW = 9.15, 3.85
banner(s, RX, 1.5, RW, "Operational, safety and people impact", NAVY)
imp = [("Execution quality", "100% of answers carry source, revision, approval status and confidence", "check", BLUE),
       ("Reliability", f"MTTR down 10%, repeat failures down 30%, early detection from {D['found']*100//(D['found']+D['bad'])}% to 35%", "wrench", TEAL),
       ("Process safety", "Interlock bypass requests refused; hazard, permit and readiness checks at the point of work", "shield", RED),
       ("Knowledge retention", f"{D['opl']} approved lessons today, plus 12 each quarter, searchable by asset", "book", PURPLE),
       ("Data integrity", f"{D['issues']} document conflicts owned; 90% closed within 6 months", "warn", ORANGE),
       ("Onboarding", "New engineers productive one month sooner (4 hires a year assumed)", "users", GREEN)]
for i, (t, d, ic, c_) in enumerate(imp):
    y = 1.9 + i * 0.8
    panel(s, RX, y, RW, 0.74); pic(s, ic, RX + 0.08, y + 0.17, 0.4, c_)
    text(s, RX + 0.58, y + 0.03, RW - 0.62, 0.24, t, 9.5, True, NAVY); text(s, RX + 0.58, y + 0.27, RW - 0.62, 0.46, d, 8, False, INK, line=1.0)
box(s, RX, 6.72, RW, 0.0, WHITE, None, None) if False else None
text(s, RX, 6.7, RW, 0.2, "", 7)
notes(s, "Business impact. Left: the financial assessment. Parameters come from the case data where possible (MTTR 14 hours, 8 repeat failures out of 55 corrective jobs); the time to a verified answer is an assumption. The base case gives IDR 1.5 billion of annual value, an internal rate of return of about 40 percent over three years and a payback of about 21 months. The low case does not pay back inside three years, which we show on purpose. Middle: where the value comes from and how cash accumulates. Right: operational, safety and people impact with measurable KPIs. The pilot success gates are 90 percent of answers with an approved source, a median of 3 minutes to an answer, 80 percent of users rating answers useful and zero answers without a source.")

# ======================================================= 5 FEASIBILITY AND ROADMAP
s = blank(prs)
frame(s, 5, "Feasibility and Roadmap: {{Read-Only, Advisory}} Deployment in Four Phases With Explicit Decision Gates",
      "Readiness across technical, operational, legal, cybersecurity, data governance and organisational dimensions, and a phased plan from the November 2026 finals", "Roadmap",
      "Prototype and architecture notes; dates and budget are proposals for discussion with the Company", "Implementation Plan")
tiles = [("Technical", "Ready", GREEN, "gear", ["Prototype runs end to end on the case data", "SQL schema and API specification written", "Model provider is replaceable by contract"]),
         ("Operational", "Ready", GREEN, "factory", ["Advisory only; no write access to DCS", "Local search continues if the model is offline", "Fits existing OPL and work-order routines"]),
         ("Legal", "Decision needed", AMBER, "book", ["Enterprise AI terms, no training on Company data", "Data held in region (PDP Law)", "Drawing and vendor IP respected"]),
         ("Cybersecurity", "Planned", BLUE, "lock", ["Hub kept outside the OT zone (IEC 62443)", "Roles, audit trail and secret masking", "Prompt-injection guards and rate limits"]),
         ("Data governance", "Ready", GREEN, "shield", ["Owner, revision and status on every record", "48 conflicts held in a managed register", "Approval before knowledge is trusted"]),
         ("Organisation", "Planned", BLUE, "users", ["A champion in each function", "Two-hour role-based training", "Monthly KPI review"])]
tw = 2.05
for i, (t, st, c_, ic, bl) in enumerate(tiles):
    x = 0.35 + i * (tw + 0.07)
    panel(s, x, 1.5, tw, 1.95)
    box(s, x, 1.5, tw, 0.06, c_, None, None, shape=MSO_SHAPE.RECTANGLE)
    pic(s, ic, x + 0.08, 1.64, 0.38, NAVY)
    text(s, x + 0.55, 1.6, tw - 0.6, 0.26, t, 10.5, True, NAVY)
    pill(s, x + 0.55, 1.88, 1.1, st, TINT[c_], c_ if c_ != AMBER else ORANGE, 0.2, 7.5)
    bullet(s, x + 0.08, 2.15, tw - 0.14, 1.3, bl, 8, c_, 2)
RY = 3.54
banner(s, 0.35, RY, 12.65, "Implementation roadmap", NAVY, 0.28, 10, "l")
qs = ["Q4 26", "Q1 27", "Q2 27", "Q3 27", "Q4 27", "Q1 28", "Q2 28", "Q3 28", "Q4 28"]
gx0 = 3.0; gw = 10.0; qw = gw / 9
for i, q in enumerate(qs): box(s, gx0 + i * qw, RY + 0.33, qw - 0.03, 0.22, "27517F" if i % 2 else NAVY, None, [q], 8, True, WHITE, "c", "m", radius=0.04)
ph = [("0  Mobilise", 0, 1, GREY, "Finals 4-5 Nov 2026: data access, owners, enterprise AI terms", "Start"),
      ("1  Pilot, LLDPE unit", 1, 1, BLUE, "90-day pilot: 45 users, case data live, success gates", "Pilot"),
      ("2  Connect", 2, 2, TEAL, "EDMS and AIMS adapters, single sign-on, security review, live tag values", "Integrate"),
      ("3  Extend", 4, 3, GREEN, "Predictive and HSE on live data, digital-twin link, units 2 and 3", "Extend"),
      ("4  Scale", 7, 2, PURPLE, "Plant-wide roll-out and continuous improvement", "Scale")]
y = RY + 0.6
for t, st, ln, c_, d, tag in ph:
    text(s, 0.4, y, 2.55, 0.28, t, 9.3, True, NAVY, anchor="m")
    box(s, gx0 + st * qw, y, ln * qw - 0.03, 0.28, c_, None, [tag], 8.3, True, WHITE, "c", "m", radius=0.05, margin=0.05)
    if st + ln >= 7: text(s, gx0 + st * qw - 6.1, y, 6.0, 0.28, d, 8.3, False, GREY, "r", "m")
    else: text(s, gx0 + (st + ln) * qw + 0.06, y, 6.2, 0.28, d, 8.3, False, GREY, "l", "m")
    y += 0.3
for gq, g, lab in [(2, "G1", "Pilot gates met"), (4, "G2", "Security and integration sign-off"), (7, "G3", "Value review"), (9, "G4", "Scale decision")]:
    gxp = gx0 + gq * qw - 0.03
    box(s, gxp - 0.1, RY + 2.14, 0.2, 0.2, ORANGE, None, None, shape=MSO_SHAPE.DIAMOND)
    if gq >= 7: text(s, gxp - 2.3, RY + 2.1, 2.18, 0.28, [[(g + " ", {"bold": True, "color": ORANGE}), lab]], 8, False, INK, "r", "m")
    else: text(s, gxp + 0.14, RY + 2.1, 2.4, 0.28, [[(g + " ", {"bold": True, "color": ORANGE}), lab]], 8, False, INK, "l", "m")
text(s, 0.4, RY + 2.1, 2.5, 0.28, "Decision gates", 9.3, True, NAVY, anchor="m")
# budget and risks
BY = 6.06
text(s, 0.4, BY - 0.02, 5.2, 0.2, f"One-off budget, IDR {A['one_off']:,.0f} M", 8.8, True, NAVY)
parts_ = [("Integration", 650, BLUE), ("Data", 350, TEAL), ("Change", 250, ORANGE), ("Security", 150, RED)]
bx = 0.4; tot = 1400
for nm, v, c_ in parts_:
    w_ = 5.2 * v / tot
    box(s, bx, BY + 0.2, w_ - 0.02, 0.26, c_, None, [f"{nm} {v}"], 8, True, WHITE, "c", "m", radius=0.03, margin=0.02); bx += w_
text(s, 0.4, BY + 0.5, 5.2, 0.25, f"Run cost IDR {A['run']:.0f} M a year: hosting, model use, monitoring and half a support role", 7.8, False, GREY)
risks = [("Wrong answer", "evidence-only drafting, verification, refusal rules"), ("Poor data quality", "conflict register, named owners"), ("Low adoption", "champions, tools used in daily work"), ("Model cost or outage", "replaceable model, offline fallback")]
for i, (r, m) in enumerate(risks):
    x = 5.85 + (i % 2) * 3.58; y = BY + (i // 2) * 0.4
    box(s, x, y, 3.52, 0.36, TINT[RED], None, [[(r + ": ", {"bold": True, "color": RED}), m]], 8, False, INK, "l", "m", radius=0.08, margin=0.08)
notes(s, "Feasibility. The six tiles are the readiness areas the booklet asks for. Legal needs a decision from the Company on the enterprise AI terms. The roadmap runs from the finals in November 2026 to plant-wide roll-out at the end of 2028 with four decision gates. The one-off budget of IDR 1.4 billion is split across integration, data work, change management and security. The platform is advisory and read-only toward plant systems, which keeps it outside the safety layer.")

# ======================================================= 6 CONCLUSION
s = blank(prs)
frame(s, 6, "Conclusion: A {{Trusted, Traceable}} Knowledge Hub Turns Scattered Plant Knowledge Into Faster, Safer and More Reliable Decisions",
      "Summary of the proposal, how it answers the three key questions of the case, and the decision requested", "Conclusion",
      "Prototype test results (appendix A17) and business case (slide 4, appendix A16)", "Objectives, Key Results and Conclusion")
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
