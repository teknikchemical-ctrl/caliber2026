# ======================================================= APPENDIX: data, integration, prototype, business case, evidence
# ---------- A11 data sources
s = app_slide("Data Sources: Each Source Has a {{Purpose, an Owner and a Business Justification}}", "Baseline data from the case plus proposed additions; a small set of well-governed sources is preferred to many weakly connected ones",
              "Case book data table; prototype counts")
rows = [["Source", "Content", "Business justification", "Status"],
        ["SOPs and OPLs (56)", "Steps, safety notes, tacit lessons", "Fewer wrong steps; retains SME experience", "Loaded"],
        ["Datasheets (8)", "Design limits, materials, ratings", "One place for trusted specifications", "Loaded"],
        ["P&IDs, GA drawings, plot plans (24)", "Equipment, tags, layout, hazards", "Links every tag to its drawing and location", "Loaded"],
        ["Interlock logic (8 sets, 84 instruments)", "Causes, effects, permissives", "States what trips and why, with the exact set point", "Loaded"],
        ["Maintenance history (211 work orders)", "Failures, root causes, cost, downtime", "Failure memory, KPIs, forecasting, planning", "Loaded"],
        ["Incident and RCA reports", "Lessons learned", "Prevents repeat events", "Add in pilot"],
        ["EDMS", "Controlled document revisions", "Single source of truth for revisions", "Adapter specified"],
        ["AIMS", "Work orders and asset hierarchy", "Live history; draft work orders returned for approval", "Adapter specified"],
        ["Historian or DCS values", "Live tag values", "Context for troubleshooting and prediction", "Hook in place"],
        ["Digital twin", "Asset model and 3D", "Navigation by equipment and place", "Planned"]]
table(s, 0.35, 1.5, 12.65, [3.2, 3.0, 4.6, 1.3], rows, 10, rowh=0.42, header_fill=NAVY)
text(s, 0.35, 6.25, 12.6, 0.55, "Each additional source requires an owner, a refresh rule and a stated decision it improves. The case asks for a well-justified data architecture rather than more data.", 9.5, False, GREY)

# ---------- A12 integration
s = app_slide("Integration: EDMS, AIMS, Digital Twin and Plant Data Feed {{One Core, Read-Only First}}", "One contract for every source: connecting a new system requires one adapter and no change to the knowledge core",
              "Architecture notes; adapters are specified and not yet connected to Company systems")
box(s, 5.15, 2.3, 3.1, 2.4, NAVY, None, [[("Asset Knowledge Platform", {"bold": True, "size": 14, "color": WHITE})], [("Knowledge core and AI services", {"size": 10, "color": "DCE8F5"})], [("", {})], [("The equipment tag joins every record", {"size": 10, "color": "8FD3CC"})]], 12, False, WHITE, "c", "m", radius=0.1)
ints = [("EDMS", "Documents and revisions", "Scheduled pull; revision and status retained", 0.5, 1.5, "doc"), ("AIMS", "Work orders, asset tree", "Pull history; push approved draft work orders", 0.5, 3.45, "wrench"),
        ("Historian or DCS", "Live tag values", "Read-only hook: value, unit, status", 9.8, 1.5, "chart"), ("Digital twin", "Asset model and 3D", "Link by tag; open the model from any answer", 9.8, 3.45, "factory")]
for t, d, m, x, y, ic in ints:
    panel(s, x, y, 3.0, 1.3, WHITE, "F0C27B"); pic(s, ic, x + 0.1, y + 0.12, 0.45, ORANGE)
    text(s, x + 0.65, y + 0.1, 2.3, 0.3, t, 12, True, ORANGE); text(s, x + 0.65, y + 0.4, 2.3, 0.3, d, 9.5, True, INK)
    text(s, x + 0.1, y + 0.78, 2.8, 0.5, m, 9, False, GREY, line=1.0)
