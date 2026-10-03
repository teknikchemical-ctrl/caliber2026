# ======================================================= APPENDIX A8 to A19: every feature, with the screen it lives on
def conn(s, x, y, w, items, label="Connected to"):
    text(s, x, y, 1.1, 0.24, label, 7.5, True, GREY, anchor="m")
    cx_ = x + 1.0
    for t, c_ in items:
        w_ = 0.2 + 0.062 * len(t)
        if cx_ + w_ > x + w: break
        pill(s, cx_, y + 0.02, w_, t, TINT[c_], c_ if c_ != AMBER else ORANGE, 0.21, 7); cx_ += w_ + 0.06

def flow(s, x, y, w, steps, colors, h=0.62, size=7):
    n = len(steps); g = 0.12; bw = (w - g * (n - 1)) / n
    for i, (t, d) in enumerate(steps):
        c_ = colors[i % len(colors)]; bx = x + i * (bw + g)
        box(s, bx, y, bw, 0.26, c_, None, [f"{i+1}  {t}"], 7.8, True, WHITE, "l", "m", radius=0.05, margin=0.07)
        panel(s, bx, y + 0.28, bw, h, WHITE, MID); text(s, bx + 0.05, y + 0.3, bw - 0.1, h - 0.03, d, size, False, INK, line=1.0)
        if i < n - 1: arrow(s, bx + bw, y + 0.13, bx + bw + g, y + 0.13, GREY, 1.1)

# ---------- A8 OPL library and simulator
s = app_slide("OPL Library and Scenario Simulator: {{56 Lessons You Can Read and Then Play}} on the Machine", "An OPL (one point lesson) is the plant's own short lesson; the simulator turns its troubleshooting cases and steps into a time-stepped exercise",
              "Prototype OPL library and simulator (base.html OPL view and sim engine, sim3d.js); counts from the case OPL documents")
hh = shot(s, "oplsheet", 0.35, 1.5, 3.9, [(1, 0.12, 0.2), (2, 0.1, 0.52), (3, 0.5, 0.75), (4, 0.86, 0.3)], (0, 0, 1, 0.8))
shot(s, "opl3d", 4.4, 1.5, 4.7, [(5, 0.25, 0.28), (6, 0.78, 0.3), (7, 0.2, 0.62), (8, 0.78, 0.62)], (0, 0, 1, 0.8))
legend(s, 0.4, 1.5 + hh + 0.1, 3.85, [(1, "Standard OPL header: equipment, discipline, classification, reviewer, approver"), (2, "Safety precautions, tools and materials"), (3, "Detailed steps, each with a check or acceptance criterion"), (4, "Related scenarios, linked P&ID, interlock, datasheet and source document")], 6.9)
legend(s, 4.45, 1.5 + 4.7 * 0.8 * 0.726 + 0.1, 4.65, [(5, "Brief: what the OPL says and the goal; simulated clock with time compression 1x, 4x, 16x"), (6, "2D P&ID or 3D machine that reacts: shakes, steams, stops"), (7, "Field and panel actions, numbered to the OPL steps; non-standard actions are included on purpose"), (8, "Readouts, trip table, trend, event log and the step checklist")], 6.9)
banner(s, 9.3, 1.5, 3.7, "How the simulator works", NAVY, 0.3, 9.5)
for i, (t, d) in enumerate([("Process model", "each equipment has variables (pressures, flows, temperatures, levels) integrated in small time steps"), ("Alarm and trip logic", "set points and delays from the interlock document; trips actuate the final elements; a bypass is logged and nothing protects"), ("Operator actions", "valve moves, starts, resets, bypass; the effect shows in the variables"), ("Goal and hold time", "success needs the target state held for a set time; damage ends the run")]):
    y = 1.86 + i * 0.64; numdot(s, 9.3, y + 0.1, i + 1, PURPLE, 0.26, 8); text(s, 9.62, y, 3.38, 0.6, [[(t + ": ", {"bold": True, "color": NAVY}), d]], 7.1, False, INK, line=1.0)
