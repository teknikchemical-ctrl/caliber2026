"""Builds Business_Impact_Financial_Model.xlsx with live formulas. Run: python3 finance/build_xlsx.py"""
import os, sys, json, datetime as dt
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import spec
from spec import INPUTS, G, CM, W, ROLLOUT
from openpyxl import Workbook
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
from openpyxl.utils import get_column_letter as CL
from openpyxl.workbook.defined_name import DefinedName
from openpyxl.worksheet.datavalidation import DataValidation
from openpyxl.chart import BarChart, LineChart, Reference, Series
from openpyxl.chart.label import DataLabelList

OUT = os.path.join(spec.HERE, "Business_Impact_Financial_Model.xlsx")
NAVY, BLUE, TEAL, ORANGE, GREEN, GREY = "0B2A4A", "1560BD", "0E8A7D", "E8793A", "2E9E5B", "6B7A8C"
FN = "Arial"
f_norm = Font(name=FN, size=10); f_bold = Font(name=FN, size=10, bold=True)
f_in = Font(name=FN, size=10, color="0000FF"); f_link = Font(name=FN, size=10, color="008000")
f_hdr = Font(name=FN, size=10, bold=True, color="FFFFFF"); f_title = Font(name=FN, size=16, bold=True, color=NAVY)
f_sub = Font(name=FN, size=10, italic=True, color=GREY); f_note = Font(name=FN, size=9, color=GREY)
fill_hdr = PatternFill("solid", fgColor=NAVY); fill_grp = PatternFill("solid", fgColor="DCE8F5"); fill_key = PatternFill("solid", fgColor="FFFF00")
fill_tot = PatternFill("solid", fgColor="EAF1FB"); fill_ok = PatternFill("solid", fgColor="E4F4EA"); fill_static = PatternFill("solid", fgColor="F2F2F2")
thin = Side(style="thin", color="B9C8DA"); bd_b = Border(bottom=thin); bd_all = Border(top=thin, bottom=thin, left=thin, right=thin)
M0 = '#,##0;(#,##0);"-"'; M1 = '#,##0.0;(#,##0.0);"-"'; M2 = '#,##0.00;(#,##0.00);"-"'; P1 = '0.0%'; P0 = '0%'; DT = 'yyyy-mm-dd'

wb = Workbook()
NAMES = {}
CELLS = {}

def name(n, ws, ref):
    wb.defined_names[n] = DefinedName(n, attr_text=f"'{ws.title}'!{ref}"); NAMES[n] = f"'{ws.title}'!{ref}"

def put(ws, r, c, v, fmt=None, font=None, fill=None, al=None, wrap=False, border=None):
    cell = ws.cell(row=r, column=c, value=v)
    cell.font = font or f_norm
    if fmt: cell.number_format = fmt
    if fill: cell.fill = fill
    if al or wrap: cell.alignment = Alignment(horizontal=al, vertical="top" if wrap else "center", wrap_text=wrap)
    if border: cell.border = border
    return cell

def title(ws, t, sub=None):
    ws.sheet_view.showGridLines = False
    put(ws, 1, 1, t, font=f_title)
    if sub: put(ws, 2, 1, sub, font=f_sub)

def header(ws, r, labels, c0=1, widths=None):
    for i, l in enumerate(labels):
        put(ws, r, c0 + i, l, font=f_hdr, fill=fill_hdr, al="center", wrap=True)
    ws.row_dimensions[r].height = 30

def widths(ws, ws_w):
    for i, w in enumerate(ws_w, 1): ws.column_dimensions[CL(i)].width = w

def group(ws, r, text, ncols):
    for c in range(1, ncols + 1): put(ws, r, c, text if c == 1 else None, font=f_bold, fill=fill_grp)

def fmt_for(unit):
    u = unit.lower()
    if u in ("%", "points"): return P1
    if "idr m" in u or u == "kt per year": return M1
    if u in ("idr per usd", "hours", "days", "tokens", "usd per t", "documents", "people", "min per user"): return M0
    return M2 if u in ("x", "usd per m tokens", "fte") else M1

# ======================================================================= README
ws = wb.active; ws.title = "README"
title(ws, "Asset Knowledge Platform: Business Impact and Financial Model", "CALIBER 2026, Case 1: Manufacturing Knowledge Hub. Prepared by Team Insinyur Jawa. Version 1.0, 3 October 2026.")
widths(ws, [28, 100])
rows = [("Purpose", "Rebuilds the business impact slide of the proposal as a transparent model. Every value on the slide traces to a formula here, to the maintenance history (case data), or to a cited market source."),
        ("Currency and units", "Money is in IDR million (IDR M) unless a label says USD. Years are year-end cash flows. Year 0 is the investment year before go-live."),
        ("How to use", "Change blue cells on the Inputs sheet. Cell D4 on Inputs selects the scenario: 1 Pessimistic, 2 Base, 3 Optimistic. All sheets recalculate."),
        ("Colour code", "Blue text: input. Black text: formula. Green text: link to another sheet. Yellow fill: key assumption or switch. Grey fill: static output from the Python mirror of this model (sensitivity, Monte Carlo, risk shocks)."),
        ("Evidence tags", "Case data: taken from the 211 work orders or the platform data. Market source: published figure, cited on the Sources sheet. Estimate: team estimate to be replaced by Company data. Assumption: planning assumption that the pilot will test."),
        ("Headline rule", "The headline value counts only four levers: search time, repair time, repeat failures and faster start for new staff. Start-up delay, incident avoidance and document rework are shown as upside and never added to the headline."),
        ("Scenarios", "Pessimistic and Optimistic move every driver together, so they bracket the outcome. The Monte Carlo sheet moves drivers independently and gives a realistic range."),
        ("Static sheets", "Sensitivity, MonteCarlo and the NPV column of Risks are produced by a Python replica of the same logic. The Checks sheet confirms that the replica and the workbook agree for the Base scenario."),
        ("Limits", "The data is sample data for the CALIBER case. Plant production values, salaries and costs are estimates until the pilot replaces them. The model does not include financing, working capital or terminal value."),
        ("Sheet map", "Inputs, Case_Data, Case_Metrics, Labour, Downtime_Value, Levers, Costs, Rollout, CF_1U, CF_3U, CF_6U, CF_12U, Summary, Market, Competitors, Sensitivity, MonteCarlo, Risks, KPIs, Reconciliation, Checks, Sources.")]
for i, (a, b) in enumerate(rows):
    put(ws, 4 + i, 1, a, font=f_bold, wrap=True); put(ws, 4 + i, 2, b, wrap=True); ws.row_dimensions[4 + i].height = 44
put(ws, 16, 1, "Model status", font=f_bold); put(ws, 16, 2, "=Checks!C3", font=f_bold)

# ======================================================================= Inputs
ws = wb.create_sheet("Inputs"); IN = ws
title(ws, "Inputs", "All drivers with pessimistic, base and optimistic values. Formulas elsewhere read column G (Active), which follows the scenario switch in D4.")
widths(ws, [14, 54, 16, 12, 12, 12, 12, 15, 90])
put(ws, 4, 2, "Active scenario (1 = Pessimistic, 2 = Base, 3 = Optimistic)", font=f_bold)
put(ws, 4, 4, 2, font=f_in, fill=fill_key, al="center"); name("scn", ws, "$D$4")
put(ws, 4, 5, '=CHOOSE(D4,"Pessimistic","Base","Optimistic")', font=f_bold)
dv = DataValidation(type="list", formula1='"1,2,3"', allow_blank=False); ws.add_data_validation(dv); dv.add("D4")
header(ws, 6, ["Name", "Driver", "Unit", "Base", "Pessimistic", "Optimistic", "Active", "Evidence tag", "Source and rationale"])
r = 7; INROW = {}
for x in INPUTS:
    if x[0] == G:
        group(ws, r, x[1], 9); r += 1; continue
    n, lab, unit, b, lo, hi, tag, src = x
    fm = fmt_for(unit)
    put(ws, r, 1, n, font=f_note); put(ws, r, 2, lab, wrap=True); put(ws, r, 3, unit)
    for c, v in ((4, b), (5, lo), (6, hi)): put(ws, r, c, v, fmt=fm, font=f_in)
    put(ws, r, 7, f"=CHOOSE(scn,E{r},D{r},F{r})", fmt=fm, font=f_bold)
    put(ws, r, 8, tag); put(ws, r, 9, src, wrap=True, font=f_note)
    ws.row_dimensions[r].height = 26 if len(src) < 110 else 38
    name("in_" + n, ws, f"$G${r}"); INROW[n] = r; r += 1
# history cut-off and derived cost of capital
group(ws, r, "Case data constants and derived values", 9); r += 1
put(ws, r, 1, "hist_end", font=f_note); put(ws, r, 2, "History cut-off date used by the platform"); put(ws, r, 3, "date")
put(ws, r, 4, spec.HIST_END, fmt=DT, font=f_in); put(ws, r, 7, f"=D{r}", fmt=DT, font=f_bold); put(ws, r, 8, "Case data")
put(ws, r, 9, "The platform reports 31 breakdowns over 554 days to 10 Dec 2025, which gives 20.4 a year.", font=f_note); name("in_hist_end", ws, f"$G${r}"); r += 1
put(ws, r, 1, "docs_noappr", font=f_note); put(ws, r, 2, "Documents without an approval status"); put(ws, r, 3, "documents"); put(ws, r, 4, 66, fmt=M0, font=f_in); put(ws, r, 7, f"=D{r}", fmt=M0, font=f_bold); put(ws, r, 8, "Case data")
put(ws, r, 9, "66 of 98 documents carry no approval status in the platform data quality baseline.", font=f_note); name("in_docs_noappr", ws, f"$G${r}"); r += 1
put(ws, r, 2, "Cost of equity (CAPM)"); put(ws, r, 3, "%"); put(ws, r, 7, "=in_rf+in_beta*in_erp", fmt=P1, font=f_bold); name("calc_ke", ws, f"$G${r}"); put(ws, r, 8, "Derived"); r += 1
put(ws, r, 2, "Weighted average cost of capital (after tax)"); put(ws, r, 3, "%"); put(ws, r, 7, "=(1-in_debt_share)*calc_ke+in_debt_share*in_cod*(1-in_tax)", fmt=P1, font=f_bold); name("calc_wacc", ws, f"$G${r}"); put(ws, r, 8, "Derived"); r += 1
put(ws, r, 2, "Discount rate used in the model", font=f_bold); put(ws, r, 3, "%"); put(ws, r, 7, "=calc_wacc+in_wacc_adj", fmt=P1, font=f_bold, fill=fill_key); name("calc_r", ws, f"$G${r}"); put(ws, r, 8, "Derived"); r += 1
ws.freeze_panes = "C7"

