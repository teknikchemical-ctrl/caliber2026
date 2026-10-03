"""Build the report PDF: python3 finance/report_build.py"""
import os, sys, re, json, subprocess, html
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE); sys.path.insert(0, os.path.join(HERE, "..", "manual"))
import engine
engine.IMG = os.path.join(HERE, "img"); engine.BLD = os.path.join(HERE, "build"); os.makedirs(engine.BLD, exist_ok=True)
from engine import Doc, body_html, jpg
import report_content as RC
from pypdf import PdfReader, PdfWriter

TITLE = "Business Impact and Financial Modelling Report"; PROD = "Asset Knowledge Platform"
TEAM = "Team Insinyur Jawa"; NAMES = ["Alniko Arya S.", "Anas Fauzan", "Rainar Athalla W. P."]; VERSION = "1.0"; DATE = "3 October 2026"
OUT_PDF = os.path.join(HERE, "Business_Impact_and_Financial_Modelling_Report.pdf")

def cover_html():
    R3 = RC.R3
    tiles = [(RC.B(R3["steady"]), "annual value at full rollout, 3 units"), (RC.B(R3["npv"]), "net present value before tax, 3 units"), (f"{R3['pb']:.0f} months", "payback, 3 units"), (RC.pc(RC.mc("Probability that NPV is positive", 3)), "probability of a positive NPV")]
    t = "".join(f"<div class='tile'><b>{a}</b><span>{b}</span></div>" for a, b in tiles)
    names = "".join(f"<p>{n}</p>" for n in NAMES)
    return f"""<!doctype html><html><head><meta charset='utf-8'><style>
@page{{size:A4;margin:0}} *{{box-sizing:border-box}} body{{margin:0;font-family:Arial,'Liberation Sans',sans-serif}}
.c{{width:210mm;height:297mm;background:linear-gradient(135deg,#0b2a4a,#155ea3);color:#fff;padding:30mm 24mm;position:relative;overflow:hidden}}
.tag{{font-size:10pt;letter-spacing:2pt;text-transform:uppercase;color:#8fd3cc;margin-bottom:12mm}}
h1{{font-size:36pt;line-height:1.12;margin:0 0 4mm}} h2{{font-size:19pt;font-weight:400;margin:0 0 14mm;color:#dce8f5}} h3{{font-size:17pt;color:#8fd3cc;margin:0 0 3mm}} p{{font-size:13pt;margin:1.5mm 0;color:#dce8f5}}
.tiles{{position:absolute;left:24mm;right:24mm;bottom:48mm;display:grid;grid-template-columns:1fr 1fr;gap:5mm}}
.tile{{background:rgba(255,255,255,.10);border:0.3mm solid rgba(255,255,255,.35);border-radius:3mm;padding:5mm 6mm}} .tile b{{display:block;font-size:22pt;color:#fff}} .tile span{{font-size:10pt;color:#c9d9ee}}
.foot{{position:absolute;left:24mm;right:24mm;bottom:16mm;font-size:10pt;color:#9fb6d0}}
</style></head><body><div class='c'><div class='tag'>CALIBER 2026 | Case 1: Manufacturing Knowledge Hub</div>
<h1>{TITLE}</h1><h2>{PROD}</h2><h3>{TEAM}</h3>{names}<div class='tiles'>{t}</div>
<div class='foot'>Version {VERSION} | {DATE} | Companion to Business_Impact_Financial_Model.xlsx. Base scenario. Sample data provided for CALIBER purposes only.</div></div></body></html>"""

OVERRIDE = "<style>@page{size:A4;margin:16mm 17mm 18mm 17mm}.sheet{padding:0!important;width:auto!important}h1{margin-top:7mm;font-size:18pt}h1:first-of-type{margin-top:0}.intro{font-size:10.4pt}table.t{font-size:8.8pt;break-inside:avoid}.fig .cap{font-size:8.6pt} body{font-size:9.6pt;line-height:1.42} p{margin:0 0 2.4mm} h2{margin:5mm 0 2mm;font-size:12.2pt}.toc .row{font-size:9.6pt;padding:.2mm 0}</style>"

def render(htmlfile, pdffile, footer):
    js = os.path.join(engine.BLD, "render.js")
    open(js, "w").write("""const {chromium}=require('playwright');(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});const p=await b.newPage();
await p.goto('file://'+process.argv[2],{waitUntil:'load'});await p.waitForTimeout(800);const f=process.argv[4]==='1';
await p.pdf({path:process.argv[3],format:'A4',printBackground:true,preferCSSPageSize:true,margin:{top:'0',bottom:'0',left:'0',right:'0'},displayHeaderFooter:f,headerTemplate:'<span></span>',footerTemplate:'<div style="width:100%;font:7.5pt Arial;color:#6B7A8C;padding:0 17mm;display:flex;justify-content:space-between"><span>Business Impact and Financial Modelling Report | Asset Knowledge Platform</span><span>Page <span class="pageNumber"></span></span></div>'});await b.close()})()""")
    subprocess.run(["node", js, htmlfile, pdffile, "1" if footer else "0"], check=True, cwd=os.path.dirname(HERE))

def pages_of(pdf):
    pg = {}
    for i, p in enumerate(PdfReader(pdf).pages):
        for m in re.finditer(r"@@([HS][A-Z0-9.]+)@@", p.extract_text() or ""): pg.setdefault(m.group(1), i + 1)
    return pg

def main():
    doc = Doc("r", RC.blocks()); pages = {}
    bp = os.path.join(engine.BLD, "body.html"); bpdf = os.path.join(engine.BLD, "body.pdf")
    for it in range(2):
        h = body_html(doc, pages, None).replace("</head>", OVERRIDE + "</head>")
        h = h.replace("<h1><span class='marker'>", "<h1 class=\"pb\"><span class='marker'>")
        h = h.replace("<h1 style='page-break-before:always'>Table of contents</h1>", "<h1 style='page-break-before:auto;margin-top:0'>Contents</h1>")
        open(bp, "w").write(h); render(bp, bpdf, True); pages = pages_of(bpdf)
        print("pass", it, len(PdfReader(bpdf).pages), "pages, markers", len(pages))
    h = re.sub(r"<span class='marker'>@@[A-Z0-9.]+@@</span>", "", h); open(bp, "w").write(h); render(bp, bpdf, True)
    cp = os.path.join(engine.BLD, "cover.html"); open(cp, "w").write(cover_html()); render(cp, os.path.join(engine.BLD, "cover.pdf"), False)
    w = PdfWriter()
    for f in ("cover.pdf", "body.pdf"):
        for p in PdfReader(os.path.join(engine.BLD, f)).pages: w.add_page(p)
    w.add_metadata({"/Title": TITLE, "/Author": TEAM}); w.write(OUT_PDF); print("PDF", len(w.pages), "pages")

if __name__ == "__main__": main()
