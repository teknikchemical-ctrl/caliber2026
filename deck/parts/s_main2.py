# ======================================================= 4 BUSINESS IMPACT
s = blank(prs)
frame(s, 4, f"Base case: about IDR {BASE[3]/1000:.1f} B of value a year, paid back in roughly {PB:.0f} months, with downside shown",
      "Business impact: measurable benefits, KPIs and success metrics (assumptions marked; replace with Company figures during the pilot)", "Impact",
      "Case baseline data (work orders, MTTR, breakdowns); assumptions in appendix A8. IDR = Indonesian rupiah")
# left: KPI table
LX, LW = 0.35, 4.55
banner(s, LX, 1.45, LW, "KPIs and success metrics", NAVY)
rows = [("Time to a verified answer", "~15 min (assumed)", "3 min", "clock"), ("Answers with source, version, status", "manual", "100%", "check"),
        ("Breakdown repair time (MTTR)", f"{D['mttr']:.0f} h", f"{D['mttr']*.9:.1f} h", "wrench"), ("Repeat failures within 120 days", f"{D['rep']} of {D['cm_follow']}", "-30%", "refresh"),
        ("Faults found before failure", f"{D['found']*100//(D['found']+D['bad'])}%", "35%", "search"), ("Open document conflicts", f"{D['issues']}", "90% closed", "warn"), ("Lessons captured (OPL)", f"{D['opl']}", "+12 a quarter", "book")]
text(s, LX + 0.55, 1.83, 1.9, 0.2, "KPI", 8, True, GREY); text(s, LX + 2.5, 1.83, 1.05, 0.2, "TODAY", 8, True, GREY, "c"); text(s, LX + 3.55, 1.83, 1.0, 0.2, "TARGET", 8, True, GREEN, "c")
for i, (k, b, t, ic) in enumerate(rows):
    y = 2.05 + i * 0.58
    panel(s, LX, y, LW, 0.53, WHITE if i % 2 else LIGHT, MID)
    pic(s, ic, LX + 0.07, y + 0.1, 0.33, TEAL)
    text(s, LX + 0.5, y, 2.0, 0.53, k, 9, True, NAVY, anchor="m", line=1.0)
    text(s, LX + 2.5, y, 1.05, 0.53, b, 9, False, INK, "c", "m", line=1.0)
    box(s, LX + 3.62, y + 0.1, 0.85, 0.33, TINT[GREEN], None, [t], 9, True, GREEN, "c", "m", radius=0.16, margin=0.02)
text(s, LX, 6.14, LW, 0.25, "Today values marked in the data come from the 211 work orders", 8, False, GREY)
# middle: waterfall
MX, MW = 5.05, 4.2
banner(s, MX, 1.45, MW, "Annual value by lever, base case (IDR M)", NAVY)
cd = CategoryChartData(); cd.categories = ["Search time saved", "Faster fault finding", "Faster ramp-up", "Annual value"]
a_, b_, c3 = BASE[0], BASE[1], BASE[2]
cd.add_series("base", [0, round(a_), round(a_ + b_), 0]); cd.add_series("value", [round(a_), round(b_), round(c3), round(BASE[3])])
gf = s.shapes.add_chart(XL_CHART_TYPE.COLUMN_STACKED, Inches(MX), Inches(1.85), Inches(MW), Inches(2.5), cd); ch = gf.chart
ch.has_legend = False; pl = ch.plots[0]; pl.gap_width = 45; pl.overlap = 100
ch.value_axis.visible = False; ch.value_axis.has_major_gridlines = False; ch.value_axis.maximum_scale = BASE[3] * 1.18
ch.category_axis.tick_labels.font.size = Pt(8.5); ch.category_axis.tick_labels.font.name = FONT; ch.category_axis.format.line.color.rgb = rgb(MID)
sb, sv = pl.series
sb.format.fill.background(); sb.format.line.fill.background()
for i, c_ in enumerate([BLUE, TEAL, PURPLE, NAVY]):
    pt = sv.points[i]; pt.format.fill.solid(); pt.format.fill.fore_color.rgb = rgb(c_)
