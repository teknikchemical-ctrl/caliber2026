# ======================================================= APPENDIX A1 to A7: map, database, Gemini, assistant, retrieval, ingestion, failure memory
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

def feat_head(s, x, y, w, name, tags):
    """feature header strip with the key questions it answers"""
    box(s, x, y, w, 0.3, TINT[BLUE], None, None, radius=0.05)
    text(s, x + 0.08, y, w - 1.4, 0.3, name, 9.5, True, NAVY, anchor="m")
    for i, (t, c_) in enumerate(tags): pill(s, x + w - 1.35 + i * 0.45, y + 0.05, 0.42, t, c_, WHITE, 0.2, 7)

# ---------- A1 feature connection map
s = app_slide("How the Features Connect: {{Data Flows Between Twenty-Two Modules}}", "Each arrow is a real data hand-off in the prototype; colours show the family a module belongs to",
              "Prototype module registry and call graph (build.py module order, regMod dependencies)")
GC = {"data": BLUE, "ask": TEAL, "rel": ORANGE, "ops": PURPLE, "safe": RED}
NW, NH = 1.95, 0.6
def pos(c, r): return (0.35 + c * 2.62, 1.55 + r * 1.03)
nodes = {"doc": (0, 0, "Documents", "EDMS: 98 files", "data"), "wo": (0, 1, "Work orders", "AIMS: 211", "data"), "opl": (0, 2, "OPL and tacit notes", "56 lessons, 280 steps", "data"), "il": (0, 3, "Interlock logic", "84 instruments, C&E", "data"), "live": (1, 4, "Live tag values", "DCS or historian hook", "data"),
         "ing": (1, 0, "Ingestion + Studio", "Gemini extract, approve", "data"), "qual": (0, 4, "Quality register", "48 conflicts, owners", "data"),
         "ast": (2, 0, "AI assistant", "Gemini Flash + 20 tools", "ask"), "fm": (2, 1, "Failure memory", "cases, causes, actions", "rel"), "pid": (2, 2, "Live P&ID", "valves, flow, trips", "ops"), "ilib": (2, 3, "Interlock library", "C&E, proof tests", "ops"), "d3": (2, 4, "3D plant, equipment", "8 models, pick parts", "ops"),
         "e360": (3, 0, "Equipment 360", "datasheet, documents", "ask"), "pred": (3, 1, "Predictive", "RPN, forecast, score", "rel"), "scn": (3, 2, "Chain reaction", "units tripped, hours", "ops"), "ready": (3, 3, "Start-up readiness", "GO / NO-GO", "safe"), "haz": (3, 4, "Hazard simulator", "cloud, fire, muster", "safe"),
         "rep": (4, 0, "Reports, KPIs", "dossier, outlook", "ask"), "plan": (4, 1, "Site plan, replay", "permits, clashes", "safe"), "sim": (4, 2, "OPL simulator", "fault, procedure, bad practice", "ops"), "aud": (4, 3, "Audit, notifications", "sign-off, My work", "data")}
box(s, 1.4 + 0.0, 1.55, 0.0, 0.0, WHITE, None, None) if False else None
# database as a tall node in column 1
dbx, dby = pos(1, 1); box(s, dbx, dby, NW, 2.65, TINT[GREEN], GREEN, None, radius=0.1, lw=1.5)
text(s, dbx, dby + 0.05, NW, 0.25, "Knowledge database", 10, True, GREEN, "c")
for j, t in enumerate(["1,109 passages + index", "447 typed facts", "624 relations", "operating records", "knowledge items", "audit and Q&A log"]):
    box(s, dbx + 0.12, dby + 0.36 + j * 0.37, NW - 0.24, 0.31, WHITE, MID, [t], 7.3, True, NAVY, "c", "m", radius=0.15, margin=0.02)
NP = {}
for k, (c, r, t, d, g) in nodes.items():
    x, y = pos(c, r); NP[k] = (x, y)
    box(s, x, y, NW, NH, WHITE, GC[g], [[(t, {"bold": True, "size": 8.5, "color": NAVY})], [(d, {"size": 6.8, "color": GREY})]], 8, False, INK, "c", "m", radius=0.08, lw=1.4, margin=0.04)
    box(s, x, y, 0.07, NH, GC[g], None, None, shape=MSO_SHAPE.RECTANGLE)
DBR = (dbx + NW, dby + 1.3); DBL = (dbx, dby + 1.3)
def R(k): x, y = NP[k]; return (x + NW, y + NH / 2)
def L(k): x, y = NP[k]; return (x, y + NH / 2)
def T(k): x, y = NP[k]; return (x + NW / 2, y)
def B(k): x, y = NP[k]; return (x + NW / 2, y + NH)
def edge(p1, p2, lab, col=GREY, lpos=.5, dash=False, off=(0, -0.12), w=1.2):
    link(s, p1[0], p1[1], p2[0], p2[1], lab, col, w, True, dash, lpos, 6.6, 1.05, off)
