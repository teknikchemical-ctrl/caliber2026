# ---------- A5-A7 prototype tour
def tour(title, sub, items, take=""):
    s = app_slide(title, sub, "Screens from the running prototype with the case data loaded")
    w_ = 4.12; h_ = w_ * 900 / 1240
    for i, (img, head, cap) in enumerate(items):
        x = 0.35 + i * (w_ + 0.145)
        numdot(s, x, 1.48, i + 1, [BLUE, TEAL, ORANGE][i], 0.34, 11)
        text(s, x + 0.42, 1.46, w_ - 0.4, 0.38, head, 11, True, NAVY, anchor="m", line=1.0)
        from PIL import Image as _I
        _im = _I.open(IMG(img)); _w, _h = _im.size; _ch = int(_w * 900 / 1240)
        if _h > _ch: _im = _im.crop((0, 0, _w, _ch))
        _cp = os.path.join(HERE, "jpg", "tour_" + img + ".jpg"); _im.convert("RGB").save(_cp, quality=84)
        image(s, _cp, x, 1.95, w_, w_ * _im.size[1] / _im.size[0])
        text(s, x, 1.95 + h_ + 0.1, w_, 1.0, cap, 9.5, False, INK, line=1.05)
    box(s, 0.35, 6.12, 12.65, 0.6, TINT[TEAL], None, [[("Why it matters:  ", {"bold": True, "color": TEAL}), take]], 10.5, False, INK, "l", "m", radius=0.08, margin=0.15)
    return s
tour("Ask, see the plant, open the equipment", "Prototype tour 1 of 3: assistant, plant overview and equipment in 3D",
     [("assistant", "Ask and verify", ["Plain-language question about start permissives. The answer lists each permissive with its tag, then the source (SEQ-1201 Rev 3, Issued for Operation), a confidence level and a warning that an open document conflict touches this equipment."]),
      ("dashboard", "Plant in 3D", ["All eight units on the plot plan with live state. Attention strip on top: latched trips, units not ready to start, overdue preventive work, high-severity document conflicts. Select a unit to fly to it and open its set."]),
      ("equipment3d", "Equipment in 3D", ["The equipment drawing as a 3D model. Select a part to see what the drawing says about it, its rating, and the work orders that mention it. Part names match the datasheet and the P&ID."])],
     "Answers key questions Q2 and Q3: trusted answers found fast, and knowledge shown in the context of the asset and its operating state.")
tour("Maintenance: replay, site plan and failure outlook", "Prototype tour 2 of 3: where the maintenance history becomes decisions",
     [("replay", "Plant replay", ["The 3D plant at any date in the history. Each unit shows its open work order and problem; a breakdown pauses the replay on the right unit and opens its failure view. The toggle switches between plot plan and 3D plant."]),
      ("plan", "Site plan", ["A four-week plan built from routine intervals and forecast condition checks. Crews, permits (hot work, lifting, confined space, isolation, line break) and clashes are checked; crane pads, laydown and separation rings show on the plot plan."]),
      ("predict", "Failure outlook", ["Failure modes ranked by risk priority, the chance of each in 90 days, matching lessons and spare parts. The page states when the model cannot separate one unit from another."])],
     "Answers key question Q3: the maintenance history stops being a record and becomes failure memory, a plan and a forecast that engineers can act on.")
tour("Operator and HSE tools on the same data", "Prototype tour 3 of 3: simulators, readiness and hazard view",
     [("opl3d", "OPL scenario simulator", ["A lesson from the OPL library played on the machine in 3D: the fault appears, the operator acts, and the interlock responds. The same lesson can be read in the assistant."]),
      ("ready", "Start-up readiness", ["Permissives read against the live model. A latched trip or a closed valve blocks the start. Earlier start-up problems and the lessons to read are listed. Result: GO, GO WITH CHECKS or NO-GO."]),
      ("hazard3d", "Hazard simulator", ["Gas cloud, jet fire, pool fire and blast on the true-scale site with detectors and the better walk to a muster point. A screening estimate that compares cases; it does not replace a consequence study."])],
     "Chemical domain relevance: safety-critical routines (seal flush, trips, start-up, release) tied to the real data of the LLDPE unit, not to generic examples.")

# ---------- A8 assumptions and sensitivity
s = app_slide("Business case: assumptions, calculation and what moves the answer", "Items marked Assumed are estimates to be replaced by Company figures in the pilot; Data items come from the case baseline",
              "Case baseline data; team assumptions. IDR M = million rupiah")
