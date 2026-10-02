"""Builds the folder and zip that can be dropped on https://app.netlify.com/drop :
page, installable-app files, the server functions, and the one dependency (@netlify/blobs) already inside node_modules,
so nothing has to be built or installed on Netlify. Run after build.py."""
import os,shutil,zipfile,json
ROOT=os.path.dirname(os.path.dirname(os.path.abspath(__file__)));OUT=os.path.join(ROOT,'netlify-drop')
if os.path.exists(OUT):shutil.rmtree(OUT)
os.makedirs(OUT)
for f in os.listdir(os.path.join(ROOT,'dist')):shutil.copy(os.path.join(ROOT,'dist',f),os.path.join(OUT,f))
shutil.copytree(os.path.join(ROOT,'netlify','functions'),os.path.join(OUT,'netlify','functions'))
bl=os.path.join(ROOT,'node_modules','@netlify','blobs')
if not os.path.isdir(bl):raise SystemExit("run npm install first: @netlify/blobs is missing")
shutil.copytree(bl,os.path.join(OUT,'node_modules','@netlify','blobs'))
for dep in ['@netlify/dev-utils']:
    p=os.path.join(ROOT,'node_modules',*dep.split('/'))
    if os.path.isdir(p):shutil.copytree(p,os.path.join(OUT,'node_modules',*dep.split('/')))
json.dump({"name":"asset-knowledge-platform","private":True,"type":"commonjs","dependencies":{"@netlify/blobs":"^8.1.0"}},open(os.path.join(OUT,'package.json'),'w'),indent=1)
open(os.path.join(OUT,'netlify.toml'),'w').write('''[build]
  publish = "."
  functions = "netlify/functions"

[functions]
  node_bundler = "esbuild"

[[headers]]
  for = "/*"
  [headers.values]
    X-Content-Type-Options = "nosniff"
    Referrer-Policy = "no-referrer"

[[headers]]
  for = "/index.html"
  [headers.values]
    Cache-Control = "no-cache"

[[headers]]
  for = "/api/*"
  [headers.values]
    Cache-Control = "no-store"
''')
z=os.path.join(ROOT,'AKP-netlify-drop.zip')
if os.path.exists(z):os.remove(z)
with zipfile.ZipFile(z,'w',zipfile.ZIP_DEFLATED) as Z:
    for d,_,fs in os.walk(OUT):
        for f in fs:
            fp=os.path.join(d,f);Z.write(fp,os.path.relpath(fp,OUT))
print("packed",os.path.getsize(z)//1024,"KB")