sv.data_labels.show_value = True; sv.data_labels.font.size = Pt(10); sv.data_labels.font.bold = True; sv.data_labels.font.name = FONT; sv.data_labels.number_format = '#,##0'; sv.data_labels.number_format_is_linked = False
sv.data_labels.font.color.rgb = rgb(WHITE); sv.data_labels.position = XL_LABEL_POSITION.CENTER
# scenario tiles
for i, (nm, sc, pbk, c_) in enumerate([("Low", LOW, PL, GREY), ("Base", BASE, PB, BLUE), ("High", HIGH, PH, GREEN)]):
    x = MX + i * 1.42
    panel(s, x, 4.45, 1.36, 1.2, WHITE if nm != "Base" else TINT[BLUE], c_)
    text(s, x + 0.05, 4.48, 1.26, 0.25, nm + " case", 9, True, c_, "c")
    text(s, x + 0.05, 4.72, 1.26, 0.35, f"IDR {sc[3]/1000:.1f} B", 14, True, NAVY, "c")
    text(s, x + 0.05, 5.06, 1.26, 0.55, [("a year" if True else "")] + [(f"payback {pbk:.0f} mo" if pbk else "no payback in 3 y")], 8.5, False, INK, "c", line=1.0)
text(s, MX, 5.72, MW, 0.7, [[("Levers: ", {"bold": True, "color": NAVY}), f"{A['users']} users saving 20 min a day, repair time cut 10%, and one month faster ramp-up for 4 hires a year. Low and high cases halve or raise each lever."]], 8.6, False, INK, line=1.02)
# right: cumulative cash
RX, RW = 9.4, 3.6
banner(s, RX, 1.45, RW, "Cumulative net benefit (IDR B)", NAVY)
def cum(total):
    pts = [-A["one_off"] / 1000]
    for m in range(1, 37):
        b = (.6 if m <= 12 else 1.0) * total / 12 - A["run"] / 12
        pts.append(pts[-1] + b / 1000)
    return pts
cd2 = CategoryChartData(); cd2.categories = [str(m) for m in range(0, 37)]
for nm, sc in [("Low", LOW), ("Base", BASE), ("High", HIGH)]: cd2.add_series(nm, [round(v, 2) for v in cum(sc[3])])
gf2 = s.shapes.add_chart(XL_CHART_TYPE.LINE, Inches(RX), Inches(1.85), Inches(RW), Inches(2.5), cd2); c2 = gf2.chart
c2.has_legend = True; c2.legend.position = XL_LEGEND_POSITION.BOTTOM; c2.legend.include_in_layout = False; c2.legend.font.size = Pt(8.5); c2.legend.font.name = FONT
for ser, col, w_ in zip(c2.plots[0].series, [GREY, BLUE, GREEN], [1.5, 3.0, 1.5]):
    ser.format.line.color.rgb = rgb(col); ser.format.line.width = Pt(w_); ser.smooth = False; ser.marker.style = None
    from pptx.enum.chart import XL_MARKER_STYLE
    ser.marker.style = XL_MARKER_STYLE.NONE
c2.value_axis.tick_labels.font.size = Pt(8); c2.value_axis.tick_labels.font.name = FONT; c2.value_axis.major_gridlines.format.line.color.rgb = rgb("E3E9F0"); c2.value_axis.format.line.fill.background()
c2.category_axis.tick_labels.font.size = Pt(8); c2.category_axis.tick_labels.font.name = FONT
_ax = c2.category_axis._element
_nm = _ax.find(qn("c:noMultiLvlLbl"))
for tag in ("c:tickLblSkip", "c:tickMarkSkip"):
    e = etree.Element(qn(tag)); e.set("val", "12")
    if _nm is not None: _nm.addprevious(e)
    else: _ax.append(e)
