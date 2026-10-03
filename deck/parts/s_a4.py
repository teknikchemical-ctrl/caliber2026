# ======================================================= APPENDIX flowcharts: question to answer, event to lesson, value tree, Chandra Asri fit
def cc(s, cx, cy, title, sub=None, color=BLUE, w=None, **kw):
    mw, mh = measure(title, sub, kw.get("tsize", 10.5), kw.get("ssize", 8.8), kw.get("maxw", 1.9), kw.get("minw", 0.9))
    ww = w or mw
    return cell(s, cx - ww / 2, cy, title, sub, color, w=ww, **kw)
def dia(s, cx, cy, label, color=AMBER, w=1.95, h=1.15): diamond(s, cx, cy, w, h, label, color, 9.5)
def lab(s, x, y, t, color=GREY, w=0.5): text(s, x, y, w, 0.2, t, 9, True, color)

# ---------- question to answer
s = app_slide("From Question to Answer: {{Four Decision Points}} Between an Engineer and a Trusted Reply",
              "Every branch is implemented in the assistant; the free-tier model is one step in the path, and the path still ends in a checked answer if it is unavailable",
              "Assistant page logic (ai.js, dl.js) and the netlify ai function; behaviour verified by the 128-question evaluation set")
YA, YB = 2.15, 4.55
cc(s, 1.35, YA, "Engineer asks", "role, equipment, page", BLUE)
dia(s, 3.55, YA, "Unsafe bypass request?", RED)
cc(s, 5.9, YA, "Retrieve", "BM25F plus vectors, scoped to the equipment tag", TEAL, maxw=1.8)
dia(s, 8.2, YA, "Enough approved evidence?", AMBER, 2.1)
cc(s, 11.1, YA, "Compute tools", "VERIFIED DRAFT from plant records", TEAL, maxw=1.8)
for x1, x2 in [(2.2, 2.55), (4.55, 4.95), (6.95, 7.15), (9.25, 10.15)]: arrow(s, x1, YA, x2, YA, GREY, 1.6)
lab(s, 4.55, YA - 0.22, "no", GREEN); lab(s, 9.4, YA - 0.22, "yes", GREEN)
cc(s, 3.55, 3.35, "Refuse and explain", "cites the interlock or rule", RED)
arrow(s, 3.55, YA + 0.58, 3.55, 3.0, RED, 1.6); lab(s, 3.62, 2.8, "yes", RED)
cc(s, 8.2, 3.35, "Say no source found", "offer to log a knowledge gap", AMBER)
arrow(s, 8.2, YA + 0.58, 8.2, 3.0, AMBER, 1.6); lab(s, 8.27, 2.8, "no", AMBER)
arrow(s, 11.1, YA + 0.4, 11.1, YB - 0.58, GREY, 1.6)
dia(s, 11.1, YB, "Gemini available?", PURPLE, 2.0)
cc(s, 8.5, YB, "Gemini 2.5 Flash drafts", "up to 3 tool rounds, streamed", PURPLE, maxw=1.8)
cc(s, 6.0, YB, "Verify", "figures and quotes found in sources", TEAL, maxw=1.7)
dia(s, 3.9, YB, "All figures found?", AMBER, 1.9)
cc(s, 1.35, YB, "Answer", "sources, confidence 0 to 100, log", GREEN, solid=True, maxw=1.6)
for x1, x2 in [(9.95, 9.5), (7.55, 6.95), (5.15, 4.9), (2.9, 2.3)]: arrow(s, x1, YB, x2, YB, GREY, 1.6)
lab(s, 9.62, YB - 0.22, "yes", GREEN); lab(s, 2.95, YB - 0.22, "yes", GREEN)
cc(s, 11.1, 5.75, "Show the local draft", "final answer from the same sources, without model wording", AMBER, maxw=1.8)
arrow(s, 11.1, YB + 0.58, 11.1, 5.4, AMBER, 1.6); lab(s, 11.17, 5.0, "no", AMBER)
cc(s, 3.9, 5.75, "Flag for review", "confidence lowered, marked unverified", ORANGE, maxw=1.8)
arrow(s, 3.9, YB + 0.58, 3.9, 5.4, ORANGE, 1.6); lab(s, 3.97, 5.0, "no", ORANGE)
arrow(s, 3.0, 5.75, 1.35, 5.75, ORANGE, 1.3, False, True); arrow(s, 1.35, 5.75, 1.35, YB + 0.4, ORANGE, 1.3, True, True)
box(s, 0.4, 6.3, 12.55, 0.5, TINT[BLUE], None, [[("Reading the figure: ", {"bold": True, "size": 9.5, "color": NAVY}), ("red branches protect people, amber branches protect trust, and every path writes the question, sources, confidence and outcome to the audit log.", {"size": 9.5, "color": INK})]], 9.5, False, INK, "l", "m", radius=0.06, margin=0.12)

