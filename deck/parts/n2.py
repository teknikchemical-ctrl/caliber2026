# ======================================================= 4 AI ASSISTANT, 5 BUSINESS IMPACT, 6 FEASIBILITY, 7 CONCLUSION, 8 TEAM
from flow import *
from pptx.enum.chart import XL_MARKER_STYLE

# ---------------------------------------------------------------- 4 AI assistant flowchart
s = blank(prs)
frame(s, 4, "Solution: every question is {{routed to a computed function}} first, and the language model only words the verified result",
      None, "Solution", "Prototype assistant (intent router, retrieval index, 20 registered tools) and the Netlify function /api/ai. Tool names are the ones registered in the application", "Proposed solution (continued)")
ptitle(s, 0.4, 1.26, 2.15, "User", BLUE)
for i, r_ in enumerate(["Operator", "Maintenance engineer", "Reliability engineer", "HSE engineer", "Plant manager"]):
    fbox(s, 1.475, 1.84 + i * 0.45, 2.15, 0.38, r_, None, BLUE, tsize=9)
box(s, 0.4, 4.0, 2.15, 1.1, TINT[BLUE], BLUE, [[("Example question", {"bold": True, "size": 9, "color": BLUE})], [("What usually causes a mechanical seal leak on the hexane feed pump, and how was it fixed?", {"size": 9, "color": INK})]], 9, False, INK, "c", "m", radius=0.08, lw=1.2, margin=0.08)
arrow(s, 1.475, 3.8, 1.475, 3.98, BLUE, 1.5)
arrow(s, 2.57, 3.4, 2.83, 3.4, BLUE, 2.0)
ptitle(s, 2.85, 1.26, 2.6, "AI assistant (in the browser)", TEAL)
box(s, 2.85, 1.62, 2.6, 3.48, "F2FAF8", None, None, radius=0.04)
steps4 = [("1  Detect intent", "Intent, tags and equipment", TEAL), ("2  Safety guard", "Unsafe requests are refused", RED), ("3  Retrieve evidence", "BM25F ranking and role filter", TEAL), ("4  Choose function", "Computed tool, or open question", TEAL)]
for i, (t_, d_, c_) in enumerate(steps4):
    cy = 2.02 + i * 0.85
    fbox(s, 4.15, cy, 2.3, 0.62, t_, d_, c_, tsize=9.5, ssize=8.5)
    if i < 3: arrow(s, 4.15, cy + 0.31, 4.15, cy + 0.54, GREY, 1.5)
ptitle(s, 5.8, 1.26, 3.55, "Functions: 20 computed tools", ORANGE)
groups = [("Reliability and cost (7)", BLUE, "maintenance_stats, kpi_summary, failure_modes, predictive_maintenance, failure_memory, history_lookup, spares_outlook", 1.62, 1.0),
          ("Assets and limits (6)", TEAL, "equipment_info, spec_lookup, tag_facts, plot_plan_query, compare_equipment, rank_equipment", 2.72, 0.9),
          ("Operations and safety (6)", RED, "interlock_info, procedure_help, consequence_analysis, cascade_analysis, hazard_effects, safety_guard", 3.72, 0.9),
          ("Data quality (1)", ORANGE, "data_issues", 4.72, 0.38)]
for t_, c_, names, y_, h_ in groups:
    if h_ > 0.5: box(s, 5.8, y_, 3.55, h_, WHITE, c_, [[(t_, {"bold": True, "size": 9.5, "color": c_})], [(names, {"size": 8.3, "color": INK})]], 9, False, INK, "l", "m", radius=0.08, lw=1.3, margin=0.1)
    else: box(s, 5.8, y_, 3.55, h_, WHITE, c_, [[(t_ + ":  ", {"bold": True, "size": 9.5, "color": c_}), ("data_issues", {"size": 8.3, "color": INK})]], 9, False, INK, "l", "m", radius=0.08, lw=1.3, margin=0.1)
    arrow(s, 5.62, y_ + h_ / 2, 5.78, y_ + h_ / 2, c_, 1.5)
