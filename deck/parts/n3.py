# ======================================================= APPENDIX: A1 to A7 prototype screens, A8 to A10 technical details
from flow import *

AN = [0]
def app_slide(title, kicker, source=None):
    AN[0] += 1
    s = blank(prs)
    frame(s, len(prs.slides), f"A{AN[0]}  {title}", None, None, source, kicker)
    return s

def sh(s, name, x, y, w, crop, marks):
    """screenshot with callouts; marks are given as fractions of the full image and converted to the crop"""
    c0, c1, c2, c3 = crop
    mk = [(n, (fx - c0) / (c2 - c0), (fy - c1) / (c3 - c1)) for n, fx, fy in marks]
    return shot(s, name, x, y, w, mk, crop)

def sh2(s, name, x, y, w, crop, marks):
    return sh(s, name, x, y, w, crop, marks)

def fact_row(s, y, items, h=0.55, color=BLUE):
    """row of equal fact cells: (big text, label)"""
    n = len(items); w = (12.55 - 0.12 * (n - 1)) / n
    for i, (big, lab_) in enumerate(items):
        c_ = [BLUE, TEAL, ORANGE, PURPLE, GREEN, RED][i % 6]
        box(s, 0.4 + i * (w + 0.12), y, w, h, TINT[c_], c_, [[(big + "  ", {"bold": True, "size": 14, "color": c_}), (lab_, {"size": 9, "color": INK})]], 12, False, INK, "c", "m", radius=0.08, lw=1.1, margin=0.05)

def note_row(s, y, items, h=0.9):
    """row of cells with a bold heading and one or two sentences"""
    n = len(items); w = (12.55 - 0.12 * (n - 1)) / n
    for i, (hd_, tx_, c_) in enumerate(items):
        x = 0.4 + i * (w + 0.12)
        box(s, x, y, w, h, WHITE, c_, [[(hd_, {"bold": True, "size": 9.5, "color": c_})], [(tx_, {"size": 8.8, "color": INK})]], 9, False, INK, "l", "m", radius=0.08, lw=1.2, margin=0.1)

# ---------------------------------------------------------------- A1 dashboard, equipment pages, 3D
s = app_slide("Dashboard, equipment pages and the 3D plant", "Appendix A: prototype screens", "Prototype dashboard and equipment pages, built on the case baseline data")
y0 = 1.28; w3 = 4.1; xs3 = [0.4, 4.62, 8.84]
hh = sh(s, "dash2", xs3[0], y0, w3, (0, 0.08, 1, 0.98), [(1, 0.28, 0.105), (2, 0.40, 0.63), (3, 0.3, 0.76)])
sh(s, "eqover", xs3[1], y0, w3, (0, 0, 1, 0.9), [(4, 0.15, 0.1), (5, 0.4, 0.43), (6, 0.5, 0.72)])
sh(s, "equipment3d", xs3[2], y0, w3, (0.0, 0.17, 1.0, 1.0), [(7, 0.3, 0.74), (8, 0.6, 0.82)])
ly = y0 + hh + 0.1
legend(s, xs3[0], ly, w3, [(1, "Chips count latched trips, units not ready, overdue preventive work and document conflicts."), (2, "Each unit has a status label. Selecting a unit flies the view to it."), (3, "Pipes are coloured by service: process liquid, nitrogen, steam, cooling water, lube oil and gas.")], 8.5)
legend(s, xs3[1], ly, w3, [(4, "The equipment page opens with start-up status, criticality, flammability and a 3D model."), (5, "Key figures: availability, mean repair time, breakdowns, downtime and forecast risk."), (6, "Cards link to the P&ID, drawing, plot plan, datasheet, interlocks, lessons and maintenance history.")], 8.5)
legend(s, xs3[2], ly, w3, [(7, "Each machine model is built from the datasheet bill of materials, with view and moving-part controls."), (8, "Selecting a part shows its item number, material, drawing and live condition.")], 8.5)
note_row(s, 5.95, [("Operators and managers", "See the status of every unit and the work that is open without opening a report.", BLUE), ("Maintenance engineers", "Find a part, its material and its drawing from the same page as the work-order history.", TEAL), ("Reliability and HSE engineers", "Open the interlock logic, lessons and failure history of a unit in one click.", ORANGE)], 0.78)

