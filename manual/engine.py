"""Manual engine: block DSL -> HTML (for PDF via Chromium) and DOCX (python-docx). One content source for both outputs."""
import os, re, html, json, subprocess, textwrap
from PIL import Image

HERE = os.path.dirname(__file__)
IMG = os.path.join(HERE, "img")
BLD = os.path.join(HERE, "build")
os.makedirs(BLD, exist_ok=True)

NAVY, BLUE, TEAL, ORANGE, GREEN, RED, PURPLE, GREY = "#0B2A4A", "#1560BD", "#0E8A7D", "#E8793A", "#2E9E5B", "#D64545", "#6B4FBB", "#6B7A8C"

# ---------------------------------------------------------------- block constructors
def H1(num, title, roles=None, part=None, intro=None): return ("h1", num, title, roles or [], part, intro)
def H2(text): return ("h2", text)
def P(text): return ("p", text)
def STEPS(items): return ("steps", items)
def BUL(items): return ("bul", items)
def FIG(img, caption, call=None, maxh=None): return ("fig", img, caption, call or [], maxh)
def NOTE(kind, text): return ("note", kind, text)
def TABLE(head, rows, widths=None): return ("table", head, rows, widths)
def FLOW(fid, rows, caption): return ("flow", fid, rows, caption)

# ---------------------------------------------------------------- flowchart renderer (SVG)
def _wrap(t, n):
    return textwrap.wrap(t, n) or [""]

def flow_svg(rows, width=1000):
    """rows: list of rows; row = list of items. item = (kind, text[, branch]) kind in box|dia|pill|db. Consecutive items in a row are joined by arrows;
    the last item of a row connects to the first item of the next row with an elbow line."""
    margin, gap_x, gap_y = 20, 46, 70
    colw, nodeh = 150, 62
    pos = []; y = 24; out = []
    # layout
    for r, row in enumerate(rows):
        n = len(row); avail = width - 2 * margin
        w = min(190, (avail - (n - 1) * gap_x) / n) if n else 150
        total = n * w + (n - 1) * gap_x; x0 = (width - total) / 2
        rp = []
        for i, it in enumerate(row):
            h = 86 if it[0] == "dia" else nodeh
            rp.append((x0 + i * (w + gap_x), y, w, h))
        pos.append(rp); y += max(p[3] for p in rp) + gap_y + (14 if any(len(it) > 2 and it[2] for it in row) else 0)
    H = y - gap_y + 30
    colors = {"box": ("#E6EFFB", BLUE), "dia": ("#FDF1DC", ORANGE), "pill": (GREEN, GREEN), "db": ("#E4F4EA", GREEN), "warn": ("#FBE6E6", RED), "ai": ("#EEE9FA", PURPLE)}
    s = [f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {width} {H:.0f}" width="{width}" height="{H:.0f}" font-family="Arial, Liberation Sans, sans-serif">',
         '<defs><marker id="ah" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="8" markerHeight="8" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="#6B7A8C"/></marker></defs>',
         f'<rect width="{width}" height="{H:.0f}" fill="#ffffff"/>']
    def center(p): return (p[0] + p[2] / 2, p[1] + p[3] / 2)
    for r, row in enumerate(rows):
        for i, it in enumerate(row):
            kind, text = it[0], it[1]; x, yy, w, h = pos[r][i]
            fill, stroke = colors.get(kind, colors["box"]); tc = "#ffffff" if kind == "pill" else NAVY
            if kind == "dia":
                cx, cy = x + w / 2, yy + h / 2
                s.append(f'<polygon points="{cx},{yy} {x+w},{cy} {cx},{yy+h} {x},{cy}" fill="{fill}" stroke="{stroke}" stroke-width="2"/>')
            elif kind == "db":
                s.append(f'<rect x="{x}" y="{yy}" width="{w}" height="{h}" rx="14" fill="{fill}" stroke="{stroke}" stroke-width="2"/><line x1="{x}" y1="{yy+14}" x2="{x+w}" y2="{yy+14}" stroke="{stroke}" stroke-width="1.2"/>')
            else:
                rx = h / 2 if kind == "pill" else 9
                s.append(f'<rect x="{x}" y="{yy}" width="{w}" height="{h}" rx="{rx}" fill="{fill}" stroke="{stroke}" stroke-width="2"/>')
            lines = _wrap(text, 17 if kind != "dia" else 13); fs = 14.5
            ty = yy + h / 2 - (len(lines) - 1) * 9 + 5
            for k, ln in enumerate(lines):
                s.append(f'<text x="{x+w/2}" y="{ty + k*18:.1f}" font-size="{fs}" font-weight="700" fill="{tc}" text-anchor="middle">{html.escape(ln)}</text>')
            if len(it) > 2 and it[2]:
                s.append(f'<text x="{x+w/2}" y="{yy+h+17}" font-size="12.5" font-weight="700" fill="{RED if kind=="dia" else GREY}" text-anchor="middle">{html.escape(it[2])}</text>')
            if i > 0:
                px, py, pw, ph = pos[r][i - 1]; ay = py + ph / 2; by = yy + h / 2
                s.append(f'<line x1="{px+pw+3}" y1="{ay}" x2="{x-4}" y2="{by}" stroke="#6B7A8C" stroke-width="2" marker-end="url(#ah)"/>')
                # branch label on arrows leaving a decision
                prev = rows[r][i - 1]
                if prev[0] == "dia":
                    s.append(f'<text x="{(px+pw+x)/2}" y="{ay-7}" font-size="12.5" font-weight="700" fill="{GREEN}" text-anchor="middle">Yes</text>')
        if r < len(rows) - 1:
            lx, ly, lw, lh = pos[r][-1]; fx, fy, fw, fh = pos[r + 1][0]
            sx, sy = lx + lw / 2, ly + lh + (16 if any(len(it) > 2 and it[2] for it in rows[r]) and False else 0)
            my = ly + max(p[3] for p in pos[r]) + (gap_y - 6) / 2 + (14 if any(len(it) > 2 and it[2] for it in rows[r]) else 0)
            s.append(f'<polyline points="{sx},{ly+lh+ (18 if len(rows[r][-1])>2 and rows[r][-1][2] else 3)} {sx},{my} {fx+fw/2},{my} {fx+fw/2},{fy-4}" fill="none" stroke="#6B7A8C" stroke-width="2" marker-end="url(#ah)"/>')
    s.append("</svg>")
    return "\n".join(s), H

