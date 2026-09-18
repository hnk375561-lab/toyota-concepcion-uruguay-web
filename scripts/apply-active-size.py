from pathlib import Path
import re
p=Path(__file__).resolve().parents[1]/'index.html'; s=p.read_text()
for m in sorted(set(re.findall(r'enhanced-[0-9a-f]+\.webp',s))):
    base=m[:-5]
    candidate=base+'-800.webp'
    if (p.parent/'toyota-sharp-assets'/candidate).exists(): s=s.replace(m,candidate)
p.write_text(s)
print('updated active enhanced image references')