rows = [["Item", "Low", "Base", "High", "Source"],
        ["Users", str(A["users"]), str(A["users"]), str(A["users"]), "Assumed: operators, technicians, engineers, HSE"],
        ["Minutes saved per user per day", "10", "20", "24", f"Assumed {A['search_min']} min spent searching today"],
        ["Loaded cost per hour (IDR)", f"{A['rate']:,}", f"{A['rate']:,}", f"{A['rate']:,}", "Assumed; 230 working days a year"],
        ["Breakdowns a year", f"{D['bd_yr']:.1f}", f"{D['bd_yr']:.1f}", f"{D['bd_yr']:.1f}", f"Data: {D['bd']} in {D['years']} years"],
        ["MTTR today (h) and cut", f"{D['mttr']:.0f}, 5%", f"{D['mttr']:.0f}, 10%", f"{D['mttr']:.0f}, 15%", "Data for MTTR; cut assumed"],
        ["Value of one downtime hour (IDR M)", f"{A['down_h']:.0f}", f"{A['down_h']:.0f}", f"{A['down_h']:.0f}", "Assumed; replace with plant finance figure"],
        ["Onboarding gain (IDR M)", f"{LOW[2]:.0f}", f"{BASE[2]:.0f}", f"{HIGH[2]:.0f}", "4 hires a year, 1 month faster, half productive"],
        ["Annual benefit (IDR M)", f"{LOW[3]:,.0f}", f"{BASE[3]:,.0f}", f"{HIGH[3]:,.0f}", "Sum of the three levers"],
        ["One-off / yearly run cost (IDR M)", f"{A['one_off']:,.0f} / {A['run']:.0f}", f"{A['one_off']:,.0f} / {A['run']:.0f}", f"{A['one_off']:,.0f} / {A['run']:.0f}", "Integration 650, data 350, change 250, security 150"],
        ["Payback (months) / 3-year net (IDR B)", (f"{PL:.0f}" if PL else "over 36") + f" / {net3(LOW[3])/1000:.1f}", f"{PB:.0f} / {NB/1000:.1f}", f"{PH:.0f} / {net3(HIGH[3])/1000:.1f}", "Benefits ramp: 60% in year 1, 100% after"]]
table(s, 0.35, 1.5, 7.9, [3.0, 1.15, 1.15, 1.15, 3.45], rows, 9, rowh=0.4, header_fill=NAVY)
# tornado
banner(s, 8.45, 1.5, 4.55, "Sensitivity of the base annual benefit (IDR M)", NAVY, 0.34, 10)
def ben(users=A["users"], save=20, cut=.10, down=A["down_h"], onb=BASE[2]):
    return users * save / 60 * A["days"] * A["rate"] / 1e6 + D["bd_yr"] * D["mttr"] * cut * down + onb
b0 = ben()
sens = [("Minutes saved a day (10 / 24)", ben(save=10), ben(save=24)), ("Repair-time cut (5% / 15%)", ben(cut=.05), ben(cut=.15)), ("Value of a downtime hour (15 / 45)", ben(down=15), ben(down=45)), ("Users (30 / 60)", ben(users=30), ben(users=60)), ("Onboarding gain (30 / 90)", ben(onb=30), ben(onb=90))]
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
text(s, 8.45, 5.55, 4.55, 1.2, "Time saved and the value of a downtime hour dominate. Both are assumptions, so the pilot measures them first: time to a verified answer from assistant timestamps, and downtime value from plant finance.", 9, False, INK, line=1.03)
text(s, 0.35, 6.3, 7.9, 0.6, "The yearly run cost covers hosting, model use, monitoring and half a support role. Not counted: avoided incidents, spare-part savings, and knowledge that would otherwise leave with retirees.", 9.5, False, GREY, line=1.03)

# ---------- A9 test evidence
s = app_slide("Test evidence: what has been checked, and what has not", "The prototype is tested against the case data on every build; live Company systems are the next test",
              "Prototype test suites (static checks, regression, evaluation set, layout crawl)")
rows = [["Check", "Result"],
        [f"{D['evals']} curated questions (interlocks, procedures, statistics, safety, hazards, failure modes, Bahasa Indonesia)", "All pass: right facts, sources shown, refusals where required"],
        ["Safety requests (bypass an interlock, defeat a trip)", "All refused with the reason and the safe route"],
        ["Out-of-scope questions", "Declined and pointed to the right source"],
        ["Generated audit of answers against records", "98 of 98 correct"],
        ["Two browsers on one shared database", "Edits sync, conflicts are detected, offline mode falls back"],
        ["Fake language-model server", "Streaming, tool calls, saved key and failure fallback all work"],
        ["Plant replay across all 31 breakdowns", "The broken unit is shown in plot plan and 3D, even at the fastest speed"],
        ["3D models, pages and layouts at phone, tablet and desktop widths", "Random use of all 8 models and all pages without errors; layout crawl clean"],
        [f"Predictive backtest ({D['bt']} forecasts)", "Cannot separate one unit from another; reported as advisory with its limits"]]