panel(s, 9.3, 4.5, 3.7, 1.35, TINT[PURPLE], PURPLE)
text(s, 9.38, 4.52, 3.55, 0.22, "Score and kinds", 8.5, True, PURPLE)
text(s, 9.38, 4.75, 3.55, 1.1, "Score = 100 - 20 per unsafe action - 12 per trip (up to 3) + 2 per OPL step applied (up to 10); a failed run is capped at 35. Kinds: fault diagnosis, procedure, slow trend, bad practice. The key learning point is shown at the end.", 7.1, False, INK, line=1.02)
for i, (n_, l_) in enumerate([("56", "OPL documents"), ("280", "procedure steps"), ("168", "troubleshooting cases")]): stat(s, 0.35 + i * 1.3, 6.0, 1.25, 0.8, n_, l_.replace("troubleshooting cases", "cases"), [BLUE, TEAL, ORANGE][i], None, 15)
conn(s, 4.45, 6.1, 8.55, [("Interlock library", PURPLE), ("Live P&ID", PURPLE), ("Failure memory", ORANGE), ("Assistant", TEAL), ("3D machine", PURPLE)])
text(s, 4.45, 6.4, 8.55, 0.4, "The assistant can read any OPL and quote its steps; the simulator reads the same set points, so the lesson and the exercise cannot disagree.", 7.5, False, GREY, line=1.0)

# ---------- A9 live P&ID
s = app_slide("Live P&ID: {{Valves That Open and Close}}, Flow That Stops and Trips That Follow From the Interlock Logic", "Eight P&IDs redrawn as a consistent, service-coloured visual engine and connected to the interlock model, the readiness check and the 3D plant",
              "Prototype P&ID engine (pid2.js, pidx.js, pidv.js); 8 sheets, 20 operable valves, 232 tagged items")
hh = shot(s, "pid", 0.35, 1.5, 7.4, [(1, 0.28, 0.4), (2, 0.5, 0.65), (3, 0.78, 0.25), (4, 0.15, 0.88)], (0, 0, 1, 0.8))
legend(s, 0.4, 1.5 + hh + 0.1, 7.5, [(1, "Valve badge: OPEN, CLOSED or percent open; press it, double-click the valve or use the side panel"), (2, "A closed valve stops the flow in the pipe after it and in the pipes that continue from there"), (3, "Instrument bubbles show live values and alarm state; trips latch until reset"), (4, "Service colours: process liquid, nitrogen, steam and condensate, cooling water, lube and seal oil, gas and vent")], 7.2)
banner(s, 8.15, 1.5, 4.85, "What the engine does", NAVY, 0.3, 9.5)
feats = [("Flow logic", "Pipes are drawn as segments; closing a valve marks every downstream segment as stagnant and stops the flow animation."), ("Permissives", "Closing a valve that proves a start permissive (for example XV-1201 with ZSO-1201) trips the item that depends on it through the same cause-and-effect rows as the simulator."), ("Automatic trips", "Interlock trips close their shutdown valves by themselves, and the badge follows."), ("Levels", "Vessels show a liquid level that moves with the level instrument."), ("Overview", "All eight sheets joined by their battery-limit lines on one plant picture, with a state per unit.")]
for i, (t, d) in enumerate(feats):
    y = 1.86 + i * 0.7; box(s, 8.15, y, 0.09, 0.62, [BLUE, TEAL, RED, ORANGE, PURPLE][i], None, None, shape=MSO_SHAPE.RECTANGLE)
    text(s, 8.3, y - 0.02, 4.7, 0.2, t, 8.5, True, NAVY); text(s, 8.3, y + 0.17, 4.7, 0.5, d, 7.2, False, INK, line=1.0)
flow(s, 8.15, 5.4, 4.85, [("Valve", "operator closes XV"), ("Logic", "permissive lost"), ("Trip", "final elements act")], [BLUE, ORANGE, RED], 0.5, 6.8)
conn(s, 8.15, 6.45, 4.85, [("Interlock", PURPLE), ("Readiness", RED), ("Scenarios", PURPLE), ("3D plant", PURPLE)])

# ---------- A10 interlock library and equipment pages
s = app_slide("Interlock Library and Equipment Pages: {{Cause and Effect, Proof Tests and Datasheets}} for Every Set", "The safety logic of each unit is read as data, reconciled with the instrument list and the P&ID, and used by every other feature",
              "Prototype interlock library and equipment set pages (il.js, eq2.js); 8 interlock sets, 39 initiators, 37 start permissives, 84 instruments")
