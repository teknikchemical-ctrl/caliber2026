# ======================================================= APPENDIX
AN = [0]
def app_slide(title, sub=None, source=None):
    AN[0] += 1
    s = blank(prs)
    frame(s, len(prs.slides), f"A{AN[0]}  {title}", sub, None, source)
    box(s, 11.6, 0.12, 1.4, 0.24, TINT[GREY], None, ["APPENDIX"], 8, True, GREY, "c", "m", radius=0.12)
    return s

# ---------- A1 architecture
s = app_slide("System architecture: five layers on one tag-keyed knowledge core", "How data flows from plant sources to the people who use it, with governance across every layer",
              "Asset Knowledge Platform architecture notes (docs/ARCHITECTURE.md in the prototype repository)")
L = [("1  Sources", BLUE, ["SOPs, OPLs, tacit notes", "Datasheets", "P&ID, GA, plot plan", "Interlock logic (C&E)", "Maintenance logs, RCA", "Incident reports", "Live data (DCS, historian)"]),
     ("2  Industrial Data Ops", TEAL, ["AI document ingestion", "Structure and tag mapping", "Quality gates, conflicts", "Secret masking", "Owner, version, status", "Approval workflow"]),
     ("3  Knowledge core", GREEN, ["Documents and chunks", "Search index (BM25 + vectors)", "Facts: tags, set points, parts", "Relations between records", "Failure memory, lessons", "Answer, audit and feedback log"]),
     ("4  AI services", PURPLE, ["Question router", "Retrieval and re-ranking", "20 computed tools", "LLM drafting, tool calls", "Verification and confidence", "Reliability and hazard models"]),
     ("5  Experiences", ORANGE, ["AI assistant", "Equipment 360, 2D and 3D", "P&ID, interlock, OPL simulators", "Maintenance and failure memory", "Site planner and replay", "Hazard and readiness"])]
cw = 2.3; gap = 0.28
for i, (t, c_, items) in enumerate(L):
    x = 0.35 + i * (cw + gap)
    banner(s, x, 1.5, cw, t, c_, 0.38, 10.5)
    panel(s, x, 1.92, cw, 3.6, TINT[c_], WHITE)
    for j, it in enumerate(items):
        box(s, x + 0.1, 2.0 + j * 0.5, cw - 0.2, 0.43, WHITE, MID, [it], 9, True, NAVY, "c", "m", radius=0.07)
    if i < 4: arrow(s, x + cw + 0.02, 3.7, x + cw + gap - 0.02, 3.7, GREY, 2.0)
box(s, 0.35, 5.62, 12.65, 0.4, NAVY, None, [[("Cross-cutting governance:  ", {"bold": True, "color": "8FD3CC"}), "roles and access  |  approval before trust  |  audit trail  |  prompt-injection guards  |  retention and region  |  read-only toward plant systems"]], 9.5, False, WHITE, "c", "m", radius=0.06)
for i, (t, d, c_) in enumerate([("Prototype today", "Single-file web app, Netlify functions and Blobs, free Gemini model, local fallback search", BLUE), ("Target production", "Postgres with pgvector, queue for ingestion, SSO, EDMS and AIMS adapters, Company-approved model", GREEN)]):
    x = 0.35 + i * 6.4
    box(s, x, 6.12, 6.25, 0.7, TINT[c_], None, [[(t + ":  ", {"bold": True, "color": c_}), d]], 9.3, False, INK, "l", "m", radius=0.08, margin=0.12)
notes(s, "Architecture. Five layers left to right, with the equipment tag as the key that joins them. Governance applies to every layer. The prototype runs as a single-file web app with serverless functions; the production target swaps in Postgres with vectors, SSO and the Company's own systems.")

# ---------- A2 assistant sequence
s = app_slide("How the AI assistant answers: route, retrieve, compute, draft, verify", "Every step is logged; the language model only words what the evidence already says",
              "Prototype assistant pipeline (docs/AI_PROVIDER_CONTRACT.md, docs/PROMPT_TEMPLATE.md)")
