"""Draws the knowledge network of the case data (relations exported from the running app) as a PNG, in the style of a co-occurrence map."""
import json, math, random, sys
import numpy as np
from PIL import Image, ImageDraw, ImageFont
d = json.load(open(sys.argv[1])); out = sys.argv[2]
random.seed(7); np.random.seed(7)
ids = {}; typ = []
def nid(t, i):
    k = t + ":" + str(i)
    if k not in ids: ids[k] = len(ids); typ.append(t)
    return ids[k]
E = []
for ft, fi, tt, ti, rel in d["rel"]:
    E.append((nid(ft, fi), nid(tt, ti)))
N = len(ids); inv = {v: k for k, v in ids.items()}
assets = [i for i in range(N) if typ[i] == "asset"]
P = np.zeros((N, 2)); fixed = np.zeros(N, bool)
for j, a in enumerate(assets):
    ang = 2 * math.pi * j / len(assets) + .3; P[a] = [math.cos(ang) * 0.62, math.sin(ang) * 0.5]; fixed[a] = True
nb = {i: [] for i in range(N)}
for a, b in E: nb[a].append(b); nb[b].append(a)
for i in range(N):
    if fixed[i]: continue
    hs = [n for n in nb[i] if fixed[n]]
    if hs:
        h = hs[0]; r = 0.07 + 0.24 * math.sqrt(random.random()); an = random.random() * 2 * math.pi
        P[i] = P[h] + [math.cos(an) * r, math.sin(an) * r * .85]
for i in range(N):
    if not fixed[i] and not any(fixed[n] for n in nb[i]):
        ns = [P[n] for n in nb[i] if P[n].any()]; P[i] = (np.mean(ns, 0) if ns else np.zeros(2)) + np.random.randn(2) * .05
for it in range(60):
    D = P[:, None, :] - P[None, :, :]; r2 = (D ** 2).sum(2) + .002
    near = (r2 < 0.012)[..., None]; F = ((D / r2[..., None]) * near).sum(1) * 0.00012
    for a, b in E:
        v = P[b] - P[a]; dist = math.hypot(*v) + 1e-6
        if not fixed[a] and not fixed[b]:
            f = (dist - 0.12) * 0.03 * v / dist; F[a] += f; F[b] -= f
    F[fixed] = 0; P += np.clip(F, -.006, .006)
deg = np.zeros(N)
for a, b in E: deg[a] += 1; deg[b] += 1
W, H = 1400, 1100; S = 2
img = Image.new("RGB", (W * S, H * S), "white"); dr = ImageDraw.Draw(img, "RGBA")
mx = np.abs(P[:, 0]).max(); my = np.abs(P[:, 1]).max()
X = lambda x: (x / mx * 0.47 + 0.5) * W * S; Y = lambda y: (y / my * 0.47 + 0.5) * H * S
COL = {"asset": (21, 96, 189), "document": (46, 158, 91), "work_order": (232, 121, 58), "instrument": (107, 79, 187), "interlock": (214, 69, 69), "component": (14, 138, 125), "opl": (233, 162, 59)}
for a, b in E:
    ca = COL.get(typ[a], (120, 120, 120)); dr.line([X(P[a][0]), Y(P[a][1]), X(P[b][0]), Y(P[b][1])], fill=ca + (70,), width=2)
order = sorted(range(N), key=lambda i: deg[i])
for i in order:
    r = 22 * S if typ[i] == "asset" else (4 + min(10, deg[i] * 0.7)) * S
    c = COL.get(typ[i], (120, 120, 120)); x, y = X(P[i][0]), Y(P[i][1])
    dr.ellipse([x - r, y - r, x + r, y + r], fill=c + (215,), outline=(255, 255, 255, 255), width=S)
try: f = ImageFont.truetype("/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf", 22 * S)
except Exception: f = ImageFont.load_default()
tag = {str(n): t for n, t in d["sets"]}
for i in range(N):
    if typ[i] == "asset":
        k = inv[i].split(":", 1)[1]; lab = tag.get(k, k)
        x, y = X(P[i][0]), Y(P[i][1]); w = dr.textlength(lab, font=f)
        dr.rounded_rectangle([x - w / 2 - 8 * S, y - 16 * S, x + w / 2 + 8 * S, y + 16 * S], 8 * S, fill=(255, 255, 255, 235), outline=COL["asset"] + (255,), width=2)
        dr.text((x - w / 2, y - 12 * S), lab, fill=(11, 42, 74), font=f)
img = img.resize((W, H), Image.LANCZOS); img.save(out, quality=88)
print("nodes", N, "edges", len(E))
