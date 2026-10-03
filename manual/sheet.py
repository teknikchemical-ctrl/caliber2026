import sys,glob
from PIL import Image
pre=sys.argv[1]; out=sys.argv[2]; cols=int(sys.argv[3]) if len(sys.argv)>3 else 3; W=int(sys.argv[4]) if len(sys.argv)>4 else 640
fs=sorted(glob.glob(f'manual/img/{pre}*.png'))
ims=[]
for f in fs:
    im=Image.open(f).convert('RGB'); r=W/im.size[0]; ims.append(im.resize((W,int(im.size[1]*r))))
rows=[ims[i:i+cols] for i in range(0,len(ims),cols)]
H=sum(max(i.size[1] for i in r) for r in rows)
S=Image.new('RGB',(W*cols,H),'white');y=0
for r in rows:
    for j,im in enumerate(r): S.paste(im,(j*W,y))
    y+=max(i.size[1] for i in r)
S.save(out);print([f.split('/')[-1] for f in fs])
