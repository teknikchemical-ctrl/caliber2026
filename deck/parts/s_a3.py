# ======================================================= APPENDIX A20 to A26: sources, integration, business case, evidence, domain, security, conflicts

# ---------- A20 data sources and where each is used
s = app_slide("Data Sources: {{Purpose, Owner and Business Justification}} for Each, and Which Features Read It", "Baseline data from the case plus proposed additions; a small set of well-governed sources is preferred to many weakly connected ones",
              "Case book data table; prototype counts and module dependencies")
rows = [("SOPs and OPLs (56)", "Steps, safety notes, tacit lessons", "Fewer wrong steps; keeps SME experience", "Loaded", "1 0 1 1 0 1 1 0 0"),
        ("Datasheets (8)", "Limits, materials, ratings", "One place for trusted specifications", "Loaded", "1 0 0 0 1 0 0 1 0"),
        ("P&ID, GA, plot plans (24)", "Equipment, tags, layout", "Every tag tied to drawing and place", "Loaded", "1 0 0 1 1 1 1 1 1"),
        ("Interlock logic (8, 84 instr.)", "Causes, effects, permissives", "States what trips and why", "Loaded", "1 0 1 1 1 1 0 0 0"),
        ("Maintenance history (211)", "Failures, causes, cost, downtime", "Failure memory, KPIs, forecast, plan", "Loaded", "1 1 1 0 0 1 0 1 0"),
        ("Incident and RCA reports", "Lessons learned", "Prevents repeat events", "Add in pilot", "1 1 1 0 1 1 0 0 0"),
        ("EDMS", "Controlled revisions", "Single source for revisions", "Adapter specified", "1 0 0 0 0 0 0 0 0"),
        ("AIMS", "Work orders, asset tree", "Live history, drafts back", "Adapter specified", "0 1 1 0 0 0 0 1 0"),
        ("Historian or DCS", "Live tag values", "Context for troubleshooting", "Hook in place", "0 0 1 1 0 1 0 0 1"),
        ("Digital twin", "Asset model, 3D", "Navigate by equipment and place", "Planned", "1 0 0 0 0 0 0 0 1")]
cols = ["Source", "Content", "Business justification", "Status"]
cw_ = [2.1, 1.9, 2.15, 0.95]; x0 = 0.35
hx = x0
for t, w_ in zip(cols, cw_):
    box(s, hx, 1.5, w_ - 0.03, 0.55, NAVY, None, [t], 8.3, True, WHITE, "l", "m", radius=0.03, margin=0.06); hx += w_
feats = ["Assistant", "Failure memory", "Predictive", "P&ID, interlock", "OPL simulator", "Readiness", "Hazard", "Site plan", "3D plant"]
for j, f in enumerate(feats):
    bx = 7.6 + j * 0.6
    b_ = box(s, bx, 1.5, 0.57, 0.55, TEAL, None, None, radius=0.03)
    text(s, bx, 1.5, 0.57, 0.55, f, 6, True, WHITE, "c", "m", line=0.9)
for i, (a1, a2, a3, a4, m) in enumerate(rows):
    y = 2.08 + i * 0.46
    fill = WHITE if i % 2 else LIGHT
    box(s, x0, y, sum(cw_) - 0.03, 0.43, fill, MID, None, radius=0.02)
    hx = x0
    for v, w_ in zip((a1, a2, a3, a4), cw_):
        c_ = GREEN if v == "Loaded" else ORANGE if v in ("Add in pilot", "Adapter specified", "Hook in place", "Planned") else INK
        text(s, hx + 0.04, y, w_ - 0.1, 0.43, v, 7.6, v in (a1,), c_ if v == a4 else INK if v != a1 else NAVY, anchor="m", line=0.95); hx += w_
    box(s, 7.6, y, 5.4 - 0.03, 0.43, fill, MID, None, radius=0.02)
    for j, f_ in enumerate(m.split()):
        if f_ == "1": box(s, 7.6 + j * 0.6 + 0.2, y + 0.12, 0.17, 0.17, TEAL, None, None, shape=MSO_SHAPE.OVAL)
text(s, 0.35, 6.75, 12.65, 0.2, "Every additional source needs an owner, a refresh rule and a stated decision it improves, because the case asks for a well-justified architecture rather than more data.", 7.4, False, GREY)

