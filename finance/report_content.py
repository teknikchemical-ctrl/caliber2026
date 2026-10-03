"""Content of the Business Impact and Financial Modelling Report. Numbers are read from the model so that text and workbook cannot drift apart."""
import os, sys, json
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE); sys.path.insert(0, os.path.join(HERE, "..", "manual"))
from engine import H1, H2, P, STEPS, BUL, FIG, NOTE, TABLE
import spec
from spec import run, CM, active
import openpyxl
from openpyxl.utils import range_boundaries

A = json.load(open(os.path.join(HERE, "analysis.json")))
WB = openpyxl.load_workbook(os.path.join(HERE, "Business_Impact_Financial_Model.xlsx"), data_only=True)
def nm(n):
    ref = WB.defined_names[n].attr_text; sh, cell = ref.split("!"); sh = sh.strip("'"); return WB[sh][cell.replace("$", "")].value
def f0(x): return f"{x:,.0f}"
def f1(x): return f"{x:,.1f}"
def B(x): return f"IDR {x/1000:,.1f} B"          # IDR M to billions
def Mn(x): return f"IDR {x:,.0f} M"
def pc(x, d=0): return f"{x*100:.{d}f}%"

R = {N: run(2, N) for N in (1, 3, 6, 12)}
R3 = R[3]; R1 = R[1]
LV = R3["lv"]; AD = active(2)["adopt"]
Lss = [x * AD for x in LV["L"]]; Uss = [x * AD for x in LV["U"]]
MC = A["MC"]; SENS = A["SENS"]; OLD = {int(k): v for k, v in A["old"].items()}
cs = R3["cs"]
pess = {N: run(1, N)["npv"] for N in (1, 3, 6, 12)}; opt = {N: run(3, N)["npv"] for N in (1, 3, 6, 12)}
def mc(k, N): return MC[f"{k}|{N}"]
be = {(r[0], r[1]): r[3] for r in SENS["break_even"]}
rows = SENS["rows"]
tam_u, sam_u, som_u = nm("mk_tam_units"), nm("mk_sam_units"), nm("mk_som_units")
tam_v, sam_v, som_v = nm("mk_tam_value"), nm("mk_sam_value"), nm("mk_som_value")
tam_r, sam_r, som_r = nm("mk_tam_rev"), nm("mk_sam_rev"), nm("mk_som_rev")
tam_usd, sea_usd = nm("mk_tam_usd"), nm("mk_sea_usd")
ca_units = nm("mk_ca_units"); td_ratio = nm("mk_td_usd") / nm("mk_sam_usd")
fx = AD and active(2)["fx"]
pe_cap_mt = 1.2; util_pt_usd = pe_cap_mt * 1000 * 0.01 * active(2)["margin"] / 1000   # USD M for one point of utilisation (kt x USD per t)
price_cop = 135 * 30 * 12 * 5 * active(2)["fx"] / 1e6
tot5_3u = sum(R3["capex"]) + sum(R3["run"])
WBF = openpyxl.load_workbook(os.path.join(HERE, "Business_Impact_Financial_Model.xlsx"))
NSHEETS = len(WBF.sheetnames); NFORM = sum(1 for ws in WBF.worksheets for row in ws.iter_rows() for c in row if isinstance(c.value, str) and c.value.startswith("=")); NCHECKS = sum(1 for r in range(6, 80) if WB["Checks"].cell(r, 2).value)