# ======================================================================= Case_Data
ws = wb.create_sheet("Case_Data"); CD = ws
title(ws, "Case data: 211 work orders", "Source: Maintenance History (All Equipment).xlsx provided with the case. Columns A to M are copied values. Columns N to P are formulas.")
cols = ["WO_Number", "Report_Date", "Completion_Date", "Equipment_Tag", "Work_Type", "Discipline", "Priority", "Breakdown", "Downtime_Hours", "Labor_Hours", "Total_Cost_IDR", "Problem_Description", "Root_Cause", "Corrective_or_breakdown", "Failure_mode", "Repeat_within_120d"]
header(ws, 4, cols); widths(ws, [12, 12, 12, 12, 12, 12, 9, 10, 10, 10, 14, 52, 48, 12, 24, 12])
R0 = 5; Rn = R0 + len(W) - 1
for i, o in enumerate(sorted(W, key=lambda o: (o["rd"], o["WO_Number"]))):
    r = R0 + i
    vals = [o["WO_Number"], o["rd"], o["cd"], o["Equipment_Tag"], o["Work_Type"], o["Discipline"], o["Priority"], o["Breakdown"], o["dh"], o["lh"], o["cost"], o["Problem_Description"], o["Root_Cause"]]
    for c, v in enumerate(vals, 1):
        put(ws, r, c, v, fmt=DT if c in (2, 3) else (M1 if c in (9, 10) else (M0 if c == 11 else None)), font=f_in if c > 1 else f_norm)
    put(ws, r, 14, f'=IF(OR(E{r}="Corrective",H{r}="Yes"),1,0)')
    t = f'LOWER(L{r}&" "&M{r})'
    def anyof(ks): return "OR(" + ",".join(f'ISNUMBER(SEARCH("{k}",{t}))' for k in ks) + ")"
    expr = '"Other"'
    for nme, ks in reversed(spec.FM_RULES): expr = f'IF({anyof(ks)},"{nme}",{expr})'
    put(ws, r, 15, f'=IF(N{r}=1,{expr},"")')
    put(ws, r, 16, f'=IF(N{r}=1,IF(COUNTIFS($D${R0}:$D${Rn},D{r},$O${R0}:$O${Rn},O{r},$N${R0}:$N${Rn},1,$B${R0}:$B${Rn},"<"&B{r},$B${R0}:$B${Rn},">="&(B{r}-120))>0,1,0),0)')
ws.freeze_panes = "B5"; ws.auto_filter.ref = f"A4:P{Rn}"
def cr(col): return f"Case_Data!${col}${R0}:${col}${Rn}"

# ======================================================================= Case_Metrics
ws = wb.create_sheet("Case_Metrics"); CMs = ws
title(ws, "Case metrics", "Every figure is a formula on Case_Data. These are the only values taken directly from the case data in the business impact model.")
widths(ws, [4, 58, 18, 70])
header(ws, 4, ["", "Metric", "Value", "Definition"])
mrows = [
 ("cm_start", "History start (first report date)", f"=MIN({cr('B')})", DT, "Earliest work order report date."),
 ("cm_end", "History end (platform cut-off)", "=in_hist_end", DT, "Cut-off used by the platform."),
 ("cm_days", "Days covered", "=cm_end-cm_start", M0, "End minus start."),
 ("cm_years", "Years covered", "=cm_days/365", M2, "Days divided by 365."),
 ("cm_n_wo", "Work orders", f"=COUNTA({cr('A')})", M0, "All work orders in the file."),
 ("cm_n_bd", "Breakdowns", f'=COUNTIF({cr("H")},"Yes")', M0, "Breakdown flag equal to Yes."),
 ("cm_bd_hours", "Breakdown downtime (hours)", f'=SUMIFS({cr("I")},{cr("H")},"Yes")', M0, "Sum of downtime hours on breakdown work orders."),
 ("cm_mttr", "Mean time to repair (hours)", "=cm_bd_hours/cm_n_bd", M1, "Downtime hours per breakdown."),
 ("cm_bd_year", "Breakdowns a year", "=cm_n_bd/cm_years", M1, "Annualised."),
 ("cm_dt_year", "Breakdown downtime a year (hours)", "=cm_bd_year*cm_mttr", M0, "Breakdowns a year times MTTR."),
 ("cm_n_corr", "Corrective or breakdown jobs", f"=SUM({cr('N')})", M0, "Work type Corrective, or breakdown flag Yes."),
 ("cm_corr_year", "Corrective or breakdown jobs a year", "=cm_n_corr/cm_years", M1, "Annualised."),
 ("cm_bd_share", "Breakdown share of those jobs", "=cm_n_bd/cm_n_corr", P1, "Breakdowns divided by corrective or breakdown jobs."),
 ("cm_rep", "Jobs that repeat within 120 days", f"=SUM({cr('P')})", M0, "Same equipment tag and same failure mode as an earlier job in the previous 120 days."),
 ("cm_rep_rate", "Repeat rate", "=cm_rep/cm_n_corr", P1, "Repeating jobs divided by corrective or breakdown jobs."),
 ("cm_avg_corr", "Average direct cost of a corrective or breakdown job (IDR M)", f"=SUMIFS({cr('K')},{cr('N')},1)/cm_n_corr/1000000", M2, "Labour plus material cost."),
 ("cm_avg_bd", "Average direct cost of a breakdown job (IDR M)", f'=SUMIFS({cr("K")},{cr("H")},"Yes")/cm_n_bd/1000000', M2, "Labour plus material cost."),
 ("cm_total_cost", "Total maintenance cost in the file (IDR M)", f"=SUM({cr('K')})/1000000", M0, "All work orders."),
 ("cm_planned", "Planned share of work orders", f'=(COUNTIF({cr("E")},"Preventive")+COUNTIF({cr("E")},"Predictive")+COUNTIF({cr("E")},"Inspection")+COUNTIF({cr("E")},"Calibration")+COUNTIF({cr("E")},"Overhaul"))/cm_n_wo', P1, "Non-corrective work types divided by all work orders."),
]
for i, (n, lab, f, fm, d) in enumerate(mrows):
    r = 5 + i; put(ws, r, 2, lab); put(ws, r, 3, f, fmt=fm, font=f_link if "Case_Data" in f else f_norm); put(ws, r, 4, d, font=f_note); name(n, ws, f"$C${r}")
r = 5 + len(mrows) + 1
put(ws, r, 2, "Work orders by type", font=f_bold); header(ws, r + 1, ["", "Work type", "Count", "Cost (IDR M)", "Labour hours"], c0=1); ws.column_dimensions["E"].width = 14
for i, t in enumerate(["Preventive", "Corrective", "Predictive", "Inspection", "Calibration", "Overhaul"]):
    rr = r + 2 + i; put(ws, rr, 2, t); put(ws, rr, 3, f'=COUNTIF({cr("E")},B{rr})', fmt=M0); put(ws, rr, 4, f'=SUMIFS({cr("K")},{cr("E")},B{rr})/1000000', fmt=M1); put(ws, rr, 5, f'=SUMIFS({cr("J")},{cr("E")},B{rr})', fmt=M0)
rr = r + 8; put(ws, rr, 2, "Total", font=f_bold); put(ws, rr, 3, f"=SUM(C{r+2}:C{r+7})", fmt=M0, font=f_bold); put(ws, rr, 4, f"=SUM(D{r+2}:D{r+7})", fmt=M1, font=f_bold); put(ws, rr, 5, f"=SUM(E{r+2}:E{r+7})", fmt=M0, font=f_bold)
CELLS["cm_type_total_row"] = rr
r = rr + 2
put(ws, r, 2, "By equipment set", font=f_bold)
header(ws, r + 1, ["", "Equipment tag", "Work orders", "Breakdowns", "Downtime (h)", "MTTR (h)", "Cost (IDR M)", "Repeat jobs"]); ws.column_dimensions["F"].width = 12; ws.column_dimensions["G"].width = 14; ws.column_dimensions["H"].width = 12
tags = ["GA-1201A", "YD-2301", "DC-3401A", "KC-4501", "EA-5601", "LV-6701", "CT-7801", "FA-8901"]
for i, t in enumerate(tags):
    rr = r + 2 + i; put(ws, rr, 2, t)
    put(ws, rr, 3, f'=COUNTIF({cr("D")},B{rr})', fmt=M0); put(ws, rr, 4, f'=COUNTIFS({cr("D")},B{rr},{cr("H")},"Yes")', fmt=M0)
    put(ws, rr, 5, f'=SUMIFS({cr("I")},{cr("D")},B{rr},{cr("H")},"Yes")', fmt=M0); put(ws, rr, 6, f"=IF(D{rr}=0,0,E{rr}/D{rr})", fmt=M1)
    put(ws, rr, 7, f'=SUMIFS({cr("K")},{cr("D")},B{rr})/1000000', fmt=M1); put(ws, rr, 8, f'=SUMIFS({cr("P")},{cr("D")},B{rr})', fmt=M0)