lanes = [("Browser (the app)", 0.35, 4.0, TINT[BLUE], BLUE), ("Serverless function", 4.5, 3.0, TINT[TEAL], TEAL), ("Language model", 7.65, 2.3, TINT[PURPLE], PURPLE), ("Data and logs", 10.1, 2.9, TINT[AMBER], ORANGE)]
for t, x, w_, f_, c_ in lanes:
    banner(s, x, 1.5, w_, t, c_, 0.34, 10)
    panel(s, x, 1.88, w_, 4.3, f_, WHITE)
def node(x, y, w_, h_, t, d=None, fill=WHITE, c=NAVY):
    box(s, x, y, w_, h_, fill, MID, [[(t, {"bold": True, "size": 9.5, "color": c})]] + ([[(d, {"size": 8.3, "color": GREY})]] if d else []), 9, False, INK, "c", "m", radius=0.07)
node(0.47, 1.98, 3.76, 0.66, "1  Question, role, equipment in view", "Context comes from the page the user is on")
node(0.47, 2.74, 3.76, 0.66, "2  Router", "Picks a computed tool (KPI, forecast, hazard) or search")
node(0.47, 3.5, 3.76, 0.66, "3  Retrieve", "Keyword and meaning search; approved sources, role-limited")
node(0.47, 4.26, 3.76, 0.66, "4  Compute", "Tools calculate figures from work orders and records")
node(0.47, 5.02, 3.76, 1.0, "7  Verify and show", "Numbers and quotes checked against source text; confidence scored; sources, status and revision listed", TINT[BLUE], BLUE)
node(4.62, 1.98, 2.76, 0.66, "5  Proxy", "Rate limits; the key stays on the server")
node(4.62, 2.74, 2.76, 0.66, "Prompt", "Question, numbered passages, tool results, rules")
node(4.62, 3.5, 2.76, 0.66, "Stream back", "Tokens reach the page as they arrive")
node(4.62, 4.26, 2.76, 0.66, "Fallback", "If the model fails, local retrieval answers")
node(7.77, 1.98, 2.06, 0.9, "6  Draft", "Writes only from the passages given, with [n] markers")
node(7.77, 3.0, 2.06, 0.9, "Tool calls", "May ask for a tool by name; the page runs it")
node(7.77, 4.02, 2.06, 0.9, "Any provider", "Gemini free tier today; contract allows others")
node(10.22, 1.98, 2.66, 0.66, "Knowledge store", "Documents, versions, approvals")
node(10.22, 2.74, 2.66, 0.66, "Answer log", "Question, sources, confidence")
node(10.22, 3.5, 2.66, 0.66, "Feedback queue", "Useful, incomplete, wrong")
node(10.22, 4.26, 2.66, 0.66, "Audit trail", "Who, what, when")
node(10.22, 5.02, 2.66, 1.0, "Evaluation set", f"{D['evals']} questions run on every build; fails the build on a low score")
for yy in (2.64, 3.4, 4.16, 4.92): arrow(s, 2.35, yy, 2.35, yy + 0.1, BLUE, 1.6)
arrow(s, 4.23, 4.6, 4.62, 2.3, BLUE, 1.6); arrow(s, 7.38, 2.3, 7.77, 2.4, BLUE, 1.6)
text(s, 0.35, 6.3, 12.6, 0.55, [[("Guardrails:  ", {"bold": True, "color": RED}), "no evidence, no answer  |  safety bypass requests refused with the reason  |  conflicting or draft sources flagged on the answer  |  retrieved text treated as data, never as instructions"]], 9.5, False, INK, line=1.02)

# ---------- A3 data sources
s = app_slide("Data sources: every source has a purpose, an owner and a business reason", "Baseline data from the case, plus sources we propose to add; a few trusted sources connected well beat many connected badly",
              "Case book data table; prototype counts")
