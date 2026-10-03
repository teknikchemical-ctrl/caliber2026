# ======================================================= APPENDIX: features, architecture and algorithms
AN = [0]
def app_slide(title, sub=None, source=None, kicker="Appendix"):
    AN[0] += 1
    s = blank(prs)
    frame(s, len(prs.slides), f"A{AN[0]}  {title}", sub, None, source, kicker)
    return s

def card(s, x, y, w, h, title, lines, color=BLUE, size=8.6, tsize=10):
    panel(s, x, y, w, h)
    box(s, x, y, w, 0.05, color, None, None, shape=MSO_SHAPE.RECTANGLE)
    text(s, x + 0.1, y + 0.1, w - 0.2, 0.28, title, tsize, True, NAVY, line=1.0)
    bullet(s, x + 0.1, y + 0.42, w - 0.2, h - 0.45, lines, size, color, 3)

# ---------- A1 feature map
s = app_slide("Platform Feature Map: {{Twenty-Four Capabilities}} Across Four Functional Groups", "Every feature runs on the same tag-keyed knowledge core and is available in the working prototype",
              "Prototype feature inventory")
groups = [("Industrial Data Ops (Q1)", BLUE, [("doc", "Ingestion wizard", "Nine document kinds, column mapping, AI pre-fill"), ("shield", "Quality register", "48 conflicts with owner and severity"), ("check", "Approval workflow", "Draft, review, approved, superseded"), ("net", "Typed facts and links", "447 facts, 624 relations on the tag"), ("lock", "Roles and audit trail", "Role filter, change history, masking"), ("book", "Knowledge Studio", "Capture of tacit lessons and RCA")]),
          ("Verified answers (Q2)", TEAL, [("ai", "AI assistant", "Streaming answers, offline fallback"), ("gear", "20 computed tools", "KPI, interlock, hazard, forecast, spec"), ("search", "Hybrid search", "BM25F with embeddings when connected"), ("list", "Source panel", "Revision, status and score per source"), ("target", "Confidence and checks", "Evidence score, number and quote checks"), ("refresh", "Feedback and evaluation", "Useful, incomplete, wrong; 128 test questions")]),
          ("Decision support (Q3)", ORANGE, [("warn", "Failure memory", "Similar failures, causes, actions, recurrence"), ("chart", "Reliability analytics", "RPN, MTBF, MTTR, forecasts, backtest"), ("link", "P&ID with valve logic", "Closing a valve blocks flow and trips"), ("gear", "Interlock and OPL simulators", "Cause and effect on the machine in 3D"), ("clock", "Start-up readiness", "GO, GO WITH CHECKS, NO-GO"), ("net", "Chain-reaction scenarios", "Which units trip next, for how long")]),
          ("Plan and HSE (Q3)", PURPLE, [("flame", "Hazard simulator", "Cloud, jet, pool, blast, muster walk"), ("calendar", "Maintenance site planner", "Four-week plan, permits, clashes"), ("clock", "Plant replay", "The plant on any date of the history"), ("factory", "3D plant and equipment", "Selectable parts, live state, 8 models"), ("doc", "Report Center", "Reliability, readiness, KPI exports"), ("chart", "Performance dashboard", "Availability, downtime, cost trends")])]
for gi, (gt, c_, fs) in enumerate(groups):
    x = 0.35 + gi * 3.2
    banner(s, x, 1.5, 3.12, gt, c_, 0.34, 10)
    for i, (ic, n_, d) in enumerate(fs):
        y = 1.92 + i * 0.8
        panel(s, x, y, 3.12, 0.74); pic(s, ic, x + 0.08, y + 0.17, 0.4, c_)
        text(s, x + 0.58, y + 0.04, 2.5, 0.24, n_, 9.3, True, NAVY); text(s, x + 0.58, y + 0.29, 2.5, 0.44, d, 8, False, INK, line=1.0)

# ---------- A2 architecture
s = app_slide("System Architecture: {{Five Layers}} on One Tag-Keyed Knowledge Core", "Data flows from plant sources to users, with governance applied to every layer",
              "Asset Knowledge Platform architecture notes (docs/ARCHITECTURE.md)")
