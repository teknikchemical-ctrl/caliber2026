s = blank(prs); AN[0] += 1
frame(s, len(prs.slides), f"A{AN[0]}  Impact Detail: Financial Assessment, {{{{IDR {BASE[3]/1000:.1f} B}}}} a Year in the Base Case, With Cash Profile and Scenarios",
      "Financial, operational and people benefits with measurable KPIs; hours and rates are assumptions to be replaced by Company figures during the pilot", "Impact",
      "Case baseline data (work orders, MTTR, breakdowns); assumptions in appendix A22. IDR = Indonesian rupiah; IRR and NPV over 3 years, 10% discount rate", "Impact Assessment and Projection")
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
# right: connection from feature to KPI to value
RX, RW = 9.15, 3.85
banner(s, RX, 1.5, RW, "From feature to KPI to value", NAVY)
text(s, RX, 1.86, 1.2, 0.2, "FEATURE", 7, True, GREY, "c"); text(s, RX + 1.4, 1.86, 1.4, 0.2, "KPI MOVED", 7, True, GREY, "c"); text(s, RX + 3.05, 1.86, 0.8, 0.2, "IDR M", 7, True, GREY, "c")
chains = [("AI assistant and verified answers", BLUE, "Time to answer 15 to 3 min", f"{BASE[0]:,.0f}", "clock"),
          ("Failure memory and predictive checks", TEAL, f"MTTR -10%, repeat failures -30%", f"{BASE[1]:,.0f}", "wrench"),
          ("Knowledge Studio and OPL lessons", PURPLE, "New engineers productive 1 month sooner", f"{BASE[2]:,.0f}", "book"),
          ("Interlock guard, readiness, hazard view", RED, "Fewer improper executions", "not valued", "shield"),
          ("Quality register and approvals", ORANGE, f"{D['issues']} conflicts owned, 90% closed", "not valued", "warn")]
for i, (f_, c_, k_, v_, ic) in enumerate(chains):
    y = 2.1 + i * 0.9
    box(s, RX, y, 1.3, 0.8, TINT[c_], c_, [[(f_, {"bold": True, "size": 7.6, "color": NAVY})]], 8, False, INK, "c", "m", radius=0.07, margin=0.05)
    arrow(s, RX + 1.3, y + 0.4, RX + 1.45, y + 0.4, c_, 1.6)
    box(s, RX + 1.45, y, 1.5, 0.8, WHITE, c_, [[(k_, {"size": 7.6, "color": INK})]], 8, False, INK, "c", "m", radius=0.07, margin=0.05)
    arrow(s, RX + 2.95, y + 0.4, RX + 3.1, y + 0.4, c_, 1.6)
    box(s, RX + 3.1, y, 0.75, 0.8, c_ if v_ != "not valued" else GREY, None, [[(v_, {"bold": True, "size": 9.5 if v_ != "not valued" else 7, "color": WHITE})]], 9, True, WHITE, "c", "m", radius=0.07, margin=0.02)
text(s, RX, 6.62, RW, 0.25, f"Total base case IDR {BASE[3]:,.0f} M a year; two levers are left unvalued on purpose", 7.5, True, NAVY, "c")
notes(s, "Business impact. Left: the financial assessment. Parameters come from the case data where possible (MTTR 14 hours, 8 repeat failures out of 55 corrective jobs); the time to a verified answer is an assumption. The base case gives IDR 1.5 billion of annual value, an internal rate of return of about 40 percent over three years and a payback of about 21 months. The low case does not pay back inside three years, which we show on purpose. Middle: where the value comes from and how cash accumulates. Right: operational, safety and people impact with measurable KPIs. The pilot success gates are 90 percent of answers with an approved source, a median of 3 minutes to an answer, 80 percent of users rating answers useful and zero answers without a source.")

