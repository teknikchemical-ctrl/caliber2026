#!/bin/sh
# Rebuilds the screenshots, the deck and the preview images. Needs the built app at knowledge-hub-integrated_BAP5.html.
set -e
cd "$(dirname "$0")/.."
CHROMIUM=${CHROMIUM:-/opt/pw-browsers/chromium} node tools/deck_shots.js
python3 - <<'PY'
from PIL import Image
import os
os.makedirs('deck/jpg',exist_ok=True)
for f in sorted(os.listdir('deck/img')):
    im=Image.open('deck/img/'+f).convert('RGB'); w,h=im.size
    if f!='plant.png': im=im.crop((240,0,w,h))
    im.save('deck/jpg/'+f.replace('.png','.jpg'),quality=82,optimize=True)
PY
python3 deck/make_deck.py
python3 deck/preview.py deck/CALIBER2026_Asset_Knowledge_Platform_Deck.pptx deck/render
node deck/pdf.js deck/CALIBER2026_Asset_Knowledge_Platform_Deck.pdf