edge(R("doc"), L("ing"), "parse, extract", BLUE, .5)
edge(R("ing"), (dbx + NW / 2, dby), "facts, passages", BLUE, .5, off=(0.0, -0.1)) if False else None
arrow(s, NP["ing"][0] + NW / 2, NP["ing"][1] + NH, dbx + NW / 2, dby, BLUE, 1.4); text(s, dbx + NW / 2 + 0.03, NP["ing"][1] + NH + 0.0, 0.9, 0.2, "facts, passages", 6.6, False, INK)
edge(R("wo"), (dbx, dby + 0.5), "records", BLUE, .5)
edge(R("opl"), (dbx, dby + 1.3), "lessons, steps", BLUE, .5)
edge(R("il"), (dbx, dby + 2.1), "triggers, limits", BLUE, .5)
edge(R("live"), (NP["pid"][0] - 0.0, NP["pid"][1] + 0.5) if False else (dbx + NW / 2 + 0.0, dby + 2.65 + 0.6), "", BLUE, .5) if False else None
arrow(s, R("live")[0], R("live")[1], L("d3")[0], L("d3")[1], BLUE, 1.2, True, True); text(s, R("live")[0] + 0.02, R("live")[1] - 0.2, 0.7, 0.2, "live state", 6.6, False, INK)
arrow(s, R("qual")[0], R("qual")[1] - 0.1, dbx + 0.05, dby + 2.6, ORANGE, 1.3); text(s, R("qual")[0] + 0.0, R("qual")[1] - 0.34, 0.9, 0.2, "open conflicts", 6.6, False, INK)
edge((dbx + NW, dby + 0.2), L("ast"), "evidence", TEAL, .5, off=(0, -0.13))
edge((dbx + NW, dby + 0.8), L("fm"), "similar cases", ORANGE, .5)
edge((dbx + NW, dby + 1.45), L("pid"), "tags, valves", PURPLE, .5)
edge((dbx + NW, dby + 2.1), L("ilib"), "C&E matrix", PURPLE, .5)
edge(R("fm"), L("pred"), "modes, lessons", ORANGE, .5)
edge(R("pid"), L("scn"), "valve, trip state", PURPLE, .5)
edge(R("ilib"), L("ready"), "permissives", RED, .5)
edge(R("ast"), L("e360"), "opens record", TEAL, .5)
edge(B("pred"), T("scn"), "risk exposure", ORANGE, .5, off=(0.55, 0))
edge(R("pred"), L("plan"), "condition checks", ORANGE, .5)
edge(R("scn"), L("sim"), "trip logic", PURPLE, .5)
edge(R("ready"), L("aud"), "sign-off", RED, .5)
edge(R("haz"), (NP["plan"][0] + NW / 2, NP["plan"][1] + NH), "separation distance", RED, .35, off=(0.25, 0.1)) if False else None
hx = NP["haz"][0] + NW + 0.3
arrow(s, R("haz")[0], R("haz")[1], hx, R("haz")[1], RED, 1.2, False); arrow(s, hx, R("haz")[1], hx, L("plan")[1] + 0.2, RED, 1.2, False); arrow(s, hx, L("plan")[1] + 0.2, NP["plan"][0], L("plan")[1] + 0.2, RED, 1.2, True)
text(s, hx + 0.03, 3.6, 0.45, 0.8, ["zones", "set the", "hot work", "gap"], 6.2, False, INK, line=0.9)
edge(B("pid"), T("ilib"), "", PURPLE, .5)
edge(B("ilib"), T("d3"), "", PURPLE, .5)
box(s, 0.35, 6.28, 12.65, 0.52, LIGHT, MID, None, radius=0.06)
for i, (g, t) in enumerate([("data", "Data and governance"), ("ask", "Answers"), ("rel", "Reliability"), ("ops", "Operations and simulation"), ("safe", "Safety and planning")]):
    xx = 0.5 + i * 2.45
    box(s, xx, 6.43, 0.14, 0.14, GC[g], None, None, shape=MSO_SHAPE.OVAL); text(s, xx + 0.2, 6.38, 2.2, 0.24, t, 8, True, NAVY, anchor="m")
text(s, 0.45, 6.62, 12.4, 0.2, "Reports and Performance read from every module; Settings, sync, roles and the guided tour sit around the whole map (appendix A19).", 7.3, False, GREY)

# ---------- A2 database
s = app_slide("The Database: {{One Chunk-and-Fact Model}} in the Browser, a Shared Store Today, PostgreSQL With pgvector as the Target", "Every record becomes a chunk with a stable id, a status, a trust weight and an access list; numbers become typed facts; links become relations",
              "Prototype data layer (dl.js, facts.js, sync.js), Netlify Blobs functions (kb.mjs) and the SQL schema in docs/DATA_MODEL.sql")