L = [("1  Sources", BLUE, ["SOPs, OPLs, tacit notes", "Datasheets", "P&ID, GA, plot plan", "Interlock logic (C&E)", "Maintenance logs, RCA", "Incident reports", "Live data (DCS, historian)"]),
     ("2  Industrial Data Ops", TEAL, ["AI document ingestion", "Structure and tag mapping", "Quality gates, conflicts", "Secret masking", "Owner, revision, status", "Approval workflow"]),
     ("3  Knowledge core", GREEN, ["Documents and passages", "Search index (BM25F, vectors)", "Typed facts: tags, set points", "Relations between records", "Failure memory, lessons", "Answer, audit, feedback log"]),
     ("4  AI services", PURPLE, ["Intent router", "Retrieval and ranking", "20 computed tools", "LLM drafting, tool calls", "Verification, confidence", "Reliability, hazard models"]),
     ("5  Experiences", ORANGE, ["AI assistant", "Equipment 360 in 2D and 3D", "P&ID, interlock, OPL tools", "Maintenance, failure memory", "Site planner and replay", "Hazard and readiness"])]
cw = 2.3; gap = 0.28
for i, (t, c_, items) in enumerate(L):
    x = 0.35 + i * (cw + gap)
    banner(s, x, 1.5, cw, t, c_, 0.38, 10.5)
    panel(s, x, 1.92, cw, 3.65, TINT[c_], WHITE)
    for j, it in enumerate(items):
        box(s, x + 0.1, 2.0 + j * 0.5, cw - 0.2, 0.43, WHITE, MID, [it], 9, True, NAVY, "c", "m", radius=0.07)
    if i < 4: arrow(s, x + cw + 0.02, 3.7, x + cw + gap - 0.02, 3.7, GREY, 2.0)
box(s, 0.35, 5.68, 12.65, 0.4, NAVY, None, [[("Cross-cutting governance:  ", {"bold": True, "color": "8FD3CC"}), "role-based access  |  approval before trust  |  audit trail  |  prompt-injection guards  |  retention and region  |  read-only toward plant systems"]], 9.5, False, WHITE, "c", "m", radius=0.06)
for i, (t, d, c_) in enumerate([("Prototype today", "Single-file web application, Netlify functions and Blobs, free Gemini model, local fallback search", BLUE), ("Target production", "Postgres with pgvector, ingestion queue, single sign-on, EDMS and AIMS adapters, Company-approved model", GREEN)]):
    x = 0.35 + i * 6.4
    box(s, x, 6.17, 6.25, 0.65, TINT[c_], None, [[(t + ":  ", {"bold": True, "color": c_}), d]], 9.3, False, INK, "l", "m", radius=0.08, margin=0.12)

# ---------- A3 ingestion
s = app_slide("Industrial Data Ops: {{Six-Step Ingestion}} From Raw Document to Governed Knowledge", "TAGLINK engine: every record is parsed, structured on the equipment tag, checked and approved before it is trusted",
              "Prototype ingestion wizard, extraction service and data layer (dl.js, ingest.js, wiz.js, facts.js)")
steps = [("1  Parse", "CSV delimiter detection (comma, semicolon, tab, pipe) with quoted fields; text extraction from documents"), ("2  Classify", "Nine kinds: SOP, datasheet, P&ID or drawing, interlock C&E, maintenance log, instrument list, OPL, incident report, notes"),
         ("3  Extract", "Server masks secrets and personal numbers, requests JSON from the model, then drops every step, value or fact that does not quote the source text"), ("4  Normalise", "Equipment tag pattern, units and operators (<, >, set point) parsed into typed facts; statuses mapped to one vocabulary"),
         ("5  Check", "Rule-based conflict and gap checks; a person reviews the pre-filled result"), ("6  Approve and index", "Draft, In review, Approved; item, facts and source copy are chunked, hashed and added to the index")]
for i, (t, d) in enumerate(steps):
    x = 0.35 + i * 2.12
    box(s, x, 1.5, 2.08, 0.42, [BLUE, BLUE, TEAL, TEAL, ORANGE, GREEN][i], None, None, shape=MSO_SHAPE.PENTAGON)
    text(s, x + 0.1, 1.5, 1.8, 0.42, t, 10, True, WHITE, anchor="m")
    panel(s, x, 1.98, 2.02, 1.55, WHITE, MID); text(s, x + 0.08, 2.03, 1.88, 1.48, d, 8.3, False, INK, line=1.03)