arrow(s, 5.47, 4.57, 5.62, 4.57, GREY, 1.5, False); arrow(s, 5.62, 2.12, 5.62, 4.91, GREY, 1.5, False)
arrow(s, 9.37, 2.12, 9.5, 2.12, GREY, 1.5, False)
for y_ in (3.17, 4.17, 4.91): arrow(s, 9.35, y_, 9.5, y_, GREY, 1.5, False)
arrow(s, 9.5, 2.12, 9.5, 4.91, GREY, 1.5, False); arrow(s, 9.5, 2.12, 9.67, 2.12, GREY, 1.5)
ptitle(s, 9.65, 1.26, 3.3, "Wording and checking", PURPLE)
fbox(s, 11.3, 2.12, 3.3, 0.55, "Computed result", "Figures with their source records", TEAL, tsize=9.5, ssize=8.5)
arrow(s, 11.3, 2.4, 11.3, 2.55, GREY, 1.5)
fbox(s, 11.3, 3.0, 3.3, 0.85, "Gemini 2.5 Flash words the answer", "Free tier through /api/ai, temperature 0.2, up to 3 tool rounds. If it is unavailable, the local draft is shown.", PURPLE, tsize=9.3, ssize=8.2)
arrow(s, 10.9, 3.43, 10.9, 3.6, GREY, 1.5)
fdia(s, 10.9, 4.08, 2.0, 0.95, "Figures match the sources?", AMBER, 8.3)
box(s, 11.95, 3.87, 1.0, 0.42, TINT[AMBER], AMBER, [[("No: lower the score", {"bold": True, "size": 8.2, "color": NAVY})]], 8.2, True, NAVY, "c", "m", radius=0.08, lw=1.0, margin=0.03)
arrow(s, 11.9, 4.08, 11.95, 4.08, AMBER, 1.3)
flab(s, 10.97, 4.5, "Yes", GREEN, 0.4)
arrow(s, 10.9, 4.55, 10.9, 4.65, GREY, 1.5)
fbox(s, 11.3, 4.88, 3.3, 0.45, "Answer with sources and confidence", None, GREEN, solid=True, tsize=9.3)
# worked example
box(s, 0.4, 5.22, 1.55, 0.96, NAVY, None, [[("Worked example", {"bold": True, "size": 10, "color": WHITE})], [("Q2, from the prototype", {"size": 8.5, "color": "DCE8F5"})]], 10, False, WHITE, "c", "m", radius=0.08, margin=0.05)
ex = [(1.9, "Question", "Seal leak on pump GA-1201A", TEAL, False), (1.55, "Intent", "Diagnosis from history", TEAL, False), (1.45, "Function", "failure_memory", ORANGE, False), (3.3, "Result", "10 similar failures. Most supported fix, in 7 cases: replace the seal cartridge, clean the flush orifice, verify PDI-1201.", ORANGE, False), (1.95, "Answer", "High confidence, 80%. Four sources, including WO-240002.", GREEN, True)]
gap = (12.95 - 2.1 - sum(e[0] for e in ex)) / 4; xx = 2.1
for i, (w_, t_, d_, c_, sol) in enumerate(ex):
    fbox(s, xx + w_ / 2, 5.7, w_, 0.96, t_, d_, c_, solid=sol, tsize=9.3, ssize=8.2)
    if i < 4: arrow(s, xx + w_ + 0.02, 5.7, xx + w_ + gap - 0.02, 5.7, GREY, 1.5)
    xx += w_ + gap
ribbon(s, "The assistant decides what to compute and what to retrieve before the language model sees anything. Gemini only words the result, and a figure that cannot be found in a cited source lowers the confidence score.")
notes(s, "AI assistant. The user asks a question in the browser. The assistant detects the intent, applies a safety guard that refuses requests to bypass a trip, retrieves evidence with the BM25F index and chooses a function. Twenty computed tools in four groups produce figures with their source records. Gemini 2.5 Flash, called through the Netlify function on the free tier, only words the result. A check compares every figure and quote with the cited sources; if one is missing, the confidence score is lowered. If the model is unavailable the local draft is shown. The worked example is a real answer from the prototype: ten similar seal failures on GA-1201A, the most supported fix in 7 cases, high confidence 80 percent.")