# ---------- A21 integration connectors
s = app_slide("Integration: Four Connector Contracts Feed {{One Core, Read-Only First}}", "Each connector is a field map, an authentication method and a schedule; the prototype simulates the handshake, a pilot connects the real systems",
              "Prototype Integrations page (int.js): connector definitions with placeholder addresses; no Company system is connected yet")
conns = [("EDMS", "Documents, P&IDs, datasheets, drawings", "OAuth 2.0 client credentials", "every 6 hours", [("doc_number", "Document.id"), ("revision", "Document.rev"), ("lifecycle_state", "Document.status"), ("equipment_tag", "Asset.tag"), ("file_text", "Chunk.text")], BLUE, "doc"),
         ("AIMS", "Asset register, instruments, criticality", "API key in a vault", "daily", [("asset_id", "Asset.tag"), ("functional_location", "Asset.floc"), ("criticality", "Asset.criticality"), ("instrument_tag", "Instrument.tag"), ("range", "Instrument.setpoint")], TEAL, "wrench"),
         ("CMMS", "Work orders, failures, spares", "service account token", "every hour", [("wo_number", "WorkOrder.wo"), ("problem_description", "WorkOrder.prob"), ("root_cause", "WorkOrder.root"), ("downtime_hours", "WorkOrder.dt"), ("total_cost", "WorkOrder.tc")], ORANGE, "list"),
         ("Process historian", "Time series for tags on the P&ID", "Kerberos", "streaming", [("tag", "P&ID tag"), ("value", "live value"), ("quality", "signal quality"), ("timestamp", "time")], PURPLE, "chart")]
for i, (nm, kind, auth, ev, mp, c_, ic) in enumerate(conns):
    x = 0.35 + i * 3.2
    gbanner(s, x, 1.5, 3.1, nm, c_, {BLUE: "4FA9CE", TEAL: "4DBBA9", ORANGE: "F0A15B", PURPLE: "9B84DD"}[c_], 0.32, 10.5, "l")
    panel(s, x, 1.82, 3.1, 2.42, WHITE, c_)
    text(s, x + 0.08, 1.85, 2.95, 0.22, kind, 7.4, True, NAVY); text(s, x + 0.08, 2.06, 2.95, 0.2, [[("Auth: ", {"bold": True, "color": c_}), auth, ("   Refresh: ", {"bold": True, "color": c_}), ev]], 6.9, False, INK)
    text(s, x + 0.08, 2.3, 1.45, 0.18, "SOURCE FIELD", 6.3, True, GREY); text(s, x + 1.6, 2.3, 1.45, 0.18, "HUB FIELD", 6.3, True, GREY)
    for j, (a_, b_) in enumerate(mp):
        y = 2.5 + j * 0.34
        box(s, x + 0.08, y, 1.4, 0.28, TINT[c_], None, [a_], 7, False, INK, "l", "m", radius=0.04, margin=0.05); arrow(s, x + 1.48, y + 0.14, x + 1.62, y + 0.14, c_, 1.0)
        box(s, x + 1.62, y, 1.4, 0.28, WHITE, c_, [b_], 7, True, NAVY, "l", "m", radius=0.04, margin=0.05, lw=0.8)
    arrow(s, x + 1.55, 4.24, x + 1.55, 4.7, c_, 1.8)
box(s, 0.35, 4.7, 12.65, 0.55, NAVY, None, [[("Knowledge database  ", {"bold": True, "size": 11, "color": WHITE}), ("Asset, Document, Chunk, WorkOrder, Failure, Interlock, Instrument, OPL, Lesson, Source: all joined on the equipment tag", {"size": 8.5, "color": "B9CBE0"})]], 10, False, WHITE, "c", "m", radius=0.08)
for i, (t, d, ic, c_) in enumerate([("Single sign-on", "roles from the company directory", "users", BLUE), ("Read first, write later", "writes are drafts that a person approves", "check", TEAL), ("One contract per source", "a new system is one more map", "link", ORANGE), ("Data stays in the tenant", "region and retention set by the Company", "lock", PURPLE), ("Test and sync log", "every handshake and sync recorded in the audit trail", "list", GREEN)]):
    x = 0.35 + i * 2.55
    panel(s, x, 5.4, 2.48, 0.95, WHITE, MID); pic(s, ic, x + 0.08, 5.5, 0.38, c_)
    text(s, x + 0.55, 5.42, 1.9, 0.25, t, 8, True, NAVY); text(s, x + 0.55, 5.68, 1.9, 0.65, d, 7, False, INK, line=1.0)