tiers = [("Browser", "akp_kb in IndexedDB (localStorage fallback)", ["In-memory chunk list and term index, rebuilt when data changes", "Knowledge items, audit trail, feedback, answer log, evaluation runs, embeddings cache", "Works offline as a plain file"], BLUE, "gear"),
         ("Shared store", "Netlify Blobs through /api/kb", ["Collections: uk, wo, fb, audit, qa", "Last write wins; a base version in the request turns a newer server copy into a conflict", "Tombstones propagate deletes; optional access codes; polling for changes"], TEAL, "cloud"),
         ("Production target", "PostgreSQL 15 with pgvector and pg_trgm", ["25 tables, generated tsvector with GIN index, HNSW cosine index on vector(1536)", "Status vocabulary with trust weights, versions with validity dates", "Row-level role filter through acl_roles"], GREEN, "db")]
for i, (t, sub, bl, c_, ic) in enumerate(tiers):
    y = 1.5 + i * 1.5
    gbanner(s, 0.35, y, 3.55, f"{t}", c_, {BLUE: "4FA9CE", TEAL: "4DBBA9", GREEN: "6CC48D"}[c_], 0.3, 10, "l")
    panel(s, 0.35, y + 0.3, 3.55, 1.12, WHITE, c_)
    text(s, 0.43, y + 0.32, 3.4, 0.2, sub, 7.6, True, c_)
    text(s, 0.43, y + 0.53, 3.4, 0.9, [[("■ ", {"color": c_, "size": 5}), b] for b in bl], 7, False, INK, line=0.98, space=1)
    if i < 2: arrow(s, 2.1, y + 1.42, 2.1, y + 1.5, GREY, 1.6)
text(s, 0.35, 6.0, 3.55, 0.8, [[("Sync: ", {"bold": True, "color": NAVY}), "the page pulls the shared revision, merges per item by timestamp and pushes local edits. If /api/health is unreachable the app keeps working from browser storage."]], 7.4, False, INK, line=1.02)
# ER diagram
EX0 = 4.1
groups = [("Assets and documents", BLUE, [("asset", 0.0, 0.0), ("component", 0.0, 0.52), ("document", 1.35, 0.0), ("document_version", 1.35, 0.52), ("chunk", 2.7, 0.26), ("fact", 4.05, 0.0), ("relation", 4.05, 0.52)], 0.0),
          ("Operations", ORANGE, [("interlock", 0.0, 0.0), ("interlock_trigger", 0.0, 0.52), ("instrument", 1.35, 0.0), ("work_order", 1.35, 0.52), ("failure_event", 2.7, 0.52), ("opl", 2.7, 0.0), ("opl_case", 4.05, 0.0)], 1.38),
          ("Knowledge and governance", PURPLE, [("knowledge_item", 0.0, 0.0), ("knowledge_revision", 0.0, 0.52), ("knowledge_review", 1.35, 0.26), ("qa_log", 2.7, 0.0), ("qa_citation", 2.7, 0.52), ("feedback", 4.05, 0.0), ("eval_case", 4.05, 0.52)], 2.76)]
for gname, c_, ents, gy in groups:
    y0 = 1.5 + gy
    gbanner(s, EX0, y0, 4.9 + 0.4, gname, c_, {BLUE: "4FA9CE", ORANGE: "F0A15B", PURPLE: "9B84DD"}[c_], 0.26, 9, "l")
    for nm, dx, dy in ents:
        box(s, EX0 + dx, y0 + 0.3 + dy, 1.3, 0.44, TINT[c_], c_, [[(nm, {"bold": True, "size": 7.6, "color": NAVY})]], 8, False, INK, "c", "m", radius=0.06, lw=1.0, margin=0.02)
extra = [("eval_run, audit_log, app_user, status_vocab", "also in the schema")]
text(s, EX0, 5.62, 5.3, 0.3, "Also: eval_run, audit_log, app_user, status_vocab (11 trust codes). Keys: chunk_id = kind:record#ordinal, tag is the common join key.", 7, False, GREY)
# relations drawn between a few boxes
# chunk anatomy and index figure
banner(s, 9.6, 1.5, 3.4, "Anatomy of one chunk", NAVY, 0.3, 9.5)
fields = [("chunk_id", "il:TJC-LLD-IL-KC-4501#03"), ("kind / record", "il / interlock sheet"), ("title, section", "Interlock | KC-4501 | T3"), ("text", "VSHH-4505 80 um, 2oo3 ..."), ("tags", "{KC-4501, VSHH-4505}"), ("status, trust", "approved, 1.00"), ("revision, date", "Rev 3, 2025-02-11"), ("acl roles", "all roles"), ("hash, tokens", "cyrb53, 112"), ("embedding", "vector(1536) when connected")]
for i, (k, v) in enumerate(fields):
    y = 1.84 + i * 0.3
    box(s, 9.6, y, 1.2, 0.27, TINT[GREEN], None, [k], 7.2, True, GREEN, "l", "m", radius=0.04, margin=0.06); box(s, 10.82, y, 2.18, 0.27, WHITE, MID, [v], 7, False, INK, "l", "m", radius=0.04, margin=0.06)