rr = r + 10; put(ws, rr, 2, "Total", font=f_bold)
for c in (3, 4, 5, 7, 8): put(ws, rr, c, f"=SUM({CL(c)}{r+2}:{CL(c)}{r+9})", fmt=M0 if c != 7 else M1, font=f_bold)
CELLS["cm_eq_total_row"] = rr; CELLS["cm_eq_first"] = r + 2
r = rr + 2
put(ws, r, 2, "Corrective and breakdown jobs by failure mode", font=f_bold)
header(ws, r + 1, ["", "Failure mode (keyword rule)", "Jobs", "Repeat jobs", "Share of jobs"])
modes = [n for n, _ in spec.FM_RULES] + ["Other"]
for i, mname in enumerate(modes):
    rr = r + 2 + i; put(ws, rr, 2, mname); put(ws, rr, 3, f'=COUNTIF({cr("O")},B{rr})', fmt=M0); put(ws, rr, 4, f'=SUMIFS({cr("P")},{cr("O")},B{rr})', fmt=M0); put(ws, rr, 5, f"=C{rr}/cm_n_corr", fmt=P1)
rr = r + 2 + len(modes); put(ws, rr, 2, "Total", font=f_bold); put(ws, rr, 3, f"=SUM(C{r+2}:C{rr-1})", fmt=M0, font=f_bold); put(ws, rr, 4, f"=SUM(D{r+2}:D{rr-1})", fmt=M0, font=f_bold)
CELLS["cm_mode_total_row"] = rr
put(ws, rr + 2, 2, "Rule for the failure mode: the first matching keyword group in the problem text and root cause, in the order listed on the sheet Sources. A repeat is a later job with the same equipment tag and the same mode within 120 days. The earlier slide used 8 of 55 jobs under a stricter text match.", font=f_note, wrap=True)
ws.merge_cells(start_row=rr + 2, start_column=2, end_row=rr + 2, end_column=4); ws.row_dimensions[rr + 2].height = 42

# ======================================================================= Labour
ws = wb.create_sheet("Labour")
title(ws, "Labour cost per unit", "Loaded hourly cost by role. The weighted average is used to value saved time.")
widths(ws, [28, 14, 18, 20, 18, 18])
header(ws, 4, ["Role", "Users", "Gross salary (IDR M a month)", "Loaded cost (IDR M a year)", "Loaded cost (IDR an hour)", "Share of users"])
roles = [("Operators", "n_op", "sal_op"), ("Process and maintenance engineers", "n_eng", "sal_eng"), ("Reliability engineers", "n_rel", "sal_rel"), ("HSE engineers", "n_hse", "sal_hse"), ("Supervisors and managers", "n_mgr", "sal_mgr")]
for i, (lab, n, s) in enumerate(roles):
    r = 5 + i; put(ws, r, 1, lab); put(ws, r, 2, f"=in_{n}", fmt=M0, font=f_link); put(ws, r, 3, f"=in_{s}", fmt=M1, font=f_link)
    put(ws, r, 4, f"=C{r}*12*(1+in_load)", fmt=M1); put(ws, r, 5, f"=D{r}*1000000/lab_hours", fmt=M0); put(ws, r, 6, f"=B{r}/B$10", fmt=P1)
put(ws, 10, 1, "Total or weighted average", font=f_bold, fill=fill_tot); put(ws, 10, 2, "=SUM(B5:B9)", fmt=M0, font=f_bold, fill=fill_tot)
put(ws, 10, 3, "=SUMPRODUCT(B5:B9,C5:C9)/B10", fmt=M1, font=f_bold, fill=fill_tot); put(ws, 10, 4, "=SUMPRODUCT(B5:B9,D5:D9)/B10", fmt=M1, font=f_bold, fill=fill_tot)
put(ws, 10, 5, "=SUMPRODUCT(B5:B9,E5:E9)/B10", fmt=M0, font=f_bold, fill=fill_tot); put(ws, 10, 6, "=SUM(F5:F9)", fmt=P0, font=f_bold, fill=fill_tot)
put(ws, 12, 1, "Productive hours a year per person"); put(ws, 12, 2, "=in_days*in_hpd", fmt=M0); name("lab_hours", ws, "$B$12")
put(ws, 13, 1, "Users per unit"); put(ws, 13, 2, "=B10", fmt=M0); name("lab_users", ws, "$B$13")
put(ws, 14, 1, "Average loaded cost (IDR an hour)"); put(ws, 14, 2, "=E10", fmt=M0); name("lab_avg", ws, "$B$14")
put(ws, 15, 1, "Earlier slide assumption (IDR an hour)"); put(ws, 15, 2, 175000, fmt=M0, font=f_in)
put(ws, 17, 1, "Cross-check: Paylab Indonesia reports a gross monthly range of IDR 2.4 M to 5.2 M for 80 percent of employees in the chemical sector across all employers. The salaries above are company-level estimates for a listed producer and are the weakest evidence in this sheet. The sensitivity analysis shows the effect of lower pay.", font=f_note, wrap=True)
ws.merge_cells("A17:F17"); ws.row_dimensions[17].height = 40

# ======================================================================= Downtime_Value
ws = wb.create_sheet("Downtime_Value")
title(ws, "Value of one hour of unit downtime", "Replaces the earlier flat assumption of IDR 30 M an hour with a bottom-up calculation from plant capacity and margin.")
widths(ws, [58, 18, 16, 70])
header(ws, 4, ["Step", "Value", "Unit", "Basis"])
steps = [("Unit capacity", "=in_cap_kt", "kt a year", M0, "Chandra Asri existing polyethylene plant, used as a proxy for the LLDPE unit."),
         ("Operating hours a year", "=in_op_hours", "hours", M0, "Assumption."),
         ("Output per operating hour", "=B5*1000/B6", "t an hour", M1, "Capacity divided by operating hours."),
         ("Contribution margin lost per tonne", "=in_margin", "USD per t", M0, "Polyethylene price less variable cost."),
         ("Margin lost per hour of full stoppage", "=B7*B8", "USD an hour", M0, "Output per hour times margin."),
         ("Exchange rate", "=in_fx", "IDR per USD", M0, "Databoks, 25 Sep 2026."),
         ("Margin lost per hour of full stoppage", "=B9*B10/1000000", "IDR M an hour", M1, "Converted to IDR million."),
         ("Share of breakdown hours that reduce output", "=in_loss", "%", P0, "Spares, standby units and partial degradation reduce the effect."),
         ("Value of one breakdown hour", "=B11*B12", "IDR M an hour", M1, "Used for repair time, repeat failure and start-up levers.")]
for i, (a, f, u, fm, d) in enumerate(steps):
    r = 5 + i; put(ws, r, 1, a, font=f_bold if i in (6, 8) else f_norm); put(ws, r, 2, f, fmt=fm, font=f_link if f.startswith("=in_") else f_norm); put(ws, r, 3, u); put(ws, r, 4, d, font=f_note)
name("dv_full", ws, "$B$11"); name("dv", ws, "$B$13")
put(ws, 15, 1, "Earlier slide assumption (IDR M an hour)"); put(ws, 15, 2, 30, fmt=M1, font=f_in); put(ws, 16, 1, "New value relative to the earlier slide"); put(ws, 16, 2, "=B13/B15", fmt=M2)
put(ws, 18, 1, "Cross-check against company scale", font=f_bold)
put(ws, 19, 1, "Annual contribution margin of the unit at full output (IDR M)"); put(ws, 19, 2, "=in_cap_kt*1000*in_margin*in_fx/1000000", fmt=M0)
put(ws, 20, 1, "Chandra Asri revenue FY2024 (USD M)"); put(ws, 20, 2, 1785, fmt=M0, font=f_in); put(ws, 20, 4, "IDNFinancials: USD 1.79 billion, down 17.4 percent from USD 2.16 billion.", font=f_note)
put(ws, 21, 1, "Unit margin as a share of Chandra Asri revenue"); put(ws, 21, 2, "=B19*1000000/in_fx/1000000/B20", fmt=P1); put(ws, 21, 4, "A single polyethylene unit's margin is a plausible share of group revenue.", font=f_note)
put(ws, 23, 1, "Sensitivity of the value of a breakdown hour (IDR M an hour)", font=f_bold)
put(ws, 24, 1, "Margin (USD per t) down, share of hours with output loss across", font=f_note)
losses = [0.10, 0.15, 0.20, 0.25, 0.30]; margins = [140, 180, 220, 260, 320]
for j, lv in enumerate(losses): put(ws, 25, 2 + j, lv, fmt=P0, font=f_in, fill=fill_grp, al="center")
for i, mg in enumerate(margins):
    put(ws, 26 + i, 1, mg, fmt=M0, font=f_in, fill=fill_grp, al="right")
    for j in range(5): put(ws, 26 + i, 2 + j, f"=$B$7*$A{26+i}*in_fx/1000000*{CL(2+j)}$25", fmt=M1)
for c in "CDEF": ws.column_dimensions[c].width = 14