text(s, 0.35, 6.45, 12.65, 0.4, "Prototype behaviour: Test connection validates the address and returns a sample record; Sync rebuilds the index and reports the record count. A pilot replaces these with live paging against the Company's endpoints.", 7.6, False, GREY, line=1.02)

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


# ---------- A23 test evidence
s = app_slide("Test Evidence: {{Five Layers of Checks}} Run on Every Build, and What Has Not Been Tested", "The prototype is verified against the case data automatically; live Company systems are the next test",
              "Prototype test suites (tests/static.js, regress.js, live.js, layout.js, stress3d.js) and the 128-question evaluation set")
layers = [("Static checks", "duplicate functions, ids, wording, build order, dead links", None, BLUE), ("Regression checks", "101 checks of data, tools, models, pages, simulators, planner, replay", 101, TEAL), ("Live server checks", "86 checks: two-user sync, conflicts, AI proxy against a simulated model, limits", 86, GREEN), ("Evaluation set", "128 curated questions: facts, sources, numbers, refusals, Bahasa Indonesia", 128, ORANGE), ("Layout and 3D stress", "every page at 390, 820 and 1440 px; random use of all 8 models", None, PURPLE)]
for i, (t, d, n_, c_) in enumerate(layers):
    y = 1.5 + i * 0.78; w_ = 4.9 - i * 0.35
    box(s, 0.35 + i * 0.175, y, w_, 0.7, c_, None, [[(t, {"bold": True, "size": 9.5, "color": WHITE})], [(d, {"size": 7, "color": "F0F4F8"})]], 9, False, WHITE, "c", "m", radius=0.07, margin=0.08)
text(s, 0.35, 5.45, 4.9, 0.5, "Static checks gate the build; the regression, live and evaluation suites fail the build on a low score.", 7.6, False, GREY, "c", line=1.0)
rows = [["Check", "Result"],
        ["Curated questions (interlocks, procedures, statistics, safety, hazards, failure modes)", "All 128 pass: correct facts, sources shown, refusals where required"],
        ["Safety requests (bypass an interlock, defeat a trip)", "All refused with the reason and the approved route"],
        ["Generated audit of answers against records", "98 of 98 correct"],
        ["Two browsers on one shared database", "Edits sync, conflicts detected, offline mode falls back"],
        ["Simulated language-model server", "Streaming, tool calls, saved key and failure fallback work"],
        ["Plant replay across all 31 breakdowns", "Affected unit shown in plot plan and 3D, at the fastest speed too"],
        ["Hazard model sanity", "Bigger hole gives a larger release; calm air a longer cloud; failed shutdown a longer release"],
        ["Predictive backtest (64 forecasts)", "Cannot separate units; reported as advisory with limits"]]
table(s, 5.5, 1.5, 7.5, [3.6, 3.9], rows, 8, rowh=0.42, header_fill=NAVY)
panel(s, 5.5, 5.4, 7.5, 1.35, TINT[RED], "F0C4C4")
text(s, 5.6, 5.43, 7.3, 0.25, "Not yet tested", 9, True, RED)
bullet(s, 5.6, 5.7, 7.3, 1.05, ["A live connection to the Company's EDMS, AIMS or historian", "The real Gemini service under load: free-tier quota behaviour is handled by limits and fallback, and measured in the pilot", "Usability with operators on shift; the success gates of the pilot measure it"], 7.8, RED, 3)

# ---------- A24 domain relevance
s = app_slide("Chemical Domain Relevance: Every Feature Starts From a {{Real Hazard or Routine of the LLDPE Unit}}", "Left: a process fact from the case data. Right: what the platform does with it, and the module that does it",
              "Case baseline data (datasheets, P&IDs, interlock logic, OPLs, maintenance history)")