shot(s, "il", 0.35, 1.5, 4.1, [(1, 0.3, 0.12), (2, 0.5, 0.45), (3, 0.82, 0.45)], (0, 0, 1, 0.85))
shot(s, "eqover", 4.55, 1.5, 4.1, [(4, 0.2, 0.3), (5, 0.45, 0.82), (6, 0.5, 0.5)], (0, 0, 1, 0.85))
shot(s, "eqds", 8.75, 1.5, 4.25, [(7, 0.3, 0.3), (8, 0.7, 0.6)], (0, 0, 1, 0.85))
legend(s, 0.4, 4.35, 4.1, [(1, "Library views: interlock sheet, function tests, proof test history"), (2, "Cause and effect: initiator, set point, voting (1oo2, 2oo3), SIL, final elements"), (3, "Reconciliation: Matches P&ID, Differs from P&ID, Not on instrument list")], 7)
legend(s, 4.6, 4.35, 4.1, [(4, "Equipment header: tag, criticality, state, 3D model"), (5, "Tabs: overview, P&ID, drawing and 3D, indicators, plot plan, readiness, documents, datasheet, interlock logic, lessons, maintenance"), (6, "What is on file as clickable cards")], 7)
legend(s, 8.8, 4.35, 4.2, [(7, "Datasheet grouped and searchable like a specification sheet"), (8, "Every value is a typed fact and appears in the assistant with its source")], 7)
flow(s, 0.35, 5.5, 8.3, [("Read", "interlock document gives initiators, voting, effects, permissives"), ("Reconcile", "set points compared with the instrument list and the P&ID note"), ("Test history", "function and proof tests found in the work orders by wording"), ("Publish", "typed facts for tools; C&E matrix exported as 39 rows")], [BLUE, TEAL, ORANGE, GREEN], 0.62, 7)
banner(s, 8.85, 5.5, 4.15, "Why it matters", NAVY, 0.28, 9)
text(s, 8.9, 5.8, 4.1, 1.0, "A trip set point stated in three places gets compared automatically. A difference shows as a flag and enters the conflict register, so a technician sees it before the proof test, not after.", 7.4, False, INK, line=1.02)

# ---------- A11 scenarios and chain reaction
s = app_slide("Scenarios and Chain Reaction: {{What Else Trips}} When a Unit or a Utility Is Lost", "Plant-wide cascade over the connected P&IDs, plus a unit scenario player that replays an OPL case or a work order on the P&ID",
              "Prototype scenario engine and views (scn.js, scnui.js); example shown: compressor KC-4501 lube oil low-low")
hh = shot(s, "scn", 0.35, 1.5, 7.2, [(1, 0.12, 0.25), (2, 0.5, 0.15), (3, 0.5, 0.58), (4, 0.12, 0.62)], (0, 0, 1, 0.82))
legend(s, 0.4, 1.5 + hh + 0.1, 7.1, [(1, "Initiating event: an equipment trip or a utility loss (nitrogen, steam, cooling water), with severity"), (2, "Result tiles: units tripped, units affected, combined outage estimate, maintenance cost estimate"), (3, "Connected P&ID overview: units go to alarm and trip as the event spreads, one simulated minute per step"), (4, "Start from a predictive risk: a forecast failure becomes the initiating event")], 7.1)
banner(s, 7.75, 1.5, 5.25, "Cascade algorithm", NAVY, 0.3, 9.5)
flow(s, 7.75, 1.88, 5.25, [("Seed", "failing unit or utility"), ("Connect", "battery-limit lines between sheets"), ("Propagate", "loss of supply raises upset, alarm, then trip by delay"), ("Report", "units, hours, cost")], [BLUE, TEAL, ORANGE, GREEN], 0.78, 7)
banner(s, 7.75, 3.3, 5.25, "Unit scenario player", NAVY, 0.3, 9.5)
bullet(s, 7.8, 3.65, 5.15, 1.5, ["Pick an OPL troubleshooting case or a work order; the phases (initiating event, alarm, trip, relief) are shown on the P&ID of that unit", "Tags involved are highlighted, trips are forced on the live model so the P&ID, readiness and 3D views agree", "Each phase carries the OPL guidance and similar past events from failure memory"], 7.4, ORANGE, 3)
banner(s, 7.75, 5.2, 5.25, "Output used elsewhere", NAVY, 0.28, 9)
text(s, 7.8, 5.5, 5.15, 0.75, "The assistant tool cascade_analysis returns the same figures; predictive maintenance adds the chain-reaction penalty to a unit's consequence score (0.35 per additional unit tripped, maximum 5).", 7.4, False, INK, line=1.02)
conn(s, 7.75, 6.4, 5.25, [("Live P&ID", PURPLE), ("OPL", PURPLE), ("Predictive", ORANGE), ("Assistant", TEAL), ("3D", PURPLE)])

# ---------- A12 predictive maintenance page
s = app_slide("Predictive Maintenance Page: {{Health, Risk Matrix, Timeline and Intervention Plan}} for 8 Units and 42 Components", "Everything on the page is computed in the browser from the 211 work orders and the OPL lessons, with confidence labels where data is thin",
              "Prototype predictive maintenance view (pdm.js, pdm2.js, mh4.js); 50 entities, 90-day default horizon")