panel(s, 9.6, 4.9, 3.4, 0.85, "FFF6E5", "F0C27B")
text(s, 9.68, 4.92, 3.25, 0.85, [[("Indexes: ", {"bold": True, "color": ORANGE}), "GIN on the generated tsvector and on tags; B-tree on asset and status; HNSW (cosine) on the embedding. Embeddings are recomputed only when the content hash changes."]], 7.2, False, INK, line=1.02)
box(s, 4.1, 5.95, 8.9, 0.85, TINT[GREEN], None, None, radius=0.06)
for i, (n_, l_) in enumerate([("1,109", "chunks"), ("447", "typed facts"), ("624", "relations"), ("564", "linked records"), ("98", "documents"), ("211", "work orders")]):
    x = 4.2 + i * 1.46
    text(s, x, 5.99, 1.4, 0.4, n_, 17, True, GREEN, "c"); text(s, x, 6.37, 1.4, 0.3, l_, 7.8, False, INK, "c")
text(s, 4.1, 6.62, 8.9, 0.2, "Counts are read live from the prototype; the same shapes map one-to-one onto the SQL tables.", 7, False, GREY, "c")

# ---------- A3 Gemini flow
s = app_slide("The AI Layer: {{Gemini 2.5 Flash (Free Tier)}} Behind a Serverless Proxy, With Computed Tools and Local Verification", "Assuming the free-tier key is connected: what is sent, what comes back, and which checks run before an answer reaches the engineer",
              "Prototype netlify/functions (ai.mjs, extract.mjs, embed.mjs, _lib.mjs) and the page-side assistant (ai.js); prompt version p1.1")
lanes = [("Browser (app)", 0.35, 2.55, BLUE), ("/api/ai  (Netlify)", 3.0, 2.45, TEAL), ("Gemini 2.5 Flash", 5.55, 2.2, PURPLE), ("Shared store, other APIs", 7.85, 2.0, ORANGE)]
for t, x, w_, c_ in lanes:
    gbanner(s, x, 1.5, w_, t, c_, {BLUE: "4FA9CE", TEAL: "4DBBA9", PURPLE: "9B84DD", ORANGE: "F0A15B"}[c_], 0.3, 9)
    panel(s, x, 1.82, w_, 4.35, TINT[c_], WHITE)