# ======================================================================= Levers
ws = wb.create_sheet("Levers"); LV = ws
title(ws, "Value levers per unit", "Annual value of one unit at 100 percent adoption, in IDR M at year 0 prices. Adoption, rollout and escalation are applied on the cash flow sheets.")
widths(ws, [62, 16, 16, 18, 66])
header(ws, 4, ["Calculation step", "Value", "Unit", "Evidence", "Basis"])
L = []   # (label, formula, unit, fmt, evidence, basis, name)
def lev(label, f, unit, fm, ev, basis, nm=None, bold=False): L.append((label, f, unit, fm, ev, basis, nm, bold))
lev("LEVER 1: SEARCH AND CHECKING TIME", None, None, None, None, None, None, True)
lev("Users per unit", "=lab_users", "people", M0, "Assumption", "Labour sheet.")
lev("Minutes saved per user a day", "=in_s_base*in_s_red", "minutes", M1, "Assumption", "Baseline minutes times reduction.")
lev("Hours saved per user a year", "=B7/60*in_days", "hours", M1, "Derived", "Minutes saved times working days.")
lev("Average loaded cost (IDR an hour)", "=lab_avg", "IDR", M0, "Estimate", "Labour sheet.")
lev("Share of freed time that becomes productive", "=in_conv", "%", P0, "Assumption", "Conversion factor.")
lev("Lever 1 value (IDR M a year)", "=B6*B8*B9*B10/1000000", "IDR M", M1, "Assumption", "Users times hours times cost times conversion.", "lev_L1", True)
lev("LEVER 2: REPAIR TIME", None, None, None, None, None, None, True)
lev("Breakdowns a year", "=cm_bd_year", "events", M1, "Case data", "Case_Metrics.")
lev("Repeat breakdowns avoided a year", "=cm_bd_year*cm_rep_rate*in_rep_red", "events", M2, "Derived", "Breakdowns times repeat rate times reduction.")
lev("Remaining breakdowns a year", "=B13-B14", "events", M2, "Derived", "Avoided repeats are removed first so that lever 3 is not counted twice.")
lev("Mean time to repair (hours)", "=cm_mttr", "hours", M1, "Case data", "Case_Metrics.")
lev("Reduction in repair time", "=in_mttr_red", "%", P1, "Assumption", "Input.")
lev("Share credited to the platform", "=in_attrib", "%", P0, "Assumption", "Input.")
lev("Value of one breakdown hour (IDR M)", "=dv", "IDR M", M1, "Estimate", "Downtime_Value.")
lev("Lever 2 value (IDR M a year)", "=B15*B16*B17*B18*B19", "IDR M", M1, "Assumption", "Remaining breakdowns times MTTR times reduction times credit times hour value.", "lev_L2", True)
lev("LEVER 3: REPEAT FAILURES", None, None, None, None, None, None, True)
lev("Repeat rate of corrective jobs", "=cm_rep_rate", "%", P1, "Case data", "Case_Metrics.")
lev("Corrective jobs a year", "=cm_corr_year", "jobs", M1, "Case data", "Case_Metrics.")
lev("Repeat jobs avoided a year", "=B23*B22*in_rep_red", "jobs", M2, "Derived", "Jobs times repeat rate times reduction.")
lev("Of which breakdowns", "=B14", "events", M2, "Derived", "Same breakdowns as in lever 2.")
lev("Downtime avoided (IDR M)", "=B25*B16*B19", "IDR M", M1, "Derived", "Avoided breakdowns times MTTR times hour value.")
lev("Direct repair cost avoided (IDR M)", "=B24*cm_avg_corr", "IDR M", M1, "Case data", "Avoided jobs times average cost.")
lev("Lever 3 value (IDR M a year)", "=(B26+B27)*in_attrib", "IDR M", M1, "Assumption", "Sum credited to the platform.", "lev_L3", True)
lev("LEVER 4: FASTER START FOR NEW AND ROTATED STAFF", None, None, None, None, None, None, True)
lev("New joiners and role changes a year", "=in_joiners", "people", M1, "Assumption", "Input.")
lev("Days saved per joiner", "=in_d_saved", "days", M1, "Assumption", "Input.")
lev("Loaded cost of a working day (IDR)", "=lab_avg*in_hpd", "IDR", M0, "Estimate", "Hourly cost times hours a day.")
lev("Lever 4 value (IDR M a year)", "=B30*B31*B32*in_conv/1000000", "IDR M", M1, "Assumption", "Joiners times days times cost times conversion.", "lev_L4", True)
lev("HEADLINE TOTAL AT 100 PERCENT ADOPTION (IDR M a year)", "=B11+B20+B28+B33", "IDR M", M1, "Mixed", "Levers 1 to 4.", "lev_total", True)
lev("Total at steady-state adoption (IDR M a year)", "=B34*in_adopt", "IDR M", M1, "Assumption", "Multiplied by steady-state adoption.", "lev_total_adopt", True)
lev("UPSIDE LEVERS (NOT IN THE HEADLINE)", None, None, None, None, None, None, True)
lev("Upside A: start-up delay avoided (IDR M a year)", "=in_su_ev*in_su_h*dv_full*in_attrib", "IDR M", M1, "Assumption", "Events times hours times full-stop hour value times credit.", "lev_U1")
lev("Upside B: incident cost avoided (IDR M a year)", "=in_inc_f*in_inc_c*in_inc_r", "IDR M", M1, "Assumption", "Frequency times cost times reduction.", "lev_U2")
lev("Upside C: document rework avoided (IDR M a year)", "=in_docs*in_rw_h*in_rw_red*lab_avg/1000000", "IDR M", M1, "Assumption", "Documents times hours times reduction times cost.", "lev_U3")
lev("Total upside at 100 percent adoption (IDR M a year)", "=B37+B38+B39", "IDR M", M1, "Assumption", "Not added to the headline.", "lev_up_total", True)
r = 5
for (label, f, unit, fm, ev, basis, nm, bold) in L:
    if f is None:
        group(ws, r, label, 5)
    else:
        put(ws, r, 1, label, font=f_bold if bold else f_norm, fill=fill_tot if bold else None); put(ws, r, 2, f, fmt=fm, font=f_bold if bold else (f_link if f.startswith("=in_") or f.startswith("=cm_") or f.startswith("=lab_") or f.startswith("=dv") else f_norm), fill=fill_tot if bold else None)
        put(ws, r, 3, unit); put(ws, r, 4, ev); put(ws, r, 5, basis, font=f_note)
        if nm: name(nm, ws, f"$B${r}")
    r += 1
CELLS["lev_rows_end"] = r

# ======================================================================= Costs
ws = wb.create_sheet("Costs"); CS = ws
title(ws, "Cost model", "One-off cost shared by all units, one-off cost for each unit, and running cost. IDR M at year 0 prices.")
widths(ws, [60, 16, 16, 70])
header(ws, 4, ["Item", "Value (IDR M)", "Unit", "Basis"])
C = []
def cl(label, f, unit, fm, basis, nm=None, bold=False): C.append((label, f, unit, fm, basis, nm, bold))
cl("SHARED ONE-OFF COST", None, None, None, None)
cl("Platform configuration and hardening", "=in_pm*in_pm_rate", "IDR M", M1, "Person-months times blended rate.")
cl("Source system connectors", "=in_n_conn*in_conn", "IDR M", M1, "Connectors times cost per connector.")
cl("Security review and penetration test", "=in_sec", "IDR M", M1, "Input.")
cl("Governance setup and change design", "=in_gov", "IDR M", M1, "Input.")
cl("Training material and demo content", "=in_t_mat", "IDR M", M1, "Input.")
cl("Subtotal before contingency", "=SUM(B6:B10)", "IDR M", M1, "", None, True)
cl("Contingency", "=B11*in_cont", "IDR M", M1, "Percentage of subtotal.")
cl("Shared one-off cost", "=B11+B12", "IDR M", M1, "Incurred in year 0.", "cost_shared", True)
cl("ONE-OFF COST FOR EACH UNIT", None, None, None, None)
cl("Document ingestion, tagging and cleansing", "=in_ing_d*in_d_rate", "IDR M", M1, "Person-days times cost.")
cl("Knowledge capture sessions", "=in_w_sets*in_w_sess*in_w_cost", "IDR M", M1, "Sets times sessions times cost.")
cl("User training time", "=lab_users*in_t_h*lab_avg/1000000", "IDR M", M1, "Users times hours times average loaded cost.")
cl("Validation and acceptance testing", "=in_uat", "IDR M", M1, "Input.")
cl("Subtotal before contingency", "=SUM(B15:B18)", "IDR M", M1, "", None, True)
cl("Contingency", "=B19*in_cont", "IDR M", M1, "Percentage of subtotal.")
cl("One-off cost for each unit", "=B19+B20", "IDR M", M1, "Incurred the year before the unit goes live.", "cost_unit", True)
cl("AI SERVICE USAGE COST", None, None, None, None)
cl("Questions a year per unit", "=lab_users*in_q_day*in_days", "queries", M0, "Users times questions a day times days.")
cl("Input tokens a year (millions)", "=B23*in_tok_in/1000000", "M tokens", M1, "Questions times tokens per question.")
cl("Output tokens a year (millions)", "=B23*in_tok_out/1000000", "M tokens", M1, "Questions times tokens per answer.")
cl("Service cost a year (USD)", "=(B24*in_p_in+B25*in_p_out)*in_q_mult", "USD", M0, "Tokens times list price times buffer.")
cl("Service cost a year (IDR M)", "=B26*in_fx/1000000", "IDR M", M1, "Converted at the exchange rate.", "cost_ai", True)
cl("RUNNING COST A YEAR", None, None, None, None)
cl("Cloud hosting and storage", "=in_cloud", "IDR M", M1, "Input.")
cl("AI platform agreement and data residency", "=in_ai_ea", "IDR M", M1, "Input.")
cl("Knowledge manager", "=in_km_fte*in_km_cost*12", "IDR M", M1, "FTE times monthly loaded cost times 12.")
cl("Platform engineer", "=in_eng_fte*in_eng_cost*12", "IDR M", M1, "FTE times monthly loaded cost times 12.")
cl("Annual security audit", "=in_sec_a", "IDR M", M1, "Input.")
cl("Monitoring, licences and tools", "=in_mon", "IDR M", M1, "Input.")
cl("AI service usage", "=cost_ai", "IDR M", M1, "From the usage calculation above.")
cl("Subtotal before contingency", "=SUM(B29:B35)", "IDR M", M1, "", None, True)
cl("Contingency", "=B36*in_r_cont", "IDR M", M1, "Percentage of subtotal.")
cl("Running cost for the first unit", "=B36+B37", "IDR M", M1, "Year 0 prices.", "cost_run_base", True)
cl("ADDED RUNNING COST FOR EACH EXTRA UNIT", None, None, None, None)
cl("Added cloud cost", "=in_i_cloud", "IDR M", M1, "Input.")
cl("Added knowledge manager time", "=in_i_km*in_km_cost*12", "IDR M", M1, "Input.")
cl("Added platform engineer time", "=in_i_eng*in_eng_cost*12", "IDR M", M1, "Input.")
cl("AI service usage", "=cost_ai", "IDR M", M1, "Same usage per unit.")
cl("Subtotal before contingency", "=SUM(B40:B43)", "IDR M", M1, "", None, True)
cl("Contingency", "=B44*in_r_cont", "IDR M", M1, "Percentage of subtotal.")
cl("Added running cost for each extra unit", "=B44+B45", "IDR M", M1, "Year 0 prices.", "cost_run_inc", True)
r = 5
for (label, f, unit, fm, basis, nm, bold) in C:
    if f is None: group(ws, r, label, 4)
    else:
        put(ws, r, 1, label, font=f_bold if bold else f_norm, fill=fill_tot if bold else None); put(ws, r, 2, f, fmt=fm, font=f_bold if bold else f_norm, fill=fill_tot if bold else None); put(ws, r, 3, unit); put(ws, r, 4, basis, font=f_note)
        if nm: name(nm, ws, f"$B${r}")
    r += 1