hh = shot(s, "predict", 0.35, 1.5, 6.4, [(1, 0.2, 0.1), (2, 0.18, 0.45), (3, 0.5, 0.45), (4, 0.78, 0.45), (5, 0.5, 0.85)], (0, 0, 1, 0.8))
legend(s, 0.4, 1.5 + hh + 0.1, 6.3, [(1, "Model header: mode, horizon, action threshold, chain-reaction toggle, export"), (2, "Risk matrix: probability against consequence, click a cell to filter"), (3, "Unit health index 0 to 100 and 90-day failure probability"), (4, "Timeline of expected failures with p10 to p90 range and the recommended intervention date"), (5, "Unit detail: health trend with forecast, cumulative probability, component risk in 2D and 3D")], 7)
for i, (t, d, c_) in enumerate([("Health index", "100 minus penalties for recent breakdowns, preventive work overdue and a rising trend; 8 points added right after a breakdown", BLUE), ("Failure probability", "constant fleet rate shared by share of past events (default); Weibull per unit as an experimental option with a wear-out slider", TEAL), ("Consequence", "downtime, cost and criticality, plus the chain-reaction penalty from the scenario engine", ORANGE), ("Intervention", "recommended date = earliest predicted failure minus 14 days lead; spare parts to stage; schedule a predictive work order in one click", GREEN)]):
    y = 1.5 + i * 0.95; box(s, 6.95, y, 6.05, 0.88, TINT[c_], c_, None, radius=0.06); text(s, 7.03, y + 0.02, 5.9, 0.22, t, 8.5, True, c_); text(s, 7.03, y + 0.24, 5.9, 0.64, d, 7.4, False, INK, line=1.02)
banner(s, 6.95, 5.35, 6.05, "Validation shown on the page", RED, 0.28, 9)
text(s, 7.0, 5.65, 6.0, 0.7, "A rolling backtest of 64 forecasts compares the default with the Weibull option and a constant guess (Brier score, ranking skill, calibration). The page states in plain words that a unit's own history does not tell which unit fails next, so the order comes from consequence.", 7.2, False, INK, line=1.02)
conn(s, 6.95, 6.45, 6.05, [("Failure memory", ORANGE), ("Scenarios", PURPLE), ("Site plan", RED), ("Assistant", TEAL), ("Reports", GREEN)])

# ---------- A13 reliability algorithms
s = app_slide("Reliability Algorithms: {{Failure-Mode Risk, Bayesian Forecasts}} and a Backtested Combined Score", "FORESIGHT engine: quantitative models built on 211 work orders, validated by rolling-origin backtesting, with their limits stated",
              "Prototype reliability analytics (pdm.js, pdm2.js); 63 breakdown and corrective jobs behind the failure-mode view")