# ---------------------------------------------------------------- A2 AI assistant answers
s = app_slide("AI assistant: three kinds of answer", "Appendix A: prototype screens", "Prototype AI assistant running on local retrieval and computed tools. The same screens appear with Gemini wording when the free-tier key is connected")
hh = sh(s, "ask_rank", xs3[0], y0, w3, (0, 0.1, 1, 0.93), [(1, 0.3, 0.3), (2, 0.17, 0.47), (3, 0.3, 0.6)])
sh(s, "ask_fail", xs3[1], y0, w3, (0, 0.1, 1, 0.93), [(4, 0.4, 0.3), (5, 0.17, 0.46), (6, 0.3, 0.62)])
sh(s, "ask_bypass", xs3[2], y0, w3, (0, 0.1, 1, 0.93), [(7, 0.4, 0.2), (8, 0.4, 0.38), (9, 0.2, 0.565)])
ly = y0 + hh + 0.1
legend(s, xs3[0], ly, w3, [(1, "Ranking by health index, calculated by the rank_equipment tool from the work-order history."), (2, "A confidence chip shows 90% and the tool that computed the figures."), (3, "Cited sources show their approval status and date.")], 8.5)
legend(s, xs3[1], ly, w3, [(4, "Failure memory finds similar past failures and names the most supported action and root cause."), (5, "Confidence is 80%, and the answer links to the closest work order."), (6, "Sources are one work order and three approved OPLs.")], 8.5)
legend(s, xs3[2], ly, w3, [(7, "A request to bypass a trip is refused, and the reply gives the approved route."), (8, "The reply still lists the initiators and set points of the interlock."), (9, "The refusal comes from the safety_guard tool, not from the language model.")], 8.5)
note_row(s, 5.95, [("Scope selector", "Limits a question to one equipment set or to the whole plant.", BLUE), ("Suggested questions", "Generated from the plant data and shown under each answer.", TEAL), ("Open conflict note", "Appears when an answer touches a document with a recorded conflict.", ORANGE), ("Feedback links", "Useful, Incomplete and Wrong go to a review queue.", PURPLE)], 0.78)

# ---------------------------------------------------------------- A3 knowledge base and data operations
s = app_slide("Knowledge base and data operations", "Appendix A: prototype screens", "Prototype Knowledge Studio, data quality page and knowledge graph, built from the case documents")
w4 = 3.05; xs4 = [0.4 + i * 3.17 for i in range(4)]
hh = sh(s, "studio", xs4[0], y0, w4, (0, 0, 0.85, 0.94), [(1, 0.1, 0.2), (2, 0.8, 0.33)])
sh(s, "wizard", xs4[1], y0, w4, (0, 0.03, 0.6, 0.66), [(3, 0.5, 0.17), (4, 0.25, 0.37)])
sh(s, "quality", xs4[2], y0, w4, (0, 0, 0.75, 0.83), [(5, 0.1, 0.2), (6, 0.7, 0.3)])
sh(s, "graph", xs4[3], y0, w4, (0.12, 0.1, 0.88, 0.94), [(7, 0.5, 0.61), (8, 0.3, 0.33)])
ly = y0 + hh + 0.08
legend(s, xs4[0], ly, w4, [(1, "1,109 indexed knowledge chunks."), (2, "Chunks by source system: EDMS 478, OPL 280, CMMS 211, AIMS 84.")], 8.5)
legend(s, xs4[1], ly, w4, [(3, "Six steps: source, kind, structure, details, checks and create."), (4, "Files are read in the browser; secrets are masked before any AI extraction.")], 8.5)
legend(s, xs4[2], ly, w4, [(5, "48 inconsistencies found while the base was built, by severity."), (6, "Each issue is tracked by source until it is resolved or accepted.")], 8.5)
legend(s, xs4[3], ly, w4, [(7, "The equipment tag sits at the centre of the graph."), (8, "Documents, OPLs, instruments, interlocks and work orders link to it.")], 8.5)
ptitle(s, 0.4, 4.95, 12.55, "How a new document becomes approved knowledge", NAVY, 0.27)
box(s, 0.4, 5.25, 12.55, 1.0, "F4F8FD", None, None, radius=0.04)
fy_ = 5.6
items = [("c", "Source", "File, pasted text or expert notes", BLUE, 1.75), ("c", "Read and verify", "Each value must quote the source", BLUE, 2.0), ("c", "Map", "Tag, asset, revision, date", BLUE, 1.75), ("d", "Checks pass?", AMBER, 1.35), ("c", "Review", "A named person approves", BLUE, 1.75), ("c", "Searchable", "Chunks, facts, relations", GREEN, 1.8)]
gp = (12.35 - 0.5 - sum(i[-1] for i in items)) / 5; xx = 0.6
pos = []
for it in items:
    w_ = it[-1]; cx_ = xx + w_ / 2; pos.append((cx_, w_))
    if it[0] == "c": fbox(s, cx_, fy_, w_, 0.62, it[1], it[2], it[3], solid=(it[1] == "Searchable"), tsize=9.5, ssize=8.5)
    else: fdia(s, cx_, fy_, w_, 0.85, it[1], it[2], 8.5)
    xx += w_ + gp
