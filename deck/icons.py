"""Draws the flat pictograms used on the slides (white glyph on a coloured disc) with PIL, so the deck needs no icon font or download."""
import os, math
from PIL import Image, ImageDraw

HERE = os.path.dirname(__file__)
CACHE = os.path.join(HERE, "icons"); os.makedirs(CACHE, exist_ok=True)
S = 512  # draw size; downsampled to 256 for crisp edges

def _rgb(h): return tuple(int(h[i:i + 2], 16) for i in (0, 2, 4))

def _glyph(name, d, W):
    c = S // 2
    def rr(x0, y0, x1, y1, r=20, fill=W, width=0, outline=None): d.rounded_rectangle([x0, y0, x1, y1], r, fill=fill, outline=outline, width=width)
    if name == "doc":
        d.polygon([(150, 100), (290, 100), (370, 180), (370, 420), (150, 420)], fill=W)
        d.polygon([(290, 100), (290, 180), (370, 180)], fill=(0, 0, 0, 70))
        for i, y in enumerate((230, 280, 330)): d.rectangle([185, y, 335 - (40 if i == 2 else 0), y + 16], fill=(0, 0, 0, 90))
    elif name == "db":
        for k, y in enumerate((130, 215, 300)):
            d.rectangle([140, y, 372, y + 70], fill=W)
            d.ellipse([140, y - 30, 372, y + 30], fill=W)
            d.ellipse([140, y + 40, 372, y + 100], fill=W)
            d.arc([140, y + 28, 372, y + 90], 0, 180, fill=(0, 0, 0, 80), width=7)
        d.ellipse([150, 112, 362, 160], fill=(0, 0, 0, 40))
    elif name == "gear":
        for a in range(8):
            ang = a * math.pi / 4; cx, cy = c + math.cos(ang) * 150, c + math.sin(ang) * 150
            pts = [(cx + math.cos(ang) * 34 + math.cos(ang + math.pi / 2) * 30, cy + math.sin(ang) * 34 + math.sin(ang + math.pi / 2) * 30), (cx + math.cos(ang) * 34 - math.cos(ang + math.pi / 2) * 30, cy + math.sin(ang) * 34 - math.sin(ang + math.pi / 2) * 30), (cx - math.cos(ang) * 34 - math.cos(ang + math.pi / 2) * 38, cy - math.sin(ang) * 34 - math.sin(ang + math.pi / 2) * 38), (cx - math.cos(ang) * 34 + math.cos(ang + math.pi / 2) * 38, cy - math.sin(ang) * 34 + math.sin(ang + math.pi / 2) * 38)]
            d.polygon(pts, fill=W)
        d.ellipse([c - 128, c - 128, c + 128, c + 128], fill=W); d.ellipse([c - 56, c - 56, c + 56, c + 56], fill=(0, 0, 0, 255))
    elif name == "shield":
        d.polygon([(c, 90), (390, 150), (380, 290), (c, 430), (132, 290), (122, 150)], fill=W)
        d.line([(190, 260), (240, 310), (330, 210)], fill=(0, 0, 0, 255), width=34, joint="curve")
    elif name == "search":
        d.ellipse([110, 110, 330, 330], outline=W, width=38)
        d.line([(305, 305), (410, 410)], fill=W, width=46)
    elif name == "chart":
        for x, h in ((130, 120), (230, 220), (330, 320)): d.rectangle([x, 400 - h, x + 70, 400], fill=W)
    elif name == "bell":
        d.pieslice([140, 110, 372, 340], 180, 360, fill=W); d.rectangle([140, 225, 372, 340], fill=W)
        d.polygon([(110, 360), (402, 360), (372, 320), (140, 320)], fill=W); d.ellipse([226, 360, 286, 420], fill=W)
    elif name == "wrench":
        d.line([(160, 400), (330, 230)], fill=W, width=60)
        d.ellipse([280, 90, 420, 230], fill=W); d.polygon([(330, 100), (420, 100), (400, 190)], fill=(0, 0, 0, 255))
    elif name == "user":
        d.ellipse([196, 100, 316, 220], fill=W); d.pieslice([120, 250, 392, 530], 180, 360, fill=W)
    elif name == "users":
        d.ellipse([110, 120, 220, 230], fill=W); d.pieslice([60, 250, 270, 480], 180, 360, fill=W)
        d.ellipse([290, 100, 410, 220], fill=W); d.pieslice([240, 250, 460, 500], 180, 360, fill=W)
    elif name == "clock":
        d.ellipse([100, 100, 412, 412], outline=W, width=36); d.line([(256, 256), (256, 160)], fill=W, width=30); d.line([(256, 256), (330, 296)], fill=W, width=30)
    elif name == "link":
        d.rounded_rectangle([90, 190, 270, 322], 66, outline=W, width=36); d.rounded_rectangle([242, 190, 422, 322], 66, outline=W, width=36)
    elif name == "check":
        d.line([(120, 270), (215, 365), (400, 160)], fill=W, width=56, joint="curve")
    elif name == "warn":
        d.polygon([(c, 90), (430, 400), (82, 400)], fill=W); d.rectangle([c - 17, 190, c + 17, 320], fill=(0, 0, 0, 255)); d.ellipse([c - 21, 340, c + 21, 382], fill=(0, 0, 0, 255))
    elif name == "ai":
        d.polygon([(c, 70), (c + 46, c - 46), (440, c), (c + 46, c + 46), (c, 442), (c - 46, c + 46), (72, c), (c - 46, c - 46)], fill=W)
        d.polygon([(400, 90), (415, 130), (455, 145), (415, 160), (400, 200), (385, 160), (345, 145), (385, 130)], fill=W)
    elif name == "cloud":
        d.ellipse([90, 220, 230, 360], fill=W); d.ellipse([170, 130, 340, 300], fill=W); d.ellipse([280, 200, 420, 340], fill=W); d.rectangle([160, 260, 350, 360], fill=W)
    elif name == "lock":
        d.rounded_rectangle([130, 220, 382, 420], 30, fill=W); d.arc([180, 100, 332, 280], 180, 360, fill=W, width=36); d.rectangle([180, 190, 216, 240], fill=W); d.rectangle([296, 190, 332, 240], fill=W)
        d.ellipse([236, 290, 276, 330], fill=(0, 0, 0, 255)); d.rectangle([249, 315, 263, 370], fill=(0, 0, 0, 255))
    elif name == "factory":
        d.polygon([(100, 420), (100, 250), (190, 190), (190, 250), (280, 190), (280, 250), (370, 190), (370, 420)], fill=W)
        d.rectangle([380, 110, 430, 420], fill=W)
        for x in (140, 220, 300): d.rectangle([x, 320, x + 36, 370], fill=(0, 0, 0, 255))
    elif name == "book":
        d.polygon([(256, 150), (110, 120), (110, 380), (256, 410)], fill=W); d.polygon([(256, 150), (402, 120), (402, 380), (256, 410)], fill=W)
        d.line([(256, 150), (256, 410)], fill=(0, 0, 0, 255), width=10)
    elif name == "target":
        d.ellipse([90, 90, 422, 422], outline=W, width=32); d.ellipse([170, 170, 342, 342], outline=W, width=32); d.ellipse([228, 228, 284, 284], fill=W)
    elif name == "net":
        pts = [(256, 130), (130, 360), (382, 360), (256, 280)]
        for a in pts[:3]: d.line([a, pts[3]], fill=W, width=22)
        for p in pts[:3]: d.ellipse([p[0] - 48, p[1] - 48, p[0] + 48, p[1] + 48], fill=W)
        d.ellipse([256 - 36, 280 - 36, 256 + 36, 280 + 36], fill=W)
    elif name == "flame":
        d.polygon([(c, 70), (380, 250), (350, 390), (c, 440), (162, 390), (132, 250), (210, 300), (c - 20, 200)], fill=W)
        d.ellipse([216, 320, 296, 400], fill=(0, 0, 0, 255))
    elif name == "calendar":
        d.rounded_rectangle([110, 130, 402, 410], 28, fill=W); d.rectangle([110, 130, 402, 200], fill=W)
        d.rectangle([110, 215, 402, 225], fill=(0, 0, 0, 255))
        for x in (170, 330): d.rounded_rectangle([x - 10, 90, x + 10, 160], 8, fill=W)
        for i in range(6): d.rectangle([140 + (i % 3) * 90, 250 + (i // 3) * 70, 190 + (i % 3) * 90, 290 + (i // 3) * 70], fill=(0, 0, 0, 255))
    elif name == "money":
        d.ellipse([90, 90, 422, 422], fill=W)
        d.text((196, 170), "Rp", fill=(0, 0, 0, 255), font=None)
        d.rectangle([236, 150, 276, 370], fill=(0, 0, 0, 255)); d.rectangle([176, 200, 336, 236], fill=(0, 0, 0, 255)); d.rectangle([176, 290, 336, 326], fill=(0, 0, 0, 255))
    elif name == "refresh":
        d.arc([110, 110, 402, 402], 40, 300, fill=W, width=40); d.polygon([(402, 150), (410, 260), (320, 215)], fill=W)
    elif name == "plug":
        d.rounded_rectangle([170, 200, 342, 330], 30, fill=W); d.rectangle([205, 120, 235, 210], fill=W); d.rectangle([277, 120, 307, 210], fill=W); d.rectangle([236, 330, 276, 420], fill=W)
    elif name == "list":
        for y in (150, 250, 350): d.ellipse([120, y - 18, 156, y + 18], fill=W); d.rounded_rectangle([190, y - 16, 400, y + 16], 14, fill=W)

def icon(name, color="155EA3", bg=True):
    """returns a PNG path for the pictogram `name` on a disc of `color` (hex)"""
    f = os.path.join(CACHE, f"{name}_{color}_{int(bg)}.png")
    if os.path.exists(f): return f
    base = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    if bg: ImageDraw.Draw(base).ellipse([6, 6, S - 6, S - 6], fill=_rgb(color) + (255,))
    g = Image.new("RGBA", (S, S), (0, 0, 0, 0)); gd = ImageDraw.Draw(g)
    W = (255, 255, 255, 255) if bg else _rgb(color) + (255,)
    _glyph(name, gd, W)
    # shrink the glyph into the disc
    sc = 0.62 if bg else 0.9
    n = int(S * sc); g2 = g.resize((n, n), Image.LANCZOS); base.alpha_composite(g2, ((S - n) // 2, (S - n) // 2))
    base = base.resize((256, 256), Image.LANCZOS); base.save(f); return f

if __name__ == "__main__":
    names = "doc db gear shield search chart bell wrench user users clock link check warn ai cloud lock factory book target net flame calendar money refresh plug list".split()
    sheet = Image.new("RGB", (len(names) * 110, 130), "white")
    for i, n in enumerate(names):
        im = Image.open(icon(n, "155EA3")).resize((100, 100)); sheet.paste(im, (i * 110 + 5, 15), im)
    sheet.save("/tmp/icons.png")
