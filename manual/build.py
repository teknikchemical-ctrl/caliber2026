"""Build the manual: python3 manual/build.py [calls|pdf|docx|all]"""
import os, sys, json, subprocess, re, html
sys.path.insert(0, os.path.dirname(__file__))
from engine import *
import content1, content2, content3, content4, content5
from pypdf import PdfReader, PdfWriter

TITLE = "Asset Knowledge Platform"
SUB = "User Manual"
TEAM = "Team Insinyur Jawa"
NAMES = ["Alniko Arya S.", "Anas Fauzan", "Rainar Athalla W. P."]
VERSION = "1.0"
DATE = "3 October 2026"

INDEX = [
 ("AI Assistant", "32, 33"), ("Alarm and trip, simulated", "15, 29"), ("Approval workflow", "34, 40"), ("Assumptions register", "30"),
 ("Audit trail", "34, 40"), ("Bill of material", "14"), ("Breakdown", "19, 20, 24"), ("Business case", "38"), ("Chain reaction", "30"),
 ("Cause and effect matrix", "16"), ("Component details", "14"), ("Conflicts between documents", "18, 35"), ("Cost split", "19"),
 ("Dashboard", "11"), ("Data exports", "37"), ("Data quality issues", "35"), ("Datasheet", "13"), ("Documents", "18"),
 ("Drawing, 2D", "14"), ("Drawing, 3D", "14"), ("Equipment dossier", "13, 37"), ("Equipment sets", "3, 13"), ("Failure Memory", "26"),
 ("Failure modes", "22, 23"), ("Feedback on answers", "32, 34"), ("Function test", "16"), ("Global search", "8"), ("Governance", "38"),
 ("Guided tour", "9"), ("Hazard simulator", "31"), ("Health index", "22"), ("Ingestion wizard", "34"), ("Integrations", "36"),
 ("Interlock Library", "16"), ("Knowledge graph", "36"), ("Knowledge Studio", "34"), ("Language", "39"), ("Library (Knowledge Studio)", "34"),
 ("Maintenance", "19 to 25"), ("My work", "12"), ("Notifications", "9"), ("Offline use", "10"), ("One Point Lesson", "28, 29"),
 ("P&ID", "15"), ("Performance", "27"), ("Plant replay", "24"), ("Plot Plan", "31"), ("Predictive maintenance", "22"),
 ("Proof test", "16"), ("Quality gates", "34"), ("Question log", "34"), ("Reliability analysis", "23"), ("Report Center", "37"),
 ("Review queue", "34"), ("Roles", "4, 40"), ("Scenarios", "29, 30"), ("Settings", "9, 39"), ("Sign in and sign out", "6"),
 ("Site plan", "25"), ("Spare parts", "27"), ("Start-up readiness", "17"), ("Sync", "10"), ("Timeline", "21"), ("Work orders", "20"),
]