for i in range(5): arrow(s, pos[i][0] + pos[i][1] / 2 + 0.02, fy_, pos[i + 1][0] - pos[i + 1][1] / 2 - 0.02, fy_, GREY, 1.5)
flab(s, pos[3][0] + pos[3][1] / 2 - 0.05, fy_ - 0.26, "Yes", GREEN, 0.4)
arrow(s, pos[3][0], fy_ + 0.43, pos[3][0], fy_ + 0.5, AMBER, 1.3, False)
fchip(s, pos[3][0], 6.05, "No: raise a data quality issue", AMBER, 8.5)
fact_row(s, 6.32, [("1,109", "chunks"), ("447", "typed facts"), ("624", "relations"), ("564", "linked records"), ("48", "recorded conflicts")], 0.44)

# ---------------------------------------------------------------- A4 OPL library and simulator
s = app_slide("OPL library and scenario simulator", "Appendix A: prototype screens", "Prototype OPL library and simulator on the 56 OPL documents of the case data. An OPL is a one point lesson")
hh = sh(s, "oplsheet", 0.4, y0, 4.3, (0, 0, 1, 0.98), [(1, 0.3, 0.17), (2, 0.3, 0.55), (3, 0.9, 0.2)])
sh(s, "opl3d", 4.85, y0, 4.17, (0, 0, 1, 0.98), [(4, 0.3, 0.25), (5, 0.3, 0.6), (6, 0.82, 0.5), (7, 0.82, 0.85)])
ly = y0 + hh + 0.1
legend(s, 0.4, ly, 4.3, [(1, "Standard OPL header with equipment, interlock, P&ID reference and classification."), (2, "Safety precautions, tools and detailed steps, each with an acceptance check."), (3, "Related scenarios to play, and links to the P&ID, interlock and datasheet.")], 8.5)
legend(s, 4.85, ly, 4.17, [(4, "The brief gives the symptom, the OPL rule and the goal."), (5, "A 3D machine reacts to the actions: it shakes, steams or stops."), (6, "Live readouts show alarm and trip marks for each instrument."), (7, "The interlock panel shows each trip as healthy, standby or tripped.")], 8.5)
ptitle(s, 9.2, y0, 3.75, "How the simulator works", PURPLE)
fbox(s, 11.075, 1.9, 3.5, 0.56, "Operator action", "Valve move, start, reset or bypass", PURPLE, tsize=9.5, ssize=8.5)
arrow(s, 11.075, 2.18, 11.075, 2.4, GREY, 1.5)
fbox(s, 11.075, 2.7, 3.5, 0.56, "Process model", "Pressures, flows, temperatures, levels", PURPLE, tsize=9.5, ssize=8.5)
arrow(s, 11.075, 2.98, 11.075, 3.15, GREY, 1.5)
fdia(s, 11.075, 3.7, 2.4, 0.95, "Set point reached?", AMBER, 8.5)
flab(s, 11.15, 4.2, "Yes", GREEN, 0.4)
arrow(s, 11.075, 4.18, 11.075, 4.45, GREY, 1.5)
fbox(s, 11.075, 4.75, 3.5, 0.56, "Alarm or trip acts", "A bypass is logged and nothing protects", RED, tsize=9.5, ssize=8.5)
arrow(s, 11.075, 5.03, 11.075, 5.2, GREY, 1.5)
fbox(s, 11.075, 5.5, 3.5, 0.56, "Score", "Goal held for a set time", GREEN, solid=True, tsize=9.5, ssize=8.5)
box(s, 9.2, 6.2, 3.75, 0.56, TINT[PURPLE], PURPLE, [[("Score = 100, minus 20 per unsafe action, minus 12 per trip (up to 3), plus 2 per OPL step applied (up to 10). A failed run is capped at 35.", {"size": 8.5, "color": INK})]], 8.5, False, INK, "l", "m", radius=0.08, lw=1.0, margin=0.08)
for i, (n_, l_) in enumerate([("56", "OPL documents"), ("280", "procedure steps"), ("168", "troubleshooting cases")]):
    c_ = [BLUE, TEAL, ORANGE][i]
    box(s, 0.4 + i * 2.95, 6.2, 2.85, 0.56, TINT[c_], c_, [[(n_ + "  ", {"bold": True, "size": 15, "color": c_}), (l_, {"size": 9.5, "color": INK})]], 12, False, INK, "c", "m", radius=0.08, lw=1.1, margin=0.05)