rowsd = [("Hexane feed pump, 16 barg, 80 C: a seal leak is a fire and release risk", "A seal work order brings up the API Plan 11 flush lesson and the PDI-1201 permissive; the hazard simulator sizes the cloud", "Assistant, lessons, hazard", "flame", RED),
         ("Start-up needs seal flush, open suction and min-flow valves before the pump may run", "Readiness reads every permissive against the live model; a latched trip or a closed valve blocks the start", "Start-up readiness", "shield", ORANGE),
         ("Catalyst reduction reactor with hydrogen and a high-temperature trip (TSHH-3401, 230 C)", "Interlock library shows cause, effect and vote; the simulator shows a bypass consequence and the assistant refuses to advise one", "Interlock, OPL simulator", "gear", PURPLE),
         ("Recycle gas compressor: anti-surge valve FV-4502 opens on low flow", "Chain reaction shows which units trip next and for how long; failure memory lists earlier surge events", "Scenarios, failure memory", "net", BLUE),
         ("Seal and gasket leaks are the largest failure mode (12 jobs, 14% found early)", "Ranked by risk priority; a draft lesson is created when none exists", "Reliability, Studio", "chart", TEAL),
         ("Drawings disagree on valve fail position, tag names and nozzle sizes", "Conflict register with owners; the assistant warns when an answer touches a conflict", "Data quality, assistant", "warn", ORANGE),
         ("Flammable service near a control room and muster points", "Gas cloud, jet and pool fire and blast on the true-scale plot plan, detectors, walk to muster", "Hazard simulator", "flame", RED),
         ("Hot work, lifting and line breaks planned on a running site", "Site plan checks hot work against open lines by hazard-zone distance, one crane, crews and permits", "Site plan", "calendar", GREEN)]
for i, (fact, resp, mod, ic, c_) in enumerate(rowsd):
    y = 1.5 + i * 0.66
    box(s, 0.35, y, 5.2, 0.6, LIGHT, MID, [fact], 8, False, INK, "l", "m", radius=0.06, margin=0.1)
    pic(s, ic, 5.7, y + 0.1, 0.4, c_); arrow(s, 5.55, y + 0.3, 5.7, y + 0.3, c_, 1.6); arrow(s, 6.1, y + 0.3, 6.25, y + 0.3, c_, 1.6)
    box(s, 6.25, y, 5.0, 0.6, WHITE, c_, [resp], 7.8, False, INK, "l", "m", radius=0.06, margin=0.1, lw=1.2)
    box(s, 11.35, y, 1.65, 0.6, c_, None, [mod], 7.4, True, WHITE, "c", "m", radius=0.06, margin=0.04)

# ---------- A25 security layers
s = app_slide("Security and Governance: {{Controls at Each Layer}}, and What Production Adds", "Roles in the prototype are a demonstration, not a security boundary; production relies on the Company's identity and network controls",
              "Prototype implementation; production steps are proposals")
layers = [("Person", "Operator to Manager", "Roles filter what is shown and what can be approved; sign-in is a demo", "Single sign-on, directory groups", BLUE, "users"),
          ("Browser", "single-file app", "Local store only; no key in the page; offline mode never sends data", "Managed device policy", TEAL, "gear"),
          ("Proxy", "/api functions", "Key held on the server; per-visitor and daily limits; size caps; secrets masked before the model", "Key vault, rotation, WAF", GREEN, "lock"),
          ("Model", "Gemini 2.5 Flash", "Sources treated as data; fixed tool list; refusal rules; temperature 0.2", "Company-approved model, no training on Company data", PURPLE, "ai"),
          ("Store", "Blobs, then PostgreSQL", "Status vocabulary, approval workflow, audit trail, access list per chunk", "Region fixed, retention set, SIEM export", ORANGE, "db"),
          ("Plant", "OT zone", "Advisory only; no write to control systems; interlock bypass refused", "Hub outside the OT zone (IEC 62443)", RED, "shield")]
text(s, 2.45, 1.45, 4.9, 0.2, "CONTROL IN THE PROTOTYPE", 7.5, True, GREY); text(s, 8.6, 1.45, 4.3, 0.2, "PRODUCTION STEP", 7.5, True, GREY)
for i, (t, sub, now, prod, c_, ic) in enumerate(layers):
    y = 1.7 + i * 0.84
    box(s, 0.35, y, 2.0, 0.76, c_, None, [[(t, {"bold": True, "size": 10, "color": WHITE})], [(sub, {"size": 7.4, "color": "F0F4F8"})]], 9, True, WHITE, "l", "m", radius=0.08, margin=0.45)
    pic(s, ic, 0.42, y + 0.18, 0.4, c_ if False else WHITE, False) if False else None
    box(s, 2.45, y, 6.0, 0.76, WHITE, c_, [now], 8.2, False, INK, "l", "m", radius=0.06, margin=0.12, lw=1.2)
    arrow(s, 8.45, y + 0.38, 8.6, y + 0.38, c_, 1.8)
    box(s, 8.6, y, 4.4, 0.76, TINT[c_], c_, [prod], 8.2, True, NAVY, "l", "m", radius=0.06, margin=0.12, lw=1.0)
    if i < 5: arrow(s, 1.35, y + 0.76, 1.35, y + 0.84, GREY, 1.4)