# ---------------------------------------------------------------- 5 business impact at industrial scale
s = blank(prs)
def scen(N):
    val = [BASE[0] * N, BASE[1] * N, BASE[2] * N]; tot = sum(val)
    one = 1050 + 350 * N; run = 370 + 120 * (N - 1)
    y1 = .6 * tot - run; y2 = tot - run
    pb = one / y1 * 12 if one <= y1 else 12 + (one - y1) / y2 * 12
    return dict(N=N, val=val, tot=tot, one=one, run=run, y1=y1, y2=y2, pb=pb, net3=-one + y1 + 2 * y2)
SC = [scen(1), scen(3), scen(6)]
S3 = SC[1]
frame(s, 5, f"Business impact: at three units the platform could return about {{{{IDR {S3['tot']/1000:.1f} B}}}} a year and pay back in about {S3['pb']:.0f} months",
      None, "Impact", "Base inputs: 211 work orders (20.4 breakdowns a year, MTTR 14.0 h). All other inputs are assumptions or estimates, listed in the left panel, that the pilot replaces with Company data", "Impact assessment and projection")
for i, (n_, l_, c_) in enumerate([(f"IDR {S3['tot']/1000:.1f} B", "Value a year at 3 units", GREEN), (f"{S3['pb']:.0f} months", "Payback at 3 units", ORANGE), (f"IDR {S3['net3']/1000:.1f} B", "Net benefit over 3 years", BLUE)]):
    box(s, 0.4 + i * 1.4, 1.26, 1.34, 0.8, TINT[c_], c_, [[(n_, {"bold": True, "size": 14, "color": c_})], [(l_, {"size": 8, "color": INK})]], 14, False, INK, "c", "m", radius=0.08, lw=1.2, margin=0.03)
rows5 = [["", "1 unit (pilot)", "3 units", "6 units"],
         ["Users", "45", "135", "270"],
         ["Value a year (IDR M)"] + [f"{x['tot']:,.0f}" for x in SC],
         ["One-off cost (IDR M)"] + [f"{x['one']:,.0f}" for x in SC],
         ["Running cost a year"] + [f"{x['run']:,.0f}" for x in SC],
         ["Payback"] + [f"{x['pb']:.0f} months" for x in SC],
         ["Net over 3 years"] + [f"{x['net3']:,.0f}" for x in SC]]
table(s, 0.4, 2.12, 4.2, [1.55, 0.95, 0.85, 0.85], rows5, 9, rowh=0.29, header_fill=NAVY, bold_first=True)
srcs5 = [("CASE DATA", GREEN, "20.4 breakdowns a year and a 14.0 h MTTR, from the 211 work orders."),
         ("ASSUMED", GREY, "20 min saved per user a day, 230 days, IDR 175,000 per hour, IDR 30 M per downtime hour, 10% shorter repairs, IDR 60 M ramp-up."),
         ("ESTIMATE", BLUE, "Pilot cost of IDR 1,400 M one-off and 370 M a year (slide 6)."),
         ("SCALING", PURPLE, "Each added unit matches the LLDPE unit. Shared cost IDR 1,050 M, data work 350 M per unit, support 120 M a year per added unit.")]
hs = [0.36, 0.58, 0.36, 0.58]; yy = 4.22
for (tg, c_, d_), h_ in zip(srcs5, hs):
    box(s, 0.4, yy, 4.2, h_, WHITE, MID, None, radius=0.05, lw=0.8)
    pill(s, 0.46, yy + (h_ - 0.22) / 2, 0.82, tg, TINT.get(c_, LIGHT), c_, 0.22, 7.5)
    text(s, 1.34, yy, 3.24, h_, d_, 8.2, False, INK, anchor="m", line=0.95)
    yy += h_ + 0.04