card(s, 0.35, 1.5, 4.15, 2.45, "1  Failure-mode risk priority", ["Mode taxonomy read from problem, cause and action text (10 modes)", "RPN = Severity x Occurrence x Detection", "Severity: percentile of downtime (55%) and cost (45%), scaled 1 to 10", "Occurrence: 1 + 2.4 log2(1 + 3 x rate per year), max 10", "Detection: 1 + 9 x (1 - share found early), minus 1.2 if an OPL covers the mode"], BLUE, 8, 9.5)
card(s, 4.6, 1.5, 4.15, 2.45, "2  Gamma-Poisson mode forecast", ["Prior from the fleet rate: shape 1.5, rate 1.5 / fleet rate", "Posterior after n own events in T days: shape 1.5 + n, rate prior + T", "P(failure in h days) = 1 - exp(-mean rate x h)", "80% credible range from the gamma quantile (Wilson-Hilferty)", "Few events shrink toward the fleet instead of over-reacting"], TEAL, 8, 9.5)
card(s, 8.85, 1.5, 4.15, 2.45, "3  Measures and trend", ["MTBF = (operating hours - downtime) / breakdowns; MTTR = downtime / breakdowns", "Laplace trend test: u above 1.64 means failures accelerating, below -1.64 slowing", "Share of corrective jobs repeating the previous mode", "Preventive-work effectiveness: interval against the usual gap"], ORANGE, 8, 9.5)
banner(s, 0.35, 4.1, 8.4, "4  Combined unit score and its validation", NAVY, 0.3, 10)
bullet(s, 0.4, 4.46, 4.15, 2.4, ["Ridge-regularised logistic regression on eight standardised features: recent breakdowns, time since last breakdown against the usual gap, trend, repeat failures, overdue preventive work, lesson warning signs, recent corrective jobs, low health", "300 gradient-descent iterations with an L2 penalty", "Rolling-origin backtest: train on the past, forecast the next 90 days, advance 20 days", "Calibration slope shrinks the output toward the base rate"], 7.7, BLUE, 3)
for i, (n_, l_, c_) in enumerate([("64", "forecasts tested", BLUE), ("0.26", "Brier score, plant-wide rate", TEAL), ("0.47", "AUC; 0.50 is chance", RED)]): stat(s, 4.6 + i * 1.4, 4.46, 1.34, 1.2, n_, l_, c_, None, 17)
text(s, 4.6, 5.75, 4.15, 1.05, "A unit's own history does not predict which unit fails next on this data. The page ranks units by consequence and reports the combined score as advisory. Improving it needs more history or live condition data, which is a pilot task.", 7.7, False, INK, line=1.03)
banner(s, 8.85, 4.1, 4.15, "Failure modes by risk priority", NAVY, 0.3, 10)
fm = [("Seal or gasket leak", 12, 14, 369), ("Valve or actuator", 9, 10, 232), ("Blocked or fouled", 5, 29, 226), ("Vibration, misalign.", 6, 0, 216), ("Bearing or lubrication", 7, 0, 146), ("Instrument or analyser", 14, 33, 129)]
text(s, 8.85, 4.44, 4.15, 0.2, "Mode, RPN (bar), jobs / share found early", 7.3, True, GREY)
for i, (m, n_, f_, r_) in enumerate(fm):
    y = 4.66 + i * 0.35
    text(s, 8.85, y, 1.5, 0.32, m, 7.5, True, NAVY, anchor="m", line=0.95); box(s, 10.4, y + 0.07, 1.2 * r_ / 369, 0.18, [RED, ORANGE, ORANGE, AMBER, AMBER, TEAL][i], None, None, shape=MSO_SHAPE.RECTANGLE)
    text(s, 10.45 + 1.2 * r_ / 369, y, 0.5, 0.32, str(r_), 7.5, True, INK, anchor="m"); text(s, 12.3, y, 0.7, 0.32, f"{n_} / {f_}%", 7.2, False, GREY, anchor="m")

# ---------- A14 start-up readiness
s = app_slide("Start-Up Readiness: {{One GO, GO WITH CHECKS or NO-GO}} From Interlock, P&ID, Work Orders and Lessons Read Together", "Before a unit is started or restarted, the checks that used to sit in five places are evaluated on one page, with a recorded sign-off",
              "Prototype readiness module (ready.js); example shown: feed pump GA-1201A with a latched low-low suction trip")
hh = shot(s, "ready", 0.35, 1.5, 6.6, [(1, 0.15, 0.5), (2, 0.2, 0.75), (3, 0.82, 0.6), (4, 0.28, 0.92)], (0, 0, 1, 0.8))
legend(s, 0.4, 1.5 + hh + 0.1, 6.5, [(1, "Verdict banner and list of blockers with the reason"), (2, "Each start permissive checked against the live model: valve position, flush, min-flow, no active trip"), (3, "Decision panel: sign off as manager, print the handover note, open the P&ID, ask the assistant"), (4, "Lessons to read, earlier start-up problems from work orders, open document conflicts")], 7.2)
banner(s, 7.15, 1.5, 5.85, "Checks (22 items on the example unit)", NAVY, 0.3, 9.5)
checks = [("Permissives", "every start permissive of the interlock sheet against the live P&ID model", RED), ("Latched trips and closed valves", "any is a blocker", RED), ("Recent corrective work", "flagged until closed", ORANGE), ("Lessons", "OPL key points for the start-up must be read", BLUE), ("Past start-up problems", "work orders that mention start-up for this unit", BLUE), ("Document conflicts", "open items touching the unit are listed", ORANGE)]
for i, (t, d, c_) in enumerate(checks):
    y = 1.88 + i * 0.52; box(s, 7.15, y, 0.1, 0.46, c_, None, None, shape=MSO_SHAPE.RECTANGLE); text(s, 7.32, y - 0.01, 5.65, 0.2, t, 8.3, True, NAVY); text(s, 7.32, y + 0.19, 5.65, 0.3, d, 7.2, False, INK)
for i, (t, d, c_) in enumerate([("GO", "all checks pass", GREEN), ("GO WITH CHECKS", "no blocker, items to confirm", AMBER), ("NO-GO", "at least one blocker", RED)]):
    x = 7.15 + i * 1.97
    box(s, x, 5.1, 1.9, 0.55, TINT[c_], c_, [[(t, {"bold": True, "size": 10, "color": c_ if c_ != AMBER else ORANGE})], [(d, {"size": 7, "color": INK})]], 9, False, INK, "c", "m", radius=0.07, lw=1.3)
