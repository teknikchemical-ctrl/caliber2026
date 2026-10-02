"""Renders a .pptx to PNG images through HTML and Chromium, and reports text that overflows its box.
Used because the build machine has no Impress. Usage: python3 deck/preview.py deck.pptx outdir"""
import sys, os, html, json
from pptx import Presentation
from pptx.util import Emu
from pptx.enum.shapes import MSO_SHAPE_TYPE
from pptx.enum.text import PP_ALIGN, MSO_ANCHOR

PX = 96 / 914400.0
def px(v): return (v or 0) * PX

def color_of(fill):
    try:
        if fill.type == 1: return "#" + str(fill.fore_color.rgb)
    except Exception: pass
    return None

def run_html(r, base):
    f = r.font; st = []
    size = f.size.pt if f.size else base
    st.append(f"font-size:{size*96/72:.2f}px")
    if f.bold: st.append("font-weight:700")
    if f.italic: st.append("font-style:italic")
    try:
        if f.color and f.color.type is not None: st.append(f"color:#{f.color.rgb}")
    except Exception: pass
    return f'<span style="{";".join(st)}">{html.escape(r.text)}</span>'

def para_html(p, base=12):
    al = {PP_ALIGN.CENTER: "center", PP_ALIGN.RIGHT: "right"}.get(p.alignment, "left")
    ls = p.line_spacing if isinstance(p.line_spacing, float) else 1.0
    sa = p.space_after.pt if p.space_after is not None else 0
    inner = "".join(run_html(r, base) for r in p.runs) or "&nbsp;"
    return f'<div style="text-align:{al};line-height:{ls*1.15:.2f};margin-bottom:{sa*96/72:.1f}px">{inner}</div>'

def tf_html(tf, w, h, extra=""):
    anchor = {MSO_ANCHOR.MIDDLE: "center", MSO_ANCHOR.BOTTOM: "flex-end"}.get(tf.vertical_anchor, "flex-start")
    ml, mr, mt, mb = px(tf.margin_left), px(tf.margin_right), px(tf.margin_top), px(tf.margin_bottom)
    body = "".join(para_html(p) for p in tf.paragraphs)
    return f'<div class="tf" style="position:absolute;left:0;top:0;width:{w}px;height:{h}px;display:flex;flex-direction:column;justify-content:{anchor};padding:{mt}px {mr}px {mb}px {ml}px;box-sizing:border-box;overflow:visible;{extra}"><div class="inner">{body}</div></div>'