# middle: charts
ptitle(s, 4.8, 1.26, 4.1, "Annual value by lever (IDR M)", NAVY)
cd = CategoryChartData(); cd.categories = ["1 unit", "3 units", "6 units"]
for k, nm in enumerate(["Search time", "Repair time", "Ramp-up"]): cd.add_series(nm, [round(x["val"][k]) for x in SC])
gf = s.shapes.add_chart(XL_CHART_TYPE.COLUMN_STACKED, Inches(4.8), Inches(1.56), Inches(4.1), Inches(2.2), cd); ch = gf.chart
ch.has_legend = True; ch.legend.position = XL_LEGEND_POSITION.BOTTOM; ch.legend.include_in_layout = False; ch.legend.font.size = Pt(9); ch.legend.font.name = FONT
ch.plots[0].gap_width = 45; ch.plots[0].overlap = 100; ch.value_axis.visible = False; ch.value_axis.has_major_gridlines = False
ch.category_axis.tick_labels.font.size = Pt(9.5); ch.category_axis.tick_labels.font.name = FONT
for ser, c_ in zip(ch.plots[0].series, [BLUE, TEAL, PURPLE]):
    ser.format.fill.solid(); ser.format.fill.fore_color.rgb = rgb(c_)
    if c_ != PURPLE:
        ser.data_labels.show_value = True; ser.data_labels.font.size = Pt(9); ser.data_labels.font.bold = True; ser.data_labels.font.name = FONT; ser.data_labels.font.color.rgb = rgb(WHITE); ser.data_labels.number_format = '#,##0'; ser.data_labels.number_format_is_linked = False
ptitle(s, 4.8, 3.86, 4.1, "Cumulative net benefit (IDR M), months 0 to 36", NAVY)
def cumn(x):
    pts = [-x["one"]]
    for m in range(1, 37): pts.append(pts[-1] + ((x["y1"] if m <= 12 else x["y2"]) / 12))
    return pts
cd2 = CategoryChartData(); cd2.categories = [str(m) for m in range(0, 37)]
for nm, x in zip(["1 unit", "3 units", "6 units"], SC): cd2.add_series(nm, [round(v) for v in cumn(x)])
gf2 = s.shapes.add_chart(XL_CHART_TYPE.LINE, Inches(4.8), Inches(4.16), Inches(4.1), Inches(2.02), cd2); c2 = gf2.chart
c2.has_legend = True; c2.legend.position = XL_LEGEND_POSITION.BOTTOM; c2.legend.include_in_layout = False; c2.legend.font.size = Pt(9); c2.legend.font.name = FONT
for ser, col, w_ in zip(c2.plots[0].series, [GREY, BLUE, GREEN], [1.75, 2.75, 2.75]):
    ser.format.line.color.rgb = rgb(col); ser.format.line.width = Pt(w_); ser.smooth = False; ser.marker.style = XL_MARKER_STYLE.NONE
c2.value_axis.tick_labels.number_format = '#,##0'; c2.value_axis.tick_labels.number_format_is_linked = False; c2.value_axis.tick_labels.font.size = Pt(8.5); c2.value_axis.tick_labels.font.name = FONT; c2.value_axis.major_gridlines.format.line.color.rgb = rgb("E3E9F0"); c2.value_axis.format.line.fill.background()
c2.category_axis.tick_labels.font.size = Pt(8.5); c2.category_axis.tick_labels.font.name = FONT
_ax = c2.category_axis._element; _nm = _ax.find(qn("c:noMultiLvlLbl"))
for tag_ in ("c:tickLblSkip", "c:tickMarkSkip"):
    e = etree.Element(qn(tag_)); e.set("val", "12")
    if _nm is not None: _nm.addprevious(e)
    else: _ax.append(e)
# right: success metrics
ptitle(s, 9.1, 1.26, 3.85, "KPIs and success metrics", NAVY)
rows5b = [["KPI", "Baseline", "Target", "Measured by"],
          ["Time searching and checking sources", "40 min a day (assumed)", "20 min a day", "Usage log and user survey"],
          ["Mean time to repair", "14.0 h", "12.6 h (10% lower)", "Work-order closure dates"],
          ["Repeat failures within 120 days", "8 of 55 jobs", "30% fewer", "Failure memory report"],
          ["Answers with an approved source", "Not measured", "At least 90%", "Answer audit log"],
          ["Median time to a cited answer", "About 15 min (assumed)", "3 min or less", "Timed pilot tasks"],
          ["Users who rate answers useful", "Not measured", "At least 80%", "Feedback buttons in the app"]]