text(s, 7.15, 5.8, 5.85, 0.5, "A sign-off with name, role and note is written to the audit trail; a latched trip must be reset on the P&ID before the verdict can change.", 7.4, False, INK, line=1.02)
conn(s, 7.15, 6.4, 5.85, [("Interlock", PURPLE), ("Live P&ID", PURPLE), ("OPL", PURPLE), ("Work orders", ORANGE), ("Quality register", BLUE), ("Audit", BLUE)])

# ---------- A15 plot plan and hazard simulator
s = app_slide("Plot Plan and HSE Hazard Simulator: {{Release, Cloud, Fire and Muster Walk}} on the True-Scale Site", "Screening models run on the real coordinates of the eight units, the control room, the gates and the muster points",
              "Prototype plot plan and hazard simulator (pp.js, hse.js, hse3d.js); screening estimates, not a consequence study")
shot(s, "plot", 0.35, 1.5, 4.1, [(1, 0.3, 0.4), (2, 0.8, 0.6)], (0, 0, 1, 0.85))
shot(s, "hazard2d", 4.55, 1.5, 4.1, [(3, 0.3, 0.45), (4, 0.7, 0.7)], (0, 0, 1, 0.85))
shot(s, "hazard3d", 8.75, 1.5, 4.25, [(5, 0.3, 0.55), (6, 0.8, 0.3)], (0, 0, 1, 0.85))
legend(s, 0.4, 4.3, 4.1, [(1, "Scaled plot plan with E/N grid, pipe rack, road, gates, control room, muster points"), (2, "Colour by downtime, corrective jobs or instruments flagged")], 7)
legend(s, 4.6, 4.3, 4.1, [(3, "2D view: 25, 50, 100% of the lower flammable limit, jet and pool fire, blast zones"), (4, "Controls: fluid, hole 10 to 100 mm, wind, stability class, shutdown mode, ignition time")], 7)
legend(s, 8.8, 4.3, 4.2, [(5, "3D view: gas cloud that grows and drifts, flames, detectors and the muster walk"), (6, "Effects table: release rate, cloud mass, time to detector, time to control room")], 7)
flow(s, 0.35, 5.3, 12.65, [("Release", "orifice flow, hole 10 to 100 mm, shutdown auto, manual or failed"), ("Source", "flash fraction and pool evaporation; inventory limits duration"), ("Dispersion", "Gaussian plume moving with wind, transport delay, urban Pasquill sigmas, dense-gas factor"), ("Ignition", "flash fire at 25, 50, 100% LFL; jet and pool fire radiation; Kinney-Graham blast"), ("People", "detection and shutdown timing; receptors per zone; walking time to each muster point")], [BLUE, TEAL, GREEN, ORANGE, RED], 0.7, 7)
conn(s, 0.35, 6.55, 12.65, [("Site plan", RED), ("Assistant", TEAL), ("Readiness", RED), ("3D plant", PURPLE)])

# ---------- A16 site plan and replay
s = app_slide("Maintenance Site Plan and Plant Replay: {{Permits, Clashes and the Plant on Any Date}}", "The four-week plan is built from the work-order intervals and the failure forecast; the replay lets a manager watch the plant history on the same map",
              "Prototype site planner and plant replay (plan.js, rp.js); figures from the case work orders")
