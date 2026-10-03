"""Flowchart helpers: cells are sized from their text, so short text gives a short cell."""
from lib2 import *

CW = 0.0072   # inches per character per point (Arial, mixed case)

def tw(t, size, bold=False):
    return len(t) * size * CW * (1.08 if bold else 1.0)

def wrap(t, size, maxw, bold=False):
    out, cur = [], ""
    for w_ in t.split():
        trial = (cur + " " + w_).strip()
        if tw(trial, size, bold) <= maxw or not cur: cur = trial
        else: out.append(cur); cur = w_
    if cur: out.append(cur)
    return out

def measure(title, sub=None, tsize=10.5, ssize=8.8, maxw=1.9, minw=0.9, pad=0.16):
    tl = wrap(title, tsize, maxw, True)
    sl = wrap(sub, ssize, maxw) if sub else []
    w = max([tw(l, tsize, True) for l in tl] + [tw(l, ssize) for l in sl] + [minw - pad]) + pad + 0.04
    h = len(tl) * tsize * 0.0205 + len(sl) * ssize * 0.0200 + (0.04 if sl else 0) + 0.16
    return w, h

def cell(s, x, cy, title, sub=None, color=BLUE, tsize=10.5, ssize=8.8, maxw=1.9, minw=0.9, solid=False, w=None, h=None, shape=None):
    """draw a cell whose left edge is x and vertical centre is cy; returns (x, y, w, h)"""
    mw, mh = measure(title, sub, tsize, ssize, maxw, minw)
    w = w or mw; h = h or mh
    y = cy - h / 2
    paras = [[(title, {"bold": True, "size": tsize, "color": WHITE if solid else NAVY})]]
    if sub: paras += [[(sub, {"size": ssize, "color": "EAF1FA" if solid else INK})]]
    box(s, x, y, w, h, color if solid else TINT.get(color, LIGHT), color, paras, tsize, False, INK, "c", "m", radius=0.08, lw=1.1, margin=0.06, shape=shape)
    return x, y, w, h

def row(s, cy, x0, x1, items, color=BLUE, tsize=10.5, ssize=8.8, maxw=1.9, minw=0.9, solid_last=False, arrows=True, lab=None):
    """lay items [(title, sub)] left to right between x0 and x1, evenly spaced, arrows between; returns boxes"""
    ms = [measure(t, sb, tsize, ssize, maxw, minw) for t, sb in items]
    gap = (x1 - x0 - sum(m[0] for m in ms)) / max(1, len(ms) - 1)
    x = x0; out = []
    for i, ((t, sb), m) in enumerate(zip(items, ms)):
        out.append(cell(s, x, cy, t, sb, color, tsize, ssize, maxw, minw, solid=(solid_last and i == len(items) - 1)))
        x += m[0] + gap
    if arrows:
        for a, b in zip(out[:-1], out[1:]):
            arrow(s, a[0] + a[2] + 0.03, cy, b[0] - 0.03, cy, color, 1.6)
    return out

def tag(s, x, y, w, h, q, label, color):
    box(s, x, y, w, h, color, None, [[(q, {"bold": True, "size": 15, "color": WHITE})], [(label, {"size": 8.8, "color": "F2F6FA"})]], 10, False, WHITE, "c", "m", radius=0.08, margin=0.06)

def diamond(s, cx, cy, w, h, label, color=AMBER, size=9):
    box(s, cx - w / 2, cy - h / 2, w, h, TINT.get(color, LIGHT), color, [label], size, True, NAVY, "c", "m", shape=MSO_SHAPE.DIAMOND, margin=0.02, lw=1.4)

def vline(s, x, y1, y2, color=GREY, w=1.5, head=True, dash=False):
    arrow(s, x, y1, x, y2, color, w, head, dash)