table(s, 9.1, 1.58, 3.85, [1.35, 0.95, 0.8, 0.95], rows5b, 8, rowh=0.66, header_fill=NAVY, bold_first=True)
ribbon(s, "Value grows with each unit while the shared platform cost stays fixed, so payback shortens from about 21 months for the pilot unit to about 12 months for three units. All scaling inputs are planning assumptions, and the pilot replaces them with measured Company data.")
notes(s, "Business impact at industrial scale. The pilot unit has 45 users and a base-case value of IDR 1.52 B a year: search time 604 M, repair time 857 M and ramp-up 60 M. The scale scenarios assume that each added unit matches the LLDPE unit, with a shared platform cost of IDR 1,050 M, data work of IDR 350 M per unit and extra support of IDR 120 M a year per added unit. Under these assumptions three units return about IDR 4.6 B a year and pay back in about 12 months, and six units return about IDR 9.1 B. Calculations: search time is 45 users x 20 minutes x 230 days at IDR 175,000 an hour; repair time is 20.4 breakdowns x 14.0 hours x 10 percent at IDR 30 M per downtime hour. Only the breakdown rate and MTTR come from the case data. The table on the right lists the KPIs, targets and how each will be measured in the pilot.")

# ---------------------------------------------------------------- 6 feasibility and roadmap
s = blank(prs)
frame(s, 6, "Feasibility: a {{read-only pilot}} on the existing stack is realistic now, and each scale-up step is gated by a decision",
      None, "Roadmap", "Prototype and architecture notes. Dates and budget are proposals for discussion with the Company", "Implementation plan")
ptitle(s, 0.4, 1.26, 7.15, "Implementation feasibility: six readiness dimensions", NAVY)
hd = [("Dimension", 1.35), ("Status", 0.9), ("In place today", 2.55), ("Still needed", 2.35)]
hx = 0.4
for t_, w_ in hd:
    box(s, hx, 1.56, w_ - 0.02, 0.24, "27517F", None, [t_], 8.5, True, WHITE, "l", "m", radius=0.03, margin=0.06); hx += w_
rd = [("Technical", "Ready", GREEN, "gear", "Prototype runs end to end; SQL schema and API specification are written.", "Production database and ingestion queue."),
      ("Operational", "Ready", GREEN, "factory", "Advisory only; works offline from local search; fits the OPL and work-order routines.", "Shift-team trial and a champion in each function."),
      ("Legal", "Decision needed", AMBER, "book", "Drawings and vendor documents are used under their existing rights; data stays in region.", "Enterprise AI terms with no training on Company data; PDP law review."),
      ("Cybersecurity", "Planned", BLUE, "lock", "Roles, audit trail, secret masking, prompt-injection guards and rate limits.", "Single sign-on, key vault, hosting outside the OT zone (IEC 62443), penetration test."),
      ("Data governance", "Ready", GREEN, "shield", "Every record has an owner, revision and status; 48 conflicts are in a managed register.", "Named data stewards and refresh rules for each source."),
      ("Organisation", "Planned", BLUE, "users", "A role-based approval workflow is built in.", "Two-hour role-based training, monthly KPI review and an executive sponsor.")]
for i, (t_, st, c_, ic, a1, a2) in enumerate(rd):
    y = 1.82 + i * 0.4; fill = WHITE if i % 2 else LIGHT
    box(s, 0.4, y, 7.13, 0.38, fill, MID, None, radius=0.02, lw=0.8)
    pic(s, ic, 0.44, y + 0.05, 0.28, NAVY); text(s, 0.76, y, 0.98, 0.38, t_, 8.5, True, NAVY, anchor="m", line=0.9)
    pill(s, 1.77, y + 0.08, 0.84, st, TINT[c_], c_ if c_ != AMBER else ORANGE, 0.22, 7.5)
    text(s, 2.67, y, 2.5, 0.38, a1, 8, False, INK, anchor="m", line=0.88); text(s, 5.2, y, 2.3, 0.38, a2, 8, False, INK, anchor="m", line=0.88)
ptitle(s, 7.75, 1.26, 5.2, "Deployment path and budget", NAVY)
dp = [("Prototype today", BLUE, "Static web page, Netlify Functions and Blobs, Gemini 2.5 Flash on the free tier, local fallback."), ("Pilot, 90 days", TEAL, "Same stack with read-only EDMS and AIMS adapters, single sign-on and 45 users."), ("Production", GREEN, "PostgreSQL with pgvector, ingestion queue, a Company-approved model and SIEM export.")]
for i, (t_, c_, d_) in enumerate(dp):
    cy = 1.82 + i * 0.5
    box(s, 7.75, cy - 0.22, 1.3, 0.44, c_, None, [[(t_, {"bold": True, "size": 9, "color": WHITE})]], 9, True, WHITE, "c", "m", radius=0.08, margin=0.04)
    arrow(s, 9.07, cy, 9.2, cy, c_, 1.5)
    box(s, 9.22, cy - 0.22, 3.73, 0.44, WHITE, c_, [[(d_, {"size": 8, "color": INK})]], 8.3, False, INK, "l", "m", radius=0.08, lw=1.2, margin=0.08)
    if i < 2: arrow(s, 8.4, cy + 0.22, 8.4, cy + 0.28, GREY, 1.4)