text(s, RX, 4.36, RW, 0.22, "Months from go-live", 8, False, GREY, "c")
for i, (n_, l_) in enumerate([(f"IDR {A['one_off']/1000:.1f} B", "one-off cost"), (f"IDR {A['run']:.0f} M", "run cost a year"), (f"{PB:.0f} months", "payback, base"), (f"{ROI:.0f}%", f"3-year ROI, net IDR {NB/1000:.1f} B")]):
    x = RX + (i % 2) * 1.82; y = 4.62 + (i // 2) * 0.82
    panel(s, x, y, 1.78, 0.76, TINT[BLUE] if i == 2 else WHITE, MID)
    text(s, x + 0.05, y + 0.05, 1.68, 0.38, n_, 14, True, NAVY, "c"); text(s, x + 0.05, y + 0.43, 1.68, 0.3, l_, 8.3, False, GREY, "c")
# bottom strip
panel(s, 0.35, 6.2 + 0.0, 12.65, 0.0, WHITE, WHITE) if False else None
box(s, LX, 6.42, 12.65, 0.46, LIGHT, MID, None, radius=0.06)
text(s, LX + 0.1, 6.42, 12.4, 0.46, [[("90-day pilot gates:  ", {"bold": True, "color": GREEN}), "90%+ answers with an approved source  |  3 min median time to an answer  |  80%+ users rate answers useful  |  0 answers without a source.   ", ("Not counted:  ", {"bold": True, "color": NAVY}), "avoided incidents, spare-part savings, knowledge saved from retirements."]], 8.8, False, INK, "l", "m", line=1.0)
notes(s, "Business impact. The table lists the KPIs with a baseline taken from the case data wherever one exists. The waterfall shows the three monetised levers in the base case: time saved searching, faster fault finding and a faster ramp-up for new engineers. The three tiles give low, base and high cases. The line chart shows cumulative net benefit over three years including the one-off cost of IDR 1.4 billion and IDR 370 million a year to run. The low case does not pay back inside three years, which we show on purpose. Hours and rates are assumptions to be replaced by the Company's own figures in the pilot. MTTR, breakdowns and repeat-failure counts come from the 211 work orders.")

# ======================================================= 5 FEASIBILITY AND ROADMAP
s = blank(prs)
frame(s, 5, "Feasible now: the hub is advisory and read-only toward plant systems, and rolls out behind four decision gates",
      "Feasibility across six readiness areas, and an implementation roadmap from the November 2026 finals to plant-wide use", "Roadmap",
      "Prototype and architecture notes; roadmap dates are proposals for discussion with the Company")
tiles = [("Technical", "Ready", GREEN, "gear", ["Prototype runs end to end on case data", "SQL schema and API spec written", "Model is swappable by contract"]),
         ("Operational", "Ready", GREEN, "factory", ["Advisory only, no write to DCS", "Works offline with local search", "Fits OPL and work-order routines"]),
         ("Legal", "Decision needed", AMBER, "book", ["Enterprise AI terms, no training on our data", "Data held in region (PDP Law)", "Drawing and vendor IP respected"]),
         ("Cybersecurity", "Planned", BLUE, "lock", ["Hub outside the OT zone (IEC 62443)", "Roles, audit trail, secret masking", "Prompt-injection guards, rate limits"]),
         ("Data governance", "Ready", GREEN, "shield", ["Owner, version, status on every file", "48 conflicts held in a register", "Approval before anything is trusted"]),
         ("Organisation", "Planned", BLUE, "users", ["A champion in each function", "Two-hour role-based training", "Monthly KPI review"])]
tw = 2.05
for i, (t, st, c_, ic, bl) in enumerate(tiles):
    x = 0.35 + i * (tw + 0.07)
    panel(s, x, 1.45, tw, 1.95)
    box(s, x, 1.45, tw, 0.06, c_, None, None, shape=MSO_SHAPE.RECTANGLE)
    pic(s, ic, x + 0.08, 1.62, 0.4, NAVY)
    text(s, x + 0.55, 1.58, tw - 0.6, 0.28, t, 10.5, True, NAVY)
    pill(s, x + 0.55, 1.88, 1.1, st, TINT[c_], c_ if c_ != AMBER else ORANGE, 0.22, 8)
    bullet(s, x + 0.08, 2.2, tw - 0.14, 1.2, bl, 8.6, c_, 3)
# roadmap
RY = 3.55
banner(s, 0.35, RY, 12.65, "Implementation roadmap", NAVY, 0.3, 10.5, "l")
qs = ["Q4 26", "Q1 27", "Q2 27", "Q3 27", "Q4 27", "Q1 28", "Q2 28", "Q3 28", "Q4 28"]
gx0 = 3.0; gw = 10.0; qw = gw / 9
for i, q in enumerate(qs): box(s, gx0 + i * qw, RY + 0.36, qw - 0.03, 0.24, "27517F" if i % 2 else NAVY, None, [q], 8.5, True, WHITE, "c", "m", radius=0.04)
ph = [("0  Mobilise", 0, 1, GREY, "Finals 4-5 Nov 2026: data access, owners, enterprise AI terms", "Start"),
      ("1  Pilot, LLDPE unit", 1, 1, BLUE, "90-day pilot: 45 users, case data live, success gates", "Pilot"),
      ("2  Connect", 2, 2, TEAL, "EDMS and AIMS adapters, SSO, security review, live tags", "Integrate"),
      ("3  Extend", 4, 3, GREEN, "Predictive and HSE on live data, digital-twin link, units 2 and 3", "Extend"),
      ("4  Scale", 7, 2, PURPLE, "Plant-wide roll-out and continuous improvement", "Scale")]
y = RY + 0.68
for t, st, ln, c_, d, tag in ph:
    text(s, 0.4, y, 2.55, 0.3, t, 9.5, True, NAVY, anchor="m")
    box(s, gx0 + st * qw, y, ln * qw - 0.03, 0.3, c_, None, [tag], 8.5, True, WHITE, "c", "m", radius=0.05, margin=0.05)
    if st + ln >= 7: text(s, gx0 + st * qw - 5.6, y, 5.5, 0.3, d, 8.5, False, GREY, "r", "m")
    else: text(s, gx0 + (st + ln) * qw + 0.06, y, 6.2, 0.3, d, 8.5, False, GREY, "l", "m")
    y += 0.36
for gq, g, lab in [(2, "G1", "Pilot gates met"), (4, "G2", "Security and integration sign-off"), (7, "G3", "Value review"), (9, "G4", "Scale decision")]:
    gxp = gx0 + gq * qw - 0.03
    box(s, gxp - 0.1, RY + 2.5, 0.2, 0.2, ORANGE, None, None, shape=MSO_SHAPE.DIAMOND)
    if gq >= 7: text(s, gxp - 2.3, RY + 2.46, 2.18, 0.28, [[(g + " ", {"bold": True, "color": ORANGE}), lab]], 8, False, INK, "r", "m")
    else: text(s, gxp + 0.14, RY + 2.46, 2.4, 0.28, [[(g + " ", {"bold": True, "color": ORANGE}), lab]], 8, False, INK, "l", "m")
text(s, 0.4, RY + 2.46, 2.5, 0.28, "Decision gates", 9.5, True, NAVY, anchor="m")
# risks
RY2 = 6.34
risks = [("Wrong answer", "sources, verification, refusal rules"), ("Poor data", "conflict register, owners"), ("Low adoption", "champions, daily-use tools"), ("Model cost or outage", "swappable model, offline fallback")]
text(s, 0.4, RY2, 1.2, 0.5, "Main risks and mitigations", 8.8, True, RED, anchor="m", line=1.0)
for i, (r, m) in enumerate(risks):
    x = 1.7 + i * 2.82
    box(s, x, RY2, 2.76, 0.5, TINT[RED], None, [[(r + ": ", {"bold": True, "color": RED}), m]], 8.5, False, INK, "l", "m", radius=0.08, margin=0.1)
notes(s, "Feasibility. The six tiles are the readiness areas the booklet asks for: technical, operational, legal, cybersecurity, data governance and organisation. Legal needs a decision from the Company about the enterprise AI terms. The roadmap runs from the finals in November 2026 to plant-wide roll-out at the end of 2028, with four decision gates. The system is advisory and read-only toward plant systems, which keeps it outside the safety layer.")

# ======================================================= 6 CONCLUSION
s = blank(prs)
frame(s, 6, "Engineers get one verified answer in minutes, and the plant keeps what its people know",
      "Conclusion: the proposal, how it answers the three key questions of the case, and what we ask for next", "Conclusion",
      "Prototype test results (appendix A9) and business case (slide 4, appendix A8)")
pillars = [("CONNECT", "One governed, tag-keyed base", BLUE, "net", [f"{D['docs']} documents and {D['wo']} work orders joined", f"{D['issues']} conflicts surfaced and owned", "Ingest, check, approve for every file"]),
           ("ASK", "Answers that show their proof", TEAL, "search", ["Source, revision, status, confidence", f"{D['evals']} of {D['evals']} test questions passed", "Bypass requests refused"]),
           ("ACT", "Knowledge in daily decisions", ORANGE, "gear", ["Failure memory with RCA and lessons", "Risk ranking, readiness, hazards, site plan", "Read-only EDMS, AIMS, twin links"])]
for i, (a, b, c_, ic, bl) in enumerate(pillars):
    x = 0.35 + i * 4.25
    panel(s, x, 1.45, 4.15, 1.95)
    box(s, x, 1.45, 4.15, 0.5, c_, None, None, shape=MSO_SHAPE.RECTANGLE)
    pic(s, ic, x + 0.1, 1.5, 0.4, c_, False) if False else None
    text(s, x + 0.15, 1.45, 4.0, 0.5, [[(a + "   ", {"bold": True, "size": 14, "color": WHITE}), (b, {"size": 10.5, "color": "EAF2FB"})]], 12, True, WHITE, "l", "m")
    bullet(s, x + 0.15, 2.02, 3.85, 0.95, bl, 10, c_, 3)
    text(s, x + 0.15, 2.88, 1.7, 0.5, ["98 to 1", f"{D['evals']}/{D['evals']}", f"{D['tools']} tools"][i], 22, True, c_)
    text(s, x + 1.9, 2.92, 2.2, 0.45, ["documents into one governed base", "questions answered with proof", "computed from live records"][i], 9, False, GREY, anchor="m", line=1.0)
# key questions table
banner(s, 0.35, 3.52, 12.65, "How the proposal answers the three key questions of the case", NAVY, 0.3, 10.5, "l")
kq = [("Q1", "Build a structured Industrial Data Ops foundation", "Tag-keyed data model over 7 source types; ingest, check and approve with owners; conflicts found on day one", "98 docs, 1,109 passages, 48 conflicts logged"),
      ("Q2", "Help engineers find trusted answers faster, reduce improper execution", "Hybrid search; cited answers with revision, status, confidence; verification of quotes and numbers; refusal rules", f"{D['evals']}/{D['evals']} questions; 3 min target vs ~15 min"),
      ("Q3", "Integrate with operational systems for reliability and improvement", "Read-only EDMS, AIMS, historian, twin links; failure memory, predictive, readiness, hazard and site planning", f"{D['bt']}-forecast backtest; {D['tools']} computed tools")]
for i, (q, a, b, c_) in enumerate(kq):
    y = 3.9 + i * 0.7
    panel(s, 0.35, y, 12.65, 0.64, WHITE if i % 2 else LIGHT, MID)
    numdot(s, 0.45, y + 0.15, q, [BLUE, TEAL, ORANGE][i], 0.36, 9)
    text(s, 0.95, y, 3.3, 0.64, a, 9.5, True, NAVY, anchor="m", line=1.0)
    text(s, 4.35, y, 5.6, 0.64, b, 9, False, INK, anchor="m", line=1.0)
    text(s, 10.1, y, 2.85, 0.64, [[("Evidence: ", {"bold": True, "color": GREEN}), c_]], 8.8, False, INK, anchor="m", line=1.0)
# next 90 days
banner(s, 0.35, 6.02, 3.0, "The ask: a 90-day pilot", GREEN, 0.84, 11, "c")
steps = [("Weeks 1-2", "Agree data access, owners and AI terms"), ("Weeks 3-6", "Load the LLDPE unit, train 45 users"), ("Weeks 7-12", "Run to the success gates, then decide")]
for i, (w_, d) in enumerate(steps):
    x = 3.5 + i * 3.18
    panel(s, x, 6.02, 3.1, 0.84, TINT[GREEN], "BFE3CB")
    text(s, x + 0.1, 6.05, 2.9, 0.26, w_, 9.5, True, GREEN); text(s, x + 0.1, 6.32, 2.9, 0.5, d, 9.3, False, INK, line=1.0)
    if i < 2: arrow(s, x + 3.1, 6.44, x + 3.18, 6.44, GREEN, 1.6)
notes(s, "Conclusion. Three pillars, then the three key questions answered one by one with the evidence from the prototype. The ask is a 90-day pilot on the LLDPE unit with 45 users, with success gates agreed up front. Close on trust: sources on every answer, owners on every document, limits on every forecast.")

# ======================================================= 7 TEAM
s = blank(prs)
frame(s, 7, "Team profile", "Team name, university, supervisor and members (replace the bracketed fields before submitting)", None, None)
text(s, 0.55, 1.5, 12.2, 0.4, [[("Team name: ", {"bold": True, "color": NAVY}), "[Team name]        ", ("University: ", {"bold": True, "color": NAVY}), "[University]        ", ("Supervisor: ", {"bold": True, "color": NAVY}), "[Supervisor name]"]], 13)
trows = [["No.", "Name", "Major", "Semester", "Area of expertise", "Contribution to the proposal"],
         ["1", "[Name]", "[Computer Science]", "[6]", "[AI and software]", "[Formulated the idea, built the prototype and the assistant]"],
         ["2", "[Name]", "[Chemical Engineering]", "[7]", "[Process and reliability]", "[Background and problem, process content, hazard models]"],
         ["3", "[Name]", "[Industrial Engineering]", "[7]", "[Maintenance and business case]", "[Business impact, KPIs, roadmap]"]]
table(s, 0.55, 2.1, 12.2, [0.5, 1.8, 2.3, 1.0, 2.5, 4.1], trows, 11, rowh=0.7, header_fill=NAVY)
text(s, 0.55, 5.2, 12.2, 0.5, "The booklet allows two to three members from the same university. Delete unused rows.", 10.5, False, GREY)
notes(s, "Team. Fill in names, majors, semesters, expertise and contributions as required by the booklet table.")