r += 1
put(ws, r, 1, "Pilot unit totals and comparison with the earlier slide", font=f_bold); header(ws, r + 1, ["Item", "New model", "Earlier slide", "Change"])
cmp = [("Pilot one-off cost (IDR M)", "=cost_shared+cost_unit", 1400), ("Pilot running cost a year (IDR M)", "=cost_run_base", 370), ("One-off cost shared (IDR M)", "=cost_shared", 1050), ("One-off cost per unit (IDR M)", "=cost_unit", 350), ("Added running cost per extra unit (IDR M)", "=cost_run_inc", 120)]
for i, (a, f, old) in enumerate(cmp):
    rr = r + 2 + i; put(ws, rr, 1, a); put(ws, rr, 2, f, fmt=M0, font=f_link); put(ws, rr, 3, old, fmt=M0, font=f_in); put(ws, rr, 4, f"=B{rr}/C{rr}-1", fmt=P0)
CELLS["cost_cmp_row"] = r + 2
r = r + 2 + len(cmp) + 1
put(ws, r, 1, "Alternative: generic workplace assistant licence for 3 units (5 years)", font=f_bold)
alt = [("Users (3 units)", "=3*lab_users", M0, "Platform user count."), ("List price per user a month (USD)", 30, M0, "Microsoft 365 Copilot enterprise list price, on top of a Microsoft 365 licence (Microsoft, 2023; reconfirmed 2026)."),
       ("Licence cost over 5 years (IDR M)", f"=B{r+1}*B{r+2}*12*5*in_fx/1000000", M0, "Users times price times 60 months. Excludes base Microsoft 365 licence."),
       ("Platform one-off and running cost over 5 years (IDR M, 3 units)", "=CF_3U!C29+CF_3U!D29+CF_3U!E29+CF_3U!F29+CF_3U!G29+CF_3U!H29", M0, "From the 3-unit cash flow. Includes data work, connectors and approval workflow that a generic assistant does not provide.")]
for i, (a, f, fm, d) in enumerate(alt):
    rr = r + 1 + i; put(ws, rr, 1, a); put(ws, rr, 2, f, fmt=fm, font=f_in if not str(f).startswith("=") else f_norm); put(ws, rr, 4, d, font=f_note)
CELLS["alt_row"] = r + 1

# ======================================================================= Rollout
ws = wb.create_sheet("Rollout"); RO = ws
title(ws, "Rollout schedule and adoption curve", "Units live at the end of each year and adoption by years since go-live.")
widths(ws, [40, 12, 12, 12, 12, 12, 40])
header(ws, 4, ["Units live by year", "Year 0", "Year 1", "Year 2", "Year 3", "Year 4", "Year 5"][:1] + ["Year 1", "Year 2", "Year 3", "Year 4", "Year 5"])
RORW = {}
for i, N in enumerate([1, 3, 6, 12]):
    r = 5 + i; put(ws, r, 1, f"{N} unit" + ("s" if N > 1 else "") + " in the programme", font=f_bold)
    for t in range(5): put(ws, r, 2 + t, ROLLOUT[N][t], fmt=M0, font=f_in)
    RORW[N] = r
put(ws, 9, 1, "The pilot unit goes live in year 1. Later units are added as the pilot proves the value. Edit blue cells to change the pace.", font=f_note)
header(ws, 11, ["Adoption by years since go-live", "Year 1", "Year 2", "Year 3", "Year 4", "Year 5"])
put(ws, 12, 1, "Share of users active", font=f_bold)
put(ws, 12, 2, "=in_adopt*in_ramp1", fmt=P0); put(ws, 12, 3, "=in_adopt*in_ramp2", fmt=P0)
for c in (4, 5, 6): put(ws, 12, c, "=in_adopt", fmt=P0)
ADOPT_RANGE = "Rollout!$B$12:$F$12"