# ---------------------------------------------------------------- A5 live P&ID, interlocks, start-up readiness
s = app_slide("Live P&ID, interlock library and start-up readiness", "Appendix A: prototype screens", "Prototype P&ID viewer, interlock library and readiness page. Counts are read from the application")
hh = sh(s, "pid", xs3[0], y0, w3, (0, 0, 1, 0.9), [(1, 0.6, 0.07), (2, 0.3, 0.45), (3, 0.12, 0.13)])
sh(s, "il", xs3[1], y0, w3, (0, 0, 1, 0.92), [(4, 0.3, 0.12), (5, 0.12, 0.25), (6, 0.5, 0.78)])
sh(s, "ready", xs3[2], y0, w3, (0, 0.17, 1, 1.0), [(7, 0.1, 0.55), (8, 0.3, 0.75)])
ly = y0 + hh + 0.1
legend(s, xs3[0], ly, w3, [(1, "Each sheet shows simulated live data, with a Values toggle."), (2, "Valves open and close. Closing one stops the flow downstream and trips dependent permissives."), (3, "Simulate trip on an initiator and watch the interlock effects follow.")], 8.5)
legend(s, xs3[1], ly, w3, [(4, "Eight interlock documents: 39 initiators, 34 final elements and 7 safety functions."), (5, "Voting architecture and proof test records at a glance."), (6, "Each interlock card links to its P&ID and equipment page.")], 8.5)
legend(s, xs3[2], ly, w3, [(7, "One decision per unit: GO, GO with checks or NO-GO."), (8, "Start permissives are read from the interlock logic and the live conditions.")], 8.5)
fact_row(s, 5.95, [("8", "P&IDs"), ("232", "tagged items"), ("20", "operable valves"), ("39", "initiators"), ("37", "permissives")], 0.5)
text(s, 0.4, 6.5, 12.55, 0.25, "The same interlock data feeds the assistant, the OPL simulator, the scenario player and the readiness check, so the screens cannot disagree.", 9, False, GREY)

# ---------------------------------------------------------------- A6 predictive maintenance, failure memory, scenarios
s = app_slide("Predictive maintenance, failure memory and chain reaction", "Appendix A: prototype screens", "Prototype reliability pages computed in the browser from the 211 work orders and the OPL lessons")
hh = sh(s, "predict", xs3[0], y0, w3, (0, 0, 1, 0.85), [(1, 0.5, 0.1), (2, 0.4, 0.22), (3, 0.35, 0.42)])
sh(s, "fm", xs3[1], y0, w3, (0, 0, 1, 0.85), [(4, 0.28, 0.1), (5, 0.2, 0.33), (6, 0.25, 0.6)])
sh(s, "scn", xs3[2], y0, w3, (0, 0, 0.9, 0.99), [(7, 0.5, 0.15), (8, 0.12, 0.25), (9, 0.88, 0.5)])
ly = y0 + hh + 0.1
legend(s, xs3[0], ly, w3, [(1, "A written summary of one unit: breakdowns, repair time, main cause and the next likely failure."), (2, "Tabs: failure modes, reliability measures, next 90 days, lessons and combined score."), (3, "Chance of failure in 90 days by mode, with an 80% range and the lesson that applies.")], 8.5)
legend(s, xs3[1], ly, w3, [(4, "Type a symptom and optionally filter by equipment."), (5, "Recommended actions come from the most similar past cases, with how often each recurred."), (6, "Probable root causes are counted across the matches.")], 8.5)
legend(s, xs3[2], ly, w3, [(7, "Result of the event: units tripped, units affected, outage and cost estimate."), (8, "Choose an equipment trip or a utility loss as the initiating event."), (9, "The P&IDs show which units trip and which lose supply, step by step.")], 8.5)
note_row(s, 5.0, [("Predictive page", "Shows health, risk matrix, timeline and an intervention plan for 8 units and 42 components.", ORANGE), ("Failure memory", "Matches a symptom to work orders, OPL cases and approved lessons, then ranks the actions.", TEAL), ("Chain reaction", "Replays how a trip or a utility loss spreads across the connected P&IDs.", RED)], 0.78)
fact_row(s, 5.92, [("211", "work orders analysed"), ("10", "failure modes"), ("42", "components"), ("64", "backtest forecasts")], 0.5)
text(s, 0.4, 6.5, 12.55, 0.3, "Limit: on this data a unit's own history does not predict which unit fails next (backtest AUC 0.47), so the combined score is advisory and the page ranks units by consequence.", 9, False, GREY)