shot(s, "plan", 0.35, 1.5, 6.2, [(1, 0.15, 0.25), (2, 0.5, 0.45), (3, 0.28, 0.85), (4, 0.78, 0.8)], (0, 0, 1, 0.8))
shot(s, "replay", 6.7, 1.5, 6.3, [(5, 0.2, 0.2), (6, 0.5, 0.6), (7, 0.75, 0.95)], (0, 0, 1, 0.8))
hh = 6.2 * 0.8 * 0.726
legend(s, 0.4, 1.5 + hh + 0.1, 6.1, [(1, "Gantt by unit: solid bars routine jobs, dashed bars forecast checks; letters mark permits"), (2, "Crew hours per day against capacity"), (3, "Site on the day: crane pad, laydown areas, separation rings, permits"), (4, "Clash table with Move to a clear day; add jobs or load an example campaign")], 7)
legend(s, 6.75, 1.5 + 6.3 * 0.8 * 0.726 + 0.1, 6.2, [(5, "Date slider, event track and play controls; speed up to very fast"), (6, "3D plant with each unit's open work order and problem on its label"), (7, "Status board, availability and cost curves up to the chosen date")], 7)
for i, (t, d, c_) in enumerate([("Jobs", "routine: median interval of past jobs per unit, type and discipline; forecast checks from the gamma-Poisson modes (probability 8% or more)", BLUE), ("Permits", "hot work, confined space, lift, isolation, line break inferred from similar work-order wording", TEAL), ("Schedule", "greedy by due day, levelled over 3 days, crews per discipline x 8 h; weekends skipped", GREEN), ("Clashes", "hot work vs open line at the larger of the setting and 2 x hazard radius; one crane; no hot work with entry", RED), ("Replay", "state per unit from work-order times; stepping lands inside every breakdown, so none is skipped", PURPLE)]):
    x = 0.35 + i * 2.55; y = 5.95
    box(s, x, y, 2.5, 0.25, c_, None, [t], 8, True, WHITE, "l", "m", radius=0.05, margin=0.07); panel(s, x, y + 0.27, 2.5, 0.62); text(s, x + 0.05, y + 0.28, 2.4, 0.6, d, 6.6, False, INK, line=0.98)

# ---------- A17 3D plant and equipment
s = app_slide("3D Plant and Equipment Drawings: {{Every Part Selectable}}, Built From the Datasheet Bill of Material", "A purpose-built renderer shows the plant and eight machine models, each assembled from the same primitives as its 2D general-arrangement drawing",
              "Prototype 3D engine and drawings (gad.js, ga.js, g3d.js, g3r.js, plant3d.js); frame rates measured in a headless browser")
shot(s, "dash2", 0.35, 1.5, 4.1, [(1, 0.28, 0.55), (2, 0.78, 0.3), (3, 0.2, 0.2)], (0, 0, 1, 0.85))
shot(s, "equipment3d", 4.55, 1.5, 4.1, [(4, 0.5, 0.45), (5, 0.82, 0.3), (6, 0.2, 0.75)], (0, 0, 1, 0.85))
shot(s, "eqover", 8.75, 1.5, 4.25, [(7, 0.82, 0.18), (8, 0.3, 0.55)], (0, 0, 1, 0.85))
legend(s, 0.4, 4.3, 4.1, [(1, "Plant in 3D: units on the plot plan joined by service-coloured lines, with labels and state"), (2, "Select a unit to fly to it; chips jump to any unit"), (3, "Attention strip: latched trips, units not ready, overdue work, high-severity conflicts")], 7)
legend(s, 4.6, 4.3, 4.1, [(4, "Machine in 3D: parts from the bill of material; select one for its card"), (5, "Views, exploded and moving parts; live condition overlay"), (6, "Component card: material, quantity, work orders that mention it")], 7)
legend(s, 8.8, 4.3, 4.2, [(7, "Header with a slowly turning model of the same machine"), (8, "Overview cards open every record on file")], 7)
for i, (t, d, c_) in enumerate([("Software renderer", "depth-buffered rasteriser on a canvas, smooth normals, outlines, transparent clouds; no plug-in", BLUE), ("Picking", "the part under the cursor is identified, not just the machine, so each part opens its own card", TEAL), ("Condition model", "simulated bearing temperature, vibration, leak rate and winding temperature per part; a hook replaces them with plant data", ORANGE), ("Performance", "duty-cycled loops, off-screen pause, adaptive resolution aimed at 15 ms, scene cache: 15 to 50 fps on the equipment view", GREEN)]):
    x = 0.35 + i * 3.2
    box(s, x, 5.5, 3.1, 0.27, c_, None, [t], 8.3, True, WHITE, "l", "m", radius=0.05, margin=0.08); panel(s, x, 5.79, 3.1, 0.95); text(s, x + 0.07, 5.81, 2.97, 0.92, d, 7.2, False, INK, line=1.02)

# ---------- A18 performance, reports, governance, integrations
s = app_slide("Performance, Reports, Governance and Integrations: {{The Management Layer}}", "Pages for the people who decide, not only the people who operate",
              "Prototype pages (perf.js, rc.js, gov.js, int.js, cov.js); all figures computed from the loaded records")