# ---------------------------------------------------------------- inline markup
def inline(t):
    t = html.escape(t)
    t = re.sub(r"\*\*(.+?)\*\*", r"<b>\1</b>", t)
    t = re.sub(r"`(.+?)`", r"<span class='k'>\1</span>", t)
    return t

def plain(t): return re.sub(r"\*\*(.+?)\*\*", r"\1", re.sub(r"`(.+?)`", r"\1", t))

# ---------------------------------------------------------------- images
_img_cache = {}
def jpg(img, maxw=1500):
    """convert a PNG screenshot to a compact JPEG in build/ and return (path, w, h)"""
    if img in _img_cache: return _img_cache[img]
    src = os.path.join(IMG, img + ".png")
    if not os.path.exists(src):
        raise FileNotFoundError(src)
    im = Image.open(src).convert("RGB"); w, h = im.size
    # trim empty background at the bottom of the capture
    import numpy as np
    a = np.asarray(im).astype(int); bg = a[h - 1, w - 1]; y = h - 1
    while y > int(h * 0.35) and np.abs(a[y, ::4] - bg).max() < 8: y -= 1
    if y < h - 40:
        im = im.crop((0, 0, w, min(h, y + 28))); w, h = im.size
    if w > maxw: im = im.resize((maxw, int(h * maxw / w)), Image.LANCZOS); w, h = im.size
    out = os.path.join(BLD, img + ".jpg"); im.save(out, quality=86, optimize=True)
    _img_cache[img] = (out, w, h); return _img_cache[img]