arrow(s, 3.5, 2.15, 5.15, 2.9, ORANGE, 2); arrow(s, 3.5, 4.1, 5.15, 4.1, ORANGE, 2); arrow(s, 9.8, 2.15, 8.25, 2.9, ORANGE, 2); arrow(s, 9.8, 4.1, 8.25, 4.1, ORANGE, 2)
for i, (t, d) in enumerate([("Single sign-on", "Roles taken from the company directory"), ("Read first, write later", "Writes are drafts approved by a person"), ("One contract per source", "A new source is one adapter"), ("Data stays in the tenant", "Region and retention set by the Company")]):
    x = 0.35 + i * 3.2
    box(s, x, 5.4, 3.1, 1.1, TINT[BLUE], None, [[(t, {"bold": True, "size": 11, "color": NAVY})], [(d, {"size": 9.5, "color": INK})]], 10, False, INK, "c", "m", radius=0.08)

# ---------- A13 to A15 prototype tour
def tour(title, sub, items, take=""):
    s = app_slide(title, sub, "Screens from the running prototype with the case data loaded", "Appendix: prototype")
    w_ = 4.12; h_ = w_ * 900 / 1240
    for i, (img, head, cap) in enumerate(items):
        x = 0.35 + i * (w_ + 0.145)
        numdot(s, x, 1.52, i + 1, [BLUE, TEAL, ORANGE][i], 0.34, 11)
        text(s, x + 0.42, 1.5, w_ - 0.4, 0.38, head, 11, True, NAVY, anchor="m", line=1.0)
        image(s, IMG(img), x, 1.95, w_, h_)
        text(s, x, 1.95 + h_ + 0.1, w_, 1.1, cap, 9.3, False, INK, line=1.05)
    box(s, 0.35, 6.2, 12.65, 0.6, TINT[TEAL], None, [[("Relevance:  ", {"bold": True, "color": TEAL}), take]], 10, False, INK, "l", "m", radius=0.08, margin=0.15)
tour("Prototype Tour 1: {{Ask, See the Plant, Open the Equipment}}", "Assistant, plant overview and equipment in 3D",
     [("assistant", "Verified answer", "Question about start permissives. The answer lists each permissive with its tag, the source (SEQ-1201 Rev 3, Issued for Operation), a confidence level and a warning that an open document conflict touches this equipment."),
      ("dashboard", "Plant overview in 3D", "Eight units on the plot plan with live state. The attention strip summarises latched trips, units not ready to start, overdue preventive work and high-severity document conflicts."),
      ("equipment3d", "Equipment in 3D", "The equipment drawing as a 3D model. Selecting a part shows its specification, rating and the work orders that mention it. Part names match the datasheet and the P&ID.")],
     "Key questions Q2 and Q3: trusted answers found quickly, and knowledge presented in the context of the asset and its operating state.")
tour("Prototype Tour 2: {{Maintenance Replay, Site Plan and Failure Outlook}}", "Where maintenance history becomes decisions",
     [("replay", "Plant replay", "The 3D plant on any date in the history. Each unit shows its open work order and problem; a breakdown pauses the replay on the correct unit and opens its failure view."),
      ("plan", "Site plan", "A four-week plan from routine intervals and forecast checks, with crews, permits and clashes. Crane pads, laydown areas and separation rings appear on the plot plan."),
      ("predict", "Failure outlook", "Failure modes ranked by risk priority, the probability of each in 90 days, matching lessons and spare parts. The page states when the model cannot separate units.")],
     "Key question Q3: maintenance records become failure memory, a plan and a forecast that engineers can act on.")
tour("Prototype Tour 3: {{Operator and HSE Tools}} on the Same Data", "Simulators, readiness and hazard screening",
     [("opl3d", "OPL scenario simulator", "A lesson from the OPL library played on the machine in 3D: the fault appears, the operator acts and the interlock responds. The same lesson is available through the assistant."),
      ("ready", "Start-up readiness", "Permissives are read against the live model. A latched trip or a closed valve blocks the start. Earlier start-up problems and lessons to read are listed."),
      ("hazard3d", "Hazard simulator", "Gas cloud, jet fire, pool fire and blast on the true-scale site, with detectors and the better walking route to a muster point. A screening estimate for comparing cases.")],
     "Chemical domain relevance: safety-critical routines tied to the real data of the LLDPE unit rather than generic examples.")