# ======================================================================= CF sheets
def cf_sheet(N):
    ws = wb.create_sheet(f"CF_{N}U"); ws.sheet_properties.tabColor = BLUE
    title(ws, f"Cash flow and returns: {N} unit" + ("s" if N > 1 else ""), "IDR M, nominal, year-end convention. Year 0 is the investment year. Benefits count the four headline levers only.")
    put(ws, 2, 6, '="Scenario: "&CHOOSE(scn,"Pessimistic","Base","Optimistic")', font=f_bold)
    widths(ws, [46, 10, 13, 13, 13, 13, 13, 13])
    header(ws, 4, ["Line", "Cohort", "Year 0", "Year 1", "Year 2", "Year 3", "Year 4", "Year 5"])
    for t in range(6): put(ws, 4, 3 + t, t, font=f_hdr, fill=fill_hdr, al="center")
    for t in range(6): ws.cell(row=4, column=3 + t).number_format = '"Year "0'
    cols = [CL(3 + t) for t in range(6)]
    # rows
    put(ws, 5, 1, "Units live at year end")
    put(ws, 5, 3, 0, fmt=M0)
    for t in range(1, 6): put(ws, 5, 3 + t, f"=Rollout!{CL(1+t)}{RORW[N]}", fmt=M0, font=f_link)
    put(ws, 6, 1, "Units going live in the year"); put(ws, 6, 3, 0, fmt=M0)
    for t in range(1, 6): put(ws, 6, 3 + t, f"={cols[t]}5-{cols[t-1]}5", fmt=M0)
    put(ws, 7, 1, "Adoption-weighted units by cohort (year gone live)", font=f_bold)
    for c in range(1, 6):
        r = 7 + c; put(ws, r, 1, f"   Cohort of year {c}"); put(ws, r, 2, c, fmt=M0)
        put(ws, r, 3, 0, fmt=M2)
        for t in range(1, 6):
            put(ws, r, 3 + t, f"=IF({cols[t]}$4>=$B{r},INDEX($D$6:$H$6,$B{r})*INDEX({ADOPT_RANGE},{cols[t]}$4-$B{r}+1),0)", fmt=M2)
    put(ws, 13, 1, "Adoption-weighted units", font=f_bold, fill=fill_tot); put(ws, 13, 3, 0, fmt=M2, fill=fill_tot)
    for t in range(1, 6): put(ws, 13, 3 + t, f"=SUM({cols[t]}8:{cols[t]}12)", fmt=M2, font=f_bold, fill=fill_tot)
    put(ws, 14, 1, "Escalation factor")
    for t in range(6): put(ws, 14, 3 + t, f"=(1+in_infl)^{cols[t]}$4", fmt='0.000')
    group(ws, 15, "Benefits (headline levers)", 8)
    for i, (lab, nm) in enumerate([("Lever 1: search and checking time", "lev_L1"), ("Lever 2: repair time", "lev_L2"), ("Lever 3: repeat failures", "lev_L3"), ("Lever 4: faster start for new staff", "lev_L4")]):
        r = 16 + i; put(ws, r, 1, lab); put(ws, r, 3, 0, fmt=M0)
        for t in range(1, 6): put(ws, r, 3 + t, f"={cols[t]}$13*{nm}*{cols[t]}$14", fmt=M0)
    put(ws, 20, 1, "Total benefits", font=f_bold, fill=fill_tot)
    for t in range(6): put(ws, 20, 3 + t, f"=SUM({cols[t]}16:{cols[t]}19)", fmt=M0, font=f_bold, fill=fill_tot)
    for i, (lab, nm) in enumerate([("Memo: upside A, start-up delay", "lev_U1"), ("Memo: upside B, incident cost", "lev_U2"), ("Memo: upside C, document rework", "lev_U3")]):
        r = 21 + i; put(ws, r, 1, lab, font=f_sub); put(ws, r, 3, 0, fmt=M0)
        for t in range(1, 6): put(ws, r, 3 + t, f"={cols[t]}$13*{nm}*{cols[t]}$14", fmt=M0, font=f_sub)
    group(ws, 24, "Costs", 8)
    put(ws, 25, 1, "Shared one-off cost"); put(ws, 25, 3, "=cost_shared", fmt=M0)
    for t in range(1, 6): put(ws, 25, 3 + t, 0, fmt=M0)
    put(ws, 26, 1, "One-off cost for units going live next year")
    for t in range(6):
        nxt = f"INDEX($D$6:$H$6,{cols[t]}$4+1)" if t < 5 else "0"
        put(ws, 26, 3 + t, f"={nxt}*cost_unit*{cols[t]}$14", fmt=M0)
    put(ws, 27, 1, "Total one-off cost", font=f_bold)
    for t in range(6): put(ws, 27, 3 + t, f"={cols[t]}25+{cols[t]}26", fmt=M0, font=f_bold)
    put(ws, 28, 1, "Running cost"); put(ws, 28, 3, 0, fmt=M0)
    for t in range(1, 6): put(ws, 28, 3 + t, f"=(cost_run_base+({cols[t]}5-1)*cost_run_inc)*{cols[t]}$14", fmt=M0)
    put(ws, 29, 1, "Total cost", font=f_bold, fill=fill_tot)
    for t in range(6): put(ws, 29, 3 + t, f"={cols[t]}27+{cols[t]}28", fmt=M0, font=f_bold, fill=fill_tot)
    group(ws, 30, "Pre-tax cash flow", 8)
    put(ws, 31, 1, "Net cash flow before tax", font=f_bold)
    for t in range(6): put(ws, 31, 3 + t, f"={cols[t]}20-{cols[t]}29", fmt=M0, font=f_bold)
    put(ws, 32, 1, "Cumulative net cash flow"); put(ws, 32, 3, "=C31", fmt=M0)
    for t in range(1, 6): put(ws, 32, 3 + t, f"={cols[t-1]}32+{cols[t]}31", fmt=M0)
    put(ws, 33, 1, "Discount factor")
    for t in range(6): put(ws, 33, 3 + t, f"=1/(1+calc_r)^{cols[t]}$4", fmt='0.000')
    put(ws, 34, 1, "Present value of net cash flow")
    for t in range(6): put(ws, 34, 3 + t, f"={cols[t]}31*{cols[t]}33", fmt=M0)
    put(ws, 35, 1, "Cumulative present value"); put(ws, 35, 3, "=C34", fmt=M0)
    for t in range(1, 6): put(ws, 35, 3 + t, f"={cols[t-1]}35+{cols[t]}34", fmt=M0)
    group(ws, 36, "After-tax cash flow", 8)
    put(ws, 37, 1, "Depreciation of one-off cost")
    for t in range(6): put(ws, 37, 3 + t, f"=SUMPRODUCT(($C$27:$H$27)*($C$4:$H$4<{cols[t]}$4)*({cols[t]}$4-$C$4:$H$4<=in_dep_years))/in_dep_years", fmt=M0)
    put(ws, 38, 1, "Taxable income (benefits less running cost less depreciation)")
    for t in range(6): put(ws, 38, 3 + t, f"={cols[t]}20-{cols[t]}28-{cols[t]}37", fmt=M0)
    put(ws, 39, 1, "Tax (a negative value is a tax shield)")
    for t in range(6): put(ws, 39, 3 + t, f"={cols[t]}38*in_tax", fmt=M0)
    put(ws, 40, 1, "Net cash flow after tax", font=f_bold)
    for t in range(6): put(ws, 40, 3 + t, f"={cols[t]}31-{cols[t]}39", fmt=M0, font=f_bold)
    put(ws, 41, 1, "Present value after tax")
    for t in range(6): put(ws, 41, 3 + t, f"={cols[t]}40*{cols[t]}33", fmt=M0)
    put(ws, 42, 1, "Payback helper: simple (years)", font=f_note); put(ws, 43, 1, "Payback helper: discounted (years)", font=f_note)
    put(ws, 42, 3, 0, fmt=M2, font=f_note); put(ws, 43, 3, 0, fmt=M2, font=f_note)
    for t in range(1, 6):
        put(ws, 42, 3 + t, f"=IF(AND({cols[t-1]}32<0,{cols[t]}32>=0),({cols[t]}$4-1)+(-{cols[t-1]}32)/{cols[t]}31,0)", fmt=M2, font=f_note)
        put(ws, 43, 3 + t, f"=IF(AND({cols[t-1]}35<0,{cols[t]}35>=0),({cols[t]}$4-1)+(-{cols[t-1]}35)/{cols[t]}34,0)", fmt=M2, font=f_note)
    group(ws, 45, "Results", 8)
    res = [("NPV before tax (IDR M)", "=SUM(C34:H34)", M0, "npv"), ("NPV after tax (IDR M)", "=SUM(C41:H41)", M0, "npv_at"),
           ("IRR before tax", '=IFERROR(IRR(C31:H31),"n/a")', P1, "irr"), ("IRR after tax", '=IFERROR(IRR(C40:H40),"n/a")', P1, "irr_at"),
           ("Payback (months)", '=IF(SUM(D42:H42)>0,SUM(D42:H42)*12,"over 60")', M1, "pb"), ("Discounted payback (months)", '=IF(SUM(D43:H43)>0,SUM(D43:H43)*12,"over 60")', M1, "dpb"),
           ("Present value of benefits (IDR M)", "=SUMPRODUCT(C20:H20,C33:H33)", M0, "pvb"), ("Present value of costs (IDR M)", "=SUMPRODUCT(C29:H29,C33:H33)", M0, "pvc"),
           ("Benefit-cost ratio", "=IF(B54=0,0,B52/B53)", M2, "bcr"), ("Total benefits over 5 years (IDR M)", "=SUM(C20:H20)", M0, "tb"),
           ("Total costs over 5 years (IDR M)", "=SUM(C29:H29)", M0, "tc"), ("Net benefit over 5 years before tax (IDR M)", "=B55-B56", M0, "net5"),
           ("Return on investment over 5 years", "=B57/B56", P0, "roi"), ("Steady-state annual value (IDR M, year 0 prices)", "=H20/H14", M0, "steady"),
           ("Upside levers, annual (IDR M, year 0 prices, memo)", "=SUM(H21:H23)/H14", M0, "upside"), ("Total one-off cost (IDR M)", "=SUM(C27:H27)", M0, "oneoff"),
           ("Running cost in year 5 (IDR M, year 0 prices)", "=H28/H14", M0, "run5")]
    for i, (lab, f, fm, key) in enumerate(res):
        r = 46 + i; put(ws, r, 1, lab, font=f_bold if key in ("npv", "pb", "steady") else f_norm); put(ws, r, 2, f, fmt=fm, font=f_bold, fill=fill_tot if key in ("npv", "pb", "steady") else None); CELLS[f"cf{N}_{key}"] = f"CF_{N}U!$B${r}"
    # fix references that depended on fixed rows (BCR)
    ws["B54"] = "=IF(B53=0,0,B52/B53)"; ws["B54"].number_format = M2; ws["B54"].font = f_bold
    ws["B55"] = "=SUM(C20:H20)"; ws["B56"] = "=SUM(C29:H29)"; ws["B57"] = "=B55-B56"
    ws.freeze_panes = "C5"
    return ws
for N in (1, 3, 6, 12): cf_sheet(N)
# result rows: 46 npv,47 npv_at,48 irr,49 irr_at,50 pb,51 dpb,52 pvb,53 pvc,54 bcr,55 tb,56 tc,57 net5,58 roi,59 steady,60 upside,61 oneoff,62 run5

# ======================================================================= Summary
ws = wb.create_sheet("Summary", 1); SM = ws
title(ws, "Summary of results", "Live links to the cash flow sheets. Change the scenario on Inputs!D4 to see the other cases.")
put(ws, 2, 6, '="Active scenario: "&CHOOSE(scn,"Pessimistic","Base","Optimistic")', font=f_bold)
widths(ws, [52, 15, 15, 15, 15, 4, 40])
header(ws, 4, ["Metric (IDR M unless stated)", "1 unit (pilot)", "3 units", "6 units", "12 units"])
srows = [("Steady-state annual value (year 0 prices)", "steady", M0), ("Total one-off cost", "oneoff", M0), ("Running cost in year 5 (year 0 prices)", "run5", M0),
         ("Total benefits over 5 years", "tb", M0), ("Total costs over 5 years", "tc", M0), ("Net benefit over 5 years, before tax", "net5", M0),
         ("NPV before tax", "npv", M0), ("NPV after tax", "npv_at", M0), ("IRR before tax", "irr", P0), ("IRR after tax", "irr_at", P0),
         ("Payback (months)", "pb", M1), ("Discounted payback (months)", "dpb", M1), ("Benefit-cost ratio", "bcr", M2), ("Return on investment over 5 years", "roi", P0), ("Upside levers, annual (memo)", "upside", M0)]
SROW = {}
for i, (lab, key, fm) in enumerate(srows):
    r = 5 + i; SROW[key] = r; put(ws, r, 1, lab, font=f_bold if key in ("steady", "npv", "pb") else f_norm)
    for j, N in enumerate((1, 3, 6, 12)):
        put(ws, r, 2 + j, "=" + CELLS[f"cf{N}_{key}"], fmt=fm, font=f_link if key not in ("steady", "npv", "pb") else Font(name=FN, size=10, bold=True, color="008000"), fill=fill_tot if key in ("steady", "npv", "pb") else None)
put(ws, 21, 1, "Value by lever at steady-state adoption (IDR M a year, 1 unit, year 0 prices)", font=f_bold)
header(ws, 22, ["Lever", "Value", "Share"])
lv_names = [("Search and checking time", "lev_L1"), ("Repair time", "lev_L2"), ("Repeat failures", "lev_L3"), ("Faster start for new staff", "lev_L4")]
for i, (lab, nm) in enumerate(lv_names):
    r = 23 + i; put(ws, r, 1, lab); put(ws, r, 2, f"={nm}*in_adopt", fmt=M0); put(ws, r, 3, f"=B{r}/B$27", fmt=P0)