# ---------------------------------------------------------------- document model
class Doc:
    def __init__(self, title, blocks):
        self.title = title; self.blocks = blocks
        self.figs = {}; self.toc = []   # toc entries: (level, key, label)
        self._number()
    def _number(self):
        fig = 0; ch = None; h2n = 0
        for b in self.blocks:
            if b[0] == "h1":
                ch = b[1]; h2n = 0; self.toc.append((1, f"H{ch}", f"{ch}", b[2], b[4]))
            elif b[0] == "h2":
                h2n += 1; self.toc.append((2, f"S{ch}.{h2n}", f"{ch}.{h2n}", b[1], None))
            elif b[0] in ("fig", "flow"):
                fig += 1; self.figs[id(b)] = fig

CSS = """
@page { size: A4; margin: 0; }
* { box-sizing: border-box; }
body { margin: 0; font-family: Arial, 'Liberation Sans', Helvetica, sans-serif; color: #1B2A3A; font-size: 9.8pt; line-height: 1.42; }
.page { width: 210mm; height: 297mm; padding: 22mm 20mm 20mm 20mm; position: relative; page-break-after: always; overflow: hidden; }
.flow-page { width: 210mm; padding: 0; page-break-after: auto; }
.sheet { padding: 20mm 20mm 22mm 20mm; width: 210mm; }
h1 { font-size: 22pt; color: #0B2A4A; margin: 9mm 0 4mm; line-height: 1.2; page-break-after: avoid; } h1.pb { page-break-before: always; margin-top: 0; }
h1 .num { color: #1560BD; margin-right: 3mm; }
.partband { font-size: 9pt; letter-spacing: 1.5pt; text-transform: uppercase; color: #fff; background: linear-gradient(90deg,#0B2A4A,#1560BD); padding: 2.2mm 4mm; border-radius: 2mm; margin: 0 0 6mm; }
.roles { margin: 0 0 4mm; font-size: 9pt; color: #6B7A8C; }
.roles span.chip { display: inline-block; background: #E6EFFB; color: #1560BD; border: 0.3mm solid #1560BD; padding: 0.4mm 2.4mm; border-radius: 3mm; margin-right: 1.5mm; font-weight: 700; }
.intro { font-size: 11.2pt; color: #0B2A4A; border-left: 1.2mm solid #4FA9CE; padding: 1mm 0 1mm 4mm; margin: 0 0 5mm; }
h2 { font-size: 13pt; color: #0B2A4A; margin: 6mm 0 2.2mm; padding-bottom: 1mm; border-bottom: 0.4mm solid #1560BD; page-break-after: avoid; }
h2 .n { color: #1560BD; margin-right: 2mm; }
p { margin: 0 0 3mm; text-align: left; }
.k { font-family: 'Liberation Mono', monospace; font-size: 9.3pt; background: #F2F6FA; border: 0.2mm solid #D5E0EC; padding: 0 1mm; border-radius: 1mm; }
ol.steps { list-style: none; counter-reset: s; padding: 0; margin: 0 0 4mm; }
ol.steps li { counter-increment: s; position: relative; padding: 0 0 0 9mm; margin: 0 0 2.4mm; min-height: 6mm; }
ol.steps li::before { content: counter(s); position: absolute; left: 0; top: 0.2mm; width: 6mm; height: 6mm; border-radius: 50%; background: #1560BD; color: #fff; font-weight: 700; font-size: 9pt; text-align: center; line-height: 6mm; }
ul.bul { margin: 0 0 4mm; padding-left: 6mm; } ul.bul li { margin-bottom: 1.4mm; }
.fig { margin: 3mm 0 5mm; page-break-inside: avoid; break-inside: avoid; text-align: center; }
.fig .frame { border: 0.3mm solid #B9C8DA; border-radius: 1.5mm; padding: 1mm; background: #fff; display: table; margin: 0 auto; break-inside: avoid; max-width: 100%; box-shadow: 0 0.6mm 1.6mm rgba(11,42,74,.12); }
.fig img { display: block; max-width: 100%; margin: 0 auto; }
.fig .cap { font-size: 9pt; color: #1560BD; font-weight: 700; margin-top: 2mm; text-align: left; }
.legend { text-align: left; margin-top: 2mm; display: grid; grid-template-columns: 1fr 1fr; gap: 1.2mm 6mm; font-size: 9.3pt; }
.legend div { position: relative; padding-left: 7mm; min-height: 5mm; }
.legend b.n { position: absolute; left: 0; top: 0; width: 5mm; height: 5mm; border-radius: 50%; background: #E8793A; color: #fff; text-align: center; font-size: 8.5pt; line-height: 5mm; }
.note { border-left: 1.2mm solid #1560BD; background: #F2F6FA; padding: 2.4mm 4mm; margin: 0 0 4mm; border-radius: 0 1.5mm 1.5mm 0; page-break-inside: avoid; font-size: 10pt; }
.note b.t { display: block; font-size: 8.6pt; letter-spacing: .8pt; text-transform: uppercase; margin-bottom: .6mm; }
.note.tip { border-color: #2E9E5B; background: #E4F4EA; } .note.tip b.t { color: #2E9E5B; }
.note.caution { border-color: #E8793A; background: #FDF1DC; } .note.caution b.t { color: #B85A1E; }
.note.note { } .note.note b.t { color: #1560BD; }
.note.role { border-color: #6B4FBB; background: #EEE9FA; } .note.role b.t { color: #6B4FBB; }
table.t { width: 100%; border-collapse: collapse; margin: 1mm 0 5mm; font-size: 9.3pt; page-break-inside: auto; }
table.t th { background: #0B2A4A; color: #fff; text-align: left; padding: 1.8mm 2.4mm; font-weight: 700; }
table.t td { border-bottom: 0.25mm solid #D5E0EC; padding: 1.8mm 2.4mm; vertical-align: top; }
table.t tr:nth-child(even) td { background: #F7F9FC; } table.t tr { page-break-inside: avoid; }
.toc h1 { page-break-before: auto; }
.toc .row { display: flex; align-items: baseline; font-size: 10pt; margin: 0; padding: .6mm 0; }
.toc .row .lbl { white-space: nowrap; } .toc .row .dots { flex: 1; border-bottom: 0.3mm dotted #98A6B8; margin: 0 1.5mm; transform: translateY(-1mm); } .toc .row .pg { font-weight: 700; color: #0B2A4A; }
.toc .part { font-weight: 700; color: #fff; background: #0B2A4A; padding: 1.2mm 3mm; border-radius: 1.5mm; margin: 4mm 0 1.2mm; font-size: 9.6pt; letter-spacing: .4pt; }
.toc .c1 { font-weight: 700; color: #0B2A4A; margin-top: 1.2mm; } .toc .c2 { padding-left: 8mm; font-size: 9.4pt; color: #3A4A5C; }
.marker { font-size: 1px; color: #fff; line-height: 0; }
.dc td { padding: 2mm 3mm; border-bottom: 0.25mm solid #D5E0EC; } .dc td:first-child { width: 42mm; font-weight: 700; color: #0B2A4A; }
svg.flow { width: 100%; height: auto; }
"""