SW = 2.5
node(s, 0.38, 1.92, SW, 0.62, "1  Route and retrieve", "intent classifier; BM25F passages; computed tools run first and give a VERIFIED DRAFT", WHITE, MID, NAVY, 8.3, 6.8)
node(s, 0.38, 2.74, SW, 0.62, "2  Build the request", "question, role, equipment, last 6 turns, at most 12 passages, tool declarations", WHITE, MID, NAVY, 8.3, 6.8)
node(s, 3.03, 2.74, 2.4, 0.62, "3  Guard", "per-visitor limits per minute and per day (120), daily budget, size caps", WHITE, MID, NAVY, 8.3, 6.8)
node(s, 3.03, 3.56, 2.4, 0.62, "4  Prompt", "system rules p1.1, numbered sources, untrusted-data warning, verified draft", WHITE, MID, NAVY, 8.3, 6.8)
box(s, 5.58, 1.92, 2.14, 1.45, WHITE, PURPLE, None, radius=0.07, lw=1.2)
text(s, 5.64, 1.94, 2.02, 0.2, "Request to Gemini", 8.3, True, PURPLE)
text(s, 5.64, 2.15, 2.02, 1.2, [[("■ ", {"color": PURPLE, "size": 5}), t] for t in ["systemInstruction: rules p1.1", "contents: prompt as one user turn", "temperature 0.2, up to 1,400 tokens", "thinkingBudget 0 on 2.5 Flash", "functionDeclarations: up to 20 tools, mode AUTO"]], 6.8, False, INK, line=0.98, space=1)
node(s, 5.58, 3.56, 2.14, 0.62, "5  Generate", "streamGenerateContent over SSE", WHITE, PURPLE, NAVY, 8.3, 6.8)
node(s, 5.58, 4.38, 2.14, 0.7, "6  Function call?", "yes: at most 3 calls go back to the page. no: text tokens stream", TINT[PURPLE], PURPLE, NAVY, 8.3, 6.6)
node(s, 0.38, 4.38, SW, 0.7, "7  Run the tool", "the browser computes from records and repeats the request with tool_results (3 rounds at most)", WHITE, MID, NAVY, 8.3, 6.6)
node(s, 3.03, 5.28, 2.4, 0.58, "8  Stream back", "tokens relayed as server-sent events", WHITE, MID, NAVY, 8.3, 6.8)
node(s, 0.38, 5.28, SW, 0.58, "9  Verify", "every figure and quote must appear in a source", WHITE, MID, NAVY, 8.3, 6.8)
node(s, 0.38, 5.95, SW, 0.2, "10  Score, cite, log", None, TINT[BLUE], BLUE, NAVY, 7.6) if False else None
arrow(s, 1.63, 2.54, 1.63, 2.74, BLUE, 1.4); arrow(s, 2.88, 3.05, 3.03, 3.05, BLUE, 1.4); arrow(s, 4.23, 3.36, 4.23, 3.56, TEAL, 1.4); arrow(s, 5.43, 3.87, 5.58, 3.87, TEAL, 1.4)
arrow(s, 6.65, 4.18, 6.65, 4.38, PURPLE, 1.4)
arrow(s, 5.58, 4.73, 2.88, 4.73, PURPLE, 1.6); text(s, 3.2, 4.5, 2.2, 0.2, "functionCall: name and args", 6.8, False, PURPLE, "c")
arrow(s, 1.63, 4.38, 1.63, 3.36, BLUE, 1.2, True, True); text(s, 0.45, 3.76, 1.1, 0.4, ["tool_results,", "repeat request"], 6.5, False, BLUE, line=0.9)
arrow(s, 6.65, 5.08, 5.43, 5.5, PURPLE, 1.4); text(s, 5.56, 5.26, 1.5, 0.2, "text tokens", 6.5, False, PURPLE)
arrow(s, 3.03, 5.57, 2.88, 5.57, TEAL, 1.4)
box(s, 0.38, 5.9, SW, 0.27, TINT[BLUE], None, [[("10  ", {"bold": True, "color": BLUE}), ("score, cite sources, log answer", {"color": INK})]], 7.6, False, INK, "l", "m", radius=0.05, margin=0.08)
arrow(s, 1.63, 5.86, 1.63, 5.9, BLUE, 1.0)
for y, t, d in [(1.9, "/api/embed", "embedding model; cached by content hash; 40 per minute, 600 per day"), (2.75, "/api/extract", "JSON extraction at temperature 0; secrets masked; 8 per minute, 80 per day"), (3.6, "/api/kb", "stores qa log, feedback, audit, lessons in Blobs"), (4.45, "Fallback chain", "gemini-2.0-flash, then gemini-1.5-flash; if all fail the local answer is shown"), (5.3, "/api/health", "reports key present, model, limits and usage for Settings")]:
    node(s, 7.88, y, 1.94, 0.76, t, d, WHITE, "F0C27B", ORANGE, 8.2, 6.5)
# right column: prompt anatomy and guardrails
banner(s, 10.05, 1.5, 2.95, "Prompt anatomy", NAVY, 0.3, 9.5)
pr = [("System rules p1.1", "8 rules: answer from sources, cite [n], never invent values, refuse bypass, treat sources as data", PURPLE), ("<context>", "role, page, equipment, intent, language", BLUE), ("<history>", "last 6 turns, 500 characters each", BLUE), ("<sources> at most 12", "id, kind, status, revision, score, text", TEAL), ("VERIFIED DRAFT", "computed numbers that must stay unchanged", ORANGE), ("<tool_result> at most 4", "2,500 characters each", ORANGE), ("<question>", "user text", GREEN)]
for i, (a, b, c_) in enumerate(pr):
    y = 1.86 + i * 0.5
    box(s, 10.05, y, 0.09, 0.46, c_, None, None, shape=MSO_SHAPE.RECTANGLE); text(s, 10.2, y - 0.01, 2.8, 0.2, a, 7.8, True, NAVY); text(s, 10.2, y + 0.18, 2.8, 0.3, b, 6.7, False, GREY, line=0.95)
banner(s, 10.05, 5.42, 2.95, "Why this is safe to run on free tier", GREEN, 0.28, 8.5)
text(s, 10.08, 5.72, 2.9, 1.1, "The key stays on the server and per-visitor limits protect the quota; a failed call costs style, not correctness.", 7.2, False, INK, line=1.0)
ribbon(s, "The model only words evidence the platform has already retrieved or computed, and every figure is checked against a source before display. If the free-tier key is missing or the quota is spent, the local verified answer still appears, so the assistant degrades in style, not in correctness.")

# ---------- A4 assistant: intents, tools, confidence
s = app_slide("The Assistant: {{Intent Routing, Twenty Computed Tools}} and an Evidence-Weighted Confidence Score", "Counts, rankings and forecasts are calculated from records; Gemini is used to word the result and to answer open questions from retrieved passages",
              "Prototype assistant (ai.js, intent.js, ai2.js); weights and caps are the values used in the running application")