put(ws, 27, 1, "Total headline value", font=f_bold, fill=fill_tot); put(ws, 27, 2, "=SUM(B23:B26)", fmt=M0, font=f_bold, fill=fill_tot); put(ws, 27, 3, "=SUM(C23:C26)", fmt=P0, font=f_bold, fill=fill_tot)
put(ws, 28, 1, "Upside levers at steady-state adoption (memo)"); put(ws, 28, 2, "=lev_up_total*in_adopt", fmt=M0)
# steady value by lever for each scenario (chart data)
put(ws, 30, 1, "Steady-state value by lever and programme size (IDR M a year, year 0 prices)", font=f_bold)
header(ws, 31, ["Lever", "1 unit", "3 units", "6 units", "12 units"])
for i, (lab, nm) in enumerate(lv_names):
    r = 32 + i; put(ws, r, 1, lab)
    for j, N in enumerate((1, 3, 6, 12)):
        put(ws, r, 2 + j, f"=CF_{N}U!H{16+i}/CF_{N}U!H14", fmt=M0)
put(ws, 37, 1, "Cumulative net cash flow before tax (IDR M)", font=f_bold)
header(ws, 38, ["Year", "1 unit", "3 units", "6 units", "12 units"])
for t in range(6):
    r = 39 + t; put(ws, r, 1, t, fmt='"Year "0')
    for j, N in enumerate((1, 3, 6, 12)): put(ws, r, 2 + j, f"=CF_{N}U!{CL(3+t)}32", fmt=M0)
# charts
ch = BarChart(); ch.type = "col"; ch.grouping = "stacked"; ch.overlap = 100; ch.title = "Annual value by lever (IDR M)"
data = Reference(ws, min_col=1, max_col=5, min_row=32, max_row=35)
for i in range(4):
    s = Series(Reference(ws, min_col=2, max_col=5, min_row=32 + i), title=lv_names[i][0]); ch.series.append(s)
ch.set_categories(Reference(ws, min_col=2, max_col=5, min_row=31)); ch.height = 8; ch.width = 15; ws.add_chart(ch, "H4")
lc = LineChart(); lc.title = "Cumulative net cash flow before tax (IDR M)"; lc.height = 8; lc.width = 15
for j in range(4): lc.series.append(Series(Reference(ws, min_col=2 + j, min_row=39, max_row=44), title=["1 unit", "3 units", "6 units", "12 units"][j]))
lc.set_categories(Reference(ws, min_col=1, min_row=39, max_row=44)); lc.x_axis.tickLblPos = "low"; ws.add_chart(lc, "H21")
CELLS["SROW"] = SROW

# ======================================================================= Market
ws = wb.create_sheet("Market"); MK = ws
title(ws, "Market analysis: Indonesian chemical and petrochemical manufacturing", "Cited facts first, then a bottom-up sizing of the opportunity. Blue values on a grey source note are published figures. Yellow cells are assumptions.")
widths(ws, [58, 16, 16, 18, 80])
r = 4
def sec(t):
    global r
    group(ws, r, t, 5); r += 1
def fact(label, val, unit, fmt, src, name_=None, tag="Market source"):
    global r
    put(ws, r, 1, label, wrap=True); put(ws, r, 2, val, fmt=fmt, font=f_in); put(ws, r, 3, unit); put(ws, r, 4, tag); put(ws, r, 5, src, font=f_note, wrap=True)
    ws.row_dimensions[r].height = 28
    if name_: name(name_, ws, f"$B${r}")
    r += 1
sec("A. Chandra Asri landscape")
fact("Polyethylene capacity, existing Cilegon plant", 336, "kt a year", M0, "Chemical Engineering; Chandra Asri investor presentations (2016 to 2019).", "mk_pe_old")
fact("Polyethylene capacity added by the new plant (2020)", 400, "kt a year", M0, "Chemical Engineering: new HDPE, LLDPE and metallocene LLDPE plant.", "mk_pe_new")
put(ws, r, 1, "Total polyethylene capacity at Cilegon", font=f_bold); put(ws, r, 2, "=mk_pe_old+mk_pe_new", fmt=M0, font=f_bold); put(ws, r, 3, "kt a year"); put(ws, r, 4, "Derived"); put(ws, r, 5, "736 kt a year, as reported.", font=f_note); name("mk_pe_total", ws, f"$B${r}"); r += 1
fact("Ethylene capacity", 860, "kt a year", M0, "Chandra Asri is the sole ethylene producer in Indonesia (investor presentation, 2018).")
fact("Share of Indonesian olefin and polymer capacity", 0.48, "%", P0, "Chandra Asri investor presentation, 2018 and 2019.")
fact("Indicative share of the domestic polyethylene market", 0.35, "%", P0, "Indicative estimate in a market summary of 2024 data. Treat as approximate.")
fact("Employees, 2024", 3746, "people", M0, "Sustainability data for 2024: 3,746 employees, up 3.3 percent.", "mk_emp")
fact("Revenue FY2024", 1785, "USD M", M0, "IDNFinancials: USD 1.79 billion, down 17.4 percent from USD 2.16 billion in FY2023.")
fact("Net loss FY2024", -69.16, "USD M", M1, "IDNFinancials: net loss up 105.9 percent from USD 33.57 million.")
sec("B. Indonesian market")
fact("Polyethylene and polypropylene demand", 3.6, "Mt a year", M1, "German-Indonesian Chamber of Commerce (AHK Indonesia).")
fact("Demand forecast for 2027", 5.3, "Mt a year", M1, "Same source: growth of about 50 percent to 2027.")
fact("Share of demand met by imports", 0.50, "%", P0, "Same source. Import quotas for polyethylene and polypropylene started on 10 March 2024.")
fact("Domestic polyethylene capacity", 1.2, "Mt a year", M1, "Same source, at about 80 percent utilisation.")
fact("Chemical industry export value, 2024", 17.39, "USD B", M2, "Ministry of Industry of Indonesia.")
fact("Chemical industry investment, 2024", 65.76, "IDR T", M2, "Ministry of Industry of Indonesia.")
fact("Chemical, pharmaceutical and traditional medicine share of GDP, 2025", 0.0183, "%", '0.00%', "Katadata Databoks.")
sec("C. Technology and services markets")
fact("Indonesia AI market, 2024", 2.22, "EUR B", M2, "Statista Market Insights.", "mk_ai24")
fact("Indonesia AI market, 2030", 10.20, "EUR B", M2, "Statista Market Insights: growth of 28.9 percent a year.", "mk_ai30")
fact("Global knowledge management software, 2024", 20.15, "USD B", M2, "Grand View Research: USD 62.15 billion by 2033, 13.6 percent a year.")
fact("Global asset performance management, 2024", 24.8, "USD B", M1, "MarketsandMarkets and other analysts; estimates vary by definition.")
fact("Asia Pacific predictive maintenance, 2026", 3.8185, "USD B", M2, "Industry report: USD 3,818.5 million in 2026 to USD 7,493.1 million in 2031 (14.4 percent a year).")
sec("D. Operating benchmarks used as context")
fact("Knowledge workers: time spent searching and gathering information", 1.8, "hours a day", M1, "McKinsey Global Institute: 9.3 hours a week.")
fact("Knowledge workers: time spent searching (IDC)", 2.5, "hours a day", M1, "IDC: about 30 percent of the working day.")
fact("Cost of unplanned downtime, industrial average", 125000, "USD an hour", M0, "Siemens, The True Cost of Downtime 2024. Aberdeen Group cites about USD 260,000 an hour. Neither is specific to petrochemicals.")
fact("Unplanned downtime reduction from predictive maintenance", 0.35, "%", P0, "Published studies report 30 to 40 percent; used as an upper reference for the repair-time assumption.")
fact("Chemical workforce aged 45 and over", 0.40, "%", P0, "Chemical Processing survey commentary (about 40 percent).")
sec("E. Bottom-up opportunity sizing (assumptions in yellow)")
def asm(label, val, unit, fmt, note, nm=None):
    global r
    put(ws, r, 1, label, wrap=True); put(ws, r, 2, val, fmt=fmt, font=f_in, fill=fill_key); put(ws, r, 3, unit); put(ws, r, 4, "Assumption"); put(ws, r, 5, note, font=f_note, wrap=True)
    ws.row_dimensions[r].height = 28
    if nm: name(nm, ws, f"$B${r}")
    r += 1
def calc(label, f, unit, fmt, note, nm=None, bold=False):
    global r
    put(ws, r, 1, label, font=f_bold if bold else f_norm, fill=fill_tot if bold else None, wrap=True); put(ws, r, 2, f, fmt=fmt, font=f_bold if bold else f_norm, fill=fill_tot if bold else None); put(ws, r, 3, unit); put(ws, r, 4, "Derived"); put(ws, r, 5, note, font=f_note, wrap=True)
    ws.row_dimensions[r].height = 28
    if nm: name(nm, ws, f"$B${r}")
    r += 1