# ---------------------------------------------------------------- A7 hazard simulator, site plan, replay
s = app_slide("Hazard simulator, maintenance site plan and plant replay", "Appendix A: prototype screens", "Prototype plot plan, hazard simulator, site planner and replay. Hazard results are screening estimates, not a consequence study")
hh = sh(s, "hazard3d", xs3[0], y0, w3, (0, 0, 0.85, 0.94), [(1, 0.4, 0.55), (2, 0.65, 0.3), (3, 0.82, 0.45)])
sh(s, "plan", xs3[1], y0, w3, (0, 0, 0.95, 1.0), [(4, 0.3, 0.2), (5, 0.3, 0.75), (6, 0.85, 0.82)])
sh(s, "replay", xs3[2], y0, w3, (0, 0, 1, 0.99), [(7, 0.25, 0.14), (8, 0.6, 0.37), (9, 0.5, 0.95)])
ly = y0 + hh + 0.1
legend(s, xs3[0], ly, w3, [(1, "A gas cloud drifts with the wind over the true-scale plot plan, in 2D and 3D."), (2, "Zones show 25%, 50% and 100% of the lower flammable limit, with detectors and muster points."), (3, "Inputs are hole size, wind, weather, shutdown mode and operator reaction time.")], 8.5)
legend(s, xs3[1], ly, w3, [(4, "A four-week schedule for each unit, built from routine intervals and the failure forecast."), (5, "The site on the day: crane pads, laydown areas and separation rings."), (6, "Crew hours per day against capacity.")], 8.5)
legend(s, xs3[2], ly, w3, [(7, "The date line shows breakdowns, units in maintenance and the work order in progress."), (8, "Labels name the work order at each unit, and units in breakdown turn red."), (9, "Counters: completed work orders, breakdowns, downtime and availability.")], 8.5)
note_row(s, 5.95, [("Hazard models", "Orifice release, flash and pool, Gaussian plume with transport delay, jet and pool fire, blast and muster walk.", RED), ("Planner checks", "Permits, hot work near open lines, one crane, crew capacity and confined space entry.", TEAL), ("Replay", "Steps through the history and stops inside each breakdown, so the right unit is shown.", BLUE)], 0.78)

# ---------------------------------------------------------------- A8 technical: data model and storage
s = app_slide("Data model and storage", "Appendix B: technical details", "Prototype data layer, Netlify Blobs function /api/kb and docs/DATA_MODEL.sql (25 tables)")
ptitle(s, 0.4, 1.28, 4.4, "Three storage tiers", NAVY)
tiers = [("Browser", "IndexedDB akp_kb", "Chunk list and term index rebuilt on change. Works offline.", BLUE), ("Shared store", "Netlify Blobs through /api/kb", "Collections uk, wo, fb, audit, qa. Last write wins; a base version in the request turns a newer copy into a conflict.", TEAL), ("Production target", "PostgreSQL 15 with pgvector", "25 tables, generated tsvector, GIN indexes, HNSW cosine index on vector(1536) and row-level role filter.", GREEN)]
for i, (t_, st_, d_, c_) in enumerate(tiers):
    cy = 2.3 + i * 1.5
    box(s, 0.4, cy - 0.6, 4.4, 1.2, WHITE, c_, [[(t_, {"bold": True, "size": 10.5, "color": c_})], [(st_, {"bold": True, "size": 9, "color": NAVY})], [(d_, {"size": 8.5, "color": INK})]], 9, False, INK, "l", "m", radius=0.08, lw=1.4, margin=0.12)
    if i < 2: arrow(s, 1.6, cy + 0.6, 1.6, cy + 0.9, GREY, 1.6)