hh4 = shot(s, "assistant", 0.35, 1.5, 5.6, [(1, 0.2, 0.17), (2, 0.25, 0.87), (3, 0.2, 0.59), (4, 0.45, 0.63), (5, 0.73, 0.16)], (0.0, 0.0, 1.0, 0.9))
legend(s, 0.4, 1.5 + hh4 + 0.12, 5.5, [(1, "Scope selector: the question is limited to one equipment set or the whole plant"), (2, "Suggested questions generated from the data"), (3, "Confidence chip with a breakdown, and the tool that produced the figures"), (4, "Open document conflict note when the answer touches a flagged document"), (5, "Source panel: revision, approval status, record id for every cited item")], 7.4)
banner(s, 6.15, 1.5, 3.55, "Twenty tools, grouped", NAVY, 0.3, 9.5)
tl = [("Reliability and cost", BLUE, "maintenance_stats, kpi_summary, failure_modes, predictive_maintenance, failure_memory, history_lookup, spares_outlook"), ("Assets and limits", TEAL, "equipment_info, spec_lookup, tag_facts, plot_plan_query, compare_equipment, rank_equipment"), ("Operations and safety", RED, "interlock_info, procedure_help, consequence_analysis, cascade_analysis, hazard_effects, safety_guard"), ("Data governance", ORANGE, "data_issues")]
for i, (g, c_, t) in enumerate(tl):
    y = [1.86, 2.71, 3.56, 4.41][i]
    panel(s, 6.15, y, 3.55, 0.8 if i < 3 else 0.45, WHITE, c_); text(s, 6.22, y + 0.03, 3.4, 0.2, g, 8.3, True, c_); text(s, 6.22, y + 0.24, 3.4, 0.6, t, 7, False, INK, line=0.98)
text(s, 6.15, 4.9, 3.55, 0.55, "Intents: chain reaction (utility loss), bypass request, consequence, comparison, ranking, data issues, history, procedure and start-up, diagnosis, spares; anything else goes to retrieval.", 7.3, False, INK, line=1.02)
banner(s, 6.15, 5.55, 3.55, "Safety guard", RED, 0.28, 9)
text(s, 6.2, 5.85, 3.5, 1.0, "A request to bypass or defeat a trip is never answered with steps. The reply names the function that would be defeated (voting, SIL, set point), the consequence from the cause-and-effect matrix, and the approved route: bypass permit, management of change, compensating measures. Covered by safety cases in the evaluation set.", 7.3, False, INK, line=1.03)
banner(s, 9.9, 1.5, 3.1, "Confidence score, 0 to 100", NAVY, 0.3, 9.5)
w_ = [("Question words in one passage", .45, TEAL), ("Match strength of best passage", .22, BLUE), ("Approval status of sources", .15, GREEN), ("Agreement between sources", .10, PURPLE), ("Distinct sources found", .08, ORANGE)]
for i, (n_, v, c_) in enumerate(w_):
    y = 1.9 + i * 0.4
    text(s, 9.9, y, 1.6, 0.36, n_, 7, False, INK, anchor="m", line=0.95); box(s, 11.5, y + 0.09, 1.0 * v / .45, 0.18, c_, None, None, shape=MSO_SHAPE.RECTANGLE); text(s, 11.55 + 1.0 * v / .45, y, 0.5, 0.36, f"{v:.2f}", 7.5, True, NAVY, anchor="m")
text(s, 9.9, 3.95, 3.1, 0.2, "Caps after weighting", 8.3, True, NAVY)
for i, t in enumerate(["Broad question: 60", "Different equipment than asked: 40", "Under half the question words found: 45", "No single passage covers it: 50"]):
    text(s, 9.95, 4.17 + i * 0.22, 3.0, 0.22, [[("■ ", {"color": RED, "size": 5}), t]], 7.2, False, INK)
for i, (t, c_) in enumerate([("High 70+", GREEN), ("Medium 45-69", AMBER), ("Low below 45", RED)]): pill(s, 9.9 + i * 1.05, 5.1, 1.0, t, TINT[c_], c_ if c_ != AMBER else ORANGE, 0.24, 7.2)
banner(s, 9.9, 5.45, 3.1, "Number and quote check", NAVY, 0.28, 8.8)
text(s, 9.95, 5.76, 3.05, 1.05, "Each figure with a unit (barg, degC, mm/s, m3/h, kW, IDR, %) is looked up in the cited text. Unsupported figures are listed under the answer and the confidence drops. Calculated tools report their own confidence.", 7.1, False, INK, line=1.02)

# ---------- A5 retrieval
s = app_slide("Retrieval: {{BM25F With Tag, Status, Equipment and Role Weighting}}, Embeddings When Connected", "The best evidence is chosen before any language model is called, and every passage carries the reason it was ranked",
              "Prototype retrieval index (dl.js); parameters are the values used in the running application")