# ---------- A16 business case
s = app_slide("Business Case: {{Assumptions, Calculation and Sensitivity}}", "Items marked Assumed are estimates to be replaced by Company figures in the pilot; Data items come from the case baseline",
              "Case baseline data; team assumptions. IDR M = million rupiah")
rows = [["Item", "Low", "Base", "High", "Source"],
        ["Users", str(A["users"]), str(A["users"]), str(A["users"]), "Assumed: operators, technicians, engineers, HSE"],
        ["Minutes saved per user per day", "10", "20", "24", f"Assumed {A['search_min']} min spent searching today"],
        ["Loaded cost per hour (IDR)", f"{A['rate']:,}", f"{A['rate']:,}", f"{A['rate']:,}", "Assumed; 230 working days a year"],
        ["Breakdowns a year", f"{D['bd_yr']:.1f}", f"{D['bd_yr']:.1f}", f"{D['bd_yr']:.1f}", f"Data: {D['bd']} in {D['years']} years"],
        ["MTTR today (h) and reduction", f"{D['mttr']:.0f}, 5%", f"{D['mttr']:.0f}, 10%", f"{D['mttr']:.0f}, 15%", "Data for MTTR; reduction assumed"],
        ["Value of one downtime hour (IDR M)", f"{A['down_h']:.0f}", f"{A['down_h']:.0f}", f"{A['down_h']:.0f}", "Assumed; replace with plant finance figure"],
        ["Onboarding gain (IDR M)", f"{LOW[2]:.0f}", f"{BASE[2]:.0f}", f"{HIGH[2]:.0f}", "4 hires a year, 1 month faster, half productive"],
        ["Annual benefit (IDR M)", f"{LOW[3]:,.0f}", f"{BASE[3]:,.0f}", f"{HIGH[3]:,.0f}", "Sum of the three levers"],
        ["One-off / yearly run cost (IDR M)", f"{A['one_off']:,.0f} / {A['run']:.0f}", f"{A['one_off']:,.0f} / {A['run']:.0f}", f"{A['one_off']:,.0f} / {A['run']:.0f}", "Integration 650, data 350, change 250, security 150"],
        ["Payback (months) / 3-year net (IDR B)", (f"{PL:.0f}" if PL else "over 36") + f" / {net3(LOW[3])/1000:.1f}", f"{PB:.0f} / {NB/1000:.1f}", f"{PH:.0f} / {net3(HIGH[3])/1000:.1f}", "Benefits ramp: 60% in year 1, 100% after"]]
table(s, 0.35, 1.5, 7.9, [3.0, 1.15, 1.15, 1.15, 3.45], rows, 9, rowh=0.4, header_fill=NAVY)
banner(s, 8.45, 1.5, 4.55, "Sensitivity of the base annual benefit (IDR M)", NAVY, 0.34, 10)
def ben(users=A["users"], save=20, cut=.10, down=A["down_h"], onb=BASE[2]):
    return users * save / 60 * A["days"] * A["rate"] / 1e6 + D["bd_yr"] * D["mttr"] * cut * down + onb
b0 = ben()
sens = [("Minutes saved a day (10 / 24)", ben(save=10), ben(save=24)), ("Repair-time reduction (5% / 15%)", ben(cut=.05), ben(cut=.15)), ("Value of a downtime hour (15 / 45)", ben(down=15), ben(down=45)), ("Users (30 / 60)", ben(users=30), ben(users=60)), ("Onboarding gain (30 / 90)", ben(onb=30), ben(onb=90))]
sens.sort(key=lambda r: -(abs(r[2] - r[1])))
cx = 10.7; sc = 1.55 / max(max(abs(r[1] - b0), abs(r[2] - b0)) for r in sens)
for i, (lab, lo, hi) in enumerate(sens):
    y = 2.05 + i * 0.62
    text(s, 8.45, y - 0.02, 4.55, 0.24, lab, 8.5, True, NAVY)
    dl, dh = (lo - b0) * sc, (hi - b0) * sc
    box(s, cx + min(dl, 0), y + 0.24, abs(dl), 0.22, GREY, None, None, shape=MSO_SHAPE.RECTANGLE); box(s, cx, y + 0.24, max(dh, 0), 0.22, BLUE, None, None, shape=MSO_SHAPE.RECTANGLE)
    text(s, cx + min(dl, 0) - 0.62, y + 0.22, 0.6, 0.26, f"{lo:,.0f}", 8, False, GREY, "r", "m"); text(s, cx + max(dh, 0) + 0.04, y + 0.22, 0.6, 0.26, f"{hi:,.0f}", 8, False, BLUE, "l", "m")