rows = [["Source", "What it gives", "Business justification", "Status"],
        ["SOPs and OPLs (56)", "Steps, safety notes, tacit lessons", "Fewer wrong steps; keeps SME experience", "Loaded"],
        ["Datasheets (8)", "Design limits, materials, ratings", "One place for trusted specifications", "Loaded"],
        ["P&IDs, GA drawings, plot plans (24)", "Equipment, tags, layout, hazards", "Ties every tag to its drawing and location", "Loaded"],
        ["Interlock logic (8 sets, 84 instruments)", "Causes, effects, permissives", "Answers what trips and why, with the exact set point", "Loaded"],
        ["Maintenance history (211 WOs)", "Failures, root causes, cost, downtime", "Failure memory, KPIs, prediction, site planning", "Loaded"],
        ["Incident and RCA reports", "Lessons learned", "Prevents repeat events", "Add in pilot"],
        ["EDMS", "Controlled document revisions", "Single source of truth for versions", "Adapter ready"],
        ["AIMS", "Work orders and asset hierarchy", "Live history; draft work orders go back for approval", "Adapter ready"],
        ["Historian or DCS values", "Live tag values", "Context for troubleshooting and prediction", "Hook in place"],
        ["Digital twin", "Asset model and 3D", "Navigate by equipment and place", "Planned"]]
gs = table(s, 0.35, 1.5, 12.65, [3.2, 3.0, 4.6, 1.3], rows, 10.5, rowh=0.42, header_fill=NAVY)
text(s, 0.35, 6.25, 12.6, 0.6, "Every added source needs an owner, a refresh rule and a reason. The case asks for a well-justified data architecture rather than more data, so each row above states what decision it improves.", 10, False, GREY)

# ---------- A4 integrations
s = app_slide("Integration: EDMS, AIMS, digital twin and plant data feed one core, read-only first", "Same contract for every source: a new system is one adapter, with no change to the knowledge core",
              "Architecture notes; adapters are specified, not yet connected to Company systems")
box(s, 5.15, 2.4, 3.1, 2.4, NAVY, None, [[("Asset Knowledge Platform", {"bold": True, "size": 14, "color": WHITE})], [("Knowledge core + assistant", {"size": 10, "color": "DCE8F5"})], [("", {})], [("The equipment tag joins every record", {"size": 10, "color": "8FD3CC"})]], 12, False, WHITE, "c", "m", radius=0.1)
ints = [("EDMS", "Documents and revisions", "Pull on a schedule; keep revision and status", 0.5, 1.6, "doc"), ("AIMS", "Work orders, asset tree", "Pull history; push approved draft work orders", 0.5, 3.55, "wrench"),
        ("Historian or DCS", "Live tag values", "Read only, one hook: value, unit, status", 9.8, 1.6, "chart"), ("Digital twin", "Asset model and 3D", "Link by tag; open the model from any answer", 9.8, 3.55, "factory")]
for t, d, m, x, y, ic in ints:
    panel(s, x, y, 3.0, 1.3, WHITE, "F0C27B"); pic(s, ic, x + 0.1, y + 0.12, 0.45, ORANGE)
    text(s, x + 0.65, y + 0.1, 2.3, 0.3, t, 12, True, ORANGE); text(s, x + 0.65, y + 0.4, 2.3, 0.3, d, 9.5, True, INK)
    text(s, x + 0.1, y + 0.78, 2.8, 0.5, m, 9, False, GREY, line=1.0)
arrow(s, 3.5, 2.25, 5.15, 3.0, ORANGE, 2); arrow(s, 3.5, 4.2, 5.15, 4.2, ORANGE, 2); arrow(s, 9.8, 2.25, 8.25, 3.0, ORANGE, 2); arrow(s, 9.8, 4.2, 8.25, 4.2, ORANGE, 2)
for i, (t, d) in enumerate([("Single sign-on", "Roles come from the company directory"), ("Read first, write later", "Writes are drafts that a person approves"), ("One contract per source", "New source = one adapter"), ("Data stays in the tenant", "Region and retention set by the Company")]):
    x = 0.35 + i * 3.2
    box(s, x, 5.5, 3.1, 1.1, TINT[BLUE], None, [[(t, {"bold": True, "size": 11, "color": NAVY})], [(d, {"size": 9.5, "color": INK})]], 10, False, INK, "c", "m", radius=0.08)