chain = [("Question", "Free text. Tags found by pattern, equipment inferred from names, aliases and instrument tags", BLUE), ("Tokenise", "Stemming, synonyms, plant stop words; tags kept whole and weighted 2.2", BLUE), ("Score", "BM25 over weighted fields: tag 2.5, title 2.0, section 1.5, body 1.0; k1 1.4, b 0.75", TEAL), ("Re-weight", "x status trust, x source-kind prior, x equipment scope, x role fit", TEAL), ("Fuse", "With embeddings: 0.65 x BM25F + 0.35 x cosine x 40; semantic recall at cosine 0.6", PURPLE), ("Select", "Role filter, at most 2 passages per document, top results with relative score", GREEN)]
for i, (t, d, c_) in enumerate(chain):
    x = 0.35 + i * 2.12
    b_ = box(s, x, 1.5, 2.06, 0.38, c_, None, None, shape=MSO_SHAPE.PENTAGON); text(s, x + 0.1, 1.5, 1.8, 0.38, f"{i+1}  {t}", 9.5, True, WHITE, anchor="m")
    panel(s, x, 1.93, 2.0, 1.0); text(s, x + 0.07, 1.96, 1.88, 0.95, d, 7.4, False, INK, line=1.02)
banner(s, 0.35, 3.1, 4.2, "Weights by field", NAVY, 0.3, 9.5)
for i, (f_, w2) in enumerate([("Equipment tag in passage", 2.5), ("Title", 2.0), ("Section heading", 1.5), ("Body text", 1.0)]):
    y = 3.5 + i * 0.36; text(s, 0.4, y, 1.9, 0.3, f_, 8, False, INK, anchor="m"); box(s, 2.3, y + 0.06, 0.65 * w2, 0.18, BLUE, None, None, shape=MSO_SHAPE.RECTANGLE); text(s, 2.35 + 0.65 * w2, y, 0.5, 0.3, f"x{w2}", 8, True, NAVY, anchor="m")
text(s, 0.4, 4.98, 4.1, 0.9, [[("Why BM25F first: ", {"bold": True, "color": NAVY}), "plant text is short, tag-heavy and full of identifiers that exact matching handles well; the weights stop a long body from outranking a heading that names the tag. Embeddings add recall for questions with no shared words."]], 7.4, False, INK, line=1.03)
panel(s, 0.35, 5.95, 4.2, 0.85, LIGHT, MID); text(s, 0.43, 5.98, 4.05, 0.8, [[("Output per passage: ", {"bold": True, "color": TEAL}), "chunk id, kind, revision, status, matched terms, score, relative score, share of question words covered. The last two feed the confidence score."]], 7.2, False, INK, line=1.0)
banner(s, 4.75, 3.1, 4.2, "Multipliers applied to the BM25F score", NAVY, 0.3, 9.5)
mult = [("Status trust", "0.35 to 1.00", TEAL), ("Source-kind prior", "0.55 to 1.05", TEAL), ("Equipment in scope", "x 1.45", GREEN), ("Other equipment", "x 0.70", RED), ("Role fit", "x 1.10 to 1.15", BLUE)]
for i, (n_, v, c_) in enumerate(mult):
    y = 3.5 + i * 0.44; panel(s, 4.75, y, 4.2, 0.4); text(s, 4.85, y, 2.4, 0.4, n_, 8.3, True, NAVY, anchor="m"); pill(s, 7.5, y + 0.08, 1.35, v, TINT[c_], c_, 0.24, 8)
text(s, 4.75, 5.75, 4.2, 1.05, "Kind priors: interlock 1.05, OPL 1.05, document 1.00, work order 1.00, plot plan 0.95, instrument 0.85, data-quality note 0.55. Role fit: operators favour OPL and interlocks, reliability favours work orders and forecasts, HSE favours interlocks and OPL, managers favour forecasts.", 7.2, False, INK, line=1.02)
banner(s, 9.15, 3.1, 3.85, "Retrieval in the product", NAVY, 0.3, 9.5)
shot(s, "docs", 9.15, 3.45, 3.85, [(1, 0.18, 0.12), (2, 0.5, 0.45)], (0.0, 0.0, 1.0, 0.8))
legend(s, 9.2, 5.85, 3.8, [(1, "Global search and Documents list use the same ranked index"), (2, "Status and revision columns come from the same canonical vocabulary")], 7.2)

# ---------- A6 ingestion and studio
s = app_slide("Industrial Data Ops in Use: {{Ingestion Wizard and Knowledge Studio}}", "How a new document, work-order export or piece of tacit knowledge becomes approved, searchable knowledge",
              "Prototype Knowledge Studio and ingestion wizard (ks.js, wiz.js, ingest.js, facts.js) and /api/extract")