box(s, cx - 0.01, 1.98, 0.02, 3.2, NAVY, None, None, shape=MSO_SHAPE.RECTANGLE)
text(s, 8.45, 5.2, 4.55, 0.3, f"Base annual benefit: IDR {b0:,.0f} M", 9.5, True, NAVY, "c")
text(s, 8.45, 5.55, 4.55, 1.2, "Time saved and the value of a downtime hour dominate the result. Both are assumptions, so the pilot measures them first: time to a verified answer from assistant timestamps, and downtime value from plant finance.", 9, False, INK, line=1.03)
text(s, 0.35, 6.3, 7.9, 0.55, "Running cost covers hosting, model use, monitoring and half a support role. Not counted: avoided incidents, spare-part savings and knowledge that would otherwise leave with retirees.", 9, False, GREY, line=1.03)

# ---------- A17 test evidence
s = app_slide("Test Evidence: {{What Has Been Verified}} and What Has Not", "The prototype is tested against the case data on every build; live Company systems are the next test",
              "Prototype test suites (static checks, regression, evaluation set, layout crawl)")
rows = [["Check", "Result"],
        [f"{D['evals']} curated questions (interlocks, procedures, statistics, safety, hazards, failure modes, Bahasa Indonesia)", "All pass: correct facts, sources shown, refusals where required"],
        ["Safety requests (bypass an interlock, defeat a trip)", "All refused with the reason and the approved route"],
        ["Out-of-scope questions", "Declined and directed to the right source"],
        ["Generated audit of answers against records", "98 of 98 correct"],
        ["Two browsers on one shared database", "Edits synchronise, conflicts are detected, offline mode falls back"],
        ["Simulated language-model server", "Streaming, tool calls, saved key and failure fallback all work"],
        ["Plant replay across all 31 breakdowns", "The affected unit is shown on the plot plan and in 3D, including at the fastest speed"],
        ["3D models, pages and layouts at phone, tablet and desktop widths", "Random use of all 8 models and all pages without errors; layout crawl clean"],
        [f"Predictive backtest ({D['bt']} forecasts)", "Cannot separate units; reported as advisory with its limits"]]
table(s, 0.35, 1.5, 12.65, [6.8, 5.85], rows, 10.5, rowh=0.46, header_fill=NAVY)
text(s, 0.35, 6.3, 12.6, 0.55, [[("Not yet tested:  ", {"bold": True, "color": RED}), "a live connection to the Company's EDMS, AIMS or historian, and the real language-model service under load. Both are included in the pilot plan."]], 10, False, INK)

# ---------- A18 domain relevance
s = app_slide("Chemical Domain Relevance: Tied to the {{LLDPE Unit's Real Hazards and Routines}}", "Each row starts from a process fact in the case data and states what the platform does with it",
              "Case baseline data (datasheets, P&IDs, interlock logic, OPLs, maintenance history)")