asm("Chemical and petrochemical manufacturing sites in Indonesia", 80, "sites", M0, "Team estimate. Includes olefins, polyolefins, chlor-alkali, fertiliser, vinyl, aromatics and specialty sites. To be verified with the Ministry of Industry register.", "mk_sites")
asm("Process units per site", 6, "units", M0, "Team estimate. A unit is a process area of the size of the sample LLDPE unit (about 45 plant staff).", "mk_units_site")
calc("Process units in Indonesia (total addressable units)", "=mk_sites*mk_units_site", "units", M0, "Sites times units.", "mk_tam_units", True)
asm("Share of units at sites with an existing EDMS or CMMS and a digital programme", 0.35, "%", P0, "Team estimate. These sites can connect the platform to existing systems.", "mk_sam_share")
calc("Serviceable units", "=mk_tam_units*mk_sam_share", "units", M0, "Units times share.", "mk_sam_units", True)
asm("Units reached within 5 years", 0.30, "%", P0, "Share of serviceable units reachable through Chandra Asri and partner sites in 5 years.", "mk_som_share")
calc("Obtainable units, external", "=mk_sam_units*mk_som_share", "units", M0, "Serviceable units times share.", "mk_som_ext")
asm("Chandra Asri units in the internal programme", 12, "units", M0, "Largest scenario in this model. About 21 unit equivalents exist if a quarter of staff work in operations, maintenance and engineering (see below).", "mk_internal")
calc("Obtainable units, total", "=mk_internal+mk_som_ext", "units", M0, "Internal plus external.", "mk_som_units", True)
calc("Unit equivalents at Chandra Asri", "=mk_emp*0.25/lab_users", "units", M1, "Employees times 25 percent in operations, maintenance and engineering, divided by 45 users a unit.", "mk_ca_units")
calc("Share of Chandra Asri unit equivalents in the 12-unit scenario", "=mk_internal/mk_ca_units", "%", P0, "Check that the internal programme is within company scale.")
r += 1
sec("F. Value pool and revenue pool (IDR M a year, steady state, year 0 prices)")
calc("Value created per unit a year (headline levers, steady-state adoption)", "=lev_total_adopt", "IDR M", M0, "From the Levers sheet.", "mk_value_unit")
asm("Share of value that a platform provider could capture in price", 0.20, "%", P0, "Typical value-based pricing share for industrial software; Team assumption.", "mk_capture")
calc("Price per unit a year", "=mk_value_unit*mk_capture", "IDR M", M0, "Value created times capture share.", "mk_price")
calc("Total addressable value pool (customer benefit)", "=mk_tam_units*mk_value_unit", "IDR M", M0, "All units times value per unit.", "mk_tam_value", True)
calc("Serviceable value pool", "=mk_sam_units*mk_value_unit", "IDR M", M0, "Serviceable units times value.", "mk_sam_value", True)
calc("Obtainable value pool", "=mk_som_units*mk_value_unit", "IDR M", M0, "Obtainable units times value.", "mk_som_value", True)
calc("Total addressable revenue pool", "=mk_tam_units*mk_price", "IDR M", M0, "All units times price.", "mk_tam_rev", True)
calc("Serviceable revenue pool", "=mk_sam_units*mk_price", "IDR M", M0, "Serviceable units times price.", "mk_sam_rev", True)
calc("Obtainable revenue pool", "=mk_som_units*mk_price", "IDR M", M0, "Obtainable units times price.", "mk_som_rev", True)
calc("Total addressable revenue pool (USD M)", "=mk_tam_rev*1000000/in_fx/1000000", "USD M", M1, "Converted at the exchange rate.", "mk_tam_usd")
calc("Serviceable revenue pool (USD M)", "=mk_sam_rev/in_fx*1000000/1000000", "USD M", M1, "Converted.", "mk_sam_usd")
calc("Obtainable revenue pool (USD M)", "=mk_som_rev/in_fx*1000000/1000000", "USD M", M1, "Converted.", "mk_som_usd")
asm("Southeast Asia expansion: multiple of the Indonesian addressable units", 4.0, "x", M1, "Team assumption for an expansion option (Indonesia, Malaysia, Thailand, Singapore, Vietnam). Not used in the investment case.", "mk_sea_x")
calc("Southeast Asia addressable value pool (IDR M a year)", "=mk_tam_value*mk_sea_x", "IDR M", M0, "Indonesian pool times the expansion multiple.", "mk_sea_value")
calc("Southeast Asia addressable revenue pool (USD M a year)", "=mk_tam_usd*mk_sea_x", "USD M", M1, "Indonesian pool times the expansion multiple.", "mk_sea_usd")
sec("G. Top-down cross-check")
asm("Share of Indonesian AI spend that goes to manufacturing", 0.10, "%", P0, "Team assumption.", "mk_td1")
asm("Share of manufacturing AI spend on knowledge and maintenance use cases", 0.15, "%", P0, "Team assumption.", "mk_td2")
asm("Share of manufacturing that is chemical and petrochemical", 0.12, "%", P0, "Team assumption.", "mk_td3")
calc("Top-down serviceable spend, 2030 (USD M)", "=mk_ai30*1000*1.08*mk_td1*mk_td2*mk_td3", "USD M", M1, "Indonesia AI market 2030 (EUR to USD at 1.08) times the three shares. Compare with the bottom-up serviceable revenue pool.", "mk_td_usd")
calc("Ratio of top-down to bottom-up serviceable pool", "=mk_td_usd/mk_sam_usd", "x", M2, "A ratio between 0.2 and 5 indicates the same order of magnitude.")
CELLS["market_end"] = r
# funnel table for chart
r += 1
put(ws, r, 1, "Funnel for charts (units and revenue pool)", font=f_bold); r += 1
header(ws, r, ["Stage", "Units", "Value pool (IDR M)", "Revenue pool (IDR M)"]); r += 1
funnel0 = r
for lab, u, v, rv in (("Total addressable", "mk_tam_units", "mk_tam_value", "mk_tam_rev"), ("Serviceable", "mk_sam_units", "mk_sam_value", "mk_sam_rev"), ("Obtainable", "mk_som_units", "mk_som_value", "mk_som_rev")):
    put(ws, r, 1, lab); put(ws, r, 2, f"={u}", fmt=M0); put(ws, r, 3, f"={v}", fmt=M0); put(ws, r, 4, f"={rv}", fmt=M0); r += 1
CELLS["funnel_row"] = funnel0
bc = BarChart(); bc.type = "bar"; bc.title = "Market funnel: value pool (IDR M a year)"; bc.height = 7; bc.width = 14
bc.add_data(Reference(ws, min_col=3, min_row=funnel0 - 1, max_row=funnel0 + 2), titles_from_data=True); bc.set_categories(Reference(ws, min_col=1, min_row=funnel0, max_row=funnel0 + 2)); ws.add_chart(bc, f"F{funnel0 - 3}")

# ======================================================================= Competitors
ws = wb.create_sheet("Competitors"); CP = ws
title(ws, "Alternatives and positioning", "Team assessment on a 1 to 5 scale (5 is best). Scores are judgements to be tested with the Company. Only the list price of the generic assistant is a published figure.")
widths(ws, [44, 10, 18, 18, 18, 18, 18])
header(ws, 4, ["Criterion", "Weight", "This platform", "Generic workplace assistant", "Enterprise document search", "EAM or CMMS vendor module", "In-house custom build"])
crit = [("Cited answers with approval status and confidence", 0.20, [5, 3, 2, 3, 3]), ("Tacit knowledge capture and approval workflow", 0.15, [5, 2, 1, 2, 3]), ("Failure memory linked to work orders and lessons", 0.15, [5, 1, 1, 4, 3]),
        ("Plant context: P&ID, interlock, drawing, 3D", 0.15, [5, 1, 2, 3, 3]), ("Control of data and deployment", 0.10, [4, 2, 4, 4, 5]), ("Time to value", 0.10, [4, 4, 3, 2, 1]), ("Five-year cost (5 is lowest)", 0.10, [4, 3, 4, 2, 2]), ("Independence from one vendor", 0.05, [4, 2, 3, 2, 4])]
for i, (c, w, sc) in enumerate(crit):
    r = 5 + i; put(ws, r, 1, c); put(ws, r, 2, w, fmt=P0, font=f_in)
    for j, s in enumerate(sc): put(ws, r, 3 + j, s, fmt=M0, font=f_in, al="center")
put(ws, 13, 1, "Weighted score", font=f_bold, fill=fill_tot); put(ws, 13, 2, "=SUM(B5:B12)", fmt=P0, font=f_bold, fill=fill_tot)
for j in range(5): put(ws, 13, 3 + j, f"=SUMPRODUCT($B$5:$B$12,{CL(3+j)}5:{CL(3+j)}12)", fmt=M2, font=f_bold, fill=fill_tot, al="center")
put(ws, 14, 1, "Rank");
for j in range(5): put(ws, 14, 3 + j, f"=RANK({CL(3+j)}13,$C$13:$G$13)", fmt=M0, al="center")
put(ws, 16, 1, "Notes", font=f_bold)
notes = ["Generic workplace assistant: Microsoft 365 Copilot is listed at USD 30 per user a month on top of a Microsoft 365 licence. It searches files but does not hold approval status, interlock logic or work order history as structured facts.",
         "Enterprise document search: finds documents but does not answer, cite revisions or capture tacit knowledge.",
         "EAM or CMMS vendor module: strong on work orders; the cost and the integration with documents and P&IDs depend on the vendor and are quoted case by case.",
         "In-house custom build: full control, but the time to value and the engineering effort are the largest. The cost comparison in the Costs sheet uses the platform build-up as the reference.",
         "Scores should be validated in the pilot with Company engineers. The ranking is a position statement, not a market study."]
for i, n in enumerate(notes):
    put(ws, 17 + i, 1, n, wrap=True, font=f_note); ws.merge_cells(start_row=17 + i, start_column=1, end_row=17 + i, end_column=7); ws.row_dimensions[17 + i].height = 30

# ======================================================================= placeholders for static sheets: filled by finalize()
for nme in ("Sensitivity", "MonteCarlo", "Risks", "KPIs", "Reconciliation", "Checks", "Sources"):
    wb.create_sheet(nme)

json.dump(dict(names=NAMES, cells=CELLS), open(os.path.join(spec.HERE, "cells.json"), "w"), indent=1, default=str)
import build_static
build_static.add(wb, globals())
from openpyxl.worksheet.properties import PageSetupProperties
tabs = {"README": GREY, "Inputs": ORANGE, "Summary": GREEN, "Checks": GREEN}
for w_ in wb.worksheets:
    w_.page_setup.orientation = "landscape"; w_.page_setup.paperSize = 9; w_.page_setup.fitToWidth = 1; w_.page_setup.fitToHeight = 0
    w_.sheet_properties.pageSetUpPr = PageSetupProperties(fitToPage=True)
    w_.print_options.horizontalCentered = False
    w_.page_margins.left = w_.page_margins.right = 0.4; w_.page_margins.top = w_.page_margins.bottom = 0.5
    if w_.title in tabs: w_.sheet_properties.tabColor = tabs[w_.title]
wb.save(OUT)
print("saved", OUT)