table(s, 0.35, 1.5, 12.65, [6.8, 5.85], rows, 10.5, rowh=0.46, header_fill=NAVY)
text(s, 0.35, 6.3, 12.6, 0.55, [[("Not yet tested:  ", {"bold": True, "color": RED}), "a live connection to the Company's EDMS, AIMS or historian, and the real language-model service under load. Both are in the pilot plan."]], 10.5, False, INK)

# ---------- A10 predictive honesty
s = app_slide("Predictive maintenance: what the history can and cannot tell us", "Backtest of 64 rolling forecasts on the case work orders; we report the limit instead of hiding it",
              "Prototype backtest (rolling origin, 90-day horizon); failure modes read from problem, cause and action text of 211 work orders")
banner(s, 0.35, 1.5, 4.1, "What the backtest shows", NAVY, 0.34, 10.5)
for i, (n_, l_, c_) in enumerate([("0.26", "Brier score of the plant-wide rate; skill against a constant guess is -10%", BLUE), ("0.47", "Ranking skill (AUC); 0.50 is a coin toss between units", RED), ("63", "breakdown and corrective jobs behind the failure-mode view", TEAL)]):
    stat(s, 0.35, 1.92 + i * 1.2, 4.1, 1.12, n_, l_, c_, None, 24)
text(s, 0.35, 5.55, 4.1, 1.2, "A unit's own breakdown history does not predict which unit fails next on this data. So the forecast is advisory, the unit order comes from consequence, and the failure-mode view is where the evidence is.", 9.5, False, INK, line=1.04)
banner(s, 4.65, 1.5, 4.3, "Failure modes ranked by risk priority", NAVY, 0.34, 10.5)
fm = [("Seal or gasket leak", 12, 14, 369), ("Valve or actuator", 9, 10, 232), ("Blocked or fouled", 5, 29, 226), ("Vibration or misalignment", 6, 0, 216), ("Bearing or lubrication", 7, 0, 146), ("Instrument or analyser", 14, 33, 129)]
text(s, 4.65, 1.92, 4.3, 0.22, "Mode, corrective jobs (bar), share found early; ranked by risk priority", 8.5, True, GREY)
for i, (m, n_, f_, r_) in enumerate(fm):
    y = 2.2 + i * 0.52
    text(s, 4.65, y, 1.75, 0.45, m, 8.8, True, NAVY, anchor="m", line=1.0)
    box(s, 6.45, y + 0.1, 1.2 * n_ / 14, 0.25, [RED, ORANGE, ORANGE, AMBER, AMBER, TEAL][i], None, None, shape=MSO_SHAPE.RECTANGLE)
    text(s, 6.45 + 1.2 * n_ / 14 + 0.05, y + 0.05, 0.4, 0.35, str(n_), 9, True, INK, anchor="m")
    pill(s, 8.2, y + 0.1, 0.7, f"{f_}% early", TINT[GREEN] if f_ >= 29 else TINT[RED], GREEN if f_ >= 29 else RED, 0.26, 7.5)
text(s, 4.65, 5.4, 4.3, 1.3, "Seal and gasket leaks lead: 12 jobs and few caught early. In a hexane pump this is a fire and release risk, so the assistant links each leak to the flush-plan lesson and the hazard simulator. Where no lesson exists, a draft lesson is created from the work orders for an engineer to approve.", 9, False, INK, line=1.03)
banner(s, 9.15, 1.5, 3.85, "How it is used", NAVY, 0.34, 10.5)
for i, (t, d, ic) in enumerate([("Rank by consequence", "Order units by what a failure would cost and trip", "target"), ("Read the mode, not the unit", "Failure modes carry the evidence", "search"), ("Match the lesson", "Past OPL and RCA open beside each risk", "book"), ("Plan the work", "Checks flow into the four-week site plan", "calendar")]):
    y = 1.95 + i * 1.18
    panel(s, 9.15, y, 3.85, 1.08); pic(s, ic, 9.25, y + 0.25, 0.5, TEAL)
    text(s, 9.9, y + 0.1, 3.05, 0.3, t, 10.5, True, NAVY); text(s, 9.9, y + 0.42, 3.05, 0.62, d, 9.3, False, INK, line=1.02)