text(s, 7.75, 3.12, 5.2, 0.22, f"One-off budget of IDR {A['one_off']:,.0f} M and a running cost of IDR {A['run']:.0f} M a year", 9, True, NAVY)
bx = 7.75
for nm, v, c_ in [("Integration", 650, BLUE), ("Data", 350, TEAL), ("Change", 250, ORANGE), ("Security", 150, RED)]:
    w_ = 5.2 * v / 1400
    box(s, bx, 3.38, w_ - 0.03, 0.26, c_, None, [[(f"{nm} {v}" if v >= 250 else str(v), {"bold": True, "size": 8.5, "color": WHITE})]], 8.5, True, WHITE, "c", "m", radius=0.03, margin=0.0)
    bx += w_
text(s, 7.75, 3.67, 5.2, 0.34, "Integration covers EDMS, AIMS and historian adapters. Data covers cleanup and stewards. Change covers training and champions. The last 150 is security: single sign-on, key vault and a penetration test.", 8, False, INK, line=0.95)
text(s, 7.75, 4.0, 5.2, 0.34, [[("Main risks and controls: ", {"bold": True, "color": RED}), "wrong answers (cited evidence and checks), poor data (conflict register), low adoption (champions), model outage (local fallback)."]], 8, False, INK, line=0.95)
# roadmap
RY = 4.4
ptitle(s, 0.4, RY, 12.55, "Implementation roadmap", NAVY, 0.24)
qs = ["Q4 26", "Q1 27", "Q2 27", "Q3 27", "Q4 27", "Q1 28", "Q2 28", "Q3 28", "Q4 28"]
gx0 = 2.9; gw = 10.05; qw = gw / 9
for i, q in enumerate(qs): box(s, gx0 + i * qw, RY + 0.27, qw - 0.03, 0.19, "27517F" if i % 2 else NAVY, None, [q], 8, True, WHITE, "c", "m", radius=0.04)
ph = [("0  Mobilise", 0, 1, GREY, "Start", "After the finals (4 to 5 November 2026): data access, owners, AI terms"),
      ("1  Pilot, LLDPE unit", 1, 1, BLUE, "Pilot", "90 days, 45 users, success gates"),
      ("2  Connect", 2, 2, TEAL, "Integrate", "EDMS and AIMS adapters, single sign-on, security review, live tag values"),
      ("3  Extend", 4, 3, GREEN, "Extend", "Predictive and HSE features on live data, digital twin link, units 2 and 3"),
      ("4  Scale", 7, 2, PURPLE, "Scale", "Plant-wide roll-out and continuous improvement")]
y = RY + 0.48
for t_, st, ln, c_, tg, d_ in ph:
    text(s, 0.45, y, 2.4, 0.2, t_, 8.5, True, NAVY, anchor="m")
    box(s, gx0 + st * qw, y, ln * qw - 0.03, 0.2, c_, None, [tg], 8, True, WHITE, "c", "m", radius=0.05, margin=0.02)
    if st + ln >= 7: text(s, gx0 + st * qw - 6.4, y, 6.3, 0.2, d_, 8, False, GREY, "r", "m")
    else: text(s, gx0 + (st + ln) * qw + 0.06, y, 6.4, 0.2, d_, 8, False, GREY, "l", "m")
    y += 0.2
for gq, g, lb in [(2, "G1", "Pilot gates met"), (4, "G2", "Security and integration sign-off"), (7, "G3", "Value review"), (9, "G4", "Scale decision")]:
    gxp = gx0 + gq * qw - 0.03
    box(s, gxp - 0.08, y + 0.02, 0.16, 0.16, ORANGE, None, None, shape=MSO_SHAPE.DIAMOND)
    if gq >= 7: text(s, gxp - 2.4, y - 0.01, 2.3, 0.22, [[(g + " ", {"bold": True, "color": ORANGE}), lb]], 8, False, INK, "r", "m")
    else: text(s, gxp + 0.12, y - 0.01, 2.5, 0.22, [[(g + " ", {"bold": True, "color": ORANGE}), lb]], 8, False, INK, "l", "m")