def figure_html(b, num, doc):
    _, img, cap, calls, maxh = b
    path, w, h = jpg(img)
    rel = os.path.relpath(path, BLD)
    mh = min(max(maxh * 0.68, 105), 125) if maxh else (130 if h / w > 0.85 else 999)
    style = f"max-height:{mh}mm;" if mh < 999 else ""
    wcss = "" if w / max(h, 1) > 1.0 or not maxh else ""
    leg = ""
    pj = os.path.join(IMG, img + ".placed.json")
    if calls and os.path.exists(pj):
        ok = set(json.load(open(pj))); calls = [c for c in calls if c[0] in ok]
    elif calls and os.environ.get("MANUAL_STRICT"):
        calls = []
    if calls:
        leg = "<div class='legend'>" + "".join(f"<div><b class='n'>{c[0]}</b>{inline(c[1])}</div>" for c in calls) + "</div>"
    return f"<div class='fig'><div class='frame'><img src='{rel}' style='{style}'></div><div class='cap'>Figure {num}. {inline(cap)}</div>{leg}</div>"

def flow_html(b, num):
    _, fid, rows, cap = b
    svg, H = flow_svg(rows)
    svg = svg.replace("<svg ", '<svg class="flow" ', 1)
    return f"<div class='fig'><div class='frame' style='display:block'>{svg}</div><div class='cap'>Figure {num}. {inline(cap)}</div></div>"