text(s, 0.35, 6.75, 12.65, 0.2, "Request path from the top down: a question passes every layer, and each layer can refuse it.", 7.4, False, GREY)

# ---------- A26 conflicts
s = app_slide("Document Conflicts Found by the Ingestion Checks: {{48 Findings}} by Severity and Source, With Examples", "Each finding is kept in a register with an owner; the assistant warns when an answer touches an open conflict",
              "Quality register in the prototype, built from the case documents")
cdp = CategoryChartData(); cdp.categories = ["High", "Medium", "Low", "Info"]; cdp.add_series("Findings", [13, 13, 9, 13])
gf = s.shapes.add_chart(XL_CHART_TYPE.COLUMN_CLUSTERED, Inches(0.35), Inches(1.8), Inches(3.2), Inches(2.6), cdp); ch = gf.chart
ch.has_legend = False; ch.plots[0].gap_width = 40; ch.value_axis.visible = False; ch.value_axis.has_major_gridlines = False; ch.category_axis.tick_labels.font.size = Pt(8); ch.category_axis.tick_labels.font.name = FONT
for i, c_ in enumerate([RED, ORANGE, AMBER, BLUE]):
    pt = ch.plots[0].series[0].points[i]; pt.format.fill.solid(); pt.format.fill.fore_color.rgb = rgb(c_)
ch.plots[0].has_data_labels = True; ch.plots[0].data_labels.font.size = Pt(9); ch.plots[0].data_labels.font.bold = True; ch.plots[0].data_labels.font.color.rgb = rgb(WHITE); ch.plots[0].data_labels.show_value = True
banner(s, 0.35, 1.5, 3.2, "By severity", NAVY, 0.28, 9.5)
banner(s, 3.7, 1.5, 3.2, "By source family", NAVY, 0.28, 9.5)
fam = [("OPL documents", 11, ORANGE), ("P&ID sheets", 11, BLUE), ("Plot plan", 10, TEAL), ("Nozzle schedule", 8, PURPLE), ("GA drawings", 4, GREEN), ("Other", 4, GREY)]
for i, (n_, v, c_) in enumerate(fam):
    y = 1.9 + i * 0.42
    text(s, 3.7, y, 1.2, 0.36, n_, 8, False, INK, anchor="m"); box(s, 4.9, y + 0.08, 1.5 * v / 11, 0.2, c_, None, None, shape=MSO_SHAPE.RECTANGLE); text(s, 4.95 + 1.5 * v / 11, y, 0.4, 0.36, str(v), 8, True, NAVY, anchor="m")
text(s, 3.7, 4.5, 3.2, 0.9, "Findings are written by rule when a document is ingested, then reviewed by a person who assigns the owner and the fix.", 7.6, False, INK, line=1.03)
rows = [["Finding", "Consequence in the field"],
        ["Title 'KA-4501' versus body tag 'KC-4501'", "A tag search misses the sheet"],
        ["FV-2302 labelled both 'trips OPEN' and 'trips CLOSED'", "Valve failure position unclear"],
        ["TSHH-2301 trip text reads as a low-low flow of 9 m3/h", "Wrong trip description for a temperature trip"],
        ["FV-3403 used for both H2 injection and trim-gas valves", "Two valves share one tag"],
        ["Drawing reference is a placeholder 'XXXX' or missing", "Drawing cannot be traced in EDMS"],
        ["Revision shown as '02' without a full date", "Currency cannot be confirmed"],
        ["Footprint 4.0 x 9.5 m versus 4.0 x 8.5 m versus 9000 mm", "Layout and access use different numbers"],
        ["GA shows a rotary steam-tube dryer; P&ID shows a fluid bed dryer", "Two machines under one tag"]]
table(s, 7.1, 1.5, 5.9, [3.3, 2.6], rows, 8, rowh=0.46, header_fill=NAVY)
box(s, 0.35, 5.5, 6.55, 1.25, TINT[ORANGE], "F0C27B", None, radius=0.06)
text(s, 0.45, 5.53, 6.4, 1.2, [[("How a conflict is handled", {"bold": True, "color": ORANGE})], "1  Detected by rule at ingestion or by comparison with the instrument list.", "2  Listed in the quality register with severity, source and owner.", "3  Shown on any assistant answer that cites the affected document.", "4  Marked resolved or accepted by a reviewer; the mark is shared and audited."], 7.8, False, INK, line=1.03, space=2)
