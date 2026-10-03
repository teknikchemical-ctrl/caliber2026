"""Converts deck/img/*.png to deck/jpg/*.jpg (sidebar cropped) for the deck builder."""
from PIL import Image
import os
os.makedirs('jpg', exist_ok=True)
for f in sorted(os.listdir('img')):
    im = Image.open('img/' + f).convert('RGB'); w, h = im.size
    if f != 'plant.png': im = im.crop((240, 0, w, h))
    im.save("jpg/" + f.replace(".png", ".jpg"), quality=68, optimize=True)
print(len(os.listdir('jpg')))