shot(s, "perf2", 0.35, 1.5, 3.1, [(1, 0.3, 0.3), (2, 0.7, 0.6)], (0, 0, 1, 0.85))
shot(s, "rc", 3.55, 1.5, 3.1, [(3, 0.2, 0.3), (4, 0.7, 0.8)], (0, 0, 1, 0.85))
shot(s, "gov", 6.75, 1.5, 3.1, [(5, 0.3, 0.3), (6, 0.7, 0.6)], (0, 0, 1, 0.85))
shot(s, "conn", 9.95, 1.5, 3.05, [(7, 0.25, 0.35), (8, 0.7, 0.7)], (0, 0, 1, 0.85))
for x, ts in [(0.4, [(1, "KPIs per unit and plant: availability, MTBF, MTTR, cost"), (2, "Spare parts outlook and editable targets")]), (3.6, [(3, "Printable reports: dossier, reliability, forecast, incident pack, data quality, management summary"), (4, "CSV and JSON exports of work orders, instruments, documents, C&E matrix")]), (6.8, [(5, "Controls in place and what production needs"), (6, "Phased roadmap and a business case with visible assumptions")]), (10.0, [(7, "Connectors: EDMS, AIMS, maintenance system, historian with field mapping"), (8, "Data model, architecture, AI contract, backend bundle, knowledge graph")])]:
    legend(s, x, 3.95, 3.0, ts, 6.9)
banner(s, 0.35, 5.15, 12.65, "Also on these pages", NAVY, 0.28, 9)
for i, (t, d) in enumerate([("Data feeds", "Fields needed for energy, production and stock are listed, not invented."), ("Report Center", "PDF through print, HTML or Word; every report cites its records."), ("Coverage register", "Maps each case requirement to a feature and runs an answer audit."), ("Backend bundle", "SQL schema, API spec, prompt template and JSON schemas as downloads.")]):
    x = 0.35 + i * 3.2; panel(s, x, 5.5, 3.1, 0.85, WHITE, MID); text(s, x + 0.07, 5.52, 2.97, 0.2, t, 8, True, NAVY); text(s, x + 0.07, 5.74, 2.97, 0.6, d, 7.2, False, INK, line=1.0)
conn(s, 0.35, 6.5, 12.65, [("Database", GREEN), ("Failure memory", ORANGE), ("Predictive", ORANGE), ("Quality register", BLUE), ("Assistant", TEAL)])

# ---------- A19 platform services
s = app_slide("Platform Services: {{Roles, Sync, Offline, Language and Guidance}} Around Every Feature", "The services that make the hub usable by a shift team and by the Company's IT, not only by the demo author",
              "Prototype services (auth.js, sync.js, notify.js, i18n.js, help.js, ui.js, sw.js)")
shot(s, "quality", 0.35, 1.5, 4.3, [(1, 0.25, 0.3), (2, 0.75, 0.55)], (0, 0, 1, 0.85))
legend(s, 0.4, 4.7, 4.25, [(1, "Data Quality: 48 findings by severity, with owner; reviewers mark resolved or accepted, and the mark is shared"), (2, "Same data feeds the notification bell and My work: approvals waiting, rejected items, answers marked wrong, high-risk forecasts")], 7.2)
sv = [("Roles", "Operator, Engineer, Reliability, HSE and Manager; what a person can approve or edit follows the role. Demo accounts from the work-order names; not a security boundary.", BLUE, "users"),
      ("Shared database", "Pull, merge and push through /api/kb with last-write-wins, conflict detection by base version and tombstones; falls back to browser storage.", TEAL, "db"),
      ("Offline and install", "Service worker keeps the page when the network drops; manifest makes it installable; /api calls are never cached.", GREEN, "cloud"),
      ("Language", "Questions in Bahasa Indonesia are translated to the record terms before search; interface and answers can be switched to Indonesian.", ORANGE, "book"),
      ("Guided tour and help", "A short tour of the main areas starts once for a new visitor and can be reopened from the sidebar.", PURPLE, "target"),
      ("Accessibility and layout", "Keyboard navigation, labelled controls, automatic label de-collision on every SVG figure, layout crawled at phone, tablet and desktop widths.", RED, "check"),
      ("Settings and diagnostics", "Connection state, AI status and limits, usage per day, language, role, self-test of the server functions, export and restore of the shared data.", NAVY, "gear"),
      ("Global search", "Ctrl K searches the same ranked index across documents, work orders, lessons and tags.", GREY, "search")]
for i, (t, d, c_, ic) in enumerate(sv):
    x = 4.85 + (i % 2) * 4.1; y = 1.5 + (i // 2) * 1.32
    panel(s, x, y, 4.0, 1.25, WHITE, c_); pic(s, ic, x + 0.08, y + 0.1, 0.4, c_)
    text(s, x + 0.58, y + 0.05, 3.35, 0.25, t, 9, True, NAVY); text(s, x + 0.58, y + 0.32, 3.35, 0.93, d, 7.2, False, INK, line=1.02)