# ---------- A11 domain relevance
s = app_slide("Chemical domain relevance: tied to the LLDPE unit's real hazards and routines", "Each row starts from a process fact in the case data and shows what the hub does with it",
              "Case baseline data (datasheets, P&IDs, interlock logic, OPLs, maintenance history)")
rows = [["Process reality in the LLDPE unit", "What the hub does", "Where"],
        ["Hexane feed pump at 16 barg, 80 C: a seal leak is a fire and release risk", "A seal work order brings up the API Plan 11 flush lesson and the PDI-1201 permissive; the hazard simulator sizes the cloud", "Assistant, lessons, HSE"],
        ["Start-up needs seal flush, open suction and min-flow valves before the pump may run", "Readiness reads each permissive against the live model and blocks on a latched trip or a closed valve", "Start-up readiness"],
        ["Catalyst reduction reactor with hydrogen and a high-temperature trip (TSHH-3401, 230 C)", "Interlock library shows cause, effect and vote; the simulator shows the consequence of a bypass and refuses to advise one", "Interlock library"],
        ["Recycle gas compressor: anti-surge valve FV-4502 opens on low flow", "Chain-reaction view shows which units trip next and for how long; failure memory lists earlier surge events", "Scenarios, failure memory"],
        ["Seal and gasket leaks are the biggest failure mode (12 jobs, 14% found early)", "Ranked by risk priority, with a draft lesson when none exists", "Predictive, Studio"],
        ["Drawings disagree (valve fail position, tag names, nozzle sizes)", "Conflict register with owners; the assistant warns when an answer touches a conflict", "Data quality, assistant"],
        ["Flammable service next to a control room and muster points", "Gas cloud, jet fire, pool fire and blast on the true-scale plot plan, detectors, walk to muster", "Hazard simulator"],
        ["Hot work, lifting and line breaks planned on a running site", "Site plan checks hot work against open lines using hazard-zone distances, one crane, crews and permits", "Site plan"]]
table(s, 0.35, 1.5, 12.65, [4.4, 6.2, 2.05], rows, 9.5, rowh=0.56, header_fill=NAVY)

# ---------- A12 security
s = app_slide("Security and governance controls", "What the prototype does today and what production adds", "Prototype implementation; production steps are proposals")
rows = [["Area", "Control in the prototype", "Production step"],
        ["Access", "Role-based views (operator, engineer, manager, admin); demonstration only, not a security boundary", "Single sign-on and directory groups"],
        ["Secrets", "Language-model key kept on the server; secrets masked when documents are ingested", "Key vault, rotation"],
        ["Prompt injection", "Retrieved text treated as data; fixed tool list; refusal rules", "Red-team test before go-live"],
        ["Traceability", "Every answer logs question, sources, confidence; audit trail of changes", "Export to the Company's SIEM"],
        ["Document trust", "Approval workflow; status and revision always shown", "Link to EDMS revision control"],
        ["Data location", "Held in the Company's own storage", "Region fixed, retention set, PDP Law review"],
        ["Plant safety", "Advisory only; no write to control systems; interlock bypass refused", "Keep the hub outside the OT zone (IEC 62443)"]]
table(s, 0.35, 1.5, 12.65, [1.8, 6.2, 4.65], rows, 10.5, rowh=0.58, header_fill=NAVY)

# ---------- A13 conflicts
s = app_slide("Conflicts the ingestion found in the provided drawings (examples of 48)", "Each finding is kept in a register with an owner; the assistant warns when an answer touches an open conflict", "Quality register in the prototype, built from the case documents")
rows = [["Finding", "Why it matters in the field"],
        ["Title 'KA-4501' vs body tag 'KC-4501'", "Searching by tag misses the sheet"],
        ["FV-2302 labelled 'Trips OPEN' and 'trips CLOSED'", "The failure position of a valve is unclear"],
        ["TSHH-2301 trip box text describes flow low-low 9 m3/h", "Wrong trip description for a temperature trip"],
        ["FV-3403 used for both H2 injection and trim-gas valves", "Two valves share one tag"],
        ["Drawing reference is a placeholder 'XXXX' or missing", "Cannot trace the drawing in EDMS"],
        ["Revision shown as '02' with no full date", "Cannot tell whether it is current"],
        ["Footprint 4.0 x 9.5 m vs 4.0 x 8.5 m vs 9000 mm length", "Layout and access decisions use different numbers"],
        ["GA drawing shows a rotary steam-tube dryer; P&ID shows a fluid bed dryer", "Two different machines under one tag"]]
table(s, 0.35, 1.5, 12.65, [6.8, 5.85], rows, 11, rowh=0.52, header_fill=NAVY)