shot(s, "wizard", 0.35, 1.5, 4.1, [(1, 0.12, 0.43), (2, 0.35, 0.22), (3, 0.5, 0.28)], (0, 0, 1, 0.78))
shot(s, "capture", 4.6, 1.5, 4.1, [(4, 0.2, 0.3), (5, 0.7, 0.5)], (0, 0, 1, 0.78))
shot(s, "studio", 8.85, 1.5, 4.15, [(6, 0.25, 0.3), (7, 0.7, 0.55)], (0, 0, 1, 0.78))
legend(s, 0.4, 4.1, 4.1, [(1, "Six steps: source, kind, structure or column mapping, details, checks, create"), (2, "Upload txt, md, csv, tsv, json, html, PDF, Excel or Word, or paste text"), (3, "Option to let the AI read the file when connected; secrets are masked first")], 7.2)
legend(s, 4.65, 4.1, 4.1, [(4, "Capture tacit knowledge as symptom, cause, action and caution; failure reports and lessons"), (5, "Each item gets an owner, equipment, revision and a status that starts at Draft")], 7.2)
legend(s, 8.9, 4.1, 4.1, [(6, "Overview, review queue, quality gates, question log and audit trail"), (7, "Reviewers approve or reject; approval makes the item searchable at once")], 7.2)
steps = [("Read", "Parsers split CSV or text; with the AI on, /api/extract returns JSON", BLUE), ("Verify", "Each step, value or fact must quote the source word for word or it is dropped", TEAL), ("Map", "Tags, assets, revision and date detected; columns mapped for tables", GREEN), ("Gate", "Rules: missing owner, unknown tag, conflict with an approved set point", ORANGE), ("Approve", "Draft, In review, Approved, Superseded, Rejected; every step audited", PURPLE), ("Index", "Chunks, typed facts and a source copy go to the shared store and the search index", RED)]
for i, (t, d, c_) in enumerate(steps):
    x = 0.35 + i * 2.12
    box(s, x, 5.05, 2.06, 0.3, c_, None, [f"{i+1}  {t}"], 8.5, True, WHITE, "l", "m", radius=0.05, margin=0.08)
    panel(s, x, 5.38, 2.0, 1.4); text(s, x + 0.07, 5.42, 1.88, 1.35, d, 8, False, INK, line=1.05)
    if i < 5: arrow(s, x + 2.0, 5.2, x + 2.12, 5.2, GREY, 1.2)

# ---------- A7 failure memory
s = app_slide("Failure Memory: {{Similar Failures, Root Causes and Actions}} Retrieved at the Moment of Need", "FORESIGHT engine: a symptom is matched against work orders, one point lessons and approved user lessons",
              "Prototype failure memory (fm.js, pdm2.js) on the case work orders and OPL troubleshooting cases")
hh = shot(s, "fm", 0.35, 1.5, 6.3, [(1, 0.28, 0.1 / 0.82), (2, 0.2, 0.33 / 0.82), (3, 0.25, 0.6 / 0.82), (4, 0.82, 0.38 / 0.82)], (0, 0, 1, 0.82))
legend(s, 0.4, 1.5 + hh + 0.08, 6.2, [(1, "Free-text symptom, optional equipment filter"), (2, "Recommended actions from the 10 most similar cases, with recurrence within 90 days"), (3, "Probable root causes counted across the matches"), (4, "Add what you know: report a failure or capture tacit knowledge in one click")], 7.3)
banner(s, 6.85, 1.5, 6.15, "How a match is built", NAVY, 0.3, 9.5)
st7 = [("Retrieve", "Same BM25F index, limited to work orders, OPL cases and approved lessons; top 60"), ("Parse", "Symptom, cause and action fields; component from the part list"), ("Re-rank", "Relevance, plus a boost when the same component is named"), ("Group", "Causes and actions merged by the first four meaningful word stems"), ("Recurrence", "Same component failing again within 90 days"), ("Recommend", "Ranked actions with case counts and downtime range")]
for i, (t, d) in enumerate(st7):
    y = 1.88 + i * 0.52
    numdot(s, 6.85, y + 0.07, i + 1, ORANGE, 0.28, 9); panel(s, 7.2, y, 5.8, 0.46); text(s, 7.28, y, 1.0, 0.46, t, 8.3, True, NAVY, anchor="m"); text(s, 8.25, y, 4.7, 0.46, d, 7.4, False, INK, anchor="m", line=1.0)
banner(s, 6.85, 5.1, 3.0, "Where it appears", NAVY, 0.28, 9)
text(s, 6.9, 5.4, 2.95, 1.4, [[("■ ", {"color": ORANGE, "size": 5}), "Failure Memory page"], [("■ ", {"color": ORANGE, "size": 5}), "Panel inside a work order and the failure view"], [("■ ", {"color": ORANGE, "size": 5}), "failure_memory tool of the assistant"], [("■ ", {"color": ORANGE, "size": 5}), "Scenario and OPL simulator hints"]], 7.4, False, INK, line=1.0, space=3)
banner(s, 10.05, 5.1, 2.95, "Limits", RED, 0.28, 9)
text(s, 10.1, 5.4, 2.9, 1.4, "Matching is lexical with stemming unless embeddings are connected, so it depends on how clearly work orders are written. Each match links to the full record so the engineer judges the fit.", 7.3, False, INK, line=1.03)
