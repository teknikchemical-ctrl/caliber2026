"""Small drawing helpers on top of python-pptx for the pitch deck."""
from pptx import Presentation
from pptx.util import Inches, Pt, Emu
from pptx.dml.color import RGBColor
from pptx.enum.shapes import MSO_SHAPE, MSO_CONNECTOR
from pptx.enum.text import PP_ALIGN, MSO_ANCHOR
from pptx.oxml.ns import qn
from lxml import etree
import copy

NAVY="0F2A4A"; BLUE="155EA3"; SKY="EAF1F8"; MID="C9D9EA"; GREEN="1A7F37"; ORANGE="C77700"; RED="CF222E"; GRAY="5C6B7B"; INK="1D2B3D"; WHITE="FFFFFF"; PALE="F6F9FC"; TEAL="0E7490"; PURPLE="6F42C1"
FONT="Arial"

def rgb(h): return RGBColor.from_string(h)

def new_prs():
    p=Presentation(); p.slide_width=Inches(13.333); p.slide_height=Inches(7.5); return p

def blank(prs):
    return prs.slides.add_slide(prs.slide_layouts[6])

def _fmt_run(r,size,bold,color,italic=False):
    r.font.name=FONT; r.font.size=Pt(size); r.font.bold=bold; r.font.italic=italic; r.font.color.rgb=rgb(color)

def text(slide,x,y,w,h,paras,size=12,bold=False,color=INK,align="l",anchor="t",margin=0.04,line=1.08,space=2):
    """paras: str | list of (str | list of runs). run = str | (str,{bold,color,size,italic})"""
    tb=slide.shapes.add_textbox(Inches(x),Inches(y),Inches(w),Inches(h)); tf=tb.text_frame; tf.word_wrap=True
    tf.margin_left=tf.margin_right=Inches(margin); tf.margin_top=tf.margin_bottom=Inches(0.02)
    tf.vertical_anchor={"t":MSO_ANCHOR.TOP,"m":MSO_ANCHOR.MIDDLE,"b":MSO_ANCHOR.BOTTOM}[anchor]
    fill_tf(tf,paras,size,bold,color,align,line,space); return tb

def fill_tf(tf,paras,size,bold,color,align,line=1.08,space=2):
    if isinstance(paras,str): paras=[paras]
    first=True
    for para in paras:
        p=tf.paragraphs[0] if first else tf.add_paragraph(); first=False
        p.alignment={"l":PP_ALIGN.LEFT,"c":PP_ALIGN.CENTER,"r":PP_ALIGN.RIGHT}[align]
        p.line_spacing=line; p.space_after=Pt(space)
        runs=para if isinstance(para,list) else [para]
        for run in runs:
            t,o=(run,{}) if isinstance(run,str) else run
            r=p.add_run(); r.text=t; _fmt_run(r,o.get("size",size),o.get("bold",bold),o.get("color",color),o.get("italic",False))

def box(slide,x,y,w,h,fill=SKY,line=None,paras=None,size=11,bold=False,color=INK,align="c",anchor="m",radius=0.08,lw=1.0,margin=0.06,shape=None,shadow=False):
    shp=slide.shapes.add_shape(shape or MSO_SHAPE.ROUNDED_RECTANGLE,Inches(x),Inches(y),Inches(w),Inches(h))
    if (shape is None) and radius is not None:
        try: shp.adjustments[0]=min(.5,radius/min(w,h))
        except Exception: pass
    if fill is None: shp.fill.background()
    else: shp.fill.solid(); shp.fill.fore_color.rgb=rgb(fill)
    if line is None: shp.line.fill.background()
    else: shp.line.color.rgb=rgb(line); shp.line.width=Pt(lw)
    if not shadow:
        sp=shp._element.spPr; ef=etree.SubElement(sp,qn("a:effectLst"))
    tf=shp.text_frame; tf.word_wrap=True; tf.margin_left=tf.margin_right=Inches(margin); tf.margin_top=tf.margin_bottom=Inches(0.03)
    tf.vertical_anchor={"t":MSO_ANCHOR.TOP,"m":MSO_ANCHOR.MIDDLE,"b":MSO_ANCHOR.BOTTOM}[anchor]
    if paras is not None: fill_tf(tf,paras,size,bold,color,align)
    return shp