text(s, 1.7, cy + 0.65, 3.1, 0.2, "Sync every few seconds" if i == 0 else "The same shapes map to SQL tables", 8.5, False, GREY)
ptitle(s, 5.0, 1.28, 3.9, "Tables by group", NAVY)
groups = [("Assets and documents", BLUE, "asset, component, document, document_version, chunk, fact, relation"), ("Operations", ORANGE, "interlock, interlock_trigger, instrument, opl, opl_case, work_order, failure_event"), ("Knowledge and governance", PURPLE, "knowledge_item, knowledge_revision, knowledge_review, qa_log, qa_citation, feedback, eval_case"), ("Other", GREY, "eval_run, audit_log, app_user, status_vocab (11 trust codes)")]
yy = 1.62
for t_, c_, d_ in groups:
    h_ = 0.9 if t_ != "Other" else 0.72
    box(s, 5.0, yy, 3.9, h_, TINT[c_], c_, [[(t_, {"bold": True, "size": 10, "color": c_})], [(d_, {"size": 9, "color": INK})]], 9, False, INK, "l", "m", radius=0.08, lw=1.2, margin=0.12)
    yy += h_ + 0.1
ptitle(s, 9.1, 1.28, 3.85, "Anatomy of one chunk", NAVY)
crow = [("chunk_id", "il:TJC-LLD-IL-KC-4501#03"), ("kind, record", "il, interlock sheet"), ("title, section", "Interlock | KC-4501 | T3"), ("text", "VSHH-4505 80 um, 2oo3 ..."), ("tags", "{KC-4501, VSHH-4505}"), ("status, trust", "approved, 1.00"), ("revision, date", "Rev 3, 2025-02-11"), ("acl roles", "all roles"), ("hash, tokens", "cyrb53, 112"), ("embedding", "vector(1536), when connected")]
for i, (k_, v_) in enumerate(crow):
    y = 1.62 + i * 0.42
    box(s, 9.1, y, 1.2, 0.38, TINT[GREEN], MID, [[(k_, {"bold": True, "size": 8.5, "color": GREEN})]], 8.5, True, GREEN, "l", "m", radius=0.03, margin=0.06, lw=0.8)
    box(s, 10.3, y, 2.65, 0.38, WHITE, MID, [[(v_, {"size": 8.5, "color": INK})]], 8.5, False, INK, "l", "m", radius=0.03, margin=0.06, lw=0.8)
box(s, 0.4, 5.95, 12.55, 0.38, TINT[AMBER], AMBER, [[("Indexes: ", {"bold": True, "size": 9, "color": ORANGE}), ("GIN on the tsvector and on tags, B-tree on asset and status, HNSW (cosine) on the embedding. Embeddings are recomputed only when the content hash changes.", {"size": 9, "color": INK})]], 9, False, INK, "l", "m", radius=0.06, lw=1.0, margin=0.12)
fact_row(s, 6.4, [("1,109", "chunks"), ("447", "typed facts"), ("624", "relations"), ("564", "linked records"), ("98", "documents"), ("211", "work orders")], 0.4)

# ---------------------------------------------------------------- A9 technical: retrieval, ranking and confidence
s = app_slide("Retrieval, ranking and confidence algorithms", "Appendix B: technical details", "Prototype retrieval index and assistant. Parameters are the values used in the running application")
chain = [("Question", "Tags found by pattern; equipment inferred from names and aliases", BLUE), ("Tokenise", "Stemming, synonyms and plant stop words; tags kept whole", BLUE), ("Score", "BM25 over weighted fields; k1 1.4, b 0.75", TEAL), ("Re-weight", "Status trust, source kind, equipment scope and role fit", TEAL), ("Fuse", "With embeddings: 0.65 x BM25F + 0.35 x cosine x 40", PURPLE), ("Select", "Role filter, at most 2 passages per document", GREEN)]
cw = 1.9; cg = (12.55 - 6 * cw) / 5
for i, (t_, d_, c_) in enumerate(chain):
    x = 0.4 + i * (cw + cg)
    fbox(s, x + cw / 2, 1.8, cw, 0.95, f"{i + 1}  {t_}", d_, c_, tsize=9.8, ssize=8.8)
    if i < 5: arrow(s, x + cw + 0.02, 1.8, x + cw + cg - 0.02, 1.8, GREY, 1.5)