def blocks():
    b = []
    # ---------------------------------------------------------------- 1 Executive summary
    b += [H1(1, "Executive summary", None, None, "The platform pays back when it is rolled out beyond one unit. A three-unit programme returns about " + B(R3["steady"]) + " a year and a positive net present value in " + pc(mc("Probability that NPV is positive", 3)) + " of simulated outcomes."),
          P(f"This report rebuilds the business impact slide of the Asset Knowledge Platform proposal as a full financial model. Every value on the slide now traces to a formula in the accompanying Excel workbook, to the 211 work orders supplied with the case, or to a cited market source. The workbook has {NSHEETS} sheets, about {NFORM:,} live formulas and {NCHECKS} integrity checks, and a separate Python replica reproduces its results to the last digit."),
          P(f"The Base scenario counts only four evidence-based levers: time spent searching and checking sources, repair time, repeat failures and faster start for new staff. Start-up delay, incident cost and document rework are reported as upside and are not part of any headline figure."),
          TABLE(["Base scenario", "1 unit (pilot)", "3 units", "6 units", "12 units"],
                [["Annual value at full rollout (IDR M, year 0 prices)"] + [f0(R[N]["steady"]) for N in R],
                 ["One-off cost over the programme (IDR M)"] + [f0(sum(R[N]["capex"])) for N in R],
                 ["Net present value before tax (IDR M)"] + [f0(R[N]["npv"]) for N in R],
                 ["Net present value after tax (IDR M)"] + [f0(R[N]["npv_at"]) for N in R],
                 ["Internal rate of return before tax"] + [pc(R[N]["irr"]) for N in R],
                 ["Payback (months)"] + [f0(R[N]["pb"]) for N in R],
                 ["Probability that NPV is positive (Monte Carlo)"] + [pc(mc("Probability that NPV is positive", N)) for N in R]],
                [40, 15, 15, 15, 15]),
          H2("Main findings"),
          BUL([f"**The pilot unit does not repay on its own.** One unit returns {B(R1['steady'])} a year against a one-off cost of {B(sum(R1['capex']))}, so its NPV is {B(R1['npv'])}. The pilot buys evidence and a reusable platform.",
               f"**Scale is what creates value.** The shared cost of {B(cs['shared'])} is paid once. NPV turns positive from two units and reaches {B(R[12]['npv'])} at twelve units. Chandra Asri has about {ca_units:.0f} unit equivalents, so twelve units is {pc(12/ca_units)} of its scale.",
               f"**The risk is bounded.** In 5,000 simulated outcomes the three-unit NPV has a 5th percentile of {B(mc('5th percentile', 3))} and a 95th percentile of {B(mc('95th percentile', 3))}. The largest drivers are the share of breakdown hours that reduce output, the margin per tonne and the pay level used to value time.",
               f"**The market is a value pool, not a revenue pool.** Indonesian chemical and petrochemical manufacturing holds about {tam_u:.0f} process units and a customer value pool of {B(tam_v)} a year. A vendor could capture only about {Mn(tam_r)} ({tam_usd:.1f} million USD), so the case rests on internal value.",
               "**Several earlier values were too optimistic and have been corrected.** The cost anchor, the value of a downtime hour, the share of freed time that is productive and the share of the gain credited to the platform are now explicit."]),
          TABLE(["Earlier slide", "Earlier value", "New model", "Reason"],
                [["Annual value, 1 unit (IDR M)", f0(OLD[1]["tot"]), f0(R1["steady"]), "Haircuts for productive time and attribution; adoption of 85 percent"],
                 ["Pilot one-off cost (IDR M)", "1,400", f0(sum(R1["capex"][:1])), "Rebuilt line by line"],
                 ["Pilot running cost (IDR M a year)", "370", f0(cs["run_base"]), "Knowledge manager, platform engineer, hosting, security"],
                 ["Payback, 3 units (months)", f0(OLD[3]["pb"]), f0(R3["pb"]), "Phased rollout and adoption ramp by cohort"],
                 ["Value of a breakdown hour (IDR M)", "30", f1(LV["dv"]), "Built from capacity, margin and share of hours with output loss"]],
                [30, 14, 14, 42]),
          ]
    # ---------------------------------------------------------------- 2 Context and method
    b += [H1(2, "Context, scope and method", None, None, None),
          P("The CALIBER 2026 Case Book asks for a Manufacturing Knowledge Hub that connects scattered plant knowledge, gives engineers trusted and cited answers and supports reliability decisions. The business impact section must show expected benefits, key performance indicators and measurable value with supporting evidence. This report answers the business side of the three key questions."),
          TABLE(["Key question", "Business answer in this report"],
                [["1. How can the Company build a structured Industrial Data Ops foundation?", "A one-off shared cost of " + Mn(cs["shared"]) + " covers four connectors, security and governance. Section 5 prices it and Section 6 shows that it is repaid from two units."],
                 ["2. How can AI help engineers find trusted information faster?", "Search and checking time falls by 50 percent, from 40 to 20 minutes a day. Lever 1 values it at " + Mn(Lss[0]) + " a year for one unit."],
                 ["3. How can the hub support reliability and continuous improvement?", "Failure memory shortens repairs and prevents repeats. Levers 2 and 3 are " + pc((Lss[1] + Lss[2]) / sum(Lss)) + " of the value."]],
                [38, 62]),
          H2("Method"),
          STEPS(["**Baseline.** Re-derive breakdowns, downtime, repeat failures and cost from the 211 work orders, using formulas on the raw data.",
                 "**Value.** Convert time saved, repair hours saved and failures avoided into IDR with explicit loaded labour cost and a bottom-up value of a downtime hour.",
                 "**Cost.** Build one-off, per-unit and running cost line by line, with contingency.",
                 "**Return.** Phase the rollout by cohort, apply an adoption ramp and discount at the weighted average cost of capital of " + pc(nm("calc_wacc"), 1) + ". Report NPV, IRR, payback and benefit-cost ratio, before and after tax.",
                 "**Stress.** Run one-at-a-time sensitivities, break-even values, a Monte Carlo simulation and a risk register.",
                 f"**Verify.** Recalculate the workbook, check it with {NCHECKS} integrity tests and compare it with an independent Python replica."]),
          P("Every input carries an evidence tag: **Case data**, **Market source**, **Estimate** or **Assumption**. The Inputs sheet lists the pessimistic, base and optimistic value of each driver, and one switch changes the whole workbook."),
          FIG("s_inputs", "Inputs sheet (extract): blue cells are inputs, the Active column follows the scenario switch, and each driver carries an evidence tag.", maxh=80),
          ]
    # ---------------------------------------------------------------- 3 Market analysis
    b += [H1(3, "Market analysis", None, None, "The Company's own economics, Indonesian demand and the technology market all point in the same direction: availability and trusted knowledge are worth more each year."),
          H2("The Company and the Indonesian market"),
          TABLE(["Indicator", "Value", "Source"],
                [["Polyethylene capacity at Cilegon", "736 kt a year (336 kt existing and 400 kt added in 2020)", "Chemical Engineering; Chandra Asri"],
                 ["Ethylene capacity", "860 kt a year, the only producer in Indonesia", "Chandra Asri investor update, 2018"],
                 ["Employees, 2024", "3,746", "Sustainability report 2024"],
                 ["Revenue and result, FY2024", "USD 1.79 billion, down 17.4 percent; net loss of USD 69 million", "IDNFinancials"],
                 ["Polyethylene and polypropylene demand", "3.6 Mt a year, rising about 50 percent to 5.3 Mt by 2027; half is imported", "AHK Indonesia"],
                 ["Domestic polyethylene capacity", "1.2 Mt a year at about 80 percent utilisation; import quotas since March 2024", "AHK Indonesia; Argus"],
                 ["Chemical industry, 2024", "Exports of USD 17.4 billion and investment of IDR 65.8 trillion", "Ministry of Industry"],
                 ["Southeast Asia LLDPE price, 2026", "USD 920 to 1,500 per tonne CFR", "Polymer Update"]],
                [30, 46, 24]),
          P(f"Three conclusions follow. First, Chandra Asri reported a loss in FY2024 in a volatile margin environment, so a digital programme must repay quickly and be released in stages. Second, Indonesia imports about half of its polyethylene and is raising import barriers, so every point of domestic utilisation matters: one percentage point on 1.2 Mt of capacity is 12 kt, or about USD {util_pt_usd:.1f} million of margin at USD {active(2)['margin']} per tonne. Third, plant knowledge is at risk: surveys report that about 40 percent of chemical workforces are aged 45 or over and that most knowledge is tacit."),
          H2("Technology and services market"),
          BUL(["Indonesia's AI market is estimated at EUR 2.2 billion in 2024 and EUR 10.2 billion in 2030, a growth rate of 28.9 percent a year (Statista).",
               "Global knowledge management software was USD 20.2 billion in 2024 and grows 13.6 percent a year (Grand View Research). Asset performance management was about USD 24.8 billion.",
               "Asia Pacific predictive maintenance is USD 3.8 billion in 2026 and reaches USD 7.5 billion in 2031, a growth rate of 14.4 percent a year.",
               "Knowledge workers spend 1.8 hours a day searching for information (McKinsey) and up to 2.5 hours (IDC). The model uses only 40 minutes a day for plant staff."]),
          H2("Sizing the opportunity"),
          FIG("c_funnel", "Opportunity funnel for Indonesian chemical and petrochemical manufacturing. Source: Market sheet of the workbook.", maxh=75),
          P(f"The bottom-up sizing assumes 80 manufacturing sites with 6 process units each, which gives {tam_u:.0f} units. A unit is a process area the size of the sample LLDPE unit, with about 45 plant staff. Of these, 35 percent sit at sites with an existing document or maintenance system and a digital programme ({sam_u:.0f} units), and {som_u:.0f} could be reached in five years: 12 internal units and about 50 external ones. At the value per unit of {Mn(Lss and sum(Lss))} a year, the value pool falls from {B(tam_v)} to {B(sam_v)} and {B(som_v)}. If a provider priced at 20 percent of value created, the Indonesian revenue pool would be {Mn(tam_r)} ({tam_usd:.1f} million USD), or about {sea_usd:.0f} million USD with a Southeast Asia multiple of four. A top-down estimate from the national AI market gives a serviceable pool within a factor of {td_ratio:.0f} of this figure."),
          NOTE("note", "The external revenue pool is small. The platform should be funded for the value it creates inside the Company. Commercial extension is an option, not the investment case."),
          H2("Alternatives and positioning"),
          FIG("s_comp", "Weighted comparison of alternatives, Competitors sheet. Scores are the team's assessment on a scale of 1 to 5.", maxh=60),
          P(f"A generic workplace assistant is the closest low-cost alternative. At the published list price of USD 30 per user a month, 135 users cost about {Mn(price_cop)} over five years before the base Microsoft 365 licence. That is lower than the {Mn(tot5_3u)} five-year cost of the platform, but a generic assistant does not hold approval status, interlock logic, work order history or tacit knowledge as structured, auditable facts. Those features create most of the value in Levers 2 and 3."),
          ]
    # ---------------------------------------------------------------- 4 Business impact model
    b += [H1(4, "Business impact model", None, None, "The model starts from what the work orders show and values four effects. Each step is a formula that can be checked."),
          H2("Baseline from the case data"),
          FIG("s_casemetrics", "Case_Metrics sheet: every figure is a formula on the 211 work orders.", maxh=70),
          P(f"Between June 2024 and December 2025 the plant recorded {CM['n_bd']} breakdowns that cost {CM['bd_hours']:.0f} hours of downtime. The mean time to repair is {CM['mttr']:.1f} hours and breakdowns run at {CM['bd_year']:.1f} a year, which is {CM['bd_year']*CM['mttr']:.0f} downtime hours a year. Of {CM['n_corr']} corrective or breakdown jobs, {CM['rep']} ({pc(CM['rep_rate'])}) repeat the same failure mode on the same equipment within 120 days. A direct repair job costs IDR {CM['avg_corr_cost']:.1f} million on average. In addition, 66 of the 98 controlled documents carry no approval status."),
          H2("Value of one hour of downtime"),
          FIG("s_downtime", "Downtime_Value sheet.", maxh=55),
          P(f"The earlier slide used a flat IDR 30 million an hour. The new value starts from a unit capacity of 336 kt a year, which gives 42 tonnes an hour, and a lost margin of USD {active(2)['margin']} per tonne. A full stoppage then costs IDR {f0(LV['dv_full'])} million an hour. Because many equipment sets have spares or only reduce performance, only {pc(active(2)['loss'])} of breakdown hours are assumed to reduce output, which gives IDR {f1(LV['dv'])} million. This is the single most influential assumption in the model and it is tested in Section 7."),
          H2("Four value levers"),
          FIG("s_levers", "Levers sheet: annual value of one unit at full adoption, in IDR M at year 0 prices.", maxh=95),
          TABLE(["Lever", "How it is valued", "Evidence", "IDR M a year"],
                [["1 Search and checking time", "45 users x 20 minutes saved x 230 days x loaded cost x 60% productive", "Assumption, cited context", f0(Lss[0])],
                 ["2 Repair time", "Remaining breakdowns x 14.0 h x 10% x 70% credited x IDR 33 M an hour", "Case data and estimate", f0(Lss[1])],
                 ["3 Repeat failures", f"Avoided repeat jobs ({LV['avoided_jobs']:.1f} a year) x repair cost and downtime, 70% credited", "Case data", f0(Lss[2])],
                 ["4 Faster start for new staff", "6 joiners x 10 days x loaded day cost x 60% productive", "Assumption", f0(Lss[3])],
                 ["Total at 85% adoption", "", "", f0(sum(Lss))]],
                [24, 46, 18, 12]),
          P(f"Avoided repeat breakdowns are removed before the repair time lever is calculated, so no hour is counted twice. The upside levers are start-up delay avoided ({Mn(Uss[0])}), incident cost avoided ({Mn(Uss[1])}) and document rework ({Mn(Uss[2])}) a year per unit. They rest on assumptions only and are excluded from every headline figure."),
          ]
    # ---------------------------------------------------------------- 5 Investment
    b += [H1(5, "Investment and running cost", None, None, None),
          FIG("s_costs", "Costs sheet: shared one-off, per-unit one-off and running cost, in IDR M at year 0 prices.", maxh=95),
          P(f"The shared one-off cost is {Mn(cs['shared'])} including 15 percent contingency. It covers platform configuration (8 person-months), four connectors (EDMS, AIMS, CMMS and the historian), a security review, governance and training material. Each unit then needs {Mn(cs['unit'])} for document ingestion, knowledge capture sessions, user training and acceptance testing. Running cost is {Mn(cs['run_base'])} a year for the first unit and {Mn(cs['run_inc'])} for each extra unit."),
          P(f"The AI service itself costs only about {Mn(cs['ai'])} a year for one unit at list prices, so it is not a cost driver. People, data work and integration are. The pilot one-off cost is {Mn(cs['shared'] + cs['unit'])}, which is {pc((cs['shared'] + cs['unit'])/1400 - 1)} above the earlier estimate of IDR 1,400 M, and the running cost is {pc(cs['run_base']/370 - 1)} above IDR 370 M. The earlier figures had no line-by-line support."),
          ]
    # ---------------------------------------------------------------- 6 Financial results
    b += [H1(6, "Financial results", None, None, None),
          FIG("s_summary", "Summary sheet: results by programme size, Base scenario, IDR M unless stated.", maxh=75),
          P(f"A three-unit programme costs {Mn(sum(R3['capex']))} of one-off spend in total, because units two and three are onboarded in years 1 and 2. It reaches {Mn(R3['steady'])} of annual value at full rollout and a net present value of {Mn(R3['npv'])} before tax and {Mn(R3['npv_at'])} after tax. The internal rate of return is {pc(R3['irr'])} before tax. Simple payback is {R3['pb']:.0f} months and discounted payback {R3['dpb']:.0f} months, because adoption builds over two years and the later units start later. The benefit-cost ratio is {R3['bcr']:.2f}."),
          FIG("s_cf3", "CF_3U sheet: cohort adoption, benefits, costs, cash flow, discounting and tax for the three-unit programme.", maxh=120),
          FIG("c_cumulative", "Cumulative net cash flow before tax by programme size, Base scenario.", maxh=70),
          P(f"Cash flow is negative through year 2 in every programme and recovers during year 3. A single unit reaches break-even only after {R1['pb']:.0f} months. Across the scenario switch, the three-unit NPV ranges from {Mn(pess[3])} in the pessimistic case to {Mn(opt[3])} in the optimistic case, where every driver moves together. Section 7 shows how likely each outcome is."),
          FIG("c_costs", "Costs and benefits by year, three units, Base scenario.", maxh=65),
          ]
    # ---------------------------------------------------------------- 7 Uncertainty and risk
    top = rows[:5]
    b += [H1(7, "Uncertainty and risk", None, None, None),
          FIG("c_tornado", "One-at-a-time sensitivity of the three-unit NPV. Source: Sensitivity sheet.", maxh=85),
          P(f"The five largest drivers are: {top[0][0].lower()}, {top[1][0].lower()}, {top[2][0].lower()}, {top[3][0].lower()} and {top[4][0].lower()}. The first two set the value of a downtime hour. The three-unit NPV stays positive until the share of breakdown hours that reduce output falls from {pc(active(2)['loss'])} to {pc(be[('Share of breakdown hours that reduce output', 3)])}, until the margin falls from USD 220 to USD {be[('Contribution margin lost per tonne (USD per t)', 3)]:.0f} per tonne, and until the reduction in repair time falls from 10 percent to {pc(be[('Reduction in mean time to repair', 3)], 1)}. Costs can rise by {pc(be[('Multiple of one-off and running cost (1.0 = base)', 3)] - 1)} before the NPV is zero."),
          FIG("c_npv_size", "NPV before tax with the Monte Carlo 10th to 90th percentile range. Source: MonteCarlo sheet.", maxh=65),
          P(f"The Monte Carlo run draws 17 drivers independently from ranges that are wider than the scenario switch. For three units the mean NPV is {Mn(mc('Mean', 3))}, the median is {Mn(mc('Median', 3))}, and {pc(mc('Probability that NPV is positive', 3))} of outcomes are positive. The 5th percentile is {Mn(mc('5th percentile', 3))}. A single unit is positive in only {pc(mc('Probability that NPV is positive', 1))} of outcomes, which confirms that the pilot should not be judged on its own return."),
          FIG("s_risks", "Risk register with the NPV effect of each shock, Risks sheet.", maxh=60),
          P(f"The most damaging single risks are low adoption (NPV {Mn(A['RISKS'][0][3])}), a challenge to benefit attribution and a margin downturn. A combination of low adoption, a one-year delay, a 30 percent cost overrun and weaker attribution gives an NPV of {Mn(A['RISKS'][-1][3])}. The mitigations are role-based onboarding, baselines and control units, and the stage gates in Section 8."),
          ]
    # ---------------------------------------------------------------- 8 KPIs
    b += [H1(8, "KPIs and benefits realisation", None, None, None),
          TABLE(["KPI", "Baseline", "Target", "Measured by"],
                [["Mean time to repair", f"{CM['mttr']:.1f} h", f"{CM['mttr']*(1-active(2)['mttr_red']):.1f} h", "CMMS work order dates"],
                 ["Jobs repeating within 120 days", pc(CM["rep_rate"], 1), pc(CM["rep_rate"] * (1 - active(2)["rep_red"]), 1), "Failure memory report"],
                 ["Minutes a day searching and checking", "40", "20", "Pilot survey and timed tasks"],
                 ["Median time to a cited answer", "About 15 min", "3 min or less", "Timed pilot tasks"],
                 ["Answers with an approved source", "Not measured", "At least 90%", "Answer audit log"],
                 ["Weekly active users", "0", "85% of users", "Usage log"],
                 ["Documents without approval status", "67%", "10% or less", "Documents and Data Quality pages"]],
                [34, 20, 20, 26]),
          BUL(["**Gate 1, month 6.** Measured repair time, search time and adoption replace the assumptions. Continue to unit 2 only if the weighted benefit is at least 70 percent of the Base case.",
               "**Gate 2, month 12.** Repeat failure share and answer audit reviewed. Approve units 3 and beyond against the sensitivity table.",
               "**Gate 3, month 24.** Full benefit review, model update and rollout plan."]),
          ]
    # ---------------------------------------------------------------- 9 Conclusion
    b += [H1(9, "Conclusions and next steps", None, None, None),
          BUL([f"The investment case is positive for two or more units and strong at scale: NPV of {B(R3['npv'])} at three units and {B(R[12]['npv'])} at twelve.",
               "The pilot is a learning investment. Its purpose is to replace assumptions with measured Company data before the programme grows.",
               "The result depends most on the value of a downtime hour. The first pilot task should be to measure how many breakdown hours reduce output at the real unit.",
               "The platform is priced for the value it creates inside the Company. External sales are an option once the pilot has proved the numbers."]),
          P("**Decisions requested:** approve the pilot budget of " + Mn(cs["shared"] + cs["unit"]) + " with the three gates above; nominate a knowledge manager and a unit sponsor; and give read access to EDMS, AIMS, CMMS and historian extracts for the pilot unit."),
          H2("Limits"),
          P("The work orders and plant data are sample data prepared for the case. Salaries, margins, production loss and cost lines are estimates until the pilot replaces them. The model has no terminal value, financing or working capital, and the Monte Carlo run treats drivers as independent. Market figures come from public summaries of analyst reports and should be read as orders of magnitude."),
          H2("Workbook guide and sources"),
          P("The workbook Business_Impact_Financial_Model.xlsx contains the sheets Inputs, Case_Data, Case_Metrics, Labour, Downtime_Value, Levers, Costs, Rollout, CF_1U to CF_12U, Summary, Market, Competitors, Sensitivity, MonteCarlo, Risks, KPIs, Reconciliation, Checks and Sources. The Sources sheet lists the references with links. Blue cells are inputs, black cells are formulas and grey cells are static outputs of the Python replica."),
          ]
    # ---------------------------------------------------------------- appendix
    A_ = active(2); keyin = [("s_base", "Minutes a day spent searching and checking", "%d min", 0), ("s_red", "Reduction in search time", "pc", 0), ("conv", "Share of freed time that is productive", "pc", 0), ("adopt", "Steady-state adoption", "pc", 0),
             ("mttr_red", "Reduction in mean time to repair", "pc1", 0), ("attrib", "Share of the gain credited to the platform", "pc", 0), ("rep_red", "Reduction in repeat failures", "pc", 0), ("margin", "Contribution margin lost per tonne", "USD %d", 0),
             ("loss", "Share of breakdown hours with output loss", "pc", 0), ("cap_kt", "Unit capacity (kt a year)", "%d", 0), ("joiners", "New joiners and role changes a year", "%d", 0), ("pm", "Platform configuration (person-months)", "%g", 0)]
    tags = {x[0]: (x[6], x[4], x[5]) for x in spec.input_table()}
    def fv(v, f):
        return pc(v) if f == "pc" else pc(v, 1) if f == "pc1" else (f % v)
    rowsA = []
    for n, lab, f, _ in keyin:
        tg, lo, hi = tags[n]; rowsA.append([lab, fv(A_[n], f), f"{fv(lo, f)} to {fv(hi, f)}", tg])
    b += [H1(10, "Appendix: assumptions that matter most", None, None, "Twelve inputs carry most of the uncertainty. Each is tagged by the quality of its evidence and is replaced by measured data in the pilot."),
          TABLE(["Assumption", "Base", "Scenario range", "Evidence tag"], rowsA, [46, 14, 24, 16]),
          FIG("s_recon", "Reconciliation sheet: how each value on the earlier slide changed and why.", maxh=80),
          ]
    return b
