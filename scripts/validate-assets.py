from pathlib import Path
from PIL import Image
import re,sys
root=Path(__file__).resolve().parents[1]; html=(root/'index.html').read_text()
paths=set(re.findall(r'toyota-sharp-assets/[^"\' )>]+',html)); missing=[]
for x in sorted(paths):
 p=root/x
 if not p.exists(): missing.append(x)
print('static paths',len(paths),'missing',len(missing))
for x in missing: print('MISSING',x)
# Validate every local image source named in markup.
for p in sorted(root.glob('toyota-sharp-assets/*')):
 if p.suffix.lower() in {'.jpg','.jpeg','.webp','.avif'}:
  try:
   im=Image.open(p); assert im.width>0 and im.height>0
  except Exception as e: print('BAD',p,e); sys.exit(1)
if missing: sys.exit(1)
print('all referenced assets exist and decode')