# ---------- event to lesson
s = app_slide("From Plant Event to Reusable Lesson: {{A Closed Loop}} That Feeds Answers, Prediction and Simulation",
              "A closed work order is the start of knowledge, not the end of the paperwork; nothing is reused until a named owner approves it",
              f"Work-order history in the prototype ({D['wo']} work orders, {D['cm_follow']} corrective jobs followed by a repeat-failure check)")
YA = 2.2
r = row(s, YA, 0.5, 12.8, [("Work order closed", "cause, action, hours, parts"), ("Failure memory", "stores the event on the equipment tag"), ("Pattern check", "same mode within 120 days?"), ("Lesson drafted", "symptom, cause, fix, OPL steps"), ("Owner review", "edit, approve or reject"), ("Published", "status, revision, role access")], BLUE, maxw=1.7, solid_last=True)
c_ = r[2]; dia(s, c_[0] + c_[2] / 2, 3.55, "Repeat failure?", ORANGE, 1.7, 0.95)
arrow(s, c_[0] + c_[2] / 2, c_[1] + c_[3] + 0.03, c_[0] + c_[2] / 2, 3.07, ORANGE, 1.5); cc(s, c_[0] + c_[2] / 2 + 2.6, 3.55, "Raise priority", "shows on the predictive page", ORANGE, maxw=1.6)
arrow(s, c_[0] + c_[2] / 2 + 0.87, 3.55, c_[0] + c_[2] / 2 + 1.75, 3.55, ORANGE, 1.5); lab(s, c_[0] + c_[2] / 2 + 1.0, 3.33, "yes", ORANGE)
pub = r[-1]; px = pub[0] + pub[2] / 2
for i, (t, sb, col) in enumerate([("Assistant", "answers cite the lesson with its revision", TEAL), ("Predictive model", "event counts update the forecast", ORANGE), ("OPL and simulator", "lesson becomes a step or a case", PURPLE)]):
    cx = 2.3 + i * 4.0
    cc(s, cx + 1.0, 5.0, t, sb, col, maxw=2.2, minw=2.6)
    elb = [(px, pub[1] + pub[3] + 0.03), (px, 4.2), (cx + 1.0, 4.2), (cx + 1.0, 4.72)]
    elbow(s, elb, col, 1.5)
text(s, 0.5, 4.25, 3.0, 0.3, "Reused in three places", 10, True, NAVY)
box(s, 0.5, 5.75, 12.3, 0.7, TINT[TEAL], None, None, radius=0.06)
text(s, 0.65, 5.8, 12.0, 0.6, [[("Real example in the data: ", {"bold": True, "color": TEAL}), "work order WO-240088 renewed a crosshead pin and bush and set the clearance. Once approved as a lesson it appears in the answer for a similar symptom, raises the repeat-failure count for that failure mode, and can be added to the OPL as a check step. Feedback marked wrong goes back to the review queue."]], 9.5, False, INK, line=1.05)

# ---------- value tree
s = app_slide("How the Annual Value Is Built: {{A Driver Tree}} From the Headline Number Down to Each Input and Its Source",
              "Green inputs come from the case data; grey inputs are assumptions to be replaced with Company figures during the pilot",
              "Business case model in make_deck.py and appendix A22; case data from the 211 work orders")
cc(s, 1.6, 3.75, "Annual value", f"IDR {BASE[3]:,.0f} M, base case", GREEN, solid=True, tsize=13, ssize=10, minw=2.2)
branches = [(2.4, "Search time saved", f"IDR {BASE[0]:,.0f} M", BLUE, [("Users", "45", "A"), ("Minutes saved a day", "20", "A"), ("Working days", "230", "A"), ("Rate per hour", "IDR 175,000", "A")]),
            (3.75, "Faster fault finding", f"IDR {BASE[1]:,.0f} M", TEAL, [("Breakdowns a year", f"{D['bd_yr']}", "D"), ("MTTR", f"{D['mttr']:.1f} h", "D"), ("Reduction", "10%", "A"), ("Cost per downtime hour", "IDR 30 M", "A")]),
            (5.1, "Faster ramp-up", f"IDR {BASE[2]:,.0f} M", PURPLE, [("New engineers productive one month sooner", "IDR 60 M", "A")])]
for cy, t, v, c_, ins in branches:
    mw, mh = measure(t, v, 10.5, 12, 1.9, 1.9)
    x, y, w, h = cell(s, 3.4, cy, t, v, c_, 10.5, 12, 1.9, 1.9, w=2.0)
    elbow(s, [(2.75, 3.75), (3.05, 3.75), (3.05, cy), (3.37, cy)], c_, 1.6)
    xx = 5.8
    for j, (nm, val, kind) in enumerate(ins):
        col = GREEN if kind == "D" else GREY
        mw2, mh2 = measure(nm, val, 9.5, 11, 1.5, 1.2)
        box(s, xx, cy - 0.37, max(mw2, 1.25), 0.74, TINT[GREEN] if kind == "D" else LIGHT, col, [[(val, {"bold": True, "size": 11, "color": NAVY})], [(nm, {"size": 8.6, "color": INK})]], 10, False, INK, "c", "m", radius=0.08, margin=0.05)
        if j == 0: arrow(s, 5.43, cy, xx - 0.03, cy, c_, 1.4)
        ww = max(mw2, 1.25)
        if j < len(ins) - 1: text(s, xx + ww + 0.02, cy - 0.15, 0.3, 0.3, "x", 12, True, GREY, "c")
        xx += ww + 0.34