text(s, 0.45, y - 0.01, 2.4, 0.22, "Decision gates", 8.5, True, NAVY, anchor="m")
ribbon(s, "The pilot needs only the existing stack and read-only exports from EDMS and AIMS. Four decision gates let the Company stop or continue at each step, and the pilot itself needs a one-off budget of IDR 1.4 B.")
notes(s, "Feasibility. The matrix covers the readiness areas required by the booklet. Legal needs a decision from the Company on enterprise AI terms. The deployment path starts from the prototype stack, moves to a read-only pilot with 45 users and then to a production setup with PostgreSQL and a Company-approved model. The one-off budget of IDR 1,400 M is split into integration 650, data 350, change management 250 and security 150, with a running cost of IDR 370 M a year. The roadmap has four decision gates: pilot gates met, security and integration sign-off, value review and scale decision.")

# ---------------------------------------------------------------- 7 conclusion
s = blank(prs)
frame(s, 7, "Conclusion: a 90-day pilot will show whether the platform {{reduces search time and repair time}} at the LLDPE unit",
      None, "Conclusion", "Prototype test results (128 of 128 evaluation questions; static, regression and layout checks) and the business case on slide 5", "Summary and decision")
cols7 = [("Proposed solution", BLUE, ["Links 98 documents and 211 work orders to the equipment tag.", "Answers questions with cited sources and a confidence score.", "Supports failure analysis, simulation, start-up checks and planning.", "Uses a free-tier model with a local fallback, so the pilot needs no paid model licence."]),
         ("Key value", GREEN, None),
         ("Expected outcomes", ORANGE, ["At least 90% of answers carry an approved source.", "The median time to a cited answer is 3 minutes or less.", "At least 80% of users rate the answers as useful.", "No answer is given without a source.", "At least 90% of the 48 document conflicts are closed or accepted."])]