banner(s, 0.35, 3.7, 4.1, "Status trust weights used in ranking", NAVY, 0.32, 10)
trust = [("Approved or issued", 1.0), ("Completed", .9), ("Listed", .9), ("Approval not stated", .8), ("Flagged for review", .75), ("In review", .7), ("Draft", .55), ("Superseded", .35), ("Rejected", 0)]
for i, (n_, v) in enumerate(trust):
    y = 4.1 + i * 0.3
    text(s, 0.4, y, 1.9, 0.26, n_, 8.5, False, INK, anchor="m")
    box(s, 2.35, y + 0.05, max(0.02, 1.7 * v), 0.17, [GREEN, GREEN, GREEN, TEAL, AMBER, AMBER, ORANGE, RED, RED][i], None, None, shape=MSO_SHAPE.RECTANGLE)
    text(s, 2.4 + 1.7 * v, y, 0.5, 0.26, f"{v:.2f}", 8.5, True, NAVY, anchor="m")
banner(s, 4.65, 3.7, 4.2, "Conflict and gap rules", NAVY, 0.32, 10)
bullet(s, 4.7, 4.1, 4.1, 2.7, ["Title tag differs from the tag in the sheet body", "Duplicate or reused tag for different valves", "Valve fail position stated both open and closed", "Drawing reference missing or a placeholder", "Revision shown without a date", "Dimensions disagree between datasheet, GA and plot plan", "Trip description inconsistent with the instrument type", "Result: 48 findings, each with severity, source and owner"], 9, RED, 4)
banner(s, 9.05, 3.7, 3.95, "Resulting knowledge base", NAVY, 0.32, 10)
for i, (n_, l_, c_) in enumerate([("1,109", "searchable passages", BLUE), ("447", "typed facts", TEAL), ("624", "relations on the tag", GREEN), ("98", "documents, 84 instruments", ORANGE)]):
    x = 9.05 + (i % 2) * 2.0; y = 4.1 + (i // 2) * 1.2
    stat(s, x, y, 1.92, 1.1, n_, l_, c_, None, 20)

# ---------- A4 retrieval
s = app_slide("Retrieval: {{BM25F Ranking}} With Tag, Status, Equipment and Role Weighting", "VERA engine, step 1: the best evidence is selected before any language model is used",
              "Prototype retrieval index (dl.js); parameters are the values used in the running application")
banner(s, 0.35, 1.5, 4.2, "1  Score each passage", NAVY, 0.32, 10)
text(s, 0.4, 1.9, 4.1, 0.5, "BM25 with field weights: a term counts more when it appears in a heading or in an equipment tag.", 9, False, INK, line=1.03)
for i, (f_, w_) in enumerate([("Equipment tag in passage", 2.5), ("Title", 2.0), ("Section heading", 1.5), ("Body text", 1.0)]):
    y = 2.45 + i * 0.36
    text(s, 0.4, y, 1.9, 0.3, f_, 8.8, False, INK, anchor="m"); box(s, 2.35, y + 0.06, 0.7 * w_, 0.18, BLUE, None, None, shape=MSO_SHAPE.RECTANGLE); text(s, 2.4 + 0.7 * w_, y, 0.5, 0.3, f"x{w_}", 8.5, True, NAVY, anchor="m")
panel(s, 0.35, 3.95, 4.2, 0.9, LIGHT, MID); text(s, 0.45, 3.98, 4.0, 0.85, [[("k1 = 1.4, b = 0.75", {"bold": True, "color": BLUE})], "Query tags weighted 2.2; synonyms and stemming applied; broad words down-weighted"], 9, False, INK, line=1.03)
text(s, 0.4, 4.95, 4.1, 1.8, [[("Why BM25F: ", {"bold": True, "color": NAVY}), "plant text is short, tag-heavy and full of identifiers that exact matching handles well. Embeddings add recall for questions that share no words with the passage."]], 9, False, INK, line=1.05)
banner(s, 4.75, 1.5, 4.2, "2  Re-weight by trust and context", NAVY, 0.32, 10)
mult = [("Status trust", "0.35 to 1.00", TEAL), ("Source kind prior", "0.55 to 1.05", TEAL), ("Equipment in scope", "x 1.45", GREEN), ("Other equipment", "x 0.70", RED), ("Role fit (operator, HSE, reliability, manager)", "x 1.10 to 1.15", BLUE)]
for i, (n_, v, c_) in enumerate(mult):
    y = 1.95 + i * 0.52
    panel(s, 4.75, y, 4.2, 0.46); text(s, 4.85, y, 2.5, 0.46, n_, 8.8, True, NAVY, anchor="m", line=1.0); pill(s, 7.45, y + 0.1, 1.4, v, TINT[c_], c_, 0.26, 8.5)
text(s, 4.75, 4.6, 4.2, 0.6, "Source-kind priors: interlock 1.05, OPL 1.05, document 1.00, work order 1.00, plot plan 0.95, instrument 0.85, data-quality note 0.55", 8.3, False, GREY, line=1.03)
banner(s, 4.75, 5.25, 4.2, "Access control", NAVY, 0.3, 9.5)
text(s, 4.8, 5.58, 4.1, 1.2, "Passages carry an access list by role. Draft and superseded items are visible to staff only; rejected items are never returned.", 8.8, False, INK, line=1.05)
banner(s, 9.15, 1.5, 3.85, "3  Add meaning and diversify", NAVY, 0.32, 10)
card(s, 9.15, 1.92, 3.85, 1.55, "Embedding fusion (when connected)", ["score = (1 - 0.35) x BM25F + 0.35 x cosine x 40", "Semantic recall: a passage with no shared words qualifies when cosine is at least 0.6"], TEAL, 8.5, 9.5)
card(s, 9.15, 3.57, 3.85, 1.2, "Diversity rule", ["At most two passages per source document, so one long file cannot fill the context"], TEAL, 8.5, 9.5)
card(s, 9.15, 4.87, 3.85, 1.9, "Output to the answer stage", ["Ranked passages with chunk id, revision, status and matched terms", "Relative score for each passage", "Question words covered, used by the confidence score"], TEAL, 8.5, 9.5)

# ---------- A5 answer generation
s = app_slide("Answer Generation: {{Evidence-Weighted Confidence}}, Verification and Safety Refusals", "VERA engine, step 2: the model words the evidence; the platform measures how well the evidence supports the answer",
              "Prototype assistant (ai.js, intent.js, ai2.js); weights and caps are the values used in the running application")
banner(s, 0.35, 1.5, 4.6, "Confidence score (0 to 100)", NAVY, 0.32, 10)
w_ = [("Question words supported by one passage", .45, TEAL), ("Match strength of the best passage", .22, BLUE), ("Approval status of the sources", .15, GREEN), ("Agreement between sources", .10, PURPLE), ("Distinct sources found", .08, ORANGE)]
for i, (n_, v, c_) in enumerate(w_):
    y = 1.95 + i * 0.45
    text(s, 0.4, y, 2.5, 0.4, n_, 8.6, False, INK, anchor="m", line=1.0); box(s, 2.95, y + 0.08, 1.4 * v / .45, 0.22, c_, None, None, shape=MSO_SHAPE.RECTANGLE); text(s, 3.0 + 1.4 * v / .45, y, 0.5, 0.4, f"{v:.2f}", 8.8, True, NAVY, anchor="m")
text(s, 0.4, 4.25, 4.5, 0.25, "Caps applied after weighting", 9.3, True, NAVY)
bullet(s, 0.4, 4.52, 4.5, 1.3, ["Broad question without a specific term: maximum 60", "Sources are for different equipment: maximum 40", "Fewer than half of the question words in the sources: maximum 45", "No single passage covers the question: maximum 50"], 8.5, RED, 2)
for i, (t, c_) in enumerate([("High 70 or more", GREEN), ("Medium 45 to 69", AMBER), ("Low below 45", RED)]):
    pill(s, 0.4 + i * 1.5, 5.95, 1.42, t, TINT[c_], c_ if c_ != AMBER else ORANGE, 0.28, 8.5)
text(s, 0.4, 6.3, 4.5, 0.5, "Calculated tools report their own confidence, because their figures come directly from records.", 8.5, False, GREY, line=1.03)
banner(s, 5.15, 1.5, 3.85, "Pipeline and checks", NAVY, 0.32, 10)
for i, (t, d) in enumerate([("Intent routing", "Classifier selects a computed tool or retrieval"), ("Tool or evidence", "Tools return figures; retrieval returns passages"), ("Drafting", "Model writes only from numbered passages"), ("Number check", "Every figure with a unit must appear in a source"), ("Conflict and status notes", "Open conflicts and draft sources are flagged on the answer"), ("Logging", "Question, sources, score and latency stored")]):
    y = 1.95 + i * 0.8
    numdot(s, 5.15, y + 0.15, i + 1, TEAL, 0.32, 10)
    panel(s, 5.55, y, 3.45, 0.72); text(s, 5.63, y + 0.03, 3.3, 0.24, t, 9.3, True, NAVY); text(s, 5.63, y + 0.28, 3.3, 0.44, d, 8.3, False, INK, line=1.0)
banner(s, 9.2, 1.5, 3.8, "Twenty computed tools", NAVY, 0.32, 10)
tl = [("Reliability", "maintenance_stats, kpi_summary, failure_modes, predictive_maintenance, failure_memory, history_lookup, spares_outlook"), ("Assets and limits", "equipment_info, spec_lookup, tag_facts, plot_plan_query, compare_equipment, rank_equipment"), ("Operations and safety", "interlock_info, procedure_help, consequence_analysis, cascade_analysis, hazard_effects, safety_guard"), ("Data governance", "data_issues")]
for i, (g, t) in enumerate(tl):
    y = 1.95 + i * 1.1
    panel(s, 9.2, y, 3.8, 1.04); text(s, 9.3, y + 0.04, 3.6, 0.24, g, 9.5, True, TEAL); text(s, 9.3, y + 0.28, 3.6, 0.76, t, 8.1, False, INK, line=1.02)
text(s, 9.2, 6.38, 3.8, 0.5, [[("Safety refusal: ", {"bold": True, "color": RED}), "a request to bypass an interlock is declined with the reason and the approved route."]], 8, False, INK, line=1.0)

# ---------- A6 failure memory
s = app_slide("Failure Memory: {{Similar Failures, Causes and Actions}} Retrieved at the Moment of Need", "FORESIGHT engine: every new symptom is matched against work orders, one point lessons and approved user lessons",
              "Prototype failure memory (fm.js, pdm2.js)")
steps = [("Describe", "Symptom text and optional equipment or component"), ("Retrieve", "Retrieval over work orders, OPL troubleshooting cases and approved lessons"), ("Parse", "Symptom, cause and action fields; component taken from the part list"), ("Group", "Causes and actions merged by a key of the first four meaningful word stems"), ("Check recurrence", "Same component failing again within 90 days"), ("Recommend", "Ranked actions with case counts, recurrence rate and downtime range")]
for i, (t, d) in enumerate(steps):
    x = 0.35 + i * 2.12
    box(s, x, 1.5, 2.08, 0.4, [BLUE, BLUE, TEAL, TEAL, ORANGE, GREEN][i], None, [f"{i+1}  {t}"], 9.5, True, WHITE, "c", "m", radius=0.06)
    panel(s, x, 1.95, 2.02, 0.95); text(s, x + 0.08, 1.98, 1.88, 0.9, d, 8.3, False, INK, line=1.03)
banner(s, 0.35, 3.1, 6.2, "Worked example from the case data", NAVY, 0.32, 10)
ex = [("Fault", "Crosshead vibration approaching trip on the recycle gas compressor KC-4501"), ("Matched", "Work order WO-240088, plus OPL cases on KC-4501 trips"), ("Probable cause", "Crosshead pin clearance excessive"), ("Recommended action", "Renew crosshead pin and bush, set the clearance, confirm vibration returns to normal"), ("Recurrence", "Counted when the same component fails again within 90 days"), ("Output", "Case links open the full work order, drawing or lesson")]
for i, (a, b) in enumerate(ex):
    y = 3.5 + i * 0.55
    box(s, 0.35, y, 1.6, 0.5, TINT[BLUE], None, [a], 8.8, True, BLUE, "c", "m", radius=0.05); panel(s, 2.0, y, 4.55, 0.5, WHITE, MID); text(s, 2.08, y, 4.4, 0.5, b, 8.6, False, INK, anchor="m", line=1.0)
banner(s, 6.75, 3.1, 6.25, "Closing the loop with Knowledge Studio", NAVY, 0.32, 10)
card(s, 6.75, 3.5, 3.05, 1.55, "Draft lesson generation", ["When a failure mode has no lesson, a draft lesson is built from its work orders", "An engineer reviews and approves it"], TEAL, 8.5, 9.5)
card(s, 9.95, 3.5, 3.05, 1.55, "Lessons feed retrieval", ["Approved lessons are indexed immediately", "They appear beside the next matching fault"], TEAL, 8.5, 9.5)
card(s, 6.75, 5.15, 3.05, 1.65, "Lesson coverage", ["Each failure mode shows whether an OPL covers it", "Uncovered modes are flagged as gaps"], ORANGE, 8.5, 9.5)
card(s, 9.95, 5.15, 3.05, 1.65, "Limits", ["Matching is lexical with stemming, not semantic, unless embeddings are connected", "Quality depends on how well work orders are written"], RED, 8.5, 9.5)
text(s, 0.35, 6.85 - 0.0, 6, 0.0, "", 6)

# ---------- A7 reliability analytics
s = app_slide("Reliability Analytics: {{Failure-Mode Risk, Bayesian Forecasts}} and a Backtested Score", "FORESIGHT engine: quantitative models built on 211 work orders, validated by rolling-origin backtesting, with limits stated",
              "Prototype reliability analytics (pdm.js, pdm2.js); 63 breakdown and corrective jobs behind the failure-mode view")
card(s, 0.35, 1.5, 4.15, 2.65, "1  Failure-mode risk priority", ["Mode taxonomy read from problem, cause and action text (10 modes)", "RPN = Severity x Occurrence x Detection", "Severity: percentile of downtime (55%) and cost (45%), scaled 1 to 10", "Occurrence: 1 + 2.4 log2(1 + 3 x rate per year), maximum 10", "Detection: 1 + 9 x (1 - share found early), minus 1.2 if an OPL covers the mode"], BLUE, 8.5, 10)
card(s, 4.6, 1.5, 4.15, 2.65, "2  Gamma-Poisson mode forecast", ["Prior from the fleet rate: shape 1.5, rate 1.5 / fleet rate", "Posterior after n own events in T days: shape 1.5 + n, rate prior + T", "P(failure in h days) = 1 - exp(-mean rate x h)", "80% credible range from the gamma quantile (Wilson-Hilferty)", "Small samples shrink toward the fleet instead of over-reacting"], TEAL, 8.5, 10)
card(s, 8.85, 1.5, 4.15, 2.65, "3  Measures and trend", ["MTBF = (operating hours - downtime) / breakdowns; MTTR = downtime / breakdowns", "Laplace trend test: u above 1.64 means failures are accelerating, below -1.64 slowing", "Share of corrective jobs that repeat the previous mode", "Health index from recent breakdowns, preventive-maintenance gap and trend"], ORANGE, 8.5, 10)
banner(s, 0.35, 4.3, 8.4, "4  Combined unit score and its validation", NAVY, 0.32, 10)
bullet(s, 0.4, 4.7, 4.1, 2.1, ["Ridge-regularised logistic regression on eight standardised features: recent breakdowns, time since last breakdown against the usual gap, trend, repeat failures, overdue preventive work, lesson warning signs, recent corrective jobs, low health", "300 gradient-descent iterations with an L2 penalty", "Rolling-origin backtest: train on the past, forecast the next 90 days, move forward every 20 days", "Calibration slope shrinks the output toward the base rate"], 8.5, BLUE, 3)
for i, (n_, l_, c_) in enumerate([("64", "forecasts tested", BLUE), ("0.26", "Brier score, plant-wide rate", TEAL), ("0.47", "ranking skill (AUC); 0.50 is chance", RED)]):
    stat(s, 4.6 + i * 1.4, 4.7, 1.34, 1.2, n_, l_, c_, None, 18)
text(s, 4.6, 5.98, 4.15, 0.85, "A unit's own history does not predict which unit fails next on this data. The page therefore ranks units by consequence and reports the combined score as advisory.", 8.5, False, INK, line=1.03)
banner(s, 8.85, 4.3, 4.15, "Failure modes by risk priority", NAVY, 0.32, 10)
fm = [("Seal or gasket leak", 12, 14, 369), ("Valve or actuator", 9, 10, 232), ("Blocked or fouled", 5, 29, 226), ("Vibration, misalignment", 6, 0, 216), ("Bearing or lubrication", 7, 0, 146), ("Instrument or analyser", 14, 33, 129)]
text(s, 8.85, 4.65, 4.15, 0.2, "Mode, RPN (bar), jobs, share found early", 7.8, True, GREY)
for i, (m, n_, f_, r_) in enumerate(fm):
    y = 4.88 + i * 0.32
    text(s, 8.85, y, 1.5, 0.3, m, 7.8, True, NAVY, anchor="m", line=0.95); box(s, 10.4, y + 0.06, 1.2 * r_ / 369, 0.18, [RED, ORANGE, ORANGE, AMBER, AMBER, TEAL][i], None, None, shape=MSO_SHAPE.RECTANGLE)
    text(s, 10.45 + 1.2 * r_ / 369, y, 0.55, 0.3, str(r_), 7.8, True, INK, anchor="m"); text(s, 12.3, y, 0.7, 0.3, f"{n_} / {f_}%", 7.5, False, GREY, anchor="m")

# ---------- A8 HSE and readiness
s = app_slide("HSE and Readiness: {{Screening Hazard Models}} and Permissive Logic on the True-Scale Plot Plan", "SAFEWORK engine: consequence screening and start-up checks use the real equipment coordinates, interlock logic and live state",
              "Prototype hazard simulator and readiness module (hse.js, hse3d.js, ready.js); screening estimates, not a consequence study")
chain = [("Release", "Orifice flow through a 10 to 100 mm hole at the operating pressure and temperature; isolation by automatic, manual or failed shutdown"), ("Source term", "Flash fraction and pool evaporation for liquids; inventory limits the release time"), ("Dispersion", "Gaussian plume moving with the wind, with transport delay, urban Pasquill sigmas and a dense-gas factor"), ("Ignition and effects", "Flash fire at 25, 50 and 100% of the lower flammable limit; jet and pool fire radiation; Kinney-Graham blast overpressure"), ("People and response", "Gas detection and shutdown timing; receptors in each zone; walking time to each muster point")]
for i, (t, d) in enumerate(chain):
    x = 0.35 + i * 2.55
    box(s, x, 1.5, 2.5, 0.4, [BLUE, TEAL, GREEN, ORANGE, RED][i], None, [f"{i+1}  {t}"], 10, True, WHITE, "c", "m", radius=0.06)
    panel(s, x, 1.95, 2.5, 1.5); text(s, x + 0.08, 1.98, 2.34, 1.45, d, 8.4, False, INK, line=1.03)
banner(s, 0.35, 3.62, 4.1, "Fluids and limits", NAVY, 0.32, 10)
bullet(s, 0.4, 4.0, 4.0, 2.8, ["n-hexane, ethylene and hydrogen with their flammability limits and heats of combustion", "Heat flux zones: 37.5 kW/m2 equipment damage, 12.5 kW/m2 fatal in about a minute, 4.7 kW/m2 pain in 15 seconds", "Blast zones: 35, 21 and 7 kPa", "Pasquill stability classes A to F selectable with wind speed and direction", "Output includes release rate, cloud reach and time to the control room"], 8.5, ORANGE, 4)
banner(s, 4.6, 3.62, 4.1, "Start-up readiness logic", NAVY, 0.32, 10)
bullet(s, 4.65, 4.0, 4.0, 2.8, ["Each permissive from the interlock document is read against the live model", "A latched trip or a closed valve is a blocker", "Open lessons and earlier start-up problems are listed for the unit", "Verdict: GO, GO WITH CHECKS or NO-GO; sign-off recorded with a handover note", "Draft lessons are generated for modes without coverage"], 8.5, TEAL, 4)
banner(s, 8.85, 3.62, 4.15, "Intended use and limits", NAVY, 0.32, 10)
bullet(s, 8.9, 4.0, 4.05, 2.8, ["Ranks and compares scenarios, trains operators and supports siting and permit decisions", "Point-source flame model and screening plume; no obstacles or terrain", "Does not replace a quantitative risk or consequence study", "The assistant calls the same model through the hazard_effects tool and states its limits"], 8.5, RED, 4)

# ---------- A9 site planner
s = app_slide("Maintenance Site Planner and Replay: {{Permit-Aware Scheduling}} With Hazard-Based Clash Rules", "SAFEWORK engine: routine and forecast jobs are placed on crew days, checked against neighbouring work and shown on the plot plan",
              "Prototype maintenance site planner and plant replay (plan.js, rp.js)")
for i, (t, d) in enumerate([("Generate jobs", "Routine: median interval of past jobs per unit, type and discipline. Condition checks: top failure modes from the gamma-Poisson forecast"), ("Infer permits", "Hot work, confined space, lift, isolation and line break read from the wording of similar work orders"), ("Schedule", "Greedy placement by due day and priority, levelled within a three-day window, within crew capacity per discipline"), ("Check clashes", "Pairwise rules on overlapping jobs using plot plan distances"), ("Show the day", "Crane pads, laydown areas, separation rings and permits on the plot plan and in 3D")]):
    x = 0.35 + i * 2.55
    box(s, x, 1.5, 2.5, 0.4, [BLUE, TEAL, GREEN, ORANGE, PURPLE][i], None, [f"{i+1}  {t}"], 10, True, WHITE, "c", "m", radius=0.06)
    panel(s, x, 1.95, 2.5, 1.3); text(s, x + 0.08, 1.98, 2.34, 1.25, d, 8.4, False, INK, line=1.03)
banner(s, 0.35, 3.45, 6.3, "Clash rules", NAVY, 0.32, 10)
rules = [("Hot work near an open line", "separation = larger of the user setting (25 to 80 m) and twice the gas hazard radius of the unit being opened", RED), ("Confined space entry", "no hot work or line break in the same unit at the same time", RED), ("Heavy lift", "one crane: two lifts may not overlap unless a second crane is available", ORANGE), ("Crew capacity", "load per discipline per day must not exceed crews x 8 hours", ORANGE), ("Lateness", "a job placed more than five days after its due day is flagged", AMBER)]
for i, (a, b, c_) in enumerate(rules):
    y = 3.85 + i * 0.58
    box(s, 0.35, y, 0.08, 0.52, c_, None, None, shape=MSO_SHAPE.RECTANGLE); text(s, 0.5, y, 2.0, 0.52, a, 8.8, True, NAVY, anchor="m", line=1.0); text(s, 2.5, y, 4.15, 0.52, b, 8.2, False, INK, anchor="m", line=1.0)
banner(s, 6.85, 3.45, 6.15, "Plant replay: never miss a breakdown", NAVY, 0.32, 10)
bullet(s, 6.9, 3.85, 6.05, 1.5, ["Unit state at date t: Breakdown, Maintenance, Notified or Running, from the work order start and finish times", "Playback steps are larger than most breakdowns, so the clock lands inside each breakdown before it continues", "Pause on breakdown opens the failure view for that unit; overlapping breakdowns are linked"], 8.5, BLUE, 3)
for i, (n_, l_, c_) in enumerate([("31 / 31", "breakdowns shown on the correct unit, plot plan and 3D", GREEN), ("5", "permit types checked", BLUE), ("28 days", "planning horizon with crew levelling", TEAL)]):
    stat(s, 6.85 + i * 2.07, 5.5, 2.0, 1.3, n_, l_, c_, None, 17)

# ---------- A10 visual engine
s = app_slide("Simulation and Visual Engine: {{Interactive 3D}} and Valve-Aware P&ID Logic Without Plug-Ins", "A purpose-built renderer keeps every model selectable, consistent with the drawings and responsive on ordinary laptops",
              "Prototype rendering engine (g3d.js, g3r.js, plant3d.js, pidv.js, scn.js); frame rates measured in a headless browser")
card(s, 0.35, 1.5, 4.15, 2.5, "3D renderer", ["Software depth-buffered rasteriser on a canvas; smooth normals, outlines, transparent clouds", "Eight equipment models built from the datasheet bill of material; each part is selectable by picking", "Adaptive resolution targets a 15 ms frame; high-resolution redraw when idle"], BLUE, 8.5, 10)
card(s, 4.6, 1.5, 4.15, 2.5, "P&ID and interlock logic", ["Valves open and close; closing a valve blocks flow downstream and trips the permissive that depends on it", "Interlock cause and effect evaluated from the instrument values", "Plant cascade: connectivity graph shows which units trip next and the estimated outage"], TEAL, 8.5, 10)
card(s, 8.85, 1.5, 4.15, 2.5, "Hazard, replay and planner views", ["Gas cloud, flames and blast drawn at true scale on the site model", "Same state model drives the plot plan and the 3D plant", "Labels, cards and tickers are generated from the same records as the tables"], ORANGE, 8.5, 10)
banner(s, 0.35, 4.15, 12.65, "Performance engineering", NAVY, 0.32, 10)
for i, (n_, l_, c_) in enumerate([("15 to 50 fps", "equipment 3D after duty-cycled loops and visibility culling", GREEN), ("15 to 51 fps", "dashboard plant after scene caching", GREEN), ("5%", "main-thread load of the equipment viewer at rest", BLUE), ("0", "plug-ins or external 3D libraries", TEAL)]):
    stat(s, 0.35 + i * 3.2, 4.58, 3.1, 1.15, n_, l_, [GREEN, GREEN, BLUE, TEAL][i], None, 18)
text(s, 0.35, 5.85, 12.6, 0.95, [[("Why it matters: ", {"bold": True, "color": NAVY}), "operators need the machine, the P&ID and the lesson on the same screen without installing software. Rendering is paused when a view is off screen or the tab is hidden, which keeps the platform usable on shared control-room computers."]], 9.3, False, INK, line=1.05)
