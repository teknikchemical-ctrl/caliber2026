"""Word build: python3 manual/docx_build.py   (needs build/cover.pdf, back.pdf from build.py pdf)"""
import os, re, sys, json, subprocess
sys.path.insert(0, os.path.dirname(__file__))
from engine import *
import build as B
from docx import Document
from docx.shared import Pt, Cm, RGBColor, Mm
from docx.enum.text import WD_ALIGN_PARAGRAPH, WD_BREAK
from docx.enum.section import WD_SECTION
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.oxml.ns import qn
from docx.oxml import OxmlElement
from pypdf import PdfReader

def rgb(h): h = h.lstrip("#"); return RGBColor(int(h[0:2], 16), int(h[2:4], 16), int(h[4:6], 16))
def shade(el, fill):
    pr = el.get_or_add_tcPr() if hasattr(el, "get_or_add_tcPr") else el.get_or_add_pPr()
    sh = OxmlElement("w:shd"); sh.set(qn("w:val"), "clear"); sh.set(qn("w:color"), "auto"); sh.set(qn("w:fill"), fill.lstrip("#")); pr.append(sh)
def cell_borders(cell, **kw):
    tcPr = cell._tc.get_or_add_tcPr(); b = OxmlElement("w:tcBorders")
    for edge in ("top", "left", "bottom", "right"):
        v = kw.get(edge)
        e = OxmlElement(f"w:{edge}")
        if v: e.set(qn("w:val"), "single"); e.set(qn("w:sz"), str(v[0])); e.set(qn("w:color"), v[1].lstrip("#"))
        else: e.set(qn("w:val"), "nil")
        b.append(e)
    tcPr.append(b)
def cell_margins(cell, top=60, bottom=60, left=100, right=100):
    tcPr = cell._tc.get_or_add_tcPr(); m = OxmlElement("w:tcMar")
    for k, v in (("top", top), ("left", left), ("bottom", bottom), ("right", right)):
        e = OxmlElement(f"w:{k}"); e.set(qn("w:w"), str(v)); e.set(qn("w:type"), "dxa"); m.append(e)
    tcPr.append(m)
def set_col_widths(table, widths_cm):
    table.autofit = False
    tblPr = table._tbl.tblPr; lay = OxmlElement("w:tblLayout"); lay.set(qn("w:type"), "fixed"); tblPr.append(lay)
    for row in table.rows:
        for i, w in enumerate(widths_cm):
            if i < len(row.cells): row.cells[i].width = Cm(w)
def keep_next(p, on=True): p.paragraph_format.keep_with_next = on
def no_split_row(row):
    trPr = row._tr.get_or_add_trPr(); e = OxmlElement("w:cantSplit"); trPr.append(e)
def repeat_header(row):
    trPr = row._tr.get_or_add_trPr(); e = OxmlElement("w:tblHeader"); trPr.append(e)

def add_runs(p, text, size=None, color=None, bold=False):
    parts = re.split(r"(\*\*.+?\*\*|`.+?`)", text)
    for s in parts:
        if not s: continue
        if s.startswith("**"): r = p.add_run(s[2:-2]); r.bold = True
        elif s.startswith("`"): r = p.add_run(s[1:-1]); r.font.name = "Courier New"; r._element.rPr.rFonts.set(qn("w:eastAsia"), "Courier New")
        else: r = p.add_run(s); r.bold = bold
        if size: r.font.size = Pt(size)
        if color: r.font.color.rgb = rgb(color)
    return p

def field(p, instr, cached="", size=None, color=None):
    def mk(t, **a):
        e = OxmlElement(t)
        for k, v in a.items(): e.set(qn(k), v)
        return e
    r1 = p.add_run(); r1._r.append(mk("w:fldChar", **{"w:fldCharType": "begin"}))
    r2 = p.add_run(); it = OxmlElement("w:instrText"); it.set(qn("xml:space"), "preserve"); it.text = instr; r2._r.append(it)
    r3 = p.add_run(); r3._r.append(mk("w:fldChar", **{"w:fldCharType": "separate"}))
    r4 = p.add_run(cached)
    r5 = p.add_run(); r5._r.append(mk("w:fldChar", **{"w:fldCharType": "end"}))
    for r in (r1, r2, r3, r4, r5):
        if size: r.font.size = Pt(size)
        if color: r.font.color.rgb = rgb(color)