ptitle(s, 0.4, 2.45, 4.1, "Field weights in BM25F", BLUE)
for i, (f_, w2) in enumerate([("Equipment tag", 2.5), ("Title", 2.0), ("Section heading", 1.5), ("Body text", 1.0)]):
    y = 2.85 + i * 0.46
    text(s, 0.45, y, 1.5, 0.34, f_, 9, False, INK, anchor="m")
    box(s, 2.0, y + 0.07, 0.75 * w2, 0.2, BLUE, None, None, shape=MSO_SHAPE.RECTANGLE); text(s, 2.05 + 0.75 * w2, y, 0.6, 0.34, f"x {w2}", 9, True, NAVY, anchor="m")
text(s, 0.45, 5.2, 4.05, 0.7, [[("Why BM25F first: ", {"bold": True, "color": NAVY}), "plant text is short and full of identifiers that exact matching handles well. The weights stop a long body from outranking a heading that names the tag."]], 8.8, False, INK, line=1.03)
ptitle(s, 4.7, 2.45, 4.1, "Multipliers on the BM25F score", TEAL)
mult = [("Status trust", "0.35 to 1.00", TEAL), ("Source-kind prior", "0.55 to 1.05", TEAL), ("Equipment in scope", "x 1.45", GREEN), ("Other equipment", "x 0.70", RED), ("Role fit", "x 1.10 to 1.15", BLUE)]
for i, (n_, v, c_) in enumerate(mult):
    y = 2.85 + i * 0.46
    box(s, 4.7, y, 4.1, 0.36, WHITE, MID, None, radius=0.05, lw=0.8)
    text(s, 4.8, y, 2.3, 0.36, n_, 9, True, NAVY, anchor="m"); pill(s, 7.2, y + 0.06, 1.5, v, TINT[c_], c_, 0.24, 8.5)
text(s, 4.7, 5.2, 4.1, 0.5, "Kind priors range from 1.05 for interlock and OPL records down to 0.55 for data-quality notes.", 8.8, False, INK, line=1.03)
ptitle(s, 9.0, 2.45, 3.95, "Confidence score, 0 to 100", PURPLE)
for i, (n_, v, c_) in enumerate([("Question words found", 45, TEAL), ("Best match strength", 22, BLUE), ("Approval status", 15, GREEN), ("Source agreement", 10, PURPLE), ("Number of sources", 8, ORANGE)]):
    y = 2.85 + i * 0.46
    text(s, 9.05, y, 1.65, 0.34, n_, 9, False, INK, anchor="m"); box(s, 10.75, y + 0.07, 1.6 * v / 45, 0.2, c_, None, None, shape=MSO_SHAPE.RECTANGLE); text(s, 10.8 + 1.6 * v / 45, y, 0.5, 0.34, str(v), 9, True, NAVY, anchor="m")
text(s, 9.05, 5.2, 3.9, 0.62, "Caps apply after weighting: 60 for a broad question, 45 if under half the question words are found, 40 for different equipment, 50 if no single passage covers the question.", 8.5, False, INK, line=1.0)
for i, (t_, c_) in enumerate([("High: 70 and above", GREEN), ("Medium: 45 to 69", AMBER), ("Low: below 45", RED)]): pill(s, 9.05 + i * 1.3, 5.95, 1.25, t_, TINT[c_], c_ if c_ != AMBER else ORANGE, 0.24, 8)
box(s, 0.4, 5.95, 8.4, 0.8, TINT[BLUE], BLUE, [[("Number and quote check. ", {"bold": True, "size": 9.5, "color": NAVY}), ("Each figure with a unit (barg, degC, mm/s, m3/h, kW, IDR or %) is looked up in the cited text. A figure that cannot be found is listed under the answer and the confidence drops. Calculated tools report their own confidence.", {"size": 9, "color": INK})]], 9, False, INK, "l", "m", radius=0.08, lw=1.1, margin=0.12)