box(s, 0.4, 6.35, 12.55, 0.45, TINT[BLUE], None, [[("Sensitivity: ", {"bold": True, "size": 9.5, "color": NAVY}), (f"low case IDR {LOW[3]/1000:.1f} B (no payback in 3 years), base IDR {BASE[3]/1000:.1f} B, high IDR {HIGH[3]/1000:.1f} B. The repair-time lever is the largest and the least certain; the pilot measures it first.", {"size": 9.5, "color": INK})]], 9.5, False, INK, "l", "m", radius=0.06, margin=0.12)
lg = [(GREEN, "Case data"), (GREY, "Assumption")]
for i, (c_, t) in enumerate(lg):
    box(s, 9.9 + i * 1.5, 1.52, 0.22, 0.22, TINT[GREEN] if c_ == GREEN else LIGHT, c_, None, radius=0.04); text(s, 10.17 + i * 1.5, 1.5, 1.2, 0.26, t, 9, False, INK, anchor="m")

# ---------- Chandra Asri fit
s = app_slide("Fit With Chandra Asri's Direction: The {{Knowledge Layer}} That a Digital Twin and Industry 4.0 Programme Still Needs",
              "Public information about Chandra Asri, used to position the proposal; internal systems and data are to be confirmed with the Company",
              "Chandra Asri press releases (National Lighthouse Industry 4.0 award, INDI 4.0 award); Hydrocarbon Processing, Aug 2021; Siemens press release, Jul 2020")
gbanner(s, 0.4, 1.5, 3.7, "What Chandra Asri already does", NAVY, "27517F", 0.3, 9.5)
YY = [2.35, 3.45, 4.55]
for cy, t, sb in zip(YY, ["Industry 4.0 programme", "Digital twin, Cilegon complex", "Digital monitoring"], ["National Lighthouse Industry 4.0 award; INDI 4.0 award, aggressive digitalisation", "plant and engineering data for asset performance, reliability and proactive maintenance", "cooling-water monitoring saved 348 M litres of water, 6 M kWh and 2,100 t CO2 in 2020"]):
    cell(s, 0.4, cy, t, sb, BLUE, 10.5, 8.8, 3.3, 3.7, w=3.7)
gbanner(s, 4.5, 1.5, 3.2, "The gap this proposal fills", RED, "E88B8B", 0.3, 9.5)
cell(s, 4.5, 2.35, "Documents, lessons and work-order text", "SOPs, OPL, RCA and tacit know-how are not tied to the equipment tag", RED, 10.5, 8.8, 3.0, 3.2, w=3.2)
cell(s, 4.5, 3.45, "Answers without proof", "engineers cannot tell which source or revision to trust", RED, 10.5, 8.8, 3.0, 3.2, w=3.2)
cell(s, 4.5, 4.55, "Knowledge leaves with people", "lessons from repeat failures are not reused", RED, 10.5, 8.8, 3.0, 3.2, w=3.2)
for cy in YY: arrow(s, 4.13, cy, 4.47, cy, GREY, 1.6)
gbanner(s, 8.1, 1.5, 4.85, "What the platform adds, read-only", GREEN, "6CC48D", 0.3, 9.5)
adds = [("Tag-keyed knowledge base", "documents, work orders and lessons joined to the same equipment tags the twin uses"), ("Verified answers with sources", "revision, status and confidence on every reply"), ("Failure memory and OPL simulator", "history and lessons used for prediction and training"), ("Links to twin, historian, AIMS, EDMS", "adapters read tag values and records; nothing is written back")]
for cy, (t, sb) in zip([2.2, 3.0, 3.8, 4.6], adds):
    cell(s, 8.1, cy, t, sb, GREEN, 10.5, 8.8, 4.6, 4.85, w=4.85)
for cy in YY: arrow(s, 7.73, cy, 8.07, cy, GREY, 1.6)
box(s, 0.4, 5.5, 12.55, 1.2, TINT[BLUE], None, None, radius=0.06)
text(s, 0.55, 5.55, 12.3, 0.3, "How it plugs in", 10.5, True, NAVY)
steps = [("Twin and historian", "tag values, read-only"), ("AIMS", "work orders and plans"), ("EDMS", "controlled documents"), ("TAGLINK", "joins on the equipment tag"), ("Knowledge hub", "answers, prediction, planning")]
r = row(s, 6.2, 0.7, 12.7, steps, BLUE, maxw=2.1, minw=1.6, solid_last=True)