def render_flows(doc):
    os.makedirs(BLD, exist_ok=True); items = []
    for b in doc.blocks:
        if b[0] == "flow":
            svg, H = flow_svg(b[2]); f = os.path.join(BLD, f"flow_{b[1]}.svg"); open(f, "w").write(svg); items.append((f, os.path.join(BLD, f"flow_{b[1]}.png")))
    js = os.path.join(BLD, "flows.js")
    open(js, "w").write("const {chromium}=require('playwright'),fs=require('fs');(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});const p=await b.newPage({deviceScaleFactor:1.6,viewport:{width:1000,height:700}});for(const [s,o] of JSON.parse(process.argv[2])){await p.setContent('<body style=\"margin:0\">'+fs.readFileSync(s,'utf8')+'</body>');const e=await p.$('svg');await e.screenshot({path:o})}await b.close()})()")
    subprocess.run(["node", js, json.dumps(items)], check=True, cwd=os.path.dirname(HERE))

def pdf_to_png(pdf, out, dpi=130):
    subprocess.run(["pdftoppm", "-png", "-r", str(dpi), "-singlefile", pdf, out[:-4]], check=True)

def build_docx(toc_pages=None, out=None):
    toc_pages = toc_pages or {}
    blocks = B.assemble(); doc = Doc("m", blocks); render_flows(doc)
    d = Document()
    st = d.styles
    n = st["Normal"]; n.font.name = "Arial"; n.font.size = Pt(10); n._element.rPr.rFonts.set(qn("w:eastAsia"), "Arial")
    n.paragraph_format.space_after = Pt(6); n.paragraph_format.line_spacing = 1.2
    for name, size, col, before, after in (("Heading 1", 22, NAVY, 0, 8), ("Heading 2", 13.5, NAVY, 14, 5)):
        s = st[name]; s.font.name = "Arial"; s.font.size = Pt(size); s.font.bold = True; s.font.color.rgb = rgb(col)
        s._element.rPr.rFonts.set(qn("w:eastAsia"), "Arial"); s._element.rPr.rFonts.set(qn("w:ascii"), "Arial"); s._element.rPr.rFonts.set(qn("w:hAnsi"), "Arial")
        s.paragraph_format.space_before = Pt(before); s.paragraph_format.space_after = Pt(after); s.paragraph_format.keep_with_next = True
    for nm in ("List Bullet",):
        st[nm].font.name = "Arial"; st[nm].font.size = Pt(10)
    # ---------- section 1: cover (zero margins)
    s1 = d.sections[0]; s1.page_width = Mm(210); s1.page_height = Mm(297)
    for a in ("left_margin", "right_margin", "top_margin", "bottom_margin", "header_distance", "footer_distance"): setattr(s1, a, Mm(0))
    cov = os.path.join(BLD, "cover.png"); pdf_to_png(os.path.join(BLD, "cover.pdf"), cov)
    p = d.add_paragraph(); p.paragraph_format.space_after = Pt(0); p.paragraph_format.line_spacing = 1.0
    p.add_run().add_picture(cov, width=Mm(210), height=Mm(291))
    # ---------- section 2: body
    s2 = d.add_section(WD_SECTION.NEW_PAGE)
    for a, v in (("left_margin", 18), ("right_margin", 18), ("top_margin", 18), ("bottom_margin", 20), ("header_distance", 8), ("footer_distance", 9)): setattr(s2, a, Mm(v))
    s2.page_width = Mm(210); s2.page_height = Mm(297)
    pg = OxmlElement("w:pgNumType"); pg.set(qn("w:start"), "1"); s2._sectPr.append(pg)
    s2.footer.is_linked_to_previous = False
    fp = s2.footer.paragraphs[0]; fp.text = ""
    fp.paragraph_format.tab_stops.add_tab_stop(Mm(174), alignment=2)
    r = fp.add_run("Asset Knowledge Platform | User Manual\tPage "); r.font.size = Pt(8); r.font.color.rgb = rgb(GREY)
    field(fp, "PAGE", "1", 8, GREY)
    CW = 17.4
    # document control
    h = d.add_paragraph("Document control"); h.style = st["Heading 1"]
    rows = [("Document", f"{B.TITLE}, {B.SUB}"), ("Version", B.VERSION), ("Date", B.DATE), ("Prepared by", f"{B.TEAM}: " + ", ".join(B.NAMES)),
            ("Applies to", "The sample installation for the LLDPE unit, eight equipment sets"), ("Readers", "Operators, engineers, reliability engineers, HSE engineers and managers"), ("Data", "Sample data provided for CALIBER purposes only")]
    t = d.add_table(rows=len(rows), cols=2); set_col_widths(t, [4.2, 13.2])
    for i, (a, b2) in enumerate(rows):
        for j, tx in enumerate((a, b2)):
            c = t.cell(i, j); c.text = ""; pr = c.paragraphs[0]; r = pr.add_run(tx); r.font.size = Pt(10); r.bold = (j == 0)
            if j == 0: r.font.color.rgb = rgb(NAVY)
            cell_borders(c, bottom=(4, "#D5E0EC")); cell_margins(c)
    h2 = d.add_paragraph("Revision history"); h2.style = st["Heading 2"]
    t = d.add_table(rows=2, cols=3); set_col_widths(t, [3, 5, 9.4])
    for j, tx in enumerate(("Version", "Date", "Change")):
        c = t.cell(0, j); c.text = ""; r = c.paragraphs[0].add_run(tx); r.bold = True; r.font.color.rgb = rgb("#FFFFFF"); r.font.size = Pt(9.5); shade(c._tc, NAVY); cell_margins(c)
    for j, tx in enumerate((B.VERSION, B.DATE, "First issue")):
        c = t.cell(1, j); c.text = ""; c.paragraphs[0].add_run(tx).font.size = Pt(9.5); cell_margins(c); cell_borders(c, bottom=(4, "#D5E0EC"))
    h2 = d.add_paragraph("How to read the figures"); h2.style = st["Heading 2"]
    d.add_paragraph("Each figure is a screenshot of the platform. Orange numbered markers point to the parts of the screen that the legend under the figure describes. Each chapter begins with the roles that normally use the page.")
    # TOC (heading not in TOC)
    br = d.add_paragraph(); br.add_run().add_break(WD_BREAK.PAGE)
    th = d.add_paragraph("Table of contents"); th.style = st["Heading 1"]
    # remove TOC heading from outline so it is not listed
    pPr = th._p.get_or_add_pPr(); ol = OxmlElement("w:outlineLvl"); ol.set(qn("w:val"), "9"); pPr.append(ol)
    # TOC field with cached entries
    tp = d.add_paragraph(); fld_begin = tp.add_run(); fc = OxmlElement("w:fldChar"); fc.set(qn("w:fldCharType"), "begin"); fld_begin._r.append(fc)
    r2 = tp.add_run(); it = OxmlElement("w:instrText"); it.set(qn("xml:space"), "preserve"); it.text = ' TOC \\o "1-1" \\h \\z \\u '; r2._r.append(it)
    r3 = tp.add_run(); fc = OxmlElement("w:fldChar"); fc.set(qn("w:fldCharType"), "separate"); r3._r.append(fc)
    part_seen = None; first = True
    def toc_line(label, pagestr, lvl):
        p = d.add_paragraph(); p.paragraph_format.space_after = Pt(1.5 if lvl == 2 else 2); p.paragraph_format.space_before = Pt(5 if lvl == 1 else 0)
        p.paragraph_format.left_indent = Mm(0 if lvl == 1 else 8)
        p.paragraph_format.tab_stops.add_tab_stop(Mm(174), alignment=2, leader=1)
        r = p.add_run(label + "\t" + pagestr); r.font.size = Pt(10 if lvl == 1 else 9.5); r.bold = (lvl == 1)
        if lvl == 1: r.font.color.rgb = rgb(NAVY)
        return p
    last = None
    for lvl, key, lab, text, part in doc.toc:
        if lvl == 1 and part and part != part_seen:
            pp = d.add_paragraph(); pp.paragraph_format.space_before = Pt(8); pp.paragraph_format.space_after = Pt(2); pp.paragraph_format.keep_with_next = True
            rr = pp.add_run(" " + part + " "); rr.bold = True; rr.font.size = Pt(9.5); rr.font.color.rgb = rgb("#FFFFFF"); shade(pp._p.get_or_add_pPr().getparent() if False else pp._p, NAVY) if False else None
            sh = OxmlElement("w:shd"); sh.set(qn("w:val"), "clear"); sh.set(qn("w:color"), "auto"); sh.set(qn("w:fill"), NAVY.lstrip("#")); pp._p.get_or_add_pPr().append(sh)
            part_seen = part
        if lvl == 2: continue
        label = f"{lab}  {text}"
        last = toc_line(label, str(toc_pages.get(key, "")), lvl)
    er = last.add_run(); fc = OxmlElement("w:fldChar"); fc.set(qn("w:fldCharType"), "end"); er._r.append(fc)
    # ---------- body
    ch = None; h2n = 0
    def add_fig(b, num, is_flow=False):
        if is_flow:
            path = os.path.join(BLD, f"flow_{b[1]}.png"); im = Image.open(path); w, h = im.size; cap = b[3]; calls = []
            wcm = CW; hcm = wcm * h / w
        else:
            _, img, cap, calls, maxh = b
            pj = os.path.join(IMG, img + ".placed.json")
            if calls and os.path.exists(pj):
                ok = set(json.load(open(pj))); calls = [c for c in calls if c[0] in ok]
            path, w, h = jpg(img)
            mh = min(max(maxh * 0.68, 105), 125) if maxh else (130 if h / w > 0.85 else 999)
            wcm = CW; hcm = wcm * h / w
            if mh < 999 and hcm > mh / 10: hcm = mh / 10; wcm = hcm * w / h
            if hcm > 20.5: hcm = 20.5; wcm = hcm * w / h
        t = d.add_table(rows=1, cols=1); t.alignment = WD_TABLE_ALIGNMENT.CENTER; c = t.cell(0, 0); c.text = ""
        cell_borders(c, top=(6, "#B9C8DA"), left=(6, "#B9C8DA"), bottom=(6, "#B9C8DA"), right=(6, "#B9C8DA")); cell_margins(c, 40, 40, 40, 40)
        pp = c.paragraphs[0]; pp.alignment = WD_ALIGN_PARAGRAPH.CENTER; pp.paragraph_format.space_after = Pt(0); pp.paragraph_format.line_spacing = 1.0
        pp.add_run().add_picture(path, width=Cm(wcm), height=Cm(hcm)); keep_next(pp)
        t.alignment = WD_TABLE_ALIGNMENT.CENTER
        cp = d.add_paragraph(); cp.paragraph_format.space_before = Pt(3); cp.paragraph_format.space_after = Pt(4)
        r = cp.add_run(f"Figure {num}. "); r.bold = True; r.font.size = Pt(9); r.font.color.rgb = rgb(BLUE)
        add_runs(cp, cap, 9, BLUE, True)
        if calls:
            cp.paragraph_format.keep_with_next = True
            rows = (len(calls) + 1) // 2
            lt = d.add_table(rows=rows, cols=4); set_col_widths(lt, [0.8, 7.9, 0.8, 7.9])
            for i, cl in enumerate(calls):
                rr, cc = i % rows, (i // rows) * 2
                nc = lt.cell(rr, cc); nc.text = ""; q = nc.paragraphs[0]; q.alignment = WD_ALIGN_PARAGRAPH.CENTER
                x = q.add_run(str(cl[0])); x.bold = True; x.font.size = Pt(8.5); x.font.color.rgb = rgb("#FFFFFF"); shade(nc._tc, ORANGE); cell_margins(nc, 20, 20, 20, 20)
                tc = lt.cell(rr, cc + 1); tc.text = ""; add_runs(tc.paragraphs[0], cl[1], 9); tc.paragraphs[0].paragraph_format.space_after = Pt(1); cell_margins(tc, 20, 20, 80, 40)
            for row in lt.rows: no_split_row(row)
        else:
            pass
        sp = d.add_paragraph(); sp.paragraph_format.space_after = Pt(4); sp.paragraph_format.line_spacing = 0.6
    first_h1 = True
    for b in doc.blocks:
        k = b[0]
        if k == "h1":
            _, num, title, roles, part, intro = b; ch = num; h2n = 0
            hp = d.add_paragraph(f"{num}  {title}"); hp.style = st["Heading 1"]; newpart = (part != getattr(doc, '_lp', None)); doc._lp = part; hp.paragraph_format.page_break_before = newpart; hp.paragraph_format.space_before = Pt(0 if newpart else 16)
            if part and newpart:
                pp = d.add_paragraph(); r = pp.add_run(" " + part.upper() + " "); r.font.size = Pt(8.5); r.bold = True; r.font.color.rgb = rgb("#FFFFFF")
                sh = OxmlElement("w:shd"); sh.set(qn("w:val"), "clear"); sh.set(qn("w:color"), "auto"); sh.set(qn("w:fill"), BLUE.lstrip("#")); pp._p.get_or_add_pPr().append(sh)
            if roles:
                pp = d.add_paragraph(); r = pp.add_run("Used by: " + ", ".join(roles)); r.font.size = Pt(9); r.font.color.rgb = rgb(GREY)
            if intro:
                pp = d.add_paragraph(); pPr = pp._p.get_or_add_pPr(); bd = OxmlElement("w:pBdr"); l = OxmlElement("w:left")
                l.set(qn("w:val"), "single"); l.set(qn("w:sz"), "24"); l.set(qn("w:space"), "8"); l.set(qn("w:color"), "4FA9CE"); bd.append(l); pPr.append(bd)
                pp.paragraph_format.left_indent = Mm(4); add_runs(pp, intro, 11, NAVY)
        elif k == "h2":
            h2n += 1; hp = d.add_paragraph(f"{ch}.{h2n}  {b[1]}"); hp.style = st["Heading 2"]
        elif k == "p":
            pp = d.add_paragraph(); add_runs(pp, b[1])
        elif k == "steps":
            for i, s_ in enumerate(b[1], 1):
                pp = d.add_paragraph(); pp.paragraph_format.left_indent = Mm(8); pp.paragraph_format.first_line_indent = Mm(-8); pp.paragraph_format.space_after = Pt(4)
                pp.paragraph_format.tab_stops.add_tab_stop(Mm(8))
                r = pp.add_run(f"{i}\t"); r.bold = True; r.font.color.rgb = rgb(BLUE)
                add_runs(pp, s_)
        elif k == "bul":
            for s_ in b[1]:
                pp = d.add_paragraph(style="List Bullet"); pp.paragraph_format.space_after = Pt(3); add_runs(pp, s_)
        elif k == "fig": add_fig(b, doc.figs[id(b)])
        elif k == "flow": add_fig(b, doc.figs[id(b)], True)
        elif k == "note":
            kind = b[1].lower(); lab = {"note": "NOTE", "tip": "TIP", "caution": "CAUTION", "role": "ROLES"}[kind]
            col, bg = {"note": (BLUE, "F2F6FA"), "tip": (GREEN, "E4F4EA"), "caution": ("#B85A1E", "FDF1DC"), "role": (PURPLE, "EEE9FA")}[kind]
            bar = {"note": BLUE, "tip": GREEN, "caution": ORANGE, "role": PURPLE}[kind]
            t = d.add_table(rows=1, cols=1); c = t.cell(0, 0); c.text = ""; shade(c._tc, bg); cell_borders(c, left=(36, bar)); cell_margins(c, 70, 70, 140, 120)
            q = c.paragraphs[0]; q.paragraph_format.space_after = Pt(1); r = q.add_run(lab); r.bold = True; r.font.size = Pt(8); r.font.color.rgb = rgb(col)
            q2 = c.add_paragraph(); q2.paragraph_format.space_after = Pt(0); add_runs(q2, b[2], 9.5)
            no_split_row(t.rows[0])
            sp = d.add_paragraph(); sp.paragraph_format.space_after = Pt(2); sp.paragraph_format.line_spacing = 0.5
        elif k == "table":
            _, head, rows_, widths = b
            ws = [CW * w / sum(widths) for w in widths] if widths else [CW / len(head)] * len(head)
            t = d.add_table(rows=1 + len(rows_), cols=len(head)); set_col_widths(t, ws)
            for j, hh in enumerate(head):
                c = t.cell(0, j); c.text = ""; r = c.paragraphs[0].add_run(plain(hh)); r.bold = True; r.font.size = Pt(9); r.font.color.rgb = rgb("#FFFFFF"); shade(c._tc, NAVY); cell_margins(c)
            repeat_header(t.rows[0])
            for i, rw in enumerate(rows_, 1):
                for j, tx in enumerate(rw):
                    c = t.cell(i, j); c.text = ""; q = c.paragraphs[0]; q.paragraph_format.space_after = Pt(0); add_runs(q, str(tx), 9)
                    cell_margins(c); cell_borders(c, bottom=(4, "#D5E0EC"))
                    if i % 2 == 0: shade(c._tc, "F7F9FC")
                no_split_row(t.rows[i])
            sp = d.add_paragraph(); sp.paragraph_format.space_after = Pt(4); sp.paragraph_format.line_spacing = 0.6
    # ---------- back cover
    s3 = d.add_section(WD_SECTION.NEW_PAGE)
    for a in ("left_margin", "right_margin", "top_margin", "bottom_margin", "header_distance", "footer_distance"): setattr(s3, a, Mm(0))
    s3.footer.is_linked_to_previous = False
    for pgp in s3.footer.paragraphs: pgp.text = ""
    back = os.path.join(BLD, "back.png"); pdf_to_png(os.path.join(BLD, "back.pdf"), back)
    p = d.add_paragraph(); p.paragraph_format.space_after = Pt(0); p.paragraph_format.line_spacing = 1.0
    p.add_run().add_picture(back, width=Mm(210), height=Mm(291))
    d.core_properties.title = f"{B.TITLE} {B.SUB}"; d.core_properties.author = B.TEAM
    out = out or os.path.join(HERE, "..", "deck", "manual", "Asset_Knowledge_Platform_User_Manual.docx")
    d.save(out); return out, doc

def lo_pdf(docx):
    od = os.path.join(BLD, "lo"); os.makedirs(od, exist_ok=True)
    subprocess.run(["soffice", "--headless", "--convert-to", "pdf", "--outdir", od, docx], check=True, capture_output=True, timeout=600)
    return os.path.join(od, os.path.basename(docx).replace(".docx", ".pdf"))

def find_pages(pdf, doc):
    r = PdfReader(pdf); texts = [(p.extract_text() or "") for p in r.pages]
    # body pages are numbered from 1 at the page after the cover
    res = {}
    for lvl, key, lab, text, part in doc.toc:
        pat = re.compile(r"^\s*" + re.escape(lab) + r"\s+" + re.escape(text) + r"\s*$", re.M)
        hits = [i for i, t in enumerate(texts) if pat.search(t)]
        if hits: res[key] = hits[-1]   # pdf index; body page number = index (cover is index 0)
    return res, len(texts)

if __name__ == "__main__":
    out, doc = build_docx()
    pdf = lo_pdf(out); pages, n = find_pages(pdf, doc); print("pass1 pages", n, "found", len(pages), "of", len(doc.toc))
    out, doc = build_docx(pages)
    pdf = lo_pdf(out); pages2, n = find_pages(pdf, doc); print("pass2 pages", n, "changed", sum(1 for k in pages if pages2.get(k) != pages[k]))
    if pages2 != pages:
        out, doc = build_docx(pages2)
    print("DOCX", out)