def arrow(slide,x1,y1,x2,y2,color=GRAY,w=1.6,head=True,dash=False):
    c=slide.shapes.add_connector(MSO_CONNECTOR.STRAIGHT,Inches(x1),Inches(y1),Inches(x2),Inches(y2))
    c.line.color.rgb=rgb(color); c.line.width=Pt(w)
    ln=c.line._get_or_add_ln()
    if dash:
        d=etree.SubElement(ln,qn("a:prstDash")); d.set("val","dash")
    if head:
        t=etree.SubElement(ln,qn("a:tailEnd")); t.set("type","triangle"); t.set("w","med"); t.set("len","med")
    return c

def elbow(slide,pts,color=GRAY,w=1.6,head=True):
    for i in range(len(pts)-1):
        arrow(slide,pts[i][0],pts[i][1],pts[i+1][0],pts[i+1][1],color,w,head and i==len(pts)-2)

def chip(slide,x,y,w,h,label,fill=SKY,color=BLUE,size=9,bold=True,line=None):
    return box(slide,x,y,w,h,fill,line,[label],size,bold,color,"c","m",radius=h/2,margin=0.04)

def header(slide,n,title,kicker=None,dark=False):
    """slide title band: kicker above, title, thin rule, page number"""
    if kicker: text(slide,0.5,0.28,9,0.28,kicker.upper(),10,True,BLUE)
    text(slide,0.5,0.52,12.3,0.62,title,24,True,NAVY,anchor="t")
    box(slide,0.5,1.16,12.33,0.03,BLUE,None,None,shape=MSO_SHAPE.RECTANGLE)
    text(slide,12.2,7.1,0.7,0.25,str(n),9,False,GRAY,"r")
    text(slide,0.5,7.1,9,0.25,"CALIBER 2026  |  Case 1: Manufacturing Knowledge Hub  |  Asset Knowledge Platform",9,False,GRAY)

def notes(slide,t):
    slide.notes_slide.notes_text_frame.text=t

def table(slide,x,y,w,colw,rows,size=10,header_fill=NAVY,zebra=True,rowh=0.3,bold_first=False,hsize=None):
    nr=len(rows); nc=len(rows[0])
    gs=slide.shapes.add_table(nr,nc,Inches(x),Inches(y),Inches(w),Inches(rowh*nr)); tb=gs.table
    tblPr=gs._element.graphic.graphicData.tbl.tblPr
    tblPr.set("firstRow","0"); tblPr.set("bandRow","0")
    sid=tblPr.find(qn("a:tableStyleId"))
    if sid is not None: sid.text="{2D5ABB26-0587-4C30-8999-92F81FD0307C}"
    tot=sum(colw)
    for i,cw in enumerate(colw): tb.columns[i].width=Inches(w*cw/tot)
    for r in range(nr):
        tb.rows[r].height=Inches(rowh)
        for c in range(nc):
            cell=tb.cell(r,c); v=rows[r][c]
            cell.margin_left=cell.margin_right=Inches(0.06); cell.margin_top=cell.margin_bottom=Inches(0.025)
            cell.vertical_anchor=MSO_ANCHOR.MIDDLE
            tf=cell.text_frame; tf.word_wrap=True
            if r==0:
                cell.fill.solid(); cell.fill.fore_color.rgb=rgb(header_fill)
                fill_tf(tf,[v],hsize or size,True,WHITE,"l",1.0,0)
            else:
                cell.fill.solid(); cell.fill.fore_color.rgb=rgb(PALE if (zebra and r%2==0) else WHITE)
                fill_tf(tf,v if isinstance(v,list) else [v],size,bold_first and c==0,INK,"l",1.0,0)
    return gs

def image(slide,path,x,y,w,h=None,border=True):
    from PIL import Image
    im=Image.open(path); ar=im.size[0]/im.size[1]
    if h is None: h=w/ar
    pic=slide.shapes.add_picture(path,Inches(x),Inches(y),Inches(w),Inches(h))
    if border: pic.line.color.rgb=rgb(MID); pic.line.width=Pt(.75)
    return pic