def assemble():
    b = []
    for m in (content1, content2, content3, content4, content5):
        b += m.blocks()
    b += content5.appendices()
    idx = sorted(INDEX, key=lambda x: x[0].lower())
    b += [H1("E", "Index", ["Operator", "Engineer", "Reliability", "HSE", "Manager"], "Appendices", "Chapter numbers for the main terms and features."),
          TABLE(["Term", "Chapter", "Term", "Chapter"],
                [[idx[i][0], idx[i][1], idx[i + len(idx) // 2 + len(idx) % 2][0] if i + len(idx) // 2 + len(idx) % 2 < len(idx) else "", idx[i + len(idx) // 2 + len(idx) % 2][1] if i + len(idx) // 2 + len(idx) % 2 < len(idx) else ""] for i in range(len(idx) // 2 + len(idx) % 2)],
                [32, 18, 32, 18])]
    return b

def cover_html():
    img = os.path.relpath(jpg("p3_dash")[0], BLD)
    names = "".join(f"<p>{n}</p>" for n in NAMES)
    return f"""<!doctype html><html><head><meta charset='utf-8'><style>
@page{{size:A4;margin:0}} *{{box-sizing:border-box}} body{{margin:0;font-family:Arial,'Liberation Sans',sans-serif}}
.c{{width:210mm;height:297mm;background:linear-gradient(135deg,#0b2a4a,#155ea3);color:#fff;padding:30mm 24mm;display:flex;flex-direction:column;position:relative;overflow:hidden}}
.tag{{font-size:11pt;letter-spacing:3pt;text-transform:uppercase;color:#8fd3cc;margin-bottom:12mm}}
h1{{font-size:42pt;line-height:1.1;margin:0 0 4mm}} h2{{font-size:24pt;font-weight:400;margin:0 0 14mm;color:#dce8f5}}
h3{{font-size:17pt;color:#8fd3cc;margin:0 0 3mm}} p{{font-size:13pt;margin:1.5mm 0;color:#dce8f5}}
.shot{{position:absolute;left:24mm;right:24mm;bottom:34mm;border:1mm solid rgba(255,255,255,.35);border-radius:3mm;overflow:hidden;box-shadow:0 3mm 8mm rgba(0,0,0,.35);height:78mm;background:#fff}}
.shot img{{width:100%;display:block}}
.foot{{position:absolute;left:24mm;right:24mm;bottom:16mm;font-size:10pt;color:#9fb6d0}}
</style></head><body><div class='c'><div class='tag'>CALIBER 2026 | Case 1: Manufacturing Knowledge Hub</div>
<h1>{TITLE}</h1><h2>{SUB}</h2><h3>{TEAM}</h3>{names}
<div class='shot'><img src='{img}'></div><div class='foot'>Version {VERSION} | {DATE}</div></div></body></html>"""

def back_html():
    return f"""<!doctype html><html><head><meta charset='utf-8'><style>
@page{{size:A4;margin:0}} *{{box-sizing:border-box}} body{{margin:0;font-family:Arial,'Liberation Sans',sans-serif}}
.c{{width:210mm;height:297mm;background:linear-gradient(135deg,#0b2a4a,#155ea3);color:#fff;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:30mm}}
h1{{font-size:36pt;margin:0 0 6mm}} h2{{font-size:20pt;font-weight:400;color:#8fd3cc;margin:0 0 14mm}} p{{font-size:14pt;margin:2mm 0;color:#dce8f5}} small{{display:block;margin-top:18mm;font-size:11pt;color:#9fb6d0}}
</style></head><body><div class='c'><h1>{TITLE}</h1><h2>Link, verify and use plant knowledge</h2><h3 style='font-size:18pt;margin:0 0 4mm;color:#fff'>{TEAM}</h3>
<p>{'  |  '.join(NAMES)}</p><small>CALIBER 2026 | Case 1: Manufacturing Knowledge Hub<br>The sample data in this platform is provided for CALIBER purposes only.</small></div></body></html>"""

def front_html():
    rows = [("Document", f"{TITLE}, {SUB}"), ("Version", VERSION), ("Date", DATE), ("Prepared by", f"{TEAM}: " + ", ".join(NAMES)),
            ("Applies to", "The sample installation for the LLDPE unit, eight equipment sets"), ("Readers", "Operators, engineers, reliability engineers, HSE engineers and managers"),
            ("Data", "Sample data provided for CALIBER purposes only")]
    t = "<table class='dc' style='width:100%;border-collapse:collapse'>" + "".join(f"<tr><td>{a}</td><td>{html.escape(b)}</td></tr>" for a, b in rows) + "</table>"
    hist = "<table class='t'><tr><th>Version</th><th>Date</th><th>Change</th></tr><tr><td>" + VERSION + "</td><td>" + DATE + "</td><td>First issue</td></tr></table>"
    return f"<div class='sheet' style='page-break-after:always'><h1 style='page-break-before:auto'>Document control</h1>{t}<h2>Revision history</h2>{hist}<h2>How to read the figures</h2><p>Each figure is a screenshot of the platform. Orange numbered markers point to the parts of the screen that the legend under the figure describes. Chapters begin with the roles that normally use the page.</p><div class='note tip'><b class='t'>Tip</b>Boxes marked Tip give a faster way to do a task. Boxes marked Caution describe a limit or a risk. Boxes marked Roles describe who can do what.</div></div>"

OVERRIDE = "<style>.sheet{padding:0!important;width:auto!important}.fig .frame{max-width:100%}h1{margin-top:0}</style>"

def render(htmlfile, pdffile, footer=False):
    js = os.path.join(BLD, "render.js")
    open(js, "w").write("""const {chromium}=require('playwright');(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});const p=await b.newPage();
await p.goto('file://'+process.argv[2],{waitUntil:'load'});await p.waitForTimeout(800);
const f=process.argv[4]==='1';
await p.pdf({path:process.argv[3],format:'A4',printBackground:true,preferCSSPageSize:!f,margin:f?{top:'18mm',bottom:'20mm',left:'18mm',right:'18mm'}:{top:'0',bottom:'0',left:'0',right:'0'},displayHeaderFooter:f,headerTemplate:'<span></span>',footerTemplate:'<div style="width:100%;font:8pt Arial;color:#6B7A8C;padding:0 18mm;display:flex;justify-content:space-between"><span>Asset Knowledge Platform | User Manual</span><span>Page <span class="pageNumber"></span></span></div>'});await b.close()})()""")
    subprocess.run(["node", js, htmlfile, pdffile, "1" if footer else "0"], check=True, cwd=os.path.dirname(HERE))

def pages_of(pdf, doc):
    r = PdfReader(pdf); pg = {}
    for i, p in enumerate(r.pages):
        t = p.extract_text() or ""
        for m in re.finditer(r"@@([HS][A-Z0-9.]+)@@", t):
            pg.setdefault(m.group(1), i + 1)
    return pg

def build_pdf():
    doc = Doc("manual", assemble())
    front = front_html()
    out_html = os.path.join(BLD, "body.html")
    pages = {}
    for it in range(2):
        h = body_html(doc, pages, front).replace("</head>", OVERRIDE + "</head>")
        open(out_html, "w").write(h)
        render(out_html, os.path.join(BLD, "body.pdf"), True)
        pages = pages_of(os.path.join(BLD, "body.pdf"), doc)
        print("pass", it, "pages", len(PdfReader(os.path.join(BLD, "body.pdf")).pages), "markers", len(pages))
    open(os.path.join(BLD, "cover.html"), "w").write(cover_html()); render(os.path.join(BLD, "cover.html"), os.path.join(BLD, "cover.pdf"))
    open(os.path.join(BLD, "back.html"), "w").write(back_html()); render(os.path.join(BLD, "back.html"), os.path.join(BLD, "back.pdf"))
    w = PdfWriter()
    for f in ("cover.pdf", "body.pdf", "back.pdf"):
        for p in PdfReader(os.path.join(BLD, f)).pages: w.add_page(p)
    w.add_metadata({"/Title": f"{TITLE} {SUB}", "/Author": TEAM})
    out = os.path.join(HERE, "..", "deck", "manual", "Asset_Knowledge_Platform_User_Manual.pdf")
    os.makedirs(os.path.dirname(out), exist_ok=True)
    w.write(out); print("PDF", out, len(w.pages), "pages")
    json.dump(pages, open(os.path.join(BLD, "pages.json"), "w"))

if __name__ == "__main__":
    mode = sys.argv[1] if len(sys.argv) > 1 else "all"
    if mode in ("calls", "all"):
        d = Doc("m", assemble()); json.dump(collect_calls(d), open(os.path.join(HERE, "calls.json"), "w"), indent=0); print("calls.json", len(collect_calls(d)))
    if mode in ("pdf", "all"): build_pdf()
