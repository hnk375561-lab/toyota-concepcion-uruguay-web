from pathlib import Path
from PIL import Image, ImageEnhance
import json, html, shutil
ROOT=Path(__file__).resolve().parents[1]; OUT=ROOT/'docs'/'grade-contact-sheet'; OUT.mkdir(parents=True,exist_ok=True)
data=json.loads(Path('/tmp/toyota-crawl.json').read_text()); names=[]
for r in next(x for x in data if x['build']=='after' and x['viewport']=='desktop')['requests']:
 if r['type']=='image':
  n=r['url'].split('/')[-1]
  if n not in names: names.append(n)
items=[]
for n in names:
 src=ROOT/'toyota-sharp-assets'/n
 if not src.exists(): continue
 try:
  im=Image.open(src).convert('RGB'); graded=ImageEnhance.Color(ImageEnhance.Contrast(im).enhance(1.06)).enhance(0.97)
  im.thumbnail((300,220),Image.Resampling.LANCZOS); graded.thumbnail((300,220),Image.Resampling.LANCZOS)
  a=OUT/(n.rsplit('.',1)[0]+'-original.jpg'); b=OUT/(n.rsplit('.',1)[0]+'-graded.jpg'); im.save(a,'JPEG',quality=88); graded.save(b,'JPEG',quality=88)
  items.append((n,a.name,b.name))
 except Exception: pass
cards=[]
for n,a,b in items:
 cards.append(f'<article><h3>{html.escape(n)}</h3><div class="pair"><figure><img src="{a}"><figcaption>Original</figcaption></figure><figure><img src="{b}"><figcaption>Grade 1.06 contrast / 0.97 color</figcaption></figure></div></article>')
out=OUT/'index.html'; out.write_text('<!doctype html><meta charset="utf-8"><title>Grade contact sheet</title><style>body{font:14px system-ui;margin:24px;background:#eee;color:#111}h1{margin-bottom:4px}.note{margin-bottom:20px}main{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px}article{background:white;padding:10px;border-radius:8px}h3{font-size:12px;overflow-wrap:anywhere;margin:0 0 8px}.pair{display:grid;grid-template-columns:1fr 1fr;gap:8px}figure{margin:0}img{display:block;width:100%;height:220px;object-fit:contain;background:#ddd}figcaption{font-size:11px;margin-top:4px}@media(max-width:800px){main{grid-template-columns:1fr}}</style><h1>Original vs restrained grade</h1><p class="note">All photos actually requested by the desktop crawl. Grade is contrast 1.06 and color 0.97. This sheet is review evidence only; no graded file was applied to production.</p><main>'+''.join(cards)+'</main>')
print('contact items',len(items),'written',out)