def render_slide(slide, idx):
    out = []; svg = []
    for sh in slide.shapes:
        x, y, w, h = px(sh.left), px(sh.top), px(sh.width), px(sh.height)
        t = sh.shape_type
        if t == MSO_SHAPE_TYPE.PICTURE:
            import base64
            blob = sh.image.blob; mime = sh.image.content_type
            out.append(f'<img src="data:{mime};base64,{base64.b64encode(blob).decode()}" style="position:absolute;left:{x}px;top:{y}px;width:{w}px;height:{h}px;object-fit:cover">')
        elif sh.has_chart if hasattr(sh, "has_chart") else False:
            ch = sh.chart; cats = list(ch.plots[0].categories); sers = [(s.name, list(s.values), "#" + str(s.format.fill.fore_color.rgb)) for s in ch.plots[0].series]
            mx = max(max(v) for _, v, _ in sers) or 1; gw = w / len(cats); bw = gw * .8 / len(sers); parts = []
            for i, c in enumerate(cats):
                for j, (n, vals, col) in enumerate(sers):
                    bh = (h - 60) * vals[i] / mx; bx = i * gw + gw * .1 + j * bw
                    parts.append(f'<rect x="{bx}" y="{h-40-bh}" width="{bw-2}" height="{bh}" fill="{col}"/><text x="{bx+bw/2}" y="{h-44-bh}" font-size="10" text-anchor="middle">{vals[i]:,.0f}</text>')
                parts.append(f'<text x="{i*gw+gw/2}" y="{h-22}" font-size="11" text-anchor="middle">{html.escape(str(c))}</text>')
            leg = "".join(f'<tspan fill="{col}">&#9632; </tspan><tspan>{n}   </tspan>' for n, _, col in sers)
            parts.append(f'<text x="{w/2}" y="{h-4}" font-size="11" text-anchor="middle">{leg}</text>')
            out.append(f'<svg style="position:absolute;left:{x}px;top:{y}px" width="{w}" height="{h}" font-family="Liberation Sans, Arial">{"".join(parts)}</svg>')
        elif sh.has_table if hasattr(sh, "has_table") else False:
            tb = sh.table; rows = []
            for r in tb.rows:
                cells = []
                for c in r.cells:
                    bg = color_of(c.fill) or "#fff"
                    cells.append(f'<td style="background:{bg};padding:2px 6px;border:1px solid #d5deea;vertical-align:middle;overflow:hidden">{"".join(para_html(p, 10) for p in c.text_frame.paragraphs)}</td>')
                rows.append(f'<tr style="height:{px(r.height)}px">{"".join(cells)}</tr>')
            cols = "".join(f'<col style="width:{px(c.width)}px">' for c in tb.columns)
            out.append(f'<table class="tbl" style="position:absolute;left:{x}px;top:{y}px;width:{w}px;border-collapse:collapse;table-layout:fixed">{cols}{"".join(rows)}</table>')
        elif hasattr(sh, "begin_x"):
            col = "#" + str(sh.line.color.rgb) if sh.line.fill.type == 1 else "#5C6B7B"; wd = sh.line.width.pt * 96 / 72 if sh.line.width else 1.5
            ln = sh.line._ln; tail = ln is not None and ln.find("{http://schemas.openxmlformats.org/drawingml/2006/main}tailEnd") is not None
            dash = ln is not None and ln.find("{http://schemas.openxmlformats.org/drawingml/2006/main}prstDash") is not None
            me = 'marker-end="url(#a)"' if tail else ""
            da = 'stroke-dasharray="6 4"' if dash else ""
            svg.append(f'<line x1="{px(sh.begin_x)}" y1="{px(sh.begin_y)}" x2="{px(sh.end_x)}" y2="{px(sh.end_y)}" stroke="{col}" stroke-width="{wd}" {me} {da}/>')
        else:
            fill = None; line = None; lw = 1; rad = 0; shape = ""
            try:
                if sh.fill.type == 1: fill = "#" + str(sh.fill.fore_color.rgb)
            except Exception: pass
            try:
                if sh.line.fill.type == 1: line = "#" + str(sh.line.color.rgb); lw = sh.line.width.pt * 96 / 72
            except Exception: pass
            try:
                ast = sh.auto_shape_type
                if "ROUNDED" in str(ast): rad = min(w, h) * (sh.adjustments[0] if len(sh.adjustments) else .1)
                elif "DIAMOND" in str(ast): shape = "clip-path:polygon(50% 0,100% 50%,50% 100%,0 50%);"
            except Exception: pass
            st = f"position:absolute;left:{x}px;top:{y}px;width:{w}px;height:{h}px;box-sizing:border-box;"
            if fill: st += f"background:{fill};"
            if line: st += f"border:{lw}px solid {line};"
            if rad: st += f"border-radius:{rad}px;"
            st += shape
            inner = tf_html(sh.text_frame, w, h) if sh.has_text_frame and sh.text_frame.text.strip() != "" else ""
            out.append(f'<div class="shp" style="{st}">{inner}</div>')
    sv = f'<svg style="position:absolute;left:0;top:0" width="1280" height="720"><defs><marker id="a" markerWidth="9" markerHeight="9" refX="8" refY="4.5" orient="auto"><path d="M0 0L9 4.5L0 9z" fill="context-stroke" stroke="none"/></marker></defs>{"".join(svg)}</svg>'
    return f'<section class="slide" id="s{idx}">{"".join(out)}{sv}</section>'

def main(src, outdir):
    prs = Presentation(src); os.makedirs(outdir, exist_ok=True)
    body = "".join(render_slide(s, i + 1) for i, s in enumerate(prs.slides))
    doc = f'<!doctype html><meta charset="utf-8"><style>body{{margin:0;background:#888;font-family:Arial,"Liberation Sans",sans-serif}}.slide{{position:relative;width:1280px;height:720px;background:#fff;margin:0 0 20px;overflow:hidden}}.inner{{width:100%}}.tbl td div{{margin:0}}</style>{body}'
    hp = os.path.join(outdir, "deck.html"); open(hp, "w").write(doc)
    import subprocess
    r = subprocess.run(["node", os.path.join(os.path.dirname(__file__), "shoot.js"), os.path.abspath(hp), os.path.abspath(outdir), str(len(prs.slides))], capture_output=True, text=True)
    print(r.stdout, r.stderr[-400:])

if __name__ == "__main__":
    main(sys.argv[1], sys.argv[2])
