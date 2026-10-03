"""Consulting-style building blocks for the CALIBER deck: action titles, section tracker, panels, stat tiles, pictograms."""
import re
from lib import *
import lib
from icons import icon

# palette (overrides the first-version colours)
NAVY = "0B2A4A"; BLUE = "1560BD"; TEAL = "0E8A7D"; GREEN = "2E9E5B"; AMBER = "E9A23B"; ORANGE = "E8793A"; RED = "D64545"; PURPLE = "6B4FBB"
INK = "1B2A3A"; GREY = "6B7A8C"; LIGHT = "F2F6FA"; MID = "D5E0EC"; WHITE = "FFFFFF"
TINT = {BLUE: "E6EFFB", TEAL: "E1F3F1", AMBER: "FDF1DC", ORANGE: "FCE9DE", GREEN: "E4F4EA", RED: "FBE6E6", PURPLE: "EEE9FA", NAVY: "E3E9F0", GREY: "EEF1F4"}
SECTIONS = ["Background", "Solution", "Impact", "Roadmap", "Conclusion"]

def pic(s, name, x, y, d, color=BLUE, bg=True):
    s.shapes.add_picture(icon(name, color, bg), Inches(x), Inches(y), Inches(d), Inches(d))

HI = "4FA9CE"   # highlight colour used for key words in titles (as in the reference decks)
SECTIONS = ["Background", "Solution", "Impact", "Roadmap", "Conclusion"]

def frame(s, n, title, sub=None, section=None, source=None, kicker=None):
    """title with highlighted key words ({{word}}), kicker, rule, source line, rounded section tabs and page square"""
    if kicker: text(s, 0.4, 0.12, 8, 0.24, kicker, 10, False, "9AA7B6")
    parts = re.split(r"(\{\{.*?\}\})", title)
    runs = [(p_[2:-2], {"color": HI}) if p_.startswith("{{") else (p_, {}) for p_ in parts if p_]
    text(s, 0.4, 0.34, 11.2, 0.78, [runs], 20, True, NAVY, anchor="m", line=1.0)
    box(s, 0.4, 1.14, 11.2, 0.02, BLUE, None, None, shape=MSO_SHAPE.RECTANGLE)
    text(s, 11.7, 0.38, 1.3, 0.5, ["CALIBER 2026", "Case 1"], 9.5, True, NAVY, "r", line=0.95)
    if sub: text(s, 0.4, 1.17, 12.5, 0.26, sub, 10.5, False, GREY)
    if source: text(s, 0.4, 6.88, 12.5, 0.2, "Source: " + source, 7.5, False, GREY)
    # tabs: active tab filled and slightly larger, others outlined
    x = 0.4
    for t in SECTIONS:
        on = (t == section)
        if on: box(s, x, 7.07, 2.2, 0.38, BLUE, None, [t], 11, True, WHITE, "c", "m", radius=0.16)
        else: box(s, x, 7.12, 2.2, 0.3, WHITE, BLUE, [t], 10, True, NAVY, "c", "m", radius=0.14, lw=0.9)
        x += 2.28
    box(s, 12.5, 7.1, 0.5, 0.34, BLUE, None, [str(n)], 11, True, WHITE, "c", "m", radius=0.04)

def banner(s, x, y, w, label, color=NAVY, h=0.34, size=11.5, align="c"):
    return box(s, x, y, w, h, color, None, [label], size, True, WHITE, align, radius=0.06, margin=0.12)

def panel(s, x, y, w, h, fill=WHITE, line=MID, radius=0.06):
    return box(s, x, y, w, h, fill, line, None, radius=radius)

def stat(s, x, y, w, h, big, label, color=BLUE, icon_name=None, size=22):
    panel(s, x, y, w, h)
    box(s, x, y, 0.07, h, color, None, None, shape=MSO_SHAPE.RECTANGLE)
    if icon_name: pic(s, icon_name, x + w - 0.5, y + 0.08, 0.38, color)
    text(s, x + 0.16, y + 0.08, w - 0.7, 0.5, big, size, True, color)
    text(s, x + 0.16, y + 0.6, w - 0.26, h - 0.62, label, 9, False, INK, line=1.02)

def numdot(s, x, y, n, color=BLUE, d=0.3, size=10):
    return box(s, x, y, d, d, color, None, [str(n)], size, True, WHITE, "c", "m", shape=MSO_SHAPE.OVAL, margin=0)

def pill(s, x, y, w, label, fill=TINT[BLUE], color=BLUE, h=0.24, size=8.5, line=None):
    return box(s, x, y, w, h, fill, line, [label], size, True, color, "c", "m", radius=h / 2, margin=0.03)

def chev(s, x, y, w, h, label, sub, color):
    box(s, x, y, w, h, color, None, None, shape=MSO_SHAPE.PENTAGON)
    text(s, x + 0.15, y + 0.02, w - 0.5, h - 0.04, [[(label, {"bold": True, "size": 14, "color": WHITE}), ("   " + sub, {"size": 10.5, "color": "E8F1FB"})]], 12, True, WHITE, "l", "m")

def section_head(s, x, y, w, n, label, color):
    box(s, x, y, w, 0.3, color, None, [[(f"{n}.  {label.upper()}", {"bold": True, "size": 9.5, "color": WHITE})]], 9.5, True, WHITE, "l", "m", radius=0.1, margin=0.12)

def bullet(s, x, y, w, h, items, size=10, color=BLUE, space=3, mark="■"):
    return text(s, x, y, w, h, [[(mark + "  ", {"color": color, "size": size - 3}), i] if isinstance(i, str) else [(mark + "  ", {"color": color, "size": size - 3})] + i for i in items], size, False, INK, space=space, line=1.04)

def dash_box(s, x, y, w, h, paras, size=10, align="l"):
    b = box(s, x, y, w, h, WHITE, GREY, paras, size, False, INK, align, "m", radius=0.08, lw=0.75, margin=0.1)
    ln = b.line._get_or_add_ln(); d = etree.SubElement(ln, qn("a:prstDash")); d.set("val", "dash")
    return b