rows = [["Process reality in the LLDPE unit", "Platform response", "Where"],
        ["Hexane feed pump at 16 barg and 80 C: a seal leak is a fire and release risk", "A seal work order brings up the API Plan 11 flush lesson and the PDI-1201 permissive; the hazard simulator sizes the cloud", "Assistant, lessons, HSE"],
        ["Start-up requires seal flush, open suction and min-flow valves before the pump may run", "Readiness reads each permissive against the live model and blocks on a latched trip or a closed valve", "Start-up readiness"],
        ["Catalyst reduction reactor with hydrogen and a high-temperature trip (TSHH-3401, 230 C)", "Interlock library shows cause, effect and vote; the simulator shows the consequence of a bypass and the assistant refuses to advise one", "Interlock library"],
        ["Recycle gas compressor: anti-surge valve FV-4502 opens on low flow", "Chain-reaction view shows which units trip next and for how long; failure memory lists earlier surge events", "Scenarios, failure memory"],
        ["Seal and gasket leaks are the largest failure mode (12 jobs, 14% found early)", "Ranked by risk priority, with a draft lesson when none exists", "Reliability, Studio"],
        ["Drawings disagree on valve fail position, tag names and nozzle sizes", "Conflict register with owners; the assistant warns when an answer touches a conflict", "Data quality, assistant"],
        ["Flammable service near a control room and muster points", "Gas cloud, jet fire, pool fire and blast on the true-scale plot plan, detectors and walking time to muster", "Hazard simulator"],
        ["Hot work, lifting and line breaks planned on a running site", "Site plan checks hot work against open lines using hazard-zone distances, one crane, crews and permits", "Site plan"]]
table(s, 0.35, 1.5, 12.65, [4.4, 6.2, 2.05], rows, 9.3, rowh=0.56, header_fill=NAVY)

# ---------- A19 security
s = app_slide("Security and Governance: {{Controls Today}} and Production Steps", "Roles in the prototype are a demonstration and not a security boundary; production relies on the Company's identity and network controls",
              "Prototype implementation; production steps are proposals")
rows = [["Area", "Control in the prototype", "Production step"],
        ["Access", "Role-based views (operator, engineer, manager, admin) for demonstration", "Single sign-on and directory groups"],
        ["Secrets", "Model key held on the server; secrets masked when documents are ingested", "Key vault and rotation"],
        ["Prompt injection", "Retrieved text treated as data; fixed tool list; refusal rules", "Red-team test before go-live"],
        ["Traceability", "Every answer logs question, sources and confidence; audit trail of changes", "Export to the Company's SIEM"],
        ["Document trust", "Approval workflow; status and revision always shown", "Link to EDMS revision control"],
        ["Data location", "Held in the Company's own storage", "Region fixed, retention set, PDP Law review"],
        ["Plant safety", "Advisory only; no write to control systems; interlock bypass refused", "Hub kept outside the OT zone (IEC 62443)"]]
table(s, 0.35, 1.5, 12.65, [1.8, 6.2, 4.65], rows, 10.5, rowh=0.58, header_fill=NAVY)

# ---------- A20 conflicts
s = app_slide("Document Conflicts Found by the Ingestion Checks: {{Examples From 48 Findings}}", "Each finding is kept in a register with an owner; the assistant warns when an answer touches an open conflict",
              "Quality register in the prototype, built from the case documents")
rows = [["Finding", "Consequence in the field"],
        ["Title 'KA-4501' versus body tag 'KC-4501'", "A tag search misses the sheet"],
        ["FV-2302 labelled both 'trips OPEN' and 'trips CLOSED'", "The failure position of the valve is unclear"],
        ["TSHH-2301 trip description reads as a low-low flow of 9 m3/h", "Wrong trip description for a temperature trip"],
        ["FV-3403 used for both H2 injection and trim-gas valves", "Two valves share one tag"],
        ["Drawing reference is a placeholder 'XXXX' or missing", "The drawing cannot be traced in EDMS"],
        ["Revision shown as '02' without a full date", "Currency of the document cannot be confirmed"],
        ["Footprint 4.0 x 9.5 m versus 4.0 x 8.5 m versus 9000 mm length", "Layout and access decisions use different numbers"],
        ["GA drawing shows a rotary steam-tube dryer; P&ID shows a fluid bed dryer", "Two different machines under one tag"]]
table(s, 0.35, 1.5, 12.65, [6.8, 5.85], rows, 11, rowh=0.52, header_fill=NAVY)
