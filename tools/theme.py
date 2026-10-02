import re
HEXMAP={
# dark backgrounds / panels
'#08140d':'#eaf6ee','#070d16':'#f5f8fc','#1b1406':'#fff7e6','#0d1117':'#f4f6f9','#0d131a':'#f4f6f9','#0a1220':'#eef3fa','#0f151c':'#f4f6f9','#211b0b':'#fff7e6','#0d2016':'#e8f5ec','#0f1f15':'#e8f5ec','#11161d':'#f7f9fc','#221c0e':'#fff7e6','#0c1726':'#eef3fa','#111923':'#f4f6f9','#2a0c0f':'#fdecea','#161b22':'#ffffff','#0f2a18':'#e6f4ea','#2a1012':'#fdecea','#0f1a2b':'#eaf1fb','#2a1214':'#fdecea','#2e2410':'#fff4dc','#171e27':'#f1f4f8','#1b1f24':'#eef1f5','#2a2415':'#fff4dc','#2a1618':'#fdecea','#16202c':'#eef3fa','#18202a':'#f1f4f8','#18212b':'#f1f4f8','#3a2c0b':'#fff4dc','#1a222c':'#f1f4f8','#331618':'#fdecea','#3b2f0e':'#fff4dc','#10233d':'#e8f0fb','#3a1417':'#fdecea','#1f2630':'#f1f4f8','#1f2731':'#e8edf3','#1c2a3d':'#e8f0fb','#1e2b3b':'#e8f0fb','#222c37':'#eef1f5','#232c37':'#eef1f5','#4a1519':'#fbd9d6','#12304f':'#dbe9fb','#26303c':'#e3e8ef','#2a3038':'#e3e8ef','#14304f':'#dbe9fb','#2a303b':'#e3e8ef','#2a3441':'#d8dee6','#2b3440':'#d8dee6','#2b3a4c':'#d0d9e4','#5b1d22':'#f2b8b5','#245a32':'#b7e0c2','#6b5414':'#e8d79a','#27405f':'#c3d3e6','#3a4552':'#c3ccd8','#2d6b3c':'#8fd0a2','#6e5a2a':'#d9c88f','#444c56':'#aeb8c6','#5c5444':'#cfc6b0','#35506d':'#9db3cc','#8a6d1a':'#b8860b','#4a5563':'#aeb8c6','#4b5363':'#aeb8c6','#56606d':'#aab4c2','#8a6d3b':'#b79a63',
# light text used on dark -> dark text
'#e6edf3':'#1c2733','#c9d1d9':'#2f3b4a','#9fb0c3':'#566577','#9fb3c8':'#566577','#9aa7b4':'#5f6b7a','#8b98a5':'#5c6b7b','#7f93a8':'#5c6b7b','#b8c4d0':'#4a5868',
# accents tuned for white backgrounds
'#e3b341':'#9a6700','#56d364':'#1a7f37','#7ee787':'#1a7f37','#ff7b72':'#cf222e','#ff5d55':'#d1242f','#ff9b94':'#cf222e','#ff9b6a':'#c2410c','#f85149':'#cf222e','#3fb950':'#1a7f37','#d29922':'#9a6700','#2f81f7':'#0b5fd7','#58a6ff':'#0969da','#79c0ff':'#0969da','#a371f7':'#7c4dd8','#6fa8ff':'#0969da','#9cc8ff':'#0969da','#f0cf7a':'#b8860b','#c9a0ff':'#8250df','#a6e3b0':'#1a7f37','#cfe3ff':'#1c2733'}
ROOT_OLD=':root{--bg:#0d1117;--panel:#161b22;--panel2:#1f2630;--line:#2b3440;--text:#e6edf3;--muted:#8b98a5;--acc:#2f81f7;--ok:#3fb950;--warn:#d29922;--bad:#f85149;--vio:#a371f7}'
ROOT_NEW=':root{--bg:#f3f5f8;--panel:#ffffff;--panel2:#f1f4f8;--line:#d9e0e8;--text:#1c2733;--muted:#5c6b7b;--acc:#0b5fd7;--ok:#1a7f37;--warn:#9a6700;--bad:#cf222e;--vio:#7c4dd8}'
EMOJI=re.compile('[\U0001F300-\U0001FAFF☀-⛿✀-➿️‍⏩-⏳⬀-⯿]')
KEEP='✓✕→←↔↑↓'   # check, cross, arrows are fine
def strip_emoji(h):
    def f(m):
        c=m.group(0)
        return c if c in KEEP or c in '✔✘' else ''
    h=EMOJI.sub(f,h)
    h=h.replace('✔','✓').replace('✘','✕')
    return h
def remap(h):
    return re.sub(r'#[0-9a-fA-F]{6}\b',lambda m:HEXMAP.get(m.group(0).lower(),m.group(0)),h)
def dashes(h):
    h=h.replace(' — ',', ').replace('—','-').replace('–','-')
    return h