# ---------------------------------------------------------------- A10 technical: reliability algorithms
s = app_slide("Reliability algorithms and their validation", "Appendix B: technical details", "Prototype reliability analytics on the 211 work orders; 63 breakdown and corrective jobs behind the failure-mode view")
steps10 = [("Classify", "10 failure modes read from the problem, cause and action text", BLUE), ("Risk priority", "RPN = Severity x Occurrence x Detection", TEAL), ("Forecast", "Gamma-Poisson chance of failure, with an 80% range", ORANGE), ("Combine", "Ridge logistic regression on 8 features", PURPLE), ("Validate", "Rolling-origin backtest of 64 forecasts", RED)]
cw = 2.3; cg = (12.55 - 5 * cw) / 4
for i, (t_, d_, c_) in enumerate(steps10):
    x = 0.4 + i * (cw + cg)
    fbox(s, x + cw / 2, 1.8, cw, 0.9, f"{i + 1}  {t_}", d_, c_, tsize=9.8, ssize=8.8)
    if i < 4: arrow(s, x + cw + 0.02, 1.8, x + cw + cg - 0.02, 1.8, GREY, 1.5)
def card2(x, y, w, h, title, lines, c_):
    box(s, x, y, w, h, WHITE, c_, None, radius=0.06, lw=1.2); box(s, x, y, w, 0.05, c_, None, None, shape=MSO_SHAPE.RECTANGLE)
    text(s, x + 0.1, y + 0.1, w - 0.2, 0.26, title, 10, True, NAVY)
    bullet(s, x + 0.1, y + 0.4, w - 0.2, h - 0.45, lines, 8.8, c_, 3)
card2(0.4, 2.45, 4.1, 2.3, "Risk priority number", ["Severity: percentile of downtime (55%) and cost (45%), scaled 1 to 10.", "Occurrence: 1 + 2.4 log2(1 + 3 x rate per year), at most 10.", "Detection: 1 + 9 x (1 - share found early), minus 1.2 if an OPL covers the mode."], TEAL)
card2(4.62, 2.45, 4.1, 2.3, "Gamma-Poisson forecast", ["Prior from the fleet rate: shape 1.5, rate 1.5 divided by the fleet rate.", "After n own events in T days: shape 1.5 + n, rate prior + T.", "Chance in h days = 1 - exp(-mean rate x h). Few events shrink toward the fleet rate."], ORANGE)
card2(8.84, 2.45, 4.1, 2.3, "Combined score", ["Eight standardised features, such as recent breakdowns, trend, repeats and overdue preventive work.", "300 gradient-descent iterations with an L2 penalty.", "The backtest trains on the past and forecasts the next 90 days, then advances 20 days."], PURPLE)
for i, (n_, l_, c_) in enumerate([("64", "forecasts tested", BLUE), ("0.26", "Brier score", TEAL), ("0.47", "AUC; 0.50 is chance", RED)]):
    y = 4.95 + i * 0.6
    box(s, 0.4, y, 3.0, 0.54, TINT[c_], c_, [[(n_ + "  ", {"bold": True, "size": 15, "color": c_}), (l_, {"size": 9, "color": INK})]], 12, False, INK, "c", "m", radius=0.08, lw=1.1, margin=0.05)
ptitle(s, 3.6, 4.9, 4.6, "Failure modes by risk priority number", NAVY, 0.27)
fmx = [("Seal or gasket leak", 369, RED), ("Valve or actuator", 232, ORANGE), ("Blocked or fouled", 226, ORANGE), ("Vibration, misalignment", 216, AMBER), ("Bearing or lubrication", 146, AMBER), ("Instrument or analyser", 129, TEAL)]
for i, (m_, r_, c_) in enumerate(fmx):
    y = 5.22 + i * 0.26
    text(s, 3.6, y, 1.75, 0.25, m_, 8.5, False, INK, anchor="m"); box(s, 5.4, y + 0.05, 2.2 * r_ / 369, 0.15, c_, None, None, shape=MSO_SHAPE.RECTANGLE); text(s, 5.45 + 2.2 * r_ / 369, y, 0.5, 0.25, str(r_), 8.5, True, NAVY, anchor="m")
box(s, 8.4, 4.9, 4.55, 1.8, TINT[RED], RED, [[("Limit stated in the product. ", {"bold": True, "size": 9.5, "color": RED}), ("On this data a unit's own history does not predict which unit fails next, so the page ranks units by consequence and shows the combined score as advisory. More history or live condition data would improve it, and the pilot is the place to collect them.", {"size": 9, "color": INK})]], 9, False, INK, "l", "m", radius=0.08, lw=1.1, margin=0.12)