def body_html(doc, pages=None, front=None):
    pages = pages or {}
    out = []
    # front matter: document control + toc
    if front: out.append(front)
    toc = ["<div class='sheet toc'><h1 style='page-break-before:always'>Table of contents</h1>"]
    part_seen = None
    for lvl, key, lab, text, part in doc.toc:
        pg = pages.get(key, "0")
        if lvl == 1:
            if part and part != part_seen:
                toc.append(f"<div class='part'>{html.escape(part)}</div>"); part_seen = part
            toc.append(f"<div class='row c1'><span class='lbl'>{lab}&nbsp;&nbsp;{html.escape(text)}</span><span class='dots'></span><span class='pg'>{pg}</span></div>")
        elif False:
            toc.append(f"<div class='row c2'><span class='lbl'>{lab}&nbsp;&nbsp;{html.escape(text)}</span><span class='dots'></span><span class='pg'>{pg}</span></div>")
    toc.append("</div>")
    out.append("".join(toc))
    ch = None; h2n = 0; first = True
    out.append("<div class='sheet'>")
    for b in doc.blocks:
        k = b[0]
        if k == "h1":
            _, num, title, roles, part, intro = b; ch = num; h2n = 0
            pb = ' class="pb"' if (part != getattr(doc, "_lastpart", None)) else ""
            doc._lastpart = part
            out.append(f"<h1{pb}><span class='marker'>@@H{num}@@</span><span class='num'>{num}</span>{html.escape(title)}</h1>")
            if part and pb: out.append(f"<div class='partband'>{html.escape(part)}</div>")
            if roles: out.append("<div class='roles'>Used by: " + "".join(f"<span class='chip'>{r}</span>" for r in roles) + "</div>")
            if intro: out.append(f"<div class='intro'>{inline(intro)}</div>")
        elif k == "h2":
            h2n += 1; out.append(f"<h2><span class='marker'>@@S{ch}.{h2n}@@</span><span class='n'>{ch}.{h2n}</span>{html.escape(b[1])}</h2>")
        elif k == "p": out.append(f"<p>{inline(b[1])}</p>")
        elif k == "steps": out.append("<ol class='steps'>" + "".join(f"<li>{inline(i)}</li>" for i in b[1]) + "</ol>")
        elif k == "bul": out.append("<ul class='bul'>" + "".join(f"<li>{inline(i)}</li>" for i in b[1]) + "</ul>")
        elif k == "fig": out.append(figure_html(b, doc.figs[id(b)], doc))
        elif k == "flow": out.append(flow_html(b, doc.figs[id(b)]))
        elif k == "note":
            kind = b[1].lower(); lab = {"note": "Note", "tip": "Tip", "caution": "Caution", "role": "Roles"}[kind]
            out.append(f"<div class='note {kind}'><b class='t'>{lab}</b>{inline(b[2])}</div>")
        elif k == "table":
            _, head, rows, widths = b
            cg = "".join(f"<col style='width:{w}%'>" for w in widths) if widths else ""
            out.append(f"<table class='t'><colgroup>{cg}</colgroup><tr>" + "".join(f"<th>{inline(h)}</th>" for h in head) + "</tr>" + "".join("<tr>" + "".join(f"<td>{inline(c)}</td>" for c in r) + "</tr>" for r in rows) + "</table>")
    out.append("</div>")
    return f"<!doctype html><html><head><meta charset='utf-8'><style>{CSS}</style></head><body>" + "".join(out) + "</body></html>"


def collect_calls(doc):
    out = {}
    for b in doc.blocks:
        if b[0] == "fig" and b[3]:
            l = [[c[0], c[2], c[3] if len(c) > 3 else None, c[4] if len(c) > 4 else None] for c in b[3] if len(c) > 2]
            if l: out[b[1]] = l
    return out