for i, (t_, c_, bl) in enumerate(cols7):
    x = 0.4 + i * 4.2
    ptitle(s, x, 1.26, 4.15, t_, c_, 0.3)
    box(s, x, 1.6, 4.15, 2.3, WHITE, c_, None, radius=0.05, lw=1.2)
    if bl: bullet(s, x + 0.12, 1.72, 3.9, 2.1, bl, 10.5, c_, 8)
    else:
        for k, (n_, l_) in enumerate([(f"IDR {BASE[3]/1000:.1f} B", "Value a year for one unit, base case"), (f"{PB:.0f} months", "Payback for one unit"), (f"IDR {S3['tot']/1000:.1f} B", "Value a year at three units"), ("20 min", "Saved per engineer each day (assumed)")]):
            xx = x + 0.1 + (k % 2) * 2.0; yy = 1.7 + (k // 2) * 1.05
            box(s, xx, yy, 1.95, 0.98, TINT[GREEN], GREEN, [[(n_, {"bold": True, "size": 15, "color": GREEN})], [(l_, {"size": 8.5, "color": INK})]], 15, False, INK, "c", "m", radius=0.08, lw=1.1, margin=0.05)
ptitle(s, 0.4, 4.02, 12.55, "Key questions of the case, and how the proposal answers each", NAVY, 0.28)
kq = [("1", "How can the Company build a structured Industrial Data Ops foundation to connect scattered plant knowledge sources?", "Build a connected knowledge foundation. Checked ingestion links 98 documents and 211 work orders by equipment tag, places 48 conflicts in a register and requires an owner's approval.", BLUE),
      ("2", "How can AI help engineers find trusted technical information faster and reduce the risk of improper execution?", "Improve search, Q&A and answer verification. Answers carry cited sources and a confidence score, figures are checked, and unsafe requests are refused (128 of 128 test questions passed).", TEAL),
      ("3", "How can the Manufacturing Knowledge Hub be integrated with operational systems to support reliability, troubleshooting and continuous improvement?", "Active knowledge for decisions. Read-only links to EDMS and AIMS feed failure memory, a backtested forecast, start-up readiness and site planning.", ORANGE)]
for i, (q, a, b, c_) in enumerate(kq):
    y = 4.34 + i * 0.46
    box(s, 0.4, y, 12.55, 0.43, WHITE if i % 2 else LIGHT, MID, None, radius=0.05, lw=0.8)
    numdot(s, 0.48, y + 0.075, q, c_, 0.28, 9)
    text(s, 0.85, y, 5.3, 0.43, a, 8.6, True, NAVY, anchor="m", line=0.92); text(s, 6.2, y, 6.7, 0.43, b, 8.5, False, INK, anchor="m", line=0.92)
box(s, 0.4, 5.74, 3.2, 0.44, GREEN, None, [[("Decision requested: a 90-day pilot", {"bold": True, "size": 10, "color": WHITE})]], 10, True, WHITE, "c", "m", radius=0.08, margin=0.05)
for i, (w_, d_) in enumerate([("Weeks 1 to 2", "Agree data access, owners and AI terms."), ("Weeks 3 to 6", "Load the LLDPE unit and train 45 users."), ("Weeks 7 to 12", "Measure against the gates, then decide.")]):
    x = 3.78 + i * 3.06
    box(s, x, 5.74, 2.92, 0.44, TINT[GREEN], GREEN, [[(w_ + ": ", {"bold": True, "size": 8.8, "color": GREEN}), (d_, {"size": 8.8, "color": INK})]], 9, False, INK, "l", "m", radius=0.08, lw=1.0, margin=0.08)
    if i < 2: arrow(s, x + 2.92, 5.96, x + 3.06, 5.96, GREEN, 1.5)
ribbon(s, "The platform gives engineers cited answers at the point of work and gives the plant a basis for reducing repeat failures. We ask the Company to approve a 90-day pilot, so that the value is measured with Company data before any decision to scale.")
notes(s, "Conclusion. The proposed solution links plant documents and work orders to the equipment tag and answers with cited sources. The key value is shown for one unit and for three units; the inputs are on slide 5. The expected outcomes are the pilot success gates. The three key questions of the case are answered with evidence from the prototype. The decision requested is a 90-day pilot on the LLDPE unit with 45 users.")

# ---------------------------------------------------------------- 8 team
s = blank(prs)
frame(s, 8, "Team profile", "Replace the bracketed fields with the team's details before submission", None, None)
text(s, 0.55, 1.6, 12.2, 0.4, [[("Team name: ", {"bold": True, "color": NAVY}), "[Team name]        ", ("University: ", {"bold": True, "color": NAVY}), "[University]        ", ("Supervisor: ", {"bold": True, "color": NAVY}), "[Supervisor name]"]], 12, False, INK)
trows = [["No.", "Name", "Major", "Semester", "Area of expertise", "Contribution to the proposal"],
         ["1", "[Name]", "[Computer Science]", "[6]", "[AI and software]", "[Formulated the idea; built the prototype and the AI assistant]"],
         ["2", "[Name]", "[Chemical Engineering]", "[7]", "[Process and reliability]", "[Problem analysis, process content and hazard models]"],
         ["3", "[Name]", "[Industrial Engineering]", "[7]", "[Maintenance and business case]", "[Business impact, KPIs and roadmap]"]]
table(s, 0.55, 2.2, 12.2, [0.5, 1.8, 2.3, 1.0, 2.5, 4.1], trows, 11, rowh=0.52, header_fill=NAVY)
text(s, 0.55, 4.4, 12.2, 0.3, "The booklet allows two to three members from the same university. Delete any unused row.", 10.5, False, GREY)
text(s, 0.55, 4.8, 12.2, 0.3, "Screens of the working prototype", 11, True, NAVY)
for i, (nm, cr, tt) in enumerate([("dash2", (0, 0.1, 1, 0.7), "Dashboard"), ("scn", (0, 0, 1, 0.58), "Scenario on the P&ID"), ("predict", (0, 0, 1, 0.58), "Predictive maintenance"), ("hazard3d", (0, 0, 1, 0.58), "Hazard simulator")]):
    win(s, nm, 0.55 + i * 3.08, 5.15, 2.95, cr, tt)
notes(s, "Team. Complete the table as required by the booklet.")
